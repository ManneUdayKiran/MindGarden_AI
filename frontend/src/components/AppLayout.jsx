import { Box } from "@mui/material";
import AppHeader from "./AppHeader";
import NavigationDrawer from "./NavigationDrawer";

const SIDEBAR_WIDTH = 240;

function AppLayout({ children, title, subtitle, user, onLogout }) {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Permanent Sidebar */}
      <NavigationDrawer onLogout={onLogout} />

      {/* Main Content Area */}
      <Box
        sx={{
          flexGrow: 1,
          backgroundColor: "background.default",
          marginLeft: `${SIDEBAR_WIDTH}px`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <AppHeader
          title={title}
          subtitle={subtitle}
          user={user}
          onLogout={onLogout}
        />

        {/* Page Content */}
        <Box sx={{ flexGrow: 1 }}>{children}</Box>
      </Box>
    </Box>
  );
}

export default AppLayout;
