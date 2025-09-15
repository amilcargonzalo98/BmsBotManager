import React from 'react';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import GroupsIcon from '@mui/icons-material/Groups';
import DevicesIcon from '@mui/icons-material/Devices';
import ChatIcon from '@mui/icons-material/Chat';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AlarmIcon from '@mui/icons-material/NotificationsActive';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { NavLink } from 'react-router-dom';

const drawerWidth = 240;
export default function Sidebar() {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Toolbar />
      <List>
        <ListItemButton component={NavLink} to="/usuarios" activeClassName="Mui-selected" exact>
          <ListItemIcon><PeopleIcon /></ListItemIcon>
          <ListItemText primary="Usuarios" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/grupos" activeClassName="Mui-selected" exact>
          <ListItemIcon><GroupsIcon /></ListItemIcon>
          <ListItemText primary="Grupos" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/clientes" activeClassName="Mui-selected" exact>
          <ListItemIcon><DevicesIcon /></ListItemIcon>
          <ListItemText primary="Clientes" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/puntos" activeClassName="Mui-selected" exact>
          <ListItemIcon><StarIcon /></ListItemIcon>
          <ListItemText primary="Puntos" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/alarmas" activeClassName="Mui-selected" exact>
          <ListItemIcon><AlarmIcon /></ListItemIcon>
          <ListItemText primary="Alarmas" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/tendencias" activeClassName="Mui-selected" exact>
          <ListItemIcon><ShowChartIcon /></ListItemIcon>
          <ListItemText primary="Tendencias" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/twilio" activeClassName="Mui-selected" exact>
          <ListItemIcon><ChatIcon /></ListItemIcon>
          <ListItemText primary="Twilio" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/whatsapp" activeClassName="Mui-selected" exact>
          <ListItemIcon><WhatsAppIcon /></ListItemIcon>
          <ListItemText primary="WhatsApp" />
        </ListItemButton>
      </List>
    </Drawer>
  );
}