import DataLog from '../models/DataLog.js';

export const getDataLogs = async (req, res) => {
  try {
    const { pointId } = req.query;
    if (!pointId) {
      return res.status(400).json({ message: 'pointId requerido' });
    }
    const logs = await DataLog.find({ pointId }).sort({ timestamp: 1 }).lean();
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener datalogs' });
  }
};
