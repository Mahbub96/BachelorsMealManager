import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import { ThemedText } from "./ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  text?: string;
  type?: "spinner" | "dots" | "pulse";
  color?: string;
  showIcon?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  text,
  type = "spinner",
  color = "#667eea",
  showIcon = true,
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const dotValues = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    if (type === "spinner") {
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
    } else if (type === "pulse") {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.2,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
    } else if (type === "dots") {
      const dotAnimations = dotValues.map((dot, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 200),
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        )
      );
      dotAnimations.forEach((animation) => animation.start());
    }

    return () => {
      spinValue.stopAnimation();
      pulseValue.stopAnimation();
      dotValues.forEach((dot) => dot.stopAnimation());
    };
  }, [type]);

  const getSizeValue = () => {
    switch (size) {
      case "small":
        return 20;
      case "large":
        return 48;
      default:
        return 32;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "small":
        return 16;
      case "large":
        return 32;
      default:
        return 24;
    }
  };

  const renderSpinner = () => {
    const spin = spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"],
    });

    return (
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <LinearGradient
          colors={[color, `${color}40`]}
          style={[
            styles.spinner,
            { width: getSizeValue(), height: getSizeValue() },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
    );
  };

  const renderPulse = () => {
    return (
      <Animated.View style={{ transform: [{ scale: pulseValue }] }}>
        <View
          style={[
            styles.pulse,
            {
              backgroundColor: color,
              width: getSizeValue(),
              height: getSizeValue(),
            },
          ]}
        />
      </Animated.View>
    );
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {dotValues.map((dot, index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: color,
                width: getSizeValue() / 3,
                height: getSizeValue() / 3,
                opacity: dot,
                transform: [{ scale: dot }],
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderContent = () => {
    switch (type) {
      case "spinner":
        return renderSpinner();
      case "pulse":
        return renderPulse();
      case "dots":
        return renderDots();
      default:
        return renderSpinner();
    }
  };

  return (
    <View style={styles.container}>
      {showIcon && (
        <View style={styles.iconContainer}>
          <Ionicons name="refresh" size={getIconSize()} color={color} />
        </View>
      )}
      {renderContent()}
      {text && <ThemedText style={[styles.text, { color }]}>{text}</ThemedText>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  iconContainer: {
    marginBottom: 12,
  },
  spinner: {
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "transparent",
  },
  pulse: {
    borderRadius: 50,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    borderRadius: 50,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default LoadingSpinner;
