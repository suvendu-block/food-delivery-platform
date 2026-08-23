import mongoose from "mongoose";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import Menu from "../models/Menu.js";
import Order from "../models/Order.js";
import Review from "../models/Review.js";
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from "../utils/errors.js";
import {
  registerUserSchema,
  loginUserSchema,
  updateProfileSchema,
  createRestaurantSchema,
  updateRestaurantSchema,
  createMenuSchema,
  updateMenuSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  createReviewSchema,
} from "../validations/schemas.js";

/**
 * Service: User Authentication & Profile
 */
export const authService = {
  async register(payload) {
    const result = registerUserSchema.safeParse(payload);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }

    const { email, password, username } = result.data;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    }).lean();

    if (existingUser) {
      throw new ValidationError("Email or username already taken");
    }

    const user = new User({ email, password, username });
    await user.save();

    const token = user.generateAuthToken();

    const userResponse = user.toObject();
    delete userResponse.password;

    return { user: userResponse, token };
  },

  async login(payload) {
    const result = loginUserSchema.safeParse(payload);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }

    const { email, password } = result.data;

    let user;
    try {
      user = await User.findByCredentials(email, password);
    } catch {
      throw new AuthenticationError("Invalid email or password");
    }

    if (!user.isActive) {
      throw new AuthenticationError("Account is deactivated");
    }

    const token = user.generateAuthToken();

    const userResponse = user.toObject();
    delete userResponse.password;

    return { user: userResponse, token };
  },

  async getProfile(userId) {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  },

  async updateProfile(userId, payload) {
    const result = updateProfileSchema.safeParse(payload);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }

    const user = await User.findByIdAndUpdate(userId, result.data, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  },
};

/**
 * Service: Restaurant Operations
 */
export const restaurantService = {
  async getAllOpen() {
    return Restaurant.find({ isOpen: true }).select("-__v").lean();
  },

  async getById(id) {
    const restaurant = await Restaurant.findById(id)
      .populate("menu", "-__v")
      .lean();

    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    return restaurant;
  },

  async create(payload, ownerId) {
    const result = createRestaurantSchema.safeParse(payload);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }

    const restaurant = new Restaurant({
      ...result.data,
      owner: ownerId,
    });

    await restaurant.save();
    return restaurant.populate("owner", "username email");
  },

  async update(id, payload, userId, userRole) {
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    if (userRole !== "admin" && restaurant.owner.toString() !== userId.toString()) {
      throw new AuthorizationError("Not authorized to update this restaurant");
    }

    const result = updateRestaurantSchema.safeParse(payload);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }

    const updated = await Restaurant.findByIdAndUpdate(id, result.data, {
      new: true,
      runValidators: true,
    });

    return updated;
  },

  async getMenu(restaurantId) {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    return Menu.find({ restaurantId, isAvailable: true }).lean();
  },
};

/**
 * Service: Menu Item Management
 */
export const menuService = {
  async createMenu(payload, userId, userRole) {
    const result = createMenuSchema.safeParse(payload);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }

    const { restaurantId, ...menuData } = result.data;

    const restaurant = await Restaurant.findById(restaurantId).select("owner").lean();
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }
    if (userRole !== "admin" && restaurant.owner.toString() !== userId.toString()) {
      throw new AuthorizationError("Not authorized to add menu items to this restaurant");
    }

    const menuItem = new Menu({ restaurantId, ...menuData });
    await menuItem.save();

    // Add the new menu item ref to the restaurant's menu array
    await Restaurant.findByIdAndUpdate(restaurantId, {
      $push: { menu: menuItem._id },
    });

    return menuItem;
  },

  async updateMenu(menuId, payload, userId, userRole) {
    const result = updateMenuSchema.safeParse(payload);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }

    const menuItem = await Menu.findById(menuId);
    if (!menuItem) {
      throw new NotFoundError("Menu item not found");
    }

    const restaurant = await Restaurant.findById(menuItem.restaurantId).select("owner").lean();
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }
    if (userRole !== "admin" && restaurant.owner.toString() !== userId.toString()) {
      throw new AuthorizationError("Not authorized to update this menu item");
    }

    const updated = await Menu.findByIdAndUpdate(menuId, result.data, {
      new: true,
      runValidators: true,
    });

    return updated;
  },

  async deleteMenu(menuId, userId, userRole) {
    const menuItem = await Menu.findById(menuId);
    if (!menuItem) {
      throw new NotFoundError("Menu item not found");
    }

    const restaurant = await Restaurant.findById(menuItem.restaurantId).select("owner").lean();
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }
    if (userRole !== "admin" && restaurant.owner.toString() !== userId.toString()) {
      throw new AuthorizationError("Not authorized to delete this menu item");
    }

    // Remove from Restaurant's menu array
    await Restaurant.findByIdAndUpdate(menuItem.restaurantId, {
      $pull: { menu: menuId },
    });

    await Menu.findByIdAndDelete(menuId);

    return { message: "Menu item deleted" };
  },
};

/**
 * Service: Order Management
 */
export const orderService = {
  async createOrder(userId, payload) {
    const result = createOrderSchema.safeParse(payload);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }

    const { restaurantId, items, deliveryAddress, paymentMethod } = result.data;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }
    if (!restaurant.isOpen) {
      throw new ValidationError("Restaurant is currently closed");
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await Menu.findById(item.menuId);
      if (!menuItem) {
        throw new NotFoundError(`Menu item ${item.menuId} not found`);
      }
      if (!menuItem.isAvailable) {
        throw new ValidationError(`Menu item "${menuItem.name}" is not available`);
      }

      orderItems.push({
        menuId: menuItem._id,
        quantity: item.quantity,
        priceAtPurchase: menuItem.price,
      });
      totalAmount += menuItem.price * item.quantity;
    }

    const order = new Order({
      userId,
      restaurantId,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      paymentMethod,
    });

    await order.save();

    return order.populate([
      { path: "userId", select: "username email" },
      { path: "restaurantId", select: "name" },
      { path: "items.menuId", select: "name price category" },
    ]);
  },

  async getOrderById(id, userId, userRole) {
    const order = await Order.findById(id)
      .populate("userId", "username email")
      .populate("restaurantId", "name");

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (userRole !== "admin" && order.userId._id.toString() !== userId.toString()) {
      throw new AuthorizationError("Not authorized to view this order");
    }

    return order;
  },

  async getUserOrders(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("restaurantId", "name")
        .lean(),
      Order.countDocuments({ userId }),
    ]);

    return {
      orders,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    };
  },

  async getRestaurantOrders(restaurantId, userId, userRole, page = 1, limit = 10) {
    // Verify the user owns this restaurant (or is admin)
    if (userRole !== "admin") {
      const restaurant = await Restaurant.findById(restaurantId).select("owner").lean();
      if (!restaurant) {
        throw new NotFoundError("Restaurant not found");
      }
      if (restaurant.owner.toString() !== userId.toString()) {
        throw new AuthorizationError("Not authorized to view orders for this restaurant");
      }
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ restaurantId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "username email")
        .populate("items.menuId", "name price category")
        .lean(),
      Order.countDocuments({ restaurantId }),
    ]);

    return {
      orders,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    };
  },

  async updateStatus(id, status, userRole) {
    const result = updateOrderStatusSchema.safeParse({ status });
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }

    if (userRole !== "admin") {
      throw new AuthorizationError("Only admin can update order status");
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status: result.data.status },
      { new: true }
    );

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    return order;
  },
};

/**
 * Service: Reviews & Rating Aggregation
 */
export const reviewService = {
  async createReview(userId, payload) {
    const result = createReviewSchema.safeParse(payload);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }

    const { restaurantId, rating, comment } = result.data;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    const existingReview = await Review.findOne({ userId, restaurantId });
    if (existingReview) {
      throw new ValidationError("You have already reviewed this restaurant. Use update instead.");
    }

    const review = new Review({ userId, restaurantId, rating, comment });
    await review.save();

    // Recalculate and update restaurant average rating
    await this._updateRestaurantRating(restaurantId);

    return review.populate("userId", "username");
  },

  async updateReview(reviewId, userId, payload, userRole) {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError("Review not found");
    }

    if (userRole !== "admin" && review.userId.toString() !== userId.toString()) {
      throw new AuthorizationError("Not authorized to update this review");
    }

    const { rating, comment } = payload;
    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    await review.save();

    // Recalculate restaurant rating
    await this._updateRestaurantRating(review.restaurantId);

    return review.populate("userId", "username");
  },

  async deleteReview(reviewId, userId, userRole) {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError("Review not found");
    }

    if (userRole !== "admin" && review.userId.toString() !== userId.toString()) {
      throw new AuthorizationError("Not authorized to delete this review");
    }

    const restaurantId = review.restaurantId;
    await Review.findByIdAndDelete(reviewId);

    // Recalculate restaurant rating
    await this._updateRestaurantRating(restaurantId);

    return { message: "Review deleted" };
  },

  async getReviewsByRestaurant(restaurantId, page = 1, limit = 10) {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ restaurantId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "username")
        .lean(),
      Review.countDocuments({ restaurantId }),
    ]);

    return {
      reviews,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    };
  },

  async getReviewById(reviewId) {
    const review = await Review.findById(reviewId)
      .populate("userId", "username")
      .lean();

    if (!review) {
      throw new NotFoundError("Review not found");
    }

    return review;
  },

  /**
   * Recalculate average rating for a restaurant using MongoDB aggregation.
   */
  async _updateRestaurantRating(restaurantId) {
    const result = await Review.aggregate([
      { $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    const avgRating = result.length > 0 ? Math.round(result[0].avgRating * 10) / 10 : 0;

    await Restaurant.findByIdAndUpdate(restaurantId, { rating: avgRating });
  },
};
