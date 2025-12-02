// frontend/js/api/messageApi.js
// Message-related REST calls (pagination supported)

import { BASE_URL } from "../../config.js";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;
  if (!res.ok) {
    const err = { status: res.status, message: (data && data.message) || res.statusText, details: data };
    throw err;
  }
  return data;
}

/**
 * GET /api/channels/:id/messages?before=<ISO>&limit=20
 * - channelId: channel id
 * - options: { before: ISOString | Date, limit: number }
 * returns { messages: [...] }
 */
export async function getMessages(channelId, options = {}) {
  const params = new URLSearchParams();
  if (options.before) params.set("before", new Date(options.before).toISOString());
  if (options.limit) params.set("limit", String(options.limit));
  const q = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${BASE_URL}/api/channels/${channelId}/messages${q}`, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
  return handleResponse(res);
}

/**
 * POST /api/channels/:id/messages
 * Body: { text }
 * requires auth
 */
export async function postMessage(channelId, text) {
  const res = await fetch(`${BASE_URL}/api/channels/${channelId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ text }),
  });
  return handleResponse(res);
}

/**
 * DELETE /api/messages/:id  (optional)
 */
export async function deleteMessage(messageId) {
  const res = await fetch(`${BASE_URL}/api/channels/${messageId}/messages/${messageId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
  return handleResponse(res);
}
