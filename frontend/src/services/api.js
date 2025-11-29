import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://mindgarden-ai-backend.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      localStorage.removeItem("access_token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (userData) => api.post("/auth/register", userData),
  googleLogin: () => api.get("/auth/google/login"),
  getCurrentUser: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

// Habits API calls
export const habitsAPI = {
  getHabits: () => api.get("/habits"),
  createHabit: (habit) => api.post("/habits", habit),
  updateHabit: (id, habit) => api.put(`/habits/${id}`, habit),
  deleteHabit: (id) => api.delete(`/habits/${id}`),
  logHabit: (id, logData) => api.post(`/habits/${id}/log`, logData),
  getWeeklyStats: () => api.get("/habits/weekly-stats"),
  getConsistencySuggestions: () => api.get("/habits/consistency-suggestions"),
};

// Tasks API calls
export const tasksAPI = {
  getTasks: () => api.get("/tasks"),
  createTask: (task) => api.post("/tasks", task),
  updateTask: (id, task) => api.put(`/tasks/${id}`, task),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  scheduleWithAI: (tasks, preferences) =>
    api.post("/tasks/ai/schedule", { tasks, preferences }),
};

// Mood API calls
export const moodAPI = {
  logMood: (moodLog) => api.post("/mood/log", moodLog),
  getMoodTimeline: (days = 7) => api.get(`/mood/timeline?days=${days}`),
  getMoodInsights: () => api.get("/mood/insights"),
};

// AI Coach API calls
export const aiAPI = {
  generateDailyPlan: (options) => api.post("/ai/daily-plan", options),
  getWeeklyReflection: (options = {}) =>
    api.get("/ai/weekly-reflection", { params: options }),
  optimizeSchedule: () => api.post("/ai/optimize-schedule"),
};

// Analytics API calls
export const analyticsAPI = {
  getDashboard: (days = 30) => api.get(`/analytics/dashboard?days=${days}`),
  getWeeklyReport: () => api.get("/analytics/weekly-report"),
  getMonthlyTrends: () => api.get("/analytics/monthly-trends"),
  getScoreboard: () => api.get("/analytics/scoreboard"),
};

export default api;
