# Car Service Center - Frontend Application

This is a **frontend-only** version of the Car Service Center management system. It uses a complete test API that simulates a backend using localStorage.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

The application will be available at `http://localhost:5173` (or next available port).

## 🔐 Default Login Credentials

The test API comes with pre-configured users:

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Super Admin |
| receptionist | recep123 | Receptionist |
| technician1 | tech123 | Technician |

## 📦 Test API Features

The test API (`src/services/testApi.js`) provides a **complete simulation** of a backend:

### ✅ Full CRUD Operations
- **Users** - Create, read, update, delete users with role-based access
- **Clients** - Manage client information with phone validation
- **Cars** - Track vehicles with plate numbers, mileage, and notes
- **Work Orders** - Create and manage service requests with status tracking
- **Tech Reports** - Technical reports for completed work
- **Stock Items** - Inventory management for spare parts and oils
- **Services** - Service catalog with pricing
- **Billing** - Invoice generation and tracking
- **Reports** - KPIs, daily orders, monthly profits, popular oils

### 💾 Data Persistence
All data is stored in **localStorage**, so it persists across page refreshes. The data includes:
- 3 pre-configured users (admin, receptionist, technician)
- 2 sample clients with cars
- 1 sample work order
- Sample stock items (oils, parts)
- Sample services

### 🔄 Async Simulation
The test API simulates network delays (300ms) to mimic real API behavior, helping you test loading states and error handling.

## 🔧 Switching to Django Backend

When you're ready to connect to a real Django backend:

### Step 1: Create `djangoBackend.js`

Create a new file `src/services/djangoBackend.js` with the same structure as `testApi.js`:

```javascript
// src/services/djangoBackend.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Configure axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
apiClient.interceptors.request.use((config) => {
  const tokens = JSON.parse(localStorage.getItem('car_service_tokens') || '{}');
  if (tokens.access_token) {
    config.headers.Authorization = `Bearer ${tokens.access_token}`;
  }
  return config;
});

// Export the same structure as testApi
export const authApi = {
  login: async (username, password) => {
    const response = await apiClient.post('/auth/login', { username, password });
    return response.data;
  },
  // ... implement other methods
};

// ... implement all other APIs (usersApi, clientsApi, etc.)

export default {
  auth: authApi,
  users: usersApi,
  clients: clientsApi,
  // ... all other APIs
};
```

### Step 2: Update API Import

In `src/services/api.js`, change the import:

```javascript
// FROM (Test API):
import testApi, {
  authApi,
  usersApi,
  // ...
} from './testApi';

// TO (Django Backend):
import testApi, {
  authApi,
  usersApi,
  // ...
} from './djangoBackend';
```

That's it! All components will automatically use the Django backend.

### Step 3: Configure Environment

Create a `.env` file:

```env
VITE_API_URL=http://localhost:8000/api
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components (shadcn/ui)
│   ├── Layout.jsx      # Main layout wrapper
│   ├── LoginPage.jsx   # Authentication
│   ├── Dashboard.jsx   # Main dashboard
│   ├── RecordedClients.jsx  # Client management
│   ├── NewClient.jsx   # Add new clients/cars
│   ├── WorkOrders.jsx  # Work order management
│   ├── Store.jsx       # Stock management
│   └── ...
├── services/
│   ├── api.js          # Main API interface (entry point)
│   └── testApi.js      # Test API with localStorage
├── locales/            # i18n translations
│   └── ar.json         # Arabic translations
├── lib/
│   └── utils.js        # Utility functions
└── App.jsx             # Main app component
```

## 🎨 Features

### Multi-language Support
The app supports English and Arabic (RTL):
```javascript
import { useTranslation } from 'react-i18next';

const { t, i18n } = useTranslation();
i18n.changeLanguage('ar'); // Switch to Arabic
```

### Role-Based Access
Different dashboards for different user roles:
- **Super Admin**: Full system access, reports, analytics
- **Admin**: Manage work orders, billing, users
- **Receptionist**: Create work orders, manage clients
- **Technician**: View assigned work, create tech reports

### Responsive Design
Built with Tailwind CSS and shadcn/ui components for a modern, responsive interface.

## 🛠️ Development Tips

### Adding New Features

1. **Add to Test API**: First implement in `testApi.js`
2. **Create Component**: Build your React component
3. **Use API**: Import from `api.js` (not directly from testApi)
4. **Test**: Use the test API for development
5. **Later**: Implement the same in `djangoBackend.js`

### Data Management

**Clear all data:**
```javascript
import { adminApi } from './services/api';

// Clear and reinitialize
await adminApi.clearAllData();
```

**Export data:**
```javascript
const data = await adminApi.exportData();
console.log(JSON.stringify(data, null, 2));
```

**Import data:**
```javascript
await adminApi.importData(yourDataObject);
```

### Debugging

Check localStorage in browser DevTools:
- Application > Local Storage > http://localhost:5173
- Look for keys starting with `car_service_`

## 📊 API Response Formats

All API methods return Promises with consistent response formats:

```javascript
// Successful response
{
  id: 1,
  first_name: "Ahmed",
  last_name: "Hassan",
  phone: "+201234567890",
  created_at: "2024-10-16T12:00:00.000Z"
}

// Error response (thrown as Error)
throw new Error("Client not found");
```

## 🔐 Authentication Flow

```javascript
// Login
const result = await api.login('admin', 'admin123');
// Returns: { access_token, refresh_token, token_type, user }

// Get current user
const user = await api.getCurrentUser();

// Logout
await api.logout();
```

## 📝 Common Tasks

### Add a New Client
```javascript
const newClient = await api.createClient({
  first_name: "John",
  last_name: "Doe",
  phone: "+201234567890"
});
```

### Add a Car
```javascript
const newCar = await api.createCar({
  client_id: 1,
  plate: "ABC-1234",
  brand: "Toyota",
  model: "Corolla",
  counter: 50000,
  notes: "Regular customer"
});
```

### Create Work Order
```javascript
const workOrder = await api.createWorkOrder({
  client_id: 1,
  car_id: 1,
  complaint: "Engine problem",
  deposit: 100,
  services: ["Oil Change", "Inspection"],
  oil_change: "5W-30 Full Synthetic"
});
```

### Update Stock
```javascript
// Update quantity (add or subtract)
await api.updateStockQuantity(itemId, -5); // Reduce by 5
await api.updateStockQuantity(itemId, 10); // Add 10
```

## 🎯 Next Steps

1. **Customize**: Modify the test API to match your specific needs
2. **Extend**: Add new features to both test API and components
3. **Build**: Create your Django backend with matching API structure
4. **Switch**: Update the import in `api.js` to use your backend
5. **Deploy**: Build and deploy your frontend application

## 📚 Technologies Used

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - UI components
- **React Router** - Navigation
- **React Hook Form** - Form management
- **i18next** - Internationalization
- **Lucide React** - Icons
- **Recharts** - Charts and analytics

## 🤝 Contributing

To contribute:
1. Create a new branch
2. Make your changes
3. Ensure test API still works
4. Submit a pull request

## 📄 License

[Add your license here]

## 🆘 Support

For issues or questions:
1. Check the test API implementation in `src/services/testApi.js`
2. Review component usage examples
3. Check browser console for errors
4. Verify localStorage data structure

---

**Built with ❤️ for efficient car service management**
