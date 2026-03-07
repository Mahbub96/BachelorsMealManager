import type { ThemeColors } from '@/constants/Theme';
import type { AlertVariant, AlertVariantConfig } from './types';

/**
 * One place to define how each variant looks (icon + theme color).
 * App decides which config to use from params — no separate component per type.
 */
export function getVariantConfig(
  theme: ThemeColors,
  variant: AlertVariant
): AlertVariantConfig {
  const t = theme;
  const fallback = t.text?.primary ?? t.primary;
  const configs: Record<AlertVariant, AlertVariantConfig> = {
    success: {
      icon: 'checkmark-circle',
      color: t.status?.success ?? t.gradient?.success?.[0] ?? fallback,
    },
    error: {
      icon: 'close-circle',
      color: t.status?.error ?? t.gradient?.error?.[0] ?? fallback,
    },
    warning: {
      icon: 'warning',
      color: t.status?.warning ?? t.gradient?.warning?.[0] ?? fallback,
    },
    info: {
      icon: 'information-circle',
      color: t.status?.info ?? t.primary ?? fallback,
    },
  };
  return configs[variant];
}
