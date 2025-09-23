// src/pages/GroupPage.jsx
import React, { useEffect, useState } from 'react';
import { fetchGroups, createGroup, deleteGroup, updateGroup } from '../services/groups';
import {
  Container, Typography, TextField, Button, Box,
  Paper, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

export default function GroupPage() {
  const [groups, setGroups] = useState([]);
  const [newGroup, setNewGroup] = useState({ groupName: '', description: '' });
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [editGroup, setEditGroup] = useState(null);
  const [editError, setEditError] = useState('');

  const refreshGroups = async () => {
    const { data } = await fetchGroups();
    setGroups(data);
  };

  useEffect(() => {
    fetchGroups().then(res => setGroups(res.data));
  }, []);

  const handleAdd = async () => {
    try {
      await createGroup(newGroup);
      await refreshGroups();
      setNewGroup({ groupName: '', description: '' });
      setError('');
    } catch {
      setError('Error al crear grupo');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGroup(deleteId);
      await refreshGroups();
    } catch {
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
      });
      await refreshGroups();
      handleEditClose();
    } catch {
      setEditError('Error al actualizar grupo');
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Grupos</Typography>
      <Paper sx={{ width: '100%', overflowX: 'auto' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map(g => (
              <TableRow key={g._id}>
                <TableCell>{g.groupName}</TableCell>
                <TableCell>{g.description}</TableCell>
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
            onChange={e => setNewGroup(n => ({ ...n, groupName: e.target.value }))}
          />
          <TextField
            label="Descripción"
            value={newGroup.description}
            onChange={e => setNewGroup(n => ({ ...n, description: e.target.value }))}
          />
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
