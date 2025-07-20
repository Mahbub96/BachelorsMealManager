import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedText } from './ThemedText';

const { width: screenWidth } = Dimensions.get('window');

// Design System Constants
const DESIGN_SYSTEM = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  cardHeight: {
    small: 80,
    medium: 120,
    large: 160,
    xlarge: 200,
  },
  shadows: {
    small: {
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      elevation: 4,
    },
    medium: {
      boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
      elevation: 8,
    },
  },
};

interface ChartData {
  label: string;
  value: number;
  color: string;
  gradient: readonly [string, string];
  forecast?: number; // For forecasting
  trend?: 'up' | 'down' | 'stable'; // Trend indicator
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

interface LineChartProps {
  data: { date: string; value: number; forecast?: number; details?: any }[];
  title: string;
  color?: string;
  showForecast?: boolean;
  showTrend?: boolean;
  onPointPress?: (item: any, index: number) => void;
}

interface PieChartProps {
  data: ChartData[];
  title: string;
  showForecast?: boolean;
  onSlicePress?: (item: ChartData, index: number) => void;
}

interface SwappableLineChartProps {
  monthlyRevenue: Array<{
    month?: string;
    revenue?: number;
    date?: string;
    value?: number;
    forecast?: number;
    details?: any;
  }>;
  title: string;
  color?: string;
  showForecast?: boolean;
  showTrend?: boolean;
  onPointPress?: (item: any, index: number) => void;
}

// Specialized Modal Components
const DataModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  title: string;
  data: any;
}> = ({ visible, onClose, title, data }) => {
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

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType='slide'
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Beautiful Header */}
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
            {/* Main Value Card */}
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

            {/* Trend Information */}
            {data.trend && (
              <View style={styles.trendCard}>
                <View style={styles.trendCardHeader}>
                  <Ionicons
                    name='trending-up'
                    size={20}
                    color={getTrendColor(data.trend)}
                  />
                  <ThemedText style={styles.trendCardLabel}>
                    Trend Analysis
                  </ThemedText>
                </View>
                <View style={styles.trendContent}>
                  <ThemedText
                    style={[
                      styles.trendText,
                      { color: getTrendColor(data.trend) },
                    ]}
                  >
                    {data.trend === 'up'
                      ? '↗️ Increasing'
                      : data.trend === 'down'
                      ? '↘️ Decreasing'
                      : '→ Stable'}
                  </ThemedText>
                </View>
              </View>
            )}

            {/* Forecast Information */}
            {data.forecast && (
              <View style={styles.forecastCard}>
                <View style={styles.forecastCardHeader}>
                  <Ionicons name='time' size={20} color='#f59e0b' />
                  <ThemedText style={styles.forecastCardLabel}>
                    Forecast
                  </ThemedText>
                </View>
                <ThemedText style={styles.forecastValue}>
                  {formatValue(data.forecast)}
                </ThemedText>
                <ThemedText style={styles.forecastNote}>
                  Predicted for next period
                </ThemedText>
              </View>
            )}

            {/* Description */}
            {data.details?.description && (
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <Ionicons name='document-text' size={20} color='#6b7280' />
                  <ThemedText style={styles.infoCardLabel}>
                    Description
                  </ThemedText>
                </View>
                <ThemedText style={styles.infoCardText}>
                  {data.details.description}
                </ThemedText>
              </View>
            )}

            {/* Breakdown */}
            {data.details?.breakdown && data.details.breakdown.length > 0 && (
              <View style={styles.breakdownCard}>
                <View style={styles.breakdownCardHeader}>
                  <Ionicons name='list' size={20} color='#6b7280' />
                  <ThemedText style={styles.breakdownCardLabel}>
                    Breakdown
                  </ThemedText>
                </View>
                {data.details.breakdown.map((item: any, index: number) => (
                  <View key={index} style={styles.breakdownItem}>
                    <ThemedText style={styles.breakdownLabel}>
                      {item.label}
                    </ThemedText>
                    <ThemedText style={styles.breakdownValue}>
                      {formatValue(item.value)}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}

            {/* Notes */}
            {data.details?.notes && (
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <Ionicons name='chatbubble' size={20} color='#6b7280' />
                  <ThemedText style={styles.infoCardLabel}>Notes</ThemedText>
                </View>
                <ThemedText style={styles.infoCardText}>
                  {data.details.notes}
                </ThemedText>
              </View>
            )}

            {/* Date/Time Information */}
            {data.date && (
              <View style={styles.dateCard}>
                <View style={styles.dateCardHeader}>
                  <Ionicons name='calendar' size={20} color='#6b7280' />
                  <ThemedText style={styles.dateCardLabel}>Date</ThemedText>
                </View>
                <ThemedText style={styles.dateCardText}>{data.date}</ThemedText>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const PieModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  title: string;
  data: any;
  total: number;
}> = ({ visible, onClose, title, data, total }) => {
  const percentage = total > 0 ? ((data.value || 0) / total) * 100 : 0;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType='slide'
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Beautiful Header */}
          <LinearGradient
            colors={['#f093fb', '#f5576c']}
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
            {/* Category Header Card */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View
                  style={[
                    styles.categoryColorIndicator,
                    { backgroundColor: data.color },
                  ]}
                />
                <View style={styles.categoryContent}>
                  <ThemedText style={styles.categoryTitle}>
                    {data.label}
                  </ThemedText>
                  <ThemedText style={styles.categoryPercentage}>
                    {percentage.toFixed(1)}%
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Value Information */}
            <View style={styles.valueCard}>
              <View style={styles.valueCardHeader}>
                <Ionicons name='cash' size={24} color='#667eea' />
                <ThemedText style={styles.valueCardLabel}>Value</ThemedText>
              </View>
              <ThemedText style={styles.valueCardValue}>
                {(data.value || 0).toLocaleString()}
              </ThemedText>
            </View>

            {/* Total Contribution */}
            <View style={styles.totalCard}>
              <View style={styles.totalCardHeader}>
                <Ionicons name='pie-chart' size={20} color='#6b7280' />
                <ThemedText style={styles.totalCardLabel}>
                  Total Contribution
                </ThemedText>
              </View>
              <ThemedText style={styles.totalCardValue}>
                {total.toLocaleString()}
              </ThemedText>
            </View>

            {/* Forecast */}
            {data.forecast && (
              <View style={styles.forecastCard}>
                <View style={styles.forecastCardHeader}>
                  <Ionicons name='time' size={20} color='#f59e0b' />
                  <ThemedText style={styles.forecastCardLabel}>
                    Forecast
                  </ThemedText>
                </View>
                <ThemedText style={styles.forecastValue}>
                  {data.forecast.toLocaleString()}
                </ThemedText>
                <ThemedText style={styles.forecastNote}>
                  Predicted for next period
                </ThemedText>
              </View>
            )}

            {/* Description */}
            {data.details?.description && (
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <Ionicons name='document-text' size={20} color='#6b7280' />
                  <ThemedText style={styles.infoCardLabel}>
                    Description
                  </ThemedText>
                </View>
                <ThemedText style={styles.infoCardText}>
                  {data.details.description}
                </ThemedText>
              </View>
            )}

            {/* Notes */}
            {data.details?.notes && (
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <Ionicons name='chatbubble' size={20} color='#6b7280' />
                  <ThemedText style={styles.infoCardLabel}>Notes</ThemedText>
                </View>
                <ThemedText style={styles.infoCardText}>
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

const StatModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  title: string;
  data: any;
}> = ({ visible, onClose, title, data }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType='slide'
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Beautiful Header */}
          <LinearGradient
            colors={data.gradient || ['#667eea', '#764ba2']}
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
            {/* Stat Header Card */}
            <View style={styles.statHeaderCard}>
              <LinearGradient
                colors={data.gradient || ['#667eea', '#764ba2']}
                style={styles.statHeaderGradient}
              >
                <Ionicons name={data.icon as any} size={32} color='#fff' />
                <ThemedText style={styles.statHeaderValue}>
                  {data.value}
                </ThemedText>
                <ThemedText style={styles.statHeaderTitle}>
                  {data.title}
                </ThemedText>
              </LinearGradient>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsCard}>
              <View style={styles.actionsCardHeader}>
                <Ionicons name='flash' size={20} color='#6b7280' />
                <ThemedText style={styles.actionsCardLabel}>
                  Quick Actions
                </ThemedText>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name='eye' size={16} color='#667eea' />
                  <ThemedText style={styles.actionButtonText}>
                    View Details
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name='create' size={16} color='#667eea' />
                  <ThemedText style={styles.actionButtonText}>Edit</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Description */}
            {data.details?.description && (
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <Ionicons name='document-text' size={20} color='#6b7280' />
                  <ThemedText style={styles.infoCardLabel}>
                    Description
                  </ThemedText>
                </View>
                <ThemedText style={styles.infoCardText}>
                  {data.details.description}
                </ThemedText>
              </View>
            )}

            {/* Notes */}
            {data.details?.notes && (
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <Ionicons name='chatbubble' size={20} color='#6b7280' />
                  <ThemedText style={styles.infoCardLabel}>Notes</ThemedText>
                </View>
                <ThemedText style={styles.infoCardText}>
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

const TrendModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  title: string;
  data: any;
}> = ({ visible, onClose, title, data }) => {
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

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType='slide'
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Beautiful Header */}
          <LinearGradient
            colors={['#43e97b', '#38f9d7']}
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
            {/* Period Information */}
            <View style={styles.periodCard}>
              <View style={styles.periodCardHeader}>
                <Ionicons name='calendar' size={24} color='#667eea' />
                <ThemedText style={styles.periodCardLabel}>Period</ThemedText>
              </View>
              <ThemedText style={styles.periodCardValue}>
                {data.date}
              </ThemedText>
            </View>

            {/* Current Value */}
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

            {/* Trend Analysis */}
            <View style={styles.trendCard}>
              <View style={styles.trendCardHeader}>
                <Ionicons
                  name='trending-up'
                  size={20}
                  color={getTrendColor(data.trend)}
                />
                <ThemedText style={styles.trendCardLabel}>
                  Trend Analysis
                </ThemedText>
              </View>
              <View style={styles.trendContent}>
                <ThemedText
                  style={[
                    styles.trendText,
                    { color: getTrendColor(data.trend) },
                  ]}
                >
                  {data.trend === 'up'
                    ? 'Increasing'
                    : data.trend === 'down'
                    ? 'Decreasing'
                    : 'Stable'}
                </ThemedText>
              </View>
            </View>

            {/* Forecast */}
            {data.forecast && (
              <View style={styles.forecastCard}>
                <View style={styles.forecastCardHeader}>
                  <Ionicons name='time' size={20} color='#f59e0b' />
                  <ThemedText style={styles.forecastCardLabel}>
                    Forecast
                  </ThemedText>
                </View>
                <ThemedText style={styles.forecastValue}>
                  {formatValue(data.forecast)}
                </ThemedText>
                <ThemedText style={styles.forecastNote}>
                  Predicted for next period
                </ThemedText>
              </View>
            )}

            {/* Historical Comparison */}
            <View style={styles.historicalCard}>
              <View style={styles.historicalCardHeader}>
                <Ionicons name='time' size={20} color='#6b7280' />
                <ThemedText style={styles.historicalCardLabel}>
                  Historical Context
                </ThemedText>
              </View>
              <ThemedText style={styles.historicalCardText}>
                This data point represents the revenue for {data.date}.
                {data.trend === 'up'
                  ? ' Showing positive growth trend.'
                  : data.trend === 'down'
                  ? ' Showing declining trend.'
                  : ' Showing stable performance.'}
              </ThemedText>
            </View>

            {/* Notes */}
            {data.details?.notes && (
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <Ionicons name='chatbubble' size={20} color='#6b7280' />
                  <ThemedText style={styles.infoCardLabel}>Notes</ThemedText>
                </View>
                <ThemedText style={styles.infoCardText}>
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

// Enhanced BarChart with forecasting and interactivity
export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  height = 200,
  showForecast = true,
  showTrend = true,
  onBarPress,
}) => {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const maxValue = Math.max(
    ...data.map(item => Math.max(item.value || 0, item.forecast || 0))
  );

  // Responsive bar width calculation with better overflow handling
  const availableWidth = Math.min(screenWidth - 80, 320);
  const barWidth = Math.max(
    24,
    Math.min(40, availableWidth / data.length - 10)
  );
  const barSpacing = 10;
  const labelArea = 90; // Increased label area for better readability
  const barAreaHeight = height - labelArea - 40;

  const handleBarPress = (item: ChartData, index: number) => {
    setSelectedIndex(selectedIndex === index ? null : index);

    // Navigate to detail page with data
    router.push({
      pathname: '/bar-details',
      params: {
        label: item.label,
        value: item.value.toString(),
        forecast: item.forecast?.toString() || '0',
        trend: item.trend || 'stable',
        color: item.color,
        description: item.details?.description || '',
        notes: item.details?.notes || '',
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
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <ThemedText style={styles.chartTitle} numberOfLines={1}>
          {title}
        </ThemedText>
      </View>

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
        {data.map((item, index) => (
          <Pressable
            key={index}
            style={[
              styles.barItem,
              {
                width: barWidth,
                marginHorizontal: barSpacing / 2,
                height: barAreaHeight,
                justifyContent: 'flex-end',
                opacity:
                  selectedIndex === null || selectedIndex === index ? 1 : 0.7,
              },
            ]}
            onPress={() => handleBarPress(item, index)}
          >
            {/* Forecast bar (if available) */}
            {showForecast && item.forecast && (
              <View
                style={[
                  styles.forecastBar,
                  {
                    height: (item.forecast / maxValue) * barAreaHeight,
                    backgroundColor: '#f59e0b',
                    opacity: 0.4,
                  },
                ]}
              />
            )}

            {/* Main bar with gradient */}
            <LinearGradient
              colors={item.gradient}
              style={[
                styles.mainBar,
                {
                  height: (item.value / maxValue) * barAreaHeight,
                  width: barWidth - 6,
                  transform: [{ scale: selectedIndex === index ? 1.05 : 1 }],
                },
              ]}
            />

            {/* Trend indicator */}
            {showTrend && item.trend && (
              <View style={styles.trendContainer}>
                <Ionicons
                  name={getTrendIcon(item.trend) as any}
                  size={12}
                  color={getTrendColor(item.trend)}
                />
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {/* Labels with better overflow handling */}
      <View style={styles.labelsContainer}>
        {data.map((item, index) => (
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
              {item.label}
            </ThemedText>
            <ThemedText
              style={[
                styles.barValue,
                {
                  color: selectedIndex === index ? item.color : '#1f2937',
                  fontWeight: selectedIndex === index ? 'bold' : '600',
                  fontSize: 11,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
            >
              {typeof item.value === 'number' && !isNaN(item.value)
                ? item.value.toLocaleString()
                : '0'}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
};

// Enhanced LineChart with forecasting and trend analysis
export const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  color = '#667eea',
  showForecast = true,
  showTrend = true,
  onPointPress,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);

  const allValues = data.flatMap(item => [item.value || 0, item.forecast || 0]);
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 0;
  const minValue = allValues.length > 0 ? Math.min(...allValues) : 0;
  const range = maxValue - minValue || 1; // Prevent division by zero

  // Calculate trend
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

  const trend = calculateTrend(data.map(item => item.value || 0));

  const handlePointPress = (item: any, index: number) => {
    setSelectedIndex(selectedIndex === index ? null : index);
    setSelectedData(item);
    setDetailModalVisible(true);
    onPointPress?.(item, index);
  };

  // Enhanced chart dimensions
  const chartWidth = Math.min(screenWidth - 80, 320);
  const chartHeight = 160;
  const padding = 20;

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <ThemedText style={styles.chartTitle} numberOfLines={1}>
          {title}
        </ThemedText>
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
                  ? '#10b981'
                  : trend === 'down'
                  ? '#ef4444'
                  : '#6b7280'
              }
            />
            <ThemedText style={styles.trendText} numberOfLines={1}>
              {trend === 'up'
                ? 'Increasing'
                : trend === 'down'
                ? 'Decreasing'
                : 'Stable'}
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.lineChartContainer}>
        <View
          style={[styles.lineChart, { width: chartWidth, height: chartHeight }]}
        >
          {/* Background grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <View
              key={`grid-${i}`}
              style={[
                styles.gridLine,
                {
                  top: (i / 4) * (chartHeight - padding * 2) + padding,
                },
              ]}
            />
          ))}

          {/* Gradient background area */}
          <LinearGradient
            colors={[`${color}20`, `${color}05`, 'transparent']}
            style={[
              styles.gradientArea,
              {
                width: chartWidth - padding * 2,
                height: chartHeight - padding * 2,
                top: padding,
                left: padding,
              },
            ]}
          />

          {/* Draw connecting lines with gradient */}
          {data.map((item, index) => {
            if (index === 0) return null;

            const prevY =
              ((maxValue - data[index - 1].value) / range) *
                (chartHeight - padding * 2) +
              padding;
            const currentY =
              ((maxValue - item.value) / range) * (chartHeight - padding * 2) +
              padding;
            const prevX =
              ((index - 1) / (data.length - 1)) * (chartWidth - padding * 2) +
              padding;
            const currentX =
              (index / (data.length - 1)) * (chartWidth - padding * 2) +
              padding;

            const lineLength = Math.sqrt(
              Math.pow(currentX - prevX, 2) + Math.pow(currentY - prevY, 2)
            );
            const angle = Math.atan2(currentY - prevY, currentX - prevX);

            return (
              <View
                key={`line-${index}`}
                style={[
                  styles.connectingLine,
                  {
                    width: lineLength,
                    height: 4,
                    backgroundColor: color,
                    position: 'absolute',
                    left: prevX,
                    top: prevY - 2,
                    transform: [{ rotate: `${angle}rad` }],
                    transformOrigin: '0 0',
                    shadowColor: color,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  },
                ]}
              />
            );
          })}

          {/* Draw points with enhanced styling */}
          {data.map((item, index) => {
            const y =
              ((maxValue - item.value) / range) * (chartHeight - padding * 2) +
              padding;
            const x =
              (index / (data.length - 1)) * (chartWidth - padding * 2) +
              padding;
            const isSelected = selectedIndex === index;

            return (
              <Pressable
                key={index}
                style={[
                  styles.linePoint,
                  {
                    left: x - 12,
                    top: y - 12,
                  },
                ]}
                onPress={() => handlePointPress(item, index)}
              >
                {/* Point glow effect */}
                <View
                  style={[
                    styles.pointGlow,
                    {
                      backgroundColor: color,
                      opacity: isSelected ? 0.3 : 0.1,
                    },
                  ]}
                />

                {/* Main point */}
                <View
                  style={[
                    styles.point,
                    {
                      backgroundColor: isSelected ? color : '#fff',
                      borderColor: color,
                      borderWidth: isSelected ? 4 : 3,
                      width: isSelected ? 20 : 16,
                      height: isSelected ? 20 : 16,
                      borderRadius: isSelected ? 10 : 8,
                      shadowColor: color,
                      shadowOffset: { width: 0, height: isSelected ? 4 : 2 },
                      shadowOpacity: isSelected ? 0.4 : 0.2,
                      shadowRadius: isSelected ? 6 : 4,
                      elevation: isSelected ? 4 : 2,
                    },
                  ]}
                />

                {/* Value label with enhanced styling */}
                <View
                  style={[
                    styles.pointValueContainer,
                    {
                      opacity: isSelected ? 1 : 0.8,
                      transform: [{ scale: isSelected ? 1.1 : 1 }],
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.pointValue,
                      {
                        color: isSelected ? color : '#6b7280',
                        fontSize: isSelected ? 12 : 11,
                        fontWeight: isSelected ? 'bold' : '600',
                      },
                    ]}
                  >
                    {typeof item.value === 'number' && !isNaN(item.value)
                      ? item.value.toLocaleString()
                      : '0'}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}

          {/* Forecast line (if available) */}
          {showForecast && data.some(item => item.forecast) && (
            <>
              {/* Forecast connecting lines */}
              {data.map((item, index) => {
                if (index === 0 || !item.forecast) return null;

                const prevY =
                  ((maxValue -
                    (data[index - 1].forecast || data[index - 1].value)) /
                    range) *
                    (chartHeight - padding * 2) +
                  padding;
                const currentY =
                  ((maxValue - item.forecast) / range) *
                    (chartHeight - padding * 2) +
                  padding;
                const prevX =
                  ((index - 1) / (data.length - 1)) *
                    (chartWidth - padding * 2) +
                  padding;
                const currentX =
                  (index / (data.length - 1)) * (chartWidth - padding * 2) +
                  padding;

                const lineLength = Math.sqrt(
                  Math.pow(currentX - prevX, 2) + Math.pow(currentY - prevY, 2)
                );
                const angle = Math.atan2(currentY - prevY, currentX - prevX);

                return (
                  <View
                    key={`forecast-line-${index}`}
                    style={[
                      styles.connectingLine,
                      {
                        width: lineLength,
                        height: 2,
                        backgroundColor: '#f59e0b',
                        position: 'absolute',
                        left: prevX,
                        top: prevY - 1,
                        transform: [{ rotate: `${angle}rad` }],
                        transformOrigin: '0 0',
                        opacity: 0.6,
                        borderStyle: 'dashed',
                      },
                    ]}
                  />
                );
              })}

              {/* Forecast points */}
              {data.map((item, index) => {
                if (!item.forecast) return null;

                const y =
                  ((maxValue - item.forecast) / range) *
                    (chartHeight - padding * 2) +
                  padding;
                const x =
                  (index / (data.length - 1)) * (chartWidth - padding * 2) +
                  padding;

                return (
                  <View
                    key={`forecast-point-${index}`}
                    style={[
                      styles.forecastPoint,
                      {
                        left: x - 4,
                        top: y - 4,
                        backgroundColor: '#f59e0b',
                        opacity: 0.6,
                      },
                    ]}
                  />
                );
              })}
            </>
          )}
        </View>
      </View>

      {/* Enhanced X-axis labels */}
      <View style={styles.lineLabels}>
        {data.map((item, index) => (
          <View key={index} style={styles.labelItem}>
            <ThemedText style={styles.lineLabel} numberOfLines={1}>
              {item.date}
            </ThemedText>
          </View>
        ))}
      </View>

      {/* Y-axis value indicators */}
      <View style={styles.yAxisLabels}>
        {[
          maxValue,
          maxValue * 0.75,
          maxValue * 0.5,
          maxValue * 0.25,
          minValue,
        ].map((value, index) => (
          <ThemedText key={index} style={styles.yAxisLabel}>
            ৳
            {typeof value === 'number' && !isNaN(value)
              ? Math.round(value).toLocaleString()
              : '0'}
          </ThemedText>
        ))}
      </View>

      {/* Detail Modal */}
      <TrendModal
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        title={selectedData?.date || 'Line Point Details'}
        data={selectedData || {}}
      />
    </View>
  );
};

// Enhanced PieChart with interactivity and forecasting
export const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  showForecast = true,
  onSlicePress,
}) => {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);

  const handleSlicePress = (item: ChartData, index: number) => {
    setSelectedIndex(selectedIndex === index ? null : index);

    // Navigate to pie detail page with data
    router.push({
      pathname: '/pie-details',
      params: {
        label: item.label,
        value: item.value.toString(),
        forecast: item.forecast?.toString() || '0',
        color: item.color,
        total: total.toString(),
        description: item.details?.description || '',
        notes: item.details?.notes || '',
      },
    });

    onSlicePress?.(item, index);
  };

  return (
    <View style={styles.chartContainer}>
      <ThemedText style={styles.chartTitle} numberOfLines={1}>
        {title}
      </ThemedText>
      <View style={styles.pieChartContainer}>
        <View style={styles.pieChart}>
          {data.map((item, index) => {
            const percentage =
              total > 0 ? ((item.value || 0) / total) * 100 : 0;
            const angle = (percentage / 100) * 360;
            const isSelected = selectedIndex === index;

            return (
              <Pressable
                key={index}
                style={[
                  styles.pieSlice,
                  {
                    transform: [
                      { rotate: `${index * 90}deg` },
                      { scale: isSelected ? 1.1 : 1 },
                    ],
                  },
                ]}
                onPress={() => handleSlicePress(item, index)}
              >
                <LinearGradient
                  colors={item.gradient}
                  style={[
                    styles.slice,
                    {
                      borderRadius: 60,
                      opacity: isSelected ? 1 : 0.8,
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.pieLegend}>
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const isSelected = selectedIndex === index;

            return (
              <Pressable
                key={index}
                style={[styles.legendItem, { opacity: isSelected ? 1 : 0.7 }]}
                onPress={() => handleSlicePress(item, index)}
              >
                <View
                  style={[styles.legendColor, { backgroundColor: item.color }]}
                />
                <ThemedText style={styles.legendText} numberOfLines={1}>
                  {item.label}
                </ThemedText>
                <ThemedText style={styles.legendValue}>
                  {percentage.toFixed(1)}%
                </ThemedText>
                {showForecast && item.forecast && (
                  <ThemedText style={styles.legendForecast} numberOfLines={1}>
                    ({item.forecast})
                  </ThemedText>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

// Swappable LineChart for monthly trend (one point per month)
export const SwappableLineChart: React.FC<SwappableLineChartProps> = ({
  monthlyRevenue,
  title,
  color = '#667eea',
  showForecast = true,
  showTrend = true,
  onPointPress,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);

  // Prepare data: one point per month with enhanced details
  // Handle different data structures from API
  const chartData = (monthlyRevenue || [])
    .map(m => {
      // Handle API response structure: { date: string, value: number, forecast?: number }
      if (m && m.date && typeof m.value === 'number' && !isNaN(m.value)) {
        return {
          date: m.date,
          value: m.value,
          forecast: m.forecast || Math.round(m.value * 1.05), // 5% growth forecast
          budget: Math.round(m.value * 1.1), // 10% budget target
          ...(m.details ? { details: m.details } : {}),
        };
      }
      // Handle legacy structure: { month: string, revenue: number }
      else if (
        m &&
        m.month &&
        typeof m.revenue === 'number' &&
        !isNaN(m.revenue)
      ) {
        return {
          date: m.month,
          value: m.revenue,
          forecast: Math.round(m.revenue * 1.05), // 5% growth forecast
          budget: Math.round(m.revenue * 1.1), // 10% budget target
          ...(m.details ? { details: m.details } : {}),
        };
      }
      // Fallback for any other structure
      else {
        const safeValue =
          m && (m.value || m.revenue) ? Number(m.value || m.revenue) : 0;
        return {
          date: m && (m.date || m.month) ? m.date || m.month : 'Unknown',
          value: !isNaN(safeValue) ? safeValue : 0,
          forecast: Math.round((!isNaN(safeValue) ? safeValue : 0) * 1.05),
          budget: Math.round((!isNaN(safeValue) ? safeValue : 0) * 1.1),
          ...(m && m.details ? { details: m.details } : {}),
        };
      }
    })
    .filter(item => item.value !== undefined && item.value !== null); // Filter out invalid items

  // Responsive chart width with better overflow handling
  const chartWidth = Math.max(Math.min(screenWidth - 48, 500), 280);
  const chartHeight = 180;
  const padding = 20;

  const allValues = chartData.flatMap(item => [
    item.value || 0,
    item.forecast || 0,
    item.budget || 0,
  ]);
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 0;
  const minValue = allValues.length > 0 ? Math.min(...allValues) : 0;
  const range = maxValue - minValue || 1; // Prevent division by zero

  // Calculate trend with enhanced analysis
  const calculateTrend = (values: number[]) => {
    if (values.length < 2) return 'stable';
    const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
    if (validValues.length < 2) return 'stable';

    const firstHalf = validValues.slice(0, Math.ceil(validValues.length / 2));
    const secondHalf = validValues.slice(Math.ceil(validValues.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    if (secondAvg > firstAvg * 1.1) return 'up';
    if (secondAvg < firstAvg * 0.9) return 'down';
    return 'stable';
  };
  const trend = calculateTrend(chartData.map(item => item.value || 0));

  // Calculate performance metrics with safe handling
  const totalRevenue = chartData.reduce(
    (sum, item) => sum + (item.value || 0),
    0
  );
  const averageRevenue =
    chartData.length > 0 ? totalRevenue / chartData.length : 0;
  const growthRate =
    chartData.length > 1 && chartData[0].value > 0
      ? ((chartData[chartData.length - 1].value - chartData[0].value) /
          chartData[0].value) *
        100
      : 0;

  const handlePointPress = (item: any, index: number) => {
    setSelectedIndex(selectedIndex === index ? null : index);
    setSelectedData(item);
    setDetailModalVisible(true);
    onPointPress?.(item, index);
  };

  // Don't render if no valid data
  if (!chartData || chartData.length === 0) {
    return (
      <View style={[styles.chartContainer, { width: '100%' }]}>
        <View style={styles.chartHeader}>
          <ThemedText style={styles.chartTitle} numberOfLines={1}>
            {title}
          </ThemedText>
        </View>
        <View style={styles.performanceSummary}>
          <ThemedText style={styles.summaryValue}>No data available</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.chartContainer, { width: '100%' }]}>
      <View style={styles.chartHeader}>
        <ThemedText style={styles.chartTitle} numberOfLines={1}>
          {title}
        </ThemedText>
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
                  ? '#10b981'
                  : trend === 'down'
                  ? '#ef4444'
                  : '#6b7280'
              }
            />
            <ThemedText style={styles.trendText} numberOfLines={1}>
              {trend === 'up'
                ? 'Increasing'
                : trend === 'down'
                ? 'Decreasing'
                : 'Stable'}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Performance Summary */}
      <View style={styles.performanceSummary}>
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryLabel}>Total Revenue</ThemedText>
          <ThemedText style={styles.summaryValue}>
            ৳
            {typeof totalRevenue === 'number' && !isNaN(totalRevenue)
              ? totalRevenue.toLocaleString()
              : '0'}
          </ThemedText>
        </View>
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryLabel}>Avg/Month</ThemedText>
          <ThemedText style={styles.summaryValue}>
            ৳
            {typeof averageRevenue === 'number' && !isNaN(averageRevenue)
              ? Math.round(averageRevenue).toLocaleString()
              : '0'}
          </ThemedText>
        </View>
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryLabel}>Growth</ThemedText>
          <ThemedText
            style={[
              styles.summaryValue,
              { color: growthRate >= 0 ? '#10b981' : '#ef4444' },
            ]}
          >
            {growthRate >= 0 ? '+' : ''}
            {typeof growthRate === 'number' && !isNaN(growthRate)
              ? Math.round(growthRate)
              : 0}
            %
          </ThemedText>
        </View>
      </View>

      <View style={{ width: '100%', alignItems: 'center' }}>
        <View
          style={[styles.lineChart, { width: chartWidth, height: chartHeight }]}
        >
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <View
              key={`grid-${i}`}
              style={[
                styles.gridLine,
                {
                  top: (i / 4) * (chartHeight - padding * 2) + padding,
                  width: chartWidth - padding * 2,
                  left: padding,
                },
              ]}
            />
          ))}

          {/* Budget line */}
          {showForecast && (
            <>
              {chartData.map((item, index) => {
                if (index === 0) return null;
                const prevY =
                  ((maxValue - chartData[index - 1].budget) / range) *
                    (chartHeight - padding * 2) +
                  padding;
                const currentY =
                  ((maxValue - item.budget) / range) *
                    (chartHeight - padding * 2) +
                  padding;
                const prevX =
                  ((index - 1) / (chartData.length - 1)) *
                    (chartWidth - padding * 2) +
                  padding;
                const currentX =
                  (index / (chartData.length - 1)) *
                    (chartWidth - padding * 2) +
                  padding;
                const lineLength = Math.sqrt(
                  Math.pow(currentX - prevX, 2) + Math.pow(currentY - prevY, 2)
                );
                const angle = Math.atan2(currentY - prevY, currentX - prevX);
                return (
                  <View
                    key={`budget-line-${index}`}
                    style={[
                      styles.connectingLine,
                      {
                        width: lineLength,
                        height: 2,
                        backgroundColor: '#f59e0b',
                        position: 'absolute',
                        left: prevX,
                        top: prevY - 1,
                        transform: [{ rotate: `${angle}rad` }],
                        transformOrigin: '0 0',
                        opacity: 0.6,
                        borderStyle: 'dashed',
                      },
                    ]}
                  />
                );
              })}
            </>
          )}

          {/* Connecting lines */}
          {chartData.map((item, index) => {
            if (index === 0) return null;
            const prevY =
              ((maxValue - chartData[index - 1].value) / range) *
                (chartHeight - padding * 2) +
              padding;
            const currentY =
              ((maxValue - item.value) / range) * (chartHeight - padding * 2) +
              padding;
            const prevX =
              ((index - 1) / (chartData.length - 1)) *
                (chartWidth - padding * 2) +
              padding;
            const currentX =
              (index / (chartData.length - 1)) * (chartWidth - padding * 2) +
              padding;
            const lineLength = Math.sqrt(
              Math.pow(currentX - prevX, 2) + Math.pow(currentY - prevY, 2)
            );
            const angle = Math.atan2(currentY - prevY, currentX - prevX);
            return (
              <View
                key={`line-${index}`}
                style={[
                  styles.connectingLine,
                  {
                    width: lineLength,
                    height: 4,
                    backgroundColor: color,
                    position: 'absolute',
                    left: prevX,
                    top: prevY - 2,
                    transform: [{ rotate: `${angle}rad` }],
                    transformOrigin: '0 0',
                    shadowColor: color,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  },
                ]}
              />
            );
          })}

          {/* Points */}
          {chartData.map((item, index) => {
            const y =
              ((maxValue - item.value) / range) * (chartHeight - padding * 2) +
              padding;
            const x =
              (index / (chartData.length - 1)) * (chartWidth - padding * 2) +
              padding;
            const isSelected = selectedIndex === index;
            return (
              <Pressable
                key={index}
                style={[
                  styles.linePoint,
                  {
                    left: x - 12,
                    top: y - 12,
                  },
                ]}
                onPress={() => handlePointPress(item, index)}
              >
                <View
                  style={[
                    styles.pointGlow,
                    {
                      backgroundColor: color,
                      opacity: isSelected ? 0.3 : 0.1,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.point,
                    {
                      backgroundColor: isSelected ? color : '#fff',
                      borderColor: color,
                      borderWidth: isSelected ? 4 : 3,
                      width: isSelected ? 20 : 16,
                      height: isSelected ? 20 : 16,
                      borderRadius: isSelected ? 10 : 8,
                      shadowColor: color,
                      shadowOffset: { width: 0, height: isSelected ? 4 : 2 },
                      shadowOpacity: isSelected ? 0.4 : 0.2,
                      shadowRadius: isSelected ? 6 : 4,
                      elevation: isSelected ? 4 : 2,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.pointLabel,
                    {
                      opacity: isSelected ? 1 : 0,
                      transform: [{ scale: isSelected ? 1 : 0.8 }],
                    },
                  ]}
                >
                  <ThemedText style={styles.pointLabelText}>
                    ৳
                    {typeof item.value === 'number' && !isNaN(item.value)
                      ? item.value.toLocaleString()
                      : '0'}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Enhanced X-axis labels with better overflow handling */}
      <View style={styles.lineLabels}>
        {chartData.map((item, index) => (
          <View key={index} style={styles.labelItem}>
            <ThemedText
              style={[styles.lineLabel, { fontSize: 10 }]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
            >
              {item.date}
            </ThemedText>
            <ThemedText
              style={[styles.lineValue, { fontSize: 9 }]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
            >
              ৳
              {typeof item.value === 'number' && !isNaN(item.value)
                ? Math.round(item.value / 1000)
                : 0}
              k
            </ThemedText>
          </View>
        ))}
      </View>

      {/* Y-axis value indicators */}
      <View style={styles.yAxisLabels}>
        {[
          maxValue,
          maxValue * 0.75,
          maxValue * 0.5,
          maxValue * 0.25,
          minValue,
        ].map((value, index) => (
          <ThemedText key={index} style={styles.yAxisLabel}>
            ৳
            {typeof value === 'number' && !isNaN(value)
              ? Math.round(value).toLocaleString()
              : '0'}
          </ThemedText>
        ))}
      </View>

      {/* Detail Modal */}
      <TrendModal
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        title={selectedData?.date || 'Revenue Details'}
        data={selectedData || {}}
      />
    </View>
  );
};

export const StatsGrid: React.FC<{
  stats: {
    title: string;
    value: string;
    icon: string;
    gradient: readonly [string, string];
    details?: any;
  }[];
}> = ({ stats }) => {
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  const isTablet = Dimensions.get('window').width >= 768;
  const isMobile = Dimensions.get('window').width < 768;

  const handleStatPress = (stat: any) => {
    setSelectedData(stat);
    setDetailModalVisible(true);
  };

  return (
    <View
      style={[
        styles.statsGrid,
        isMobile ? styles.statsGridMobile : styles.statsGridTablet,
      ]}
    >
      {stats.map((stat, index) => (
        <Pressable
          key={index}
          style={[
            styles.statCard,
            isMobile ? styles.statCardMobile : styles.statCardTablet,
          ]}
          onPress={() => handleStatPress(stat)}
        >
          <LinearGradient colors={stat.gradient} style={styles.statGradient}>
            <Ionicons
              name={stat.icon as any}
              size={isMobile ? 20 : 24}
              color='#fff'
            />
            <ThemedText
              style={[styles.statValue, isMobile && styles.statValueMobile]}
            >
              {stat.value}
            </ThemedText>
            <ThemedText
              style={[styles.statTitle, isMobile && styles.statTitleMobile]}
            >
              {stat.title}
            </ThemedText>
          </LinearGradient>
        </Pressable>
      ))}
      {/* Detail Modal */}
      <StatModal
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        title={selectedData?.title || 'Stat Details'}
        data={selectedData || {}}
      />
    </View>
  );
};

export const ProgressChart: React.FC<{
  title: string;
  current: number;
  target: number;
  color?: string;
  gradient?: readonly [string, string];
}> = ({
  title,
  current,
  target,
  color = '#667eea',
  gradient = ['#667eea', '#764ba2'],
}) => {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <ThemedText style={styles.progressTitle} numberOfLines={1}>
          {title}
        </ThemedText>
        <ThemedText style={styles.progressValue} numberOfLines={1}>
          {typeof current === 'number' && !isNaN(current) ? current : 0}/
          {typeof target === 'number' && !isNaN(target) ? target : 0}
        </ThemedText>
      </View>
      <View style={styles.progressBar}>
        <LinearGradient
          colors={gradient}
          style={[
            styles.progressFill,
            {
              width: `${
                typeof percentage === 'number' && !isNaN(percentage)
                  ? percentage
                  : 0
              }%`,
            },
          ]}
        />
      </View>
      <ThemedText style={styles.progressPercentage}>
        {typeof percentage === 'number' && !isNaN(percentage)
          ? percentage.toFixed(1)
          : '0.0'}
        %
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    padding: DESIGN_SYSTEM.spacing.lg,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
    minHeight: DESIGN_SYSTEM.cardHeight.large,
    width: '100%',
    ...DESIGN_SYSTEM.shadows.small,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: DESIGN_SYSTEM.spacing.md,
    flex: 1,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.lg,
    flexWrap: 'wrap',
    gap: DESIGN_SYSTEM.spacing.sm,
  },
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
  barContainer: {
    justifyContent: 'flex-end',
    height: 100,
    marginBottom: 8,
  },
  bar: {
    width: 24,
    borderRadius: 12,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  barValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
  },
  lineChartContainer: {
    height: 180,
    overflow: 'hidden',
    marginTop: DESIGN_SYSTEM.spacing.sm,
  },
  lineChart: {
    flex: 1,
    position: 'relative',
  },
  linePoint: {
    position: 'absolute',
    width: 12,
    height: 12,
  },
  point: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  line: {
    position: 'absolute',
    width: 3,
    height: 60,
    top: 6,
    left: 4.5,
  },
  lineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  lineLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  pieChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 140,
    gap: DESIGN_SYSTEM.spacing.md,
  },
  pieChart: {
    width: 140,
    height: 140,
    position: 'relative',
    marginRight: 20,
    flexShrink: 0,
  },
  pieSlice: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  slice: {
    width: '50%',
    height: '50%',
    borderRadius: 70,
  },
  pieLegend: {
    flex: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: DESIGN_SYSTEM.spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
    flexShrink: 0,
  },
  legendText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
    marginRight: 4,
  },
  legendValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1f2937',
    flexShrink: 0,
  },
  statsGrid: {
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  statCard: {
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    overflow: 'hidden',
    ...DESIGN_SYSTEM.shadows.medium,
  },
  statGradient: {
    padding: DESIGN_SYSTEM.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: DESIGN_SYSTEM.spacing.sm,
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  statTitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  progressContainer: {
    backgroundColor: '#fff',
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    padding: DESIGN_SYSTEM.spacing.lg,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
    minHeight: DESIGN_SYSTEM.cardHeight.small,
    ...DESIGN_SYSTEM.shadows.small,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.md,
    gap: DESIGN_SYSTEM.spacing.sm,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  progressValue: {
    fontSize: 12,
    color: '#6b7280',
    flexShrink: 0,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: DESIGN_SYSTEM.spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'right',
  },
  forecastLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_SYSTEM.spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendTextSmall: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_SYSTEM.spacing.xs,
  },
  trendText: {
    fontSize: 11,
    color: '#6b7280',
  },
  forecastLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  selectionDetails: {
    backgroundColor: '#fff',
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    padding: DESIGN_SYSTEM.spacing.md,
    marginTop: DESIGN_SYSTEM.spacing.md,
    ...DESIGN_SYSTEM.shadows.small,
  },
  selectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: DESIGN_SYSTEM.spacing.sm,
  },
  selectionValue: {
    fontSize: 12,
    color: '#6b7280',
  },
  selectionForecast: {
    fontSize: 11,
    color: '#6b7280',
  },
  forecastBar: {
    borderRadius: 10,
    minHeight: 4,
    opacity: 0.4,
    marginBottom: 2,
  },
  trendContainer: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  legendForecast: {
    fontSize: 10,
    color: '#f59e0b',
    fontStyle: 'italic',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: DESIGN_SYSTEM.spacing.lg,
    width: '100%',
    paddingHorizontal: 4,
  },
  labelItem: {
    alignItems: 'center',
    flex: 1,
  },
  labelText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 4,
  },
  mainBar: {
    borderRadius: 12,
    minHeight: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  connectingLine: {
    position: 'absolute',
    backgroundColor: '#f093fb', // Default color for connecting lines
    borderRadius: 1.5, // Half of the line thickness
  },
  pointValue: {
    position: 'absolute',
    top: -20, // Adjust position above the point
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    width: 30, // Adjust width to center text
  },
  pointGlow: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    opacity: 0.1,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pointValueContainer: {
    position: 'absolute',
    top: -25, // Adjust position above the point
    left: -15, // Adjust left position to center text
    width: 60, // Adjust width to center text
    alignItems: 'center',
  },
  gridLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  gradientArea: {
    position: 'absolute',
    borderRadius: 10,
  },
  yAxisLabels: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: 120,
    width: 30,
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'right',
  },
  forecastPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.md,
    paddingHorizontal: DESIGN_SYSTEM.spacing.sm,
  },
  monthSelectorContent: {
    alignItems: 'center',
    paddingVertical: DESIGN_SYSTEM.spacing.xs,
  },
  monthButton: {
    paddingHorizontal: DESIGN_SYSTEM.spacing.md,
    paddingVertical: DESIGN_SYSTEM.spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginHorizontal: DESIGN_SYSTEM.spacing.xs,
  },
  monthButtonText: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    width: '90%',
    maxHeight: '80%',
    ...DESIGN_SYSTEM.shadows.medium,
    elevation: 10,
  },
  modalHeaderGradient: {
    padding: DESIGN_SYSTEM.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitleWhite: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButtonWhite: {
    padding: DESIGN_SYSTEM.spacing.xs,
  },
  modalBody: {
    padding: DESIGN_SYSTEM.spacing.md,
  },
  detailSection: {
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  forecastNote: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: DESIGN_SYSTEM.spacing.xs,
  },
  detailDescription: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  detailNotes: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
  },
  detailDate: {
    fontSize: 13,
    color: '#6b7280',
  },
  pieModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.md,
    gap: DESIGN_SYSTEM.spacing.sm,
  },
  pieColorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  pieHeaderContent: {
    flex: 1,
  },
  pieCategoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  piePercentage: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statModalHeader: {
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    overflow: 'hidden',
    marginBottom: DESIGN_SYSTEM.spacing.md,
    ...DESIGN_SYSTEM.shadows.small,
  },
  statModalGradient: {
    padding: DESIGN_SYSTEM.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  statModalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: DESIGN_SYSTEM.spacing.xs,
  },
  statModalTitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: DESIGN_SYSTEM.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_SYSTEM.spacing.xs,
    paddingVertical: DESIGN_SYSTEM.spacing.xs,
    paddingHorizontal: DESIGN_SYSTEM.spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 13,
    color: '#667eea',
  },
  valueCard: {
    backgroundColor: '#f9fafb',
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    padding: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.md,
    ...DESIGN_SYSTEM.shadows.small,
    elevation: 2,
  },
  valueCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  valueCardLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: DESIGN_SYSTEM.spacing.xs,
  },
  valueCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  trendCard: {
    backgroundColor: '#f9fafb',
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    padding: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.md,
    ...DESIGN_SYSTEM.shadows.small,
    elevation: 2,
  },
  trendCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  trendCardLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: DESIGN_SYSTEM.spacing.xs,
  },
  trendContent: {
    alignItems: 'center',
  },
  forecastCard: {
    backgroundColor: '#f9fafb',
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    padding: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.md,
    ...DESIGN_SYSTEM.shadows.small,
    elevation: 2,
  },
  forecastCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  forecastCardLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: DESIGN_SYSTEM.spacing.xs,
  },
  forecastValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    padding: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.md,
    ...DESIGN_SYSTEM.shadows.small,
    elevation: 2,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  infoCardLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: DESIGN_SYSTEM.spacing.xs,
  },
  infoCardText: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
  },
  breakdownCard: {
    backgroundColor: '#f9fafb',
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    padding: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.md,
    ...DESIGN_SYSTEM.shadows.small,
    elevation: 2,
  },
  breakdownCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  breakdownCardLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: DESIGN_SYSTEM.spacing.xs,
  },
  dateCard: {
    backgroundColor: '#f9fafb',
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    padding: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.md,
    ...DESIGN_SYSTEM.shadows.small,
    elevation: 2,
  },
  dateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  dateCardLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: DESIGN_SYSTEM.spacing.xs,
  },
  dateCardText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  historicalCard: {
    backgroundColor: '#f9fafb',
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    padding: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.md,
    ...DESIGN_SYSTEM.shadows.small,
    elevation: 2,
  },
  historicalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  historicalCardLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: DESIGN_SYSTEM.spacing.xs,
  },
  historicalCardText: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
  },
  statHeaderCard: {
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    overflow: 'hidden',
    marginBottom: DESIGN_SYSTEM.spacing.md,
    ...DESIGN_SYSTEM.shadows.small,
  },
  statHeaderGradient: {
    padding: DESIGN_SYSTEM.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  statHeaderValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: DESIGN_SYSTEM.spacing.xs,
  },
  statHeaderTitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  actionsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    padding: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.md,
    ...DESIGN_SYSTEM.shadows.small,
    elevation: 2,
  },
  actionsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  actionsCardLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: DESIGN_SYSTEM.spacing.xs,
  },
  totalCard: {
    backgroundColor: '#f9fafb',
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    padding: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.md,
    ...DESIGN_SYSTEM.shadows.small,
    elevation: 2,
  },
  totalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  totalCardLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: DESIGN_SYSTEM.spacing.xs,
  },
  totalCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  categoryCard: {
    backgroundColor: '#f9fafb',
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    padding: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.md,
    ...DESIGN_SYSTEM.shadows.small,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_SYSTEM.spacing.sm,
  },
  categoryColorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  periodCard: {
    backgroundColor: '#f9fafb',
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    padding: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.md,
    ...DESIGN_SYSTEM.shadows.small,
    elevation: 2,
  },
  periodCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  periodCardLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: DESIGN_SYSTEM.spacing.xs,
  },
  periodCardValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  performanceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  pointLabel: {
    position: 'absolute',
    top: -25, // Adjust position above the point
    left: -15, // Adjust left position to center text
    width: 60, // Adjust width to center text
    alignItems: 'center',
  },
  pointLabelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  lineValue: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statsGridMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: DESIGN_SYSTEM.spacing.md,
  },
  statCardMobile: {
    width: '48%',
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    overflow: 'hidden',
    height: DESIGN_SYSTEM.cardHeight.medium,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  statValueMobile: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: DESIGN_SYSTEM.spacing.sm,
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  statTitleMobile: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  statsGridTablet: {
    flexDirection: 'row',
    gap: DESIGN_SYSTEM.spacing.md,
  },
  statCardTablet: {
    flex: 1,
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    overflow: 'hidden',
    height: DESIGN_SYSTEM.cardHeight.medium,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  statValueTablet: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: DESIGN_SYSTEM.spacing.sm,
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  statTitleTablet: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
});
