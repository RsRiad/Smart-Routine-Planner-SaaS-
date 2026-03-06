import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  generateDailyScheduleHandler,
  updateTaskStatusHandler,
  getCurrentTaskHandler,
} from "../controllers/schedule.controller.js";

const router = express.Router();

router.use(protect);

router.post("/generate", generateDailyScheduleHandler);
router.get("/current", getCurrentTaskHandler);
router.put("/:id/status", updateTaskStatusHandler);

export default router;
