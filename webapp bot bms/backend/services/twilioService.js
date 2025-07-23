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
  await TwilioMessage.create({
    from: `whatsapp:${config.whatsappFrom}`,
    to: `whatsapp:${to}`,
    body,
    direction: 'outbound',
  });
}

export async function sendAlarmWhatsApp(to, username, pointName) {
  const config = await TwilioConfig.findOne();
  if (!config) throw new Error('Config not found');
  if (!config.messagingServiceSid || !config.contentSid) throw new Error('Alarm sender not configured');

  const params = new URLSearchParams();
  params.append('MessagingServiceSid', config.messagingServiceSid);
  params.append('To', `whatsapp:${to}`);
  params.append('ContentSid', config.contentSid);
  params.append('ContentVariables', JSON.stringify({ 1: username, 2: pointName }));

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

  await TwilioMessage.create({
    from: `messaging:${config.messagingServiceSid}`,
    to: `whatsapp:${to}`,
    body: `Alarma en ${pointName}`,
    direction: 'outbound'
  });
}
