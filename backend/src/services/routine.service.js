import getPrisma from "../utils/prisma.js";

const parseTime = (timeStr) => {
  // Expected format: HH:mm
  return new Date(`1970-01-01T${timeStr}:00.000Z`);
};

const toMinutes = (timeValue) => {
  if (typeof timeValue === "string") {
    const [h, m] = timeValue.split(":");
    return parseInt(h, 10) * 60 + parseInt(m, 10);
  }
  return timeValue.getUTCHours() * 60 + timeValue.getUTCMinutes();
};

export const checkOverlap = async (
  userId,
  dayOfWeek,
  startTimeStr,
  endTimeStr,
  excludeId = null,
) => {
  const prisma = getPrisma();

  // Validate the day string exists and is valid
  if (!dayOfWeek) return null;

  const whereClause = {
    userId,
    dayOfWeek,
  };

  if (excludeId) {
    whereClause.id = { not: excludeId };
  }

  const existingRoutines = await prisma.dailySchedule.findMany({
    where: whereClause,
  });

  const newStart = toMinutes(startTimeStr);
  const newEnd = toMinutes(endTimeStr);

  for (const routine of existingRoutines) {
    const existingStart = toMinutes(routine.startTime);
    const existingEnd = toMinutes(routine.endTime);

    // Overlap condition: NewStart < ExistingEnd AND ExistingStart < NewEnd
    if (newStart < existingEnd && existingStart < newEnd) {
      return routine;
    }
  }

  return null;
};

export const createRoutine = async (userId, data) => {
  const { day_of_week, title, description, start_time, end_time } = data;
  const prisma = getPrisma();

  const formattedDay = day_of_week.toUpperCase(); // Ensure uppercase for enum

  if (toMinutes(start_time) >= toMinutes(end_time)) {
    throw new Error("End time must be after start time.");
  }

  const overlap = await checkOverlap(
    userId,
    formattedDay,
    start_time,
    end_time,
  );
  if (overlap) {
    const os = overlap.startTime.toISOString().substr(11, 5);
    const oe = overlap.endTime.toISOString().substr(11, 5);
    throw new Error(
      `Routine overlaps with '${overlap.title}' (${os} - ${oe}) on ${formattedDay}.`,
    );
  }

  return prisma.dailySchedule.create({
    data: {
      userId,
      title,
      description,
      dayOfWeek: formattedDay,
      startTime: parseTime(start_time),
      endTime: parseTime(end_time),
    },
  });
};

export const getRoutines = async (userId) => {
  const prisma = getPrisma();
  return prisma.dailySchedule.findMany({
    where: { userId, dayOfWeek: { not: null } },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
};

export const updateRoutine = async (userId, id, data) => {
  const { day_of_week, title, description, start_time, end_time } = data;
  const prisma = getPrisma();

  const routine = await prisma.dailySchedule.findUnique({ where: { id } });
  if (!routine || routine.userId !== userId) {
    throw new Error("Routine not found or unauthorized.");
  }

  const checkDay = day_of_week ? day_of_week.toUpperCase() : routine.dayOfWeek;
  const checkStart =
    start_time || routine.startTime.toISOString().substr(11, 5);
  const checkEnd = end_time || routine.endTime.toISOString().substr(11, 5);

  if (toMinutes(checkStart) >= toMinutes(checkEnd)) {
    throw new Error("End time must be after start time.");
  }

  const overlap = await checkOverlap(
    userId,
    checkDay,
    checkStart,
    checkEnd,
    id,
  );
  if (overlap) {
    const os = overlap.startTime.toISOString().substr(11, 5);
    const oe = overlap.endTime.toISOString().substr(11, 5);
    throw new Error(
      `Routine overlaps with '${overlap.title}' (${os} - ${oe}) on ${checkDay}.`,
    );
  }

  return prisma.dailySchedule.update({
    where: { id },
    data: {
      title: title ?? routine.title,
      description: description ?? routine.description,
      dayOfWeek: checkDay,
      startTime: start_time ? parseTime(start_time) : routine.startTime,
      endTime: end_time ? parseTime(end_time) : routine.endTime,
    },
  });
};

export const deleteRoutine = async (userId, id) => {
  const prisma = getPrisma();
  const routine = await prisma.dailySchedule.findUnique({ where: { id } });
  if (!routine || routine.userId !== userId) {
    throw new Error("Routine not found or unauthorized.");
  }

  await prisma.dailySchedule.delete({ where: { id } });
  return true;
};
