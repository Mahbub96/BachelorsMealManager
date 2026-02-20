import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';

interface MealModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const MealModal: React.FC<MealModalProps> = ({
  visible,
  title,
  onClose,
  children,
}) => {
  const { theme } = useTheme();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.modal ?? theme.background ?? '#fff' }]}>
        <View style={[styles.modalHeader, { borderBottomColor: theme.border?.secondary ?? '#e5e7eb' }]}>
          <ThemedText style={[styles.modalTitle, { color: theme.text?.primary ?? '#1f2937' }]}>{title}</ThemedText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.icon?.secondary ?? '#6b7280'} />
          </TouchableOpacity>
        </View>
        {children}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
});
