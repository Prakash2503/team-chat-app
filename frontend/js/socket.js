// frontend/js/socket.js
// Central socket manager (singleton)
import { BASE_URL } from "../../config.js";
import { getToken } from "./utils.js";

let socket = null;

/**
 * Create and return the singleton socket connection.
 * It attaches basic handlers for reconnect/presence events.
 */
export function createSocket(onConnect = () => {}, onDisconnect = () => {}) {
  if (socket && socket.connected) return socket;

  const token = getToken();
  if (!token) {
    console.warn("No token found - socket will not connect");
    return null;
  }

  // `io` should be available globally by <script src="https://cdn.socket.io/..."></script>
  socket = io(BASE_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    console.log("Socket connected", socket.id);
    onConnect(socket);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
    onDisconnect(reason);
  });

  socket.on("connect_error", (err) => {
    console.warn("Socket connect_error:", err.message || err);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function joinChannelRoom(channelId) {
  if (!socket) return;
  socket.emit("join_channel", { channelId });
}

export function leaveChannelRoom(channelId) {
  if (!socket) return;
  socket.emit("leave_channel", { channelId });
}

export function sendMessageSocket(channelId, text) {
  if (!socket) return;
  socket.emit("send_message", { channelId, text });
}

export function onReceiveMessage(handler) {
  if (!socket) return;
  socket.off("receive_message");
  socket.on("receive_message", handler);
}

export function onPresenceUpdate(handler) {
  if (!socket) return;
  socket.off("presence_update");
  socket.on("presence_update", handler);
}

export function onTypingUpdate(handler) {
  if (!socket) return;
  socket.off("typing_update");
  socket.on("typing_update", handler);
}
