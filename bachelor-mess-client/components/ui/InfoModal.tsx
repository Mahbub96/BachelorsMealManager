import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';

export type InfoModalVariant = 'info' | 'success' | 'error' | 'warning';

export interface InfoModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  variant?: InfoModalVariant;
  buttonText?: string;
}

const variantConfig = (
  theme: ReturnType<typeof useTheme>['theme']
): Record<InfoModalVariant, { icon: 'checkmark-circle' | 'close-circle' | 'warning' | 'information-circle'; color: string }> => ({
  success: {
    icon: 'checkmark-circle',
    color: theme.status?.success ?? theme.gradient?.success?.[0] ?? '#10b981',
  },
  error: {
    icon: 'close-circle',
    color: theme.status?.error ?? theme.gradient?.error?.[0] ?? '#ef4444',
  },
  warning: {
    icon: 'warning',
    color: theme.status?.warning ?? theme.gradient?.warning?.[0] ?? '#f59e0b',
  },
  info: {
    icon: 'information-circle',
    color: theme.status?.info ?? theme.primary ?? '#667eea',
  },
});

export const InfoModal: React.FC<InfoModalProps> = ({
  visible,
  title,
  message,
  onClose,
  variant = 'info',
  buttonText = 'OK',
}) => {
  const { theme } = useTheme();
  const config = variantConfig(theme)[variant];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.content, { backgroundColor: theme.modal ?? theme.background ?? '#fff' }]}
          onPress={e => e.stopPropagation()}
        >
          <View
            style={[
              styles.header,
              { borderBottomColor: theme.border?.secondary ?? 'rgba(0,0,0,0.08)' },
            ]}
          >
            <View style={styles.titleRow}>
              <View style={[styles.iconWrap, { backgroundColor: config.color + '20' }]}>
                <Ionicons name={config.icon} size={24} color={config.color} />
              </View>
              <ThemedText style={styles.title}>{title}</ThemedText>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Ionicons
                name="close"
                size={24}
                color={theme.icon?.secondary ?? '#6b7280'}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <ThemedText
              style={[styles.message, { color: theme.text?.secondary ?? '#6b7280' }]}
            >
              {message}
            </ThemedText>
          </View>

          <View
            style={[
              styles.footer,
              { borderTopColor: theme.border?.secondary ?? 'rgba(0,0,0,0.08)' },
            ]}
          >
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <ThemedText style={styles.primaryButtonText}>{buttonText}</ThemedText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 20,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    padding: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  primaryButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
