import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedView } from '../ThemedView';
import { ThemedText } from '../ThemedText';
import { MealHeader } from './MealHeader';
import { MealTabNavigation } from './MealTabNavigation';
import { MealSearchBar } from './MealSearchBar';
import { MealAdvancedFilters } from './MealAdvancedFilters';
import { MealBulkActions } from './MealBulkActions';
import { MealList } from './MealList';
import { MealModal } from './MealModal';
import { MealDetailsView } from './MealDetailsView';
import { MealForm } from '../MealForm';
import { MealStats } from './MealStats';
import { AddMealButton } from './AddMealButton';
import { MealAnalytics } from './MealAnalytics';
import { useMealManagement } from '../../hooks/useMealManagement';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { MealEntry } from '../../services/mealService';

// Pending Meals Banner Component
const PendingMealsBanner: React.FC<{
  count: number;
  onApproveAll: () => void;
}> = ({ count, onApproveAll }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        {
          marginHorizontal: 16,
          marginTop: 12,
          marginBottom: 8,
          borderRadius: 12,
          borderWidth: 2,
          padding: 16,
          backgroundColor: theme.surface || '#fef3c7',
          borderColor: theme.status.warning || '#f59e0b',
          shadowColor: '#f59e0b',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 4,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
          <Ionicons
            name='time-outline'
            size={24}
            color={theme.status.warning || '#f59e0b'}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <ThemedText
              style={[
                {
                  fontSize: 16,
                  fontWeight: '700',
                  marginBottom: 4,
                  color: theme.text.primary || '#1f2937',
                },
              ]}
            >
              {count} Meal{count !== 1 ? 's' : ''} Pending Approval
            </ThemedText>
            <ThemedText
              style={[
                {
                  fontSize: 12,
                  color: theme.text.secondary || '#6b7280',
                },
              ]}
            >
              Review and approve meal submissions
            </ThemedText>
          </View>
        </View>
        <TouchableOpacity
          style={{
            borderRadius: 10,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 3,
          }}
          onPress={onApproveAll}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={(theme.gradient?.success || ['#10b981', '#059669']) as [string, string]}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 16,
              paddingVertical: 10,
              gap: 6,
            }}
          >
            <Ionicons name='checkmark-circle' size={18} color='#fff' />
            <ThemedText style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>
              Approve All
            </ThemedText>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface EnhancedMealManagementProps {
  userRole?: 'admin' | 'member' | 'super_admin';
  showAnalytics?: boolean;
  showBulkOperations?: boolean;
  showUserManagement?: boolean;
}

export const EnhancedMealManagement: React.FC<EnhancedMealManagementProps> = ({
  userRole,
  showAnalytics = true,
  showBulkOperations = true,
  showUserManagement = true,
}) => {
  const { user } = useAuth();
  const role = userRole || user?.role;

  const {
    meals,
    mealStats,
    filters,
    loading,
    refreshing,
    error,
    updateFilters,
    handleMealPress,
    handleStatusUpdate,
    handleDeleteMeal,
    handleEditMeal,
    handleMealSubmitted,
    refreshMeals,
    isAdmin,
    hasMeals,
    pendingMealsCount,
  } = useMealManagement();

  // State management
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [showMealDetails, setShowMealDetails] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealEntry | null>(null);
  const [selectedMeals, setSelectedMeals] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentView, setCurrentView] = useState<'meals' | 'analytics'>(
    'meals'
  );

  // Role-based permissions
  const canApproveMeals = role === 'admin' || role === 'super_admin';
  const canDeleteMeals = role === 'admin' || role === 'super_admin';
  const canViewAllMeals = role === 'admin' || role === 'super_admin';
  const canBulkOperate = role === 'admin' || role === 'super_admin';
  const canViewAnalytics = role === 'admin' || role === 'super_admin';

  // Event handlers
  const handleMealSelection = useCallback((mealId: string) => {
    setSelectedMeals(prev =>
      prev.includes(mealId)
        ? prev.filter(id => id !== mealId)
        : [...prev, mealId]
    );
  }, []);

  const handleBulkAction = useCallback(
    async (action: 'approve' | 'reject' | 'delete') => {
      if (selectedMeals.length === 0) return;

      const actionText = action;
      Alert.alert(
        `Bulk ${actionText}`,
        `Are you sure you want to ${actionText} ${selectedMeals.length} selected meals?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: actionText,
            style: action === 'delete' ? 'destructive' : 'default',
            onPress: async () => {
              try {
                if (action === 'delete') {
                  await Promise.all(
                    selectedMeals.map(mealId => handleDeleteMeal(mealId))
                  );
                } else {
                  await Promise.all(
                    selectedMeals.map(mealId =>
                      handleStatusUpdate(
                        mealId,
                        action as 'approved' | 'rejected'
                      )
                    )
                  );
                }
                setSelectedMeals([]);
                await refreshMeals();
              } catch (error) {
                Alert.alert('Error', `Failed to ${actionText} meals`);
              }
            },
          },
        ]
      );
    },
    [selectedMeals, handleDeleteMeal, handleStatusUpdate, refreshMeals]
  );

  const handleEnhancedMealPress = useCallback((meal: MealEntry) => {
    setSelectedMeal(meal);
    setShowMealDetails(true);
  }, []);

  const handleTabPress = useCallback(
    (tab: string) => {
      if (tab === 'analytics') {
        setCurrentView('analytics');
      } else {
        setCurrentView('meals');
        const statusFilter =
          tab === 'overview' ? undefined : (tab === 'pending' ? 'pending' : tab === 'approved' ? 'approved' : tab === 'rejected' ? 'rejected' : undefined);
        updateFilters({
          ...filters,
          status: statusFilter,
        });
      }
    },
    [filters, updateFilters]
  );

  const handleDateRangeChange = useCallback(
    (field: 'start' | 'end', value: string) => {
      setDateRange(prev => ({ ...prev, [field]: value }));
    },
    []
  );

  // Filter meals by status and search
  const filteredMeals = useMemo(() => {
    let filtered = meals;

    // Filter by status based on active tab
    const activeStatus = currentView === 'analytics' ? undefined : filters.status;

    if (activeStatus && activeStatus !== undefined) {
      filtered = filtered.filter(meal => meal.status === activeStatus);
    }

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(meal => {
        const mealTypes = [];
        if (meal.breakfast) mealTypes.push('breakfast');
        if (meal.lunch) mealTypes.push('lunch');
        if (meal.dinner) mealTypes.push('dinner');

        const userName =
          typeof meal.userId === 'object'
            ? meal.userId.name || meal.userId.email || ''
            : '';

        return (
          mealTypes.some(type => type.includes(searchLower)) ||
          meal.notes?.toLowerCase().includes(searchLower) ||
          meal.status.toLowerCase().includes(searchLower) ||
          userName.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply date range filter
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(meal => {
        const mealDate = new Date(meal.date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return mealDate >= startDate && mealDate <= endDate;
      });
    }

    return filtered;
  }, [meals, filters.status, searchQuery, dateRange, currentView]);

  // Header configurations
  const getHeaderConfig = () => {
    switch (role) {
      case 'super_admin':
        return {
          title: 'Super Admin Dashboard',
          subtitle: 'Complete system control and analytics',
          icon: 'settings',
          colors: ['#7c3aed', '#a855f7'] as [string, string],
        };
      case 'admin':
        return {
          title: 'Admin Dashboard',
          subtitle: 'Manage all meal entries and approvals',
          icon: 'shield-checkmark',
          colors: ['#059669', '#10b981'] as [string, string],
        };
      default:
        return {
          title: 'My Meals',
          subtitle: 'Manage your daily meal entries',
          icon: 'fast-food',
          colors: ['#667eea', '#764ba2'] as [string, string],
        };
    }
  };

  const headerConfig = getHeaderConfig();

  // Tab configurations
  const getTabs = () => {
    if (role === 'admin' || role === 'super_admin') {
      return [
        { key: 'overview', label: 'Overview' },
        { key: 'pending', label: 'Pending' },
        { key: 'approved', label: 'Approved' },
        { key: 'rejected', label: 'Rejected' },
        { key: 'analytics', label: 'Analytics' },
      ];
    }
    return [];
  };

  const tabs = getTabs();

  // Render member interface
  const renderMemberInterface = () => (
    <View style={styles.container}>
      <MealHeader {...headerConfig} />

      {mealStats && <MealStats stats={mealStats} />}

      <AddMealButton onPress={() => setShowAddMealModal(true)} />

      <MealSearchBar value={searchQuery} onChangeText={setSearchQuery} />

      <MealList
        meals={filteredMeals}
        selectedMeals={[]}
        onMealPress={handleEnhancedMealPress}
        onMealSelect={() => {}}
        onEdit={handleEditMeal}
        onDelete={handleDeleteMeal}
        isAdmin={false}
        refreshing={refreshing}
        onRefresh={refreshMeals}
      />
    </View>
  );

  // Render admin interface
  const renderAdminInterface = () => (
    <View style={styles.container}>
      <MealHeader {...headerConfig} />

      <MealTabNavigation
        tabs={tabs}
        activeTab={
          currentView === 'analytics'
            ? 'analytics'
            : (filters.status as string) || 'overview'
        }
        onTabPress={handleTabPress}
        pendingCount={pendingMealsCount}
      />

      {currentView === 'analytics' ? (
        <MealAnalytics
          meals={meals}
          mealStats={mealStats}
          userRole={role as 'admin' | 'member' | 'super_admin'}
        />
      ) : (
        <>
          {/* Pending Meals Summary Banner */}
          {filters.status === 'pending' && pendingMealsCount > 0 && (
            <PendingMealsBanner
              count={pendingMealsCount}
              onApproveAll={() => {
                const pendingMealIds = filteredMeals
                  .filter(m => m.status === 'pending')
                  .map(m => m.id);
                if (pendingMealIds.length > 0) {
                  setSelectedMeals(pendingMealIds);
                  handleBulkAction('approve');
                }
              }}
            />
          )}

          <MealAdvancedFilters
            isExpanded={showAdvancedFilters}
            onToggle={() => setShowAdvancedFilters(!showAdvancedFilters)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
          />

          <MealBulkActions
            selectedCount={selectedMeals.length}
            onApprove={() => handleBulkAction('approve')}
            onReject={() => handleBulkAction('reject')}
            onDelete={() => handleBulkAction('delete')}
          />

          <MealList
            meals={filteredMeals}
            selectedMeals={selectedMeals}
            onMealPress={handleEnhancedMealPress}
            onMealSelect={handleMealSelection}
            onStatusUpdate={handleStatusUpdate}
            onEdit={handleEditMeal}
            onDelete={handleDeleteMeal}
            isAdmin={true}
            showUserInfo={true}
            refreshing={refreshing}
            onRefresh={refreshMeals}
            filters={filters}
          />
        </>
      )}
    </View>
  );

  // Main render based on role
  const renderInterface = () => {
    switch (role) {
      case 'super_admin':
      case 'admin':
        return renderAdminInterface();
      case 'member':
      default:
        return renderMemberInterface();
    }
  };

  return (
    <ThemedView style={styles.mainContainer}>
      {renderInterface()}

      <MealModal
        visible={showAddMealModal}
        title='Add New Meal'
        onClose={() => setShowAddMealModal(false)}
      >
        <MealForm
          onSuccess={async () => {
            await handleMealSubmitted();
            setShowAddMealModal(false);
          }}
          onCancel={() => setShowAddMealModal(false)}
        />
      </MealModal>

      <MealModal
        visible={showMealDetails}
        title='Meal Details'
        onClose={() => setShowMealDetails(false)}
      >
        {selectedMeal && <MealDetailsView meal={selectedMeal} />}
      </MealModal>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  pendingBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  pendingBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pendingBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  pendingBannerText: {
    flex: 1,
    marginLeft: 12,
  },
  pendingBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  pendingBannerSubtitle: {
    fontSize: 12,
  },
  approveAllButton: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  approveAllButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  approveAllButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});
