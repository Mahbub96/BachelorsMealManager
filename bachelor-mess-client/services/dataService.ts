import { userAPI, mealAPI, bazarAPI } from "./api";
import APP_CONFIG from "@/config/app";

// Development dummy data
const DUMMY_DATA = {
  users: [
    {
      _id: "1",
      name: "Admin User",
      email: "admin@example.com",
      phone: "+8801712345678",
      role: "admin",
      status: "active",
      joinDate: "2024-01-01",
      totalMeals: 87,
      totalContribution: 3200,
    },
    {
      _id: "2",
      name: "John Doe",
      email: "john@example.com",
      phone: "+8801712345679",
      role: "member",
      status: "active",
      joinDate: "2024-01-15",
      totalMeals: 76,
      totalContribution: 2800,
    },
    {
      _id: "3",
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "+8801712345680",
      role: "member",
      status: "active",
      joinDate: "2024-02-01",
      totalMeals: 82,
      totalContribution: 3100,
    },
    {
      _id: "4",
      name: "Mike Johnson",
      email: "mike@example.com",
      phone: "+8801712345681",
      role: "member",
      status: "active",
      joinDate: "2024-02-15",
      totalMeals: 65,
      totalContribution: 2400,
    },
    {
      _id: "5",
      name: "Sarah Wilson",
      email: "sarah@example.com",
      phone: "+8801712345682",
      role: "member",
      status: "active",
      joinDate: "2024-03-01",
      totalMeals: 58,
      totalContribution: 2100,
    },
  ],
  meals: [
    {
      _id: "1",
      userId: "2",
      date: "2024-06-21",
      breakfast: true,
      lunch: true,
      dinner: false,
      status: "approved",
      approvedBy: "1",
      approvedAt: "2024-06-21T08:30:00Z",
      notes: "",
      createdAt: "2024-06-21T07:00:00Z",
      updatedAt: "2024-06-21T08:30:00Z",
    },
    {
      _id: "2",
      userId: "3",
      date: "2024-06-21",
      breakfast: false,
      lunch: true,
      dinner: true,
      status: "pending",
      approvedBy: null,
      approvedAt: null,
      notes: "",
      createdAt: "2024-06-21T12:15:00Z",
      updatedAt: "2024-06-21T12:15:00Z",
    },
    {
      _id: "3",
      userId: "2",
      date: "2024-06-20",
      breakfast: true,
      lunch: true,
      dinner: true,
      status: "approved",
      approvedBy: "1",
      approvedAt: "2024-06-20T08:30:00Z",
      notes: "",
      createdAt: "2024-06-20T07:00:00Z",
      updatedAt: "2024-06-20T08:30:00Z",
    },
    {
      _id: "4",
      userId: "3",
      date: "2024-06-20",
      breakfast: true,
      lunch: false,
      dinner: true,
      status: "approved",
      approvedBy: "1",
      approvedAt: "2024-06-20T08:30:00Z",
      notes: "",
      createdAt: "2024-06-20T07:00:00Z",
      updatedAt: "2024-06-20T08:30:00Z",
    },
    {
      _id: "5",
      userId: "4",
      date: "2024-06-19",
      breakfast: false,
      lunch: true,
      dinner: true,
      status: "approved",
      approvedBy: "1",
      approvedAt: "2024-06-19T08:30:00Z",
      notes: "",
      createdAt: "2024-06-19T07:00:00Z",
      updatedAt: "2024-06-19T08:30:00Z",
    },
    // Edge case: meal with missing createdAt
    {
      _id: "6",
      userId: "5",
      date: "2024-06-18",
      breakfast: true,
      lunch: false,
      dinner: false,
      status: "pending",
      approvedBy: null,
      approvedAt: null,
      notes: "",
      createdAt: null,
      updatedAt: "2024-06-18T07:00:00Z",
    },
    // Edge case: meal with malformed createdAt
    {
      _id: "7",
      userId: "5",
      date: "2024-06-17",
      breakfast: false,
      lunch: true,
      dinner: false,
      status: "approved",
      approvedBy: "1",
      approvedAt: "2024-06-17T08:30:00Z",
      notes: "",
      createdAt: "invalid-date",
      updatedAt: "2024-06-17T08:30:00Z",
    },
  ],
  bazar: [
    {
      _id: "1",
      userId: "2",
      date: "2024-06-21",
      items: [
        { name: "Rice", quantity: "5 kg", price: 600 },
        { name: "Vegetables", quantity: "2 kg", price: 300 },
        { name: "Fish", quantity: "1 kg", price: 400 },
      ],
      totalAmount: 1300,
      description: "Weekly grocery shopping",
      receiptImage: null,
      status: "approved",
      approvedBy: "1",
      approvedAt: "2024-06-21T10:00:00Z",
      notes: "Good quality items",
      createdAt: "2024-06-21T09:00:00Z",
      updatedAt: "2024-06-21T10:00:00Z",
    },
    {
      _id: "2",
      userId: "3",
      date: "2024-06-20",
      items: [
        { name: "Chicken", quantity: "2 kg", price: 500 },
        { name: "Oil", quantity: "1 L", price: 180 },
        { name: "Spices", quantity: "0.5 kg", price: 100 },
      ],
      totalAmount: 780,
      description: "Cooking essentials",
      receiptImage: null,
      status: "pending",
      approvedBy: null,
      approvedAt: null,
      notes: "",
      createdAt: "2024-06-20T16:00:00Z",
      updatedAt: "2024-06-20T16:00:00Z",
    },
    {
      _id: "3",
      userId: "4",
      date: "2024-06-19",
      items: [
        { name: "Onions", quantity: "3 kg", price: 240 },
        { name: "Potatoes", quantity: "4 kg", price: 240 },
        { name: "Tomatoes", quantity: "2 kg", price: 180 },
      ],
      totalAmount: 660,
      description: "Vegetables for the week",
      receiptImage: null,
      status: "approved",
      approvedBy: "1",
      approvedAt: "2024-06-19T10:00:00Z",
      notes: "Fresh vegetables",
      createdAt: "2024-06-19T09:00:00Z",
      updatedAt: "2024-06-19T10:00:00Z",
    },
  ],
  stats: {
    totalMembers: 5,
    totalMeals: 87,
    totalBazar: 3200,
    currentMonthRevenue: 32400,
    avgMealsPerDay: 2.4,
    weeklyData: [12, 15, 18, 14, 16, 20, 13],
    monthlyData: [8500, 9200, 7800, 10500],
  },
};

// Development flags - Set to false to use real API data
const isDevelopment = process.env.EXPO_PUBLIC_DEV_MODE === "true";
const useDummyData = false; // Changed to false to use real API data

// Simulate API delay for better UX
const simulateDelay = (ms: number = 800) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Error handling wrapper
const handleApiCall = async <T>(
  apiCall: () => Promise<T>,
  fallbackData?: any
): Promise<T> => {
  try {
    if (isDevelopment && useDummyData) {
      await simulateDelay();
      // Create a mock AxiosResponse-like object
      return {
        data: fallbackData,
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      } as T;
    }
    return await apiCall();
  } catch (error) {
    console.error("API Error:", error);
    if (fallbackData) {
      return {
        data: fallbackData,
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      } as T;
    }
    throw error;
  }
};

// Data Service Class
export class DataService {
  // User Management
  static async getAllUsers() {
    return handleApiCall(() => userAPI.getAllUsers(), {
      data: DUMMY_DATA.users,
    });
  }

  static async getUserProfile() {
    return handleApiCall(() => userAPI.getProfile(), {
      data: DUMMY_DATA.users[0],
    });
  }

  static async updateUserProfile(profileData: any) {
    return handleApiCall(() => userAPI.updateProfile(profileData), {
      data: { ...DUMMY_DATA.users[0], ...profileData },
    });
  }

  // Meal Management
  static async getUserMeals(params?: any) {
    return handleApiCall(() => mealAPI.getUserMeals(params), {
      data: DUMMY_DATA.meals,
    });
  }

  static async getAllMeals(params?: any) {
    return handleApiCall(() => mealAPI.getAllMeals(params), {
      data: DUMMY_DATA.meals,
    });
  }

  static async submitMeals(mealData: any) {
    return handleApiCall(() => mealAPI.submitMeals(mealData), {
      success: true,
      message: "Meal submitted successfully",
    });
  }

  static async approveMeal(mealId: string) {
    return handleApiCall(
      () => mealAPI.updateMealStatus(mealId, { status: "approved" }),
      { success: true, message: "Meal approved successfully" }
    );
  }

  static async rejectMeal(mealId: string) {
    return handleApiCall(
      () => mealAPI.updateMealStatus(mealId, { status: "rejected" }),
      { success: true, message: "Meal rejected successfully" }
    );
  }

  static async getMealStats(params?: any) {
    return handleApiCall(() => mealAPI.getMealStats(params), {
      data: DUMMY_DATA.stats,
    });
  }

  // Bazar Management
  static async getUserBazar(params?: any) {
    return handleApiCall(() => bazarAPI.getUserBazar(params), {
      data: DUMMY_DATA.bazar,
    });
  }

  static async getAllBazar(params?: any) {
    return handleApiCall(() => bazarAPI.getAllBazar(params), {
      data: DUMMY_DATA.bazar,
    });
  }

  static async submitBazar(bazarData: any, receiptImage?: any) {
    return handleApiCall(() => bazarAPI.submitBazar(bazarData, receiptImage), {
      data: { ...bazarData, _id: Date.now().toString(), status: "pending" },
    });
  }

  static async getBazarStats(params?: any) {
    return handleApiCall(() => bazarAPI.getBazarStats(params), {
      data: DUMMY_DATA.stats,
    });
  }

  static async approveBazar(bazarId: string) {
    return handleApiCall(
      () => bazarAPI.updateBazarStatus(bazarId, { status: "approved" }),
      { success: true, message: "Bazar approved successfully" }
    );
  }

  static async rejectBazar(bazarId: string) {
    return handleApiCall(
      () => bazarAPI.updateBazarStatus(bazarId, { status: "rejected" }),
      { success: true, message: "Bazar rejected successfully" }
    );
  }

  // Helper method to normalize API responses
  static normalizeResponse(response: any) {
    if (response && response.data) {
      // Handle nested structure: {data: {data: [...]}}
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      // Handle direct structure: {data: [...]}
      if (Array.isArray(response.data)) {
        return response.data;
      }
      // Handle object structure: {data: {...}}
      return response.data;
    }
    return response;
  }

  // Dashboard Data
  static async getDashboardData() {
    try {
      if (isDevelopment && useDummyData) {
        await simulateDelay(1200);
        return {
          users: DUMMY_DATA.users,
          mealStats: DUMMY_DATA.stats,
          bazarStats: DUMMY_DATA.stats,
          recentActivity: [
            {
              label: "Last Meal",
              value: "Lunch",
              icon: "fast-food",
              color: "#6366f1",
              time: "Today, 1:30pm",
            },
            {
              label: "Last Bazar",
              value: "John",
              icon: "person",
              color: "#10b981",
              time: "Yesterday, 7:00pm",
            },
          ],
        };
      }

      // Get user profile to check role
      const profileResponse = await userAPI.getProfile();
      const userRole = profileResponse.data.role;
      const isAdmin = userRole === "admin";

      if (isAdmin) {
        // Admin dashboard - get all data
        const [usersResponse, mealStatsResponse, bazarStatsResponse] =
          await Promise.all([
            userAPI.getAllUsers(),
            mealAPI.getMealStats(),
            bazarAPI.getBazarStats(),
          ]);

        return {
          users: usersResponse.data,
          mealStats: mealStatsResponse.data,
          bazarStats: bazarStatsResponse.data,
          recentActivity: [], // Will be populated from real data
        };
      } else {
        // Member dashboard - get user-specific data
        const [profile, userMeals, userBazar] = await Promise.all([
          userAPI.getProfile(),
          mealAPI.getUserMeals({ limit: 10 }),
          bazarAPI.getUserBazar({ limit: 10 }),
        ]);

        // Calculate user-specific stats
        const totalMeals = userMeals.data.reduce((sum: number, meal: any) => {
          return (
            sum +
            (meal.breakfast ? 1 : 0) +
            (meal.lunch ? 1 : 0) +
            (meal.dinner ? 1 : 0)
          );
        }, 0);

        const totalBazarAmount = userBazar.data.reduce(
          (sum: number, entry: any) => sum + entry.totalAmount,
          0
        );

        const mealStats = {
          totalMeals,
          totalBreakfast: userMeals.data.reduce(
            (sum: number, meal: any) => sum + (meal.breakfast ? 1 : 0),
            0
          ),
          totalLunch: userMeals.data.reduce(
            (sum: number, meal: any) => sum + (meal.lunch ? 1 : 0),
            0
          ),
          totalDinner: userMeals.data.reduce(
            (sum: number, meal: any) => sum + (meal.dinner ? 1 : 0),
            0
          ),
          pendingCount: userMeals.data.filter(
            (meal: any) => meal.status === "pending"
          ).length,
          approvedCount: userMeals.data.filter(
            (meal: any) => meal.status === "approved"
          ).length,
          rejectedCount: userMeals.data.filter(
            (meal: any) => meal.status === "rejected"
          ).length,
          userMeals: totalMeals,
          thisMonthMeals: totalMeals,
          userBalance: 0,
        };

        const bazarStats = {
          totalAmount: totalBazarAmount,
          totalEntries: userBazar.data.length,
          pendingCount: userBazar.data.filter(
            (entry: any) => entry.status === "pending"
          ).length,
          approvedCount: userBazar.data.filter(
            (entry: any) => entry.status === "approved"
          ).length,
          rejectedCount: userBazar.data.filter(
            (entry: any) => entry.status === "rejected"
          ).length,
          averageAmount:
            userBazar.data.length > 0
              ? totalBazarAmount / userBazar.data.length
              : 0,
          userContribution: totalBazarAmount,
          totalBazar: totalBazarAmount,
        };

        return {
          users: [profile.data], // Only show current user
          mealStats,
          bazarStats,
          recentActivity: [
            {
              label: "Your Meals",
              value: `${totalMeals} total`,
              icon: "restaurant",
              color: "#6366f1",
              time: "This month",
            },
            {
              label: "Your Bazar",
              value: `${totalBazarAmount} Tk`,
              icon: "cart",
              color: "#10b981",
              time: "This month",
            },
          ],
        };
      }
    } catch (error) {
      console.error("Dashboard data error:", error);
      throw error;
    }
  }

  // Health Check
  static async healthCheck() {
    return handleApiCall(
      () =>
        fetch(`${APP_CONFIG.API.BASE_URL}/health`).then((res) => res.json()),
      { message: "Development mode - using dummy data" }
    );
  }

  static async createUser(userData: any) {
    return handleApiCall(() => userAPI.createUser(userData), {
      success: true,
      message: "User created successfully",
    });
  }

  static async updateUser(userId: string, userData: any) {
    return handleApiCall(() => userAPI.updateUser(userId, userData), {
      success: true,
      message: "User updated successfully",
    });
  }

  static async deleteUser(userId: string) {
    return handleApiCall(() => userAPI.deleteUser(userId), {
      success: true,
      message: "User deleted successfully",
    });
  }
}

export default DataService;
