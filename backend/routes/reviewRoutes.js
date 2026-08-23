import { Router } from "express";
import { reviewService } from "../services/index.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

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

router.post("/", protect, async (req, res, next) => {
  try {
    const review = await reviewService.createReview(req.user._id, req.body);
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
});

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

router.get("/:id", async (req, res, next) => {
  try {
    const review = await reviewService.getReviewById(req.params.id);
    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
});

export default router;
