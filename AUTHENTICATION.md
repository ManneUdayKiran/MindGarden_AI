# 🔐 MindGarden AI - Authentication System

## Overview

MindGarden AI now features a complete authentication system with both email/password and Google OAuth support, integrated with MongoDB for secure user data storage.

## ✨ Features

### 🔑 **Authentication Methods**

- **Email/Password**: Traditional signup and login with secure password hashing
- **Google OAuth**: Quick sign-in with Google (demo implementation included)
- **JWT Tokens**: Secure session management with JSON Web Tokens
- **Protected Routes**: All app features require authentication

### 🛡️ **Security Features**

- **Password Hashing**: Uses bcrypt for secure password storage
- **JWT Authentication**: Token-based authentication with expiration
- **Input Validation**: Comprehensive form validation on both frontend and backend
- **Auto-logout**: Automatic logout on token expiration
- **MongoDB Integration**: Secure user data storage with proper schemas

## 🚀 Getting Started

### 1. **Backend Setup**

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload --port 8000
```

### 2. **Frontend Setup**

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Start the development server
npm run dev
```

### 3. **Access the Application**

- **Frontend**: http://localhost:5173
- **API Documentation**: http://localhost:8000/docs
- **API Base**: http://localhost:8000/api

## 📱 User Interface

### **Landing Page** (`/`)

- Beautiful garden-themed landing page
- Three authentication options:
  - **"Start Growing with Google"** - Quick Google OAuth (demo)
  - **"Sign In"** - Email/password login
  - **"Sign Up"** - Create new account

### **Login Page** (`/login`)

- Email and password form
- Password visibility toggle
- Google OAuth option
- Link to signup page
- Form validation and error handling

### **Signup Page** (`/signup`)

- Registration form with:
  - Full name
  - Email address
  - Password (with strength requirements)
  - Confirm password
  - Terms acceptance checkbox
- Real-time validation
- Google OAuth option
- Link to login page

### **Protected Routes**

All application features require authentication:

- Dashboard (`/dashboard`)
- Habits (`/habits`)
- Tasks (`/tasks`)
- Mood (`/mood`)
- Insights (`/insights`)

## 🔧 API Endpoints

### **Authentication** (`/api/auth/`)

| Method | Endpoint           | Description            | Body                        |
| ------ | ------------------ | ---------------------- | --------------------------- |
| `POST` | `/register`        | Create new account     | `{ name, email, password }` |
| `POST` | `/login`           | Login with credentials | `{ email, password }`       |
| `GET`  | `/google/login`    | Google OAuth redirect  | None                        |
| `GET`  | `/google/callback` | OAuth callback handler | `code` param                |
| `GET`  | `/me`              | Get current user info  | None (requires auth)        |
| `POST` | `/logout`          | Logout current user    | None                        |

### **Example API Usage**

```javascript
// Register new user
const response = await fetch("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "John Doe",
    email: "john@example.com",
    password: "securePassword123",
  }),
});

// Login existing user
const loginResponse = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "john@example.com",
    password: "securePassword123",
  }),
});

// Get current user (with auth token)
const userResponse = await fetch("/api/auth/me", {
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

## 💾 Database Schema

### **User Collection**

```javascript
{
  "_id": ObjectId,
  "name": String,
  "email": String, // Unique
  "auth_provider": "email" | "google",
  "password_hash": String, // Only for email auth
  "google_id": String, // Only for Google auth
  "timezone": String,
  "is_verified": Boolean,
  "created_at": DateTime,
  "last_login": DateTime
}
```

## 🔐 Security Configuration

### **Environment Variables** (`.env`)

```env
# Database
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=mindgarden

# Authentication
SECRET_KEY=your-secret-key-here-change-in-production
JWT_SECRET_KEY=jwt-secret-key-change-in-production-very-long-and-secure
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# Google OAuth (for production)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback

# Frontend
FRONTEND_URL=http://localhost:5173
```

## 🔄 Authentication Flow

### **Email/Password Registration**

1. User fills signup form
2. Frontend validates input
3. POST to `/api/auth/register`
4. Backend validates & hashes password
5. User saved to MongoDB
6. JWT token generated & returned
7. Token stored in localStorage
8. User redirected to dashboard

### **Email/Password Login**

1. User fills login form
2. POST to `/api/auth/login`
3. Backend verifies credentials
4. JWT token generated & returned
5. Token stored in localStorage
6. User redirected to dashboard

### **Google OAuth (Demo)**

1. User clicks "Google" button
2. Redirects to `/api/auth/google/login`
3. Backend redirects to frontend with demo flag
4. Frontend sets demo authentication state
5. User redirected to dashboard

## 🛠️ Frontend Integration

### **Authentication State Management**

```javascript
// App.jsx - Main authentication state
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [user, setUser] = useState(null);

// Check existing authentication on load
useEffect(() => {
  const token = localStorage.getItem("access_token");
  const userData = localStorage.getItem("user");

  if (token && userData) {
    setUser(JSON.parse(userData));
    setIsAuthenticated(true);
  }
}, []);

// Login handler
const handleLogin = (userData) => {
  setUser(userData);
  setIsAuthenticated(true);
};

// Logout handler
const handleLogout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
  setUser(null);
  setIsAuthenticated(false);
};
```

### **API Service with Authentication**

```javascript
// services/api.js - Axios interceptors
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

### **Protected Route Component**

```javascript
// Automatic redirect for unauthenticated users
<Route
  path="/dashboard"
  element={
    isAuthenticated ? (
      <Dashboard user={user} onLogout={handleLogout} />
    ) : (
      <Navigate to="/login" />
    )
  }
/>
```

## 📋 Testing the Authentication

### **Test User Registration**

1. Go to http://localhost:5173
2. Click "Sign Up"
3. Fill form with:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
   - Confirm password: password123
   - Accept terms: ✓
4. Click "Create Account"
5. Should redirect to dashboard

### **Test User Login**

1. Go to http://localhost:5173/login
2. Enter credentials:
   - Email: test@example.com
   - Password: password123
3. Click "Sign In"
4. Should redirect to dashboard

### **Test Google OAuth (Demo)**

1. Go to http://localhost:5173
2. Click "Start Growing with Google"
3. Should redirect and auto-login with demo user
4. Should redirect to dashboard

### **Test Protected Routes**

1. Try accessing http://localhost:5173/dashboard without login
2. Should redirect to login page
3. After login, should access dashboard normally

## 🎯 Next Steps

### **For Production**

1. **Real Google OAuth**: Implement actual Google OAuth flow
2. **Email Verification**: Add email confirmation system
3. **Password Reset**: Implement forgot password functionality
4. **Rate Limiting**: Add login attempt limiting
5. **Session Management**: Implement refresh tokens
6. **HTTPS**: Enable SSL/TLS in production

### **Additional Features**

1. **Profile Management**: User profile editing
2. **Account Deletion**: User account removal
3. **Multi-factor Auth**: 2FA implementation
4. **Social Logins**: GitHub, Microsoft, etc.
5. **Admin Panel**: User management interface

## 🐛 Troubleshooting

### **Common Issues**

**"401 Unauthorized" errors:**

- Check if JWT_SECRET_KEY is set correctly
- Verify token is being sent in Authorization header
- Check token expiration time

**"Email already exists" error:**

- User trying to register with existing email
- Check MongoDB for existing user records

**Google OAuth not working:**

- Currently demo implementation only
- For production, need proper Google OAuth setup

**MongoDB connection issues:**

- Ensure MongoDB is running on localhost:27017
- Check MONGODB_URL in environment variables

**CORS errors:**

- Backend is configured for localhost:5173
- Check FRONTEND_URL setting if using different port

## 🌟 Features in Action

Your MindGarden AI now has:

- ✅ **Secure Authentication System**
- ✅ **Beautiful Login/Signup UI**
- ✅ **MongoDB User Storage**
- ✅ **JWT Token Management**
- ✅ **Protected Routes**
- ✅ **Google OAuth Demo**
- ✅ **Comprehensive API**
- ✅ **Form Validation**
- ✅ **Error Handling**
- ✅ **Responsive Design**

**Ready for your hackathon demo!** 🚀🌱
