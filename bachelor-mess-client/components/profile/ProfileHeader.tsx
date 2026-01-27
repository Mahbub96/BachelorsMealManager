import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../ThemedText';

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

interface ProfileHeaderProps {
  user: User;
  onEditPress?: () => void;
  onViewDetailsPress?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  onEditPress,
  onViewDetailsPress,
  showActions = false,
  compact = false,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return '#ef4444';
      case 'admin':
        return '#f59e0b';
      case 'member':
        return '#667eea';
      default:
        return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? '#10b981' : '#6b7280';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'shield-checkmark';
      case 'admin':
        return 'shield';
      case 'member':
        return 'person';
      default:
        return 'person';
    }
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={[styles.headerGradient, compact && styles.compactHeader]}
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
            <View style={[styles.badgeContainer, { backgroundColor: getRoleColor(user.role) }]}>
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
                  user.status === 'active' ? 'checkmark-circle' : 'close-circle'
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

        {showActions && (
          <View style={styles.actions}>
            {onEditPress && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onEditPress}
              >
                <Ionicons name='create' size={20} color='#fff' />
              </TouchableOpacity>
            )}
            {onViewDetailsPress && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onViewDetailsPress}
              >
                <Ionicons name='eye' size={20} color='#fff' />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  compactHeader: {
    paddingVertical: 12,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
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
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  compactName: {
    fontSize: 16,
  },
  email: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  compactEmail: {
    fontSize: 12,
    marginBottom: 6,
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
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
