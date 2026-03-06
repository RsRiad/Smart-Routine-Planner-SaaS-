import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getDashboardMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Calculate dates for the last 7 days (0:00:00 of the 7th day ago to 23:59:59 of today)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Total Study Hours & Tasks Completed
    // We only care about schedules that have actualStartTime and actualEndTime
    const completedSchedules = await prisma.dailySchedule.findMany({
      where: {
        userId,
        isCompleted: true,
        actualStartTime: { not: null },
        actualEndTime: { not: null },
      },
    });

    let totalStudyHours = 0;
    completedSchedules.forEach((schedule) => {
      // Calculate duration in hours
      const durationMs =
        schedule.actualEndTime.getTime() - schedule.actualStartTime.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);

      // Prevent negative hours (e.g., if end time is next day without proper setup)
      if (durationHours > 0) {
        totalStudyHours += durationHours;
      }
    });

    const tasksCompleted = completedSchedules.length;

    // 2. Target Completion Rate
    const totalTargets = await prisma.dailyTarget.count({
      where: { userId },
    });

    const completedTargets = await prisma.dailyTarget.count({
      where: {
        userId,
        OR: [{ status: "COMPLETED" }, { isCompleted: true }],
      },
    });

    const targetCompletionRate =
      totalTargets > 0 ? (completedTargets / totalTargets) * 100 : 0;

    // 3. Weekly Productivity Score
    const recentLogs = await prisma.productivityLog.findMany({
      where: {
        userId,
        date: {
          gte: sevenDaysAgo,
          lte: endOfDay,
        },
      },
    });

    let weeklyProductivityScore = 0;
    if (recentLogs.length > 0) {
      const totalScore = recentLogs.reduce((acc, log) => acc + log.score, 0);
      weeklyProductivityScore = totalScore / recentLogs.length;
    }

    // 4. Chart Data (Daily Breakdown for the last 7 days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const dateTarget = new Date(now);
      dateTarget.setDate(dateTarget.getDate() - i);

      const gte = new Date(dateTarget);
      gte.setHours(0, 0, 0, 0);

      const lte = new Date(dateTarget);
      lte.setHours(23, 59, 59, 999);

      // Schedules for this specific day
      const daySchedules = completedSchedules.filter(
        (s) => s.actualEndTime >= gte && s.actualEndTime <= lte,
      );

      let dayStudyHours = 0;
      daySchedules.forEach((schedule) => {
        const durationMs =
          schedule.actualEndTime.getTime() - schedule.actualStartTime.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);
        if (durationHours > 0) dayStudyHours += durationHours;
      });

      // Target Completion Rate for this day
      // Assuming targetDate is the key field
      const dayTotalTargets = await prisma.dailyTarget.count({
        where: {
          userId,
          targetDate: { gte, lte },
        },
      });

      const dayCompletedTargets = await prisma.dailyTarget.count({
        where: {
          userId,
          targetDate: { gte, lte },
          OR: [{ status: "COMPLETED" }, { isCompleted: true }],
        },
      });

      const dayTargetRate =
        dayTotalTargets > 0 ? (dayCompletedTargets / dayTotalTargets) * 100 : 0;

      // Productivity score for this day
      const dayLog = recentLogs.find(
        (log) => log.date >= gte && log.date <= lte,
      );
      const dayProductivityScore = dayLog ? dayLog.score : 0;

      chartData.push({
        date: dateTarget.toISOString().split("T")[0], // YYYY-MM-DD
        studyHours: parseFloat(dayStudyHours.toFixed(2)),
        tasksCompleted: daySchedules.length,
        targetCompletionRate: parseFloat(dayTargetRate.toFixed(2)),
        productivityScore: dayProductivityScore,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalStudyHours: parseFloat(totalStudyHours.toFixed(2)),
        tasksCompleted,
        targetCompletionRate: parseFloat(targetCompletionRate.toFixed(2)),
        weeklyProductivityScore: parseFloat(weeklyProductivityScore.toFixed(2)),
        chartData,
      },
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching metrics",
      error: error.message,
    });
  }
};
