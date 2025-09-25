import Alarm from '../models/Alarm.js';

const MONITOR_TYPES = ['point', 'clientConnection'];

function buildAlarmPayload(input, fallbackMonitorType = 'point') {
  const monitorType = input.monitorType ?? fallbackMonitorType ?? 'point';
  if (!MONITOR_TYPES.includes(monitorType)) {
    throw new Error('Tipo de monitoreo inválido');
  }

  const alarmName = input.alarmName;
  const groupId = input.groupId;
  const conditionType = input.conditionType;

  if (!alarmName) {
    throw new Error('Nombre de alarma requerido');
  }

  if (!groupId) {
    throw new Error('Grupo requerido');
  }

  if (!conditionType) {
    throw new Error('Condición requerida');
  }

  if (!['true', 'false', 'gt', 'lt'].includes(conditionType)) {
    throw new Error('Condición inválida');
  }

  if (monitorType === 'clientConnection') {
    const clientId = input.clientId;
    if (!clientId) {
      throw new Error('Cliente requerido para alarmas de conexión');
    }
    if (conditionType !== 'gt' && conditionType !== 'lt') {
      throw new Error('Condición inválida para alarmas de conexión');
    }
    const numericThreshold = Number(input.threshold);
    if (!Number.isFinite(numericThreshold) || numericThreshold < 0) {
      throw new Error('El umbral debe ser un número válido de segundos');
    }
    return {
      alarmName,
      groupId,
      conditionType,
      monitorType,
      clientId,
      pointId: null,
      threshold: numericThreshold,
    };
  }

  const pointId = input.pointId;
  if (!pointId) {
    throw new Error('Punto requerido');
  }

  let threshold = null;
  if (conditionType === 'gt' || conditionType === 'lt') {
    const numericThreshold = Number(input.threshold);
    if (!Number.isFinite(numericThreshold)) {
      throw new Error('El umbral debe ser un número válido');
    }
    threshold = numericThreshold;
  }

  return {
    alarmName,
    groupId,
    conditionType,
    monitorType: 'point',
    pointId,
    clientId: null,
    threshold,
  };
}

export const getAlarms = async (req, res) => {
  try {
    const alarms = await Alarm.find()
      .populate('pointId')
      .populate('groupId')
      .populate('clientId');
    res.json(alarms);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener alarmas' });
  }
};

export const createAlarm = async (req, res) => {
  let payload;
  try {
    payload = buildAlarmPayload(req.body);
  } catch (validationError) {
    return res.status(400).json({ message: validationError.message });
  }

  try {
    const alarm = await Alarm.create(payload);
    res.status(201).json(alarm);
  } catch (err) {
    res.status(500).json({ message: 'Error al crear alarma' });
  }
};

export const updateAlarm = async (req, res) => {
  try {
    const existing = await Alarm.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Alarma no encontrada' });
    }

    let payload;
    try {
      payload = buildAlarmPayload(req.body, existing.monitorType ?? 'point');
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }

    const alarm = await Alarm.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    res.json(alarm);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar alarma' });
  }
};

export const deleteAlarm = async (req, res) => {
  try {
    await Alarm.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar alarma' });
  }
};
