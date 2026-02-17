
import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur'; // Make sure expo-blur is installed, logic below handles if it's not available or desired styling
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '../ThemedText';

const { width, height } = Dimensions.get('window');

interface ModernLoaderProps {
  visible?: boolean;
  text?: string;
  overlay?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const ModernLoader: React.FC<ModernLoaderProps> = ({
  visible = true,
  text,
  overlay = true,
  size = 'large',
}) => {
  const { theme, isDark } = useTheme();
  
  // Dimensions based on size
  const getDimensions = () => {
    switch(size) {
      case 'small': return { size: 40, stroke: 3 };
      case 'medium': return { size: 60, stroke: 4 };
      case 'large': default: return { size: 80, stroke: 4 };
    }
  };

  const { size: spinnerSize, stroke } = getDimensions();
  
  // Animation values
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Fade in
      opacity.value = withTiming(1, { duration: 300 });
      
      // Start rotation
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 1500,
          easing: Easing.linear,
        }),
        -1 // Infinite
      );

      // Pulse effect
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      // Fade out
      opacity.value = withTiming(0, { duration: 300 });
      cancelAnimation(rotation);
      cancelAnimation(scale);
    }
  }, [visible]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: interpolate(opacity.value, [0, 1], [0.8, 1], Extrapolation.CLAMP) }],
    };
  });

  const animatedSpinnerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: scale.value }
      ],
    };
  });
  
  // If not visible and opacity is 0, don't render (can add logic to unmount if needed, but opacity 0 with pointerEvents none is often enough)
  if (!visible) return null;

  return (
    <View style={[styles.container, overlay && styles.overlay]} pointerEvents={visible ? 'auto' : 'none'}>
      {overlay && (
         <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      )}
      
      <Animated.View style={[
          styles.loaderContent, 
          animatedContainerStyle, 
          { 
              backgroundColor: theme.cardBackground,
              padding: size === 'small' ? 12 : 24,
              borderRadius: size === 'small' ? 8 : 16
          }
      ]}>
        <View style={[styles.spinnerContainer, { width: spinnerSize, height: spinnerSize }]}>
           {/* Outer rotating gradient ring */}
          <Animated.View style={[
              styles.spinnerRing, 
              animatedSpinnerStyle,
              { width: spinnerSize, height: spinnerSize, borderRadius: spinnerSize / 2, padding: stroke }
          ]}>
            <LinearGradient
              colors={[theme.primary, theme.secondary, theme.accent || theme.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.gradient, { borderRadius: spinnerSize / 2 }]}
            />
          </Animated.View>
          
           {/* Inner mask to create the ring effect */}
          <View style={[
              styles.innerCircle, 
              { 
                  backgroundColor: theme.cardBackground,
                  width: spinnerSize - stroke * 2,
                  height: spinnerSize - stroke * 2,
                  borderRadius: (spinnerSize - stroke * 2) / 2
              }
          ]} />
          
          {/* Central Logo/Icon or Pulse */}
           <View style={[
               styles.coreCircle, 
               { 
                   backgroundColor: theme.primary,
                   width: spinnerSize * 0.15,
                   height: spinnerSize * 0.15,
                   borderRadius: (spinnerSize * 0.15) / 2
               }
           ]} />
        </View>

        {text && (
            <ThemedText style={[styles.loadingText, { fontSize: size === 'small' ? 12 : 16, marginTop: size === 'small' ? 4 : 8 }]}>{text}</ThemedText>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.1)', // Subtle fallback/overlay on top of blur
  },
  loaderContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 16,
    // Add subtle shadow/elevation
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  spinnerContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  spinnerRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    // Apply padding to create the thickness of the ring when masked by innerCircle
    padding: 4, 
  },
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  innerCircle: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coreCircle: {
      width: 12,
      height: 12,
      borderRadius: 6,
      opacity: 0.8,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
