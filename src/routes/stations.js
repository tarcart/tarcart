"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
// GET /api/stations
// Returns active stations + latest prices
router.get("/", async (_req, res) => {
    try {
        const result = await db_1.pool.query(`
      WITH latest_prices AS (
        SELECT DISTINCT ON (station_id, grade)
          station_id, grade, price_cents, effective_at
        FROM station_prices
        ORDER BY station_id, grade, effective_at DESC
      )
      SELECT
        s.id,
        s.name,
        s.brand,
        s.address,
        s.city,
        s.state,
        s.is_home,
        jsonb_object_agg(lp.grade, lp.price_cents) AS prices_cents
      FROM stations s
      LEFT JOIN latest_prices lp ON lp.station_id = s.id
      WHERE s.is_active = TRUE
      GROUP BY s.id
      ORDER BY s.is_home DESC, s.name;
      `);
        res.json(result.rows);
    }
    catch (err) {
        console.error("Error in GET /api/stations", err);
        res.status(500).json({ error: "Failed to load stations" });
    }
});
exports.default = router;
//# sourceMappingURL=stations.js.map