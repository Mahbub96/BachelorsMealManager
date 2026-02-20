const mongoose = require('mongoose');

/**
 * Normalize req.user id to ObjectId. If missing or invalid, send 400 and return null.
 * @param {object} req - Express request (req.user._id or req.user.id)
 * @param {object} res - Express response (used to send 400 on error)
 * @returns {mongoose.Types.ObjectId | null} - userId as ObjectId or null if invalid
 */
function normalizeUserId(req, res) {
  let userId = req.user?._id ?? req.user?.id;
  if (!userId) {
    res.status(400).json({ success: false, error: 'User context missing' });
    return null;
  }
  if (typeof userId === 'string') {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ success: false, error: 'Invalid user context' });
      return null;
    }
    userId = new mongoose.Types.ObjectId(userId);
  }
  return userId;
}

/**
 * Build current-month date filter for queries (Meal, Bazar).
 * @param {{ firstDay: Date, lastDay: Date }} monthRange - from getCurrentMonthRange()
 * @returns {{ $gte: Date, $lte: Date }}
 */
function currentMonthDateFilter(monthRange) {
  return {
    $gte: monthRange.firstDay,
    $lte: monthRange.lastDay,
  };
}

/**
 * Compute days since a given date (e.g. last meal date).
 * @param {Date | string | null} fromDate
 * @param {Date} [refDate] - default now
 * @returns {number}
 */
function daysSince(fromDate, refDate = new Date()) {
  if (!fromDate) return 0;
  const from = fromDate instanceof Date ? fromDate : new Date(fromDate);
  return Math.floor((refDate - from) / (1000 * 60 * 60 * 24));
}

/**
 * Compute percentage as (numerator / denominator) * 100, 0 when denominator is 0.
 * Use for meal efficiency (approvedCount/totalEntries) or bazar (approvedAmount/totalAmount).
 * @param {number} numerator
 * @param {number} denominator
 * @returns {number} 0-100 rounded
 */
function ratioPercent(numerator, denominator) {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

/** @deprecated Use ratioPercent. Kept for backward compatibility. */
function efficiencyPercent(approvedCount, totalEntries) {
  return ratioPercent(approvedCount, totalEntries);
}

/**
 * Safe average amount (e.g. bazar totalAmount / totalEntries). Returns 0 when no entries.
 * @param {number} totalAmount
 * @param {number} totalEntries
 * @returns {number}
 */
function safeAverage(totalAmount, totalEntries) {
  return totalEntries > 0 ? totalAmount / totalEntries : 0;
}

module.exports = {
  normalizeUserId,
  currentMonthDateFilter,
  daysSince,
  ratioPercent,
  efficiencyPercent,
  safeAverage,
};
