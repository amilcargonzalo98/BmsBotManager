// src/pages/UsuariosPage.jsx
import React, { useEffect, useState } from 'react';
import { fetchUsers, createUser } from '../services/users';
import {
  Container, Typography, TextField, Button, Box,
  Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Alert, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';

export default function UsuariosPage() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', phoneNum: '', userType: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers().then(res => setUsers(res.data));
  }, []);

  const handleAdd = async () => {
    try {
      await createUser(newUser);
      const { data } = await fetchUsers();
      setUsers(data);
      setNewUser({ username: '', password: '', name: '', phoneNum: '', userType: '' });
      setError('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al crear usuario';
      setError(msg);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Usuarios</Typography>
      <Paper sx={{ width: '100%', overflowX: 'auto' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Password</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Tipo</TableCell>
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
          <Button variant="contained" onClick={handleAdd}>Agregar</Button>
        </Box>
      </Box>
    </Container>
  );
}
