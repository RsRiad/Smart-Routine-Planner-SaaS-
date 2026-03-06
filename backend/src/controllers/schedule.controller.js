import {
  generateDailySchedule,
  updateTaskStatus,
  getCurrentTask,
} from "../services/schedule.service.js";

// @desc    Generate daily schedule based on routines
// @route   POST /api/schedules/generate
// @access  Private
export const generateDailyScheduleHandler = async (req, res) => {
  try {
    const schedules = await generateDailySchedule(req.user.id);
    res.status(200).json(schedules);
  } catch (error) {
    console.error("generateDailyScheduleHandler error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update status of a scheduled task
// @route   PUT /api/schedules/:id/status
// @access  Private
export const updateTaskStatusHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await updateTaskStatus(req.user.id, id, req.body);
    res.status(200).json(task);
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    console.error("updateTaskStatusHandler error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get current running task
// @route   GET /api/schedules/current
// @access  Private
export const getCurrentTaskHandler = async (req, res) => {
  try {
    const currentTask = await getCurrentTask(req.user.id);
    if (!currentTask) {
      return res
        .status(200)
        .json({ message: "No active task found", task: null });
    }
    res.status(200).json({ task: currentTask });
  } catch (error) {
    console.error("getCurrentTaskHandler error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
