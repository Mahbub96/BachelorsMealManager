// API Configuration for Client
const API_CONFIG = {
  // Base URLs
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || "http://192.168.0.130:5001",
  API_PATH: "/api",

  // Timeouts
  TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || "10000"),

  // Headers
  DEFAULT_HEADERS: {
    "Content-Type": "application/json",
  },

  // Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/auth/login",
      REGISTER: "/auth/register",
    },
    USERS: {
      PROFILE: "/users/profile",
      ALL: "/users/all",
      CREATE: "/users/create",
      BY_ID: (id: string) => `/users/${id}`,
      UPDATE: (id: string) => `/users/${id}`,
      DELETE: (id: string) => `/users/${id}`,
      STATS: (id: string) => `/users/${id}/stats`,
    },
    MEALS: {
      SUBMIT: "/meals/submit",
      USER: "/meals/user",
      ALL: "/meals/all",
      UPDATE_STATUS: (id: string) => `/meals/${id}/status`,
      STATS: "/meals/stats",
    },
    BAZAR: {
      SUBMIT: "/bazar/submit",
      USER: "/bazar/user",
      ALL: "/bazar/all",
      UPDATE_STATUS: (id: string) => `/bazar/${id}/status`,
      STATS: "/bazar/stats",
    },
    HEALTH: "/health",
  },

  // Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: "authToken",
    USER_DATA: "userData",
  },

  // Debug Configuration
  DEBUG: process.env.EXPO_PUBLIC_DEBUG === "true",
};

export default API_CONFIG;
