import express from "express";
import cors from "cors";
import path from "path";
import stationsRouter from "./stations";

const app = express();

// Prefer env PORT from DigitalOcean, fallback to 8080 for local dev
const port = Number(process.env.PORT) || 8080;

// --- Middleware --------------------------------------------------------------

// Allow the frontend (same origin or local dev) to call the API
app.use(cors());
app.use(express.json());

// Serve static assets (gas.html, logo, etc.) from ../public in the compiled build.
// When TypeScript compiles to dist/, __dirname will be /dist, so we go one level up.
const publicDir = path.join(__dirname, "../public");
app.use(express.static(publicDir));

// --- Health check ------------------------------------------------------------

// Simple health endpoint for DigitalOcean / your own checks
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// --- API routes --------------------------------------------------------------

// Stations API (what gas.html calls)
app.use("/api/stations", stationsRouter);

// --- Optional: friendly root + /gas redirect --------------------------------

// Root can just confirm the API is running
app.get("/", (_req, res) => {
  res.json({ service: "Tarcart API", status: "running" });
});

// Convenience route: /gas -> serve the dashboard HTML
app.get("/gas", (_req, res) => {
  res.sendFile(path.join(publicDir, "gas.html"));
});

// --- Start server ------------------------------------------------------------

app.listen(port, () => {
  console.log(`Tarcart API listening on port ${port}`);
});
