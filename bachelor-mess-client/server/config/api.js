// API Configuration
const API_CONFIG = {
  // Base URLs
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:5001",
  API_PATH: "/api",

  // Timeouts
  TIMEOUT: 10000,

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
      BY_ID: (id) => `/users/${id}`,
      UPDATE: (id) => `/users/${id}`,
      DELETE: (id) => `/users/${id}`,
      STATS: (id) => `/users/${id}/stats`,
    },
    MEALS: {
      SUBMIT: "/meals/submit",
      USER: "/meals/user",
      ALL: "/meals/all",
      UPDATE_STATUS: (id) => `/meals/${id}/status`,
      STATS: "/meals/stats",
    },
    BAZAR: {
      SUBMIT: "/bazar/submit",
      USER: "/bazar/user",
      ALL: "/bazar/all",
      UPDATE_STATUS: (id) => `/bazar/${id}/status`,
      STATS: "/bazar/stats",
    },
    HEALTH: "/health",
  },

  // Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: "authToken",
    USER_DATA: "userData",
  },
};

export default API_CONFIG;
