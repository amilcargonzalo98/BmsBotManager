// src/pages/GroupPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { fetchGroups, createGroup, deleteGroup, updateGroup } from '../services/groups';
import { fetchUsers } from '../services/users';
import { fetchPoints } from '../services/points';
import {
  Container, Typography, TextField, Button, Box,
  Paper, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Alert, FormControl, InputLabel, Select, MenuItem, Chip, Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const toId = (item) => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  if (typeof item === 'object') {
    return item._id || item.id || '';
  }
  return '';
};

export default function GroupPage() {
  const [groups, setGroups] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allPoints, setAllPoints] = useState([]);
  const [newGroup, setNewGroup] = useState({ groupName: '', description: '', users: [], points: [] });
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [editGroup, setEditGroup] = useState(null);
  const [editError, setEditError] = useState('');

  const refreshGroups = async () => {
    const { data } = await fetchGroups();
    setGroups(data);
  };

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const [groupsRes, usersRes, pointsRes] = await Promise.all([
          fetchGroups(),
          fetchUsers(),
          fetchPoints(),
        ]);
        if (!active) return;
        setGroups(groupsRes.data || []);
        setAllUsers(usersRes.data || []);
        setAllPoints(pointsRes.data || []);
      } catch (err) {
        console.error('Error cargando datos de grupos', err);
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, []);

  const userNameById = useMemo(() => {
    const map = new Map();
    allUsers.forEach((user) => {
      if (user?._id) {
        map.set(user._id, user.name || user.username || user._id);
      }
    });
    return map;
  }, [allUsers]);

  const pointLabelById = useMemo(() => {
    const map = new Map();
    allPoints.forEach((point) => {
      if (point?._id) {
        const clientName =
          typeof point.clientId === 'object' && point.clientId !== null
            ? point.clientId.clientName || point.clientId.name
            : undefined;
        const label = clientName
          ? `${point.pointName || point._id} (${clientName})`
          : point.pointName || point._id;
        map.set(point._id, label);
      }
    });
    return map;
  }, [allPoints]);

  const handleAdd = async () => {
    try {
      const payload = {
        groupName: newGroup.groupName,
        description: newGroup.description,
        users: newGroup.users,
        points: newGroup.points,
      };
      await createGroup(payload);
      await refreshGroups();
      setNewGroup({ groupName: '', description: '', users: [], points: [] });
      setError('');
    } catch (err) {
      console.error('Error al crear grupo', err);
      setError('Error al crear grupo');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGroup(deleteId);
      await refreshGroups();
    } catch (err) {
      console.error('Error al eliminar grupo', err);
      setError('Error al eliminar grupo');
    } finally {
      setDeleteId(null);
    }
  };

  const handleEditOpen = (group) => {
    setEditError('');
    setEditGroup({
      _id: group._id,
      groupName: group.groupName || '',
      description: group.description || '',
      users: Array.isArray(group.users) ? group.users.map((user) => toId(user)).filter(Boolean) : [],
      points: Array.isArray(group.points) ? group.points.map((point) => toId(point)).filter(Boolean) : [],
    });
  };

  const handleEditChange = (field, value) => {
    setEditGroup((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditClose = () => {
    setEditGroup(null);
    setEditError('');
  };

  const handleUpdate = async () => {
    try {
      await updateGroup(editGroup._id, {
        groupName: editGroup.groupName,
        description: editGroup.description,
        users: editGroup.users,
        points: editGroup.points,
      });
      await refreshGroups();
      handleEditClose();
    } catch (err) {
      console.error('Error al actualizar grupo', err);
      setEditError('Error al actualizar grupo');
    }
  };

  const renderGroupUsers = (group) => {
    if (!Array.isArray(group.users) || group.users.length === 0) {
      return 'Sin usuarios';
    }
    const names = group.users.map((user) => {
      if (typeof user === 'string') {
        return userNameById.get(user) || user;
      }
      return user?.name || user?.username || userNameById.get(user?._id) || user?._id || 'Desconocido';
    });
    return names.join(', ');
  };

  const renderGroupPoints = (group) => {
    if (!Array.isArray(group.points) || group.points.length === 0) {
      return 'Sin puntos';
    }
    const labels = group.points.map((point) => {
      if (typeof point === 'string') {
        return pointLabelById.get(point) || point;
      }
      const labelBase = point?.pointName || point?._id;
      const client = point?.clientId;
      if (client && typeof client === 'object') {
        const clientName = client.clientName || client.name;
        return clientName ? `${labelBase} (${clientName})` : labelBase;
      }
      return pointLabelById.get(point?._id) || labelBase || 'Desconocido';
    });
    return labels.join(', ');
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Grupos</Typography>
      <Paper sx={{ width: '100%', overflowX: 'auto' }}>
        <Table sx={{ minWidth: 960 }}>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Usuarios</TableCell>
              <TableCell>Puntos</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map((g) => (
              <TableRow key={g._id}>
                <TableCell>{g.groupName}</TableCell>
                <TableCell>{g.description}</TableCell>
                <TableCell>{renderGroupUsers(g)}</TableCell>
                <TableCell>{renderGroupPoints(g)}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleEditOpen(g)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => setDeleteId(g._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">Agregar Grupo</Typography>
        {error && <Alert severity="warning" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
          <TextField
            label="Nombre"
            value={newGroup.groupName}
            onChange={(e) => setNewGroup((n) => ({ ...n, groupName: e.target.value }))}
          />
          <TextField
            label="Descripción"
            value={newGroup.description}
            onChange={(e) => setNewGroup((n) => ({ ...n, description: e.target.value }))}
          />
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel id="new-group-users-label">Usuarios</InputLabel>
            <Select
              labelId="new-group-users-label"
              multiple
              value={newGroup.users}
              label="Usuarios"
              onChange={(e) => setNewGroup((prev) => ({ ...prev, users: e.target.value }))}
              renderValue={(selected) => (
                <Stack direction="row" gap={1} flexWrap="wrap">
                  {selected.map((id) => (
                    <Chip key={id} size="small" label={userNameById.get(id) || id} />
                  ))}
                </Stack>
              )}
            >
              {allUsers.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.name || user.username || user._id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 240 }}>
            <InputLabel id="new-group-points-label">Puntos</InputLabel>
            <Select
              labelId="new-group-points-label"
              multiple
              value={newGroup.points}
              label="Puntos"
              onChange={(e) => setNewGroup((prev) => ({ ...prev, points: e.target.value }))}
              renderValue={(selected) => (
                <Stack direction="row" gap={1} flexWrap="wrap">
                  {selected.map((id) => (
                    <Chip key={id} size="small" label={pointLabelById.get(id) || id} />
                  ))}
                </Stack>
              )}
            >
              {allPoints.map((point) => (
                <MenuItem key={point._id} value={point._id}>
                  {pointLabelById.get(point._id)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleAdd}>Agregar</Button>
        </Box>
      </Box>
      <Dialog
        open={Boolean(editGroup)}
        onClose={handleEditClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Editar grupo</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {editError && <Alert severity="error">{editError}</Alert>}
          <TextField
            label="Nombre"
            value={editGroup?.groupName || ''}
            onChange={(e) => handleEditChange('groupName', e.target.value)}
          />
          <TextField
            label="Descripción"
            value={editGroup?.description || ''}
            onChange={(e) => handleEditChange('description', e.target.value)}
          />
          <FormControl>
            <InputLabel id="edit-group-users-label">Usuarios</InputLabel>
            <Select
              labelId="edit-group-users-label"
              label="Usuarios"
              multiple
              value={editGroup?.users || []}
              onChange={(e) => handleEditChange('users', e.target.value)}
              renderValue={(selected) => (
                <Stack direction="row" gap={1} flexWrap="wrap">
                  {selected.map((id) => (
                    <Chip key={id} size="small" label={userNameById.get(id) || id} />
                  ))}
                </Stack>
              )}
            >
              {allUsers.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.name || user.username || user._id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel id="edit-group-points-label">Puntos</InputLabel>
            <Select
              labelId="edit-group-points-label"
              label="Puntos"
              multiple
              value={editGroup?.points || []}
              onChange={(e) => handleEditChange('points', e.target.value)}
              renderValue={(selected) => (
                <Stack direction="row" gap={1} flexWrap="wrap">
                  {selected.map((id) => (
                    <Chip key={id} size="small" label={pointLabelById.get(id) || id} />
                  ))}
                </Stack>
              )}
            >
              {allPoints.map((point) => (
                <MenuItem key={point._id} value={point._id}>
                  {pointLabelById.get(point._id)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleUpdate}>Guardar</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>¿Desea eliminar este grupo?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button color="error" onClick={handleDelete}>Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
