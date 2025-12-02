// backend/src/utils/validators.js
/**
 * Lightweight validation helpers + Express middleware wrappers.
 *
 * Exported helpers:
 *  - isValidUsername(username)
 *  - isValidPassword(password)
 *  - isValidDisplayName(displayName)
 *  - isValidChannelName(name)
 *  - isValidMessageText(text)
 *
 * Exported Express middleware:
 *  - validateSignup (checks username + password + optional displayName)
 *  - validateLogin (checks username + password)
 *  - validateCreateChannel (checks channel name)
 *  - validateCreateMessage (checks message text)
 *
 * These are intentionally simple and assignment-friendly. For production,
 * consider using a library like Joi or Zod for richer validation.
 */

import { json } from "express";

/* ---------- Basic validators ---------- */

/**
 * Username rules:
 *  - required
 *  - 3..30 characters
 *  - alphanumeric plus dot/underscore/hyphen
 *  - starts with letter or digit
 */
export function isValidUsername(username) {
  if (typeof username !== "string") return false;
  const s = username.trim();
  if (s.length < 3 || s.length > 30) return false;
  const re = /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,29}$/;
  return re.test(s);
}

/**
 * Password rules:
 *  - required
 *  - 6..128 characters
 *  - no other constraints here; you may add complexity requirements
 */
export function isValidPassword(password) {
  if (typeof password !== "string") return false;
  const len = password.length;
  return len >= 6 && len <= 128;
}

/**
 * Display name: optional but if provided length 1..50
 */
export function isValidDisplayName(displayName) {
  if (displayName === undefined || displayName === null) return true;
  if (typeof displayName !== "string") return false;
  const s = displayName.trim();
  return s.length >= 1 && s.length <= 50;
}

/**
 * Channel name:
 *  - required
 *  - 1..50 chars
 *  - letters, numbers, spaces, underscores, hyphens
 *  - no leading/trailing whitespace when saved (controllers should trim)
 */
export function isValidChannelName(name) {
  if (typeof name !== "string") return false;
  const s = name.trim();
  if (s.length < 1 || s.length > 50) return false;
  const re = /^[\w\s-]{1,50}$/u;
  return re.test(s);
}

/**
 * Message text:
 *  - required
 *  - 1..2000 chars
 */
export function isValidMessageText(text) {
  if (typeof text !== "string") return false;
  const s = text.trim();
  if (s.length < 1 || s.length > 2000) return false;
  return true;
}

/* ---------- Express middleware wrappers ---------- */

/**
 * Helper to send consistent validation errors
 */
function badRequest(res, details) {
  return res.status(400).json({ message: "Validation error", details });
}

export function validateSignup(req, res, next) {
  const { username, password, displayName } = req.body;
  const errors = {};
  if (!isValidUsername(username)) errors.username = "Invalid username (3-30 chars; letters, numbers, ._- allowed)";
  if (!isValidPassword(password)) errors.password = "Invalid password (min 6 chars)";
  if (!isValidDisplayName(displayName)) errors.displayName = "Invalid displayName (1-50 chars)";
  if (Object.keys(errors).length) return badRequest(res, errors);
  return next();
}

export function validateLogin(req, res, next) {
  const { username, password } = req.body;
  const errors = {};
  if (!isValidUsername(username)) errors.username = "Invalid username";
  if (!isValidPassword(password)) errors.password = "Invalid password";
  if (Object.keys(errors).length) return badRequest(res, errors);
  return next();
}

export function validateCreateChannel(req, res, next) {
  const { name } = req.body;
  if (!isValidChannelName(name)) {
    return badRequest(res, { name: "Invalid channel name (1-50 chars; letters, numbers, spaces, _ -)" });
  }
  return next();
}

export function validateCreateMessage(req, res, next) {
  const { text } = req.body;
  if (!isValidMessageText(text)) {
    return badRequest(res, { text: "Invalid message text (1-2000 characters)" });
  }
  return next();
}

/* ---------- Export default (optional) ---------- */
export default {
  isValidUsername,
  isValidPassword,
  isValidDisplayName,
  isValidChannelName,
  isValidMessageText,
  validateSignup,
  validateLogin,
  validateCreateChannel,
  validateCreateMessage,
};
