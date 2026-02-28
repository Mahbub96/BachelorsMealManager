import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../ThemedText';

interface ActionCardProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: readonly [string, string];
  onPress: () => void;
  disabled?: boolean;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  subtitle,
  icon,
  gradient,
  onPress,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const onPrimaryText = theme.onPrimary?.text ?? theme.text.inverse;
  const onPrimaryOverlay = theme.onPrimary?.overlay;
  return (
    <TouchableOpacity
      style={[styles.actionCard, disabled && styles.actionCardDisabled, { shadowColor: theme.shadow.light }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <LinearGradient colors={gradient} style={styles.actionGradient}>
        <Ionicons name={icon} size={24} color={onPrimaryText} />
        <ThemedText style={[styles.actionTitle, { color: onPrimaryText }]}>{title}</ThemedText>
        <ThemedText style={[styles.actionSubtitle, { color: onPrimaryOverlay ?? onPrimaryText }]}>{subtitle}</ThemedText>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  actionCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionCardDisabled: {
    opacity: 0.6,
  },
  actionGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 11,
    textAlign: 'center',
  },
});
