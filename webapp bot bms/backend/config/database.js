import mongoose from 'mongoose';

const mongoUri = 'mongodb+srv://admin:admin@botbmsmanager.vzqkkxo.mongodb.net/?retryWrites=true&w=majority&appName=BOTBMSManager';

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .catch(err => console.error('Error al conectar con MongoDB:', err));

export default mongoose;
