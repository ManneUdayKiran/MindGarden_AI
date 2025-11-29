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
  LinearProgress,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  Insights as InsightsIcon,
  Refresh,
  TrendingUp,
  TrendingDown,
  Assessment,
  Psychology,
  CheckCircle,
  Schedule,
  LocalFireDepartment,
  EmojiEvents,
  Analytics,
  Lightbulb,
  Timeline,
  Speed,
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import AppLayout from "../components/AppLayout";
import { analyticsAPI } from "../services/api";

const Insights = ({ user, onLogout }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [scoreboard, setScoreboard] = useState(null);

  useEffect(() => {
    fetchInsightsData();
  }, []);

  const fetchInsightsData = async () => {
    try {
      setLoading(true);
      const [dashboard, weekly, scoreboardData] = await Promise.all([
        analyticsAPI.getDashboard(30),
        analyticsAPI.getWeeklyReport().catch(() => null),
        analyticsAPI.getScoreboard().catch(() => null),
      ]);

      setDashboardData(dashboard.data);
      setWeeklyReport(weekly?.data || null);
      setScoreboard(scoreboardData?.data || null);
    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics from real data
  const productivityMetrics = dashboardData
    ? {
        taskCompletion: {
          value: Math.round(dashboardData.taskCompletionRate || 0),
          change: 0,
        },
        habitConsistency: {
          value: Math.round(dashboardData.habitCompletionRate || 0),
          change: 0,
        },
        focusHours: {
          value: dashboardData.totalCompletedHabits || 0,
          change: 0,
        },
      }
    : {
        taskCompletion: { value: 0, change: 0 },
        habitConsistency: { value: 0, change: 0 },
        focusHours: { value: 0, change: 0 },
      };

  const moodMetrics = weeklyReport
    ? {
        stabilityScore: Math.round(weeklyReport.moodStability || 0),
        averageMood: (weeklyReport.averageMood || 0).toFixed(1),
        averageEnergy: (weeklyReport.averageEnergy || 0).toFixed(1),
        variance: weeklyReport.moodVariance || "N/A",
        mostStableDay: weeklyReport.bestDay || "N/A",
        leastStableDay: weeklyReport.worstDay || "N/A",
      }
    : {
        stabilityScore: 0,
        averageMood: "0.0",
        averageEnergy: "0.0",
        variance: "N/A",
        mostStableDay: "N/A",
        leastStableDay: "N/A",
      };

  const weeklyData = weeklyReport?.dailyData || [];

  const aiFindings = dashboardData?.insights || [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchInsightsData();
    setIsRefreshing(false);
  };

  const getVarianceColor = (variance) => {
    switch (variance) {
      case "Low":
        return "success";
      case "Moderate":
        return "warning";
      case "High":
        return "error";
      default:
        return "default";
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography
              key={index}
              variant="caption"
              sx={{ display: "block", color: entry.color }}
            >
              {entry.name}: {entry.value}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
    <AppLayout user={user} onLogout={onLogout}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <InsightsIcon sx={{ fontSize: 40, color: "primary.main" }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                📊 Insights Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your weekly performance analytics & AI-powered recommendations
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </Box>

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "400px",
            }}
          >
            <CircularProgress size={60} />
          </Box>
        ) : !dashboardData ? (
          <Box
            sx={{
              textAlign: "center",
              py: 8,
            }}
          >
            <Analytics
              sx={{ fontSize: 80, color: "text.secondary", opacity: 0.3 }}
            />
            <Typography variant="h5" color="text.secondary" sx={{ mt: 2 }}>
              No data available yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Start tracking habits, tasks, and moods to see insights
            </Typography>
          </Box>
        ) : (
          <>
            {/* Weekly Scorecard */}
            <Box sx={{ mb: 3 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardContent>
                    <Typography
                      variant="h6"
                      fontWeight="600"
                      sx={{ mb: 3, display: "flex", alignItems: "center" }}
                    >
                      <EmojiEvents sx={{ mr: 1, color: "warning.main" }} />
                      🏆 Weekly Scorecard
                    </Typography>

                    <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                      {/* Overall Score & Rank */}
                      <Box sx={{ flex: "1 1 22%", minWidth: 200 }}>
                        <Paper
                          sx={{
                            p: 3,
                            textAlign: "center",
                            background:
                              "linear-gradient(135deg, #fff9c4 0%, #fff59d 100%)",
                            border: "1px solid #ffd54f",
                          }}
                        >
                          <Typography variant="h5" sx={{ mb: 1 }}>
                            {scoreboard?.rank_emoji || "🥇"}
                          </Typography>
                          <Typography
                            variant="h4"
                            fontWeight="bold"
                            sx={{ color: "#f57f17" }}
                          >
                            {scoreboard?.overall_score || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {scoreboard?.rank || "Beginner"} Score
                          </Typography>
                        </Paper>
                      </Box>

                      {/* Current Streak */}
                      <Box sx={{ flex: "1 1 22%", minWidth: 200 }}>
                        <Paper
                          sx={{
                            p: 3,
                            textAlign: "center",
                            background:
                              "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
                            border: "1px solid #81c784",
                          }}
                        >
                          <Typography variant="h5" sx={{ mb: 1 }}>
                            🔥
                          </Typography>
                          <Typography
                            variant="h4"
                            fontWeight="bold"
                            sx={{ color: "#2e7d32" }}
                          >
                            {scoreboard?.current_streak || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Day Streak
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mt: 0.5 }}
                          >
                            Best: {scoreboard?.longest_streak || 0} days
                          </Typography>
                        </Paper>
                      </Box>

                      {/* Tasks Done This Week */}
                      <Box sx={{ flex: "1 1 22%", minWidth: 200 }}>
                        <Paper
                          sx={{
                            p: 3,
                            textAlign: "center",
                            background:
                              "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                            border: "1px solid #90caf9",
                          }}
                        >
                          <Typography variant="h5" sx={{ mb: 1 }}>
                            ✓
                          </Typography>
                          <Typography
                            variant="h4"
                            fontWeight="bold"
                            sx={{ color: "#1565c0" }}
                          >
                            {scoreboard?.this_week?.tasks || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Tasks Done
                          </Typography>
                          {scoreboard?.changes?.tasks !== undefined && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mt: 0.5,
                              }}
                            >
                              {scoreboard.changes.tasks >= 0 ? (
                                <TrendingUp
                                  sx={{
                                    fontSize: 16,
                                    color: "success.main",
                                    mr: 0.5,
                                  }}
                                />
                              ) : (
                                <TrendingDown
                                  sx={{
                                    fontSize: 16,
                                    color: "error.main",
                                    mr: 0.5,
                                  }}
                                />
                              )}
                              <Typography
                                variant="caption"
                                sx={{
                                  color:
                                    scoreboard.changes.tasks >= 0
                                      ? "success.main"
                                      : "error.main",
                                }}
                              >
                                {scoreboard.changes.tasks > 0 ? "+" : ""}
                                {scoreboard.changes.tasks.toFixed(0)}%
                              </Typography>
                            </Box>
                          )}
                        </Paper>
                      </Box>

                      {/* Habits & Mood Average */}
                      <Box sx={{ flex: "1 1 22%", minWidth: 200 }}>
                        <Paper
                          sx={{
                            p: 3,
                            textAlign: "center",
                            background:
                              "linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)",
                            border: "1px solid #ce93d8",
                          }}
                        >
                          <Typography variant="h5" sx={{ mb: 1 }}>
                            😊
                          </Typography>
                          <Typography
                            variant="h4"
                            fontWeight="bold"
                            sx={{ color: "#7b1fa2" }}
                          >
                            {scoreboard?.this_week?.avg_mood || "N/A"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Avg Mood
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mt: 0.5 }}
                          >
                            {scoreboard?.this_week?.habits || 0} habits done
                          </Typography>
                        </Paper>
                      </Box>
                    </Box>

                    {/* Week Comparison */}
                    {scoreboard && (
                      <Box sx={{ mt: 3 }}>
                        <Divider sx={{ mb: 2 }} />
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          📈 This Week vs Last Week
                        </Typography>
                        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                          <Chip
                            icon={
                              scoreboard.changes.habits >= 0 ? (
                                <TrendingUp />
                              ) : (
                                <TrendingDown />
                              )
                            }
                            label={`Habits: ${
                              scoreboard.changes.habits > 0 ? "+" : ""
                            }${scoreboard.changes.habits.toFixed(0)}%`}
                            color={
                              scoreboard.changes.habits >= 0
                                ? "success"
                                : "error"
                            }
                            variant="outlined"
                            size="small"
                          />
                          <Chip
                            icon={
                              scoreboard.changes.tasks >= 0 ? (
                                <TrendingUp />
                              ) : (
                                <TrendingDown />
                              )
                            }
                            label={`Tasks: ${
                              scoreboard.changes.tasks > 0 ? "+" : ""
                            }${scoreboard.changes.tasks.toFixed(0)}%`}
                            color={
                              scoreboard.changes.tasks >= 0
                                ? "success"
                                : "error"
                            }
                            variant="outlined"
                            size="small"
                          />
                          <Chip
                            icon={
                              scoreboard.changes.moods >= 0 ? (
                                <TrendingUp />
                              ) : (
                                <TrendingDown />
                              )
                            }
                            label={`Mood Logs: ${
                              scoreboard.changes.moods > 0 ? "+" : ""
                            }${scoreboard.changes.moods.toFixed(0)}%`}
                            color={
                              scoreboard.changes.moods >= 0
                                ? "success"
                                : "error"
                            }
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Box>

            {/* Daily Activity Breakdown */}
            {scoreboard?.daily_breakdown &&
              scoreboard.daily_breakdown.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Card>
                      <CardContent>
                        <Typography
                          variant="h6"
                          fontWeight="600"
                          sx={{ mb: 3, display: "flex", alignItems: "center" }}
                        >
                          <Timeline sx={{ mr: 1, color: "info.main" }} />
                          📅 Daily Activity Breakdown
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={scoreboard.daily_breakdown}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar
                              dataKey="habits"
                              fill="#4caf50"
                              name="Habits"
                            />
                            <Bar dataKey="tasks" fill="#2196f3" name="Tasks" />
                            <Bar
                              dataKey="moods"
                              fill="#9c27b0"
                              name="Mood Logs"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Box>
              )}

            {/* Productivity Overview */}
            <Box sx={{ mb: 3 }}>
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
                      sx={{ mb: 3, display: "flex", alignItems: "center" }}
                    >
                      <Assessment sx={{ mr: 1, color: "primary.main" }} />
                      🚀 Productivity Overview
                    </Typography>

                    <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                      <Box sx={{ flex: "1 1 30%", minWidth: 250 }}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                        >
                          <Paper
                            sx={{
                              p: 3,
                              textAlign: "center",
                              background:
                                "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                              border: "1px solid #90caf9",
                            }}
                          >
                            <CheckCircle
                              sx={{ fontSize: 32, color: "#1976d2", mb: 1 }}
                            />
                            <Typography
                              variant="h4"
                              sx={{ color: "#1565c0" }}
                              fontWeight="bold"
                            >
                              {productivityMetrics.taskCompletion.value}%
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "#0d47a1" }}
                            >
                              Task Completion Rate
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mt: 1,
                              }}
                            >
                              <TrendingUp
                                sx={{
                                  fontSize: 16,
                                  color: "success.main",
                                  mr: 0.5,
                                }}
                              />
                              <Typography
                                variant="caption"
                                color="success.main"
                                fontWeight="bold"
                              >
                                ↑ {productivityMetrics.taskCompletion.change}%
                                vs last week
                              </Typography>
                            </Box>
                          </Paper>
                        </motion.div>
                      </Box>

                      <Box sx={{ flex: "1 1 30%", minWidth: 250 }}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                        >
                          <Paper
                            sx={{
                              p: 3,
                              textAlign: "center",
                              background:
                                "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
                              border: "1px solid #81c784",
                            }}
                          >
                            <LocalFireDepartment
                              sx={{ fontSize: 32, color: "#388e3c", mb: 1 }}
                            />
                            <Typography
                              variant="h4"
                              sx={{ color: "#388e3c" }}
                              fontWeight="bold"
                            >
                              {productivityMetrics.habitConsistency.value}%
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "#2e7d32" }}
                            >
                              Habit Consistency Score
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={
                                  productivityMetrics.habitConsistency.value
                                }
                                color="success"
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Box>
                          </Paper>
                        </motion.div>
                      </Box>

                      <Box sx={{ flex: "1 1 30%", minWidth: 250 }}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        >
                          <Paper
                            sx={{
                              p: 3,
                              textAlign: "center",
                              background:
                                "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)",
                              border: "1px solid #ffb74d",
                            }}
                          >
                            <Schedule
                              sx={{ fontSize: 32, color: "#f57c00", mb: 1 }}
                            />
                            <Typography
                              variant="h4"
                              sx={{ color: "#f57c00" }}
                              fontWeight="bold"
                            >
                              {productivityMetrics.focusHours.value}h
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "#e65100" }}
                            >
                              Focus Hours Logged
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mt: 1,
                              }}
                            >
                              <TrendingUp
                                sx={{
                                  fontSize: 16,
                                  color: "success.main",
                                  mr: 0.5,
                                }}
                              />
                              <Typography
                                variant="caption"
                                color="success.main"
                                fontWeight="bold"
                              >
                                ↑ {productivityMetrics.focusHours.change}% vs
                                last week
                              </Typography>
                            </Box>
                          </Paper>
                        </motion.div>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>

            {/* Mood Stability and Focus Analysis */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                {/* Mood Stability Index */}
                <Box sx={{ flex: "1 1 60%", minWidth: 400 }}>
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <Card sx={{ height: "100%" }}>
                      <CardContent>
                        <Typography
                          variant="h6"
                          fontWeight="600"
                          sx={{ mb: 3, display: "flex", alignItems: "center" }}
                        >
                          <Psychology sx={{ mr: 1, color: "secondary.main" }} />
                          🧠 Mood Stability Index
                        </Typography>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                            mb: 3,
                          }}
                        >
                          <Box sx={{ textAlign: "center" }}>
                            <Box
                              sx={{
                                position: "relative",
                                display: "inline-flex",
                                mb: 2,
                              }}
                            >
                              <CircularProgress
                                variant="determinate"
                                value={100}
                                size={120}
                                thickness={4}
                                sx={{ color: "grey.200" }}
                              />
                              <CircularProgress
                                variant="determinate"
                                value={moodMetrics.stabilityScore}
                                size={120}
                                thickness={4}
                                sx={{
                                  color:
                                    moodMetrics.stabilityScore >= 80
                                      ? "success.main"
                                      : moodMetrics.stabilityScore >= 60
                                      ? "warning.main"
                                      : "error.main",
                                  position: "absolute",
                                  left: 0,
                                }}
                              />
                              <Box
                                sx={{
                                  top: 0,
                                  left: 0,
                                  bottom: 0,
                                  right: 0,
                                  position: "absolute",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Box sx={{ textAlign: "center" }}>
                                  <Typography
                                    variant="h4"
                                    fontWeight="bold"
                                    color={
                                      moodMetrics.stabilityScore >= 80
                                        ? "success.main"
                                        : moodMetrics.stabilityScore >= 60
                                        ? "warning.main"
                                        : "error.main"
                                    }
                                  >
                                    {moodMetrics.stabilityScore}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    /100
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                            <Chip
                              label={
                                moodMetrics.stabilityScore >= 80
                                  ? "Very Stable"
                                  : moodMetrics.stabilityScore >= 60
                                  ? "Moderate"
                                  : "Volatile"
                              }
                              color={
                                moodMetrics.stabilityScore >= 80
                                  ? "success"
                                  : moodMetrics.stabilityScore >= 60
                                  ? "warning"
                                  : "error"
                              }
                              size="small"
                            />
                          </Box>

                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 2 }}
                            >
                              Mood stability measures consistency in emotional
                              state. Higher scores indicate better emotional
                              balance.
                            </Typography>

                            <Box
                              sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}
                            >
                              <Box sx={{ flex: "1 1 45%", minWidth: 120 }}>
                                <Paper
                                  sx={{
                                    p: 2,
                                    textAlign: "center",
                                    background:
                                      "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                                    border: "1px solid #90caf9",
                                  }}
                                >
                                  <Typography variant="h6">😊</Typography>
                                  <Typography variant="body2" fontWeight="600">
                                    {moodMetrics.averageMood}/5
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Avg Mood
                                  </Typography>
                                </Paper>
                              </Box>
                              <Box sx={{ flex: "1 1 45%", minWidth: 120 }}>
                                <Paper
                                  sx={{
                                    p: 2,
                                    textAlign: "center",
                                    background:
                                      "linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)",
                                    border: "1px solid #ce93d8",
                                  }}
                                >
                                  <Typography variant="h6">⚡</Typography>
                                  <Typography variant="body2" fontWeight="600">
                                    {moodMetrics.averageEnergy}/5
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Avg Energy
                                  </Typography>
                                </Paper>
                              </Box>
                            </Box>
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Variance:</strong>{" "}
                                <Chip
                                  label={moodMetrics.variance}
                                  size="small"
                                  color={getVarianceColor(moodMetrics.variance)}
                                />
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                📈 Most stable:{" "}
                                <strong>{moodMetrics.mostStableDay}</strong>
                                <br />
                                📉 Least stable:{" "}
                                <strong>{moodMetrics.leastStableDay}</strong>
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Box>

                {/* Focus & Time Analysis */}
                <Box sx={{ flex: "1 1 35%", minWidth: 300 }}>
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <Card sx={{ height: "100%" }}>
                      <CardContent>
                        <Typography
                          variant="h6"
                          fontWeight="600"
                          sx={{ mb: 3, display: "flex", alignItems: "center" }}
                        >
                          <Schedule sx={{ mr: 1, color: "primary.main" }} />
                          ⏱️ Focus & Time Analysis
                        </Typography>

                        <Box sx={{ textAlign: "center", mb: 3 }}>
                          <Typography
                            variant="h2"
                            fontWeight="bold"
                            color="primary.main"
                            sx={{ mb: 1 }}
                          >
                            {productivityMetrics.focusHours.value}h
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Weekly Focus Hours
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                          }}
                        >
                          <Paper
                            sx={{
                              p: 2,
                              textAlign: "center",
                              background:
                                "linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)",
                              border: "1px solid #9fa8da",
                            }}
                          >
                            <Typography variant="h6" sx={{ color: "#3f51b5" }}>
                              {Math.round(
                                (productivityMetrics.focusHours.value / 7) * 10
                              ) / 10}
                              h
                            </Typography>
                            <Typography variant="caption" color="primary.dark">
                              Daily Average
                            </Typography>
                          </Paper>

                          <Paper
                            sx={{
                              p: 2,
                              textAlign: "center",
                              background:
                                "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
                              border: "1px solid #81c784",
                            }}
                          >
                            <Typography variant="h6" sx={{ color: "#2e7d32" }}>
                              2-4 PM
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Peak Hours
                            </Typography>
                          </Paper>

                          <Paper
                            sx={{
                              p: 2,
                              textAlign: "center",
                              background:
                                "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)",
                              border: "1px solid #ffb74d",
                            }}
                          >
                            <Typography variant="h6" sx={{ color: "#e65100" }}>
                              85%
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Efficiency
                            </Typography>
                          </Paper>
                        </Box>

                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Trend:</strong>{" "}
                            <Chip
                              label={`↑ ${productivityMetrics.focusHours.change}%`}
                              size="small"
                              color="success"
                            />
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            🎯 Best day: <strong>Tuesday</strong>
                            <br />
                            📅 Goal: <strong>40h/week</strong>
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Box>
              </Box>
            </Box>

            {/* Correlation Analysis */}
            <Box sx={{ mb: 3 }}>
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
                      <Timeline sx={{ mr: 1, color: "info.main" }} />
                      📊 Habits–Tasks–Mood Correlation
                    </Typography>

                    <Box sx={{ height: 300, width: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={weeklyData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient
                              id="habitsGradient"
                              x1="0"
                              y1="0"
                              x2="1"
                              y2="0"
                            >
                              <stop offset="0%" stopColor="#4caf50">
                                <animate
                                  attributeName="stop-color"
                                  values="#4caf50; #66bb6a; #81c784; #66bb6a; #4caf50"
                                  dur="3s"
                                  repeatCount="indefinite"
                                />
                              </stop>
                              <stop offset="50%" stopColor="#66bb6a">
                                <animate
                                  attributeName="stop-color"
                                  values="#66bb6a; #81c784; #66bb6a; #4caf50; #66bb6a"
                                  dur="3s"
                                  repeatCount="indefinite"
                                />
                              </stop>
                              <stop offset="100%" stopColor="#81c784">
                                <animate
                                  attributeName="stop-color"
                                  values="#81c784; #66bb6a; #4caf50; #66bb6a; #81c784"
                                  dur="3s"
                                  repeatCount="indefinite"
                                />
                              </stop>
                            </linearGradient>

                            <linearGradient
                              id="tasksGradient"
                              x1="0"
                              y1="0"
                              x2="1"
                              y2="0"
                            >
                              <stop offset="0%" stopColor="#2196f3">
                                <animate
                                  attributeName="stop-color"
                                  values="#2196f3; #42a5f5; #64b5f6; #42a5f5; #2196f3"
                                  dur="3s"
                                  repeatCount="indefinite"
                                />
                              </stop>
                              <stop offset="50%" stopColor="#42a5f5">
                                <animate
                                  attributeName="stop-color"
                                  values="#42a5f5; #64b5f6; #42a5f5; #2196f3; #42a5f5"
                                  dur="3s"
                                  repeatCount="indefinite"
                                />
                              </stop>
                              <stop offset="100%" stopColor="#64b5f6">
                                <animate
                                  attributeName="stop-color"
                                  values="#64b5f6; #42a5f5; #2196f3; #42a5f5; #64b5f6"
                                  dur="3s"
                                  repeatCount="indefinite"
                                />
                              </stop>
                            </linearGradient>

                            <linearGradient
                              id="moodGradient"
                              x1="0"
                              y1="0"
                              x2="1"
                              y2="0"
                            >
                              <stop offset="0%" stopColor="#9c27b0">
                                <animate
                                  attributeName="stop-color"
                                  values="#9c27b0; #ab47bc; #ba68c8; #ab47bc; #9c27b0"
                                  dur="3s"
                                  repeatCount="indefinite"
                                />
                              </stop>
                              <stop offset="50%" stopColor="#ab47bc">
                                <animate
                                  attributeName="stop-color"
                                  values="#ab47bc; #ba68c8; #ab47bc; #9c27b0; #ab47bc"
                                  dur="3s"
                                  repeatCount="indefinite"
                                />
                              </stop>
                              <stop offset="100%" stopColor="#ba68c8">
                                <animate
                                  attributeName="stop-color"
                                  values="#ba68c8; #ab47bc; #9c27b0; #ab47bc; #ba68c8"
                                  dur="3s"
                                  repeatCount="indefinite"
                                />
                              </stop>
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f0f0f0"
                          />
                          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="habits"
                            stroke="url(#habitsGradient)"
                            strokeWidth={3}
                            name="Habits"
                            dot={{ fill: "#4caf50", strokeWidth: 2, r: 5 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="tasks"
                            stroke="url(#tasksGradient)"
                            strokeWidth={3}
                            name="Tasks"
                            dot={{ fill: "#2196f3", strokeWidth: 2, r: 5 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="mood"
                            stroke="url(#moodGradient)"
                            strokeWidth={3}
                            name="Mood"
                            dot={{ fill: "#9c27b0", strokeWidth: 2, r: 5 }}
                            scale="auto"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>

                    <Box
                      sx={{
                        mt: 2,
                        display: "flex",
                        justifyContent: "center",
                        gap: 3,
                      }}
                    >
                      <Chip
                        label="🔥 Habits"
                        sx={{
                          background:
                            "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
                          border: "1px solid #81c784",
                        }}
                      />
                      <Chip
                        label="✓ Tasks"
                        sx={{
                          background:
                            "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                          border: "1px solid #90caf9",
                        }}
                      />
                      <Chip
                        label="😊 Mood"
                        sx={{
                          background:
                            "linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)",
                          border: "1px solid #ce93d8",
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>

            {/* AI Findings */}
            <Box sx={{ mb: 3 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card>
                  <CardContent>
                    <Typography
                      variant="h6"
                      fontWeight="600"
                      sx={{ mb: 3, display: "flex", alignItems: "center" }}
                    >
                      <Lightbulb sx={{ mr: 1, color: "warning.main" }} />
                      🤖 AI-Powered Findings
                    </Typography>

                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      {aiFindings.map((finding, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.4,
                            delay: 0.4 + index * 0.1,
                          }}
                        >
                          <Paper
                            sx={{
                              p: 2,
                              background:
                                index === 0
                                  ? "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)"
                                  : index === 1
                                  ? "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)"
                                  : index === 2
                                  ? "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)"
                                  : "linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)",
                              border:
                                index === 0
                                  ? "1px solid #90caf9"
                                  : index === 1
                                  ? "1px solid #81c784"
                                  : index === 2
                                  ? "1px solid #ffb74d"
                                  : "1px solid #ce93d8",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              <Typography variant="h4">
                                {finding.icon}
                              </Typography>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body1" fontWeight="600">
                                  {finding.title}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {finding.description}
                                </Typography>
                              </Box>
                            </Box>
                          </Paper>
                        </motion.div>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>
          </>
        )}
      </Container>
    </AppLayout>
  );
};

export default Insights;
