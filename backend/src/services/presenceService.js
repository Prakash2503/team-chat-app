// backend/src/services/presenceService.js
/**
 * In-memory presence manager.
 *
 * Responsibilities:
 *  - Track sockets per user: Map<userId, Set<socketId>>
 *  - Provide helper methods to add/remove sockets and query online users
 *  - Emit 'presence_change' events via EventEmitter for external listeners
 *  - Optionally attach a Socket.IO `io` instance and broadcast `presence_update` events
 *
 * NOTE: This is in-memory and suitable for single-instance deployments (assignments).
 * For multi-instance production, use Redis or another shared store and the socket.io Redis adapter.
 */

import EventEmitter from "events";

class PresenceService extends EventEmitter {
  constructor() {
    super();
    /** @type {Map<string, Set<string>>} */
    this.map = new Map();
    /** @type {Server|null} Socket.IO instance for broadcasting (optional) */
    this.io = null;
  }

  /**
   * Attach a socket.io Server to broadcast presence updates automatically.
   * @param {import("socket.io").Server} io
   */
  setIo(io) {
    this.io = io;
  }

  /**
   * Add a socket connection for a user.
   * @param {string} userId
   * @param {string} socketId
   * @returns {number} active socket count after add
   */
  addSocket(userId, socketId) {
    if (!userId || !socketId) return 0;
    let s = this.map.get(userId);
    if (!s) {
      s = new Set();
      this.map.set(userId, s);
    }
    s.add(socketId);
    const count = s.size;
    this._emitChange(userId, true, count);
    return count;
  }

  /**
   * Remove a socket connection for a user.
   * @param {string} userId
   * @param {string} socketId
   * @returns {number} active socket count after removal
   */
  removeSocket(userId, socketId) {
    if (!userId || !socketId) return 0;
    const s = this.map.get(userId);
    if (!s) return 0;
    s.delete(socketId);
    let count = s.size;
    if (count === 0) {
      this.map.delete(userId);
      count = 0;
    }
    this._emitChange(userId, count > 0, count);
    return count;
  }

  /**
   * Get the number of active sockets for a user.
   * @param {string} userId
   * @returns {number}
   */
  getActiveCount(userId) {
    const s = this.map.get(userId);
    return s ? s.size : 0;
  }

  /**
   * Check if user is online
   * @param {string} userId
   * @returns {boolean}
   */
  isOnline(userId) {
    return this.getActiveCount(userId) > 0;
  }

  /**
   * Get an array of currently online userIds
   * @returns {string[]}
   */
  getOnlineUsers() {
    return Array.from(this.map.keys());
  }

  /**
   * Internal: emit presence change event and optionally broadcast to sockets via io
   * @param {string} userId
   * @param {boolean} online
   * @param {number} count
   */
  _emitChange(userId, online, count) {
    // Emit an event for listeners in the Node process
    this.emit("presence_change", { userId, online, count });

    // If socket.io is attached, broadcast a presence_update (global).
    // You can change this to broadcast to specific rooms if needed.
    if (this.io) {
      try {
        this.io.emit("presence_update", { userId, online, count });
      } catch (err) {
        // Don't crash if broadcast fails
        console.warn("presenceService: failed to emit via io:", err?.message || err);
      }
    }
  }

  /**
   * Utility: clear all state (useful for tests)
   */
  clearAll() {
    this.map.clear();
    this.emit("cleared");
  }
}

/* Export a singleton instance for easy import across modules */
const presenceService = new PresenceService();
export default presenceService;
