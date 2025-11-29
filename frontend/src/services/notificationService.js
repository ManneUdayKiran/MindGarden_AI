import api from "./api";

class NotificationService {
  constructor() {
    this.permission = "default";
    this.checkPermission();
  }

  // Check current notification permission
  checkPermission() {
    if ("Notification" in window) {
      this.permission = Notification.permission;
    }
    return this.permission;
  }

  // Request notification permission
  async requestPermission() {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === "granted";
    }

    return false;
  }

  // Show notification (both browser and in-app)
  showNotification(title, options = {}) {
    console.log(
      "Attempting to show notification:",
      title,
      "Permission:",
      this.permission
    );

    // Determine severity for in-app notification
    let severity = "info";
    if (title.includes("🎉") || title.includes("Complete")) {
      severity = "success";
    } else if (title.includes("⏰") || title.includes("Reminder")) {
      severity = "warning";
    }

    // Always show in-app notification as primary method
    if (window.showInAppNotification) {
      console.log("Showing in-app notification");
      window.showInAppNotification(title, options.body || "", severity);
    }

    // Attempt browser notification if permission granted
    if (this.permission !== "granted") {
      console.warn(
        "Browser notification permission not granted. Current permission:",
        this.permission
      );
      return null;
    }

    // Simplify options - only use what's supported
    const notificationOptions = {
      body: options.body || "",
      icon: options.icon || "/vite.svg",
      tag: options.tag || "mindgarden",
      requireInteraction: options.requireInteraction || false,
    };

    console.log(
      "Creating browser notification with options:",
      notificationOptions
    );

    try {
      const notification = new Notification(title, notificationOptions);
      console.log("Browser notification created successfully:", notification);

      // Add event listeners for debugging
      notification.onshow = () => {
        console.log("✅ Browser notification is now showing!");
      };

      notification.onerror = (error) => {
        console.error("❌ Browser notification error:", error);
      };

      notification.onclose = () => {
        console.log("Browser notification closed");
      };

      notification.onclick = (event) => {
        console.log("Notification clicked");
        event.preventDefault();
        window.focus();
        notification.close();
        if (options.onClick) {
          options.onClick();
        }
      };

      return notification;
    } catch (error) {
      console.error("Error showing browser notification:", error);
      // In-app notification already shown, just log the error
      return null;
    }
  }

  // Fetch and show habit reminders
  async sendHabitsReminder() {
    try {
      console.log("Fetching habits reminder...");
      const response = await api.post(
        "/notifications/generate-reminder?notification_type=habits"
      );

      const data = response.data;
      console.log("Habits reminder data:", data);

      if (data.type === "success") {
        // All habits completed
        this.showNotification("🎉 Habits Complete!", {
          body: data.message,
          tag: "habits-complete",
        });
      } else if (data.type === "habits") {
        // Pending habits
        this.showNotification("🌱 Daily Habits Reminder", {
          body: data.message,
          tag: "habits-reminder",
        });
      } else {
        console.warn("Unexpected response type:", data.type);
        this.showNotification("ℹ️ Notification", {
          body: data.message || "Check your habits!",
          tag: "habits-info",
        });
      }

      return data;
    } catch (error) {
      console.error("Error sending habits reminder:", error);
      alert(`Failed to load habits reminder: ${error.message}`);
      return null;
    }
  }

  // Fetch and show task reminders
  async sendTasksReminder() {
    try {
      console.log("Fetching tasks reminder...");
      const response = await api.post(
        "/notifications/generate-reminder?notification_type=tasks"
      );

      const data = response.data;
      console.log("Tasks reminder data:", data);

      if (data.type === "success") {
        // All tasks completed
        this.showNotification("✅ All Tasks Done!", {
          body: data.message,
          tag: "tasks-complete",
        });
      } else if (data.type === "tasks") {
        // Pending tasks
        const isUrgent = data.overdue_count > 0;
        this.showNotification(
          isUrgent ? "⚠️ Overdue Tasks!" : "📋 Task Reminder",
          {
            body: data.message,
            tag: "tasks-reminder",
            requireInteraction: isUrgent,
          }
        );
      } else {
        console.warn("Unexpected response type:", data.type);
        this.showNotification("ℹ️ Notification", {
          body: data.message || "Check your tasks!",
          tag: "tasks-info",
        });
      }

      return data;
    } catch (error) {
      console.error("Error sending tasks reminder:", error);
      alert(`Failed to load tasks reminder: ${error.message}`);
      return null;
    }
  }

  // Get pending notifications count
  async getPendingCount() {
    try {
      const response = await api.get("/notifications/pending");
      console.log("Pending count response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching pending notifications:", error);
      return { habits: [], tasks: [], total_count: 0 };
    }
  }

  // Snooze notification
  async snoozeNotification(notificationId, duration = 30) {
    try {
      const response = await api.post("/notifications/snooze", null, {
        params: {
          notification_id: notificationId,
          duration: duration,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error snoozing notification:", error);
      return null;
    }
  }

  // Get notification preferences
  async getPreferences() {
    try {
      const response = await api.get("/notifications/preferences");
      return response.data;
    } catch (error) {
      console.error("Error fetching preferences:", error);
      return null;
    }
  }

  // Update notification preferences
  async updatePreferences(preferences) {
    try {
      const response = await api.post(
        "/notifications/preferences",
        preferences
      );
      return response.data;
    } catch (error) {
      console.error("Error updating preferences:", error);
      return null;
    }
  }

  // Schedule notifications based on user preferences
  async scheduleNotifications(preferences) {
    if (!preferences) {
      preferences = await this.getPreferences();
    }

    if (!preferences) return;

    // Clear existing intervals
    if (this.habitsInterval) clearInterval(this.habitsInterval);
    if (this.tasksInterval) clearInterval(this.tasksInterval);

    // Schedule habits notifications
    if (preferences.habits_enabled) {
      this.scheduleTimeBasedNotification(
        preferences.habits_time,
        () => this.sendHabitsReminder(),
        "habits"
      );
    }

    // Schedule tasks notifications
    if (preferences.tasks_enabled) {
      this.scheduleTimeBasedNotification(
        preferences.tasks_time,
        () => this.sendTasksReminder(),
        "tasks"
      );
    }

    // Schedule periodic check for missed items (every 3 hours)
    this.scheduleMissedItemsCheck();
  }

  // Check for missed tasks and habits
  async checkMissedItems() {
    try {
      console.log("Checking for missed items...");
      const response = await api.get("/notifications/check-missed");
      const data = response.data;

      if (data.has_missed_items) {
        const overdueCount = data.overdue_tasks_count || 0;
        const missedCount = data.missed_habits_count || 0;

        this.showNotification("💭 Gentle Reminder", {
          body: data.message,
          tag: "missed-items",
          requireInteraction: overdueCount > 0, // Require interaction if tasks are overdue
        });

        console.log(
          `Missed items notification sent: ${overdueCount} overdue tasks, ${missedCount} missed habits`
        );
      }

      return data;
    } catch (error) {
      console.error("Error checking missed items:", error);
      return null;
    }
  }

  // Schedule periodic missed items check (every 3 hours)
  scheduleMissedItemsCheck() {
    // Clear existing interval if any
    if (this.missedItemsInterval) {
      clearInterval(this.missedItemsInterval);
    }

    // Check every 3 hours
    const THREE_HOURS = 3 * 60 * 60 * 1000;

    // Run immediately on initialization
    this.checkMissedItems();

    // Then schedule regular checks
    this.missedItemsInterval = setInterval(() => {
      this.checkMissedItems();
    }, THREE_HOURS);

    console.log("Scheduled missed items check every 3 hours");
  }

  // Helper to schedule notifications at specific times
  scheduleTimeBasedNotification(timeString, callback, type) {
    const [hours, minutes] = timeString.split(":").map(Number);

    const checkAndNotify = () => {
      const now = new Date();
      if (now.getHours() === hours && now.getMinutes() === minutes) {
        callback();
      }
    };

    // Check every minute
    const interval = setInterval(checkAndNotify, 60000);

    if (type === "habits") {
      this.habitsInterval = interval;
    } else if (type === "tasks") {
      this.tasksInterval = interval;
    }

    // Check immediately in case we're at the right time
    checkAndNotify();
  }

  // Clear all scheduled notifications
  clearScheduledNotifications() {
    if (this.habitsInterval) {
      clearInterval(this.habitsInterval);
      this.habitsInterval = null;
    }
    if (this.tasksInterval) {
      clearInterval(this.tasksInterval);
      this.tasksInterval = null;
    }
    if (this.missedItemsInterval) {
      clearInterval(this.missedItemsInterval);
      this.missedItemsInterval = null;
    }
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;
