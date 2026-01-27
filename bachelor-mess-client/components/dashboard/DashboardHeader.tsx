import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../ThemedText';

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  icon: string;
  showNotificationButton?: boolean;
  onNotificationPress?: () => void;
  userGreeting?: string;
  isSmallScreen?: boolean;
  user?: { name: string; role: string };
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  icon,
  showNotificationButton = false,
  onNotificationPress,
  userGreeting,
  isSmallScreen = false,
  user,
}) => {
  const router = useRouter();
  const { theme } = useTheme();

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push('/notifications');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.gradient.primary}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.overlay.light },
              ]}
            >
              <Ionicons
                name={icon as IconName}
                size={isSmallScreen ? 32 : 40}
                color={theme.text.inverse}
              />
            </View>
            <View style={styles.textContainer}>
              <ThemedText
                style={[
                  styles.title,
                  isSmallScreen && styles.titleSmall,
                  { color: theme.text.inverse },
                ]}
              >
                {title}
              </ThemedText>
              <ThemedText
                style={[
                  styles.subtitle,
                  isSmallScreen && styles.subtitleSmall,
                  { color: theme.text.inverse },
                ]}
              >
                {userGreeting ? `${subtitle}, ${userGreeting}!` : subtitle}
              </ThemedText>
            </View>
          </View>

          {showNotificationButton && (
            <TouchableOpacity
              style={[
                styles.notificationButton,
                isSmallScreen && styles.notificationButtonSmall,
                { backgroundColor: theme.overlay.light },
              ]}
              onPress={handleNotificationPress}
            >
              <Ionicons
                name='notifications'
                size={isSmallScreen ? 20 : 24}
                color={theme.text.inverse}
              />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerGradient: {
    padding: 20,
    borderRadius: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  titleSmall: {
    fontSize: 18,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  subtitleSmall: {
    fontSize: 12,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationButtonSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});
