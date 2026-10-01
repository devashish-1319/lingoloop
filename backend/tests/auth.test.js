import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { clearDb, onboardingBody, setupApp, signupAgent, teardownApp } from "./helpers.js";

let app;
beforeAll(async () => {
  app = await setupApp();
});
afterAll(teardownApp);
beforeEach(clearDb);

describe("auth", () => {
  it("signs up, sets the cookie and never returns the password hash", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ fullName: "Ann", email: " Ann@Example.com ", password: "secret123" });

    expect(res.status).toBe(201);
    expect(res.headers["set-cookie"][0]).toMatch(/jwt=.*HttpOnly/);
    expect(res.body.user.email).toBe("ann@example.com");
    expect(res.body.user.password).toBeUndefined();
  });

  it("rejects bad signup input", async () => {
    const send = (body) => request(app).post("/api/auth/signup").send(body);

    expect((await send({})).body.message).toBe("All fields are required");
    expect((await send({ fullName: "A", email: "nope", password: "secret123" })).body.message).toBe(
      "Invalid email format"
    );
    expect((await send({ fullName: "A", email: "a@b.co", password: "123" })).body.message).toBe(
      "Password must be at least 6 characters"
    );
    // NoSQL operator injection attempt
    expect((await send({ fullName: "A", email: { $ne: "" }, password: "secret123" })).status).toBe(400);
  });

  it("rejects a duplicate email", async () => {
    const { body } = await signupAgent(app);
    const res = await request(app).post("/api/auth/signup").send(body);
    expect(res.status).toBe(400);
  });

  it("logs in with correct credentials only", async () => {
    const { body } = await signupAgent(app);

    const ok = await request(app).post("/api/auth/login").send({ email: body.email, password: body.password });
    expect(ok.status).toBe(200);
    expect(ok.body.user.password).toBeUndefined();

    const bad = await request(app).post("/api/auth/login").send({ email: body.email, password: "wrong-pass" });
    expect(bad.status).toBe(401);
  });

  it("protects /me: 401 without a cookie and with a garbage token", async () => {
    expect((await request(app).get("/api/auth/me")).status).toBe(401);
    const res = await request(app).get("/api/auth/me").set("Cookie", "jwt=garbage");
    expect(res.status).toBe(401);
  });

  it("onboarding only updates whitelisted fields", async () => {
    const { agent, user } = await signupAgent(app);

    const res = await agent
      .post("/api/auth/onboarding")
      .send(onboardingBody({ email: "evil@example.com", friends: [user._id], isOnboarded: false, password: "hacked1" }));

    expect(res.status).toBe(200);
    expect(res.body.user.isOnboarded).toBe(true);
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.friends).toEqual([]);
    expect(res.body.user.nativeLanguage).toBe("english");
  });

  it("onboarding requires every field", async () => {
    const { agent } = await signupAgent(app);
    const res = await agent.post("/api/auth/onboarding").send({ fullName: "X" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("All fields are required");
  });
});

describe("misc", () => {
  it("reports health and returns JSON 404s for unknown API routes", async () => {
    expect((await request(app).get("/api/health")).body.db).toBe(true);
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Route not found");
  });
});
