import { checkHealth } from "../services/healthService.js";
import { sendSuccess } from "../utils/response.js";

export const getHealth = (req, res, next) => {
  try {
    const healthStatus = checkHealth();
    sendSuccess(res, 200, "Smart Routine Planner API is running", healthStatus);
  } catch (error) {
    next(error);
  }
};
