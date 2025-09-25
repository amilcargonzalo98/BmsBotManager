import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
} from '@mui/material';
import { fetchPoints } from '../services/points';
import { fetchDataLogs } from '../services/datalogs';
import { fetchGroups } from '../services/groups';

/* global Chart */

export default function TendenciasPage() {
  const [groups, setGroups] = useState([]);
  const [points, setPoints] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedPoint, setSelectedPoint] = useState('');
  const [logs, setLogs] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const chartRef = useRef(null);

  useEffect(() => {
    fetchGroups()
      .then((res) => setGroups(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetchPoints(undefined, selectedGroup || undefined)
      .then((res) => setPoints(res.data))
      .catch((err) => console.error(err));
  }, [selectedGroup]);

  const handleGroupChange = (e) => {
    const groupId = e.target.value;
    setSelectedGroup(groupId);
    setSelectedPoint('');
    setLogs([]);
  };

  const handlePointChange = (e) => {
    const id = e.target.value;
    setSelectedPoint(id);
    setLogs([]);
    if (id) {
      fetchDataLogs(id)
        .then((res) => setLogs(res.data))
        .catch((err) => console.error(err));
    }
  };

  const hasAllSelections = Boolean(selectedPoint && startDate && endDate);
  const startTime = hasAllSelections ? new Date(startDate).getTime() : null;
  const endTime = hasAllSelections ? new Date(endDate).getTime() : null;
  const invalidDateValues =
    hasAllSelections && (Number.isNaN(startTime) || Number.isNaN(endTime));
  const isDateRangeInvalid =
    hasAllSelections && !invalidDateValues && startTime > endTime;

  const selectedPointName = useMemo(() => {
    const point = points.find((p) => p._id === selectedPoint);
    return point?.pointName || 'tendencia';
  }, [points, selectedPoint]);

  const filteredLogs = useMemo(() => {
    if (
      !hasAllSelections ||
      invalidDateValues ||
      isDateRangeInvalid ||
      startTime === null ||
      endTime === null
    ) {
      return [];
    }

    return logs.filter((log) => {
      const timestamp = new Date(log.timestamp).getTime();
      return timestamp >= startTime && timestamp <= endTime;
    });
  }, [endTime, hasAllSelections, invalidDateValues, isDateRangeInvalid, logs, startTime]);

  const handleExportCsv = () => {
    if (filteredLogs.length === 0) {
      return;
    }

    const headers = ['Fecha', 'Valor'];
    const rows = filteredLogs.map((log) => [
      new Date(log.timestamp).toISOString(),
      log.presentValue,
    ]);

    const escapeCell = (value) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCell).join(','))
      .join('\n');

    const blob = new Blob([`\ufeff${csvContent}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const sanitize = (value) => String(value || '').replace(/[^a-z0-9-_]+/gi, '-');
    const fileName = `${sanitize(selectedPointName)}-${sanitize(startDate)}-${sanitize(endDate)}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!hasAllSelections || filteredLogs.length === 0) {
      return undefined;
    }

    const canvas = document.getElementById('trend-chart');
    if (!canvas) {
      return undefined;
    }

    const ctx = canvas.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: filteredLogs.map((l) => new Date(l.timestamp).toLocaleString()),
        datasets: [
          {
            label: 'Valor',
            data: filteredLogs.map((l) => l.presentValue),
            borderColor: '#8884d8',
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          zoom: {
            pan: { enabled: true, mode: 'x' },
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: 'x',
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [filteredLogs, hasAllSelections]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Tendencias
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 200, flex: 1 }}>
          <InputLabel id="group-select-label">Grupo</InputLabel>
          <Select
            labelId="group-select-label"
            value={selectedGroup}
            label="Grupo"
            onChange={handleGroupChange}
          >
            <MenuItem value="">
              <em>Todos</em>
            </MenuItem>
            {groups.map((group) => (
              <MenuItem key={group._id} value={group._id}>
                {group.groupName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200, flex: 1 }}>
          <InputLabel id="point-select-label">Punto</InputLabel>
          <Select
            labelId="point-select-label"
            value={selectedPoint}
            label="Punto"
            onChange={handlePointChange}
          >
            {points.map((p) => (
              <MenuItem key={p._id} value={p._id}>
                {p.pointName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          label="Inicio"
          type="datetime-local"
          InputLabelProps={{ shrink: true }}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <TextField
          label="Fin"
          type="datetime-local"
          InputLabelProps={{ shrink: true }}
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <Button
          variant="contained"
          onClick={handleExportCsv}
          disabled={filteredLogs.length === 0}
        >
          Exportar CSV
        </Button>
      </Box>
      {!hasAllSelections && (
        <Typography variant="body2" color="text.secondary">
          Selecciona el punto y el rango de fechas para visualizar la tendencia.
        </Typography>
      )}
      {hasAllSelections && isDateRangeInvalid && (
        <Typography variant="body2" color="error">
          El rango de fechas seleccionado no es válido.
        </Typography>
      )}
      {hasAllSelections && !isDateRangeInvalid && filteredLogs.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No hay datos disponibles para los filtros seleccionados.
        </Typography>
      )}
      {hasAllSelections && filteredLogs.length > 0 && (
        <canvas id="trend-chart" height="100" />
      )}
    </Box>
  );
}
