const mongoose = require('mongoose');

const PAGINATION_MAX_LIMIT = 500;
const PAGINATION_DEFAULT_LIMIT = 20;

/**
 * Returns current month date range (start and end of month in local time).
 * @returns {{ firstDay: Date, lastDay: Date }}
 */
function getCurrentMonthRange() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
  return { firstDay, lastDay };
}

/**
 * Builds MongoDB date match for query/aggregation.
 * @param {string} [startDate] - ISO date string
 * @param {string} [endDate] - ISO date string
 * @param {{ defaultCurrentMonth?: boolean }} [options] - If true and no dates given, use current month
 * @returns {object|null} - Query fragment for date (e.g. { date: { $gte, $lte } }) or null
 */
function isValidDate(value) {
  if (value == null || value === '') return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

function buildDateMatch(startDate, endDate, options = {}) {
  if (startDate && endDate && isValidDate(startDate) && isValidDate(endDate)) {
    return {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };
  }
  if (options.defaultCurrentMonth) {
    const { firstDay, lastDay } = getCurrentMonthRange();
    return { date: { $gte: firstDay, $lte: lastDay } };
  }
  return null;
}

/**
 * Builds filters object for Bazar.getStats / Bazar.getUserStats (startDate, endDate). Only includes valid dates.
 * @param {string} [startDate] - ISO date string
 * @param {string} [endDate] - ISO date string
 * @returns {{ startDate?: string, endDate?: string }}
 */
function buildStatsFilters(startDate, endDate) {
  const filters = {};
  if (startDate && isValidDate(startDate)) filters.startDate = startDate;
  if (endDate && isValidDate(endDate)) filters.endDate = endDate;
  return filters;
}

/**
 * Builds match stage for Bazar aggregation (userId or userIds, optional date, optional status).
 * @param {{ userId?: ObjectId|string, userIds?: ObjectId[], startDate?: string, endDate?: string, status?: string, defaultCurrentMonth?: boolean }} opts
 * @returns {object} - Match stage for $match
 */
function buildBazarMatchStage(opts = {}) {
  const match = {};
  if (opts.userIds && Array.isArray(opts.userIds) && opts.userIds.length > 0) {
    match.userId = { $in: opts.userIds };
  } else if (opts.userId) {
    match.userId =
      opts.userId instanceof mongoose.Types.ObjectId
        ? opts.userId
        : new mongoose.Types.ObjectId(opts.userId);
  }
  const dateMatch = buildDateMatch(
    opts.startDate,
    opts.endDate,
    opts.defaultCurrentMonth ? { defaultCurrentMonth: true } : {}
  );
  if (dateMatch) Object.assign(match, dateMatch);
  if (opts.status) match.status = opts.status;
  return match;
}

/**
 * Aggregation pipeline for bazar stats as amounts (totalAmount, pendingAmount, approvedAmount).
 * Used by user-stats/bazar and dashboard. Single source of truth.
 * @param {object} matchStage - $match stage (e.g. { userId } or { userId: { $in: ids } })
 * @returns {Promise<{ totalAmount: number, totalEntries: number, pendingAmount: number, approvedAmount: number }>}
 */
async function aggregateStatsAmounts(Bazar, matchStage) {
  const stats = await Bazar.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$totalAmount' },
        totalEntries: { $sum: 1 },
        pendingAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'pending'] }, '$totalAmount', 0],
          },
        },
        approvedAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'approved'] }, '$totalAmount', 0],
          },
        },
      },
    },
  ]);
  return (
    stats[0] || {
      totalAmount: 0,
      totalEntries: 0,
      pendingAmount: 0,
      approvedAmount: 0,
    }
  );
}

/**
 * Sum of totalAmount for bazar entries in a date range (e.g. current month).
 * @param {object} Bazar - Bazar model
 * @param {object} baseMatch - Base match (e.g. { userId } or { userId: { $in: ids } })
 * @param {{ firstDay: Date, lastDay: Date }} range - From getCurrentMonthRange()
 * @returns {Promise<number>}
 */
async function aggregateSumInDateRange(Bazar, baseMatch, range) {
  const match = {
    ...baseMatch,
    date: { $gte: range.firstDay, $lte: range.lastDay },
  };
  const result = await Bazar.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);
  return result[0]?.total ?? 0;
}

/**
 * Builds Bazar find() query for list endpoints (getUserBazar, getAllBazar).
 * @param {{ userId?: ObjectId|string, userIds?: ObjectId[], status?: string, startDate?: string, endDate?: string, defaultCurrentMonth?: boolean }} opts
 * @returns {object} - Query for Bazar.find()
 */
function buildBazarListQuery(opts = {}) {
  const query = {};
  if (opts.userIds && Array.isArray(opts.userIds) && opts.userIds.length > 0) {
    const validIds = opts.userIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );
    if (validIds.length > 0) {
      query.userId = { $in: validIds.map((id) => new mongoose.Types.ObjectId(id)) };
    }
  } else if (opts.userId && mongoose.Types.ObjectId.isValid(opts.userId)) {
    query.userId =
      opts.userId instanceof mongoose.Types.ObjectId
        ? opts.userId
        : new mongoose.Types.ObjectId(opts.userId);
  }
  const dateMatch = buildDateMatch(
    opts.startDate,
    opts.endDate,
    opts.defaultCurrentMonth ? { defaultCurrentMonth: true } : {}
  );
  if (dateMatch) Object.assign(query, dateMatch);
  if (opts.status) query.status = opts.status;
  return query;
}

/**
 * Fetches bazar entries with pagination and standard populate/sort.
 * @param {object} Bazar - Bazar model
 * @param {object} query - From buildBazarListQuery
 * @param {{ limit: number, page: number }} pagination
 * @returns {Promise<{ bazarEntries: any[], pagination: { page, limit, total, pages } }>}
 */
async function findBazarEntriesPaginated(Bazar, query, { limit = 20, page = 1 } = {}) {
  const limitNum = Math.min(
    Math.max(1, parseInt(limit, 10) || PAGINATION_DEFAULT_LIMIT),
    PAGINATION_MAX_LIMIT
  );
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const skip = (pageNum - 1) * limitNum;

  const [bazarEntries, total] = await Promise.all([
    Bazar.find(query)
      .populate('userId', 'name email')
      .populate('approvedBy', 'name')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Bazar.countDocuments(query),
  ]);

  return {
    bazarEntries,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum) || 1,
    },
  };
}

module.exports = {
  getCurrentMonthRange,
  buildDateMatch,
  buildStatsFilters,
  buildBazarMatchStage,
  aggregateStatsAmounts,
  aggregateSumInDateRange,
  buildBazarListQuery,
  findBazarEntriesPaginated,
  isValidDate,
  PAGINATION_MAX_LIMIT,
};
