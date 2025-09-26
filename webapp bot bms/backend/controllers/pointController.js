import Client from '../models/Client.js';
import Point from '../models/Point.js';
import DataLog from '../models/DataLog.js';
import Alarm from '../models/Alarm.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import Group from '../models/Group.js';
import { sendAlarmWhatsApp } from '../services/twilioService.js';

const LOG_INTERVAL_MS = 15 * 60 * 1000;

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

    const reportedNames = points.map((p) => p.pointName);

    for (const p of points) {
      const { pointName, ipAddress, pointType, pointId, presentValue } = p;

      let point = await Point.findOne({ pointName, clientId: client._id });
      const now = new Date();

      if (!point) {
        point = await Point.create({
          pointName,
          ipAddress,
          pointType,
          pointId,
          clientId: client._id,
          lastPresentValue: presentValue,
          lastUpdate: now,
        });
      } else {
        point.ipAddress = ipAddress;
        point.pointType = pointType;
        point.pointId = pointId;
        point.lastPresentValue = presentValue;
        point.lastUpdate = now;
        await point.save();
      }

      const lastLog = await DataLog.findOne({ pointId: point._id })
        .sort({ timestamp: -1 })
        .lean();

      const shouldLog =
        !lastLog || now.getTime() - new Date(lastLog.timestamp).getTime() >= LOG_INTERVAL_MS;

      if (shouldLog) {
        await DataLog.create({ pointId: point._id, presentValue, timestamp: now });
      }

      const alarms = await Alarm.find({ pointId: point._id });
      for (const alarm of alarms) {
        let triggered = false;
        if (alarm.conditionType === 'true') triggered = Boolean(presentValue) === true;
        else if (alarm.conditionType === 'false') triggered = Boolean(presentValue) === false;
        else if (alarm.conditionType === 'gt') triggered = Number(presentValue) >= Number(alarm.threshold);
        else if (alarm.conditionType === 'lt') triggered = Number(presentValue) <= Number(alarm.threshold);

        if (triggered) {
          if (!alarm.active) {
            try {
              await Event.create({
                eventType: 'Alarm',
                pointId: point._id,
                presentValue,
                groupId: point.groupId || undefined,
              });
            } catch (e) {
              console.error('Error registrando evento', e.message);
            }
            const users = await User.find({ groups: alarm.groupId });
            for (const u of users) {
              if (u.phoneNum) {
                try {
                  await sendAlarmWhatsApp(u.phoneNum, u.username, alarm.alarmName);
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

    const toRemove = await Point.find({
      clientId: client._id,
      pointName: { $nin: reportedNames },
    }).select('_id');

    if (toRemove.length > 0) {
      const ids = toRemove.map((p) => p._id);
      await Promise.all([
        Point.deleteMany({ _id: { $in: ids } }),
        Alarm.deleteMany({ pointId: { $in: ids } }),
        Group.updateMany({ points: { $in: ids } }, { $pull: { points: { $in: ids } } }),
      ]);
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
      andConditions.push({ groupId });
    }

    const filter = andConditions.length > 0 ? { $and: andConditions } : {};

    const points = await Point.find(filter)
      .populate('clientId')
      .populate('groupId')
      .lean();

    const result = await Promise.all(
      points.map(async (p) => {
        const { lastPresentValue, lastUpdate, ...rest } = p;

        if (typeof lastPresentValue !== 'undefined' && lastUpdate) {
          return {
            ...rest,
            lastValue: { presentValue: lastPresentValue, timestamp: lastUpdate },
          };
        }

        const lastLog = await DataLog.findOne({ pointId: p._id })
          .sort({ timestamp: -1 })
          .lean();

        return {
          ...rest,
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

export const updatePointGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { groupId } = req.body || {};

    const point = await Point.findById(id);
    if (!point) {
      return res.status(404).json({ message: 'Punto no encontrado' });
    }

    let targetGroup = null;
    if (groupId) {
      targetGroup = await Group.findById(groupId);
      if (!targetGroup) {
        return res.status(404).json({ message: 'Grupo no encontrado' });
      }
    }

    const operations = [];
    if (groupId) {
      operations.push(
        Group.updateMany(
          { _id: { $ne: targetGroup._id }, points: point._id },
          { $pull: { points: point._id } }
        )
      );
      operations.push(
        Group.updateOne({ _id: targetGroup._id }, { $addToSet: { points: point._id } })
      );
      point.groupId = targetGroup._id;
    } else {
      operations.push(
        Group.updateMany({ points: point._id }, { $pull: { points: point._id } })
      );
      point.groupId = null;
    }

    if (operations.length > 0) {
      await Promise.all(operations);
    }

    await point.save();

    const updatedPoint = await Point.findById(point._id)
      .populate('clientId')
      .populate('groupId')
      .lean();

    const { lastPresentValue, lastUpdate, ...rest } = updatedPoint;

    res.json({
      ...rest,
      lastValue:
        typeof lastPresentValue !== 'undefined' && lastUpdate
          ? { presentValue: lastPresentValue, timestamp: lastUpdate }
          : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar grupo del punto' });
  }
};
