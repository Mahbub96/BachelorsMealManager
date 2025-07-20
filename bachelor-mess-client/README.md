# Bachelor Mess Client

A React Native mobile application for managing mess operations, built with Expo.

## Features

- **User Authentication**: Secure login and registration system
- **Meal Management**: Track daily meals (breakfast, lunch, dinner)
- **Bazar Management**: Upload and manage shopping lists
- **Dashboard**: Real-time statistics and analytics
- **Notifications**: Push notifications for important updates
- **Offline Support**: Works without internet connection
- **Role-based Access**: Admin and member roles with different permissions

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd bachelor-mess-client
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

4. Run on device/simulator:

```bash
# For iOS
npm run ios

# For Android
npm run android

# For web
npm run web
```

## Notifications

### Expo Go Limitations

⚠️ **Important**: Push notifications are not supported in Expo Go with SDK 53. You'll see warnings like:

```
ERROR expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go with the release of SDK 53.
```

### Solutions

#### Option 1: Use Development Build (Recommended)

For full notification support, create a development build:

1. Install EAS CLI:

```bash
npm install -g @expo/eas-cli
```

2. Login to your Expo account:

```bash
eas login
```

3. Build a development client:

```bash
eas build --profile development --platform android
# or
eas build --profile development --platform ios
```

4. Install the development build on your device

#### Option 2: Continue with Expo Go

The app will work in Expo Go, but notifications will be disabled. You'll see informative logs instead of errors.

### Notification Features

- **Meal Reminders**: Get notified about meal submissions
- **Bazar Updates**: Receive notifications for new bazar entries
- **Payment Reminders**: Stay updated on payment status
- **System Notifications**: Important system updates

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.130:3000
EXPO_PUBLIC_EAS_PROJECT_ID=your-project-id
```

### API Configuration

The app connects to the Bachelor Mess Backend API. Make sure the backend server is running and accessible.

## Development

### Project Structure

```
bachelor-mess-client/
├── app/                    # Expo Router pages
├── components/            # Reusable components
├── context/              # React Context providers
├── hooks/                # Custom React hooks
├── services/             # API services
├── utils/                # Utility functions
└── assets/              # Images, fonts, etc.
```

### Key Components

- **ApiDashboard**: Main dashboard with real-time data
- **MealManagement**: Meal tracking and submission
- **BazarList**: Bazar entry management
- **AuthContext**: Authentication state management
- **NotificationService**: Push notification handling

## Troubleshooting

### Common Issues

1. **Notification Warnings in Expo Go**: This is expected. Use a development build for full notification support.

2. **API Connection Issues**: Check that the backend server is running and the API URL is correct.

3. **Build Errors**: Make sure all dependencies are installed and the Expo CLI is up to date.

### Debug Mode

Enable debug logging by setting `__DEV__` to true in development builds.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
