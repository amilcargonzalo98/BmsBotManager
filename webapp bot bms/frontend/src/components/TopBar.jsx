import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useAuth } from '../context/AuthContext';
import { fetchAlarms } from '../services/alarms';

export default function TopBar() {
  const { logout } = useAuth();
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [alarms, setAlarms] = useState([]);
  const [loadingAlarms, setLoadingAlarms] = useState(false);
  const [alarmsError, setAlarmsError] = useState('');
  const isMounted = useRef(false);

  const activeAlarms = useMemo(
    () => alarms.filter((alarm) => alarm.active),
    [alarms],
  );

  const activeAlarmsCount = activeAlarms.length;

  const getAlarmTargetLabel = (alarm) => {
    if ((alarm.monitorType ?? 'point') === 'clientConnection') {
      let clientName = '';
      if (alarm.clientId && typeof alarm.clientId === 'object') {
        clientName = alarm.clientId.clientName || alarm.clientId.name || '';
      } else if (typeof alarm.clientId === 'string') {
        clientName = alarm.clientId;
      }
      return `${clientName || 'Cliente'} — Client connection status`;
    }
    return alarm.pointId?.pointName || alarm.pointId || 'Sin asignar';
  };

  const formatCondition = (alarm) => {
    const suffix = (alarm.monitorType ?? 'point') === 'clientConnection' ? ' s' : '';
    switch (alarm.conditionType) {
      case 'gt':
        return `>= ${alarm.threshold ?? '-'}${suffix}`;
      case 'lt':
        return `<= ${alarm.threshold ?? '-'}${suffix}`;
      case 'true':
        return '== true';
      case 'false':
        return '== false';
      default:
        return 'Condición desconocida';
    }
  };

  const loadAlarms = useCallback(async () => {
    if (!isMounted.current) {
      return;
    }

    setLoadingAlarms(true);
    try {
      const { data } = await fetchAlarms();
      if (!isMounted.current) {
        return;
      }

      setAlarms(data);
      setAlarmsError('');
    } catch {
      if (!isMounted.current) {
        return;
      }

      setAlarms([]);
      setAlarmsError('No se pudieron cargar las alarmas.');
    } finally {
      if (isMounted.current) {
        setLoadingAlarms(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    loadAlarms();
    const intervalId = setInterval(loadAlarms, 30000);

    return () => {
      isMounted.current = false;
      clearInterval(intervalId);
    };
  }, [loadAlarms]);

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
  };

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
    loadAlarms();
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
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
        <Tooltip title="Alarmas">
          <IconButton
            color="inherit"
            onClick={handleNotificationsOpen}
            aria-controls={notificationsAnchorEl ? 'notifications-menu' : undefined}
            aria-haspopup="true"
          >
            <Badge badgeContent={activeAlarmsCount} color={activeAlarmsCount > 0 ? 'error' : 'default'} max={99} showZero>
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        <IconButton
          color="inherit"
          onClick={handleUserMenuOpen}
          aria-controls={userMenuAnchorEl ? 'user-menu' : undefined}
          aria-haspopup="true"
        >
          <AccountCircle />
        </IconButton>
        <Menu
          id="user-menu"
          anchorEl={userMenuAnchorEl}
          open={Boolean(userMenuAnchorEl)}
          onClose={handleUserMenuClose}
        >
          <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>
        </Menu>
        <Menu
          id="notifications-menu"
          anchorEl={notificationsAnchorEl}
          open={Boolean(notificationsAnchorEl)}
          onClose={handleNotificationsClose}
          MenuListProps={{
            dense: true,
            sx: { width: '100%' },
          }}
          PaperProps={{
            sx: {
              width: 320,
              maxHeight: 360,
              p: 1,
            },
          }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box sx={{ px: 1.5, py: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Alarmas
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ px: 1.5, py: 1 }}>
            {loadingAlarms ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} color="inherit" />
              </Box>
            ) : alarmsError ? (
              <Typography variant="body2" color="error" sx={{ textAlign: 'center' }}>
                {alarmsError}
              </Typography>
            ) : activeAlarms.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                Sin alarmas activas.
              </Typography>
            ) : (
              <List dense sx={{ py: 0 }}>
                {activeAlarms.map((alarm) => (
                  <ListItem key={alarm._id} alignItems="flex-start" sx={{ px: 0, py: 1 }}>
                    <ListItemText
                      primary={(
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {alarm.alarmName}
                        </Typography>
                      )}
                      secondary={(
                        <>
                          <Typography variant="body2" color="text.secondary">
                            Punto: {getAlarmTargetLabel(alarm)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Grupo: {alarm.groupId?.groupName || alarm.groupId || 'Sin asignar'}
                          </Typography>
                          <Typography
                            variant="caption"
                            color={alarm.active ? 'error.main' : 'text.secondary'}
                            sx={{ mt: 0.5, display: 'block' }}
                          >
                            {alarm.active ? 'Activa' : 'Inactiva'} — {formatCondition(alarm)}
                          </Typography>
                        </>
                      )}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
