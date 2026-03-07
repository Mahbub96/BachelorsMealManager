/**
 * Shared notification UI and routing helpers.
 * Used by notifications screen and any component that displays or routes from notifications.
 */

import type { IconName } from '@/constants/IconTypes';

export const NOTIFICATION_TYPE_CONFIG: Record<
  string,
  { icon: string; color: string; bg: string }
> = {
  bazar_submitted: { icon: 'cart', color: '#f59e0b', bg: '#fef3c7' },
  bazar_approved: { icon: 'cart', color: '#10b981', bg: '#d1fae5' },
  bazar_rejected: { icon: 'cart', color: '#ef4444', bg: '#fee2e2' },
  meal_submitted: { icon: 'restaurant', color: '#f59e0b', bg: '#fef3c7' },
  meal_approved: { icon: 'restaurant', color: '#10b981', bg: '#d1fae5' },
  meal_rejected: { icon: 'restaurant', color: '#ef4444', bg: '#fee2e2' },
  payment_requested: { icon: 'cash', color: '#6366f1', bg: '#ede9fe' },
  payment_approved: { icon: 'checkmark-circle', color: '#10b981', bg: '#d1fae5' },
  payment_rejected: { icon: 'close-circle', color: '#ef4444', bg: '#fee2e2' },
  refund_sent: { icon: 'cash-outline', color: '#8b5cf6', bg: '#ede9fe' },
  refund_acknowledged: { icon: 'checkmark-done', color: '#10b981', bg: '#d1fae5' },
  vote_started: { icon: 'people', color: '#0ea5e9', bg: '#e0f2fe' },
  vote_cast: { icon: 'thumbs-up', color: '#0ea5e9', bg: '#e0f2fe' },
  election_started: { icon: 'medal', color: '#f97316', bg: '#ffedd5' },
  removal_requested: { icon: 'exit', color: '#f97316', bg: '#ffedd5' },
  removal_resolved: { icon: 'exit', color: '#6b7280', bg: '#f3f4f6' },
};

const DEFAULT_TYPE_CONFIG = { icon: 'notifications', color: '#667eea', bg: '#ede9fe' };

export function getNotificationTypeConfig(type: string): {
  icon: string;
  color: string;
  bg: string;
} {
  return NOTIFICATION_TYPE_CONFIG[type] ?? DEFAULT_TYPE_CONFIG;
}

export function toRefIdString(refId: unknown): string | undefined {
  if (refId == null) return undefined;
  if (typeof refId === 'string') return refId.trim() || undefined;
  if (typeof (refId as { toString?: () => string }).toString === 'function')
    return (refId as { toString: () => string }).toString();
  if (typeof (refId as { $oid?: string }).$oid === 'string')
    return (refId as { $oid: string }).$oid;
  return undefined;
}

export type NotificationRoute =
  | { pathname: string; params?: Record<string, string> }
  | null;

/**
 * Resolves app route for a notification from refType/refId or from type as fallback.
 */
export function getNotificationRoute(
  refType?: string,
  refId?: string,
  type?: string
): NotificationRoute {
  const id = toRefIdString(refId);
  if (refType && id) {
    switch (refType) {
      case 'Bazar':
        return { pathname: '/bazar-details', params: { id } };
      case 'Meal':
        return { pathname: '/(tabs)/meals' };
      case 'PaymentRequest':
      case 'Refund':
        return { pathname: '/payments' };
      case 'AdminChangeRequest':
        return { pathname: '/(tabs)/admin' };
      case 'Election':
        return { pathname: '/(tabs)/explore' };
      case 'RemovalRequest':
      case 'User':
        return { pathname: '/profile' };
      default:
        break;
    }
  }
  if (!type) return null;
  if (type.startsWith('bazar_')) return { pathname: '/(tabs)/explore' };
  if (type.startsWith('meal_')) return { pathname: '/(tabs)/meals' };
  if (type.startsWith('payment_') || type.startsWith('refund_'))
    return { pathname: '/payments' };
  if (type.startsWith('removal_')) return { pathname: '/profile' };
  if (
    type === 'vote_started' ||
    type === 'vote_cast' ||
    type === 'election_started'
  )
    return { pathname: '/(tabs)/explore' };
  return null;
}

/** Relative time string for notification date. */
export function notificationTimeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d === 1) return 'Yesterday';
  return `${d}d ago`;
}
