import { Router } from "express";
import { restaurantService } from "../services/index.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const restaurants = await restaurantService.getAllOpen();
    res.json({ success: true, data: restaurants });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const restaurant = await restaurantService.getById(req.params.id);
    res.json({ success: true, data: restaurant });
  } catch (error) {
    next(error);
  }
});

router.post("/", protect, requireRole("restaurant"), async (req, res, next) => {
  try {
    const restaurant = await restaurantService.create(req.body, req.user._id);
    res.status(201).json({ success: true, data: restaurant });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", protect, requireRole("restaurant", "admin"), async (req, res, next) => {
  try {
    const restaurant = await restaurantService.update(
      req.params.id,
      req.body,
      req.user._id,
      req.user.role
    );
    res.json({ success: true, data: restaurant });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/menu", async (req, res, next) => {
  try {
    const menuItems = await restaurantService.getMenu(req.params.id);
    res.json({ success: true, data: menuItems });
  } catch (error) {
    next(error);
  }
});

export default router;
