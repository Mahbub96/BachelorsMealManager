import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
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
    return status === 'active' ? '#10b981' : '#6b7280';
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
    <ThemedView style={[styles.container, compact && styles.compactContainer]}>
      {/* Header with gradient background */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <ThemedText style={styles.avatarText}>
                {getInitials(user.name)}
              </ThemedText>
            </View>
            {user.isEmailVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name='checkmark-circle' size={16} color='#10b981' />
              </View>
            )}
          </View>
          <View style={styles.userInfo}>
            <ThemedText style={[styles.name, compact && styles.compactName]}>
              {user.name}
            </ThemedText>
            <ThemedText style={[styles.email, compact && styles.compactEmail]}>
              {user.email}
            </ThemedText>
            <View style={styles.badges}>
              <View style={styles.badgeContainer}>
                <Ionicons
                  name={getRoleIcon(user.role) as IconName}
                  size={12}
                  color='#fff'
                />
                <ThemedText style={styles.badgeText}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.badgeContainer,
                  { backgroundColor: getStatusColor(user.status) },
                ]}
              >
                <Ionicons
                  name={
                    user.status === 'active'
                      ? 'checkmark-circle'
                      : 'close-circle'
                  }
                  size={12}
                  color='#fff'
                />
                <ThemedText style={styles.badgeText}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Details Section */}
      {!compact && (
        <View style={styles.details}>
          {user.phone && (
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name='call' size={16} color='#667eea' />
              </View>
              <View style={styles.detailContent}>
                <ThemedText style={styles.detailLabel}>Phone</ThemedText>
                <ThemedText style={styles.detailText}>{user.phone}</ThemedText>
              </View>
            </View>
          )}

          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Ionicons name='calendar' size={16} color='#667eea' />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={styles.detailLabel}>Member Since</ThemedText>
              <ThemedText style={styles.detailText}>
                {formatDate(user.joinDate)}
              </ThemedText>
            </View>
          </View>

          {user.lastLogin && (
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name='time' size={16} color='#667eea' />
              </View>
              <View style={styles.detailContent}>
                <ThemedText style={styles.detailLabel}>Last Login</ThemedText>
                <ThemedText style={styles.detailText}>
                  {formatRelativeDate(user.lastLogin)}
                </ThemedText>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Stats Section */}
      {showStats && stats && (
        <View style={styles.statsSection}>
          <ThemedText style={styles.statsTitle}>Activity Summary</ThemedText>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name='fast-food' size={20} color='#f59e0b' />
              <ThemedText style={styles.statValue}>
                {stats.totalMeals || 0}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Total Meals</ThemedText>
            </View>
            <View style={styles.statCard}>
              <Ionicons name='cart' size={20} color='#10b981' />
              <ThemedText style={styles.statValue}>
                {stats.totalBazar || 0}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Bazar Entries</ThemedText>
            </View>
            <View style={styles.statCard}>
              <Ionicons name='card' size={20} color='#ef4444' />
              <ThemedText style={styles.statValue}>
                ৳{(stats.totalAmount || 0).toLocaleString()}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Total Spent</ThemedText>
            </View>
          </View>
        </View>
      )}

      {/* Actions Section */}
      {showActions && (
        <View style={styles.actions}>
          {onEditPress && (
            <TouchableOpacity style={styles.actionButton} onPress={onEditPress}>
              <Ionicons name='create' size={20} color='#667eea' />
              <ThemedText style={styles.actionText}>Edit Profile</ThemedText>
            </TouchableOpacity>
          )}
          {onViewDetailsPress && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onViewDetailsPress}
            >
              <Ionicons name='eye' size={20} color='#667eea' />
              <ThemedText style={styles.actionText}>View Details</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  compactName: {
    fontSize: 16,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  details: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
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
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  statsSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
});
