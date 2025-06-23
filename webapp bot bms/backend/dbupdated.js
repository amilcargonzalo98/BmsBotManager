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

    // Create example points if none exist for the group
    const points = await Point.find({ groupId: group._id });
    if (points.length === 0) {
      const samplePoints = [
        { pointName: 'Punto 1', ipAddress: '192.168.0.10', pointType: 1, pointId: 1, groupId: group._id },
        { pointName: 'Punto 2', ipAddress: '192.168.0.11', pointType: 2, pointId: 2, groupId: group._id }
      ];
      await Point.insertMany(samplePoints);
      console.log('Puntos creados');
    } else {
      console.log('Puntos ya existen para el grupo');
    }

    // Update users without groupId
    const updated = await User.updateMany({ groupId: { $exists: false } }, { groupId: group._id });
    console.log('Usuarios actualizados:', updated.modifiedCount);
  } catch (err) {
    console.error('Error durante la migración:', err);
  } finally {
    await mongoose.connection.close();
  }
}

applyChanges();