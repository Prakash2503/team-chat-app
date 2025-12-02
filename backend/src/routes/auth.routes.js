// backend/src/routes/auth.routes.js
import express from "express";
import { signup, login, me } from "../controllers/authController.js";
import { authMiddleware } from "../config/jwt.js";

const router = express.Router();

/**
 * POST /api/auth/signup
 * Body: { username, password, displayName }
 */
router.post("/signup", signup);

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
router.post("/login", login);

/**
 * GET /api/auth/me
 * Protected - returns current user info
 */
router.get("/me", authMiddleware, me);

export default router;
