// backend/src/routes/channel.routes.js
import express from "express";
import {
  listChannels,
  createChannel,
  joinChannel,
  leaveChannel,
  getChannel,
} from "../controllers/channelController.js";
import { authMiddleware } from "../config/jwt.js";

const router = express.Router();

/**
 * GET /api/channels
 * Public: List channels
 */
router.get("/", listChannels);

/**
 * POST /api/channels
 * Protected: create channel
 * Body: { name, description?, isPrivate? }
 */
router.post("/", authMiddleware, createChannel);

/**
 * GET /api/channels/:id
 * Public (or protected depending on private channel policy): get channel details
 */
router.get("/:id", getChannel);

/**
 * POST /api/channels/:id/join
 * Protected: join a channel
 */
router.post("/:id/join", authMiddleware, joinChannel);

/**
 * POST /api/channels/:id/leave
 * Protected: leave a channel
 */
router.post("/:id/leave", authMiddleware, leaveChannel);

export default router;
