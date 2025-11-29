import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Paper,
  Chip,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import {
  Add,
  Assignment,
  AccessTime,
  Psychology,
  CalendarToday,
  Edit,
  Delete,
  CheckCircle,
  Schedule,
  AutoAwesome,
  Lightbulb,
  TrendingUp,
  EventNote,
  Sync,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import AppLayout from "../components/AppLayout";
import { tasksAPI, aiAPI } from "../services/api";

const Tasks = ({ user, onLogout }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingSchedule, setGeneratingSchedule] = useState(false);
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [aiSchedulePlan, setAiSchedulePlan] = useState(null);
  const [appliedSchedule, setAppliedSchedule] = useState(() => {
    // Load saved schedule from localStorage on mount
    const saved = localStorage.getItem("appliedSchedule");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Check if schedule is from today
        const savedDate = new Date(parsed.savedAt).toDateString();
        const today = new Date().toDateString();
        if (savedDate === today) {
          return parsed.schedule;
        }
      } catch (error) {
        console.error("Error loading saved schedule:", error);
      }
    }
    return null;
  });

  // Fetch tasks from API on mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await tasksAPI.getTasks();
        const tasksData = response.data.map((task) => ({
          id: task.id || task._id,
          title: task.title,
          category: task.category || "General",
          dueDate: task.due_date ? new Date(task.due_date) : null,
          estimatedTime: task.estimated_minutes
            ? `${task.estimated_minutes} minutes`
            : "30 minutes",
          status: task.is_completed ? "completed" : task.status || "pending",
          priority: task.priority || "medium",
          effortType: task.effort_type || "Quick",
          description: task.description || "",
        }));
        setTasks(tasksData);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const [todaysSchedule] = useState([
    {
      time: "9:00 AM",
      task: "DBMS Assignment - ER Diagram",
      duration: "2 hours",
      type: "Deep Work",
      aiAssigned: true,
    },
    {
      time: "11:00 AM",
      task: "Break & Movement",
      duration: "15 minutes",
      type: "Break",
      aiAssigned: true,
    },
    {
      time: "11:15 AM",
      task: "Email Professor About Extension",
      duration: "15 minutes",
      type: "Admin",
      aiAssigned: true,
    },
    {
      time: "11:30 AM",
      task: "Morning Reading (Habit)",
      duration: "30 minutes",
      type: "Habit",
      aiAssigned: true,
    },
    {
      time: "12:00 PM",
      task: "Code Review - Team Project",
      duration: "30 minutes",
      type: "Quick",
      aiAssigned: true,
    },
    {
      time: "2:00 PM",
      task: "React Components Testing",
      duration: "1.5 hours",
      type: "Deep Work",
      aiAssigned: true,
    },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    dueDate: "",
    estimatedTime: "",
    priority: "medium",
    effortType: "Quick",
    description: "",
  });

  const categories = [
    "Academic",
    "Development",
    "Research",
    "Admin",
    "Personal",
  ];
  const priorities = ["low", "medium", "high"];
  const effortTypes = ["Quick", "Deep Work", "Admin"];

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "overdue":
        return "error";
      default:
        return "default";
    }
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

  const getEffortColor = (effortType) => {
    switch (effortType) {
      case "Deep Work":
        return "primary";
      case "Quick":
        return "success";
      case "Admin":
        return "info";
      default:
        return "default";
    }
  };

  const formatDueDate = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else if (date < today) {
      const daysOverdue = Math.ceil((today - date) / (1000 * 60 * 60 * 24));
      return `${daysOverdue} day${daysOverdue > 1 ? "s" : ""} overdue`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setFormData({
      title: "",
      category: "",
      dueDate: "",
      estimatedTime: "",
      priority: "medium",
      effortType: "Quick",
      description: "",
    });
    setOpenDialog(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      category: task.category,
      dueDate: task.dueDate.toISOString().split("T")[0],
      estimatedTime: task.estimatedTime,
      priority: task.priority,
      effortType: task.effortType,
      description: task.description,
    });
    setOpenDialog(true);
  };

  const parseEstimatedTime = (timeString) => {
    if (!timeString) return 30;

    // Handle pure numbers (assume minutes)
    const pureNumber = parseInt(timeString);
    if (!isNaN(pureNumber) && timeString === pureNumber.toString()) {
      return pureNumber;
    }

    let totalMinutes = 0;

    // Parse hours (e.g., "7 hours", "7h", "7 hour")
    const hoursMatch = timeString.match(/(\d+)\s*(hours?|h)/i);
    if (hoursMatch) {
      totalMinutes += parseInt(hoursMatch[1]) * 60;
    }

    // Parse minutes (e.g., "2 minutes", "2m", "2 minute", "2min")
    const minutesMatch = timeString.match(
      /(\d+)\s*(minutes?|mins?|m)(?!\s*hour)/i
    );
    if (minutesMatch) {
      totalMinutes += parseInt(minutesMatch[1]);
    }

    // If no matches, try to parse as just a number
    if (totalMinutes === 0) {
      const number = parseInt(timeString);
      totalMinutes = !isNaN(number) ? number : 30;
    }

    return totalMinutes;
  };

  const handleSaveTask = async () => {
    try {
      const estimatedMinutes = parseEstimatedTime(formData.estimatedTime);

      if (editingTask) {
        // Update existing task
        const updateData = {
          title: formData.title,
          description: formData.description,
          due_date: formData.dueDate
            ? new Date(formData.dueDate).toISOString()
            : null,
          priority: formData.priority,
          estimated_minutes: estimatedMinutes,
          category: formData.category,
          effort_type: formData.effortType,
        };
        console.log("Updating task with data:", updateData);

        await tasksAPI.updateTask(editingTask.id, updateData);

        setTasks((prev) =>
          prev.map((t) =>
            t.id === editingTask.id
              ? {
                  ...t,
                  ...formData,
                  dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
                  estimatedTime: `${estimatedMinutes} minutes`,
                }
              : t
          )
        );
      } else {
        // Create new task
        const createData = {
          title: formData.title,
          description: formData.description,
          due_date: formData.dueDate
            ? new Date(formData.dueDate).toISOString()
            : null,
          priority: formData.priority,
          estimated_minutes: estimatedMinutes,
          category: formData.category,
          effort_type: formData.effortType,
        };
        console.log("Creating task with data:", createData);

        const response = await tasksAPI.createTask(createData);

        const newTask = {
          id: response.data.id || response.data._id,
          ...formData,
          dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
          estimatedTime: `${estimatedMinutes} minutes`,
          status: "pending",
        };
        setTasks((prev) => [...prev, newTask]);
      }
      setOpenDialog(false);
    } catch (error) {
      console.error("Error saving task:", error);
      console.error("Error details:", error.response?.data);
      console.error("Error status:", error.response?.status);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await tasksAPI.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const toggleTaskCompletion = async (taskId) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      const newStatus = task.status === "completed" ? "pending" : "completed";

      await tasksAPI.updateTask(taskId, {
        is_completed: newStatus === "completed",
        status: newStatus,
        completed_at:
          newStatus === "completed" ? new Date().toISOString() : null,
      });

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (error) {
      console.error("Error toggling task completion:", error);
    }
  };

  const handleGenerateSchedule = async () => {
    try {
      setGeneratingSchedule(true);
      const response = await aiAPI.optimizeSchedule();
      // TODO: Handle schedule response and update todaysSchedule
      console.log("Generated schedule:", response.data);
    } catch (error) {
      console.error("Error generating schedule:", error);
    } finally {
      setGeneratingSchedule(false);
    }
  };

  const handleGenerateAISchedule = async () => {
    try {
      setGeneratingSchedule(true);
      setOpenScheduleDialog(true);

      // Prepare data for AI
      const tasksData = tasks.map((task) => {
        // Parse estimated time from "30 minutes" format
        const timeMatch = task.estimatedTime.match(/(\d+)/);
        const minutes = timeMatch ? parseInt(timeMatch[1]) : 30;

        return {
          title: task.title,
          priority: task.priority,
          estimated_minutes: minutes,
          category: task.category,
          effort_type: task.effortType,
        };
      });

      // Call AI daily plan API
      const response = await aiAPI.generateDailyPlan({
        tasks: tasksData,
        mood: "productive",
        habits: [],
      });

      setAiSchedulePlan(response.data);
    } catch (error) {
      console.error("Error generating AI schedule:", error);
      setAiSchedulePlan({
        error: true,
        message: "Failed to generate schedule. Please try again.",
      });
    } finally {
      setGeneratingSchedule(false);
    }
  };

  return (
    <AppLayout
      title="📋 Tasks"
      subtitle="Smart task management with AI-powered scheduling"
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
              minHeight: "400px",
            }}
          >
            <CircularProgress size={60} />
          </Box>
        ) : (
          <>
            {/* SECTION 1: HEADER - Full Width */}
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
                  📋 Tasks
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  AI-powered task management and intelligent scheduling
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Psychology />}
                  onClick={handleGenerateAISchedule}
                  disabled={generatingSchedule}
                  size="large"
                  sx={{
                    borderColor: "primary.main",
                    color: "primary.main",
                    "&:hover": {
                      borderColor: "primary.dark",
                      bgcolor: "primary.light",
                    },
                    borderRadius: 2,
                    px: 3,
                  }}
                >
                  {generatingSchedule ? "Generating..." : "AI Today's Schedule"}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddTask}
                  size="large"
                  sx={{
                    background:
                      "linear-gradient(45deg, #2196f3 30%, #42a5f5 90%)",
                    "&:hover": {
                      background:
                        "linear-gradient(45deg, #1976d2 30%, #2196f3 90%)",
                    },
                    borderRadius: 2,
                    px: 3,
                  }}
                >
                  Add Task
                </Button>
              </Box>
            </Box>

            {/* SECTION 1: Applied AI Schedule */}
            {appliedSchedule && (
              <Box sx={{ mb: 3 }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card
                    sx={{
                      background:
                        "linear-gradient(135deg, #e8f5e9 0%, #e3f2fd 50%, #fff3e0 100%)",
                      border: "1px solid rgba(129, 199, 132, 0.3)",
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 2,
                        }}
                      >
                        <Typography
                          variant="h5"
                          fontWeight="600"
                          sx={{ display: "flex", alignItems: "center" }}
                        >
                          <Psychology
                            sx={{ mr: 1, color: "primary.main", fontSize: 28 }}
                          />
                          Today's AI Schedule 🧠
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Sync />}
                          onClick={() => {
                            localStorage.removeItem("appliedSchedule");
                            setAppliedSchedule(null);
                          }}
                        >
                          Clear Schedule
                        </Button>
                      </Box>

                      {/* Summary */}
                      {appliedSchedule.summary && (
                        <Paper
                          sx={{
                            p: 2,
                            mb: 3,
                            bgcolor: "primary.light",
                            borderLeft: "4px solid",
                            borderColor: "primary.main",
                          }}
                        >
                          <Typography variant="overline" color="primary.dark">
                            Daily Summary
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 1 }}>
                            {appliedSchedule.summary}
                          </Typography>
                        </Paper>
                      )}

                      {/* Habit Suggestion */}
                      {appliedSchedule.habitSuggestion && (
                        <Paper
                          sx={{
                            p: 2,
                            mb: 3,
                            bgcolor: "warning.light",
                            borderLeft: "4px solid",
                            borderColor: "warning.main",
                          }}
                        >
                          <Typography variant="overline" color="warning.dark">
                            Habit Recommendation
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 1 }}>
                            {appliedSchedule.habitSuggestion}
                          </Typography>
                        </Paper>
                      )}

                      {/* Schedule Timeline */}
                      <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
                        📅 Today's Timeline
                      </Typography>
                      <List sx={{ maxHeight: 500, overflow: "auto" }}>
                        {appliedSchedule.schedule?.map((item, index) => (
                          <ListItem
                            key={index}
                            sx={{
                              mb: 1,
                              p: 0,
                              alignItems: "flex-start",
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 80, mt: 0 }}>
                              <Paper
                                sx={{
                                  width: 70,
                                  height: 50,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  bgcolor:
                                    item.priority === "high"
                                      ? "error.main"
                                      : item.priority === "medium"
                                      ? "warning.main"
                                      : "success.main",
                                  color: "white",
                                }}
                              >
                                <Typography variant="caption" fontWeight="600">
                                  {item.time}
                                </Typography>
                              </Paper>
                            </ListItemIcon>
                            <ListItemText sx={{ m: 0 }}>
                              <Paper
                                sx={{
                                  p: 2,
                                  bgcolor: "grey.50",
                                  border: "1px solid",
                                  borderColor: "divider",
                                }}
                              >
                                <Typography variant="body1" fontWeight="600">
                                  {item.activity}
                                </Typography>
                                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                                  <Chip
                                    label={item.duration}
                                    size="small"
                                    variant="outlined"
                                    icon={<AccessTime />}
                                  />
                                  <Chip
                                    label={item.priority}
                                    size="small"
                                    color={
                                      item.priority === "high"
                                        ? "error"
                                        : item.priority === "medium"
                                        ? "warning"
                                        : "success"
                                    }
                                    variant="outlined"
                                  />
                                </Box>
                              </Paper>
                            </ListItemText>
                          </ListItem>
                        ))}
                      </List>

                      {/* AI Insight */}
                      {appliedSchedule.insight && (
                        <Paper
                          sx={{
                            p: 3,
                            mt: 3,
                            bgcolor: "info.light",
                            borderLeft: "4px solid",
                            borderColor: "info.main",
                          }}
                        >
                          <Typography
                            variant="overline"
                            color="info.dark"
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Lightbulb fontSize="small" />
                            AI Insight
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {appliedSchedule.insight}
                          </Typography>
                        </Paper>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>
            )}

            {/* SECTION 2: Main Content */}
            <Box sx={{ mb: 3 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
                      📊 All Tasks Overview
                    </Typography>

                    {tasks.length === 0 ? (
                      <Box
                        sx={{
                          textAlign: "center",
                          py: 6,
                          color: "text.secondary",
                        }}
                      >
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          📝 No tasks yet
                        </Typography>
                        <Typography variant="caption">
                          Click "Add Task" to create your first task
                        </Typography>
                      </Box>
                    ) : (
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
                                  Task
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight="600"
                                >
                                  Category
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight="600"
                                >
                                  Due Date
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight="600"
                                >
                                  Time Est.
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight="600"
                                >
                                  Effort
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight="600"
                                >
                                  Status
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
                            {tasks.map((task) => (
                              <TableRow
                                key={task.id}
                                sx={{
                                  "&:nth-of-type(odd)": { bgcolor: "grey.25" },
                                  "&:hover": {
                                    bgcolor: "primary.light",
                                    "& *": { color: "primary.contrastText" },
                                  },
                                  opacity:
                                    task.status === "completed" ? 0.7 : 1,
                                }}
                              >
                                <TableCell>
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      fontWeight="600"
                                      sx={{
                                        textDecoration:
                                          task.status === "completed"
                                            ? "line-through"
                                            : "none",
                                      }}
                                    >
                                      {task.title}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {task.description}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={task.category}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    variant="caption"
                                    color={
                                      task.status === "overdue"
                                        ? "error.main"
                                        : "text.primary"
                                    }
                                    fontWeight={
                                      task.status === "overdue"
                                        ? "bold"
                                        : "normal"
                                    }
                                  >
                                    {formatDueDate(task.dueDate)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={task.estimatedTime}
                                    size="small"
                                    variant="outlined"
                                    icon={<AccessTime />}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={task.effortType}
                                    size="small"
                                    color={getEffortColor(task.effortType)}
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={task.status}
                                    size="small"
                                    color={getStatusColor(task.status)}
                                    variant={
                                      task.status === "completed"
                                        ? "filled"
                                        : "outlined"
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: "flex", gap: 0.5 }}>
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        toggleTaskCompletion(task.id)
                                      }
                                      color={
                                        task.status === "completed"
                                          ? "success"
                                          : "default"
                                      }
                                    >
                                      <CheckCircle fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleEditTask(task)}
                                    >
                                      <Edit fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteTask(task.id)}
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
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Box>

            {/* Add/Edit Task Dialog */}
            <Dialog
              open={openDialog}
              onClose={() => setOpenDialog(false)}
              maxWidth="md"
              fullWidth
            >
              <DialogTitle>
                {editingTask ? "Edit Task" : "Add New Task"}
              </DialogTitle>
              <DialogContent>
                <Box sx={{ pt: 2 }}>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Task Title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />

                    <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                      <Box sx={{ flex: 1, minWidth: 250 }}>
                        <FormControl fullWidth>
                          <InputLabel>Category</InputLabel>
                          <Select
                            value={formData.category}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                category: e.target.value,
                              })
                            }
                          >
                            {categories.map((cat) => (
                              <MenuItem key={cat} value={cat}>
                                {cat}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 250 }}>
                        <TextField
                          fullWidth
                          label="Due Date"
                          type="date"
                          value={formData.dueDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              dueDate: e.target.value,
                            })
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                      <Box sx={{ flex: "1 1 30%", minWidth: 200 }}>
                        <TextField
                          fullWidth
                          label="Estimated Time"
                          value={formData.estimatedTime}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              estimatedTime: e.target.value,
                            })
                          }
                          placeholder="e.g., 2 hours, 30 minutes"
                        />
                      </Box>

                      <Box sx={{ flex: "1 1 30%", minWidth: 200 }}>
                        <FormControl fullWidth>
                          <InputLabel>Priority</InputLabel>
                          <Select
                            value={formData.priority}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                priority: e.target.value,
                              })
                            }
                          >
                            {priorities.map((priority) => (
                              <MenuItem key={priority} value={priority}>
                                {priority.charAt(0).toUpperCase() +
                                  priority.slice(1)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>

                      <Box sx={{ flex: "1 1 30%", minWidth: 200 }}>
                        <FormControl fullWidth>
                          <InputLabel>Effort Type</InputLabel>
                          <Select
                            value={formData.effortType}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                effortType: e.target.value,
                              })
                            }
                          >
                            {effortTypes.map((type) => (
                              <MenuItem key={type} value={type}>
                                {type}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>

                    <TextField
                      fullWidth
                      label="Description"
                      multiline
                      rows={3}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </Stack>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                <Button
                  onClick={handleSaveTask}
                  variant="contained"
                  disabled={
                    !formData.title || !formData.category || !formData.dueDate
                  }
                >
                  {editingTask ? "Update" : "Create"} Task
                </Button>
              </DialogActions>
            </Dialog>

            {/* AI Schedule Dialog */}
            <Dialog
              open={openScheduleDialog}
              onClose={() => setOpenScheduleDialog(false)}
              maxWidth="md"
              fullWidth
            >
              <DialogTitle
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Psychology color="primary" />
                AI-Generated Today's Schedule
              </DialogTitle>
              <DialogContent>
                {generatingSchedule ? (
                  <Box sx={{ textAlign: "center", py: 6 }}>
                    <CircularProgress size={60} />
                    <Typography variant="body1" sx={{ mt: 3 }}>
                      Analyzing your tasks and generating optimal schedule...
                    </Typography>
                  </Box>
                ) : aiSchedulePlan?.error ? (
                  <Box sx={{ textAlign: "center", py: 6, color: "error.main" }}>
                    <Typography variant="body1">
                      {aiSchedulePlan.message}
                    </Typography>
                  </Box>
                ) : aiSchedulePlan ? (
                  <Box sx={{ pt: 2 }}>
                    {/* Priority Task */}
                    <Paper sx={{ p: 3, mb: 3, bgcolor: "primary.light" }}>
                      <Typography variant="overline" color="primary.dark">
                        Priority Task
                      </Typography>
                      <Typography variant="h6" fontWeight="600" sx={{ mt: 1 }}>
                        {aiSchedulePlan.priorityTask}
                      </Typography>
                    </Paper>

                    {/* Focus Time */}
                    <Paper sx={{ p: 3, mb: 3, bgcolor: "success.light" }}>
                      <Typography variant="overline" color="success.dark">
                        Optimal Focus Time
                      </Typography>
                      <Typography variant="h6" fontWeight="600" sx={{ mt: 1 }}>
                        {aiSchedulePlan.focusTime}
                      </Typography>
                    </Paper>

                    {/* Habit Suggestion */}
                    {aiSchedulePlan.habitSuggestion && (
                      <Paper sx={{ p: 3, mb: 3, bgcolor: "warning.light" }}>
                        <Typography variant="overline" color="warning.dark">
                          Habit Recommendation
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {aiSchedulePlan.habitSuggestion}
                        </Typography>
                      </Paper>
                    )}

                    {/* Schedule Timeline */}
                    <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
                      📅 Today's Timeline
                    </Typography>
                    <List>
                      {aiSchedulePlan.schedule?.map((item, index) => (
                        <ListItem key={index} sx={{ mb: 1 }}>
                          <ListItemIcon>
                            <Paper
                              sx={{
                                width: 50,
                                height: 50,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor:
                                  item.priority === "high"
                                    ? "error.main"
                                    : item.priority === "medium"
                                    ? "warning.main"
                                    : "success.main",
                                color: "white",
                              }}
                            >
                              <Typography variant="caption" fontWeight="600">
                                {item.time}
                              </Typography>
                            </Paper>
                          </ListItemIcon>
                          <ListItemText>
                            <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                              <Typography variant="body1" fontWeight="600">
                                {item.activity}
                              </Typography>
                              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                                <Chip
                                  label={item.duration}
                                  size="small"
                                  variant="outlined"
                                  icon={<AccessTime />}
                                />
                                <Chip
                                  label={item.priority}
                                  size="small"
                                  color={
                                    item.priority === "high"
                                      ? "error"
                                      : item.priority === "medium"
                                      ? "warning"
                                      : "success"
                                  }
                                  variant="outlined"
                                />
                              </Box>
                            </Paper>
                          </ListItemText>
                        </ListItem>
                      ))}
                    </List>

                    {/* AI Insight */}
                    {aiSchedulePlan.insight && (
                      <Paper
                        sx={{
                          p: 3,
                          mt: 3,
                          bgcolor: "info.light",
                          borderLeft: "4px solid",
                          borderColor: "info.main",
                        }}
                      >
                        <Typography
                          variant="overline"
                          color="info.dark"
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Lightbulb fontSize="small" />
                          AI Insight
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {aiSchedulePlan.insight}
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                ) : null}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenScheduleDialog(false)}>
                  Close
                </Button>
                {aiSchedulePlan && !aiSchedulePlan.error && (
                  <Button
                    variant="contained"
                    startIcon={<AutoAwesome />}
                    onClick={() => {
                      // Save to localStorage with timestamp
                      const scheduleData = {
                        schedule: aiSchedulePlan,
                        savedAt: new Date().toISOString(),
                      };
                      localStorage.setItem(
                        "appliedSchedule",
                        JSON.stringify(scheduleData)
                      );
                      setAppliedSchedule(aiSchedulePlan);
                      setOpenScheduleDialog(false);
                    }}
                  >
                    Apply my schedule
                  </Button>
                )}
              </DialogActions>
            </Dialog>
          </>
        )}
      </Container>
    </AppLayout>
  );
};

export default Tasks;
