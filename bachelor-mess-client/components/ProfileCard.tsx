import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Ionicons } from '@expo/vector-icons';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'member';
  status: 'active' | 'inactive';
  joinDate: string;
  createdAt: string;
}

interface ProfileCardProps {
  user: User;
  showActions?: boolean;
  onEditPress?: () => void;
  onViewDetailsPress?: () => void;
  compact?: boolean;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  user,
  showActions = false,
  onEditPress,
  onViewDetailsPress,
  compact = false,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? '#ef4444' : '#667eea';
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? '#10b981' : '#6b7280';
  };

  return (
    <ThemedView style={[styles.container, compact && styles.compactContainer]}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name='person' size={compact ? 32 : 48} color='#667eea' />
        </View>
        <View style={styles.userInfo}>
          <ThemedText style={[styles.name, compact && styles.compactName]}>
            {user.name}
          </ThemedText>
          <ThemedText style={[styles.email, compact && styles.compactEmail]}>
            {user.email}
          </ThemedText>
          <View style={styles.badges}>
            <View
              style={[
                styles.badge,
                { backgroundColor: getRoleColor(user.role) },
              ]}
            >
              <ThemedText style={styles.badgeText}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </ThemedText>
            </View>
            <View
              style={[
                styles.badge,
                { backgroundColor: getStatusColor(user.status) },
              ]}
            >
              <ThemedText style={styles.badgeText}>
                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      {!compact && (
        <View style={styles.details}>
          {user.phone && (
            <View style={styles.detailItem}>
              <Ionicons name='call' size={16} color='#667eea' />
              <ThemedText style={styles.detailText}>{user.phone}</ThemedText>
            </View>
          )}
          <View style={styles.detailItem}>
            <Ionicons name='calendar' size={16} color='#667eea' />
            <ThemedText style={styles.detailText}>
              Joined {formatDate(user.joinDate)}
            </ThemedText>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name='time' size={16} color='#667eea' />
            <ThemedText style={styles.detailText}>
              Member since {formatDate(user.createdAt)}
            </ThemedText>
          </View>
        </View>
      )}

      {showActions && (
        <View style={styles.actions}>
          {onEditPress && (
            <TouchableOpacity style={styles.actionButton} onPress={onEditPress}>
              <Ionicons name='create' size={20} color='#667eea' />
              <ThemedText style={styles.actionText}>Edit</ThemedText>
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
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  compactContainer: {
    padding: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  compactName: {
    fontSize: 16,
  },
  email: {
    fontSize: 14,
    color: '#6b7280',
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
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 4,
  },
});
