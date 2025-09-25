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
  TextField,
  Button,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { fetchAlarms, createAlarm, deleteAlarm, updateAlarm } from '../services/alarms';
import { fetchPoints } from '../services/points';
import { fetchGroups } from '../services/groups';
import { fetchClients } from '../services/clients';

const createEmptyAlarmState = () => ({
  alarmName: '',
  monitorType: 'point',
  pointId: '',
  clientId: '',
  groupId: '',
  conditionType: 'true',
  threshold: '',
});

export default function AlarmsPage() {
  const [alarms, setAlarms] = useState([]);
  const [points, setPoints] = useState([]);
  const [allPoints, setAllPoints] = useState([]);
  const [groups, setGroups] = useState([]);
  const [clients, setClients] = useState([]);
  const [filterGroup, setFilterGroup] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [newAlarm, setNewAlarm] = useState(() => createEmptyAlarmState());
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [editAlarm, setEditAlarm] = useState(null);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    load();
    fetchGroups().then(res => setGroups(res.data));
    fetchClients().then(res => setClients(res.data));
  }, []);

  useEffect(() => {
    fetchPoints(clientFilter, '').then(res => {
      setPoints(res.data);
      if (!clientFilter) {
        setAllPoints(res.data);
      }
    });
  }, [clientFilter]);

  useEffect(() => {
    setNewAlarm((prev) => ({ ...prev, clientId: clientFilter }));
  }, [clientFilter]);

  const load = async () => {
    const { data } = await fetchAlarms();
    setAlarms(data);
  };

  const buildPayloadFromState = (state) => {
    const monitorType = state.monitorType ?? 'point';
    const payload = {
      alarmName: state.alarmName?.trim() ?? '',
      groupId: state.groupId,
      conditionType: state.conditionType,
      monitorType,
    };

    if (!payload.alarmName) {
      throw new Error('Ingrese un nombre para la alarma');
    }
    if (!payload.groupId) {
      throw new Error('Seleccione un grupo');
    }
    if (!payload.conditionType) {
      throw new Error('Seleccione una condición');
    }

    if (monitorType === 'clientConnection') {
      const clientId = state.clientId || '';
      if (!clientId) {
        throw new Error('Seleccione un cliente para la alarma');
      }
      const thresholdValue = Number(state.threshold);
      if (!Number.isFinite(thresholdValue) || thresholdValue < 0) {
        throw new Error('Ingrese los segundos sin reporte');
      }
      return {
        ...payload,
        clientId,
        threshold: thresholdValue,
      };
    }

    const pointId = state.pointId || '';
    if (!pointId) {
      throw new Error('Seleccione un punto');
    }

    const numericCondition = payload.conditionType === 'gt' || payload.conditionType === 'lt';
    const result = {
      ...payload,
      pointId,
    };

    if (numericCondition) {
      const thresholdValue = Number(state.threshold);
      if (!Number.isFinite(thresholdValue)) {
        throw new Error('Ingrese un valor válido para el umbral');
      }
      result.threshold = thresholdValue;
    } else {
      result.threshold = null;
    }

    return result;
  };

  const handleNewAlarmTargetChange = (value) => {
    setNewAlarm((prev) => {
      if (value === 'clientConnection') {
        return {
          ...prev,
          monitorType: 'clientConnection',
          pointId: '',
          clientId: clientFilter || prev.clientId || '',
          conditionType: prev.conditionType === 'gt' || prev.conditionType === 'lt' ? prev.conditionType : 'gt',
          threshold: prev.threshold || '60',
        };
      }
      return {
        ...prev,
        monitorType: 'point',
        pointId: value,
        clientId: '',
        conditionType: prev.conditionType || 'true',
        threshold:
          prev.conditionType === 'gt' || prev.conditionType === 'lt'
            ? prev.threshold
            : '',
      };
    });
  };

  const handleEditTargetChange = (value) => {
    setEditAlarm((prev) => {
      if (!prev) return prev;
      if (value === 'clientConnection') {
        return {
          ...prev,
          monitorType: 'clientConnection',
          pointId: '',
          clientId: prev.clientId || '',
          conditionType: prev.conditionType === 'gt' || prev.conditionType === 'lt' ? prev.conditionType : 'gt',
          threshold: prev.threshold || '60',
        };
      }
      return {
        ...prev,
        monitorType: 'point',
        pointId: value,
        clientId: '',
        conditionType: prev.conditionType || 'true',
        threshold:
          prev.conditionType === 'gt' || prev.conditionType === 'lt'
            ? prev.threshold
            : '',
      };
    });
  };

  const renderAlarmTarget = (alarm) => {
    const monitorType = alarm.monitorType ?? 'point';
    if (monitorType === 'clientConnection') {
      let clientName = '';
      if (alarm.clientId && typeof alarm.clientId === 'object') {
        clientName = alarm.clientId.clientName || alarm.clientId.name || '';
      } else if (typeof alarm.clientId === 'string') {
        const client = clients.find((c) => c._id === alarm.clientId);
        clientName = client?.clientName || '';
      }
      return `${clientName || 'Cliente'} — Client connection status`;
    }
    return alarm.pointId?.pointName || alarm.pointId || 'Sin asignar';
  };

  const renderConditionLabel = (alarm) => {
    const monitorType = alarm.monitorType ?? 'point';
    const suffix = monitorType === 'clientConnection' ? ' s' : '';
    if (alarm.conditionType === 'gt') {
      return `>= ${alarm.threshold ?? '-'}${suffix}`;
    }
    if (alarm.conditionType === 'lt') {
      return `<= ${alarm.threshold ?? '-'}${suffix}`;
    }
    if (alarm.conditionType === 'true') {
      return '== true';
    }
    if (alarm.conditionType === 'false') {
      return '== false';
    }
    return 'Condición desconocida';
  };

  const handleAdd = async () => {
    let payload;
    try {
      payload = buildPayloadFromState(newAlarm);
    } catch (validationError) {
      setError(validationError.message);
      return;
    }

    try {
      await createAlarm(payload);
      await load();
      setNewAlarm(() => ({ ...createEmptyAlarmState(), clientId: clientFilter }));
      setError('');
    } catch {
      setError('Error al crear alarma');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAlarm(deleteId);
      await load();
    } catch {
      setError('Error al eliminar alarma');
    } finally {
      setDeleteId(null);
    }
  };

  const handleEditOpen = (alarm) => {
    setEditError('');
    const monitorType = alarm.monitorType || 'point';
    const isConnection = monitorType === 'clientConnection';
    setEditAlarm({
      _id: alarm._id,
      alarmName: alarm.alarmName || '',
      monitorType,
      pointId: isConnection ? '' : alarm.pointId?._id || alarm.pointId || '',
      clientId: isConnection
        ? alarm.clientId?._id || alarm.clientId || ''
        : '',
      groupId: alarm.groupId?._id || alarm.groupId || '',
      conditionType: isConnection
        ? (alarm.conditionType === 'gt' || alarm.conditionType === 'lt'
            ? alarm.conditionType
            : 'gt')
        : alarm.conditionType || 'true',
      threshold:
        isConnection
          ? alarm.threshold ?? ''
          : (alarm.conditionType === 'gt' || alarm.conditionType === 'lt'
              ? alarm.threshold ?? ''
              : ''),
    });
  };

  const handleEditChange = (field, value) => {
    setEditAlarm((prev) => {
      if (!prev) return prev;
      if (field === 'conditionType') {
        return {
          ...prev,
          conditionType: value,
          threshold:
            value === 'gt' || value === 'lt' ? prev.threshold || '' : '',
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleEditClose = () => {
    setEditAlarm(null);
    setEditError('');
  };

  const handleUpdate = async () => {
    if (!editAlarm) return;
    let payload;
    try {
      payload = buildPayloadFromState(editAlarm);
    } catch (validationError) {
      setEditError(validationError.message);
      return;
    }

    try {
      await updateAlarm(editAlarm._id, payload);
      await load();
      handleEditClose();
    } catch {
      setEditError('Error al actualizar alarma');
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Alarmas</Typography>
      <Box sx={{ display:'flex', alignItems:'center', mb:2 }}>
        <FormControl size="small" sx={{ minWidth:160, mr:2 }}>
          <InputLabel id="filter-label">Grupo</InputLabel>
          <Select
            labelId="filter-label"
            label="Grupo"
            value={filterGroup}
            onChange={e => setFilterGroup(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            {groups.map(g => (
              <MenuItem key={g._id} value={g._id}>{g.groupName}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Paper sx={{ width: '100%', overflowX: 'auto' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Punto</TableCell>
              <TableCell>Condición</TableCell>
              <TableCell>Grupo</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alarms
              .filter(a => !filterGroup || (a.groupId?._id || a.groupId) === filterGroup)
              .map(a => (
              <TableRow key={a._id}>
                <TableCell>{a.alarmName}</TableCell>
                <TableCell>{renderAlarmTarget(a)}</TableCell>
                <TableCell>{renderConditionLabel(a)}</TableCell>
                <TableCell>{a.groupId?.groupName || a.groupId}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleEditOpen(a)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => setDeleteId(a._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Box sx={{ mt:4 }}>
        <Typography variant="h6">Crear Alarma</Typography>
        {error && <Alert severity="warning" sx={{ mb:2 }}>{error}</Alert>}
        <Box sx={{ display:'flex', gap:2, flexWrap:'wrap', mt:2 }}>
          <TextField
            label="Nombre"
            value={newAlarm.alarmName}
            onChange={e=>setNewAlarm(n=>({ ...n, alarmName:e.target.value }))}
          />
          <FormControl sx={{ minWidth:160 }}>
            <InputLabel id="client-filter-label">Cliente</InputLabel>
            <Select
              labelId="client-filter-label"
              value={clientFilter}
              label="Cliente"
              onChange={e=>setClientFilter(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {clients.map(c => (
                <MenuItem key={c._id} value={c._id}>{c.clientName}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth:160 }}>
            <InputLabel id="point-label">Punto</InputLabel>
            <Select
              labelId="point-label"
              value={newAlarm.monitorType === 'clientConnection' ? 'clientConnection' : newAlarm.pointId}
              label="Punto"
              onChange={e=>handleNewAlarmTargetChange(e.target.value)}
            >
              {points.map(p => (
                <MenuItem key={p._id} value={p._id}>{p.pointName}</MenuItem>
              ))}
              {clientFilter && (
                <MenuItem value="clientConnection">Client connection status</MenuItem>
              )}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth:120 }}>
            <InputLabel id="cond-label">Condición</InputLabel>
            <Select
              labelId="cond-label"
              value={newAlarm.conditionType}
              label="Condición"
              onChange={e=>setNewAlarm(n=>({ ...n, conditionType:e.target.value }))}
            >
              {newAlarm.monitorType === 'clientConnection' ? (
                <>
                  <MenuItem value="gt">&gt;=</MenuItem>
                  <MenuItem value="lt">&lt;=</MenuItem>
                </>
              ) : (
                <>
                  <MenuItem value="true">== true</MenuItem>
                  <MenuItem value="false">== false</MenuItem>
                  <MenuItem value="gt">&gt;=</MenuItem>
                  <MenuItem value="lt">&lt;=</MenuItem>
                </>
              )}
            </Select>
          </FormControl>
          {(newAlarm.conditionType === 'gt' || newAlarm.conditionType === 'lt') && (
            <TextField
              label={newAlarm.monitorType === 'clientConnection' ? 'Segundos sin reporte' : 'Valor'}
              type="number"
              inputProps={newAlarm.monitorType === 'clientConnection' ? { min: 0 } : undefined}
              value={newAlarm.threshold}
              onChange={e=>setNewAlarm(n=>({ ...n, threshold:e.target.value }))}
            />
          )}
          <FormControl sx={{ minWidth:160 }}>
            <InputLabel id="group-label">Grupo</InputLabel>
            <Select
              labelId="group-label"
              value={newAlarm.groupId}
              label="Grupo"
              onChange={e=>setNewAlarm(n=>({ ...n, groupId:e.target.value }))}
            >
              {groups.map(g => (
                <MenuItem key={g._id} value={g._id}>{g.groupName}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleAdd}>Agregar</Button>
        </Box>
      </Box>
      <Dialog
        open={Boolean(editAlarm)}
        onClose={handleEditClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Editar alarma</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {editError && <Alert severity="error">{editError}</Alert>}
          <TextField
            label="Nombre"
            value={editAlarm?.alarmName || ''}
            onChange={(e) => handleEditChange('alarmName', e.target.value)}
          />
          <FormControl fullWidth>
            <InputLabel id="edit-point-label">Punto</InputLabel>
            <Select
              labelId="edit-point-label"
              label="Punto"
              value={editAlarm?.monitorType === 'clientConnection' ? 'clientConnection' : editAlarm?.pointId || ''}
              onChange={(e) => handleEditTargetChange(e.target.value)}
            >
              {allPoints.map((p) => (
                <MenuItem key={p._id} value={p._id}>{p.pointName}</MenuItem>
              ))}
              <MenuItem value="clientConnection">Client connection status</MenuItem>
            </Select>
          </FormControl>
          {editAlarm?.monitorType === 'clientConnection' && (
            <FormControl fullWidth>
              <InputLabel id="edit-client-label">Cliente</InputLabel>
              <Select
                labelId="edit-client-label"
                label="Cliente"
                value={editAlarm?.clientId || ''}
                onChange={(e) => handleEditChange('clientId', e.target.value)}
              >
                {clients.map((c) => (
                  <MenuItem key={c._id} value={c._id}>{c.clientName}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <FormControl fullWidth>
            <InputLabel id="edit-group-label">Grupo</InputLabel>
            <Select
              labelId="edit-group-label"
              label="Grupo"
              value={editAlarm?.groupId || ''}
              onChange={(e) => handleEditChange('groupId', e.target.value)}
            >
              {groups.map((g) => (
                <MenuItem key={g._id} value={g._id}>{g.groupName}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="edit-cond-label">Condición</InputLabel>
            <Select
              labelId="edit-cond-label"
              label="Condición"
              value={editAlarm?.conditionType || 'true'}
              onChange={(e) => handleEditChange('conditionType', e.target.value)}
            >
              {editAlarm?.monitorType === 'clientConnection' ? (
                <>
                  <MenuItem value="gt">&gt;=</MenuItem>
                  <MenuItem value="lt">&lt;=</MenuItem>
                </>
              ) : (
                <>
                  <MenuItem value="true">== true</MenuItem>
                  <MenuItem value="false">== false</MenuItem>
                  <MenuItem value="gt">&gt;=</MenuItem>
                  <MenuItem value="lt">&lt;=</MenuItem>
                </>
              )}
            </Select>
          </FormControl>
          {(editAlarm?.conditionType === 'gt' || editAlarm?.conditionType === 'lt') && (
            <TextField
              label={editAlarm?.monitorType === 'clientConnection' ? 'Segundos sin reporte' : 'Valor'}
              type="number"
              inputProps={editAlarm?.monitorType === 'clientConnection' ? { min: 0 } : undefined}
              value={editAlarm?.threshold ?? ''}
              onChange={(e) => handleEditChange('threshold', e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleUpdate}>Guardar</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>¿Desea eliminar esta alarma?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button color="error" onClick={handleDelete}>Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
