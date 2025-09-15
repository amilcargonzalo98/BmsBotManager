import React, { useEffect, useState } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { fetchPoints } from '../services/points';
import { fetchDataLogs } from '../services/datalogs';

export default function TendenciasPage() {
  const [points, setPoints] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState('');
  const [logs, setLogs] = useState([]);

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
      {logs.length > 0 && (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={logs}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(t) => new Date(t).toLocaleTimeString()}
            />
            <YAxis />
            <Tooltip labelFormatter={(label) => new Date(label).toLocaleString()} />
            <Line type="monotone" dataKey="presentValue" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}
