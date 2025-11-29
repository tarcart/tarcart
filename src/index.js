"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const stations_1 = __importDefault(require("./routes/stations"));
const submissions_1 = __importDefault(require("./routes/submissions"));
const app = (0, express_1.default)();
const port = process.env.PORT || 8080;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check endpoint (for testing)
app.get("/health", (_req, res) => {
    res.json({ ok: true });
});
// Main API routes
app.use("/api/stations", stations_1.default);
app.use("/api/price-submissions", submissions_1.default);
app.listen(port, () => {
    console.log(`Tarcart API listening on port ${port}`);
});
//# sourceMappingURL=index.js.map