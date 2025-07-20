import axios from 'axios';

export const fetchConfig = () => axios.get('/api/twilio');
export const saveConfig = (config) => axios.post('/api/twilio', config);
export const sendTestMessage = (data) => axios.post('/api/twilio/send', data);
export const sendMessage = (data) => axios.post('/api/twilio/send', data);
export const fetchMessages = () => axios.get('/api/twilio/messages');
