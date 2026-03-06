import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createCheckoutSession,
  stripeWebhookHandler,
} from "../controllers/payment.controller.js";

const router = express.Router();

// Private — must be logged in to create a checkout session
router.post("/create-checkout-session", protect, createCheckoutSession);

// Public — Stripe sends webhook events here
router.post("/webhook", stripeWebhookHandler);

export default router;
