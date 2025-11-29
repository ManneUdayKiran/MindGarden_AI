import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Typography,
  Avatar,
  Paper,
  CircularProgress,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  LocalFlorist as LocalFloristIcon,
  Park as GardenIcon,
  Assignment,
  Mood,
  Insights,
  Settings,
  ExitToApp,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { analyticsAPI } from "../services/api";

const SIDEBAR_WIDTH = 240;

const NavigationDrawer = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [gardenHealth, setGardenHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

    // Fetch garden health from analytics
    const fetchGardenHealth = async () => {
      try {
        const dashboard = await analyticsAPI.getDashboard();
        if (dashboard && dashboard.gardenHealth !== undefined) {
          setGardenHealth(Math.round(dashboard.gardenHealth));
        }
      } catch (error) {
        console.error("Error fetching garden health:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGardenHealth();
  }, []);

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "🌱 Garden", icon: <GardenIcon />, path: "/garden" },
    { text: "Habits", icon: <LocalFloristIcon />, path: "/habits" },
    { text: "Tasks", icon: <Assignment />, path: "/tasks" },
    { text: "Mood", icon: <Mood />, path: "/mood" },
    { text: "Insights", icon: <Insights />, path: "/insights" },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    if (onLogout) {
      onLogout();
    }
    navigate("/");
  };

  return (
    <Paper
      elevation={3}
      sx={{
        width: SIDEBAR_WIDTH,
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 1200,
        backgroundColor: "background.paper",
        borderRadius: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* User Profile Section */}
      <Box
        sx={{
          p: 3,
          background: "linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: "primary.main",
              mr: 2,
              fontSize: "1rem",
            }}
          >
            {user ? getInitials(user.name) : "U"}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ fontSize: "0.95rem", lineHeight: 1.3 }}
              noWrap
            >
              {user?.name || "User"}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: "0.75rem" }}
              noWrap
            >
              {user?.email || ""}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LocalFloristIcon sx={{ color: "success.main", fontSize: 18 }} />
          {loading ? (
            <CircularProgress size={14} sx={{ ml: 0.5 }} />
          ) : (
            <Typography
              variant="body2"
              color="success.main"
              fontWeight="600"
              sx={{ fontSize: "0.85rem" }}
            >
              Garden Health:{" "}
              {gardenHealth !== null ? `${gardenHealth}%` : "N/A"}
            </Typography>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Navigation Menu */}
      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        <List sx={{ px: 1, py: 2 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={location.pathname === item.path}
                sx={{
                  py: 1.2,
                  px: 2,
                  borderRadius: 2,
                  "&.Mui-selected": {
                    backgroundColor: "primary.main",
                    color: "white",
                    "& .MuiListItemIcon-root": {
                      color: "white",
                    },
                    "&:hover": {
                      backgroundColor: "primary.dark",
                    },
                  },
                  "&:hover": {
                    backgroundColor: "primary.light",
                    borderRadius: 2,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color:
                      location.pathname === item.path
                        ? "inherit"
                        : "primary.main",
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: location.pathname === item.path ? 600 : 500,
                    fontSize: "0.9rem",
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ mx: 2 }} />

        {/* Settings and Logout */}
        <List sx={{ px: 1, py: 1 }}>
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              sx={{
                py: 1.2,
                px: 2,
                borderRadius: 2,
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Settings sx={{ color: "text.secondary", fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Settings"
                primaryTypographyProps={{
                  fontSize: "0.9rem",
                }}
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                py: 1.2,
                px: 2,
                borderRadius: 2,
                "&:hover": {
                  backgroundColor: "error.light",
                  "& .MuiListItemIcon-root": {
                    color: "error.main",
                  },
                  "& .MuiListItemText-root": {
                    color: "error.main",
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <ExitToApp sx={{ color: "text.secondary", fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{
                  fontSize: "0.9rem",
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      {/* App Info */}
      <Box
        sx={{
          p: 2,
          textAlign: "center",
          borderTop: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: "0.75rem" }}
        >
          MindGarden AI v1.0
        </Typography>
        <br />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: "0.75rem" }}
        >
          🌱 Grow your habits
        </Typography>
      </Box>
    </Paper>
  );
};

export default NavigationDrawer;
