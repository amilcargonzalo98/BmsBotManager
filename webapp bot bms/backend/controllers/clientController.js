import Client from '../models/Client.js';
import crypto from 'crypto';
import Point from '../models/Point.js';
import Alarm from '../models/Alarm.js';
import User from '../models/User.js';
import { sendAlarmWhatsApp } from '../services/twilioService.js';

function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

export const getClients = async (req, res) => {
  try {
    const [clients, connectionAlarms] = await Promise.all([
      Client.find(),
      Alarm.find({ monitorType: 'clientConnection' }),
    ]);

    const alarmsByClient = new Map();
    for (const alarm of connectionAlarms) {
      const clientKey = alarm.clientId?.toString();
      if (!clientKey) continue;
      if (!alarmsByClient.has(clientKey)) {
        alarmsByClient.set(clientKey, []);
      }
      alarmsByClient.get(clientKey).push(alarm);
    }

    const now = Date.now();
    for (const client of clients) {
      const connected = Boolean(
        client.lastReport && now - client.lastReport.getTime() <= 90000
      );

      if (client.connectionStatus !== connected) {
        client.connectionStatus = connected;
        await client.save();
      }

      const clientAlarms = alarmsByClient.get(client._id.toString());
      if (!clientAlarms || clientAlarms.length === 0) {
        continue;
      }

      const secondsWithoutReport =
        client.lastReport instanceof Date
          ? (now - client.lastReport.getTime()) / 1000
          : Number.POSITIVE_INFINITY;

      for (const alarm of clientAlarms) {
        let triggered = false;
        const threshold = Number(alarm.threshold ?? 0);
        if (alarm.conditionType === 'gt') {
          triggered = secondsWithoutReport >= threshold;
        } else if (alarm.conditionType === 'lt') {
          triggered = secondsWithoutReport <= threshold;
        }

        if (triggered && !alarm.active) {
          try {
            const users = await User.find({ groupId: alarm.groupId });
            for (const u of users) {
              if (!u?.phoneNum) continue;
              try {
                await sendAlarmWhatsApp(u.phoneNum, u.username, alarm.alarmName);
              } catch (error) {
                console.error('Error enviando WhatsApp de alarma', error.message);
              }
            }
          } catch (error) {
            console.error('Error al notificar alarma de conexión', error.message);
          }
          alarm.active = true;
          await alarm.save();
        } else if (!triggered && alarm.active) {
          alarm.active = false;
          await alarm.save();
        }
      }
    }
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener clientes' });
  }
};

export const createClient = async (req, res) => {
  try {
    const data = {
      ...req.body,
      apiKey: generateApiKey(),
      ipAddress: '',
    };
    const newClient = await Client.create(data);
    res.status(201).json(newClient);
  } catch (err) {
    res.status(500).json({ message: 'Error al crear cliente' });
  }
};

export const updateClient = async (req, res) => {
  try {
    const allowedFields = ['clientName', 'location', 'ipAddress'];
    const updateData = {};
    for (const field of allowedFields) {
      if (field in req.body) {
        updateData[field] = req.body[field];
      }
    }

    const client = await Client.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.json(client);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar cliente' });
  }
};

export const deleteClient = async (req, res) => {
  try {
    await Client.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar cliente' });
  }
};

export const updateClientEnabled = async (req, res) => {
  try {
    const { enabled } = req.body;
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    client.enabled = Boolean(enabled);
    if (!client.enabled) {
      client.connectionStatus = false;
      client.lastReport = null;
      const points = await Point.find({ clientId: client._id }).select('_id');
      const pointIds = points.map((p) => p._id);
      if (pointIds.length > 0) {
        await Alarm.updateMany({ pointId: { $in: pointIds } }, { active: false });
      }
      await Alarm.updateMany(
        { clientId: client._id, monitorType: 'clientConnection' },
        { active: false }
      );
    }
    await client.save();
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar cliente' });
  }
};
