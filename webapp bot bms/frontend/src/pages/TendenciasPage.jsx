import React, { useEffect, useState, useRef } from 'react';
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
    if (id) {
      fetchDataLogs(id)
        .then((res) => setLogs(res.data))
        .catch((err) => console.error(err));
    } else {
      setLogs([]);
    }
  };

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    if (logs.length > 0) {
      const filtered = logs.filter((log) => {
        const t = new Date(log.timestamp).getTime();
        if (startDate && t < new Date(startDate).getTime()) return false;
        if (endDate && t > new Date(endDate).getTime()) return false;
        return true;
      });

      const ctx = document.getElementById('trend-chart').getContext('2d');
      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: filtered.map((l) => new Date(l.timestamp).toLocaleString()),
          datasets: [
            {
              label: 'Valor',
              data: filtered.map((l) => l.presentValue),
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
    }
  }, [logs, startDate, endDate]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Tendencias
      </Typography>
      <FormControl fullWidth sx={{ mb: 3 }}>
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
      {logs.length > 0 && <canvas id="trend-chart" height="100" />}
    </Box>
  );
}
