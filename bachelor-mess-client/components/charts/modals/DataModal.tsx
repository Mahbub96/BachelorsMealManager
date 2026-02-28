import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '../../ThemedText';

interface ChartData {
  label: string;
  value: number;
  color: string;
  gradient: readonly [string, string];
  forecast?: number;
  trend?: 'up' | 'down' | 'stable';
  details?: {
    description?: string;
    breakdown?: { label: string; value: number }[];
    notes?: string;
  };
}

interface DataModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  data: ChartData | null;
}

export const DataModal: React.FC<DataModalProps> = ({
  visible,
  onClose,
  title,
  data,
}) => {
  const formatValue = (value: number | undefined) => {
    if (typeof value === 'number' && !isNaN(value)) {
      return `৳${value.toLocaleString()}`;
    }
    return '-';
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      case 'stable':
        return 'remove';
      default:
        return 'information-circle';
    }
  };

  const { theme } = useTheme();
  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up':
        return theme.status.success;
      case 'down':
        return theme.status.error;
      case 'stable':
      default:
        return theme.text.secondary;
    }
  };

  if (!data) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType='slide'
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: theme.overlay.medium }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.modal }]}>
          <LinearGradient
            colors={theme.gradient.primary as [string, string]}
            style={styles.modalHeaderGradient}
          >
            <View style={styles.modalHeaderContent}>
              <ThemedText style={[styles.modalTitleWhite, { color: theme.onPrimary?.text ?? theme.text.inverse }]}>{title}</ThemedText>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButtonWhite}
              >
                <Ionicons name='close' size={24} color={theme.onPrimary?.text ?? theme.text.inverse} />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.valueCard, { backgroundColor: theme.surface }]}>
              <View style={styles.valueCardHeader}>
                <Ionicons name='analytics' size={24} color={theme.primary} />
                <ThemedText style={[styles.valueCardLabel, { color: theme.text.secondary }]}>
                  Current Value
                </ThemedText>
              </View>
              <ThemedText style={[styles.valueCardValue, { color: theme.text.primary }]}>
                {formatValue(data.value)}
              </ThemedText>
            </View>

            {data.trend && (
              <View style={[styles.trendCard, { backgroundColor: theme.surface }]}>
                <View style={styles.trendCardHeader}>
                  <Ionicons
                    name={getTrendIcon(data.trend) as IconName}
                    size={20}
                    color={getTrendColor(data.trend)}
                  />
                  <ThemedText style={[styles.trendCardLabel, { color: theme.text.secondary }]}>
                    Trend Analysis
                  </ThemedText>
                </View>
                <ThemedText style={[styles.trendCardValue, { color: theme.text.primary }]}>
                  {data.trend.charAt(0).toUpperCase() + data.trend.slice(1)}
                </ThemedText>
              </View>
            )}

            {data.forecast && (
              <View style={[styles.forecastCard, { backgroundColor: theme.surface }]}>
                <View style={styles.forecastCardHeader}>
                  <Ionicons name='trending-up' size={20} color={theme.status.warning} />
                  <ThemedText style={[styles.forecastCardLabel, { color: theme.text.secondary }]}>
                    Forecast
                  </ThemedText>
                </View>
                <ThemedText style={[styles.forecastCardValue, { color: theme.text.primary }]}>
                  {formatValue(data.forecast)}
                </ThemedText>
              </View>
            )}

            {data.details?.description && (
              <View style={[styles.descriptionCard, { backgroundColor: theme.surface }]}>
                <View style={styles.descriptionCardHeader}>
                  <Ionicons
                    name='information-circle'
                    size={20}
                    color={theme.icon.secondary}
                  />
                  <ThemedText style={[styles.descriptionCardLabel, { color: theme.text.secondary }]}>
                    Description
                  </ThemedText>
                </View>
                <ThemedText style={[styles.descriptionCardText, { color: theme.text.primary }]}>
                  {data.details.description}
                </ThemedText>
              </View>
            )}

            {data.details?.breakdown && data.details.breakdown.length > 0 && (
              <View style={[styles.breakdownCard, { backgroundColor: theme.surface }]}>
                <View style={styles.breakdownCardHeader}>
                  <Ionicons name='list' size={20} color={theme.icon.secondary} />
                  <ThemedText style={[styles.breakdownCardLabel, { color: theme.text.secondary }]}>
                    Breakdown
                  </ThemedText>
                </View>
                {data.details.breakdown.map((item, index) => (
                  <View key={index} style={[styles.breakdownItem, { borderBottomColor: theme.border.primary }]}>
                    <ThemedText style={[styles.breakdownItemLabel, { color: theme.text.primary }]}>
                      {item.label}
                    </ThemedText>
                    <ThemedText style={[styles.breakdownItemValue, { color: theme.text.primary }]}>
                      ৳{item.value.toLocaleString()}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}

            {data.details?.notes && (
              <View style={[styles.notesCard, { backgroundColor: theme.surface }]}>
                <View style={styles.notesCardHeader}>
                  <Ionicons
                    name='chatbubble-outline'
                    size={20}
                    color={theme.icon.secondary}
                  />
                  <ThemedText style={[styles.notesCardLabel, { color: theme.text.secondary }]}>Notes</ThemedText>
                </View>
                <ThemedText style={[styles.notesCardText, { color: theme.text.primary }]}>
                  {data.details.notes}
                </ThemedText>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeaderGradient: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitleWhite: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButtonWhite: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  valueCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  valueCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  valueCardLabel: {
    fontSize: 14,
    marginLeft: 8,
  },
  valueCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  trendCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  trendCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendCardLabel: {
    fontSize: 14,
    marginLeft: 8,
  },
  trendCardValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  forecastCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  forecastCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  forecastCardLabel: {
    fontSize: 14,
    marginLeft: 8,
  },
  forecastCardValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  descriptionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  descriptionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  descriptionCardLabel: {
    fontSize: 14,
    marginLeft: 8,
  },
  descriptionCardText: {
    fontSize: 14,
    lineHeight: 20,
  },
  breakdownCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  breakdownCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownCardLabel: {
    fontSize: 14,
    marginLeft: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  breakdownItemLabel: {
    fontSize: 14,
  },
  breakdownItemValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  notesCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesCardLabel: {
    fontSize: 14,
    marginLeft: 8,
  },
  notesCardText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
