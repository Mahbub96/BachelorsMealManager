import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up':
        return '#10b981';
      case 'down':
        return '#ef4444';
      case 'stable':
        return '#6b7280';
      default:
        return '#6b7280';
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
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.modalHeaderGradient}
          >
            <View style={styles.modalHeaderContent}>
              <ThemedText style={styles.modalTitleWhite}>{title}</ThemedText>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButtonWhite}
              >
                <Ionicons name='close' size={24} color='#fff' />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.valueCard}>
              <View style={styles.valueCardHeader}>
                <Ionicons name='analytics' size={24} color='#667eea' />
                <ThemedText style={styles.valueCardLabel}>
                  Current Value
                </ThemedText>
              </View>
              <ThemedText style={styles.valueCardValue}>
                {formatValue(data.value)}
              </ThemedText>
            </View>

            {data.trend && (
              <View style={styles.trendCard}>
                <View style={styles.trendCardHeader}>
                  <Ionicons
                    name={getTrendIcon(data.trend) as any}
                    size={20}
                    color={getTrendColor(data.trend)}
                  />
                  <ThemedText style={styles.trendCardLabel}>
                    Trend Analysis
                  </ThemedText>
                </View>
                <ThemedText style={styles.trendCardValue}>
                  {data.trend.charAt(0).toUpperCase() + data.trend.slice(1)}
                </ThemedText>
              </View>
            )}

            {data.forecast && (
              <View style={styles.forecastCard}>
                <View style={styles.forecastCardHeader}>
                  <Ionicons name='trending-up' size={20} color='#f59e0b' />
                  <ThemedText style={styles.forecastCardLabel}>
                    Forecast
                  </ThemedText>
                </View>
                <ThemedText style={styles.forecastCardValue}>
                  {formatValue(data.forecast)}
                </ThemedText>
              </View>
            )}

            {data.details?.description && (
              <View style={styles.descriptionCard}>
                <View style={styles.descriptionCardHeader}>
                  <Ionicons
                    name='information-circle'
                    size={20}
                    color='#6b7280'
                  />
                  <ThemedText style={styles.descriptionCardLabel}>
                    Description
                  </ThemedText>
                </View>
                <ThemedText style={styles.descriptionCardText}>
                  {data.details.description}
                </ThemedText>
              </View>
            )}

            {data.details?.breakdown && data.details.breakdown.length > 0 && (
              <View style={styles.breakdownCard}>
                <View style={styles.breakdownCardHeader}>
                  <Ionicons name='list' size={20} color='#6b7280' />
                  <ThemedText style={styles.breakdownCardLabel}>
                    Breakdown
                  </ThemedText>
                </View>
                {data.details.breakdown.map((item, index) => (
                  <View key={index} style={styles.breakdownItem}>
                    <ThemedText style={styles.breakdownItemLabel}>
                      {item.label}
                    </ThemedText>
                    <ThemedText style={styles.breakdownItemValue}>
                      ৳{item.value.toLocaleString()}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}

            {data.details?.notes && (
              <View style={styles.notesCard}>
                <View style={styles.notesCardHeader}>
                  <Ionicons
                    name='chatbubble-outline'
                    size={20}
                    color='#6b7280'
                  />
                  <ThemedText style={styles.notesCardLabel}>Notes</ThemedText>
                </View>
                <ThemedText style={styles.notesCardText}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
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
    color: '#fff',
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
    backgroundColor: '#f8fafc',
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
    color: '#6b7280',
    marginLeft: 8,
  },
  valueCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  trendCard: {
    backgroundColor: '#f0f9ff',
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
    color: '#6b7280',
    marginLeft: 8,
  },
  trendCardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  forecastCard: {
    backgroundColor: '#fffbeb',
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
    color: '#6b7280',
    marginLeft: 8,
  },
  forecastCardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  descriptionCard: {
    backgroundColor: '#f9fafb',
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
    color: '#6b7280',
    marginLeft: 8,
  },
  descriptionCardText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  breakdownCard: {
    backgroundColor: '#f9fafb',
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
    color: '#6b7280',
    marginLeft: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  breakdownItemLabel: {
    fontSize: 14,
    color: '#374151',
  },
  breakdownItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  notesCard: {
    backgroundColor: '#f9fafb',
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
    color: '#6b7280',
    marginLeft: 8,
  },
  notesCardText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});
