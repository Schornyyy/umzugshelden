"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authorizeAdminIdToken } from "@/lib/adminApiAuth";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import {
  SEO_LANDING_CAMPAIGN_COLLECTION,
  SEO_LANDING_PAGE_COLLECTION,
  seoLandingPagePath,
} from "@/lib/seoLandingPages";
import {
  seoLandingCampaignReference,
  serializeSeoLandingCampaign,
} from "@/lib/seoLandingPageServer";
import { cities } from "@/statics/Lists";
import { CITY_SERVICE_KEYS } from "@/types/city/CityServicePage";
import type { SeoLandingCampaign } from "@/types/landingpage/SeoLandingPage";
import { slugify } from "@/utils/slugify";

const authSchema = z.object({
  token: z.string().min(1),
  ownerId: z.string().trim().min(1).max(200),
});

const createSchema = authSchema.extend({
  keyword: z.string().trim().min(3, "Bitte ein Keyword mit mindestens 3 Zeichen eingeben.").max(80),
  serviceKey: z.enum(CITY_SERVICE_KEYS),
});

const campaignSchema = authSchema.extend({
  campaignId: z.string().trim().min(1).max(200),
});

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

async function authorize(input: z.infer<typeof authSchema>) {
  if (!(await authorizeAdminIdToken(input.token, input.ownerId))) {
    throw new Error("Keine Berechtigung.");
  }
}

function failure(error: unknown, fallback: string): { success: false; error: string } {
  if (error instanceof z.ZodError) {
    return { success: false, error: error.issues[0]?.message ?? fallback };
  }
  return { success: false, error: error instanceof Error ? error.message : fallback };
}

async function getOwnedCampaign(input: z.infer<typeof campaignSchema>) {
  const reference = seoLandingCampaignReference(input.campaignId);
  const document = await reference.get();
  if (!document.exists || document.get("ownerId") !== input.ownerId) {
    throw new Error("Kampagne nicht gefunden.");
  }
  return { reference, document };
}

async function pageReferences(campaignId: string) {
  const snapshot = await getAdminDatabase()
    .collection(SEO_LANDING_PAGE_COLLECTION)
    .where("campaignId", "==", campaignId)
    .get();
  return snapshot.docs;
}

async function commitInChunks(
  documents: FirebaseFirestore.QueryDocumentSnapshot[],
  apply: (batch: FirebaseFirestore.WriteBatch, document: FirebaseFirestore.QueryDocumentSnapshot) => void,
) {
  const database = getAdminDatabase();
  for (let offset = 0; offset < documents.length; offset += 400) {
    const batch = database.batch();
    documents.slice(offset, offset + 400).forEach((document) => apply(batch, document));
    await batch.commit();
  }
}

function revalidateCampaignPages(keywordSlug: string, documents: FirebaseFirestore.QueryDocumentSnapshot[]) {
  documents.forEach((document) =>
    revalidatePath(seoLandingPagePath(keywordSlug, String(document.get("citySlug")))),
  );
  revalidatePath("/sitemaps/landingpages/sitemap.xml");
}

export async function createSeoLandingCampaign(
  input: z.infer<typeof createSchema>,
): Promise<ActionResult<SeoLandingCampaign>> {
  try {
    const parsed = createSchema.parse(input);
    await authorize(parsed);
    const keywordSlug = slugify(parsed.keyword);
    if (!keywordSlug) throw new Error("Das Keyword ergibt keine gültige URL.");
    const now = Date.now();
    const data = {
      ownerId: parsed.ownerId,
      keyword: parsed.keyword,
      keywordSlug,
      serviceKey: parsed.serviceKey,
      stage: "research",
      published: false,
      cities,
      pendingCities: cities,
      cityCount: cities.length,
      completedCities: 0,
      warnings: [],
      retryCount: 0,
      failureCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await seoLandingCampaignReference(keywordSlug).create(data);
    } catch {
      throw new Error(`Für das Keyword „${parsed.keyword}“ existiert bereits eine Kampagne.`);
    }
    return { success: true, data: serializeSeoLandingCampaign(keywordSlug, data) };
  } catch (error) {
    return failure(error, "Kampagne konnte nicht angelegt werden.");
  }
}

export async function listSeoLandingCampaigns(
  input: z.infer<typeof authSchema>,
): Promise<ActionResult<SeoLandingCampaign[]>> {
  try {
    const parsed = authSchema.parse(input);
    await authorize(parsed);
    const snapshot = await getAdminDatabase()
      .collection(SEO_LANDING_CAMPAIGN_COLLECTION)
      .where("ownerId", "==", parsed.ownerId)
      .get();
    const campaigns = snapshot.docs
      .map((document) => serializeSeoLandingCampaign(document.id, document.data()))
      .sort((left, right) => right.createdAt - left.createdAt);
    return { success: true, data: campaigns };
  } catch (error) {
    return failure(error, "Kampagnen konnten nicht geladen werden.");
  }
}

export async function setSeoLandingCampaignPublished(
  input: z.infer<typeof campaignSchema> & { published: boolean },
): Promise<ActionResult> {
  try {
    const parsed = campaignSchema.extend({ published: z.boolean() }).parse(input);
    await authorize(parsed);
    const { reference, document } = await getOwnedCampaign(parsed);
    const pages = await pageReferences(parsed.campaignId);
    await commitInChunks(pages, (batch, page) =>
      batch.update(page.ref, { published: parsed.published, updatedAt: Date.now() }),
    );
    await reference.update({ published: parsed.published, updatedAt: Date.now() });
    revalidateCampaignPages(String(document.get("keywordSlug")), pages);
    return { success: true, data: undefined };
  } catch (error) {
    return failure(error, "Veröffentlichung konnte nicht geändert werden.");
  }
}

export async function resumeSeoLandingCampaign(
  input: z.infer<typeof campaignSchema>,
): Promise<ActionResult> {
  try {
    const parsed = campaignSchema.parse(input);
    await authorize(parsed);
    const { reference, document } = await getOwnedCampaign(parsed);
    if (document.get("stage") !== "failed") return { success: true, data: undefined };
    await reference.update({
      stage: document.get("failedStage") || "research",
      failureCount: 0,
      retryCount: 0,
      lastError: null,
      lockedUntil: 0,
      updatedAt: Date.now(),
    });
    return { success: true, data: undefined };
  } catch (error) {
    return failure(error, "Kampagne konnte nicht fortgesetzt werden.");
  }
}

export async function deleteSeoLandingCampaign(
  input: z.infer<typeof campaignSchema>,
): Promise<ActionResult> {
  try {
    const parsed = campaignSchema.parse(input);
    await authorize(parsed);
    const { reference, document } = await getOwnedCampaign(parsed);
    const pages = await pageReferences(parsed.campaignId);
    await commitInChunks(pages, (batch, page) => batch.delete(page.ref));
    await reference.delete();
    revalidateCampaignPages(String(document.get("keywordSlug")), pages);
    return { success: true, data: undefined };
  } catch (error) {
    return failure(error, "Kampagne konnte nicht gelöscht werden.");
  }
}
