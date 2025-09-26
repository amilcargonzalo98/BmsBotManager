import mongoose from 'mongoose';
import Group from '../models/Group.js';
import User from '../models/User.js';
import Point from '../models/Point.js';

const normalizeIds = (values) => {
  if (!Array.isArray(values)) return [];
  const seen = new Set();
  const result = [];
  values.forEach((value) => {
    if (!value) return;
    try {
      const objectId = new mongoose.Types.ObjectId(value);
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
};

const populateGroup = (query) =>
  query
    .populate({ path: 'users', select: 'username name phoneNum userType' })
    .populate({
      path: 'points',
      select: 'pointName pointId clientId',
      populate: { path: 'clientId', select: 'clientName' },
    });

export const getGroups = async (req, res) => {
  try {
    const groups = await populateGroup(Group.find());
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener grupos' });
  }
};

export const createGroup = async (req, res) => {
  try {
    const { users, points, ...rest } = req.body || {};
    const userIds = normalizeIds(users);
    const pointIds = normalizeIds(points);

    const group = new Group(rest);
    group.users = userIds;
    group.points = pointIds;
    await group.save();

    const promises = [];

    if (userIds.length > 0) {
      promises.push(
        User.updateMany(
          { _id: { $in: userIds } },
          { $addToSet: { groups: group._id } }
        )
      );
    }

    if (pointIds.length > 0) {
      const pointObjectIds = pointIds.map((id) => id);
      promises.push(
        Group.updateMany(
          { _id: { $ne: group._id }, points: { $in: pointObjectIds } },
          { $pull: { points: { $in: pointObjectIds } } }
        )
      );
      promises.push(Point.updateMany({ _id: { $in: pointObjectIds } }, { groupId: group._id }));
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }

    const populated = await populateGroup(Group.findById(group._id));
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Error al crear grupo' });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Grupo no encontrado' });
    }

    const { users, points, ...rest } = req.body || {};

    Object.entries(rest).forEach(([key, value]) => {
      if (typeof value !== 'undefined') {
        group[key] = value;
      }
    });

    const operations = [];

    if (Array.isArray(users)) {
      const normalizedUsers = normalizeIds(users);
      const previousUsers = (group.users || []).map((id) => id.toString());
      const nextUsers = normalizedUsers.map((id) => id.toString());

      const removedUsers = previousUsers.filter((id) => !nextUsers.includes(id));
      const addedUsers = nextUsers.filter((id) => !previousUsers.includes(id));

      group.users = normalizedUsers;

      if (removedUsers.length > 0) {
        operations.push(
          User.updateMany(
            { _id: { $in: removedUsers } },
            { $pull: { groups: group._id } }
          )
        );
      }

      if (addedUsers.length > 0) {
        operations.push(
          User.updateMany(
            { _id: { $in: addedUsers } },
            { $addToSet: { groups: group._id } }
          )
        );
      }
    }

    if (Array.isArray(points)) {
      const normalizedPoints = normalizeIds(points);
      const previousPoints = (group.points || []).map((id) => id.toString());
      const nextPoints = normalizedPoints.map((id) => id.toString());

      const removedPoints = previousPoints.filter((id) => !nextPoints.includes(id));
      const addedPoints = nextPoints.filter((id) => !previousPoints.includes(id));

      group.points = normalizedPoints;

      if (removedPoints.length > 0) {
        operations.push(
          Point.updateMany(
            { _id: { $in: removedPoints }, groupId: group._id },
            { $unset: { groupId: '' } }
          )
        );
      }

      if (addedPoints.length > 0) {
        const addedObjectIds = addedPoints.map((id) => new mongoose.Types.ObjectId(id));
        operations.push(
          Group.updateMany(
            { _id: { $ne: group._id }, points: { $in: addedObjectIds } },
            { $pull: { points: { $in: addedObjectIds } } }
          )
        );
        operations.push(Point.updateMany({ _id: { $in: addedPoints } }, { groupId: group._id }));
      }
    }

    if (operations.length > 0) {
      await Promise.all(operations);
    }

    await group.save();

    const populated = await populateGroup(Group.findById(group._id));
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar grupo' });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);
    if (group) {
      const ids = group._id;
      await Promise.all([
        User.updateMany({ groups: ids }, { $pull: { groups: ids } }),
        Point.updateMany({ groupId: ids }, { $unset: { groupId: '' } }),
      ]);
    }
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar grupo' });
  }
};
