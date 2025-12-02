// backend/src/controllers/messageController.js
import Message from "../models/Message.js";
import Channel from "../models/Channel.js";

/**
 * GET /api/channels/:id/messages?before=<ISO>&limit=20
 * Returns messages for channel with pagination
 */
export async function getMessages(req, res) {
  try {
    const channelId = req.params.id;
    const { before, limit } = req.query;
    const limitNum = Math.min(100, parseInt(limit || "20", 10));

    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ message: "Channel not found" });

    const messages = await Message.fetchForChannel(channelId, {
      before: before ? new Date(before) : undefined,
      limit: limitNum,
    });

    return res.json({ messages });
  } catch (err) {
    console.error("getMessages error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * POST /api/channels/:id/messages
 * Creates a new message
 */
export async function createMessage(req, res) {
  try {
    const channelId = req.params.id;
    const userId = req.userId;
    const { text } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!text || !String(text).trim())
      return res.status(400).json({ message: "Message text required" });

    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ message: "Channel not found" });

    const msg = new Message({
      channel: channelId,
      sender: userId,
      text: String(text).trim(),
    });

    await msg.save();

    const populated = await Message.findById(msg._id)
      .populate("sender", "username displayName avatarUrl")
      .lean();

    // emit via socket.io if available
    const io = req.app?.get("io");
    if (io) {
      io.to(`channel_${channelId}`).emit("receive_message", populated);
    }

    return res.status(201).json({ message: "Message created", data: populated });
  } catch (err) {
    console.error("createMessage error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * DELETE /api/messages/:id
 */
export async function deleteMessage(req, res) {
  try {
    const msgId = req.params.id;
    const userId = req.userId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const msg = await Message.findById(msgId);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    if (String(msg.sender) !== String(userId))
      return res.status(403).json({ message: "Not allowed" });

    await Message.deleteOne({ _id: msgId });

    const io = req.app?.get("io");
    if (io) {
      io.to(`channel_${msg.channel}`).emit("message_deleted", { id: msgId });
    }

    return res.json({ message: "Message deleted" });
  } catch (err) {
    console.error("deleteMessage error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
