import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createRoutineHandler,
  getRoutinesHandler,
  updateRoutineHandler,
  deleteRoutineHandler,
} from "../controllers/routine.controller.js";

const router = express.Router();

// All routine routes require authentication
router.use(protect);

router.post("/", createRoutineHandler);
router.get("/", getRoutinesHandler);
router.put("/:id", updateRoutineHandler);
router.delete("/:id", deleteRoutineHandler);

export default router;
