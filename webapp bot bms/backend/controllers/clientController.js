import Client from '../models/Client.js';
import crypto from 'crypto';

function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

export const getClients = async (req, res) => {
  try {
    const clients = await Client.find();
    const now = Date.now();
    for (const client of clients) {
      const connected =
        client.lastReport && now - client.lastReport.getTime() <= 60000;
      if (client.connectionStatus !== connected) {
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
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { enabled: Boolean(enabled) },
      { new: true }
    );
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar cliente' });
  }
};
