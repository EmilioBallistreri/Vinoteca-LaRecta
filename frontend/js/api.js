// Centralized API Client for Vinoteca La Recta
const LOCAL_PRODUCTS_KEY = 'vlr_local_products_override';
const LOCAL_DELETED_KEY = 'vlr_local_deleted_products';
const LOCAL_SITE_CONFIG_KEY = 'vlr_local_site_config';

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
  const seen = new Set();

  // Put newly created local products first if not in server list yet
  Object.values(overrides).forEach(prod => {
    if (!deleted.has(prod.id) && !serverProducts.some(sp => sp.id === prod.id)) {
      result.push(prod);
      seen.add(prod.id);
    }
  });

  serverProducts.forEach(sp => {
    if (deleted.has(sp.id)) return;
    if (overrides[sp.id]) {
      result.push({ ...sp, ...overrides[sp.id] });
    } else {
      result.push(sp);
    }
    seen.add(sp.id);
  });

  return result;
}

export const api = {
  // Get current auth user from localStorage for header tracking
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
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
    return data;
  },

  async register(clientData) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al registrar cliente');
    return data;
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
      if (res.ok) {
        list = await res.json();
      }
    } catch (_) {}

    // Fallback to bundled static seed if serverless cold-start or static hosting returns empty
    if (!Array.isArray(list) || list.length === 0) {
      try {
        const fbRes = await fetch('/public/store-fallback.json');
        if (fbRes.ok) {
          const fbStore = await fbRes.json();
          list = fbStore.products || [];
        }
      } catch (_) {}
    }

    return mergeProductsWithLocal(list);
  },

  async getProductById(id) {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) throw new Error('Producto no encontrado');
    return await res.json();
  },

  async createProduct(productData) {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(productData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al crear producto');
    saveLocalOverride(data);
    return data;
  },

  async updateProduct(id, productData) {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(productData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al actualizar producto');
    saveLocalOverride(data);
    return data;
  },

  async updateStock(id, newStock) {
    const res = await fetch(`/api/products/${id}/stock`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ stock: newStock })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al actualizar stock');
    saveLocalOverride(data);
    return data;
  },

  async deleteProduct(id) {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al eliminar producto');
    markLocalDeleted(id);
    return data;
  },

  // ORDERS
  async getOrders(params = {}) {
    const query = new URLSearchParams();
    if (params.customerEmail) query.append('customerEmail', params.customerEmail);
    if (params.status && params.status !== 'todos') query.append('status', params.status);

    const res = await fetch(`/api/orders?${query.toString()}`);
    if (!res.ok) throw new Error('Error al cargar pedidos');
    return await res.json();
  },

  async createOrder(orderData) {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(orderData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al procesar el pedido');
    return data;
  },

  async updateOrderStatus(id, status) {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al actualizar estado del pedido');
    return data;
  },

  // USERS & ADMINS
  async getUsers() {
    const res = await fetch('/api/users', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Error al cargar usuarios');
    return await res.json();
  },

  async addAdmin(adminData) {
    const res = await fetch('/api/users/admin', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(adminData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al agregar administrador');
    return data;
  },

  async deleteUser(id) {
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al eliminar usuario');
    return data;
  },

  // ACTIVITY LOGS
  async getActivityLogs(limit = 60) {
    const res = await fetch(`/api/activity?limit=${limit}`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Error al cargar registro de actividad');
    return await res.json();
  },

  // STATS
  async getStats() {
    const res = await fetch('/api/stats', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Error al cargar estadísticas');
    return await res.json();
  },

  // CONTACT INQUIRY
  async sendContactInquiry(contactData) {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al enviar consulta');
    return data;
  },

  // SITE CONFIG (CAROUSEL, FESTIVITIES & BANNERS)
  async getSiteConfig() {
    try {
      const res = await fetch('/api/site-config');
      if (res.ok) {
        const serverCfg = await res.json();
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

    const res = await fetch('/api/site-config', {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(withTimestamp)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al guardar configuración del sitio');
    try {
      localStorage.setItem(LOCAL_SITE_CONFIG_KEY, JSON.stringify(data));
    } catch (_) {}
    return data;
  }
};
