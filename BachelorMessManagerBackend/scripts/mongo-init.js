// MongoDB initialization script for Bachelor Mess Manager
// This script runs when the MongoDB container starts for the first time

print('Starting Bachelor Mess Manager database initialization...');

// Switch to the bachelor-mess database
db = db.getSiblingDB('bachelor-mess');

// Create collections with proper validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'email', 'role'],
      properties: {
        username: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 50,
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        },
        role: {
          enum: ['admin', 'manager', 'member'],
        },
      },
    },
  },
});

db.createCollection('meals', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['date', 'type', 'price', 'createdBy'],
      properties: {
        date: {
          bsonType: 'date',
        },
        type: {
          enum: ['breakfast', 'lunch', 'dinner'],
        },
        price: {
          bsonType: 'number',
          minimum: 0,
        },
      },
    },
  },
});

db.createCollection('bazar', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['date', 'amount', 'description', 'createdBy'],
      properties: {
        amount: {
          bsonType: 'number',
          minimum: 0,
        },
        date: {
          bsonType: 'date',
        },
      },
    },
  },
});

// Create indexes for better performance
print('Creating indexes...');

// Users collection indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ createdAt: -1 });

// Meals collection indexes
db.meals.createIndex({ date: 1 });
db.meals.createIndex({ type: 1 });
db.meals.createIndex({ createdBy: 1 });
db.meals.createIndex({ date: 1, type: 1 }, { unique: true });
db.meals.createIndex({ createdAt: -1 });

// Bazar collection indexes
db.bazar.createIndex({ date: 1 });
db.bazar.createIndex({ createdBy: 1 });
db.bazar.createIndex({ amount: 1 });
db.bazar.createIndex({ createdAt: -1 });

// Create a default admin user if it doesn't exist
const adminUser = db.users.findOne({ role: 'admin' });

if (!adminUser) {
  print('Creating default admin user...');

  // Note: In production, this should be done through a proper registration process
  // with secure password hashing
  db.users.insertOne({
    username: 'admin',
    email: 'admin@bachelor-mess.com',
    password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK6e', // 'admin123'
    role: 'admin',
    firstName: 'System',
    lastName: 'Administrator',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  print('Default admin user created:');
  print('Username: admin');
  print('Password: admin123');
  print('Email: admin@bachelor-mess.com');
}

// Create some sample data for development
if (db.meals.countDocuments() === 0) {
  print('Creating sample meals data...');

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const sampleMeals = [
    {
      date: yesterday,
      type: 'breakfast',
      price: 120,
      description: 'Sample breakfast',
      createdBy: adminUser ? adminUser._id : ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      date: yesterday,
      type: 'lunch',
      price: 150,
      description: 'Sample lunch',
      createdBy: adminUser ? adminUser._id : ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      date: yesterday,
      type: 'dinner',
      price: 180,
      description: 'Sample dinner',
      createdBy: adminUser ? adminUser._id : ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  db.meals.insertMany(sampleMeals);
  print('Sample meals data created');
}

if (db.bazar.countDocuments() === 0) {
  print('Creating sample bazar data...');

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const sampleBazar = [
    {
      date: yesterday,
      amount: 500,
      description: 'Sample bazar items',
      createdBy: adminUser ? adminUser._id : ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  db.bazar.insertMany(sampleBazar);
  print('Sample bazar data created');
}

print('Database initialization completed successfully!');
print('Collections created: users, meals, bazar');
print('Indexes created for optimal performance');
print('Sample data added for development');
