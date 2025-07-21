import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button
} from '@mui/material';
import { fetchMessages, sendMessage } from '../services/twilio';
import { fetchUsers } from '../services/users';

export default function WhatsappPage() {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState('');
  const [text, setText] = useState('');
  const chatBoxRef = useRef(null);

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('es-ES') + ', ' + d.toLocaleTimeString('es-ES', { hour12: false });
  };

  const chats = useMemo(() => {
    const map = {};
    messages.forEach(m => {
      const phone = m.direction === 'outbound'
        ? m.to.replace('whatsapp:', '')
        : m.from.replace('whatsapp:', '');
      if (!map[phone]) map[phone] = [];
      map[phone].push(m);
    });
    return map;
  }, [messages]);

  const chatList = useMemo(() => {
    return Object.entries(chats).sort((a, b) => {
      const lastA = a[1][a[1].length - 1].timestamp;
      const lastB = b[1][b[1].length - 1].timestamp;
      return new Date(lastB) - new Date(lastA);
    });
  }, [chats]);

  useEffect(() => {
    if (!selected && chatList.length > 0) {
      setSelected(chatList[0][0]);
    }
  }, [chatList, selected]);

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

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, selected]);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>WhatsApp</Typography>
      <Box sx={{ display:'flex', border:'1px solid #ccc', height:400, mb:2 }}>
        <Box sx={{ width:250, borderRight:'1px solid #ccc', overflowY:'auto' }}>
          {chatList.map(([phone, msgs]) => {
            const last = msgs[msgs.length - 1];
            const user = users.find(u => u.phoneNum === phone);
            return (
              <Box
                key={phone}
                onClick={() => setSelected(phone)}
                sx={{ p:1, cursor:'pointer', bgcolor:selected===phone?'grey.300':undefined }}
              >
                <Typography variant="subtitle2">{user ? user.name : phone}</Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {last.body}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(last.timestamp)} ({last.direction === 'outbound' ? 'tu' : (user ? user.name : phone)})
                </Typography>
              </Box>
            );
          })}
        </Box>
        <Box sx={{ flexGrow:1, display:'flex', flexDirection:'column' }}>
          <Box ref={chatBoxRef} sx={{ p:1, flexGrow:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
            {(chats[selected] || []).map(m => (
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
                  {formatDate(m.timestamp)}
                </Typography>
                <Typography variant="body2">{m.body}</Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{ display:'flex', gap:2, p:1, borderTop:'1px solid #ccc' }}>
            <TextField
              fullWidth
              label="Mensaje"
              value={text}
              onChange={e => setText(e.target.value)}
              size="small"
            />
            <Button variant="contained" onClick={handleSend} disabled={!selected}>Enviar</Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
