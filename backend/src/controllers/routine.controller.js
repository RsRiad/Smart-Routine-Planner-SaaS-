import {
  createRoutine,
  getRoutines,
  updateRoutine,
  deleteRoutine,
} from "../services/routine.service.js";

// @desc    Create a new routine
// @route   POST /api/routines
// @access  Private
export const createRoutineHandler = async (req, res) => {
  try {
    const { day_of_week, title, start_time, end_time } = req.body;

    if (!day_of_week || !title || !start_time || !end_time) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const routine = await createRoutine(req.user.id, req.body);
    res.status(201).json(routine);
  } catch (error) {
    if (
      error.message.includes("overlaps") ||
      error.message.includes("after start")
    ) {
      return res.status(409).json({ message: error.message });
    }
    console.error("createRoutineHandler error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user's routines
// @route   GET /api/routines
// @access  Private
export const getRoutinesHandler = async (req, res) => {
  try {
    const routines = await getRoutines(req.user.id);
    res.status(200).json(routines);
  } catch (error) {
    console.error("getRoutinesHandler error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update a routine
// @route   PUT /api/routines/:id
// @access  Private
export const updateRoutineHandler = async (req, res) => {
  try {
    const routine = await updateRoutine(req.user.id, req.params.id, req.body);
    res.status(200).json(routine);
  } catch (error) {
    if (
      error.message.includes("overlaps") ||
      error.message.includes("after start")
    ) {
      return res.status(409).json({ message: error.message });
    }
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    console.error("updateRoutineHandler error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a routine
// @route   DELETE /api/routines/:id
// @access  Private
export const deleteRoutineHandler = async (req, res) => {
  try {
    await deleteRoutine(req.user.id, req.params.id);
    res.status(200).json({ message: "Routine deleted successfully." });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    console.error("deleteRoutineHandler error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
