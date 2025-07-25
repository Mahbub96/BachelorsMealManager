import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { BaseChart, BaseChartProps } from './BaseChart';

const { width: screenWidth } = Dimensions.get('window');

export interface SwappableLineChartData {
  month?: string;
  revenue?: number;
  date?: string;
  value?: number;
  forecast?: number;
  details?: any;
}

export interface SwappableLineChartProps
  extends Omit<BaseChartProps, 'children'> {
  monthlyRevenue: SwappableLineChartData[];
  color?: string;
  showForecast?: boolean;
  showTrend?: boolean;
  onPointPress?: (item: SwappableLineChartData, index: number) => void;
}

export const SwappableLineChart: React.FC<SwappableLineChartProps> = ({
  monthlyRevenue,
  title,
  color,
  showForecast = true,
  showTrend = true,
  onPointPress,
  containerStyle,
  showHeader = true,
}) => {
  const { theme } = useTheme();
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const safeData = monthlyRevenue || [];
  const allValues = safeData.flatMap(item => [
    item.value || item.revenue || 0,
    item.forecast || 0,
  ]);
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 0;
  const minValue = allValues.length > 0 ? Math.min(...allValues) : 0;
  const range = maxValue - minValue || 1;

  const chartColor = color || theme.primary;

  const calculateTrend = (values: number[]) => {
    if (values.length < 2) return 'stable';
    const firstHalf = values.slice(0, Math.ceil(values.length / 2));
    const secondHalf = values.slice(Math.ceil(values.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    if (secondAvg > firstAvg * 1.1) return 'up';
    if (secondAvg < firstAvg * 0.9) return 'down';
    return 'stable';
  };

  const trend = calculateTrend(
    safeData.map(item => item.value || item.revenue || 0)
  );

  const handlePointPress = (item: SwappableLineChartData, index: number) => {
    setSelectedIndex(selectedIndex === index ? null : index);

    router.push({
      pathname: '/line-details',
      params: {
        date: item?.date || item?.month || '',
        value: (item?.value || item?.revenue || 0).toString(),
        forecast: (item?.forecast || 0).toString(),
        color: chartColor,
      },
    });

    onPointPress?.(item, index);
  };

  const chartWidth = Math.min(screenWidth - 80, 320);
  const chartHeight = 160;
  const padding = 20;
  const pointRadius = 6;

  const getYPosition = (value: number) => {
    return (
      chartHeight -
      padding -
      ((value - minValue) / range) * (chartHeight - 2 * padding)
    );
  };

  const getXPosition = (index: number) => {
    return (
      padding + (index / (safeData.length - 1)) * (chartWidth - 2 * padding)
    );
  };

  return (
    <BaseChart
      title={title}
      containerStyle={containerStyle}
      showHeader={showHeader}
    >
      <View style={styles.chartContainer}>
        {/* Trend indicator */}
        {showTrend && (
          <View style={styles.trendIndicator}>
            <Ionicons
              name={
                trend === 'up'
                  ? 'trending-up'
                  : trend === 'down'
                  ? 'trending-down'
                  : 'remove'
              }
              size={16}
              color={
                trend === 'up'
                  ? theme.status.success
                  : trend === 'down'
                  ? theme.status.error
                  : theme.text.tertiary
              }
            />
            <ThemedText style={styles.trendText}>
              {trend === 'up'
                ? 'Rising'
                : trend === 'down'
                ? 'Falling'
                : 'Stable'}
            </ThemedText>
          </View>
        )}

        {/* Chart area */}
        <View
          style={[styles.chartArea, { width: chartWidth, height: chartHeight }]}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <View
              key={index}
              style={[
                styles.gridLine,
                {
                  top: padding + ratio * (chartHeight - 2 * padding),
                  backgroundColor: theme.border.secondary,
                },
              ]}
            />
          ))}

          {/* Line path */}
          {safeData.length > 1 && (
            <View style={styles.lineContainer}>
              {safeData.map((item, index) => {
                if (index === 0) return null;
                const prevItem = safeData[index - 1];
                const x1 = getXPosition(index - 1);
                const y1 = getYPosition(
                  prevItem.value || prevItem.revenue || 0
                );
                const x2 = getXPosition(index);
                const y2 = getYPosition(item.value || item.revenue || 0);

                return (
                  <View
                    key={`line-${index}`}
                    style={[
                      styles.line,
                      {
                        left: x1,
                        top: y1,
                        width: Math.sqrt(
                          Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)
                        ),
                        backgroundColor: chartColor,
                        transform: [
                          {
                            rotate: `${Math.atan2(y2 - y1, x2 - x1)}rad`,
                          },
                        ],
                      },
                    ]}
                  />
                );
              })}
            </View>
          )}

          {/* Data points */}
          {safeData.map((item, index) => {
            const x = getXPosition(index);
            const y = getYPosition(item.value || item.revenue || 0);

            return (
              <Pressable
                key={index}
                style={[
                  styles.point,
                  {
                    left: x - pointRadius,
                    top: y - pointRadius,
                    backgroundColor:
                      selectedIndex === index ? chartColor : theme.surface,
                    borderColor: chartColor,
                  },
                ]}
                onPress={() => handlePointPress(item, index)}
              >
                {/* Point glow effect */}
                <View
                  style={[
                    styles.pointGlow,
                    {
                      backgroundColor: chartColor,
                      opacity: selectedIndex === index ? 0.3 : 0.1,
                    },
                  ]}
                />
              </Pressable>
            );
          })}

          {/* Forecast points */}
          {showForecast &&
            safeData.map((item, index) => {
              if (!item.forecast) return null;
              const x = getXPosition(index);
              const y = getYPosition(item.forecast);

              return (
                <View
                  key={`forecast-${index}`}
                  style={[
                    styles.forecastPoint,
                    {
                      left: x - 4,
                      top: y - 4,
                      backgroundColor: theme.status.warning,
                    },
                  ]}
                />
              );
            })}
        </View>

        {/* X-axis labels */}
        <View style={styles.xAxisLabels}>
          {safeData.map((item, index) => (
            <ThemedText
              key={index}
              style={[styles.xAxisLabel, { fontSize: 10 }]}
              numberOfLines={1}
            >
              {item.date || item.month || `Month ${index + 1}`}
            </ThemedText>
          ))}
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
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartArea: {
    position: 'relative',
    marginBottom: 8,
  },
  gridLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    opacity: 0.3,
  },
  lineContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  line: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
  },
  point: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pointGlow: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    top: -4,
    left: -4,
  },
  forecastPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  xAxisLabel: {
    textAlign: 'center',
    flex: 1,
  },
});
