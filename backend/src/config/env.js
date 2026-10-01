import "dotenv/config";
import { z } from "zod";

// STEAM_* is the old (misspelled) name; keep it as a fallback so existing .env files still work
const raw = {
  ...process.env,
  STREAM_API_KEY: process.env.STREAM_API_KEY || process.env.STEAM_API_KEY,
  STREAM_API_SECRET: process.env.STREAM_API_SECRET || process.env.STEAM_API_SECRET,
};

const schema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(5001),
  MONGO_URI: z.string().min(1),
  JWT_SECRET_KEY: z.string().min(1),
  STREAM_API_KEY: z.string().min(1),
  STREAM_API_SECRET: z.string().min(1),
  // optional: enables translation and conversation-topic suggestions
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  CLIENT_URL: z.string().min(1).default("http://localhost:5173"),
});

const parsed = schema.safeParse(raw);

if (!parsed.success) {
  const problems = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid or missing environment variables:\n${problems}`);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
