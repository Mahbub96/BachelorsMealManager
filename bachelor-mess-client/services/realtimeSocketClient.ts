/**
 * Centralized realtime socket client — single connection, channel-based.
 * Matches backend socket hub: one WS, messages { channel, data }.
 * Use onChannel(channel, handler) for notification, dashboard, etc. Extensible without new connections.
 */
import { config } from './config';

/** Channel names — keep in sync with backend src/ws/channels.js */
export const CHANNELS = {
  NOTIFICATION: 'notification',
  DASHBOARD: 'dashboard',
} as const;

export type ChannelName = (typeof CHANNELS)[keyof typeof CHANNELS];

interface HubMessage {
  channel: string;
  data: unknown;
}

const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_MS = 1000;
const MAX_RECONNECT_MS = 30000;

let ws: WebSocket | null = null;
let reconnectAttempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let currentToken: string | null = null;
/** channel -> Set of handlers */
const channelHandlers = new Map<string, Set<(data: unknown) => void>>();

function getReconnectDelay(): number {
  const delay = Math.min(
    INITIAL_RECONNECT_MS * Math.pow(2, reconnectAttempt),
    MAX_RECONNECT_MS
  );
  reconnectAttempt += 1;
  return delay;
}

function clearReconnect(): void {
  if (reconnectTimer != null) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  reconnectAttempt = 0;
}

function getWsUrl(): string {
  return config.realtimeWsUrl;
}

function connectInternal(wsUrl: string, token: string): void {
  if (!wsUrl || !token) return;
  const url = `${wsUrl}?token=${encodeURIComponent(token)}`;
  try {
    ws = new WebSocket(url);
    ws.onopen = () => {
      clearReconnect();
    };
    ws.onmessage = event => {
      try {
        const msg = JSON.parse(event.data as string) as HubMessage;
        if (msg && typeof msg.channel === 'string') {
          const handlers = channelHandlers.get(msg.channel);
          if (handlers) {
            handlers.forEach(cb => cb(msg.data));
          }
        }
      } catch {
        // ignore non-JSON or invalid
      }
    };
    ws.onclose = () => {
      ws = null;
      if (
        currentToken &&
        channelHandlers.size > 0 &&
        reconnectAttempt < MAX_RECONNECT_ATTEMPTS
      ) {
        const delay = getReconnectDelay();
        reconnectTimer = setTimeout(
          () => connectInternal(wsUrl, currentToken!),
          delay
        );
      }
    };
    ws.onerror = () => {};
  } catch (e) {
    if (__DEV__) console.warn('realtimeSocketClient connect failed', e);
  }
}

/**
 * Connect to the centralized socket hub. Call when user is logged in.
 * Single connection used for all channels (notification, dashboard, …).
 */
export function connectRealtimeSocket(token: string): void {
  disconnectRealtimeSocket();
  currentToken = token;
  const wsUrl = getWsUrl();
  if (wsUrl && token) connectInternal(wsUrl, token);
}

/**
 * Disconnect and stop reconnecting.
 */
export function disconnectRealtimeSocket(): void {
  clearReconnect();
  currentToken = null;
  if (ws) {
    try {
      ws.close();
    } catch {}
    ws = null;
  }
}

/**
 * Subscribe to a channel. Returns unsubscribe.
 * Multiple features can subscribe to different channels over the same connection.
 */
export function onChannel(
  channel: string,
  handler: (data: unknown) => void
): () => void {
  if (!channelHandlers.has(channel)) {
    channelHandlers.set(channel, new Set());
  }
  channelHandlers.get(channel)!.add(handler);
  return () => {
    const set = channelHandlers.get(channel);
    if (set) {
      set.delete(handler);
      if (set.size === 0) channelHandlers.delete(channel);
    }
  };
}

export function isRealtimeConnected(): boolean {
  return ws != null && ws.readyState === WebSocket.OPEN;
}
