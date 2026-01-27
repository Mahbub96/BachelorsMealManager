import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { useRouter } from 'expo-router';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { BaseChart, BaseChartProps } from './BaseChart';

const { width: screenWidth } = Dimensions.get('window');

export interface ChartData {
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

export interface BarChartProps extends Omit<BaseChartProps, 'children'> {
  data: ChartData[];
  height?: number;
  showForecast?: boolean;
  showTrend?: boolean;
  onBarPress?: (item: ChartData, index: number) => void;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  height = 200,
  showForecast = true,
  showTrend = true,
  onBarPress,
  containerStyle,
  showHeader = true,
}) => {
  const { theme } = useTheme();
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const safeData = data || [];
  const maxValue = Math.max(
    ...safeData.map(item => Math.max(item?.value || 0, item?.forecast || 0))
  ) || 1;

  // Responsive bar width calculation
  const availableWidth = Math.min(screenWidth - 80, 320);
  const barWidth = Math.max(
    24,
    Math.min(40, availableWidth / Math.max(safeData.length, 1) - 10)
  );
  const barSpacing = 10;
  const labelArea = 90;
  const barAreaHeight = height - labelArea - 40;

  const handleBarPress = (item: ChartData, index: number) => {
    setSelectedIndex(selectedIndex === index ? null : index);

    router.push({
      pathname: '/bar-details',
      params: {
        label: item?.label || '',
        value: (item?.value || 0).toString(),
        forecast: (item?.forecast || 0).toString(),
        trend: item?.trend || 'stable',
        color: item?.color || theme.text.primary,
        description: item?.details?.description || '',
        notes: item?.details?.notes || '',
      },
    });

    onBarPress?.(item, index);
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
        return null;
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up':
        return theme.status.success;
      case 'down':
        return theme.status.error;
      case 'stable':
        return theme.text.tertiary;
      default:
        return theme.text.tertiary;
    }
  };

  return (
    <BaseChart
      title={title}
      containerStyle={containerStyle}
      showHeader={showHeader}
    >
      {/* Bars */}
      <View
        style={[
          styles.barChartContainer,
          {
            width: '100%',
            height: barAreaHeight,
            alignItems: 'flex-end',
          },
        ]}
      >
        {safeData.map((item, index) => (
          <Pressable
            key={index}
            style={[
              styles.barItem,
              {
                width: barWidth,
                marginHorizontal: barSpacing / 2,
                height: barAreaHeight,
                justifyContent: 'flex-end',
                opacity: selectedIndex === null || selectedIndex === index ? 1 : 0.7,
              },
            ]}
            onPress={() => handleBarPress(item, index)}
          >
            {/* Forecast bar */}
            {showForecast && item?.forecast && (
              <View
                style={[
                  styles.forecastBar,
                  {
                    height: ((item?.forecast || 0) / maxValue) * barAreaHeight,
                    backgroundColor: theme.status.warning,
                    opacity: 0.4,
                  },
                ]}
              />
            )}

            {/* Main bar with gradient */}
            <LinearGradient
              colors={item?.gradient || [theme.primary, theme.secondary]}
              style={[
                styles.mainBar,
                {
                  height: ((item?.value || 0) / maxValue) * barAreaHeight,
                  width: barWidth - 6,
                  transform: [{ scale: selectedIndex === index ? 1.05 : 1 }],
                },
              ]}
            />

            {/* Trend indicator */}
            {showTrend && item?.trend && getTrendIcon(item.trend) && (
              <View style={styles.trendContainer}>
                <Ionicons
                  name={getTrendIcon(item.trend) as IconName}
                  size={12}
                  color={getTrendColor(item.trend)}
                />
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {/* Labels */}
      <View style={styles.labelsContainer}>
        {safeData.map((item, index) => (
          <View
            key={index}
            style={[
              styles.labelItem,
              {
                width: barWidth + barSpacing,
                marginHorizontal: barSpacing / 2,
                alignItems: 'center',
              },
            ]}
          >
            <ThemedText
              style={[styles.labelText, { fontSize: 11 }]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
            >
              {item?.label || ''}
            </ThemedText>
            <ThemedText
              style={[
                styles.barValue,
                {
                  color: selectedIndex === index
                    ? item?.color || theme.text.primary
                    : theme.text.primary,
                  fontWeight: selectedIndex === index ? 'bold' : '600',
                  fontSize: 11,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
            >
              {typeof item?.value === 'number' && !isNaN(item.value)
                ? item.value.toLocaleString()
                : '0'}
            </ThemedText>
          </View>
        ))}
      </View>
    </BaseChart>
  );
};

const styles = StyleSheet.create({
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    width: '100%',
    paddingHorizontal: 12,
  },
  barItem: {
    alignItems: 'center',
    flex: 1,
  },
  forecastBar: {
    borderRadius: 12,
    minHeight: 6,
    marginBottom: 2,
  },
  mainBar: {
    borderRadius: 12,
    minHeight: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  trendContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    width: '100%',
    paddingHorizontal: 4,
  },
  labelItem: {
    alignItems: 'center',
    flex: 1,
  },
  labelText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 4,
  },
  barValue: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 4,
  },
});
