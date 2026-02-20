/**
 * Reusable approval status (pending / approved / rejected) colors and icons.
 * Used for meals, bazar, and any entity with approval workflow.
 */

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

const STATUS_COLORS: Record<ApprovalStatus, string> = {
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
};

const STATUS_BG_COLORS: Record<ApprovalStatus, string> = {
  pending: '#fffbeb',
  approved: '#ecfdf5',
  rejected: '#fef2f2',
};

/** Ionicon names for status. */
const STATUS_ICONS: Record<ApprovalStatus, string> = {
  pending: 'time',
  approved: 'checkmark-circle',
  rejected: 'close-circle',
};

export type ThemeStatusOverrides = {
  status?: { success?: string; warning?: string; error?: string };
  gradient?: { success?: string[]; warning?: string[]; error?: string[] };
  text?: { tertiary?: string };
  cardBackground?: string;
  surface?: string;
};

/** Get status text color. Pass theme for theme-aware colors (e.g. BazarCard). */
export function getStatusColor(
  status: string,
  theme?: ThemeStatusOverrides
): string {
  const s = status?.toLowerCase() as ApprovalStatus;
  if (theme?.status) {
    if (s === 'approved') return theme.status.success ?? STATUS_COLORS.approved;
    if (s === 'pending') return theme.status.warning ?? STATUS_COLORS.pending;
    if (s === 'rejected') return theme.status.error ?? STATUS_COLORS.rejected;
  }
  if (theme?.gradient) {
    if (s === 'approved') return theme.gradient?.success?.[0] ?? STATUS_COLORS.approved;
    if (s === 'pending') return theme.gradient?.warning?.[0] ?? STATUS_COLORS.pending;
    if (s === 'rejected') return theme.gradient?.error?.[0] ?? STATUS_COLORS.rejected;
  }
  return STATUS_COLORS[s] ?? theme?.text?.tertiary ?? '#6b7280';
}

/** Get status background color (light tint). */
export function getStatusBgColor(
  status: string,
  theme?: ThemeStatusOverrides
): string {
  const s = status?.toLowerCase() as ApprovalStatus;
  const color = getStatusColor(status, theme);
  if (theme && (theme.status || theme.gradient)) {
    return color + '20';
  }
  return STATUS_BG_COLORS[s] ?? theme?.cardBackground ?? theme?.surface ?? '#f3f4f6';
}

/** Get Ionicon name for status. */
export function getStatusIcon(status: string): string {
  const s = status?.toLowerCase() as ApprovalStatus;
  return STATUS_ICONS[s] ?? 'help-circle';
}

/** Capitalize status for display. */
export function getStatusText(status: string): string {
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : '';
}
