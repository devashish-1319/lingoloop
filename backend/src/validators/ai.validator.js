import { z } from "zod";

export const translateSchema = z.object({
  text: z.string().trim().min(1, "All fields are required").max(2000, "Text is too long"),
  targetLanguage: z.string().trim().min(1).max(40).optional(),
});

export const topicsSchema = z.object({
  friendId: z.string().optional(),
});
