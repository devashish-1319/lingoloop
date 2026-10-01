import { vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

// never talk to the real Stream API in tests
vi.mock("stream-chat", () => {
  const client = {
    upsertUsers: vi.fn().mockResolvedValue({}),
    channel: vi.fn(() => ({ create: vi.fn().mockResolvedValue({}) })),
  };
  return { StreamChat: { getInstance: () => client } };
});

// never call the real Anthropic API either
export const anthropicCreate = vi.fn();
vi.mock("@anthropic-ai/sdk", () => {
  class APIError extends Error {}
  class RateLimitError extends APIError {}
  class Anthropic {
    static APIError = APIError;
    static RateLimitError = RateLimitError;
    beta = { messages: { create: (...args) => anthropicCreate(...args) } };
  }
  return { default: Anthropic };
});

process.env.NODE_ENV = "test";
process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
process.env.JWT_SECRET_KEY = "test-jwt-secret";
process.env.STREAM_API_KEY = "test-key";
process.env.STREAM_API_SECRET = "test-stream-secret";
process.env.MONGO_URI = "mongodb://unused";

let mongod;

export async function setupApp() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const { default: app } = await import("../src/app.js");
  return app;
}

export async function teardownApp() {
  await mongoose.disconnect();
  await mongod?.stop();
}

export async function clearDb() {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
}

// signs a user up and returns a supertest agent that carries their cookie
export async function signupAgent(app, overrides = {}) {
  const agent = request.agent(app);
  const n = Math.random().toString(36).slice(2, 8);
  const body = { fullName: `User ${n}`, email: `${n}@example.com`, password: "secret123", ...overrides };
  const res = await agent.post("/api/auth/signup").send(body);
  return { agent, user: res.body.user, body };
}

export const onboardingBody = (overrides = {}) => ({
  fullName: "Test User",
  bio: "hello",
  nativeLanguage: "english",
  learningLanguage: "spanish",
  location: "Earth",
  ...overrides,
});

export async function makeFriends(a, b) {
  const req = await a.agent.post(`/api/users/friend-request/${b.user._id}`);
  await b.agent.put(`/api/users/friend-request/${req.body._id}/accept`);
}
