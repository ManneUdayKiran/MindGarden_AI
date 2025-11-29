import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  LinearProgress,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import {
  Add,
  LocalFlorist as LocalFloristIcon,
  CheckCircle,
  RadioButtonUnchecked,
  Edit,
  Delete,
  LocalFireDepartment,
  Psychology,
  TrendingUp,
  Assessment,
  BarChart,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import AppLayout from "../components/AppLayout";
import { habitsAPI } from "../services/api";

const Habits = ({ user, onLogout }) => {
  // Real data states
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todaysHabits, setTodaysHabits] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [consistencySuggestions, setConsistencySuggestions] = useState({
    suggestions: [],
    consistency_rate: 0,
    best_time: "morning",
    best_days: "Not enough data",
  });

  // Fetch habits from API
  useEffect(() => {
    const fetchHabits = async () => {
      try {
        setLoading(true);
        const response = await habitsAPI.getHabits();

        console.log("Raw API response:", response.data);
        console.log("First habit:", response.data[0]);

        const habitsData = response.data.map((habit) => {
          console.log("Mapping habit:", habit);
          return {
            id: habit.id || habit._id,
            name: habit.name,
            description: habit.description || "",
            frequency: habit.frequency || [],
            frequencyText:
              habit.frequency?.length === 7
                ? "Daily"
                : `${habit.frequency?.length || 0}× week`,
            targetPerWeek: habit.target_days || habit.frequency?.length || 1,
            streak: habit.current_streak || 0,
            completedToday: habit.completed_today || false,
            weeklyProgress:
              Math.round((habit.completions_this_week / 7) * 100) || 0,
            completionTrend: "stable",
            createdAt: new Date(habit.created_at),
          };
        });

        console.log("Mapped habits:", habitsData);

        setHabits(habitsData);

        // Filter today's habits
        const today = new Date().getDay();
        const dayMap = {
          0: "sun",
          1: "mon",
          2: "tue",
          3: "wed",
          4: "thu",
          5: "fri",
          6: "sat",
        };
        const todayFiltered = habitsData.filter((habit) =>
          habit.frequency.includes(dayMap[today])
        );
        setTodaysHabits(todayFiltered);

        // Fetch weekly stats
        const statsResponse = await habitsAPI.getWeeklyStats();
        setWeeklyData(statsResponse.data);

        // Fetch AI consistency suggestions
        const suggestionsResponse = await habitsAPI.getConsistencySuggestions();
        setConsistencySuggestions(suggestionsResponse.data);
      } catch (error) {
        console.error("Error fetching habits:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHabits();
  }, []);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    frequency: [],
    targetPerWeek: 1,
  });

  const daysOfWeek = [
    { key: "mon", label: "Monday" },
    { key: "tue", label: "Tuesday" },
    { key: "wed", label: "Wednesday" },
    { key: "thu", label: "Thursday" },
    { key: "fri", label: "Friday" },
    { key: "sat", label: "Saturday" },
    { key: "sun", label: "Sunday" },
  ];

  const getStreakColor = (streak) => {
    if (streak >= 21) return "error";
    if (streak >= 7) return "warning";
    if (streak >= 3) return "success";
    return "default";
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return "success";
    if (progress >= 60) return "warning";
    return "error";
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "up":
        return <TrendingUp sx={{ color: "success.main", fontSize: 16 }} />;
      case "down":
        return (
          <TrendingUp
            sx={{
              color: "error.main",
              fontSize: 16,
              transform: "rotate(180deg)",
            }}
          />
        );
      default:
        return (
          <TrendingUp
            sx={{
              color: "text.secondary",
              fontSize: 16,
              transform: "rotate(90deg)",
            }}
          />
        );
    }
  };

  const handleAddHabit = () => {
    setEditingHabit(null);
    setFormData({
      name: "",
      description: "",
      frequency: [],
      targetPerWeek: 1,
    });
    setOpenDialog(true);
  };

  const handleEditHabit = (habit) => {
    setEditingHabit(habit);
    setFormData({
      name: habit.name,
      description: habit.description,
      frequency: habit.frequency,
      targetPerWeek: habit.targetPerWeek,
    });
    setOpenDialog(true);
  };

  const handleSaveHabit = async () => {
    try {
      if (editingHabit && editingHabit.id) {
        // Update existing habit
        await habitsAPI.updateHabit(editingHabit.id, {
          name: formData.name,
          description: formData.description,
          frequency: formData.frequency,
          target_per_week: formData.targetPerWeek,
        });

        setHabits((prev) =>
          prev.map((h) =>
            h.id === editingHabit.id
              ? {
                  ...h,
                  name: formData.name,
                  description: formData.description,
                  frequency: formData.frequency,
                  frequencyText:
                    formData.frequency.length === 7
                      ? "Daily"
                      : `${formData.frequency.length}× week`,
                  targetPerWeek: formData.targetPerWeek,
                }
              : h
          )
        );
      } else {
        // Create new habit
        const response = await habitsAPI.createHabit({
          name: formData.name,
          description: formData.description,
          frequency: formData.frequency,
          target_per_week: formData.targetPerWeek,
        });

        const newHabit = {
          id: response.data.id,
          name: formData.name,
          description: formData.description,
          frequency: formData.frequency,
          frequencyText:
            formData.frequency.length === 7
              ? "Daily"
              : `${formData.frequency.length}× week`,
          targetPerWeek: formData.targetPerWeek,
          streak: 0,
          completedToday: false,
          weeklyProgress: 0,
          completionTrend: "stable",
          createdAt: new Date(),
        };
        setHabits((prev) => [...prev, newHabit]);
      }
      setOpenDialog(false);
      setEditingHabit(null);
      setFormData({
        name: "",
        description: "",
        frequency: [],
        targetPerWeek: 1,
      });
    } catch (error) {
      console.error("Error saving habit:", error);
    }
  };

  const handleDeleteHabit = async (habitId) => {
    console.log("handleDeleteHabit called with:", habitId);
    if (!habitId) {
      console.error("Error: habitId is undefined");
      return;
    }
    try {
      console.log("Attempting to delete habit:", habitId);
      await habitsAPI.deleteHabit(habitId);
      console.log("Successfully deleted habit:", habitId);
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
      setTodaysHabits((prev) => prev.filter((h) => h.id !== habitId));
    } catch (error) {
      console.error("Error deleting habit:", error);
      console.error("Error response:", error.response?.data);
    }
  };

  const toggleHabitCompletion = async (habitId) => {
    if (!habitId) {
      console.error("Error: habitId is undefined");
      return;
    }
    try {
      const today = new Date().toISOString().split("T")[0];
      const habit = habits.find((h) => h.id === habitId);

      if (!habit) {
        console.error("Error: habit not found");
        return;
      }

      const newCompletedState = !habit.completedToday;

      // Call API to log the habit completion
      const response = await habitsAPI.logHabit(habitId, {
        date: today,
        completed: newCompletedState,
      });

      // Fetch updated habit data from server to get accurate streak
      const habitsResponse = await habitsAPI.getHabits();
      const updatedHabit = habitsResponse.data.find(
        (h) => (h.id || h._id) === habitId
      );

      if (updatedHabit) {
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  completedToday: updatedHabit.completed_today,
                  streak: updatedHabit.current_streak || 0,
                  weeklyProgress:
                    Math.round(
                      (updatedHabit.completions_this_week / 7) * 100
                    ) || 0,
                }
              : h
          )
        );

        setTodaysHabits((prev) =>
          prev.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  completedToday: updatedHabit.completed_today,
                  streak: updatedHabit.current_streak || 0,
                  weeklyProgress:
                    Math.round(
                      (updatedHabit.completions_this_week / 7) * 100
                    ) || 0,
                }
              : h
          )
        );
      }
    } catch (error) {
      console.error("Error toggling habit:", error);
    }
  };

  return (
    <AppLayout
      title="🌿 Your Habits"
      subtitle="Build consistent behaviors that help your garden grow"
      user={user}
      onLogout={onLogout}
    >
      <Container maxWidth="xl" sx={{ py: 4 }}>
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
                Loading your habits...
              </Typography>
            </Stack>
          </Box>
        ) : (
          <>
            {/* Header Row */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  🌿 Your Habits
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Track and maintain consistent behaviors for personal growth
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddHabit}
                size="large"
                sx={{
                  background:
                    "linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)",
                  "&:hover": {
                    background:
                      "linear-gradient(45deg, #388e3c 30%, #4caf50 90%)",
                  },
                  borderRadius: 2,
                  px: 3,
                }}
              >
                Add Habit
              </Button>
            </Box>

            {/* Main Content */}
            <Box sx={{ mb: 3 }}>
              {/* Habits Table - Full Width */}
              <Box sx={{ mb: 3 }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card sx={{ height: "100%" }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
                        📊 Habit Overview
                      </Typography>

                      <TableContainer
                        component={Paper}
                        sx={{
                          boxShadow: "none",
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Table>
                          <TableHead>
                            <TableRow sx={{ bgcolor: "grey.50" }}>
                              <TableCell>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight="600"
                                >
                                  Habit
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight="600"
                                >
                                  Frequency
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight="600"
                                >
                                  Streak
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight="600"
                                >
                                  Progress
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight="600"
                                >
                                  Trend
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight="600"
                                >
                                  Actions
                                </Typography>
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {habits.map((habit, index) => (
                              <TableRow
                                key={habit.id}
                                sx={{
                                  "&:nth-of-type(odd)": { bgcolor: "grey.25" },
                                  "&:hover": {
                                    bgcolor: "primary.light",
                                    "& *": { color: "primary.contrastText" },
                                  },
                                }}
                              >
                                <TableCell>
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      fontWeight="600"
                                    >
                                      {habit.name}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {habit.description}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={habit.frequencyText}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell>
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
                                    <Chip
                                      label={`${habit.streak}d`}
                                      size="small"
                                      color={getStreakColor(habit.streak)}
                                    />
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ minWidth: 100 }}>
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
                                        {habit.weeklyProgress}%
                                      </Typography>
                                    </Box>
                                    <LinearProgress
                                      variant="determinate"
                                      value={habit.weeklyProgress}
                                      color={getProgressColor(
                                        habit.weeklyProgress
                                      )}
                                      sx={{ height: 6, borderRadius: 3 }}
                                    />
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  {getTrendIcon(habit.completionTrend)}
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: "flex", gap: 0.5 }}>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleEditHabit(habit)}
                                    >
                                      <Edit fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        handleDeleteHabit(habit.id)
                                      }
                                      color="error"
                                    >
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>

              {/* Action Cards */}
              <Box sx={{ display: "flex", gap: 3, mb: 3, flexWrap: "wrap" }}>
                {/* Today's Checklist */}
                <Box sx={{ flex: "1 1 45%", minWidth: 300 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <Card>
                      <CardContent>
                        <Typography
                          variant="h6"
                          fontWeight="600"
                          sx={{ mb: 2, display: "flex", alignItems: "center" }}
                        >
                          ✅ Today's Checklist
                        </Typography>

                        <List dense>
                          {todaysHabits.map((habit) => (
                            <ListItem
                              key={habit.id}
                              secondaryAction={
                                <Button
                                  variant={
                                    habit.completedToday
                                      ? "contained"
                                      : "outlined"
                                  }
                                  color={
                                    habit.completedToday ? "success" : "primary"
                                  }
                                  size="small"
                                  onClick={() =>
                                    toggleHabitCompletion(habit.id)
                                  }
                                  startIcon={
                                    habit.completedToday ? (
                                      <CheckCircle />
                                    ) : (
                                      <RadioButtonUnchecked />
                                    )
                                  }
                                >
                                  {habit.completedToday ? "Done" : "Mark Done"}
                                </Button>
                              }
                              sx={{
                                opacity: habit.completedToday ? 0.7 : 1,
                                textDecoration: habit.completedToday
                                  ? "line-through"
                                  : "none",
                              }}
                            >
                              <ListItemText
                                primary={habit.name}
                                secondary={habit.description}
                              />
                            </ListItem>
                          ))}
                        </List>

                        {todaysHabits.length === 0 && (
                          <Box sx={{ textAlign: "center", py: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                              No habits scheduled for today. Great job staying
                              on track! 🎉
                            </Typography>
                          </Box>
                        )}

                        <Box
                          sx={{
                            mt: 2,
                            p: 2,
                            bgcolor: "success.light",
                            borderRadius: 2,
                          }}
                        >
                          <Typography variant="body2" color="success.dark">
                            💡 <strong>Progress:</strong>{" "}
                            {
                              todaysHabits.filter((h) => h.completedToday)
                                .length
                            }{" "}
                            of {todaysHabits.length} completed today
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Box>

                {/* AI Suggestions */}
                <Box sx={{ flex: "1 1 45%", minWidth: 300 }}>
                  <Card
                    sx={{
                      background:
                        "linear-gradient(135deg, #f3e5f5 0%, #e1f5fe 100%)",
                      border: "1px solid rgba(156, 39, 176, 0.2)",
                    }}
                  >
                    <CardContent>
                      <Typography
                        variant="h6"
                        fontWeight="600"
                        sx={{ mb: 2, display: "flex", alignItems: "center" }}
                      >
                        <Psychology sx={{ mr: 1, color: "primary.main" }} />
                        AI Consistency Suggestions
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2, lineHeight: 1.6 }}
                      >
                        Based on your habit patterns over the last 7 days:
                      </Typography>

                      <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                        {consistencySuggestions.suggestions.length > 0 ? (
                          consistencySuggestions.suggestions.map(
                            (suggestion, index) => (
                              <Typography
                                key={index}
                                component="li"
                                variant="body2"
                                sx={{ mb: 1, lineHeight: 1.6 }}
                              >
                                {suggestion}
                              </Typography>
                            )
                          )
                        ) : (
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            Loading AI insights...
                          </Typography>
                        )}
                      </Box>

                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          bgcolor: "primary.light",
                          borderRadius: 2,
                        }}
                      >
                        <Typography variant="caption" color="primary.dark">
                          💭 AI-powered insights using your last 7 days •{" "}
                          <strong>
                            {consistencySuggestions.consistency_rate}%
                            consistency rate
                          </strong>
                          {consistencySuggestions.best_time !==
                            "Not enough data" && (
                            <>
                              {" "}
                              • Best time: {consistencySuggestions.best_time}
                            </>
                          )}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            </Box>

            {/* Bottom Section - Full Width Analytics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card>
                <CardContent>
                  <Typography
                    variant="h6"
                    fontWeight="600"
                    sx={{ mb: 3, display: "flex", alignItems: "center" }}
                  >
                    <BarChart sx={{ mr: 1, color: "primary.main" }} />
                    Weekly Habit Completion Chart
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      justifyContent: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    {weeklyData.map((day, index) => (
                      <Box
                        key={day.day}
                        sx={{ flex: "0 0 auto", minWidth: 60 }}
                      >
                        <Box sx={{ textAlign: "center" }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mb: 1, display: "block" }}
                          >
                            {day.day}
                          </Typography>
                          <Box
                            sx={{
                              height: 120,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "flex-end",
                              alignItems: "center",
                              mb: 1,
                            }}
                          >
                            <motion.div
                              initial={{ height: 0 }}
                              whileInView={{
                                height: `${(day.completed / day.total) * 100}%`,
                              }}
                              viewport={{ once: true, amount: 0.3 }}
                              transition={{
                                duration: 0.8,
                                delay: index * 0.15,
                                ease: "easeOut",
                              }}
                              style={{
                                width: "100%",
                                display: "flex",
                                justifyContent: "center",
                                position: "relative",
                              }}
                            >
                              <Box
                                sx={{
                                  width: 40,
                                  height: "100%",
                                  bgcolor:
                                    day.completed === day.total
                                      ? "success.main"
                                      : day.completed / day.total > 0.7
                                      ? "warning.main"
                                      : "error.main",
                                  borderRadius: "4px 4px 0 0",
                                  minHeight: 8,
                                  position: "relative",
                                  overflow: "hidden",
                                  "&::before": {
                                    content: '""',
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: "30px",
                                    background:
                                      "linear-gradient(to top, rgba(255,255,255,0.4), transparent)",
                                    animation:
                                      "energyFlow 1.5s ease-in-out infinite",
                                  },
                                  "@keyframes energyFlow": {
                                    "0%": {
                                      transform: "translateY(0)",
                                      opacity: 0,
                                    },
                                    "50%": {
                                      opacity: 1,
                                    },
                                    "100%": {
                                      transform: "translateY(-120px)",
                                      opacity: 0,
                                    },
                                  },
                                }}
                              />
                            </motion.div>
                          </Box>
                          <Typography variant="body2" fontWeight="bold">
                            {day.completed}/{day.total}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {Math.round((day.completed / day.total) * 100)}%
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  <Box
                    sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 2 }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      <strong>Weekly Average:</strong> 81% completion rate •
                      <strong> Best Day:</strong> Wednesday (100%) •
                      <strong> Focus Day:</strong> Thursday needs attention
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>

            {/* Add/Edit Habit Dialog */}
            <Dialog
              open={openDialog}
              onClose={() => setOpenDialog(false)}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle>
                {editingHabit ? "Edit Habit" : "Add New Habit"}
              </DialogTitle>
              <DialogContent>
                <Box sx={{ pt: 2 }}>
                  <TextField
                    fullWidth
                    label="Habit Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    sx={{ mb: 3 }}
                  />

                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={2}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    sx={{ mb: 3 }}
                  />

                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Target per week</InputLabel>
                    <Select
                      value={formData.targetPerWeek}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          targetPerWeek: e.target.value,
                        })
                      }
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                        <MenuItem key={num} value={num}>
                          {num} times
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Frequency (days of the week)
                  </Typography>
                  <FormGroup>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {daysOfWeek.map((day) => (
                        <Box key={day.key} sx={{ flex: "0 0 45%" }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={formData.frequency.includes(day.key)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      frequency: [
                                        ...formData.frequency,
                                        day.key,
                                      ],
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      frequency: formData.frequency.filter(
                                        (d) => d !== day.key
                                      ),
                                    });
                                  }
                                }}
                              />
                            }
                            label={day.label}
                          />
                        </Box>
                      ))}
                    </Box>
                  </FormGroup>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                <Button
                  onClick={handleSaveHabit}
                  variant="contained"
                  disabled={!formData.name || formData.frequency.length === 0}
                >
                  {editingHabit ? "Update" : "Create"} Habit
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </Container>
    </AppLayout>
  );
};

export default Habits;
