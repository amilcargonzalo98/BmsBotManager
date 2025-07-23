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
import { fetchAlarms, createAlarm, deleteAlarm } from '../services/alarms';
import { fetchPoints } from '../services/points';
import { fetchGroups } from '../services/groups';

export default function AlarmsPage() {
  const [alarms, setAlarms] = useState([]);
  const [points, setPoints] = useState([]);
  const [groups, setGroups] = useState([]);
  const [filterGroup, setFilterGroup] = useState('');
  const [pointGroupFilter, setPointGroupFilter] = useState('');
  const [newAlarm, setNewAlarm] = useState({ alarmName: '', pointId: '', groupId: '', conditionType: 'true', threshold: '' });
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    load();
    fetchGroups().then(res => setGroups(res.data));
  }, []);

  useEffect(() => {
    fetchPoints('', pointGroupFilter).then(res => setPoints(res.data));
  }, [pointGroupFilter]);

  const load = async () => {
    const { data } = await fetchAlarms();
    setAlarms(data);
  };

  const handleAdd = async () => {
    try {
      await createAlarm(newAlarm);
      await load();
      setNewAlarm({ alarmName: '', pointId: '', groupId: '', conditionType: 'true', threshold: '' });
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
                <TableCell>{a.pointId?.pointName || a.pointId}</TableCell>
                <TableCell>
                  {a.conditionType === 'gt' && `> ${a.threshold}`}
                  {a.conditionType === 'lt' && `< ${a.threshold}`}
                  {a.conditionType === 'true' && '== true'}
                  {a.conditionType === 'false' && '== false'}
                </TableCell>
                <TableCell>{a.groupId?.groupName || a.groupId}</TableCell>
                <TableCell>
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
            <InputLabel id="point-group-filter-label">Grupo Punto</InputLabel>
            <Select
              labelId="point-group-filter-label"
              value={pointGroupFilter}
              label="Grupo Punto"
              onChange={e=>setPointGroupFilter(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {groups.map(g => (
                <MenuItem key={g._id} value={g._id}>{g.groupName}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth:160 }}>
            <InputLabel id="point-label">Punto</InputLabel>
            <Select
              labelId="point-label"
              value={newAlarm.pointId}
              label="Punto"
              onChange={e=>setNewAlarm(n=>({ ...n, pointId:e.target.value }))}
            >
              {points
                .filter(p => !pointGroupFilter || (p.groupId?._id || p.groupId) === pointGroupFilter)
                .map(p => (
                  <MenuItem key={p._id} value={p._id}>{p.pointName}</MenuItem>
              ))}
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
              <MenuItem value="true">== true</MenuItem>
              <MenuItem value="false">== false</MenuItem>
              <MenuItem value="gt">&gt;=</MenuItem>
              <MenuItem value="lt">&lt;=</MenuItem>
            </Select>
          </FormControl>
          {(newAlarm.conditionType === 'gt' || newAlarm.conditionType === 'lt') && (
            <TextField
              label="Valor"
              type="number"
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
