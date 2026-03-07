import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import { showAppAlert } from '@/context/AppAlertContext';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from './ThemedText';
import { useAuth } from '@/context/AuthContext';

const { height: screenHeight } = Dimensions.get('window');

interface AuthAvatarProps {
  size?: number;
  showDropdown?: boolean;
}

export const AuthAvatar: React.FC<AuthAvatarProps> = ({
  size = 48,
  showDropdown = true,
}) => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const handleLogout = () => {
    showAppAlert('Logout', 'Are you sure you want to logout?', {
      variant: 'warning',
      buttonText: 'Logout',
      onConfirm: () => logout(),
      secondaryButtonText: 'Cancel',
    });
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

  const onPrimaryText = theme.onPrimary?.text ?? theme.text.inverse;

  // Base menu items for all users
  const baseMenuItems = [
    {
      id: 'profile',
      title: 'Profile',
      subtitle: 'View and edit your profile',
      icon: 'person-outline',
      color: theme.primary,
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
      color: theme.status.pending,
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
      color: theme.status.success,
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
      color: theme.status.warning,
      onPress: () => {
        handleCloseModal();
        router.push('/notifications');
      },
    },
  ];

  const adminMenuItems = [
    {
      id: 'admin-dashboard',
      title: 'Admin Dashboard',
      subtitle: 'Manage flat operations',
      icon: 'shield-outline',
      color: theme.status.error,
      onPress: () => {
        handleCloseModal();
        router.push('/admin');
      },
    },
  ];

  const superAdminMenuItems = [
    {
      id: 'system-management',
      title: 'System Management',
      subtitle: 'Manage system settings and users',
      icon: 'shield-checkmark-outline',
      color: theme.status.error,
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
      color: theme.status.pending,
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
          colors={theme.gradient.primary as [string, string]}
          style={[styles.avatarGradient, { borderRadius: size / 2 }]}
        >
          {user ? (
            <ThemedText style={[styles.avatarText, { fontSize: size * 0.4, color: onPrimaryText }]}>
              {getInitials(user.name)}
            </ThemedText>
          ) : (
            <Ionicons name='person' size={size * 0.5} color={onPrimaryText} />
          )}
        </LinearGradient>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="none"
        onRequestClose={handleCloseModal}
        statusBarTranslucent
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            styles.modalOverlayFullScreen,
            { opacity: fadeAnim, backgroundColor: theme.overlay.medium },
          ]}
          pointerEvents={showModal ? 'auto' : 'none'}
        >
          <Pressable style={styles.backdrop} onPress={handleCloseModal}>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [{ translateY: slideAnim }],
                  backgroundColor: theme.background,
                },
              ]}
            >
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={true}
                bounces={false}
              >
                <Pressable style={[styles.modalContent, { backgroundColor: theme.surface }]} onPress={() => {}}>
                  <View style={[styles.userInfoHeader, { borderBottomColor: theme.border.secondary }]}>
                    <View style={styles.userAvatar}>
                      <LinearGradient
                        colors={theme.gradient.primary as [string, string]}
                        style={styles.userAvatarGradient}
                      >
                        <ThemedText style={[styles.userAvatarText, { color: onPrimaryText }]}>
                          {getInitials(getUserDisplayName())}
                        </ThemedText>
                      </LinearGradient>
                    </View>
                    <View style={styles.userInfo}>
                      <ThemedText style={[styles.userName, { color: theme.text.primary }]}>
                        {getUserDisplayName()}
                      </ThemedText>
                      <ThemedText style={[styles.userRole, { color: theme.text.secondary }]}>
                        {getUserRole()}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Menu Items */}
                  <View style={styles.menuItems}>
                    {menuItems.map((item) => (
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
                            name={item.icon as IconName}
                            size={20}
                            color={onPrimaryText}
                          />
                        </View>
                        <View style={styles.menuContent}>
                          <ThemedText style={[styles.menuTitle, { color: theme.text.primary }]}>
                            {item.title}
                          </ThemedText>
                          <ThemedText style={[styles.menuSubtitle, { color: theme.text.secondary }]}>
                            {item.subtitle}
                          </ThemedText>
                        </View>
                        <Ionicons
                          name='chevron-forward'
                          size={16}
                          color={theme.icon.secondary}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Logout Button */}
                  <TouchableOpacity
                    style={[styles.logoutButton, { borderTopColor: theme.border.secondary }]}
                    onPress={handleLogout}
                  >
                    <View
                      style={[styles.menuIcon, { backgroundColor: theme.status.error }]}
                    >
                      <Ionicons name='log-out-outline' size={20} color={onPrimaryText} />
                    </View>
                    <View style={styles.menuContent}>
                      <ThemedText
                        style={[styles.menuTitle, { color: theme.status.error }]}
                      >
                        Logout
                      </ThemedText>
                      <ThemedText style={[styles.menuSubtitle, { color: theme.text.secondary }]}>
                        Sign out of your account
                      </ThemedText>
                    </View>
                    <Ionicons name='chevron-forward' size={16} color={theme.icon.secondary} />
                  </TouchableOpacity>
                </Pressable>
              </ScrollView>
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
    zIndex: 12,
    elevation: 10,
  },
  avatarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlayFullScreen: {
    elevation: 999,
    zIndex: 9999,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    height: screenHeight * 0.7,
    elevation: 1000,
    zIndex: 10000,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  modalContent: {
    paddingHorizontal: 0,
  },
  userInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
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
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderTopWidth: 1,
    paddingTop: 20,
  },
});
