// backend/src/controllers/channelController.js
import Channel from "../models/Channel.js";
import User from "../models/User.js";

/**
 * GET /api/channels
 * Returns list of channels with brief info (name, isPrivate, memberCount, createdBy)
 */
export async function listChannels(req, res) {
  try {
    const channels = await Channel.find({})
      .select("name isPrivate members createdBy createdAt")
      .populate("createdBy", "username displayName")
      .lean();

    // Add memberCount in response
    const out = channels.map((c) => ({
      id: c._id,
      name: c.name,
      isPrivate: !!c.isPrivate,
      memberCount: (c.members && c.members.length) || 0,
      createdBy: c.createdBy || null,
      createdAt: c.createdAt,
    }));

    return res.json({ channels: out });
  } catch (err) {
    console.error("listChannels error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * POST /api/channels
 * Body: { name, description?, isPrivate? }
 * Creates a new channel and adds creator as member
 */
export async function createChannel(req, res) {
  try {
    const { name, description, isPrivate } = req.body;
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Channel name is required" });
    }

    const existing = await Channel.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ message: "Channel name already exists" });
    }

    const channel = new Channel({
      name: name.trim(),
      description: description || "",
      isPrivate: !!isPrivate,
      members: [userId],
      createdBy: userId,
    });

    await channel.save();

    return res.status(201).json({ message: "Channel created", channel: channel.toJSON() });
  } catch (err) {
    console.error("createChannel error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * POST /api/channels/:id/join
 * Adds the requester to channel.members
 */
export async function joinChannel(req, res) {
  try {
    const channelId = req.params.id;
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ message: "Channel not found" });

    // If private, you might enforce invitation logic. For now allow join.
    await channel.addMember(userId);

    const memberCount = channel.members.length;
    return res.json({ message: "Joined channel", channelId, memberCount });
  } catch (err) {
    console.error("joinChannel error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * POST /api/channels/:id/leave
 * Removes requester from channel.members
 */
export async function leaveChannel(req, res) {
  try {
    const channelId = req.params.id;
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ message: "Channel not found" });

    await channel.removeMember(userId);

    return res.json({ message: "Left channel", channelId });
  } catch (err) {
    console.error("leaveChannel error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * GET /api/channels/:id
 * Returns channel details including member list (limited) and memberCount
 */
export async function getChannel(req, res) {
  try {
    const channelId = req.params.id;
    const channel = await Channel.findById(channelId)
      .populate("members", "username displayName avatarUrl")
      .populate("createdBy", "username displayName")
      .lean();

    if (!channel) return res.status(404).json({ message: "Channel not found" });

    const out = {
      id: channel._id,
      name: channel.name,
      description: channel.description,
      isPrivate: !!channel.isPrivate,
      createdBy: channel.createdBy || null,
      members: channel.members || [],
      memberCount: (channel.members && channel.members.length) || 0,
      createdAt: channel.createdAt,
    };

    return res.json({ channel: out });
  } catch (err) {
    console.error("getChannel error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
