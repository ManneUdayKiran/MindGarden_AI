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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Slider,
  ButtonGroup,
  LinearProgress,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Mood as MoodIcon,
  Add,
  Psychology,
  TrendingUp,
  TrendingDown,
  Remove,
  Assessment,
  Timeline,
  Lightbulb,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import AppLayout from "../components/AppLayout";
import { moodAPI } from "../services/api";

const Mood = ({ user, onLogout }) => {
  const [moodEntries, setMoodEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch mood data from API
  useEffect(() => {
    fetchMoodData();
  }, []);

  const fetchMoodData = async () => {
    try {
      setLoading(true);
      const [timelineResponse, insightsResponse] = await Promise.all([
        moodAPI.getMoodTimeline(30), // Get last 30 days
        moodAPI.getMoodInsights().catch(() => null), // Optional insights
      ]);

      const moodData = timelineResponse.data
        .filter((entry) => entry.has_log) // Only include days with actual mood logs
        .map((entry) => ({
          id: entry.id || entry.date,
          date: new Date(entry.date),
          day: new Date(entry.date).toLocaleDateString("en-US", {
            weekday: "short",
          }),
          mood: parseInt(entry.mood) || 3,
          energy: entry.energy || 3,
          emoji: getMoodEmoji(parseInt(entry.mood) || 3),
          note: entry.notes || "",
          time: new Date(entry.date).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
        }));

      setMoodEntries(moodData);
      if (insightsResponse) {
        setInsights(insightsResponse.data);
      }
    } catch (error) {
      console.error("Error fetching mood data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMoodEmoji = (score) => {
    if (score <= 1) return "😞";
    if (score <= 2) return "😕";
    if (score <= 3) return "😐";
    if (score <= 4) return "🙂";
    return "😄";
  };

  const [openDialog, setOpenDialog] = useState(false);
  const [newMoodData, setNewMoodData] = useState({
    mood: 3,
    energy: 3,
    emoji: "😐",
    note: "",
  });

  const emojiOptions = [
    { value: 1, emoji: "😞", label: "Bad" },
    { value: 2, emoji: "😕", label: "Low" },
    { value: 3, emoji: "😐", label: "Okay" },
    { value: 4, emoji: "🙂", label: "Good" },
    { value: 5, emoji: "😄", label: "Great" },
  ];

  const todaysMood =
    moodEntries.length > 0 ? moodEntries[moodEntries.length - 1] : null;
  const averageMood =
    moodEntries.length > 0
      ? (
          moodEntries.reduce((sum, entry) => sum + entry.mood, 0) /
          moodEntries.length
        ).toFixed(1)
      : "0.0";
  const moodVariance =
    moodEntries.length > 0
      ? Math.max(...moodEntries.map((e) => e.mood)) -
        Math.min(...moodEntries.map((e) => e.mood))
      : 0;

  const getMoodStability = (variance) => {
    if (variance <= 1) return { label: "Stable", color: "success" };
    if (variance <= 2) return { label: "Balanced", color: "warning" };
    return { label: "Volatile", color: "error" };
  };

  const stability = getMoodStability(moodVariance);

  const handleLogMood = async () => {
    try {
      const moodLog = {
        mood: newMoodData.mood.toString(),
        energy: newMoodData.energy,
        notes: newMoodData.note,
      };

      await moodAPI.logMood(moodLog);

      // Refresh mood data
      await fetchMoodData();

      setOpenDialog(false);
      setNewMoodData({ mood: 3, energy: 3, emoji: "😐", note: "" });

      // Show success notification
      setSnackbar({
        open: true,
        message: "Mood logged successfully! 🎉",
        severity: "success",
      });
    } catch (error) {
      console.error("Error logging mood:", error);
      setSnackbar({
        open: true,
        message: "Failed to log mood. Please try again.",
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const chartData = moodEntries.map((entry) => ({
    day: entry.day,
    mood: entry.mood,
    energy: entry.energy,
    emoji: entry.emoji,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ p: 2, border: "1px solid", borderColor: "primary.main" }}>
          <Typography variant="body2" fontWeight="600">
            {label} - {data.emoji}
          </Typography>
          <Typography variant="caption" color="primary.main">
            Mood: {data.mood}/5 | Energy: {data.energy}/5
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  return (
    <AppLayout
      title="🎭 Mood & Reflection"
      subtitle="Track your mood and get AI insights"
      user={user}
      onLogout={onLogout}
    >
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* 1. HEADER - Full Width */}
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
              🎭 Mood & Reflection
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track your emotional patterns and get AI-powered insights
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
            size="large"
            sx={{
              background: "linear-gradient(45deg, #ff6b6b 30%, #ff8787 90%)",
              "&:hover": {
                background: "linear-gradient(45deg, #ff5252 30%, #ff6b6b 90%)",
              },
              borderRadius: 2,
              px: 3,
            }}
          >
            Log Mood
          </Button>
        </Box>

        {/* 2. Main Content - Mood Chart */}
        <Box sx={{ mb: 3 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>
                    📈 Mood Trend (Last 30 Days)
                  </Typography>
                </motion.div>

                {loading ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: 300,
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : moodEntries.length === 0 ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      height: 300,
                      gap: 2,
                    }}
                  >
                    <MoodIcon
                      sx={{
                        fontSize: 60,
                        color: "text.secondary",
                        opacity: 0.3,
                      }}
                    />
                    <Typography variant="h6" color="text.secondary">
                      No mood data yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Start tracking your mood to see trends and insights
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => setOpenDialog(true)}
                    >
                      Log Your First Mood
                    </Button>
                  </Box>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  >
                    <Box
                      sx={{
                        height: 300,
                        width: "100%",
                        position: "relative",
                        overflow: "hidden",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background:
                            "linear-gradient(180deg, transparent 0%, rgba(255, 107, 107, 0.1) 50%, transparent 100%)",
                          animation: "energyFlow 3s ease-in-out infinite",
                          pointerEvents: "none",
                          zIndex: 1,
                        },
                        "@keyframes energyFlow": {
                          "0%": {
                            transform: "translateY(100%)",
                            opacity: 0,
                          },
                          "50%": {
                            opacity: 0.6,
                          },
                          "100%": {
                            transform: "translateY(-100%)",
                            opacity: 0,
                          },
                        },
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={chartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f0f0f0"
                          />
                          <XAxis
                            dataKey="day"
                            tick={{ fontSize: 12 }}
                            axisLine={{ stroke: "#ddd" }}
                          />
                          <YAxis
                            domain={[1, 5]}
                            tick={{ fontSize: 12 }}
                            axisLine={{ stroke: "#ddd" }}
                            tickFormatter={(value) => {
                              const labels = {
                                1: "😞",
                                2: "😕",
                                3: "😐",
                                4: "🙂",
                                5: "😄",
                              };
                              return labels[value] || value;
                            }}
                          />
                          <ReferenceLine
                            y={3}
                            stroke="#999"
                            strokeDasharray="2 2"
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="mood"
                            stroke="url(#moodGradient)"
                            strokeWidth={3}
                            dot={{ fill: "#ff6b6b", strokeWidth: 2, r: 6 }}
                            activeDot={{
                              r: 8,
                              stroke: "#ff6b6b",
                              strokeWidth: 2,
                              fill: "#fff",
                            }}
                          />
                          <defs>
                            <linearGradient
                              id="moodGradient"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="0%"
                            >
                              <stop offset="0%" stopColor="#ff6b6b">
                                <animate
                                  attributeName="stop-color"
                                  values="#ff6b6b; #ff8787; #ffa07a; #ff6b6b"
                                  dur="3s"
                                  repeatCount="indefinite"
                                />
                              </stop>
                              <stop offset="50%" stopColor="#ff8787">
                                <animate
                                  attributeName="stop-color"
                                  values="#ff8787; #ffa07a; #ff6b6b; #ff8787"
                                  dur="3s"
                                  repeatCount="indefinite"
                                />
                              </stop>
                              <stop offset="100%" stopColor="#ffa07a">
                                <animate
                                  attributeName="stop-color"
                                  values="#ffa07a; #ff6b6b; #ff8787; #ffa07a"
                                  dur="3s"
                                  repeatCount="indefinite"
                                />
                              </stop>
                            </linearGradient>
                          </defs>
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </motion.div>
                )}

                {!loading && moodEntries.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  >
                    <Box
                      sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 2 }}
                    >
                      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                        <Box sx={{ flex: "1 1 30%", minWidth: 150 }}>
                          <Typography variant="caption" color="text.secondary">
                            Week Average
                          </Typography>
                          <Typography
                            variant="h6"
                            fontWeight="bold"
                            color="primary.main"
                          >
                            {averageMood}/5
                          </Typography>
                        </Box>
                        <Box sx={{ flex: "1 1 30%", minWidth: 150 }}>
                          <Typography variant="caption" color="text.secondary">
                            Mood Range
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {Math.min(...moodEntries.map((e) => e.mood))} -{" "}
                            {Math.max(...moodEntries.map((e) => e.mood))}
                          </Typography>
                        </Box>
                        <Box sx={{ flex: "1 1 30%", minWidth: 150 }}>
                          <Typography variant="caption" color="text.secondary">
                            Stability
                          </Typography>
                          <Chip
                            label={stability.label}
                            color={stability.color}
                            size="small"
                            sx={{ fontWeight: "bold" }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Box>

        {!loading && moodEntries.length > 0 && (
          <>
            {/* Quick Actions Section */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                {/* Today's Summary */}
                <Box sx={{ flex: "1 1 45%", minWidth: 300 }}>
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    <Card sx={{ height: "100%" }}>
                      <CardContent>
                        <Typography
                          variant="h6"
                          fontWeight="600"
                          sx={{ mb: 2, display: "flex", alignItems: "center" }}
                        >
                          🌤️ Today's Mood Summary
                        </Typography>
                        {todaysMood ? (
                          <>
                            <Box sx={{ textAlign: "center", mb: 3 }}>
                              <Typography variant="h2" sx={{ mb: 1 }}>
                                {todaysMood.emoji}
                              </Typography>
                              <Typography variant="h6" fontWeight="bold">
                                {
                                  emojiOptions.find(
                                    (e) => e.value === todaysMood.mood
                                  )?.label
                                }
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Logged at {todaysMood.time}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 2,
                                mb: 2,
                                flexWrap: "wrap",
                              }}
                            >
                              <Box sx={{ flex: 1, minWidth: 150 }}>
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.5, delay: 0.3 }}
                                >
                                  <Paper
                                    sx={{
                                      p: 2,
                                      textAlign: "center",
                                      background:
                                        "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                                      border: "1px solid #90caf9",
                                    }}
                                  >
                                    <Typography
                                      variant="h6"
                                      sx={{ color: "#1976d2" }}
                                      fontWeight="bold"
                                    >
                                      {todaysMood.energy}/5
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{ color: "#1565c0" }}
                                    >
                                      Energy Level
                                    </Typography>
                                  </Paper>
                                </motion.div>
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 150 }}>
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.5, delay: 0.4 }}
                                >
                                  <Paper
                                    sx={{
                                      p: 2,
                                      textAlign: "center",
                                      background:
                                        stability.color === "success"
                                          ? "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)"
                                          : stability.color === "warning"
                                          ? "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)"
                                          : "linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)",
                                      border:
                                        stability.color === "success"
                                          ? "1px solid #81c784"
                                          : stability.color === "warning"
                                          ? "1px solid #ffb74d"
                                          : "1px solid #e57373",
                                    }}
                                  >
                                    <Typography
                                      variant="h6"
                                      color={`${stability.color}.dark`}
                                      fontWeight="bold"
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      {stability.color === "success" ? (
                                        <TrendingUp />
                                      ) : (
                                        <TrendingDown />
                                      )}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color={`${stability.color}.dark`}
                                    >
                                      {stability.label}
                                    </Typography>
                                  </Paper>
                                </motion.div>
                              </Box>
                            </Box>
                            {todaysMood.note && (
                              <Paper
                                sx={{
                                  p: 2,
                                  bgcolor: "grey.50",
                                  borderRadius: 2,
                                }}
                              >
                                <Typography variant="body2" fontStyle="italic">
                                  "{todaysMood.note}"
                                </Typography>
                              </Paper>
                            )}
                          </>
                        ) : (
                          <Box sx={{ textAlign: "center", py: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                              No mood logged today yet
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </Box>

                {/* Quick Mood Log */}
                <Box sx={{ flex: "1 1 45%", minWidth: 300 }}>
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <Card sx={{ height: "100%" }}>
                      <CardContent>
                        <Typography
                          variant="h6"
                          fontWeight="600"
                          sx={{ mb: 2 }}
                        >
                          🎨 Quick Mood Entry
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          How are you feeling right now?
                        </Typography>

                        <ButtonGroup sx={{ mb: 3, width: "100%" }}>
                          {emojiOptions.map((option) => (
                            <Button
                              key={option.value}
                              variant={
                                newMoodData.mood === option.value
                                  ? "contained"
                                  : "outlined"
                              }
                              onClick={() =>
                                setNewMoodData({
                                  ...newMoodData,
                                  mood: option.value,
                                  emoji: option.emoji,
                                })
                              }
                              sx={{
                                fontSize: "1.5rem",
                                flex: 1,
                                py: 1,
                                bgcolor:
                                  newMoodData.mood === option.value
                                    ? "primary.main"
                                    : "transparent",
                              }}
                            >
                              {option.emoji}
                            </Button>
                          ))}
                        </ButtonGroup>

                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Energy Level: {newMoodData.energy}/5
                        </Typography>
                        <Slider
                          value={newMoodData.energy}
                          onChange={(e, value) =>
                            setNewMoodData({ ...newMoodData, energy: value })
                          }
                          min={1}
                          max={5}
                          step={1}
                          marks
                          valueLabelDisplay="auto"
                          sx={{ mb: 3 }}
                        />

                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          placeholder="Notes (optional)"
                          value={newMoodData.note}
                          onChange={(e) =>
                            setNewMoodData({
                              ...newMoodData,
                              note: e.target.value,
                            })
                          }
                          sx={{ mb: 2 }}
                        />

                        <Button
                          variant="contained"
                          fullWidth
                          onClick={handleLogMood}
                          startIcon={<Add />}
                          sx={{
                            background:
                              "linear-gradient(45deg, #ff6b6b 30%, #ff8787 90%)",
                            "&:hover": {
                              background:
                                "linear-gradient(45deg, #ff5252 30%, #ff6b6b 90%)",
                            },
                          }}
                        >
                          Save Mood Entry
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Box>
              </Box>
            </Box>
          </>
        )}

        {/* 3. BOTTOM SECTION - AI Emotional Insight */}
        {!loading && moodEntries.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <Card
                sx={{
                  background:
                    "linear-gradient(135deg, #fff3e0 0%, #f3e5f5 100%)",
                  border: "1px solid rgba(255, 107, 107, 0.2)",
                }}
              >
                <CardContent>
                  <Typography
                    variant="h5"
                    fontWeight="600"
                    sx={{ mb: 2, display: "flex", alignItems: "center" }}
                  >
                    <Psychology
                      sx={{ mr: 1, color: "primary.main", fontSize: 28 }}
                    />
                    AI Emotional Reflection 🧠
                  </Typography>

                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 3, lineHeight: 1.6 }}
                  >
                    Intelligent insights based on your emotional patterns and
                    behavior correlations.
                  </Typography>

                  <Box
                    sx={{ display: "flex", gap: 3, mb: 3, flexWrap: "wrap" }}
                  >
                    <Box sx={{ flex: "1 1 45%", minWidth: 300 }}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                      >
                        <Paper sx={{ p: 3, height: "100%" }}>
                          <Typography
                            variant="h6"
                            fontWeight="600"
                            sx={{
                              mb: 2,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <Timeline sx={{ mr: 1, color: "info.main" }} />
                            Weekly Trends
                          </Typography>
                          <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                            <Typography
                              component="li"
                              variant="body2"
                              sx={{ mb: 1 }}
                            >
                              Your energy is{" "}
                              <strong>highest between 9–11 AM</strong> — this is
                              a great window for deep work.
                            </Typography>
                            <Typography
                              component="li"
                              variant="body2"
                              sx={{ mb: 1 }}
                            >
                              Your mood tends to{" "}
                              <strong>drop slightly on Thursdays</strong>. This
                              pattern has been consistent for 3 weeks.
                            </Typography>
                            <Typography component="li" variant="body2">
                              You complete <strong>30% more habits</strong> on
                              days when energy ≥ 3.
                            </Typography>
                          </Box>
                        </Paper>
                      </motion.div>
                    </Box>

                    <Box sx={{ flex: "1 1 45%", minWidth: 300 }}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                      >
                        <Paper sx={{ p: 3, height: "100%" }}>
                          <Typography
                            variant="h6"
                            fontWeight="600"
                            sx={{
                              mb: 2,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <Lightbulb sx={{ mr: 1, color: "warning.main" }} />
                            AI Recommendations
                          </Typography>
                          <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                            <Typography
                              component="li"
                              variant="body2"
                              sx={{ mb: 1 }}
                            >
                              <strong>Pair light physical activity</strong> with
                              morning tasks to maintain mood stability.
                            </Typography>
                            <Typography
                              component="li"
                              variant="body2"
                              sx={{ mb: 1 }}
                            >
                              Consider{" "}
                              <strong>
                                scheduling easier tasks on Thursdays
                              </strong>{" "}
                              to reduce stress.
                            </Typography>
                            <Typography component="li" variant="body2">
                              Your <strong>meditation habit correlates</strong>{" "}
                              with 15% higher daily mood scores.
                            </Typography>
                          </Box>
                        </Paper>
                      </motion.div>
                    </Box>
                  </Box>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                  >
                    <Paper
                      sx={{
                        p: 3,
                        bgcolor: "rgba(255, 107, 107, 0.05)",
                        border: "1px solid rgba(255, 107, 107, 0.2)",
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.primary"
                        sx={{ textAlign: "center", fontWeight: 500 }}
                      >
                        🎯 <strong>Emotional Intelligence Score:</strong> 7.8/10
                        •<strong> Mood Consistency:</strong> {stability.label} •
                        <strong> Growth Trend:</strong> +12% this month
                      </Typography>
                    </Paper>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </Box>
        )}

        {/* Mood Log Dialog */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Log Your Current Mood</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                How are you feeling right now?
              </Typography>

              <ButtonGroup sx={{ mb: 3, width: "100%" }}>
                {emojiOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={
                      newMoodData.mood === option.value
                        ? "contained"
                        : "outlined"
                    }
                    onClick={() =>
                      setNewMoodData({
                        ...newMoodData,
                        mood: option.value,
                        emoji: option.emoji,
                      })
                    }
                    sx={{
                      fontSize: "2rem",
                      flex: 1,
                      py: 2,
                    }}
                  >
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="h4">{option.emoji}</Typography>
                      <Typography variant="caption">{option.label}</Typography>
                    </Box>
                  </Button>
                ))}
              </ButtonGroup>

              <Typography variant="body1" sx={{ mb: 2 }}>
                Energy Level: {newMoodData.energy}/5
              </Typography>
              <Slider
                value={newMoodData.energy}
                onChange={(e, value) =>
                  setNewMoodData({ ...newMoodData, energy: value })
                }
                min={1}
                max={5}
                step={1}
                marks={[
                  { value: 1, label: "Low" },
                  { value: 3, label: "Normal" },
                  { value: 5, label: "High" },
                ]}
                valueLabelDisplay="auto"
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes (optional)"
                placeholder="What's on your mind? How was your day?"
                value={newMoodData.note}
                onChange={(e) =>
                  setNewMoodData({ ...newMoodData, note: e.target.value })
                }
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              onClick={handleLogMood}
              variant="contained"
              sx={{
                background: "linear-gradient(45deg, #ff6b6b 30%, #ff8787 90%)",
                "&:hover": {
                  background:
                    "linear-gradient(45deg, #ff5252 30%, #ff6b6b 90%)",
                },
              }}
            >
              Save Mood Entry
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success/Error Notification */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </AppLayout>
  );
};

export default Mood;
