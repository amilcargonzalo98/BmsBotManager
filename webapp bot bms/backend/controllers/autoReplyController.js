import mongoose from 'mongoose';
import AutoReply, { sanitizeToken } from '../models/AutoReply.js';

const populateConfig = [
  { path: 'groupId', select: 'groupName' },
  { path: 'points.pointId', select: 'pointName pointId lastPresentValue' },
];

const formatPointsPayload = (points) => {
  if (!Array.isArray(points)) return [];
  return points
    .filter((p) => p && p.pointId)
    .map((p) => {
      const alias = (p.alias || '').toString().trim();
      const token = sanitizeToken(p.token || alias);
      return {
        alias: alias || token || '',
        token,
        pointId: p.pointId,
      };
    })
    .filter((p) => p.alias && p.token);
};

const handleDuplicateError = (res, err) => {
  if (err?.code === 11000) {
    return res.status(409).json({ message: 'Ya existe una respuesta para esa palabra clave en el grupo seleccionado' });
  }
  return res.status(500).json({ message: 'Error en el servidor' });
};

export const getAutoReplies = async (req, res) => {
  try {
    const { groupId } = req.query;
    const filter = {};
    if (groupId && mongoose.isValidObjectId(groupId)) {
      filter.groupId = groupId;
    }
    const replies = await AutoReply.find(filter)
      .sort({ updatedAt: -1 })
      .populate(populateConfig);
    res.json(replies);
  } catch (err) {
    console.error('Error obteniendo respuestas automáticas', err);
    res.status(500).json({ message: 'Error al obtener respuestas automáticas' });
  }
};

export const createAutoReply = async (req, res) => {
  try {
    const { groupId, keyword, responseBody, points, isActive = true } = req.body;

    if (!groupId || !mongoose.isValidObjectId(groupId)) {
      return res.status(400).json({ message: 'Grupo inválido' });
    }

    if (!keyword || !keyword.toString().trim()) {
      return res.status(400).json({ message: 'La palabra clave es obligatoria' });
    }

    if (!responseBody || !responseBody.toString().trim()) {
      return res.status(400).json({ message: 'El cuerpo de la respuesta es obligatorio' });
    }

    const payload = {
      groupId,
      keyword,
      responseBody,
      points: formatPointsPayload(points),
      isActive: Boolean(isActive),
    };

    const created = await AutoReply.create(payload);
    const populated = await created.populate(populateConfig);
    res.status(201).json(populated);
  } catch (err) {
    console.error('Error creando respuesta automática', err);
    return handleDuplicateError(res, err);
  }
};

export const updateAutoReply = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Identificador inválido' });
    }

    const { groupId, keyword, responseBody, points, isActive } = req.body;

    const existing = await AutoReply.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Respuesta automática no encontrada' });
    }

    if (groupId) {
      if (!mongoose.isValidObjectId(groupId)) {
        return res.status(400).json({ message: 'Grupo inválido' });
      }
      existing.groupId = groupId;
    }

    if (keyword !== undefined) {
      if (!keyword || !keyword.toString().trim()) {
        return res.status(400).json({ message: 'La palabra clave es obligatoria' });
      }
      existing.keyword = keyword;
    }

    if (responseBody !== undefined) {
      if (!responseBody || !responseBody.toString().trim()) {
        return res.status(400).json({ message: 'El cuerpo de la respuesta es obligatorio' });
      }
      existing.responseBody = responseBody;
    }

    if (points !== undefined) {
      existing.points = formatPointsPayload(points);
    }

    if (isActive !== undefined) {
      existing.isActive = Boolean(isActive);
    }

    await existing.save();
    const populated = await existing.populate(populateConfig);
    res.json(populated);
  } catch (err) {
    console.error('Error actualizando respuesta automática', err);
    return handleDuplicateError(res, err);
  }
};

export const deleteAutoReply = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Identificador inválido' });
    }

    const deleted = await AutoReply.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Respuesta automática no encontrada' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error eliminando respuesta automática', err);
    res.status(500).json({ message: 'Error al eliminar la respuesta automática' });
  }
};
