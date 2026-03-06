import {
  createStripeCheckoutSession,
  constructStripeEvent,
} from "../services/stripe.service.js";
import { handleCheckoutSessionCompleted } from "../services/payment.service.js";
import getPrisma from "../utils/prisma.js";

// @desc    Create a Stripe checkout session for a subscription
// @route   POST /api/payments/create-checkout-session
// @access  Private
export const createCheckoutSession = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;
    const email = req.user.email;

    const prisma = getPrisma();

    // fetch plan
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    const session = await createStripeCheckoutSession({
      userId,
      email,
      planId,
      planName: plan.name,
      priceAmt: plan.price,
      billingCycle: plan.billingCycle,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe session creation error:", error);
    res.status(500).json({ message: "Failed to create checkout session" });
  }
};

// @desc    Handle Stripe Webhooks
// @route   POST /api/payments/webhook
// @access  Public
export const stripeWebhookHandler = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = constructStripeEvent(req.body, sig);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      await handleCheckoutSessionCompleted(session);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
};
