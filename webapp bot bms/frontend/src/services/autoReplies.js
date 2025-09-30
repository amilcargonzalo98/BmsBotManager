import axios from 'axios';

export const fetchAutoReplies = (groupId) => {
  const params = {};
  if (groupId) params.groupId = groupId;
  return axios.get('/api/auto-replies', { params });
};

export const createAutoReply = (payload) => axios.post('/api/auto-replies', payload);

export const updateAutoReply = (id, payload) => axios.put(`/api/auto-replies/${id}`, payload);

export const deleteAutoReply = (id) => axios.delete(`/api/auto-replies/${id}`);
