// src/pages/UsuariosPage.jsx
import React, { useEffect, useState } from 'react';
import { fetchUsers, createUser } from '../services/users';
import {
  Container, Typography, TextField, Button, Box,
  Paper, Table, TableHead, TableRow, TableCell, TableBody
} from '@mui/material';

export default function UsuariosPage() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ id: '', nombre: '', numeroTelefono: '', tipoUsuario: '' });

  useEffect(() => {
    fetchUsers().then(res => setUsers(res.data));
  }, []);

  const handleAdd = async () => {
    await createUser(newUser);
    const { data } = await fetchUsers();
    setUsers(data);
    setNewUser({ id: '', nombre: '', numeroTelefono: '', tipoUsuario: '' });
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Usuarios</Typography>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Tipo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell>{u.id}</TableCell>
                <TableCell>{u.nombre}</TableCell>
                <TableCell>{u.numeroTelefono}</TableCell>
                <TableCell>{u.tipoUsuario}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">Agregar Usuario</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
          {['id','nombre','numeroTelefono','tipoUsuario'].map(field => (
            <TextField
              key={field}
              label={field.charAt(0).toUpperCase() + field.slice(1)}
              value={newUser[field]}
              onChange={e => setNewUser(n => ({ ...n, [field]: e.target.value }))}
            />
          ))}
          <Button variant="contained" onClick={handleAdd}>Agregar</Button>
        </Box>
      </Box>
    </Container>
  );
}
