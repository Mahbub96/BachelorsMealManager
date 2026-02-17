import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '../ThemedText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const { theme } = useTheme();

  const ringSize = size === 'small' ? 32 : size === 'medium' ? 48 : 56;
  const strokeWidth = size === 'small' ? 3 : size === 'medium' ? 4 : 4;
  const padding = size === 'small' ? 16 : size === 'medium' ? 20 : 24;
  const textSize = size === 'small' ? 12 : size === 'medium' ? 14 : 15;

  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.ease) });
      scale.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.ease) });
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
      );
    } else {
      opacity.value = withTiming(0, { duration: 180 });
      cancelAnimation(rotation);
    }
  }, [visible]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (!visible) return null;

  const gradientColors = (theme.gradient?.primary || [theme.primary, theme.secondary]) as [string, string];

  return (
    <View
      style={[styles.container, overlay && styles.overlay]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {overlay && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: theme.overlay?.medium,
            },
          ]}
        />
      )}

      <Animated.View
        style={[
          styles.card,
          containerAnimatedStyle,
          {
            backgroundColor: theme.modal ?? theme.cardBackground,
            borderColor: theme.border?.secondary ?? theme.cardBorder,
            shadowColor: theme.shadow?.light ?? theme.cardShadow,
            padding,
            borderRadius: size === 'small' ? 12 : 16,
            maxWidth: SCREEN_WIDTH * 0.85,
          },
        ]}
      >
        <View style={[styles.ringWrap, { width: ringSize + strokeWidth * 2, height: ringSize + strokeWidth * 2 }]}>
          <Animated.View
            style={[
              styles.ringOuter,
              ringAnimatedStyle,
              {
                width: ringSize + strokeWidth * 2,
                height: ringSize + strokeWidth * 2,
                borderRadius: (ringSize + strokeWidth * 2) / 2,
              },
            ]}
          >
            <LinearGradient
              colors={[
                'transparent',
                gradientColors[0],
                gradientColors[1],
                'transparent',
              ]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                styles.ringInner,
                {
                  width: ringSize,
                  height: ringSize,
                  borderRadius: ringSize / 2,
                  backgroundColor: theme.modal ?? theme.cardBackground,
                  top: strokeWidth,
                  left: strokeWidth,
                },
              ]}
            />
          </Animated.View>
        </View>

        {text ? (
          <ThemedText
            style={[
              styles.text,
              {
                color: theme.text?.secondary ?? theme.text?.primary,
                fontSize: textSize,
                marginTop: size === 'small' ? 6 : 10,
              },
            ]}
            numberOfLines={2}
          >
            {text}
          </ThemedText>
        ) : null}
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
    // Overlay color applied by child View
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  ringWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringOuter: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    position: 'absolute',
  },
  text: {
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
