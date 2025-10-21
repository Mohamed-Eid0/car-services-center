/**
 * Django Backend API Client
 * 
 * This file provides the API interface for the Django backend.
 * It matches the exact same structure as testApi.js for seamless switching.
 */

import axios from 'axios';

// ==================== ENUMS ====================
export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  RECEPTIONIST: "RECEPTIONIST",
  TECHNICIAN: "TECHNICIAN"
};

export const WorkOrderStatus = {
  WAITING: "waiting",
  PENDING: "pending",
  ASSIGNED: "assigned",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed"
};

// ==================== API CONFIGURATION ====================
const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh_token: refreshToken
          });
          
          const { access_token, refresh_token: newRefreshToken } = response.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.error || error.response.data?.detail || error.response.statusText;
    throw new Error(message);
  } else if (error.request) {
    // Request was made but no response received
    throw new Error('Network error - please check your connection');
  } else {
    // Something else happened
    throw new Error(error.message);
  }
};

// Helper function to make API calls
const apiCall = async (method, url, data = null) => {
  try {
    const config = { method, url };
    if (data) {
      config.data = data;
    }
    const response = await api(config);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw the error after handling it
  }
};

// ==================== AUTH API ====================
export const authApi = {
  login: async (username, password) => {
    const response = await apiCall('POST', '/auth/login/', { username, password });
    const { access_token, refresh_token, token_type, user } = response;
    
    // Store tokens
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    
    return { access_token, refresh_token, token_type, user };
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await apiCall('POST', '/auth/logout/', { refresh_token: refreshToken });
      } catch (error) {
        // Continue with logout even if API call fails
      }
    }
    
    // Clear tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    return { message: "Logged out successfully" };
  },

  getCurrentUser: async () => {
    return await apiCall('GET', '/auth/me/');
  },

  refreshToken: async (refreshToken) => {
    const response = await apiCall('POST', '/auth/refresh/', { refresh_token: refreshToken });
    const { access_token, refresh_token, token_type } = response;
    
    // Update stored tokens
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    
    return { access_token, refresh_token, token_type };
  }
};

// ==================== USERS API ====================
export const usersApi = {
  getAll: async () => {
    return await apiCall('GET', '/users/');
  },

  getById: async (id) => {
    return await apiCall('GET', `/users/${id}/`);
  },

  create: async (userData) => {
    return await apiCall('POST', '/users/', userData);
  },

  update: async (id, userData) => {
    return await apiCall('PUT', `/users/${id}/`, userData);
  },

  delete: async (id) => {
    return await apiCall('DELETE', `/users/${id}/`);
  }
};

// ==================== CLIENTS API ====================
export const clientsApi = {
  getAll: async () => {
    return await apiCall('GET', '/clients/');
  },

  getById: async (id) => {
    return await apiCall('GET', `/clients/${id}/`);
  },

  create: async (clientData) => {
    return await apiCall('POST', '/clients/', clientData);
  },

  update: async (id, clientData) => {
    return await apiCall('PUT', `/clients/${id}/`, clientData);
  },

  delete: async (id) => {
    return await apiCall('DELETE', `/clients/${id}/`);
  }
};

// ==================== CARS API ====================
export const carsApi = {
  getAll: async () => {
    return await apiCall('GET', '/cars/');
  },

  getById: async (id) => {
    return await apiCall('GET', `/cars/${id}/`);
  },

  getByClientId: async (clientId) => {
    return await apiCall('GET', `/cars/?client_id=${clientId}`);
  },

  create: async (carData) => {
    return await apiCall('POST', '/cars/', carData);
  },

  update: async (id, carData) => {
    return await apiCall('PUT', `/cars/${id}/`, carData);
  },

  delete: async (id) => {
    return await apiCall('DELETE', `/cars/${id}/`);
  }
};

// ==================== WORK ORDERS API ====================
export const workOrdersApi = {
  getAll: async () => {
    return await apiCall('GET', '/work-orders/');
  },

  getById: async (id) => {
    return await apiCall('GET', `/work-orders/${id}/`);
  },

  create: async (workOrderData) => {
    return await apiCall('POST', '/work-orders/', workOrderData);
  },

  update: async (id, workOrderData) => {
    return await apiCall('PUT', `/work-orders/${id}/`, workOrderData);
  },

  delete: async (id) => {
    return await apiCall('DELETE', `/work-orders/${id}/`);
  },

  assign: async (id, technicianId) => {
    return await apiCall('POST', `/work-orders/${id}/assign/`, { technician_id: technicianId });
  },

  startWork: async (id) => {
    return await apiCall('POST', `/work-orders/${id}/start_work/`);
  }
};

// ==================== TECH REPORTS API ====================
export const techReportsApi = {
  getAll: async () => {
    return await apiCall('GET', '/tech-reports/');
  },

  getById: async (id) => {
    return await apiCall('GET', `/tech-reports/${id}/`);
  },

  getByWorkOrderId: async (workOrderId) => {
    const reports = await apiCall('GET', `/tech-reports/?work_order_id=${workOrderId}`);
    return reports.length > 0 ? reports[0] : null;
  },

  create: async (reportData) => {
    return await apiCall('POST', '/tech-reports/', reportData);
  },

  update: async (id, reportData) => {
    return await apiCall('PUT', `/tech-reports/${id}/`, reportData);
  },

  delete: async (id) => {
    return await apiCall('DELETE', `/tech-reports/${id}/`);
  }
};

// ==================== STOCK ITEMS API ====================
export const stockApi = {
  getAll: async () => {
    return await apiCall('GET', '/stock/');
  },

  getById: async (id) => {
    return await apiCall('GET', `/stock/${id}/`);
  },

  getOils: async () => {
    return await apiCall('GET', '/stock/oils/');
  },

  create: async (itemData) => {
    return await apiCall('POST', '/stock/', itemData);
  },

  update: async (id, itemData) => {
    return await apiCall('PUT', `/stock/${id}/`, itemData);
  },

  delete: async (id) => {
    return await apiCall('DELETE', `/stock/${id}/`);
  },

  updateQuantity: async (id, quantity) => {
    return await apiCall('PATCH', `/stock/${id}/quantity/`, { quantity });
  }
};

// ==================== SERVICES API ====================
export const servicesApi = {
  getAll: async () => {
    return await apiCall('GET', '/services/');
  },

  getActive: async () => {
    return await apiCall('GET', '/services/active/');
  },

  getById: async (id) => {
    return await apiCall('GET', `/services/${id}/`);
  },

  create: async (serviceData) => {
    return await apiCall('POST', '/services/', serviceData);
  },

  update: async (id, serviceData) => {
    return await apiCall('PUT', `/services/${id}/`, serviceData);
  },

  delete: async (id) => {
    return await apiCall('DELETE', `/services/${id}/`);
  }
};

// ==================== BILLING API ====================
export const billingApi = {
  getAll: async () => {
    return await apiCall('GET', '/billing/');
  },

  getById: async (id) => {
    return await apiCall('GET', `/billing/${id}/`);
  },

  getByWorkOrderId: async (workOrderId) => {
    const billings = await apiCall('GET', `/billing/?work_order_id=${workOrderId}`);
    return billings.length > 0 ? billings[0] : null;
  },

  create: async (billingData) => {
    return await apiCall('POST', '/billing/', billingData);
  },

  update: async (id, billingData) => {
    return await apiCall('PUT', `/billing/${id}/`, billingData);
  },

  delete: async (id) => {
    return await apiCall('DELETE', `/billing/${id}/`);
  },

  generateBilling: async (workOrderId) => {
    return await apiCall('POST', '/billing/generate/', { work_order_id: workOrderId });
  }
};

// ==================== REPORTS API ====================
export const reportsApi = {
  getKPIs: async () => {
    return await apiCall('GET', '/reports/kpis/');
  },

  getDailyWorkOrders: async (startDate = null, endDate = null) => {
    let url = '/reports/daily-work-orders/';
    const params = [];
    if (startDate) params.push(`start_date=${startDate}`);
    if (endDate) params.push(`end_date=${endDate}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    
    return await apiCall('GET', url);
  },

  getMonthlyProfit: async () => {
    return await apiCall('GET', '/reports/monthly-profit/');
  },

  getPopularOils: async () => {
    return await apiCall('GET', '/reports/popular-oils/');
  }
};

// ==================== ADMIN API ====================
export const adminApi = {
  clearAllData: async () => {
    // This would need to be implemented in the Django backend
    throw new Error("Clear all data not implemented in Django backend");
  },

  exportData: async () => {
    // This would need to be implemented in the Django backend
    throw new Error("Export data not implemented in Django backend");
  },

  importData: async (data) => {
    // This would need to be implemented in the Django backend
    throw new Error("Import data not implemented in Django backend");
  }
};

// Default export with all APIs
export default {
  auth: authApi,
  users: usersApi,
  clients: clientsApi,
  cars: carsApi,
  workOrders: workOrdersApi,
  techReports: techReportsApi,
  stock: stockApi,
  services: servicesApi,
  billing: billingApi,
  reports: reportsApi,
  admin: adminApi
};
