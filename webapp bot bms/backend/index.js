import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
app.use(cors());            // permite peticiones desde tu frontend
app.use(bodyParser.json()); // parsea JSON

// Usuarios de prueba
const users = [
  { id: 1, username: 'admin', password: 'admin', nombre: 'Administrador', numeroTelefono: '0000', tipoUsuario: 'super' }
];

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });
  // Devuelve sólo los datos que necesitas guardar en el contexto
  res.json({ user: { id: user.id, nombre: user.nombre, numeroTelefono: user.numeroTelefono, tipoUsuario: user.tipoUsuario } });
});

// CRUD Usuarios (simple)
app.get('/api/users', (req, res) => {
  res.json(users);
});
app.post('/api/users', (req, res) => {
  const newUser = { id: users.length + 1, ...req.body };
  users.push(newUser);
  res.status(201).json(newUser);
});

app.listen(3000, () => console.log('API corriendo en http://localhost:3000'));