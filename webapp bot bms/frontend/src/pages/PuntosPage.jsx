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
} from '@mui/material';
import { fetchPoints } from '../services/points';
import { fetchClients } from '../services/clients';
import { fetchGroups } from '../services/groups';

export default function PuntosPage() {
  const [points, setPoints] = useState([]);
  const [clients, setClients] = useState([]);
  const [groups, setGroups] = useState([]);
  const [clientId, setClientId] = useState('');
  const [groupId, setGroupId] = useState('');

  const loadPoints = async (cId, gId) => {
    const { data } = await fetchPoints(cId, gId);
    setPoints(data);
  };

  useEffect(() => {
    fetchClients().then((res) => setClients(res.data));
    fetchGroups().then((res) => setGroups(res.data));
    loadPoints('', '');
  }, []);

  useEffect(() => {
    loadPoints(clientId, groupId);
  }, [clientId, groupId]);

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
            </TableRow>
          </TableHead>
          <TableBody>
            {points.map((p) => (
              <TableRow key={p._id}>
                <TableCell>{p.pointName}</TableCell>
                <TableCell>{p.ipAddress}</TableCell>
                <TableCell>{p.pointType}</TableCell>
                <TableCell>{p.pointId}</TableCell>
                <TableCell>{p.clientId?.clientName || p.clientId}</TableCell>
                <TableCell>
                  {(() => {
                    const cidGroup = p.clientId?.groupId;
                    if (cidGroup && typeof cidGroup === 'object') {
                      return cidGroup.groupName;
                    }
                    return (
                      groups.find((g) => g._id === cidGroup)?.groupName ||
                      p.groupId?.groupName ||
                      cidGroup ||
                      p.groupId ||
                      'N/A'
                    );
                  })()}
                </TableCell>
                <TableCell>
                  {p.lastValue
                    ? `${p.lastValue.presentValue} (${new Date(
                        p.lastValue.timestamp
                      ).toLocaleString()})`
                    : 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}
