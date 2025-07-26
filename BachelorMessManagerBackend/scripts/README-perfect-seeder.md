# Perfect Seeder Documentation

## Overview

The Perfect Seeder is a comprehensive database seeding script that creates realistic, well-structured data for the Bachelor Mess Manager application. It covers all models (User, Meal, Bazar, Statistics, UIConfig) with proper relationships and realistic data patterns.

## Features

### 🎯 Comprehensive Coverage
- **All Models**: User, Meal, Bazar, Statistics, UIConfig
- **Realistic Data**: Based on real-world patterns and relationships
- **Proper Relationships**: Maintains referential integrity
- **Configurable**: Easy to customize data generation parameters

### 👥 User Management
- **Super Admin**: Full system access with all permissions
- **Admin Users**: Management-level access (2 users)
- **Member Users**: Regular users (15 users by default)
- **Realistic Profiles**: Names, emails, phones, payment history
- **Status Distribution**: Mix of active/inactive users
- **Payment Tracking**: Complete payment history with various statuses

### 🍽️ Meal Management
- **Realistic Patterns**: 85% meal participation rate
- **Meal Types**: Breakfast, Lunch, Dinner with realistic distribution
- **Status Management**: Mix of approved/pending meals
- **Date Range**: 3 months of historical data
- **User-Specific**: Each active user gets meal entries

### 🛒 Bazar Management
- **Diverse Items**: 15+ different grocery items
- **Realistic Pricing**: Market-based prices with variations
- **Quantity Logic**: Realistic quantities and units
- **Status Distribution**: Mix of approved/pending entries
- **Date Range**: 6 months of historical data

### 📊 Statistics & Analytics
- **Comprehensive Stats**: Global, meals, bazar, users statistics
- **Real-time Calculations**: Based on actual data
- **Performance Metrics**: Efficiency, averages, trends
- **Cache Management**: Proper cache configuration

### 🎨 UI Configuration
- **Complete Setup**: Theme, navigation, features, components
- **Production Ready**: All necessary configurations
- **Feature Flags**: Comprehensive feature management
- **Security Settings**: Proper authentication and security configs

## Configuration

### Environment Variables
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/bachelor-mess

# Seeding Options
CLEAR_EXISTING=true  # Set to false to keep existing data
```

### Seeding Parameters
```javascript
const config = {
  seedCounts: {
    superAdmins: 1,      // Number of super admin users
    admins: 2,           // Number of admin users
    members: 15,         // Number of member users
    mealsPerUser: 90,    // Approximate meals per user (3 months)
    bazarEntriesPerUser: 20, // Approximate bazar entries per user
  },
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date(),
  },
};
```

## Usage

### Basic Usage
```bash
# Run the perfect seeder
node scripts/perfect-seeder.js

# Or using npm script (if added to package.json)
npm run db:seed:perfect
```

### Advanced Usage
```bash
# Keep existing data
CLEAR_EXISTING=false node scripts/perfect-seeder.js

# Use custom database
MONGODB_URI=mongodb://localhost:27017/custom-db node scripts/perfect-seeder.js
```

## Generated Data

### User Accounts
| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| Super Admin | superadmin@bachelor-mess.com | SuperAdmin@2024 | All permissions |
| Admin | admin@bachelor-mess.com | Admin@2024 | Management access |
| Assistant | assistant@bachelor-mess.com | Admin@2024 | Management access |
| Members | [random-email] | Member@2024 | Basic access |

### Data Volumes
- **Users**: 18 total (1 Super Admin + 2 Admins + 15 Members)
- **Meals**: ~1,350 entries (90 per active user)
- **Bazar Entries**: ~300 entries (20 per active user)
- **Statistics**: 1 comprehensive record
- **UI Config**: 1 complete configuration

### Data Quality
- **Realistic Names**: Bangladeshi names with proper formatting
- **Valid Emails**: Proper email format with random domains
- **Phone Numbers**: Bangladeshi phone number format
- **Payment History**: Complete payment tracking with various methods
- **Date Distribution**: Realistic date spread across months
- **Status Distribution**: Realistic mix of approved/pending items

## Test Scenarios

### Authentication & Authorization
1. **Login with Super Admin**: Full system access
2. **Login with Admin**: Management capabilities
3. **Login with Member**: Basic user access
4. **Role-based Navigation**: Different tabs based on role

### Data Management
1. **View Dashboard**: Real data with charts and statistics
2. **Manage Meals**: Create, edit, approve meals
3. **Manage Bazar**: Create, edit, approve bazar entries
4. **User Management**: View and manage users

### Analytics & Reporting
1. **Statistics Dashboard**: Real-time statistics
2. **Payment Tracking**: Complete payment history
3. **Expense Analysis**: Bazar expense breakdown
4. **User Analytics**: User activity and engagement

### Workflow Testing
1. **Approval Workflows**: Test meal and bazar approvals
2. **Payment Processing**: Test payment status updates
3. **User Registration**: Test new user onboarding
4. **Data Export**: Test data export functionality

## Customization

### Adding More Users
```javascript
// Modify config.seedCounts.members
const config = {
  seedCounts: {
    members: 25, // Increase member count
  },
};
```

### Changing Date Range
```javascript
// Modify config.dateRange
const config = {
  dateRange: {
    start: new Date('2023-06-01'), // Earlier start
    end: new Date('2024-12-31'),   // Later end
  },
};
```

### Custom Bazar Items
```javascript
// Modify utils.generateBazarData function
const bazarItems = [
  // Add your custom items here
  { name: 'Custom Item', avgPrice: 100, unit: 'piece' },
];
```

### Custom Meal Patterns
```javascript
// Modify utils.generateMealData function
const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack']; // Add snack
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Check MongoDB is running
   mongod --version
   
   # Check connection string
   echo $MONGODB_URI
   ```

2. **Permission Errors**
   ```bash
   # Ensure proper file permissions
   chmod +x scripts/perfect-seeder.js
   ```

3. **Memory Issues**
   ```bash
   # Increase Node.js memory limit
   node --max-old-space-size=4096 scripts/perfect-seeder.js
   ```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* node scripts/perfect-seeder.js
```

## Performance

### Optimization Tips
1. **Batch Operations**: Uses `insertMany` for bulk operations
2. **Indexed Queries**: Leverages database indexes
3. **Memory Efficient**: Streams data generation
4. **Connection Pooling**: Proper MongoDB connection management

### Expected Performance
- **Small Dataset** (< 1000 records): ~30 seconds
- **Medium Dataset** (1000-5000 records): ~2 minutes
- **Large Dataset** (> 5000 records): ~5 minutes

## Maintenance

### Regular Updates
- Update user data patterns quarterly
- Refresh bazar item prices monthly
- Adjust meal patterns based on usage
- Update statistics calculation methods

### Data Validation
```bash
# Validate generated data
node scripts/verify-data.js
```

### Backup Before Seeding
```bash
# Create backup before seeding
npm run db:backup
```

## Contributing

### Adding New Features
1. Follow the existing code structure
2. Add proper error handling
3. Include comprehensive logging
4. Update documentation
5. Add test scenarios

### Code Standards
- Use ES6+ features
- Follow consistent naming conventions
- Include JSDoc comments
- Handle all error cases
- Use proper async/await patterns

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the configuration options
3. Verify database connectivity
4. Check the logs for detailed error messages

---

**Note**: This seeder is designed for development and testing environments. For production use, ensure proper data sanitization and security measures are in place. 