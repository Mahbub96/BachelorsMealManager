import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedText } from '../ThemedText';
import { IconListRow } from './IconListRow';
import { ListCard } from './ListCard';
import { StatusRow } from './StatusRow';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

export interface TransactionItem {
  id: string;
  title: string;
  subtitle: string;
  amountText?: string;
  amountColor?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBackgroundColor?: string;
  onPress?: () => void;
}

export interface TransactionListProps {
  items: TransactionItem[];
  loading?: boolean;
  emptyHint?: string;
}

export function TransactionList({
  items,
  loading = false,
  emptyHint = 'No transactions found.',
}: TransactionListProps) {
  const { theme } = useTheme();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <ThemedText style={{ color: theme.text?.secondary, textAlign: 'center' }}>
          {emptyHint}
        </ThemedText>
      </View>
    );
  }

  return (
    <ListCard>
      {items.map((item) => (
        <StatusRow
          key={item.id}
          icon={<Ionicons name={item.icon || 'receipt-outline'} size={20} color={item.iconColor || theme.primary} />}
          iconBackgroundColor={item.iconBackgroundColor || (item.iconColor || theme.primary) + '20'}
          title={item.title}
          subtitle={item.subtitle}
          statusLabel={item.amountText || ''}
          statusColor={item.amountColor || theme.text?.primary}
          onPress={item.onPress}
        />
      ))}
    </ListCard>
  );
}

const styles = StyleSheet.create({
  center: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
