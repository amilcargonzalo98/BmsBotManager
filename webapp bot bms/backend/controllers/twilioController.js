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

const ALLOWED_ATTRIBUTES = ['lastPresentValue', 'lastUpdate', 'pointName'];
const ALLOWED_OPERATORS = ['==', '!=', '>', '>=', '<', '<='];

const isNumeric = (value) => {
  if (value === null || value === undefined) return false;
  const num = Number(value);
  return Number.isFinite(num);
};

const normalizeDate = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
};

const compareValues = (actual, expected, operator) => {
  const actualIsNumeric = isNumeric(actual);
  const expectedIsNumeric = isNumeric(expected);

  if (actualIsNumeric && expectedIsNumeric) {
    const a = Number(actual);
    const b = Number(expected);
    switch (operator) {
      case '==':
        return a === b;
      case '!=':
        return a !== b;
      case '>':
        return a > b;
      case '>=':
        return a >= b;
      case '<':
        return a < b;
      case '<=':
        return a <= b;
      default:
        return false;
    }
  }

  const aStr = actual === null || actual === undefined ? '' : String(actual).toLowerCase();
  const bStr = expected === null || expected === undefined ? '' : String(expected).toLowerCase();

  switch (operator) {
    case '==':
      return aStr === bStr;
    case '!=':
      return aStr !== bStr;
    case '>':
      return aStr > bStr;
    case '>=':
      return aStr >= bStr;
    case '<':
      return aStr < bStr;
    case '<=':
      return aStr <= bStr;
    default:
      return false;
  }
};

const formatValueWithTransformations = (rawValue, attribute, transformations, fallback) => {
  const normalizedAttribute = ALLOWED_ATTRIBUTES.includes(attribute) ? attribute : 'lastPresentValue';
  const effectiveFallback = typeof fallback === 'string' ? fallback : fallback ? String(fallback) : '';

  if (Array.isArray(transformations) && transformations.length > 0) {
    let matched = false;
    for (const rule of transformations) {
      if (
        !rule ||
        !ALLOWED_OPERATORS.includes(rule.operator) ||
        typeof rule.value === 'undefined' ||
        typeof rule.output === 'undefined'
      ) {
        continue;
      }
      if (compareValues(rawValue, rule.value, rule.operator)) {
        matched = true;
        return rule.output.toString();
      }
    }
    if (!matched && effectiveFallback) {
      return effectiveFallback;
    }
  }

  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return effectiveFallback;
  }

  if (normalizedAttribute === 'lastUpdate') {
    return normalizeDate(rawValue);
  }

  return String(rawValue);
};

const extractPointValue = (point) => {
  if (!point || !point.pointId) return { value: '', attribute: 'lastPresentValue' };

  const attribute = ALLOWED_ATTRIBUTES.includes(point.attribute) ? point.attribute : 'lastPresentValue';
  const source = point.pointId;

  if (attribute === 'pointName') {
    return { value: source.pointName ?? '', attribute };
  }

  if (attribute === 'lastUpdate') {
    return { value: source.lastUpdate ?? '', attribute };
  }

  const hasLastPresentValue = Object.prototype.hasOwnProperty.call(source, 'lastPresentValue');
  if (hasLastPresentValue) {
    return { value: source.lastPresentValue ?? '', attribute };
  }

  return { value: '', attribute };
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

      const { value, attribute } = extractPointValue(point);
      const formattedValue = formatValueWithTransformations(
        value,
        attribute,
        point.transformations,
        point.fallback,
      );

      placeholderVariants.forEach((placeholder) => {
        if (placeholder && result.includes(placeholder)) {
          result = result.split(placeholder).join(formattedValue ?? '');
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
    .populate({ path: 'points.pointId', select: 'pointName lastPresentValue lastUpdate pointId' })
    .lean();

  if (!reply) return;

  const messageBody = replacePlaceholders(reply.responseBody || '', reply.points);
  const finalMessage = messageBody.trim();
  if (!finalMessage) return;

  await sendWhatsApp(phone, finalMessage);
}
