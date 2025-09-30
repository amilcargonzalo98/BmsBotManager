import TwilioConfig from '../models/TwilioConfig.js';
import TwilioMessage from '../models/TwilioMessage.js';
import User from '../models/User.js';
import AutoReply from '../models/AutoReply.js';
import { sendWhatsApp } from '../services/twilioService.js';

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
      sid: data.sid,
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
        sid: req.body.MessageSid,
        from: From,
        to: To,
        body: Body,
        direction: 'inbound'
      });
      handleAutoReply(From, Body).catch((err) => {
        console.error('Error enviando respuesta automática', err);
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

export const deleteChat = async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      return res.status(400).json({ message: 'Teléfono requerido' });
    }

    const trimmed = phone.trim();
    if (!trimmed) {
      return res.status(400).json({ message: 'Teléfono requerido' });
    }

    const normalized = trimmed.startsWith('whatsapp:') ? trimmed : `whatsapp:${trimmed}`;

    const result = await TwilioMessage.deleteMany({
      $or: [{ from: normalized }, { to: normalized }]
    });

    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar el chat' });
  }
};

const cleanPhone = (value) => {
  if (!value) return '';
  return value.toString().replace(/^whatsapp:/i, '').trim();
};

const replacePlaceholders = (template, replyPoints) => {
  if (typeof template !== 'string') return '';
  let result = template;
  if (Array.isArray(replyPoints)) {
    replyPoints.forEach((point) => {
      if (!point || !point.token) return;
      const placeholderVariants = new Set();
      placeholderVariants.add(`{{${point.token}}}`);
      placeholderVariants.add(`{${point.token}}`);
      if (point.alias) {
        const aliasTrimmed = point.alias.trim();
        if (aliasTrimmed) {
          placeholderVariants.add(`{{${aliasTrimmed}}}`);
          placeholderVariants.add(`{${aliasTrimmed}}`);
        }
      }

      const pointValue = (() => {
        if (point.pointId && Object.prototype.hasOwnProperty.call(point.pointId, 'lastPresentValue')) {
          const value = point.pointId.lastPresentValue;
          return value === null || value === undefined ? '' : String(value);
        }
        return '';
      })();

      placeholderVariants.forEach((placeholder) => {
        if (placeholder && result.includes(placeholder)) {
          result = result.split(placeholder).join(pointValue);
        }
      });
    });
  }
  return result;
};

async function handleAutoReply(from, body) {
  const normalizedBody = (body || '').toString().trim().toLowerCase();
  if (!normalizedBody) return;

  const phone = cleanPhone(from);
  if (!phone) return;

  const user = await User.findOne({ phoneNum: phone }).select('groups').lean();
  if (!user || !Array.isArray(user.groups) || user.groups.length === 0) return;

  const groupIds = user.groups.map((g) => {
    if (!g) return null;
    if (typeof g === 'string') return g;
    if (g._id) return g._id.toString();
    try {
      return g.toString();
    } catch (err) {
      return null;
    }
  }).filter(Boolean);

  if (groupIds.length === 0) return;

  const reply = await AutoReply.findOne({
    groupId: { $in: groupIds },
    normalizedKeyword: normalizedBody,
    isActive: true,
  })
    .sort({ updatedAt: -1 })
    .populate({ path: 'points.pointId', select: 'pointName lastPresentValue pointId' })
    .lean();

  if (!reply) return;

  const messageBody = replacePlaceholders(reply.responseBody || '', reply.points);
  const finalMessage = messageBody.trim();
  if (!finalMessage) return;

  await sendWhatsApp(phone, finalMessage);
}
