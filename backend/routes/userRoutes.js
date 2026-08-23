import { Router } from "express";
import { authService } from "../services/index.js";
import { protect } from "../middleware/authMiddleware.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/register", authLimiter, async (req, res, next) => {
  try {
    const { user, token } = await authService.register(req.body);
    res.status(201).json({ success: true, data: { user, token } });
  } catch (error) {
    next(error);
  }
});

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const { user, token } = await authService.login(req.body);
    res.json({ success: true, data: { user, token } });
  } catch (error) {
    next(error);
  }
});

router.get("/profile", protect, async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user._id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.put("/profile", protect, async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.user._id, req.body);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

export default router;
