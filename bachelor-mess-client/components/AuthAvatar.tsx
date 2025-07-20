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
    switch (user.role) {
      case 'super_admin':
        return 'Super Administrator';
      case 'admin':
        return 'Administrator';
      case 'member':
        return 'Member';
      default:
        return 'User';
    }
  };

  // Base menu items for all users
  const baseMenuItems = [
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

  // Admin-specific menu items
  const adminMenuItems = [
    {
      id: 'admin-dashboard',
      title: 'Admin Dashboard',
      subtitle: 'Manage mess operations',
      icon: 'shield-outline',
      color: '#ef4444',
      onPress: () => {
        handleCloseModal();
        router.push('/admin');
      },
    },
  ];

  // Super admin-specific menu items
  const superAdminMenuItems = [
    {
      id: 'system-management',
      title: 'System Management',
      subtitle: 'Manage system settings and users',
      icon: 'shield-checkmark-outline',
      color: '#dc2626',
      onPress: () => {
        handleCloseModal();
        router.push('/admin');
      },
    },
    {
      id: 'user-management',
      title: 'User Management',
      subtitle: 'Manage all users and roles',
      icon: 'people-outline',
      color: '#7c3aed',
      onPress: () => {
        handleCloseModal();
        router.push('/admin');
      },
    },
  ];

  // Build menu items based on user role
  const getMenuItems = () => {
    let items = [...baseMenuItems];

    if (user?.role === 'admin') {
      items = [...items, ...adminMenuItems];
    } else if (user?.role === 'super_admin') {
      items = [...items, ...adminMenuItems, ...superAdminMenuItems];
    }

    return items;
  };

  const menuItems = getMenuItems();

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
                {/* User Info Header */}
                <View style={styles.userInfoHeader}>
                  <View style={styles.userAvatar}>
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      style={styles.userAvatarGradient}
                    >
                      <ThemedText style={styles.userAvatarText}>
                        {getInitials(getUserDisplayName())}
                      </ThemedText>
                    </LinearGradient>
                  </View>
                  <View style={styles.userInfo}>
                    <ThemedText style={styles.userName}>
                      {getUserDisplayName()}
                    </ThemedText>
                    <ThemedText style={styles.userRole}>
                      {getUserRole()}
                    </ThemedText>
                  </View>
                </View>

                {/* Menu Items */}
                <View style={styles.menuItems}>
                  {menuItems.map((item, index) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.menuItem}
                      onPress={item.onPress}
                    >
                      <View
                        style={[
                          styles.menuIcon,
                          { backgroundColor: item.color },
                        ]}
                      >
                        <Ionicons
                          name={item.icon as any}
                          size={20}
                          color='#fff'
                        />
                      </View>
                      <View style={styles.menuContent}>
                        <ThemedText style={styles.menuTitle}>
                          {item.title}
                        </ThemedText>
                        <ThemedText style={styles.menuSubtitle}>
                          {item.subtitle}
                        </ThemedText>
                      </View>
                      <Ionicons
                        name='chevron-forward'
                        size={16}
                        color='#9ca3af'
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={handleLogout}
                >
                  <View
                    style={[styles.menuIcon, { backgroundColor: '#ef4444' }]}
                  >
                    <Ionicons name='log-out-outline' size={20} color='#fff' />
                  </View>
                  <View style={styles.menuContent}>
                    <ThemedText
                      style={[styles.menuTitle, { color: '#ef4444' }]}
                    >
                      Logout
                    </ThemedText>
                    <ThemedText style={styles.menuSubtitle}>
                      Sign out of your account
                    </ThemedText>
                  </View>
                  <Ionicons name='chevron-forward' size={16} color='#9ca3af' />
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: screenHeight * 0.7,
  },
  modalContent: {
    paddingHorizontal: 20,
  },
  userInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 20,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    overflow: 'hidden',
  },
  userAvatarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: '#6b7280',
  },
  menuItems: {
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 20,
  },
});
