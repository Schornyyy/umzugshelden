import "server-only";

import { createHash } from "node:crypto";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import { createOverlappingTextChunks } from "@/lib/blogResearchText";
import {
  defaultOfferPricingSettings,
  normalizeOfferPricingSettings,
} from "@/lib/offerPricingSettings";
import { defaultMaterialCatalog } from "@/app/(loggedin)/admin/[userid]/offer/materialCatalog";
import {
  deleteVectorRecordsByFilter,
  upsertVectorRecords,
  type VectorRecord,
} from "@/lib/vectorIndex";

export const COMPANY_KNOWLEDGE_JOB_COLLECTION =
  "company_knowledge_jobs_umzugshelden";

type KnowledgeDocument = {
  dataset: string;
  sourceId: string;
  title: string;
  value: unknown;
};

const SKIPPED_KEYS = new Set([
  "id",
  "ownerId",
  "createdAt",
  "updatedAt",
  "style",
  "image",
  "imageUrl",
  "thumbnailUrl",
  "backgroundImage",
  "storagePath",
  "token",
  "password",
  "privateKey",
]);

function readableKey(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
}

function draftText(value: string): string | null {
  if (!value.trim().startsWith("{")) return null;
  try {
    const parsed = JSON.parse(value) as {
      blocks?: Array<{ text?: unknown }>;
    };
    if (!Array.isArray(parsed.blocks)) return null;
    return parsed.blocks
      .map((block) => (typeof block.text === "string" ? block.text.trim() : ""))
      .filter(Boolean)
      .join("\n");
  } catch {
    return null;
  }
}

function flattenValue(
  value: unknown,
  path = "",
  depth = 0,
): string[] {
  if (depth > 12 || value === null || value === undefined) return [];
  if (typeof value === "string") {
    const text = draftText(value) ?? value.trim();
    return text ? [`${path ? `${readableKey(path)}: ` : ""}${text}`] : [];
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return [`${path ? `${readableKey(path)}: ` : ""}${String(value)}`];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry) => flattenValue(entry, path, depth + 1));
  }
  if (typeof value !== "object") return [];
  if (
    "toMillis" in value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    return [];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, nested]) => {
      if (
        SKIPPED_KEYS.has(key) ||
        /(?:secret|credential|api.?key|signature|iban|bic)/i.test(key) ||
        /(?:image|thumbnail|background|color|font|url)$/i.test(key)
      ) {
        return [];
      }
      return flattenValue(nested, path ? `${path}.${key}` : key, depth + 1);
    },
  );
}

function documentText(document: KnowledgeDocument) {
  const body = flattenValue(document.value).join("\n").trim();
  if (!body) return "";
  return [
    `Datenbereich: ${document.dataset}`,
    `Quelle: ${document.title}`,
    body,
  ].join("\n");
}

function vectorId(document: KnowledgeDocument, chunkIndex: number) {
  return `company_${createHash("sha256")
    .update(`${document.dataset}:${document.sourceId}:${chunkIndex}`)
    .digest("hex")
    .slice(0, 40)}`;
}

async function ownerDocuments(collection: string, ownerId: string) {
  return getAdminDatabase()
    .collection(collection)
    .where("ownerId", "==", ownerId)
    .get();
}

async function collectCompanyKnowledge(ownerId: string) {
  const database = getAdminDatabase();
  const [
    account,
    blogs,
    cityServiceTemplates,
    cityServicePages,
    cityLandingTemplates,
    cityLandingPages,
    landingPages,
    reviews,
    pricing,
  ] = await Promise.all([
    database.collection("users_umzugshelden").doc(ownerId).get(),
    database.collection("blogPages_umzugshelden").get(),
    ownerDocuments("cityServiceTemplates", ownerId),
    ownerDocuments("cityServicePages", ownerId),
    ownerDocuments("cityLandingTemplates", ownerId),
    ownerDocuments("cityLandingPages", ownerId),
    ownerDocuments("landing_pages_umzugshelden", ownerId),
    database
      .collection("page_builder_elements_umzugshelden")
      .doc("reviews")
      .get(),
    database.collection("offer_calculators_umzugshelden").doc(ownerId).get(),
  ]);

  const documents: KnowledgeDocument[] = [];
  if (account.exists) {
    const data = account.data() ?? {};
    const safeProfile = Object.fromEntries(
      [
        "companyName",
        "company",
        "name",
        "description",
        "email",
        "phone",
        "street",
        "postalCode",
        "city",
        "website",
        "services",
        "openingHours",
      ]
        .filter((key) => data[key] !== undefined)
        .map((key) => [key, data[key]]),
    );
    if (Object.keys(safeProfile).length) {
      documents.push({
        dataset: "Firmenprofil",
        sourceId: ownerId,
        title: "Firmenprofil",
        value: safeProfile,
      });
    }
  }

  blogs.docs.forEach((snapshot) => {
    const data = snapshot.data();
    if (
      data.visible !== true ||
      (typeof data.ownerId === "string" && data.ownerId !== ownerId)
    ) {
      return;
    }
    documents.push({
      dataset: "Blog",
      sourceId: snapshot.id,
      title: String(data.titel || data.title || snapshot.id),
      value: data,
    });
  });
  for (const [dataset, snapshot, publishedOnly] of [
    ["Leistungsvorlagen", cityServiceTemplates, false],
    ["Stadt-Leistungsseiten", cityServicePages, true],
    ["Stadtseiten-Vorlagen", cityLandingTemplates, false],
    ["Stadtseiten", cityLandingPages, true],
    ["Landingpages", landingPages, false],
  ] as const) {
    snapshot.docs.forEach((document) => {
      const data = document.data();
      if (publishedOnly && data.published === false) return;
      documents.push({
        dataset,
        sourceId: document.id,
        title: String(
          data.title ||
            data.cityName ||
            data.serviceName ||
            data.serviceKey ||
            document.id,
        ),
        value: data,
      });
    });
  }
  if (reviews.exists) {
    documents.push({
      dataset: "Bewertungen",
      sourceId: reviews.id,
      title: "Kundenbewertungen",
      value: reviews.data(),
    });
  }

  const pricingData = pricing.data() ?? {};
  documents.push({
    dataset: "Kalkulationskonfiguration",
    sourceId: "pricing-settings",
    title: "Preis- und Kalkulationseinstellungen",
    value: normalizeOfferPricingSettings(
      pricingData.pricingSettings ?? defaultOfferPricingSettings,
    ),
  });
  documents.push({
    dataset: "Materialpreise",
    sourceId: "material-catalog",
    title: "Material-Preisliste",
    value: pricingData.materialCatalog ?? defaultMaterialCatalog,
  });
  return documents;
}

function knowledgeTarget() {
  return {
    indexName:
      process.env.PINECONE_INDEX_NAME?.trim() || "blog-knowledge",
    namespace:
      process.env.PINECONE_KNOWLEDGE_NAMESPACE?.trim() || "knowledge-base",
  };
}

export async function processCompanyKnowledgeJob(
  jobId: string,
  ownerId: string,
) {
  const database = getAdminDatabase();
  const job = database
    .collection(COMPANY_KNOWLEDGE_JOB_COLLECTION)
    .doc(jobId);
  try {
    await job.update({
      status: "processing",
      stage: "Firmendaten werden gelesen",
      startedAt: Date.now(),
    });
    const documents = await collectCompanyKnowledge(ownerId);
    const target = knowledgeTarget();
    await job.update({
      stage: "Bisherige Firmenvektoren werden ersetzt",
      sourceCount: documents.length,
    });
    await deleteVectorRecordsByFilter(
      target.indexName,
      target.namespace,
      {
        knowledge_scope: { $eq: "company" },
        owner_id: { $eq: ownerId },
      },
    );

    const records: VectorRecord[] = [];
    documents.forEach((document) => {
      const text = documentText(document);
      createOverlappingTextChunks(text, 1_200, 150).forEach(
        (chunk, chunkIndex) => {
          records.push({
            id: vectorId(document, chunkIndex),
            text: chunk,
            metadata: {
              knowledge_scope: "company",
              owner_id: ownerId,
              dataset: document.dataset,
              source_id: document.sourceId,
              source_title: document.title,
              chunk_index: chunkIndex,
            },
          });
        },
      );
    });
    if (!records.length) {
      throw new Error("Es wurden keine vektorisierbaren Firmendaten gefunden.");
    }
    await job.update({
      stage: "Embeddings werden erstellt und in Pinecone gespeichert",
      chunkCount: records.length,
    });
    await upsertVectorRecords(records, target.indexName, target.namespace);
    await job.update({
      status: "ready",
      stage: "Firmenwissen ist aktuell",
      sourceCount: documents.length,
      chunkCount: records.length,
      completedAt: Date.now(),
    });
  } catch (error) {
    console.error("Firmenwissen konnte nicht verarbeitet werden:", error);
    await job.update({
      status: "failed",
      stage: "Verarbeitung fehlgeschlagen",
      error:
        error instanceof Error
          ? error.message.slice(0, 1000)
          : "Firmenwissen konnte nicht verarbeitet werden.",
      completedAt: Date.now(),
    });
  }
}
