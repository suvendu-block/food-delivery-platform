import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

let mongoServer;

export const startTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  return uri;
};

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

export const clearDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};

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

export const generateToken = (userId, role = "customer") => {
  return jwt.sign({ _id: userId, role }, env.jwtSecret, {
    expiresIn: env.jwtExpire,
  });
};

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

export const createReview = async (userId, restaurantId, overrides = {}) => {
  const { reviewService } = await import("../services/index.js");

  return reviewService.createReview(userId, {
    restaurantId,
    rating: 5,
    comment: "Solid place",
    ...overrides,
  });
};
