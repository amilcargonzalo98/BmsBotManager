import TwilioConfig from '../models/TwilioConfig.js';
import TwilioMessage from '../models/TwilioMessage.js';

export const getConfig = async (req, res) => {
  const config = await TwilioConfig.findOne();
  res.json(config || {});
};

export const updateConfig = async (req, res) => {
  try {
    const { accountSid, authToken, whatsappFrom, messagingServiceSid, contentSid } = req.body;
    let config = await TwilioConfig.findOne();
    if (config) {
      config.accountSid = accountSid;
      config.authToken = authToken;
      config.whatsappFrom = whatsappFrom;
      config.messagingServiceSid = messagingServiceSid;
      config.contentSid = contentSid;
      await config.save();
    } else {
      config = await TwilioConfig.create({ accountSid, authToken, whatsappFrom, messagingServiceSid, contentSid });
    }
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: 'Error al guardar configuración' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { to, body } = req.body;
    const config = await TwilioConfig.findOne();
    if (!config) return res.status(400).json({ message: 'Config no encontrada' });
    const params = new URLSearchParams();
    params.append('From', `whatsapp:${config.whatsappFrom}`);
    params.append('To', `whatsapp:${to}`);
    params.append('Body', body);

    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
    const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }

    const data = await response.json();

    await TwilioMessage.create({
      from: `whatsapp:${config.whatsappFrom}`,
      to: `whatsapp:${to}`,
      body,
      direction: 'outbound'
    });

    res.json({ sid: data.sid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al enviar mensaje' });
  }
};

export const twilioWebhook = async (req, res) => {
  try {
    const { From, To, Body } = req.body;
    if (From && Body) {
      await TwilioMessage.create({
        from: From,
        to: To,
        body: Body,
        direction: 'inbound'
      });
    }
    res.set('Content-Type', 'text/plain');
    res.send('');
  } catch (err) {
    console.error(err);
    res.status(500).send('');
  }
};

export const getMessages = async (req, res) => {
  try {
    const msgs = await TwilioMessage.find().sort({ timestamp: -1 });
    res.json(msgs);
  } catch {
    res.status(500).json({ message: 'Error al obtener mensajes' });
  }
};
