import React from 'react';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import GroupsIcon from '@mui/icons-material/Groups';
import DevicesIcon from '@mui/icons-material/Devices';
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
      </List>
    </Drawer>
  );
}