import React from 'react';
import { AppBar, Toolbar, IconButton, Badge, Menu, MenuItem, Typography, Box } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useAuth } from '../context/AuthContext';

export default function TopBar() {
  const { logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleLogout = () => {
    handleClose();
    logout();
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#424242',
      }}
    >
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          FusionBMS
          <Box component="img" src="/icons/isologo-100x100.png" alt="FusionBMS" sx={{ height: 24, width: 24, ml: 1 }} />
        </Typography>
        <IconButton color="inherit">
          <Badge badgeContent={4} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        <IconButton color="inherit" onClick={handleMenu}>
          <AccountCircle />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}