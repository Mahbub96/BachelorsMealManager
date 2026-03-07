/**
 * Centralized config — all app configuration in one file.
 * Change any value here to control the app. Env vars override where noted.
 */

export const config = {
  // ─── UI / UX ─────────────────────────────────────────────────────────────
  pressThrottleMs: 500,
  searchDebounceMs: 300,
  animationDurationMs: 300,

  // ─── Notifications ───────────────────────────────────────────────────────
  /** Poll interval for unread count; when count increases we refresh full list for instant delivery. */
  notificationPollIntervalMs: 5_000,
  notificationListPageSize: 30,
  notificationListPageSizeMax: 50,

  // ─── API / Network (env overrides in services/config.ts) ──────────────────
  apiTimeoutMs: 10_000,
  apiMaxRetries: 3,
  apiRetryDelayMs: 1_000,
  apiCacheDurationMs: 5 * 60 * 1000,

  // ─── Pagination ──────────────────────────────────────────────────────────
  paginationDefaultLimit: 20,
  paginationMaxLimit: 50,
  bazarLimit: 500,

  // ─── Cache / Offline ─────────────────────────────────────────────────────
  defaultCacheMs: 30_000,
  offlineSyncIntervalMs: 30_000,
  offlineExpiryMs: 24 * 60 * 60 * 1000,
} as const;

export type Config = typeof config;
export default config;
