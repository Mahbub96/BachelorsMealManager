import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Animated,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { useAuth } from '@/context/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AuthAvatarProps {
  size?: number;
  showDropdown?: boolean;
}

export const AuthAvatar: React.FC<AuthAvatarProps> = ({
  size = 48,
  showDropdown = true,
}) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const handleAvatarPress = () => {
    if (showDropdown) {
      setShowModal(true);
      // Animate modal in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleCloseModal = () => {
    // Animate modal out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowModal(false);
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    return user.name || user.email?.split('@')[0] || 'User';
  };

  const getUserRole = () => {
    if (!user) return 'Guest';
    return user.role === 'admin' ? 'Administrator' : 'Member';
  };

  const menuItems = [
    {
      id: 'profile',
      title: 'Profile',
      subtitle: 'View and edit your profile',
      icon: 'person-outline',
      color: '#667eea',
      onPress: () => {
        handleCloseModal();
        router.push('/profile');
      },
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'App preferences and configuration',
      icon: 'settings-outline',
      color: '#8b5cf6',
      onPress: () => {
        handleCloseModal();
        router.push('/settings');
      },
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: 'help-circle-outline',
      color: '#10b981',
      onPress: () => {
        handleCloseModal();
        router.push('/help');
      },
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Manage your notifications',
      icon: 'notifications-outline',
      color: '#f59e0b',
      onPress: () => {
        handleCloseModal();
        router.push('/notifications');
      },
    },
  ];

  return (
    <>
      <TouchableOpacity
        style={[styles.avatar, { width: size, height: size }]}
        onPress={handleAvatarPress}
        disabled={!showDropdown}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={[styles.avatarGradient, { borderRadius: size / 2 }]}
        >
          {user ? (
            <ThemedText style={[styles.avatarText, { fontSize: size * 0.4 }]}>
              {getInitials(user.name)}
            </ThemedText>
          ) : (
            <Ionicons name='person' size={size * 0.5} color='#fff' />
          )}
        </LinearGradient>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType='none'
        onRequestClose={handleCloseModal}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Pressable style={styles.backdrop} onPress={handleCloseModal}>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Pressable style={styles.modalContent} onPress={() => {}}>
                {/* Header with user info */}
                <View style={styles.header}>
                  <View style={styles.userInfo}>
                    <View style={styles.userAvatar}>
                      <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        style={styles.userAvatarGradient}
                      >
                        {user ? (
                          <ThemedText style={styles.userAvatarText}>
                            {getInitials(user.name)}
                          </ThemedText>
                        ) : (
                          <Ionicons name='person' size={24} color='#fff' />
                        )}
                      </LinearGradient>
                    </View>
                    <View style={styles.userDetails}>
                      <ThemedText style={styles.userName}>
                        {getUserDisplayName()}
                      </ThemedText>
                      <ThemedText style={styles.userEmail}>
                        {user?.email || 'guest@mess.com'}
                      </ThemedText>
                      <View style={styles.roleContainer}>
                        <Ionicons
                          name={
                            user?.role === 'admin'
                              ? 'shield-checkmark'
                              : 'person'
                          }
                          size={12}
                          color='#667eea'
                        />
                        <ThemedText style={styles.userRole}>
                          {getUserRole()}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleCloseModal}
                  >
                    <Ionicons name='close' size={20} color='#9ca3af' />
                  </TouchableOpacity>
                </View>

                {/* Menu items */}
                <View style={styles.menuItems}>
                  {menuItems.map((item, index) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.menuItem}
                      onPress={item.onPress}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.menuIcon,
                          { backgroundColor: item.color + '15' },
                        ]}
                      >
                        <Ionicons
                          name={item.icon as any}
                          size={20}
                          color={item.color}
                        />
                      </View>
                      <View style={styles.menuText}>
                        <ThemedText style={styles.menuItemTitle}>
                          {item.title}
                        </ThemedText>
                        <ThemedText style={styles.menuItemSubtitle}>
                          {item.subtitle}
                        </ThemedText>
                      </View>
                      <Ionicons
                        name='chevron-forward'
                        size={16}
                        color='#d1d5db'
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Logout button */}
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={() => {
                    handleCloseModal();
                    handleLogout();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.logoutIcon}>
                    <Ionicons
                      name='log-out-outline'
                      size={20}
                      color='#ef4444'
                    />
                  </View>
                  <View style={styles.logoutText}>
                    <ThemedText style={styles.logoutTitle}>Logout</ThemedText>
                    <ThemedText style={styles.logoutSubtitle}>
                      Sign out of your account
                    </ThemedText>
                  </View>
                  <Ionicons name='chevron-forward' size={16} color='#fca5a5' />
                </TouchableOpacity>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: 16,
  },
  backdrop: {
    flex: 1,
  },
  modalContainer: {
    maxWidth: 320,
    minWidth: 280,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginRight: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  userAvatarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  userRole: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
    marginLeft: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  menuItems: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 20,
    marginVertical: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutText: {
    flex: 1,
  },
  logoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 2,
  },
  logoutSubtitle: {
    fontSize: 13,
    color: '#ef4444',
  },
});
