import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ModernLoader } from '../ui/ModernLoader';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';

interface BazarLoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  showMessage?: boolean;
}

export const BazarLoadingState: React.FC<BazarLoadingStateProps> = ({
  message = 'Loading shopping entries...',
  size = 'large',
  showMessage = true,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <ModernLoader
         size={size === 'small' ? 'small' : 'large'}
         text={showMessage ? message : undefined}
         visible={true}
         overlay={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});
