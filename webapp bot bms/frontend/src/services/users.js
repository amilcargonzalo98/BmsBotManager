import axios from 'axios';

export const fetchUsers = () => axios.get('/api/users');
export const createUser = (user) => axios.post('/api/users', user);
export const updateUser = (id, user) => axios.put(`/api/users/${id}`, user);
export const deleteUser = (id) => axios.delete(`/api/users/${id}`);
