// backend/src/controllers/authController.js
import User from "../models/User.js";
import { signToken as helperSignToken } from "../config/jwt.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

/**
 * Produce a token using helperSignToken if available,
 * otherwise fall back to jwt.sign using JWT_SECRET env.
 */
function makeToken(payload) {
  // prefer helper if available and is a function
  if (typeof helperSignToken === "function") {
    try {
      return helperSignToken(payload);
    } catch (e) {
      console.warn("helper signToken failed, falling back to jwt.sign:", e?.message || e);
      // fall through to fallback below
    }
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT secret not configured (JWT_SECRET missing).");
  }
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

/**
 * sanitize user object for API responses
 * - ensures no sensitive fields are returned
 * - returns consistent shape: { id, username, displayName, avatarUrl, ...otherNonSensitive }
 */
function sanitizeUser(userDoc) {
  if (!userDoc) return null;

  // Convert to plain object if necessary
  const plain = typeof userDoc.toJSON === "function" ? userDoc.toJSON() : { ...userDoc };

  // Remove known sensitive fields
  delete plain.password;
  delete plain.passwordHash;
  delete plain.__v;

  // Ensure id field exists and is a string
  const id = userDoc && userDoc._id ? String(userDoc._id) : (plain.id ? String(plain.id) : undefined);

  return {
    id,
    username: plain.username,
    displayName: plain.displayName || plain.username,
    avatarUrl: plain.avatarUrl || null,
    // include any other non-sensitive properties if you want
    // e.g. createdAt: plain.createdAt
    ...(
      // include arbitrary non-sensitive fields but avoid duplicates
      Object.keys(plain).reduce((acc, k) => {
        if (["username", "displayName", "avatarUrl", "_id", "id", "password", "passwordHash", "__v"].includes(k)) {
          return acc;
        }
        acc[k] = plain[k];
        return acc;
      }, {})
    )
  };
}

/**
 * POST /api/auth/signup
 * Body: { username, password, displayName }
 */
export async function signup(req, res) {
  try {
    const { username, password, displayName } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: "username and password required" });
    }

    const uname = String(username).trim().toLowerCase();

    // Check existing user
    const existing = await User.findOne({ username: uname });
    if (existing) {
      return res.status(409).json({ message: "username already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(String(password), salt);

    // Create user (ensure your User schema expects passwordHash field)
    const user = new User({
      username: uname,
      displayName: displayName ? String(displayName).trim() : uname,
      passwordHash,
    });

    await user.save();

    // Issue token (use helper or fallback)
    let token;
    try {
      token = makeToken({ id: String(user._id) });
    } catch (e) {
      // If token generation fails due to config, return 500 with helpful message
      console.error("Token generation failed:", e);
      return res.status(500).json({ message: "Server misconfiguration: JWT secret missing or invalid" });
    }

    return res.status(201).json({
      message: "User created",
      user: sanitizeUser(user),
      token,
    });
  } catch (err) {
    console.error("signup error:", err);
    if (err?.code === 11000) {
      return res.status(409).json({ message: "username already exists", details: err.keyValue });
    }
    if (process.env.NODE_ENV !== "production") {
      return res.status(500).json({ message: "Internal server error", details: err.message, stack: err.stack });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
export async function login(req, res) {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: "username and password required" });
    }

    const uname = String(username).trim().toLowerCase();
    const user = await User.findOne({ username: uname });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Validate password: use comparePassword if model provides it; otherwise use bcrypt against stored passwordHash
    let valid = false;
    try {
      if (typeof user.comparePassword === "function") {
        valid = await user.comparePassword(password);
      } else {
        // If passwordHash missing, treat as invalid
        valid = !!user.passwordHash && await bcrypt.compare(String(password), user.passwordHash);
      }
    } catch (e) {
      console.warn("password compare error:", e?.message || e);
      valid = false;
    }

    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create token
    let token;
    try {
      token = makeToken({ id: String(user._id) });
    } catch (e) {
      console.error("Token generation failed:", e);
      return res.status(500).json({ message: "Server misconfiguration: JWT secret missing or invalid" });
    }

    return res.json({
      message: "Login successful",
      user: sanitizeUser(user),
      token,
    });
  } catch (err) {
    console.error("login error:", err);
    if (process.env.NODE_ENV !== "production") {
      return res.status(500).json({ message: "Internal server error", details: err.message, stack: err.stack });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * GET /api/auth/me
 * Protected: authMiddleware should set req.userId
 */
export async function me(req, res) {
  try {
    const userId = req.userId || (req.params && req.params.userId);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("me error:", err);
    if (process.env.NODE_ENV !== "production") {
      return res.status(500).json({ message: "Internal server error", details: err.message, stack: err.stack });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
}
