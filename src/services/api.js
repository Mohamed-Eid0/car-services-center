/**
 * API Service - Main Entry Point
 * 
 * This file provides the main API interface for the application.
 * Currently using testApi (localStorage-based simulation).
 * 
 * TO SWITCH TO DJANGO BACKEND:
 * 1. Create a new file called djangoBackend.js with the same structure as testApi.js
 * 2. Change the import below from './testApi' to './djangoBackend'
 * 3. That's it! All components will automatically use the Django backend.
 */

// ==================== IMPORT SECTION ====================
// Change this import to switch between test API and real backend
import {
  authApi,
  usersApi,
  clientsApi,
  carsApi,
  workOrdersApi,
  techReportsApi,
  stockApi,
  servicesApi,
  billingApi,
  expensesApi,
  debtsApi,
  reportsApi,
  adminApi,
  UserRole,
  WorkOrderStatus
} from './testApi';

// When switching to Django backend, uncomment this and comment the above:
// import {
//   authApi,
//   usersApi,
//   clientsApi,
//   carsApi,
//   workOrdersApi,
//   techReportsApi,
//   stockApi,
//   servicesApi,
//   billingApi,
//   reportsApi,
//   adminApi,
//   UserRole,
//   WorkOrderStatus
// } from './djangoBackend';



// ==================== EXPORTS ====================
// Export enums
export { UserRole, WorkOrderStatus };

// Export individual API modules (new structure for better organization)
export const authAPI = authApi;
export const usersAPI = usersApi;
export const clientsAPI = clientsApi;
export const carsAPI = carsApi;
export const workOrdersAPI = workOrdersApi;
export const techReportsAPI = techReportsApi;
export const stockAPI = stockApi;
export const servicesAPI = servicesApi;
export const billingAPI = billingApi;
export const expensesAPI = expensesApi;
export const debtsAPI = debtsApi;
export const reportsAPI = reportsApi;
export const adminAPI = adminApi;

// ==================== MAIN API OBJECT ====================
// Comprehensive API object with all endpoints (for convenience)
const api = {
  // Auth
  login: authApi.login,
  logout: authApi.logout,
  getCurrentUser: authApi.getCurrentUser,
  refreshToken: authApi.refreshToken,

  // Users
  getUsers: usersApi.getAll,
  getUser: usersApi.getById,
  createUser: usersApi.create,
  updateUser: usersApi.update,
  deleteUser: usersApi.delete,

  // Clients
  getClients: clientsApi.getAll,
  getClient: clientsApi.getById,
  createClient: clientsApi.create,
  updateClient: clientsApi.update,
  deleteClient: clientsApi.delete,

  // Cars
  getCars: carsApi.getAll,
  getCar: carsApi.getById,
  getCarsByClient: carsApi.getByClientId,
  createCar: carsApi.create,
  updateCar: carsApi.update,
  deleteCar: carsApi.delete,

  // Work Orders
  getWorkOrders: workOrdersApi.getAll,
  getWorkOrder: workOrdersApi.getById,
  createWorkOrder: workOrdersApi.create,
  updateWorkOrder: workOrdersApi.update,
  deleteWorkOrder: workOrdersApi.delete,
  assignWorkOrder: workOrdersApi.assign,
  startWorkOrder: workOrdersApi.startWork,

  // Tech Reports
  getTechReports: techReportsApi.getAll,
  getTechReport: techReportsApi.getById,
  getTechReportByWorkOrder: techReportsApi.getByWorkOrderId,
  createTechReport: techReportsApi.create,
  updateTechReport: techReportsApi.update,
  deleteTechReport: techReportsApi.delete,

  // Stock
  getStock: stockApi.getAll,
  getStockItem: stockApi.getById,
  getOils: stockApi.getOils,
  createStockItem: stockApi.create,
  updateStockItem: stockApi.update,
  deleteStockItem: stockApi.delete,
  updateStockQuantity: stockApi.updateQuantity,

  // Billing
  // Historically some components call `getBilling()` expecting the full list.
  // Provide both names for backward compatibility: `getBilling` returns all billings,
  // and `getBillingById` returns a single billing by id.
  getBillings: billingApi.getAll,
  getBilling: billingApi.getAll,
  getBillingById: billingApi.getById,
  getBillingByWorkOrder: billingApi.getByWorkOrderId,
  createBilling: billingApi.create,
  updateBilling: billingApi.update,
  deleteBilling: billingApi.delete,
  generateBilling: billingApi.generateBilling,

  // Expenses
  getExpenses: expensesApi.getAll,
  createExpense: expensesApi.create,
  updateExpense: expensesApi.update,
  deleteExpense: expensesApi.delete,

  // Debts
  getDebts: debtsApi.getAll,
  getDebt: debtsApi.getById,
  createDebt: debtsApi.create,
  updateDebt: debtsApi.update,
  addDebtPayment: debtsApi.addPayment,

  // Reports
  getKPIs: reportsApi.getKPIs,
  getDailyWorkOrders: reportsApi.getDailyWorkOrders,
  getMonthlyProfit: reportsApi.getMonthlyProfit,
  getPopularOils: reportsApi.getPopularOils,

  // Services
  getServices: servicesApi.getAll,
  getActiveServices: servicesApi.getActive,
  getService: servicesApi.getById,
  createService: servicesApi.create,
  updateService: servicesApi.update,
  deleteService: servicesApi.delete,

  // Admin
  clearAllData: adminApi.clearAllData,
  exportData: adminApi.exportData,
  importData: adminApi.importData,
};

// ==================== LEGACY EXPORTS ====================
// For backward compatibility with existing components
export const workOrders = workOrdersApi;
export const clients = clientsApi;
export const cars = carsApi;
export const users = usersApi;
export const billing = billingApi;
export const stock = stockApi;
export const technicians = usersApi; // Technicians are users with technician role
export const kpis = reportsApi;
export const reports = reportsApi;
export const services = servicesApi;

// Default export
export default api;
