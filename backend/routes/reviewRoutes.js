import { Router } from "express";
import { reviewService } from "../services/index.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// @route   GET /api/reviews/restaurant/:restaurantId
// @desc    Get reviews for a restaurant (paginated)
// @access  Public
// NOTE: MUST be before /:id to avoid Express matching "restaurant" as review ID
router.get("/restaurant/:restaurantId", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const result = await reviewService.getReviewsByRestaurant(
      req.params.restaurantId,
      page,
      limit
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/reviews
// @desc    Create a review for a restaurant
// @access  Private
router.post("/", protect, async (req, res, next) => {
  try {
    const review = await reviewService.createReview(req.user._id, req.body);
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update a review
// @access  Private (owner or admin)
router.put("/:id", protect, async (req, res, next) => {
  try {
    const review = await reviewService.updateReview(
      req.params.id,
      req.user._id,
      req.body,
      req.user.role
    );
    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Private (owner or admin)
router.delete("/:id", protect, async (req, res, next) => {
  try {
    const result = await reviewService.deleteReview(
      req.params.id,
      req.user._id,
      req.user.role
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/reviews/:id
// @desc    Get a single review by ID
// @access  Public
router.get("/:id", async (req, res, next) => {
  try {
    const review = await reviewService.getReviewById(req.params.id);
    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
});

export default router;
