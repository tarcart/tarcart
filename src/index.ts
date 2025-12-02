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

app.use(cors());
app.use(express.json());

// ---------- Static Frontend ----------
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

// ---------- Health Check ----------
app.get("/health", (_req, res) => {
  res.send("Tarcart API is running.");
});

// ---------- Frontend Routes ----------
app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "gas.html"));
});

app.get(["/gas", "/gas.html"], (_req, res) => {
  res.sendFile(path.join(publicDir, "gas.html"));
});

app.get(["/admin", "/admin.html"], (_req, res) => {
  res.sendFile(path.join(publicDir, "admin.html"));
});

// ---------- API Routes ----------
app.use("/api/stations", stationsRouter);
app.use("/api/price-submissions", submissionsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);

// ---------- Start Server ----------
app.listen(port, () => {
  console.log(`Tarcart API listening on port ${port}`);
});
