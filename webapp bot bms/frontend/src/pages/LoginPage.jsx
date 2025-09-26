import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Box, TextField, Button, Typography, Alert } from '@mui/material';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form);
      nav('/usuarios');
    } catch {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Box
            component="img"
            src="/icons/isologo-100x100.png"
            alt="FusionBMS"
            sx={{ height: 64, width: 64, mb: 1 }}
          />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            FusionBMS
          </Typography>
          <Typography
            variant="h6"
            component="p"
            sx={{ color: '#000', fontWeight: 500, fontSize: '1.2rem' }}
          >
            Notification Manager
          </Typography>
        </Box>
        <Typography variant="h5" gutterBottom>Iniciar sesión</Typography>
        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            fullWidth
            margin="normal"
            label="Usuario"
            value={form.username}
            onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Contraseña"
            type="password"
            value={form.password}
            onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
            Entrar
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
