import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { getVariantConfig } from './getVariantConfig';
import type { AlertProps, AlertVariant } from './types';

/**
 * Single parent alert component. Renders one generic modal; variant param
 * drives icon and color via getVariantConfig. Call with different params —
 * app decides which type to show. No separate InfoAlert / ErrorAlert etc.
 */
export const Alert: React.FC<AlertProps> = ({
  visible,
  title,
  message,
  onClose,
  variant = 'info',
  buttonText = 'OK',
  onConfirm,
  secondaryButtonText,
}) => {
  const { theme } = useTheme();
  const config = getVariantConfig(theme, variant as AlertVariant);

  const handlePrimary = () => {
    onConfirm?.();
    onClose();
  };

  if (!visible) return null;

  const iconBg = config.color + '20';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.overlay, { backgroundColor: theme.overlay.medium }]}
        onPress={onClose}
      >
        <Pressable
          style={[styles.content, { backgroundColor: theme.modal ?? theme.background }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={[styles.header, { borderBottomColor: theme.border?.secondary }]}
          >
            <View style={styles.titleRow}>
              <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
                <Ionicons name={config.icon} size={24} color={config.color} />
              </View>
              <ThemedText style={styles.title}>{title}</ThemedText>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Ionicons name="close" size={24} color={theme.icon?.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <ThemedText style={[styles.message, { color: theme.text?.secondary }]}>
              {message}
            </ThemedText>
          </View>

          <View
            style={[
              styles.footer,
              { borderTopColor: theme.border?.secondary },
              secondaryButtonText && styles.footerRow,
            ]}
          >
            {secondaryButtonText ? (
              <>
                <TouchableOpacity
                  style={[styles.secondaryBtn, { borderColor: theme.border?.secondary }]}
                  onPress={onClose}
                  activeOpacity={0.85}
                >
                  <ThemedText
                    style={[styles.secondaryBtnText, { color: theme.text?.secondary }]}
                  >
                    {secondaryButtonText}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: theme.primary, flex: 1 }]}
                  onPress={handlePrimary}
                  activeOpacity={0.85}
                >
                  <ThemedText
                    style={[
                      styles.primaryBtnText,
                      { color: theme.button?.primary?.text ?? theme.onPrimary?.text },
                    ]}
                  >
                    {buttonText}
                  </ThemedText>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
                onPress={handlePrimary}
                activeOpacity={0.85}
              >
                <ThemedText
                  style={[
                    styles.primaryBtnText,
                    { color: theme.button?.primary?.text ?? theme.onPrimary?.text },
                  ]}
                >
                  {buttonText}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
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
  footerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
