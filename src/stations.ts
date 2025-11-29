import { Router } from "express";
import { pool } from "./db";
import { geocodeAddress } from "./services/geocoding";

const router = Router();

router.get("/", async (req, res) => {
    try {
        const { rows: stations } = await pool.query(
            `SELECT id, name, brand, address, city, state, latitude, longitude, prices_cents, is_home 
             FROM stations ORDER BY id ASC`
        );

        for (const station of stations) {
            // Only geocode if missing
            if (station.latitude === null || station.longitude === null) {
                const fullAddress = `${station.address}, ${station.city}, ${station.state}`;
                console.log(`📡 Geocoding: ${fullAddress}`);

                const coords = await geocodeAddress(fullAddress);

                if (coords) {
                    const { lat, lng } = coords;

                    console.log(`✅ Geocoded ${station.name}: ${lat}, ${lng}`);

                    // Save to DB
                    await pool.query(
                        "UPDATE stations SET latitude = $1, longitude = $2 WHERE id = $3",
                        [lat, lng, station.id]
                    );

                    // Update the object returned to client
                    station.latitude = lat;
                    station.longitude = lng;
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
