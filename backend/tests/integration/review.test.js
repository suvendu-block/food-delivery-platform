import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import { startTestDB, stopTestDB, clearDB, registerUser, createRestaurant } from "../helpers.js";

let app;
let ownerUserId, ownerToken;
let customerToken, customerUserId;

const setupTestData = async () => {
  const { authService } = await import("../../services/index.js");

  const owner = await registerUser({
    username: "review_owner",
    email: "reviewowner@test.com",
  });
  ownerUserId = owner.user._id.toString();

  const customer = await registerUser({
    username: "review_customer",
    email: "reviewcustomer@test.com",
  });
  customerToken = customer.token;
  customerUserId = customer.user._id.toString();
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

// ─── POST /api/reviews ──────────────────────────────────────────────

describe("POST /api/reviews", () => {
  it("should create a review", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Review Test" });

    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        restaurantId: restaurant._id.toString(),
        rating: 5,
        comment: "Amazing food!",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rating).toBe(5);
    expect(res.body.data.comment).toBe("Amazing food!");
    expect(res.body.data.userId.username).toBe("review_customer");
  });

  it("should create review without comment", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "No Comment" });

    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ restaurantId: restaurant._id.toString(), rating: 4 });

    expect(res.status).toBe(201);
    expect(res.body.data.rating).toBe(4);
    expect(res.body.data.comment).toBeUndefined();
  });

  it("should reject duplicate review from same user", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Dup Review" });

    await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ restaurantId: restaurant._id.toString(), rating: 5, comment: "First" });

    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ restaurantId: restaurant._id.toString(), rating: 4, comment: "Second" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already reviewed/);
  });

  it("should reject unauthenticated request", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Unauth Review" });

    const res = await request(app)
      .post("/api/reviews")
      .send({ restaurantId: restaurant._id.toString(), rating: 5 });

    expect(res.status).toBe(401);
  });

  it("should reject invalid rating (below 1)", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Low Rating" });

    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ restaurantId: restaurant._id.toString(), rating: 0 });

    expect(res.status).toBe(400);
  });

  it("should reject invalid rating (above 5)", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "High Rating" });

    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ restaurantId: restaurant._id.toString(), rating: 6 });

    expect(res.status).toBe(400);
  });
});

// ─── Rating Aggregation ─────────────────────────────────────────────

describe("Rating Aggregation", () => {
  it("should update restaurant rating when review is created", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Rating Test" });

    await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ restaurantId: restaurant._id.toString(), rating: 5 });

    const res = await request(app).get(`/api/restaurants/${restaurant._id.toString()}`);
    expect(res.body.data.rating).toBe(5);
  });

  it("should calculate average across multiple users", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Avg Rating" });

    // First user rates 5
    await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ restaurantId: restaurant._id.toString(), rating: 5 });

    // Second user rates 3
    const customer2 = await registerUser({
      username: "review_customer2",
      email: "review2@test.com",
    });

    await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${customer2.token}`)
      .send({ restaurantId: restaurant._id.toString(), rating: 3 });

    const res = await request(app).get(`/api/restaurants/${restaurant._id.toString()}`);
    expect(res.body.data.rating).toBe(4); // (5+3)/2 = 4
  });

  it("should reset rating to 0 when all reviews deleted", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Reset Rating" });

    const review = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ restaurantId: restaurant._id.toString(), rating: 5 });

    await request(app)
      .delete(`/api/reviews/${review.body.data._id}`)
      .set("Authorization", `Bearer ${customerToken}`);

    const res = await request(app).get(`/api/restaurants/${restaurant._id.toString()}`);
    expect(res.body.data.rating).toBe(0);
  });
});

// ─── PUT /api/reviews/:id ───────────────────────────────────────────

describe("PUT /api/reviews/:id", () => {
  it("should update own review", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Update Review" });

    const createRes = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ restaurantId: restaurant._id.toString(), rating: 5, comment: "Original" });

    const reviewId = createRes.body.data._id;

    const res = await request(app)
      .put(`/api/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ rating: 3, comment: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body.data.rating).toBe(3);
    expect(res.body.data.comment).toBe("Updated");
  });

  it("should update restaurant rating after edit", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Edit Rating" });

    const createRes = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ restaurantId: restaurant._id.toString(), rating: 5 });

    const reviewId = createRes.body.data._id;

    await request(app)
      .put(`/api/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ rating: 2 });

    const res = await request(app).get(`/api/restaurants/${restaurant._id.toString()}`);
    expect(res.body.data.rating).toBe(2);
  });

  it("should reject updating another user's review", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Other Update" });

    const createRes = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ restaurantId: restaurant._id.toString(), rating: 5, comment: "Mine" });

    const reviewId = createRes.body.data._id;

    const otherUser = await registerUser({
      username: "other_reviewer",
      email: "other@test.com",
    });

    const res = await request(app)
      .put(`/api/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${otherUser.token}`)
      .send({ rating: 1 });

    expect(res.status).toBe(403);
  });
});

// ─── DELETE /api/reviews/:id ────────────────────────────────────────

describe("DELETE /api/reviews/:id", () => {
  it("should delete own review", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Delete Review" });

    const createRes = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ restaurantId: restaurant._id.toString(), rating: 4, comment: "Delete me" });

    const reviewId = createRes.body.data._id;

    const res = await request(app)
      .delete(`/api/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe("Review deleted");
  });

  it("should update restaurant rating after delete", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Del Rating" });

    const createRes = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ restaurantId: restaurant._id.toString(), rating: 4 });

    const reviewId = createRes.body.data._id;

    await request(app)
      .delete(`/api/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${customerToken}`);

    const res = await request(app).get(`/api/restaurants/${restaurant._id.toString()}`);
    expect(res.body.data.rating).toBe(0);
  });

  it("should reject deleting another user's review", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Other Delete" });

    const createRes = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ restaurantId: restaurant._id.toString(), rating: 4, comment: "Mine" });

    const reviewId = createRes.body.data._id;

    const otherUser = await registerUser({
      username: "other_deleter",
      email: "otherdel@test.com",
    });

    const res = await request(app)
      .delete(`/api/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${otherUser.token}`);

    expect(res.status).toBe(403);
  });
});

// ─── GET /api/reviews/restaurant/:restaurantId ──────────────────────

describe("GET /api/reviews/restaurant/:restaurantId", () => {
  it("should return reviews for a restaurant", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "List Reviews" });

    await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ restaurantId: restaurant._id.toString(), rating: 5, comment: "Great!" });

    const res = await request(app).get(`/api/reviews/restaurant/${restaurant._id.toString()}`);
    expect(res.status).toBe(200);
    expect(res.body.data.reviews).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
  });

  it("should return empty when no reviews exist", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "No Reviews" });

    const res = await request(app).get(`/api/reviews/restaurant/${restaurant._id.toString()}`);
    expect(res.status).toBe(200);
    expect(res.body.data.reviews).toHaveLength(0);
    expect(res.body.data.total).toBe(0);
  });
});
