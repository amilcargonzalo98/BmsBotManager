import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';

const mongoUri = 'mongodb+srv://admin:admin@botbmsmanager.vzqkkxo.mongodb.net/?retryWrites=true&w=majority&appName=BOTBMSManager';

// Conexión a MongoDB
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .catch(err => console.error('Error al conectar con MongoDB:', err));

const userSchema = new mongoose.Schema({
  id: Number,
  username: String,
  password: String,
  nombre: String,
  numeroTelefono: String,
  tipoUsuario: String
});

const User = mongoose.model('User', userSchema);

// Crear usuario inicial si la colección está vacía
mongoose.connection.once('open', async () => {
  const count = await User.countDocuments();
  if (count === 0) {
    await User.create({
      id: 1,
      username: 'admin',
      password: 'admin',
      nombre: 'Administrador',
      numeroTelefono: '0000',
      tipoUsuario: 'super'
    });
  }
});

const app = express();
app.use(cors());            // permite peticiones desde tu frontend
app.use(bodyParser.json()); // parsea JSON

// Ya no usamos usuarios en memoria; se utilizan los almacenados en MongoDB

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });
    res.json({ user: { id: user.id, nombre: user.nombre, numeroTelefono: user.numeroTelefono, tipoUsuario: user.tipoUsuario } });
  } catch (err) {
    res.status(500).json({ message: 'Error al consultar usuario' });
  }
});

// CRUD Usuarios (simple)
app.get('/api/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  try {
    const count = await User.countDocuments();
    const newUser = await User.create({ id: count + 1, ...req.body });
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ message: 'Error al crear usuario' });
  }
});

app.listen(3000, () => console.log('API corriendo en http://localhost:3000'));
