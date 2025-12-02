// frontend/js/api/channelApi.js
// Channel-related REST calls

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
 * GET /api/channels
 * returns { channels: [...] }
 */
export async function getChannels() {
  const res = await fetch(`${BASE_URL}/api/channels`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
}

/**
 * POST /api/channels
 * body: { name, description?, isPrivate? }
 * requires auth
 */
export async function createChannel({ name, description = "", isPrivate = false }) {
  const res = await fetch(`${BASE_URL}/api/channels`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name, description, isPrivate }),
  });
  return handleResponse(res);
}

/**
 * POST /api/channels/:id/join
 * requires auth
 */
export async function joinChannel(channelId) {
  const res = await fetch(`${BASE_URL}/api/channels/${channelId}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
  return handleResponse(res);
}

/**
 * POST /api/channels/:id/leave
 * requires auth
 */
export async function leaveChannel(channelId) {
  const res = await fetch(`${BASE_URL}/api/channels/${channelId}/leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
  return handleResponse(res);
}

/**
 * GET /api/channels/:id
 * get channel details
 */
export async function getChannel(channelId) {
  const res = await fetch(`${BASE_URL}/api/channels/${channelId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
  return handleResponse(res);
}
