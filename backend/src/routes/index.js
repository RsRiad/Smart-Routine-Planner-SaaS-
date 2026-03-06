import express from "express";
import { getHealth } from "../controllers/healthController.js";
import authRoutes from "./auth.routes.js";
import subscriptionRoutes from "./subscription.routes.js";
import routineRoutes from "./routine.routes.js";
import scheduleRoutes from "./schedule.routes.js";
import targetRoutes from "./target.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import adminRoutes from "./admin.routes.js";
import paymentRoutes from "./payment.routes.js";

const router = express.Router();

router.get("/health", getHealth);
router.use("/auth", authRoutes);
router.use("/payments", paymentRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/routines", routineRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/targets", targetRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/admin", adminRoutes);

export default router;
