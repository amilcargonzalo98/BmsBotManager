import Client from '../models/Client.js';
import crypto from 'crypto';
import Point from '../models/Point.js';
import Alarm from '../models/Alarm.js';
import User from '../models/User.js';
import {
  sendClientOfflineWhatsApp,
  sendClientOnlineWhatsApp,
} from '../services/twilioService.js';

function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

export const getClients = async (req, res) => {
  try {
    const clients = await Client.find();
    const now = Date.now();
    for (const client of clients) {
      const connected = Boolean(
        client.lastReport && now - client.lastReport.getTime() <= 90000
      );
      if (client.connectionStatus !== connected) {
        const clientLabel =
          client.clientName || client._id?.toString() || 'desconocido';

        const notifyUsers = async (sendFn, actionLabel) => {
          if (!client.groupId) return;
          try {
            const users = await User.find({ groupId: client.groupId });
            for (const user of users) {
              if (!user.phoneNum) continue;
              try {
                await sendFn(user.phoneNum, user.username, clientLabel);
              } catch (error) {
                console.error(
                  `Error enviando WhatsApp de ${actionLabel}`,
                  error.message
                );
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
    const allowedFields = ['clientName', 'location', 'groupId', 'ipAddress'];
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
    }
    await client.save();
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar cliente' });
  }
};
