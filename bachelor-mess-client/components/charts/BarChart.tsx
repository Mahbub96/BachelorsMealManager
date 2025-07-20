import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { ChartContainer } from './ChartContainer';
import { DataModal } from './modals/DataModal';

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

interface BarChartProps {
  data: ChartData[];
  title: string;
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
}) => {
  const [selectedData, setSelectedData] = useState<ChartData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const maxValue = Math.max(...data.map(item => item.value));

  const handleBarPress = (item: ChartData, index: number) => {
    setSelectedData(item);
    setModalVisible(true);
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

  return (
    <>
      <ChartContainer title={title} icon='bar-chart'>
        <View style={[styles.chartContainer, { height }]}>
          <View style={styles.barsContainer}>
            {data.map((item, index) => {
              const barHeight = (item.value / maxValue) * (height - 60);
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.barWrapper}
                  onPress={() => handleBarPress(item, index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: item.color,
                        },
                      ]}
                    />
                    {showForecast && item.forecast && (
                      <View
                        style={[
                          styles.forecastBar,
                          {
                            height: (item.forecast / maxValue) * (height - 60),
                            backgroundColor: item.color,
                            opacity: 0.5,
                          },
                        ]}
                      />
                    )}
                  </View>
                  <ThemedText style={styles.barLabel}>{item.label}</ThemedText>
                  <ThemedText style={styles.barValue}>
                    ৳{item.value.toLocaleString()}
                  </ThemedText>
                  {showTrend && item.trend && (
                    <View style={styles.trendContainer}>
                      <Ionicons
                        name={getTrendIcon(item.trend) as any}
                        size={12}
                        color={getTrendColor(item.trend)}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ChartContainer>

      <DataModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={selectedData?.label || ''}
        data={selectedData}
      />
    </>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    width: '100%',
    height: '100%',
    paddingHorizontal: 8,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    width: '100%',
  },
  bar: {
    width: '80%',
    borderRadius: 4,
    marginBottom: 4,
  },
  forecastBar: {
    width: '60%',
    borderRadius: 4,
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 2,
  },
  barValue: {
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
  },
  trendContainer: {
    marginTop: 2,
  },
});
