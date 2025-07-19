import React, { createContext, useContext, useState } from 'react';

// Types for mess data
interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'member';
  joinDate: string;
  status: 'active' | 'inactive';
  totalMeals: number;
  totalContribution: number;
  monthlyContribution: number;
  lastPaymentDate: string;
}

interface MealEntry {
  id: string;
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  submittedBy: string;
  submittedAt: string;
  cost: number;
}

interface BazarEntry {
  id: string;
  date: string;
  items: string[];
  totalAmount: number;
  submittedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
}

interface Activity {
  id: string;
  type: 'meal' | 'payment' | 'bazar' | 'member' | 'approval';
  title: string;
  description: string;
  time: string;
  priority: 'low' | 'medium' | 'high';
  amount?: number;
  user?: string;
  icon?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  memberCount: number;
  averageMeals: number;
}

interface MessDataContextType {
  // Members
  members: Member[];
  activeMembers: Member[];

  // Meals
  mealEntries: MealEntry[];
  recentMeals: MealEntry[];
  monthlyMealStats: {
    totalMeals: number;
    averagePerDay: number;
    totalCost: number;
    breakfastCount: number;
    lunchCount: number;
    dinnerCount: number;
  };

  // Bazar
  bazarEntries: BazarEntry[];
  pendingBazar: BazarEntry[];
  approvedBazar: BazarEntry[];

  // Revenue & Finance
  monthlyRevenue: MonthlyRevenue[];
  currentMonthRevenue: MonthlyRevenue;
  totalRevenue: number;
  totalExpenses: number;
  currentBalance: number;

  // Activities
  activities: Activity[];
  recentActivities: Activity[];

  // Statistics
  quickStats: {
    totalMembers: number;
    monthlyExpense: number;
    averageMeals: number;
    balance: number;
  };

  // Chart Data
  weeklyMealsData: {
    label: string;
    value: number;
    forecast: number;
    color: string;
    gradient: readonly [string, string];
    trend: 'up' | 'down';
  }[];

  monthlyRevenueData: {
    date: string;
    value: number;
    forecast?: number;
  }[];

  expenseBreakdownData: {
    label: string;
    value: number;
    forecast: number;
    color: string;
    gradient: readonly [string, string];
  }[];

  memberActivityData: {
    label: string;
    value: number;
    forecast: number;
    color: string;
    gradient: readonly [string, string];
    trend: 'up' | 'down';
  }[];

  // Methods
  addMealEntry: (entry: Omit<MealEntry, 'id'>) => void;
  addBazarEntry: (entry: Omit<BazarEntry, 'id'>) => void;
  approveBazar: (id: string, approvedBy: string) => void;
  addMember: (member: Omit<Member, 'id'>) => void;
  updateMemberStatus: (id: string, status: 'active' | 'inactive') => void;
  addActivity: (activity: Omit<Activity, 'id'>) => void;
  refreshData: () => void;
}

const MessDataContext = createContext<MessDataContextType | undefined>(
  undefined
);

export const useMessData = () => {
  const context = useContext(MessDataContext);
  if (!context) {
    throw new Error('useMessData must be used within a MessDataProvider');
  }
  return context;
};

// Realistic Bangladeshi mess data
const generateRealisticData = () => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Generate members with realistic Bangladeshi names
  const members: Member[] = [
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@mess.com',
      phone: '+880 1712-345678',
      role: 'admin',
      joinDate: '2024-01-01',
      status: 'active',
      totalMeals: 87,
      totalContribution: 4350,
      monthlyContribution: 500,
      lastPaymentDate: '2024-01-15',
    },
    {
      id: '2',
      name: 'Member One',
      email: 'member1@mess.com',
      phone: '+880 1812-345679',
      role: 'member',
      joinDate: '2024-01-05',
      status: 'active',
      totalMeals: 76,
      totalContribution: 3800,
      monthlyContribution: 500,
      lastPaymentDate: '2024-01-10',
    },
    {
      id: '3',
      name: 'Member Two',
      email: 'member2@mess.com',
      phone: '+880 1912-345680',
      role: 'member',
      joinDate: '2024-01-10',
      status: 'active',
      totalMeals: 82,
      totalContribution: 4100,
      monthlyContribution: 500,
      lastPaymentDate: '2024-01-12',
    },
    {
      id: '4',
      name: 'Member Three',
      email: 'member3@mess.com',
      phone: '+880 1612-345681',
      role: 'member',
      joinDate: '2024-01-15',
      status: 'active',
      totalMeals: 45,
      totalContribution: 2250,
      monthlyContribution: 500,
      lastPaymentDate: '2024-01-08',
    },
    {
      id: '5',
      name: 'Member Four',
      email: 'member4@mess.com',
      phone: '+880 1512-345682',
      role: 'member',
      joinDate: '2024-01-20',
      status: 'active',
      totalMeals: 38,
      totalContribution: 1900,
      monthlyContribution: 500,
      lastPaymentDate: '2024-01-18',
    },
    {
      id: '6',
      name: 'Member Five',
      email: 'member5@mess.com',
      phone: '+880 1412-345683',
      role: 'member',
      joinDate: '2024-01-25',
      status: 'active',
      totalMeals: 32,
      totalContribution: 1600,
      monthlyContribution: 500,
      lastPaymentDate: '2024-01-22',
    },
  ];

  // Generate meal entries for the last 30 days
  const mealEntries: MealEntry[] = [];
  const mealCosts = [
    45, 50, 55, 48, 52, 47, 53, 49, 51, 46, 54, 50, 48, 52, 49, 51, 47, 53, 50,
    48, 52, 49, 51, 47, 53, 50, 48, 52, 49, 51,
  ];

  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Generate realistic meal patterns
    const dayOfWeek = date.getDay();
    const hasBreakfast = dayOfWeek !== 0; // No breakfast on Sunday
    const hasLunch = true; // Always has lunch
    const hasDinner = dayOfWeek !== 6; // No dinner on Saturday

    mealEntries.push({
      id: `meal-${i}`,
      date: dateStr,
      breakfast: hasBreakfast,
      lunch: hasLunch,
      dinner: hasDinner,
      submittedBy: members[Math.floor(Math.random() * members.length)].name,
      submittedAt: date.toISOString(),
      cost: mealCosts[i % mealCosts.length],
    });
  }

  // Generate bazar entries
  const bazarEntries: BazarEntry[] = [];
  const bazarItems = [
    ['Rice', 'Vegetables', 'Fish', 'Oil'],
    ['Chicken', 'Potatoes', 'Onions', 'Spices'],
    ['Beef', 'Tomatoes', 'Eggs', 'Milk'],
    ['Fish', 'Carrots', 'Bread', 'Tea'],
    ['Mutton', 'Cucumber', 'Butter', 'Sugar'],
  ];

  for (let i = 14; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i * 2); // Every 2 days
    const dateStr = date.toISOString().split('T')[0];

    const items = bazarItems[i % bazarItems.length];
    const totalAmount = items.length * 150 + Math.floor(Math.random() * 500);

    bazarEntries.push({
      id: `bazar-${i}`,
      date: dateStr,
      items,
      totalAmount,
      submittedBy: members[Math.floor(Math.random() * members.length)].name,
      status: i < 5 ? 'approved' : 'pending',
      approvedBy: i < 5 ? 'Admin User' : undefined,
      approvedAt:
        i < 5 ? new Date(date.getTime() + 86400000).toISOString() : undefined,
    });
  }

  // Generate monthly revenue data
  const monthlyRevenue: MonthlyRevenue[] = [];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  for (let i = 0; i < 12; i++) {
    const baseRevenue = 30000 + Math.floor(Math.random() * 10000);
    const expenses = baseRevenue * 0.7 + Math.floor(Math.random() * 5000);
    const profit = baseRevenue - expenses;
    const memberCount = 6 + Math.floor(Math.random() * 2);
    const averageMeals = 2.5 + Math.random() * 0.5;

    monthlyRevenue.push({
      month: months[i],
      revenue: baseRevenue,
      expenses,
      profit,
      memberCount,
      averageMeals,
    });
  }

  // Generate activities
  const activities: Activity[] = [
    {
      id: '1',
      type: 'meal',
      title: 'Meal Entry Added',
      description: 'Admin User submitted meals for today',
      time: new Date().toISOString(),
      priority: 'medium',
      user: 'Admin User',
      icon: 'fast-food',
    },
    {
      id: '2',
      type: 'bazar',
      title: 'Bazar Entry Approved',
      description: 'Bazar entry for ৳1,200 approved',
      time: new Date(Date.now() - 86400000).toISOString(),
      priority: 'low',
      amount: 1200,
      user: 'Member One',
      icon: 'cart',
      status: 'approved',
    },
    {
      id: '3',
      type: 'payment',
      title: 'Payment Received',
      description: 'Monthly contribution received from Member Two',
      time: new Date(Date.now() - 172800000).toISOString(),
      priority: 'high',
      amount: 500,
      user: 'Member Two',
      icon: 'wallet',
    },
    {
      id: '4',
      type: 'member',
      title: 'New Member Added',
      description: 'Member Five joined the mess',
      time: new Date(Date.now() - 259200000).toISOString(),
      priority: 'medium',
      user: 'Member Five',
      icon: 'person',
    },
    {
      id: '5',
      type: 'approval',
      title: 'Bazar Entry Pending',
      description: 'Bazar entry for ৳800 awaiting approval',
      time: new Date(Date.now() - 345600000).toISOString(),
      priority: 'medium',
      amount: 800,
      user: 'Member Three',
      icon: 'time',
      status: 'pending',
    },
  ];

  return {
    members,
    mealEntries,
    bazarEntries,
    monthlyRevenue,
    activities,
  };
};

export const MessDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [data, setData] = useState(generateRealisticData());

  // Safe number conversion utility
  const safeNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Computed values
  const activeMembers = data.members.filter(m => m.status === 'active');
  const recentMeals = data.mealEntries.slice(0, 7);
  const pendingBazar = data.bazarEntries.filter(b => b.status === 'pending');
  const approvedBazar = data.bazarEntries.filter(b => b.status === 'approved');
  const recentActivities = data.activities.slice(0, 5);

  // Monthly meal statistics
  const currentMonthMeals = data.mealEntries.filter(meal => {
    const mealDate = new Date(meal.date);
    return mealDate.getMonth() === new Date().getMonth();
  });

  const monthlyMealStats = {
    totalMeals: currentMonthMeals.reduce(
      (sum, meal) =>
        sum +
        (meal.breakfast ? 1 : 0) +
        (meal.lunch ? 1 : 0) +
        (meal.dinner ? 1 : 0),
      0
    ),
    averagePerDay:
      currentMonthMeals.length > 0
        ? currentMonthMeals.reduce(
            (sum, meal) =>
              sum +
              (meal.breakfast ? 1 : 0) +
              (meal.lunch ? 1 : 0) +
              (meal.dinner ? 1 : 0),
            0
          ) / currentMonthMeals.length
        : 0,
    totalCost: currentMonthMeals.reduce((sum, meal) => sum + meal.cost, 0),
    breakfastCount: currentMonthMeals.reduce(
      (sum, meal) => sum + (meal.breakfast ? 1 : 0),
      0
    ),
    lunchCount: currentMonthMeals.reduce(
      (sum, meal) => sum + (meal.lunch ? 1 : 0),
      0
    ),
    dinnerCount: currentMonthMeals.reduce(
      (sum, meal) => sum + (meal.dinner ? 1 : 0),
      0
    ),
  };

  // Current month revenue
  const currentMonthRevenue = data.monthlyRevenue[
    data.monthlyRevenue.length - 1
  ] || {
    revenue: 0,
    expenses: 0,
    profit: 0,
    memberCount: 0,
    averageMeals: 0,
  };
  const totalRevenue = data.monthlyRevenue.reduce(
    (sum: number, month: MonthlyRevenue) => sum + safeNumber(month.revenue),
    0
  );
  const totalExpenses = data.monthlyRevenue.reduce(
    (sum: number, month: MonthlyRevenue) => sum + safeNumber(month.expenses),
    0
  );
  const currentBalance = totalRevenue - totalExpenses;

  // Quick stats
  const quickStats = {
    totalMembers: safeNumber(activeMembers.length),
    monthlyExpense: safeNumber(currentMonthRevenue.expenses),
    averageMeals: safeNumber(monthlyMealStats.averagePerDay),
    balance: safeNumber(currentBalance),
  };

  // Chart data
  const weeklyMealsData = [
    {
      label: 'Mon',
      value: 12,
      forecast: 14,
      color: '#f59e0b',
      gradient: ['#fbbf24', '#f59e0b'] as const,
      trend: 'up' as const,
    },
    {
      label: 'Tue',
      value: 15,
      forecast: 16,
      color: '#10b981',
      gradient: ['#34d399', '#10b981'] as const,
      trend: 'up' as const,
    },
    {
      label: 'Wed',
      value: 18,
      forecast: 17,
      color: '#6366f1',
      gradient: ['#818cf8', '#6366f1'] as const,
      trend: 'down' as const,
    },
    {
      label: 'Thu',
      value: 14,
      forecast: 15,
      color: '#f093fb',
      gradient: ['#f093fb', '#f5576c'] as const,
      trend: 'up' as const,
    },
    {
      label: 'Fri',
      value: 16,
      forecast: 18,
      color: '#43e97b',
      gradient: ['#43e97b', '#38f9d7'] as const,
      trend: 'up' as const,
    },
    {
      label: 'Sat',
      value: 20,
      forecast: 22,
      color: '#667eea',
      gradient: ['#667eea', '#764ba2'] as const,
      trend: 'up' as const,
    },
    {
      label: 'Sun',
      value: 13,
      forecast: 15,
      color: '#f97316',
      gradient: ['#fb923c', '#f97316'] as const,
      trend: 'up' as const,
    },
  ];

  // Generate monthly data for each month (daily data within each month)
  const generateMonthlyData = (monthName: string, baseRevenue: number) => {
    const daysInMonth = 30; // Simplified for all months
    const monthlyData = [];

    for (let day = 1; day <= daysInMonth; day++) {
      // Daily variation based on day of week
      const dayOfWeek = (day - 1) % 7;
      let dailyRevenue = baseRevenue / 30; // Average daily revenue

      // Weekend adjustments (Friday-Sunday typically have more meals)
      if (dayOfWeek >= 4) {
        // Friday, Saturday, Sunday
        dailyRevenue *= 1.2; // 20% more on weekends
      } else if (dayOfWeek === 0) {
        // Monday
        dailyRevenue *= 0.9; // 10% less on Monday
      }

      // Add some random variation
      dailyRevenue += (Math.random() - 0.5) * 500;

      monthlyData.push({
        date: `${day}`,
        value: Math.round(dailyRevenue),
        forecast: Math.round(dailyRevenue * (1 + (Math.random() - 0.5) * 0.1)),
      });
    }

    return monthlyData;
  };

  const monthlyRevenueData = generateMonthlyData(
    'Dec',
    data.monthlyRevenue[data.monthlyRevenue.length - 1]?.revenue || 30000
  );

  const expenseBreakdownData = [
    {
      label: 'Groceries',
      value: 45,
      forecast: 48,
      color: '#10b981',
      gradient: ['#34d399', '#10b981'] as const,
    },
    {
      label: 'Utilities',
      value: 25,
      forecast: 26,
      color: '#6366f1',
      gradient: ['#818cf8', '#6366f1'] as const,
    },
    {
      label: 'Maintenance',
      value: 20,
      forecast: 18,
      color: '#f59e0b',
      gradient: ['#fbbf24', '#f59e0b'] as const,
    },
    {
      label: 'Others',
      value: 10,
      forecast: 12,
      color: '#f093fb',
      gradient: ['#f093fb', '#f5576c'] as const,
    },
  ];

  const memberActivityData = data.members.slice(0, 4).map((member, index) => ({
    label: member.name.split(' ')[0],
    value: member.totalMeals,
    forecast: member.totalMeals + Math.floor(Math.random() * 10),
    color:
      index === 0
        ? '#667eea'
        : index === 1
        ? '#f093fb'
        : index === 2
        ? '#43e97b'
        : '#f59e0b',
    gradient:
      index === 0
        ? (['#667eea', '#764ba2'] as const)
        : index === 1
        ? (['#f093fb', '#f5576c'] as const)
        : index === 2
        ? (['#43e97b', '#38f9d7'] as const)
        : (['#fbbf24', '#f59e0b'] as const),
    trend: 'up' as const,
  }));

  // Methods
  const addMealEntry = (entry: Omit<MealEntry, 'id'>) => {
    const newEntry: MealEntry = {
      ...entry,
      id: `meal-${Date.now()}`,
    };
    setData(prev => ({
      ...prev,
      mealEntries: [newEntry, ...prev.mealEntries],
    }));
  };

  const addBazarEntry = (entry: Omit<BazarEntry, 'id'>) => {
    const newEntry: BazarEntry = {
      ...entry,
      id: `bazar-${Date.now()}`,
    };
    setData(prev => ({
      ...prev,
      bazarEntries: [newEntry, ...prev.bazarEntries],
    }));
  };

  const approveBazar = (id: string, approvedBy: string) => {
    setData(prev => ({
      ...prev,
      bazarEntries: prev.bazarEntries.map(entry =>
        entry.id === id
          ? {
              ...entry,
              status: 'approved',
              approvedBy,
              approvedAt: new Date().toISOString(),
            }
          : entry
      ),
    }));
  };

  const addMember = (member: Omit<Member, 'id'>) => {
    const newMember: Member = {
      ...member,
      id: `member-${Date.now()}`,
    };
    setData(prev => ({
      ...prev,
      members: [...prev.members, newMember],
    }));
  };

  const updateMemberStatus = (id: string, status: 'active' | 'inactive') => {
    setData(prev => ({
      ...prev,
      members: prev.members.map(member =>
        member.id === id ? { ...member, status } : member
      ),
    }));
  };

  const addActivity = (activity: Omit<Activity, 'id'>) => {
    const newActivity: Activity = {
      ...activity,
      id: `activity-${Date.now()}`,
    };
    setData(prev => ({
      ...prev,
      activities: [newActivity, ...prev.activities],
    }));
  };

  const refreshData = () => {
    setData(generateRealisticData());
  };

  const contextValue: MessDataContextType = {
    members: data.members,
    activeMembers,
    mealEntries: data.mealEntries,
    recentMeals,
    monthlyMealStats,
    bazarEntries: data.bazarEntries,
    pendingBazar,
    approvedBazar,
    monthlyRevenue: data.monthlyRevenue,
    currentMonthRevenue,
    totalRevenue,
    totalExpenses,
    currentBalance,
    activities: data.activities,
    recentActivities,
    quickStats,
    weeklyMealsData,
    monthlyRevenueData,
    expenseBreakdownData,
    memberActivityData,
    addMealEntry,
    addBazarEntry,
    approveBazar,
    addMember,
    updateMemberStatus,
    addActivity,
    refreshData,
  };

  return (
    <MessDataContext.Provider value={contextValue}>
      {children}
    </MessDataContext.Provider>
  );
};
