import { Box, Grid, Tooltip, Typography } from "@mui/material";
import { motion } from "framer-motion";

const PlantStage = ({ habit, gridPosition }) => {
  const getPlantEmoji = (growth, streak) => {
    switch (growth) {
      case "seedling":
        return "🌱";
      case "growing":
        return streak > 5 ? "🌿" : "🌱";
      case "blooming":
        return streak > 10 ? "🌸" : "🌿";
      case "spring":
        return streak > 15 ? "🌺" : "🌸";
      default:
        return "🌱";
    }
  };

  const getGrowthColor = (growth, completedToday) => {
    if (!completedToday) return "#cccccc";

    switch (growth) {
      case "seedling":
        return "#8bc34a";
      case "growing":
        return "#4caf50";
      case "blooming":
        return "#e91e63";
      case "spring":
        return "#9c27b0";
      default:
        return "#8bc34a";
    }
  };

  const getBackgroundSeason = (growth) => {
    switch (growth) {
      case "seedling":
        return "radial-gradient(circle, #f1f8e9 0%, #e8f5e8 100%)";
      case "growing":
        return "radial-gradient(circle, #e8f5e8 0%, #c8e6c8 100%)";
      case "blooming":
        return "radial-gradient(circle, #fce4ec 0%, #f8bbd9 100%)";
      case "spring":
        return "radial-gradient(circle, #f3e5f5 0%, #e1bee7 100%)";
      default:
        return "radial-gradient(circle, #f5f5f5 0%, #eeeeee 100%)";
    }
  };

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="subtitle2" fontWeight="bold">
            {habit.name}
          </Typography>
          <Typography variant="body2">Streak: {habit.streak} days</Typography>
          <Typography variant="body2">
            Status: {habit.completedToday ? "✅ Completed today" : "⏳ Pending"}
          </Typography>
        </Box>
      }
      arrow
    >
      <motion.div
        whileHover={{
          scale: 1.1,
          rotate: [0, -5, 5, -5, 0],
          transition: { duration: 0.5 },
        }}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          duration: 0.6,
          delay: gridPosition * 0.1,
          type: "spring",
          stiffness: 200,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: getBackgroundSeason(habit.growth),
            border: `3px solid ${getGrowthColor(
              habit.growth,
              habit.completedToday
            )}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            position: "relative",
            boxShadow: habit.completedToday
              ? `0 4px 20px ${getGrowthColor(
                  habit.growth,
                  habit.completedToday
                )}40`
              : "0 2px 10px rgba(0,0,0,0.1)",
            "&:hover": {
              boxShadow: `0 6px 25px ${getGrowthColor(
                habit.growth,
                habit.completedToday
              )}60`,
            },
            transition: "box-shadow 0.3s ease",
          }}
        >
          <Typography
            variant="h3"
            sx={{ filter: habit.completedToday ? "none" : "grayscale(70%)" }}
          >
            {getPlantEmoji(habit.growth, habit.streak)}
          </Typography>

          {/* Streak indicator */}
          <Box
            sx={{
              position: "absolute",
              bottom: -8,
              right: -8,
              backgroundColor: getGrowthColor(
                habit.growth,
                habit.completedToday
              ),
              color: "white",
              borderRadius: "50%",
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: "bold",
              border: "2px solid white",
            }}
          >
            {habit.streak}
          </Box>
        </Box>
      </motion.div>
    </Tooltip>
  );
};

const GardenVisualization = ({ habits = [] }) => {
  // Create a 4x3 grid for the garden
  const gardenGrid = Array(12).fill(null);

  // Fill the grid with habits (first few positions)
  habits.forEach((habit, index) => {
    if (index < gardenGrid.length) {
      gardenGrid[index] = habit;
    }
  });

  const getSeasonalBackground = () => {
    const completedHabits = habits.filter((h) => h.completedToday).length;
    const totalHabits = habits.length;
    const completionRate = totalHabits > 0 ? completedHabits / totalHabits : 0;

    if (completionRate >= 0.8) {
      return "linear-gradient(135deg, #e8f5e8 0%, #c8e6c8 50%, #a5d6a7 100%)"; // Spring
    } else if (completionRate >= 0.5) {
      return "linear-gradient(135deg, #f1f8e9 0%, #e8f5e8 50%, #dcedc8 100%)"; // Growing
    } else if (completionRate >= 0.2) {
      return "linear-gradient(135deg, #f9fbe7 0%, #f1f8e9 50%, #e8f5e8 100%)"; // Early spring
    } else {
      return "linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #eeeeee 100%)"; // Winter
    }
  };

  const getWeatherEffect = () => {
    const completedHabits = habits.filter((h) => h.completedToday).length;
    const totalHabits = habits.length;
    const completionRate = totalHabits > 0 ? completedHabits / totalHabits : 0;

    if (completionRate >= 0.8) return "☀️";
    if (completionRate >= 0.5) return "⛅";
    if (completionRate >= 0.2) return "☁️";
    return "❄️";
  };

  return (
    <Box
      sx={{
        height: "400px",
        background: getSeasonalBackground(),
        borderRadius: 3,
        p: 3,
        position: "relative",
        overflow: "hidden",
        border: "1px solid rgba(76, 175, 80, 0.2)",
      }}
    >
      {/* Weather indicator */}
      <Box
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          fontSize: "2rem",
        }}
      >
        {getWeatherEffect()}
      </Box>

      {/* Garden title */}
      <Typography
        variant="h6"
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          color: "primary.dark",
          fontWeight: 600,
        }}
      >
        🌿 Your Habit Garden
      </Typography>

      {/* Garden Grid */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          mt: 2,
        }}
      >
        <Grid container spacing={2} sx={{ maxWidth: 400 }}>
          {gardenGrid.map((habit, index) => (
            <Grid item xs={3} key={index}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: 80,
                }}
              >
                {habit ? (
                  <PlantStage habit={habit} gridPosition={index} />
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        border: "2px dashed #cccccc",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: 0.3,
                      }}
                    >
                      <Typography variant="h4" color="text.disabled">
                        🌰
                      </Typography>
                    </Box>
                  </motion.div>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Ground line */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 20,
          background: "linear-gradient(to top, #8bc34a 0%, transparent 100%)",
          opacity: 0.3,
        }}
      />
    </Box>
  );
};

export default GardenVisualization;
