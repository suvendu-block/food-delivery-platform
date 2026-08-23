import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import { startTestDB, stopTestDB, clearDB, registerUser } from "../helpers.js";

let app;

beforeAll(async () => {
  await startTestDB();
  const { default: appModule } = await import("../../app.js");
  app = appModule;
});

afterAll(async () => {
  await stopTestDB();
});

beforeEach(async () => {
  await clearDB();
});

describe("GET /health", () => {
  it("should return status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.timestamp).toBeDefined();
  });
});

describe("Unknown routes", () => {
  it("should return 404 for unknown routes", async () => {
    const res = await request(app).get("/api/nonexistent");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Route not found");
  });
});

describe("POST /api/users/register", () => {
  const validUser = {
    username: "testuser",
    email: "test@example.com",
    password: "password123",
  };

  it("should register a new user and return token", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe("test@example.com");
    expect(res.body.data.user.role).toBe("customer");
    expect(res.body.data.user.password).toBeUndefined();
  });

  it("should reject duplicate email", async () => {
    await request(app).post("/api/users/register").send(validUser);

    const res = await request(app)
      .post("/api/users/register")
      .send({ ...validUser, username: "other" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should reject duplicate username", async () => {
    await request(app).post("/api/users/register").send(validUser);

    const res = await request(app)
      .post("/api/users/register")
      .send({ ...validUser, email: "other@example.com" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should reject short password", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({ ...validUser, password: "12345" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should reject invalid email", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({ ...validUser, email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should force role to customer even if provided", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({ ...validUser, role: "admin" });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe("customer");
  });
});

describe("POST /api/users/login", () => {
  it("should login with valid credentials", async () => {
    await request(app).post("/api/users/register").send({
      username: "logintest",
      email: "login@test.com",
      password: "password123",
    });

    const res = await request(app)
      .post("/api/users/login")
      .send({ email: "login@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe("login@test.com");
  });

  it("should reject wrong password", async () => {
    await request(app).post("/api/users/register").send({
      username: "wrongpw",
      email: "wrongpw@test.com",
      password: "password123",
    });

    const res = await request(app)
      .post("/api/users/login")
      .send({ email: "wrongpw@test.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should reject non-existent email", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({ email: "nobody@test.com", password: "password123" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe("GET /api/users/profile", () => {
  it("should return user profile when authenticated", async () => {
    const { token } = await registerUser({
      username: "profileuser",
      email: "profile@test.com",
    });

    const res = await request(app)
      .get("/api/users/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe("profile@test.com");
    expect(res.body.data.password).toBeUndefined();
  });

  it("should reject unauthenticated request", async () => {
    const res = await request(app).get("/api/users/profile");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should reject invalid token", async () => {
    const res = await request(app)
      .get("/api/users/profile")
      .set("Authorization", "Bearer invalidtoken123");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe("PUT /api/users/profile", () => {
  it("should update username", async () => {
    const { token } = await registerUser({
      username: "updateuser",
      email: "update@test.com",
    });

    const res = await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "newname" });

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe("newname");
  });

  it("should update phone", async () => {
    const { token } = await registerUser({
      username: "phoneuser",
      email: "phone@test.com",
    });

    const res = await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ phone: "555-1234" });

    expect(res.status).toBe(200);
    expect(res.body.data.phone).toBe("555-1234");
  });
});
