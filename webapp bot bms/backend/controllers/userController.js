import mongoose from 'mongoose';
import User from '../models/User.js';
import Group from '../models/Group.js';

const normalizeGroupIds = (value) => {
  if (Array.isArray(value)) {
    const seen = new Set();
    const result = [];
    value.forEach((item) => {
      if (!item) return;
      const candidate =
        typeof item === 'object' && item !== null && item._id ? item._id : item;
      try {
        const objectId = new mongoose.Types.ObjectId(candidate);
        const key = objectId.toString();
        if (!seen.has(key)) {
          seen.add(key);
          result.push(objectId);
        }
      } catch (err) {
        // Ignore invalid ids
      }
    });
    return result;
  }
  if (value) {
    const candidate =
      typeof value === 'object' && value !== null && value._id ? value._id : value;
    try {
      return [new mongoose.Types.ObjectId(candidate)];
    } catch (err) {
      return [];
    }
  }
  return [];
};

const formatUser = (user) => {
  if (!user) return user;
  const data = user.toObject ? user.toObject() : { ...user };
  const existingGroups = Array.isArray(data.groups) ? data.groups : [];
  if (existingGroups.length === 0 && data.groupId) {
    data.groups = [data.groupId];
  } else {
    data.groups = existingGroups;
  }
  const [firstGroup] = data.groups;
  if (firstGroup && typeof firstGroup === 'object' && firstGroup !== null && firstGroup._id) {
    data.groupId = firstGroup._id.toString();
  } else if (firstGroup) {
    try {
      data.groupId = firstGroup.toString();
    } catch (err) {
      data.groupId = firstGroup;
    }
  } else {
    data.groupId = null;
  }
  return data;
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });
    res.json({ user: { _id: user._id, name: user.name, phoneNum: user.phoneNum, userType: user.userType } });
  } catch (err) {
    res.status(500).json({ message: 'Error al consultar usuario' });
  }
};

export const getUsers = async (_req, res) => {
  const users = await User.find();
  res.json(users.map((user) => formatUser(user)));
};

export const createUser = async (req, res) => {
  try {
    const { username, phoneNum } = req.body;
    const existing = await User.findOne({ $or: [{ username }, { phoneNum }] });
    if (existing) {
      return res.status(400).json({ message: 'Usuario o teléfono ya existe' });
    }
    const payload = { ...req.body };
    if (typeof payload.groups === 'undefined' && typeof payload.groupId !== 'undefined') {
      payload.groups = payload.groupId;
    }
    if (typeof payload.groups !== 'undefined') {
      payload.groups = normalizeGroupIds(payload.groups);
    }
    delete payload.groupId;

    const newUser = await User.create(payload);
    if (Array.isArray(newUser.groups) && newUser.groups.length > 0) {
      await Group.updateMany(
        { _id: { $in: newUser.groups } },
        { $addToSet: { users: newUser._id } }
      );
    }
    res.status(201).json(formatUser(newUser));
  } catch (err) {
    res.status(500).json({ message: 'Error al crear usuario' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, phoneNum } = req.body;

    const conditions = [];
    if (username) conditions.push({ username });
    if (phoneNum) conditions.push({ phoneNum });

    if (conditions.length > 0) {
      const existing = await User.findOne({
        _id: { $ne: id },
        $or: conditions,
      });
      if (existing) {
        return res
          .status(400)
          .json({ message: 'Usuario o teléfono ya existe' });
      }
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    let previousGroups = (user.groups || []).map((group) => group.toString());
    const legacyGroupId = user.get ? user.get('groupId') : user.groupId;
    if (previousGroups.length === 0 && legacyGroupId) {
      try {
        previousGroups = [legacyGroupId.toString()];
      } catch (err) {
        previousGroups = [legacyGroupId];
      }
    }

    const payload = { ...req.body };
    if (typeof payload.groups === 'undefined' && typeof payload.groupId !== 'undefined') {
      payload.groups = payload.groupId;
    }
    delete payload.groupId;

    let normalizedGroups = null;
    Object.entries(payload).forEach(([key, value]) => {
      if (key === 'groups') {
        normalizedGroups = normalizeGroupIds(value);
        user.groups = normalizedGroups;
        if (user.set) {
          user.set('groupId', undefined, { strict: false });
        }
      } else if (typeof value !== 'undefined') {
        user[key] = value;
      }
    });

    const updatedUser = await user.save();

    const currentGroups = Array.isArray(normalizedGroups)
      ? normalizedGroups.map((group) => group.toString())
      : (updatedUser.groups || []).map((group) => group.toString());

    const operations = [];

    const removedGroups = previousGroups.filter((id) => !currentGroups.includes(id));
    const addedGroups = currentGroups.filter((id) => !previousGroups.includes(id));

    if (removedGroups.length > 0) {
      operations.push(
        Group.updateMany(
          { _id: { $in: removedGroups } },
          { $pull: { users: updatedUser._id } }
        )
      );
    }

    if (addedGroups.length > 0) {
      operations.push(
        Group.updateMany(
          { _id: { $in: addedGroups } },
          { $addToSet: { users: updatedUser._id } }
        )
      );
    }

    if (operations.length > 0) {
      await Promise.all(operations);
    }

    res.json(formatUser(updatedUser));
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (user?.groups?.length) {
      await Group.updateMany(
        { _id: { $in: user.groups } },
        { $pull: { users: user._id } }
      );
    }
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
};
