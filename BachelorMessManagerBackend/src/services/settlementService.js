/**
 * Settlement service: meal rate + flat share based due/receive for current month.
 * Due = amount member owes; Receive = amount member should get back (refund).
 * Uses only approved bazar and approved meals; payments = User.paymentHistory (completed, this month).
 */
const mongoose = require('mongoose');
const Bazar = require('../models/Bazar');
const Meal = require('../models/Meal');
const User = require('../models/User');
const { getGroupMemberIds } = require('../utils/groupHelper');
const { mealBazarMatch, flatBazarMatch, getCurrentMonthRange, buildDateRangeForMonth } = require('../utils/bazarHelper');
const { buildMealMatchForReport, buildBazarMatchForReport } = require('../utils/scopeHelper');
const { MEAL_ADD_FIELDS_STAGE } = require('../utils/mealHelper');
const logger = require('../utils/logger');

const APPROVED = { status: 'approved' };

function roundMoney(val) {
  return Math.round((Number(val) || 0) * 100) / 100;
}

/**
 * Sum user's paymentHistory for current month (completed only).
 */
function sumPaymentHistoryThisMonth(user) {
  const history = user?.paymentHistory ?? [];
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const firstStr = firstDay.toISOString().split('T')[0];
  const lastStr = lastDay.toISOString().split('T')[0];
  let sum = 0;
  for (const p of history) {
    if (p.status !== 'completed') continue;
    const d = p.date ? new Date(p.date) : null;
    if (!d) continue;
    const ds = d.toISOString().split('T')[0];
    if (ds >= firstStr && ds <= lastStr) sum += p.amount || 0;
  }
  return roundMoney(sum);
}

/**
 * Get current-month settlement for the requesting user (single member).
 * Returns due (amount to pay), receive (amount to get back), and breakdown.
 */
async function getCurrentMonthSettlementForUser(reqUser) {
  const userId = reqUser?._id ?? reqUser?.id;
  if (!userId) {
    return { due: 0, receive: 0, balance: 0, mealRate: 0, flatSharePerPerson: 0 };
  }
  const uid = userId instanceof mongoose.Types.ObjectId ? userId : new mongoose.Types.ObjectId(userId);
  const monthRange = getCurrentMonthRange();
  const dateFilter = { date: { $gte: monthRange.firstDay, $lte: monthRange.lastDay } };

  let groupMemberIds;
  try {
    groupMemberIds = await getGroupMemberIds(reqUser);
  } catch (e) {
    logger.warn('settlement getGroupMemberIds failed', e?.message);
    groupMemberIds = null;
  }

  const memberIds = Array.isArray(groupMemberIds) && groupMemberIds.length > 0
    ? groupMemberIds
    : [uid];

  const mealMatch = buildMealMatchForReport(memberIds, dateFilter, APPROVED);
  const bazarMatch = buildBazarMatchForReport(memberIds, dateFilter, mealBazarMatch(), APPROVED);
  const flatMatch = buildBazarMatchForReport(memberIds, dateFilter, flatBazarMatch(), APPROVED);

  const [overallMealData, mealStats, bazarStats, flatBazarTotalResult, flatBazarByUser, users] = await Promise.all([
    Meal.aggregate([{ $match: mealMatch }, MEAL_ADD_FIELDS_STAGE, { $group: { _id: null, totalMeals: { $sum: '$mealsPerEntry' } } }]),
    Meal.aggregate([{ $match: mealMatch }, MEAL_ADD_FIELDS_STAGE, { $group: { _id: '$userId', totalMeals: { $sum: '$mealsPerEntry' } } }]),
    Bazar.aggregate([{ $match: bazarMatch }, { $group: { _id: '$userId', totalAmount: { $sum: '$totalAmount' } } }]),
    Bazar.aggregate([{ $match: flatMatch }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Bazar.aggregate([{ $match: flatMatch }, { $group: { _id: '$userId', total: { $sum: '$totalAmount' } } }]),
    User.find({ _id: { $in: memberIds } }).select('name paymentHistory').lean(),
  ]);

  const totalMeals = overallMealData[0]?.totalMeals ?? 0;
  const totalMealBazar = (bazarStats || []).reduce((s, b) => s + b.totalAmount, 0);
  const totalFlatBazar = flatBazarTotalResult[0]?.total ?? 0;
  const memberCount = Math.max(memberIds.length, 1);
  const flatSharePerPerson = totalFlatBazar / memberCount;
  const mealRate = totalMeals > 0 ? totalMealBazar / totalMeals : 0;

  const userMeal = mealStats.find(m => m._id.toString() === uid.toString());
  const userBazar = bazarStats.find(b => b._id.toString() === uid.toString());
  const userFlat = flatBazarByUser.find(f => f._id.toString() === uid.toString());
  const userDoc = users.find(u => u._id.toString() === uid.toString());

  const meals = userMeal?.totalMeals ?? 0;
  const mealBazarPaid = userBazar?.totalAmount ?? 0;
  const flatBazarPaid = userFlat?.total ?? 0;
  const paymentsTotal = userDoc ? sumPaymentHistoryThisMonth(userDoc) : 0;

  const mealCost = roundMoney(meals * mealRate);
  const flatShare = roundMoney(flatSharePerPerson);
  const totalOut = roundMoney(mealCost + flatShare);
  const totalIn = roundMoney(mealBazarPaid + flatBazarPaid + paymentsTotal);
  const balance = roundMoney(totalIn - totalOut);
  const due = balance < 0 ? Math.abs(balance) : 0;
  const receive = balance > 0 ? balance : 0;

  return {
    due: roundMoney(due),
    receive: roundMoney(receive),
    balance: roundMoney(balance),
    mealRate: roundMoney(mealRate),
    flatSharePerPerson: roundMoney(flatSharePerPerson),
    totalMeals,
    totalMealBazar: roundMoney(totalMealBazar),
    totalFlatBazar: roundMoney(totalFlatBazar),
    memberCount,
    mealCost,
    flatShare,
    mealBazarPaid: roundMoney(mealBazarPaid),
    flatBazarPaid: roundMoney(flatBazarPaid),
    paymentsTotal,
  };
}

/**
 * Get current-month settlement for all group members (for admin dues/refund view).
 */
async function getCurrentMonthSettlementForGroup(reqUser) {
  const userId = reqUser?._id ?? reqUser?.id;
  if (!userId) {
    return { summary: {}, members: [] };
  }
  const monthRange = getCurrentMonthRange();
  const dateFilter = { date: { $gte: monthRange.firstDay, $lte: monthRange.lastDay } };

  let groupMemberIds;
  try {
    groupMemberIds = await getGroupMemberIds(reqUser);
  } catch (e) {
    logger.warn('settlement getGroupMemberIds failed', e?.message);
    groupMemberIds = null;
  }

  const memberIds = Array.isArray(groupMemberIds) && groupMemberIds.length > 0
    ? groupMemberIds
    : [userId instanceof mongoose.Types.ObjectId ? userId : new mongoose.Types.ObjectId(userId)];

  const mealMatch = buildMealMatchForReport(memberIds, dateFilter, APPROVED);
  const bazarMatch = buildBazarMatchForReport(memberIds, dateFilter, mealBazarMatch(), APPROVED);
  const flatMatch = buildBazarMatchForReport(memberIds, dateFilter, flatBazarMatch(), APPROVED);

  const [overallMealData, mealStats, bazarStats, flatBazarTotalResult, flatBazarByUser, users] = await Promise.all([
    Meal.aggregate([{ $match: mealMatch }, MEAL_ADD_FIELDS_STAGE, { $group: { _id: null, totalMeals: { $sum: '$mealsPerEntry' } } }]),
    Meal.aggregate([{ $match: mealMatch }, MEAL_ADD_FIELDS_STAGE, { $group: { _id: '$userId', totalMeals: { $sum: '$mealsPerEntry' } } }]),
    Bazar.aggregate([{ $match: bazarMatch }, { $group: { _id: '$userId', totalAmount: { $sum: '$totalAmount' } } }]),
    Bazar.aggregate([{ $match: flatMatch }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Bazar.aggregate([{ $match: flatMatch }, { $group: { _id: '$userId', total: { $sum: '$totalAmount' } } }]),
    User.find({ _id: { $in: memberIds } }).select('name email paymentHistory').lean(),
  ]);

  const totalMeals = overallMealData[0]?.totalMeals ?? 0;
  const totalMealBazar = (bazarStats || []).reduce((s, b) => s + b.totalAmount, 0);
  const totalFlatBazar = flatBazarTotalResult[0]?.total ?? 0;
  const memberCount = Math.max(memberIds.length, 1);
  const flatSharePerPerson = totalFlatBazar / memberCount;
  const mealRate = totalMeals > 0 ? totalMealBazar / totalMeals : 0;

  const summary = {
    mealRate: roundMoney(mealRate),
    flatSharePerPerson: roundMoney(flatSharePerPerson),
    totalMeals,
    totalMealBazar: roundMoney(totalMealBazar),
    totalFlatBazar: roundMoney(totalFlatBazar),
    memberCount,
  };

  const members = memberIds.map(mid => {
    const idStr = mid.toString();
    const userMeal = mealStats.find(m => m._id.toString() === idStr);
    const userBazar = bazarStats.find(b => b._id.toString() === idStr);
    const userFlat = flatBazarByUser.find(f => f._id.toString() === idStr);
    const userDoc = users.find(u => u._id.toString() === idStr);

    const meals = userMeal?.totalMeals ?? 0;
    const mealBazarPaid = userBazar?.totalAmount ?? 0;
    const flatBazarPaid = userFlat?.total ?? 0;
    const paymentsTotal = userDoc ? sumPaymentHistoryThisMonth(userDoc) : 0;

    const mealCost = roundMoney(meals * mealRate);
    const flatShare = roundMoney(flatSharePerPerson);
    const totalOut = roundMoney(mealCost + flatShare);
    const totalIn = roundMoney(mealBazarPaid + flatBazarPaid + paymentsTotal);
    const balance = roundMoney(totalIn - totalOut);
    const due = balance < 0 ? Math.abs(balance) : 0;
    const receive = balance > 0 ? balance : 0;

    return {
      userId: mid,
      name: userDoc?.name ?? '',
      email: userDoc?.email ?? '',
      meals,
      mealCost,
      flatShare,
      mealBazarPaid: roundMoney(mealBazarPaid),
      flatBazarPaid: roundMoney(flatBazarPaid),
      paymentsTotal,
      balance: roundMoney(balance),
      due: roundMoney(due),
      receive: roundMoney(receive),
    };
  });

  return { summary, members };
}

module.exports = {
  getCurrentMonthSettlementForUser,
  getCurrentMonthSettlementForGroup,
  roundMoney,
  sumPaymentHistoryThisMonth,
};
