import getPrisma from "../utils/prisma.js";

const ACTIVE_STATUSES = ["TRIALING", "ACTIVE"];

/**
 * Get the current (latest) subscription for a user, including plan details.
 */
export const getUserSubscription = async (userId) => {
  const prisma = getPrisma();
  return prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  });
};

/**
 * Returns true if the user has an active or trialing subscription.
 */
export const checkSubscriptionAccess = async (userId) => {
  const prisma = getPrisma();
  const now = new Date();

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ACTIVE_STATUSES },
      currentPeriodEnd: { gte: now },
    },
    orderBy: { createdAt: "desc" },
  });

  return !!subscription;
};

/**
 * Get all active plans.
 */
export const getAllPlans = async () => {
  const prisma = getPrisma();
  return prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });
};

/**
 * Change the user's current subscription plan (upgrade or downgrade).
 * Resets the billing period to now → +30 days and sets status to ACTIVE.
 */
export const changePlan = async (userId, newPlanId) => {
  const prisma = getPrisma();

  // Ensure the target plan exists
  const plan = await prisma.plan.findUnique({ where: { id: newPlanId } });
  if (!plan || !plan.isActive) {
    throw new Error("Plan not found or inactive.");
  }

  // Get the user's current subscription
  const subscription = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    throw new Error("No subscription found for this user.");
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30);

  return prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      planId: newPlanId,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      // Clear trial dates on plan change
      trialStartDate: null,
      trialEndDate: null,
    },
    include: { plan: true },
  });
};

/**
 * Cancel the user's subscription immediately.
 */
export const cancelSubscription = async (userId) => {
  const prisma = getPrisma();

  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: { in: ACTIVE_STATUSES } },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    throw new Error("No active subscription found to cancel.");
  }

  return prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: "CANCELED",
      cancelAtPeriodEnd: true,
    },
    include: { plan: true },
  });
};

/**
 * Reactivate a canceled subscription on the same plan, resetting the billing period.
 */
export const reactivateSubscription = async (userId) => {
  const prisma = getPrisma();

  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: "CANCELED" },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    throw new Error("No canceled subscription found to reactivate.");
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30);

  return prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: "ACTIVE",
      cancelAtPeriodEnd: false,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
    include: { plan: true },
  });
};

/**
 * Batch job: expire all TRIALING subscriptions where trialEndDate has passed.
 * Call this on a schedule (e.g., cron job) or on each request.
 */
export const expireTrials = async () => {
  const prisma = getPrisma();
  const now = new Date();

  const result = await prisma.subscription.updateMany({
    where: {
      status: "TRIALING",
      trialEndDate: { lt: now },
    },
    data: { status: "EXPIRED" },
  });

  return result.count;
};

/**
 * Expire subscriptions whose currentPeriodEnd has passed and status is ACTIVE.
 */
export const expireActiveSubscriptions = async () => {
  const prisma = getPrisma();
  const now = new Date();

  const result = await prisma.subscription.updateMany({
    where: {
      status: "ACTIVE",
      currentPeriodEnd: { lt: now },
      cancelAtPeriodEnd: false,
    },
    data: { status: "EXPIRED" },
  });

  return result.count;
};
