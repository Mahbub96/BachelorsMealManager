const mongoose = require('mongoose');

const PAGINATION_MAX_LIMIT = 500;
const PAGINATION_DEFAULT_LIMIT = 20;

/** Match only meal bazar (for meal rate). Includes legacy docs without type (null matches missing). */
function mealBazarMatch() {
  return { type: { $in: ['meal', null] } };
}

/** Match only flat bazar (shared equipment, split equally). */
function flatBazarMatch() {
  return { type: 'flat' };
}

/**
 * Builds userId scope for queries: group ($in) or single user.
 * @param {mongoose.Types.ObjectId|string} userId - Current user id
 * @param {mongoose.Types.ObjectId[]|null} groupMemberIds - From getGroupMemberIds; use group when length > 0
 * @returns {{ userId: ObjectId } | { userId: { $in: ObjectId[] } }}
 */
function buildUserScopeMatch(userId, groupMemberIds) {
  if (Array.isArray(groupMemberIds) && groupMemberIds.length > 0) {
    return { userId: { $in: groupMemberIds } };
  }
  const id =
    userId instanceof mongoose.Types.ObjectId
      ? userId
      : new mongoose.Types.ObjectId(userId);
  return { userId: id };
}

/**
 * Sum bazar totalAmount in a month for a scope (group or single user) and optional type filter.
 * @param {object} Bazar - Bazar model
 * @param {object} typeFilter - e.g. mealBazarMatch() or flatBazarMatch()
 * @param {mongoose.Types.ObjectId|string} userId - Current user id
 * @param {mongoose.Types.ObjectId[]|null} groupMemberIds - From getGroupMemberIds; null = single user
 * @param {{ firstDay: Date, lastDay: Date }} monthRange - From getCurrentMonthRange()
 * @returns {Promise<number>}
 */
async function getBazarSumInMonth(Bazar, typeFilter, userId, groupMemberIds, monthRange) {
  const scope = buildUserScopeMatch(userId, groupMemberIds);
  return aggregateSumInDateRange(Bazar, { ...typeFilter, ...scope }, monthRange);
}

/**
 * Returns current month date range (start and end of month in local time).
 * @returns {{ firstDay: Date, lastDay: Date }}
 */
function getCurrentMonthRange() {
  const now = new Date();
  return buildDateRangeForMonth(now.getMonth() + 1, now.getFullYear());
}

/**
 * Date range for a given calendar month (month 1-12, full year).
 * @param {number} month - 1-12
 * @param {number} year - Full year
 * @returns {{ firstDay: Date, lastDay: Date }}
 */
function buildDateRangeForMonth(month, year) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0, 23, 59, 59, 999);
  return { firstDay, lastDay };
}

/**
 * Current month date filter for MongoDB (value for "date" field).
 * @param {{ firstDay: Date, lastDay: Date }} [monthRange] - From getCurrentMonthRange() or buildDateRangeForMonth()
 * @returns {{ $gte: Date, $lte: Date }}
 */
function currentMonthDateFilterValue(monthRange) {
  const range = monthRange || getCurrentMonthRange();
  return { $gte: range.firstDay, $lte: range.lastDay };
}

/**
 * Full match object for "date in current month": { date: { $gte, $lte } }.
 * @param {{ firstDay: Date, lastDay: Date }} [monthRange]
 * @returns {{ date: { $gte: Date, $lte: Date } }}
 */
function buildCurrentMonthDateFilter(monthRange) {
  return { date: currentMonthDateFilterValue(monthRange) };
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
  if (opts.type) match.type = opts.type;
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
  if (opts.type) query.type = opts.type;
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
  buildDateRangeForMonth,
  currentMonthDateFilterValue,
  buildCurrentMonthDateFilter,
  buildDateMatch,
  buildStatsFilters,
  buildBazarMatchStage,
  mealBazarMatch,
  flatBazarMatch,
  buildUserScopeMatch,
  getBazarSumInMonth,
  aggregateStatsAmounts,
  aggregateSumInDateRange,
  buildBazarListQuery,
  findBazarEntriesPaginated,
  isValidDate,
  PAGINATION_MAX_LIMIT,
};
