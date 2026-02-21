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
  onRequestRemoval?: (memberId: string) => void;
  requestRemovalLoading?: boolean;
}

export const MemberViewModal: React.FC<MemberViewModalProps> = ({
  visible,
  member,
  onClose,
  onEdit,
  onResetPassword,
  onRequestRemoval,
  requestRemovalLoading = false,
}) => {
  const { theme } = useTheme();

  if (!member) return null;

  const showRequestRemoval =
    onRequestRemoval && member.role === 'member' && member.status === 'active';
  const showResetPassword = onResetPassword && member.status === 'active';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.modal ?? theme.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border?.secondary ?? '#e5e7eb' }]}>
            <ThemedText style={styles.headerTitle}>Member Details</ThemedText>
            <View style={styles.headerActions}>
              {onEdit && (
                <TouchableOpacity
                  onPress={onEdit}
                  style={[styles.iconButton, { backgroundColor: theme.primary + '20' }]}
                >
                  <Ionicons name="pencil" size={20} color={theme.primary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onClose}
                style={styles.iconButton}
              >
                <Ionicons name="close" size={24} color={theme.icon?.secondary ?? theme.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile hero */}
            <View style={[styles.hero, { backgroundColor: theme.primary + '08' }]}>
              <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
                <ThemedText style={[styles.avatarText, { color: theme.primary }]}>
                  {member.name.trim().charAt(0).toUpperCase() || '?'}
                </ThemedText>
              </View>
              <ThemedText style={styles.memberName} numberOfLines={2}>
                {member.name}
              </ThemedText>
              <View style={styles.badgesRow}>
                <View style={[styles.badge, { backgroundColor: theme.primary + '20' }]}>
                  <ThemedText style={[styles.badgeText, { color: theme.primary }]}>
                    {member.role === 'super_admin'
                      ? 'Super Admin'
                      : member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.badge,
                    member.status === 'active'
                      ? { backgroundColor: theme.status.success + '20' }
                      : { backgroundColor: theme.status.error + '20' },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      member.status === 'active'
                        ? { backgroundColor: theme.status.success }
                        : { backgroundColor: theme.status.error },
                    ]}
                  />
                  <ThemedText
                    style={[
                      styles.badgeText,
                      member.status === 'active'
                        ? { color: theme.status.success }
                        : { color: theme.status.error },
                    ]}
                  >
                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Contact */}
            <View style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text.secondary }]}>
                Contact
              </ThemedText>
              <View style={[styles.card, { backgroundColor: theme.cardBackground ?? theme.surface, borderColor: theme.border.secondary }]}>
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={18} color={theme.icon?.secondary ?? theme.text.secondary} />
                  <ThemedText style={styles.infoLabel}>Email</ThemedText>
                  <ThemedText style={styles.infoValue} numberOfLines={1}>{member.email}</ThemedText>
                </View>
                {member.phone ? (
                  <View style={[styles.infoRow, styles.infoRowBorder, { borderTopColor: theme.border.secondary }]}>
                    <Ionicons name="call-outline" size={18} color={theme.icon?.secondary ?? theme.text.secondary} />
                    <ThemedText style={styles.infoLabel}>Phone</ThemedText>
                    <ThemedText style={styles.infoValue}>{member.phone}</ThemedText>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Account */}
            <View style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text.secondary }]}>
                Account
              </ThemedText>
              <View style={[styles.card, { backgroundColor: theme.cardBackground ?? theme.surface, borderColor: theme.border.secondary }]}>
                {(member.joinDate || member.createdAt) && (
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={18} color={theme.icon?.secondary ?? theme.text.secondary} />
                    <ThemedText style={styles.infoLabel}>Joined</ThemedText>
                    <ThemedText style={[styles.infoValue, { color: theme.text.secondary }]}>
                      {new Date(member.joinDate || member.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </ThemedText>
                  </View>
                )}
                {member.lastLogin && (
                  <View style={[styles.infoRow, (member.joinDate || member.createdAt) && styles.infoRowBorder, { borderTopColor: theme.border.secondary }]}>
                    <Ionicons name="log-in-outline" size={18} color={theme.icon?.secondary ?? theme.text.secondary} />
                    <ThemedText style={styles.infoLabel}>Last login</ThemedText>
                    <ThemedText style={[styles.infoValue, { color: theme.text.secondary }]}>
                      {new Date(member.lastLogin).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>

            {/* Actions */}
            {(showRequestRemoval || showResetPassword) && (
              <View style={styles.section}>
                <ThemedText style={[styles.sectionTitle, { color: theme.text.secondary }]}>
                  Actions
                </ThemedText>
                <View style={styles.actionsColumn}>
                  {showResetPassword && (
                    <TouchableOpacity
                      style={[styles.actionButton, { borderColor: theme.status.warning }]}
                      onPress={() => onResetPassword?.(member.id)}
                    >
                      <Ionicons name="key-outline" size={20} color={theme.status.warning} />
                      <ThemedText style={[styles.actionButtonText, { color: theme.status.warning }]}>
                        Reset Password
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                  {showRequestRemoval && (
                    <TouchableOpacity
                      style={[styles.actionButton, { borderColor: theme.status.error }]}
                      onPress={() => onRequestRemoval?.(member.id)}
                      disabled={requestRemovalLoading}
                    >
                      <Ionicons name="person-remove-outline" size={20} color={theme.status.error} />
                      <ThemedText style={[styles.actionButtonText, { color: theme.status.error }]}>
                        {requestRemovalLoading ? 'Sending...' : 'Request removal'}
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer: primary close */}
          <View style={[styles.footer, { borderTopColor: theme.border.secondary }]}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
              onPress={onClose}
            >
              <ThemedText style={styles.primaryButtonText}>Close</ThemedText>
            </TouchableOpacity>
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
    height: '85%',
    maxHeight: '85%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 24,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
  },
  memberName: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  infoRowBorder: {
    borderTopWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 56,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  actionsColumn: {
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
