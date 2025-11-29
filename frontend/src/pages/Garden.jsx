import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Chip,
  LinearProgress,
  Grid,
  Tooltip,
  Container,
  CircularProgress,
} from "@mui/material";
import { Refresh, List as ListIcon } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AppLayout from "../components/AppLayout";
import PlantFillPremium from "../components/PlantFillPremium";
import { habitsAPI, analyticsAPI } from "../services/api";

const Garden = ({ user, onLogout }) => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [viewMode, setViewMode] = useState("garden"); // "garden" or "list"
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState(null);

  // Fetch habits from API
  useEffect(() => {
    fetchGardenData();
  }, []);

  const fetchGardenData = async () => {
    try {
      setLoading(true);
      const response = await habitsAPI.getHabits();
      const habitsData = response.data.map((habit) => ({
        id: habit.id,
        name: habit.name,
        category: habit.category || "Personal",
        streak: habit.current_streak || 0,
        healthScore: calculateHealthScore(habit),
        growthLevel: calculateGrowthLevel(habit.current_streak),
        isWilting: habit.current_streak === 0 || habit.current_streak < 3,
        completionRate: habit.completions_this_week || 0,
        frequency: habit.frequency || [],
        plantType: assignPlantType(habit.category),
      }));
      setHabits(habitsData);

      // Fetch analytics data for garden health and AI insights
      const analyticsResponse = await analyticsAPI.getDashboard(30);
      const gardenHealthData = analyticsResponse.data.garden_health;

      // Generate AI insights with analytics data
      await generateAIInsight(habitsData, gardenHealthData);
    } catch (error) {
      console.error("Error fetching garden data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateHealthScore = (habit) => {
    const streak = habit.current_streak || 0;
    const completionRate = (habit.completions_this_week || 0) / 7;
    return Math.min(streak * 0.1 + completionRate * 0.5, 1);
  };

  const calculateGrowthLevel = (streak) => {
    if (streak === 0) return 0; // dormant
    if (streak <= 3) return 1; // sprout
    if (streak <= 7) return 2; // growing
    if (streak <= 14) return 3; // thriving
    return 4; // flourishing
  };

  const assignPlantType = (category) => {
    const plantTypes = {
      Health: "sunflower",
      Learning: "rose",
      Work: "cactus",
      Focus: "tulip",
      Personal: "daisy",
      Wellness: "lily",
      Productivity: "bamboo",
    };
    return plantTypes[category] || "flower";
  };

  const generateAIInsight = async (habitsData, gardenHealthData) => {
    try {
      // Generate insights based on habits data and analytics
      const bloomingCount = habitsData.filter(
        (h) => h.growthLevel >= 3 && !h.isWilting
      ).length;
      const wiltingCount = habitsData.filter((h) => h.isWilting).length;
      const avgStreak =
        habitsData.length > 0
          ? habitsData.reduce((sum, h) => sum + h.streak, 0) / habitsData.length
          : 0;

      const categoryStats = {};
      habitsData.forEach((h) => {
        if (!categoryStats[h.category]) {
          categoryStats[h.category] = { count: 0, totalStreak: 0 };
        }
        categoryStats[h.category].count++;
        categoryStats[h.category].totalStreak += h.streak;
      });

      const strongestCategory = Object.entries(categoryStats).reduce(
        (max, [cat, stats]) => {
          const avg = stats.totalStreak / stats.count;
          return avg > max.avg ? { category: cat, avg } : max;
        },
        { category: "None", avg: 0 }
      );

      setAiInsight({
        bloomingCount,
        wiltingCount,
        avgStreak: avgStreak.toFixed(1),
        strongestCategory: strongestCategory.category,
        totalHabits: habitsData.length,
        gardenHealth: gardenHealthData?.overall_score || 0,
        gardenStatus: gardenHealthData?.status || "needs_care",
        gardenDescription:
          gardenHealthData?.description || "Keep working on your habits!",
      });
    } catch (error) {
      console.error("Error generating AI insight:", error);
    }
  };

  const categories = [
    "All",
    ...new Set(habits.map((h) => h.category).filter(Boolean)),
  ];

  const filteredHabits =
    activeFilter === "All"
      ? habits
      : habits.filter((h) => h.category === activeFilter);

  const gardenHealth =
    habits.length > 0
      ? Math.round(
          (habits.reduce((acc, h) => acc + h.healthScore, 0) / habits.length) *
            100
        )
      : 0;

  const bloomingCount = habits.filter(
    (h) => h.growthLevel >= 3 && !h.isWilting
  ).length;
  const wiltingCount = habits.filter((h) => h.isWilting).length;
  const activeHabitsCount = habits.filter((h) => h.growthLevel > 0).length;

  if (loading) {
    return (
      <AppLayout
        title="🌱 MindGarden"
        subtitle="Visual habit ecosystem - watch your habits grow"
        user={user}
        onLogout={onLogout}
      >
        <Container maxWidth="xl" sx={{ py: 4 }}>
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
        </Container>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="🌱 MindGarden"
      subtitle="Visual habit ecosystem - watch your habits grow"
      user={user}
      onLogout={onLogout}
    >
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={3}
            sx={{
              mb: 4,
              p: 3,
              background:
                "linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(139, 195, 74, 0.12) 100%)",
              borderRadius: 2,
              border: "1px solid rgba(76, 175, 80, 0.2)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography
                  variant="h4"
                  fontWeight={600}
                  sx={{
                    background:
                      "linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    mb: 1,
                  }}
                >
                  🌱 MindGarden
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ maxWidth: 500 }}
                >
                  Each plant represents a habit. Growth and color reflect your
                  consistency over the last 14 days.
                </Typography>
              </Box>

              <Stack direction="row" spacing={2}>
                <Button
                  variant={viewMode === "list" ? "contained" : "outlined"}
                  startIcon={<ListIcon />}
                  onClick={() =>
                    setViewMode(viewMode === "garden" ? "list" : "garden")
                  }
                  size="medium"
                >
                  {viewMode === "garden" ? "View as List" : "View Garden"}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={fetchGardenData}
                  disabled={loading}
                  sx={{
                    background:
                      "linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #45a049 0%, #7cb342 100%)",
                    },
                  }}
                >
                  Refresh Garden
                </Button>
              </Stack>
            </Box>
          </Paper>
        </motion.div>

        {/* Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Paper
            sx={{
              mb: 3,
              p: 3,
              border: "1px solid rgba(76, 175, 80, 0.1)",
              background: "rgba(76, 175, 80, 0.02)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{ display: "flex", alignItems: "center" }}
              >
                🔍 Filter by Category
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1.5}>
                {categories.map((cat) => (
                  <Chip
                    key={cat}
                    label={cat}
                    variant={activeFilter === cat ? "filled" : "outlined"}
                    color={activeFilter === cat ? "primary" : "default"}
                    onClick={() => setActiveFilter(cat)}
                    size="medium"
                    sx={{
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: 2,
                      },
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Paper>
        </motion.div>

        {/* Garden View Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Paper
            sx={{
              mb: 4,
              p: 4,
              minHeight: 600,
              background:
                "linear-gradient(135deg, rgba(76, 175, 80, 0.02) 0%, rgba(139, 195, 74, 0.05) 100%)",
              border: "1px solid rgba(76, 175, 80, 0.1)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography
                variant="h5"
                fontWeight={600}
                sx={{ display: "flex", alignItems: "center" }}
              >
                🌿 Garden View
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Filter:{" "}
                <Chip label={activeFilter} size="small" color="primary" />
              </Typography>
            </Box>

            {/* Garden grid */}
            <Box
              sx={{
                mt: 3,
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, 1fr)",
                  sm: "repeat(3, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: 3,
                minHeight: 400,
              }}
            >
              {filteredHabits.map((habit, index) => (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                >
                  <GardenPlot habit={habit} />
                </motion.div>
              ))}

              {/* Empty plots */}
              {filteredHabits.length < 8 &&
                Array.from({ length: 8 - filteredHabits.length }).map(
                  (_, idx) => (
                    <motion.div
                      key={`empty-${idx}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.5,
                        delay: 0.1 * (filteredHabits.length + idx),
                      }}
                    >
                      <Paper
                        sx={{
                          p: 3,
                          minHeight: 140,
                          borderRadius: 3,
                          border: "2px dashed",
                          borderColor: "rgba(139, 195, 74, 0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background:
                            "linear-gradient(135deg, rgba(139, 195, 74, 0.02) 0%, rgba(76, 175, 80, 0.05) 100%)",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            borderColor: "rgba(139, 195, 74, 0.6)",
                            background:
                              "linear-gradient(135deg, rgba(139, 195, 74, 0.05) 0%, rgba(76, 175, 80, 0.08) 100%)",
                          },
                        }}
                      >
                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="h4" sx={{ mb: 1, opacity: 0.3 }}>
                            🌰
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={500}
                          >
                            Empty plot — add a habit to plant here
                          </Typography>
                        </Box>
                      </Paper>
                    </motion.div>
                  )
                )}
            </Box>
          </Paper>
        </motion.div>

        {/* AI Insight Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Paper
            sx={{
              p: 4,
              background:
                "linear-gradient(135deg, rgba(103, 58, 183, 0.08) 0%, rgba(63, 81, 181, 0.12) 100%)",
              border: "1px solid rgba(103, 58, 183, 0.2)",
            }}
          >
            <Typography
              variant="h5"
              fontWeight={600}
              gutterBottom
              sx={{ display: "flex", alignItems: "center" }}
            >
              🧠 AI Garden Insight
            </Typography>

            <Box sx={{ mt: 3 }}>
              <Typography
                variant="body1"
                sx={{ mb: 2, fontSize: "1.1rem", lineHeight: 1.6 }}
              >
                Your MindGarden is{" "}
                <strong>
                  {gardenHealth >= 80
                    ? "thriving"
                    : gardenHealth >= 60
                    ? "healthy"
                    : gardenHealth >= 40
                    ? "moderately healthy"
                    : "needs attention"}
                </strong>{" "}
                with {bloomingCount} thriving habits out of {habits.length}{" "}
                total plants. 🌿
              </Typography>

              <Stack spacing={1.5} sx={{ mt: 2 }}>
                {bloomingCount > 0 && (
                  <Typography
                    variant="body2"
                    sx={{ display: "flex", alignItems: "flex-start" }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        bgcolor: "success.main",
                        borderRadius: "50%",
                        mt: 0.75,
                        mr: 1.5,
                        flexShrink: 0,
                      }}
                    />
                    <span>
                      <strong>{bloomingCount} habits are thriving</strong> with
                      streaks above 7 days
                      {aiInsight?.strongestCategory &&
                        ` - your ${aiInsight.strongestCategory} habits are particularly strong`}
                      .
                    </span>
                  </Typography>
                )}

                <Typography
                  variant="body2"
                  sx={{ display: "flex", alignItems: "flex-start" }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      bgcolor: wiltingCount > 0 ? "error.main" : "success.main",
                      borderRadius: "50%",
                      mt: 0.75,
                      mr: 1.5,
                      flexShrink: 0,
                    }}
                  />
                  <span>
                    {wiltingCount > 0
                      ? `${wiltingCount} ${
                          wiltingCount === 1 ? "habit is" : "habits are"
                        } wilting — try revisiting them with smaller, easier versions.`
                      : "No habits are currently wilting — excellent balance maintenance!"}
                  </span>
                </Typography>

                {aiInsight?.avgStreak && (
                  <Typography
                    variant="body2"
                    sx={{ display: "flex", alignItems: "flex-start" }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        bgcolor: "info.main",
                        borderRadius: "50%",
                        mt: 0.75,
                        mr: 1.5,
                        flexShrink: 0,
                      }}
                    />
                    <span>
                      <strong>Average streak:</strong> {aiInsight.avgStreak}{" "}
                      days across all habits.
                    </span>
                  </Typography>
                )}

                {habits.length > 0 && (
                  <Typography
                    variant="body2"
                    sx={{ display: "flex", alignItems: "flex-start" }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        bgcolor: "warning.main",
                        borderRadius: "50%",
                        mt: 0.75,
                        mr: 1.5,
                        flexShrink: 0,
                      }}
                    />
                    <span>
                      <strong>Recommendation:</strong>{" "}
                      {wiltingCount > 0
                        ? "Focus on reviving wilting habits with smaller commitments."
                        : bloomingCount < habits.length / 2
                        ? "Maintain consistency to help growing habits thrive."
                        : "Great work! Consider adding new habits to expand your garden."}
                    </span>
                  </Typography>
                )}
              </Stack>

              {habits.length === 0 ? (
                <Box
                  sx={{
                    mt: 3,
                    p: 3,
                    textAlign: "center",
                    bgcolor: "rgba(103, 58, 183, 0.05)",
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    🌱 Your garden is empty. Create your first habit to plant a
                    seed!
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    bgcolor: "rgba(103, 58, 183, 0.1)",
                    borderRadius: 2,
                    border: "1px solid rgba(103, 58, 183, 0.2)",
                  }}
                >
                  <Typography
                    variant="caption"
                    color="primary.dark"
                    fontWeight={600}
                  >
                    🤖 <strong>AI Analysis:</strong> Based on current streaks,
                    consistency patterns, and habit performance • Refreshed on
                    demand
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </AppLayout>
  );
};

/* ========== Helper components ========== */

function GardenPlot({ habit }) {
  const { bg, label, shadowColor, plantProgress } = getPlantVisual(habit);

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {habit.name}
          </Typography>
          <Typography variant="caption">
            Streak: {habit.streak} days • Health:{" "}
            {Math.round(habit.healthScore * 100)}%
          </Typography>
          <br />
          <Typography variant="caption">Category: {habit.category}</Typography>
        </Box>
      }
      arrow
    >
      <Paper
        sx={{
          p: 3,
          minHeight: 160,
          borderRadius: 3,
          background: bg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          border: "1px solid rgba(255,255,255,0.2)",
          cursor: "pointer",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-8px) scale(1.02)",
            boxShadow: `0 12px 24px ${shadowColor}`,
            "& .plant-container": {
              transform: "scale(1.1)",
            },
          },
        }}
      >
        {/* SVG Plant */}
        <Box
          className="plant-container"
          sx={{
            width: 80,
            height: 100,
            mb: 1,
            transition: "transform 0.3s ease",
            filter: habit.isWilting ? "grayscale(0.4) brightness(0.8)" : "none",
            animation:
              habit.growthLevel >= 2
                ? "breathe 4s ease-in-out infinite"
                : "none",
            "@keyframes breathe": {
              "0%, 100%": {
                transform: "scale(1)",
                filter: habit.isWilting
                  ? "grayscale(0.4) brightness(0.8)"
                  : "brightness(1)",
              },
              "50%": {
                transform: "scale(1.02)",
                filter: habit.isWilting
                  ? "grayscale(0.4) brightness(0.8)"
                  : "brightness(1.1)",
              },
            },
          }}
        >
          <PlantFillPremium progress={plantProgress} />
        </Box>

        <Typography variant="body1" fontWeight={700} sx={{ mb: 0.5 }}>
          {habit.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          {label}
        </Typography>

        {/* Health bar */}
        <Box sx={{ width: "80%", mt: 1 }}>
          <LinearProgress
            variant="determinate"
            value={habit.healthScore * 100}
            sx={{
              height: 4,
              borderRadius: 2,
              backgroundColor: "rgba(255,255,255,0.2)",
              "& .MuiLinearProgress-bar": {
                backgroundColor:
                  habit.healthScore >= 0.8
                    ? "#4caf50"
                    : habit.healthScore >= 0.6
                    ? "#ff9800"
                    : "#f44336",
                borderRadius: 2,
              },
            }}
          />
        </Box>
      </Paper>
    </Tooltip>
  );
}

function getPlantVisual(habit) {
  if (habit.isWilting) {
    return {
      bg: "linear-gradient(135deg, rgba(255,183,77,0.12) 0%, rgba(244,67,54,0.18) 100%)",
      label: "Wilting • needs attention",
      shadowColor: "rgba(244, 67, 54, 0.3)",
      plantProgress: Math.max(0.1, habit.healthScore * 0.5), // Reduced progress for wilting
    };
  }

  switch (habit.growthLevel) {
    case 0:
      return {
        bg: "linear-gradient(135deg, rgba(144,202,249,0.08) 0%, rgba(3,169,244,0.15) 100%)",
        label: "Dormant habit",
        shadowColor: "rgba(3, 169, 244, 0.2)",
        plantProgress: 0.1, // Minimal growth for dormant
      };
    case 1:
      return {
        bg: "linear-gradient(135deg, rgba(200,230,201,0.15) 0%, rgba(129,199,132,0.22) 100%)",
        label: `New sprout • ${habit.streak} day${
          habit.streak !== 1 ? "s" : ""
        }`,
        shadowColor: "rgba(129, 199, 132, 0.3)",
        plantProgress: 0.3, // Early growth
      };
    case 2:
      return {
        bg: "linear-gradient(135deg, rgba(174,213,129,0.18) 0%, rgba(139,195,74,0.25) 100%)",
        label: `Growing strong • ${habit.streak} days`,
        shadowColor: "rgba(139, 195, 74, 0.3)",
        plantProgress: 0.6, // Good growth
      };
    case 3:
    default:
      return {
        bg: "linear-gradient(135deg, rgba(129,199,132,0.22) 0%, rgba(56,142,60,0.30) 100%)",
        label: `Thriving habit • ${habit.streak} days`,
        shadowColor: "rgba(56, 142, 60, 0.4)",
        plantProgress: Math.min(1.0, habit.healthScore), // Full growth based on health
      };
  }
}

function LegendRow({ icon, label, desc }) {
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Typography sx={{ fontSize: 22, minWidth: 30 }}>{icon}</Typography>
      <Box>
        <Typography variant="body2" fontWeight={600}>
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {desc}
        </Typography>
      </Box>
    </Stack>
  );
}

export default Garden;
