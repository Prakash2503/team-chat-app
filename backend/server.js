// backend/server.js
// Must be the very first lines so .env is loaded before other imports run.
import 'dotenv/config';

// optional: debug print to confirm the secret is present at startup
console.log("DEBUG: JWT_SECRET present?:", !!process.env.JWT_SECRET);

import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";

import { connectDB } from "./src/config/db.js";
import authRoutes from "./src/routes/auth.routes.js";
import channelRoutes from "./src/routes/channel.routes.js";
import messageRoutes from "./src/routes/message.routes.js";
import { errorHandler } from "./src/middleware/errorHandler.js";
import initSocket from "./socket.js";
import presenceService from "./src/services/presenceService.js";

// Fail fast if JWT_SECRET not set
if (!process.env.JWT_SECRET) {
  console.error(
    "FATAL: JWT_SECRET is not configured. Set JWT_SECRET in your .env (or Render environment)."
  );
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

// FRONTEND_URL from Render env
// Example expected value: https://team-chat-app-6.onrender.com
const FRONTEND_URL = process.env.FRONTEND_URL;

// allowed origins (production + local dev)
const allowedOrigins = [
  FRONTEND_URL,
  "http://localhost:5500",
  "http://localhost:3000",
].filter(Boolean);

// dynamic CORS middleware
const corsOptions = {
  origin: function (origin, callback) {
    // allow browserless tools (curl/postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ CORS blocked origin:", origin);
    return callback(new Error("CORS: Origin not allowed → " + origin), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

const app = express();
const server = http.createServer(app);

// Core middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Apply dynamic CORS
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Preflight fix

// Connect DB
try {
  await connectDB();
} catch (err) {
  console.error("Failed to connect to DB - exiting", err);
  process.exit(1);
}

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Team Chat Backend is running" });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/channels/:id/messages", messageRoutes);

// Error handler (last)
app.use(errorHandler);

// SOCKET.IO — with updated CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// Make io available in app
app.set("io", io);
presenceService.setIo(io);

// Initialize socket handlers
initSocket(io);

// Start server
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log("Allowed CORS origins:", allowedOrigins);
});
