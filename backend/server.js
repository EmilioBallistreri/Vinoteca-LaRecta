require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./data/db');
const supabase = require('./data/supabase');

const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user']
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(morgan('dev'));

// Static files for frontend and uploads
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/public', express.static(path.join(__dirname, '../frontend/public')));
app.use('/static', express.static(path.join(__dirname, 'uploads')));

// Dedicated Admin and Public clean routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

app.get('/productos', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/productos.html'));
});

app.get('/mayorista', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/mayorista.html'));
});

// Explicit SEO endpoints for Google Search Console
app.get('/sitemap.xml', (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.sendFile(path.join(__dirname, '../frontend/sitemap.xml'));
});

app.get('/robots.txt', (req, res) => {
  res.header('Content-Type', 'text/plain');
  res.sendFile(path.join(__dirname, '../frontend/robots.txt'));
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
    const { name, email, password, phone, address, dni } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios.' });
    }

    const newUser = db.registerClient({ name, email, password, phone, address, dni });
    res.status(201).json({
      success: true,
      user: newUser
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ================= PRODUCTS ROUTES =================
app.get('/api/products', async (req, res) => {
  const { category, subcategory, search, featured, promo } = req.query;
  const filter = {
    category,
    subcategory,
    search,
    isFeatured: featured === 'true',
    promoOnly: promo === 'true'
  };

  try {
    const cloudProducts = await supabase.getCloudProducts(filter);
    if (cloudProducts && Array.isArray(cloudProducts) && cloudProducts.length > 0) {
      return res.json(cloudProducts);
    }
  } catch (_) {}

  const products = db.getProducts(filter);
  res.json(products);
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const cloudProducts = await supabase.getCloudProducts();
    if (cloudProducts) {
      const found = cloudProducts.find(p => p.id === req.params.id);
      if (found) return res.json(found);
    }
  } catch (_) {}

  const product = db.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Producto no encontrado.' });
  }
  res.json(product);
});

app.post('/api/products', async (req, res) => {
  const { name, category, price } = req.body;
  if (!name || !category || price === undefined) {
    return res.status(400).json({ error: 'Nombre, categoría y precio son obligatorios.' });
  }

  const user = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;
  const newProduct = db.createProduct(req.body, user);
  try {
    await supabase.saveCloudProduct(newProduct);
  } catch (e) {
    console.warn('Supabase product save warning:', e.message);
  }
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', async (req, res) => {
  const user = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;
  const updated = db.updateProduct(req.params.id, req.body, user);
  if (!updated) {
    return res.status(404).json({ error: 'Producto no encontrado.' });
  }
  try {
    await supabase.saveCloudProduct(updated);
  } catch (e) {
    console.warn('Supabase product update warning:', e.message);
  }
  res.json(updated);
});

app.patch('/api/products/:id/stock', async (req, res) => {
  const { stock } = req.body;
  if (stock === undefined || isNaN(stock)) {
    return res.status(400).json({ error: 'Cantidad de stock inválida.' });
  }

  const user = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;
  const updated = db.updateStock(req.params.id, stock, user);
  if (!updated) {
    return res.status(404).json({ error: 'Producto no encontrado.' });
  }
  try {
    await supabase.updateCloudStock(req.params.id, stock);
  } catch (e) {
    console.warn('Supabase stock update warning:', e.message);
  }
  res.json(updated);
});

app.delete('/api/products/:id', async (req, res) => {
  const user = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;
  const success = db.deleteProduct(req.params.id, user);
  if (!success) {
    return res.status(404).json({ error: 'Producto no encontrado.' });
  }
  try {
    await supabase.deleteCloudProduct(req.params.id);
  } catch (e) {
    console.warn('Supabase product delete warning:', e.message);
  }
  res.json({ success: true, message: 'Producto eliminado correctamente.' });
});

// ================= ORDERS ROUTES =================
app.get('/api/orders', async (req, res) => {
  const { customerEmail, status } = req.query;
  try {
    const cloudOrders = await supabase.getCloudOrders();
    if (cloudOrders && Array.isArray(cloudOrders)) {
      let ords = cloudOrders;
      if (customerEmail) {
        ords = ords.filter(o => o.customer?.email?.toLowerCase() === customerEmail.toLowerCase());
      }
      if (status && status !== 'todos') {
        ords = ords.filter(o => o.status?.toLowerCase() === status.toLowerCase());
      }
      return res.json(ords);
    }
  } catch (_) {}
  const orders = db.getOrders({ customerEmail, status });
  res.json(orders);
});

app.post('/api/orders', async (req, res) => {
  const { customer, items, total, paymentMethod } = req.body;
  if (!customer || !customer.name || !customer.email || !items || !items.length) {
    return res.status(400).json({ error: 'Datos de cliente y productos requeridos.' });
  }

  try {
    const newOrder = db.createOrder(req.body);
    try {
      await supabase.saveCloudOrder(newOrder);
    } catch (_) {}
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

app.get('/api/users', async (req, res) => {
  try {
    const cloudUsers = await supabase.getCloudUsers();
    if (cloudUsers && Array.isArray(cloudUsers) && cloudUsers.length > 0) {
      return res.json(cloudUsers);
    }
  } catch (_) {}
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
app.get('/api/activity', async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 50;
  try {
    const cloudActivity = await supabase.getCloudActivity(limit);
    if (cloudActivity && Array.isArray(cloudActivity) && cloudActivity.length > 0) {
      return res.json(cloudActivity);
    }
  } catch (_) {}
  res.json(db.getActivityLogs(limit));
});

// ================= STATS FOR DASHBOARD =================
app.get('/api/stats', (req, res) => {
  res.json(db.getStats());
});

// ================= SITE CONFIG & FESTIVITIES =================
app.get('/api/site-config', async (req, res) => {
  try {
    const cloudConfig = await supabase.getCloudSiteConfig();
    if (cloudConfig) {
      const defaults = db.getDefaultSiteConfig ? db.getDefaultSiteConfig() : {};
      return res.json({ ...defaults, ...cloudConfig });
    }
  } catch (_) {}
  res.json(db.getSiteConfig());
});

app.put('/api/site-config', async (req, res) => {
  try {
    const user = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;
    const updated = db.updateSiteConfig(req.body, user);
    try {
      await supabase.saveCloudSiteConfig(updated);
    } catch (e) {
      console.warn('Supabase cloud sync warning:', e.message);
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ================= CLOUD DATABASE STATUS & CONFIG =================
app.get('/api/cloud-status', async (req, res) => {
  try {
    const creds = supabase.getCredentials();
    const configured = Boolean(creds.url && creds.key);
    let connection = null;
    if (configured) {
      connection = await supabase.testConnection();
    }
    res.json({
      configured,
      provider: 'supabase',
      url: creds.url || null,
      connection
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cloud-config', async (req, res) => {
  try {
    const { url, key } = req.body;
    if (!url || !key) {
      return res.status(400).json({ error: 'URL y Key de Supabase son obligatorias.' });
    }

    const cleanUrl = url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    const cleanKey = key.trim();

    const test = await supabase.testConnection(cleanUrl, cleanKey);
    if (!test.success) {
      return res.status(400).json({ error: `Fallo al conectar con Supabase: ${test.error}` });
    }

    const store = db.readStore();
    store.cloudDatabase = {
      url: cleanUrl,
      key: cleanKey,
      updatedAt: new Date().toISOString()
    };
    db.writeStore(store);

    res.json({
      success: true,
      message: test.message || 'Supabase conectado exitosamente.',
      needsSchema: Boolean(test.needsSchema)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server locally if executed directly (e.g., node backend/server.js or npm start)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🍷 Servidor Backend Vinoteca La Recta iniciado en http://localhost:${PORT}`);
  });
}

module.exports = app;


