import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

interface CustomSplashScreenProps {
  onFinish: () => void;
}

export default function CustomSplashScreen({
  onFinish,
}: CustomSplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;
  const textSlideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const startAnimations = async () => {
      // Start all animations in parallel
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(textSlideAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(iconRotateAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ]).start();

      // Start progress animation
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      }).start();

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Hide splash screen after animations complete
      setTimeout(() => {
        onFinish();
      }, 3500);
    };

    startAnimations();
  }, [
    fadeAnim,
    scaleAnim,
    progressAnim,
    iconRotateAnim,
    textSlideAnim,
    pulseAnim,
    onFinish,
  ]);

  const rotateInterpolate = iconRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <LinearGradient
        colors={["#1a1a2e", "#16213e", "#0f3460", "#533483"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* App Icon with Pulse Animation */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [
                  { rotate: rotateInterpolate },
                  { scale: pulseAnim },
                ],
              },
            ]}
          >
            <View style={styles.iconBackground}>
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.2)",
                  "rgba(255, 255, 255, 0.1)",
                ]}
                style={styles.iconGradient}
              >
                <Ionicons name="restaurant" size={70} color="#ffffff" />
              </LinearGradient>
            </View>
          </Animated.View>

          {/* App Title with Slide Animation */}
          <Animated.View
            style={[
              styles.titleContainer,
              {
                transform: [{ translateY: textSlideAnim }],
              },
            ]}
          >
            <Text style={styles.title}>Bachelor Mess</Text>
            <Text style={styles.subtitle}>Smart Mess Management</Text>
          </Animated.View>

          {/* Loading Steps */}
          <View style={styles.loadingSteps}>
            <View style={styles.step}>
              <Ionicons name="checkmark-circle" size={22} color="#4ade80" />
              <Text style={styles.stepText}>Initializing Application...</Text>
            </View>
            <View style={styles.step}>
              <Ionicons name="checkmark-circle" size={22} color="#4ade80" />
              <Text style={styles.stepText}>Loading User Data...</Text>
            </View>
            <View style={styles.step}>
              <Ionicons name="checkmark-circle" size={22} color="#4ade80" />
              <Text style={styles.stepText}>Preparing Dashboard...</Text>
            </View>
            <View style={styles.step}>
              <Ionicons name="checkmark-circle" size={22} color="#4ade80" />
              <Text style={styles.stepText}>Ready to Serve!</Text>
            </View>
          </View>

          {/* Enhanced Progress Bar */}
          <View style={styles.progressContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressWidth,
                },
              ]}
            />
            <View style={styles.progressGlow} />
          </View>

          {/* Loading Text */}
          <Text style={styles.loadingText}>
            Loading your mess experience...
          </Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconBackground: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    fontWeight: "500",
  },
  loadingSteps: {
    marginBottom: 40,
    width: "100%",
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  stepText: {
    color: "#ffffff",
    fontSize: 16,
    marginLeft: 15,
    fontWeight: "500",
  },
  progressContainer: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 3,
    marginBottom: 25,
    overflow: "hidden",
    position: "relative",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#4ade80",
    borderRadius: 3,
    shadowColor: "#4ade80",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  progressGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(74, 222, 128, 0.3)",
    borderRadius: 3,
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "400",
  },
});
