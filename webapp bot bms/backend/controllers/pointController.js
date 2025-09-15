import Client from '../models/Client.js';
import Point from '../models/Point.js';
import DataLog from '../models/DataLog.js';
import Alarm from '../models/Alarm.js';
import User from '../models/User.js';
import { sendAlarmWhatsApp } from '../services/twilioService.js';

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
    if (!client.enabled) {
      client.connectionStatus = false;
      await client.save();
      return res.status(403).json({ message: 'Cliente deshabilitado' });
    }

    if (!Array.isArray(points) || points.length === 0) {
      return res.status(400).json({ message: 'points es requerido' });
    }

    client.lastReport = new Date();
    client.connectionStatus = true;
    await client.save();

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

      const alarms = await Alarm.find({ pointId: point._id });
      for (const alarm of alarms) {
        let triggered = false;
        if (alarm.conditionType === 'true') triggered = Boolean(presentValue) === true;
        else if (alarm.conditionType === 'false') triggered = Boolean(presentValue) === false;
        else if (alarm.conditionType === 'gt') triggered = Number(presentValue) >= Number(alarm.threshold);
        else if (alarm.conditionType === 'lt') triggered = Number(presentValue) <= Number(alarm.threshold);

        if (triggered) {
          if (!alarm.active) {
            const users = await User.find({ groupId: alarm.groupId });
            for (const u of users) {
              if (u.phoneNum) {
                try {
                  await sendAlarmWhatsApp(u.phoneNum, u.username, point.pointName);
                } catch (e) {
                  console.error('Error enviando WhatsApp', e.message);
                }
              }
            }
            alarm.active = true;
            await alarm.save();
          }
        } else if (alarm.active) {
          alarm.active = false;
          await alarm.save();
        }
      }
    }

    res.status(201).json({ message: 'Estados registrados', count: points.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al procesar datos' });
  }
};

export const getPoints = async (req, res) => {
  try {
    const { clientId, groupId } = req.query;
    const andConditions = [];

    if (clientId) {
      andConditions.push({ clientId });
    }

    if (groupId) {
      const clients = await Client.find({ groupId }).select('_id');
      const clientIds = clients.map((c) => c._id);
      andConditions.push({
        $or: [{ groupId }, { clientId: { $in: clientIds } }],
      });
    }

    const filter = andConditions.length > 0 ? { $and: andConditions } : {};

    const points = await Point.find(filter)
      .populate('clientId')
      .populate('groupId')
      .lean();

    const result = await Promise.all(
      points.map(async (p) => {
        const lastLog = await DataLog.findOne({ pointId: p._id })
          .sort({ timestamp: -1 })
          .lean();
        return {
          ...p,
          lastValue: lastLog
            ? { presentValue: lastLog.presentValue, timestamp: lastLog.timestamp }
            : null,
        };
      })
    );
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener puntos' });
  }
};
