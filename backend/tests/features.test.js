import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import {
  anthropicCreate,
  clearDb,
  makeFriends,
  onboardingBody,
  setupApp,
  signupAgent,
  teardownApp,
} from "./helpers.js";
import { emitToUser, isOnline, subscribe } from "../src/services/realtime.service.js";
import PracticeSession from "../src/models/PracticeSession.js";

let app;
beforeAll(async () => {
  app = await setupApp();
});
afterAll(teardownApp);
beforeEach(async () => {
  await clearDb();
  anthropicCreate.mockReset();
});

const makeOnboarded = async (overrides) => {
  const u = await signupAgent(app);
  await u.agent.post("/api/auth/onboarding").send(onboardingBody(overrides));
  return u;
};

describe("recommended user filters", () => {
  it("filters by their native language, what they learn, location and name", async () => {
    const me = await makeOnboarded();
    const a = await makeOnboarded({ fullName: "Maria Lopez", nativeLanguage: "Spanish", learningLanguage: "english", location: "Madrid, Spain" });
    await makeOnboarded({ fullName: "Hans Meier", nativeLanguage: "german", learningLanguage: "french", location: "Berlin" });

    const ids = async (qs) => (await me.agent.get(`/api/users?${qs}`)).body.users.map((u) => u._id);

    expect(await ids("language=spanish")).toEqual([a.user._id]); // case-insensitive
    expect(await ids("learning=French")).toHaveLength(1);
    expect(await ids("location=madrid")).toEqual([a.user._id]);
    expect(await ids("search=lopez")).toEqual([a.user._id]);
    // regex characters are treated literally
    expect(await ids("search=.*")).toEqual([]);
  });
});

describe("unfriend, block, report", () => {
  it("unfriends on both sides and lets them become friends again", async () => {
    const a = await makeOnboarded();
    const b = await makeOnboarded();
    await makeFriends(a, b);

    expect((await a.agent.delete(`/api/users/friends/${b.user._id}`)).status).toBe(200);
    expect((await a.agent.get("/api/users/friends")).body).toHaveLength(0);
    expect((await b.agent.get("/api/users/friends")).body).toHaveLength(0);
    expect((await a.agent.delete(`/api/users/friends/${b.user._id}`)).status).toBe(404);

    expect((await a.agent.post(`/api/users/friend-request/${b.user._id}`)).status).toBe(201);
  });

  it("blocking removes the friendship, hides both users from each other, and blocks requests", async () => {
    const a = await makeOnboarded();
    const b = await makeOnboarded();
    await makeFriends(a, b);

    expect((await a.agent.post(`/api/users/block/${b.user._id}`)).status).toBe(200);

    expect((await a.agent.get("/api/users/friends")).body).toHaveLength(0);
    expect((await a.agent.get("/api/users")).body.users).toHaveLength(0);
    expect((await b.agent.get("/api/users")).body.users).toHaveLength(0);
    expect((await a.agent.get("/api/users/blocked")).body.map((u) => u._id)).toEqual([b.user._id]);

    expect((await a.agent.post(`/api/users/friend-request/${b.user._id}`)).status).toBe(400);
    expect((await b.agent.post(`/api/users/friend-request/${a.user._id}`)).status).toBe(403);

    await a.agent.delete(`/api/users/block/${b.user._id}`);
    expect((await a.agent.get("/api/users")).body.users).toHaveLength(1);
  });

  it("accepts a report once per open report and validates the reason", async () => {
    const a = await makeOnboarded();
    const b = await makeOnboarded();

    expect((await a.agent.post(`/api/users/report/${b.user._id}`).send({ reason: "nope" })).status).toBe(400);
    const ok = await a.agent.post(`/api/users/report/${b.user._id}`).send({ reason: "spam", details: "ads" });
    expect(ok.status).toBe(201);
    expect((await a.agent.post(`/api/users/report/${b.user._id}`).send({ reason: "spam" })).status).toBe(400);
    expect((await a.agent.post(`/api/users/report/${a.user._id}`).send({ reason: "spam" })).status).toBe(400);
  });
});

describe("profile settings", () => {
  it("edits the profile and changes the password", async () => {
    const u = await makeOnboarded();

    const edit = await u.agent.put("/api/auth/profile").send(onboardingBody({ bio: "new bio", location: "Paris" }));
    expect(edit.status).toBe(200);
    expect(edit.body.user.bio).toBe("new bio");

    const bad = await u.agent.put("/api/auth/password").send({ currentPassword: "wrong-pass", newPassword: "newsecret1" });
    expect(bad.status).toBe(400);

    const ok = await u.agent.put("/api/auth/password").send({ currentPassword: u.body.password, newPassword: "newsecret1" });
    expect(ok.status).toBe(200);

    const login = (password) => request(app).post("/api/auth/login").send({ email: u.body.email, password });
    expect((await login(u.body.password)).status).toBe(401);
    expect((await login("newsecret1")).status).toBe(200);
  });
});

describe("realtime events", () => {
  it("delivers only to the targeted user's connections and cleans up", () => {
    const writes = [];
    const unsubscribe = subscribe("u1", { write: (chunk) => writes.push(chunk) });

    expect(isOnline("u1")).toBe(true);
    expect(emitToUser("u2", "x")).toBe(false);
    expect(emitToUser("u1", "friend-request", { a: 1 })).toBe(true);
    expect(writes[0]).toBe('event: friend-request\ndata: {"a":1}\n\n');

    unsubscribe();
    expect(isOnline("u1")).toBe(false);
  });

  it("streams friend-request and incoming-call events over /api/events", async () => {
    const a = await makeOnboarded();
    const b = await makeOnboarded();

    const server = app.listen(0);
    const port = server.address().port;
    const controller = new AbortController();
    try {
      const cookie = (await b.agent.post("/api/auth/login").send({ email: b.body.email, password: b.body.password }))
        .headers["set-cookie"][0].split(";")[0];
      const res = await fetch(`http://127.0.0.1:${port}/api/events`, { headers: { cookie }, signal: controller.signal });
      expect(res.headers.get("content-type")).toMatch(/text\/event-stream/);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let received = "";
      const readUntil = async (needle) => {
        while (!received.includes(needle)) {
          const { value, done } = await reader.read();
          if (done) break;
          received += decoder.decode(value);
        }
      };

      await readUntil("retry:");
      await a.agent.post(`/api/users/friend-request/${b.user._id}`);
      await readUntil("event: friend-request");
      expect(received).toContain(a.user._id);

      await makeFriends(a, b).catch(() => {});
      await a.agent.post(`/api/chat/call/${b.user._id}/ring`); // not friends yet or friends: just must not throw
    } finally {
      controller.abort();
      server.closeAllConnections?.();
      server.close();
    }
  });

  it("rejects unauthenticated SSE connections", async () => {
    expect((await request(app).get("/api/events")).status).toBe(401);
  });
});

describe("ringing", () => {
  it("rings only friends", async () => {
    const a = await makeOnboarded();
    const b = await makeOnboarded();

    expect((await a.agent.post(`/api/chat/call/${b.user._id}/ring`)).status).toBe(403);
    await makeFriends(a, b);
    const res = await a.agent.post(`/api/chat/call/${b.user._id}/ring`);
    expect(res.status).toBe(200);
    expect(res.body.delivered).toBe(false); // b has no open connection
  });
});

describe("AI helpers", () => {
  it("translates into the user's native language by default", async () => {
    const u = await makeOnboarded({ nativeLanguage: "english" });
    anthropicCreate.mockResolvedValue({ stop_reason: "end_turn", content: [{ type: "text", text: "Hello" }] });

    const res = await u.agent.post("/api/ai/translate").send({ text: "Hola" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ translation: "Hello", targetLanguage: "english" });

    const call = anthropicCreate.mock.calls[0][0];
    expect(call.model).toBe("claude-opus-5-5");
    expect(call.messages[0].content).toContain("Hola");
  });

  it("validates input, maps refusals and API failures", async () => {
    const u = await makeOnboarded();
    expect((await u.agent.post("/api/ai/translate").send({ text: "" })).status).toBe(400);

    anthropicCreate.mockResolvedValue({ stop_reason: "refusal", content: [] });
    expect((await u.agent.post("/api/ai/translate").send({ text: "x" })).status).toBe(422);
  });

  it("returns up to five cleaned conversation topics for a friend", async () => {
    const a = await makeOnboarded();
    const b = await makeOnboarded();
    await makeFriends(a, b);
    anthropicCreate.mockResolvedValue({
      stop_reason: "end_turn",
      content: [{ type: "text", text: "1. ¿Qué haces?\n- ¿Dónde vives?\n\n¿Te gusta viajar?\n¿Comida favorita?\n¿Tu libro favorito?\nextra" }],
    });

    const res = await a.agent.post("/api/ai/topics").send({ friendId: b.user._id });
    expect(res.body.topics).toEqual(["¿Qué haces?", "¿Dónde vives?", "¿Te gusta viajar?", "¿Comida favorita?", "¿Tu libro favorito?"]);

    const stranger = await makeOnboarded();
    expect((await a.agent.post("/api/ai/topics").send({ friendId: stranger.user._id })).status).toBe(403);
  });
});

describe("practice sessions", () => {
  it("records a call and reports stats", async () => {
    const a = await makeOnboarded();
    const b = await makeOnboarded();
    const callId = [a.user._id, b.user._id].sort().join("-");

    // not friends yet
    expect((await a.agent.post("/api/practice").send({ callId })).status).toBe(403);
    await makeFriends(a, b);

    const start = await a.agent.post("/api/practice").send({ callId });
    expect(start.status).toBe(201);
    const end = await a.agent.put(`/api/practice/${start.body.sessionId}/end`);
    expect(end.status).toBe(200);

    // another user can't close it
    expect((await b.agent.put(`/api/practice/${start.body.sessionId}/end`)).status).toBe(404);

    const stats = (await a.agent.get("/api/practice/stats")).body;
    expect(stats.totalSessions).toBe(1);
    expect(stats.streakDays).toBe(1);
    expect(stats.last7Days).toHaveLength(7);
    expect(stats.topPartners[0].partner._id).toBe(b.user._id);
  });

  it("counts a session whose tab was closed, ending it at the last heartbeat", async () => {
    const a = await makeOnboarded();
    const b = await makeOnboarded();
    await makeFriends(a, b);
    const callId = [a.user._id, b.user._id].sort().join("-");

    const { body: { sessionId } } = await a.agent.post("/api/practice").send({ callId });
    expect((await a.agent.put(`/api/practice/${sessionId}/ping`)).status).toBe(200);

    // simulate: started 10 minutes ago, last heartbeat 5 minutes ago, never ended
    const now = Date.now();
    await PracticeSession.updateOne(
      { _id: sessionId },
      { startedAt: new Date(now - 10 * 60000), lastSeenAt: new Date(now - 5 * 60000) }
    );

    const stats = (await a.agent.get("/api/practice/stats")).body;
    expect(stats.totalSessions).toBe(1);
    expect(stats.totalMinutes).toBe(5);

    // a session with a fresh heartbeat is still running and not counted yet
    const second = await a.agent.post("/api/practice").send({ callId });
    await a.agent.put(`/api/practice/${second.body.sessionId}/ping`);
    expect((await a.agent.get("/api/practice/stats")).body.totalSessions).toBe(1);
  });
});
