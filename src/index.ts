import express, { Request, Response } from "express";
import cors from "cors";
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Static assets (after build, dist/index.js will see dist/public)
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

// Optional: redirect root to gas view
app.get("/", (_req: Request, res: Response) => {
  res.redirect("/gas.html");
});

// --- API: stations ------------------------------------------------------------

// GET all stations (used by gas.html & admin.html)
app.get("/api/stations", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        brand,
        address,
        city,
        state,
        latitude,
        longitude,
        is_home,
        prices_cents
      FROM stations
      ORDER BY id ASC;
    `
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error in GET /api/stations", err);
    res.status(500).json({ error: "Failed to load stations" });
  }
});

// Create a new station (optional, used only if you want it)
app.post("/api/stations", async (req: Request, res: Response) => {
  const {
    name,
    brand,
    address,
    city,
    state,
    latitude,
    longitude,
    is_home,
    prices_cents,
  } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO stations
        (name, brand, address, city, state, latitude, longitude, is_home, prices_cents)
      VALUES
        ($1,   $2,    $3,      $4,   $5,   $6,       $7,        $8,      $9)
      RETURNING
        id,
        name,
        brand,
        address,
        city,
        state,
        latitude,
        longitude,
        is_home,
        prices_cents;
    `,
      [
        name ?? null,
        brand ?? null,
        address ?? null,
        city ?? null,
        state ?? null,
        latitude ?? null,
        longitude ?? null,
        is_home ?? false,
        prices_cents ?? {},
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error in POST /api/stations", err);
    res.status(500).json({ error: "Failed to create station" });
  }
});

// Update station – used by admin.html
app.put("/api/stations/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid station id" });
  }

  const {
    name,
    brand,
    address,
    city,
    state,
    latitude,
    longitude,
    is_home,
    prices_cents,
  } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE stations
      SET
        name         = COALESCE($2, name),
        brand        = COALESCE($3, brand),
        address      = COALESCE($4, address),
        city         = COALESCE($5, city),
        state        = COALESCE($6, state),
        latitude     = COALESCE($7, latitude),
        longitude    = COALESCE($8, longitude),
        is_home      = COALESCE($9, is_home),
        prices_cents = COALESCE($10, prices_cents)
      WHERE id = $1
      RETURNING
        id,
        name,
        brand,
        address,
        city,
        state,
        latitude,
        longitude,
        is_home,
        prices_cents;
    `,
      [
        id,
        name ?? null,
        brand ?? null,
        address ?? null,
        city ?? null,
        state ?? null,
        latitude ?? null,
        longitude ?? null,
        is_home ?? null,
        prices_cents ?? null,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Station not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error in PUT /api/stations/:id", err);
    res.status(500).json({ error: "Failed to update station" });
  }
});

// --- Start server -------------------------------------------------------------

app.listen(port, () => {
  console.log(`Tarcart API listening on port ${port}`);
});
