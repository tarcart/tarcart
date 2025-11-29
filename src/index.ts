import express from "express";
import cors from "cors";
import path from "path";

import stationsRouter from "./stations";
import submissionsRouter from "./routes/submissions";
import adminRouter from "./routes/admin";
import authRouter from "./routes/auth";
import analyticsRouter from "./routes/analytics";

const app = express();
const port = process.env.PORT || 8080;

// --- Middleware --------------------------------------------------------------
app.use(cors());
app.use(express.json());

// --- Static assets (gas.html and friends) -----------------------------------

// Resolve the public/ directory at runtime (dist is in /dist, public is .. /public)
const publicDir = path.join(__dirname, "..", "public");

// Serve everything inside public/ at its filename (e.g. /gas.html)
app.use(express.static(publicDir));

// Explicit helper routes for gas page
app.get(["/gas", "/gas.html"], (_req, res) => {
  res.sendFile(path.join(publicDir, "gas.html"));
});

// --- Health / root -----------------------------------------------------------
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (_req, res) => {
  res.json({ status: "tarcart-api", ok: true });
});

// --- API routes --------------------------------------------------------------
app.use("/api/analytics", analyticsRouter);
app.use("/api/stations", stationsRouter);
app.use("/api/price-submissions", submissionsRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);

// --- Fallback error handler --------------------------------------------------
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error in Express:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// --- Start server ------------------------------------------------------------
app.listen(port, () => {
  console.log(`Tarcart API listening on port ${port}`);
});
