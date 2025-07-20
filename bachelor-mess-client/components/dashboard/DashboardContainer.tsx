import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { ThemedView } from '../ThemedView';
import { ThemedText } from '../ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface DashboardContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  showHeader?: boolean;
  gradient?: readonly [string, string];
  icon?: string;
  style?: any;
}

export const DashboardContainer: React.FC<DashboardContainerProps> = ({
  title,
  subtitle,
  children,
  onRefresh,
  refreshing = false,
  showHeader = true,
  gradient = ['#667eea', '#764ba2'],
  icon = 'grid',
  style,
}) => {
  return (
    <ThemedView style={[styles.container, style]}>
      {showHeader && (
        <LinearGradient colors={gradient} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <Ionicons name={icon as any} size={24} color='#fff' />
              <ThemedText style={styles.title}>{title}</ThemedText>
            </View>
            {subtitle && (
              <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
            )}
          </View>
        </LinearGradient>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60, // Account for status bar
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
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 8,
  },
  subtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
