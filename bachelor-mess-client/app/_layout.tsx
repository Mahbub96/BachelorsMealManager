import { Stack } from "expo-router";
import { useState } from "react";
import { useColorScheme } from "react-native";
import { AuthProvider } from "@/context/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary";
import CustomSplashScreen from "@/components/CustomSplashScreen";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on tabs keeps a back button present.
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  const handleSplashFinish = () => {
    setIsSplashVisible(false);
  };

  const handleAuthError = () => {
    // This will be handled by the AuthGuard when the auth state changes
    console.log("Auth error detected, redirecting to login");
  };

  // Show custom splash screen immediately
  if (isSplashVisible) {
    return <CustomSplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <AuthErrorBoundary onAuthError={handleAuthError}>
      <AuthProvider>
        <AuthGuard>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
          </Stack>
        </AuthGuard>
      </AuthProvider>
    </AuthErrorBoundary>
  );
}
