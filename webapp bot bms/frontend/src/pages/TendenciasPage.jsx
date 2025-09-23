import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import { fetchPoints } from '../services/points';
import { fetchDataLogs } from '../services/datalogs';

/* global Chart */

export default function TendenciasPage() {
  const [points, setPoints] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState('');
  const [logs, setLogs] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const chartRef = useRef(null);

  useEffect(() => {
    fetchPoints()
      .then((res) => setPoints(res.data))
      .catch((err) => console.error(err));
  }, []);

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
      <FormControl sx={{ mb: 3, width: '50%' }}>
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
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
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
