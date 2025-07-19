# API Integration Guide

This guide explains how to use the comprehensive API integration system for the Bachelor Mess Manager application.

## Overview

The API integration system provides a complete set of hooks and services that connect your React Native app to the backend API. All endpoints from the API requirement document are now integrated and ready to use.

## Quick Start

### 1. Basic Usage

```typescript
import { useApiIntegration } from '@/hooks/useApiIntegration';

function MyComponent() {
  const api = useApiIntegration();

  // Access individual services
  const { meals, bazar, users, dashboard } = api;

  // Access authentication
  const { currentUser, isAuthenticated, login, logout } = api;

  // Handle loading and errors
  const { loading, error, refreshAll } = api;

  return (
    // Your component JSX
  );
}
```

### 2. Authentication

```typescript
// Login
const handleLogin = async () => {
  const success = await api.login('user@example.com', 'password123');
  if (success) {
    // Navigate to main app
  }
};

// Register
const handleRegister = async () => {
  const success = await api.register(
    'John Doe',
    'john@example.com',
    'password123'
  );
  if (success) {
    // Show login form
  }
};

// Logout
const handleLogout = async () => {
  await api.logout();
  // Navigate to login screen
};
```

## Individual Service Hooks

### Meal Management

```typescript
import { useMeals } from '@/hooks/useMeals';

function MealComponent() {
  const {
    meals,
    recentMeals,
    mealStats,
    loading,
    error,
    submitMeal,
    getUserMeals,
    updateMealStatus,
    getMealStats,
    refresh,
  } = useMeals();

  // Submit a meal
  const handleSubmitMeal = async () => {
    const success = await submitMeal({
      breakfast: true,
      lunch: false,
      dinner: true,
      date: '2024-01-15',
      notes: 'Extra rice for dinner',
    });
  };

  // Get meals with filters
  const handleGetMeals = async () => {
    await getUserMeals({
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      status: 'approved',
    });
  };

  // Update meal status (admin only)
  const handleApproveMeal = async (mealId: string) => {
    const success = await updateMealStatus(mealId, 'approved', 'Looks good!');
  };
}
```

### Bazar (Grocery) Management

```typescript
import { useBazar } from '@/hooks/useBazar';

function BazarComponent() {
  const {
    bazarEntries,
    recentBazarEntries,
    bazarStats,
    loading,
    error,
    submitBazar,
    getUserBazarEntries,
    updateBazarStatus,
    uploadReceipt,
    refresh,
  } = useBazar();

  // Submit bazar entry with receipt
  const handleSubmitBazar = async () => {
    const success = await submitBazar({
      items: [
        { name: 'Rice', quantity: '5kg', price: 250 },
        { name: 'Oil', quantity: '2L', price: 180 },
      ],
      totalAmount: 430,
      description: 'Weekly grocery shopping',
      date: '2024-01-15',
      receiptImage: {
        uri: 'file://path/to/receipt.jpg',
        type: 'image/jpeg',
        name: 'receipt.jpg',
      },
    });
  };

  // Upload receipt separately
  const handleUploadReceipt = async (file: any) => {
    const url = await uploadReceipt(file);
    if (url) {
      // Use the uploaded URL
    }
  };
}
```

### User Management

```typescript
import { useUsers } from '@/hooks/useUsers';

function UserComponent() {
  const {
    users,
    activeUsers,
    adminUsers,
    currentUser,
    userStats,
    loading,
    error,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    searchUsers,
    refresh,
  } = useUsers();

  // Create new user (admin only)
  const handleCreateUser = async () => {
    const success = await createUser({
      name: 'New User',
      email: 'newuser@example.com',
      password: 'password123',
      phone: '+880 1712-345678',
      role: 'member',
    });
  };

  // Update user
  const handleUpdateUser = async (userId: string) => {
    const success = await updateUser(userId, {
      name: 'Updated Name',
      phone: '+880 1712-345679',
    });
  };

  // Search users
  const handleSearchUsers = async (query: string) => {
    await searchUsers(query);
  };
}
```

### Dashboard & Analytics

```typescript
import { useDashboard } from '@/hooks/useDashboard';

function DashboardComponent() {
  const {
    stats,
    activities,
    analytics,
    combinedData,
    loading,
    error,
    getStats,
    getActivities,
    getAnalytics,
    getCombinedData,
    getWeeklyData,
    getMonthlyData,
    getYearlyData,
    refresh,
  } = useDashboard();

  // Get combined dashboard data
  const handleGetDashboardData = async () => {
    await getCombinedData({ timeframe: 'week' });
  };

  // Get specific analytics
  const handleGetAnalytics = async () => {
    await getAnalytics({ timeframe: 'month' });
  };
}
```

## Advanced Usage

### Error Handling

```typescript
function MyComponent() {
  const api = useApiIntegration();

  useEffect(() => {
    if (api.error) {
      // Show error message
      Alert.alert('Error', api.error);
      api.clearAllErrors();
    }
  }, [api.error]);
}
```

### Loading States

```typescript
function MyComponent() {
  const api = useApiIntegration();

  if (api.loading) {
    return <LoadingSpinner />;
  }

  return (
    // Your component content
  );
}
```

### Data Refresh

```typescript
function MyComponent() {
  const api = useApiIntegration();

  // Refresh all data
  const handleRefresh = async () => {
    await api.refreshAll();
  };

  // Refresh specific data
  const handleRefreshMeals = async () => {
    await api.meals.refresh();
  };
}
```

### Health Check

```typescript
function MyComponent() {
  const api = useApiIntegration();

  const checkApiHealth = async () => {
    const isHealthy = await api.healthCheck();
    if (!isHealthy) {
      Alert.alert('Warning', 'API server is not responding');
    }
  };
}
```

## API Endpoints Covered

### Authentication

- ✅ POST `/api/auth/login` - User login
- ✅ POST `/api/auth/register` - User registration
- ✅ POST `/api/auth/logout` - User logout
- ✅ POST `/api/auth/refresh` - Token refresh

### Dashboard

- ✅ GET `/api/health` - Health check
- ✅ GET `/api/dashboard/stats` - Dashboard statistics
- ✅ GET `/api/dashboard/activities` - Recent activities
- ✅ GET `/api/dashboard` - Combined dashboard data

### Meals

- ✅ POST `/api/meals/submit` - Submit daily meals
- ✅ GET `/api/meals/user` - Get user meals
- ✅ GET `/api/meals/all` - Get all meals (admin)
- ✅ PUT `/api/meals/:id/status` - Update meal status
- ✅ GET `/api/meals/stats` - Meal statistics

### Bazar (Grocery)

- ✅ POST `/api/bazar/submit` - Submit bazar entry
- ✅ GET `/api/bazar/user` - Get user bazar entries
- ✅ GET `/api/bazar/all` - Get all bazar entries (admin)
- ✅ PUT `/api/bazar/:id/status` - Update bazar status
- ✅ GET `/api/bazar/stats` - Bazar statistics

### Users

- ✅ GET `/api/users/all` - Get all users (admin)
- ✅ GET `/api/users/:id` - Get user by ID
- ✅ POST `/api/users/create` - Create user (admin)
- ✅ PUT `/api/users/:id` - Update user (admin)
- ✅ DELETE `/api/users/:id` - Delete user (admin)
- ✅ GET `/api/users/:id/stats` - Get user statistics
- ✅ GET `/api/users/profile` - Get current user profile
- ✅ PUT `/api/users/profile` - Update current user profile

### Analytics

- ✅ GET `/api/analytics` - Get analytics data

## Configuration

### Environment Setup

Update `services/config.ts` to point to your backend:

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__
    ? 'http://localhost:3000/api' // Development
    : 'https://your-production-domain.com/api', // Production
  // ... other config
};
```

### Authentication Storage

The system uses AsyncStorage for token persistence. No additional setup required.

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
const handleSubmit = async () => {
  try {
    const success = await api.meals.submitMeal(mealData);
    if (success) {
      // Show success message
    }
  } catch (error) {
    // Handle error
    console.error('Submission failed:', error);
  }
};
```

### 2. Loading States

Show loading indicators during API calls:

```typescript
{
  api.loading && <LoadingSpinner />;
}
{
  api.meals.loading && <MealLoadingSpinner />;
}
```

### 3. Data Refresh

Refresh data when needed:

```typescript
// Refresh on component mount
useEffect(() => {
  api.refreshAll();
}, []);

// Refresh on pull-to-refresh
const handleRefresh = async () => {
  await api.refreshAll();
};
```

### 4. Authentication Flow

Handle authentication state changes:

```typescript
useEffect(() => {
  if (!api.isAuthenticated) {
    // Navigate to login
    router.push('/login');
  }
}, [api.isAuthenticated]);
```

## Troubleshooting

### Common Issues

1. **API Connection Failed**

   - Check if backend server is running
   - Verify BASE_URL in config
   - Check network connectivity

2. **Authentication Errors**

   - Clear stored tokens: `await authService.clearStoredAuth()`
   - Check JWT token validity
   - Verify login credentials

3. **Data Not Loading**

   - Check API health: `await api.healthCheck()`
   - Verify authentication status
   - Check for network errors

4. **File Upload Issues**
   - Verify file size limits
   - Check file type restrictions
   - Ensure proper file object structure

### Debug Mode

Enable debug logging in development:

```typescript
// In services/httpClient.ts
if (__DEV__) {
  console.log('API Request:', { method, url, data });
  console.log('API Response:', response);
}
```

## Migration from Mock Data

If you're migrating from the mock data context:

1. Replace `useMessData()` with `useApiIntegration()`
2. Update component props to use API data structure
3. Replace mock data calls with API calls
4. Update error handling for real API responses

Example migration:

```typescript
// Before (mock data)
const { recentMeals, addMealEntry } = useMessData();

// After (API integration)
const api = useApiIntegration();
const { meals, submitMeal } = api.meals;
```

## Performance Optimization

1. **Caching**: API responses are cached automatically
2. **Batch Updates**: Use `refreshAll()` for multiple updates
3. **Lazy Loading**: Load data only when needed
4. **Error Recovery**: Automatic retry on network failures

This comprehensive API integration system provides everything you need to connect your React Native app to the Bachelor Mess Manager backend API. All endpoints from the API requirement document are implemented and ready to use!
