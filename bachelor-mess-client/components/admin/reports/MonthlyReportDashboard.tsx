
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../../ThemedText';
import { ThemedView } from '../../ThemedView';
import { ModernLoader } from '../../ui/ModernLoader';
import { useTheme } from '../../../context/ThemeContext';
import statisticsService, { MonthlyReportData } from '../../../services/statisticsService';

const { width: windowWidth } = Dimensions.get('window');
// Account for tab content padding (20*2) + contentContainer padding (16*2) + gap (12) so cards sit side-by-side
const HORIZONTAL_PADDING = 20 * 2 + 16 * 2 + 12;
const SUMMARY_CARD_WIDTH = (windowWidth - HORIZONTAL_PADDING) / 2;

// Helper to get month names
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Helper to generate years (current year - 2 to current year + 1)
const getYears = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 4 }, (_, i) => currentYear - 2 + i);
};

interface MonthlyReportDashboardProps {
  /** When set (e.g. member view), Individual tab only shows this user (view-only). */
  currentUserId?: string | null;
}

export const MonthlyReportDashboard = ({ currentUserId }: MonthlyReportDashboardProps) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<MonthlyReportData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<'group' | 'individual'>('group');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isMemberView = Boolean(currentUserId);

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await statisticsService.getMonthlyReport(selectedMonth, selectedYear);
      
      if (response.success && response.data) {
        setReportData(response.data);
      } else {
        setError(response.error || 'Failed to load report');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Auto-select: member view = only current user; admin = first member or current selection
  useEffect(() => {
    if (activeTab !== 'individual' || !reportData?.members?.length) return;
    const ids = reportData.members.map(m => String(m.user._id));
    if (isMemberView && currentUserId) {
      setSelectedUserId(ids.includes(String(currentUserId)) ? currentUserId : reportData.members[0].user._id);
    } else if (!selectedUserId || !ids.includes(String(selectedUserId))) {
      setSelectedUserId(reportData.members[0].user._id);
    }
  }, [activeTab, reportData, selectedUserId, isMemberView, currentUserId]);

  const handleMonthChange = (increment: number) => {
    let newMonth = selectedMonth + increment;
    let newYear = selectedYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const selectedUserReport = useMemo(() => {
    if (!reportData || !selectedUserId) return null;
    return reportData.members.find(m => String(m.user._id) === String(selectedUserId));
  }, [reportData, selectedUserId]);

  // For member view: only show current user in Individual tab; for admin show all
  const membersForIndividualSelector = useMemo(() => {
    if (!reportData?.members?.length) return [];
    if (isMemberView && currentUserId) {
      return reportData.members.filter(m => String(m.user._id) === String(currentUserId));
    }
    return reportData.members;
  }, [reportData, isMemberView, currentUserId]);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.dateSelector}>
        <TouchableOpacity 
          onPress={() => handleMonthChange(-1)}
          style={[styles.arrowButton, { backgroundColor: theme.cardBackground, borderColor: theme.border?.secondary }]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.dateTextContainer}>
          <ThemedText style={styles.dateText}>
            {MONTHS[selectedMonth - 1]} {selectedYear}
          </ThemedText>
          <ThemedText style={[styles.dateSubtitle, { color: theme.text.secondary }]}>
            Month-end report
          </ThemedText>
        </View>

        <TouchableOpacity 
          onPress={() => handleMonthChange(1)}
          style={[styles.arrowButton, { backgroundColor: theme.cardBackground, borderColor: theme.border?.secondary }]}
        >
          <Ionicons name="chevron-forward" size={24} color={theme.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.tabContainer, { backgroundColor: theme.surface ?? theme.overlay?.light }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'group' && { backgroundColor: theme.primary, borderColor: theme.primary }
          ]}
          onPress={() => setActiveTab('group')}
        >
          <ThemedText style={[
            styles.tabText,
            activeTab === 'group' ? { color: theme.onPrimary?.text ?? theme.text?.inverse } : { color: theme.text.secondary }
          ]}>Group Report</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'individual' && { backgroundColor: theme.primary, borderColor: theme.primary }
          ]}
          onPress={() => setActiveTab('individual')}
        >
          <ThemedText style={[
            styles.tabText,
            activeTab === 'individual' ? { color: theme.onPrimary?.text ?? theme.text?.inverse } : { color: theme.text.secondary }
          ]}>Individual Report</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const onPrimary = theme.onPrimary?.text ?? theme.text?.inverse;
  const onPrimaryMuted = theme.onPrimary?.overlay ?? theme.overlay?.light;
  const renderSummaryCard = (title: string, value: string | number, icon: keyof typeof Ionicons.glyphMap, color: string, subtitle?: string) => (
    <LinearGradient
      colors={[color, color]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.summaryCard, { opacity: 0.9 }]}
    >
      <View style={[styles.summaryIconContainer, { backgroundColor: onPrimaryMuted }]}>
        <Ionicons name={icon} size={24} color={onPrimary} />
      </View>
      <View>
        <ThemedText style={[styles.summaryValue, { color: onPrimary }]}>{value}</ThemedText>
        <ThemedText style={[styles.summaryTitle, { color: onPrimary }]}>{title}</ThemedText>
        {subtitle && <ThemedText style={[styles.summarySubtitle, { color: onPrimary, opacity: 0.9 }]}>{subtitle}</ThemedText>}
      </View>
    </LinearGradient>
  );

  const renderGroupReport = () => {
    if (!reportData) return null;

    return (
      <View style={styles.contentContainer}>
        <View style={styles.summaryGrid}>
          {renderSummaryCard(
            'Meal Rate',
            `৳${reportData.summary.mealRate.toFixed(2)}`,
            'calculator',
            theme.status.info
          )}
          {renderSummaryCard(
            'Total Meals',
            reportData.summary.totalMeals,
            'restaurant',
            theme.status.success
          )}
          {renderSummaryCard(
            'Meal Bazar',
            `৳${reportData.summary.totalCost.toLocaleString()}`,
            'wallet',
            theme.status.warning
          )}
          {renderSummaryCard(
            'Flat (each)',
            `৳${(reportData.summary.flatSharePerPerson ?? 0).toFixed(0)}`,
            'home',
            theme.status.info,
            reportData.summary.totalFlatBazar != null ? `total ৳${reportData.summary.totalFlatBazar.toLocaleString()}` : undefined
          )}
          {renderSummaryCard(
            'Members',
            reportData.summary.totalMembers,
            'people',
            theme.primary
          )}
        </View>

        <ThemedText style={styles.sectionTitle}>Member Breakdown</ThemedText>
        
        {reportData.members.length === 0 ? (
          <View style={[styles.emptyState, { marginTop: 16 }]}>
            <Ionicons name="people-outline" size={48} color={theme.text.secondary} />
            <ThemedText style={[styles.emptyStateText, { color: theme.text.secondary }]}>
              No member data for this month
            </ThemedText>
          </View>
        ) : reportData.members.map((member) => (
          <View 
            key={member.user._id} 
            style={[styles.memberCard, { backgroundColor: theme.cardBackground, borderColor: theme.border.secondary, borderWidth: 1 }]}
          >
            <View style={styles.memberHeader}>
              <View style={styles.memberInfo}>
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                  <ThemedText style={[styles.avatarText, { color: theme.onPrimary?.text ?? theme.text?.inverse }]}>
                    {member.user.name.charAt(0).toUpperCase()}
                  </ThemedText>
                </View>
                <View>
                  <ThemedText style={styles.memberName}>{member.user.name}</ThemedText>
                  <ThemedText style={[styles.memberEmail, { color: theme.text.secondary }]}>
                    {member.meals.total} meals • {member.bazar.entryCount} meal bazars
                  </ThemedText>
                </View>
              </View>
              <View style={styles.balanceContainer}>
                <ThemedText style={[
                  styles.balanceValue,
                  { color: member.financial.balance >= 0 ? theme.status.success : theme.status.error }
                ]}>
                  {member.financial.balance >= 0 ? '+' : ''}৳{member.financial.balance}
                </ThemedText>
                <ThemedText style={[styles.balanceLabel, { color: theme.text.secondary }]}>
                  Balance
                </ThemedText>
              </View>
            </View>

            <View style={[styles.memberStatsRow, { borderTopColor: theme.border.secondary }]}>
              <View style={styles.memberStatItem}>
                <ThemedText style={[styles.statLabel, { color: theme.text.secondary }]}>Meal Bazar</ThemedText>
                <ThemedText style={styles.statValue}>৳{member.bazar.totalAmount}</ThemedText>
              </View>
              <View style={styles.memberStatItem}>
                <ThemedText style={[styles.statLabel, { color: theme.text.secondary }]}>Flat added</ThemedText>
                <ThemedText style={styles.statValue}>৳{member.bazar.flatContributed ?? 0}</ThemedText>
              </View>
              <View style={styles.memberStatItem}>
                <ThemedText style={[styles.statLabel, { color: theme.text.secondary }]}>Flat</ThemedText>
                <ThemedText style={[
                  styles.statValue,
                  (member.bazar.flatSettlement ?? 0) > 0 ? { color: theme.status.success } : (member.bazar.flatSettlement ?? 0) < 0 ? { color: theme.status.error } : {}
                ]}>
                  {(member.bazar.flatSettlement ?? 0) > 0 ? `Get ৳${Number(member.bazar.flatSettlement).toFixed(2)}` : (member.bazar.flatSettlement ?? 0) < 0 ? `Pay ৳${Math.abs(Number(member.bazar.flatSettlement ?? 0)).toFixed(2)}` : 'Settled'}
                </ThemedText>
              </View>
              <View style={styles.memberStatItem}>
                <ThemedText style={[styles.statLabel, { color: theme.text.secondary }]}>Cost</ThemedText>
                <ThemedText style={styles.statValue}>৳{member.financial.mealCost}</ThemedText>
              </View>
              <View style={styles.memberStatItem}>
                <ThemedText style={[styles.statLabel, { color: theme.text.secondary }]}>Meals</ThemedText>
                <ThemedText style={styles.statValue}>{member.meals.total}</ThemedText>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderIndividualReport = () => {
    if (!reportData) return null;

    return (
      <View style={styles.contentContainer}>
        {/* User Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.userSelector}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {membersForIndividualSelector.map((member) => (
            <TouchableOpacity
              key={member.user._id}
              style={[
                styles.userChip,
                {
                  backgroundColor: String(selectedUserId) === String(member.user._id)
                    ? theme.primary
                    : (theme.surface ?? theme.overlay?.light),
                },
              ]}
              onPress={() => setSelectedUserId(member.user._id)}
            >
              <ThemedText style={[
                styles.userChipText,
                String(selectedUserId) === String(member.user._id) && { color: theme.onPrimary?.text ?? theme.text?.inverse }
              ]}>
                {member.user.name.split(' ')[0]}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedUserReport ? (
          <View style={styles.individualContent}>
             <View style={[styles.reportCard, { backgroundColor: theme.cardBackground }]}>
               <ThemedText style={styles.reportCardTitle}>Financial Summary</ThemedText>
               <View style={styles.reportRow}>
                 <ThemedText style={styles.reportLabel}>Meal Bazar (deposit)</ThemedText>
                 <ThemedText style={styles.reportValue}>৳{selectedUserReport.bazar.totalAmount}</ThemedText>
               </View>
               <View style={styles.reportRow}>
                 <ThemedText style={styles.reportLabel}>Flat added (by you)</ThemedText>
                 <ThemedText style={styles.reportValue}>৳{selectedUserReport.bazar.flatContributed ?? 0}</ThemedText>
               </View>
               <View style={styles.reportRow}>
                 <ThemedText style={styles.reportLabel}>Flat (your share {reportData.summary.totalMembers} people)</ThemedText>
                 <ThemedText style={styles.reportValue}>৳{selectedUserReport.bazar.flatShare ?? 0} each</ThemedText>
               </View>
               <View style={styles.reportRow}>
                 <ThemedText style={styles.reportLabel}>Flat settlement</ThemedText>
                 <ThemedText style={[
                   styles.reportValue,
                   (selectedUserReport.bazar.flatSettlement ?? 0) > 0 ? { color: theme.status.success } : (selectedUserReport.bazar.flatSettlement ?? 0) < 0 ? { color: theme.status.error } : {}
                 ]}>
                   {(selectedUserReport.bazar.flatSettlement ?? 0) > 0
                     ? `Get back ৳${Number(selectedUserReport.bazar.flatSettlement).toFixed(2)}`
                     : (selectedUserReport.bazar.flatSettlement ?? 0) < 0
                       ? `Pay ৳${Math.abs(Number(selectedUserReport.bazar.flatSettlement ?? 0)).toFixed(2)}`
                       : 'Settled'}
                 </ThemedText>
               </View>
               <View style={styles.reportRow}>
                 <ThemedText style={styles.reportLabel}>Meal Cost ({selectedUserReport.meals.total} × {reportData.summary.mealRate.toFixed(2)})</ThemedText>
                 <ThemedText style={[styles.reportValue, { color: theme.status.error }]}>
                   -৳{selectedUserReport.financial.mealCost}
                 </ThemedText>
               </View>
               <View style={[styles.reportRow, styles.totalRow, { borderTopColor: theme.border.secondary }]}>
                 <ThemedText style={styles.totalLabel}>Net Balance</ThemedText>
                 <ThemedText style={[
                   styles.totalValue,
                   { color: selectedUserReport.financial.balance >= 0 ? theme.status.success : theme.status.error }
                 ]}>
                   {selectedUserReport.financial.balance >= 0 ? '+' : ''}৳{selectedUserReport.financial.balance}
                 </ThemedText>
               </View>
             </View>

             <View style={[styles.reportCard, { backgroundColor: theme.cardBackground, marginTop: 16 }]}>
               <ThemedText style={styles.reportCardTitle}>Meal Breakdown</ThemedText>
               <View style={styles.mealGrid}>
                 <View style={styles.mealItem}>
                   <ThemedText style={styles.mealCount}>{selectedUserReport.meals.breakfast}</ThemedText>
                   <ThemedText style={styles.mealLabel}>Breakfast</ThemedText>
                 </View>
                 <View style={styles.mealItem}>
                   <ThemedText style={styles.mealCount}>{selectedUserReport.meals.lunch}</ThemedText>
                   <ThemedText style={styles.mealLabel}>Lunch</ThemedText>
                 </View>
                 <View style={styles.mealItem}>
                   <ThemedText style={styles.mealCount}>{selectedUserReport.meals.dinner}</ThemedText>
                   <ThemedText style={styles.mealLabel}>Dinner</ThemedText>
                 </View>
                 <View style={[styles.mealItem, {borderLeftWidth: 1, borderLeftColor: theme.border.secondary}]}>
                   <ThemedText style={[styles.mealCount, {color: theme.primary}]}>{selectedUserReport.meals.total}</ThemedText>
                   <ThemedText style={styles.mealLabel}>Total</ThemedText>
                 </View>
               </View>
             </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="person-circle-outline" size={64} color={theme.text.secondary} />
            <ThemedText style={[styles.emptyStateText, { color: theme.text.secondary }]}>
              Select a member to view detailed report
            </ThemedText>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      {loading ? (
        <View style={styles.loaderContainer}>
          <ModernLoader visible={true} text="Generating Report..." overlay={false} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.status.error} />
          <ThemedText style={[styles.errorText, { color: theme.status.error }]}>{error}</ThemedText>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.primary }]} 
            onPress={loadReport}
          >
            <ThemedText style={[styles.retryButtonText, { color: theme.onPrimary?.text ?? theme.button?.primary?.text }]}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {activeTab === 'group' ? renderGroupReport() : renderIndividualReport()}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  arrowButton: {
    padding: 8,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  dateTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700',
  },
  dateSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabText: {
    fontWeight: '600',
    fontSize: 14,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 300,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    height: 300,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    width: SUMMARY_CARD_WIDTH,
    minWidth: 0,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  summaryTitle: {
    fontSize: 12,
  },
  summarySubtitle: {
    fontSize: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  memberCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberEmail: {
    fontSize: 12,
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  balanceLabel: {
    fontSize: 12,
  },
  memberStatsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  memberStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  userSelector: {
    marginBottom: 16,
    maxHeight: 50,
  },
  userChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  userChipText: {
    fontWeight: '500',
  },
  individualContent: {
    marginTop: 8,
  },
  emptyState: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
  },
  reportCard: {
    padding: 16,
    borderRadius: 16,
  },
  reportCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportLabel: {
    fontSize: 14,
  },
  reportValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  mealGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  mealItem: {
    flex: 1,
    alignItems: 'center',
  },
  mealCount: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  mealLabel: {
    fontSize: 12,
  },
});
