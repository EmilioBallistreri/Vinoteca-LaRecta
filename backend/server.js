require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./data/db');

const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user']
}));
app.use(express.json());
app.use(morgan('dev'));

// Static files for frontend and uploads
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/public', express.static(path.join(__dirname, '../frontend/public')));
app.use('/static', express.static(path.join(__dirname, 'uploads')));

// Dedicated Admin route alias
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'Vinoteca La Recta API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ================= AUTH ROUTES =================
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos.' });
  }

  const user = db.authenticate(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas. Verifique su email y contraseña.' });
  }

  res.json({
    success: true,
    user
  });
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios.' });
    }

    const newUser = db.registerClient({ name, email, password, phone, address });
    res.status(201).json({
      success: true,
      user: newUser
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ================= PRODUCTS ROUTES =================
app.get('/api/products', (req, res) => {
  const { category, subcategory, search, featured, promo } = req.query;
  const products = db.getProducts({
    category,
    subcategory,
    search,
    isFeatured: featured === 'true',
    promoOnly: promo === 'true'
  });
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Producto no encontrado.' });
  }
  res.json(product);
});

app.post('/api/products', (req, res) => {
  const { name, category, price } = req.body;
  if (!name || !category || price === undefined) {
    return res.status(400).json({ error: 'Nombre, categoría y precio son obligatorios.' });
  }

  const user = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;
  const newProduct = db.createProduct(req.body, user);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const user = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;
  const updated = db.updateProduct(req.params.id, req.body, user);
  if (!updated) {
    return res.status(404).json({ error: 'Producto no encontrado.' });
  }
  res.json(updated);
});

app.patch('/api/products/:id/stock', (req, res) => {
  const { stock } = req.body;
  if (stock === undefined || isNaN(stock)) {
    return res.status(400).json({ error: 'Cantidad de stock inválida.' });
  }

  const user = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;
  const updated = db.updateStock(req.params.id, stock, user);
  if (!updated) {
    return res.status(404).json({ error: 'Producto no encontrado.' });
  }
  res.json(updated);
});

app.delete('/api/products/:id', (req, res) => {
  const user = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;
  const success = db.deleteProduct(req.params.id, user);
  if (!success) {
    return res.status(404).json({ error: 'Producto no encontrado.' });
  }
  res.json({ success: true, message: 'Producto eliminado correctamente.' });
});

// ================= ORDERS ROUTES =================
app.get('/api/orders', (req, res) => {
  const { customerEmail, status } = req.query;
  const orders = db.getOrders({ customerEmail, status });
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const { customer, items, total, paymentMethod } = req.body;
  if (!customer || !customer.name || !customer.email || !items || !items.length) {
    return res.status(400).json({ error: 'Datos de cliente y productos requeridos.' });
  }

  try {
    const newOrder = db.createOrder(req.body);
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Nuevo estado requerido.' });
  }

  const user = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;
  const updated = db.updateOrderStatus(req.params.id, status, user);
  if (!updated) {
    return res.status(404).json({ error: 'Pedido no encontrado.' });
  }
  res.json(updated);
});

// ================= CONTACT INQUIRY ROUTE =================
app.post('/api/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Nombre, email y mensaje son obligatorios.' });
  }

  try {
    const store = db.readStore ? db.readStore() : null;
    if (store && db.logActivity) {
      db.logActivity({
        user: email,
        userName: name,
        role: 'cliente',
        action: 'CONTACT_INQUIRY',
        description: `Consulta recibida para vinotecalarecta7@gmail.com de ${name} (${email}): "${subject || 'Consulta general'}"`,
        badgeColor: 'gold'
      }, store);
      if (db.writeStore) db.writeStore(store);
    }
    res.status(200).json({
      success: true,
      message: 'Consulta registrada correctamente. Se enviará a vinotecalarecta7@gmail.com.',
      destinationEmail: 'vinotecalarecta7@gmail.com'
    });
  } catch (err) {
    res.status(200).json({
      success: true,
      destinationEmail: 'vinotecalarecta7@gmail.com'
    });
  }
});

app.get('/api/users', (req, res) => {
  res.json(db.getUsers());
});

app.post('/api/users/admin', (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Nombre y correo requeridos.' });
    }

    const performingUser = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;
    const admin = db.addAdmin({ name, email, password, role }, performingUser);
    res.status(201).json(admin);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    const performingUser = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;
    const success = db.deleteUser(req.params.id, performingUser);
    if (!success) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json({ success: true, message: 'Usuario eliminado.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ================= ACTIVITY AUDIT LOGS =================
app.get('/api/activity', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 50;
  res.json(db.getActivityLogs(limit));
});

// ================= STATS FOR DASHBOARD =================
app.get('/api/stats', (req, res) => {
  res.json(db.getStats());
});

// Start Server locally if executed directly (e.g., node backend/server.js or npm start)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🍷 Servidor Backend Vinoteca La Recta iniciado en http://localhost:${PORT}`);
  });
}

module.exports = app;


