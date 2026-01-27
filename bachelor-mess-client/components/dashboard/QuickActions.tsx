import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

export interface ActionItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  onPress: () => void;
}

interface QuickActionsProps {
  actions: ActionItem[];
  title?: string;
  subtitle?: string;
  isSmallScreen?: boolean;
  columns?: 2 | 3 | 4;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  title = 'Quick Actions',
  subtitle = 'Manage your mess efficiently',
  isSmallScreen = false,
  columns = 2,
}) => {
  const { theme } = useTheme();
  const getGridStyle = () => {
    const containerPadding = 32; // Account for container padding (16 on each side)
    const availableWidth = screenWidth - containerPadding;
    const gap = isSmallScreen ? 12 : 16;
    const totalGaps = columns - 1;
    const cardWidth = (availableWidth - totalGaps * gap) / columns;

    return { width: cardWidth };
  };

  return (
    <View style={styles.container}>
      {(title || subtitle) && (
        <View style={styles.sectionHeader}>
          {title && (
            <ThemedText
              style={[
                styles.sectionTitle,
                { color: theme.text.primary },
                isSmallScreen && styles.sectionTitleSmall,
              ]}
            >
              {title}
            </ThemedText>
          )}
          {subtitle && (
            <ThemedText
              style={[
                styles.sectionSubtitle,
                { color: theme.text.secondary },
                isSmallScreen && styles.sectionSubtitleSmall,
              ]}
            >
              {subtitle}
            </ThemedText>
          )}
        </View>
      )}

      <View
        style={[styles.actionsGrid, isSmallScreen && styles.actionsGridSmall]}
      >
        {(actions || []).map(action => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.actionCard,
              getGridStyle(),
              isSmallScreen && styles.actionCardSmall,
            ]}
            onPress={action.onPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[action.color, `${action.color}dd`]}
              style={styles.actionGradient}
            >
              <View
                style={[
                  styles.actionIconContainer,
                  isSmallScreen && styles.actionIconContainerSmall,
                ]}
              >
                <Ionicons
                  name={action.icon as IconName}
                  size={isSmallScreen ? 24 : 28}
                  color={theme.text.inverse}
                />
              </View>
              <View style={styles.actionContent}>
                <ThemedText
                  style={[
                    styles.actionTitle,
                    isSmallScreen && styles.actionTitleSmall,
                  ]}
                >
                  {action.title}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.actionSubtitle,
                    isSmallScreen && styles.actionSubtitleSmall,
                  ]}
                >
                  {action.subtitle}
                </ThemedText>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionTitleSmall: {
    fontSize: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
  },
  sectionSubtitleSmall: {
    fontSize: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  actionsGridSmall: {
    gap: 12,
  },
  actionCard: {
    aspectRatio: 1.2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionCardSmall: {
    aspectRatio: 1.5,
    borderRadius: 12,
  },
  actionGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIconContainerSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  actionContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  actionTitleSmall: {
    fontSize: 14,
  },
  actionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
  },
  actionSubtitleSmall: {
    fontSize: 10,
    lineHeight: 14,
  },
});
