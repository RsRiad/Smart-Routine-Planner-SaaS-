import getPrisma from "../utils/prisma.js";

// Helper to get today's date (midnight)
const getTodayDateStr = () => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
};

export const createTarget = async (userId, data) => {
  const {
    title,
    target_value,
    current_value,
    unit,
    status,
    priority,
    description,
  } = data;
  const prisma = getPrisma();

  return prisma.dailyTarget.create({
    data: {
      userId,
      title,
      description,
      priority: priority || "MEDIUM",
      targetValue: target_value !== undefined ? parseFloat(target_value) : 0,
      currentValue: current_value !== undefined ? parseFloat(current_value) : 0,
      unit,
      status: status || "PENDING",
      targetDate: getTodayDateStr(),
    },
  });
};

export const getTodayTargets = async (userId) => {
  const prisma = getPrisma();
  const today = getTodayDateStr();

  return prisma.dailyTarget.findMany({
    where: {
      userId,
      targetDate: today,
    },
    orderBy: { createdAt: "asc" },
  });
};

export const updateTarget = async (userId, id, data) => {
  const {
    title,
    target_value,
    current_value,
    unit,
    status,
    priority,
    description,
    isCompleted,
  } = data;
  const prisma = getPrisma();

  const target = await prisma.dailyTarget.findUnique({ where: { id } });

  if (!target || target.userId !== userId) {
    throw new Error("Target not found or unauthorized.");
  }

  // Handle status/isCompleted sync logic if needed
  let updatedStatus = status || target.status;
  let updatedIsCompleted =
    isCompleted !== undefined ? isCompleted : target.isCompleted;

  if (updatedStatus === "COMPLETED") {
    updatedIsCompleted = true;
  } else if (updatedIsCompleted && !status) {
    updatedStatus = "COMPLETED";
  }

  // If current_value reaches target_value, auto complete
  let checkCurrentValue =
    current_value !== undefined
      ? parseFloat(current_value)
      : target.currentValue;
  let checkTargetValue =
    target_value !== undefined ? parseFloat(target_value) : target.targetValue;

  if (
    checkCurrentValue >= checkTargetValue &&
    checkTargetValue > 0 &&
    !updatedIsCompleted
  ) {
    updatedStatus = "COMPLETED";
    updatedIsCompleted = true;
  }

  return prisma.dailyTarget.update({
    where: { id },
    data: {
      title: title ?? target.title,
      description: description ?? target.description,
      priority: priority ?? target.priority,
      targetValue: checkTargetValue,
      currentValue: checkCurrentValue,
      unit: unit ?? target.unit,
      status: updatedStatus,
      isCompleted: updatedIsCompleted,
    },
  });
};
