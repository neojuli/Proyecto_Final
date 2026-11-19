
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const productosRoutes = require('./routes/productosRoutes');
const pedidosRoutes = require('./routes/pedidosRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    mensaje: 'Servidor de Gota de Nieve funcionando correctamente'
  });
});

app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/auth', authRoutes);

async function iniciarServidor() {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error('Configura un JWT_SECRET seguro en .env');
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB conectado correctamente');

    app.listen(PORT, () => {
      console.log(`Servidor funcionando en http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
}

iniciarServidor();
