import React from 'react';
import { ThemeInput } from '@/components/ui/ThemeInput';
import { ThemeButton } from '@/components/ui/ThemeButton';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { PAYMENT_METHOD_OPTIONS } from '../constants';
import type { PaymentMethod } from '@/services/userStatsService';

export interface RecordPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  amount: string;
  onAmountChange: (value: string) => void;
  method: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  visible,
  onClose,
  amount,
  onAmountChange,
  method,
  onMethodChange,
  notes,
  onNotesChange,
  onSubmit,
  loading,
}) => {
  return (
    <ModalSheet
      visible={visible}
      title="Record payment (direct)"
      onClose={onClose}
      canClose={!loading}
    >
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
        style={{ minHeight: 60, textAlignVertical: 'top' }}
      />
      <ThemeButton
        title="Record"
        onPress={onSubmit}
        loading={loading}
        disabled={loading || !amount?.trim() || Number(amount?.replace(/,/g, '')) <= 0}
      />
    </ModalSheet>
  );
};
