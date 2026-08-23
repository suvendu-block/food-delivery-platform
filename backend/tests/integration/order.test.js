import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import { startTestDB, stopTestDB, clearDB, registerUser, createRestaurant, createMenuItem } from "../helpers.js";

let app;

// These are re-created in beforeEach
let ownerToken, ownerUserId;
let customerToken, customerUserId;

const setupTestData = async () => {
  const { authService } = await import("../../services/index.js");

  // Register restaurant owner
  const owner = await registerUser({
    username: "order_owner",
    email: "orderowner@test.com",
  });
  ownerUserId = owner.user._id.toString();

  // Promote to restaurant role
  await mongoose.connection.collections.users.updateOne(
    { _id: new mongoose.Types.ObjectId(ownerUserId) },
    { $set: { role: "restaurant" } }
  );

  // Re-login to get token with restaurant role
  const { token: freshToken } = await authService.login({
    email: "orderowner@test.com",
    password: "password123",
  });
  ownerToken = freshToken;

  // Register customer
  const customer = await registerUser({
    username: "order_customer",
    email: "ordercustomer@test.com",
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

// ─── POST /api/orders ───────────────────────────────────────────────

describe("POST /api/orders", () => {
  it("should create an order with delivery address and payment method", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Order Test" });
    const burger = await createMenuItem(restaurant._id.toString(), ownerUserId, "restaurant", {
      name: "Burger", price: 12.99, category: "main",
    });
    const fries = await createMenuItem(restaurant._id.toString(), ownerUserId, "restaurant", {
      name: "Fries", price: 4.99, category: "appetizer",
    });

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        restaurantId: restaurant._id.toString(),
        items: [
          { menuId: burger._id.toString(), quantity: 2 },
          { menuId: fries._id.toString(), quantity: 1 },
        ],
        deliveryAddress: "456 Oak Ave, NYC",
        paymentMethod: "cash",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalAmount).toBeCloseTo(30.97, 1);
    expect(res.body.data.deliveryAddress).toBe("456 Oak Ave, NYC");
    expect(res.body.data.paymentMethod).toBe("cash");
    expect(res.body.data.items).toHaveLength(2);
  });

  it("should default payment method to card", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Default Pay" });
    const item = await createMenuItem(restaurant._id.toString(), ownerUserId, "restaurant", {
      name: "Burger", price: 12.99, category: "main",
    });

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        restaurantId: restaurant._id.toString(),
        items: [{ menuId: item._id.toString(), quantity: 1 }],
        deliveryAddress: "123 Main St",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.paymentMethod).toBe("card");
  });

  it("should reject order without delivery address", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "No Addr" });
    const item = await createMenuItem(restaurant._id.toString(), ownerUserId, "restaurant", {
      name: "Burger", price: 12.99, category: "main",
    });

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        restaurantId: restaurant._id.toString(),
        items: [{ menuId: item._id.toString(), quantity: 1 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should reject order with empty items", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Empty Items" });

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        restaurantId: restaurant._id.toString(),
        items: [],
        deliveryAddress: "123 Main St",
      });

    expect(res.status).toBe(400);
  });

  it("should reject order for non-existent restaurant", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        restaurantId: fakeId.toString(),
        items: [{ menuId: fakeId.toString(), quantity: 1 }],
        deliveryAddress: "123 Main St",
      });

    expect(res.status).toBe(404);
  });

  it("should reject unauthenticated request", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({
        restaurantId: new mongoose.Types.ObjectId().toString(),
        items: [{ menuId: new mongoose.Types.ObjectId().toString(), quantity: 1 }],
        deliveryAddress: "123 Main St",
      });

    expect(res.status).toBe(401);
  });
});

// ─── GET /api/orders/user/me ────────────────────────────────────────

describe("GET /api/orders/user/me", () => {
  it("should return customer's orders", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "My Orders" });
    const item = await createMenuItem(restaurant._id.toString(), ownerUserId, "restaurant", {
      name: "Burger", price: 12.99, category: "main",
    });

    await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        restaurantId: restaurant._id.toString(),
        items: [{ menuId: item._id.toString(), quantity: 1 }],
        deliveryAddress: "789 Pine St",
      });

    const res = await request(app)
      .get("/api/orders/user/me")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.orders).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
  });

  it("should reject unauthenticated request", async () => {
    const res = await request(app).get("/api/orders/user/me");
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/orders/restaurant/:restaurantId ───────────────────────

describe("GET /api/orders/restaurant/:restaurantId", () => {
  it("should return orders for restaurant owner", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Rest Orders" });
    const item = await createMenuItem(restaurant._id.toString(), ownerUserId, "restaurant", {
      name: "Burger", price: 12.99, category: "main",
    });

    await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        restaurantId: restaurant._id.toString(),
        items: [{ menuId: item._id.toString(), quantity: 2 }],
        deliveryAddress: "100 Delivery Lane",
      });

    const res = await request(app)
      .get(`/api/orders/restaurant/${restaurant._id.toString()}`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.orders).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
  });

  it("should reject customer trying to view restaurant orders", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Rest Orders 2" });

    const res = await request(app)
      .get(`/api/orders/restaurant/${restaurant._id.toString()}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
  });
});
