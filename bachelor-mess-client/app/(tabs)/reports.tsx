import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { MonthlyReportDashboard } from '../../components/admin/reports/MonthlyReportDashboard';
import { GroupMembersVotePanel } from '../../components/members/GroupMembersVotePanel';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ErrorBoundary } from '../../components/ErrorBoundary';

/**
 * Analysis tab for members: view-only access to group report and own individual report.
 * Admins are redirected to Admin (they use Admin > Reports there).
 */
export default function ReportsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme().theme;
  const params = useLocalSearchParams<{ tab?: string }>();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const [activeTab, setActiveTab] = useState<'analysis' | 'vote'>(() =>
    params?.tab === 'vote' ? 'vote' : 'analysis'
  );

  useEffect(() => {
    if (!user) {
      router.replace('/(tabs)');
      return;
    }
    if (isAdmin) {
      router.replace('/(tabs)/admin');
    }
  }, [user, isAdmin, router]);

  const renderTabChips = useCallback(() => {
    const tabs: { key: 'analysis' | 'vote'; label: string }[] = [
      { key: 'analysis', label: 'Analysis' },
      { key: 'vote', label: 'Admin vote' },
    ];

    const activeBg = theme.primary;
    const inactiveBg = theme.cardBackground ?? theme.surface;
    const inactiveBorder = theme.cardBorder ?? theme.border?.secondary;
    const activeTextColor = theme.text?.inverse ?? '#fff';
    const inactiveTextColor = theme.tab?.inactive ?? theme.text?.secondary;

    return (
      <View
        style={[
          styles.tabNavigation,
          {
            backgroundColor: theme.background,
            borderBottomColor: theme.border?.secondary ?? theme.cardBorder,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {tabs.map(({ key, label }) => {
            const isActive = activeTab === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: isActive ? activeBg : inactiveBg,
                    borderColor: isActive ? activeBg : inactiveBorder,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => setActiveTab(key)}
                activeOpacity={0.7}
              >
                <ThemedText
                  style={[
                    styles.tabChipText,
                    {
                      color: isActive ? activeTextColor : inactiveTextColor,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }, [activeTab, theme]);

  if (!user || isAdmin) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.redirectContainer}>
          <ThemedText style={styles.redirectText}>
            {!user ? 'Redirecting…' : 'Redirecting to Admin…'}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const currentUserId = user?.id ?? null;

  return (
    <ErrorBoundary>
      <ThemedView style={styles.container}>
        {renderTabChips()}
        {activeTab === 'analysis' && (
          <MonthlyReportDashboard currentUserId={currentUserId} />
        )}
        {activeTab === 'vote' && <GroupMembersVotePanel />}
      </ThemedView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabNavigation: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  tabScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 16,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  tabChipText: {
    fontSize: 14,
    fontWeight: '600',
    maxWidth: 140,
  },
  redirectContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  redirectText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
