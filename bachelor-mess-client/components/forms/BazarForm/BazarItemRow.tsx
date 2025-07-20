import React from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../../ThemedText';
import { BazarItem } from '../../../services/bazarService';

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
  const getItemIcon = (index: number) => {
    const icons = ['fast-food', 'restaurant', 'cafe', 'pizza', 'wine'];
    return icons[index % icons.length];
  };

  const getItemColor = (index: number) => {
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];
    return colors[index % colors.length];
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={getItemIcon(index) as any}
            size={20}
            color={getItemColor(index)}
          />
        </View>
        <ThemedText style={styles.itemNumber}>Item {index + 1}</ThemedText>
        {canRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(index)}
          >
            <Ionicons name='close-circle' size={20} color='#ef4444' />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>Name</ThemedText>
          <TextInput
            style={[styles.textInput, errors?.items && styles.inputError]}
            value={item.name}
            onChangeText={value => onUpdate(index, 'name', value)}
            placeholder='Item name'
            placeholderTextColor='#9ca3af'
          />
        </View>

        <View style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>Quantity</ThemedText>
          <TextInput
            style={[styles.textInput, errors?.items && styles.inputError]}
            value={item.quantity}
            onChangeText={value => onUpdate(index, 'quantity', value)}
            placeholder='e.g., 2kg, 5 pieces'
            placeholderTextColor='#9ca3af'
          />
        </View>
      </View>

      <View style={styles.priceContainer}>
        <ThemedText style={styles.inputLabel}>Price (৳)</ThemedText>
        <TextInput
          style={[
            styles.textInput,
            styles.priceInput,
            errors?.items && styles.inputError,
          ]}
          value={item.price.toString()}
          onChangeText={value => onUpdate(index, 'price', Number(value) || 0)}
          placeholder='0'
          placeholderTextColor='#9ca3af'
          keyboardType='numeric'
        />
      </View>

      {errors?.items && (
        <ThemedText style={styles.errorText}>{errors.items}</ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    backgroundColor: '#fff',
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
    color: '#374151',
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
    color: '#6b7280',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#374151',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  priceInput: {
    textAlign: 'right',
  },
  priceContainer: {
    flex: 1,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
});
