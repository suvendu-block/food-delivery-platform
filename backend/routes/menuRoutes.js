import { Router } from "express";
import { menuService } from "../services/index.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// @route   POST /api/menus
// @desc    Create a menu item for a restaurant
// @access  Private + restaurant owner or admin
router.post("/", protect, requireRole("restaurant", "admin"), async (req, res, next) => {
  try {
    const menuItem = await menuService.createMenu(req.body, req.user._id, req.user.role);
    res.status(201).json({ success: true, data: menuItem });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/menus/:id
// @desc    Update a menu item
// @access  Private + restaurant owner or admin
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

// @route   DELETE /api/menus/:id
// @desc    Delete a menu item
// @access  Private + restaurant owner or admin
router.delete("/:id", protect, requireRole("restaurant", "admin"), async (req, res, next) => {
  try {
    const result = await menuService.deleteMenu(req.params.id, req.user._id, req.user.role);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
