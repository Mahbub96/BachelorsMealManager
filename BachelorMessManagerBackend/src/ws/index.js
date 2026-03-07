/**
 * Centralized WebSocket layer — single entry for realtime features.
 * Use socketHub for server; use channels for consistent channel names.
 */
const socketHub = require('./socketHub');
const CHANNELS = require('./channels');

module.exports = {
  ...socketHub,
  CHANNELS,
};
