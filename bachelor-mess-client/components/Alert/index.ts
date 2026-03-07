/**
 * Single parent alert: one component, one API.
 * Call showAppAlert(title, message, { variant }) — app decides which type to show.
 * Add new types by extending AlertVariant and getVariantConfig only.
 */
export { Alert } from './Alert';
export { getVariantConfig } from './getVariantConfig';
export type { AlertProps, AlertVariant, AlertVariantConfig } from './types';
