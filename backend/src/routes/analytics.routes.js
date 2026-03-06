import express from "express";
import { getDashboardMetrics } from "../controllers/analytics.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/dashboard", getDashboardMetrics);

export default router;
