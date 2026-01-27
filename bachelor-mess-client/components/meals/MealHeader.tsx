import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { ThemedText } from '../ThemedText';

interface MealHeaderProps {
  title: string;
  subtitle: string;
  icon: string;
  colors: [string, string];
}

export const MealHeader: React.FC<MealHeaderProps> = ({
  title,
  subtitle,
  icon,
  colors,
}) => {
  return (
    <LinearGradient colors={colors} style={styles.header}>
      <View style={styles.headerContent}>
        <ThemedText style={styles.headerTitle}>{title}</ThemedText>
        <ThemedText style={styles.headerSubtitle}>{subtitle}</ThemedText>
      </View>
      <Ionicons name={icon as IconName} size={32} color='#fff' />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
});
