import getPrisma from "../utils/prisma.js";

export const handleCheckoutSessionCompleted = async (session) => {
  const { userId, planId } = session.metadata;

  if (!userId || !planId) {
    console.error("Missing metadata in checkout session:", session.id);
    return;
  }

  const prisma = getPrisma();

  try {
    // 1. Update or Create Subscription
    let subscription = await prisma.subscription.findFirst({
      where: { userId },
    });

    const currentPeriodEnd = new Date(
      session.expires_at
        ? session.expires_at * 1000
        : Date.now() + 30 * 24 * 60 * 60 * 1000,
    ); // Approximation if no end date

    if (subscription) {
      subscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          planId,
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd,
        },
      });
    } else {
      subscription = await prisma.subscription.create({
        data: {
          userId,
          planId,
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd,
        },
      });
    }

    // 2. Create Payment Record
    await prisma.payment.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        amount: session.amount_total / 100, // convert from cents
        currency: session.currency.toUpperCase(),
        status: "COMPLETED",
        paymentDate: new Date(),
        invoiceId: session.invoice || session.payment_intent || session.id,
      },
    });
  } catch (error) {
    console.error("Error handling checkout.session.completed:", error);
  }
};
