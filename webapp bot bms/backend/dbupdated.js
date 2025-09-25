import mongoose from './config/database.js';
import Group from './models/Group.js';
import Point from './models/Point.js';
import User from './models/User.js';

async function applyChanges() {
  try {
    // Ensure default group exists
    let group = await Group.findOne({ groupName: 'Default Group' });
    if (!group) {
      group = await Group.create({ groupName: 'Default Group', description: 'Grupo por defecto' });
      console.log('Grupo creado:', group._id.toString());
    } else {
      console.log('Grupo existente:', group._id.toString());
    }

    const groupId = group._id;

    // Create example points if none exist for the group
    const points = await Point.find({ groupId });
    if (points.length === 0) {
      const samplePoints = await Point.insertMany([
        { pointName: 'Punto 1', ipAddress: '192.168.0.10', pointType: 1, pointId: 1, groupId },
        { pointName: 'Punto 2', ipAddress: '192.168.0.11', pointType: 2, pointId: 2, groupId }
      ]);
      console.log('Puntos creados');
      await Group.findByIdAndUpdate(groupId, { $addToSet: { points: { $each: samplePoints.map((p) => p._id) } } });
    } else {
      console.log('Puntos ya existen para el grupo');
      const pointIds = points.map((p) => p._id);
      await Group.findByIdAndUpdate(groupId, { $addToSet: { points: { $each: pointIds } } });
    }

    // Update users without groupId
    const updated = await User.updateMany({ groupId: { $exists: false } }, { groupId: groupId });
    console.log('Usuarios actualizados:', updated.modifiedCount);
    const usersWithGroup = await User.find({ groupId: groupId }).select('_id');
    if (usersWithGroup.length > 0) {
      await Group.findByIdAndUpdate(groupId, { $addToSet: { users: { $each: usersWithGroup.map((u) => u._id) } } });
    }
  } catch (err) {
    console.error('Error durante la migración:', err);
  } finally {
    await mongoose.connection.close();
  }
}

applyChanges();
