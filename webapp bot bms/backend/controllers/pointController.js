import Client from '../models/Client.js';
import Point from '../models/Point.js';
import DataLog from '../models/DataLog.js';

export const reportState = async (req, res) => {
  try {
    const { apiKey, points } = req.body;

    if (!apiKey) {
      return res.status(400).json({ message: 'apiKey requerido' });
    }

    const client = await Client.findOne({ apiKey });
    if (!client) {
      return res.status(401).json({ message: 'apiKey inválido' });
    }

    if (!Array.isArray(points) || points.length === 0) {
      return res.status(400).json({ message: 'points es requerido' });
    }

    for (const p of points) {
      const { pointName, ipAddress, pointType, pointId, presentValue } = p;

      let point = await Point.findOne({ pointName, clientId: client._id });
      if (!point) {
        point = await Point.create({
          pointName,
          ipAddress,
          pointType,
          pointId,
          clientId: client._id
        });
      }

      await DataLog.create({ pointId: point._id, presentValue });
    }

    res.status(201).json({ message: 'Estados registrados', count: points.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al procesar datos' });
  }
};

