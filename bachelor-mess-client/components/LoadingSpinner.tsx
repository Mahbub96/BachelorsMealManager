import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import { ThemedText } from "./ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  text?: string;
  type?: "spinner" | "dots" | "pulse" | "modern";
  color?: string;
  showIcon?: boolean;
  variant?: "default" | "gradient" | "minimal";
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  text,
  type = "modern",
  color = "#667eea",
  showIcon = true,
  variant = "default",
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const dotValues = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    // Fade in animation
    const fadeAnimation = Animated.timing(fadeValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    });
    fadeAnimation.start();

    if (type === "spinner" || type === "modern") {
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
    }

    if (type === "pulse" || type === "modern") {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
    }

    if (type === "dots") {
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
      fadeValue.stopAnimation();
      dotValues.forEach((dot) => dot.stopAnimation());
    };
  }, [type]);

  const getSizeValue = () => {
    switch (size) {
      case "small":
        return 40;
      case "large":
        return 80;
      default:
        return 60;
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

  const renderModernSpinner = () => {
    const spin = spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"],
    });

    if (variant === "gradient") {
      return (
        <View
          style={[
            styles.modernContainer,
            { width: getSizeValue() + 20, height: getSizeValue() + 20 },
          ]}
        >
          <Animated.View
            style={[
              styles.modernSpinner,
              {
                width: getSizeValue(),
                height: getSizeValue(),
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
    }

    if (variant === "minimal") {
      return (
        <View
          style={[
            styles.modernContainer,
            { width: getSizeValue() + 20, height: getSizeValue() + 20 },
          ]}
        >
          <Animated.View
            style={[
              styles.minimalSpinner,
              {
                width: getSizeValue(),
                height: getSizeValue(),
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
    }

    // Default modern spinner
    return (
      <View
        style={[
          styles.modernContainer,
          { width: getSizeValue() + 20, height: getSizeValue() + 20 },
        ]}
      >
        <Animated.View
          style={[
            styles.spinnerRing,
            {
              width: getSizeValue(),
              height: getSizeValue(),
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
              width: getSizeValue() * 0.6,
              height: getSizeValue() * 0.6,
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
      case "modern":
        return renderModernSpinner();
      case "spinner":
        return renderSpinner();
      case "pulse":
        return renderPulse();
      case "dots":
        return renderDots();
      default:
        return renderModernSpinner();
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeValue }]}>
      {showIcon && (
        <View style={styles.iconContainer}>
          <Ionicons
            name="shield-checkmark"
            size={getIconSize()}
            color={color}
          />
        </View>
      )}
      {renderContent()}
      {text && (
        <View style={styles.textContainer}>
          <ThemedText style={[styles.text, { color }]}>{text}</ThemedText>
          {type === "modern" && (
            <View style={styles.dotsContainer}>
              <Animated.View
                style={[styles.modernDot, { opacity: pulseValue }]}
              />
              <Animated.View
                style={[styles.modernDot, { opacity: pulseValue }]}
              />
              <Animated.View
                style={[styles.modernDot, { opacity: pulseValue }]}
              />
            </View>
          )}
        </View>
      )}
    </Animated.View>
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
  modernContainer: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  modernSpinner: {
    borderRadius: 50,
    borderWidth: 6,
    borderColor: "transparent",
  },
  fullGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
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
  textContainer: {
    marginTop: 12,
    alignItems: "center",
  },
  modernDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#667eea",
    marginHorizontal: 4,
  },
});

export default LoadingSpinner;
