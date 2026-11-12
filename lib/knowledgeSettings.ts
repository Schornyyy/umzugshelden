import { z } from "zod";

export const KNOWLEDGE_CATEGORIES = [
  "marketing",
  "sales",
  "offering",
  "positioning",
] as const;

export const knowledgeCategorySchema = z.enum(KNOWLEDGE_CATEGORIES);
export type KnowledgeCategory = z.infer<typeof knowledgeCategorySchema>;

export const KNOWLEDGE_CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  marketing: "Marketing",
  sales: "Sales",
  offering: "Offering",
  positioning: "Positionierung",
};

export const knowledgeCreatorSchema = z.object({
  id: z.string().trim().min(1).max(100),
  ownerId: z.string().trim().min(1).max(200),
  name: z.string().trim().min(1).max(150),
  createdAt: z.number().int().nonnegative(),
});

export const knowledgeSourceTypeSchema = z.enum([
  "website",
  "pdf",
  "spotify",
]);
export const knowledgeSourceStatusSchema = z.enum([
  "processing",
  "ready",
  "failed",
]);

export const knowledgeSourceSchema = z.object({
  id: z.string().trim().min(1).max(100),
  ownerId: z.string().trim().min(1).max(200),
  creatorId: z.string().trim().min(1).max(100),
  creatorName: z.string().trim().min(1).max(150),
  category: knowledgeCategorySchema,
  type: knowledgeSourceTypeSchema,
  title: z.string().trim().min(1).max(300),
  sourceUrl: z.string().url().max(2000).optional(),
  contentUrl: z.string().url().max(2000).optional(),
  fileName: z.string().trim().min(1).max(300).optional(),
  status: knowledgeSourceStatusSchema,
  chunkCount: z.number().int().nonnegative(),
  pageCount: z.number().int().positive().optional(),
  error: z.string().trim().max(1000).optional(),
  createdAt: z.number().int().nonnegative(),
  completedAt: z.number().int().nonnegative().optional(),
});

export type KnowledgeCreator = z.infer<typeof knowledgeCreatorSchema>;
export type KnowledgeSource = z.infer<typeof knowledgeSourceSchema>;
export type KnowledgeSourceType = z.infer<typeof knowledgeSourceTypeSchema>;

export const KNOWLEDGE_LIMITS = {
  pdfPages: 500,
  pdfBytes: 100 * 1024 * 1024,
  audioBytes: 200 * 1024 * 1024,
  audioHours: 4,
} as const;
