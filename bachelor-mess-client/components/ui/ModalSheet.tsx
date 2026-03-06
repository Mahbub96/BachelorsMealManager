import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { DESIGN_SYSTEM } from '@/components/dashboard/DesignSystem';

/** Reusable: bottom-sheet modal with title and close. Use for any form or confirm modal. */
export interface ModalSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  canClose?: boolean;
}

export const ModalSheet: React.FC<ModalSheetProps> = ({
  visible,
  title,
  onClose,
  children,
  canClose = true,
}) => {
  const { theme } = useTheme();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable
          style={[styles.backdrop, { backgroundColor: theme.overlay?.medium ?? 'rgba(0,0,0,0.4)' }]}
          onPress={canClose ? onClose : undefined}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.modal ?? theme.background,
              borderColor: theme.border?.secondary,
            },
          ]}
        >
          <View style={styles.header}>
            <ThemedText style={[styles.title, { color: theme.text.primary }]}>
              {title}
            </ThemedText>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              disabled={!canClose}
            >
              <Ionicons name="close" size={24} color={theme.text.secondary} />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: DESIGN_SYSTEM.spacing.xxl,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.xl,
  },
  title: { fontSize: 20, fontWeight: '700' },
});
