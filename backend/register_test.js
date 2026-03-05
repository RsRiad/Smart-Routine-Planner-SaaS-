import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

(async () => {
  try {
    const email = "testdirect@example.com";
    const password = "Test1234!";
    const name = "Direct Test";

    // Step 1: Check if user exists
    console.log("Step 1: findUnique...");
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      console.log("User already exists, deleting for clean test...");
      await prisma.subscription.deleteMany({
        where: { userId: userExists.id },
      });
      await prisma.user.delete({ where: { email } });
    }

    // Step 2: Bcrypt
    console.log("Step 2: bcrypt...");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 3: Plan
    console.log("Step 3: find/create plan...");
    let plan = await prisma.plan.findFirst({ where: { name: "Free Trial" } });
    if (!plan) {
      plan = await prisma.plan.create({
        data: {
          name: "Free Trial",
          description: "7-day free trial plan",
          price: 0.0,
          billingCycle: "MONTHLY",
          features: ["Basic Routine Planning"],
        },
      });
    }
    console.log("Plan:", plan.id, plan.name);

    // Step 4: Create user
    console.log("Step 4: create user...");
    const newUser = await prisma.user.create({
      data: { email, password: hashedPassword, name },
    });
    console.log("User created:", newUser.id);

    // Step 5: Create subscription
    console.log("Step 5: create subscription...");
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7);
    const sub = await prisma.subscription.create({
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
    console.log("Subscription created:", sub.id);

    // Step 6: JWT
    console.log("Step 6: JWT...");
    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    console.log("Token generated:", token.slice(0, 30) + "...");

    console.log("\n✅ All steps passed successfully!");
  } catch (e) {
    console.error("STEP FAILED:", e.message);
    console.error("CODE:", e.code);
    console.error("STACK:", e.stack);
  } finally {
    await prisma.$disconnect();
  }
})();
