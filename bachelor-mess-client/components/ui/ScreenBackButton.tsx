import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ScreenBackButtonProps {
  onPress: () => void;
  label?: string;
  style?: ViewStyle;
}

const BACK_LABEL = 'Back';

export const ScreenBackButton: React.FC<ScreenBackButtonProps> = ({
  onPress,
  label = BACK_LABEL,
  style,
}) => {
  const iconColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor(
    { light: '#e5e7eb', dark: '#374151' },
    'background'
  );

  return (
    <TouchableOpacity
      style={[styles.row, { borderColor }, style]}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Ionicons name="chevron-back" size={24} color={iconColor} />
      <ThemedText style={[styles.text, { color: textColor }]}>{label}</ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
