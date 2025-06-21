import React, { useEffect } from "react";
import { View, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import LoginScreen from "@/app/LoginScreen";
import { MessLoadingSpinner } from "./MessLoadingSpinner";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading, token } = useAuth();
  const router = useRouter();

  // Handle authentication state changes
  useEffect(() => {
    if (!isLoading) {
      if (!user || !token) {
        // Ensure we're not already on login screen to prevent navigation loops
        const currentRoute = router.canGoBack() ? "current" : "initial";
        if (currentRoute !== "initial") {
          // Clear navigation stack and go to login
          router.replace("/LoginScreen");
        }
      }
    }
  }, [user, token, isLoading, router]);

  // Show mess-specific loading screen while checking authentication
  if (isLoading) {
    return (
      <MessLoadingSpinner
        type="auth"
        size="large"
        message="Initializing your account..."
      />
    );
  }

  // If user is not authenticated, show login screen
  if (!user || !token) {
    return <LoginScreen />;
  }

  // If user is authenticated, show the main app
  return <>{children}</>;
}
