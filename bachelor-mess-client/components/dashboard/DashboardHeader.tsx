import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../ThemedText';
import { useRouter } from 'expo-router';

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  icon: string;
  colors: [string, string];
  showNotificationButton?: boolean;
  onNotificationPress?: () => void;
  userGreeting?: string;
  isSmallScreen?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  icon,
  colors,
  showNotificationButton = false,
  onNotificationPress,
  userGreeting,
  isSmallScreen = false,
}) => {
  const router = useRouter();

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push('/notifications');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors} style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={icon as any}
                size={isSmallScreen ? 32 : 40}
                color='#fff'
              />
            </View>
            <View style={styles.textContainer}>
              <ThemedText
                style={[styles.title, isSmallScreen && styles.titleSmall]}
              >
                {title}
              </ThemedText>
              <ThemedText
                style={[styles.subtitle, isSmallScreen && styles.subtitleSmall]}
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
              ]}
              onPress={handleNotificationPress}
            >
              <Ionicons
                name='notifications'
                size={isSmallScreen ? 20 : 24}
                color='#fff'
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
