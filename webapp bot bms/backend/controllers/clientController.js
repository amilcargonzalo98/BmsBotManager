import mongoose from 'mongoose';
import Client from '../models/Client.js';
import crypto from 'crypto';
import Point from '../models/Point.js';
import Alarm from '../models/Alarm.js';
import Group from '../models/Group.js';
import {
  sendClientOfflineWhatsApp,
  sendClientOnlineWhatsApp,
} from '../services/twilioService.js';

function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

const normalizeGroupIds = (values) => {
  const list = Array.isArray(values)
    ? values
    : typeof values === 'undefined' || values === null
      ? []
      : [values];
  const seen = new Set();
  const result = [];
  list.forEach((value) => {
    if (!value) return;
    try {
      const objectId = new mongoose.Types.ObjectId(value);
      const key = objectId.toString();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(objectId);
      }
    } catch (err) {
      // Ignore invalid ids
    }
  });
  return result;
};

export const getClients = async (req, res) => {
  try {
    const clients = await Client.find().populate({ path: 'groups', select: 'groupName' });
    const now = Date.now();
    for (const client of clients) {
      const connected = Boolean(
        client.lastReport && now - client.lastReport.getTime() <= 90000
      );
      if (client.connectionStatus !== connected) {
        const clientLabel =
          client.clientName || client._id?.toString() || 'desconocido';

        const notifyUsers = async (sendFn, actionLabel) => {
          try {
            const relatedPoints = await Point.find({ clientId: client._id }).select('_id');
            if (relatedPoints.length === 0) {
              return;
            }
            const pointIds = relatedPoints.map((p) => p._id);
            const groups = await Group.find({ points: { $in: pointIds } })
              .populate({ path: 'users', select: 'phoneNum username' })
              .lean();

            const notified = new Set();
            for (const group of groups) {
              if (!Array.isArray(group.users)) continue;
              for (const user of group.users) {
                if (!user?.phoneNum || notified.has(user.phoneNum)) continue;
                try {
                  await sendFn(user.phoneNum, user.username, clientLabel);
                  notified.add(user.phoneNum);
                } catch (error) {
                  console.error(
                    `Error enviando WhatsApp de ${actionLabel}`,
                    error.message
                  );
                }
              }
            }
          } catch (error) {
            console.error(
              `Error al notificar ${actionLabel} del cliente`,
              error.message
            );
          }
        };

        if (client.connectionStatus === true && !connected) {
          await notifyUsers(sendClientOfflineWhatsApp, 'desconexión');
        } else if (client.connectionStatus === false && connected) {
          await notifyUsers(sendClientOnlineWhatsApp, 'reconexión');
        }

        client.connectionStatus = connected;
        await client.save();
      }
    }
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener clientes' });
  }
};

export const createClient = async (req, res) => {
  try {
    const payload = req.body || {};
    const groups = normalizeGroupIds(payload.groups ?? payload.groupId);
    const data = {
      clientName: payload.clientName,
      location: payload.location,
      ipAddress: payload.ipAddress || '',
      enabled: payload.enabled,
      connectionStatus: payload.connectionStatus,
      lastReport: payload.lastReport,
      groups,
      apiKey: generateApiKey(),
    };
    Object.keys(data).forEach((key) => {
      if (typeof data[key] === 'undefined') {
        delete data[key];
      }
    });
    const newClient = await Client.create(data);
    await newClient.populate({ path: 'groups', select: 'groupName' });
    res.status(201).json(newClient);
  } catch (err) {
    res.status(500).json({ message: 'Error al crear cliente' });
  }
};

export const updateClient = async (req, res) => {
  try {
    const payload = req.body || {};
    const updateData = {};

    if (Object.prototype.hasOwnProperty.call(payload, 'clientName') && typeof payload.clientName !== 'undefined') {
      updateData.clientName = payload.clientName;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'location') && typeof payload.location !== 'undefined') {
      updateData.location = payload.location;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'ipAddress') && typeof payload.ipAddress !== 'undefined') {
      updateData.ipAddress = payload.ipAddress;
    }

    if (
      Object.prototype.hasOwnProperty.call(payload, 'groups') ||
      Object.prototype.hasOwnProperty.call(payload, 'groupId')
    ) {
      const source = Object.prototype.hasOwnProperty.call(payload, 'groups')
        ? payload.groups
        : payload.groupId;
      updateData.groups = normalizeGroupIds(source);
    }

    const client = await Client.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate({ path: 'groups', select: 'groupName' });

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
    }
    await client.save();
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar cliente' });
  }
};
