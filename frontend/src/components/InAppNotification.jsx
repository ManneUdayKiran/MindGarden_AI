import { Snackbar, Alert, AlertTitle, IconButton, Box } from "@mui/material";
import { Close } from "@mui/icons-material";

const InAppNotification = ({
  open,
  onClose,
  title,
  message,
  severity = "info",
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={8000}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      sx={{ mt: 8 }}
    >
      <Alert
        severity={severity}
        onClose={onClose}
        sx={{
          minWidth: 350,
          boxShadow: 3,
          "& .MuiAlert-message": {
            width: "100%",
          },
        }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={onClose}
          >
            <Close fontSize="small" />
          </IconButton>
        }
      >
        {title && <AlertTitle sx={{ fontWeight: 600 }}>{title}</AlertTitle>}
        <Box sx={{ whiteSpace: "pre-line" }}>{message}</Box>
      </Alert>
    </Snackbar>
  );
};

export default InAppNotification;
