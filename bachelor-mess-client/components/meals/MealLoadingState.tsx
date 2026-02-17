import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ModernLoader } from '../ui/ModernLoader';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';

interface MealLoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
}

export const MealLoadingState: React.FC<MealLoadingStateProps> = ({
  message = 'Loading meals...',
  size = 'large',
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <ModernLoader 
        size={size === 'small' ? 'small' : 'large'} 
        text={message}
        visible={true}
        overlay={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  message: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});
