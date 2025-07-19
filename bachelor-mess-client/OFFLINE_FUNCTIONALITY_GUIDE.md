# Offline Functionality Guide

This guide explains the comprehensive offline functionality implemented in the Bachelor Mess Manager app to prevent data loss when there's no internet connection.

## 🎯 **Overview**

The offline system automatically detects network connectivity and stores failed API requests locally. When the network is restored, it automatically retries all pending requests, ensuring no data is lost.

## 🔧 **How It Works**

### 1. **Automatic Detection**

- Monitors network connectivity in real-time
- Detects when you go offline/online
- Automatically stores failed requests when offline

### 2. **Local Storage**

- Failed requests are stored in AsyncStorage
- Includes all request data (endpoint, method, body, headers)
- Automatic cleanup of old requests (24 hours)

### 3. **Automatic Retry**

- When network is restored, automatically retries all pending requests
- Shows success/failure notifications to user
- Removes successful requests from storage

## 📱 **Usage Examples**

### Basic Usage

```typescript
import { useApiIntegration } from '@/hooks/useApiIntegration';

function MyComponent() {
  const api = useApiIntegration();

  // Access offline functionality
  const { offline } = api;

  // Check offline status
  const { status } = offline;
  console.log('Is online:', status.isOnline);
  console.log('Pending requests:', status.pendingCount);
}
```

### Submit Data with Offline Support

```typescript
// Submit meal - automatically handles offline scenario
const handleSubmitMeal = async () => {
  const success = await api.meals.submitMeal({
    breakfast: true,
    lunch: false,
    dinner: true,
    date: '2024-01-15',
    notes: 'Extra rice for dinner',
  });

  if (!success) {
    // Check if it was stored for offline retry
    const response = await api.meals.submitMeal(mealData);
    if (response.data?.offlineRequestId) {
      console.log(
        'Request stored for offline retry:',
        response.data.offlineRequestId
      );
    }
  }
};
```

### Manual Offline Management

```typescript
function OfflineManager() {
  const { offline } = useApiIntegration();

  // Check offline status
  const checkStatus = async () => {
    const isOnline = await offline.isOnline();
    const pendingCount = await offline.getPendingCount();

    console.log(`Online: ${isOnline}, Pending: ${pendingCount}`);
  };

  // Manually retry offline requests
  const retryRequests = async () => {
    await offline.retryPendingRequests();
  };

  // Clear all offline requests
  const clearRequests = async () => {
    await offline.clearAllOfflineRequests();
  };

  return (
    <View>
      <Text>Online: {offline.status.isOnline ? 'Yes' : 'No'}</Text>
      <Text>Pending Requests: {offline.status.pendingCount}</Text>
      <Button title='Retry Requests' onPress={retryRequests} />
      <Button title='Clear All' onPress={clearRequests} />
    </View>
  );
}
```

## 🔄 **Automatic Behavior**

### When You Go Offline

1. **User Notification**: Shows alert "You're offline. Your submission will be saved and synced when you're back online."

2. **Request Storage**: All POST, PUT, DELETE requests are automatically stored locally

3. **GET Requests**: Still work if cached, otherwise fail gracefully

### When You Come Back Online

1. **Automatic Retry**: All pending requests are automatically retried

2. **Success Notification**: Shows "Successfully synced X items" with count

3. **Storage Cleanup**: Successful requests are removed from local storage

4. **Error Handling**: Failed requests are retried up to 3 times

## 📊 **Offline Status Monitoring**

```typescript
function OfflineStatus() {
  const { offline } = useApiIntegration();
  const { status } = offline;

  return (
    <View style={styles.statusContainer}>
      <View
        style={[
          styles.indicator,
          { backgroundColor: status.isOnline ? 'green' : 'red' },
        ]}
      />
      <Text>Status: {status.isOnline ? 'Online' : 'Offline'}</Text>
      {status.pendingCount > 0 && (
        <Text>Pending: {status.pendingCount} requests</Text>
      )}
      {status.isRetrying && <Text>Syncing...</Text>}
    </View>
  );
}
```

## 🛠️ **Configuration**

### Offline Storage Settings

```typescript
// In services/offlineStorage.ts
const defaultConfig: OfflineStorageConfig = {
  maxRetries: 3, // Max retry attempts
  retryDelay: 5000, // Delay between retries (5 seconds)
  maxStorageSize: 10 * 1024 * 1024, // Max storage size (10MB)
  cleanupInterval: 24 * 60 * 60 * 1000, // Cleanup old requests (24 hours)
};
```

### HTTP Client Settings

```typescript
// In services/httpClient.ts
const defaultConfig: RequestConfig = {
  offlineFallback: true, // Enable offline fallback by default
  // ... other settings
};
```

## 📋 **Supported Operations**

### ✅ **Fully Supported (Stored Offline)**

- **Meals**: Submit meals, update meal status
- **Bazar**: Submit grocery entries, upload receipts
- **Users**: Create users, update profiles, delete users
- **File Uploads**: Receipt images, profile pictures

### ⚠️ **Partially Supported**

- **GET Requests**: Work with cache, fail gracefully when offline
- **Analytics**: Cached data available offline

### ❌ **Not Supported Offline**

- Real-time data fetching
- Live notifications
- WebSocket connections

## 🔍 **Debugging & Monitoring**

### Check Offline Status

```typescript
const { offline } = useApiIntegration();

// Get detailed status
const status = await offline.getOfflineStatus();
console.log('Offline Status:', status);

// Check specific metrics
const isOnline = await offline.isOnline();
const pendingCount = await offline.getPendingCount();
const storageSize = await offline.getStorageSize();
```

### View Pending Requests

```typescript
import offlineStorage from '@/services/offlineStorage';

// Get all pending requests
const pendingRequests = await offlineStorage.getPendingRequests();
console.log('Pending Requests:', pendingRequests);

// Each request contains:
// {
//   id: string,
//   endpoint: string,
//   method: 'POST' | 'PUT' | 'DELETE',
//   data: any,
//   timestamp: number,
//   retryCount: number,
//   maxRetries: number
// }
```

### Manual Retry

```typescript
// Retry all pending requests
await offline.retryPendingRequests();

// Retry specific request
const requests = await offlineStorage.getPendingRequests();
if (requests.length > 0) {
  await offlineStorage.retryRequest(requests[0]);
}
```

## 🚨 **Error Handling**

### Network Errors

```typescript
const handleSubmit = async () => {
  try {
    const response = await api.meals.submitMeal(mealData);

    if (!response.success) {
      if (response.data?.offlineRequestId) {
        // Request stored for offline retry
        Alert.alert(
          'Offline Mode',
          "Your submission will be synced when you're back online."
        );
      } else {
        // Other error
        Alert.alert('Error', response.error);
      }
    }
  } catch (error) {
    console.error('Submission failed:', error);
  }
};
```

### Retry Failures

```typescript
// Check retry status
const { offline } = useApiIntegration();

useEffect(() => {
  if (offline.error) {
    Alert.alert('Sync Error', offline.error);
    offline.clearError();
  }
}, [offline.error]);
```

## 📱 **User Experience**

### Offline Indicators

```typescript
function OfflineIndicator() {
  const { offline } = useApiIntegration();
  const { status } = offline;

  if (!status.isOnline) {
    return (
      <View style={styles.offlineBanner}>
        <Text style={styles.offlineText}>
          📶 You're offline. Changes will sync when you're back online.
        </Text>
      </View>
    );
  }

  if (status.pendingCount > 0) {
    return (
      <View style={styles.syncingBanner}>
        <Text style={styles.syncingText}>
          🔄 Syncing {status.pendingCount} items...
        </Text>
      </View>
    );
  }

  return null;
}
```

### Progress Tracking

```typescript
function SyncProgress() {
  const { offline } = useApiIntegration();
  const { status } = offline;

  return (
    <View>
      {status.isRetrying && (
        <View style={styles.progressContainer}>
          <ActivityIndicator size='small' color='#007AFF' />
          <Text>Syncing offline data...</Text>
        </View>
      )}

      {status.pendingCount > 0 && !status.isRetrying && (
        <TouchableOpacity onPress={offline.retryPendingRequests}>
          <Text>Retry {status.pendingCount} pending items</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

## 🔧 **Advanced Configuration**

### Custom Retry Logic

```typescript
// Custom retry configuration
const customConfig = {
  maxRetries: 5,
  retryDelay: 2000,
  maxStorageSize: 5 * 1024 * 1024, // 5MB
  cleanupInterval: 12 * 60 * 60 * 1000, // 12 hours
};

// Apply custom config
await offlineStorage.updateConfig(customConfig);
```

### Selective Offline Storage

```typescript
// Disable offline fallback for specific requests
const response = await httpClient.post('/api/sensitive-endpoint', data, {
  offlineFallback: false, // Don't store this request offline
});
```

## 📈 **Performance Considerations**

### Storage Management

- **Automatic Cleanup**: Old requests are cleaned up after 24 hours
- **Size Limits**: Maximum 10MB storage for offline requests
- **Retry Limits**: Maximum 3 retry attempts per request

### Network Optimization

- **Batch Processing**: Multiple requests are processed together
- **Exponential Backoff**: Retry delays increase with each attempt
- **Selective Retry**: Only failed requests are retried

## 🛡️ **Security**

### Data Protection

- **Local Storage**: All offline data is stored locally on device
- **No Cloud Sync**: Offline data never leaves the device
- **Automatic Cleanup**: Sensitive data is automatically removed

### Privacy

- **User Consent**: Users are notified when data is stored offline
- **Transparent Process**: Users can see pending requests and clear them
- **No Tracking**: No analytics or tracking of offline behavior

This offline functionality ensures that users never lose their data due to network issues, providing a robust and reliable experience even in poor connectivity conditions.
