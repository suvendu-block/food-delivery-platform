import { z } from "zod";

export const registerUserSchema = z.object({
  username: z.string().min(3).max(50).trim(),
  email: z.string().email().toLowerCase(),
  password: z.string().min(6).max(128),
  // Role is ignored — always defaults to "customer"
});

export const loginUserSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(6),
});

export const updateProfileSchema = z.object({
  username: z.string().min(3).max(50).trim().optional(),
  phone: z
    .string()
    .max(20, "Phone too long")
    .optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
    })
    .optional(),
});

export const createRestaurantSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  cuisine: z.array(z.string()).default([]),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
  }),
  isOpen: z.boolean().default(true),
});

export const updateRestaurantSchema = createRestaurantSchema.partial();

export const createMenuSchema = z.object({
  restaurantId: z
    .string()
    .refine((id) => /^[0-9a-fA-F]{24}$/.test(id), "Invalid restaurant ID"),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  price: z.number().min(0),
  category: z.enum(["appetizer", "main", "drink", "dessert"]),
  isAvailable: z.boolean().default(true),
  imageUrl: z.string().url().optional(),
  prepTime: z.number().min(1).default(20),
});

export const updateMenuSchema = createMenuSchema.partial();

export const createOrderSchema = z.object({
  restaurantId: z
    .string()
    .refine((id) => /^[0-9a-fA-F]{24}$/.test(id), "Invalid restaurant ID"),
  items: z
    .array(
      z.object({
        menuId: z
          .string()
          .refine((id) => /^[0-9a-fA-F]{24}$/.test(id), "Invalid menu ID"),
        quantity: z.number().min(1).max(99),
      })
    )
    .min(1, "At least one item is required"),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  paymentMethod: z.enum(["card", "cash", "wallet"]).default("card"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "preparing",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ]),
});

export const createReviewSchema = z.object({
  restaurantId: z
    .string()
    .refine((id) => /^[0-9a-fA-F]{24}$/.test(id), "Invalid restaurant ID"),
  rating: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
});
