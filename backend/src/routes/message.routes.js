// backend/src/routes/message.routes.js
import express from "express";
import { getMessages, createMessage, deleteMessage } from "../controllers/messageController.js";
import { authMiddleware } from "../config/jwt.js";

/**
 * This router is intended to be mounted with a parent param for the channel id, e.g.:
 *   app.use('/api/channels/:id/messages', messageRoutes);
 *
 * We use mergeParams: true so req.params.id is available inside handlers.
 */
const router = express.Router({ mergeParams: true });

/**
 * GET /api/channels/:id/messages?before=<ISO>&limit=20
 * Public (or protected depending on private channel policy): fetch messages for channel
 */
router.get("/", getMessages);

/**
 * POST /api/channels/:id/messages
 * Protected: create a new message in the channel
 * Body: { text }
 */
router.post("/", authMiddleware, createMessage);

/**
 * DELETE /api/channels/:channelId/messages/:id
 * Protected: delete a message by id (optional)
 */
router.delete("/:id", authMiddleware, deleteMessage);

export default router;
