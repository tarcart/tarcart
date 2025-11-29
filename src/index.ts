import express from "express";
import cors from "cors";

import stationsRouter from "./stations";
import submissionsRouter from "./routes/submissions";
import adminRouter from "./routes/admin";
import authRouter from "./routes/auth";
import analyticsRouter from "./routes/analytics";

const app = express();
const PORT = process.env.PORT || 8080;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// API routes
app.use("/api/stations", stationsRouter);
app.use("/api/submissions", submissionsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/analytics", analyticsRouter);

// Root – just a tiny message so hitting "/" doesn't 404
app.get("/", (_req, res) => {
  res.json({
    name: "Tarcart API",
    status: "running",
  });
});

// Start server
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Tarcart API listening on port ${PORT}`);
});
