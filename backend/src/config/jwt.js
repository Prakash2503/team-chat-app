// backend/src/config/jwt.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || null;
const DEFAULT_EXPIRES_IN = "7d";

function ensureSecret() {
  if (!JWT_SECRET) {
    const msg = "JWT_SECRET is not configured. Set JWT_SECRET in your .env (or environment) before using JWT features.";
    // log for operator visibility and throw so callers can handle the error
    console.error("FATAL:", msg);
    throw new Error(msg);
  }
}

/**
 * Create a signed JWT.
 * Accepts either:
 *  - a plain payload { id: '...' } OR
 *  - a user object with _id or id (e.g. Mongoose doc)
 */
export function signToken(userOrPayload = {}, options = {}) {
  ensureSecret();

  let payload;
  if (userOrPayload && (userOrPayload._id || userOrPayload.id)) {
    payload = { id: userOrPayload._id ? String(userOrPayload._id) : String(userOrPayload.id) };
  } else if (typeof userOrPayload === "object") {
    payload = userOrPayload;
  } else {
    throw new Error("signToken: invalid userOrPayload. Expect object or user doc.");
  }

  const signOptions = {
    expiresIn: options.expiresIn || DEFAULT_EXPIRES_IN,
    ...options,
  };

  return jwt.sign(payload, JWT_SECRET, signOptions);
}

/**
 * Verify token and return decoded payload.
 * Throws if token is missing/invalid/expired.
 */
export function verifyToken(token) {
  ensureSecret();
  if (!token) throw new Error("No token provided to verifyToken");
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Express middleware to authenticate requests.
 * Looks for Bearer token in Authorization header or token in cookies.
 * On success attaches req.userId and req.userPayload (decoded token) and calls next().
 * On failure returns 401 with a clear message.
 */
export async function authMiddleware(req, res, next) {
  try {
    // 1) Authorization header
    const authHeader = req.headers?.authorization || "";
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }

    // 2) Fallback to cookie named 'token' (if you use cookies and cookie-parser)
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Authentication token missing" });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      const msg = (err && err.name === "TokenExpiredError") ? "Token expired" : "Invalid token";
      console.warn("authMiddleware verify failed:", err?.message || err);
      return res.status(401).json({ message: msg });
    }

    // Expect payload to contain { id: '<userId>' } or { userId: ... }
    const userId = decoded?.id || decoded?.userId || null;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // Attach useful properties for downstream handlers
    req.userId = String(userId);
    req.userPayload = decoded;

    return next();
  } catch (err) {
    console.error("authMiddleware unhandled error:", err?.message || err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// default export with helpers for convenience
export default {
  signToken,
  verifyToken,
  authMiddleware,
};
