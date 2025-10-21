/**
 * Test API - Complete Backend Simulation
 * 
 * This is a fully functional test API that simulates the Django backend.
 * All data is stored in localStorage for persistence.
 * 
 * To switch to the real Django backend:
 * 1. Replace the imports in api.js from './testApi' to './djangoBackend'
 * 2. Create djangoBackend.js with the same method signatures but using axios
 * 
 * All methods return Promises to match the async nature of real API calls.
 */

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

// ==================== STORAGE HELPERS ====================
const STORAGE_KEYS = {
  USERS: 'car_service_users',
  CLIENTS: 'car_service_clients',
  CARS: 'car_service_cars',
  WORK_ORDERS: 'car_service_work_orders',
  TECH_REPORTS: 'car_service_tech_reports',
  STOCK_ITEMS: 'car_service_stock_items',
  SERVICES: 'car_service_services',
  BILLING: 'car_service_billing',
  CURRENT_USER: 'car_service_current_user',
  TOKENS: 'car_service_tokens'
};

// Get data from localStorage
const getStorage = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

// Save data to localStorage
const setStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Initialize default data if not exists
const initializeData = () => {
  // Initialize users
  if (!getStorage(STORAGE_KEYS.USERS)) {
    const defaultUsers = [
      {
        id: 1,
        username: "admin",
        password: "admin123", // In real app, this would be hashed
        first_name: "عمر",
        last_name: "علي",
        role: UserRole.SUPER_ADMIN,
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        username: "receptionist",
        password: "recep123",
        first_name: "مصطفي",
        last_name: "عادل",
        role: UserRole.RECEPTIONIST,
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        username: "technician1",
        password: "tech123",
        first_name: "ماجد",
        last_name: "عامر",
        role: UserRole.TECHNICIAN,
        is_active: true,
        created_at: new Date().toISOString()
      },
        {
        id: 4,
        username: "technician2",
        password: "tech1234",
        first_name: "كريم",
        last_name: "حازم",
        role: UserRole.TECHNICIAN,
        is_active: true,
        created_at: new Date().toISOString()
      }


    ];
    setStorage(STORAGE_KEYS.USERS, defaultUsers);
  }

  // Initialize clients
  // if (!getStorage(STORAGE_KEYS.CLIENTS)) {
  //   const defaultClients = [
  //     {
  //       id: 1,
  //       first_name: "Ahmed",
  //       last_name: "Hassan",
  //       phone: "+201234567890",
  //       created_at: new Date().toISOString()
  //     },
  //     {
  //       id: 2,
  //       first_name: "Sara",
  //       last_name: "Mohamed",
  //       phone: "+201234567891",
  //       created_at: new Date().toISOString()
  //     }
  //   ];
  //   setStorage(STORAGE_KEYS.CLIENTS, defaultClients);
  // }

  // Initialize cars
  // if (!getStorage(STORAGE_KEYS.CARS)) {
  //   const defaultCars = [
  //     {
  //       id: 1,
  //       client_id: 1,
  //       plate: "ABC1234",
  //       brand: "Toyota",
  //       model: "Corolla",
  //       counter: 50000,
  //       notes: "Regular customer",
  //       created_at: new Date().toISOString()
  //     },
  //     {
  //       id: 2,
  //       client_id: 2,
  //       plate: "XYZ5678",
  //       brand: "Honda",
  //       model: "Civic",
  //       counter: 30000,
  //       notes: null,
  //       created_at: new Date().toISOString()
  //     }
  //   ];
  //   setStorage(STORAGE_KEYS.CARS, defaultCars);
  // }

  // Initialize work orders
  // if (!getStorage(STORAGE_KEYS.WORK_ORDERS)) {
    // const defaultWorkOrders = [
    //   {
    //     id: 1,
    //     client_id: 1,
    //     car_id: 1,
    //     complaint: "Engine making strange noise",
    //     deposit: 100,
    //     services: ["Oil Change", "General Inspection"],
    //     oil_change: "5W-30 Full Synthetic",
    //     oil_confirmed: true,
    //     wash_confirmed: false,
    //     status: WorkOrderStatus.ASSIGNED,
    //     technician_id: 3,
    //     created_at: new Date().toISOString(),
    //     updated_at: new Date().toISOString(),
    //     completed_at: null
    //   }
    // ];
    // setStorage(STORAGE_KEYS.WORK_ORDERS, defaultWorkOrders);
  // }

  // Initialize tech reports
  if (!getStorage(STORAGE_KEYS.TECH_REPORTS)) {
    setStorage(STORAGE_KEYS.TECH_REPORTS, []);
  }

  // Initialize stock items
  if (!getStorage(STORAGE_KEYS.STOCK_ITEMS)) {
    // Start with an empty list; items will be added via the UI
    setStorage(STORAGE_KEYS.STOCK_ITEMS, []);
  }

  // Initialize services
  if (!getStorage(STORAGE_KEYS.SERVICES)) {
    // Start with an empty list; services will be added via the UI
    setStorage(STORAGE_KEYS.SERVICES, []);
  }

  // Initialize billing
  if (!getStorage(STORAGE_KEYS.BILLING)) {
    setStorage(STORAGE_KEYS.BILLING, []);
  }
};

// Initialize data on module load
initializeData();

// Helper to generate new ID
const generateId = (items) => {
  if (!items || items.length === 0) return 1;
  return Math.max(...items.map(item => item.id)) + 1;
};

// Simulate network delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// ==================== AUTH API ====================
export const authApi = {
  login: async (username, password) => {
    await delay();
    const users = getStorage(STORAGE_KEYS.USERS) || [];
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (!user.is_active) {
      throw new Error("User account is disabled");
    }

    const tokens = {
      access_token: `test_access_token_${user.id}_${Date.now()}`,
      refresh_token: `test_refresh_token_${user.id}_${Date.now()}`,
      token_type: "bearer"
    };

    setStorage(STORAGE_KEYS.TOKENS, tokens);
    setStorage(STORAGE_KEYS.CURRENT_USER, {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at
    });

    return { ...tokens, user: getStorage(STORAGE_KEYS.CURRENT_USER) };
  },

  logout: async () => {
    await delay(100);
    localStorage.removeItem(STORAGE_KEYS.TOKENS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    return { message: "Logged out successfully" };
  },

  getCurrentUser: async () => {
    await delay(100);
    const user = getStorage(STORAGE_KEYS.CURRENT_USER);
    if (!user) {
      throw new Error("Not authenticated");
    }
    return user;
  },

  refreshToken: async (refreshToken) => {
    await delay();
    const currentTokens = getStorage(STORAGE_KEYS.TOKENS);
    if (!currentTokens || currentTokens.refresh_token !== refreshToken) {
      throw new Error("Invalid refresh token");
    }

    const user = getStorage(STORAGE_KEYS.CURRENT_USER);
    const newTokens = {
      access_token: `test_access_token_${user.id}_${Date.now()}`,
      refresh_token: `test_refresh_token_${user.id}_${Date.now()}`,
      token_type: "bearer"
    };

    setStorage(STORAGE_KEYS.TOKENS, newTokens);
    return newTokens;
  }
};

// ==================== USERS API ====================
export const usersApi = {
  getAll: async () => {
    await delay();
    return getStorage(STORAGE_KEYS.USERS) || [];
  },

  getById: async (id) => {
    await delay();
    const users = getStorage(STORAGE_KEYS.USERS) || [];
    const user = users.find(u => u.id === parseInt(id));
    if (!user) throw new Error("User not found");
    return user;
  },

  create: async (userData) => {
    await delay();
    const users = getStorage(STORAGE_KEYS.USERS) || [];
    
    // Check if username already exists
    if (users.find(u => u.username === userData.username)) {
      throw new Error("Username already exists");
    }

    const newUser = {
      id: generateId(users),
      ...userData,
      is_active: true,
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    setStorage(STORAGE_KEYS.USERS, users);
    return newUser;
  },

  update: async (id, userData) => {
    await delay();
    const users = getStorage(STORAGE_KEYS.USERS) || [];
    const index = users.findIndex(u => u.id === parseInt(id));
    
    if (index === -1) throw new Error("User not found");

    // Check if username is being changed and if it already exists
    if (userData.username && userData.username !== users[index].username) {
      if (users.find(u => u.username === userData.username && u.id !== parseInt(id))) {
        throw new Error("Username already exists");
      }
    }

    // Don't update password if it's empty or not provided
    const updateData = { ...userData }
    if (!updateData.password || updateData.password === '') {
      delete updateData.password
    }

    users[index] = {
      ...users[index],
      ...updateData,
      updated_at: new Date().toISOString()
    };

    setStorage(STORAGE_KEYS.USERS, users);
    return users[index];
  },

  delete: async (id) => {
    await delay();
    const users = getStorage(STORAGE_KEYS.USERS) || [];
    const filtered = users.filter(u => u.id !== parseInt(id));
    
    if (filtered.length === users.length) {
      throw new Error("User not found");
    }

    setStorage(STORAGE_KEYS.USERS, filtered);
    return { message: "User deleted successfully" };
  }
};

// ==================== CLIENTS API ====================
export const clientsApi = {
  getAll: async () => {
    await delay();
    return getStorage(STORAGE_KEYS.CLIENTS) || [];
  },

  getById: async (id) => {
    await delay();
    const clients = getStorage(STORAGE_KEYS.CLIENTS) || [];
    const client = clients.find(c => c.id === parseInt(id));
    if (!client) throw new Error("Client not found");
    return client;
  },

  create: async (clientData) => {
    await delay();
    const clients = getStorage(STORAGE_KEYS.CLIENTS) || [];
    
    // New Logic: Allow same client info (phone can repeat for multiple cars)
    // We'll check for exact duplicates at the car level instead
    // So we remove the strict phone uniqueness check here
    
    const newClient = {
      id: generateId(clients),
      ...clientData,
      created_at: new Date().toISOString()
    };

    clients.push(newClient);
    setStorage(STORAGE_KEYS.CLIENTS, clients);
    return newClient;
  },

  update: async (id, clientData) => {
    await delay();
    const clients = getStorage(STORAGE_KEYS.CLIENTS) || [];
    const index = clients.findIndex(c => c.id === parseInt(id));
    
    if (index === -1) throw new Error("Client not found");

    // New Logic: Allow phone duplicates (same person can own multiple cars)
    // Removed strict phone uniqueness check
    
    clients[index] = {
      ...clients[index],
      ...clientData,
      updated_at: new Date().toISOString()
    };

    setStorage(STORAGE_KEYS.CLIENTS, clients);
    return clients[index];
  },

  delete: async (id) => {
    await delay();
    const clients = getStorage(STORAGE_KEYS.CLIENTS) || [];
    const filtered = clients.filter(c => c.id !== parseInt(id));
    
    if (filtered.length === clients.length) {
      throw new Error("Client not found");
    }

    // Also delete associated cars
    const cars = getStorage(STORAGE_KEYS.CARS) || [];
    const filteredCars = cars.filter(car => car.client_id !== parseInt(id));
    setStorage(STORAGE_KEYS.CARS, filteredCars);

    setStorage(STORAGE_KEYS.CLIENTS, filtered);
    return { message: "Client deleted successfully" };
  }
};

// ==================== CARS API ====================
export const carsApi = {
  getAll: async () => {
    await delay();
    return getStorage(STORAGE_KEYS.CARS) || [];
  },

  getById: async (id) => {
    await delay();
    const cars = getStorage(STORAGE_KEYS.CARS) || [];
    const car = cars.find(c => c.id === parseInt(id));
    if (!car) throw new Error("Car not found");
    return car;
  },

  getByClientId: async (clientId) => {
    await delay();
    const cars = getStorage(STORAGE_KEYS.CARS) || [];
    return cars.filter(c => c.client_id === parseInt(clientId));
  },

  create: async (carData) => {
    await delay();
    const cars = getStorage(STORAGE_KEYS.CARS) || [];
    
    // New Logic: Check for EXACT duplicate (same client + same plate)
    // Allow: same plate with different owner (car was sold)
    // Allow: same owner with different plate (owns multiple cars)
    // Block: same plate + same owner (exact duplicate)
    
    const existingCarSamePlate = cars.find(c => c.plate === carData.plate);
    
    if (existingCarSamePlate) {
      // Car with this plate exists, check if it's the same owner
      if (existingCarSamePlate.client_id === carData.client_id) {
        throw new Error("This client already has a car with this plate number");
      }
      // Different owner - this is allowed (car was sold to new owner)
      console.log(`Plate ${carData.plate} already exists but with different owner - allowing registration`);
    }

    const newCar = {
      id: generateId(cars),
      ...carData,
      created_at: new Date().toISOString()
    };

    cars.push(newCar);
    setStorage(STORAGE_KEYS.CARS, cars);
    return newCar;
  },

  update: async (id, carData) => {
    await delay();
    const cars = getStorage(STORAGE_KEYS.CARS) || [];
    const index = cars.findIndex(c => c.id === parseInt(id));
    
    if (index === -1) throw new Error("Car not found");

    // New Logic: Check for exact duplicate when updating plate
    if (carData.plate && carData.plate !== cars[index].plate) {
      const existingCarSamePlate = cars.find(c => c.plate === carData.plate && c.id !== parseInt(id));
      
      if (existingCarSamePlate) {
        // Check if it's the same client trying to have duplicate plates
        const targetClientId = carData.client_id || cars[index].client_id;
        if (existingCarSamePlate.client_id === targetClientId) {
          throw new Error("This client already has a car with this plate number");
        }
        // Different owner - allowed (car was sold)
      }
    }

    cars[index] = {
      ...cars[index],
      ...carData,
      updated_at: new Date().toISOString()
    };

    setStorage(STORAGE_KEYS.CARS, cars);
    return cars[index];
  },

  delete: async (id) => {
    await delay();
    const cars = getStorage(STORAGE_KEYS.CARS) || [];
    const filtered = cars.filter(c => c.id !== parseInt(id));
    
    if (filtered.length === cars.length) {
      throw new Error("Car not found");
    }

    setStorage(STORAGE_KEYS.CARS, filtered);
    return { message: "Car deleted successfully" };
  }
};

// ==================== WORK ORDERS API ====================
export const workOrdersApi = {
  getAll: async () => {
    await delay();
    return getStorage(STORAGE_KEYS.WORK_ORDERS) || [];
  },

  getById: async (id) => {
    await delay();
    const workOrders = getStorage(STORAGE_KEYS.WORK_ORDERS) || [];
    const workOrder = workOrders.find(w => w.id === parseInt(id));
    if (!workOrder) throw new Error("Work order not found");
    return workOrder;
  },

  create: async (workOrderData) => {
    await delay();
    const workOrders = getStorage(STORAGE_KEYS.WORK_ORDERS) || [];

    const newWorkOrder = {
      id: generateId(workOrders),
      ...workOrderData,
      status: WorkOrderStatus.WAITING,
      oil_confirmed: false,
      wash_confirmed: false,
      technician_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null
    };

    workOrders.push(newWorkOrder);
    setStorage(STORAGE_KEYS.WORK_ORDERS, workOrders);
    return newWorkOrder;
  },

  update: async (id, workOrderData) => {
    await delay();
    const workOrders = getStorage(STORAGE_KEYS.WORK_ORDERS) || [];
    const index = workOrders.findIndex(w => w.id === parseInt(id));
    
    if (index === -1) throw new Error("Work order not found");

    const updatedData = {
      ...workOrders[index],
      ...workOrderData,
      updated_at: new Date().toISOString()
    };

    // Set completed_at if status is completed
    if (workOrderData.status === WorkOrderStatus.COMPLETED && !workOrders[index].completed_at) {
      updatedData.completed_at = new Date().toISOString();
    }

    workOrders[index] = updatedData;
    setStorage(STORAGE_KEYS.WORK_ORDERS, workOrders);
    return workOrders[index];
  },

  delete: async (id) => {
    await delay();
    const workOrders = getStorage(STORAGE_KEYS.WORK_ORDERS) || [];
    const filtered = workOrders.filter(w => w.id !== parseInt(id));
    
    if (filtered.length === workOrders.length) {
      throw new Error("Work order not found");
    }

    setStorage(STORAGE_KEYS.WORK_ORDERS, filtered);
    return { message: "Work order deleted successfully" };
  },

  assign: async (id, technicianId) => {
    await delay();
    const workOrders = getStorage(STORAGE_KEYS.WORK_ORDERS) || [];
    const index = workOrders.findIndex(w => w.id === parseInt(id));
    
    if (index === -1) throw new Error("Work order not found");

    workOrders[index] = {
      ...workOrders[index],
      technician_id: technicianId,
      status: WorkOrderStatus.ASSIGNED,
      updated_at: new Date().toISOString()
    };

    setStorage(STORAGE_KEYS.WORK_ORDERS, workOrders);
    return workOrders[index];
  },

  startWork: async (id) => {
    await delay();
    const workOrders = getStorage(STORAGE_KEYS.WORK_ORDERS) || [];
    const index = workOrders.findIndex(w => w.id === parseInt(id));
    
    if (index === -1) throw new Error("Work order not found");

    const currentOrder = workOrders[index];
    const technicianId = currentOrder.technician_id;

    // Set any other "in_progress" orders for this technician to "pending"
    workOrders.forEach((order, idx) => {
      if (
        order.technician_id === technicianId && 
        order.status === WorkOrderStatus.IN_PROGRESS &&
        order.id !== parseInt(id)
      ) {
        workOrders[idx] = {
          ...order,
          status: WorkOrderStatus.PENDING,
          updated_at: new Date().toISOString()
        };
      }
    });

    // Set the current order to "in_progress"
    workOrders[index] = {
      ...currentOrder,
      status: WorkOrderStatus.IN_PROGRESS,
      updated_at: new Date().toISOString()
    };

    setStorage(STORAGE_KEYS.WORK_ORDERS, workOrders);
    return workOrders[index];
  }
};

// ==================== TECH REPORTS API ====================
export const techReportsApi = {
  getAll: async () => {
    await delay();
    return getStorage(STORAGE_KEYS.TECH_REPORTS) || [];
  },

  getById: async (id) => {
    await delay();
    const techReports = getStorage(STORAGE_KEYS.TECH_REPORTS) || [];
    const report = techReports.find(r => r.id === parseInt(id));
    if (!report) throw new Error("Tech report not found");
    return report;
  },

  getByWorkOrderId: async (workOrderId) => {
    await delay();
    const techReports = getStorage(STORAGE_KEYS.TECH_REPORTS) || [];
    return techReports.find(r => r.work_order_id === parseInt(workOrderId));
  },

  create: async (reportData) => {
    await delay();
    const techReports = getStorage(STORAGE_KEYS.TECH_REPORTS) || [];
    const currentUser = getStorage(STORAGE_KEYS.CURRENT_USER);

    const newReport = {
      id: generateId(techReports),
      ...reportData,
      work_order_id: parseInt(reportData.work_order_id), // Ensure it's an integer
      technician_id: currentUser.id,
      created_at: new Date().toISOString()
    };

    techReports.push(newReport);
    setStorage(STORAGE_KEYS.TECH_REPORTS, techReports);
    return newReport;
  },

  update: async (id, reportData) => {
    await delay();
    const techReports = getStorage(STORAGE_KEYS.TECH_REPORTS) || [];
    const index = techReports.findIndex(r => r.id === parseInt(id));
    
    if (index === -1) throw new Error("Tech report not found");

    techReports[index] = {
      ...techReports[index],
      ...reportData,
      updated_at: new Date().toISOString()
    };

    setStorage(STORAGE_KEYS.TECH_REPORTS, techReports);
    return techReports[index];
  },

  delete: async (id) => {
    await delay();
    const techReports = getStorage(STORAGE_KEYS.TECH_REPORTS) || [];
    const filtered = techReports.filter(r => r.id !== parseInt(id));
    
    if (filtered.length === techReports.length) {
      throw new Error("Tech report not found");
    }

    setStorage(STORAGE_KEYS.TECH_REPORTS, filtered);
    return { message: "Tech report deleted successfully" };
  }
};

// ==================== STOCK ITEMS API ====================
export const stockApi = {
  getAll: async () => {
    await delay();
    return getStorage(STORAGE_KEYS.STOCK_ITEMS) || [];
  },

  getById: async (id) => {
    await delay();
    const items = getStorage(STORAGE_KEYS.STOCK_ITEMS) || [];
    const item = items.find(i => i.id === parseInt(id));
    if (!item) throw new Error("Stock item not found");
    return item;
  },

  getOils: async () => {
    await delay();
    const items = getStorage(STORAGE_KEYS.STOCK_ITEMS) || [];
    return items.filter(i => i.is_oil);
  },

  create: async (itemData) => {
    await delay();
    const items = getStorage(STORAGE_KEYS.STOCK_ITEMS) || [];
    
    // Check if serial already exists
    if (items.find(i => i.serial === itemData.serial)) {
      throw new Error("Serial number already exists");
    }

    const newItem = {
      id: generateId(items),
      ...itemData,
      created_at: new Date().toISOString()
    };

    items.push(newItem);
    setStorage(STORAGE_KEYS.STOCK_ITEMS, items);
    return newItem;
  },

  update: async (id, itemData) => {
    await delay();
    const items = getStorage(STORAGE_KEYS.STOCK_ITEMS) || [];
    const index = items.findIndex(i => i.id === parseInt(id));
    
    if (index === -1) throw new Error("Stock item not found");

    items[index] = {
      ...items[index],
      ...itemData,
      updated_at: new Date().toISOString()
    };

    setStorage(STORAGE_KEYS.STOCK_ITEMS, items);
    return items[index];
  },

  delete: async (id) => {
    await delay();
    const items = getStorage(STORAGE_KEYS.STOCK_ITEMS) || [];
    const filtered = items.filter(i => i.id !== parseInt(id));
    
    if (filtered.length === items.length) {
      throw new Error("Stock item not found");
    }

    setStorage(STORAGE_KEYS.STOCK_ITEMS, filtered);
    return { message: "Stock item deleted successfully" };
  },

  updateQuantity: async (id, quantity) => {
    await delay();
    const items = getStorage(STORAGE_KEYS.STOCK_ITEMS) || [];
    const index = items.findIndex(i => i.id === parseInt(id));
    
    if (index === -1) throw new Error("Stock item not found");

    items[index] = {
      ...items[index],
      quantity: quantity,
      updated_at: new Date().toISOString()
    };

    setStorage(STORAGE_KEYS.STOCK_ITEMS, items);
    return items[index];
  }
};

// ==================== SERVICES API ====================
export const servicesApi = {
  getAll: async () => {
    await delay();
    return getStorage(STORAGE_KEYS.SERVICES) || [];
  },

  getActive: async () => {
    await delay();
    const services = getStorage(STORAGE_KEYS.SERVICES) || [];
    return services.filter(s => s.is_active);
  },

  getById: async (id) => {
    await delay();
    const services = getStorage(STORAGE_KEYS.SERVICES) || [];
    const service = services.find(s => s.id === parseInt(id));
    if (!service) throw new Error("Service not found");
    return service;
  },

  create: async (serviceData) => {
    await delay();
    const services = getStorage(STORAGE_KEYS.SERVICES) || [];

    const newService = {
      id: generateId(services),
      ...serviceData,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    services.push(newService);
    setStorage(STORAGE_KEYS.SERVICES, services);
    return newService;
  },

  update: async (id, serviceData) => {
    await delay();
    const services = getStorage(STORAGE_KEYS.SERVICES) || [];
    const index = services.findIndex(s => s.id === parseInt(id));
    
    if (index === -1) throw new Error("Service not found");

    services[index] = {
      ...services[index],
      ...serviceData,
      updated_at: new Date().toISOString()
    };

    setStorage(STORAGE_KEYS.SERVICES, services);
    return services[index];
  },

  delete: async (id) => {
    await delay();
    const services = getStorage(STORAGE_KEYS.SERVICES) || [];
    const filtered = services.filter(s => s.id !== parseInt(id));
    
    if (filtered.length === services.length) {
      throw new Error("Service not found");
    }

    setStorage(STORAGE_KEYS.SERVICES, filtered);
    return { message: "Service deleted successfully" };
  }
};

// ==================== BILLING API ====================
export const billingApi = {
  getAll: async () => {
    await delay();
    return getStorage(STORAGE_KEYS.BILLING) || [];
  },

  getById: async (id) => {
    await delay();
    const billings = getStorage(STORAGE_KEYS.BILLING) || [];
    const billing = billings.find(b => b.id === parseInt(id));
    if (!billing) throw new Error("Billing not found");
    return billing;
  },

  getByWorkOrderId: async (workOrderId) => {
    await delay();
    const billings = getStorage(STORAGE_KEYS.BILLING) || [];
    return billings.find(b => b.work_order_id === parseInt(workOrderId));
  },

  create: async (billingData) => {
    await delay();
    const billings = getStorage(STORAGE_KEYS.BILLING) || [];

    const newBilling = {
      id: generateId(billings),
      ...billingData,
      created_at: new Date().toISOString()
    };

    billings.push(newBilling);
    setStorage(STORAGE_KEYS.BILLING, billings);
    return newBilling;
  },

  update: async (id, billingData) => {
    await delay();
    const billings = getStorage(STORAGE_KEYS.BILLING) || [];
    const index = billings.findIndex(b => b.id === parseInt(id));
    
    if (index === -1) throw new Error("Billing not found");

    billings[index] = {
      ...billings[index],
      ...billingData,
      updated_at: new Date().toISOString()
    };

    setStorage(STORAGE_KEYS.BILLING, billings);
    return billings[index];
  },

  delete: async (id) => {
    await delay();
    const billings = getStorage(STORAGE_KEYS.BILLING) || [];
    const filtered = billings.filter(b => b.id !== parseInt(id));
    
    if (filtered.length === billings.length) {
      throw new Error("Billing not found");
    }

    setStorage(STORAGE_KEYS.BILLING, filtered);
    return { message: "Billing deleted successfully" };
  },

  generateBilling: async (workOrderId) => {
    await delay();
    
    // Get work order and tech report
    const workOrders = getStorage(STORAGE_KEYS.WORK_ORDERS) || [];
    const services = getStorage(STORAGE_KEYS.SERVICES) || [];
    const stock = getStorage(STORAGE_KEYS.STOCK_ITEMS) || [];
    
    const workOrder = workOrders.find(wo => wo.id === parseInt(workOrderId));
    if (!workOrder) throw new Error("Work order not found");
    
    // Re-fetch tech reports from storage to get the latest data
    const latestTechReports = getStorage(STORAGE_KEYS.TECH_REPORTS) || [];
    console.log('All tech reports:', latestTechReports);
    console.log('Looking for work_order_id:', parseInt(workOrderId));
    
    const techReport = latestTechReports.find(tr => tr.work_order_id === parseInt(workOrderId));
    if (!techReport) {
      console.error('Tech report not found. Available reports:', latestTechReports.map(tr => ({ id: tr.id, work_order_id: tr.work_order_id })));
      throw new Error("Tech report not found");
    }
    
    console.log('Found tech report:', techReport);
    
    // Calculate costs and update stock quantities
    let partsTotal = 0;
    if (techReport.used_parts && techReport.used_parts.length > 0) {
      techReport.used_parts.forEach(usedPart => {
        // usedPart can be either { partId, quantity } or just partId (legacy)
        const partId = usedPart.partId || usedPart;
        const quantity = usedPart.quantity || 1;
        
        const partIndex = stock.findIndex(s => s.id === partId);
        if (partIndex !== -1) {
          const part = stock[partIndex];
          partsTotal += part.sell_price * quantity;
          
          // Subtract quantity from stock
          if (stock[partIndex].quantity >= quantity) {
            stock[partIndex].quantity -= quantity;
            stock[partIndex].updated_at = new Date().toISOString();
          }
        }
      });
      
      // Save updated stock back to storage
      setStorage(STORAGE_KEYS.STOCK_ITEMS, stock);
    }
    
    let servicesTotal = 0;
    if (techReport.services && techReport.services.length > 0) {
      techReport.services.forEach(serviceId => {
        const service = services.find(s => s.id === serviceId);
        if (service) {
          servicesTotal += service.price;
        }
      });
    }
    
    // Wash cost (if any)
    const washTypes = [
      { id: 1, name: 'غسيل داخلي', price: 30 },
      { id: 2, name: 'غسيل خارجي', price: 25 },
      { id: 3, name: 'غسيل شامل', price: 50 },
      { id: 4, name: 'غسيل كيميائي', price: 75 }
    ];
    
    let washCost = 0;
    if (techReport.wash_type) {
      const washType = washTypes.find(w => w.id === parseInt(techReport.wash_type));
      if (washType) {
        washCost = washType.price;
      }
    }
    
    // Labor cost (can be adjusted by admin later)
    const laborCost = techReport.time_spent ? techReport.time_spent * 50 : 0; // $50 per hour
    
    const subtotal = partsTotal + servicesTotal + washCost + laborCost;
    const tax = subtotal * 0.14; // 14% tax
    const total = subtotal + tax - (workOrder.deposit || 0);
    
    // Create billing
    const billings = getStorage(STORAGE_KEYS.BILLING) || [];
    const newBilling = {
      id: generateId(billings),
      work_order_id: workOrder.id,
      parts_cost: partsTotal,
      services_cost: servicesTotal,
      wash_cost: washCost,
      labor_cost: laborCost,
      oil_change_cost: 0, // Can be updated by admin
      subtotal: subtotal,
      tax: tax,
      deposit: workOrder.deposit || 0,
      total: total,
      paid: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    billings.push(newBilling);
    setStorage(STORAGE_KEYS.BILLING, billings);
    
    // Update work order status to completed
    const woIndex = workOrders.findIndex(wo => wo.id === parseInt(workOrderId));
    if (woIndex !== -1) {
      workOrders[woIndex].status = 'completed';
      workOrders[woIndex].completed_at = new Date().toISOString();
      workOrders[woIndex].updated_at = new Date().toISOString();
      setStorage(STORAGE_KEYS.WORK_ORDERS, workOrders);
    }
    
    return newBilling;
  }
};

// ==================== REPORTS API ====================
export const reportsApi = {
  getKPIs: async () => {
    await delay();
    const workOrders = getStorage(STORAGE_KEYS.WORK_ORDERS) || [];
    const today = new Date().toISOString().split('T')[0];

    const todayOrders = workOrders.filter(wo => 
      wo.created_at.split('T')[0] === today
    );

    return {
      cars_washed_today: todayOrders.filter(wo => wo.wash_confirmed).length,
      cars_oil_changed_today: todayOrders.filter(wo => wo.oil_confirmed).length,
      cars_maintained_today: todayOrders.filter(wo => wo.status === WorkOrderStatus.COMPLETED).length,
      cars_currently_in_center: workOrders.filter(wo => 
        wo.status === WorkOrderStatus.ASSIGNED || wo.status === WorkOrderStatus.PENDING
      ).length,
      cars_pending: workOrders.filter(wo => wo.status === WorkOrderStatus.WAITING).length,
      cars_completed: workOrders.filter(wo => wo.status === WorkOrderStatus.COMPLETED).length
    };
  },

  getDailyWorkOrders: async (startDate = null, endDate = null) => {
    await delay();
    const workOrders = getStorage(STORAGE_KEYS.WORK_ORDERS) || [];
    
    // Group by date
    const dateGroups = {};

    workOrders.forEach(wo => {
      const date = wo.created_at.split('T')[0];
      
      // Filter by date range if provided
      if (startDate && date < startDate) return;
      if (endDate && date > endDate) return;
      
      if (!dateGroups[date]) {
        dateGroups[date] = 0;
      }
      dateGroups[date]++;
    });

    return Object.entries(dateGroups).map(([date, count]) => ({
      date,
      count
    }));
  },

  getMonthlyProfit: async () => {
    await delay();
    const billings = getStorage(STORAGE_KEYS.BILLING) || [];
    
    // Group by month
    const monthGroups = {};
    billings.forEach(billing => {
      const month = billing.created_at.substring(0, 7); // YYYY-MM
      if (!monthGroups[month]) {
        monthGroups[month] = 0;
      }
      monthGroups[month] += billing.total;
    });

    return Object.entries(monthGroups).map(([month, profit]) => ({
      month,
      profit
    }));
  },

  getPopularOils: async () => {
    await delay();
    const workOrders = getStorage(STORAGE_KEYS.WORK_ORDERS) || [];
    
    // Count oil changes
    const oilCounts = {};
    workOrders.forEach(wo => {
      if (wo.oil_change && wo.oil_confirmed) {
        if (!oilCounts[wo.oil_change]) {
          oilCounts[wo.oil_change] = 0;
        }
        oilCounts[wo.oil_change]++;
      }
    });

    return Object.entries(oilCounts)
      .map(([oil, count]) => ({ oil, count }))
      .sort((a, b) => b.count - a.count);
  }
};

// ==================== ADMIN API ====================
export const adminApi = {
  clearAllData: async () => {
    await delay();
    Object.values(STORAGE_KEYS).forEach(key => {
      if (key !== STORAGE_KEYS.CURRENT_USER && key !== STORAGE_KEYS.TOKENS) {
        localStorage.removeItem(key);
      }
    });
    initializeData();
    return { message: "All data cleared and reinitialized" };
  },

  exportData: async () => {
    await delay();
    const data = {};
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      if (key !== STORAGE_KEYS.CURRENT_USER && key !== STORAGE_KEYS.TOKENS) {
        data[name] = getStorage(key);
      }
    });
    return data;
  },

  importData: async (data) => {
    await delay();
    Object.entries(data).forEach(([name, value]) => {
      const key = STORAGE_KEYS[name];
      if (key && key !== STORAGE_KEYS.CURRENT_USER && key !== STORAGE_KEYS.TOKENS) {
        setStorage(key, value);
      }
    });
    return { message: "Data imported successfully" };
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
