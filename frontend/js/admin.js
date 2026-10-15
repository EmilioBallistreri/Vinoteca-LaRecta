import { api } from './api.js';
import { auth } from './auth.js';

// Admin State
const adminState = {
  currentTab: 'dashboard',
  products: [],
  orders: [],
  users: [],
  activity: [],
  stats: null,
  selectedOrder: null,
  editingProduct: null,
  filterStockCategory: 'todos',
  filterStockSearch: '',
  filterOrderStatus: 'todos'
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

const formatDate = (isoString) => {
  if (!isoString) return '-';
  const d = new Date(isoString);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// ================= AUTH GUARD =================

function checkAdminAuth() {
  const user = auth.getUser();
  const lockEl = document.getElementById('adminLoginLock');
  const userMeta = document.getElementById('adminCurrentUserName');
  const userRole = document.getElementById('adminCurrentUserRole');
  const userAvatar = document.getElementById('adminAvatarInitial');

  if (!user || (user.role !== 'superadministrador' && user.role !== 'administrador')) {
    if (lockEl) lockEl.style.display = 'flex';
    return false;
  }

  if (lockEl) lockEl.style.display = 'none';
  if (userMeta) userMeta.textContent = user.name;
  if (userRole) userRole.textContent = user.role;
  if (userAvatar) userAvatar.textContent = user.name.charAt(0).toUpperCase();
  return true;
}

// ================= LOAD ALL DATA =================

async function loadData() {
  try {
    const [stats, products, orders, users, activity] = await Promise.all([
      api.getStats(),
      api.getProducts(),
      api.getOrders(),
      api.getUsers(),
      api.getActivityLogs(80)
    ]);

    adminState.stats = stats;
    adminState.products = products;
    adminState.orders = orders;
    adminState.users = users;
    adminState.activity = activity;

    renderActiveTab();
  } catch (err) {
    console.error('Error fetching admin data:', err);
    alert('Error al conectar con la API: ' + err.message);
  }
}

// ================= NAVIGATION =================

function setTab(tabName) {
  adminState.currentTab = tabName;

  document.querySelectorAll('.admin-nav-item button').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const titleEl = document.getElementById('adminPageTitle');
  const subEl = document.getElementById('adminPageSub');

  const titles = {
    dashboard: { title: 'Dashboard General', sub: 'Métricas clave, ventas y alertas en tiempo real' },
    stock: { title: 'Control de Stock e Inventario', sub: 'Administración de catálogo, precios y existencias' },
    orders: { title: 'Ventas y Gestión de Pedidos', sub: 'Seguimiento de pedidos, estados de entrega y facturación' },
    users: { title: 'Clientes y Control de Accesos', sub: 'Directorio de clientes y administradores con credenciales' },
    activity: { title: 'Registro de Actividad y Auditoría', sub: 'Historial detallado de todas las operaciones realizadas' }
  };

  if (titleEl && titles[tabName]) titleEl.textContent = titles[tabName].title;
  if (subEl && titles[tabName]) subEl.textContent = titles[tabName].sub;

  renderActiveTab();
}

function renderActiveTab() {
  const container = document.getElementById('adminContentArea');
  if (!container) return;

  switch (adminState.currentTab) {
    case 'dashboard':
      renderDashboard(container);
      break;
    case 'stock':
      renderStock(container);
      break;
    case 'orders':
      renderOrders(container);
      break;
    case 'users':
      renderUsers(container);
      break;
    case 'activity':
      renderActivity(container);
      break;
  }
}

// ================= 1. DASHBOARD GENERAL =================

function renderDashboard(container) {
  const { stats, activity } = adminState;
  if (!stats) return;

  container.innerHTML = `
    <!-- Top KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-info">
          <h3>Total Ventas Facturadas</h3>
          <div class="kpi-value">${formatCurrency(stats.totalSales)}</div>
          <div class="kpi-subtext">Acumulado en tienda online</div>
        </div>
        <div class="kpi-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-info">
          <h3>Pedidos Pendientes</h3>
          <div class="kpi-value" style="color: ${stats.pendingOrders > 0 ? '#ff9800' : '#fff'};">${stats.pendingOrders}</div>
          <div class="kpi-subtext">Por preparar o despachar</div>
        </div>
        <div class="kpi-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-info">
          <h3>Productos Activos</h3>
          <div class="kpi-value">${stats.totalProducts}</div>
          <div class="kpi-subtext">En catálogo online</div>
        </div>
        <div class="kpi-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        </div>
      </div>

      <div class="kpi-card" style="${stats.lowStockCount > 0 ? 'border-color: rgba(237, 108, 2, 0.4);' : ''}">
        <div class="kpi-info">
          <h3>Alertas de Stock Bajo</h3>
          <div class="kpi-value" style="color: ${stats.lowStockCount > 0 ? '#ff9800' : '#4caf50'};">${stats.lowStockCount}</div>
          <div class="kpi-subtext">${stats.outOfStockCount} productos agotados</div>
        </div>
        <div class="kpi-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
      </div>
    </div>

    <!-- Quick Actions Banner -->
    <div style="background: rgba(197, 160, 89, 0.08); border: 1px solid var(--admin-border); border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: gap;">
      <div>
        <h4 style="color: var(--gold-light); font-size: 0.95rem; font-weight: 700;">Acciones Rápidas</h4>
        <p style="color: #aaa; font-size: 0.78rem;">Gestione el inventario y revise pedidos con un solo clic.</p>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <button id="dashNewProdBtn" class="btn-primary" style="padding: 0.6rem 1.2rem; font-size: 0.78rem;">+ Nuevo Producto</button>
        <button id="dashViewOrdersBtn" class="btn-secondary" style="padding: 0.6rem 1.2rem; font-size: 0.78rem;">Gestionar Pedidos</button>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 1.5rem;">
      <!-- Recent Orders Table -->
      <div class="admin-card" style="margin-bottom: 0;">
        <div class="admin-card-header">
          <h3 class="admin-card-title">Últimos Pedidos Registrados</h3>
          <button id="dashAllOrdersLink" style="font-size: 0.75rem; color: var(--gold-light); font-weight: 600;">Ver todos &rarr;</button>
        </div>
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${stats.recentOrders.map(o => `
                <tr>
                  <td><strong>#${o.id}</strong></td>
                  <td>${o.customer.name}</td>
                  <td><strong>${formatCurrency(o.total)}</strong></td>
                  <td><span class="badge-status ${o.status.toLowerCase().replace(' ', '-')}">${o.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Live Activity Mini Feed -->
      <div class="admin-card" style="margin-bottom: 0;">
        <div class="admin-card-header">
          <h3 class="admin-card-title">Actividad Reciente</h3>
          <button id="dashAllActivityLink" style="font-size: 0.75rem; color: var(--gold-light); font-weight: 600;">Ver registro &rarr;</button>
        </div>
        <div class="activity-feed-list">
          ${activity.slice(0, 5).map(act => `
            <div class="activity-item" style="padding: 0.75rem;">
              <div class="activity-icon-badge ${act.badgeColor}">•</div>
              <div class="activity-body">
                <div class="activity-desc" style="font-size: 0.8rem;">${act.description}</div>
                <div class="activity-meta">
                  <span class="activity-user-tag">${act.userName || act.user}</span>
                  <span>${formatDate(act.timestamp)}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  document.getElementById('dashNewProdBtn')?.addEventListener('click', () => openProductFormModal());
  document.getElementById('dashViewOrdersBtn')?.addEventListener('click', () => setTab('orders'));
  document.getElementById('dashAllOrdersLink')?.addEventListener('click', () => setTab('orders'));
  document.getElementById('dashAllActivityLink')?.addEventListener('click', () => setTab('activity'));
}

// ================= 2. CONTROL DE STOCK =================

function renderStock(container) {
  let filtered = [...adminState.products];

  if (adminState.filterStockCategory !== 'todos') {
    filtered = filtered.filter(p => p.category === adminState.filterStockCategory);
  }

  if (adminState.filterStockSearch.trim()) {
    const q = adminState.filterStockSearch.toLowerCase().trim();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.bodega && p.bodega.toLowerCase().includes(q))
    );
  }

  container.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header">
        <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
          <input 
            type="text" 
            id="stockSearchInput" 
            placeholder="Buscar por vino, bodega..." 
            value="${adminState.filterStockSearch}" 
            class="form-input" 
            style="width: 250px; font-size: 0.82rem; padding: 0.5rem 0.85rem;" 
          />

          <select id="stockCategoryFilter" class="form-select" style="width: 170px; font-size: 0.82rem; padding: 0.5rem 0.85rem;">
            <option value="todos" ${adminState.filterStockCategory === 'todos' ? 'selected' : ''}>Todas las Categorías</option>
            <option value="promos" ${adminState.filterStockCategory === 'promos' ? 'selected' : ''}>Promos</option>
            <option value="vinos" ${adminState.filterStockCategory === 'vinos' ? 'selected' : ''}>Vinos</option>
            <option value="espumantes" ${adminState.filterStockCategory === 'espumantes' ? 'selected' : ''}>Espumantes</option>
            <option value="whiskys" ${adminState.filterStockCategory === 'whiskys' ? 'selected' : ''}>Whiskys</option>
            <option value="aperitivos" ${adminState.filterStockCategory === 'aperitivos' ? 'selected' : ''}>Aperitivos</option>
            <option value="delicatessen" ${adminState.filterStockCategory === 'delicatessen' ? 'selected' : ''}>Delicatessen</option>
          </select>
        </div>

        <button id="addNewProductBtn" class="btn-primary" style="padding: 0.6rem 1.4rem; font-size: 0.82rem;">
          + Agregar Nuevo Producto
        </button>
      </div>

      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría / Bodega</th>
              <th>Precio</th>
              <th>Stock Actual</th>
              <th>Estado Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(p => {
              const isOut = p.stock <= 0;
              const isLow = p.stock > 0 && p.stock <= (p.minStock || 3);
              return `
                <tr data-product-id="${p.id}">
                  <td>
                    <div style="display: flex; align-items: center; gap: 0.85rem;">
                      <img src="${p.image}" alt="${p.name}" style="width: 44px; height: 44px; border-radius: 8px; object-fit: cover; border: 1px solid var(--admin-border);" />
                      <div>
                        <strong style="color: #fff; font-size: 0.9rem;">${p.name}</strong>
                        ${p.badge ? `<span style="font-size: 0.65rem; background: rgba(197, 160, 89, 0.2); color: var(--gold-light); padding: 0.1rem 0.4rem; border-radius: 4px; margin-left: 0.35rem;">${p.badge}</span>` : ''}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style="color: var(--gold-light); font-weight: 600; text-transform: uppercase; font-size: 0.75rem;">${p.category}</span>
                    <div style="font-size: 0.72rem; color: #888;">${p.bodega || '-'}</div>
                  </td>
                  <td>
                    <strong>${formatCurrency(p.price)}</strong>
                    ${p.discount > 0 ? `<div style="font-size: 0.72rem; color: #ff6b6b;">${p.discount}% OFF</div>` : ''}
                  </td>
                  <td>
                    <div class="stock-stepper-inline">
                      <button data-action="quick-dec-stock" data-id="${p.id}">-</button>
                      <span>${p.stock}</span>
                      <button data-action="quick-inc-stock" data-id="${p.id}">+</button>
                    </div>
                  </td>
                  <td>
                    ${isOut ? `
                      <span class="badge-status cancelado">Agotado</span>
                    ` : isLow ? `
                      <span class="badge-status pendiente">Stock Bajo (${p.stock})</span>
                    ` : `
                      <span class="badge-status completado">Disponible</span>
                    `}
                  </td>
                  <td>
                    <div style="display: flex; gap: 0.5rem;">
                      <button data-action="edit-product" data-id="${p.id}" class="btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">Editar</button>
                      <button data-action="delete-product" data-id="${p.id}" style="color: #ff6b6b; padding: 0.35rem 0.5rem; font-size: 0.75rem;">Eliminar</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Attach search & filters
  document.getElementById('stockSearchInput')?.addEventListener('input', (e) => {
    adminState.filterStockSearch = e.target.value;
    renderStock(container);
  });

  document.getElementById('stockCategoryFilter')?.addEventListener('change', (e) => {
    adminState.filterStockCategory = e.target.value;
    renderStock(container);
  });

  document.getElementById('addNewProductBtn')?.addEventListener('click', () => {
    openProductFormModal(null);
  });

  // Attach quick stock adjusters
  container.querySelectorAll('[data-action="quick-inc-stock"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const prod = adminState.products.find(p => p.id === id);
      if (prod) {
        const updated = await api.updateStock(id, prod.stock + 1);
        prod.stock = updated.stock;
        renderStock(container);
      }
    });
  });

  container.querySelectorAll('[data-action="quick-dec-stock"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const prod = adminState.products.find(p => p.id === id);
      if (prod && prod.stock > 0) {
        const updated = await api.updateStock(id, prod.stock - 1);
        prod.stock = updated.stock;
        renderStock(container);
      }
    });
  });

  // Edit product
  container.querySelectorAll('[data-action="edit-product"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const prod = adminState.products.find(p => p.id === id);
      if (prod) openProductFormModal(prod);
    });
  });

  // Delete product
  container.querySelectorAll('[data-action="delete-product"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const prod = adminState.products.find(p => p.id === id);
      if (prod && confirm(`¿Está seguro de eliminar "${prod.name}" del catálogo?`)) {
        await api.deleteProduct(id);
        adminState.products = adminState.products.filter(p => p.id !== id);
        renderStock(container);
      }
    });
  });
}

// ================= 3. VENTAS Y PEDIDOS =================

function renderOrders(container) {
  let list = [...adminState.orders];

  if (adminState.filterOrderStatus !== 'todos') {
    list = list.filter(o => o.status.toLowerCase() === adminState.filterOrderStatus.toLowerCase());
  }

  container.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header">
        <div style="display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap;">
          <button class="filter-pill ${adminState.filterOrderStatus === 'todos' ? 'active' : ''}" data-status="todos">Todos (${adminState.orders.length})</button>
          <button class="filter-pill ${adminState.filterOrderStatus === 'pendiente' ? 'active' : ''}" data-status="pendiente">Pendientes</button>
          <button class="filter-pill ${adminState.filterOrderStatus === 'en preparación' ? 'active' : ''}" data-status="en preparación">En Preparación</button>
          <button class="filter-pill ${adminState.filterOrderStatus === 'enviado' ? 'active' : ''}" data-status="enviado">Enviados</button>
          <button class="filter-pill ${adminState.filterOrderStatus === 'completado' ? 'active' : ''}" data-status="completado">Completados</button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Fecha</th>
              <th>Cliente & Teléfono</th>
              <th>Método de Pago</th>
              <th>Total</th>
              <th>Estado Actual</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(order => `
              <tr data-order-id="${order.id}">
                <td><strong style="color: var(--gold-light);">#${order.id}</strong></td>
                <td><span style="font-size: 0.78rem; color: #aaa;">${formatDate(order.createdAt)}</span></td>
                <td>
                  <strong>${order.customer.name}</strong>
                  <div style="font-size: 0.75rem; color: #888;">${order.customer.phone || order.customer.email}</div>
                </td>
                <td>
                  <span style="font-size: 0.78rem;">${order.paymentMethod}</span>
                </td>
                <td>
                  <strong style="font-size: 0.95rem; color: #fff;">${formatCurrency(order.total)}</strong>
                </td>
                <td>
                  <select class="form-select status-changer-select" data-id="${order.id}" style="padding: 0.35rem 0.65rem; font-size: 0.75rem; width: auto;">
                    <option value="Pendiente" ${order.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="Pagado" ${order.status === 'Pagado' ? 'selected' : ''}>Pagado</option>
                    <option value="En preparación" ${order.status === 'En preparación' ? 'selected' : ''}>En preparación</option>
                    <option value="Enviado" ${order.status === 'Enviado' ? 'selected' : ''}>Enviado</option>
                    <option value="Completado" ${order.status === 'Completado' ? 'selected' : ''}>Completado</option>
                    <option value="Cancelado" ${order.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                  </select>
                </td>
                <td>
                  <button data-action="view-order-detail" data-id="${order.id}" class="btn-secondary" style="padding: 0.4rem 0.85rem; font-size: 0.75rem;">
                    Ver Detalle
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Status pills
  container.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      adminState.filterOrderStatus = btn.getAttribute('data-status');
      renderOrders(container);
    });
  });

  // Inline status dropdown changer
  container.querySelectorAll('.status-changer-select').forEach(sel => {
    sel.addEventListener('change', async (e) => {
      const orderId = sel.getAttribute('data-id');
      const newStatus = e.target.value;
      try {
        await api.updateOrderStatus(orderId, newStatus);
        const ord = adminState.orders.find(o => o.id === orderId);
        if (ord) ord.status = newStatus;
        alert(`Pedido #${orderId} actualizado a "${newStatus}"`);
      } catch (err) {
        alert('Error al actualizar estado: ' + err.message);
      }
    });
  });

  // View order detail
  container.querySelectorAll('[data-action="view-order-detail"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const orderId = btn.getAttribute('data-id');
      const order = adminState.orders.find(o => o.id === orderId);
      if (order) openOrderDetailModal(order);
    });
  });
}

function openOrderDetailModal(order) {
  const modal = document.getElementById('adminOrderDetailModal');
  const body = document.getElementById('adminOrderModalBody');
  if (!modal || !body) return;

  body.innerHTML = `
    <div style="margin-bottom: 1.5rem; border-bottom: 1px solid var(--admin-border); padding-bottom: 1rem;">
      <h3 style="font-family: 'Cinzel', serif; font-size: 1.45rem; color: #fff;">Pedido #${order.id}</h3>
      <span style="font-size: 0.78rem; color: var(--gold-light);">Registrado el ${formatDate(order.createdAt)}</span>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem; font-size: 0.85rem;">
      <div style="background: #191919; padding: 1rem; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.05);">
        <strong style="color: var(--gold-light); display: block; margin-bottom: 0.35rem;">Datos del Cliente:</strong>
        <div><strong>Nombre:</strong> ${order.customer.name}</div>
        <div><strong>Email:</strong> ${order.customer.email}</div>
        <div><strong>Teléfono:</strong> ${order.customer.phone || '-'}</div>
      </div>

      <div style="background: #191919; padding: 1rem; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.05);">
        <strong style="color: var(--gold-light); display: block; margin-bottom: 0.35rem;">Entrega & Pago:</strong>
        <div><strong>Dirección:</strong> ${order.customer.address}</div>
        <div><strong>Forma de Pago:</strong> ${order.paymentMethod}</div>
        <div><strong>Estado:</strong> <span class="badge-status ${order.status.toLowerCase().replace(' ', '-')}">${order.status}</span></div>
      </div>
    </div>

    ${order.notes ? `
      <div style="background: rgba(197, 160, 89, 0.08); padding: 0.85rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.82rem; color: #ddd;">
        <strong>Nota del Cliente:</strong> "${order.notes}"
      </div>
    ` : ''}

    <h4 style="font-size: 0.9rem; color: #fff; margin-bottom: 0.75rem;">Productos Solicitados:</h4>
    <div style="background: #191919; border: 1px solid var(--admin-border); border-radius: 10px; overflow: hidden; margin-bottom: 1.5rem;">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Precio Unit.</th>
            <th>Cant.</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td><strong>${item.name}</strong></td>
              <td>${formatCurrency(item.price)}</td>
              <td>x${item.quantity}</td>
              <td><strong>${formatCurrency(item.price * item.quantity)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div style="display: flex; justify-content: flex-end; font-size: 1.15rem; color: #fff;">
      <div>
        <span style="color: #aaa; font-size: 0.9rem; margin-right: 1rem;">Total Abonado:</span>
        <strong style="color: var(--gold-light);">${formatCurrency(order.total)}</strong>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

// ================= 4. CLIENTES Y ACCESOS =================

function renderUsers(container) {
  const admins = adminState.users.filter(u => u.role.includes('admin'));
  const clients = adminState.users.filter(u => u.role === 'cliente');

  container.innerHTML = `
    <!-- Administrators Section -->
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <h3 class="admin-card-title">Equipo de Administradores Autorizados</h3>
          <p style="font-size: 0.75rem; color: #888;">Cuentas con acceso exclusivo al panel de control</p>
        </div>
        <button id="addAdminBtn" class="btn-primary" style="padding: 0.55rem 1.25rem; font-size: 0.78rem;">
          + Nuevo Administrador
        </button>
      </div>

      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Nombre y Apellido</th>
              <th>Email</th>
              <th>Rol / Jerarquía</th>
              <th>Último Ingreso</th>
            </tr>
          </thead>
          <tbody>
            ${admins.map(adm => `
              <tr>
                <td><strong style="color: #fff;">${adm.name}</strong></td>
                <td><span style="color: var(--gold-light);">${adm.email}</span></td>
                <td>
                  <span class="dropdown-user-role ${adm.role}" style="font-size: 0.7rem;">
                    ${adm.role}
                  </span>
                </td>
                <td><span style="font-size: 0.75rem; color: #aaa;">${formatDate(adm.lastLogin)}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Clients Section -->
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <h3 class="admin-card-title">Clientes Registrados</h3>
          <p style="font-size: 0.75rem; color: #888;">Base de clientes para envíos y promociones</p>
        </div>
        <span style="font-size: 0.8rem; color: var(--gold-light); font-weight: 600;">${clients.length} Clientes Totales</span>
      </div>

      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Dirección de Entrega</th>
              <th>Fecha Registro</th>
            </tr>
          </thead>
          <tbody>
            ${clients.map(cl => `
              <tr>
                <td><strong style="color: #fff;">${cl.name}</strong></td>
                <td>${cl.email}</td>
                <td>${cl.phone || '-'}</td>
                <td><span style="font-size: 0.8rem; color: #bbb;">${cl.address || '-'}</span></td>
                <td><span style="font-size: 0.75rem; color: #aaa;">${formatDate(cl.createdAt)}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('addAdminBtn')?.addEventListener('click', openAddAdminModal);
}

function openAddAdminModal() {
  const modal = document.getElementById('adminNewAdminModal');
  if (modal) modal.classList.add('active');
}

// ================= 5. REGISTRO DE ACTIVIDAD =================

function renderActivity(container) {
  container.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <h3 class="admin-card-title">Registro de Auditoría en Tiempo Real</h3>
          <p style="font-size: 0.75rem; color: #888;">Historial cronológico de cambios de stock, pedidos y accesos</p>
        </div>
      </div>

      <div class="activity-feed-list">
        ${adminState.activity.map(act => `
          <div class="activity-item">
            <div class="activity-icon-badge ${act.badgeColor}">
              ${act.action === 'STOCK_UPDATE' ? '📦' :
                act.action === 'ORDER_STATUS' ? '🚚' :
                act.action === 'ADMIN_LOGIN' ? '🔐' :
                act.action === 'PRODUCT_CREATED' ? '✨' : '📝'}
            </div>
            <div class="activity-body">
              <div class="activity-desc">${act.description}</div>
              <div class="activity-meta">
                <span class="activity-user-tag">${act.userName || act.user}</span>
                <span style="font-size: 0.68rem; background: #222; padding: 0.1rem 0.4rem; border-radius: 4px;">${act.action}</span>
                <span>${formatDate(act.timestamp)}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ================= PRODUCT FORM MODAL (CREATE / EDIT) =================

const ADMIN_SUBCATS = {
  promos: ['Combos Degustación', 'Cajas x6', 'Packs con Copas', 'Ofertas Especiales'],
  vinos: ['Malbec', 'Cabernet Sauvignon', 'Red Blend & Cortes', 'Blancos & Rosados'],
  espumantes: ['Extra Brut', 'Brut Nature', 'Champagne Francés', 'Rosé & Método Tradicional'],
  whiskys: ['Single Malt Escocés', 'Blended Scotch', 'Bourbon Americano', 'Irlandés & Otros'],
  aperitivos: ['Gin Premium', 'Vermouth & Bitter', 'Fernet & Digestivos', 'Licores Finos'],
  delicatessen: ['Aceites de Oliva Extra Virgen', 'Conservas & Ahumados', 'Chocolates & Dulces Finos', 'Tablas & Embutidos Artesanales']
};

function updateSubcatDatalist(cat) {
  const dl = document.getElementById('pSubcatDatalist');
  if (!dl) return;
  const list = ADMIN_SUBCATS[cat] || [];
  dl.innerHTML = list.map(s => '<option value="' + s + '"></option>').join('');
}

function openProductFormModal(product = null) {
  adminState.editingProduct = product;
  const modal = document.getElementById('adminProductModal');
  const titleEl = document.getElementById('adminProductModalTitle');
  const form = document.getElementById('adminProductForm');
  if (!modal || !form) return;

  if (titleEl) {
    titleEl.textContent = product ? 'Editar Producto' : 'Crear Nuevo Producto';
  }

  document.getElementById('pFormName').value = product?.name || '';
  const initialCat = product?.category || 'vinos';
  document.getElementById('pFormCategory').value = initialCat;
  updateSubcatDatalist(initialCat);
  document.getElementById('pFormCategory').onchange = (e) => updateSubcatDatalist(e.target.value);
  document.getElementById('pFormSubcategory').value = product?.subcategory || '';
  document.getElementById('pFormBodega').value = product?.bodega || '';
  document.getElementById('pFormPrice').value = product?.price || '';
  document.getElementById('pFormOriginalPrice').value = product?.originalPrice || '';
  document.getElementById('pFormDiscount').value = product?.discount || 0;
  document.getElementById('pFormStock').value = product ? product.stock : 10;
  document.getElementById('pFormMinStock').value = product ? (product.minStock || 3) : 3;
  document.getElementById('pFormBadge').value = product?.badge || '';
  document.getElementById('pFormImage').value = product?.image || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80';
  document.getElementById('pFormDesc').value = product?.description || '';
  document.getElementById('pFormFeatured').checked = Boolean(product?.isFeatured);

  modal.classList.add('active');
}

// ================= SETUP ADMIN EVENT LISTENERS =================

function setupAdminListeners() {
  // Nav tabs
  document.querySelectorAll('.admin-nav-item button').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      setTab(tab);
    });
  });

  // Admin Logout
  document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
    auth.logout();
  });

  // Modal Close buttons
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-overlay')?.classList.remove('active');
    });
  });

  // Lock Screen Login Form
  document.getElementById('adminLockLoginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminLockEmail').value;
    const pass = document.getElementById('adminLockPassword').value;
    const errEl = document.getElementById('adminLockError');

    try {
      if (errEl) errEl.textContent = 'Verificando credenciales...';
      const res = await api.login(email, pass);
      if (!res.user.role.includes('admin')) {
        throw new Error('Esta cuenta no posee privilegios administrativos.');
      }
      auth.setUser(res.user);
      checkAdminAuth();
      loadData();
    } catch (err) {
      if (errEl) errEl.textContent = err.message;
    }
  });

  // Quick Superadmin selector buttons in lock screen
  document.querySelectorAll('.quick-admin-chip-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const email = btn.getAttribute('data-email');
      const pass = btn.getAttribute('data-pass');
      document.getElementById('adminLockEmail').value = email;
      document.getElementById('adminLockPassword').value = pass;

      try {
        const res = await api.login(email, pass);
        auth.setUser(res.user);
        checkAdminAuth();
        loadData();
      } catch (err) {
        alert(err.message);
      }
    });
  });

  // Product Form Submit (Create / Edit)
  document.getElementById('adminProductForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const isEdit = Boolean(adminState.editingProduct);

    const productData = {
      name: document.getElementById('pFormName').value,
      category: document.getElementById('pFormCategory').value,
      subcategory: document.getElementById('pFormSubcategory').value,
      bodega: document.getElementById('pFormBodega').value,
      price: Number(document.getElementById('pFormPrice').value),
      originalPrice: document.getElementById('pFormOriginalPrice').value ? Number(document.getElementById('pFormOriginalPrice').value) : null,
      discount: Number(document.getElementById('pFormDiscount').value) || 0,
      stock: Number(document.getElementById('pFormStock').value),
      minStock: Number(document.getElementById('pFormMinStock').value),
      badge: document.getElementById('pFormBadge').value || null,
      image: document.getElementById('pFormImage').value,
      description: document.getElementById('pFormDesc').value,
      isFeatured: document.getElementById('pFormFeatured').checked
    };

    try {
      if (isEdit) {
        const updated = await api.updateProduct(adminState.editingProduct.id, productData);
        const idx = adminState.products.findIndex(p => p.id === adminState.editingProduct.id);
        if (idx !== -1) adminState.products[idx] = updated;
        alert(`Producto "${updated.name}" actualizado correctamente.`);
      } else {
        const created = await api.createProduct(productData);
        adminState.products.unshift(created);
        alert(`Producto "${created.name}" creado con éxito.`);
      }

      document.getElementById('adminProductModal')?.classList.remove('active');
      renderActiveTab();
    } catch (err) {
      alert('Error al guardar producto: ' + err.message);
    }
  });

  // New Admin Form Submit
  document.getElementById('adminNewAdminForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('newAdminName').value;
    const email = document.getElementById('newAdminEmail').value;
    const password = document.getElementById('newAdminPassword').value || 'AdminRecta2024!';
    const role = document.getElementById('newAdminRole').value;

    try {
      const newAdmin = await api.addAdmin({ name, email, password, role });
      adminState.users.push(newAdmin);
      alert(`Acceso administrativo concedido a ${newAdmin.name} (${newAdmin.email})`);
      document.getElementById('adminNewAdminModal')?.classList.remove('active');
      renderActiveTab();
    } catch (err) {
      alert('Error al agregar administrador: ' + err.message);
    }
  });
}

// ================= INITIALIZE =================

document.addEventListener('DOMContentLoaded', () => {
  auth.init();
  setupAdminListeners();

  if (checkAdminAuth()) {
    loadData();
  }
});
