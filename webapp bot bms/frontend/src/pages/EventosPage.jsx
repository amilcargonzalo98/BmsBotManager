import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Chip,
  CircularProgress,
} from '@mui/material';
import { fetchGroups } from '../services/groups';
import { fetchEvents } from '../services/events';

export default function EventosPage() {
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState('');
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGroups()
      .then((res) => setGroups(res.data))
      .catch((err) => console.error(err));
  }, []);

  const loadEvents = useCallback(() => {
    setLoading(true);
    fetchEvents({ page: page + 1, limit: rowsPerPage, groupId: groupId || undefined })
      .then((res) => {
        setEvents(res.data.data);
        setTotal(res.data.pagination.total);
      })
      .catch((err) => {
        console.error(err);
        setEvents([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [groupId, page, rowsPerPage]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleGroupChange = (event) => {
    setGroupId(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Eventos
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="group-filter-label">Grupo</InputLabel>
          <Select
            labelId="group-filter-label"
            value={groupId}
            label="Grupo"
            onChange={handleGroupChange}
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
        <Table sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Punto</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Grupo</TableCell>
              <TableCell>Fecha y hora</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : events.length > 0 ? (
              events.map((event) => (
                <TableRow key={event._id}>
                  <TableCell>
                    <Chip label={event.eventType} color="primary" size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {event.pointId?.pointName || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {event.pointId?._id || 'Sin ID'}
                    </Typography>
                  </TableCell>
                  <TableCell>{event.presentValue ?? 'N/A'}</TableCell>
                  <TableCell>{event.groupId?.groupName || 'Sin grupo'}</TableCell>
                  <TableCell>
                    {event.timestamp
                      ? new Date(event.timestamp).toLocaleString()
                      : 'N/A'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No hay eventos registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="Filas por página"
        />
      </Paper>
    </Box>
  );
}
