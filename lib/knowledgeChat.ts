import { z } from "zod";
import { knowledgeCategorySchema } from "@/lib/knowledgeSettings";

export const KNOWLEDGE_CHAT_COLLECTION = "knowledge_chats_umzugshelden";

export const knowledgeChatSchema = z.object({
  id: z.string().trim().min(1).max(100),
  ownerId: z.string().trim().min(1).max(200),
  category: knowledgeCategorySchema,
  testMode: z.boolean().default(false),
  title: z.string().trim().min(1).max(150),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
});

export const knowledgeChatMessageSchema = z.object({
  id: z.string().trim().min(1).max(100),
  chatId: z.string().trim().min(1).max(100),
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(120_000),
  createdAt: z.number().int().nonnegative(),
});

export type KnowledgeChat = z.infer<typeof knowledgeChatSchema>;
export type KnowledgeChatMessage = z.infer<
  typeof knowledgeChatMessageSchema
>;
