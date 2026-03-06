const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const settlementService = require('../src/services/settlementService');
const User = require('../src/models/User');
const Bazar = require('../src/models/Bazar');
const Meal = require('../src/models/Meal');

let mongoServer;

describe('settlementService Calculations', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  }, 15000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany();
      }
    }
  });

  function createDateInCurrentMonth() {
    return new Date();
  }

  test('calculates correct meal rate and dues with flat bazar', async () => {
    // Generate valid BCRYPT salt by adding environment variable mocking just in case
    process.env.BCRYPT_ROUNDS = '1';

    const admin = new User({ name: 'Admin', email: 'admin@test.com', phone: '1234567890', password: 'password123', role: 'admin', status: 'active' });
    await admin.save();
    
    const member1 = new User({ name: 'Member 1', email: 'm1@test.com', phone: '1241241240', password: 'password123', role: 'member', createdBy: admin._id, status: 'active' });
    await member1.save();
    
    const member2 = new User({ name: 'Member 2', email: 'm2@test.com', phone: '1251251250', password: 'password123', role: 'member', createdBy: admin._id, status: 'active' });
    await member2.save();

    const testDate = createDateInCurrentMonth();

    // Meal Bazar: Total 2500
    await Bazar.create({ userId: member1._id, groupAdminId: admin._id, totalAmount: 1000, items: [{ name: 'item', amount: 1000, price: 1000, quantity: 1 }], type: 'meal', status: 'approved', date: testDate });
    await Bazar.create({ userId: member2._id, groupAdminId: admin._id, totalAmount: 500, items: [{ name: 'item', amount: 500, price: 500, quantity: 1 }], type: 'meal', status: 'approved', date: testDate });
    await Bazar.create({ userId: admin._id, groupAdminId: admin._id, totalAmount: 1000, items: [{ name: 'item', amount: 1000, price: 1000, quantity: 1 }], type: 'meal', status: 'approved', date: testDate });

    // Flat Bazar: Total 1000
    await Bazar.create({ userId: admin._id, groupAdminId: admin._id, totalAmount: 500, items: [{ name: 'item', amount: 500, price: 500, quantity: 1 }], type: 'flat', status: 'approved', date: testDate });
    await Bazar.create({ userId: member2._id, groupAdminId: admin._id, totalAmount: 500, items: [{ name: 'item', amount: 500, price: 500, quantity: 1 }], type: 'flat', status: 'approved', date: testDate });

    // Meals: Total 250
    // Each doc will have 1 meal (dinner=true) to make it easy, or we can use guestMeals if supported in settlement?
    // settlementService aggregate uses: $add: [{ $cond: ['$breakfast', 1, 0] }, { $cond: ['$lunch', 1, 0] }, { $cond: ['$dinner', 1, 0] }]
    // So 1 document = max 3 meals. We will create multiple docs.
    const createMeals = async (userId, count) => {
      const docs = [];
      for(let i=0; i<count; i++) {
        docs.push({
          userId,
          groupAdminId: admin._id,
          date: new Date(testDate.getTime() + i * 1000), // different dates/times
          breakfast: true,
          lunch: false,
          dinner: false,
          status: 'approved'
        });
      }
      await Meal.insertMany(docs);
    };

    await createMeals(member1._id, 100);
    await createMeals(member2._id, 50);
    await createMeals(admin._id, 100);

    const result = await settlementService.getCurrentMonthSettlementForGroup(admin);
    const { summary, members } = result;

    expect(summary.totalMeals).toBe(250);
    expect(summary.totalMealBazar).toBe(2500);
    expect(summary.totalFlatBazar).toBe(1000);
    expect(summary.mealRate).toBe(10); // 2500 / 250
    expect(summary.flatSharePerPerson).toBe(333.33); // 1000 / 3 rounded

    const m1Doc = members.find(m => m.userId.toString() === member1._id.toString());
    const m2Doc = members.find(m => m.userId.toString() === member2._id.toString());
    const adminDoc = members.find(m => m.userId.toString() === admin._id.toString());

    // Member 1
    // Meal Cost: 100 * 10 = 1000
    // Flat Share: 333.33
    // Paid (Meal): 1000, Paid (Flat): 0
    // Total Cost: 1333.33, Total Paid: 1000 => Due: 333.33, Receive: 0
    expect(m1Doc.due).toBe(333.33);
    expect(m1Doc.receive).toBe(0);

    // Member 2
    // Meal Cost: 50 * 10 = 500
    // Flat Share: 333.33
    // Paid (Meal): 500, Paid (Flat): 500
    // Total Cost: 833.33, Total Paid: 1000 => Due: 0, Receive: 166.67
    expect(m2Doc.due).toBe(0);
    expect(m2Doc.receive).toBe(166.67);

    // Admin
    // Meal Cost: 100 * 10 = 1000
    // Flat Share: 333.33
    // Paid (Meal): 1000, Paid (Flat): 500
    // Total Cost: 1333.33, Total Paid: 1500 => Due: 0, Receive: 166.67
    expect(adminDoc.due).toBe(0);
    expect(adminDoc.receive).toBe(166.67);
  });
});
