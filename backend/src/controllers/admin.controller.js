import getPrisma from "../utils/prisma.js";

// @desc    Get all users with their subscriptions
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  const prisma = getPrisma();
  try {
    const users = await prisma.user.findMany({
      include: {
        subscriptions: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (error) {
    console.error("getAllUsers error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Toggle user suspension status
// @route   PUT /api/admin/users/:id/suspend
// @access  Private/Admin
export const toggleUserSuspension = async (req, res) => {
  const prisma = getPrisma();
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });

    res.json({
      message: `User ${updatedUser.isActive ? "unsuspended" : "suspended"} successfully.`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    console.error("toggleUserSuspension error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all subscription plans
// @route   GET /api/admin/plans
// @access  Private/Admin
export const getPlans = async (req, res) => {
  const prisma = getPrisma();
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(plans);
  } catch (error) {
    console.error("getPlans error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create a new plan
// @route   POST /api/admin/plans
// @access  Private/Admin
export const createPlan = async (req, res) => {
  const prisma = getPrisma();
  const { name, description, price, billingCycle, features, isActive } =
    req.body;

  try {
    const plan = await prisma.plan.create({
      data: {
        name,
        description,
        price,
        billingCycle,
        features: features || [],
        isActive: isActive !== undefined ? isActive : true,
      },
    });
    res.status(201).json(plan);
  } catch (error) {
    console.error("createPlan error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update an existing plan
// @route   PUT /api/admin/plans/:id
// @access  Private/Admin
export const updatePlan = async (req, res) => {
  const prisma = getPrisma();
  const { id } = req.params;
  const { name, description, price, billingCycle, features, isActive } =
    req.body;

  try {
    const plan = await prisma.plan.update({
      where: { id },
      data: {
        name,
        description,
        price,
        billingCycle,
        features,
        isActive,
      },
    });
    res.json(plan);
  } catch (error) {
    console.error("updatePlan error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all payments
// @route   GET /api/admin/payments
// @access  Private/Admin
export const getAllPayments = async (req, res) => {
  const prisma = getPrisma();
  try {
    const payments = await prisma.payment.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        subscription: { include: { plan: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(payments);
  } catch (error) {
    console.error("getAllPayments error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Extend a user's trial
// @route   PUT /api/admin/subscriptions/:id/extend-trial
// @access  Private/Admin
export const extendTrial = async (req, res) => {
  const prisma = getPrisma();
  const { id } = req.params;
  const { daysToExtend } = req.body;

  if (!daysToExtend || daysToExtend <= 0) {
    return res
      .status(400)
      .json({ message: "Please provide a valid number of days to extend." });
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    if (!subscription.trialEndDate) {
      return res
        .status(400)
        .json({ message: "This subscription does not have a trial period." });
    }

    const currentTrialEnd = new Date(subscription.trialEndDate);
    const newTrialEnd = new Date(
      currentTrialEnd.setDate(currentTrialEnd.getDate() + daysToExtend),
    );

    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        trialEndDate: newTrialEnd,
        status: "TRIALING", // Ensure the status is set back to trialing if it was expired
      },
    });

    res.json({
      message: `Trial extended by ${daysToExtend} days.`,
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error("extendTrial error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
