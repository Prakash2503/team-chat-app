// backend/socket.js
/**
 * Socket.IO initialization and handlers.
 *
 * Responsibilities:
 * - Authenticate sockets using JWT
 * - Track presence via presenceService
 * - Allow clients to join/leave channel rooms
 * - Persist messages to MongoDB (Message model) when received from sockets
 * - Broadcast new messages to channel rooms
 *
 * This file expects:
 *  - src/models/Message.js, Channel.js, User.js exist
 *  - src/config/jwt.js exports verifyToken()
 *  - src/services/presenceService.js exported singleton
 */

import { verifyToken } from "./src/config/jwt.js";
import presenceService from "./src/services/presenceService.js";
import Message from "./src/models/Message.js";
import Channel from "./src/models/Channel.js";
import User from "./src/models/User.js";

/**
 * Initialize socket handlers (call once).
 * @param {import("socket.io").Server} io
 */
export default function initSocket(io) {
  // Middleware to authenticate socket connection
  io.use((socket, next) => {
    try {
      // Token may be in handshake.auth.token or query.token
      const token =
        socket.handshake?.auth?.token ||
        socket.handshake?.query?.token ||
        (socket.request && socket.request.headers && socket.request.headers.authorization && socket.request.headers.authorization.split(" ")[1]);

      if (!token) {
        return next(new Error("Authentication token missing"));
      }

      // verifyToken throws if invalid
      const payload = verifyToken(token);
      const userId = payload?.id || payload?.userId;
      if (!userId) {
        return next(new Error("Invalid token payload"));
      }

      socket.userId = String(userId);
      return next();
    } catch (err) {
      console.warn("Socket auth failed:", err?.message || err);
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    console.log(`Socket connected: ${socket.id} (user ${userId})`);

    // Add socket to presence service
    presenceService.addSocket(userId, socket.id);

    // Optional: emit initial presence state to the connected socket
    socket.emit("presence_init", { onlineUsers: presenceService.getOnlineUsers() });

    // Handle client joining a channel
    socket.on("join_channel", async ({ channelId }) => {
      try {
        if (!channelId) return;
        socket.join(`channel_${channelId}`);
        console.log(`User ${userId} joined channel ${channelId}`);

        // Optionally notify room about a new member (memberCount update)
        const channel = await Channel.findById(channelId).lean();
        if (channel) {
          // no DB update here; member management is via REST endpoints
          const socketsInRoom = (await io.in(`channel_${channelId}`).fetchSockets()).length;
          io.to(`channel_${channelId}`).emit("channel_member_update", {
            channelId,
            memberSocketCount: socketsInRoom,
          });
        }
      } catch (err) {
        console.warn("join_channel error:", err?.message || err);
      }
    });

    // Handle leaving a channel
    socket.on("leave_channel", ({ channelId }) => {
      try {
        if (!channelId) return;
        socket.leave(`channel_${channelId}`);
        console.log(`User ${userId} left channel ${channelId}`);
      } catch (err) {
        console.warn("leave_channel error:", err?.message || err);
      }
    });

    // Handle typing indicator (optional)
    socket.on("typing", ({ channelId, isTyping }) => {
      if (!channelId) return;
      socket.to(`channel_${channelId}`).emit("typing_update", {
        channelId,
        userId,
        isTyping: !!isTyping,
      });
    });

    // Handle incoming chat message from socket
    socket.on("send_message", async (data) => {
      try {
        const { channelId, text } = data || {};
        if (!channelId || !text || !String(text).trim()) {
          return socket.emit("error", { message: "Invalid message payload" });
        }

        // Validate channel exists
        const channel = await Channel.findById(channelId);
        if (!channel) {
          return socket.emit("error", { message: "Channel not found" });
        }

        // For private channels, you may want to check membership here.
        // For simplicity in this assignment, we allow sending if channel exists.

        // Persist message to DB
        const msg = new Message({
          channel: channelId,
          sender: userId,
          text: String(text).trim(),
        });
        await msg.save();

        // Populate sender fields for broadcast
        const populated = await Message.findById(msg._id)
          .populate("sender", "username displayName avatarUrl")
          .lean();

        // Broadcast to everyone in the room
        io.to(`channel_${channelId}`).emit("receive_message", populated);
      } catch (err) {
        console.error("send_message error:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Disconnect handling
    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} (user ${userId}) reason: ${reason}`);
      presenceService.removeSocket(userId, socket.id);
    });

    // Optional: expose a receive for ping/test
    socket.on("ping_check", (payload) => {
      socket.emit("pong_check", { ok: true, payload });
    });
  });
}
