import React, { useEffect, useState } from 'react';
import { Container, Typography, TextField, Button, Box, Alert } from '@mui/material';
import { fetchConfig, saveConfig } from '../services/twilio';

export default function TwilioPage() {
  const [config, setConfig] = useState({
    accountSid: '',
    authToken: '',
    whatsappFrom: '',
    messagingServiceSid: '',
    contentSid: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConfig().then(res => {
      if (res.data) setConfig({
        accountSid: res.data.accountSid || '',
        authToken: res.data.authToken || '',
        whatsappFrom: res.data.whatsappFrom || '',
        messagingServiceSid: res.data.messagingServiceSid || '',
        contentSid: res.data.contentSid || ''
      });
    });
  }, []);

  const handleSave = async () => {
    try {
      await saveConfig(config);
      setMessage('Configuración guardada');
      setError('');
    } catch {
      setError('Error al guardar');
      setMessage('');
    }
  };

  // no test message sender

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Twilio API</Typography>
      {message && <Alert severity="success" sx={{ mb:2 }}>{message}</Alert>}
      {error && <Alert severity="warning" sx={{ mb:2 }}>{error}</Alert>}
      <Box sx={{ display:'flex', flexDirection:'column', gap:2, maxWidth:400 }}>
        <TextField label="Account SID" value={config.accountSid} onChange={e=>setConfig(c=>({...c, accountSid:e.target.value}))} />
        <TextField label="Auth Token" value={config.authToken} onChange={e=>setConfig(c=>({...c, authToken:e.target.value}))} />
        <TextField label="WhatsApp From" value={config.whatsappFrom} onChange={e=>setConfig(c=>({...c, whatsappFrom:e.target.value}))} />
        <TextField label="Service SID alarmas" value={config.messagingServiceSid} onChange={e=>setConfig(c=>({...c, messagingServiceSid:e.target.value}))} />
        <TextField label="Content SID alarmas" value={config.contentSid} onChange={e=>setConfig(c=>({...c, contentSid:e.target.value}))} />
        <Button variant="contained" onClick={handleSave}>Guardar</Button>
      </Box>
      {/* Removed test message and received messages sections */}
    </Container>
  );
}
