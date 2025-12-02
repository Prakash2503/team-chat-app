// backend/src/models/Message.js
import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const MessageSchema = new Schema(
  {
    channel: {
      type: Types.ObjectId,
      ref: "Channel",
      required: true,
      index: true,
    },
    sender: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
    },
    // optional: edited flag, attachments, reactions etc.
    edited: {
      type: Boolean,
      default: false,
    },
    attachments: {
      type: [
        {
          filename: String,
          url: String,
          mimeType: String,
        },
      ],
      default: undefined,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Create a text index for message search (optional)
MessageSchema.index({ text: "text" });

// Static: fetch messages for a channel with cursor-based pagination
// options: { before: Date|string, limit: Number }
MessageSchema.statics.fetchForChannel = async function (channelId, { before, limit = 20 } = {}) {
  const query = { channel: channelId };
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }
  // newest first, then reverse before returning so client can append older messages at top
  const msgs = await this.find(query)
    .sort({ createdAt: -1 })
    .limit(Math.min(100, limit))
    .populate("sender", "username displayName avatarUrl")
    .lean();
  return msgs.reverse();
};

const Message = model("Message", MessageSchema);
export default Message;
