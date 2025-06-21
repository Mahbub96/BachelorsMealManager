import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "./ThemedText";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

interface ModernLoadingSpinnerProps {
  message?: string;
  size?: "small" | "medium" | "large";
  variant?: "default" | "gradient" | "minimal";
}

export const ModernLoadingSpinner: React.FC<ModernLoadingSpinnerProps> = ({
  message = "Loading...",
  size = "medium",
  variant = "default",
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Spinning animation
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );

    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    // Fade in animation
    const fadeAnimation = Animated.timing(fadeValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    });

    spinAnimation.start();
    pulseAnimation.start();
    fadeAnimation.start();

    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
      fadeAnimation.stop();
    };
  }, [spinValue, pulseValue, fadeValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const getSize = () => {
    switch (size) {
      case "small":
        return 40;
      case "large":
        return 120;
      default:
        return 80;
    }
  };

  const getContainerSize = () => {
    switch (size) {
      case "small":
        return 60;
      case "large":
        return 160;
      default:
        return 100;
    }
  };

  const renderDefaultSpinner = () => (
    <View
      style={[
        styles.spinnerContainer,
        { width: getContainerSize(), height: getContainerSize() },
      ]}
    >
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
          colors={["#667eea", "#764ba2", "#f093fb", "#f5576c"]}
          style={styles.gradientRing}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.innerCircle,
          {
            width: getSize() * 0.6,
            height: getSize() * 0.6,
            transform: [{ scale: pulseValue }],
          },
        ]}
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.9)", "rgba(255,255,255,0.3)"]}
          style={styles.innerGradient}
        />
      </Animated.View>
    </View>
  );

  const renderGradientSpinner = () => (
    <View
      style={[
        styles.spinnerContainer,
        { width: getContainerSize(), height: getContainerSize() },
      ]}
    >
      <Animated.View
        style={[
          styles.gradientSpinner,
          {
            width: getSize(),
            height: getSize(),
            transform: [{ rotate: spin }],
          },
        ]}
      >
        <LinearGradient
          colors={["#667eea", "#764ba2", "#f093fb", "#f5576c", "#667eea"]}
          style={styles.fullGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
    </View>
  );

  const renderMinimalSpinner = () => (
    <View
      style={[
        styles.minimalContainer,
        { width: getContainerSize(), height: getContainerSize() },
      ]}
    >
      <Animated.View
        style={[
          styles.minimalSpinner,
          {
            width: getSize() * 0.8,
            height: getSize() * 0.8,
            transform: [{ rotate: spin }],
          },
        ]}
      >
        <View style={styles.minimalRing} />
        <View style={[styles.minimalRing, styles.minimalRing2]} />
        <View style={[styles.minimalRing, styles.minimalRing3]} />
      </Animated.View>
    </View>
  );

  const renderSpinner = () => {
    switch (variant) {
      case "gradient":
        return renderGradientSpinner();
      case "minimal":
        return renderMinimalSpinner();
      default:
        return renderDefaultSpinner();
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeValue }]}>
      <LinearGradient
        colors={["rgba(248,250,252,0.95)", "rgba(241,245,249,0.95)"]}
        style={styles.background}
      >
        {renderSpinner()}

        <View style={styles.messageContainer}>
          <ThemedText style={styles.message}>{message}</ThemedText>
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, { opacity: pulseValue }]} />
            <Animated.View style={[styles.dot, { opacity: pulseValue }]} />
            <Animated.View style={[styles.dot, { opacity: pulseValue }]} />
          </View>
        </View>

        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" size={24} color="#667eea" />
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
  spinnerContainer: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
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
    borderWidth: 4,
    borderColor: "transparent",
  },
  innerCircle: {
    position: "absolute",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  innerGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  gradientSpinner: {
    borderRadius: 50,
    borderWidth: 6,
    borderColor: "transparent",
  },
  fullGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  minimalContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  minimalSpinner: {
    position: "relative",
  },
  minimalRing: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#667eea",
    borderTopColor: "transparent",
  },
  minimalRing2: {
    width: "80%",
    height: "80%",
    top: "10%",
    left: "10%",
    borderColor: "#764ba2",
    borderTopColor: "transparent",
  },
  minimalRing3: {
    width: "60%",
    height: "60%",
    top: "20%",
    left: "20%",
    borderColor: "#f093fb",
    borderTopColor: "transparent",
  },
  messageContainer: {
    marginTop: 32,
    alignItems: "center",
  },
  message: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
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
  iconContainer: {
    position: "absolute",
    bottom: 60,
    padding: 16,
    borderRadius: 50,
    backgroundColor: "rgba(102, 126, 234, 0.1)",
  },
});
