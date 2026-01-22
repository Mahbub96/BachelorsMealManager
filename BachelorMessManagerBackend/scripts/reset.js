const mongoose = require('mongoose');
const User = require('../src/models/User');
const Bazar = require('../src/models/Bazar');
const Meal = require('../src/models/Meal');
const Statistics = require('../src/models/Statistics');
const UIConfig = require('../src/models/UIConfig');
require('dotenv').config();

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/bachelor-mess',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Reset function
const resetDatabase = async () => {
  try {
    console.log('⚠️  WARNING: This will delete ALL data from the database!');
    console.log('🔄 Starting database reset...');

    // Clear all collections
    await User.deleteMany({});
    console.log('🗑️  Cleared users collection');

    await Bazar.deleteMany({});
    console.log('🗑️  Cleared bazar collection');

    await Meal.deleteMany({});
    console.log('🗑️  Cleared meals collection');

    await Statistics.deleteMany({});
    console.log('🗑️  Cleared statistics collection');

    await UIConfig.deleteMany({});
    console.log('🗑️  Cleared UI config collection');

    // Drop indexes (optional)
    const db = mongoose.connection.db;
    try {
      await db.collection('users').dropIndexes();
      await db.collection('bazars').dropIndexes();
      await db.collection('meals').dropIndexes();
      await db.collection('statistics').dropIndexes();
      await db.collection('uiconfigs').dropIndexes();
      console.log('🗑️  Dropped all indexes');
    } catch (error) {
      console.log(
        'ℹ️  No indexes to drop or error dropping indexes:',
        error.message
      );
    }

    console.log('🎉 Database reset completed successfully!');
    console.log('💡 Run "npm run db:seed" to populate with sample data');
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error; // Re-throw to handle in caller
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Confirmation prompt
const confirmReset = async () => {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(
    '⚠️  WARNING: This will delete ALL data from the database!\nAre you sure you want to reset the database? This action cannot be undone. (yes/no): ',
    async answer => {
      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        try {
          await connectDB();
          await resetDatabase();
          console.log('✅ Reset process completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Reset process failed:', error);
          process.exit(1);
        }
      } else {
        console.log('❌ Database reset cancelled');
        process.exit(0);
      }
      rl.close();
    }
  );
};

// Run reset with confirmation
confirmReset();
