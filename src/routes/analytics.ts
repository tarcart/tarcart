import { Router } from "express";
import { pool } from "../db";

const router = Router();

/**
 * GET /api/analytics/price-history
 *
 * Query params:
 *  - grade: "87" | "89" | "93" | "diesel" | "all" (default: "87")
 *  - periodDays: number of days back from today (default: 14)
 *
 * Returns an array of objects like:
 * [
 *   {
 *     day: "2025-11-20",
 *     home_avg_price_cents: 3259,
 *     competitor_avg_price_cents: 3299
 *   },
 *   ...
 * ]
 */
router.get("/price-history", async (req, res) => {
  const grade = (req.query.grade as string) || "87";
  const periodDays = parseInt((req.query.periodDays as string) || "14", 10);

  const days = Number.isFinite(periodDays) && periodDays > 0 ? periodDays : 14;

  try {
    let query = `
      SELECT
        date_trunc('day', sp.effective_at) AS day,
        CASE WHEN s.is_home THEN 'home' ELSE 'competitor' END AS station_group,
        AVG(sp.price_cents)::bigint AS avg_price_cents
      FROM station_prices sp
      JOIN stations s ON s.id = sp.station_id
      WHERE sp.effective_at >= now() - ($1::int || ' days')::interval
    `;
    const params: any[] = [days];

    if (grade && grade !== "all") {
      query += ` AND sp.grade = $2 `;
      params.push(grade);
    }

    query += `
      GROUP BY day, station_group
      ORDER BY day ASC, station_group ASC
    `;

    const result = await pool.query(query, params);

    const map = new Map<
      string,
      {
        day: string;
        home_avg_price_cents: number | null;
        competitor_avg_price_cents: number | null;
      }
    >();

    for (const row of result.rows) {
      const dayIso = (row.day as Date).toISOString().slice(0, 10);
      let entry = map.get(dayIso);
      if (!entry) {
        entry = {
          day: dayIso,
          home_avg_price_cents: null,
          competitor_avg_price_cents: null,
        };
        map.set(dayIso, entry);
      }

      if (row.station_group === "home") {
        entry.home_avg_price_cents = Number(row.avg_price_cents);
      } else {
        entry.competitor_avg_price_cents = Number(row.avg_price_cents);
      }
    }

    const data = Array.from(map.values()).sort((a, b) =>
      a.day < b.day ? -1 : a.day > b.day ? 1 : 0
    );

    res.json(data);
  } catch (err) {
    console.error("Error in GET /api/analytics/price-history", err);
    res.status(500).json({ error: "Failed to load price history analytics" });
  }
});

/**
 * GET /api/analytics/current-spread
 *
 * Uses the *latest* price per station + grade to compute, for each grade:
 * - Shields avg / min / max
 * - Competitors avg / min / max
 * - Average spread (competitor_avg - home_avg)
 * - Best/worst case spread vs competitors
 *
 * Returns an array like:
 * [
 *   {
 *     grade: "87",
 *     home_avg_price_cents: 3259,
 *     competitor_avg_price_cents: 3299,
 *     home_station_count: 1,
 *     competitor_station_count: 5,
 *     home_min_price_cents: 3259,
 *     home_max_price_cents: 3259,
 *     competitor_min_price_cents: 3199,
 *     competitor_max_price_cents: 3399,
 *     avg_spread_cents: 40,
 *     best_case_spread_cents: -60,
 *     worst_case_spread_cents: 140
 *   },
 *   ...
 * ]
 */
router.get("/current-spread", async (_req, res) => {
  try {
    const sql = `
      WITH latest AS (
        SELECT
          sp.station_id,
          sp.grade,
          sp.price_cents,
          sp.effective_at,
          ROW_NUMBER() OVER (
            PARTITION BY sp.station_id, sp.grade
            ORDER BY sp.effective_at DESC
          ) AS rn
        FROM station_prices sp
      )
      SELECT
        CASE WHEN s.is_home THEN 'home' ELSE 'competitor' END AS station_group,
        latest.grade,
        AVG(latest.price_cents)::bigint AS avg_price_cents,
        MIN(latest.price_cents)::bigint AS min_price_cents,
        MAX(latest.price_cents)::bigint AS max_price_cents,
        COUNT(*)::int AS station_count
      FROM latest
      JOIN stations s ON s.id = latest.station_id
      WHERE latest.rn = 1
      GROUP BY station_group, latest.grade
      ORDER BY latest.grade, station_group;
    `;

    const result = await pool.query(sql);

    type Bucket = {
      grade: string;
      home_avg_price_cents: number | null;
      competitor_avg_price_cents: number | null;
      home_station_count: number;
      competitor_station_count: number;
      home_min_price_cents: number | null;
      home_max_price_cents: number | null;
      competitor_min_price_cents: number | null;
      competitor_max_price_cents: number | null;
      avg_spread_cents: number | null;
      best_case_spread_cents: number | null;
      worst_case_spread_cents: number | null;
    };

    const map = new Map<string, Bucket>();

    for (const row of result.rows) {
      const grade = row.grade as string;
      let bucket = map.get(grade);
      if (!bucket) {
        bucket = {
          grade,
          home_avg_price_cents: null,
          competitor_avg_price_cents: null,
          home_station_count: 0,
          competitor_station_count: 0,
          home_min_price_cents: null,
          home_max_price_cents: null,
          competitor_min_price_cents: null,
          competitor_max_price_cents: null,
          avg_spread_cents: null,
          best_case_spread_cents: null,
          worst_case_spread_cents: null,
        };
        map.set(grade, bucket);
      }

      const avg = Number(row.avg_price_cents);
      const min = Number(row.min_price_cents);
      const max = Number(row.max_price_cents);
      const count = Number(row.station_count);

      if (row.station_group === "home") {
        bucket.home_avg_price_cents = avg;
        bucket.home_min_price_cents = min;
        bucket.home_max_price_cents = max;
        bucket.home_station_count = count;
      } else {
        bucket.competitor_avg_price_cents = avg;
        bucket.competitor_min_price_cents = min;
        bucket.competitor_max_price_cents = max;
        bucket.competitor_station_count = count;
      }
    }

    // Compute spreads
    for (const bucket of map.values()) {
      if (
        bucket.home_avg_price_cents != null &&
        bucket.competitor_avg_price_cents != null
      ) {
        bucket.avg_spread_cents =
          bucket.competitor_avg_price_cents - bucket.home_avg_price_cents;
      } else {
        bucket.avg_spread_cents = null;
      }

      if (
        bucket.home_avg_price_cents != null &&
        bucket.competitor_min_price_cents != null
      ) {
        bucket.best_case_spread_cents =
          bucket.competitor_min_price_cents - bucket.home_avg_price_cents;
      } else {
        bucket.best_case_spread_cents = null;
      }

      if (
        bucket.home_avg_price_cents != null &&
        bucket.competitor_max_price_cents != null
      ) {
        bucket.worst_case_spread_cents =
          bucket.competitor_max_price_cents - bucket.home_avg_price_cents;
      } else {
        bucket.worst_case_spread_cents = null;
      }
    }

    const data = Array.from(map.values()).sort((a, b) =>
      a.grade < b.grade ? -1 : a.grade > b.grade ? 1 : 0
    );

    res.json(data);
  } catch (err) {
    console.error("Error in GET /api/analytics/current-spread", err);
    res.status(500).json({ error: "Failed to load current spread analytics" });
  }
});

export default router;
