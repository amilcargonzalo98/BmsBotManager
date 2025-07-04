import axios from 'axios';

export const fetchGroups = () => axios.get('/api/groups');
export const createGroup = (group) => axios.post('/api/groups', group);
export const deleteGroup = (id) => axios.delete(`/api/groups/${id}`);
