import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import uiConfigService, { NavigationTab } from '@/services/uiConfigService';
import { useTheme } from './DynamicThemeProvider';

interface DynamicNavigationProps {
  onTabPress?: (tab: NavigationTab) => void;
  activeRoute?: string;
  showIcons?: boolean;
  showLabels?: boolean;
  orientation?: 'horizontal' | 'vertical';
  style?: any;
}

export const DynamicNavigation: React.FC<DynamicNavigationProps> = ({
  onTabPress,
  activeRoute,
  showIcons = true,
  showLabels = true,
  orientation = 'horizontal',
  style,
}) => {
  const { user } = useAuth();
  const theme = useTheme();
  const [tabs, setTabs] = useState<NavigationTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNavigationTabs();
  }, [user]);

  const loadNavigationTabs = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.role) {
        setTabs([]);
        return;
      }

      const visibleTabs = await uiConfigService.getVisibleTabs(user.role);
      setTabs(visibleTabs);
    } catch (err) {
      console.error('Error loading navigation tabs:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load navigation'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTabPress = (tab: NavigationTab) => {
    if (onTabPress) {
      onTabPress(tab);
    }
  };

  const isActiveTab = (tab: NavigationTab) => {
    return activeRoute === tab.route;
  };

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <Text style={[styles.loadingText, { color: theme?.textColor }]}>
          Loading navigation...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, style]}>
        <Text style={[styles.errorText, { color: theme?.accentColor }]}>
          {error}
        </Text>
      </View>
    );
  }

  if (tabs.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <Text style={[styles.emptyText, { color: theme?.textColor }]}>
          No navigation items available
        </Text>
      </View>
    );
  }

  const containerStyle = [
    styles.container,
    orientation === 'vertical' && styles.verticalContainer,
    style,
  ];

  const tabStyle = [
    styles.tab,
    orientation === 'vertical' && styles.verticalTab,
  ];

  return (
    <ScrollView
      style={containerStyle}
      horizontal={orientation === 'horizontal'}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    >
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.id}
          style={[
            tabStyle,
            isActiveTab(tab) && [
              styles.activeTab,
              { backgroundColor: theme?.primaryColor },
            ],
            { borderColor: theme?.primaryColor },
          ]}
          onPress={() => handleTabPress(tab)}
          disabled={!tab.isEnabled}
        >
          {showIcons && (
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={isActiveTab(tab) ? '#ffffff' : theme?.textColor}
              style={styles.icon}
            />
          )}
          {showLabels && (
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isActiveTab(tab) ? '#ffffff' : theme?.textColor,
                },
              ]}
            >
              {tab.title}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  verticalContainer: {
    flexDirection: 'column',
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 80,
  },
  verticalTab: {
    flexDirection: 'row',
    marginHorizontal: 0,
    marginVertical: 2,
    width: '100%',
  },
  activeTab: {
    borderColor: 'transparent',
  },
  icon: {
    marginRight: 8,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingText: {
    textAlign: 'center',
    padding: 16,
    fontSize: 14,
  },
  errorText: {
    textAlign: 'center',
    padding: 16,
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default DynamicNavigation;
