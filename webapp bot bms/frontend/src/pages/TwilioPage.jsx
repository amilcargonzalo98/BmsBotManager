import React, { useEffect, useState } from 'react';
import { Container, Typography, TextField, Button, Box, Alert } from '@mui/material';
import { fetchConfig, saveConfig, sendTestMessage, fetchMessages } from '../services/twilio';

export default function TwilioPage() {
  const [config, setConfig] = useState({ accountSid: '', authToken: '', whatsappFrom: '' });
  const [test, setTest] = useState({ to: '', body: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    fetchConfig().then(res => {
      if (res.data) setConfig({
        accountSid: res.data.accountSid || '',
        authToken: res.data.authToken || '',
        whatsappFrom: res.data.whatsappFrom || ''
      });
    });
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const res = await fetchMessages();
      setMessages(res.data || []);
    } catch {
      // ignore
    }
  };

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

  const handleSend = async () => {
    try {
      await sendTestMessage(test);
      setMessage('Mensaje enviado');
      setError('');
    } catch {
      setError('Error al enviar mensaje');
      setMessage('');
    }
  };

  const handleRefresh = () => {
    loadMessages();
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Twilio API</Typography>
      {message && <Alert severity="success" sx={{ mb:2 }}>{message}</Alert>}
      {error && <Alert severity="warning" sx={{ mb:2 }}>{error}</Alert>}
      <Box sx={{ display:'flex', flexDirection:'column', gap:2, maxWidth:400 }}>
        <TextField label="Account SID" value={config.accountSid} onChange={e=>setConfig(c=>({...c, accountSid:e.target.value}))} />
        <TextField label="Auth Token" value={config.authToken} onChange={e=>setConfig(c=>({...c, authToken:e.target.value}))} />
        <TextField label="WhatsApp From" value={config.whatsappFrom} onChange={e=>setConfig(c=>({...c, whatsappFrom:e.target.value}))} />
        <Button variant="contained" onClick={handleSave}>Guardar</Button>
      </Box>
      <Box sx={{ display:'flex', flexDirection:'column', gap:2, maxWidth:400, mt:4 }}>
        <Typography variant="h6">Enviar mensaje de prueba</Typography>
        <TextField label="Para" value={test.to} onChange={e=>setTest(t=>({...t, to:e.target.value}))} />
        <TextField label="Mensaje" value={test.body} onChange={e=>setTest(t=>({...t, body:e.target.value}))} />
        <Button variant="contained" onClick={handleSend}>Enviar</Button>
      </Box>
      <Box sx={{ mt:4 }}>
        <Box sx={{ display:'flex', alignItems:'center', mb:1 }}>
          <Typography variant="h6" sx={{ flexGrow:1 }}>Mensajes recibidos</Typography>
          <Button size="small" variant="outlined" onClick={handleRefresh}>Refrescar</Button>
        </Box>
        <Box sx={{ maxHeight:300, overflowY:'auto', border:'1px solid #ccc', p:1 }}>
          {messages.map(m => (
            <Box key={m._id} sx={{ mb:1 }}>
              <Typography variant="caption" color="text.secondary">{new Date(m.timestamp).toLocaleString()} - {m.from}</Typography>
              <Typography>{m.body}</Typography>
            </Box>
          ))}
          {messages.length === 0 && <Typography variant="body2">Sin mensajes</Typography>}
        </Box>
      </Box>
    </Container>
  );
}
