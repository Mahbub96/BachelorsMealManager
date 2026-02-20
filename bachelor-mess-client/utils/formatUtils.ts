/**
 * Reusable formatting for currency and numbers.
 */

/** Format amount as currency (e.g. "৳1,234"). */
export function formatCurrency(amount: number, symbol = '৳'): string {
  return `${symbol}${amount.toLocaleString()}`;
}
