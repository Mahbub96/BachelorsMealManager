import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemeInput } from '@/components/ui/ThemeInput';
import { ThemeButton } from '@/components/ui/ThemeButton';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { PAYMENT_METHOD_OPTIONS } from '../constants';
import type { PaymentMethod } from '@/services/userStatsService';

export interface SendRefundMember {
  userId: string;
  name: string;
  receive: number;
}

export interface SendRefundModalProps {
  visible: boolean;
  onClose: () => void;
  members: SendRefundMember[];
  selectedUserId: string | null;
  onSelectMember: (userId: string | null) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  method: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export const SendRefundModal: React.FC<SendRefundModalProps> = ({
  visible,
  onClose,
  members,
  selectedUserId,
  onSelectMember,
  amount,
  onAmountChange,
  method,
  onMethodChange,
  notes,
  onNotesChange,
  onSubmit,
  loading,
}) => {
  const maxAmount = members.find((m) => String(m.userId) === selectedUserId)?.receive ?? 0;
  const memberOptions = members.map((m) => ({
    value: String(m.userId),
    label: `${m.name} · ৳${(m.receive ?? 0).toLocaleString()}`,
  }));

  return (
    <ModalSheet visible={visible} title="Send refund" onClose={onClose} canClose={!loading}>
      {memberOptions.length === 0 ? (
        <ThemedText style={styles.hint}>No members with receivable amount this month.</ThemedText>
      ) : (
        <>
          <ThemedText style={styles.label}>Member to refund</ThemedText>
          <ChipGroup
            options={memberOptions}
            value={selectedUserId ?? ''}
            onSelect={(v) => onSelectMember(v || null)}
          />
          {selectedUserId != null && (
            <>
              <ThemedText style={styles.label}>Amount (max ৳{maxAmount.toLocaleString()})</ThemedText>
              <ThemeInput
                placeholder="Amount (৳)"
                value={amount}
                onChangeText={onAmountChange}
                keyboardType="decimal-pad"
              />
              <ChipGroup
                options={PAYMENT_METHOD_OPTIONS}
                value={method}
                onSelect={(v) => onMethodChange(v)}
              />
              <ThemeInput
                placeholder="Notes (optional)"
                value={notes}
                onChangeText={onNotesChange}
                multiline
                style={{ minHeight: 56, textAlignVertical: 'top' }}
              />
              <ThemeButton
                title="Send refund"
                onPress={onSubmit}
                loading={loading}
                disabled={!amount || Number(amount?.replace(/,/g, '')) <= 0 || Number(amount?.replace(/,/g, '')) > maxAmount}
              />
            </>
          )}
        </>
      )}
    </ModalSheet>
  );
};

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  hint: { fontSize: 14, marginVertical: 8 },
});
