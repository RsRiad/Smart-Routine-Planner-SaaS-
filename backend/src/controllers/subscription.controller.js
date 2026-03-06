import {
  getUserSubscription,
  getAllPlans,
  changePlan,
  cancelSubscription,
  reactivateSubscription,
  expireTrials,
  expireActiveSubscriptions,
} from "../services/subscription.service.js";

// @desc    Get the current user's subscription
// @route   GET /api/subscriptions/me
// @access  Private
export const getMySubscription = async (req, res) => {
  try {
    // Run expiry checks eagerly on every fetch (no cron needed for now)
    await expireTrials();
    await expireActiveSubscriptions();

    const subscription = await getUserSubscription(req.user.id);

    if (!subscription) {
      return res.status(404).json({ message: "No subscription found." });
    }

    res.json(subscription);
  } catch (error) {
    console.error("getMySubscription error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all active plans
// @route   GET /api/subscriptions/plans
// @access  Public
export const getPlans = async (req, res) => {
  try {
    const plans = await getAllPlans();
    res.json(plans);
  } catch (error) {
    console.error("getPlans error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Upgrade or downgrade plan
// @route   PUT /api/subscriptions/change-plan
// @access  Private
export const changePlanHandler = async (req, res) => {
  const { planId } = req.body;

  if (!planId) {
    return res.status(400).json({ message: "planId is required." });
  }

  try {
    const updated = await changePlan(req.user.id, planId);
    res.json({ message: "Plan updated successfully.", subscription: updated });
  } catch (error) {
    console.error("changePlan error:", error);
    const status = error.message.includes("not found") ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

// @desc    Cancel current subscription
// @route   POST /api/subscriptions/cancel
// @access  Private
export const cancelSubscriptionHandler = async (req, res) => {
  try {
    const canceled = await cancelSubscription(req.user.id);
    res.json({ message: "Subscription canceled.", subscription: canceled });
  } catch (error) {
    console.error("cancelSubscription error:", error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Reactivate a canceled subscription
// @route   POST /api/subscriptions/reactivate
// @access  Private
export const reactivateSubscriptionHandler = async (req, res) => {
  try {
    const reactivated = await reactivateSubscription(req.user.id);
    res.json({
      message: "Subscription reactivated.",
      subscription: reactivated,
    });
  } catch (error) {
    console.error("reactivateSubscription error:", error);
    res.status(400).json({ message: error.message });
  }
};
