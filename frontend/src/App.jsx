import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useState, useEffect } from "react";

// Pages
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Garden from "./pages/Garden";
import Habits from "./pages/Habits";
import Tasks from "./pages/Tasks";
import Mood from "./pages/Mood";
import Insights from "./pages/Insights";

// Auth Components
import Login from "./components/Login";
import SignUp from "./components/SignUp";

// Notification Component
import InAppNotification from "./components/InAppNotification";

// Create notification event bus
window.showInAppNotification = (title, message, severity = "info") => {
  window.dispatchEvent(
    new CustomEvent("showInAppNotification", {
      detail: { title, message, severity },
    })
  );
};

// Create a custom theme for MindGarden
const theme = createTheme({
  palette: {
    primary: {
      main: "#4caf50", // Garden green
      light: "#81c784",
      dark: "#388e3c",
    },
    secondary: {
      main: "#8bc34a", // Light green
      light: "#aed581",
      dark: "#689f38",
    },
    background: {
      default: "#f1f8e9", // Very light green
      paper: "#ffffff",
    },
    success: {
      main: "#66bb6a",
    },
    info: {
      main: "#26a69a",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        },
      },
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inAppNotification, setInAppNotification] = useState({
    open: false,
    title: "",
    message: "",
    severity: "info",
  });

  // Listen for in-app notification events
  useEffect(() => {
    const handleInAppNotification = (event) => {
      const { title, message, severity } = event.detail;
      setInAppNotification({
        open: true,
        title,
        message,
        severity,
      });
    };

    window.addEventListener("showInAppNotification", handleInAppNotification);

    return () => {
      window.removeEventListener(
        "showInAppNotification",
        handleInAppNotification
      );
    };
  }, []);

  const handleCloseInAppNotification = () => {
    setInAppNotification((prev) => ({ ...prev, open: false }));
  };

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("access_token");
      const userData = localStorage.getItem("user");

      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (error) {
          // Invalid stored data, clear it
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");
        }
      }

      // Check for demo authentication from URL
      const urlParams = new URLSearchParams(window.location.search);
      const demoAuth = urlParams.get("demo_auth");

      if (demoAuth === "success") {
        setIsAuthenticated(true);
        setUser({ name: "Demo User", email: "demo@mindgarden.ai" });
        // Clear the URL parameter
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          Loading...
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Router>
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? <Navigate to="/dashboard" /> : <Landing />
              }
            />
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/signup"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <SignUp onLogin={handleLogin} />
                )
              }
            />
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
            <Route
              path="/garden"
              element={
                isAuthenticated ? (
                  <Garden user={user} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/habits"
              element={
                isAuthenticated ? (
                  <Habits user={user} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/tasks"
              element={
                isAuthenticated ? (
                  <Tasks user={user} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/mood"
              element={
                isAuthenticated ? (
                  <Mood user={user} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/insights"
              element={
                isAuthenticated ? (
                  <Insights user={user} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
        <InAppNotification
          open={inAppNotification.open}
          onClose={handleCloseInAppNotification}
          title={inAppNotification.title}
          message={inAppNotification.message}
          severity={inAppNotification.severity}
        />
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
