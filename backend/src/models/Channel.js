// backend/src/models/Channel.js
import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const ChannelSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: false,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    members: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
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

// Virtual: memberCount
ChannelSchema.virtual("memberCount").get(function () {
  return (this.members && this.members.length) || 0;
});

// Instance method: add member (no duplicates)
ChannelSchema.methods.addMember = async function (userId) {
  const idStr = String(userId);
  if (!this.members.map(String).includes(idStr)) {
    this.members.push(userId);
    await this.save();
  }
  return this;
};

// Instance method: remove member
ChannelSchema.methods.removeMember = async function (userId) {
  const idStr = String(userId);
  this.members = this.members.filter((m) => String(m) !== idStr);
  await this.save();
  return this;
};

// Static: find channel and populate brief info
ChannelSchema.statics.findPublicList = function () {
  return this.find({}).select("name isPrivate members createdBy createdAt").lean();
};

const Channel = model("Channel", ChannelSchema);
export default Channel;
