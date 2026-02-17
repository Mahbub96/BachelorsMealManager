
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ModernLoader } from './ModernLoader';

interface LoadingSpinnerProps {
  size?: 'small' | 'large'; // Keep for backward compatibility, map to ModernLoader sizes
  color?: string; // Ignored as ModernLoader uses theme
  text?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  text,
  fullScreen = false,
}) => {
  // Map 'small'/'large' to ModernLoader sizes
  const modernSize = size === 'small' ? 'small' : 'large';

  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ModernLoader size={modernSize} text={text} visible={true} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModernLoader size={modernSize} text={text} visible={true} overlay={false} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
});
