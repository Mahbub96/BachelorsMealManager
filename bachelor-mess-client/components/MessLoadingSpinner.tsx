import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "./ThemedText";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

interface MessLoadingSpinnerProps {
  message?: string;
  type?: "auth" | "meals" | "bazar" | "dashboard" | "general";
  size?: "small" | "medium" | "large";
}

export const MessLoadingSpinner: React.FC<MessLoadingSpinnerProps> = ({
  message,
  type = "general",
  size = "medium",
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const iconScaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Spinning animation
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );

    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Icon scale animation
    const iconAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(iconScaleValue, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(iconScaleValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    // Fade in animation
    const fadeAnimation = Animated.timing(fadeValue, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    });

    spinAnimation.start();
    pulseAnimation.start();
    iconAnimation.start();
    fadeAnimation.start();

    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
      iconAnimation.stop();
      fadeAnimation.stop();
    };
  }, [spinValue, pulseValue, fadeValue, iconScaleValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const getSize = () => {
    switch (size) {
      case "small":
        return 60;
      case "large":
        return 120;
      default:
        return 90;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "small":
        return 24;
      case "large":
        return 48;
      default:
        return 36;
    }
  };

  const getTypeConfig = () => {
    switch (type) {
      case "auth":
        return {
          icon: "shield-checkmark",
          colors: ["#667eea", "#764ba2"] as const,
          defaultMessage: "Securing your account...",
          gradientColors: ["#667eea", "#764ba2", "#f093fb", "#f5576c"] as const,
        };
      case "meals":
        return {
          icon: "restaurant",
          colors: ["#f093fb", "#f5576c"] as const,
          defaultMessage: "Loading your meals...",
          gradientColors: ["#f093fb", "#f5576c", "#667eea", "#764ba2"] as const,
        };
      case "bazar":
        return {
          icon: "cart",
          colors: ["#43e97b", "#38f9d7"] as const,
          defaultMessage: "Loading bazar items...",
          gradientColors: ["#43e97b", "#38f9d7", "#667eea", "#764ba2"] as const,
        };
      case "dashboard":
        return {
          icon: "home",
          colors: ["#fa709a", "#fee140"] as const,
          defaultMessage: "Loading dashboard...",
          gradientColors: ["#fa709a", "#fee140", "#667eea", "#764ba2"] as const,
        };
      default:
        return {
          icon: "refresh",
          colors: ["#667eea", "#764ba2"] as const,
          defaultMessage: "Loading...",
          gradientColors: ["#667eea", "#764ba2", "#f093fb", "#f5576c"] as const,
        };
    }
  };

  const config = getTypeConfig();
  const displayMessage = message || config.defaultMessage;

  return (
    <Animated.View style={[styles.container, { opacity: fadeValue }]}>
      <LinearGradient
        colors={["rgba(248,250,252,0.98)", "rgba(241,245,249,0.98)"]}
        style={styles.background}
      >
        {/* App Logo/Brand */}
        <View style={styles.brandContainer}>
          <LinearGradient colors={config.colors} style={styles.brandGradient}>
            <ThemedText style={styles.brandText}>BM</ThemedText>
          </LinearGradient>
          <ThemedText style={styles.brandSubtext}>Bachelor Mess</ThemedText>
        </View>

        {/* Main Loading Spinner */}
        <View style={styles.spinnerContainer}>
          <Animated.View
            style={[
              styles.spinnerRing,
              {
                width: getSize(),
                height: getSize(),
                transform: [{ rotate: spin }],
              },
            ]}
          >
            <LinearGradient
              colors={config.gradientColors}
              style={styles.gradientRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>

          {/* Center Icon */}
          <Animated.View
            style={[
              styles.centerIcon,
              {
                transform: [{ scale: iconScaleValue }],
              },
            ]}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.95)", "rgba(255,255,255,0.8)"]}
              style={styles.iconBackground}
            >
              <Ionicons
                name={config.icon as any}
                size={getIconSize()}
                color={config.colors[0]}
              />
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Loading Message */}
        <View style={styles.messageContainer}>
          <ThemedText style={styles.message}>{displayMessage}</ThemedText>

          {/* Animated Dots */}
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, { opacity: pulseValue }]} />
            <Animated.View style={[styles.dot, { opacity: pulseValue }]} />
            <Animated.View style={[styles.dot, { opacity: pulseValue }]} />
          </View>
        </View>

        {/* Bottom Info */}
        <View style={styles.bottomInfo}>
          <Ionicons name="time-outline" size={16} color="#9ca3af" />
          <ThemedText style={styles.bottomText}>
            Please wait while we process your request
          </ThemedText>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  brandGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  brandText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  brandSubtext: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  spinnerContainer: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 40,
  },
  spinnerRing: {
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  gradientRing: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    borderWidth: 6,
    borderColor: "transparent",
  },
  centerIcon: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  iconBackground: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  messageContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  message: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
    textAlign: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#667eea",
  },
  bottomInfo: {
    position: "absolute",
    bottom: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bottomText: {
    fontSize: 14,
    color: "#9ca3af",
  },
});
