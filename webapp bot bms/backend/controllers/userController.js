import User from '../models/User.js';
import Group from '../models/Group.js';

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

export const getUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

export const createUser = async (req, res) => {
  try {
    const { username, phoneNum } = req.body;
    const existing = await User.findOne({ $or: [{ username }, { phoneNum }] });
    if (existing) {
      return res.status(400).json({ message: 'Usuario o teléfono ya existe' });
    }
    const newUser = await User.create(req.body);
    if (newUser.groupId) {
      await Promise.all([
        Group.findByIdAndUpdate(newUser.groupId, { $addToSet: { users: newUser._id } }),
        Group.updateMany(
          { _id: { $ne: newUser.groupId }, users: newUser._id },
          { $pull: { users: newUser._id } }
        ),
      ]);
    }
    res.status(201).json(newUser);
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

    const previousGroup = user.groupId ? user.groupId.toString() : null;

    Object.entries(req.body).forEach(([key, value]) => {
      if (typeof value !== 'undefined') {
        user[key] = value;
      }
    });

    const updatedUser = await user.save();

    const currentGroup = updatedUser.groupId
      ? updatedUser.groupId.toString()
      : null;

    const operations = [];

    if (previousGroup && previousGroup !== currentGroup) {
      operations.push(
        Group.findByIdAndUpdate(previousGroup, { $pull: { users: updatedUser._id } })
      );
    }

    if (currentGroup) {
      operations.push(
        Group.findByIdAndUpdate(currentGroup, { $addToSet: { users: updatedUser._id } })
      );
      operations.push(
        Group.updateMany(
          { _id: { $ne: currentGroup }, users: updatedUser._id },
          { $pull: { users: updatedUser._id } }
        )
      );
    }

    if (operations.length > 0) {
      await Promise.all(operations);
    }

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (user?.groupId) {
      await Group.findByIdAndUpdate(user.groupId, { $pull: { users: user._id } });
    }
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
};
