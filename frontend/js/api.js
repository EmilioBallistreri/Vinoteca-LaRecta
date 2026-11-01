// Centralized API Client for Vinoteca La Recta
// Includes automatic resilient fallback for Serverless / Static environments (Vercel)
const LOCAL_PRODUCTS_KEY = 'vlr_local_products_override';
const LOCAL_DELETED_KEY = 'vlr_local_deleted_products';
const LOCAL_SITE_CONFIG_KEY = 'vlr_local_site_config';
const LOCAL_USERS_KEY = 'vlr_local_users';
const LOCAL_ORDERS_KEY = 'vlr_local_orders';
const LOCAL_ACTIVITY_KEY = 'vlr_local_activity';

const SUPERADMIN_EMAILS = [
  'vinotecalarecta7@gmail.com',
  'floralmada07@gmail.com',
  'martinballistreri07@gmail.com'
];

// Safely parse JSON response; never throws "Unexpected token 'T', 'The page c'... is not valid JSON"
async function safeParseJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_) {
    // Non-JSON response (e.g. Vercel 404 "The page could not be found")
    return { __nonJsonError: true, rawText: text, status: res.status };
  }
}

async function getFallbackStore() {
  try {
    const fbRes = await fetch('/public/store-fallback.json');
    if (fbRes.ok) {
      const parsed = await safeParseJson(fbRes);
      if (parsed && !parsed.__nonJsonError) return parsed;
    }
  } catch (_) {}
  return { users: [], products: [], orders: [], activity: [] };
}

function getLocalOverrides() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_PRODUCTS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveLocalOverride(product) {
  try {
    const map = getLocalOverrides();
    map[product.id] = product;
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(map));
  } catch (_) {}
}

function getLocalDeletedIds() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_DELETED_KEY) || '[]');
  } catch {
    return [];
  }
}

function markLocalDeleted(id) {
  try {
    const list = getLocalDeletedIds();
    if (!list.includes(id)) list.push(id);
    localStorage.setItem(LOCAL_DELETED_KEY, JSON.stringify(list));
    const map = getLocalOverrides();
    delete map[id];
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(map));
  } catch (_) {}
}

function mergeProductsWithLocal(serverProducts = []) {
  const deleted = new Set(getLocalDeletedIds());
  const overrides = getLocalOverrides();
  const result = [];

  Object.values(overrides).forEach(prod => {
    if (!deleted.has(prod.id) && !serverProducts.some(sp => sp.id === prod.id)) {
      result.push(prod);
    }
  });

  serverProducts.forEach(sp => {
    if (deleted.has(sp.id)) return;
    if (overrides[sp.id]) {
      result.push({ ...sp, ...overrides[sp.id] });
    } else {
      result.push(sp);
    }
  });

  return result;
}

function getLocalUsers() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalUsers(users) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (_) {}
}

async function getAllMergedUsers() {
  const fb = await getFallbackStore();
  const baseUsers = Array.isArray(fb.users) ? fb.users : [];
  const localUsers = getLocalUsers();
  const map = new Map();
  baseUsers.forEach(u => map.set(u.email.toLowerCase(), u));
  localUsers.forEach(u => map.set(u.email.toLowerCase(), u));
  return Array.from(map.values());
}

function getLocalOrders() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalOrders(orders) {
  try {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
  } catch (_) {}
}

function appendLocalActivity(entry) {
  try {
    const list = JSON.parse(localStorage.getItem(LOCAL_ACTIVITY_KEY) || '[]');
    list.unshift({
      id: 'act-' + Date.now(),
      timestamp: new Date().toISOString(),
      user: entry.user || 'sistema',
      userName: entry.userName || 'Sistema',
      role: entry.role || 'cliente',
      action: entry.action || 'GENERAL',
      description: entry.description || '',
      badgeColor: entry.badgeColor || 'gold'
    });
    localStorage.setItem(LOCAL_ACTIVITY_KEY, JSON.stringify(list.slice(0, 100)));
  } catch (_) {}
}

export const api = {
  getCurrentUser() {
    try {
      const stored = localStorage.getItem('vlr_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  getHeaders() {
    const user = this.getCurrentUser();
    const headers = { 'Content-Type': 'application/json' };
    if (user) {
      headers['x-user'] = JSON.stringify(user);
    }
    return headers;
  },

  // AUTH
  async login(email, password) {
    const emailNorm = (email || '').trim().toLowerCase();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailNorm, password })
      });
      const data = await safeParseJson(res);
      if (data && !data.__nonJsonError) {
        if (!res.ok) throw new Error(data.error || 'Credenciales inválidas.');
        return data;
      }
    } catch (err) {
      if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('Unexpected token')) {
        // Check local users before throwing in case user registered in local fallback
        const localMatch = getLocalUsers().find(
          u => u.email.toLowerCase() === emailNorm && u.password === password
        );
        if (!localMatch) throw err;
      }
    }

    // Fallback local authentication
    const allUsers = await getAllMergedUsers();
    const found = allUsers.find(
      u => u.email.toLowerCase() === emailNorm && u.password === password
    );
    if (!found) {
      throw new Error('Credenciales inválidas. Verifique su correo y contraseña.');
    }

    found.lastLogin = new Date().toISOString();
    const localList = getLocalUsers().filter(u => u.email.toLowerCase() !== emailNorm);
    localList.push(found);
    saveLocalUsers(localList);

    const { password: _, ...safeUser } = found;
    return { success: true, user: safeUser };
  },

  async register(clientData) {
    const emailNorm = (clientData.email || '').trim().toLowerCase();
    const isSuperAdminEmail = SUPERADMIN_EMAILS.includes(emailNorm);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData)
      });
      const data = await safeParseJson(res);
      if (data && !data.__nonJsonError) {
        if (!res.ok) throw new Error(data.error || 'Error al registrar la cuenta');
        // Mirror in local storage so subsequent logins always work even across serverless cold starts
        const localUsers = getLocalUsers().filter(u => u.email.toLowerCase() !== emailNorm);
        localUsers.push({
          ...data.user,
          password: clientData.password
        });
        saveLocalUsers(localUsers);
        return data;
      }
    } catch (err) {
      if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('Unexpected token')) {
        throw err;
      }
    }

    // Fallback registration when serverless route is unavailable
    const allUsers = await getAllMergedUsers();
    const existing = allUsers.find(u => u.email.toLowerCase() === emailNorm);

    if (existing && !isSuperAdminEmail) {
      throw new Error('El correo electrónico ya se encuentra registrado. Puede ingresar desde la pestaña "Ingresar a mi Cuenta".');
    }

    const newUser = {
      id: existing?.id || ((isSuperAdminEmail ? 'admin-' : 'cust-') + Date.now()),
      name: (clientData.name || existing?.name || 'Cliente').trim(),
      email: emailNorm,
      password: clientData.password,
      phone: clientData.phone || existing?.phone || '',
      address: clientData.address || existing?.address || '',
      role: isSuperAdminEmail ? 'superadministrador' : 'cliente',
      createdAt: existing?.createdAt || new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    const localUsers = getLocalUsers().filter(u => u.email.toLowerCase() !== emailNorm);
    localUsers.push(newUser);
    saveLocalUsers(localUsers);

    appendLocalActivity({
      user: newUser.email,
      userName: newUser.name,
      role: newUser.role,
      action: isSuperAdminEmail ? 'ADMIN_REGISTER' : 'CLIENT_REGISTER',
      description: `Nuevo registro de cuenta (${newUser.role}): ${newUser.name} (${newUser.email})`,
      badgeColor: isSuperAdminEmail ? 'gold' : 'green'
    });

    const { password: _, ...safeUser } = newUser;
    return { success: true, user: safeUser };
  },

  // PRODUCTS
  async getProducts(params = {}) {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'todos') query.append('category', params.category);
    if (params.subcategory && params.subcategory !== 'todos') query.append('subcategory', params.subcategory);
    if (params.search) query.append('search', params.search);
    if (params.featured) query.append('featured', 'true');
    if (params.promo) query.append('promo', 'true');

    let list = [];
    try {
      const res = await fetch(`/api/products?${query.toString()}`);
      const parsed = await safeParseJson(res);
      if (res.ok && Array.isArray(parsed)) {
        list = parsed;
      }
    } catch (_) {}

    if (!Array.isArray(list) || list.length === 0) {
      const fbStore = await getFallbackStore();
      list = fbStore.products || [];
    }

    let merged = mergeProductsWithLocal(list);

    if (params.category && params.category !== 'todos') {
      merged = merged.filter(p => p.category?.toLowerCase() === params.category.toLowerCase());
    }
    if (params.subcategory && params.subcategory !== 'todos') {
      merged = merged.filter(p => p.subcategory && p.subcategory.toLowerCase() === params.subcategory.toLowerCase());
    }
    if (params.search) {
      const q = params.search.toLowerCase().trim();
      merged = merged.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.bodega && p.bodega.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return merged;
  },

  async getProductById(id) {
    const products = await this.getProducts();
    const found = products.find(p => p.id === id);
    if (!found) throw new Error('Producto no encontrado');
    return found;
  },

  async createProduct(productData) {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(productData)
      });
      const data = await safeParseJson(res);
      if (data && !data.__nonJsonError && res.ok) {
        saveLocalOverride(data);
        return data;
      }
    } catch (_) {}

    const created = {
      id: 'prod-' + Date.now(),
      name: productData.name,
      category: productData.category || 'vinos',
      subcategory: productData.subcategory || '',
      bodega: productData.bodega || '',
      price: Number(productData.price) || 0,
      originalPrice: productData.originalPrice ? Number(productData.originalPrice) : null,
      discount: Number(productData.discount) || 0,
      stock: Number(productData.stock) || 0,
      minStock: Number(productData.minStock) || 3,
      stockMode: productData.stockMode || 'unidad',
      unitsPerBox: Number(productData.unitsPerBox) || 6,
      boxesCount: Number(productData.boxesCount) || 0,
      isFeatured: Boolean(productData.isFeatured),
      badge: productData.badge || null,
      image: productData.image || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&h=1000&q=85&fm=webp',
      description: productData.description || '',
      createdAt: new Date().toISOString()
    };
    saveLocalOverride(created);
    return created;
  },

  async updateProduct(id, productData) {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(productData)
      });
      const data = await safeParseJson(res);
      if (data && !data.__nonJsonError && res.ok) {
        saveLocalOverride(data);
        return data;
      }
    } catch (_) {}

    const existing = await this.getProductById(id).catch(() => ({ id }));
    const updated = { ...existing, ...productData, id, updatedAt: new Date().toISOString() };
    saveLocalOverride(updated);
    return updated;
  },

  async updateStock(id, newStock) {
    try {
      const res = await fetch(`/api/products/${id}/stock`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ stock: newStock })
      });
      const data = await safeParseJson(res);
      if (data && !data.__nonJsonError && res.ok) {
        saveLocalOverride(data);
        return data;
      }
    } catch (_) {}

    const existing = await this.getProductById(id).catch(() => ({ id }));
    const updated = { ...existing, stock: Number(newStock), updatedAt: new Date().toISOString() };
    saveLocalOverride(updated);
    return updated;
  },

  async deleteProduct(id) {
    try {
      await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
    } catch (_) {}
    markLocalDeleted(id);
    return { success: true };
  },

  // ORDERS (RETAIL & WHOLESALE)
  async getOrders(params = {}) {
    const query = new URLSearchParams();
    if (params.customerEmail) query.append('customerEmail', params.customerEmail);
    if (params.status && params.status !== 'todos') query.append('status', params.status);

    let serverOrders = [];
    try {
      const res = await fetch(`/api/orders?${query.toString()}`);
      const data = await safeParseJson(res);
      if (res.ok && Array.isArray(data)) {
        serverOrders = data;
      }
    } catch (_) {}

    if (!serverOrders.length) {
      const fb = await getFallbackStore();
      serverOrders = fb.orders || [];
    }

    const localOrders = getLocalOrders();
    const map = new Map();
    localOrders.forEach(o => map.set(o.id, o));
    serverOrders.forEach(o => {
      if (!map.has(o.id)) map.set(o.id, o);
    });

    let merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (params.customerEmail) {
      merged = merged.filter(o => o.customer?.email?.toLowerCase() === params.customerEmail.toLowerCase());
    }
    if (params.status && params.status !== 'todos') {
      merged = merged.filter(o => o.status?.toLowerCase() === params.status.toLowerCase());
    }
    return merged;
  },

  async createOrder(orderData) {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(orderData)
      });
      const data = await safeParseJson(res);
      if (data && !data.__nonJsonError && res.ok) {
        const localOrders = getLocalOrders();
        localOrders.unshift(data);
        saveLocalOrders(localOrders);
        return data;
      }
    } catch (_) {}

    const newOrder = {
      id: (orderData.isWholesale ? 'MAY-' : 'ORD-') + Math.floor(1000 + Math.random() * 9000),
      isWholesale: Boolean(orderData.isWholesale),
      businessInfo: orderData.businessInfo || null,
      customer: {
        name: orderData.customer?.name || 'Cliente',
        email: orderData.customer?.email || '',
        phone: orderData.customer?.phone || '',
        address: orderData.customer?.address || ''
      },
      items: (orderData.items || []).map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        boxes: item.boxes || null,
        unitsPerBox: item.unitsPerBox || null
      })),
      paymentMethod: orderData.paymentMethod || 'Transferencia Bancaria (10% OFF)',
      subtotal: orderData.subtotal || 0,
      discount: orderData.discount || 0,
      shippingCost: orderData.shippingCost || 0,
      total: orderData.total || 0,
      status: 'Pendiente',
      notes: orderData.notes || '',
      createdAt: new Date().toISOString()
    };

    const localOrders = getLocalOrders();
    localOrders.unshift(newOrder);
    saveLocalOrders(localOrders);
    return newOrder;
  },

  async updateOrderStatus(id, status) {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ status })
      });
      const data = await safeParseJson(res);
      if (data && !data.__nonJsonError && res.ok) {
        const localOrders = getLocalOrders();
        const idx = localOrders.findIndex(o => o.id === id);
        if (idx !== -1) {
          localOrders[idx].status = status;
          saveLocalOrders(localOrders);
        }
        return data;
      }
    } catch (_) {}

    const localOrders = getLocalOrders();
    const idx = localOrders.findIndex(o => o.id === id);
    if (idx !== -1) {
      localOrders[idx].status = status;
      saveLocalOrders(localOrders);
      return localOrders[idx];
    }
    return { id, status };
  },

  // USERS & ADMINS
  async getUsers() {
    try {
      const res = await fetch('/api/users', { headers: this.getHeaders() });
      const data = await safeParseJson(res);
      if (res.ok && Array.isArray(data)) {
        const localUsers = getLocalUsers();
        const map = new Map();
        data.forEach(u => map.set(u.email.toLowerCase(), u));
        localUsers.forEach(({ password: _, ...u }) => map.set(u.email.toLowerCase(), u));
        return Array.from(map.values());
      }
    } catch (_) {}

    const all = await getAllMergedUsers();
    return all.map(({ password: _, ...u }) => u);
  },

  async addAdmin(adminData) {
    try {
      const res = await fetch('/api/users/admin', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(adminData)
      });
      const data = await safeParseJson(res);
      if (data && !data.__nonJsonError && res.ok) {
        const localUsers = getLocalUsers().filter(u => u.email.toLowerCase() !== adminData.email.toLowerCase());
        localUsers.push({ ...data, password: adminData.password || 'AdminRecta2024!' });
        saveLocalUsers(localUsers);
        return data;
      }
    } catch (_) {}

    const newAdmin = {
      id: 'admin-' + Date.now(),
      name: adminData.name,
      email: adminData.email.trim().toLowerCase(),
      password: adminData.password || 'AdminRecta2024!',
      role: adminData.role || 'administrador',
      createdAt: new Date().toISOString()
    };
    const localUsers = getLocalUsers().filter(u => u.email.toLowerCase() !== newAdmin.email);
    localUsers.push(newAdmin);
    saveLocalUsers(localUsers);
    const { password: _, ...safeAdmin } = newAdmin;
    return safeAdmin;
  },

  async deleteUser(id) {
    try {
      await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
    } catch (_) {}
    const localUsers = getLocalUsers().filter(u => u.id !== id);
    saveLocalUsers(localUsers);
    return { success: true };
  },

  // ACTIVITY LOGS
  async getActivityLogs(limit = 60) {
    try {
      const res = await fetch(`/api/activity?limit=${limit}`, { headers: this.getHeaders() });
      const data = await safeParseJson(res);
      if (res.ok && Array.isArray(data)) {
        return data;
      }
    } catch (_) {}

    const fb = await getFallbackStore();
    const localAct = JSON.parse(localStorage.getItem(LOCAL_ACTIVITY_KEY) || '[]');
    return [...localAct, ...(fb.activity || [])].slice(0, limit);
  },

  // STATS
  async getStats() {
    try {
      const res = await fetch('/api/stats', { headers: this.getHeaders() });
      const data = await safeParseJson(res);
      if (res.ok && data && !data.__nonJsonError) {
        return data;
      }
    } catch (_) {}

    const [products, orders, users] = await Promise.all([
      this.getProducts(),
      this.getOrders(),
      this.getUsers()
    ]);

    const totalSales = orders
      .filter(o => o.status !== 'Cancelado')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const lowStockProducts = products.filter(p => p.stock <= (p.minStock || 3));
    const outOfStockProducts = products.filter(p => p.stock === 0);

    return {
      totalSales,
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'Pendiente' || o.status === 'En preparación').length,
      totalProducts: products.length,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      lowStockItems: lowStockProducts,
      totalCustomers: users.filter(u => u.role === 'cliente').length,
      salesByCategory: {},
      recentOrders: orders.slice(0, 5)
    };
  },

  // CONTACT INQUIRY
  async sendContactInquiry(contactData) {
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      });
      const data = await safeParseJson(res);
      if (data && !data.__nonJsonError && res.ok) {
        return data;
      }
    } catch (_) {}

    appendLocalActivity({
      user: contactData.email,
      userName: contactData.name,
      role: 'cliente',
      action: 'CONTACT_INQUIRY',
      description: `Consulta web de ${contactData.name}: "${contactData.subject || 'Consulta general'}"`,
      badgeColor: 'gold'
    });
    return { success: true };
  },

  // SITE CONFIG (CAROUSEL, FESTIVITIES & BANNERS)
  async getSiteConfig() {
    try {
      const res = await fetch('/api/site-config');
      const serverCfg = await safeParseJson(res);
      if (res.ok && serverCfg && !serverCfg.__nonJsonError) {
        const localCfgRaw = localStorage.getItem(LOCAL_SITE_CONFIG_KEY);
        if (localCfgRaw) {
          const localCfg = JSON.parse(localCfgRaw);
          if (localCfg.updatedAt && (!serverCfg.updatedAt || new Date(localCfg.updatedAt) > new Date(serverCfg.updatedAt))) {
            return localCfg;
          }
        }
        return serverCfg;
      }
    } catch (_) {}

    const localCfgRaw = localStorage.getItem(LOCAL_SITE_CONFIG_KEY);
    return localCfgRaw ? JSON.parse(localCfgRaw) : null;
  },

  async updateSiteConfig(configData) {
    const withTimestamp = { ...configData, updatedAt: new Date().toISOString() };
    try {
      localStorage.setItem(LOCAL_SITE_CONFIG_KEY, JSON.stringify(withTimestamp));
    } catch (_) {}

    try {
      const res = await fetch('/api/site-config', {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(withTimestamp)
      });
      const data = await safeParseJson(res);
      if (res.ok && data && !data.__nonJsonError) {
        localStorage.setItem(LOCAL_SITE_CONFIG_KEY, JSON.stringify(data));
        return data;
      }
    } catch (_) {}

    return withTimestamp;
  }
};
