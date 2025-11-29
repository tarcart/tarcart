import { Router, Request, Response } from "express";

const router = Router();

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// POST /api/auth/login
// Body: { password: string }
// If password matches ADMIN_PASSWORD, return { token: ADMIN_TOKEN }
router.post("/login", (req: Request, res: Response) => {
  if (!ADMIN_TOKEN || !ADMIN_PASSWORD) {
    console.error("ADMIN_TOKEN or ADMIN_PASSWORD not set");
    return res.status(500).json({ error: "Admin login not configured" });
  }

  const { password } = req.body as { password?: string };

  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid password" });
  }

  // In the future, this is where we'd return a real JWT / magic-link session token.
  res.json({ token: ADMIN_TOKEN });
});

export default router;
