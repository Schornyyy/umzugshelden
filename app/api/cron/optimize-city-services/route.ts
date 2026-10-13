import { NextResponse } from "next/server";
import { authorizeAdminOwner } from "@/lib/adminApiAuth";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import { createDefaultCityServiceTemplate } from "@/lib/cityServiceDefaults";
import { POST as runSeoAnalysis } from "@/app/api/admin/seo-analysis/route";
import { POST as runCityServiceGeneration } from "@/app/api/admin/generate-city-service-page/route";
import { rawCities } from "@/statics/Lists";
import {
  CITY_SERVICE_KEYS,
  type CityServiceKey,
  type CityServicePage,
  type CityServiceTemplate,
} from "@/types/city/CityServicePage";
import { slugify } from "@/utils/slugify";

export const runtime = "nodejs";
export const maxDuration = 60;

const MONTH_IN_MS = 30 * 24 * 60 * 60 * 1_000;
const ANALYSIS_RETRY_DELAY_MS = 4 * 60 * 1_000;
const STATE_COLLECTION = "cityServiceOptimizationStates";

type InternalApiResult = {
  data: Record<string, unknown>;
  errorMessage?: string;
};

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

function messageFromUnknown(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  for (const key of ["message", "error", "detail", "code"]) {
    const message = messageFromUnknown(record[key]);
    if (message) return message;
  }
  return undefined;
}

async function readInternalApiResponse(
  response: Response,
  operation: string,
): Promise<InternalApiResult> {
  const body = await response.text();
  let data: Record<string, unknown> = {};
  if (body) {
    try {
      const parsed = JSON.parse(body) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        data = parsed as Record<string, unknown>;
      }
    } catch {
      if (!response.ok) {
        return {
          data,
          errorMessage: `${operation} antwortete mit HTTP ${response.status}: ${body.slice(0, 300)}`,
        };
      }
    }
  }
  if (response.ok && data.success === true) return { data };

  const upstreamMessage =
    messageFromUnknown(data.error) ||
    messageFromUnknown(data.message) ||
    messageFromUnknown(data);
  const requestId =
    response.headers.get("x-vercel-id") ||
    response.headers.get("x-vercel-trace");
  return {
    data,
    errorMessage: [
      `${operation} ist mit HTTP ${response.status} fehlgeschlagen`,
      upstreamMessage,
      requestId ? `Vercel-ID: ${requestId}` : undefined,
    ]
      .filter(Boolean)
      .join(": "),
  };
}

async function optimizeSingleCityService(
  request: Request,
  ownerId: string,
  source: "manual" | "cron",
  requestedPageKey?: string,
) {
  let failureContext:
    | {
        reference: FirebaseFirestore.DocumentReference;
        retryCount: number;
        pageKey: string;
      }
    | undefined;
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
            pageKey: `${citySlug}/${serviceKey}`,
            cityName,
            citySlug,
            serviceKey,
            state,
            lastGeneratedAt: asTimestamp(state?.lastGeneratedAt),
            nextAnalysisRetryAt: asTimestamp(state?.nextAnalysisRetryAt),
          };
        });
      })
      .filter(
        (candidate) =>
          (!requestedPageKey || candidate.pageKey === requestedPageKey) &&
          !candidate.state?.pendingProposalId &&
          !candidate.state?.suspendedForTopFive &&
          (source === "manual" && candidate.pageKey === requestedPageKey
            ? true
            : candidate.nextAnalysisRetryAt <= now) &&
          (!candidate.lastGeneratedAt ||
            now - candidate.lastGeneratedAt >= MONTH_IN_MS),
      )
      .sort(
        (left, right) =>
          asTimestamp(right.state?.manualPriorityAt) -
            asTimestamp(left.state?.manualPriorityAt) ||
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
    const stateReference = database
      .collection(STATE_COLLECTION)
      .doc(candidate.id);
    failureContext = {
      reference: stateReference,
      retryCount:
        typeof candidate.state?.failureRetryCount === "number"
          ? candidate.state.failureRetryCount
          : 0,
      pageKey: `${candidate.citySlug}/${candidate.serviceKey}`,
    };

    const template =
      templates.get(candidate.serviceKey) ??
      createDefaultCityServiceTemplate(candidate.serviceKey, ownerId, 0);
    const page = pages.get(candidate.id);
    const currentBlocks =
      page?.inheritTemplate === false && page.blocks?.length
        ? page.blocks
        : template.blocks;
    const currentSeo = { ...template.seo, ...page?.seo };
    const publicOrigin =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/u, "") ||
      "https://www.umzugshelden.io";
    const authorization =
      source === "cron"
        ? `Bearer ${process.env.CRON_SECRET?.trim() || ""}`
        : request.headers.get("authorization") || "";
    const keyword =
      `${template.primaryKeyword} ${candidate.cityName}`.trim();
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
      const analysisResponse = await runSeoAnalysis(
        new Request(`${publicOrigin}/api/admin/seo-analysis`, {
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
        }),
      );
      const analysisResult = await readInternalApiResponse(
        analysisResponse,
        "Die automatische SEO-Analyse",
      );
      if (analysisResult.errorMessage) {
        if (
          analysisResponse.status === 503 &&
          analysisResult.data.retryable === true
        ) {
          const retryCount =
            typeof candidate.state?.analysisRetryCount === "number"
              ? candidate.state.analysisRetryCount + 1
              : 1;
          await stateReference.set(
            {
              ownerId,
              citySlug: candidate.citySlug,
              serviceKey: candidate.serviceKey,
              analysisRetryCount: retryCount,
              lastAnalysisRetryAt: Date.now(),
              nextAnalysisRetryAt: Date.now() + ANALYSIS_RETRY_DELAY_MS,
              updatedAt: Date.now(),
            },
            { merge: true },
          );
          return NextResponse.json({
            success: true,
            pending: true,
            stage: "analysis-retry",
            retryCount,
            pageKey: `${candidate.citySlug}/${candidate.serviceKey}`,
          });
        }
        throw new Error(analysisResult.errorMessage);
      }
      const analysisData = analysisResult.data;
      const run =
        analysisData.run &&
        typeof analysisData.run === "object" &&
        !Array.isArray(analysisData.run)
          ? (analysisData.run as Record<string, unknown>)
          : undefined;
      analysisId = typeof run?.id === "string" ? run.id : undefined;
      targetRank =
        typeof run?.targetRank === "number" ? run.targetRank : undefined;
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
            manualPriorityAt: null,
            nextAnalysisRetryAt: null,
            lastCheckedAt: now,
            updatedAt: now,
            failureRetryCount: 0,
            lastError: null,
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
          analysisRetryCount: 0,
          nextAnalysisRetryAt: null,
          targetRank: targetRank ?? null,
          lastCheckedAt: now,
          updatedAt: now,
          failureRetryCount: 0,
          lastError: null,
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

    const generationResponse = await runCityServiceGeneration(
      new Request(`${publicOrigin}/api/admin/generate-city-service-page`, {
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
      }),
    );
    const generationResult = await readInternalApiResponse(
      generationResponse,
      "Der automatische Verbesserungsvorschlag",
    );
    if (generationResult.errorMessage) {
      if (
        generationResponse.status === 503 &&
        generationResult.data.retryable === true
      ) {
        const retryCount =
          typeof candidate.state?.generationRetryCount === "number"
            ? candidate.state.generationRetryCount + 1
            : 1;
        await stateReference.set(
          {
            generationRetryCount: retryCount,
            lastGenerationRetryAt: Date.now(),
            nextAnalysisRetryAt: Date.now() + ANALYSIS_RETRY_DELAY_MS,
            updatedAt: Date.now(),
          },
          { merge: true },
        );
        return NextResponse.json({
          success: true,
          pending: true,
          stage: "generation-retry",
          retryCount,
          pageKey: `${candidate.citySlug}/${candidate.serviceKey}`,
        });
      }
      throw new Error(generationResult.errorMessage);
    }
    const generationData = generationResult.data;
    if (generationData.pending === true) {
      return NextResponse.json({
        success: true,
        pending: true,
        stage:
          typeof generationData.stage === "string"
            ? generationData.stage
            : "generation",
        pageKey: `${candidate.citySlug}/${candidate.serviceKey}`,
        sectionOrder: generationData.sectionOrder,
        completedSections: generationData.completedSections,
        totalSections: generationData.totalSections,
        qualityScore: generationData.qualityScore,
        message:
          "Die persistente SEO-Pipeline wurde gespeichert und wird im nächsten Schritt fortgesetzt.",
      });
    }
    const generationWarning =
      typeof generationData.warning === "string"
        ? generationData.warning
        : undefined;
    await stateReference.set(
      {
        pendingAnalysisId: null,
        generationRetryCount: 0,
        manualPriorityAt: null,
        nextAnalysisRetryAt: null,
        lastCheckedAt: now,
        updatedAt: now,
      },
      { merge: true },
    );
    return NextResponse.json({
      success: true,
      pageKey: `${candidate.citySlug}/${candidate.serviceKey}`,
      proposalId:
        typeof generationData.proposalId === "string"
          ? generationData.proposalId
          : undefined,
      reviewUrl:
        typeof generationData.reviewUrl === "string"
          ? generationData.reviewUrl
          : undefined,
      targetRank,
      message:
        generationWarning ??
        "Ein neuer Vorschlag wurde gespeichert und wartet auf Freigabe.",
    });
  } catch (error) {
    console.error("Monthly city service optimization failed", error);
    if (failureContext) {
      const retryCount = failureContext.retryCount + 1;
      const retryDelay = Math.min(
        24 * 60 * 60 * 1_000,
        5 * 60 * 1_000 * 2 ** Math.min(retryCount - 1, 8),
      );
      const errorMessage =
        error instanceof Error ? error.message : "Unbekannter Cron-Fehler";
      await failureContext.reference.set(
        {
          failureRetryCount: retryCount,
          lastError: errorMessage.slice(0, 1_000),
          lastFailureAt: Date.now(),
          nextAnalysisRetryAt: Date.now() + retryDelay,
          updatedAt: Date.now(),
        },
        { merge: true },
      );
      return NextResponse.json({
        success: true,
        pending: true,
        stage: "error-retry",
        retryCount,
        pageKey: failureContext.pageKey,
        retryAt: new Date(Date.now() + retryDelay).toISOString(),
      });
    }
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
    count?: unknown;
    mode?: unknown;
    pageKey?: unknown;
  } | null;
  const ownerId =
    typeof body?.ownerId === "string" ? body.ownerId.trim() : "";
  const count =
    typeof body?.count === "number" && Number.isInteger(body.count)
      ? Math.min(50, Math.max(1, body.count))
      : 1;
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
  if (body?.mode === "run-now") {
    const requestedPageKey =
      typeof body.pageKey === "string" ? body.pageKey.trim() : undefined;
    return optimizeSingleCityService(
      request,
      ownerId,
      "manual",
      requestedPageKey,
    );
  }
  const database = getAdminDatabase();
  const stateSnapshot = await database
    .collection(STATE_COLLECTION)
    .where("ownerId", "==", ownerId)
    .get();
  const states = new Map(
    stateSnapshot.docs.map((document) => [document.id, document.data()]),
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
        !candidate.state?.manualPriorityAt &&
        (!candidate.lastGeneratedAt ||
          now - candidate.lastGeneratedAt >= MONTH_IN_MS),
    )
    .sort(
      (left, right) =>
        Number(Boolean(right.state?.pendingAnalysisId)) -
          Number(Boolean(left.state?.pendingAnalysisId)) ||
        left.lastGeneratedAt - right.lastGeneratedAt,
    )
    .slice(0, count);

  if (!candidates.length) {
    return NextResponse.json({
      success: true,
      queued: 0,
      message:
        "Keine weitere Service-Seite ist fällig. Offene Freigaben und Top-5-Seiten bleiben pausiert.",
    });
  }

  const batch = database.batch();
  candidates.forEach((candidate) => {
    batch.set(
      database.collection(STATE_COLLECTION).doc(candidate.id),
      {
        ownerId,
        citySlug: candidate.citySlug,
        serviceKey: candidate.serviceKey,
        manualPriorityAt: now,
        updatedAt: now,
      },
      { merge: true },
    );
  });
  await batch.commit();

  return NextResponse.json({
    success: true,
    queued: candidates.length,
    pageKeys: candidates.map(
      (candidate) => `${candidate.citySlug}/${candidate.serviceKey}`,
    ),
    message: `${candidates.length} ${
      candidates.length === 1 ? "Seite wurde" : "Seiten wurden"
    } dauerhaft zur Optimierung eingeplant.`,
  });
}
