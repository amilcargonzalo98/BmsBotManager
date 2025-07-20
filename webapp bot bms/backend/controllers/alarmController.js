import Alarm from '../models/Alarm.js';

export const getAlarms = async (req, res) => {
  try {
    const alarms = await Alarm.find().populate('pointId').populate('groupId');
    res.json(alarms);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener alarmas' });
  }
};

export const createAlarm = async (req, res) => {
  try {
    const alarm = await Alarm.create(req.body);
    res.status(201).json(alarm);
  } catch (err) {
    res.status(500).json({ message: 'Error al crear alarma' });
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
