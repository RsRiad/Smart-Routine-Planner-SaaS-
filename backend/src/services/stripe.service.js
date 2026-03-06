import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export const createStripeCheckoutSession = async ({
  userId,
  email,
  planId,
  planName,
  priceAmt,
  billingCycle,
  successUrl,
  cancelUrl,
}) => {
  const interval = billingCycle === "YEARLY" ? "year" : "month";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    customer_email: email,
    client_reference_id: userId,
    metadata: {
      userId,
      planId,
    },
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: planName,
          },
          unit_amount: Math.round(Number(priceAmt) * 100), // convert to cents
          recurring: {
            interval,
          },
        },
        quantity: 1,
      },
    ],
    success_url:
      successUrl ||
      `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/payment/cancel`,
  });

  return session;
};

export const constructStripeEvent = (rawBody, signature) => {
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET,
  );
};
