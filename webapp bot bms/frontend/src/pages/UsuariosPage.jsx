// src/pages/UsuariosPage.jsx
import React, { useEffect, useState } from 'react';
import { fetchUsers, createUser, deleteUser } from '../services/users';
import { fetchGroups } from '../services/groups';
import {
  Container, Typography, TextField, Button, Box,
  Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Alert, FormControl, InputLabel, Select, MenuItem,
  IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function UsuariosPage() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', phoneNum: '', userType: '', groupId: '' });
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchUsers().then(res => setUsers(res.data));
    fetchGroups().then(res => setGroups(res.data));
  }, []);

  const handleAdd = async () => {
    try {
      await createUser(newUser);
      const { data } = await fetchUsers();
      setUsers(data);
      setNewUser({ username: '', password: '', name: '', phoneNum: '', userType: '', groupId: '' });
      setError('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al crear usuario';
      setError(msg);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(deleteId);
      const { data } = await fetchUsers();
      setUsers(data);
    } catch {
      setError('Error al eliminar usuario');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Usuarios</Typography>
      <Paper sx={{ width: '100%', overflowX: 'auto' }}>
        <Table sx={{ minWidth: 1200 }}>
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Password</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Grupo</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
              {users.map(u => (
                <TableRow key={u._id}>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.password}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.phoneNum}</TableCell>
                  <TableCell>{u.userType}</TableCell>
                  <TableCell>{groups.find(g => g._id === u.groupId)?.groupName || u.groupId}</TableCell>
                  <TableCell>
                    <IconButton color="error" onClick={() => setDeleteId(u._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Paper>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">Agregar Usuario</Typography>
        {error && <Alert severity="warning" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
          {['username', 'password', 'name', 'phoneNum'].map(field => (
            <TextField
              key={field}
              label={field.charAt(0).toUpperCase() + field.slice(1)}
              value={newUser[field]}
              onChange={e => setNewUser(n => ({ ...n, [field]: e.target.value }))}
            />
          ))}
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="user-type-label">Tipo</InputLabel>
            <Select
              labelId="user-type-label"
              value={newUser.userType}
              label="Tipo"
              onChange={e => setNewUser(n => ({ ...n, userType: e.target.value }))}
            >
              {['admin', 'cliente', 'custom'].map(opt => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="group-label">Grupo</InputLabel>
            <Select
              labelId="group-label"
              value={newUser.groupId}
              label="Grupo"
              onChange={e => setNewUser(n => ({ ...n, groupId: e.target.value }))}
            >
              {groups.map(g => (
                <MenuItem key={g._id} value={g._id}>{g.groupName}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleAdd}>Agregar</Button>
        </Box>
      </Box>
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Desea eliminar este usuario?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button color="error" onClick={handleDelete}>Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
