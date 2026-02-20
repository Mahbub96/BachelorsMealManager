/**
 * Reusable utilities - single entry for date, format, status, and meal helpers.
 */

export {
  toLocalDateString,
  dateStringToDate,
  formatDate,
  formatTime,
  formatDateTimeShort,
  formatDateAndTime,
  formatMealDate,
} from './dateUtils';

export { formatCurrency } from './formatUtils';

export {
  getStatusColor,
  getStatusBgColor,
  getStatusIcon,
  getStatusText,
  type ApprovalStatus,
  type ThemeStatusOverrides,
} from './statusUtils';

export { mealUtils } from './mealUtils';
export { logger } from './logger';
