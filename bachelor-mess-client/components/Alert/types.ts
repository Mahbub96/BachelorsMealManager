/**
 * Single alert API: one parent component, variant decides look.
 * Add new variants here and in getVariantConfig — no new components.
 */

export type AlertVariant = 'info' | 'success' | 'error' | 'warning';

export interface AlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  variant?: AlertVariant;
  buttonText?: string;
  onConfirm?: () => void;
  secondaryButtonText?: string;
}

export interface AlertVariantConfig {
  icon: 'checkmark-circle' | 'close-circle' | 'warning' | 'information-circle';
  color: string;
}
