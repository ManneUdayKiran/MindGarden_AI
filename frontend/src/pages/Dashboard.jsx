import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Stack,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  LinearProgress,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  CheckCircle,
  RadioButtonUnchecked,
  EmojiEmotions,
  AutoAwesome,
  TrendingUp,
  TrendingDown,
  LocalFireDepartment,
  Psychology,
  Assessment,
  Insights,
  BarChart,
  Star,
  Lightbulb,
} from "@mui/icons-material";
import { motion } from "framer-motion";

// Components
import AppLayout from "../components/AppLayout";
import { habitsAPI, tasksAPI, moodAPI } from "../services/api";

function Dashboard({ user, onLogout }) {
  const [currentUser] = useState({
    name: user?.name || "User",
    avatar: "/api/placeholder/40/40",
    lastMoodEmoji: "😊",
    gardenHealthScore: 78,
    consistencyIndex: 73,
    activeHabits: 6,
    longestStreak: 10,
  });

  // Real data states
  const [todaysTasks, setTodaysTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moodData, setMoodData] = useState({
    current: { emoji: "😊", label: "Good", energy: 4 },
    stability: "Stable",
    lastUpdated: "Not logged today",
  });
  const [weeklyStats, setWeeklyStats] = useState({
    taskCompletion: { value: 0, change: 0, trend: "stable" },
    habitCompletion: { value: 0, total: 0, change: 0, trend: "stable" },
  });
  const [weeklyHabitData, setWeeklyHabitData] = useState([]);

  // Fetch data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch habits
        const habitsResponse = await habitsAPI.getHabits();
        const habitsData = habitsResponse.data.map((habit) => ({
          id: habit.id,
          name: habit.name,
          streak: habit.current_streak || 0,
          weeklyCompletion:
            Math.round((habit.completions_this_week / 7) * 100) || 0,
          completedToday: habit.completed_today || false,
        }));
        setHabits(habitsData);

        // Fetch weekly stats for habits
        try {
          const weeklyStatsResponse = await habitsAPI.getWeeklyStats();
          const statsData = weeklyStatsResponse.data; // This is an array of daily stats

          // statsData is an array like: [{ day: "Mon", date: "2025-11-23", completed: 3, total: 5 }, ...]
          const weeklyChartData = statsData.map((dayData) => {
            const percentage =
              dayData.total > 0
                ? Math.round((dayData.completed / dayData.total) * 100)
                : 0;
            return {
              day: dayData.day,
              completed: dayData.completed,
              total: dayData.total,
              percentage,
            };
          });
          setWeeklyHabitData(weeklyChartData);

          // Calculate average habit completion for the week
          const totalCompletions = statsData.reduce(
            (sum, day) => sum + day.completed,
            0
          );
          const totalPossible = statsData.reduce(
            (sum, day) => sum + day.total,
            0
          );
          const avgCompletionRate =
            totalPossible > 0
              ? Math.round((totalCompletions / totalPossible) * 100)
              : 0;

          setWeeklyStats((prev) => ({
            ...prev,
            habitCompletion: {
              value: avgCompletionRate,
              total: habitsData.length,
              change: 0, // We don't have previous week data yet
              trend: "stable",
            },
          }));
        } catch (error) {
          console.error("Error fetching weekly stats:", error);
          // Set empty data on error to prevent undefined errors
          setWeeklyHabitData([
            { day: "Mon", completed: 0, total: 0, percentage: 0 },
            { day: "Tue", completed: 0, total: 0, percentage: 0 },
            { day: "Wed", completed: 0, total: 0, percentage: 0 },
            { day: "Thu", completed: 0, total: 0, percentage: 0 },
            { day: "Fri", completed: 0, total: 0, percentage: 0 },
            { day: "Sat", completed: 0, total: 0, percentage: 0 },
            { day: "Sun", completed: 0, total: 0, percentage: 0 },
          ]);
          setWeeklyStats((prev) => ({
            ...prev,
            habitCompletion: {
              value: 0,
              total: habitsData.length,
              change: 0,
              trend: "stable",
            },
          }));
        }

        // Fetch tasks for today
        const tasksResponse = await tasksAPI.getTasks();
        const today = new Date().toISOString().split("T")[0];
        const allTasks = tasksResponse.data;
        const todayTasksData = allTasks
          .filter((task) => !task.is_completed)
          .map((task) => ({
            id: task.id || task._id,
            title: task.title,
            type: task.estimated_minutes > 60 ? "Deep Work" : "Quick Win",
            priority: task.priority || "medium",
            estimated: task.estimated_minutes || 30,
            completed: task.is_completed || false,
          }));
        setTodaysTasks(todayTasksData);

        // Calculate weekly task completion rate
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weeklyTasks = allTasks.filter((task) => {
          const taskDate = new Date(task.created_at || task.due_date);
          return taskDate >= weekAgo;
        });
        const completedWeeklyTasks = weeklyTasks.filter(
          (t) => t.is_completed
        ).length;
        const taskCompletionRate =
          weeklyTasks.length > 0
            ? Math.round((completedWeeklyTasks / weeklyTasks.length) * 100)
            : 0;

        setWeeklyStats((prev) => ({
          ...prev,
          taskCompletion: {
            value: taskCompletionRate,
            change: 0, // Could calculate from previous week if we store historical data
            trend: "stable",
          },
        }));

        // Fetch latest mood
        try {
          const moodResponse = await moodAPI.getMoodTimeline(1);
          if (
            moodResponse.data &&
            moodResponse.data.timeline &&
            moodResponse.data.timeline.length > 0
          ) {
            const latestMood = moodResponse.data.timeline[0];
            if (latestMood.has_log) {
              const moodEmojis = {
                very_low: "😔",
                low: "😕",
                neutral: "😐",
                good: "🙂",
                very_good: "😊",
              };
              setMoodData({
                current: {
                  emoji: moodEmojis[latestMood.mood] || "😊",
                  label: latestMood.mood.replace("_", " "),
                  energy: latestMood.energy || 3,
                },
                stability: "Stable",
                lastUpdated: new Date().toLocaleTimeString(),
              });
            }
          }
        } catch (error) {
          console.log("No mood data available");
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const [aiPlanDialog, setAiPlanDialog] = useState(false);
  const [aiPlan, setAiPlan] = useState(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getGreetingEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "🌅";
    if (hour < 18) return "☀️";
    return "🌙";
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const getTaskTypeColor = (type) => {
    switch (type) {
      case "Deep Work":
        return "primary";
      case "High Impact":
        return "error";
      case "Quick Win":
        return "success";
      default:
        return "default";
    }
  };

  const handleGenerateAIPlan = async () => {
    try {
      setIsLoadingPlan(true);

      // Prepare data for API call
      const requestData = {
        habits: habits.map((h) => ({
          name: h.name,
          completionRate: h.weeklyCompletion,
          streak: h.streak,
          completedToday: h.completedToday,
        })),
        tasks: todaysTasks.map((t) => ({
          title: t.title,
          priority: t.priority,
          estimated: t.estimated,
          completed: t.completed,
          type: t.type,
        })),
        mood: currentUser.lastMoodEmoji,
        current_time: new Date().toISOString(),
      };

      // Call backend API
      const response = await fetch("http://localhost:8000/api/ai/daily-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error("Failed to generate AI plan");
      }

      const aiResponse = await response.json();

      // Set the AI plan and open dialog
      console.log("AI Plan received:", JSON.stringify(aiResponse, null, 2));
      setAiPlan(aiResponse);
      setAiPlanDialog(true);
      console.log("Dialog should be open now");
    } catch (error) {
      console.error("Error generating AI plan:", error);

      // Fallback to basic recommendations if API fails
      const incompleteTasks = todaysTasks.filter((t) => !t.completed);
      const lowHabits = habits.filter((h) => h.weeklyCompletion < 70);
      const hour = new Date().getHours();

      const recommendations = {
        priorityTask:
          incompleteTasks.length > 0
            ? incompleteTasks.sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
              })[0].title
            : "Review your goals",
        focusTime:
          hour >= 9 && hour <= 11
            ? "09:00 - 11:00"
            : hour < 9
            ? "09:00 - 11:00"
            : `${hour + 1}:00 - ${hour + 3}:00`,
        habitSuggestion:
          lowHabits.length > 0 ? lowHabits[0].name : "Morning Reading",
        schedule: [
          {
            time: `${hour.toString().padStart(2, "0")}:00`,
            activity:
              incompleteTasks.length > 0
                ? incompleteTasks[0].title
                : "Review your goals",
            duration:
              incompleteTasks.length > 0
                ? `${incompleteTasks[0].estimated} min`
                : "15 min",
            priority:
              incompleteTasks.length > 0 ? incompleteTasks[0].priority : "low",
          },
          {
            time: `${(hour + 1).toString().padStart(2, "0")}:00`,
            activity: "Take a 5-minute break",
            duration: "5 min",
            priority: "medium",
          },
          {
            time: `${(hour + 1).toString().padStart(2, "0")}:05`,
            activity:
              lowHabits.length > 0
                ? lowHabits[0].name
                : "Continue with next task",
            duration: "20 min",
            priority: "medium",
          },
        ],
        insight: "AI service unavailable. Using basic recommendations.",
      };

      setAiPlan(recommendations);
      setAiPlanDialog(true);
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const toggleTaskCompletion = async (taskId) => {
    try {
      console.log("Toggle task completion - taskId:", taskId);
      console.log("Tasks list:", todaysTasks);

      if (!taskId) {
        console.error("Task ID is undefined!");
        return;
      }

      // Update in backend
      await tasksAPI.updateTask(taskId, { is_completed: true });

      // Update local state
      setTodaysTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, completed: true } : task
        )
      );
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  const handleLogMood = async () => {
    // TODO: Show mood logging dialog
    // For now, navigate to mood page
    window.location.href = "/mood";
  };

  return (
    <AppLayout
      title={`${getGreeting()}, ${currentUser.name} ${getGreetingEmoji()}`}
      subtitle={new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
      user={user || currentUser}
      onLogout={onLogout}
    >
      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "60vh",
            }}
          >
            <Stack alignItems="center" spacing={2}>
              <CircularProgress size={60} />
              <Typography variant="h6" color="text.secondary">
                Loading your dashboard...
              </Typography>
            </Stack>
          </Box>
        ) : (
          <>
            {/* Row 1: Brain Snapshot - Cognitive Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card
                sx={{
                  mb: 4,
                  background:
                    "linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)",
                  border: "1px solid rgba(76, 175, 80, 0.2)",
                }}
              >
                <CardContent sx={{ py: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 3,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <Box sx={{ flex: "0 0 auto", minWidth: 200 }}>
                      <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
                        <Typography
                          variant="h4"
                          fontWeight="bold"
                          color="primary"
                        >
                          {currentUser.gardenHealthScore}/100
                        </Typography>
                        <Typography variant="body1" fontWeight="600">
                          Garden Health Score
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: { xs: "center", md: "flex-start" },
                            mt: 1,
                          }}
                        >
                          <TrendingUp
                            sx={{
                              color: "success.main",
                              fontSize: 20,
                              mr: 0.5,
                            }}
                          />
                          <Typography
                            variant="body2"
                            color="success.main"
                            fontWeight="600"
                          >
                            ↑ 12% vs last week
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 300, textAlign: "center" }}>
                      <Box sx={{ textAlign: "center" }}>
                        <Psychology
                          sx={{ fontSize: 32, color: "primary.main", mb: 1 }}
                        />
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          sx={{ fontStyle: "italic" }}
                        >
                          "You complete most tasks between 9–11 AM. Protect this
                          time."
                        </Typography>
                        <Typography
                          variant="caption"
                          color="primary"
                          sx={{ fontWeight: 600 }}
                        >
                          AI Insight
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ flex: "0 0 auto", minWidth: 200 }}>
                      <Box sx={{ textAlign: { xs: "center", md: "right" } }}>
                        <Typography variant="body2" color="text.secondary">
                          Current State
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          Peak Focus Zone
                        </Typography>
                        <Chip
                          label="Optimal Performance"
                          color="success"
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>

            {/* Row 2: AI Insight Component - Top Priority */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card
                sx={{
                  mb: 4,
                  background:
                    "linear-gradient(135deg, #f3e5f5 0%, #e1f5fe 100%)",
                  border: "1px solid rgba(156, 39, 176, 0.2)",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 3,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 300 }}>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ display: "flex", alignItems: "center" }}
                      >
                        🧠 AI Daily Coach
                        <Chip
                          label="Smart Recommendations"
                          color="primary"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Typography>

                      <Typography
                        variant="body1"
                        sx={{ mb: 2, lineHeight: 1.6, fontWeight: 500 }}
                      >
                        You are most consistent on Monday and Tuesday, but drop
                        off significantly after Thursday. Try scheduling lighter
                        habits or shorter tasks on Friday to maintain your
                        momentum.
                      </Typography>

                      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                        <Typography
                          variant="body2"
                          sx={{ display: "flex", alignItems: "center" }}
                        >
                          <Assessment
                            sx={{ fontSize: 16, mr: 1, color: "primary.main" }}
                          />
                          Best focus time: 9–11 AM
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ display: "flex", alignItems: "center" }}
                        >
                          <EmojiEmotions
                            sx={{ fontSize: 16, mr: 1, color: "warning.main" }}
                          />
                          Lower mood when sleep &lt; 7h
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ flex: "0 0 auto", minWidth: 200 }}>
                      <Stack spacing={2}>
                        <Button
                          variant="contained"
                          startIcon={
                            isLoadingPlan ? (
                              <CircularProgress size={20} color="inherit" />
                            ) : (
                              <AutoAwesome />
                            )
                          }
                          fullWidth
                          onClick={handleGenerateAIPlan}
                          disabled={isLoadingPlan}
                        >
                          {isLoadingPlan ? "Generating..." : "Generate AI Plan"}
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Insights />}
                          fullWidth
                          onClick={() => console.log("View detailed insights")}
                        >
                          View Analysis
                        </Button>
                      </Stack>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>

            {/* Row 3: Top Habits Streaks */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ flex: "1 1 100%", minWidth: 300 }}>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Card sx={{ height: "100%" }}>
                    <CardContent>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ display: "flex", alignItems: "center" }}
                      >
                        <LocalFireDepartment sx={{ mr: 1, color: "orange" }} />
                        Top Streaks
                      </Typography>

                      <List dense sx={{ py: 0 }}>
                        {habits.slice(0, 3).map((habit, index) => (
                          <ListItem key={habit.id} sx={{ px: 0, py: 0.5 }}>
                            <ListItemText
                              primary={
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <Typography variant="body2" fontWeight="600">
                                    {habit.name}
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    {habit.streak >= 7 && (
                                      <Star
                                        sx={{
                                          color: "gold",
                                          fontSize: 14,
                                          mr: 0.5,
                                        }}
                                      />
                                    )}
                                    <Chip
                                      label={`${habit.streak}d`}
                                      size="small"
                                      color={
                                        habit.streak >= 7
                                          ? "warning"
                                          : "primary"
                                      }
                                      sx={{ minWidth: "40px", height: "20px" }}
                                    />
                                  </Box>
                                </Box>
                              }
                              secondary={
                                <LinearProgress
                                  variant="determinate"
                                  value={habit.weeklyCompletion}
                                  color={
                                    habit.weeklyCompletion > 80
                                      ? "success"
                                      : habit.weeklyCompletion > 50
                                      ? "warning"
                                      : "error"
                                  }
                                  sx={{ height: 3, borderRadius: 2, mt: 0.5 }}
                                />
                              }
                            />
                          </ListItem>
                        ))}
                      </List>

                      {/* Quick Mood Log */}
                      <Box
                        sx={{
                          mt: 2,
                          p: 1.5,
                          bgcolor: "grey.50",
                          borderRadius: 1,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "flex", alignItems: "center", mb: 1 }}
                        >
                          <EmojiEmotions sx={{ fontSize: 14, mr: 0.5 }} />
                          Current: {moodData.current.emoji}{" "}
                          {moodData.current.label}
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          fullWidth
                          onClick={handleLogMood}
                          sx={{ height: "28px", fontSize: "11px" }}
                        >
                          Update Mood
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>
            </Box>

            {/* Row 4: Two Column Layout */}
            <Box sx={{ display: "flex", gap: 4, mb: 6, flexWrap: "wrap" }}>
              {/* Today's Focus */}
              <Box sx={{ flex: "1 1 45%", minWidth: 300 }}>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card sx={{ height: "100%" }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        🎯 Today's Focus
                      </Typography>
                      {todaysTasks.length === 0 ? (
                        <Box
                          sx={{
                            textAlign: "center",
                            py: 4,
                            color: "text.secondary",
                          }}
                        >
                          <Typography variant="body1" sx={{ mb: 2 }}>
                            📝 Add tasks here
                          </Typography>
                          <Typography variant="caption">
                            Create tasks to get started with your daily plan
                          </Typography>
                        </Box>
                      ) : (
                        <List dense>
                          {todaysTasks.slice(0, 3).map((task, index) => (
                            <ListItem
                              key={task.id}
                              secondaryAction={
                                <IconButton
                                  edge="end"
                                  onClick={() => toggleTaskCompletion(task.id)}
                                >
                                  {task.completed ? (
                                    <CheckCircle color="success" />
                                  ) : (
                                    <RadioButtonUnchecked color="action" />
                                  )}
                                </IconButton>
                              }
                              sx={{
                                opacity: task.completed ? 0.6 : 1,
                                textDecoration: task.completed
                                  ? "line-through"
                                  : "none",
                              }}
                            >
                              <ListItemText
                                primary={task.title}
                                secondary={
                                  <Box
                                    sx={{
                                      display: "flex",
                                      gap: 1,
                                      alignItems: "center",
                                      mt: 0.5,
                                    }}
                                  >
                                    <Chip
                                      label={task.type}
                                      size="small"
                                      color={getTaskTypeColor(task.type)}
                                      variant="outlined"
                                    />
                                    <Typography variant="caption">
                                      {task.estimated}m
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}
                      <Button
                        variant="outlined"
                        startIcon={<AutoAwesome />}
                        fullWidth
                        size="small"
                        onClick={handleGenerateAIPlan}
                        disabled={todaysTasks.length === 0}
                        sx={{ mt: 2 }}
                      >
                        Ask AI to Refine Plan
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>

              {/* Weekly Progress Chart */}
              <Box sx={{ flex: "1 1 45%", minWidth: 300 }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                >
                  <Card sx={{ height: "100%" }}>
                    <CardContent>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ display: "flex", alignItems: "center" }}
                      >
                        <BarChart sx={{ mr: 1, color: "primary.main" }} />
                        Week Progress
                      </Typography>

                      {/* Mini Habit Chart */}
                      <Box sx={{ mb: 3 }}>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 2,
                            justifyContent: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          {weeklyHabitData.map((day, index) => (
                            <Box key={day.day} sx={{ flex: "0 0 auto" }}>
                              <Box sx={{ textAlign: "center" }}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    mb: 1,
                                    display: "block",
                                    fontSize: "10px",
                                  }}
                                >
                                  {day.day}
                                </Typography>
                                <Box
                                  sx={{
                                    height: 80,
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "flex-end",
                                    alignItems: "center",
                                    mb: 0.5,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 40,
                                      height: `${day.percentage}%`,
                                      bgcolor:
                                        day.percentage === 100
                                          ? "success.main"
                                          : day.percentage > 70
                                          ? "warning.main"
                                          : "error.main",
                                      borderRadius: "2px 2px 0 0",
                                      minHeight: 4,
                                    }}
                                  />
                                </Box>
                                <Typography
                                  variant="caption"
                                  sx={{ fontSize: "10px" }}
                                >
                                  {day.percentage}%
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </Box>

                      {/* AI Insight Box */}
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: "primary.light",
                          borderRadius: 2,
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="primary.dark"
                          sx={{ display: "flex", alignItems: "center", mb: 1 }}
                        >
                          <Lightbulb sx={{ fontSize: 16, mr: 1 }} />
                          <strong>Weekly Insights</strong>
                        </Typography>
                        <Typography variant="caption" color="primary.dark">
                          {weeklyHabitData.length > 0
                            ? (() => {
                                const avgCompletion = Math.round(
                                  weeklyHabitData.reduce(
                                    (sum, day) => sum + day.percentage,
                                    0
                                  ) / weeklyHabitData.length
                                );
                                const bestDay = weeklyHabitData.reduce(
                                  (best, day) =>
                                    day.percentage > best.percentage
                                      ? day
                                      : best,
                                  weeklyHabitData[0]
                                );
                                return avgCompletion >= 80
                                  ? `Great week! ${avgCompletion}% completion rate. Keep it up!`
                                  : avgCompletion >= 60
                                  ? `Good progress with ${avgCompletion}% completion. Your best day was ${bestDay.day}.`
                                  : `You completed ${avgCompletion}% of habits this week. Consider adjusting your goals.`;
                              })()
                            : "Start tracking habits to see weekly insights!"}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>
            </Box>

            {/* Row 5: Insights & Analytics */}
            <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {/* Weekly Stats & Trends */}
              <Box sx={{ flex: "1 1 100%", minWidth: 300 }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Card sx={{ height: "100%" }}>
                    <CardContent>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ display: "flex", alignItems: "center" }}
                      >
                        📊 Weekly Overview
                      </Typography>

                      <Box sx={{ mb: 3 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 1,
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Task Completion Rate
                          </Typography>
                          {weeklyStats.taskCompletion?.change !== 0 && (
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              {weeklyStats.taskCompletion?.trend === "up" ? (
                                <TrendingUp
                                  sx={{
                                    color: "success.main",
                                    fontSize: 16,
                                    mr: 0.5,
                                  }}
                                />
                              ) : (
                                <TrendingDown
                                  sx={{
                                    color: "error.main",
                                    fontSize: 16,
                                    mr: 0.5,
                                  }}
                                />
                              )}
                              <Typography
                                variant="body2"
                                color={
                                  weeklyStats.taskCompletion.trend === "up"
                                    ? "success.main"
                                    : "error.main"
                                }
                                fontWeight="600"
                              >
                                {weeklyStats.taskCompletion.change > 0
                                  ? "+"
                                  : ""}
                                {weeklyStats.taskCompletion.change}%
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        <Typography variant="h6" fontWeight="bold">
                          {weeklyStats.taskCompletion?.value || 0}%
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 3 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 1,
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Habit Completion
                          </Typography>
                          {weeklyStats.habitCompletion?.change !== 0 && (
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              {weeklyStats.habitCompletion?.trend === "up" ? (
                                <TrendingUp
                                  sx={{
                                    color: "success.main",
                                    fontSize: 16,
                                    mr: 0.5,
                                  }}
                                />
                              ) : (
                                <TrendingDown
                                  sx={{
                                    color: "error.main",
                                    fontSize: 16,
                                    mr: 0.5,
                                  }}
                                />
                              )}
                              <Typography
                                variant="body2"
                                color={
                                  weeklyStats.habitCompletion?.trend === "up"
                                    ? "success.main"
                                    : "error.main"
                                }
                                fontWeight="600"
                              >
                                {weeklyStats.habitCompletion?.change > 0
                                  ? "+"
                                  : ""}
                                {weeklyStats.habitCompletion?.change}%
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        <Typography variant="h6" fontWeight="bold">
                          {weeklyStats.habitCompletion?.value || 0}% avg
                          completion
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>

              {/* Top Habits & Streaks */}
              <Box sx={{ flex: "1 1 100%", minWidth: 300 }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <Card sx={{ height: "100%" }}>
                    <CardContent>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ display: "flex", alignItems: "center" }}
                      >
                        🔁 Top Habits & Streaks
                      </Typography>

                      <List dense>
                        {habits.slice(0, 4).map((habit, index) => (
                          <ListItem key={habit.id} sx={{ px: 0 }}>
                            <ListItemText
                              primary={
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <Typography variant="body2" fontWeight="600">
                                    {habit.name}
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <LocalFireDepartment
                                      sx={{
                                        color: "orange",
                                        fontSize: 16,
                                        mr: 0.5,
                                      }}
                                    />
                                    <Typography
                                      variant="body2"
                                      fontWeight="bold"
                                    >
                                      {habit.streak}
                                    </Typography>
                                  </Box>
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 1 }}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      mb: 0.5,
                                    }}
                                  >
                                    <Typography variant="caption">
                                      This week
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      fontWeight="bold"
                                    >
                                      {habit.weeklyCompletion}%
                                    </Typography>
                                  </Box>
                                  <LinearProgress
                                    variant="determinate"
                                    value={habit.weeklyCompletion}
                                    color={
                                      habit.weeklyCompletion > 80
                                        ? "success"
                                        : habit.weeklyCompletion > 50
                                        ? "warning"
                                        : "error"
                                    }
                                    sx={{ height: 4, borderRadius: 2 }}
                                  />
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>
            </Box>
          </>
        )}
      </Container>

      {/* AI Plan Dialog */}
      <Dialog
        open={aiPlanDialog}
        onClose={() => setAiPlanDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
          <AutoAwesome sx={{ mr: 1, color: "primary.main" }} />
          Your Personalized AI Plan
        </DialogTitle>
        <DialogContent>
          {isLoadingPlan ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body1" gutterBottom>
                🤖 AI is analyzing your data...
              </Typography>
              <LinearProgress sx={{ mt: 2 }} />
            </Box>
          ) : !aiPlan ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No plan available. Please try generating again.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={3}>
              {/* Priority Task */}
              {aiPlan.priorityTask && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    🎯 Priority Task
                  </Typography>
                  <Card
                    sx={{
                      bgcolor: "error.light",
                      border: "1px solid",
                      borderColor: "error.main",
                    }}
                  >
                    <CardContent sx={{ py: 2 }}>
                      <Typography variant="body1" fontWeight="600">
                        {aiPlan.priorityTask}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              )}

              {/* Focus Time Insight */}
              {aiPlan.focusTime && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    ⏰ Optimal Timing
                  </Typography>
                  <Card
                    sx={{
                      bgcolor: "info.light",
                      border: "1px solid",
                      borderColor: "info.main",
                    }}
                  >
                    <CardContent sx={{ py: 2 }}>
                      <Typography variant="body2">
                        {aiPlan.focusTime}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              )}

              {/* Habit Suggestion */}
              {aiPlan.habitSuggestion && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    🔥 Habit Focus
                  </Typography>
                  <Card
                    sx={{
                      bgcolor: "warning.light",
                      border: "1px solid",
                      borderColor: "warning.main",
                    }}
                  >
                    <CardContent sx={{ py: 2 }}>
                      <Typography variant="body2">
                        {aiPlan.habitSuggestion}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              )}

              {/* Suggested Schedule */}
              {aiPlan.schedule && aiPlan.schedule.length > 0 && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    📅 Suggested Next Steps
                  </Typography>
                  <List dense>
                    {aiPlan.schedule.map((item, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Typography variant="body2" fontWeight="600">
                                {item.time}: {item.activity}
                              </Typography>
                              <Chip
                                label={item.duration}
                                size="small"
                                color={getPriorityColor(item.priority)}
                                variant="outlined"
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* AI Insight */}
              {aiPlan.insight && (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "success.light",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "success.main",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Lightbulb sx={{ fontSize: 16 }} />
                    {aiPlan.insight}
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAiPlanDialog(false)}>Maybe Later</Button>
          <Button
            variant="contained"
            onClick={() => {
              setAiPlanDialog(false);
              // In a real app, this would save the plan or navigate to tasks page
              console.log("AI Plan accepted:", aiPlan);
            }}
            startIcon={<CheckCircle />}
          >
            Let's Do This!
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
}

export default Dashboard;
