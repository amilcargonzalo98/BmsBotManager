import axios from 'axios';

export const fetchPoints = (clientId, groupId) => {
  const params = {};
  if (clientId) params.clientId = clientId;
  if (groupId) params.groupId = groupId;
  return axios.get('/api/points', { params });
};
