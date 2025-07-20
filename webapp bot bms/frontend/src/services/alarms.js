import axios from 'axios';

export const fetchAlarms = () => axios.get('/api/alarms');
export const createAlarm = (alarm) => axios.post('/api/alarms', alarm);
export const deleteAlarm = (id) => axios.delete(`/api/alarms/${id}`);
