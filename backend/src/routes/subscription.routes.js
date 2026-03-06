import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getMySubscription,
  getPlans,
  changePlanHandler,
  cancelSubscriptionHandler,
  reactivateSubscriptionHandler,
} from "../controllers/subscription.controller.js";

const router = express.Router();

// Public — anyone can browse plans
router.get("/plans", getPlans);

// Private — must be logged in
router.get("/me", protect, getMySubscription);
router.put("/change-plan", protect, changePlanHandler);
router.post("/cancel", protect, cancelSubscriptionHandler);
router.post("/reactivate", protect, reactivateSubscriptionHandler);

export default router;
