import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Chip,
  Stack,
  Card,
  CardContent,
} from "@mui/material";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import LocalFloristIcon from "@mui/icons-material/LocalFlorist";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import InsightsIcon from "@mui/icons-material/Insights";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PsychologyIcon from "@mui/icons-material/Psychology";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import SpeedIcon from "@mui/icons-material/Speed";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const FeatureCard = ({ icon, title, description, gradient }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    whileHover={{ scale: 1.03, y: -8 }}
  >
    <Card
      elevation={0}
      sx={{
        height: "100%",
        background:
          gradient || "linear-gradient(135deg, #ffffff 0%, #f8fff8 100%)",
        border: "1px solid rgba(76, 175, 80, 0.15)",
        borderRadius: 3,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: "0 12px 40px rgba(76, 175, 80, 0.15)",
          border: "1px solid rgba(76, 175, 80, 0.3)",
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "linear-gradient(90deg, #4caf50 0%, #81c784 100%)",
        },
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 2,
            background: "linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 3,
            color: "white",
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" fontWeight="700" gutterBottom sx={{ mb: 2 }}>
          {title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ lineHeight: 1.7 }}
        >
          {description}
        </Typography>
      </CardContent>
    </Card>
  </motion.div>
);

const Landing = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f0f7f0 0%, #ffffff 50%, #f8fff8 100%)",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: "-50%",
          right: "-10%",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(76, 175, 80, 0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: "-30%",
          left: "-10%",
          width: "500px",
          height: "500px",
          background:
            "radial-gradient(circle, rgba(102, 187, 106, 0.06) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        },
      }}
    >
      {/* Navigation Bar */}
      <Box
        sx={{
          py: 2,
          px: 3,
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(76, 175, 80, 0.1)",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LocalFloristIcon sx={{ fontSize: 32, color: "primary.main" }} />
              <Typography variant="h5" fontWeight="800" color="primary.main">
                MindGarden AI
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                component={Link}
                to="/login"
                variant="text"
                sx={{
                  fontWeight: 600,
                  color: "text.primary",
                  textTransform: "none",
                  px: 3,
                }}
              >
                Sign In
              </Button>
              <Button
                component={Link}
                to="/signup"
                variant="contained"
                sx={{
                  fontWeight: 600,
                  textTransform: "none",
                  px: 3,
                  background:
                    "linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)",
                  boxShadow: "0 3px 15px rgba(76, 175, 80, 0.3)",
                }}
              >
                Get Started
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            gap: 6,
            minHeight: "85vh",
            py: 8,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Box sx={{ mb: 4 }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Chip
                    icon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />}
                    label="AI-Powered Productivity"
                    sx={{
                      mb: 3,
                      background:
                        "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
                      border: "1px solid rgba(76, 175, 80, 0.3)",
                      fontWeight: 600,
                      px: 1,
                    }}
                  />
                </motion.div>

                <Typography
                  variant="h2"
                  component="h1"
                  fontWeight="900"
                  sx={{
                    mb: 3,
                    background:
                      "linear-gradient(135deg, #2e7d32 0%, #4caf50 50%, #66bb6a 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    lineHeight: 1.2,
                    fontSize: { xs: "2.5rem", md: "3.5rem" },
                  }}
                >
                  Grow Your Habits Into a Beautiful Garden
                </Typography>

                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{
                    mb: 4,
                    fontWeight: 400,
                    lineHeight: 1.8,
                    fontSize: "1.15rem",
                  }}
                >
                  Transform your daily habits, tasks, and moods into a thriving
                  digital garden. Watch your productivity bloom with AI-powered
                  insights that adapt to your lifestyle.
                </Typography>

                <Stack spacing={2} sx={{ mb: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CheckCircleIcon
                      sx={{ color: "success.main", fontSize: 24 }}
                    />
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      fontWeight="500"
                    >
                      AI-powered daily planning & scheduling
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CheckCircleIcon
                      sx={{ color: "success.main", fontSize: 24 }}
                    />
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      fontWeight="500"
                    >
                      Visual habit tracking with garden metaphor
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CheckCircleIcon
                      sx={{ color: "success.main", fontSize: 24 }}
                    />
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      fontWeight="500"
                    >
                      Smart analytics & personalized insights
                    </Typography>
                  </Box>
                </Stack>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    component={Link}
                    to="/signup"
                    sx={{
                      py: 2,
                      px: 5,
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      textTransform: "none",
                      background:
                        "linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)",
                      boxShadow: "0 6px 25px rgba(76, 175, 80, 0.35)",
                      borderRadius: 2,
                      "&:hover": {
                        background:
                          "linear-gradient(45deg, #388e3c 30%, #4caf50 90%)",
                        boxShadow: "0 8px 30px rgba(76, 175, 80, 0.45)",
                        transform: "translateY(-2px)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    Start Your Garden Free
                  </Button>
                </Box>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 2 }}
                >
                  🎉 Free forever. No credit card required.
                </Typography>
              </Box>
            </motion.div>
          </Box>

          <Box sx={{ flex: 1 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <Box
                sx={{
                  position: "relative",
                  textAlign: "center",
                  p: { xs: 4, md: 6 },
                  background: "rgba(255, 255, 255, 0.7)",
                  backdropFilter: "blur(20px)",
                  borderRadius: 4,
                  border: "1px solid rgba(76, 175, 80, 0.2)",
                  boxShadow: "0 20px 60px rgba(76, 175, 80, 0.15)",
                }}
              >
                {/* Animated Garden Visualization */}
                <Box sx={{ position: "relative", mb: 4 }}>
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, 0, -5, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Typography variant="h1" sx={{ fontSize: "8rem", mb: 2 }}>
                      🌸
                    </Typography>
                  </motion.div>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                    >
                      <Typography variant="h3">🌱</Typography>
                    </motion.div>
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    >
                      <Typography variant="h3">🌿</Typography>
                    </motion.div>
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                    >
                      <Typography variant="h3">🌻</Typography>
                    </motion.div>
                  </Box>
                </Box>

                <Typography
                  variant="h5"
                  fontWeight="700"
                  sx={{ mb: 2, color: "primary.dark" }}
                >
                  Your Personal Growth Garden
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ lineHeight: 1.7 }}
                >
                  Watch your habits transform into a beautiful, flourishing
                  garden. Each completed task, habit, and mood entry helps your
                  garden grow stronger and more vibrant.
                </Typography>

                {/* Stats Preview */}
                <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        background:
                          "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
                        borderRadius: 2,
                      }}
                    >
                      <Typography
                        variant="h4"
                        fontWeight="700"
                        color="success.main"
                      >
                        98%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Success Rate
                      </Typography>
                    </Paper>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        background:
                          "linear-gradient(135deg, #fff9c4 0%, #fff59d 100%)",
                        borderRadius: 2,
                      }}
                    >
                      <Typography
                        variant="h4"
                        fontWeight="700"
                        color="warning.dark"
                      >
                        2.5x
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Productivity
                      </Typography>
                    </Paper>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        background:
                          "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                        borderRadius: 2,
                      }}
                    >
                      <Typography
                        variant="h4"
                        fontWeight="700"
                        color="info.main"
                      >
                        10k+
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Happy Users
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              </Box>
            </motion.div>
          </Box>
        </Box>
      </Container>

      {/* Features Section */}
      <Box
        sx={{
          background: "linear-gradient(180deg, #ffffff 0%, #f8fff8 100%)",
          py: 10,
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Box sx={{ textAlign: "center", mb: 8 }}>
              <Typography
                variant="h3"
                fontWeight="900"
                sx={{
                  mb: 2,
                  background:
                    "linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Everything You Need to Thrive
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ maxWidth: 600, mx: "auto" }}
              >
                Powerful features designed to help you build lasting habits and
                achieve your goals
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 4,
                flexWrap: "wrap",
              }}
            >
              <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(50% - 16px)", lg: "1 1 calc(25% - 24px)" } }}>
                <FeatureCard
                  icon={<LocalFloristIcon sx={{ fontSize: 32 }} />}
                  title="Garden Growth System"
                  description="Watch your digital garden flourish as you complete habits. Visual metaphors make progress tangible and motivating."
                />
              </Box>
              <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(50% - 16px)", lg: "1 1 calc(25% - 24px)" } }}>
                <FeatureCard
                  icon={<PsychologyIcon sx={{ fontSize: 32 }} />}
                  title="AI-Powered Coach"
                  description="Get personalized daily plans, smart scheduling, and adaptive recommendations based on your mood and energy."
                />
              </Box>
              <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(50% - 16px)", lg: "1 1 calc(25% - 24px)" } }}>
                <FeatureCard
                  icon={<TrendingUpIcon sx={{ fontSize: 32 }} />}
                  title="Advanced Analytics"
                  description="Track streaks, view weekly scoreboard, and analyze patterns with comprehensive insights and beautiful charts."
                />
              </Box>
              <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(50% - 16px)", lg: "1 1 calc(25% - 24px)" } }}>
                <FeatureCard
                  icon={<CalendarTodayIcon sx={{ fontSize: 32 }} />}
                  title="Smart Integration"
                  description="Seamlessly sync with Google Calendar and get AI-optimized schedules that adapt to your lifestyle."
                />
              </Box>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* How It Works Section */}
      <Box sx={{ py: 10, background: "white" }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Box sx={{ textAlign: "center", mb: 8 }}>
              <Typography
                variant="h3"
                fontWeight="900"
                sx={{
                  mb: 2,
                  background:
                    "linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                How It Works
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Start growing your productivity garden in 3 simple steps
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 4,
                alignItems: "stretch",
              }}
            >
              <Box sx={{ flex: 1 }}>
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <Card
                    elevation={0}
                    sx={{
                      p: 4,
                      background:
                        "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
                      borderRadius: 3,
                      height: "100%",
                    }}
                  >
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background:
                          "linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 3,
                      }}
                    >
                      <Typography variant="h4" fontWeight="800" color="white">
                        1
                      </Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="700" sx={{ mb: 2 }}>
                      Set Your Goals
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ lineHeight: 1.7 }}
                    >
                      Create habits, add tasks, and log your daily mood. Our AI
                      learns your patterns and preferences.
                    </Typography>
                  </Card>
                </motion.div>
              </Box>

              <Box sx={{ flex: 1 }}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Card
                    elevation={0}
                    sx={{
                      p: 4,
                      background:
                        "linear-gradient(135deg, #fff9c4 0%, #fff59d 100%)",
                      borderRadius: 3,
                      height: "100%",
                    }}
                  >
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background:
                          "linear-gradient(135deg, #ffa726 0%, #ffb74d 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 3,
                      }}
                    >
                      <Typography variant="h4" fontWeight="800" color="white">
                        2
                      </Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="700" sx={{ mb: 2 }}>
                      Get AI Guidance
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ lineHeight: 1.7 }}
                    >
                      Receive personalized daily plans, smart scheduling
                      recommendations, and adaptive insights.
                    </Typography>
                  </Card>
                </motion.div>
              </Box>

              <Box sx={{ flex: 1 }}>
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <Card
                    elevation={0}
                    sx={{
                      p: 4,
                      background:
                        "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                      borderRadius: 3,
                      height: "100%",
                    }}
                  >
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background:
                          "linear-gradient(135deg, #42a5f5 0%, #64b5f6 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 3,
                      }}
                    >
                      <Typography variant="h4" fontWeight="800" color="white">
                        3
                      </Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="700" sx={{ mb: 2 }}>
                      Watch It Grow
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ lineHeight: 1.7 }}
                    >
                      See your garden bloom with each completed task. Track
                      streaks, earn achievements, level up!
                    </Typography>
                  </Card>
                </motion.div>
              </Box>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Social Proof / Stats Section */}
      <Box
        sx={{
          py: 10,
          background: "linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)",
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 4,
              }}
            >
              <Box sx={{ flex: 1, textAlign: "center" }}>
                <Box sx={{ textAlign: "center" }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <EmojiEventsIcon
                      sx={{ fontSize: 64, color: "warning.main", mb: 2 }}
                    />
                  </motion.div>
                  <Typography
                    variant="h3"
                    fontWeight="900"
                    color="primary.main"
                  >
                    10,000+
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    fontWeight="600"
                  >
                    Active Users
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ flex: 1, textAlign: "center" }}>
                <Box sx={{ textAlign: "center" }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <SpeedIcon
                      sx={{ fontSize: 64, color: "info.main", mb: 2 }}
                    />
                  </motion.div>
                  <Typography
                    variant="h3"
                    fontWeight="900"
                    color="primary.main"
                  >
                    2.5x
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    fontWeight="600"
                  >
                    Productivity Boost
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ flex: 1, textAlign: "center" }}>
                <Box sx={{ textAlign: "center" }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <LocalFloristIcon
                      sx={{ fontSize: 64, color: "success.main", mb: 2 }}
                    />
                  </motion.div>
                  <Typography
                    variant="h3"
                    fontWeight="900"
                    color="primary.main"
                  >
                    1M+
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    fontWeight="600"
                  >
                    Habits Completed
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ flex: 1, textAlign: "center" }}>
                <Box sx={{ textAlign: "center" }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <InsightsIcon
                      sx={{ fontSize: 64, color: "secondary.main", mb: 2 }}
                    />
                  </motion.div>
                  <Typography
                    variant="h3"
                    fontWeight="900"
                    color="primary.main"
                  >
                    98%
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    fontWeight="600"
                  >
                    Satisfaction Rate
                  </Typography>
                </Box>
              </Box>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 12, background: "white" }}>
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Card
              elevation={0}
              sx={{
                p: 6,
                textAlign: "center",
                background: "linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)",
                color: "white",
                borderRadius: 4,
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: "-50%",
                  right: "-20%",
                  width: "400px",
                  height: "400px",
                  background:
                    "radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)",
                  borderRadius: "50%",
                },
              }}
            >
              <Box sx={{ position: "relative", zIndex: 1 }}>
                <Typography variant="h3" fontWeight="900" sx={{ mb: 2 }}>
                  Ready to Grow Your Garden?
                </Typography>
                <Typography variant="h6" sx={{ mb: 4, opacity: 0.95 }}>
                  Join thousands of users transforming their productivity today
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    component={Link}
                    to="/signup"
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      py: 2,
                      px: 5,
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      textTransform: "none",
                      background: "white",
                      color: "primary.main",
                      borderRadius: 2,
                      "&:hover": {
                        background: "rgba(255, 255, 255, 0.95)",
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    Get Started Free
                  </Button>
                </Box>
              </Box>
            </Card>
          </motion.div>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          py: 6,
          background: "linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)",
          color: "white",
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 4,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <LocalFloristIcon sx={{ fontSize: 32 }} />
                <Typography variant="h5" fontWeight="800">
                  MindGarden AI
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{ opacity: 0.9, lineHeight: 1.7 }}
              >
                Transform your productivity with AI-powered habit tracking and
                personalized insights.
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="700" sx={{ mb: 2 }}>
                Product
              </Typography>
              <Stack spacing={1}>
                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.9,
                    cursor: "pointer",
                    "&:hover": { opacity: 1 },
                  }}
                >
                  Features
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.9,
                    cursor: "pointer",
                    "&:hover": { opacity: 1 },
                  }}
                >
                  Pricing
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.9,
                    cursor: "pointer",
                    "&:hover": { opacity: 1 },
                  }}
                >
                  Integration
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.9,
                    cursor: "pointer",
                    "&:hover": { opacity: 1 },
                  }}
                >
                  API
                </Typography>
              </Stack>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="700" sx={{ mb: 2 }}>
                Company
              </Typography>
              <Stack spacing={1}>
                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.9,
                    cursor: "pointer",
                    "&:hover": { opacity: 1 },
                  }}
                >
                  About Us
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.9,
                    cursor: "pointer",
                    "&:hover": { opacity: 1 },
                  }}
                >
                  Blog
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.9,
                    cursor: "pointer",
                    "&:hover": { opacity: 1 },
                  }}
                >
                  Careers
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.9,
                    cursor: "pointer",
                    "&:hover": { opacity: 1 },
                  }}
                >
                  Contact
                </Typography>
              </Stack>
            </Box>
          </Box>
          <Box
            sx={{
              mt: 6,
              pt: 4,
              borderTop: "1px solid rgba(255, 255, 255, 0.2)",
              textAlign: "center",
            }}
          >
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              © 2025 MindGarden AI. Built with React, FastAPI & MongoDB. Powered
              by AI.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;
