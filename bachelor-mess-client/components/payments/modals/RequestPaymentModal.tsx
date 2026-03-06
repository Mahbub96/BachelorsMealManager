import React from 'react';
import { ThemeInput } from '@/components/ui/ThemeInput';
import { ThemeButton } from '@/components/ui/ThemeButton';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { PAYMENT_METHOD_OPTIONS } from '../constants';
import type { PaymentMethod } from '@/services/userStatsService';

export type RequestMode = 'full_due' | 'custom';

export interface RequestPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  mode: RequestMode;
  onModeChange: (mode: RequestMode) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  method: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  dueAmount: number;
  onSubmit: () => void;
  loading: boolean;
}

export const RequestPaymentModal: React.FC<RequestPaymentModalProps> = ({
  visible,
  onClose,
  mode,
  onModeChange,
  amount,
  onAmountChange,
  method,
  onMethodChange,
  notes,
  onNotesChange,
  dueAmount,
  onSubmit,
  loading,
}) => {
  const modeOptions: { value: RequestMode; label: string }[] = [
    { value: 'full_due', label: `Full due (৳${dueAmount.toLocaleString()})` },
    { value: 'custom', label: 'Custom amount' },
  ];
  return (
    <ModalSheet
      visible={visible}
      title="Request to pay"
      onClose={onClose}
      canClose={!loading}
    >
      <ChipGroup
        options={modeOptions}
        value={mode}
        onSelect={(v) => onModeChange(v)}
      />
      {mode === 'custom' && (
        <ThemeInput
          placeholder="Amount (৳)"
          value={amount}
          onChangeText={onAmountChange}
          keyboardType="decimal-pad"
        />
      )}
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
        title="Submit request"
        onPress={onSubmit}
        loading={loading}
        disabled={loading || (mode === 'full_due' && dueAmount <= 0)}
      />
    </ModalSheet>
  );
};
