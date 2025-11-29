import { Router } from "express";
import { pool } from "../db";
import { geocodeAddress } from "../services/geocoding";

const router = Router();

router.get("/", async (req, res) => {
    try {
        const { rows: stations } = await pool.query(
            `SELECT id, name, brand, address, city, state, latitude, longitude, prices_cents, is_home 
             FROM stations ORDER BY id ASC`
        );

        // Process each station: geocode if missing lat/lng
        for (const station of stations) {
            if (!station.latitude || !station.longitude) {
                console.log(`🟡 Missing lat/lng for '${station.name}' — geocoding…`);

                const fullAddress = `${station.address}, ${station.city}, ${station.state}`;
                const geo = await geocodeAddress(fullAddress);

                if (geo) {
                    console.log(`✅ Saving coordinates for ${station.name}:`, geo);

                    await pool.query(
                        `UPDATE stations 
                         SET latitude = $1, longitude = $2 
                         WHERE id = $3`,
                        [geo.lat, geo.lng, station.id]
                    );

                    // Update the in-memory station object so it returns immediately
                    station.latitude = geo.lat;
                    station.longitude = geo.lng;
                } else {
                    console.log(`❌ Geocoding failed for ${station.name}`);
                }
            }
        }

        res.json(stations);

    } catch (err) {
        console.error("❌ Error in GET /api/stations", err);
        res.status(500).json({ error: "Failed to load stations" });
    }
});

export default router;
