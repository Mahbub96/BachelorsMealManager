import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
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
      <ActivityIndicator size={size} color={theme.primary} />
      {showMessage && (
        <ThemedText
          style={[styles.loadingText, { color: theme.text.secondary }]}
        >
          {message}
        </ThemedText>
      )}
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
