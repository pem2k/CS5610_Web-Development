import { getDb } from "../db.js";

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.sessionToken;
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const db = getDb();
    const session = await db.collection("sessions").findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return res.status(401).json({ error: "Session expired or invalid" });
    }

    const user = await db.collection("users").findOne({ _id: session.userId });
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // attach user to req
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
