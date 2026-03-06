import express from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";
import {
  getAllUsers,
  toggleUserSuspension,
  getPlans,
  createPlan,
  updatePlan,
  getAllPayments,
  extendTrial,
} from "../controllers/admin.controller.js";

const router = express.Router();

// Apply middleware to all routes in this file
router.use(protect);
router.use(authorize("ADMIN"));

// User management routes
router.route("/users").get(getAllUsers);
router.route("/users/:id/suspend").put(toggleUserSuspension);

// Plan management routes
router.route("/plans").get(getPlans).post(createPlan);
router.route("/plans/:id").put(updatePlan);

// Payment routes
router.route("/payments").get(getAllPayments);

// Subscription routes
router.route("/subscriptions/:id/extend-trial").put(extendTrial);

export default router;
