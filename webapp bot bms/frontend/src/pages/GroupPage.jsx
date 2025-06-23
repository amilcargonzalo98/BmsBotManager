// src/pages/GroupPage.jsx
import React, { useEffect, useState } from 'react';
import { fetchGroups, createGroup, deleteGroup } from '../services/groups';
import {
  Container, Typography, TextField, Button, Box,
  Paper, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function GroupPage() {
  const [groups, setGroups] = useState([]);
  const [newGroup, setNewGroup] = useState({ groupName: '', description: '' });
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchGroups().then(res => setGroups(res.data));
  }, []);

  const handleAdd = async () => {
    try {
      await createGroup(newGroup);
      const { data } = await fetchGroups();
      setGroups(data);
      setNewGroup({ groupName: '', description: '' });
      setError('');
    } catch (err) {
      setError('Error al crear grupo');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGroup(deleteId);
      const { data } = await fetchGroups();
      setGroups(data);
    } catch (err) {
      setError('Error al eliminar grupo');
    } finally {
      setDeleteId(null);
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
