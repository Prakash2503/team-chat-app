// frontend/js/api/authApi.js
// Auth-related REST calls: signup, login, me

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
 * POST /api/auth/signup
 * body: { username, password, displayName }
 * returns { user, token, message }
 */
export async function signup({ username, password, displayName }) {
  const res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, displayName }),
  });
  return handleResponse(res);
}

/**
 * POST /api/auth/login
 * body: { username, password }
 * returns { user, token }
 */
export async function login({ username, password }) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
}

/**
 * GET /api/auth/me
 * returns { user }
 */
export async function me() {
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });
  return handleResponse(res);
}
