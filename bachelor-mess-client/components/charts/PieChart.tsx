import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { BaseChart, BaseChartProps } from './BaseChart';

const { width: screenWidth } = Dimensions.get('window');

export interface PieChartData {
  label: string;
  value: number;
  color: string;
  gradient: readonly [string, string];
  forecast?: number;
  details?: {
    description?: string;
    breakdown?: { label: string; value: number }[];
    notes?: string;
  };
}

export interface PieChartProps extends Omit<BaseChartProps, 'children'> {
  data: PieChartData[];
  showForecast?: boolean;
  onSlicePress?: (item: PieChartData, index: number) => void;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  showForecast = true,
  onSlicePress,
  containerStyle,
  showHeader = true,
}) => {
  const { theme } = useTheme();
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const safeData = data || [];
  const total = safeData.reduce((sum, item) => sum + (item.value || 0), 0);
  const chartSize = Math.min(screenWidth - 120, 200);
  const radius = (chartSize - 40) / 2;

  const handleSlicePress = (item: PieChartData, index: number) => {
    setSelectedIndex(selectedIndex === index ? null : index);

    router.push({
      pathname: '/pie-details',
      params: {
        label: item?.label || '',
        value: (item?.value || 0).toString(),
        percentage: total > 0 ? ((item?.value || 0) / total * 100).toFixed(1) : '0',
        color: item?.color || theme.text.primary,
        description: item?.details?.description || '',
        notes: item?.details?.notes || '',
      },
    });

    onSlicePress?.(item, index);
  };

  const renderSlice = (item: PieChartData, index: number) => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0;

    return (
      <Pressable
        key={index}
        style={[
          styles.slice,
          {
            opacity: selectedIndex === null || selectedIndex === index ? 1 : 0.7,
            transform: [{ scale: selectedIndex === index ? 1.05 : 1 }],
          },
        ]}
        onPress={() => handleSlicePress(item, index)}
        accessibilityLabel={`${item.label} ${percentage.toFixed(1)}%`}
      >
        <LinearGradient
          colors={item.gradient || [theme.primary, theme.secondary]}
          style={[
            styles.sliceGradient,
            {
              width: radius * 2,
              height: radius * 2,
              borderRadius: radius,
            },
          ]}
        />
      </Pressable>
    );
  };

  return (
    <BaseChart
      title={title}
      containerStyle={containerStyle}
      showHeader={showHeader}
    >
      <View style={styles.chartContainer}>
        {/* Pie Chart */}
        <View style={[styles.pieContainer, { width: chartSize, height: chartSize }]}>
          {safeData.map((item, index) => renderSlice(item, index))}
          
          {/* Center circle */}
          <View
            style={[
              styles.centerCircle,
              {
                width: radius * 0.6,
                height: radius * 0.6,
                borderRadius: radius * 0.3,
                backgroundColor: theme.surface,
                borderColor: theme.border.primary,
              },
            ]}
          >
            <ThemedText style={styles.centerText}>
              {total.toLocaleString()}
            </ThemedText>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          {safeData.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            
            return (
              <Pressable
                key={index}
                style={[
                  styles.legendItem,
                  {
                    opacity: selectedIndex === null || selectedIndex === index ? 1 : 0.7,
                  },
                ]}
                onPress={() => handleSlicePress(item, index)}
              >
                <View
                  style={[
                    styles.legendColor,
                    {
                      backgroundColor: item.color,
                    },
                  ]}
                />
                <View style={styles.legendText}>
                  <ThemedText style={styles.legendLabel} numberOfLines={1}>
                    {item.label}
                  </ThemedText>
                  <ThemedText style={styles.legendValue}>
                    {item.value.toLocaleString()} ({percentage.toFixed(1)}%)
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </BaseChart>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  pieContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  slice: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliceGradient: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  centerCircle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  centerText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  legendContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  legendText: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  legendValue: {
    fontSize: 12,
    opacity: 0.8,
  },
}); 