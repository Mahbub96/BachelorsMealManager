import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';

interface ChartSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showPeriodToggle?: boolean;
  selectedPeriod?: 'current' | 'forecast';
  onPeriodChange?: (period: 'current' | 'forecast') => void;
  isSmallScreen?: boolean;
  marginBottom?: number;
}

export const ChartSection: React.FC<ChartSectionProps> = ({
  title,
  subtitle,
  children,
  showPeriodToggle = false,
  selectedPeriod = 'current',
  onPeriodChange,
  isSmallScreen = false,
  marginBottom = 24,
}) => {
  return (
    <View style={[styles.container, { marginBottom }]}>
      <View
        style={[styles.chartHeader, isSmallScreen && styles.chartHeaderSmall]}
      >
        <View style={styles.chartTitleContainer}>
          <ThemedText
            style={[styles.chartTitle, isSmallScreen && styles.chartTitleSmall]}
          >
            {title}
          </ThemedText>
          {subtitle && (
            <ThemedText
              style={[
                styles.chartSubtitle,
                isSmallScreen && styles.chartSubtitleSmall,
              ]}
            >
              {subtitle}
            </ThemedText>
          )}
        </View>

        {showPeriodToggle && onPeriodChange && (
          <View style={styles.chartActions}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'current' && styles.periodButtonActive,
                isSmallScreen && styles.periodButtonSmall,
              ]}
              onPress={() => onPeriodChange('current')}
            >
              <ThemedText
                style={[
                  styles.periodButtonText,
                  selectedPeriod === 'current' && styles.periodButtonTextActive,
                  isSmallScreen && styles.periodButtonTextSmall,
                ]}
              >
                Current
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'forecast' && styles.periodButtonActive,
                isSmallScreen && styles.periodButtonSmall,
              ]}
              onPress={() => onPeriodChange('forecast')}
            >
              <ThemedText
                style={[
                  styles.periodButtonText,
                  selectedPeriod === 'forecast' &&
                    styles.periodButtonTextActive,
                  isSmallScreen && styles.periodButtonTextSmall,
                ]}
              >
                Forecast
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.chartContent}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  chartHeaderSmall: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
  },
  chartTitleContainer: {
    flex: 1,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  chartTitleSmall: {
    fontSize: 16,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  chartSubtitleSmall: {
    fontSize: 12,
  },
  chartActions: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  periodButtonSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  periodButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  periodButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  periodButtonTextSmall: {
    fontSize: 10,
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  chartContent: {
    flex: 1,
  },
});
