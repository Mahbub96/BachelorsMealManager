import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { ThemedText } from '../ThemedText';

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  onPress?: () => void;
  gradient?: readonly [string, string];
  icon?: string;
  subtitle?: string;
  showHeader?: boolean;
  style?: React.ComponentProps<typeof View>['style'];
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  children,
  onPress,
  gradient = ['#667eea', '#764ba2'],
  icon = 'analytics',
  subtitle,
  showHeader = true,
  style,
}) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      {showHeader && (
        <LinearGradient colors={gradient} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <Ionicons name={icon as IconName} size={20} color='#fff' />
              <ThemedText style={styles.title}>{title}</ThemedText>
            </View>
            {subtitle && (
              <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
            )}
          </View>
        </LinearGradient>
      )}
      <View style={styles.content}>{children}</View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  subtitle: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  content: {
    padding: 16,
  },
});
