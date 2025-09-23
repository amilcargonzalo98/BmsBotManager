import axios from 'axios';

export const fetchClients = () => axios.get('/api/clients');
export const createClient = (client) => axios.post('/api/clients', client);
export const updateClient = (id, client) => axios.put(`/api/clients/${id}`, client);
export const deleteClient = (id) => axios.delete(`/api/clients/${id}`);
export const updateClientEnabled = (id, enabled) =>
  axios.patch(`/api/clients/${id}/enabled`, { enabled });
