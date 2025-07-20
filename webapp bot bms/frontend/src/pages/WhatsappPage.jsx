import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { fetchMessages, sendMessage } from '../services/twilio';
import { fetchUsers } from '../services/users';

export default function WhatsappPage() {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    fetchUsers().then(res => setUsers(res.data));
    return () => clearInterval(interval);
  }, []);

  const load = async () => {
    try {
      const res = await fetchMessages();
      setMessages(res.data.reverse());
    } catch {
      // ignore
    }
  };

  const handleSend = async () => {
    if (!selected || !text) return;
    await sendMessage({ to: selected, body: text });
    setText('');
    load();
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>WhatsApp</Typography>
      <Box sx={{ border: '1px solid #ccc', p:1, mb:2, height: 400, overflowY:'auto', display:'flex', flexDirection:'column' }}>
        {messages.map(m => (
          <Box
            key={m._id}
            sx={{
              alignSelf: m.direction === 'outbound' ? 'flex-end' : 'flex-start',
              bgcolor: m.direction === 'outbound' ? 'primary.main' : 'grey.300',
              color: m.direction === 'outbound' ? 'white' : 'black',
              mb: 1,
              p: 1,
              borderRadius: 1,
              maxWidth: '70%'
            }}
          >
            <Typography variant="caption" sx={{ display:'block' }}>
              {new Date(m.timestamp).toLocaleString()}
            </Typography>
            <Typography variant="body2">{m.body}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ display:'flex', gap:2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="contact-label">Contacto</InputLabel>
          <Select
            labelId="contact-label"
            value={selected}
            label="Contacto"
            onChange={e => setSelected(e.target.value)}
          >
            {users.map(u => (
              <MenuItem key={u._id} value={u.phoneNum}>{u.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          fullWidth
          label="Mensaje"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <Button variant="contained" onClick={handleSend}>Enviar</Button>
      </Box>
    </Container>
  );
}
