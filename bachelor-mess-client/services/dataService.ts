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

// Environment detection
const isDevelopment = process.env.EXPO_PUBLIC_DEV_MODE === "true";
const useDummyData = process.env.EXPO_PUBLIC_USE_DUMMY_DATA === "true";

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
      data: { ...mealData, _id: Date.now().toString(), status: "pending" },
    });
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
}

export default DataService;
