import { api } from './api.js';
import { auth } from './auth.js';
import { FESTIVITIES_CATALOG } from './festivities.js';

// Admin State
const adminState = {
  currentTab: 'dashboard',
  products: [],
  orders: [],
  users: [],
  activity: [],
  stats: null,
  siteConfig: null,
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
    const [stats, products, orders, users, activity, siteConfig] = await Promise.all([
      api.getStats(),
      api.getProducts(),
      api.getOrders(),
      api.getUsers(),
      api.getActivityLogs(80),
      api.getSiteConfig().catch(() => null)
    ]);

    adminState.stats = stats;
    adminState.products = products;
    adminState.orders = orders;
    adminState.users = users;
    adminState.activity = activity;
    if (siteConfig) adminState.siteConfig = siteConfig;

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
    stock: { title: 'Control de Stock e Inventario', sub: 'Administración de catálogo, cálculo por unidad o por caja y existencias' },
    customization: { title: 'Personalizar Inicio & Festividades', sub: 'Carrusel de portada, decoración temática por festividad, banners y promos' },
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
    case 'customization':
      renderCustomization(container);
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
  const { stats, activity, siteConfig } = adminState;
  if (!stats) return;

  const activeFest = FESTIVITIES_CATALOG[siteConfig?.activeFestivity || 'clasico'] || FESTIVITIES_CATALOG.clasico;

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
    <div style="background: rgba(197, 160, 89, 0.08); border: 1px solid var(--admin-border); border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h4 style="color: var(--gold-light); font-size: 0.95rem; font-weight: 700;">Acciones Rápidas &bull; Tema activo: ${activeFest.emoji} ${activeFest.name}</h4>
        <p style="color: #aaa; font-size: 0.78rem;">Gestione el inventario por unidad o caja, personalice la portada según festividades y revise pedidos.</p>
      </div>
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
        <button id="dashNewProdBtn" class="btn-primary" style="padding: 0.6rem 1.2rem; font-size: 0.78rem;">+ Nuevo Producto</button>
        <button id="dashCustomizeBtn" class="btn-secondary" style="padding: 0.6rem 1.2rem; font-size: 0.78rem;">🎨 Inicio &amp; Festividades</button>
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
  document.getElementById('dashCustomizeBtn')?.addEventListener('click', () => setTab('customization'));
  document.getElementById('dashViewOrdersBtn')?.addEventListener('click', () => setTab('orders'));
  document.getElementById('dashAllOrdersLink')?.addEventListener('click', () => setTab('orders'));
  document.getElementById('dashAllActivityLink')?.addEventListener('click', () => setTab('activity'));
}

// ================= 2. CONTROL DE STOCK =================

function formatBoxBreakdown(stockUnits, unitsPerBox = 6) {
  const upb = Math.max(1, Number(unitsPerBox) || 6);
  const total = Math.max(0, Number(stockUnits) || 0);
  const fullBoxes = Math.floor(total / upb);
  const loose = total % upb;
  if (total === 0) return `0 cajas (${upb} un./caja)`;
  if (loose === 0) return `📦 ${fullBoxes} ${fullBoxes === 1 ? 'caja' : 'cajas'} × ${upb} un.`;
  if (fullBoxes === 0) return `${loose} un. sueltas (caja de ${upb})`;
  return `📦 ${fullBoxes} ${fullBoxes === 1 ? 'caja' : 'cajas'} × ${upb} + ${loose} sueltas`;
}

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
              <th>Stock Actual (Unidades &amp; Cajas)</th>
              <th>Estado Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(p => {
              const isOut = p.stock <= 0;
              const isLow = p.stock > 0 && p.stock <= (p.minStock || 3);
              const upb = p.unitsPerBox || 6;
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
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <div class="stock-stepper-inline">
                        <button data-action="quick-dec-stock" data-id="${p.id}" title="Restar 1 unidad">-</button>
                        <span>${p.stock} un.</span>
                        <button data-action="quick-inc-stock" data-id="${p.id}" title="Sumar 1 unidad">+</button>
                      </div>
                      <button data-action="quick-inc-box" data-id="${p.id}" data-upb="${upb}" class="btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.68rem;" title="Sumar 1 caja (${upb} un.)">+1 Caja</button>
                    </div>
                    <div style="font-size: 0.71rem; color: var(--gold-light); margin-top: 0.28rem;">
                      ${formatBoxBreakdown(p.stock, upb)}
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

  container.querySelectorAll('[data-action="quick-inc-box"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const upb = Number(btn.getAttribute('data-upb')) || 6;
      const prod = adminState.products.find(p => p.id === id);
      if (prod) {
        const updated = await api.updateStock(id, prod.stock + upb);
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

// ================= 2B. PERSONALIZAR INICIO & FESTIVIDADES =================

function standardizeWideImage(file, targetW = 1600, targetH = 900) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen inválido.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#09090a';
        ctx.fillRect(0, 0, targetW, targetH);

        const srcRatio = img.width / img.height;
        const dstRatio = targetW / targetH;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (srcRatio > dstRatio) {
          sw = img.height * dstRatio;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / dstRatio;
          sy = (img.height - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
        resolve(canvas.toDataURL('image/webp', 0.84));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderCustomization(container) {
  if (!adminState.siteConfig) {
    adminState.siteConfig = {
      heroSlides: [
        { id: 'slide-1', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1920&q=85', label: 'Cava Principal' },
        { id: 'slide-2', image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1920&q=85', label: 'Degustación & Copas' },
        { id: 'slide-3', image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=1920&q=85', label: 'Destilados & Barricas' }
      ],
      heroTag: 'Av. Recta Martinolli 8255 • Cava de Selección',
      heroTitle: 'Tradición, Linaje &',
      heroHighlight: 'Vinos de Colección',
      heroDescription: 'Una cuidada curaduría de cosechas históricas, partidas limitadas de bodegas boutique y destilados nobles.',
      activeFestivity: 'clasico',
      banner: {
        enabled: false,
        badge: 'ESPECIAL DE TEMPORADA',
        title: 'Celebrá con Etiquetas Seleccionadas',
        subtitle: 'Descubrí nuestros combos exclusivos y descuentos especiales.',
        ctaText: 'Ver Promociones Especiales',
        ctaLink: '#promos',
        image: ''
      }
    };
  }

  const cfg = adminState.siteConfig;
  const activeFestId = cfg.activeFestivity || 'clasico';
  const activeFest = FESTIVITIES_CATALOG[activeFestId] || FESTIVITIES_CATALOG.clasico;
  const banner = cfg.banner || {};
  const promosList = adminState.products.filter(p => p.category === 'promos' || (p.discount && p.discount > 0));

  container.innerHTML = `
    <!-- Top Save Bar -->
    <div class="cust-sticky-savebar">
      <div>
        <span style="font-size: 0.75rem; color: var(--gold-light); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700;">Diseño Activo en la Web:</span>
        <strong style="color: #fff; font-size: 1rem; margin-left: 0.45rem;">${activeFest.emoji} ${activeFest.name}</strong>
        <span style="font-size: 0.78rem; color: #999; margin-left: 0.65rem;">(${cfg.heroSlides?.length || 0} fotos en carrusel • Banner ${banner.enabled ? 'Activo' : 'Oculto'})</span>
      </div>
      <div style="display: flex; gap: 0.75rem; align-items: center;">
        <a href="/" target="_blank" class="btn-secondary" style="padding: 0.6rem 1.1rem; font-size: 0.78rem;">Ver Tienda en Vivo ↗</a>
        <button id="saveSiteConfigBtn" class="btn-primary" style="padding: 0.65rem 1.5rem; font-size: 0.82rem;">
          💾 Guardar y Publicar en la Web
        </button>
      </div>
    </div>

    <!-- 1. FESTIVIDADES Y TEMÁTICA DEL SITIO -->
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <h3 class="admin-card-title">1. Decorar la Web por Festividad (Diseños Únicos por Fecha)</h3>
          <p style="font-size: 0.78rem; color: #999; margin-top: 0.2rem;">
            Elegí la festividad actual para transformar la ambientación de la tienda. Cada festividad tiene su propia paleta de colores, cinta superior, efectos visuales exclusivos y textos sugeridos sin repetirse.
          </p>
        </div>
      </div>

      <div class="festivities-selector-grid">
        ${Object.values(FESTIVITIES_CATALOG).map(fest => {
          const isSelected = fest.id === activeFestId;
          return `
            <div class="festivity-theme-card ${isSelected ? 'selected' : ''}" data-fest-id="${fest.id}" style="--card-fest-color: ${fest.colors.primary}; --card-fest-accent: ${fest.colors.accent};">
              <div class="fest-card-top">
                <span class="fest-card-emoji">${fest.emoji}</span>
                <div class="fest-card-swatches">
                  <span style="background: ${fest.colors.primary};" title="Color Primario"></span>
                  <span style="background: ${fest.colors.secondary};" title="Color Secundario"></span>
                  <span style="background: ${fest.colors.accent};" title="Color Acento"></span>
                </div>
              </div>
              <h4 class="fest-card-title">${fest.name}</h4>
              <span class="fest-card-season">${fest.season}</span>
              <p class="fest-card-desc">${fest.description}</p>
              <div class="fest-card-footer">
                ${isSelected ? `
                  <span class="fest-active-pill">✓ Tema Seleccionado</span>
                ` : `
                  <span class="fest-select-hint">Hacer clic para activar</span>
                `}
                ${fest.id !== 'clasico' ? `
                  <button type="button" class="fest-apply-preset-btn" data-preset-fest="${fest.id}" title="Cargar también el banner sugerido para ${fest.name}">
                    Cargar Banner Sugerido
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- 2. BANNER FESTIVO Y PROMOCIONES EN WEB PRINCIPAL -->
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <h3 class="admin-card-title">2. Banner Festivo y Promos de Temporada en Inicio</h3>
          <p style="font-size: 0.78rem; color: #999; margin-top: 0.2rem;">
            Configurá un banner promocional destacado en la página principal para anunciar combos, descuentos o cajas especiales de la festividad elegida.
          </p>
        </div>
        <label class="cust-toggle-switch">
          <input type="checkbox" id="custBannerEnabled" ${banner.enabled ? 'checked' : ''} />
          <span class="cust-toggle-slider"></span>
          <span class="cust-toggle-label">${banner.enabled ? 'Banner Visible en Inicio' : 'Banner Oculto'}</span>
        </label>
      </div>

      <div style="display: grid; grid-template-columns: 1.3fr 1fr; gap: 1.5rem; align-items: start;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Etiqueta Superior del Banner (Badge)</label>
            <input type="text" id="custBannerBadge" class="form-input" value="${banner.badge || ''}" placeholder="Ej: 🎄 EDICIÓN ESPECIAL NAVIDAD" />
          </div>

          <div class="form-group">
            <label class="form-label">Texto del Botón de Acción</label>
            <input type="text" id="custBannerCtaText" class="form-input" value="${banner.ctaText || 'Ver Promociones Especiales'}" placeholder="Ej: Ver Combos Navideños" />
          </div>

          <div class="form-group" style="grid-column: 1 / -1;">
            <label class="form-label">Título Principal del Banner</label>
            <input type="text" id="custBannerTitle" class="form-input" value="${banner.title || ''}" placeholder="Ej: Regalá Grandes Momentos en esta Nochebuena" />
          </div>

          <div class="form-group" style="grid-column: 1 / -1;">
            <label class="form-label">Subtítulo / Descripción de la Promoción</label>
            <textarea id="custBannerSubtitle" rows="2" class="form-textarea" placeholder="Descripción de los combos, descuentos o estuches...">${banner.subtitle || ''}</textarea>
          </div>
        </div>

        <!-- Imagen opcional de fondo para el banner -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--admin-border); border-radius: 10px; padding: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <label class="form-label" style="margin-bottom: 0; color: var(--gold-light);">Imagen de Fondo del Banner (Opcional)</label>
            ${banner.image ? `<button type="button" id="custClearBannerImgBtn" style="font-size: 0.72rem; color: #ff6b6b;">Quitar imagen</button>` : ''}
          </div>
          <div id="custBannerDropzone" class="admin-image-dropzone compact-dropzone">
            <input type="file" id="custBannerFileInput" accept="image/*" hidden />
            <div class="dropzone-title" style="font-size: 0.78rem;">Arrastrá una foto horizontal o <span>hacé clic para subir desde tu dispositivo</span></div>
            <div class="dropzone-sub" style="font-size: 0.68rem;">Si no subís imagen, se usa el diseño artístico de la festividad activa.</div>
          </div>
          ${banner.image ? `
            <div style="margin-top: 0.65rem;">
              <img src="${banner.image}" alt="Banner Preview" style="width: 100%; height: 95px; object-fit: cover; border-radius: 8px; border: 1px solid var(--gold-primary);" />
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Promos Rápidas Vinculadas a la Festividad -->
      <div style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--admin-border);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem;">
          <div>
            <h4 style="color: #fff; font-size: 0.95rem;">Promociones Activas en la Sección Promos (${promosList.length})</h4>
            <p style="font-size: 0.75rem; color: #888;">Podés crear una nueva promo festiva o editar las existentes para que aparezcan destacadas en la web principal.</p>
          </div>
          <button type="button" id="custCreateFestivePromoBtn" class="btn-primary" style="padding: 0.55rem 1.15rem; font-size: 0.78rem;">
            + Armar Nueva Promo de ${activeFest.name}
          </button>
        </div>

        <div class="cust-promos-mini-grid">
          ${promosList.slice(0, 6).map(p => `
            <div class="cust-promo-mini-card">
              <img src="${p.image}" alt="${p.name}" />
              <div class="cust-promo-mini-info">
                <strong>${p.name}</strong>
                <span>${formatCurrency(p.price)} ${p.discount ? `• ${p.discount}% OFF` : ''}</span>
                <small>${p.badge || 'PROMO'}</small>
              </div>
              <button type="button" class="btn-secondary" data-edit-promo-id="${p.id}" style="padding: 0.3rem 0.6rem; font-size: 0.7rem;">Editar</button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- 3. CARRUSEL DE IMÁGENES Y TEXTOS DE LA SECCIÓN INICIO -->
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <h3 class="admin-card-title">3. Imágenes del Carrusel y Textos de Inicio (Portada Principal)</h3>
          <p style="font-size: 0.78rem; color: #999; margin-top: 0.2rem;">
            Cambiá las fotos que rotan en el fondo del Inicio subiendo o arrastrando imágenes desde tu dispositivo, y personalizá el mensaje de bienvenida.
          </p>
        </div>
      </div>

      <!-- Textos de Portada -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
        <div class="form-group">
          <label class="form-label">Etiqueta Superior de Portada</label>
          <input type="text" id="custHeroTag" class="form-input" value="${cfg.heroTag || ''}" placeholder="Av. Recta Martinolli 8255 • Cava de Selección" />
        </div>
        <div class="form-group">
          <label class="form-label">Título Principal (Línea 1)</label>
          <input type="text" id="custHeroTitle" class="form-input" value="${cfg.heroTitle || ''}" placeholder="Tradición, Linaje &" />
        </div>
        <div class="form-group">
          <label class="form-label">Título Destacado en Dorado (Línea 2)</label>
          <input type="text" id="custHeroHighlight" class="form-input" value="${cfg.heroHighlight || ''}" placeholder="Vinos de Colección" />
        </div>
        <div class="form-group" style="grid-column: 1 / -1;">
          <label class="form-label">Párrafo Descriptivo de Inicio</label>
          <textarea id="custHeroDesc" rows="2" class="form-textarea">${cfg.heroDescription || ''}</textarea>
        </div>
      </div>

      <!-- Subir nueva imagen al Carrusel -->
      <div style="margin-bottom: 1.5rem;">
        <label class="form-label" style="color: var(--gold-champagne); font-weight: 700;">Agregar Nueva Imagen al Carrusel de Inicio (Desde el dispositivo o arrastrando)</label>
        <div id="custSlideDropzone" class="admin-image-dropzone">
          <input type="file" id="custSlideFileInput" accept="image/*" multiple hidden />
          <div class="dropzone-icon-circle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </div>
          <div class="dropzone-title">Arrastrá una o más fotos horizontales acá o <span>hacé clic para seleccionar desde tu dispositivo</span></div>
          <div class="dropzone-sub">Se optimizan automáticamente en alta definición panorámica (16:9 WebP) para el carrusel de Inicio</div>
        </div>
      </div>

      <!-- Grilla de Diapositivas Actuales -->
      <div>
        <label class="form-label">Imágenes Actuales en el Carrusel (${(cfg.heroSlides || []).length})</label>
        <div class="cust-slides-grid">
          ${(cfg.heroSlides || []).map((slide, idx) => `
            <div class="cust-slide-card">
              <div class="cust-slide-img-wrap">
                <img src="${slide.image}" alt="${slide.label || `Slide ${idx + 1}`}" />
                <span class="cust-slide-order-badge">#${idx + 1}</span>
              </div>
              <div class="cust-slide-body">
                <input type="text" class="form-input cust-slide-label-input" data-slide-idx="${idx}" value="${slide.label || `Imagen ${idx + 1}`}" placeholder="Título de la foto..." style="font-size: 0.78rem; padding: 0.45rem 0.65rem;" />
                <div class="cust-slide-actions">
                  <label class="btn-secondary cust-replace-slide-btn" style="padding: 0.32rem 0.65rem; font-size: 0.72rem; cursor: pointer;">
                    Cambiar foto
                    <input type="file" accept="image/*" data-replace-slide="${idx}" hidden />
                  </label>
                  <button type="button" class="cust-del-slide-btn" data-del-slide="${idx}" ${(cfg.heroSlides || []).length <= 1 ? 'disabled title="Debe haber al menos 1 imagen"' : ''}>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Sync current form inputs into adminState.siteConfig before re-rendering
  const syncFormToState = () => {
    cfg.heroTag = document.getElementById('custHeroTag')?.value || cfg.heroTag;
    cfg.heroTitle = document.getElementById('custHeroTitle')?.value || cfg.heroTitle;
    cfg.heroHighlight = document.getElementById('custHeroHighlight')?.value || cfg.heroHighlight;
    cfg.heroDescription = document.getElementById('custHeroDesc')?.value || cfg.heroDescription;
    cfg.banner = {
      ...cfg.banner,
      enabled: Boolean(document.getElementById('custBannerEnabled')?.checked),
      badge: document.getElementById('custBannerBadge')?.value || '',
      title: document.getElementById('custBannerTitle')?.value || '',
      subtitle: document.getElementById('custBannerSubtitle')?.value || '',
      ctaText: document.getElementById('custBannerCtaText')?.value || 'Ver Promociones'
    };
    container.querySelectorAll('.cust-slide-label-input').forEach(inp => {
      const i = Number(inp.getAttribute('data-slide-idx'));
      if (cfg.heroSlides[i]) cfg.heroSlides[i].label = inp.value;
    });
  };

  // 1. Select Festivity card
  container.querySelectorAll('.festivity-theme-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.fest-apply-preset-btn')) return;
      syncFormToState();
      const festId = card.getAttribute('data-fest-id');
      cfg.activeFestivity = festId;
      const chosen = FESTIVITIES_CATALOG[festId];
      if (chosen && festId !== 'clasico' && (!cfg.banner.title || cfg.banner.title === 'Celebrá con Etiquetas Seleccionadas' || cfg.banner.title === 'Grandes Vinos & Partidas Limitadas')) {
        cfg.banner = {
          ...cfg.banner,
          ...chosen.defaultBanner
        };
      }
      renderCustomization(container);
    });
  });

  // Load suggested banner preset for a festivity
  container.querySelectorAll('.fest-apply-preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      syncFormToState();
      const festId = btn.getAttribute('data-preset-fest');
      const chosen = FESTIVITIES_CATALOG[festId];
      if (chosen) {
        cfg.activeFestivity = festId;
        cfg.banner = {
          ...cfg.banner,
          ...chosen.defaultBanner
        };
        renderCustomization(container);
      }
    });
  });

  // Banner toggle switch
  document.getElementById('custBannerEnabled')?.addEventListener('change', () => {
    syncFormToState();
    renderCustomization(container);
  });

  // Banner background image upload / drag-and-drop
  const bannerDrop = document.getElementById('custBannerDropzone');
  const bannerFileInp = document.getElementById('custBannerFileInput');
  if (bannerDrop && bannerFileInp) {
    bannerDrop.addEventListener('click', () => bannerFileInp.click());
    bannerDrop.addEventListener('dragover', (e) => { e.preventDefault(); bannerDrop.classList.add('dragover'); });
    bannerDrop.addEventListener('dragleave', () => bannerDrop.classList.remove('dragover'));
    bannerDrop.addEventListener('drop', async (e) => {
      e.preventDefault();
      bannerDrop.classList.remove('dragover');
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        syncFormToState();
        cfg.banner.image = await standardizeWideImage(file, 1600, 700);
        renderCustomization(container);
      }
    });
    bannerFileInp.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        syncFormToState();
        cfg.banner.image = await standardizeWideImage(file, 1600, 700);
        renderCustomization(container);
      }
    });
  }

  document.getElementById('custClearBannerImgBtn')?.addEventListener('click', () => {
    syncFormToState();
    cfg.banner.image = '';
    renderCustomization(container);
  });

  // Create Festive Promo button
  document.getElementById('custCreateFestivePromoBtn')?.addEventListener('click', () => {
    syncFormToState();
    openProductFormModal({
      name: `Combo Especial ${activeFest.name}`,
      category: 'promos',
      subcategory: 'Combos Degustación',
      bodega: 'Selección La Recta',
      price: 45000,
      originalPrice: 54000,
      discount: 17,
      stock: 12,
      minStock: 3,
      stockMode: 'caja',
      unitsPerBox: 6,
      boxesCount: 2,
      badge: `${activeFest.emoji} PROMO ${activeFest.name.toUpperCase()}`,
      image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&h=1000&q=85&fm=webp',
      description: `Selección especial armada para celebrar ${activeFest.name} con etiquetas de nuestra cava.`,
      isFeatured: true,
      _isNewPreset: true
    });
  });

  container.querySelectorAll('[data-edit-promo-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-edit-promo-id');
      const prod = adminState.products.find(p => p.id === id);
      if (prod) openProductFormModal(prod);
    });
  });

  // Upload new carousel slides (drag & drop or click)
  const slideDrop = document.getElementById('custSlideDropzone');
  const slideFileInp = document.getElementById('custSlideFileInput');
  const handleNewSlideFiles = async (fileList) => {
    if (!fileList || !fileList.length) return;
    syncFormToState();
    for (const file of Array.from(fileList)) {
      const dataUrl = await standardizeWideImage(file, 1600, 900);
      cfg.heroSlides.push({
        id: 'slide-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        image: dataUrl,
        label: file.name.replace(/\.[^.]+$/, '')
      });
    }
    renderCustomization(container);
  };

  if (slideDrop && slideFileInp) {
    slideDrop.addEventListener('click', () => slideFileInp.click());
    slideDrop.addEventListener('dragover', (e) => { e.preventDefault(); slideDrop.classList.add('dragover'); });
    slideDrop.addEventListener('dragleave', () => slideDrop.classList.remove('dragover'));
    slideDrop.addEventListener('drop', (e) => {
      e.preventDefault();
      slideDrop.classList.remove('dragover');
      handleNewSlideFiles(e.dataTransfer?.files);
    });
    slideFileInp.addEventListener('change', (e) => handleNewSlideFiles(e.target.files));
  }

  // Replace existing slide photo
  container.querySelectorAll('[data-replace-slide]').forEach(inp => {
    inp.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      const idx = Number(inp.getAttribute('data-replace-slide'));
      if (file && cfg.heroSlides[idx]) {
        syncFormToState();
        cfg.heroSlides[idx].image = await standardizeWideImage(file, 1600, 900);
        renderCustomization(container);
      }
    });
  });

  // Delete slide
  container.querySelectorAll('[data-del-slide]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (cfg.heroSlides.length <= 1) return;
      syncFormToState();
      const idx = Number(btn.getAttribute('data-del-slide'));
      cfg.heroSlides.splice(idx, 1);
      renderCustomization(container);
    });
  });

  // Save Site Config to Backend
  document.getElementById('saveSiteConfigBtn')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    syncFormToState();
    btn.disabled = true;
    btn.textContent = 'Guardando cambios...';
    try {
      const saved = await api.updateSiteConfig(cfg);
      adminState.siteConfig = saved;
      btn.textContent = '✓ ¡Guardado y Publicado!';
      setTimeout(() => {
        if (btn) {
          btn.disabled = false;
          btn.textContent = '💾 Guardar y Publicar en la Web';
        }
      }, 2000);
    } catch (err) {
      alert('Error al guardar la configuración: ' + err.message);
      btn.disabled = false;
      btn.textContent = '💾 Guardar y Publicar en la Web';
    }
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
                act.action === 'SITE_CUSTOMIZATION' ? '🎨' :
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

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&h=1000&q=85&fm=webp';

// Normaliza cualquier imagen subida a 800x1000 (4:5) en formato WebP con calidad 85%
function standardizeProductImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen inválido.'));
      img.onload = () => {
        const targetW = 800;
        const targetH = 1000;
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#11100f';
        ctx.fillRect(0, 0, targetW, targetH);

        const srcRatio = img.width / img.height;
        const dstRatio = targetW / targetH;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (srcRatio > dstRatio) {
          sw = img.height * dstRatio;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / dstRatio;
          sy = (img.height - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
        const standardizedDataUrl = canvas.toDataURL('image/webp', 0.85);
        resolve(standardizedDataUrl);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function updateSubcatDatalist(cat) {
  const dl = document.getElementById('pSubcatDatalist');
  if (!dl) return;
  const list = ADMIN_SUBCATS[cat] || [];
  dl.innerHTML = list.map(s => '<option value="' + s + '"></option>').join('');
}

// Actualiza el resumen bidireccional de Stock (Unidades <-> Cajas)
function updateStockConversionSummary(sourceField = 'units') {
  const modeInput = document.getElementById('pFormStockMode');
  const upbInput = document.getElementById('pFormUnitsPerBox');
  const boxesInput = document.getElementById('pFormBoxesCount');
  const stockInput = document.getElementById('pFormStock');
  const summaryEl = document.getElementById('pStockConversionSummary');
  if (!upbInput || !boxesInput || !stockInput || !summaryEl) return;

  const upb = Math.max(1, Number(upbInput.value) || 6);

  if (sourceField === 'boxes') {
    const boxesVal = Math.max(0, Number(boxesInput.value) || 0);
    const calculatedUnits = Math.round(boxesVal * upb);
    stockInput.value = calculatedUnits;
  } else if (sourceField === 'units') {
    const unitsVal = Math.max(0, Number(stockInput.value) || 0);
    const calculatedBoxes = Number((unitsVal / upb).toFixed(2));
    boxesInput.value = calculatedBoxes;
  } else if (sourceField === 'upb') {
    const currentMode = modeInput?.value || 'unidad';
    if (currentMode === 'caja') {
      const boxesVal = Math.max(0, Number(boxesInput.value) || 0);
      stockInput.value = Math.round(boxesVal * upb);
    } else {
      const unitsVal = Math.max(0, Number(stockInput.value) || 0);
      boxesInput.value = Number((unitsVal / upb).toFixed(2));
    }
  }

  const totalUnits = Math.max(0, Number(stockInput.value) || 0);
  const fullBoxes = Math.floor(totalUnits / upb);
  const looseUnits = totalUnits % upb;

  if (looseUnits === 0) {
    summaryEl.innerHTML = `📦 Equivalencia automática: <strong>${fullBoxes} ${fullBoxes === 1 ? 'caja' : 'cajas'}</strong> × <strong>${upb} un./caja</strong> = <strong>${totalUnits} unidades totales</strong> en stock`;
  } else {
    summaryEl.innerHTML = `📦 Equivalencia automática: <strong>${totalUnits} unidades</strong> = <strong>${fullBoxes} ${fullBoxes === 1 ? 'caja completa' : 'cajas completas'}</strong> (de ${upb} un.) + <strong>${looseUnits} ${looseUnits === 1 ? 'unidad suelta' : 'unidades sueltas'}</strong>`;
  }
}

function setStockEntryMode(mode) {
  const modeInput = document.getElementById('pFormStockMode');
  const unitBtn = document.getElementById('stockModeUnitBtn');
  const boxBtn = document.getElementById('stockModeBoxBtn');
  if (modeInput) modeInput.value = mode;
  if (unitBtn) unitBtn.classList.toggle('active', mode === 'unidad');
  if (boxBtn) boxBtn.classList.toggle('active', mode === 'caja');
}

function openProductFormModal(product = null) {
  const isNewPreset = Boolean(product && product._isNewPreset);
  adminState.editingProduct = isNewPreset ? null : product;
  const modal = document.getElementById('adminProductModal');
  const titleEl = document.getElementById('adminProductModalTitle');
  const form = document.getElementById('adminProductForm');
  if (!modal || !form) return;

  if (titleEl) {
    titleEl.textContent = adminState.editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto';
  }

  document.getElementById('pFormName').value = product?.name || '';
  const initialCat = product?.category || 'vinos';
  document.getElementById('pFormCategory').value = initialCat;
  updateSubcatDatalist(initialCat);
  document.getElementById('pFormCategory').onchange = (e) => {
    updateSubcatDatalist(e.target.value);
  };
  document.getElementById('pFormSubcategory').value = product?.subcategory || '';
  document.getElementById('pFormBodega').value = product?.bodega || '';
  document.getElementById('pFormPrice').value = product?.price || '';
  document.getElementById('pFormOriginalPrice').value = product?.originalPrice || '';
  document.getElementById('pFormDiscount').value = product?.discount || 0;

  // Stock Bidireccional
  const initialUpb = product?.unitsPerBox || 6;
  const initialStock = product ? product.stock : 12;
  const initialMode = product?.stockMode || 'unidad';
  document.getElementById('pFormUnitsPerBox').value = initialUpb;
  document.getElementById('pFormStock').value = initialStock;
  document.getElementById('pFormBoxesCount').value = Number((initialStock / initialUpb).toFixed(2));
  setStockEntryMode(initialMode);
  updateStockConversionSummary('units');

  document.getElementById('pFormMinStock').value = product ? (product.minStock || 3) : 3;
  document.getElementById('pFormBadge').value = product?.badge || '';

  const defaultImg = product?.image || DEFAULT_FALLBACK_IMAGE;
  document.getElementById('pFormImage').value = defaultImg;
  const previewEl = document.getElementById('pFormImagePreview');
  if (previewEl) previewEl.src = defaultImg;
  const fileInput = document.getElementById('pFormImageFile');
  if (fileInput) fileInput.value = '';
  const statusText = document.getElementById('pDropzoneStatusText');
  if (statusText) {
    statusText.textContent = product?.image
      ? 'Imagen actual cargada • Arrastrá o hacé clic para reemplazarla desde tu dispositivo'
      : 'Formatos aceptados: JPG, PNG, WebP • Se optimiza automáticamente a proporción 4:5 (800×1000)';
  }

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

  // Stock Bidirectional Calculators
  document.getElementById('stockModeUnitBtn')?.addEventListener('click', () => {
    setStockEntryMode('unidad');
    document.getElementById('pFormStock')?.focus();
  });

  document.getElementById('stockModeBoxBtn')?.addEventListener('click', () => {
    setStockEntryMode('caja');
    document.getElementById('pFormBoxesCount')?.focus();
  });

  document.getElementById('pFormUnitsPerBox')?.addEventListener('input', () => {
    updateStockConversionSummary('upb');
  });

  document.getElementById('pFormBoxesCount')?.addEventListener('input', () => {
    setStockEntryMode('caja');
    updateStockConversionSummary('boxes');
  });

  document.getElementById('pFormStock')?.addEventListener('input', () => {
    setStockEntryMode('unidad');
    updateStockConversionSummary('units');
  });

  // Product Image Dropzone (Click or Drag & Drop from device only)
  const dropzone = document.getElementById('pImageDropzone');
  const imgFileInput = document.getElementById('pFormImageFile');
  const imgHiddenInput = document.getElementById('pFormImage');
  const imgPreview = document.getElementById('pFormImagePreview');
  const dropStatus = document.getElementById('pDropzoneStatusText');

  const processSelectedProductImage = async (file) => {
    if (!file) return;
    try {
      if (dropStatus) dropStatus.textContent = 'Optimizando imagen a 800×1000 WebP...';
      const standardizedDataUrl = await standardizeProductImage(file);
      if (imgHiddenInput) imgHiddenInput.value = standardizedDataUrl;
      if (imgPreview) imgPreview.src = standardizedDataUrl;
      if (dropStatus) dropStatus.textContent = `✓ Imagen "${file.name}" cargada y estandarizada (800×1000 WebP)`;
    } catch (err) {
      alert('Error al procesar la imagen: ' + err.message);
    }
  };

  if (dropzone && imgFileInput) {
    dropzone.addEventListener('click', () => imgFileInput.click());
    dropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        imgFileInput.click();
      }
    });
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      const file = e.dataTransfer?.files?.[0];
      if (file) processSelectedProductImage(file);
    });
  }

  imgFileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) processSelectedProductImage(file);
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
      stockMode: document.getElementById('pFormStockMode')?.value || 'unidad',
      unitsPerBox: Number(document.getElementById('pFormUnitsPerBox')?.value) || 6,
      boxesCount: Number(document.getElementById('pFormBoxesCount')?.value) || 0,
      badge: document.getElementById('pFormBadge').value || null,
      image: document.getElementById('pFormImage').value || DEFAULT_FALLBACK_IMAGE,
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
