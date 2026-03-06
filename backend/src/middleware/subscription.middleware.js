import {
  getUserSubscription,
  expireTrials,
  expireActiveSubscriptions,
} from "../services/subscription.service.js";

/**
 * Middleware: requireActiveSubscription
 *
 * Must be used AFTER `protect` (auth middleware), as it relies on `req.user`.
 *
 * Runs expiry checks eagerly, then verifies the user has a TRIALING or ACTIVE
 * subscription. Returns 403 if the subscription is EXPIRED, CANCELED, or missing.
 *
 * Usage:
 *   router.get("/premium-feature", protect, requireActiveSubscription, handler);
 */
export const requireActiveSubscription = async (req, res, next) => {
  try {
    // Eagerly expire stale trials and past-due active subs
    await expireTrials();
    await expireActiveSubscriptions();

    const subscription = await getUserSubscription(req.user.id);

    if (!subscription) {
      return res.status(403).json({
        message:
          "No subscription found. Please subscribe to access this feature.",
        code: "NO_SUBSCRIPTION",
      });
    }

    const { status } = subscription;

    if (status === "TRIALING" || status === "ACTIVE") {
      // Attach subscription info to req for downstream handlers
      req.subscription = subscription;
      return next();
    }

    const messages = {
      EXPIRED: "Your subscription has expired. Please renew to continue.",
      CANCELED:
        "Your subscription has been canceled. Please reactivate to continue.",
      PAST_DUE: "Your payment is past due. Please update your payment method.",
      UNPAID:
        "Your subscription is unpaid. Please settle outstanding payments.",
    };

    return res.status(403).json({
      message: messages[status] ?? "Subscription is not active.",
      code: status,
      subscriptionStatus: status,
    });
  } catch (error) {
    console.error("requireActiveSubscription error:", error);
    res
      .status(500)
      .json({ message: "Server error while checking subscription." });
  }
};
