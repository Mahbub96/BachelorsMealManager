/**
 * Centralized WebSocket hub (uWebSockets.js).
 * Single server, channel-based messaging: one connection per user, multiple features.
 * Memory-efficient (~1 KB/conn), extensible: add channels in channels.js and push from any service.
 * @see https://github.com/uNetworking/uWebSockets.js
 */
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let uWS = null;
try {
  uWS = require('uWebSockets.js');
} catch (e) {
  logger.warn('uWebSockets.js not installed; realtime socket disabled. Install: yarn add uNetworking/uWebSockets.js#v20.58.0');
}

/** userId -> Set<ws> (one user can have multiple tabs/devices) */
const userSockets = new Map();
let listenSocket = null;
let app = null;

function getUserIdFromToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!token || typeof token !== 'string' || !secret || secret.length < 32) return null;
  const trimmed = token.trim();
  if (!trimmed) return null;
  try {
    const decoded = jwt.verify(trimmed, secret, { algorithms: ['HS256'] });
    return decoded.id ? String(decoded.id) : null;
  } catch {
    return null;
  }
}

function registerSocket(userId, ws) {
  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId).add(ws);
}

function unregisterSocket(userId, ws) {
  const set = userSockets.get(userId);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) userSockets.delete(userId);
}

/**
 * Push a message to one or more users on a channel.
 * Payload is sent as { channel, data } so client can route without opening multiple connections.
 * @param {string|string[]} userIds - Recipient user ID(s)
 * @param {string} channel - Channel name (use constants from ./channels)
 * @param {object} data - Serializable payload for this channel
 */
function pushToChannel(userIds, channel, data) {
  if (!app || !channel) return;
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  const msg = JSON.stringify({ channel, data });
  for (const userId of ids) {
    const set = userSockets.get(String(userId));
    if (!set) continue;
    for (const ws of set) {
      try {
        ws.send(msg, false);
      } catch (e) {
        logger.warn('socketHub push failed', { userId, channel, error: e?.message });
      }
    }
  }
}

/**
 * Start the WebSocket server. Auth via query: ?token=JWT
 * @param {number} port
 * @returns {boolean} true if listening
 */
function start(port) {
  if (!uWS) return false;
  const secret = process.env.JWT_SECRET;
  if (!secret || typeof secret !== 'string' || secret.length < 32) {
    logger.warn('Socket hub not started: JWT_SECRET missing or too short (min 32 chars)');
    return false;
  }
  app = uWS.App();
  app.ws('/*', {
    compression: uWS.SHARED_COMPRESSOR,
    maxPayloadLength: 64 * 1024,
    idleTimeout: 120,
    upgrade: (res, req, context) => {
      const token = req.getQuery('token');
      const userId = getUserIdFromToken(token);
      if (!userId) {
        res.writeStatus('401').end('Unauthorized');
        return;
      }
      // Never log token or query string
      res.upgrade(
        { userId },
        req.getHeader('sec-websocket-key'),
        req.getHeader('sec-websocket-protocol'),
        req.getHeader('sec-websocket-extensions'),
        context
      );
    },
    open: (ws) => {
      const data = ws.getUserData && ws.getUserData();
      const userId = (data && data.userId) || ws.userId;
      if (!userId) return;
      ws.userId = userId;
      registerSocket(userId, ws);
      logger.info('Socket connected', { userId, total: userSockets.size });
    },
    message: () => { },
    close: (ws) => {
      if (ws.userId) unregisterSocket(ws.userId, ws);
    },
  });
  app.any('/*', (res) => {
    res.writeStatus('400').end('Use WebSocket upgrade');
  });
  listenSocket = app.listen(port, (token) => {
    if (token) logger.info(`Socket hub listening on port ${port}`);
    else logger.error(`Socket hub failed to listen on port ${port}`);
  });
  return !!listenSocket;
}

function stop() {
  if (listenSocket && uWS && typeof uWS.us_listen_socket_close === 'function') {
    try {
      uWS.us_listen_socket_close(listenSocket);
    } catch (e) {
      logger.warn('socketHub stop', e?.message);
    }
    listenSocket = null;
  }
  app = null;
  userSockets.clear();
}

function isAvailable() {
  return !!uWS;
}

module.exports = {
  start,
  stop,
  pushToChannel,
  isAvailable,
};
