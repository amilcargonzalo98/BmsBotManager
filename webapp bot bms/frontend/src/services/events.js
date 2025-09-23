import axios from 'axios';

export const fetchEvents = ({ page = 1, limit = 10, groupId } = {}) => {
  const params = { page, limit };
  if (groupId) {
    params.groupId = groupId;
  }
  return axios.get('/api/events', { params });
};
