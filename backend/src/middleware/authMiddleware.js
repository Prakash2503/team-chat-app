// backend/src/middleware/authMiddleware.js
import { verifyToken } from "../config/jwt.js";
import User from "../models/User.js";

export async function authMiddleware(req, res, next) {
  try {
    // 1) Try Authorization header
    let token = null;
    const authHeader = req.headers?.authorization || "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1].trim();
    }

    // 2) Fallback to cookie
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Authentication token required" });
    }

    // Verify token
    let payload;
    try {
      payload = verifyToken(token);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Expect payload to contain { id: '<userId>' } or { userId: ... }
    const userId = payload.id || payload.userId;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // Attach userId to request
    req.userId = String(userId);

    // Optionally load user document for convenience (non-critical)
    try {
      const user = await User.findById(req.userId).select("-passwordHash").lean();
      if (user) {
        req.user = user;
      }
    } catch (err) {
      console.warn("authMiddleware: failed to load user doc:", err?.message || err);
    }

    return next();
  } catch (err) {
    console.error("authMiddleware unhandled error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export default authMiddleware;
