import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

let mongoServer;

/**
 * Start an in-memory MongoDB instance.
 * Call in beforeAll() at the suite level.
 */
export const startTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri);
  return uri;
};

/**
 * Drop all collections and close the connection.
 * Call in afterAll() at the suite level.
 */
export const stopTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key of Object.keys(collections)) {
      await collections[key].deleteMany({});
    }
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
};

/**
 * Clear all collections between tests.
 * Call in beforeEach() for isolation.
 */
export const clearDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};

/**
 * Register a user via the service layer and return { user, token }.
 */
export const registerUser = async (overrides = {}) => {
  const { authService } = await import("../services/index.js");

  const payload = {
    username: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    email: `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@test.com`,
    password: "password123",
    ...overrides,
  };

  return authService.register(payload);
};

/**
 * Generate a JWT token for a given user ID and role.
 * Useful for creating tokens without going through the DB.
 */
export const generateToken = (userId, role = "customer") => {
  return jwt.sign({ _id: userId, role }, env.jwtSecret, {
    expiresIn: env.jwtExpire,
  });
};

/**
 * Create a restaurant via the service layer.
 */
export const createRestaurant = async (ownerId, overrides = {}) => {
  const { restaurantService } = await import("../services/index.js");

  const payload = {
    name: `Restaurant ${Date.now()}`,
    cuisine: ["Italian"],
    address: {
      street: "123 Test St",
      city: "Testville",
      state: "TS",
      zip: "12345",
    },
    ...overrides,
  };

  return restaurantService.create(payload, ownerId);
};

/**
 * Create a menu item via the service layer.
 */
export const createMenuItem = async (restaurantId, userId, userRole, overrides = {}) => {
  const { menuService } = await import("../services/index.js");

  const payload = {
    restaurantId,
    name: `Item ${Date.now()}`,
    price: 9.99,
    category: "main",
    ...overrides,
  };

  return menuService.createMenu(payload, userId, userRole);
};

/**
 * Create a review via the service layer.
 */
export const createReview = async (userId, restaurantId, overrides = {}) => {
  const { reviewService } = await import("../services/index.js");

  return reviewService.createReview(userId, {
    restaurantId,
    rating: 5,
    comment: "Great food!",
    ...overrides,
  });
};
