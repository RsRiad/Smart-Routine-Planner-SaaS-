import getPrisma from "../utils/prisma.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  const { email, password, name } = req.body;

  // Get prisma client lazily (after env vars are loaded)
  const prisma = getPrisma();

  try {
    // Check if user already exists
    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Get or create a default free plan for the trial
    let plan = await prisma.plan.findFirst({
      where: { name: "Free Trial" },
    });

    if (!plan) {
      plan = await prisma.plan.create({
        data: {
          name: "Free Trial",
          description: "7-day free trial plan",
          price: 0.0,
          billingCycle: "MONTHLY",
          features: ["Basic Routine Planning", "Basic Productivity Logging"],
        },
      });
    }

    // Set trial dates (7 days from now)
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Create 7-day trial subscription for the new user
    await prisma.subscription.create({
      data: {
        userId: newUser.id,
        planId: plan.id,
        status: "TRIALING",
        trialStartDate,
        trialEndDate,
        currentPeriodStart: trialStartDate,
        currentPeriodEnd: trialEndDate,
      },
    });

    // Generate JWT
    const token = generateToken(newUser.id);

    res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      trialEndsAt: trialEndDate,
      token,
    });
  } catch (error) {
    console.error("Register Error: ", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  const { email, password } = req.body;

  // Get prisma client lazily (after env vars are loaded)
  const prisma = getPrisma();

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = generateToken(user.id);

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error("Login Error: ", error);
    res.status(500).json({ message: "Server error" });
  }
};
