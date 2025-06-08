import User from '../models/User.js';

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
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ message: 'Error al crear usuario' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
};
