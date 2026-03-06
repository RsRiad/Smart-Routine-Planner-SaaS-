import {
  createTarget,
  getTodayTargets,
  updateTarget,
} from "../services/target.service.js";

// @desc    Create a new daily target
// @route   POST /api/targets
// @access  Private
export const createTargetHandler = async (req, res) => {
  try {
    const { title, target_value } = req.body;

    if (!title) {
      return res
        .status(400)
        .json({ message: "Title is required for a target." });
    }

    const target = await createTarget(req.user.id, req.body);
    res.status(201).json(target);
  } catch (error) {
    console.error("createTargetHandler error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user's daily targets for today
// @route   GET /api/targets/today
// @access  Private
export const getTodayTargetsHandler = async (req, res) => {
  try {
    const targets = await getTodayTargets(req.user.id);
    res.status(200).json(targets);
  } catch (error) {
    console.error("getTodayTargetsHandler error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update a daily target (progress/status/etc.)
// @route   PUT /api/targets/:id
// @access  Private
export const updateTargetHandler = async (req, res) => {
  try {
    const target = await updateTarget(req.user.id, req.params.id, req.body);
    res.status(200).json(target);
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    console.error("updateTargetHandler error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
