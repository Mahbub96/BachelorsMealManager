import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { ThemedView } from '../ThemedView';
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
import { MealEntry } from '../../services/mealService';

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
        updateFilters({
          ...filters,
          status: tab === 'overview' ? undefined : (tab as any),
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

  // Search functionality
  const filteredMeals = meals.filter(meal => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    const mealTypes = [];
    if (meal.breakfast) mealTypes.push('breakfast');
    if (meal.lunch) mealTypes.push('lunch');
    if (meal.dinner) mealTypes.push('dinner');

    return (
      mealTypes.some(type => type.includes(searchLower)) ||
      meal.notes?.toLowerCase().includes(searchLower) ||
      meal.status.toLowerCase().includes(searchLower)
    );
  });

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
            : filters.status || 'overview'
        }
        onTabPress={handleTabPress}
      />

      {currentView === 'analytics' ? (
        <MealAnalytics
          meals={meals}
          mealStats={mealStats}
          userRole={role as 'admin' | 'member' | 'super_admin'}
        />
      ) : (
        <>
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
});
