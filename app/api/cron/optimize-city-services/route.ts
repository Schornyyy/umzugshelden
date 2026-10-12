import { NextResponse } from "next/server";
import {
  authorizeAdminOwner,
  authorizeCronRequest,
} from "@/lib/adminApiAuth";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import { createDefaultCityServiceTemplate } from "@/lib/cityServiceDefaults";
import { rawCities } from "@/statics/Lists";
import {
  CITY_SERVICE_KEYS,
  type CityServiceKey,
  type CityServicePage,
  type CityServiceTemplate,
} from "@/types/city/CityServicePage";
import { slugify } from "@/utils/slugify";

export const runtime = "nodejs";
export const maxDuration = 30;

const MONTH_IN_MS = 30 * 24 * 60 * 60 * 1_000;
const INTERNAL_API_TIMEOUT_MS = 27_000;
const STATE_COLLECTION = "cityServiceOptimizationStates";

function safeDocumentPart(value: string) {
  return encodeURIComponent(value.trim().toLowerCase());
}

function stateId(ownerId: string, citySlug: string, serviceKey: CityServiceKey) {
  return `${safeDocumentPart(ownerId)}__${citySlug}__${serviceKey}`;
}

function asTimestamp(value: unknown): number {
  if (typeof value === "number") return value;
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }
  return 0;
}

async function optimizeSingleCityService(
  request: Request,
  ownerId: string,
  source: "manual" | "cron",
) {
  try {
    const database = getAdminDatabase();
    const [templateSnapshot, pageSnapshot, stateSnapshot] = await Promise.all([
      database
        .collection("cityServiceTemplates")
        .where("ownerId", "==", ownerId)
        .get(),
      database
        .collection("cityServicePages")
        .where("ownerId", "==", ownerId)
        .get(),
      database
        .collection(STATE_COLLECTION)
        .where("ownerId", "==", ownerId)
        .get(),
    ]);
    const templates = new Map<CityServiceKey, CityServiceTemplate>(
      templateSnapshot.docs.map((document) => {
        const template = {
          id: document.id,
          ...document.data(),
        } as CityServiceTemplate;
        return [template.serviceKey, template];
      }),
    );
    const pages = new Map<string, CityServicePage>(
      pageSnapshot.docs.map((document) => [
        document.id,
        { id: document.id, ...document.data() } as CityServicePage,
      ]),
    );
    const states = new Map(
      stateSnapshot.docs.map((document) => [
        document.id,
        document.data(),
      ]),
    );
    const now = Date.now();
    const candidates = rawCities
      .flatMap((cityName) => {
        const citySlug = slugify(cityName);
        return CITY_SERVICE_KEYS.map((serviceKey) => {
          const id = stateId(ownerId, citySlug, serviceKey);
          const state = states.get(id);
          return {
            id,
            cityName,
            citySlug,
            serviceKey,
            state,
            lastGeneratedAt: asTimestamp(state?.lastGeneratedAt),
          };
        });
      })
      .filter(
        (candidate) =>
          !candidate.state?.pendingProposalId &&
          !candidate.state?.suspendedForTopFive &&
          (!candidate.lastGeneratedAt ||
            now - candidate.lastGeneratedAt >= MONTH_IN_MS),
      )
      .sort(
        (left, right) =>
          Number(Boolean(right.state?.pendingAnalysisId)) -
            Number(Boolean(left.state?.pendingAnalysisId)) ||
          left.lastGeneratedAt - right.lastGeneratedAt,
      );
    const candidate = candidates[0];
    if (!candidate) {
      return NextResponse.json({
        success: true,
        message:
          "Keine Service-Seite ist fällig. Top-5-Seiten und offene Freigaben bleiben pausiert.",
      });
    }

    const template =
      templates.get(candidate.serviceKey) ??
      createDefaultCityServiceTemplate(candidate.serviceKey, ownerId, 0);
    const page = pages.get(candidate.id);
    const currentBlocks =
      page?.inheritTemplate === false && page.blocks?.length
        ? page.blocks
        : template.blocks;
    const currentSeo = { ...template.seo, ...page?.seo };
    const origin = new URL(request.url).origin;
    const publicOrigin =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/u, "") ||
      "https://www.umzugshelden.io";
    const authorization = request.headers.get("authorization")!;
    const keyword =
      `${template.primaryKeyword} ${candidate.cityName}`.trim();
    const stateReference = database
      .collection(STATE_COLLECTION)
      .doc(candidate.id);
    const pendingAnalysisId =
      typeof candidate.state?.pendingAnalysisId === "string"
        ? candidate.state.pendingAnalysisId
        : undefined;
    let analysisId = pendingAnalysisId;
    let targetRank =
      typeof candidate.state?.targetRank === "number"
        ? candidate.state.targetRank
        : undefined;

    if (!analysisId) {
      const analysisResponse = await fetch(`${origin}/api/admin/seo-analysis`, {
        method: "POST",
        headers: {
          authorization,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ownerId,
          citySlug: candidate.citySlug,
          pageKey: `${candidate.citySlug}/${candidate.serviceKey}`,
          targetUrl: `${publicOrigin}/stadt/${encodeURIComponent(candidate.citySlug)}/${candidate.serviceKey}`,
          keyword,
          keywords: currentSeo.keywords,
        }),
        signal: AbortSignal.timeout(INTERNAL_API_TIMEOUT_MS),
      });
      const analysisData = await analysisResponse.json().catch(() => ({}));
      if (!analysisResponse.ok || !analysisData.success) {
        throw new Error(
          analysisData.error ||
            "Die automatische SEO-Analyse ist fehlgeschlagen.",
        );
      }
      analysisId = analysisData.run?.id as string | undefined;
      targetRank = analysisData.run?.targetRank as number | undefined;
      if (!analysisId) {
        throw new Error("Die SEO-Analyse wurde ohne Analyse-ID beendet.");
      }
      if (targetRank && targetRank <= 5) {
        await stateReference.set(
          {
            ownerId,
            citySlug: candidate.citySlug,
            serviceKey: candidate.serviceKey,
            targetRank,
            suspendedForTopFive: true,
            pendingAnalysisId: null,
            lastCheckedAt: now,
            updatedAt: now,
          },
          { merge: true },
        );
        return NextResponse.json({
          success: true,
          suspended: true,
          targetRank,
          pageKey: `${candidate.citySlug}/${candidate.serviceKey}`,
          message: "Top-5-Ranking erkannt; weitere Optimierung wurde ausgesetzt.",
        });
      }
      await stateReference.set(
        {
          ownerId,
          citySlug: candidate.citySlug,
          serviceKey: candidate.serviceKey,
          pendingAnalysisId: analysisId,
          targetRank: targetRank ?? null,
          lastCheckedAt: now,
          updatedAt: now,
        },
        { merge: true },
      );
      return NextResponse.json({
        success: true,
        pending: true,
        stage: "analysis",
        targetRank,
        pageKey: `${candidate.citySlug}/${candidate.serviceKey}`,
        message:
          "Die SEO-Analyse wurde gespeichert. Der nächste Lauf erstellt den Verbesserungsvorschlag.",
      });
    }

    const generationResponse = await fetch(
      `${origin}/api/admin/generate-city-service-page`,
      {
        method: "POST",
        headers: {
          authorization,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ownerId,
          cityName: candidate.cityName,
          citySlug: candidate.citySlug,
          serviceKey: candidate.serviceKey,
          serviceName: template.serviceName,
          primaryKeyword: template.primaryKeyword,
          keywords: currentSeo.keywords,
          currentImage: currentSeo.image,
          currentImageAlt: currentSeo.imageAlt,
          currentBlocks,
          currentSeo,
          analysisId,
          source,
        }),
        signal: AbortSignal.timeout(INTERNAL_API_TIMEOUT_MS),
      },
    );
    const generationData = await generationResponse.json().catch(() => ({}));
    if (!generationResponse.ok || !generationData.success) {
      throw new Error(
        generationData.error ||
          "Der automatische Verbesserungsvorschlag ist fehlgeschlagen.",
      );
    }
    await stateReference.set(
      {
        pendingAnalysisId: null,
        lastCheckedAt: now,
        updatedAt: now,
      },
      { merge: true },
    );
    return NextResponse.json({
      success: true,
      pageKey: `${candidate.citySlug}/${candidate.serviceKey}`,
      proposalId: generationData.proposalId,
      reviewUrl: generationData.reviewUrl,
      targetRank,
      message:
        "Ein neuer Vorschlag wurde gespeichert und wartet auf Freigabe.",
    });
  } catch (error) {
    console.error("Monthly city service optimization failed", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Der Cron-Lauf ist fehlgeschlagen.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json(
      { success: false, error: "Nicht autorisiert" },
      { status: 401 },
    );
  }
  const ownerId = process.env.NEXT_PUBLIC_OWNERID?.trim();
  if (!ownerId) {
    return NextResponse.json(
      { success: false, error: "NEXT_PUBLIC_OWNERID fehlt" },
      { status: 500 },
    );
  }
  return optimizeSingleCityService(request, ownerId, "cron");
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    ownerId?: unknown;
  } | null;
  const ownerId =
    typeof body?.ownerId === "string" ? body.ownerId.trim() : "";
  if (!ownerId) {
    return NextResponse.json(
      { success: false, error: "Owner-ID fehlt" },
      { status: 400 },
    );
  }
  if (!(await authorizeAdminOwner(request, ownerId))) {
    return NextResponse.json(
      { success: false, error: "Nicht autorisiert" },
      { status: 401 },
    );
  }
  return optimizeSingleCityService(request, ownerId, "manual");
}
