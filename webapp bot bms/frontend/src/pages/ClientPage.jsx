import React, { useEffect, useState } from 'react';
import { fetchClients, createClient, deleteClient, updateClientEnabled, updateClient } from '../services/clients';
import { fetchGroups } from '../services/groups';
import { truncateText } from '../utils/text';
import {
  Container, Typography, TextField, Button, Box,
  Paper, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import FiberManualRecord from '@mui/icons-material/FiberManualRecord';
import Autorenew from '@mui/icons-material/Autorenew';

export default function ClientPage() {
  const [clients, setClients] = useState([]);
  const [groups, setGroups] = useState([]);
  const [newClient, setNewClient] = useState({ clientName: '', location: '' });
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [showKeys, setShowKeys] = useState({});
  const [toggleInfo, setToggleInfo] = useState(null); // {id, enabled}
  const [editClient, setEditClient] = useState(null);
  const [editError, setEditError] = useState('');

  const refreshClients = async () => {
    const { data } = await fetchClients();
    setClients(data);
  };

  useEffect(() => {
    fetchClients().then(res => setClients(res.data));
    fetchGroups().then(res => setGroups(res.data));
  }, []);

  const handleAdd = async () => {
    try {
      await createClient(newClient);
      await refreshClients();
      setNewClient({ clientName: '', location: '' });
      setError('');
    } catch {
      setError('Error al crear cliente');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteClient(deleteId);
      await refreshClients();
    } catch {
      setError('Error al eliminar cliente');
    } finally {
      setDeleteId(null);
    }
  };

  const handleToggle = async () => {
    try {
      await updateClientEnabled(toggleInfo.id, toggleInfo.enabled);
      await refreshClients();
    } catch {
      setError('Error al actualizar cliente');
    } finally {
      setToggleInfo(null);
    }
  };

  const handleEditOpen = (client) => {
    setEditError('');
    setEditClient({
      _id: client._id,
      clientName: client.clientName || '',
      location: client.location || '',
      ipAddress: client.ipAddress || '',
    });
  };

  const handleEditChange = (field, value) => {
    setEditClient((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditClose = () => {
    setEditClient(null);
    setEditError('');
  };

  const handleUpdate = async () => {
    try {
      await updateClient(editClient._id, {
        clientName: editClient.clientName,
        location: editClient.location,
        ipAddress: editClient.ipAddress,
      });
      await refreshClients();
      handleEditClose();
    } catch {
      setEditError('Error al actualizar cliente');
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
              <TableCell>Grupos asociados</TableCell>
              <TableCell>Conectado</TableCell>
              <TableCell>Acciones</TableCell>
              <TableCell>ApiKey</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map(c => (
              <TableRow key={c._id}>
                <TableCell>{truncateText(c.clientName)}</TableCell>
                <TableCell>
                  <FiberManualRecord sx={{ color: c.enabled ? 'green' : 'red' }} />
                  <IconButton size="small" onClick={() => setToggleInfo({ id: c._id, enabled: !c.enabled })}>
                    <Autorenew fontSize="small" />
                  </IconButton>
                </TableCell>
                <TableCell>{truncateText(c.ipAddress)}</TableCell>
                <TableCell>{truncateText(c.location)}</TableCell>
                <TableCell>
                  {(() => {
                    const relatedGroups = groups
                      .filter((g) =>
                        Array.isArray(g.points) &&
                        g.points.some((p) => {
                          const clientRef = p?.clientId;
                          if (!clientRef) return false;
                          if (typeof clientRef === 'string') {
                            return clientRef === c._id;
                          }
                          return (clientRef._id || clientRef.id)?.toString() === c._id;
                        })
                      )
                      .map((g) => g.groupName);
                    const relatedGroupsText = relatedGroups.length > 0 ? relatedGroups.join(', ') : 'Sin grupo';
                    return truncateText(relatedGroupsText);
                  })()}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FiberManualRecord sx={{ color: c.connectionStatus ? 'green' : 'red' }} />
                    <span>{truncateText(c.lastReport ? new Date(c.lastReport).toLocaleString() : 'Sin conexión')}</span>
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleEditOpen(c)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
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
          <Button variant="contained" onClick={handleAdd}>Agregar</Button>
        </Box>
      </Box>
      <Dialog
        open={Boolean(editClient)}
        onClose={handleEditClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Editar cliente</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {editError && <Alert severity="error">{editError}</Alert>}
          <TextField
            label="Nombre"
            value={editClient?.clientName || ''}
            onChange={(e) => handleEditChange('clientName', e.target.value)}
          />
          <TextField
            label="IP"
            value={editClient?.ipAddress || ''}
            onChange={(e) => handleEditChange('ipAddress', e.target.value)}
          />
          <TextField
            label="Ubicación"
            value={editClient?.location || ''}
            onChange={(e) => handleEditChange('location', e.target.value)}
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
