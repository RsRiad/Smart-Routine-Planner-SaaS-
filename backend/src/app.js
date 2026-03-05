import "dotenv/config";
import express from "express";
import cors from "cors";
import apiRoutes from "./routes/index.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", apiRoutes);

// Error Handling Middleware should be at the end
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
