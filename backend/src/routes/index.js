import express from "express";
import { getHealth } from "../controllers/healthController.js";
import authRoutes from "./auth.routes.js";

const router = express.Router();

router.get("/health", getHealth);
router.use("/auth", authRoutes);

export default router;
