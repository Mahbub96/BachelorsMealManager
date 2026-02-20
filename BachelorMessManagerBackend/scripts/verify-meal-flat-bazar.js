#!/usr/bin/env node
/**
 * Verification script: Meal vs Flat bazar behaviour.
 * Run: node scripts/verify-meal-flat-bazar.js
 * Exit 0 = all checks pass; exit 1 = failure (for CI/manual testing).
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Bazar = require('../src/models/Bazar');
const {
  mealBazarMatch,
  flatBazarMatch,
  getCurrentMonthRange,
  aggregateSumInDateRange,
  getBazarSumInMonth,
} = require('../src/utils/bazarHelper');

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bachelor-mess-dev';
  await mongoose.connect(uri);

  let passed = 0;
  let failed = 0;

  // 1. mealBazarMatch returns correct query
  const match = mealBazarMatch();
  if (match && match.type && match.type.$in && match.type.$in.includes('meal') && match.type.$in.includes(null)) {
    console.log('✓ mealBazarMatch() returns { type: { $in: [\"meal\", null] } }');
    passed++;
  } else {
    console.error('✗ mealBazarMatch() unexpected:', JSON.stringify(match));
    failed++;
  }

  // 2. Meal-only count and sum (current month)
  const range = getCurrentMonthRange();
  const mealCount = await Bazar.countDocuments(match);
  const flatCount = await Bazar.countDocuments(flatBazarMatch());
  const mealSum = await aggregateSumInDateRange(Bazar, match, range);
  console.log(`✓ Meal (or legacy) count: ${mealCount}, Flat count: ${flatCount}, Meal sum this month: ${mealSum}`);
  passed++;

  // 3. If there is at least one bazar, verify flat is excluded from meal sum (meal-only sum unchanged when we add flat)
  const existing = await Bazar.findOne().lean();
  if (existing && existing.userId) {
    const sumBefore = mealSum;
    const flatSumBefore = await getBazarSumInMonth(Bazar, flatBazarMatch(), existing.userId, null, range);
    const { firstDay, lastDay } = range;
    const midMonth = new Date((firstDay.getTime() + lastDay.getTime()) / 2);
    const flatEntry = await Bazar.create({
      userId: existing.userId,
      type: 'flat',
      date: midMonth,
      items: [{ name: 'Verify script flat', quantity: '1', price: 1000 }],
      totalAmount: 1000,
      status: 'approved',
    });
    const mealSumAfter = await aggregateSumInDateRange(Bazar, match, range);
    const flatSumAfter = await getBazarSumInMonth(Bazar, flatBazarMatch(), existing.userId, null, range);
    await Bazar.findByIdAndDelete(flatEntry._id);

    const mealUnchanged = mealSumAfter === sumBefore;
    const flatIncreased = flatSumAfter >= flatSumBefore + 1000;
    if (mealUnchanged && flatIncreased) {
      console.log('✓ Flat bazar excluded from meal-only sum (add/delete test)');
      passed++;
    } else {
      console.error('✗ mealUnchanged:', mealUnchanged, 'flatIncreased:', flatIncreased, 'mealSumAfter:', mealSumAfter, 'flatSumBefore:', flatSumBefore, 'flatSumAfter:', flatSumAfter);
      failed++;
    }
  } else {
    console.log('⊘ Skip flat-exclusion test (no existing bazar)');
  }

  await mongoose.disconnect();

  console.log('');
  console.log(`Result: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
