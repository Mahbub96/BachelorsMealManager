/**
 * Reusable $addFields stage: mealsPerEntry (total) and guestMealsPerEntry for dashboard breakdown.
 * Matches client getMealSlots() so dashboard total aligns with Meals tab.
 */
const MEAL_ADD_FIELDS_STAGE = {
  $addFields: {
    guestMealsPerEntry: {
      $add: [
        { $ifNull: ['$guestBreakfast', 0] },
        { $ifNull: ['$guestLunch', 0] },
        { $ifNull: ['$guestDinner', 0] },
      ],
    },
    mealsPerEntry: {
      $add: [
        { $cond: ['$breakfast', 1, 0] },
        { $cond: ['$lunch', 1, 0] },
        { $cond: ['$dinner', 1, 0] },
        { $ifNull: ['$guestBreakfast', 0] },
        { $ifNull: ['$guestLunch', 0] },
        { $ifNull: ['$guestDinner', 0] },
      ],
    },
  },
};

/**
 * Reusable $group stage for meal stats (totalMeals, totalEntries, approved/pending/rejected counts).
 * Optionally include lastMealDate when includeLastMealDate is true.
 * @param {{ includeLastMealDate?: boolean }} [opts]
 */
function getMealGroupStage(opts = {}) {
  const group = {
    _id: null,
    totalMeals: { $sum: '$mealsPerEntry' },
    totalGuestMeals: { $sum: '$guestMealsPerEntry' },
    totalEntries: { $sum: 1 },
    approvedCount: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
    pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
    rejectedCount: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
  };
  if (opts.includeLastMealDate) {
    group.lastMealDate = { $max: '$date' };
  }
  return { $group: group };
}

/**
 * Aggregate meal stats (total meal count, entry count, status counts, optional lastMealDate).
 * Single source of truth for Meal stats aggregation.
 * @param {object} Meal - Meal model
 * @param {object} matchStage - $match stage (e.g. { userId } or { userId: { $in: ids } }, optionally with date)
 * @param {{ includeLastMealDate?: boolean }} [opts]
 * @returns {Promise<{ totalMeals: number, totalGuestMeals: number, totalEntries: number, approvedCount: number, pendingCount: number, rejectedCount: number, lastMealDate?: Date | null }>}
 */
async function aggregateMealStats(Meal, matchStage, opts = {}) {
  const pipeline = [
    { $match: matchStage },
    MEAL_ADD_FIELDS_STAGE,
    getMealGroupStage(opts),
  ];
  const result = await Meal.aggregate(pipeline);
  const row = result[0] || {};
  const out = {
    totalMeals: row.totalMeals || 0,
    totalGuestMeals: row.totalGuestMeals || 0,
    totalEntries: row.totalEntries || 0,
    approvedCount: row.approvedCount || 0,
    pendingCount: row.pendingCount || 0,
    rejectedCount: row.rejectedCount || 0,
  };
  if (opts.includeLastMealDate) {
    out.lastMealDate = row.lastMealDate || null;
  }
  return out;
}

/**
 * Get last meal date only (for "days since last meal").
 * @param {object} Meal - Meal model
 * @param {object} matchStage - $match stage
 * @returns {Promise<Date | null>}
 */
async function aggregateMealLastDate(Meal, matchStage) {
  const result = await Meal.aggregate([
    { $match: matchStage },
    { $group: { _id: null, lastMealDate: { $max: '$date' } } },
  ]);
  return result[0]?.lastMealDate || null;
}

module.exports = {
  MEAL_ADD_FIELDS_STAGE,
  getMealGroupStage,
  aggregateMealStats,
  aggregateMealLastDate,
};
