import { describe, it, expect } from "@jest/globals";

describe("Validation Schemas", () => {
  describe("registerUserSchema", () => {
    it("should accept valid registration data", async () => {
      const { registerUserSchema } = await import("../../validations/schemas.js");
      const result = registerUserSchema.safeParse({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
      expect(result.data.email).toBe("test@example.com"); // lowercase
    });

    it("should reject short username", async () => {
      const { registerUserSchema } = await import("../../validations/schemas.js");
      const result = registerUserSchema.safeParse({
        username: "ab",
        email: "test@example.com",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid email", async () => {
      const { registerUserSchema } = await import("../../validations/schemas.js");
      const result = registerUserSchema.safeParse({
        username: "testuser",
        email: "not-an-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject short password", async () => {
      const { registerUserSchema } = await import("../../validations/schemas.js");
      const result = registerUserSchema.safeParse({
        username: "testuser",
        email: "test@example.com",
        password: "12345",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("loginUserSchema", () => {
    it("should accept valid login data", async () => {
      const { loginUserSchema } = await import("../../validations/schemas.js");
      const result = loginUserSchema.safeParse({
        email: "test@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", async () => {
      const { loginUserSchema } = await import("../../validations/schemas.js");
      const result = loginUserSchema.safeParse({
        email: "bad",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createRestaurantSchema", () => {
    it("should accept valid restaurant data", async () => {
      const { createRestaurantSchema } = await import("../../validations/schemas.js");
      const result = createRestaurantSchema.safeParse({
        name: "My Restaurant",
        cuisine: ["Italian", "Pizza"],
        address: {
          city: "New York",
          state: "NY",
          zip: "10001",
        },
      });
      expect(result.success).toBe(true);
      expect(result.data.isOpen).toBe(true); // default
    });

    it("should reject missing required fields", async () => {
      const { createRestaurantSchema } = await import("../../validations/schemas.js");
      const result = createRestaurantSchema.safeParse({
        name: "My Restaurant",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createMenuSchema", () => {
    it("should accept valid menu data", async () => {
      const { createMenuSchema } = await import("../../validations/schemas.js");
      const result = createMenuSchema.safeParse({
        restaurantId: "507f1f77bcf86cd799439011",
        name: "Burger",
        price: 12.99,
        category: "main",
      });
      expect(result.success).toBe(true);
      expect(result.data.isAvailable).toBe(true);
      expect(result.data.prepTime).toBe(20);
    });

    it("should reject invalid restaurant ID format", async () => {
      const { createMenuSchema } = await import("../../validations/schemas.js");
      const result = createMenuSchema.safeParse({
        restaurantId: "not-valid",
        name: "Burger",
        price: 12.99,
        category: "main",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid category", async () => {
      const { createMenuSchema } = await import("../../validations/schemas.js");
      const result = createMenuSchema.safeParse({
        restaurantId: "507f1f77bcf86cd799439011",
        name: "Burger",
        price: 12.99,
        category: "invalid",
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative price", async () => {
      const { createMenuSchema } = await import("../../validations/schemas.js");
      const result = createMenuSchema.safeParse({
        restaurantId: "507f1f77bcf86cd799439011",
        name: "Burger",
        price: -5,
        category: "main",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createOrderSchema", () => {
    it("should accept valid order data", async () => {
      const { createOrderSchema } = await import("../../validations/schemas.js");
      const result = createOrderSchema.safeParse({
        restaurantId: "507f1f77bcf86cd799439011",
        items: [
          { menuId: "507f1f77bcf86cd799439012", quantity: 2 },
        ],
        deliveryAddress: "123 Main St, NYC",
        paymentMethod: "cash",
      });
      expect(result.success).toBe(true);
    });

    it("should default paymentMethod to card", async () => {
      const { createOrderSchema } = await import("../../validations/schemas.js");
      const result = createOrderSchema.safeParse({
        restaurantId: "507f1f77bcf86cd799439011",
        items: [{ menuId: "507f1f77bcf86cd799439012", quantity: 1 }],
        deliveryAddress: "123 Main St",
      });
      expect(result.success).toBe(true);
      expect(result.data.paymentMethod).toBe("card");
    });

    it("should reject empty items array", async () => {
      const { createOrderSchema } = await import("../../validations/schemas.js");
      const result = createOrderSchema.safeParse({
        restaurantId: "507f1f77bcf86cd799439011",
        items: [],
        deliveryAddress: "123 Main St",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing deliveryAddress", async () => {
      const { createOrderSchema } = await import("../../validations/schemas.js");
      const result = createOrderSchema.safeParse({
        restaurantId: "507f1f77bcf86cd799439011",
        items: [{ menuId: "507f1f77bcf86cd799439012", quantity: 1 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid payment method", async () => {
      const { createOrderSchema } = await import("../../validations/schemas.js");
      const result = createOrderSchema.safeParse({
        restaurantId: "507f1f77bcf86cd799439011",
        items: [{ menuId: "507f1f77bcf86cd799439012", quantity: 1 }],
        deliveryAddress: "123 Main St",
        paymentMethod: "bitcoin",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createReviewSchema", () => {
    it("should accept valid review data", async () => {
      const { createReviewSchema } = await import("../../validations/schemas.js");
      const result = createReviewSchema.safeParse({
        restaurantId: "507f1f77bcf86cd799439011",
        rating: 4,
        comment: "Great food!",
      });
      expect(result.success).toBe(true);
    });

    it("should accept review without comment", async () => {
      const { createReviewSchema } = await import("../../validations/schemas.js");
      const result = createReviewSchema.safeParse({
        restaurantId: "507f1f77bcf86cd799439011",
        rating: 5,
      });
      expect(result.success).toBe(true);
    });

    it("should reject rating below 1", async () => {
      const { createReviewSchema } = await import("../../validations/schemas.js");
      const result = createReviewSchema.safeParse({
        restaurantId: "507f1f77bcf86cd799439011",
        rating: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject rating above 5", async () => {
      const { createReviewSchema } = await import("../../validations/schemas.js");
      const result = createReviewSchema.safeParse({
        restaurantId: "507f1f77bcf86cd799439011",
        rating: 6,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateOrderStatusSchema", () => {
    it("should accept valid statuses", async () => {
      const { updateOrderStatusSchema } = await import("../../validations/schemas.js");
      const statuses = [
        "pending", "confirmed", "preparing",
        "out_for_delivery", "delivered", "cancelled",
      ];
      for (const status of statuses) {
        const result = updateOrderStatusSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid status", async () => {
      const { updateOrderStatusSchema } = await import("../../validations/schemas.js");
      const result = updateOrderStatusSchema.safeParse({ status: "unknown" });
      expect(result.success).toBe(false);
    });
  });
});
