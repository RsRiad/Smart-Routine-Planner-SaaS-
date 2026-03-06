import express from "express";
import {
  createTargetHandler,
  getTodayTargetsHandler,
  updateTargetHandler,
} from "../controllers/target.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router.post("/", createTargetHandler);
router.get("/today", getTodayTargetsHandler);
router.put("/:id", updateTargetHandler);

export default router;
