import axios from 'axios';

export const fetchPoints = (clientId, groupId) => {
  const params = {};
  if (clientId) params.clientId = clientId;
  if (groupId) params.groupId = groupId;
  return axios.get('/api/points', { params });
};

export const updatePointGroup = (id, groupId) =>
  axios.patch(`/api/points/${id}/group`, { groupId });
