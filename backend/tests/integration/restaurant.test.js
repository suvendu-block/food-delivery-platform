import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import { startTestDB, stopTestDB, clearDB, registerUser, createRestaurant } from "../helpers.js";

let app;
let ownerToken, ownerUserId;
let customerToken;

const setupTestData = async () => {
  const { authService } = await import("../../services/index.js");

  const owner = await registerUser({
    username: "rest_owner",
    email: "owner@test.com",
  });
  ownerUserId = owner.user._id.toString();

  await mongoose.connection.collections.users.updateOne(
    { _id: new mongoose.Types.ObjectId(ownerUserId) },
    { $set: { role: "restaurant" } }
  );

  const { token: freshToken } = await authService.login({
    email: "owner@test.com",
    password: "password123",
  });
  ownerToken = freshToken;

  const customer = await registerUser({
    username: "rest_customer",
    email: "customer@test.com",
  });
  customerToken = customer.token;
};

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
  await setupTestData();
});

describe("GET /api/restaurants", () => {
  it("should return empty array when no restaurants exist", async () => {
    const res = await request(app).get("/api/restaurants");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it("should return open restaurants", async () => {
    await createRestaurant(ownerUserId, { name: "Open Place" });

    const res = await request(app).get("/api/restaurants");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Open Place");
  });
});

describe("GET /api/restaurants/:id", () => {
  it("should return a restaurant with populated menu", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Populated" });

    const res = await request(app).get(`/api/restaurants/${restaurant._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Populated");
    expect(res.body.data.menu).toBeDefined();
    expect(Array.isArray(res.body.data.menu)).toBe(true);
  });

  it("should return 404 for non-existent restaurant", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/restaurants/${fakeId}`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe("POST /api/restaurants", () => {
  const validRestaurant = {
    name: "Test Restaurant",
    cuisine: ["Italian"],
    address: { city: "NYC", state: "NY", zip: "10001" },
  };

  it("should create restaurant as restaurant owner", async () => {
    const res = await request(app)
      .post("/api/restaurants")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send(validRestaurant);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Test Restaurant");
    expect(res.body.data.owner).toBeDefined();
  });

  it("should reject customer role", async () => {
    const res = await request(app)
      .post("/api/restaurants")
      .set("Authorization", `Bearer ${customerToken}`)
      .send(validRestaurant);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("should reject unauthenticated request", async () => {
    const res = await request(app)
      .post("/api/restaurants")
      .send(validRestaurant);

    expect(res.status).toBe(401);
  });

  it("should reject invalid data", async () => {
    const res = await request(app)
      .post("/api/restaurants")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "X" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("PUT /api/restaurants/:id", () => {
  it("should update own restaurant", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Original" });

    const res = await request(app)
      .put(`/api/restaurants/${restaurant._id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Updated Name" });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Updated Name");
  });

  it("should reject customer trying to update", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Protected" });

    const res = await request(app)
      .put(`/api/restaurants/${restaurant._id}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ name: "Hacked" });

    expect(res.status).toBe(403);
  });

  it("should return 404 for non-existent restaurant", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/restaurants/${fakeId}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Updated" });

    expect(res.status).toBe(404);
  });
});
