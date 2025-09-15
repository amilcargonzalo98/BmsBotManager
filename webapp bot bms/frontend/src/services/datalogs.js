import axios from 'axios';

export const fetchDataLogs = (pointId) => axios.get('/api/datalogs', { params: { pointId } });
