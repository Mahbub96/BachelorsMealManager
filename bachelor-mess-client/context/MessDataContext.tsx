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

    // Realistic meal patterns (weekends have more meals, weekdays vary)
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const breakfast = Math.random() > 0.3; // 70% chance
    const lunch = Math.random() > 0.1; // 90% chance
    const dinner = Math.random() > 0.2; // 80% chance

    const submittedBy =
      members[Math.floor(Math.random() * members.length)].name;
    const cost = mealCosts[i % mealCosts.length];

    mealEntries.push({
      id: `meal-${i}`,
      date: dateStr,
      breakfast,
      lunch,
      dinner,
      submittedBy,
      submittedAt: `${dateStr} ${Math.floor(Math.random() * 24)}:${Math.floor(
        Math.random() * 60
      )}:00`,
      cost,
    });
  }

  // Generate bazar entries
  const bazarItems = [
    'Rice',
    'Dal',
    'Oil',
    'Onion',
    'Potato',
    'Tomato',
    'Egg',
    'Chicken',
    'Fish',
    'Vegetables',
    'Spices',
    'Salt',
    'Sugar',
    'Tea',
    'Milk',
    'Bread',
    'Banana',
    'Apple',
    'Orange',
    'Lemon',
  ];

  const bazarEntries: BazarEntry[] = [];
  for (let i = 0; i < 8; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i * 3);
    const dateStr = date.toISOString().split('T')[0];

    const itemCount = Math.floor(Math.random() * 8) + 5; // 5-12 items
    const items = [];
    for (let j = 0; j < itemCount; j++) {
      items.push(bazarItems[Math.floor(Math.random() * bazarItems.length)]);
    }

    const totalAmount = Math.floor(Math.random() * 2000) + 1500; // 1500-3500 BDT
    const submittedBy =
      members[Math.floor(Math.random() * members.length)].name;
    const status = i < 3 ? 'pending' : 'approved';

    bazarEntries.push({
      id: `bazar-${i}`,
      date: dateStr,
      items,
      totalAmount,
      submittedBy,
      status,
      approvedBy: status === 'approved' ? 'Admin User' : undefined,
      approvedAt: status === 'approved' ? `${dateStr} 14:30:00` : undefined,
    });
  }

  // Generate monthly revenue data (full year)
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
    // Realistic revenue pattern with seasonal variations
    let baseRevenue = 25000;

    // Seasonal adjustments
    if (i >= 0 && i <= 2) {
      // Jan-Mar: Winter months, higher expenses
      baseRevenue = 28000 + i * 1500;
    } else if (i >= 3 && i <= 5) {
      // Apr-Jun: Spring, moderate
      baseRevenue = 26000 + i * 1200;
    } else if (i >= 6 && i <= 8) {
      // Jul-Sep: Monsoon, some variation
      baseRevenue = 24000 + i * 1800;
    } else {
      // Oct-Dec: Post-monsoon, growing trend
      baseRevenue = 27000 + i * 2000;
    }

    const revenue = baseRevenue + Math.floor(Math.random() * 4000) - 2000; // ±2000 variation
    const expenses = revenue * (0.8 + Math.random() * 0.1); // 80-90% of revenue
    const profit = revenue - expenses;
    const memberCount = 5 + Math.floor(Math.random() * 3); // 5-7 members
    const averageMeals = 2.0 + Math.random() * 0.8; // 2.0-2.8 meals per day

    monthlyRevenue.push({
      month: months[i],
      revenue,
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
      title: 'Lunch added',
      description: 'Admin User recorded lunch meal for today',
      time: '2 hours ago',
      priority: 'medium',
      user: 'Admin User',
      icon: 'restaurant',
    },
    {
      id: '2',
      type: 'bazar',
      title: 'Bazar uploaded',
      description: 'Member Two uploaded bazar list for this week',
      time: '4 hours ago',
      priority: 'low' as const,
      amount: 2500,
      user: 'Member Two',
      icon: 'cart',
    },
    {
      id: '3',
      type: 'payment',
      title: 'Payment received',
      description: 'Member One paid ৳500',
      time: '1 day ago',
      priority: 'low' as const,
      amount: 500,
      user: 'Member One',
      icon: 'card',
    },
    {
      id: '4',
      type: 'member',
      title: 'New member joined',
      description: 'Member Three joined the mess',
      time: '2 days ago',
      priority: 'low' as const,
      amount: 0,
      user: 'Member Three',
      icon: 'person-add',
    },
    {
      id: '5',
      type: 'approval',
      title: 'Bazar approved',
      description: 'Weekly bazar list approved',
      time: '3 days ago',
      priority: 'high',
      amount: 3200,
      user: 'Mahbub Alam',
      icon: 'checkmark-circle',
      status: 'approved',
    },
    {
      id: '6',
      type: 'meal',
      title: 'Breakfast added',
      description: 'Member Three recorded breakfast for yesterday',
      time: '3 days ago',
      priority: 'low' as const,
      amount: 0,
      user: 'Member Three',
      icon: 'sunny',
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
  const currentMonthRevenue =
    data.monthlyRevenue[data.monthlyRevenue.length - 1];
  const totalRevenue = data.monthlyRevenue.reduce(
    (sum, month) => sum + month.revenue,
    0
  );
  const totalExpenses = data.monthlyRevenue.reduce(
    (sum, month) => sum + month.expenses,
    0
  );
  const currentBalance = totalRevenue - totalExpenses;

  // Quick stats
  const quickStats = {
    totalMembers: activeMembers.length,
    monthlyExpense: currentMonthRevenue.expenses,
    averageMeals: monthlyMealStats.averagePerDay,
    balance: currentBalance,
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
