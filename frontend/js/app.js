import { api } from './api.js';
import { cart, FREE_SHIPPING_THRESHOLD } from './cart.js';
import { auth } from './auth.js';
import { applySiteCustomization } from './festivities.js';

// Application state
const state = {
  products: [],
  filteredProducts: [],
  activeCategory: 'todos',
  searchQuery: '',
  selectedProduct: null,
  selectedPaymentMethod: 'Transferencia Bancaria (10% OFF)'
};

// Utilities
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(amount);
};

const showToast = (message) => {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c5a059" stroke-width="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

// ================= RENDER FUNCTIONS =================

function renderPreventaCategories() {
  const grid = document.getElementById('preventaCategoriesGrid');
  if (!grid) return;

  const categories = [
    {
      id: 'espumantes',
      title: 'Espumantes y Sidras',
      tag: 'Cuvées, Método Tradicional & Sidras',
      desc: 'Selección de espumantes, método Champenoise, Nature y sidras artesanales prémium.',
      iconSvg: `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M7 21h10m-5-3v3m-3-9a3 3 0 0 1 6 0v2a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2v-2z"></path>
          <circle cx="12" cy="5" r="1"></circle>
          <circle cx="10" cy="8" r="1"></circle>
          <circle cx="14" cy="7" r="1"></circle>
        </svg>
      `
    },
    {
      id: 'vinos',
      title: 'Vinos',
      tag: 'Grandes Malbecs, Cabernet & Cortes',
      desc: 'Añadas de guarda, partidas limitadas de autor y cosechas destacadas de las mejores bodegas.',
      iconSvg: `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 22h8m-4-4v4m-5-8a5 5 0 0 1 10 0v1a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-1z"></path>
          <line x1="12" y1="2" x2="12" y2="4"></line>
        </svg>
      `
    },
    {
      id: 'aperitivos',
      title: 'Aperitivos',
      tag: 'Gins, Vermuts & Botánicos',
      desc: 'Botánicos de alta gama, vermuts artesanales, aperitivos clásicos y destilados finos.',
      iconSvg: `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L3 8l9 6 9-6-9-6z"></path>
          <path d="M3 8v10l9 5 9-5V8"></path>
        </svg>
      `
    }
  ];

  grid.innerHTML = categories.map(cat => {
    const count = state.products.filter(p => p.category === cat.id).length;
    return `
      <article class="preventa-card" data-category="${cat.id}" role="button" tabindex="0" title="Ver directamente los productos de ${cat.title}">
        <div class="preventa-card-badge">PRE-VENTA</div>
        <div class="preventa-icon-wrap">${cat.iconSvg}</div>
        <div class="preventa-card-info">
          <span class="preventa-card-tag">${cat.tag}</span>
          <h3 class="preventa-card-title">${cat.title}</h3>
          <p class="preventa-card-desc">${cat.desc}</p>
        </div>
        <div class="preventa-card-footer">
          <span class="preventa-count">${count > 0 ? `${count} productos disponibles` : 'Ver colección'}</span>
          <span class="preventa-link">
            Ver Productos
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </span>
        </div>
      </article>
    `;
  }).join('');

  grid.querySelectorAll('.preventa-card').forEach(card => {
    const handleSelect = () => {
      const catId = card.getAttribute('data-category');
      selectPreventaCategory(catId, true);
    };
    card.addEventListener('click', handleSelect);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSelect();
      }
    });
  });

  // Pills de filtro directo debajo de las 3 cards
  document.querySelectorAll('.preventa-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const catId = btn.getAttribute('data-category');
      selectPreventaCategory(catId, true);
    });
  });
}

const PREVENTA_TITLES = {
  todos: {
    tag: 'Colección Completa de Cava • Pre-venta',
    title: 'Todos los Productos de Colección (12)'
  },
  espumantes: {
    tag: 'Burbujas Finas, Cuvées & Sidras',
    title: 'Espumantes y Sidras de Colección (4)'
  },
  vinos: {
    tag: 'Añadas Históricas & Terroirs de Autor',
    title: 'Vinos de Autor & Colección (4)'
  },
  aperitivos: {
    tag: 'Botánicos Nobles & Coctelería Fina',
    title: 'Aperitivos, Gins & Vermuts Finos (4)'
  }
};

let activePreventaCategory = 'todos';

function selectPreventaCategory(catId, shouldScroll = false) {
  if (!catId) catId = 'todos';
  activePreventaCategory = catId;

  // Actualizar tarjetas superiores
  document.querySelectorAll('.preventa-card').forEach(card => {
    if (card.getAttribute('data-category') === catId) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });

  // Actualizar pills de filtro
  document.querySelectorAll('.preventa-pill-btn').forEach(btn => {
    if (btn.getAttribute('data-category') === catId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Actualizar títulos
  const info = PREVENTA_TITLES[catId] || PREVENTA_TITLES.vinos;
  const tagEl = document.getElementById('preventaSelectedTag');
  const titleEl = document.getElementById('preventaSelectedTitle');
  if (tagEl) tagEl.textContent = info.tag;
  if (titleEl) titleEl.textContent = info.title;

  // Renderizar la grilla de productos
  renderPreventaProductsGrid(catId);

  // Scroll directo a los productos si el usuario hizo clic
  if (shouldScroll) {
    const wrapper = document.getElementById('preventaProductsWrapper');
    if (wrapper) {
      wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

function renderPreventaProductsGrid(catId) {
  const grid = document.getElementById('preventaProductsGrid');
  if (!grid) return;

  const prods = (!catId || catId === 'todos') ? state.products : state.products.filter(p => p.category === catId);

  if (prods.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted); background: var(--bg-surface); border: 1px solid var(--gold-border); border-radius: 12px;">
        <h4 style="color: #fff; font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 0.5rem;">Cargando partidas de cava...</h4>
      </div>
    `;
    return;
  }

  grid.innerHTML = prods.map(product => {
    const isOutOfStock = product.stock <= 0;
    const isLowStock = product.stock > 0 && product.stock <= (product.minStock || 3);
    const discountPercent = product.originalPrice && product.price < product.originalPrice
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

    return `
      <article class="product-card" data-id="${product.id}" title="Hacer clic para ver ficha técnica y descripción de ${product.name}">
        <div class="card-img-wrap">
          ${discountPercent ? `<span class="card-badge promo">-${discountPercent}% OFF</span>` : (product.badge ? `<span class="card-badge">${product.badge}</span>` : '')}
          <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&h=1000&q=85&fm=webp';" />
          <button class="card-quick-view-btn" data-action="quickview" data-id="${product.id}">Ver Ficha Técnica</button>
        </div>
        <div class="card-body">
          <span class="card-bodega">${product.bodega ? product.bodega + ' • ' : ''}${product.subcategory || product.category.toUpperCase()}</span>
          <h3 class="card-title">${product.name}</h3>
          
          <div class="card-pricing">
            <div class="card-price-row">
              <span class="card-current-price">${formatCurrency(product.price)}</span>
              ${product.originalPrice ? `<span class="card-original-price">${formatCurrency(product.originalPrice)}</span>` : ''}
            </div>
          </div>

          <button class="card-add-btn" data-action="add-cart" data-id="${product.id}" ${isOutOfStock ? 'disabled' : ''}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            ${isOutOfStock ? 'Partida Agotada' : 'Agregar al Carrito'}
          </button>
        </div>
      </article>
    `;
}).join('');

  // Eventos de botones de cada card
  grid.querySelectorAll('[data-action="add-cart"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const prod = state.products.find(p => p.id === id);
      if (prod) {
        cart.addItem(prod, 1);
        openCartDrawer();
        showToast(`"${prod.name}" agregado a tu carrito.`);
      }
    });
  });

  grid.querySelectorAll('[data-action="quickview"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const prod = state.products.find(p => p.id === id);
      if (prod) openProductModal(prod);
    });
  });

  // Clic en la card completa para ver descripción más detallada
  grid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="add-cart"]')) return;
      const id = card.getAttribute('data-id');
      const prod = state.products.find(p => p.id === id);
      if (prod) openProductModal(prod);
    });
  });
}

function renderCategories() {
  renderPreventaCategories();
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  if (state.filteredProducts.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 5rem 1rem; color: var(--text-muted); background: var(--bg-surface); border: 1px solid var(--gold-border); border-radius: 8px;">
        <h3 style="font-family: var(--font-serif); font-size: 1.8rem; color: #fff; margin-bottom: 0.5rem;">No se encontraron etiquetas disponibles</h3>
        <p style="font-size: 1rem; margin-bottom: 1.5rem;">No hay productos que coincidan con el término de búsqueda ingresado.</p>
        <button id="resetFiltersBtn" class="btn-secondary">Restablecer y Ver Todo el Catálogo</button>
      </div>
    `;
    document.getElementById('resetFiltersBtn')?.addEventListener('click', () => {
      setFilterCategory('todos');
    });
    return;
  }

  grid.innerHTML = state.filteredProducts.map(product => {
    const isOutOfStock = product.stock <= 0;
    const isLowStock = product.stock > 0 && product.stock <= (product.minStock || 3);
    const discountPercent = product.originalPrice && product.price < product.originalPrice
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

    return `
      <article class="product-card" data-id="${product.id}" title="Hacer clic para ver ficha técnica y descripción de ${product.name}">
        <div class="card-img-wrap">
          ${discountPercent ? `<span class="card-badge promo">-${discountPercent}% OFF</span>` : (product.badge ? `<span class="card-badge">${product.badge}</span>` : '')}
          <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&h=1000&q=85&fm=webp';" />
          <button class="card-quick-view-btn" data-action="quickview" data-id="${product.id}">Ver Ficha Técnica</button>
        </div>
        <div class="card-body">
          <span class="card-bodega">${product.bodega ? product.bodega + ' • ' : ''}${product.subcategory || product.category.toUpperCase()}</span>
          <h3 class="card-title">${product.name}</h3>
          
          <div class="card-pricing">
            <div class="card-price-row">
              <span class="card-current-price">${formatCurrency(product.price)}</span>
              ${product.originalPrice ? `<span class="card-original-price">${formatCurrency(product.originalPrice)}</span>` : ''}
            </div>
          </div>

          <button class="card-add-btn" data-action="add-cart" data-id="${product.id}" ${isOutOfStock ? 'disabled' : ''}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            ${isOutOfStock ? 'Partida Agotada' : 'Agregar al Carrito'}
          </button>
        </div>
      </article>
    `;
}).join('');

  // Attach card event listeners
  grid.querySelectorAll('[data-action="add-cart"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const prod = state.products.find(p => p.id === id);
      if (prod) {
        cart.addItem(prod, 1);
        showToast(`Se ha incorporado "${prod.name}" a su selección de cava.`);
      }
    });
  });

  grid.querySelectorAll('[data-action="quickview"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const prod = state.products.find(p => p.id === id);
      if (prod) openProductModal(prod);
    });
  });
}

function setFilterCategory(category) {
  state.activeCategory = category;

  document.querySelectorAll('.filter-pill').forEach(pill => {
    if (pill.getAttribute('data-filter') === category) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  applyFilters();
}

function applyFilters() {
  let list = [...state.products];

  if (state.activeCategory !== 'todos') {
    list = list.filter(p => p.category.toLowerCase() === state.activeCategory.toLowerCase());
  }

  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase().trim();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.bodega && p.bodega.toLowerCase().includes(q)) ||
      (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q)
    );
  }

  state.filteredProducts = list;
  renderProducts();
}

// ================= CART DRAWER =================

function updateCartDrawerUI(detail) {
  // Update badges
  const navBadge = document.getElementById('navCartCount');
  const floatBadge = document.getElementById('floatingCartCount');
  if (navBadge) navBadge.textContent = detail.count;
  if (floatBadge) floatBadge.textContent = detail.count;
  const headerPill = document.getElementById('cartDrawerCountPill');
  if (headerPill) {
    const totalBottles = detail.count || 0;
    const totalLabels = detail.items ? detail.items.length : 0;
    headerPill.textContent = totalBottles > 0 ? `${totalBottles} ${totalBottles === 1 ? 'unidad' : 'unidades'} • ${totalLabels} ${totalLabels === 1 ? 'etiqueta' : 'etiquetas'}` : '0 productos';
  }
  const clearAllBtn = document.getElementById('cartClearAllBtn');
  if (clearAllBtn) {
    clearAllBtn.style.display = detail.items && detail.items.length > 0 ? 'inline-flex' : 'none';
    clearAllBtn.onclick = () => cart.clear();
  }

  // Drawer elements
  const drawerItems = document.getElementById('cartDrawerItems');
  const drawerFooter = document.getElementById('cartDrawerFooter');
  const subtotalEl = document.getElementById('cartDrawerSubtotal');
  const transferEl = document.getElementById('cartDrawerTransfer');
  const totalEl = document.getElementById('cartDrawerTotal');
  const cuotasEl = document.getElementById('cartDrawerCuotas');
  const shippingFill = document.getElementById('shippingProgressFill');
  const shippingText = document.getElementById('shippingNoticeText');

  // Aviso de retiro en local
  if (shippingFill) shippingFill.style.display = 'none';
  if (shippingText) {
    shippingText.innerHTML = `🏬 Retiro exclusivo en el local: <strong>Av. Recta Martinolli 8255</strong>`;
    shippingText.style.color = 'var(--gold-champagne)';
  }

  if (detail.items.length === 0) {
    if (drawerItems) {
      drawerItems.innerHTML = `
        <div class="cart-empty-message">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" style="margin-bottom: 1.25rem; color: var(--gold-primary); opacity: 0.6;">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <h4 style="font-family: var(--font-serif); font-size: 1.4rem; color: #fff; margin-bottom: 0.5rem;">Su selección se encuentra vacía</h4>
          <p style="font-size: 0.95rem; line-height: 1.6;">Recorra nuestra cava y elija sus etiquetas preferidas para conformar su pedido.</p>
          <button id="cartExploreBtn" class="btn-secondary" style="margin-top: 1.5rem; font-size: 0.84rem; padding: 0.8rem 1.5rem;">Explorar Cava Principal</button>
        </div>
      `;
      document.getElementById('cartExploreBtn')?.addEventListener('click', () => {
        closeCartDrawer();
        window.location.href = '/productos.html';
      });
    }
    if (drawerFooter) drawerFooter.style.display = 'none';
    return;
  }

  if (drawerFooter) drawerFooter.style.display = 'block';

  if (drawerItems) {
    drawerItems.innerHTML = detail.items.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img" />
        <div class="cart-item-info">
          <span class="cart-item-bodega">${item.bodega || ''}</span>
          <h4 class="cart-item-title">${item.name}</h4>
          <div class="cart-item-pricing-row">
            <span class="cart-item-unit-price">${formatCurrency(item.price)} c/u × ${item.quantity}</span>
            <span class="cart-item-price">${formatCurrency(item.price * item.quantity)}</span>
          </div>
          <div class="cart-item-controls">
            <div class="qty-stepper">
              <button class="qty-btn" data-action="dec" data-id="${item.id}">-</button>
              <span class="qty-val">${item.quantity}</span>
              <button class="qty-btn" data-action="inc" data-id="${item.id}">+</button>
            </div>
            <button class="cart-item-remove-btn" data-action="remove" data-id="${item.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Quitar
            </button>
          </div>
        </div>
      </div>
    `).join('');

    drawerItems.querySelectorAll('[data-action="inc"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const itm = cart.items.find(i => i.id === id);
        if (itm) cart.updateQuantity(id, itm.quantity + 1);
      });
    });

    drawerItems.querySelectorAll('[data-action="dec"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const itm = cart.items.find(i => i.id === id);
        if (itm) cart.updateQuantity(id, itm.quantity - 1);
      });
    });

    drawerItems.querySelectorAll('[data-action="remove"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        cart.removeItem(id);
      });
    });
  }

  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
  if (transferEl) transferEl.textContent = formatCurrency(cart.getTransferTotal());
  if (totalEl) totalEl.textContent = formatCurrency(subtotal);
  if (cuotasEl) cuotasEl.textContent = `o 3 pagos fijos sin interés de ${formatCurrency(cart.getCuotasAmount())}`;

  const wspBtn = document.getElementById('cartDrawerWspBtn');
  if (wspBtn) {
    wspBtn.href = cart.getWhatsAppOrderUrl(auth.getUser());
  }
}

function openCartDrawer() {
  updateCartDrawerUI({
    items: cart.items,
    count: cart.getCount(),
    subtotal: cart.getSubtotal()
  });
  document.getElementById('cartDrawerOverlay')?.classList.add('active');
}

function closeCartDrawer() {
  document.getElementById('cartDrawerOverlay')?.classList.remove('active');
}


// ================= PRODUCT QUICK VIEW MODAL =================

function openProductModal(product) {
  state.selectedProduct = product;
  const modal = document.getElementById('productDetailModal');
  const body = document.getElementById('productModalBody');
  if (!modal || !body) return;

  const isOutOfStock = product.stock <= 0;
  const whatsappUrl = `https://wa.me/5493512460017?text=${encodeURIComponent('Hola Vinoteca La Recta! Quisiera consultar disponibilidad para retirar ' + product.name + ' con pago en efectivo/transferencia.')}`;

  const images = (Array.isArray(product.images) && product.images.length > 0)
    ? product.images
    : [product.image];

  body.innerHTML = `
    <div class="product-modal-grid">
      <div class="product-modal-media-wrap">
        <img id="modalProductMainImg" src="${images[0]}" alt="${product.name}" class="product-modal-img" />
        ${images.length > 1 ? `
          <div class="modal-thumbs-row">
            ${images.map((imgUrl, i) => `
              <button type="button" class="modal-thumb-btn ${i === 0 ? 'active' : ''}" data-src="${imgUrl}" aria-label="Ver foto ${i + 1}">
                <img src="${imgUrl}" alt="Miniatura ${i + 1}" />
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
      <div class="product-modal-details">
        <span class="card-bodega">${product.bodega ? product.bodega + ' • ' : ''}${product.category.toUpperCase()}${product.subcategory ? ' • ' + product.subcategory : ''}</span>
        <h2 style="font-family: var(--font-serif); font-size: 2.1rem; color: #fff; line-height: 1.15; margin-bottom: 0.75rem;">${product.name}</h2>
        ${product.badge ? `<span class="card-badge promo" style="position: static; display: inline-block; margin-bottom: 0.85rem;">${product.badge}</span>` : ''}
        
        <div style="margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid var(--gold-border);">
          <div style="font-size: 2rem; font-weight: 700; color: #fff; display: flex; align-items: baseline; gap: 0.85rem; flex-wrap: wrap;">
            <span style="color: var(--gold-light);">${formatCurrency(product.price)}</span>
            ${product.originalPrice ? `<span style="font-size: 1.2rem; color: #888; text-decoration: line-through; font-weight: 400;">${formatCurrency(product.originalPrice)}</span>` : ''}
          </div>
        </div>

        <!-- Metodología de Venta & Retiro -->
        <div class="modal-sale-conditions">
          <div class="modal-conditions-title">
            <span>❖</span> Metodología de Venta &amp; Retiro
          </div>
          <ul class="modal-conditions-list">
            <li>
              <span class="cond-icon">💵</span>
              <div><strong>Compra válida solo con pago en efectivo o transferencia</strong></div>
            </li>
            <li>
              <span class="cond-icon">🏬</span>
              <div><strong>Retiro en el local</strong> (Av. Recta Martinolli 8255, Argüello • Córdoba)</div>
            </li>
            <li>
              <span class="cond-icon">💬</span>
              <div><strong>Consulta previa por chat con el local</strong></div>
            </li>
          </ul>
          <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="modal-whatsapp-consult-btn">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824z"/>
            </svg>
            Consultar Disponibilidad por WhatsApp
          </a>
        </div>

        <h4 style="font-family: var(--font-brand); font-size: 0.82rem; color: var(--gold-primary); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 0.4rem;">Descripción Enológica:</h4>
        <p style="font-size: 0.92rem; color: var(--text-muted); line-height: 1.65; margin-bottom: 1.5rem;">
          ${product.description || 'Etiqueta de jerarquía seleccionada rigurosamente por el equipo de Vinoteca La Recta. Conservada en cava para salvaguardar su bouquet y notas originales.'}
        </p>

        <div style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1.25rem;">
          <div class="qty-stepper" style="padding: 0.35rem;">
            <button id="modalQtyDec" class="qty-btn" style="width: 34px; height: 34px; font-size: 1.1rem;">-</button>
            <span id="modalQtyVal" class="qty-val" style="min-width: 40px; font-size: 1rem;">1</span>
            <button id="modalQtyInc" class="qty-btn" style="width: 34px; height: 34px; font-size: 1.1rem;">+</button>
          </div>
          <span style="font-size: 0.82rem; color: var(--text-muted);">
            ${isOutOfStock ? 'Sin existencias en cava' : `${product.stock} unidades disponibles en local`}
          </span>
        </div>

        <button id="modalAddCartBtn" class="btn-primary" style="width: 100%; justify-content: center; font-size: 0.92rem;" ${isOutOfStock ? 'disabled' : ''}>
          ${isOutOfStock ? 'Partida Agotada' : 'Agregar al Carrito'}
        </button>
      </div>
    </div>
  `;

  // Attach thumbnail clicks
  const mainImgEl = document.getElementById('modalProductMainImg');
  const thumbBtns = body.querySelectorAll('.modal-thumb-btn');
  thumbBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      thumbBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const src = btn.getAttribute('data-src');
      if (mainImgEl && src) mainImgEl.src = src;
    });
  });

  let qty = 1;
  const qtyVal = document.getElementById('modalQtyVal');
  document.getElementById('modalQtyInc')?.addEventListener('click', () => {
    if (qty < product.stock) {
      qty++;
      if (qtyVal) qtyVal.textContent = qty;
    }
  });
  document.getElementById('modalQtyDec')?.addEventListener('click', () => {
    if (qty > 1) {
      qty--;
      if (qtyVal) qtyVal.textContent = qty;
    }
  });

  document.getElementById('modalAddCartBtn')?.addEventListener('click', () => {
    cart.addItem(product, qty);
    showToast(`Se incorporaron ${qty} botellas de "${product.name}" a su pedido.`);
    closeProductModal();
  });

  modal.classList.add('active');
}

function closeProductModal() {
  document.getElementById('productDetailModal')?.classList.remove('active');
}

// ================= CHECKOUT MODAL =================

function openCheckoutModal() {
  closeCartDrawer();
  const modal = document.getElementById('checkoutModal');
  if (!modal) return;

  const user = auth.getUser();
  if (user) {
    const nameIn = document.getElementById('checkoutName');
    const emailIn = document.getElementById('checkoutEmail');
    const phoneIn = document.getElementById('checkoutPhone');
    const addressIn = document.getElementById('checkoutAddress');
    if (nameIn) nameIn.value = user.name || '';
    if (emailIn) emailIn.value = user.email || '';
    if (phoneIn && user.phone) phoneIn.value = user.phone;
    if (addressIn && user.address) addressIn.value = user.address;
  }

  updateCheckoutSummary();
  modal.classList.add('active');
}

function closeCheckoutModal() {
  document.getElementById('checkoutModal')?.classList.remove('active');
}

function updateCheckoutSummary() {
  const subtotal = cart.getSubtotal();
  let total = subtotal;
  let discount = 0;

  if (state.selectedPaymentMethod.includes('10% OFF')) {
    discount = Math.round(subtotal * 0.10);
    total = subtotal - discount;
  }

  const subEl = document.getElementById('checkoutSubtotal');
  const discEl = document.getElementById('checkoutDiscount');
  const totEl = document.getElementById('checkoutTotal');
  const itemsCountEl = document.getElementById('checkoutItemsCount');

  if (itemsCountEl) itemsCountEl.textContent = cart.getCount();
  if (subEl) subEl.textContent = formatCurrency(subtotal);
  if (discEl) discEl.textContent = discount > 0 ? `-${formatCurrency(discount)}` : '$0';
  if (totEl) totEl.textContent = formatCurrency(total);
}

// ================= SETUP EVENT LISTENERS =================

function setupEventListeners() {
  // Navigation Links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Filter Pills
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const cat = pill.getAttribute('data-filter');
      setFilterCategory(cat);
    });
  });

  // Search input
  const searchInput = document.getElementById('catalogSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      applyFilters();
    });
  }

  // Cart Drawer triggers
  document.getElementById('navCartBtn')?.addEventListener('click', openCartDrawer);
  document.getElementById('floatingCartBtn')?.addEventListener('click', openCartDrawer);
  document.getElementById('cartCloseBtn')?.addEventListener('click', closeCartDrawer);
  document.getElementById('cartDrawerOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'cartDrawerOverlay') closeCartDrawer();
  });

  // Cart Drawer Checkout Button
  document.getElementById('cartDrawerCheckoutBtn')?.addEventListener('click', openCheckoutModal);
  document.getElementById('cartDrawerWspBtn')?.addEventListener('click', (e) => {
    e.currentTarget.href = cart.getWhatsAppOrderUrl(auth.getUser());
  });

  // Modals Close buttons
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-overlay')?.classList.remove('active');
    });
  });

  // Payment method radio cards
  document.querySelectorAll('.payment-radio-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.payment-radio-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        state.selectedPaymentMethod = radio.value;
        updateCheckoutSummary();
      }
    });
  });

  // Checkout Form Submit
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = checkoutForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Procesando Registro de Pedido...';
      }

      try {
        const subtotal = cart.getSubtotal();
        const isTransfer = state.selectedPaymentMethod.includes('10% OFF');
        const discount = isTransfer ? Math.round(subtotal * 0.10) : 0;
        const total = subtotal - discount;

        const orderData = {
          customer: {
            name: document.getElementById('checkoutName').value,
            email: document.getElementById('checkoutEmail').value,
            phone: document.getElementById('checkoutPhone').value,
            address: document.getElementById('checkoutAddress').value
          },
          items: cart.items.map(i => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity
          })),
          paymentMethod: state.selectedPaymentMethod,
          subtotal,
          discount,
          shippingCost: 0,
          total,
          notes: document.getElementById('checkoutNotes')?.value || ''
        };

        const newOrder = await api.createOrder(orderData);
        cart.clear();
        closeCheckoutModal();

        // Show Success Confirmation Modal with WhatsApp button
        showOrderConfirmationModal(newOrder);
      } catch (err) {
        alert('Ocurrió un error al procesar el pedido: ' + err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Confirmar y Formalizar Pedido';
        }
      }
    });
  }

  // Auth Tabs
  document.getElementById('tabLoginBtn')?.addEventListener('click', () => auth.switchTab('login'));
  document.getElementById('tabRegisterBtn')?.addEventListener('click', () => auth.switchTab('register'));

  // Login form submit
  document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('authError');

    try {
      if (errEl) errEl.textContent = 'Verificando credenciales...';
      const res = await api.login(email, pass);
      auth.setUser(res.user);
      auth.closeModal();
      const isAdmin = auth.isAdmin();
      if (isAdmin) {
        showToast(`¡Bienvenido Administrador ${res.user.name}! Rol asignado: Administrador.`);
      } else {
        showToast(`¡Bienvenido/a ${res.user.name}! Rol asignado: Cliente.`);
      }
    } catch (err) {
      if (errEl) errEl.textContent = err.message;
    }
  });

  // Register form submit
  document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const phone = document.getElementById('regPhone').value;
    const address = document.getElementById('regAddress').value;
    const pass = document.getElementById('regPassword').value;
    const errEl = document.getElementById('authError');

    try {
      if (errEl) errEl.textContent = 'Registrando cuenta...';
      const res = await api.register({ name, email, phone, address, password: pass });
      auth.setUser(res.user);
      auth.closeModal();
      
      const isAdmin = auth.isAdmin();
      if (isAdmin) {
        showToast(`¡Cuenta de Administrador activada! Bienvenido/a ${res.user.name}. Puede abrir el Panel de Administración.`);
      } else {
        showToast(`Cuenta creada exitosamente. Bienvenido/a ${res.user.name}.`);
      }
    } catch (err) {
      if (errEl) errEl.textContent = err.message;
    }
  });

  // Newsletter Form
  document.getElementById('communityNewsletterForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast(`Agradecemos su suscripción al Club de Cava de Vinoteca La Recta.`);
    e.target.reset();
  });

  // Cart update listener
  window.addEventListener('vlr:cart-updated', (e) => {
    updateCartDrawerUI(e.detail);
  });
}

function showOrderConfirmationModal(order) {
  const modal = document.getElementById('orderSuccessModal');
  const detailsEl = document.getElementById('orderSuccessDetails');
  const wspBtn = document.getElementById('orderSuccessWspBtn');
  if (!modal || !detailsEl) return;

  const itemsList = order.items.map(i => `• ${i.quantity}x ${i.name} (${formatCurrency(i.price)})`).join('\n');
  const wspMessage = encodeURIComponent(
    `🍷 *PEDIDO FORMALIZADO EN VINOTECA LA RECTA*\n` +
    `*Número de Pedido:* #${order.id}\n` +
    `*Cliente:* ${order.customer.name}\n` +
    `*Teléfono:* ${order.customer.phone}\n` +
    `*Modalidad:* Retiro en el local (Av. Recta Martinolli 8255)\n` +
    `*Forma de Pago:* ${order.paymentMethod}\n\n` +
    `*Detalle de Botellas:*\n${itemsList}\n\n` +
    `*TOTAL A ABONAR:* ${formatCurrency(order.total)}\n\n` +
    `_Estimados Vinoteca La Recta, confirmo mi pedido para retirar por el local._`
  );

  detailsEl.innerHTML = `
    <div style="text-align: center; margin-bottom: 2rem;">
      <div style="width: 72px; height: 72px; border-radius: 50%; background: rgba(197, 160, 89, 0.12); border: 2px solid var(--gold-primary); display: inline-flex; align-items: center; justify-content: center; color: var(--gold-light); margin-bottom: 1.25rem;">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <h2 style="font-family: var(--font-serif); font-size: 2.2rem; color: #fff; margin-bottom: 0.5rem;">Pedido Registrado con Éxito</h2>
      <span style="font-family: var(--font-brand); font-size: 0.95rem; color: var(--gold-champagne); letter-spacing: 0.15em;">NÚMERO DE ORDEN: #${order.id}</span>
      <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.85rem; line-height: 1.7;">
        Estimado/a <strong>${order.customer.name}</strong>, hemos asentado su pedido. A la brevedad nuestro personal preparará sus botellas para que pueda pasar a retirarlas por nuestro local en <strong>Av. Recta Martinolli 8255</strong>.
      </p>
    </div>

    <div style="background: var(--bg-surface); border: 1px solid var(--gold-border); border-radius: 6px; padding: 1.5rem; margin-bottom: 1.5rem; font-size: 0.9rem;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.6rem; color: var(--text-muted);">
        <span>Modalidad de Pago:</span>
        <strong style="color: #fff;">${order.paymentMethod}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.6rem; color: var(--text-muted);">
        <span>Punto de Retiro:</span>
        <strong style="color: #fff;">Av. Recta Martinolli 8255, Argüello</strong>
      </div>
      <div style="display: flex; justify-content: space-between; padding-top: 0.75rem; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 1.25rem; color: #fff;">
        <strong>Importe Total:</strong>
        <strong style="color: var(--gold-champagne);">${formatCurrency(order.total)}</strong>
      </div>
    </div>
  `;

  if (wspBtn) {
    wspBtn.href = `https://wa.me/5493512460017?text=${wspMessage}`;
  }

  modal.classList.add('active');
}

// ================= HERO CAROUSEL =================
function initHeroCarousel() {
  if (window._vlrCarouselTimer) {
    clearInterval(window._vlrCarouselTimer);
    window._vlrCarouselTimer = null;
  }

  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  if (!slides.length) return;

  let currentIdx = 0;

  function showSlide(index) {
    slides.forEach((s, idx) => {
      if (idx === index) s.classList.add('active');
      else s.classList.remove('active');
    });
    dots.forEach((d, idx) => {
      if (idx === index) d.classList.add('active');
      else d.classList.remove('active');
    });
    currentIdx = index;
  }

  function nextSlide() {
    const nextIdx = (currentIdx + 1) % slides.length;
    showSlide(nextIdx);
  }

  // Auto slide every 5 seconds
  window._vlrCarouselTimer = setInterval(nextSlide, 5000);

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.getAttribute('data-index'), 10);
      if (window._vlrCarouselTimer) clearInterval(window._vlrCarouselTimer);
      showSlide(idx);
      window._vlrCarouselTimer = setInterval(nextSlide, 5000);
    });
  });
}

// ================= PROMOS EN INICIO CON CARRUSEL =================
const promoCarouselTimers = new Map();

function initPromoCarousels() {
  // Limpiar temporizadores anteriores si los hubiera
  promoCarouselTimers.forEach(timer => clearInterval(timer));
  promoCarouselTimers.clear();

  const carousels = document.querySelectorAll('.promo-carousel');
  carousels.forEach(carousel => {
    const promoId = carousel.getAttribute('data-promo-id');
    const slides = carousel.querySelectorAll('.promo-carousel-slide');
    const dots = carousel.querySelectorAll('.promo-carousel-dot');
    const counterEl = carousel.parentElement?.querySelector('.promo-counter-num');
    const prevBtn = carousel.querySelector('[data-action="prev-slide"]');
    const nextBtn = carousel.querySelector('[data-action="next-slide"]');
    if (!slides.length) return;

    let currentIndex = 0;

    function goToSlide(index) {
      currentIndex = (index + slides.length) % slides.length;
      slides.forEach((slide, idx) => {
        if (idx === currentIndex) {
          slide.classList.add('active');
        } else {
          slide.classList.remove('active');
        }
      });
      dots.forEach((dot, idx) => {
        if (idx === currentIndex) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
      if (counterEl) {
        counterEl.textContent = `${currentIndex + 1} / ${slides.length}`;
      }
    }

    function startAutoTimer() {
      stopAutoTimer();
      // Cambio automático suave cada 3.5 segundos
      const timer = setInterval(() => {
        goToSlide(currentIndex + 1);
      }, 3500);
      promoCarouselTimers.set(promoId, timer);
    }

    function stopAutoTimer() {
      if (promoCarouselTimers.has(promoId)) {
        clearInterval(promoCarouselTimers.get(promoId));
        promoCarouselTimers.delete(promoId);
      }
    }

    // Navegación manual: Flecha Anterior
    prevBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      goToSlide(currentIndex - 1);
      startAutoTimer();
    });

    // Navegación manual: Flecha Siguiente
    nextBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      goToSlide(currentIndex + 1);
      startAutoTimer();
    });

    // Navegación manual: Puntos / Dots
    dots.forEach(dot => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(dot.getAttribute('data-index'), 10);
        if (!isNaN(idx)) {
          goToSlide(idx);
          startAutoTimer();
        }
      });
    });

    // Pausar en hover para inspección minuciosa
    carousel.addEventListener('mouseenter', stopAutoTimer);
    carousel.addEventListener('mouseleave', startAutoTimer);

    // Soporte táctil móvil (Swipe izquierda / derecha)
    let touchStartX = 0;
    let touchStartY = 0;
    carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    carousel.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;
      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0) {
          goToSlide(currentIndex + 1);
        } else {
          goToSlide(currentIndex - 1);
        }
        startAutoTimer();
      }
    }, { passive: true });

    // Iniciar temporizador automático
    startAutoTimer();
  });
}

function renderPromosGrid() {
  const container = document.getElementById('promosGrid');
  if (!container) return;

  const promos = state.products.filter(p => p.category === 'promos');

  if (!promos.length) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem; color: var(--text-muted);">
        No hay promociones activas en este momento.
      </div>
    `;
    return;
  }

  // Exactamente las 3 promociones exclusivas con carrusel multi-imagen
  container.innerHTML = promos.map(promo => {
    const images = (Array.isArray(promo.images) && promo.images.length > 0)
      ? promo.images
      : [promo.image];
    const discountTag = promo.badge || (promo.discount ? `${promo.discount}% OFF` : 'PROMO EXCLUSIVA');

    return `
      <article class="promo-card-item" data-id="${promo.id}" style="cursor: pointer;" title="Hacer clic para ver detalles y ficha técnica de ${promo.name}">
        <span class="promo-badge-tag">${discountTag}</span>
        <span class="promo-photo-counter">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <span class="promo-counter-num">1 / ${images.length}</span>
        </span>

        <div class="promo-carousel" data-promo-id="${promo.id}">
          <div class="promo-carousel-track">
            ${images.map((imgUrl, idx) => `
              <div class="promo-carousel-slide ${idx === 0 ? 'active' : ''}" data-index="${idx}">
                <img src="${imgUrl}" alt="${promo.name} - Vista ${idx + 1}" loading="${idx === 0 ? 'eager' : 'lazy'}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&h=1000&q=85&fm=webp';" />
              </div>
            `).join('')}
          </div>

          <!-- Flechas de navegación manual -->
          <button type="button" class="promo-carousel-arrow prev" data-action="prev-slide" aria-label="Foto anterior" title="Foto anterior">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <button type="button" class="promo-carousel-arrow next" data-action="next-slide" aria-label="Siguiente foto" title="Siguiente foto">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>

          <!-- Indicadores de puntos -->
          <div class="promo-carousel-dots">
            ${images.map((_, idx) => `
              <button type="button" class="promo-carousel-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}" aria-label="Ir a foto ${idx + 1}" title="Foto ${idx + 1}"></button>
            `).join('')}
          </div>

          <span class="promo-quick-hint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Ver Ficha Técnica
          </span>
        </div>

        <div class="promo-body">
          <span class="promo-category">${promo.bodega ? promo.bodega + ' • ' : ''}${promo.subcategory || 'PROMO EXCLUSIVA'}</span>
          <h3 class="promo-title">${promo.name}</h3>
          
          <div class="promo-pricing">
            <div class="promo-price-main">
              <span class="promo-current-price">${formatCurrency(promo.price)}</span>
              ${promo.originalPrice ? `<span class="promo-original-price">${formatCurrency(promo.originalPrice)}</span>` : ''}
            </div>
          </div>

          <button class="promo-buy-btn" data-action="add-promo" data-id="${promo.id}" type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            Agregar al Carrito
          </button>
        </div>
      </article>
    `;
  }).join('');

  // Inicializar carruseles interactivos
  initPromoCarousels();

  // Evento agregar al carrito
  container.querySelectorAll('[data-action="add-promo"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const prod = state.products.find(p => p.id === id);
      if (prod) {
        cart.addItem(prod, 1);
        openCartDrawer();
        showToast(`"${prod.name}" agregado a tu carrito.`);
      }
    });
  });

  // Evento clic en la card para ver descripción detallada (modal)
  container.querySelectorAll('.promo-card-item').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="add-promo"]')) return;
      if (e.target.closest('.promo-carousel-arrow')) return;
      if (e.target.closest('.promo-carousel-dot')) return;
      const id = card.getAttribute('data-id');
      const prod = state.products.find(p => p.id === id);
      if (prod) {
        openProductModal(prod);
      }
    });
  });
}

// ================= FORMULARIO DE CONSULTA FORMAL =================
function setupContactInquiryForm() {
  const form = document.getElementById('contactInquiryForm');
  const feedback = document.getElementById('inquiryFeedback');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('inqName').value.trim();
    const email = document.getElementById('inqEmail').value.trim();
    const phone = document.getElementById('inqPhone')?.value.trim() || '';
    const subject = document.getElementById('inqSubject')?.value || 'Consulta general';
    const message = document.getElementById('inqMessage').value.trim();

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando consulta...';
    }

    try {
      await api.sendContactInquiry({ name, email, phone, subject, message });

      if (feedback) {
        feedback.className = 'inquiry-feedback-msg success';
        feedback.innerHTML = `
          <strong>✓ ¡Consulta enviada con éxito!</strong><br />
          Estimado/a ${name}, su mensaje ha sido recibido correctamente.<br />
          Nos pondremos en contacto a la brevedad a su casilla <em>${email}</em>.
        `;
      }

      form.reset();
      showToast('Su consulta ha sido enviada con éxito.');
    } catch (err) {
      // Fallback mailto
      const mailtoUrl = `mailto:vinotecalarecta7@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Nombre: ${name}\nTeléfono: ${phone}\nEmail: ${email}\n\nConsulta:\n${message}`)}`;
      window.location.href = mailtoUrl;
      if (feedback) {
        feedback.className = 'inquiry-feedback-msg success';
        feedback.textContent = 'Abriendo su cliente de correo para enviar la consulta...';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
          Enviar Consulta
        `;
      }
    }
  });
}

// ================= INITIALIZATION =================

// ================= MENÚ MÓVIL (DRAWER HAMBURGUESA) =================
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobileMenuToggleBtn');
  const drawer = document.getElementById('mobileMenuDrawer');
  const closeBtn = document.getElementById('mobileMenuCloseBtn');
  if (!toggleBtn || !drawer) return;

  const openMenu = () => {
    drawer.classList.add('active');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    drawer.classList.remove('active');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openMenu();
  });

  closeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeMenu();
  });

  drawer.addEventListener('click', (e) => {
    const navLink = e.target.closest('.mobile-nav-link');
    if (navLink) {
      closeMenu();
      const href = navLink.getAttribute('href');
      if (href && (href.startsWith('#') || href.startsWith('/#'))) {
        const hash = href.replace('/', '');
        const targetEl = document.querySelector(hash);
        if (targetEl) {
          e.preventDefault();
          setTimeout(() => {
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        }
      }
      return;
    }

    if (e.target === drawer || e.target.closest('.mobile-wsp-link') || e.target.closest('.mobile-ig-link')) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('active')) {
      closeMenu();
    }
  });
}

async function init() {
  initMobileMenu();
  auth.init();
  cart.init();
  setupEventListeners();
  initHeroCarousel();
  setupContactInquiryForm();

  try {
    const [products, siteConfig] = await Promise.all([
      api.getProducts(),
      api.getSiteConfig().catch(() => null)
    ]);
    if (siteConfig) {
      applySiteCustomization(siteConfig);
      initHeroCarousel();
    }
    state.products = products;
    state.filteredProducts = products;
    renderPreventaCategories();
    const urlCat = new URLSearchParams(window.location.search).get('categoria');
    selectPreventaCategory(urlCat || 'todos', Boolean(urlCat));
    renderPromosGrid();
    renderProducts();
  } catch (err) {
    console.error('Error loading products from backend:', err);
    showToast('Conectando con la cava online...');
  }
}

document.addEventListener('DOMContentLoaded', init);

