import TwilioConfig from '../models/TwilioConfig.js';
import TwilioMessage from '../models/TwilioMessage.js';

export async function sendWhatsApp(to, body) {
  const config = await TwilioConfig.findOne();
  if (!config) throw new Error('Config not found');
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
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text);
  }

  const createdMessage = await response.json();

  await TwilioMessage.create({
    sid: createdMessage.sid,
    from: `whatsapp:${config.whatsappFrom}`,
    to: `whatsapp:${to}`,
    body,
    direction: 'outbound',
  });
}

async function sendTemplatedWhatsApp(to, username, variable2, fallbackBody) {
  const config = await TwilioConfig.findOne();
  if (!config) throw new Error('Config not found');
  if (!config.messagingServiceSid) throw new Error('Alarm sender not configured');
  if (!config.contentSid) throw new Error('Alarm template not configured');

  const params = new URLSearchParams();
  params.append('MessagingServiceSid', config.messagingServiceSid);
  params.append('To', `whatsapp:${to}`);
  params.append('ContentSid', config.contentSid);
  params.append('ContentVariables', JSON.stringify({ 1: username, 2: variable2 }));

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

  const createdMessage = await response.json();

  const messageDetailsUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages/${createdMessage.sid}.json`;
  const messageDetailsResponse = await fetch(messageDetailsUrl, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!messageDetailsResponse.ok) {
    const text = await messageDetailsResponse.text();
    throw new Error(text);
  }

  const messageDetails = await messageDetailsResponse.json();
  const finalBody = (messageDetails.body ?? '').trim().length > 0
    ? messageDetails.body
    : fallbackBody;

  await TwilioMessage.create({
    sid: createdMessage.sid,
    from: messageDetails.from ?? `messaging:${config.messagingServiceSid}`,
    to: `whatsapp:${to}`,
    body: finalBody,
    direction: 'outbound'
  });
}

export async function sendAlarmWhatsApp(to, username, alarmName) {
  const fallbackBody = `Alarma "${alarmName}" reportada para ${username}`;
  await sendTemplatedWhatsApp(to, username, alarmName, fallbackBody);
}

export async function sendClientOfflineWhatsApp(to, username, clientName) {
  const offlineMessage = `Cliente "${clientName}" fuera de linea`;
  await sendTemplatedWhatsApp(to, username, offlineMessage, offlineMessage);
}
