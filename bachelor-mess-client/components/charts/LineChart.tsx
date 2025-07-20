import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { ChartContainer } from './ChartContainer';
import { DataModal } from './modals/DataModal';

export interface LineChartData {
  date: string;
  value: number;
  forecast?: number;
  details?: any;
}

interface LineChartProps {
  data: LineChartData[];
  title: string;
  color?: string;
  showForecast?: boolean;
  showTrend?: boolean;
  onPointPress?: (item: any, index: number) => void;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  color = '#667eea',
  showForecast = true,
  showTrend = true,
  onPointPress,
}) => {
  const [selectedData, setSelectedData] = useState<LineChartData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const maxValue = Math.max(...data.map(item => item.value));
  const minValue = Math.min(...data.map(item => item.value));

  const handlePointPress = (item: LineChartData, index: number) => {
    setSelectedData(item);
    setModalVisible(true);
    onPointPress?.(item, index);
  };

  const calculateTrend = (values: number[]) => {
    if (values.length < 2) return 'stable';
    const first = values[0];
    const last = values[values.length - 1];
    const diff = last - first;
    if (diff > 0) return 'up';
    if (diff < 0) return 'down';
    return 'stable';
  };

  const trend = calculateTrend(data.map(item => item.value));

  return (
    <>
      <ChartContainer title={title} icon='trending-up'>
        <View style={styles.chartContainer}>
          <View style={styles.lineContainer}>
            {data.map((item, index) => {
              const normalizedValue =
                (item.value - minValue) / (maxValue - minValue);
              const yPosition = 100 - normalizedValue * 80; // 80% of container height

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.point,
                    {
                      left: `${(index / (data.length - 1)) * 100}%`,
                      top: `${yPosition}%`,
                      backgroundColor: color,
                    },
                  ]}
                  onPress={() => handlePointPress(item, index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.pointInner} />
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.labelsContainer}>
            {data.map((item, index) => (
              <ThemedText key={index} style={styles.label}>
                {new Date(item.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </ThemedText>
            ))}
          </View>
        </View>

        {showTrend && (
          <View style={styles.trendContainer}>
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
                  ? '#10b981'
                  : trend === 'down'
                  ? '#ef4444'
                  : '#6b7280'
              }
            />
            <ThemedText style={styles.trendText}>
              {trend.charAt(0).toUpperCase() + trend.slice(1)} trend
            </ThemedText>
          </View>
        )}
      </ChartContainer>

      <DataModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={selectedData?.date || ''}
        data={
          selectedData
            ? {
                label: selectedData.date,
                value: selectedData.value,
                color: color,
                gradient: [color, color],
                forecast: selectedData.forecast,
                details: selectedData.details,
              }
            : null
        }
      />
    </>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    height: 200,
    position: 'relative',
  },
  lineContainer: {
    flex: 1,
    position: 'relative',
    marginBottom: 20,
  },
  point: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: -6 }, { translateY: -6 }],
  },
  pointInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  trendText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
});
