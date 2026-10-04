import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { clearDb, makeFriends, onboardingBody, setupApp, signupAgent, streamVideoFetch, teardownApp } from "./helpers.js";

let app;
beforeAll(async () => {
  app = await setupApp();
});
afterAll(teardownApp);
beforeEach(clearDb);

const makeOnboarded = async (overrides) => {
  const u = await signupAgent(app);
  await u.agent.post("/api/auth/onboarding").send(onboardingBody(overrides));
  return u;
};

describe("friend requests", () => {
  it("sends, lists, and accepts a request", async () => {
    const a = await makeOnboarded();
    const b = await makeOnboarded();

    const sent = await a.agent.post(`/api/users/friend-request/${b.user._id}`);
    expect(sent.status).toBe(201);

    // duplicates are blocked
    expect((await a.agent.post(`/api/users/friend-request/${b.user._id}`)).status).toBe(400);

    const incoming = (await b.agent.get("/api/users/friend-requests")).body.incomingReqs;
    expect(incoming).toHaveLength(1);

    // only the recipient may accept
    expect((await a.agent.put(`/api/users/friend-request/${sent.body._id}/accept`)).status).toBe(403);
    expect((await b.agent.put(`/api/users/friend-request/${sent.body._id}/accept`)).status).toBe(200);
    // and only once
    expect((await b.agent.put(`/api/users/friend-request/${sent.body._id}/accept`)).status).toBe(400);

    const friends = (await a.agent.get("/api/users/friends")).body;
    expect(friends.map((f) => f._id)).toEqual([b.user._id]);
  });

  it("auto-accepts when the other user had already sent a request", async () => {
    const a = await makeOnboarded();
    const b = await makeOnboarded();

    await a.agent.post(`/api/users/friend-request/${b.user._id}`);
    const res = await b.agent.post(`/api/users/friend-request/${a.user._id}`);

    expect(res.status).toBe(200);
    expect((await b.agent.get("/api/users/friends")).body).toHaveLength(1);
  });

  it("lets the recipient decline and the sender try again", async () => {
    const a = await makeOnboarded();
    const b = await makeOnboarded();

    const sent = await a.agent.post(`/api/users/friend-request/${b.user._id}`);
    expect((await b.agent.delete(`/api/users/friend-request/${sent.body._id}`)).status).toBe(200);
    expect((await a.agent.post(`/api/users/friend-request/${b.user._id}`)).status).toBe(201);
  });

  it("rejects invalid ids and self requests", async () => {
    const a = await makeOnboarded();
    expect((await a.agent.post("/api/users/friend-request/not-an-id")).status).toBe(400);
    expect((await a.agent.post(`/api/users/friend-request/${a.user._id}`)).status).toBe(400);
  });
});

describe("recommended users", () => {
  it("hides sensitive fields, excludes me and friends, and ranks language matches first", async () => {
    const me = await makeOnboarded({ nativeLanguage: "english", learningLanguage: "spanish" });
    const unrelated = await makeOnboarded({ nativeLanguage: "german", learningLanguage: "french" });
    const match = await makeOnboarded({ nativeLanguage: "spanish", learningLanguage: "english" });

    const res = await me.agent.get("/api/users");
    expect(res.status).toBe(200);

    const ids = res.body.users.map((u) => u._id);
    expect(ids).toEqual([match.user._id, unrelated.user._id]);
    expect(ids).not.toContain(me.user._id);
    for (const u of res.body.users) {
      expect(u.email).toBeUndefined();
      expect(u.password).toBeUndefined();
    }
  });

  it("paginates", async () => {
    const me = await makeOnboarded();
    for (let i = 0; i < 3; i++) await makeOnboarded();

    const p1 = (await me.agent.get("/api/users?limit=2&page=1")).body;
    const p2 = (await me.agent.get("/api/users?limit=2&page=2")).body;

    expect(p1).toMatchObject({ total: 3, totalPages: 2, page: 1 });
    expect(p1.users).toHaveLength(2);
    expect(p2.users).toHaveLength(1);
    expect((await me.agent.get("/api/users?limit=1000")).status).toBe(400);
  });
});

describe("chat / call authorization", () => {
  it("only prepares a call for friends who are call participants", async () => {
    const a = await makeOnboarded();
    const b = await makeOnboarded();
    const c = await makeOnboarded();
    const callId = [a.user._id, b.user._id].sort().join("-");

    // not friends yet: nothing is created on Stream
    streamVideoFetch.mockClear();
    expect((await a.agent.get(`/api/chat/call-token/${callId}`)).status).toBe(403);
    expect(streamVideoFetch).not.toHaveBeenCalled();

    const req = await a.agent.post(`/api/users/friend-request/${b.user._id}`);
    await b.agent.put(`/api/users/friend-request/${req.body._id}/accept`);

    const ok = await a.agent.get(`/api/chat/call-token/${callId}`);
    expect(ok.status).toBe(200);
    expect(jwt.decode(ok.body.token).user_id).toBe(a.user._id);

    // the server created the call on Stream with exactly the two friends as members
    const create = streamVideoFetch.mock.calls.find(([url]) => url.includes(`/call/friend_call/${callId}?`));
    const body = JSON.parse(create[1].body);
    expect(body.data.members.map((m) => m.user_id).sort()).toEqual([a.user._id, b.user._id].sort());

    // a third user can't get anything for someone else's call
    expect((await c.agent.get(`/api/chat/call-token/${callId}`)).status).toBe(403);
  });

  it("answers 502 when Stream's video API is down", async () => {
    const a = await makeOnboarded();
    const b = await makeOnboarded();
    await makeFriends(a, b);
    const callId = [a.user._id, b.user._id].sort().join("-");

    streamVideoFetch.mockResolvedValue(new Response("boom", { status: 500 }));
    try {
      expect((await a.agent.get(`/api/chat/call-token/${callId}`)).status).toBe(502);
    } finally {
      streamVideoFetch.mockImplementation(async () => new Response("{}", { status: 200 }));
    }
  });

  it("revokes call membership when a friendship ends", async () => {
    const a = await makeOnboarded();
    const b = await makeOnboarded();
    await makeFriends(a, b);
    const callId = [a.user._id, b.user._id].sort().join("-");

    streamVideoFetch.mockClear();
    await a.agent.delete(`/api/users/friends/${b.user._id}`);
    const revoke = streamVideoFetch.mock.calls.find(([url]) => url.includes(`/call/friend_call/${callId}/members`));
    expect(JSON.parse(revoke[1].body).remove_members.sort()).toEqual([a.user._id, b.user._id].sort());
  });

  it("issues a plain chat token, and channels need friendship", async () => {
    const a = await makeOnboarded();
    const b = await makeOnboarded();

    const { token } = (await a.agent.get("/api/chat/token")).body;
    expect(jwt.decode(token)).toMatchObject({ user_id: a.user._id });

    expect((await a.agent.post(`/api/chat/channel/${b.user._id}`)).status).toBe(403);
  });
});
