import axios from 'axios';

export const fetchAlarms = () => axios.get('/api/alarms');
export const createAlarm = (alarm) => axios.post('/api/alarms', alarm);
export const updateAlarm = (id, alarm) => axios.put(`/api/alarms/${id}`, alarm);
export const deleteAlarm = (id) => axios.delete(`/api/alarms/${id}`);
