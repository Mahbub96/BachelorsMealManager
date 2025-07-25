/**
 * Modern Charts - Modular Chart Components
 *
 * This file provides a clean interface to all chart components.
 * Each chart component is modular, reusable, and follows theme best practices.
 */

// Re-export all chart components for convenience
export {
  BaseChart,
  BarChart,
  LineChart,
  PieChart,
  StatsGrid,
  SwappableLineChart,
  ChartContainer,
  DataModal,
} from './charts';

// Re-export all types
export type {
  BaseChartProps,
  BarChartProps,
  ChartData,
  LineChartProps,
  LineChartData,
  PieChartProps,
  PieChartData,
  StatsGridProps,
  StatItem,
  SwappableLineChartProps,
  SwappableLineChartData,
} from './charts';

// Legacy exports for backward compatibility
// All chart components are now available as named exports
