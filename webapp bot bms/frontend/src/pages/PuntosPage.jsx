import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { fetchPoints, updatePointGroup } from '../services/points';
import { fetchClients } from '../services/clients';
import { fetchGroups } from '../services/groups';
import { truncateText } from '../utils/text';

export default function PuntosPage() {
  const [points, setPoints] = useState([]);
  const [clients, setClients] = useState([]);
  const [groups, setGroups] = useState([]);
  const [clientId, setClientId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [editPoint, setEditPoint] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [editError, setEditError] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);

  const typeAcronyms = {
    0: 'AI',
    1: 'AO',
    2: 'AV',
    3: 'BI',
    4: 'BO',
    5: 'BV',
    9: 'EE',
    13: 'MSI',
    14: 'MSO',
  };

  const loadPoints = async (cId, gId) => {
    const { data } = await fetchPoints(cId, gId);
    setPoints((prev) => {
      const incomingIds = new Set(data.map((p) => p._id));
      const updated = prev.filter((p) => incomingIds.has(p._id));
      data.forEach((p) => {
        const idx = updated.findIndex((u) => u._id === p._id);
        if (idx >= 0) {
          updated[idx] = p;
        } else {
          updated.push(p);
        }
      });
      return updated;
    });
  };

  useEffect(() => {
    fetchClients().then((res) => setClients(res.data));
    fetchGroups().then((res) => setGroups(res.data));
    loadPoints('', '');
  }, []);

  useEffect(() => {
    loadPoints(clientId, groupId);
  }, [clientId, groupId]);

  const handleEditGroupOpen = (point) => {
    const currentGroup =
      typeof point.groupId === 'object' ? point.groupId?._id : point.groupId || '';
    setEditPoint(point);
    setSelectedGroup(currentGroup || '');
    setEditError('');
  };

  const handleEditGroupClose = () => {
    setEditPoint(null);
    setSelectedGroup('');
    setEditError('');
    setSavingGroup(false);
  };

  const handleEditGroupSave = async () => {
    if (!editPoint) return;
    try {
      setSavingGroup(true);
      await updatePointGroup(editPoint._id, selectedGroup || null);
      await loadPoints(clientId, groupId);
      handleEditGroupClose();
    } catch (error) {
      console.error('Error al actualizar el grupo del punto', error);
      setEditError('Error al actualizar el grupo del punto');
      setSavingGroup(false);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Puntos
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel id="client-label">Cliente</InputLabel>
          <Select
            labelId="client-label"
            value={clientId}
            label="Cliente"
            onChange={(e) => setClientId(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            {clients.map((c) => (
              <MenuItem key={c._id} value={c._id}>
                {c.clientName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel id="group-label">Grupo</InputLabel>
          <Select
            labelId="group-label"
            value={groupId}
            label="Grupo"
            onChange={(e) => setGroupId(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            {groups.map((g) => (
              <MenuItem key={g._id} value={g._id}>
                {g.groupName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Paper sx={{ width: '100%', overflowX: 'auto' }}>
        <Table sx={{ minWidth: 1200 }}>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>IP</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>PointId</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Grupo</TableCell>
              <TableCell>Last Value</TableCell>
              <TableCell align="center">Editar Grupo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {points.map((p) => (
              <TableRow key={p._id}>
                <TableCell>{truncateText(p.pointName)}</TableCell>
                <TableCell>{truncateText(p.ipAddress)}</TableCell>
                <TableCell>
                  {truncateText(
                    `${p.pointType}${
                      typeAcronyms[p.pointType] ? ` (${typeAcronyms[p.pointType]})` : ''
                    }`
                  )}
                </TableCell>
                <TableCell>{truncateText(p.pointId)}</TableCell>
                <TableCell>{truncateText(p.clientId?.clientName || p.clientId)}</TableCell>
                <TableCell>
                  {(() => {
                    const directGroup = p.groupId;
                    if (directGroup) {
                      if (typeof directGroup === 'object') {
                        return (
                          truncateText(
                            directGroup.groupName ||
                              groups.find((g) => g._id === directGroup._id)?.groupName ||
                              directGroup._id ||
                              'Sin grupo'
                          )
                        );
                      }
                      const fromList = groups.find((g) => g._id === directGroup);
                      if (fromList) {
                        return truncateText(fromList.groupName);
                      }
                      return truncateText(directGroup);
                    }
                    const fromGroups = groups.find((g) =>
                      Array.isArray(g.points) &&
                      g.points.some((point) => {
                        const pointId = typeof point === 'string' ? point : point?._id;
                        return pointId === p._id;
                      })
                    );
                    return truncateText(fromGroups?.groupName || 'Sin grupo');
                  })()}
                </TableCell>
                <TableCell>
                  {truncateText(
                    p.lastValue
                      ? `${p.lastValue.presentValue} (${new Date(
                          p.lastValue.timestamp
                        ).toLocaleString()})`
                      : 'N/A'
                  )}
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Editar grupo">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleEditGroupOpen(p)}
                    >
                      <EditIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Dialog
        open={Boolean(editPoint)}
        onClose={handleEditGroupClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Editar grupo del punto</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {editError && <Alert severity="error">{editError}</Alert>}
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {editPoint?.pointName}
          </Typography>
          <FormControl fullWidth>
            <InputLabel id="edit-group-select-label">Grupo</InputLabel>
            <Select
              labelId="edit-group-select-label"
              value={selectedGroup}
              label="Grupo"
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              <MenuItem value="">
                <em>Sin grupo</em>
              </MenuItem>
              {groups.map((g) => (
                <MenuItem key={g._id} value={g._id}>
                  {g.groupName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditGroupClose}>Cancelar</Button>
          <Button
            onClick={handleEditGroupSave}
            variant="contained"
            disabled={savingGroup}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
