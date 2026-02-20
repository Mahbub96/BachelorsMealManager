import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  TextInput,
  FlatList,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { ActivityCard } from '../cards';
import {
  DashboardHeader,
  StatsGrid,
  QuickActions,
  type StatItem,
  type ActionItem,
} from '../dashboard';
import { useAppRefresh } from '../../context/AppRefreshContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useMealManagement } from '../../hooks/useMealManagement';
import mealService from '../../services/mealService';
import { useThemeColor } from '../../hooks/useThemeColor';
import { ScreenBackButton } from '../ui/ScreenBackButton';
import { InfoModal, type InfoModalVariant } from '../ui';
import { MealDetailModal } from './MealDetailModal';

const { width: screenWidth } = Dimensions.get('window');

type MealLike = {
  breakfast?: boolean;
  lunch?: boolean;
  dinner?: boolean;
  userId?: string | { _id?: string };
  status?: string;
  date?: string;
  guestBreakfast?: number;
  guestLunch?: number;
  guestDinner?: number;
};

function getMealSlots(meal: MealLike): number {
  const regular =
    (meal?.breakfast ? 1 : 0) + (meal?.lunch ? 1 : 0) + (meal?.dinner ? 1 : 0);
  const guest =
    (meal?.guestBreakfast ?? 0) +
    (meal?.guestLunch ?? 0) +
    (meal?.guestDinner ?? 0);
  return regular + guest;
}

function countMealSlots<T extends MealLike>(
  meals: T[],
  predicate?: (m: T) => boolean
): number {
  const list = meals ?? [];
  const fn = predicate ?? (() => true);
  return list.reduce((sum, m) => sum + (fn(m) ? getMealSlots(m) : 0), 0);
}

interface MealManagementProps {
  onNavigate?: (screen: string) => void;
}

export const MealManagement: React.FC<MealManagementProps> = ({
  onNavigate,
}) => {
  const { user } = useAuth();

  const { theme } = useTheme();

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor(
    { light: '#e5e7eb', dark: '#374151' },
    'background'
  );

  const [activeTab, setActiveTab] = useState<'overview' | 'add' | 'history'>(
    'overview'
  );
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMeals, setSelectedMeals] = useState({
    breakfast: false,
    lunch: false,
    dinner: false,
  });
  const [guestMeals, setGuestMeals] = useState({
    breakfast: 0,
    lunch: 0,
    dinner: 0,
  });
  const [showGuestMeals, setShowGuestMeals] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'total' | 'my'>('total');
  const [infoModal, setInfoModal] = useState<{
    title: string;
    message: string;
    variant: InfoModalVariant;
  } | null>(null);
  const isSmallScreen = screenWidth < 375;

  const showAlert = useCallback(
    (title: string, message: string, variant: InfoModalVariant = 'info') => {
      setInfoModal({ title, message, variant });
    },
    []
  );

  const {
    meals,
    refreshMeals,
    handleMealPress,
    selectedMeal,
    closeMealDetail,
  } = useMealManagement({ showAlert });

  const isMyMeal = useCallback(
    (m: { userId?: string | { _id?: string } }) => {
      if (!user?.id) return false;
      const uid = m.userId;
      if (typeof uid === 'string') return uid === user.id;
      return uid?._id === user.id;
    },
    [user?.id]
  );

  const historyMeals = useMemo(() => {
    const list = meals || [];
    if (historyFilter === 'my') return list.filter(isMyMeal);
    return list;
  }, [meals, historyFilter, isMyMeal]);

  const recentMyMeals = useMemo(
    () => (meals || []).filter(isMyMeal).slice(0, 5),
    [meals, isMyMeal]
  );

  const summaryByType = useMemo(() => {
    const my = (meals || []).filter(isMyMeal);
    return {
      breakfast: my.filter(m => m?.breakfast).length + my.reduce((s, m) => s + (m?.guestBreakfast ?? 0), 0),
      lunch: my.filter(m => m?.lunch).length + my.reduce((s, m) => s + (m?.guestLunch ?? 0), 0),
      dinner: my.filter(m => m?.dinner).length + my.reduce((s, m) => s + (m?.guestDinner ?? 0), 0),
    };
  }, [meals, isMyMeal]);

  const { register, unregister, refreshAll } = useAppRefresh();

  useFocusEffect(
    useCallback(() => {
      refreshMeals();
    }, [refreshMeals])
  );

  useEffect(() => {
    register('meals', refreshMeals);
    return () => unregister('meals');
  }, [register, unregister, refreshMeals]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddMeal = () => {
    setActiveTab('add');
  };

  const handleViewHistory = () => {
    setActiveTab('history');
  };

  const mealStatsForGrid: StatItem[] = useMemo(() => {
    const todayStr = new Date().toDateString();
    return [
      {
        title: 'Total Meals',
        value: countMealSlots(meals ?? [], isMyMeal),
        icon: 'fast-food',
        colors: (theme.gradient?.info ?? [theme.primary, theme.primary]) as [
          string,
          string,
        ],
        period: 'My Meals',
      },
      {
        title: 'Pending',
        value: countMealSlots(
          meals ?? [],
          m => isMyMeal(m) && m?.status === 'pending'
        ),
        icon: 'time',
        colors: (theme.gradient?.warning ?? [theme.primary, theme.primary]) as [
          string,
          string,
        ],
        period: 'Pending Approval',
      },
      {
        title: 'Approved',
        value: countMealSlots(
          meals ?? [],
          m => isMyMeal(m) && m?.status === 'approved'
        ),
        icon: 'checkmark-circle',
        colors: (theme.gradient?.success ?? [theme.primary, theme.primary]) as [
          string,
          string,
        ],
        period: 'Approved Meals',
      },
      {
        title: 'Today',
        value: countMealSlots(meals ?? [], m => {
          if (!isMyMeal(m) || m?.status !== 'approved' || !m?.date)
            return false;
          return new Date(m.date).toDateString() === todayStr;
        }),
        icon: 'calendar',
        colors: (theme.gradient?.secondary ?? [
          theme.primary,
          theme.primary,
        ]) as [string, string],
        period: 'Today',
      },
    ];
  }, [meals, isMyMeal, theme]);

  const quickActionsList: ActionItem[] = useMemo(
    () => [
      {
        id: 'add-meal',
        title: 'Add Meal',
        subtitle: 'Record new meal',
        icon: 'add-circle',
        color: theme.gradient?.success?.[0] ?? theme.primary,
        onPress: handleAddMeal,
      },
      {
        id: 'history',
        title: 'Meal History',
        subtitle: 'View past meals',
        icon: 'time',
        color: theme.gradient?.warning?.[0] ?? theme.primary,
        onPress: handleViewHistory,
      },
      {
        id: 'profile',
        title: 'My Profile',
        subtitle: 'Update profile',
        icon: 'person',
        color: theme.gradient?.primary?.[0] ?? theme.primary,
        onPress: () => onNavigate?.('profile'),
      },
      {
        id: 'settings',
        title: 'Settings',
        subtitle: 'App preferences',
        icon: 'settings',
        color: theme.gradient?.secondary?.[0] ?? theme.primary,
        onPress: () => onNavigate?.('settings'),
      },
    ],
    [theme, onNavigate]
  );

  const toggleMeal = (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    setSelectedMeals(prev => ({
      ...prev,
      [mealType]: !prev[mealType],
    }));
  };

  const handleSubmitMeal = async () => {
    // Validate that at least one meal is selected
    if (
      !selectedMeals.breakfast &&
      !selectedMeals.lunch &&
      !selectedMeals.dinner
    ) {
      showAlert('Error', 'Please select at least one meal', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const mealData = {
        breakfast: selectedMeals.breakfast,
        lunch: selectedMeals.lunch,
        dinner: selectedMeals.dinner,
        date: selectedDate.toISOString().split('T')[0],
        notes: notes.trim(),
        guestBreakfast: guestMeals.breakfast || 0,
        guestLunch: guestMeals.lunch || 0,
        guestDinner: guestMeals.dinner || 0,
      };

      const response = await mealService.submitMeal(mealData);

      if (response.success) {
        showAlert('Success', 'Meal submitted successfully!', 'success');
        setSelectedMeals({ breakfast: false, lunch: false, dinner: false });
        setGuestMeals({ breakfast: 0, lunch: 0, dinner: 0 });
        setShowGuestMeals(false);
        setNotes('');
        setSelectedDate(new Date());
        await refreshMeals();
        setActiveTab('overview');
      } else {
        const err =
          response.message || response.error || 'Failed to submit meal';
        if (
          err.includes('already have a meal entry') ||
          err.includes('already exists for this date')
        ) {
          showAlert(
            'Meal Already Exists',
            'You already have a meal entry for this date. You can update it from the meal list.',
            'warning'
          );
        } else {
          showAlert('Error', err, 'error');
        }
      }
    } catch {
      showAlert('Error', 'An unexpected error occurred', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getMealSummary = (meal: {
    breakfast?: boolean;
    lunch?: boolean;
    dinner?: boolean;
    userId?: { name?: string; email?: string } | string;
    guestBreakfast?: number;
    guestLunch?: number;
    guestDinner?: number;
  }) => {
    const parts: string[] = [];
    if (meal?.breakfast) parts.push('Breakfast');
    if (meal?.lunch) parts.push('Lunch');
    if (meal?.dinner) parts.push('Dinner');
    const summary = parts.join(', ') || 'No meals selected';
    const guestTotal =
      (meal?.guestBreakfast ?? 0) +
      (meal?.guestLunch ?? 0) +
      (meal?.guestDinner ?? 0);
    const guestStr = guestTotal > 0 ? ` • ${guestTotal} guest(s)` : '';
    const name =
      typeof meal?.userId === 'object' && meal?.userId?.name
        ? meal.userId.name
        : null;
    const byStr = name ? ` • Added by ${name}` : '';
    return `${summary}${guestStr}${byStr}`;
  };

  const getMealAmountLabel = (meal: {
    breakfast?: boolean;
    lunch?: boolean;
    dinner?: boolean;
    guestBreakfast?: number;
    guestLunch?: number;
    guestDinner?: number;
  }) => {
    const regularSlots =
      (meal?.breakfast ? 1 : 0) +
      (meal?.lunch ? 1 : 0) +
      (meal?.dinner ? 1 : 0);
    const guestTotal =
      (meal?.guestBreakfast ?? 0) +
      (meal?.guestLunch ?? 0) +
      (meal?.guestDinner ?? 0);
    return guestTotal > 0
      ? `${regularSlots} meals + ${guestTotal} guest(s)`
      : `${regularSlots} meals`;
  };

  const renderOverview = () => {
    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.overviewScrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <DashboardHeader
          title='Meal Management'
          subtitle='Track and manage My Meals'
          icon='restaurant'
        />
        <StatsGrid
          stats={mealStatsForGrid}
          columns={2}
          isSmallScreen={isSmallScreen}
        />
        <QuickActions
          actions={quickActionsList}
          title='My Meals Actions'
          subtitle='Manage My Meals'
          columns={2}
          isSmallScreen={isSmallScreen}
        />

        {/* Meal Summary - modern card style */}
        <View style={[styles.section, { paddingHorizontal: 16 }]}>
          <ThemedText
            style={[styles.sectionTitle, { color: theme.text?.primary }]}
          >
            My Meals Summary
          </ThemedText>
          <View style={styles.summaryGrid}>
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: theme.cardBackground ?? theme.surface,
                  borderColor: theme.border?.secondary ?? theme.cardBorder,
                  borderWidth: 1,
                  shadowColor: theme.shadow?.light ?? theme.cardShadow,
                },
              ]}
            >
              <View
                style={[
                  styles.summaryIconWrap,
                  {
                    backgroundColor:
                      (theme.status?.warning ?? theme.primary) + '18',
                  },
                ]}
              >
                <Ionicons
                  name='sunny'
                  size={22}
                  color={theme.status?.warning ?? theme.primary}
                />
              </View>
              <ThemedText
                style={[styles.summaryValue, { color: theme.text?.primary }]}
              >
                {summaryByType.breakfast}
              </ThemedText>
              <ThemedText
                style={[styles.summaryLabel, { color: theme.text?.secondary }]}
              >
                Breakfast
              </ThemedText>
            </View>
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: theme.cardBackground ?? theme.surface,
                  borderColor: theme.border?.secondary ?? theme.cardBorder,
                  borderWidth: 1,
                  shadowColor: theme.shadow?.light ?? theme.cardShadow,
                },
              ]}
            >
              <View
                style={[
                  styles.summaryIconWrap,
                  {
                    backgroundColor:
                      (theme.status?.success ?? theme.primary) + '18',
                  },
                ]}
              >
                <Ionicons
                  name='partly-sunny'
                  size={22}
                  color={theme.status?.success ?? theme.primary}
                />
              </View>
              <ThemedText
                style={[styles.summaryValue, { color: theme.text?.primary }]}
              >
                {summaryByType.lunch}
              </ThemedText>
              <ThemedText
                style={[styles.summaryLabel, { color: theme.text?.secondary }]}
              >
                Lunch
              </ThemedText>
            </View>
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: theme.cardBackground ?? theme.surface,
                  borderColor: theme.border?.secondary ?? theme.cardBorder,
                  borderWidth: 1,
                  shadowColor: theme.shadow?.light ?? theme.cardShadow,
                },
              ]}
            >
              <View
                style={[
                  styles.summaryIconWrap,
                  {
                    backgroundColor: (theme.primary ?? theme.secondary) + '18',
                  },
                ]}
              >
                <Ionicons
                  name='moon'
                  size={22}
                  color={theme.primary ?? theme.secondary}
                />
              </View>
              <ThemedText
                style={[styles.summaryValue, { color: theme.text?.primary }]}
              >
                {summaryByType.dinner}
              </ThemedText>
              <ThemedText
                style={[styles.summaryLabel, { color: theme.text?.secondary }]}
              >
                Dinner
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Recent Meals - modern card container */}
        <View
          style={[styles.section, { paddingHorizontal: 16, marginBottom: 28 }]}
        >
          <View style={styles.sectionHeader}>
            <ThemedText
              style={[styles.sectionTitle, { color: theme.text?.primary }]}
            >
              Recent My Meals
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.monthFilterButton,
                {
                  backgroundColor:
                    (theme.status?.success ?? theme.primary) + '18',
                  borderColor: theme.status?.success ?? theme.primary,
                },
              ]}
              onPress={() => {
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                const filteredMeals = (meals || []).filter(meal => {
                  if (!isMyMeal(meal)) return false;
                  const mealDate = new Date(meal.date);
                  return (
                    mealDate.getMonth() === currentMonth &&
                    mealDate.getFullYear() === currentYear
                  );
                });
                const totalSlots = countMealSlots(filteredMeals);
                showAlert(
                  'Current Month',
                  `Showing ${totalSlots} meals (${filteredMeals.length} ${filteredMeals.length === 1 ? 'day' : 'days'}) for current month`,
                  'info'
                );
              }}
            >
              <Ionicons
                name='calendar'
                size={20}
                color={theme.status?.success ?? theme.primary}
              />
              <ThemedText
                style={[
                  styles.monthFilterText,
                  { color: theme.status?.success ?? theme.primary },
                ]}
              >
                Current Month
              </ThemedText>
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.mealsList,
              {
                backgroundColor: theme.cardBackground ?? theme.surface,
                borderColor: theme.border?.secondary ?? theme.cardBorder,
                borderWidth: 1,
                shadowColor: theme.shadow?.light ?? theme.cardShadow,
              },
            ]}
          >
            {recentMyMeals.map((meal, index) => (
              <ActivityCard
                key={meal.id || `meal-${index}`}
                title={`Meal on ${new Date(meal.date || new Date()).toLocaleDateString()}`}
                description={getMealSummary(meal)}
                icon='restaurant'
                iconBackgroundColor={theme.status?.success ?? theme.primary}
                timestamp={meal.date || new Date().toISOString()}
                amount={getMealAmountLabel(meal)}
                status={
                  meal?.status === 'approved'
                    ? 'success'
                    : meal?.status === 'rejected'
                      ? 'error'
                      : 'warning'
                }
                onPress={() => handleMealPress(meal)}
                variant='compact'
                isSmallScreen={isSmallScreen}
              />
            ))}
            {recentMyMeals.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons
                  name='restaurant-outline'
                  size={48}
                  color={theme.text?.secondary ?? theme.icon?.secondary}
                />
                <ThemedText
                  style={[
                    styles.emptyStateText,
                    { color: theme.text?.secondary },
                  ]}
                >
                  No My Meals recorded yet
                </ThemedText>
                <ThemedText
                  style={[
                    styles.emptyStateSubtext,
                    { color: theme.text?.tertiary },
                  ]}
                >
                  Add your first My Meal to get started
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    );
  };

  const handleDateChange = (_event: unknown, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (date) {
      // Don't allow future dates
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (date > today) {
        showAlert('Invalid Date', 'Cannot select future dates', 'error');
        return;
      }

      setSelectedDate(date);
    } else if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  };

  const confirmDateSelection = () => {
    setShowDatePicker(false);
  };

  const renderAddMeal = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.addMealScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <ScreenBackButton onPress={() => setActiveTab('overview')} />
      <DashboardHeader
        title='Add New Meal'
        subtitle='Record My Meals for today'
        icon='add-circle'
      />
      <View style={styles.addMealForm}>
        {/* Date Selection */}
        <View style={styles.formSection}>
          <ThemedText
            style={[styles.formSectionTitle, { color: theme.text?.primary }]}
          >
            Date
          </ThemedText>
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor, borderColor }]}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Ionicons name='calendar' size={20} color={theme.primary} />
            <ThemedText style={[styles.dateButtonText, { color: textColor }]}>
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <ThemedText
            style={[styles.formSectionTitle, { color: theme.text?.primary }]}
          >
            Select Meals
          </ThemedText>
          <View style={styles.mealOptions}>
            <TouchableOpacity
              style={[
                styles.mealOption,
                !selectedMeals.breakfast && {
                  backgroundColor:
                    theme.cardBackground ?? theme.surface ?? '#fff',
                  borderColor: theme.border?.secondary ?? '#e5e7eb',
                },
                selectedMeals.breakfast && [
                  styles.mealOptionSelected,
                  {
                    backgroundColor:
                      theme.status?.success ??
                      theme.gradient?.success?.[0] ??
                      '#10b981',
                    borderColor:
                      theme.status?.success ??
                      theme.gradient?.success?.[0] ??
                      '#10b981',
                  },
                ],
              ]}
              onPress={() => toggleMeal('breakfast')}
            >
              <Ionicons
                name='sunny'
                size={24}
                color={
                  selectedMeals.breakfast
                    ? (theme.text?.inverse ?? '#fff')
                    : (theme.status?.warning ??
                      theme.gradient?.warning?.[0] ??
                      '#f59e0b')
                }
              />
              <ThemedText
                style={[
                  styles.mealOptionText,
                  selectedMeals.breakfast && styles.mealOptionTextSelected,
                  {
                    color: selectedMeals.breakfast
                      ? (theme.text?.inverse ?? '#fff')
                      : textColor,
                  },
                ]}
              >
                Breakfast
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.mealOption,
                !selectedMeals.lunch && {
                  backgroundColor:
                    theme.cardBackground ?? theme.surface ?? '#fff',
                  borderColor: theme.border?.secondary ?? '#e5e7eb',
                },
                selectedMeals.lunch && [
                  styles.mealOptionSelected,
                  {
                    backgroundColor:
                      theme.status?.success ??
                      theme.gradient?.success?.[0] ??
                      '#10b981',
                    borderColor:
                      theme.status?.success ??
                      theme.gradient?.success?.[0] ??
                      '#10b981',
                  },
                ],
              ]}
              onPress={() => toggleMeal('lunch')}
            >
              <Ionicons
                name='partly-sunny'
                size={24}
                color={
                  selectedMeals.lunch
                    ? (theme.text?.inverse ?? '#fff')
                    : (theme.status?.success ??
                      theme.gradient?.success?.[0] ??
                      '#10b981')
                }
              />
              <ThemedText
                style={[
                  styles.mealOptionText,
                  selectedMeals.lunch && styles.mealOptionTextSelected,
                  {
                    color: selectedMeals.lunch
                      ? (theme.text?.inverse ?? '#fff')
                      : textColor,
                  },
                ]}
              >
                Lunch
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.mealOption,
                !selectedMeals.dinner && {
                  backgroundColor:
                    theme.cardBackground ?? theme.surface ?? '#fff',
                  borderColor: theme.border?.secondary ?? '#e5e7eb',
                },
                selectedMeals.dinner && [
                  styles.mealOptionSelected,
                  {
                    backgroundColor:
                      theme.primary ??
                      theme.gradient?.primary?.[0] ??
                      '#8b5cf6',
                    borderColor:
                      theme.primary ??
                      theme.gradient?.primary?.[0] ??
                      '#8b5cf6',
                  },
                ],
              ]}
              onPress={() => toggleMeal('dinner')}
            >
              <Ionicons
                name='moon'
                size={24}
                color={
                  selectedMeals.dinner
                    ? (theme.text?.inverse ?? '#fff')
                    : (theme.primary ??
                      theme.gradient?.primary?.[0] ??
                      '#8b5cf6')
                }
              />
              <ThemedText
                style={[
                  styles.mealOptionText,
                  selectedMeals.dinner && styles.mealOptionTextSelected,
                  {
                    color: selectedMeals.dinner
                      ? (theme.text?.inverse ?? '#fff')
                      : textColor,
                  },
                ]}
              >
                Dinner
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formSection}>
          <TouchableOpacity
            style={[styles.guestMealsToggle, { backgroundColor, borderColor }]}
            onPress={() => setShowGuestMeals(prev => !prev)}
            activeOpacity={0.7}
          >
            <View style={styles.guestMealsToggleLeft}>
              <Ionicons
                name='people-outline'
                size={22}
                color={theme.primary ?? theme.gradient?.primary?.[0]}
              />
              <View>
                <ThemedText
                  style={[styles.guestMealsToggleTitle, { color: textColor }]}
                >
                  Guest Meals (Optional)
                </ThemedText>
                <ThemedText
                  style={[
                    styles.guestMealsToggleSubtitle,
                    { color: theme.text?.secondary },
                  ]}
                  numberOfLines={1}
                >
                  Not regular—add if you had guests that day
                </ThemedText>
              </View>
            </View>
            <Ionicons
              name={showGuestMeals ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={theme.text?.secondary ?? iconColor}
            />
          </TouchableOpacity>
          {showGuestMeals && (
            <View style={styles.guestMealsContent}>
              <ThemedText
                style={[
                  styles.formSectionSubtitle,
                  { color: theme.text?.secondary },
                ]}
              >
                Add number of guests for each meal type.
              </ThemedText>
              <View style={styles.guestMealsRow}>
                <View style={styles.guestMealInputWrap}>
                  <ThemedText
                    style={[styles.guestMealLabel, { color: textColor }]}
                  >
                    Breakfast
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.guestMealInput,
                      { backgroundColor, borderColor, color: textColor },
                    ]}
                    value={String(guestMeals.breakfast)}
                    onChangeText={t => {
                      const n = Math.min(
                        99,
                        Math.max(0, parseInt(t.replace(/\D/g, '') || '0', 10))
                      );
                      setGuestMeals(prev => ({ ...prev, breakfast: n }));
                    }}
                    keyboardType='number-pad'
                    maxLength={2}
                    placeholder='0'
                    placeholderTextColor={iconColor}
                  />
                </View>
                <View style={styles.guestMealInputWrap}>
                  <ThemedText
                    style={[styles.guestMealLabel, { color: textColor }]}
                  >
                    Lunch
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.guestMealInput,
                      { backgroundColor, borderColor, color: textColor },
                    ]}
                    value={String(guestMeals.lunch)}
                    onChangeText={t => {
                      const n = Math.min(
                        99,
                        Math.max(0, parseInt(t.replace(/\D/g, '') || '0', 10))
                      );
                      setGuestMeals(prev => ({ ...prev, lunch: n }));
                    }}
                    keyboardType='number-pad'
                    maxLength={2}
                    placeholder='0'
                    placeholderTextColor={iconColor}
                  />
                </View>
                <View style={styles.guestMealInputWrap}>
                  <ThemedText
                    style={[styles.guestMealLabel, { color: textColor }]}
                  >
                    Dinner
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.guestMealInput,
                      { backgroundColor, borderColor, color: textColor },
                    ]}
                    value={String(guestMeals.dinner)}
                    onChangeText={t => {
                      const n = Math.min(
                        99,
                        Math.max(0, parseInt(t.replace(/\D/g, '') || '0', 10))
                      );
                      setGuestMeals(prev => ({ ...prev, dinner: n }));
                    }}
                    keyboardType='number-pad'
                    maxLength={2}
                    placeholder='0'
                    placeholderTextColor={iconColor}
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.formSection}>
          <ThemedText
            style={[styles.formSectionTitle, { color: theme.text?.primary }]}
          >
            Notes (Optional)
          </ThemedText>
          <TextInput
            style={[
              styles.notesInput,
              { backgroundColor, borderColor, color: textColor },
            ]}
            placeholder='Add any special notes about your meal...'
            placeholderTextColor={iconColor}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical='top'
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor:
                theme.button?.primary?.background ?? theme.primary,
            },
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitMeal}
          disabled={submitting}
        >
          <ThemedText
            style={[
              styles.submitButtonText,
              { color: theme.button?.primary?.text ?? theme.text?.inverse },
            ]}
          >
            {submitting ? 'Submitting...' : 'Submit Meal'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType='slide'
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={[styles.modalTitle, { color: textColor }]}>
                  Select Date
                </ThemedText>
                <TouchableOpacity
                  onPress={confirmDateSelection}
                  style={styles.closeButton}
                >
                  <Ionicons name='checkmark' size={24} color={theme.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={selectedDate}
                  mode='date'
                  display='spinner'
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(2020, 0, 1)}
                  themeVariant='light'
                />
              </View>
            </View>
          </View>
        </Modal>
      ) : (
        showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode='date'
            display='default'
            onChange={handleDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(2020, 0, 1)}
          />
        )
      )}
    </ScrollView>
  );

  const renderHistory = () => (
    <View style={styles.container}>
      <ScreenBackButton onPress={() => setActiveTab('overview')} />
      <DashboardHeader
        title='My Meals History'
        subtitle='View all my past Meals'
        icon='time'
      />
      <View style={styles.historyContent}>
        <View style={styles.historyStats}>
          <TouchableOpacity
            style={[
              styles.historyStatCard,
              {
                backgroundColor: theme.cardBackground ?? theme.surface,
                borderColor:
                  historyFilter === 'total'
                    ? (theme.status?.success ?? theme.primary)
                    : (theme.border?.secondary ?? theme.cardBorder),
                borderWidth: historyFilter === 'total' ? 2 : 1,
                shadowColor: theme.shadow?.light ?? theme.cardShadow,
              },
            ]}
            onPress={() => setHistoryFilter('total')}
            activeOpacity={0.7}
          >
            <ThemedText
              style={[styles.historyStatValue, { color: theme.text?.primary }]}
            >
              {countMealSlots(meals ?? [])}
            </ThemedText>
            <ThemedText
              style={[
                styles.historyStatLabel,
                { color: theme.text?.secondary },
              ]}
            >
              Total Meals
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.historyStatCard,
              {
                backgroundColor: theme.cardBackground ?? theme.surface,
                borderColor:
                  historyFilter === 'my'
                    ? (theme.status?.success ?? theme.primary)
                    : (theme.border?.secondary ?? theme.cardBorder),
                borderWidth: historyFilter === 'my' ? 2 : 1,
                shadowColor: theme.shadow?.light ?? theme.cardShadow,
              },
            ]}
            onPress={() => setHistoryFilter('my')}
            activeOpacity={0.7}
          >
            <ThemedText
              style={[styles.historyStatValue, { color: theme.text?.primary }]}
            >
              {countMealSlots(meals ?? [], isMyMeal)}
            </ThemedText>
            <ThemedText
              style={[
                styles.historyStatLabel,
                { color: theme.text?.secondary },
              ]}
            >
              My Meals
            </ThemedText>
          </TouchableOpacity>
        </View>

        <FlatList
          data={historyMeals}
          style={styles.historyFlatList}
          keyExtractor={(item, index) => item.id || `meal-${index}`}
          renderItem={({ item: meal, index }) => (
            <ActivityCard
              title={`Meal on ${new Date(meal.date || new Date()).toLocaleDateString()}`}
              description={getMealSummary(meal)}
              icon='restaurant'
              iconBackgroundColor={theme.status?.success ?? theme.primary}
              timestamp={meal.date || new Date().toISOString()}
              amount={getMealAmountLabel(meal)}
              status={
                meal?.status === 'approved'
                  ? 'success'
                  : meal?.status === 'rejected'
                    ? 'error'
                    : 'warning'
              }
              onPress={() => handleMealPress(meal)}
              variant='compact'
              isSmallScreen={isSmallScreen}
            />
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons
                name='restaurant-outline'
                size={48}
                color={theme.text?.secondary ?? theme.icon?.secondary}
              />
              <ThemedText
                style={[
                  styles.emptyStateText,
                  { color: theme.text?.secondary },
                ]}
              >
                No meal history found
              </ThemedText>
              <ThemedText
                style={[
                  styles.emptyStateSubtext,
                  { color: theme.text?.tertiary },
                ]}
              >
                Start adding meals to see your history
              </ThemedText>
            </View>
          )}
          contentContainerStyle={styles.historyList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'add' && renderAddMeal()}
      {activeTab === 'history' && renderHistory()}
      <MealDetailModal
        visible={!!selectedMeal}
        meal={selectedMeal}
        onClose={closeMealDetail}
      />
      {infoModal && (
        <InfoModal
          visible
          title={infoModal.title}
          message={infoModal.message}
          variant={infoModal.variant}
          onClose={() => setInfoModal(null)}
        />
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  overviewScrollContent: {
    paddingBottom: 28,
  },
  addMealScrollContent: {
    paddingBottom: 28,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 24,
  },
  monthFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  monthFilterText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  mealsList: {
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  addMealForm: {
    padding: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  formSectionSubtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  guestMealsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  guestMealsToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  guestMealsToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  guestMealsToggleSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  guestMealsContent: {
    marginTop: 12,
    paddingTop: 4,
  },
  guestMealsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  guestMealInputWrap: {
    flex: 1,
  },
  guestMealLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  guestMealInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  mealOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  mealOption: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mealOptionText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  mealOptionSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  mealOptionTextSelected: {
    color: '#fff',
  },
  notesInput: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    minHeight: 100,
    justifyContent: 'center',
  },
  notesPlaceholder: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  submitButton: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  historyContent: {
    flex: 1,
    padding: 20,
  },
  historyFlatList: {
    flex: 1,
  },
  historyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  historyStatCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  historyStatValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  historyStatLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyList: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 16,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  datePickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
