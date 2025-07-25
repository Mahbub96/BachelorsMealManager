import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';

interface ThemeCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  gradient?: [string, string];
  onPress?: () => void;
  style?: any;
  contentStyle?: any;
}

export const ThemeCard: React.FC<ThemeCardProps> = ({
  title,
  subtitle,
  children,
  gradient,
  onPress,
  style,
  contentStyle,
}) => {
  const { theme } = useTheme();
  const Container = onPress ? TouchableOpacity : View;

  const defaultGradient: [string, string] = [
    theme.gradient.primary[0],
    theme.gradient.primary[1],
  ];

  return (
    <Container
      style={[
        styles.container,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.cardBorder,
          shadowColor: theme.cardShadow,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      {gradient ? (
        <LinearGradient
          colors={gradient}
          style={[styles.gradientContainer, contentStyle]}
        >
          {title && (
            <ThemedText style={[styles.title, { color: theme.text.inverse }]}>
              {title}
            </ThemedText>
          )}
          {subtitle && (
            <ThemedText style={[styles.subtitle, { color: theme.text.inverse }]}>
              {subtitle}
            </ThemedText>
          )}
          {children}
        </LinearGradient>
      ) : (
        <View style={[styles.content, contentStyle]}>
          {title && (
            <ThemedText style={[styles.title, { color: theme.text.primary }]}>
              {title}
            </ThemedText>
          )}
          {subtitle && (
            <ThemedText style={[styles.subtitle, { color: theme.text.secondary }]}>
              {subtitle}
            </ThemedText>
          )}
          {children}
        </View>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  gradientContainer: {
    padding: 16,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
}); 