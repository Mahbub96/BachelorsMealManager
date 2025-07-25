import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface DashboardModule {
  id: string;
  title: string;
  icon: string;
  description: string;
  route: string;
  color: string;
  gradient: readonly [string, string];
}

interface ModularDashboardProps {
  modules?: DashboardModule[];
  onModulePress?: (module: DashboardModule) => void;
}

const defaultModules: DashboardModule[] = [
  {
    id: 'meals',
    title: 'Meal Management',
    icon: 'restaurant',
    description: 'Add, edit, and manage daily meals',
    route: '/meals',
    color: '#10b981',
    gradient: ['#10b981', '#059669'] as const,
  },
  {
    id: 'bazar',
    title: 'Bazar Management',
    icon: 'cart',
    description: 'Track shopping and expenses',
    route: '/admin',
    color: '#f59e0b',
    gradient: ['#f59e0b', '#d97706'] as const,
  },
  {
    id: 'expenses',
    title: 'Expense Tracking',
    icon: 'wallet',
    description: 'Monitor monthly expenses',
    route: '/expense-details',
    color: '#ef4444',
    gradient: ['#ef4444', '#dc2626'] as const,
  },
  {
    id: 'members',
    title: 'Member Management',
    icon: 'people',
    description: 'Manage mess members',
    route: '/profile',
    color: '#8b5cf6',
    gradient: ['#8b5cf6', '#7c3aed'] as const,
  },
];

export const ModularDashboard: React.FC<ModularDashboardProps> = ({
  modules = defaultModules,
  onModulePress,
}) => {
  const { theme } = useTheme();
  const router = useRouter();
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const handleModulePress = (module: DashboardModule) => {
    setSelectedModule(module.id);
    
    if (onModulePress) {
      onModulePress(module);
    } else {
      router.push(module.route);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Dashboard Modules</ThemedText>
        <ThemedText style={styles.subtitle}>
          Quick access to main features
        </ThemedText>
      </View>

      <View style={styles.modulesGrid}>
        {modules.map((module) => (
          <TouchableOpacity
            key={module.id}
            style={[
              styles.moduleCard,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.cardBorder,
                shadowColor: theme.cardShadow,
              },
            ]}
            onPress={() => handleModulePress(module)}
          >
            <View style={styles.moduleHeader}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: module.color + '20', // 20% opacity
                  },
                ]}
              >
                <Ionicons
                  name={module.icon as any}
                  size={24}
                  color={module.color}
                />
              </View>
              <View style={styles.moduleContent}>
                <ThemedText style={styles.moduleTitle}>{module.title}</ThemedText>
                <ThemedText style={styles.moduleDescription}>
                  {module.description}
                </ThemedText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.text.tertiary}
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  modulesGrid: {
    gap: 16,
  },
  moduleCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  moduleContent: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  moduleDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
});
