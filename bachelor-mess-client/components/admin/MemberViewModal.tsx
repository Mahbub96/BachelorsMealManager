import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';
import { User } from '../../services/userService';

interface MemberViewModalProps {
  visible: boolean;
  member: User | null;
  onClose: () => void;
  onEdit?: () => void;
  onResetPassword?: (memberId: string) => void;
}

export const MemberViewModal: React.FC<MemberViewModalProps> = ({
  visible,
  member,
  onClose,
  onEdit,
  onResetPassword,
}) => {
  const { theme } = useTheme();

  if (!member) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.modal }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border.secondary }]}>
            <ThemedText style={styles.modalTitle}>Member Details</ThemedText>
            <View style={styles.headerActions}>
              {onEdit && (
                <TouchableOpacity
                  onPress={onEdit}
                  style={[styles.editButton, { backgroundColor: theme.primary + '20' }]}
                >
                  <Ionicons name='pencil' size={20} color={theme.primary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
              >
                <Ionicons name='close' size={24} color={theme.icon.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name='person' size={48} color={theme.primary} />
              </View>
            </View>

            <View style={styles.detailSection}>
              <View style={styles.detailRow}>
                <View style={styles.detailLabelContainer}>
                  <Ionicons name='person-outline' size={20} color={theme.icon.secondary} />
                  <ThemedText style={styles.detailLabel}>Name</ThemedText>
                </View>
                <ThemedText style={styles.detailValue}>{member.name}</ThemedText>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailLabelContainer}>
                  <Ionicons name='mail-outline' size={20} color={theme.icon.secondary} />
                  <ThemedText style={styles.detailLabel}>Email</ThemedText>
                </View>
                <ThemedText style={styles.detailValue}>{member.email}</ThemedText>
              </View>

              {member.phone && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelContainer}>
                    <Ionicons name='call-outline' size={20} color={theme.icon.secondary} />
                    <ThemedText style={styles.detailLabel}>Phone</ThemedText>
                  </View>
                  <ThemedText style={styles.detailValue}>{member.phone}</ThemedText>
                </View>
              )}

              <View style={styles.detailRow}>
                <View style={styles.detailLabelContainer}>
                  <Ionicons name='shield-outline' size={20} color={theme.icon.secondary} />
                  <ThemedText style={styles.detailLabel}>Role</ThemedText>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: theme.primary + '20' }]}>
                  <ThemedText style={[styles.roleText, { color: theme.primary }]}>
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailLabelContainer}>
                  <Ionicons 
                    name={member.status === 'active' ? 'checkmark-circle-outline' : 'close-circle-outline'} 
                    size={20} 
                    color={theme.icon.secondary} 
                  />
                  <ThemedText style={styles.detailLabel}>Status</ThemedText>
                </View>
                <View style={[
                  styles.statusBadge,
                  member.status === 'active'
                    ? { backgroundColor: theme.status.success + '20' }
                    : { backgroundColor: theme.status.error + '20' }
                ]}>
                  <View style={[
                    styles.statusDot,
                    member.status === 'active'
                      ? { backgroundColor: theme.status.success }
                      : { backgroundColor: theme.status.error }
                  ]} />
                  <ThemedText style={[
                    styles.statusText,
                    member.status === 'active'
                      ? { color: theme.status.success }
                      : { color: theme.status.error }
                  ]}>
                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                  </ThemedText>
                </View>
              </View>

              {member.createdAt && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelContainer}>
                    <Ionicons name='calendar-outline' size={20} color={theme.icon.secondary} />
                    <ThemedText style={styles.detailLabel}>Created</ThemedText>
                  </View>
                  <ThemedText style={[styles.detailValue, { color: theme.text.secondary }]}>
                    {new Date(member.createdAt).toLocaleDateString()}
                  </ThemedText>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: theme.border.secondary }]}>
            <View style={styles.footerButtons}>
              {onResetPassword && member && member.status === 'active' && (
                <TouchableOpacity
                  style={[styles.resetPasswordButton, { backgroundColor: theme.status.warning + '20', borderColor: theme.status.warning }]}
                  onPress={() => {
                    if (member && onResetPassword) {
                      onResetPassword(member.id);
                    }
                  }}
                >
                  <Ionicons name='key-outline' size={18} color={theme.status.warning} />
                  <ThemedText style={[styles.resetPasswordButtonText, { color: theme.status.warning }]}>
                    Reset Password
                  </ThemedText>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={onClose}
              >
                <ThemedText style={styles.closeButtonText}>Close</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailSection: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  resetPasswordButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  resetPasswordButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
