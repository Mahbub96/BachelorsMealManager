# Bachelor Mess Manager

A modern React Native Expo app for managing bachelor mess operations with a Node.js/Express backend.

## Features

- 🏠 **Dashboard**: Real-time statistics and member overview
- 🍽️ **Meal Management**: Submit and track daily meals
- 🛒 **Bazar Management**: Upload and review grocery expenses
- 👥 **Member Management**: Add, edit, and manage mess members
- 📊 **Analytics**: Detailed reports and insights
- 🔐 **Authentication**: Secure login and user management
- 📱 **Modern UI**: Beautiful, responsive design with smooth animations
- 🔄 **Real-time Updates**: Pull-to-refresh and live data updates
- 🛡️ **Error Handling**: Comprehensive error boundaries and retry mechanisms

## Environment Configuration

### Development Mode

The app automatically detects development mode and provides:

- Dummy data for testing
- Simulated API delays for better UX
- Debug information
- Test user credentials

### Production Mode

In production, the app connects to real APIs and databases:

- Real user data
- Live API endpoints
- Optimized performance
- Production error handling

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (optional)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd bachelor-mess-client
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment Setup**

For Development:

```bash
# The .env file is already configured for development
# It includes dummy data and test credentials
```

For Production:

```bash
# Copy production environment
cp .env.production .env
# Edit .env with your production API URL
```

4. **Start the Development Server**

```bash
npx expo start
```

5. **Run on Device/Simulator**

- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on your phone

## Environment Variables

### Development (.env)

```env
# Client Configuration
EXPO_PUBLIC_API_URL=http://192.168.0.130:5001

# App Configuration
EXPO_PUBLIC_APP_NAME=Bachelor Mess Manager
EXPO_PUBLIC_APP_VERSION=1.0.0

# Development Configuration
EXPO_PUBLIC_DEBUG=true
EXPO_PUBLIC_DEV_MODE=true
EXPO_PUBLIC_USE_DUMMY_DATA=true

# API Configuration
EXPO_PUBLIC_API_TIMEOUT=10000
EXPO_PUBLIC_API_RETRY_ATTEMPTS=3

# Test User Credentials (Development)
EXPO_PUBLIC_TEST_EMAIL=admin@example.com
EXPO_PUBLIC_TEST_PASSWORD=admin1230
```

### Production (.env.production)

```env
# Production Configuration
EXPO_PUBLIC_API_URL=https://your-production-api.com

# App Configuration
EXPO_PUBLIC_APP_NAME=Bachelor Mess Manager
EXPO_PUBLIC_APP_VERSION=1.0.0

# Production Configuration
EXPO_PUBLIC_DEBUG=false
EXPO_PUBLIC_DEV_MODE=false
EXPO_PUBLIC_USE_DUMMY_DATA=false

# API Configuration
EXPO_PUBLIC_API_TIMEOUT=15000
EXPO_PUBLIC_API_RETRY_ATTEMPTS=5
```

## Project Structure

```
bachelor-mess-client/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens
│   ├── HomePage.tsx       # Main dashboard
│   ├── LoginScreen.tsx    # Authentication
│   └── ...
├── components/            # Reusable UI components
│   ├── LoadingSpinner.tsx # Modern loading animations
│   ├── ErrorBoundary.tsx  # Error handling
│   └── ...
├── services/              # API and data services
│   ├── api.ts            # API client configuration
│   ├── dataService.ts    # Data service with env detection
│   └── ...
├── config/               # App configuration
│   ├── app.ts           # App settings
│   └── api.ts           # API configuration
├── context/              # React Context providers
├── hooks/                # Custom React hooks
└── constants/            # App constants
```

## Key Components

### DataService

The `DataService` class automatically handles:

- Environment detection (dev/prod)
- Dummy data in development
- Real API calls in production
- Error handling and retries
- Loading state management

### LoadingSpinner

Modern loading component with:

- Multiple animation types (spinner, dots, pulse)
- Customizable colors and sizes
- Smooth animations
- Icon integration

### ErrorBoundary

Comprehensive error handling:

- Graceful error display
- Retry functionality
- Debug information in development
- User-friendly error messages

## Development Workflow

### Adding New Features

1. Create components in `components/`
2. Add API methods in `services/api.ts`
3. Update `DataService` for new endpoints
4. Add environment-specific data handling
5. Test in both development and production modes

### Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

### Building for Production

```bash
# Build for iOS
npx expo build:ios

# Build for Android
npx expo build:android

# Build for web
npx expo build:web
```

## API Integration

The app uses a flexible API integration system:

### Development Mode

- Uses dummy data with realistic delays
- Simulates API responses
- Provides test user credentials
- Shows debug information

### Production Mode

- Connects to real backend APIs
- Handles authentication tokens
- Implements proper error handling
- Optimized for performance

## Troubleshooting

### Common Issues

1. **Metro bundler errors**

```bash
npx expo start --clear
```

2. **Environment variables not loading**

```bash
# Restart the development server
npx expo start --clear
```

3. **API connection issues**

- Check your IP address in `.env`
- Ensure backend server is running
- Verify network connectivity

4. **Build errors**

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start --clear
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test in both development and production modes
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:

- Create an issue in the repository
- Check the troubleshooting section
- Review the documentation

---

**Note**: This app is designed to work seamlessly in both development and production environments. The development mode provides a complete experience with dummy data, while production mode connects to real APIs and databases.
