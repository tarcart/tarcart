import { Router } from "express";
import { pool } from "../db";

const router = Router();

// POST /api/price-submissions
// Public endpoint for community price updates
router.post("/", async (req, res) => {
  try {
    const {
      stationId,
      stationName,
      stationAddress,
      grade,
      price,
      notes,
      submitterName,
    } = req.body;

    const priceCents =
      typeof price === "number" ? Math.round(price * 1000) : null;

    const result = await pool.query(
      `
      INSERT INTO price_submissions (
        station_id,
        station_name,
        station_address,
        grade,
        price_cents,
        notes,
        submitter_name,
        submitter_ip
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id;
      `,
      [
        stationId || null,
        stationName || null,
        stationAddress || null,
        grade || null,
        priceCents,
        notes || null,
        submitterName || null,
        req.ip,
      ]
    );

    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    console.error("Error in POST /api/price-submissions", err);
    res.status(500).json({ error: "Failed to submit price" });
  }
});

export default router;
