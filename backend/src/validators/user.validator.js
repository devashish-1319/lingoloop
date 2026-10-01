import { z } from "zod";

export const recommendedUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(24),
  language: z.string().trim().max(40).optional(), // their native language
  learning: z.string().trim().max(40).optional(), // the language they are learning
  location: z.string().trim().max(100).optional(),
  search: z.string().trim().max(60).optional(), // name
});
