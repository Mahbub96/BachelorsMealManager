import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';

interface BazarHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
}

export const BazarHeader: React.FC<BazarHeaderProps> = ({
  title = 'Bazar Management',
  subtitle = 'Track shopping expenses and manage bazar entries',
  showBackButton = false,
  onBackPress,
  rightComponent,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: theme.background }]}>
      <View style={styles.headerContent}>
        <View style={styles.titleContainer}>
          <ThemedText style={[styles.title, { color: theme.text.primary }]}>
            {title}
          </ThemedText>
          <ThemedText
            style={[styles.subtitle, { color: theme.text.secondary }]}
          >
            {subtitle}
          </ThemedText>
        </View>
        {rightComponent && (
          <View style={styles.rightComponent}>{rightComponent}</View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 16, // Reduced from 24
    paddingHorizontal: 2, // Reduced from 4
  },
  headerContent: {
    marginBottom: 8, // Reduced from 12
    paddingHorizontal: 2, // Reduced from 4
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24, // Reduced from 28
    fontWeight: 'bold',
    marginBottom: 3, // Reduced from 4
  },
  subtitle: {
    fontSize: 14, // Reduced from 16
    opacity: 0.7,
    lineHeight: 18, // Reduced from 20
  },
  rightComponent: {
    marginLeft: 12, // Reduced from 16
  },
});
