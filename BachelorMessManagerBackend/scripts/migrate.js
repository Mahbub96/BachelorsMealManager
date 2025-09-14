const mongoose = require('mongoose');
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

// Migration function
const runMigrations = async () => {
  try {
    console.log('🔄 Starting database migrations...');

    // Get database instance
    const db = mongoose.connection.db;

    // Create indexes for better performance
    console.log('📊 Creating database indexes...');

    // User collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ status: 1 });
    await db.collection('users').createIndex({ createdAt: 1 });
    console.log('✅ User indexes created');

    // Bazar collection indexes
    await db.collection('bazars').createIndex({ userId: 1 });
    await db.collection('bazars').createIndex({ status: 1 });
    await db.collection('bazars').createIndex({ createdAt: 1 });
    await db.collection('bazars').createIndex({ category: 1 });
    console.log('✅ Bazar indexes created');

    // Meal collection indexes
    await db.collection('meals').createIndex({ userId: 1 });
    await db.collection('meals').createIndex({ date: 1 });
    await db.collection('meals').createIndex({ status: 1 });
    await db.collection('meals').createIndex({ mealType: 1 });
    console.log('✅ Meal indexes created');

    // Statistics collection indexes
    await db.collection('statistics').createIndex({ lastUpdated: 1 });
    console.log('✅ Statistics indexes created');

    console.log('🎉 Database migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run migrations
connectDB().then(() => {
  runMigrations();
});
