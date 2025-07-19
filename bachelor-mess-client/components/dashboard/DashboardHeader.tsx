import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useAuth } from '@/context/AuthContext';

const DESIGN_SYSTEM = {
  colors: {
    primary: '#667eea',
    secondary: '#764ba2',
    dark: '#1f2937',
    gray: {
      500: '#6b7280',
      600: '#4b5563',
    },
  },
  spacing: {
    xs: 6,
    xl: 24,
  },
  fontSize: {
    xxxl: 28,
    md: 16,
    sm: 14,
  },
  shadows: {
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title = 'Dashboard',
  subtitle,
}) => {
  const router = useRouter();
  const { user } = useAuth();

  const getSubtitle = () => {
    if (subtitle) return subtitle;
    if (user) {
      return `Welcome back, ${
        user.name?.split(' ')[0] || 'User'
      }! Here's your mess overview`;
    }
    return 'Welcome! Please login to access your mess dashboard';
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <ThemedText style={styles.headerTitle}>{title}</ThemedText>
        <ThemedText style={styles.headerSubtitle}>{getSubtitle()}</ThemedText>
        <ThemedText style={styles.headerDate}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </ThemedText>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push('/notifications')}
        >
          <LinearGradient
            colors={[
              DESIGN_SYSTEM.colors.primary,
              DESIGN_SYSTEM.colors.secondary,
            ]}
            style={styles.notificationGradient}
          >
            <Ionicons name='notifications' size={24} color='#fff' />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DESIGN_SYSTEM.spacing.xl,
  },
  headerContent: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: DESIGN_SYSTEM.fontSize.xxxl,
    fontWeight: 'bold',
    color: DESIGN_SYSTEM.colors.dark,
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  headerSubtitle: {
    fontSize: DESIGN_SYSTEM.fontSize.md,
    color: DESIGN_SYSTEM.colors.gray[600],
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  headerDate: {
    fontSize: DESIGN_SYSTEM.fontSize.sm,
    color: DESIGN_SYSTEM.colors.gray[500],
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    ...DESIGN_SYSTEM.shadows.medium,
  },
  notificationGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
