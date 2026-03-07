/**
 * Centralized channel names for the socket hub.
 * Add new channels here when extending (e.g. dashboard, activity).
 * Keeps one contract and avoids magic strings across features.
 */
module.exports = {
  NOTIFICATION: 'notification',
  DASHBOARD: 'dashboard',
  // ACTIVITY: 'activity',
  // MEALS: 'meals',
};
