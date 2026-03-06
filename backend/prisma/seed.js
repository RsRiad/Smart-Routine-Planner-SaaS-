import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding plans...");

  const plans = [
    {
      name: "Free Trial",
      description: "7-day free trial — explore the basics.",
      price: 0.0,
      billingCycle: "MONTHLY",
      features: ["Basic Routine Planning", "Basic Productivity Logging"],
      isActive: true,
    },
    {
      name: "Pro",
      description: "Perfect for individuals who want the full experience.",
      price: 9.99,
      billingCycle: "MONTHLY",
      features: [
        "Unlimited Routines",
        "Advanced Analytics",
        "Priority Support",
        "Custom Templates",
      ],
      isActive: true,
    },
    {
      name: "Enterprise",
      description: "Built for teams and power users.",
      price: 49.99,
      billingCycle: "MONTHLY",
      features: [
        "Everything in Pro",
        "Team Features",
        "API Access",
        "Dedicated Support",
        "Admin Dashboard",
      ],
      isActive: true,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
    console.log(`  ✅ Upserted plan: ${plan.name}`);
  }

  console.log("✅ Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
