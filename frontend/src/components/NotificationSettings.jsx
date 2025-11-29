import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Paper,
  Alert,
  Stack,
  Chip,
  Divider,
} from "@mui/material";
import {
  Notifications,
  NotificationsActive,
  Schedule,
  CheckCircle,
  Snooze,
} from "@mui/icons-material";
import notificationService from "../services/notificationService";

const NotificationSettings = ({ open, onClose }) => {
  const [permission, setPermission] = useState("default");
  const [preferences, setPreferences] = useState({
    habits_enabled: true,
    tasks_enabled: true,
    habits_time: "09:00",
    tasks_time: "18:00",
    snooze_duration: 30,
  });
  const [pendingCount, setPendingCount] = useState({
    habits: [],
    tasks: [],
    total_count: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
    loadPendingCount();
    checkPermission();
  }, [open]);

  const checkPermission = () => {
    const perm = notificationService.checkPermission();
    setPermission(perm);
  };

  const loadPreferences = async () => {
    const prefs = await notificationService.getPreferences();
    if (prefs) {
      setPreferences(prefs);
    }
  };

  const loadPendingCount = async () => {
    const count = await notificationService.getPendingCount();
    setPendingCount(count);
  };

  const requestPermission = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      setPermission("granted");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await notificationService.updatePreferences(preferences);
      await notificationService.scheduleNotifications(preferences);
      onClose();
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setSaving(false);
    }
  };

  const testNotification = async (type) => {
    console.log("Testing notification, type:", type, "permission:", permission);

    if (permission !== "granted") {
      console.log("Permission not granted, requesting...");
      const granted = await requestPermission();
      if (!granted) {
        alert("Please enable notifications in your browser settings to test.");
        return;
      }
      // Update permission state after granting
      setPermission("granted");
    }

    console.log("Sending test notification for:", type);
    try {
      if (type === "habits") {
        const result = await notificationService.sendHabitsReminder();
        console.log("Habits notification result:", result);
      } else if (type === "tasks") {
        const result = await notificationService.sendTasksReminder();
        console.log("Tasks notification result:", result);
      }
    } catch (error) {
      console.error("Error in testNotification:", error);
      alert(`Error testing notification: ${error.message}`);
    }
  };

  const testSimpleNotification = () => {
    console.log("Testing simple notification...");

    // Show in-app notification
    if (window.showInAppNotification) {
      window.showInAppNotification(
        "🧪 Test Notification",
        "If you can see this, in-app notifications are working!",
        "success"
      );
    }

    // Also try browser notification if permission granted
    try {
      if (Notification.permission === "granted") {
        const notification = new Notification("🧪 Test Notification", {
          body: "If you can see this, browser notifications are working!",
          icon: "/vite.svg",
        });
        notification.onshow = () =>
          console.log("✅ Simple browser notification shown!");
        notification.onerror = (e) =>
          console.error("❌ Simple browser notification error:", e);
      }
    } catch (error) {
      console.error("Failed to create simple browser notification:", error);
    }
  };

  const testMissedItems = async () => {
    console.log("Checking for missed items...");
    try {
      const result = await notificationService.checkMissedItems();
      console.log("Missed items check result:", result);
    } catch (error) {
      console.error("Error checking missed items:", error);
      alert(`Error checking missed items: ${error.message}`);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <NotificationsActive color="primary" />
          <Typography variant="h6">Notification Settings</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Permission Status */}
          <Paper
            sx={{
              p: 2,
              bgcolor:
                permission === "granted"
                  ? "success.light"
                  : permission === "denied"
                  ? "error.light"
                  : "warning.light",
            }}
          >
            <Typography variant="subtitle2" fontWeight="600" gutterBottom>
              Browser Permission Status
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              {permission === "granted" ? (
                <CheckCircle color="success" />
              ) : (
                <Notifications
                  color={permission === "denied" ? "error" : "warning"}
                />
              )}
              <Typography variant="body2">
                {permission === "granted"
                  ? "✅ Notifications enabled"
                  : permission === "denied"
                  ? "❌ Notifications blocked"
                  : "⚠️ Permission not granted"}
              </Typography>
            </Box>
            {permission !== "granted" && (
              <Button
                variant="contained"
                size="small"
                onClick={requestPermission}
                disabled={permission === "denied"}
              >
                {permission === "denied"
                  ? "Enable in Browser Settings"
                  : "Enable Notifications"}
              </Button>
            )}
            {permission === "granted" && (
              <Button
                variant="outlined"
                size="small"
                onClick={testSimpleNotification}
                sx={{ mt: 1 }}
              >
                🧪 Test Simple Notification
              </Button>
            )}
          </Paper>

          {/* Pending Items Summary */}
          <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
            <Typography variant="subtitle2" fontWeight="600" gutterBottom>
              Pending Today
            </Typography>
            <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
              <Chip
                label={`${pendingCount.habits?.length || 0} Habits`}
                color="primary"
                variant="outlined"
              />
              <Chip
                label={`${pendingCount.tasks?.length || 0} Tasks`}
                color="secondary"
                variant="outlined"
              />
            </Box>
          </Paper>

          <Divider />

          {/* Habits Notifications */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.habits_enabled}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      habits_enabled: e.target.checked,
                    })
                  }
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight="600">
                    🌱 Daily Habits Reminders
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Get AI-powered reminders for incomplete habits
                  </Typography>
                </Box>
              }
            />

            {preferences.habits_enabled && (
              <Box sx={{ ml: 6, mt: 1 }}>
                <TextField
                  label="Reminder Time"
                  type="time"
                  value={preferences.habits_time}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      habits_time: e.target.value,
                    })
                  }
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 150 }}
                />
                <Button
                  size="small"
                  onClick={() => testNotification("habits")}
                  sx={{ ml: 2 }}
                  disabled={permission !== "granted"}
                >
                  Test Now
                </Button>
              </Box>
            )}
          </Box>

          <Divider />

          {/* Tasks Notifications */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.tasks_enabled}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      tasks_enabled: e.target.checked,
                    })
                  }
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight="600">
                    📋 Task Reminders
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Get notified about incomplete and overdue tasks
                  </Typography>
                </Box>
              }
            />

            {preferences.tasks_enabled && (
              <Box sx={{ ml: 6, mt: 1 }}>
                <TextField
                  label="Reminder Time"
                  type="time"
                  value={preferences.tasks_time}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      tasks_time: e.target.value,
                    })
                  }
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 150 }}
                />
                <Button
                  size="small"
                  onClick={() => testNotification("tasks")}
                  sx={{ ml: 2 }}
                  disabled={permission !== "granted"}
                >
                  Test Now
                </Button>
              </Box>
            )}
          </Box>

          <Divider />

          {/* Missed Items Check */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Schedule color="action" />
              <Typography variant="body1" fontWeight="600">
                Missed Items Check
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              AI automatically checks for overdue tasks and missed habits every
              3 hours
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={testMissedItems}
              disabled={permission !== "granted"}
            >
              💭 Check Missed Items Now
            </Button>
          </Box>

          <Divider />

          {/* Snooze Duration */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Snooze color="action" />
              <Typography variant="body1" fontWeight="600">
                Snooze Duration
              </Typography>
            </Box>
            <TextField
              label="Default Snooze (minutes)"
              type="number"
              value={preferences.snooze_duration}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  snooze_duration: parseInt(e.target.value) || 30,
                })
              }
              size="small"
              inputProps={{ min: 5, max: 120, step: 5 }}
              sx={{ width: 200 }}
            />
          </Box>

          {/* Info Alert */}
          <Alert severity="info" icon={<Schedule />}>
            <Typography variant="caption">
              <strong>Smart Reminders:</strong> AI analyzes your habits and
              tasks to send personalized, motivating notifications at your
              preferred times.
            </Typography>
          </Alert>

          {/* How It Works */}
          <Paper sx={{ p: 2, bgcolor: "primary.light" }}>
            <Typography variant="subtitle2" fontWeight="600" gutterBottom>
              📱 How You'll Get Notifications
            </Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Typography variant="caption" display="block">
                ✓ Browser notifications appear even when tab is in background
              </Typography>
              <Typography variant="caption" display="block">
                ✓ Sent automatically at your scheduled times daily
              </Typography>
              <Typography variant="caption" display="block">
                ✓ AI generates personalized, motivating messages
              </Typography>
              <Typography variant="caption" display="block">
                ✓ Use "Test Now" buttons above to preview notifications
              </Typography>
            </Stack>
          </Paper>

          {preferences.habits_enabled && preferences.tasks_enabled && (
            <Alert severity="success">
              <Typography variant="caption">
                ✅ Notifications scheduled for{" "}
                <strong>{preferences.habits_time}</strong> (habits) and{" "}
                <strong>{preferences.tasks_time}</strong> (tasks) daily
              </Typography>
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationSettings;
