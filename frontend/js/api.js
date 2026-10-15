// Centralized API Client for Vinoteca La Recta
const API_BASE = window.location.origin.includes('localhost')
  ? '' // Uses relative path to hit same origin / proxy
  : '';

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

    const res = await fetch(`/api/products?${query.toString()}`);
    if (!res.ok) throw new Error('Error al cargar productos');
    return await res.json();
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
    return data;
  },

  async deleteProduct(id) {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al eliminar producto');
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
  }
};
