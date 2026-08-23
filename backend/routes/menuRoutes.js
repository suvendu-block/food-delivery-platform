import { Router } from "express";
import { menuService } from "../services/index.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", protect, requireRole("restaurant", "admin"), async (req, res, next) => {
  try {
    const menuItem = await menuService.createMenu(req.body, req.user._id, req.user.role);
    res.status(201).json({ success: true, data: menuItem });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", protect, requireRole("restaurant", "admin"), async (req, res, next) => {
  try {
    const menuItem = await menuService.updateMenu(
      req.params.id,
      req.body,
      req.user._id,
      req.user.role
    );
    res.json({ success: true, data: menuItem });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", protect, requireRole("restaurant", "admin"), async (req, res, next) => {
  try {
    const result = await menuService.deleteMenu(req.params.id, req.user._id, req.user.role);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
