import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load .env with absolute path FIRST before any other local imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import express from "express";
import cors from "cors";
import apiRoutes from "./routes/index.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(cors());

// Stripe Webhook needs the raw body to verify signature
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json());

app.use("/api", apiRoutes);

// Error Handling Middleware should be at the end
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
