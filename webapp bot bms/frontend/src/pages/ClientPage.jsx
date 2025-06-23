import React, { useEffect, useState } from 'react';
import { fetchClients, createClient, deleteClient, updateClientEnabled } from '../services/clients';
import { fetchGroups } from '../services/groups';
import {
  Container, Typography, TextField, Button, Box,
  Paper, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, FormControl, InputLabel, Select, MenuItem, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import FiberManualRecord from '@mui/icons-material/FiberManualRecord';
import Autorenew from '@mui/icons-material/Autorenew';

export default function ClientPage() {
  const [clients, setClients] = useState([]);
  const [groups, setGroups] = useState([]);
  const [newClient, setNewClient] = useState({ clientName: '', location: '', groupId: '' });
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [showKeys, setShowKeys] = useState({});
  const [toggleInfo, setToggleInfo] = useState(null); // {id, enabled}

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

  const handleToggle = async () => {
    try {
      await updateClientEnabled(toggleInfo.id, toggleInfo.enabled);
      const { data } = await fetchClients();
      setClients(data);
    } catch (err) {
      setError('Error al actualizar cliente');
    } finally {
      setToggleInfo(null);
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
              <TableCell>Enabled</TableCell>
              <TableCell>IP</TableCell>
              <TableCell>Ubicación</TableCell>
              <TableCell>Grupo</TableCell>
              <TableCell>Conectado</TableCell>
              <TableCell>Acciones</TableCell>
              <TableCell>ApiKey</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map(c => (
              <TableRow key={c._id}>
                <TableCell>{c.clientName}</TableCell>
                <TableCell>
                  <FiberManualRecord sx={{ color: c.enabled ? 'green' : 'red' }} />
                  <IconButton size="small" onClick={() => setToggleInfo({ id: c._id, enabled: !c.enabled })}>
                    <Autorenew fontSize="small" />
                  </IconButton>
                </TableCell>
                <TableCell>{c.ipAddress}</TableCell>
                <TableCell>{c.location}</TableCell>
                <TableCell>{groups.find(g => g._id === c.groupId)?.groupName || c.groupId}</TableCell>
                <TableCell>
                  <FiberManualRecord sx={{ color: c.connectionStatus ? 'green' : 'red' }} />
                </TableCell>
                <TableCell>
                  <IconButton color="error" onClick={() => setDeleteId(c._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
                <TableCell>
                  {showKeys[c._id] ? c.apiKey : '********'}
                  <IconButton size="small" onClick={() => setShowKeys(s => ({ ...s, [c._id]: !s[c._id] }))}>
                    {showKeys[c._id] ? <VisibilityOff /> : <Visibility />}
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
      <Dialog open={Boolean(toggleInfo)} onClose={() => setToggleInfo(null)}>
        <DialogTitle>Cambiar estado</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Desea cambiar el estado habilitado de este cliente?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToggleInfo(null)}>Cancelar</Button>
          <Button onClick={handleToggle} autoFocus>Aceptar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
