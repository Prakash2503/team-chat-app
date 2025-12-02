// backend/src/config/db.js
import mongoose from "mongoose";

/**
 * Connect to MongoDB using the MONGO_URI env var.
 * Exports a function connectDB() that returns a Promise.
 *
 * Usage:
 *   import { connectDB } from './config/db.js';
 *   await connectDB();
 */

const DEFAULT_OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // keep indexes creation behavior explicit (Mongoose 7+ no longer uses useCreateIndex)
};

export async function connectDB(uri = process.env.MONGO_URI) {
  if (!uri) {
    throw new Error(
      "MONGO_URI is not defined in environment. Set process.env.MONGO_URI"
    );
  }

  try {
    // If already connected, reuse the existing connection
    if (mongoose.connection.readyState === 1) {
      // 1 = connected
      console.log("MongoDB: already connected");
      return mongoose.connection;
    }

    console.log("MongoDB: connecting...");
    await mongoose.connect(uri, DEFAULT_OPTIONS);
    console.log("MongoDB: connected");
    return mongoose.connection;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    // Rethrow to allow caller to decide (server.js may exit)
    throw err;
  }
}

/**
 * Optional helper to gracefully close connection (useful in tests)
 */
export async function closeDB() {
  try {
    await mongoose.disconnect();
    console.log("MongoDB: disconnected");
  } catch (err) {
    console.error("Error while disconnecting MongoDB:", err);
  }
}
