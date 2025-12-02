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

// Fail fast if JWT_SECRET not set (helps catch config issues early)
if (!process.env.JWT_SECRET) {
  console.error(
    "FATAL: JWT_SECRET is not configured. Set JWT_SECRET in your .env (or environment) before using JWT features."
  );
  // Exit so the operator fixes the config before the server accepts requests
  process.exit(1);
}

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5500";

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// Connect DB (await top-level)
try {
  await connectDB();
} catch (err) {
  console.error("Failed to connect to DB - exiting", err);
  process.exit(1);
}

// Basic health route
app.get("/", (req, res) => {
  res.json({ message: "Team Chat Backend is running" });
});

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/channels", channelRoutes);
// mount messages router under channels so req.params.id is channelId
app.use("/api/channels/:id/messages", messageRoutes);

// Error handler (last)
app.use(errorHandler);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Attach io to the Express app so controllers can emit
app.set("io", io);

// Attach io to presence service for automatic broadcasting
presenceService.setIo(io);

// Initialize socket handlers (auth, rooms, message persistence, presence)
initSocket(io);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
