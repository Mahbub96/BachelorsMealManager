import React from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { ThemedText } from '../../ThemedText';
import { BazarItem } from '../../../services/bazarService';
import { useTheme } from '../../../context/ThemeContext';

interface BazarItemRowProps {
  item: BazarItem;
  index: number;
  onUpdate: (
    index: number,
    field: keyof BazarItem,
    value: string | number
  ) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
  errors?: Record<string, string>;
}

export const BazarItemRow: React.FC<BazarItemRowProps> = ({
  item,
  index,
  onUpdate,
  onRemove,
  canRemove,
  errors,
}) => {
  const { theme } = useTheme();

  const getItemIcon = (index: number) => {
    const icons = ['fast-food', 'restaurant', 'cafe', 'pizza', 'wine'];
    return icons[index % icons.length];
  };

  const itemColors = [
    theme.status.warning,
    theme.status.success,
    theme.primary,
    theme.secondary,
    theme.status.error,
  ];
  const itemColor = itemColors[index % itemColors.length];

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
      <View style={[styles.header, { alignItems: 'center' }]}>
        <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
          <Ionicons
            name={getItemIcon(index) as IconName}
            size={20}
            color={itemColor}
          />
        </View>
        <ThemedText style={[styles.itemNumber, { color: theme.text.primary }]}>Item {index + 1}</ThemedText>
        {canRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(index)}
          >
            <Ionicons name='close-circle' size={20} color={theme.status.error} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
          <ThemedText style={[styles.inputLabel, { color: theme.text.secondary }]}>Name</ThemedText>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.input.background,
                borderColor: theme.border.secondary,
                color: theme.input.text,
              },
              errors?.items && { borderColor: theme.status.error },
            ]}
            value={item.name}
            onChangeText={value => onUpdate(index, 'name', value)}
            placeholder='Item name'
            placeholderTextColor={theme.input.placeholder}
          />
        </View>

        <View style={styles.inputContainer}>
          <ThemedText style={[styles.inputLabel, { color: theme.text.secondary }]}>Quantity</ThemedText>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.input.background,
                borderColor: theme.border.secondary,
                color: theme.input.text,
              },
              errors?.items && { borderColor: theme.status.error },
            ]}
            value={item.quantity}
            onChangeText={value => onUpdate(index, 'quantity', value)}
            placeholder='e.g., 2kg, 5 pieces'
            placeholderTextColor={theme.input.placeholder}
          />
        </View>
      </View>

      <View style={styles.priceContainer}>
        <ThemedText style={[styles.inputLabel, { color: theme.text.secondary }]}>Price (৳)</ThemedText>
        <TextInput
          style={[
            styles.textInput,
            styles.priceInput,
            {
              backgroundColor: theme.input.background,
              borderColor: theme.border.secondary,
              color: theme.input.text,
            },
            errors?.items && { borderColor: theme.status.error },
          ]}
          value={item.price.toString()}
          onChangeText={value => onUpdate(index, 'price', Number(value) || 0)}
          placeholder='0'
          placeholderTextColor={theme.input.placeholder}
          keyboardType='numeric'
        />
      </View>

      {errors?.items && (
        <ThemedText style={[styles.errorText, { color: theme.status.error }]}>{errors.items}</ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemNumber: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  textInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
  },
  priceInput: {
    textAlign: 'right',
  },
  priceContainer: {
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});
