// backend/src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema, model } = mongoose;

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      required: false,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    avatarUrl: {
      type: String,
      required: false,
    },
    // optional: store lastSeen or status in DB if you want persistent presence history
    lastSeenAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash; // never leak password hash
        return ret;
      },
    },
  }
);

// Instance method: set password (hash)
UserSchema.methods.setPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(plainPassword, salt);
  return this.passwordHash;
};

// Instance method: compare password
UserSchema.methods.comparePassword = async function (plainPassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// Static helper: create user with hashed password
UserSchema.statics.createWithPassword = async function ({ username, displayName, password, avatarUrl }) {
  const user = new this({
    username,
    displayName,
    avatarUrl,
  });
  await user.setPassword(password);
  await user.save();
  return user;
};

const User = model("User", UserSchema);
export default User;
