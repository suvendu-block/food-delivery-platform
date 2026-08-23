import { Router } from "express";
import { orderService } from "../services/index.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import { orderLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// @route   GET /api/orders/user/me
// @desc    Get current user's orders
// @access  Private
// NOTE: This MUST be before /:id to avoid Express matching "user" as :id
router.get("/user/me", protect, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const result = await orderService.getUserOrders(req.user._id, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/orders/restaurant/:restaurantId
// @desc    Get orders for a restaurant (owner or admin)
// @access  Private + restaurant owner or admin
// NOTE: Must be before /:id to avoid Express matching "restaurant" as :id
router.get("/restaurant/:restaurantId", protect, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const result = await orderService.getRestaurantOrders(
      req.params.restaurantId,
      req.user._id,
      req.user.role,
      page,
      limit
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post("/", protect, orderLimiter, async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.user._id, req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status (admin only)
// @access  Private + admin
router.put("/:id/status", protect, requireRole("admin"), async (req, res, next) => {
  try {
    const order = await orderService.updateStatus(
      req.params.id,
      req.body.status,
      req.user.role
    );
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private (owner or admin)
router.get("/:id", protect, async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(
      req.params.id,
      req.user._id,
      req.user.role
    );
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

export default router;
