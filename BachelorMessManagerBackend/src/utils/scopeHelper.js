const User = require('../models/User');
const { getGroupMemberIds } = require('./groupHelper');
const { buildUserScopeMatch, mealBazarMatch, buildCurrentMonthDateFilter, getCurrentMonthRange } = require('./bazarHelper');
const { aggregateMealStats } = require('./mealHelper');

/**
 * Resolve scope for dashboard/reports: group (admin), app-wide (super_admin), or single user.
 * @param {object} user - req.user (must have _id/id, role)
 * @returns {Promise<{ groupMemberIds: ObjectId[]|null, useGroup: boolean, appWide: boolean, userId: any }>}
 */
async function resolveScope(user) {
  const userId = user?._id ?? user?.id;
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'super_admin';

  let groupMemberIds = null;
  if (isAdmin) {
    try {
      groupMemberIds = await getGroupMemberIds(user);
    } catch (_) {
      // useGroup stays false
    }
  }

  const useGroup = Array.isArray(groupMemberIds) && groupMemberIds.length > 0;
  const appWide = isSuperAdmin;

  return { groupMemberIds, useGroup, appWide, userId };
}

/**
 * Build Meal $match for a date range and scope (group / app-wide / single user).
 * @param {{ groupMemberIds: any, useGroup: boolean, appWide: boolean, userId: any }} scope - From resolveScope()
 * @param {{ date: { $gte, $lte } }} dateFilter - e.g. buildCurrentMonthDateFilter()
 * @param {{ status?: string }} [opts]
 * @returns {object}
 */
function buildMealMatch(scope, dateFilter, opts = {}) {
  const base = { ...dateFilter };
  if (opts.status) base.status = opts.status;
  if (scope.useGroup) base.userId = { $in: scope.groupMemberIds };
  else if (!scope.appWide) base.userId = scope.userId;
  return base;
}

/**
 * Build Bazar $match for a date range, scope, and type filter (meal/flat).
 * @param {{ groupMemberIds: any, useGroup: boolean, appWide: boolean, userId: any }} scope
 * @param {{ date: { $gte, $lte } }} dateFilter
 * @param {object} typeFilter - e.g. mealBazarMatch() or flatBazarMatch()
 * @param {{ status?: string }} [opts]
 * @returns {object}
 */
function buildBazarMatch(scope, dateFilter, typeFilter, opts = {}) {
  const base = { ...typeFilter, ...dateFilter };
  if (opts.status) base.status = opts.status;
  if (scope.useGroup) base.userId = { $in: scope.groupMemberIds };
  else if (!scope.appWide) base.userId = scope.userId;
  return base;
}

/**
 * Meal match without date (for pending counts, etc.).
 */
function buildMealMatchAll(scope, opts = {}) {
  const base = {};
  if (opts.status) base.status = opts.status;
  if (scope.useGroup) base.userId = { $in: scope.groupMemberIds };
  else if (!scope.appWide) base.userId = scope.userId;
  return base;
}

/**
 * Bazar match without date (for pending counts, etc.).
 */
function buildBazarMatchAll(scope, typeFilter, opts = {}) {
  const base = { ...typeFilter };
  if (opts.status) base.status = opts.status;
  if (scope.useGroup) base.userId = { $in: scope.groupMemberIds };
  else if (!scope.appWide) base.userId = scope.userId;
  return base;
}

/**
 * Build Meal $match for reports: optional group (groupMemberIds) + date range.
 * @param {ObjectId[]|null} groupMemberIds - From getGroupMemberIds; null = no user filter
 * @param {{ date: { $gte, $lte } }} dateFilter
 * @param {{ status?: string }} [opts]
 * @returns {object}
 */
function buildMealMatchForReport(groupMemberIds, dateFilter, opts = {}) {
  const match = { ...dateFilter };
  if (opts.status) match.status = opts.status;
  if (Array.isArray(groupMemberIds) && groupMemberIds.length > 0) {
    match.userId = { $in: groupMemberIds };
  }
  return match;
}

/**
 * Build Bazar $match for reports: optional group + date range + type filter.
 * @param {ObjectId[]|null} groupMemberIds
 * @param {{ date: { $gte, $lte } }} dateFilter
 * @param {object} typeFilter - e.g. mealBazarMatch() or flatBazarMatch()
 * @param {{ status?: string }} [opts]
 * @returns {object}
 */
function buildBazarMatchForReport(groupMemberIds, dateFilter, typeFilter, opts = {}) {
  const match = { ...typeFilter, ...dateFilter };
  if (opts.status) match.status = opts.status;
  if (Array.isArray(groupMemberIds) && groupMemberIds.length > 0) {
    match.userId = { $in: groupMemberIds };
  }
  return match;
}

/**
 * Member count for the scope (group size, or 1 for single user, or User.count for app-wide).
 * @param {{ useGroup: boolean, appWide: boolean, groupMemberIds: any }} scope
 * @returns {Promise<number>}
 */
async function getScopeMemberCount(scope) {
  if (scope.useGroup) return scope.groupMemberIds.length;
  if (scope.appWide) return User.countDocuments({ status: 'active' });
  return 1;
}

/**
 * Today's date range (start of today, start of tomorrow) for queries.
 * @returns {{ start: Date, end: Date }}
 */
function getTodayStartEnd() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

/**
 * Count total meal slots (breakfast+lunch+dinner) for today in the given scope.
 * @param {object} Meal - Meal model
 * @param {{ useGroup: boolean, appWide: boolean, groupMemberIds: any, userId: any }} scope
 * @returns {Promise<number>}
 */
async function countTodayMeals(Meal, scope) {
  const breakdown = await getTodayMealsBreakdown(Meal, scope);
  return breakdown.total;
}

/**
 * Get today's meal counts: total and per type (breakfast, lunch, dinner).
 * @param {object} Meal - Meal model
 * @param {{ useGroup: boolean, appWide: boolean, groupMemberIds: any, userId: any }} scope
 * @returns {Promise<{ total: number, breakfast: number, lunch: number, dinner: number }>}
 */
async function getTodayMealsBreakdown(Meal, scope) {
  const { start, end } = getTodayStartEnd();
  const match = { date: { $gte: start, $lt: end } };
  if (scope.useGroup) match.userId = { $in: scope.groupMemberIds };
  else if (!scope.appWide) match.userId = scope.userId;

  const result = await Meal.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        breakfast: { $sum: { $cond: ['$breakfast', 1, 0] } },
        lunch: { $sum: { $cond: ['$lunch', 1, 0] } },
        dinner: { $sum: { $cond: ['$dinner', 1, 0] } },
      },
    },
    {
      $project: {
        breakfast: 1,
        lunch: 1,
        dinner: 1,
        total: { $add: ['$breakfast', '$lunch', '$dinner'] },
      },
    },
  ]);
  const row = result[0];
  return {
    total: row ? row.total : 0,
    breakfast: row ? row.breakfast : 0,
    lunch: row ? row.lunch : 0,
    dinner: row ? row.dinner : 0,
  };
}

module.exports = {
  resolveScope,
  buildMealMatch,
  buildBazarMatch,
  buildMealMatchAll,
  buildBazarMatchAll,
  buildMealMatchForReport,
  buildBazarMatchForReport,
  getScopeMemberCount,
  getTodayStartEnd,
  countTodayMeals,
  getTodayMealsBreakdown,
  buildUserScopeMatch,
  getCurrentMonthRange,
  buildCurrentMonthDateFilter,
  mealBazarMatch,
};
