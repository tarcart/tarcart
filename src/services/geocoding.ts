import fetch from "node-fetch";

const GOOGLE_KEY = process.env.GOOGLE_API_KEY;

export async function geocodeAddress(address: string) {
    if (!GOOGLE_KEY) {
        console.error("❌ Missing GOOGLE_API_KEY env variable");
        return null;
    }

    const encoded = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${GOOGLE_KEY}`;

    console.log("🌍 Calling Google Geocoding:", url);

    try {
        const res = await fetch(url);
        const data = await res.json();

        console.log("📡 Google Raw Response:", JSON.stringify(data, null, 2));

        if (data.status !== "OK" || data.results.length === 0) {
            console.error("❌ Geocoding failed:", data.status, data.error_message);
            return null;
        }

        const { lat, lng } = data.results[0].geometry.location;

        return { lat, lng };
    } catch (err) {
        console.error("❌ Geocoding error:", err);
        return null;
    }
}
