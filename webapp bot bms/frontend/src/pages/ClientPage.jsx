import React, { useEffect, useState } from 'react';
import { fetchClients, createClient, deleteClient } from '../services/clients';
import { fetchGroups } from '../services/groups';
import {
  Container, Typography, TextField, Button, Box,
  Paper, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, FormControl, InputLabel, Select, MenuItem, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function ClientPage() {
  const [clients, setClients] = useState([]);
  const [groups, setGroups] = useState([]);
  const [newClient, setNewClient] = useState({ clientName: '', location: '', groupId: '' });
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchClients().then(res => setClients(res.data));
    fetchGroups().then(res => setGroups(res.data));
  }, []);

  const handleAdd = async () => {
    try {
      await createClient(newClient);
      const { data } = await fetchClients();
      setClients(data);
      setNewClient({ clientName: '', location: '', groupId: '' });
      setError('');
    } catch (err) {
      setError('Error al crear cliente');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteClient(deleteId);
      const { data } = await fetchClients();
      setClients(data);
    } catch (err) {
      setError('Error al eliminar cliente');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Clientes</Typography>
      <Paper sx={{ width: '100%', overflowX: 'auto' }}>
        <Table sx={{ minWidth: 1200 }}>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>ApiKey</TableCell>
              <TableCell>Enabled</TableCell>
              <TableCell>IP</TableCell>
              <TableCell>Ubicación</TableCell>
              <TableCell>Grupo</TableCell>
              <TableCell>Conectado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map(c => (
              <TableRow key={c._id}>
                <TableCell>{c.clientName}</TableCell>
                <TableCell>{c.apiKey}</TableCell>
                <TableCell>{c.enabled}</TableCell>
                <TableCell>{c.ipAddress}</TableCell>
                <TableCell>{c.location}</TableCell>
                <TableCell>{groups.find(g => g._id === c.groupId)?.groupName || c.groupId}</TableCell>
                <TableCell>{String(c.connectionStatus)}</TableCell>
                <TableCell>
                  <IconButton color="error" onClick={() => setDeleteId(c._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">Agregar Cliente</Typography>
        {error && <Alert severity="warning" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
          <TextField
            label="Nombre"
            value={newClient.clientName}
            onChange={e => setNewClient(n => ({ ...n, clientName: e.target.value }))}
          />
          <TextField
            label="Ubicación"
            value={newClient.location}
            onChange={e => setNewClient(n => ({ ...n, location: e.target.value }))}
          />
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="group-label">Grupo</InputLabel>
            <Select
              labelId="group-label"
              value={newClient.groupId}
              label="Grupo"
              onChange={e => setNewClient(n => ({ ...n, groupId: e.target.value }))}
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
          <DialogContentText>¿Desea eliminar este cliente?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button color="error" onClick={handleDelete}>Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
