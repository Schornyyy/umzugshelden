import "server-only";

import { revalidatePath } from "next/cache";
import {
  CITY_LANDING_PAGE_COLLECTION,
  CITY_SERVICE_PAGE_COLLECTION,
  cityServicePath,
} from "@/lib/cityPageIds";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import {
  filterGenerationContent,
  rankLinkCandidates,
  type GenerationPage,
} from "@/lib/generationPagePolicy";
import { getGenerationPages } from "@/lib/generationPages";
import {
  applyAuditedLinks,
  auditInternalLinks,
  ensureInternalLinks,
  mapDeepStrings,
  type GeneratedSection,
} from "@/lib/seoGeneratedContent";
import type { CityServiceBlock, CityServiceKey } from "@/types/city/CityServicePage";

const PROPOSAL_COLLECTION = "cityServiceOptimizationProposals";
const MIN_INTERNAL_LINKS = 3;

/* ------------------------------------------------------------------ */
/* Interne Links setzen – wie bei der Blog-Generierung                  */
/* ------------------------------------------------------------------ */

/** Fließtext-Felder eines Blocks, in die Links eingebaut werden dürfen. */
type TextSlot = { blockIndex: number; read: () => string; write: (value: string) => void; heading: string };

function textSlots(blocks: CityServiceBlock[]): TextSlot[] {
  const slots: TextSlot[] = [];
  blocks.forEach((block, blockIndex) => {
    const heading = "heading" in block && typeof block.heading === "string" ? block.heading : "";
    const field = (key: "text" | "intro") => {
      const record = block as unknown as Record<string, unknown>;
      if (typeof record[key] === "string" && record[key]) {
        slots.push({ blockIndex, heading, read: () => String(record[key]), write: (value) => { record[key] = value; } });
      }
    };
    if (block.type === "intro" || block.type === "pricing") field("text");
    if (["cardGrid", "checkList", "process"].includes(block.type)) field("intro");
    if (block.type === "imageText") {
      block.paragraphs.forEach((_, index) => {
        slots.push({
          blockIndex,
          heading,
          read: () => block.paragraphs[index],
          write: (value) => { block.paragraphs[index] = value; },
        });
      });
    }
  });
  return slots;
}

/**
 * Setzt 3–8 interne Links auf echte, veröffentlichte eigene Seiten:
 * KI-Link-Audit mit exakt vorkommenden Ankertexten, regelbasierte Ergänzung
 * und abschließender Filter (alles andere wird zu reinem Text).
 */
export async function linkCityBlocks(input: {
  blocks: CityServiceBlock[];
  cityName: string;
  citySlug: string;
  serviceKey?: CityServiceKey;
  keyword: string;
  availablePages: readonly GenerationPage[];
  timeoutMs: number;
}): Promise<CityServiceBlock[]> {
  const ownUrl = cityServicePath(input.citySlug, input.serviceKey);
  const blocks = filterGenerationContent(structuredClone(input.blocks), input.availablePages);
  const candidates = rankLinkCandidates(
    input.availablePages,
    input.citySlug,
    input.serviceKey ?? "umzugsservice",
    input.keyword,
    ownUrl,
  );
  const slots = textSlots(blocks);
  if (!slots.length || !candidates.length) return blocks;

  let content: { sections: GeneratedSection[] } = {
    sections: slots.map((slot) => ({ type: "text", heading: slot.heading || input.keyword, body: slot.read(), items: [], faqItems: [] })),
  };
  if (input.timeoutMs >= 5_000) {
    try {
      const links = await auditInternalLinks({
        documentLabel: "die lokale Leistungsseite",
        title: `${input.keyword} in ${input.cityName}`,
        keyword: `${input.keyword} ${input.cityName}`,
        sections: content.sections,
        candidates,
        timeoutMs: input.timeoutMs,
        extraRules: `Verlinke bevorzugt die Stadtseite bzw. passende Dienstleistungsseiten für ${input.cityName} sowie thematisch passende Ratgeber.`,
      });
      if (links) content = applyAuditedLinks(content, links, new Set(candidates.map((page) => page.url)));
    } catch (error) {
      console.warn("City link audit failed; using rule-based links", input.citySlug, error);
    }
  }
  content = filterGenerationContent(ensureInternalLinks(content, candidates, MIN_INTERNAL_LINKS), input.availablePages);
  content.sections.forEach((section, index) => slots[index].write(section.body));
  return keepFirstLinkPerTarget(blocks);
}

/** Jede Ziel-URL nur einmal verlinken; weitere Vorkommen werden zu Text. */
export function keepFirstLinkPerTarget<T>(value: T): T {
  const seen = new Set<string>();
  return mapDeepStrings(value, (text) =>
    text.replace(/(\*\*)?\[([^\]\n]+)\]\(([^)\s]+)\)(\*\*)?/gu, (match, open: string | undefined, label: string, target: string, close: string | undefined) => {
      if (!seen.has(target)) {
        seen.add(target);
        return match;
      }
      return open && close ? label : `${open ?? ""}${label}${close ?? ""}`;
    }),
  );
}

/* ------------------------------------------------------------------ */
/* Bestehende Inhalte bereinigen                                        */
/* ------------------------------------------------------------------ */

const LINK_PATTERN = /\]\(([^)\s]+)\)|href=["']([^"']+)["']/g;

export function countLinks(value: unknown) {
  return (JSON.stringify(value ?? null).match(LINK_PATTERN) ?? []).length;
}

export type CityLinkCleanupResult = {
  pagesChanged: number;
  proposalsChanged: number;
  linksRemoved: number;
  examples: string[];
};

/**
 * Entfernt aus allen Stadt-Seiten und offenen Vorschlägen jeden Link, der nicht
 * auf eine veröffentlichte eigene Seite zeigt (z. B. example.com, ihre-domain.de).
 * Der Ankertext bleibt als normaler Text stehen.
 */
export async function cleanCityContentLinks(ownerId: string, options: { dryRun?: boolean } = {}) {
  const database = getAdminDatabase();
  const availablePages = await getGenerationPages();
  const [servicePages, landingPages, proposals] = await Promise.all([
    database.collection(CITY_SERVICE_PAGE_COLLECTION).where("ownerId", "==", ownerId).get(),
    database.collection(CITY_LANDING_PAGE_COLLECTION).where("ownerId", "==", ownerId).get(),
    database.collection(PROPOSAL_COLLECTION).where("ownerId", "==", ownerId).where("status", "==", "pending").get(),
  ]);
  const result: CityLinkCleanupResult = { pagesChanged: 0, proposalsChanged: 0, linksRemoved: 0, examples: [] };
  const writes: Array<{ reference: FirebaseFirestore.DocumentReference; data: Record<string, unknown>; path?: string }> = [];

  const collectExamples = (before: unknown) => {
    for (const match of JSON.stringify(before ?? null).matchAll(LINK_PATTERN)) {
      const target = match[1] ?? match[2];
      if (result.examples.length < 8 && !filterGenerationContent(`[x](${target})`, availablePages).includes("](")) {
        result.examples.push(target);
      }
    }
  };

  for (const document of [...servicePages.docs, ...landingPages.docs]) {
    const blocks = document.get("blocks");
    const seo = document.get("seo");
    const cleanBlocks = filterGenerationContent(blocks ?? null, availablePages);
    const cleanSeo = filterGenerationContent(seo ?? null, availablePages);
    const removed = countLinks(blocks) + countLinks(seo) - countLinks(cleanBlocks) - countLinks(cleanSeo);
    if (!removed) continue;
    collectExamples(blocks);
    result.pagesChanged += 1;
    result.linksRemoved += removed;
    writes.push({
      reference: document.ref,
      data: { ...(blocks ? { blocks: cleanBlocks } : {}), ...(seo ? { seo: cleanSeo } : {}), linksCleanedAt: Date.now() },
      path: cityServicePath(String(document.get("citySlug")), document.get("serviceKey") || undefined),
    });
  }
  for (const document of proposals.docs) {
    const draft = document.get("draft");
    const cleanDraft = filterGenerationContent(draft ?? null, availablePages);
    const removed = countLinks(draft) - countLinks(cleanDraft);
    if (!removed) continue;
    collectExamples(draft);
    result.proposalsChanged += 1;
    result.linksRemoved += removed;
    writes.push({ reference: document.ref, data: { draft: cleanDraft, linksCleanedAt: Date.now() } });
  }

  if (!options.dryRun) {
    for (let offset = 0; offset < writes.length; offset += 400) {
      const batch = database.batch();
      writes.slice(offset, offset + 400).forEach((write) => batch.update(write.reference, write.data));
      await batch.commit();
    }
    // Stadtseiten sind statisch gecacht: alle neu erzeugen lassen
    try {
      revalidatePath("/stadt", "layout");
    } catch (error) {
      console.warn("Revalidierung außerhalb von Next nicht möglich", error);
    }
  }
  return result;
}
