# Bachelor Mess Manager 🏠

A modern, beautiful React Native app for managing bachelor mess expenses, meals, and member activities. Built with Expo and featuring a contemporary design with gradient backgrounds, modern UI components, and intuitive user experience.

## ✨ Features

### 🎨 Modern Design

- **Gradient Headers**: Beautiful gradient backgrounds throughout the app
- **Modern Cards**: Sleek card designs with shadows and rounded corners
- **Responsive Layout**: Optimized for different screen sizes
- **Intuitive Navigation**: Clean tab navigation with modern icons

### 📊 Dashboard

- **Quick Stats**: Real-time overview of mess activities
- **Activity Feed**: Recent meal and bazar submissions
- **Weekly Charts**: Visual representation of meal consumption
- **Monthly Summary**: Comprehensive financial overview

### 🍽️ Meal Management

- **Daily Meal Tracking**: Submit breakfast, lunch, and dinner
- **Interactive Toggles**: Easy meal selection with switches
- **Meal History**: View past meal submissions
- **Statistics**: Track meal patterns and averages

### 🛒 Bazar Management

- **Expense Tracking**: Monitor bazar expenses
- **Status Management**: Approve/reject bazar submissions (Admin)
- **Search Functionality**: Find specific bazar items
- **Real-time Stats**: Overview of approved, pending, and total expenses

### 👥 Member Management (Admin)

- **Member Overview**: View all mess members
- **Role Management**: Admin and member permissions
- **Activity Monitoring**: Track member participation

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
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

3. **Start the development server**

   ```bash
   npx expo start
   ```

4. **Run on your device**
   - Scan the QR code with Expo Go app (iOS/Android)
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Press `w` for web browser

## 📱 App Structure

```
app/
├── (tabs)/           # Tab navigation screens
│   ├── index.tsx     # Home dashboard
│   ├── explore.tsx   # Bazar management
│   ├── meals.tsx     # Meal tracking
│   ├── admin.tsx     # Admin panel
│   └── _layout.tsx   # Tab layout
├── HomePage.tsx      # Main dashboard
├── LoginScreen.tsx   # Authentication
└── _layout.tsx       # Root layout
```

## 🎯 Key Components

### Modern UI Elements

- **LinearGradient**: Beautiful gradient backgrounds
- **Ionicons**: Modern icon set
- **Shadow Effects**: Depth and elevation
- **Rounded Corners**: Contemporary design
- **Color Schemes**: Consistent color palette

### State Management

- **React Hooks**: Modern state management
- **Context API**: Global state for authentication
- **Local Storage**: Persistent user preferences

## 🛠️ Technology Stack

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe JavaScript
- **Expo Router**: File-based routing
- **Linear Gradient**: Beautiful gradient effects
- **Ionicons**: Modern icon library

## 📊 Data Structure

### Meal Entry

```typescript
interface MealEntry {
  id: string;
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  submittedAt: string;
}
```

### Bazar Item

```typescript
interface BazarItem {
  id: string;
  name: string;
  amount: number;
  date: string;
  status: "pending" | "approved" | "rejected";
  submittedBy: string;
}
```

## 🎨 Design System

### Color Palette

- **Primary**: `#667eea` (Indigo)
- **Secondary**: `#f093fb` (Pink)
- **Success**: `#10b981` (Green)
- **Warning**: `#f59e0b` (Yellow)
- **Error**: `#ef4444` (Red)
- **Background**: `#f8fafc` (Light Gray)

### Typography

- **Headers**: Bold, 28px
- **Section Titles**: Bold, 20px
- **Body Text**: Regular, 16px
- **Captions**: Regular, 12px

## 🔧 Development

### Available Scripts

- `npm start`: Start Expo development server
- `npm run android`: Run on Android
- `npm run ios`: Run on iOS
- `npm run web`: Run on web browser
- `npm run lint`: Run ESLint

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Consistent naming conventions

## 📱 Platform Support

- ✅ iOS (iPhone/iPad)
- ✅ Android (Phone/Tablet)
- ✅ Web Browser
- ✅ Expo Go App

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Expo team for the amazing development platform
- React Native community for continuous improvements
- Ionicons for the beautiful icon set

---

**Built with ❤️ for bachelor mess management**
