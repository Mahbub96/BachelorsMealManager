import { InteractionManager } from 'react-native';
import { View } from 'react-native';
import React from 'react';

/**
 * Performance Optimization Utilities
 * Implements React Native best practices for performance
 */

/**
 * Debounce function to limit function calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(
      () => func(...args),
      wait
    ) as unknown as NodeJS.Timeout;
  };
};

/**
 * Throttle function to limit function execution rate
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Memoization utility for expensive calculations
 */
export const memoize = <T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

/**
 * Lazy loading utility for components
 */
export const lazyLoad = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
): React.ComponentType<any> => {
  const LazyComponent = React.lazy(importFunc);

  if (fallback) {
    const SuspenseWrapper = () =>
      React.createElement(
        React.Suspense,
        { fallback: React.createElement(fallback) },
        React.createElement(LazyComponent)
      );
    return SuspenseWrapper;
  }

  return LazyComponent as React.ComponentType<any>;
};

/**
 * Interaction manager utility for heavy operations
 */
export const runAfterInteractions = (
  task: () => void | Promise<void>
): void => {
  InteractionManager.runAfterInteractions(() => {
    task();
  });
};

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private marks: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing an operation
   */
  startTimer(name: string): void {
    this.marks.set(name, performance.now());
  }

  /**
   * End timing an operation
   */
  endTimer(name: string): number {
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`Timer '${name}' was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(name);

    // Store metric
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);

    // Keep only last 100 measurements
    const measurements = this.metrics.get(name)!;
    if (measurements.length > 100) {
      measurements.splice(0, measurements.length - 100);
    }

    return duration;
  }

  /**
   * Get performance statistics for a metric
   */
  getStats(name: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    median: number;
  } | null {
    const measurements = this.metrics.get(name);
    if (!measurements || measurements.length === 0) {
      return null;
    }

    const sorted = [...measurements].sort((a, b) => a - b);
    const count = measurements.length;
    const average = measurements.reduce((sum, val) => sum + val, 0) / count;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted[Math.floor(sorted.length / 2)];

    return { count, average, min, max, median };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.marks.clear();
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, number[]> {
    return new Map(this.metrics);
  }
}

/**
 * Image optimization utility
 */
export const optimizeImage = (
  uri: string,
  width: number,
  height: number
): string => {
  // Add image optimization parameters
  const params = new URLSearchParams({
    w: width.toString(),
    h: height.toString(),
    q: '80', // Quality
    fm: 'webp', // Format
  });

  return `${uri}?${params.toString()}`;
};

/**
 * List optimization for FlatList and ScrollView
 */
export const optimizeList = {
  /**
   * Get optimized key extractor
   */
  keyExtractor: (item: any, index: number): string => {
    return item.id || item._id || index.toString();
  },

  /**
   * Get optimized getItemLayout for fixed height items
   */
  getItemLayout: (data: any[], itemHeight: number) => {
    return (index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    });
  },

  /**
   * Optimized render item wrapper
   */
  renderItem: <T>(
    renderItem: (item: T, index: number) => React.ReactElement
  ) => {
    return ({ item, index }: { item: T; index: number }) => {
      return renderItem(item, index);
    };
  },
};

/**
 * Memory management utility
 */
export class MemoryManager {
  private static instance: MemoryManager;
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.setupMemoryWarningListener();
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Setup memory warning listener
   */
  private setupMemoryWarningListener(): void {
    // In a real app, you would listen to memory warnings
    // and clear caches, images, etc.
    console.log('Memory warning listener setup');
  }

  /**
   * Add memory cleanup listener
   */
  addCleanupListener(listener: () => void): void {
    this.listeners.add(listener);
  }

  /**
   * Remove memory cleanup listener
   */
  removeCleanupListener(listener: () => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Trigger memory cleanup
   */
  cleanup(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Memory cleanup error:', error);
      }
    });
  }
}

/**
 * Network optimization utility
 */
export class NetworkOptimizer {
  private static instance: NetworkOptimizer;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;

  private constructor() {}

  static getInstance(): NetworkOptimizer {
    if (!NetworkOptimizer.instance) {
      NetworkOptimizer.instance = new NetworkOptimizer();
    }
    return NetworkOptimizer.instance;
  }

  /**
   * Queue a network request
   */
  async queueRequest<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  /**
   * Process the request queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        await request();
        // Add delay between requests to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    this.isProcessing = false;
  }

  /**
   * Clear the request queue
   */
  clearQueue(): void {
    this.requestQueue = [];
  }
}

// Export singleton instances
export const performanceMonitor = PerformanceMonitor.getInstance();
export const memoryManager = MemoryManager.getInstance();
export const networkOptimizer = NetworkOptimizer.getInstance();
