import { z } from "zod";

export const companyKnowledgeJobStatusSchema = z.enum([
  "pending",
  "processing",
  "ready",
  "failed",
]);

export const companyKnowledgeJobSchema = z.object({
  id: z.string().trim().min(1).max(100),
  ownerId: z.string().trim().min(1).max(200),
  status: companyKnowledgeJobStatusSchema,
  stage: z.string().trim().min(1).max(200),
  sourceCount: z.number().int().nonnegative(),
  chunkCount: z.number().int().nonnegative(),
  error: z.string().trim().max(1000).optional(),
  createdAt: z.number().int().nonnegative(),
  startedAt: z.number().int().nonnegative().optional(),
  completedAt: z.number().int().nonnegative().optional(),
});

export type CompanyKnowledgeJob = z.infer<typeof companyKnowledgeJobSchema>;
