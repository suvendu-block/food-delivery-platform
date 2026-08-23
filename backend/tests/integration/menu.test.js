import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import { startTestDB, stopTestDB, clearDB, registerUser, createRestaurant, createMenuItem } from "../helpers.js";

let app;
let ownerToken, ownerUserId;
let customerToken;

const setupTestData = async () => {
  const { authService } = await import("../../services/index.js");

  const owner = await registerUser({
    username: "menu_owner",
    email: "menuowner@test.com",
  });
  ownerUserId = owner.user._id.toString();

  await mongoose.connection.collections.users.updateOne(
    { _id: new mongoose.Types.ObjectId(ownerUserId) },
    { $set: { role: "restaurant" } }
  );

  const { token: freshToken } = await authService.login({
    email: "menuowner@test.com",
    password: "password123",
  });
  ownerToken = freshToken;

  const customer = await registerUser({
    username: "menu_customer",
    email: "menucustomer@test.com",
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

// ─── POST /api/menus ────────────────────────────────────────────────

describe("POST /api/menus", () => {
  it("should create a menu item as restaurant owner", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Menu Test Restaurant" });

    const res = await request(app)
      .post("/api/menus")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        restaurantId: restaurant._id.toString(),
        name: "Burger",
        price: 12.99,
        category: "main",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Burger");
    expect(res.body.data.price).toBe(12.99);
    expect(res.body.data.isAvailable).toBe(true);
  });

  it("should reject customer role", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Reject Customer" });

    const res = await request(app)
      .post("/api/menus")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        restaurantId: restaurant._id.toString(),
        name: "Burger",
        price: 12.99,
        category: "main",
      });

    expect(res.status).toBe(403);
  });

  it("should add menu item to restaurant's menu array", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Menu Array" });

    await request(app)
      .post("/api/menus")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        restaurantId: restaurant._id.toString(),
        name: "Fries",
        price: 4.99,
        category: "appetizer",
      });

    const res = await request(app).get(`/api/restaurants/${restaurant._id.toString()}`);
    expect(res.body.data.menu).toHaveLength(1);
  });

  it("should reject invalid category", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Invalid Cat" });

    const res = await request(app)
      .post("/api/menus")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        restaurantId: restaurant._id.toString(),
        name: "Burger",
        price: 12.99,
        category: "invalid",
      });

    expect(res.status).toBe(400);
  });

  it("should reject menu for non-existent restaurant", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post("/api/menus")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        restaurantId: fakeId.toString(),
        name: "Burger",
        price: 12.99,
        category: "main",
      });

    expect(res.status).toBe(404);
  });
});

// ─── PUT /api/menus/:id ────────────────────────────────────────────

describe("PUT /api/menus/:id", () => {
  it("should update own menu item", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Update Menu" });
    const item = await createMenuItem(restaurant._id.toString(), ownerUserId, "restaurant", {
      name: "Original Burger", price: 10.99,
    });

    const res = await request(app)
      .put(`/api/menus/${item._id.toString()}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Updated Burger", price: 14.99 });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Updated Burger");
    expect(res.body.data.price).toBe(14.99);
  });

  it("should reject customer updating menu item", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Reject Update" });
    const item = await createMenuItem(restaurant._id.toString(), ownerUserId, "restaurant", {
      name: "Protected Burger", price: 10.99,
    });

    const res = await request(app)
      .put(`/api/menus/${item._id.toString()}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ name: "Hacked" });

    expect(res.status).toBe(403);
  });
});

// ─── DELETE /api/menus/:id ──────────────────────────────────────────

describe("DELETE /api/menus/:id", () => {
  it("should delete own menu item", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Delete Menu" });
    const item = await createMenuItem(restaurant._id.toString(), ownerUserId, "restaurant", {
      name: "Delete Me", price: 5.99,
    });

    const res = await request(app)
      .delete(`/api/menus/${item._id.toString()}`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe("Menu item deleted");
  });

  it("should remove item from restaurant's menu array", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Remove Array" });
    const item = await createMenuItem(restaurant._id.toString(), ownerUserId, "restaurant", {
      name: "Remove Me", price: 5.99,
    });

    await request(app)
      .delete(`/api/menus/${item._id.toString()}`)
      .set("Authorization", `Bearer ${ownerToken}`);

    const res = await request(app).get(`/api/restaurants/${restaurant._id.toString()}`);
    expect(res.body.data.menu).toHaveLength(0);
  });

  it("should reject customer deleting menu item", async () => {
    const restaurant = await createRestaurant(ownerUserId, { name: "Reject Delete" });
    const item = await createMenuItem(restaurant._id.toString(), ownerUserId, "restaurant", {
      name: "Protected", price: 5.99,
    });

    const res = await request(app)
      .delete(`/api/menus/${item._id.toString()}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
  });
});
