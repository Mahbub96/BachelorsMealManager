import { AuthGuard } from '@/components/AuthGuard';
import { AuthProvider } from '@/context/AuthContext';
import { BazarProvider } from '@/context/BazarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
// import { useColorScheme } from 'react-native';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'auth',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function AppContent() {
  // const { user } = useAuth();

  return (
    <Stack>
      <Stack.Screen name='auth' options={{ headerShown: false }} />
      <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
      <Stack.Screen name='LoginScreen' options={{ headerShown: false }} />
      <Stack.Screen name='SignupScreen' options={{ headerShown: false }} />
      <Stack.Screen
        name='notifications'
        options={{
          headerShown: true,
          title: 'Notifications',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name='settings'
        options={{
          headerShown: true,
          title: 'Settings',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name='profile'
        options={{
          headerShown: true,
          title: 'Profile',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name='help'
        options={{
          headerShown: true,
          title: 'Help & Support',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name='recent-activity'
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='bar-details'
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='pie-details'
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='expense-details'
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='activity-details'
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='bazar-list'
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  // const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <BazarProvider>
          <AuthGuard>
            <AppContent />
          </AuthGuard>
        </BazarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
