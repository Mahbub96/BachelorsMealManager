import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
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
  const { theme } = useTheme();
  const onPrimaryText = theme.onPrimary?.text ?? theme.text.inverse;
  const onPrimaryOverlay = theme.onPrimary?.overlay ?? theme.text.tertiary;

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
        return theme.status.error;
      case 'admin':
        return theme.status.warning;
      case 'member':
        return theme.primary;
      default:
        return theme.text.secondary;
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? theme.status.success : theme.text.secondary;
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
      colors={theme.gradient.primary as [string, string]}
      style={[styles.headerGradient, compact && styles.compactHeader]}
    >
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: onPrimaryOverlay }]}>
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
            <View style={[styles.badgeContainer, { backgroundColor: getRoleColor(user.role) }]}>
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

        {showActions && (
          <View style={styles.actions}>
            {onEditPress && (
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: onPrimaryOverlay }]} onPress={onEditPress}>
                <Ionicons name='create' size={20} color={onPrimaryText} />
              </TouchableOpacity>
            )}
            {onViewDetailsPress && (
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: onPrimaryOverlay }]} onPress={onViewDetailsPress}>
                <Ionicons name='eye' size={20} color={onPrimaryText} />
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
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: '600',
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
    marginBottom: 6,
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
  },
  badgeText: {
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
    justifyContent: 'center',
    alignItems: 'center',
  },
});
