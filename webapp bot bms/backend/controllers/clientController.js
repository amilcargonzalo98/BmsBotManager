import Client from '../models/Client.js';
import crypto from 'crypto';
import Point from '../models/Point.js';
import Alarm from '../models/Alarm.js';
import User from '../models/User.js';
import { sendClientOfflineWhatsApp } from '../services/twilioService.js';

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
        if (client.connectionStatus === true && !connected) {
          const clientLabel =
            client.clientName || client._id?.toString() || 'desconocido';
          try {
            if (client.groupId) {
              const users = await User.find({ groupId: client.groupId });
              for (const user of users) {
                if (!user.phoneNum) continue;
                try {
                  await sendClientOfflineWhatsApp(
                    user.phoneNum,
                    user.username,
                    clientLabel
                  );
                } catch (error) {
                  console.error(
                    'Error enviando WhatsApp de desconexión',
                    error.message
                  );
                }
              }
            }
          } catch (error) {
            console.error(
              'Error al notificar desconexión del cliente',
              error.message
            );
          }
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
