// API service using centralized configuration
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import API_CONFIG from "../config/api";

// Create axios instance
const api = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PATH}`,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(
        API_CONFIG.STORAGE_KEYS.AUTH_TOKEN
      );
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error getting auth token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage and redirect to login
      await AsyncStorage.removeItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(API_CONFIG.STORAGE_KEYS.USER_DATA);
      // You might want to trigger a navigation to login screen here
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: any) =>
    api.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials),
  register: (userData: any) =>
    api.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData),
};

// User API
export const userAPI = {
  getProfile: () => api.get(API_CONFIG.ENDPOINTS.USERS.PROFILE),
  updateProfile: (profileData: any) =>
    api.put(API_CONFIG.ENDPOINTS.USERS.PROFILE, profileData),
  getAllUsers: (params?: any) =>
    api.get(API_CONFIG.ENDPOINTS.USERS.ALL, { params }),
  getUserById: (userId: string) =>
    api.get(API_CONFIG.ENDPOINTS.USERS.BY_ID(userId)),
  createUser: (userData: any) =>
    api.post(API_CONFIG.ENDPOINTS.USERS.CREATE, userData),
  updateUser: (userId: string, userData: any) =>
    api.put(API_CONFIG.ENDPOINTS.USERS.UPDATE(userId), userData),
  deleteUser: (userId: string) =>
    api.delete(API_CONFIG.ENDPOINTS.USERS.DELETE(userId)),
  getUserStats: (userId: string, params?: any) =>
    api.get(API_CONFIG.ENDPOINTS.USERS.STATS(userId), { params }),
};

// Meal API
export const mealAPI = {
  submitMeals: (mealData: any) =>
    api.post(API_CONFIG.ENDPOINTS.MEALS.SUBMIT, mealData),
  getUserMeals: (params?: any) =>
    api.get(API_CONFIG.ENDPOINTS.MEALS.USER, { params }),
  getAllMeals: (params?: any) =>
    api.get(API_CONFIG.ENDPOINTS.MEALS.ALL, { params }),
  updateMealStatus: (mealId: string, statusData: any) =>
    api.put(API_CONFIG.ENDPOINTS.MEALS.UPDATE_STATUS(mealId), statusData),
  getMealStats: (params?: any) =>
    api.get(API_CONFIG.ENDPOINTS.MEALS.STATS, { params }),
};

// Bazar API
export const bazarAPI = {
  submitBazar: (bazarData: any, receiptImage: any = null) => {
    const formData = new FormData();

    // Add text data
    Object.keys(bazarData).forEach((key) => {
      if (key === "items") {
        formData.append(key, JSON.stringify(bazarData[key]));
      } else {
        formData.append(key, bazarData[key]);
      }
    });

    // Add image if provided
    if (receiptImage) {
      formData.append("receiptImage", {
        uri: receiptImage.uri,
        type: receiptImage.type || "image/jpeg",
        name: receiptImage.name || "receipt.jpg",
      } as any);
    }

    return api.post(API_CONFIG.ENDPOINTS.BAZAR.SUBMIT, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  getUserBazar: (params?: any) =>
    api.get(API_CONFIG.ENDPOINTS.BAZAR.USER, { params }),
  getAllBazar: (params?: any) =>
    api.get(API_CONFIG.ENDPOINTS.BAZAR.ALL, { params }),
  updateBazarStatus: (bazarId: string, statusData: any) =>
    api.put(API_CONFIG.ENDPOINTS.BAZAR.UPDATE_STATUS(bazarId), statusData),
  getBazarStats: (params?: any) =>
    api.get(API_CONFIG.ENDPOINTS.BAZAR.STATS, { params }),
};

// Health check
export const healthAPI = {
  check: () => api.get(API_CONFIG.ENDPOINTS.HEALTH),
};

export default api;
