import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { LinearGradient } from 'expo-linear-gradient';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'member' | 'super_admin';
  status: 'active' | 'inactive';
  joinDate: string;
  createdAt: string;
  lastLogin?: string;
  isEmailVerified?: boolean;
}

interface ProfileCardProps {
  user: User;
  showActions?: boolean;
  onEditPress?: () => void;
  onViewDetailsPress?: () => void;
  compact?: boolean;
  showStats?: boolean;
  stats?: {
    totalMeals?: number;
    totalBazar?: number;
    totalAmount?: number;
  };
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  user,
  showActions = false,
  onEditPress,
  onViewDetailsPress,
  compact = false,
  showStats = false,
  stats,
}) => {
  const { theme } = useTheme();
  const onPrimaryText = theme.onPrimary?.text ?? theme.text.inverse;
  const onPrimaryOverlay = theme.onPrimary?.overlay;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return formatDate(dateString);
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? theme.status.success : theme.text.secondary;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? 'shield' : 'person';
  };

  return (
    <ThemedView style={[styles.container, compact && styles.compactContainer, { backgroundColor: theme.surface, shadowColor: theme.shadow.light }]}>
      {/* Header with gradient background */}
      <LinearGradient
        colors={theme.gradient.primary as [string, string]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: onPrimaryOverlay, borderColor: onPrimaryOverlay ?? onPrimaryText }]}>
              <ThemedText style={[styles.avatarText, { color: onPrimaryText }]}>
                {getInitials(user.name)}
              </ThemedText>
            </View>
            {user.isEmailVerified && (
              <View style={[styles.verifiedBadge, { backgroundColor: theme.surface }]}>
                <Ionicons name='checkmark-circle' size={16} color={theme.status.success} />
              </View>
            )}
          </View>
          <View style={styles.userInfo}>
            <ThemedText style={[styles.name, compact && styles.compactName, { color: onPrimaryText }]}>
              {user.name}
            </ThemedText>
            <ThemedText style={[styles.email, compact && styles.compactEmail, { color: onPrimaryOverlay ?? onPrimaryText }]}>
              {user.email}
            </ThemedText>
            <View style={styles.badges}>
              <View style={[styles.badgeContainer, { backgroundColor: onPrimaryOverlay }]}>
                <Ionicons name={getRoleIcon(user.role) as IconName} size={12} color={onPrimaryText} />
                <ThemedText style={[styles.badgeText, { color: onPrimaryText }]}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </ThemedText>
              </View>
              <View style={[styles.badgeContainer, { backgroundColor: getStatusColor(user.status) }]}>
                <Ionicons
                  name={user.status === 'active' ? 'checkmark-circle' : 'close-circle'}
                  size={12}
                  color={onPrimaryText}
                />
                <ThemedText style={[styles.badgeText, { color: onPrimaryText }]}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Details Section */}
      {!compact && (
        <View style={[styles.details, { borderTopColor: theme.border.secondary }]}>
          {user.phone && (
            <View style={styles.detailItem}>
              <View style={[styles.detailIcon, { backgroundColor: theme.surface }]}>
                <Ionicons name='call' size={16} color={theme.primary} />
              </View>
              <View style={styles.detailContent}>
                <ThemedText style={[styles.detailLabel, { color: theme.text.secondary }]}>Phone</ThemedText>
                <ThemedText style={[styles.detailText, { color: theme.text.primary }]}>{user.phone}</ThemedText>
              </View>
            </View>
          )}

          <View style={styles.detailItem}>
            <View style={[styles.detailIcon, { backgroundColor: theme.surface }]}>
              <Ionicons name='calendar' size={16} color={theme.primary} />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={[styles.detailLabel, { color: theme.text.secondary }]}>Member Since</ThemedText>
              <ThemedText style={[styles.detailText, { color: theme.text.primary }]}>
                {formatDate(user.joinDate)}
              </ThemedText>
            </View>
          </View>

          {user.lastLogin && (
            <View style={styles.detailItem}>
              <View style={[styles.detailIcon, { backgroundColor: theme.surface }]}>
                <Ionicons name='time' size={16} color={theme.primary} />
              </View>
              <View style={styles.detailContent}>
                <ThemedText style={[styles.detailLabel, { color: theme.text.secondary }]}>Last Login</ThemedText>
                <ThemedText style={[styles.detailText, { color: theme.text.primary }]}>
                  {formatRelativeDate(user.lastLogin)}
                </ThemedText>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Stats Section */}
      {showStats && stats && (
        <View style={[styles.statsSection, { borderTopColor: theme.border.secondary, backgroundColor: theme.surface }]}>
          <ThemedText style={[styles.statsTitle, { color: theme.text.primary }]}>Activity Summary</ThemedText>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.surface, shadowColor: theme.shadow.light }]}>
              <Ionicons name='fast-food' size={20} color={theme.status.warning} />
              <ThemedText style={[styles.statValue, { color: theme.text.primary }]}>{stats.totalMeals || 0}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.text.secondary }]}>Total Meals</ThemedText>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surface, shadowColor: theme.shadow.light }]}>
              <Ionicons name='cart' size={20} color={theme.status.success} />
              <ThemedText style={[styles.statValue, { color: theme.text.primary }]}>{stats.totalBazar || 0}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.text.secondary }]}>Bazar Entries</ThemedText>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surface, shadowColor: theme.shadow.light }]}>
              <Ionicons name='card' size={20} color={theme.status.error} />
              <ThemedText style={[styles.statValue, { color: theme.text.primary }]}>
                ৳{(stats.totalAmount || 0).toLocaleString()}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.text.secondary }]}>Total Spent</ThemedText>
            </View>
          </View>
        </View>
      )}

      {showActions && (
        <View style={[styles.actions, { borderTopColor: theme.border.secondary }]}>
          {onEditPress && (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.surface }]} onPress={onEditPress}>
              <Ionicons name='create' size={20} color={theme.primary} />
              <ThemedText style={[styles.actionText, { color: theme.primary }]}>Edit Profile</ThemedText>
            </TouchableOpacity>
          )}
          {onViewDetailsPress && (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.surface }]} onPress={onViewDetailsPress}>
              <Ionicons name='eye' size={20} color={theme.primary} />
              <ThemedText style={[styles.actionText, { color: theme.primary }]}>View Details</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  compactContainer: {
    marginBottom: 8,
  },
  headerGradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderRadius: 10,
    padding: 2,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  compactName: {
    fontSize: 16,
  },
  email: {
    fontSize: 14,
    marginBottom: 8,
  },
  compactEmail: {
    fontSize: 12,
    marginBottom: 4,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  details: {
    padding: 20,
    borderTopWidth: 1,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsSection: {
    padding: 20,
    borderTopWidth: 1,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
