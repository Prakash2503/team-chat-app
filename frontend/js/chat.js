// frontend/js/chat.js
// Handles chat UI, pagination and message sending
import { getMessages, postMessage } from "./api/messageApi.js";
import { createSocket, getSocket, joinChannelRoom, leaveChannelRoom, sendMessageSocket, onReceiveMessage, onPresenceUpdate } from "./socket.js";
import { formatTime, getToken, showError } from "./utils.js";

/**
 * Expected DOM elements (ids):
 * - #messagesList        (container where message items are appended)
 * - #messageForm         (form for sending messages)
 * - #messageInput        (textarea/input for message text)
 * - #loadOlderBtn        (button to load older messages)
 * - #channelTitle        (element to show channel name)
 * - #onlineUsers         (container for online users list)
 */

let currentChannelId = null;
let oldestMessageDate = null; // ISO string or Date
const PAGE_LIMIT = 20;

function createMessageElement(msg) {
  const wrapper = document.createElement("div");
  wrapper.className = "message-item";
  const user = msg.sender?.displayName || msg.sender?.username || "Unknown";
  const time = formatTime(msg.createdAt || msg.timestamp);
  wrapper.innerHTML = `
    <div class="message-meta"><strong>${escapeHtml(user)}</strong> <span class="time">${escapeHtml(time)}</span></div>
    <div class="message-text">${escapeHtml(msg.text)}</div>
  `;
  return wrapper;
}

// basic escaping
function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function openChannel(channel) {
  // channel: { id, name, ... }
  if (!channel || !channel.id) return;
  currentChannelId = channel.id;
  document.getElementById("channelTitle").textContent = channel.name || "Channel";
  const list = document.getElementById("messagesList");
  list.innerHTML = "";

  // Reset pagination
  oldestMessageDate = undefined;
  await loadRecentMessages();

  // Join socket room
  const sock = createSocket();
  if (sock) {
    joinChannelRoom(currentChannelId);
    // Ensure receive handler set
    onReceiveMessage((msg) => {
      if (String(msg.channel) === String(currentChannelId) || msg.channel === currentChannelId) {
        // append
        const el = createMessageElement(msg);
        list.appendChild(el);
        // scroll to bottom for new messages
        list.scrollTop = list.scrollHeight;
      }
    });

    onPresenceUpdate((p) => {
      // p: { userId, online, count }
      updateOnlineUsersDisplay(p);
    });
  }
}

export async function loadRecentMessages() {
  if (!currentChannelId) return;
  try {
    const res = await getMessages(currentChannelId, { limit: PAGE_LIMIT });
    const messages = res.messages || [];
    const list = document.getElementById("messagesList");
    list.innerHTML = ""; // newest page loaded
    messages.forEach((m) => {
      const el = createMessageElement(m);
      list.appendChild(el);
    });
    // set oldestMessageDate
    if (messages.length > 0) {
      oldestMessageDate = messages[0].createdAt || messages[0].timestamp;
    }
    // scroll to bottom
    list.scrollTop = list.scrollHeight;
  } catch (err) {
    showError("Failed to load messages", err);
  }
}

export async function loadOlderMessages() {
  if (!currentChannelId || !oldestMessageDate) return;
  try {
    const res = await getMessages(currentChannelId, { before: oldestMessageDate, limit: PAGE_LIMIT });
    const messages = res.messages || [];
    if (!messages.length) return; // nothing older
    const list = document.getElementById("messagesList");
    // prepend older messages
    const frag = document.createDocumentFragment();
    messages.forEach((m) => {
      const el = createMessageElement(m);
      frag.appendChild(el);
    });
    // remember scroll pos to avoid jump
    const prevHeight = list.scrollHeight;
    list.prepend(frag);
    const newHeight = list.scrollHeight;
    // adjust scroll to keep view at same message
    list.scrollTop = newHeight - prevHeight;
    // update oldestMessageDate
    oldestMessageDate = messages[0].createdAt || messages[0].timestamp;
  } catch (err) {
    showError("Failed to load older messages", err);
  }
}

export function attachChatFormHandlers() {
  const form = document.getElementById("messageForm");
  if (!form) return;
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const input = document.getElementById("messageInput");
    const text = (input.value || "").trim();
    if (!text) return;
    // Send using socket if available, else fallback to REST
    const sock = getSocket();
    if (sock && sock.connected) {
      sendMessageSocket(currentChannelId, text);
    } else {
      try {
        await postMessage(currentChannelId, text);
      } catch (err) {
        showError("Failed to send message (REST)", err);
      }
    }
    input.value = "";
  });

  const loadOlderBtn = document.getElementById("loadOlderBtn");
  if (loadOlderBtn) {
    loadOlderBtn.addEventListener("click", (e) => {
      e.preventDefault();
      loadOlderMessages();
    });
  }
}

function updateOnlineUsersDisplay(presenceEvent) {
  // presenceEvent can be partial; here we fetch current online list from socket "presence_init" or maintain own state.
  // For simplicity we only show a simple indicator when presence updates arrive.
  const container = document.getElementById("onlineUsers");
  if (!container) return;
  // append or update user entry
  const { userId, online } = presenceEvent || {};
  let el = container.querySelector(`[data-user="${userId}"]`);
  if (!el) {
    el = document.createElement("div");
    el.dataset.user = userId;
    el.className = "online-user";
    el.textContent = `${userId} ${online ? "●" : "○"}`;
    container.appendChild(el);
  } else {
    el.textContent = `${userId} ${online ? "●" : "○"}`;
  }
}

// Exported for pages to initialize
export default {
  openChannel,
  loadRecentMessages,
  loadOlderMessages,
  attachChatFormHandlers,
};
