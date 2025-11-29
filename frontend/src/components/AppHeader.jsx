import { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Badge,
} from "@mui/material";
import {
  Notifications,
  AccountCircle,
  ExitToApp,
  Settings,
} from "@mui/icons-material";
import NotificationSettings from "./NotificationSettings";
import notificationService from "../services/notificationService";

function AppHeader({ title, subtitle, user, onLogout }) {
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [notificationSettingsOpen, setNotificationSettingsOpen] =
    useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    loadPendingCount();
    // Initialize notification service and schedule notifications
    initializeNotifications();

    // Refresh pending count every 5 minutes
    const interval = setInterval(loadPendingCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadPendingCount = async () => {
    const data = await notificationService.getPendingCount();
    setPendingCount(data.total_count || 0);
  };

  const initializeNotifications = async () => {
    const preferences = await notificationService.getPreferences();
    if (preferences) {
      // Request permission if not already granted
      if (notificationService.checkPermission() === "default") {
        await notificationService.requestPermission();
      }
      await notificationService.scheduleNotifications(preferences);
      console.log("Notifications initialized. Scheduled times:", {
        habits: preferences.habits_time,
        tasks: preferences.tasks_time,
      });
    }
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    if (onLogout) {
      onLogout();
    }
    window.location.href = "/";
  };

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: "background.paper",
          color: "text.primary",
          borderBottom: 1,
          borderColor: "divider",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" fontWeight="600">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>

          <IconButton
            color="inherit"
            onClick={() => setNotificationSettingsOpen(true)}
          >
            <Badge badgeContent={pendingCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          <IconButton
            color="inherit"
            onClick={handleUserMenuOpen}
            sx={{ ml: 1, p: 0 }}
          >
            <Avatar sx={{ bgcolor: "primary.main" }}>
              {user?.name?.[0] || "U"}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={handleUserMenuClose}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleUserMenuClose();
            setNotificationSettingsOpen(true);
          }}
        >
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Notification Settings
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <ExitToApp fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Notification Settings Dialog */}
      <NotificationSettings
        open={notificationSettingsOpen}
        onClose={() => {
          setNotificationSettingsOpen(false);
          loadPendingCount(); // Refresh count when closing
        }}
      />
    </>
  );
}

export default AppHeader;
