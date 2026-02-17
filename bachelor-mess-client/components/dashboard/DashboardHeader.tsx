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

  const onGradientText = theme.onPrimary?.text ?? theme.button?.primary?.text;
  const onGradientMuted = theme.onPrimary?.text ?? theme.text?.inverse;
  const iconBgOverlay = theme.onPrimary?.overlay ?? theme.overlay?.light;

  return (
    <View style={[styles.wrap, { marginHorizontal: 16, marginBottom: 20 }]}>
      <LinearGradient
        colors={theme.gradient.primary as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.6 }}
        style={[styles.gradient, { shadowColor: theme.shadow?.light ?? theme.cardShadow }]}
      >
        <View style={styles.content}>
          <View style={[styles.iconWrap, { backgroundColor: iconBgOverlay }]}>
            <Ionicons
              name={icon as IconName}
              size={isSmallScreen ? 28 : 32}
              color={onGradientText}
            />
          </View>
          <View style={styles.textWrap}>
            <ThemedText
              style={[styles.title, isSmallScreen && styles.titleSmall, { color: onGradientText }]}
              numberOfLines={1}
            >
              {title}
            </ThemedText>
            <ThemedText
              style={[styles.subtitle, isSmallScreen && styles.subtitleSmall, { color: onGradientMuted, opacity: 0.92 }]}
              numberOfLines={1}
            >
              {userGreeting ? `${subtitle}, ${userGreeting}!` : subtitle}
            </ThemedText>
          </View>
          {showNotificationButton && (
            <TouchableOpacity
              style={[styles.notifBtn, { backgroundColor: iconBgOverlay }]}
              onPress={handleNotificationPress}
            >
              <Ionicons name="notifications-outline" size={isSmallScreen ? 20 : 24} color={onGradientText} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: 4,
  },
  gradient: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  titleSmall: {
    fontSize: 18,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  subtitleSmall: {
    fontSize: 13,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
