import getPrisma from "../utils/prisma.js";

const getDayOfWeek = (date) => {
  const days = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  return days[date.getDay()];
};

// Generate today's schedule based on user's routine templates
export const generateDailySchedule = async (userId) => {
  const prisma = getPrisma();

  // Use current local time to define "today"
  const now = new Date();
  const options = {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  const formatter = new Intl.DateTimeFormat("en-US", options);
  const parts = formatter.formatToParts(now);
  const month = parts.find((p) => p.type === "month").value;
  const day = parts.find((p) => p.type === "day").value;
  const year = parts.find((p) => p.type === "year").value;

  const todayStart = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  const todayEnd = new Date(`${year}-${month}-${day}T23:59:59.999Z`);
  const currentDayOfWeek = getDayOfWeek(now);

  // Check if schedule for today is already generated
  const existingTodaySchedules = await prisma.dailySchedule.findMany({
    where: {
      userId,
      date: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });

  if (existingTodaySchedules.length > 0) {
    return existingTodaySchedules;
  }

  // Fetch the recurring routines for today (where date is null but dayOfWeek matches)
  const routinesForToday = await prisma.dailySchedule.findMany({
    where: {
      userId,
      dayOfWeek: currentDayOfWeek,
      date: null,
    },
  });

  if (routinesForToday.length === 0) {
    return [];
  }

  // Generate instances for today
  const newSchedulesData = routinesForToday.map((routine) => ({
    userId: routine.userId,
    routineTemplateId: routine.routineTemplateId,
    title: routine.title,
    description: routine.description,
    dayOfWeek: routine.dayOfWeek,
    date: todayStart, // Assign today's date
    startTime: routine.startTime,
    endTime: routine.endTime,
    isCompleted: false,
  }));

  // Create all new schedules
  await prisma.dailySchedule.createMany({
    data: newSchedulesData,
  });

  // Return the newly created schedules
  return await prisma.dailySchedule.findMany({
    where: {
      userId,
      date: todayStart,
    },
    orderBy: {
      startTime: "asc",
    },
  });
};

export const updateTaskStatus = async (userId, scheduleId, statusData) => {
  const prisma = getPrisma();
  const { isCompleted, actualStartTime, actualEndTime } = statusData;

  const scheduleTask = await prisma.dailySchedule.findUnique({
    where: { id: scheduleId },
  });

  if (!scheduleTask || scheduleTask.userId !== userId) {
    throw new Error("Task not found or unauthorized.");
  }

  // Define data to update
  const dataToUpdate = {};
  if (isCompleted !== undefined) dataToUpdate.isCompleted = isCompleted;

  // Allow explicitly setting to null
  if (actualStartTime !== undefined) {
    dataToUpdate.actualStartTime = actualStartTime
      ? new Date(actualStartTime)
      : null;
  }

  if (actualEndTime !== undefined) {
    dataToUpdate.actualEndTime = actualEndTime ? new Date(actualEndTime) : null;
  }

  // Explicit completion toggling logic if only `isCompleted` is provided and times aren't explicitly passed
  if (
    isCompleted === true &&
    actualEndTime === undefined &&
    !scheduleTask.actualEndTime
  ) {
    dataToUpdate.actualEndTime = new Date();
  } else if (isCompleted === false && actualEndTime === undefined) {
    // Revert completion
    dataToUpdate.actualEndTime = null;
  }

  return prisma.dailySchedule.update({
    where: { id: scheduleId },
    data: dataToUpdate,
  });
};

export const getCurrentTask = async (userId) => {
  const prisma = getPrisma();

  const now = new Date();
  const options = {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  const formatter = new Intl.DateTimeFormat("en-US", options);
  const parts = formatter.formatToParts(now);
  const month = parts.find((p) => p.type === "month").value;
  const day = parts.find((p) => p.type === "day").value;
  const year = parts.find((p) => p.type === "year").value;

  const todayStart = new Date(`${year}-${month}-${day}T00:00:00.000Z`);

  // First, look for a task that was actually started but not finished today
  const explicitlyRunningTask = await prisma.dailySchedule.findFirst({
    where: {
      userId,
      date: todayStart,
      actualStartTime: { not: null },
      actualEndTime: null,
      isCompleted: false,
    },
    orderBy: {
      actualStartTime: "desc",
    },
  });

  if (explicitlyRunningTask) {
    return explicitlyRunningTask;
  }

  // If no task is explicitly running, find the task scheduled to be running right now
  // Convert local exact time to minutes since start of local day
  const dhakaFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const timeParts = dhakaFormatter.format(now).split(":");
  const currentMinutes =
    parseInt(timeParts[0], 10) * 60 + parseInt(timeParts[1], 10);

  const todaysTasks = await prisma.dailySchedule.findMany({
    where: {
      userId,
      date: todayStart,
      isCompleted: false,
    },
    orderBy: {
      startTime: "asc",
    },
  });

  const matchingTask = todaysTasks.find((task) => {
    // Convert UTC startTime stored in DB to minutes for comparison
    const startMinutes =
      task.startTime.getUTCHours() * 60 + task.startTime.getUTCMinutes();
    const endMinutes =
      task.endTime.getUTCHours() * 60 + task.endTime.getUTCMinutes();
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  });

  if (matchingTask) {
    return matchingTask;
  }

  // No active task
  return null;
};
