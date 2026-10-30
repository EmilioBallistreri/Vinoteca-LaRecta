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

function renderCategories() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;

  // Formal Category definitions with Roman Numerals and refined SVG icons
  const categories = [
    {
      id: 'promos',
      roman: 'I',
      name: 'Promos',
      desc: 'Estuches de madera, combos de degustación y ofertas de cava especiales.',
      isPromo: true,
      iconSvg: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      `
    },
    {
      id: 'vinos',
      roman: 'II',
      name: 'Vinos',
      desc: 'Grandes Malbecs, Cabernet Sauvignon y cortes de autor de guarda.',
      isPromo: false,
      iconSvg: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 22h8m-4-4v4m-5-8a5 5 0 0 1 10 0v1a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-1z"></path>
          <line x1="12" y1="2" x2="12" y2="4"></line>
        </svg>
      `
    },
    {
      id: 'espumantes',
      roman: 'III',
      name: 'Espumantes',
      desc: 'Método Tradicional Champenoise y cuvées de viñedos de altura.',
      isPromo: false,
      iconSvg: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M7 21h10m-5-3v3m-3-9a3 3 0 0 1 6 0v2a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2v-2z"></path>
          <circle cx="12" cy="5" r="1"></circle>
          <circle cx="10" cy="8" r="1"></circle>
          <circle cx="14" cy="7" r="1"></circle>
        </svg>
      `
    },
    {
      id: 'whiskys',
      roman: 'IV',
      name: 'Whiskys',
      desc: 'Single Malts escoceses añejados, Blended de prestigio y Bourbon.',
      isPromo: false,
      iconSvg: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="5" y="4" width="14" height="16" rx="2"></rect>
          <line x1="5" y1="10" x2="19" y2="10"></line>
          <line x1="10" y1="2" x2="14" y2="2"></line>
        </svg>
      `
    },
    {
      id: 'aperitivos',
      roman: 'V',
      name: 'Aperitivos',
      desc: 'Gins botánicos de autor, Vermuts artesanales y amargos tradicionales.',
      isPromo: false,
      iconSvg: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L3 8l9 6 9-6-9-6z"></path>
          <path d="M3 8v10l9 5 9-5V8"></path>
        </svg>
      `
    },
    {
      id: 'delicatessen',
      roman: 'VI',
      name: 'Delicatessen',
      desc: 'Chacinados de bellota, aceites de oliva virgen extra y quesos nobles.',
      isPromo: false,
      iconSvg: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M12 3a9 9 0 0 0 9 9"></path>
        </svg>
      `
    }
  ];

  grid.innerHTML = categories.map(cat => {
    const count = state.products.filter(p => cat.id === 'promos' ? (p.category === 'promos' || p.discount > 0) : p.category === cat.id).length;
    return `
      <article class="category-card ${cat.isPromo ? 'featured-promo' : ''}" data-category="${cat.id}">
        <div class="category-card-top">
          <span class="category-roman-numeral">${cat.roman}</span>
          <div class="category-icon-box">${cat.iconSvg}</div>
        </div>
        <h3 class="category-name">${cat.name}</h3>
        <p class="category-desc">${cat.desc}</p>
        <div class="category-card-footer">
          <span class="category-count">${count} Botellas en Cava</span>
          <span class="category-explore-link">
            Explorar
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </span>
        </div>
      </article>
    `;
  }).join('');

  grid.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const catId = card.getAttribute('data-category');
      window.location.href = `/productos.html?categoria=${catId}`;
    });
  });
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
    const cuotasAmount = Math.round(product.price / 3);
    const transferPrice = Math.round(product.price * 0.90);

    return `
      <article class="product-card" data-id="${product.id}">
        <div class="card-img-wrap">
          ${product.badge ? `<span class="card-badge ${product.badge.includes('PROMO') ? 'promo' : ''}">${product.badge}</span>` : ''}
          <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&h=1000&q=85&fm=webp';" />
          <button class="card-quick-view-btn" data-action="quickview" data-id="${product.id}">Ver Ficha Técnica</button>
        </div>
        <div class="card-body">
          <span class="card-bodega">${product.bodega ? product.bodega + ' • ' : ''}${product.category.toUpperCase()}</span>
          <h3 class="card-title">${product.name}</h3>
          
          <div class="card-pricing">
            <div class="card-price-row">
              <span class="card-current-price">${formatCurrency(product.price)}</span>
              ${product.originalPrice ? `<span class="card-original-price">${formatCurrency(product.originalPrice)}</span>` : ''}
            </div>
            <div class="card-perks-info">
              <div>💳 <strong>3 pagos fijos sin interés</strong> de ${formatCurrency(cuotasAmount)}</div>
              <div>⚡ <strong>${formatCurrency(transferPrice)}</strong> por Transferencia Bancaria (10% OFF)</div>
            </div>
          </div>

          <div class="card-stock-status">
            ${isOutOfStock ? `
              <span class="stock-out"><span class="stock-dot"></span> Agotado en Cava</span>
            ` : isLowStock ? `
              <span class="stock-low"><span class="stock-dot"></span> Partida Limitada: Últimas ${product.stock} botellas</span>
            ` : `
              <span class="stock-in"><span class="stock-dot"></span> Disponible en Cava</span>
            `}
          </div>

          <button class="card-add-btn" data-action="add-cart" data-id="${product.id}" ${isOutOfStock ? 'disabled' : ''}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            ${isOutOfStock ? 'Partida Agotada' : 'Adquirir / Agregar a la Cava'}
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
    if (state.activeCategory === 'promos') {
      list = list.filter(p => p.category === 'promos' || (p.discount && p.discount > 0));
    } else {
      list = list.filter(p => p.category.toLowerCase() === state.activeCategory.toLowerCase());
    }
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

  // Drawer elements
  const drawerItems = document.getElementById('cartDrawerItems');
  const drawerFooter = document.getElementById('cartDrawerFooter');
  const subtotalEl = document.getElementById('cartDrawerSubtotal');
  const transferEl = document.getElementById('cartDrawerTransfer');
  const totalEl = document.getElementById('cartDrawerTotal');
  const cuotasEl = document.getElementById('cartDrawerCuotas');
  const shippingFill = document.getElementById('shippingProgressFill');
  const shippingText = document.getElementById('shippingNoticeText');

  // Shipping progress calculation
  const diff = cart.getFreeShippingDifference();
  const subtotal = cart.getSubtotal();
  const percent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  if (shippingFill) shippingFill.style.width = `${percent}%`;
  if (shippingText) {
    if (cart.isFreeShipping()) {
      shippingText.innerHTML = `🚚 <strong>Despacho bonificado sin cargo a su domicilio en Córdoba</strong>`;
      shippingText.style.color = 'var(--status-available)';
    } else {
      shippingText.innerHTML = `🚚 Falta sumar <strong>${formatCurrency(diff)}</strong> para acceder al Envío Sin Cargo`;
      shippingText.style.color = 'var(--gold-champagne)';
    }
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
          <span class="cart-item-price">${formatCurrency(item.price * item.quantity)}</span>
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

  const cuotas = Math.round(product.price / 3);
  const transfer = Math.round(product.price * 0.90);
  const isOutOfStock = product.stock <= 0;
  const isPromo = product.category === 'promos' || (product.discount && product.discount > 0);

  body.innerHTML = `
    <div class="product-modal-grid">
      <img src="${product.image}" alt="${product.name}" class="product-modal-img" />
      <div class="product-modal-details">
        <span class="card-bodega">${product.bodega ? product.bodega + ' • ' : ''}${product.category.toUpperCase()}</span>
        <h2 style="font-family: var(--font-serif); font-size: 2.3rem; color: #fff; line-height: 1.15; margin-bottom: 0.9rem;">${product.name}</h2>
        
        <div style="margin-bottom: 1.5rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--gold-border);">
          <div style="font-size: 2rem; font-weight: 700; color: #fff;">${formatCurrency(product.price)}</div>
          ${!isPromo ? `
          <div style="font-size: 0.9rem; color: var(--gold-champagne); margin-top: 0.45rem; line-height: 1.6;">
            💳 3 pagos fijos de ${formatCurrency(cuotas)} sin interés con todas las tarjetas<br>
            ⚡ ${formatCurrency(transfer)} abonando por Transferencia Bancaria (10% de bonificación)
          </div>
          ` : ''}
        </div>

        <h4 style="font-family: var(--font-brand); font-size: 0.85rem; color: var(--gold-primary); letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 0.5rem;">Notas de Cata & Guarda:</h4>
        <p style="font-size: 0.98rem; color: var(--text-muted); line-height: 1.8; margin-bottom: 2rem;">
          ${product.description || 'Etiqueta de jerarquía seleccionada rigurosamente por el equipo de sommeliers de Vinoteca La Recta. Mantenida bajo condiciones controladas de cava para salvaguardar su bouquet, taninos y potencial de evolución.'}
        </p>

        <div style="margin-bottom: 2rem; display: flex; align-items: center; gap: 1.5rem;">
          <div class="qty-stepper" style="padding: 0.35rem;">
            <button id="modalQtyDec" class="qty-btn" style="width: 36px; height: 36px; font-size: 1.1rem;">-</button>
            <span id="modalQtyVal" class="qty-val" style="min-width: 44px; font-size: 1.05rem;">1</span>
            <button id="modalQtyInc" class="qty-btn" style="width: 36px; height: 36px; font-size: 1.1rem;">+</button>
          </div>
          <span style="font-size: 0.88rem; color: var(--text-muted);">
            ${isOutOfStock ? 'Sin existencias en cava' : `${product.stock} botellas disponibles en bodega`}
          </span>
        </div>

        <button id="modalAddCartBtn" class="btn-primary" style="width: 100%; justify-content: center; font-size: 0.95rem;" ${isOutOfStock ? 'disabled' : ''}>
          ${isOutOfStock ? 'Partida Agotada' : 'Adquirir y Agregar a la Cava'}
        </button>
      </div>
    </div>
  `;

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
    `*Dirección de Entrega:* ${order.customer.address}\n` +
    `*Forma de Pago:* ${order.paymentMethod}\n\n` +
    `*Detalle de Botellas:*\n${itemsList}\n\n` +
    `*TOTAL A ABONAR:* ${formatCurrency(order.total)}\n\n` +
    `_Estimados Vinoteca La Recta, confirmo el despacho de este pedido realizado desde su cava online._`
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
        Estimado/a <strong>${order.customer.name}</strong>, hemos asentado su pedido. A la brevedad nuestro personal se pondrá en contacto para coordinar la entrega y verificar los datos de embalaje.
      </p>
    </div>

    <div style="background: var(--bg-surface); border: 1px solid var(--gold-border); border-radius: 6px; padding: 1.5rem; margin-bottom: 1.5rem; font-size: 0.9rem;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.6rem; color: var(--text-muted);">
        <span>Modalidad de Pago:</span>
        <strong style="color: #fff;">${order.paymentMethod}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.6rem; color: var(--text-muted);">
        <span>Domicilio de Entrega:</span>
        <strong style="color: #fff;">${order.customer.address}</strong>
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

// ================= PROMOS EN INICIO =================
function renderPromosGrid() {
  const container = document.getElementById('promosGrid');
  if (!container) return;

  const promos = state.products.filter(p => p.category === 'promos' || (p.discount && p.discount > 0));

  if (!promos.length) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem; color: var(--text-muted);">
        No hay promociones activas en este momento.
      </div>
    `;
    return;
  }

  container.innerHTML = promos.slice(0, 6).map(promo => {
    const discountTag = promo.badge || (promo.discount ? `${promo.discount}% OFF` : 'PROMO DESTACADA');

    return `
      <article class="promo-card-item">
        <span class="promo-badge-tag">${discountTag}</span>
        <div class="promo-img-wrap">
          <img src="${promo.image}" alt="${promo.name}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&h=1000&q=85&fm=webp';" />
        </div>
        <div class="promo-body">
          <span class="promo-category">${promo.bodega ? promo.bodega + ' • ' : ''}${promo.category.toUpperCase()}</span>
          <h3 class="promo-title">${promo.name}</h3>
          <p class="promo-desc">${promo.description ? promo.description.slice(0, 110) + '...' : 'Partida exclusiva con precio bonificado de cava.'}</p>
          
          <div class="promo-pricing">
            <div class="promo-price-main">
              <span class="promo-current-price">${formatCurrency(promo.price)}</span>
              ${promo.originalPrice ? `<span class="promo-original-price">${formatCurrency(promo.originalPrice)}</span>` : ''}
            </div>
          </div>

          <button class="promo-buy-btn" data-action="add-promo" data-id="${promo.id}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            Sumar a mi Cava
          </button>
        </div>
      </article>
    `;
  }).join('');

  container.querySelectorAll('[data-action="add-promo"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const prod = state.products.find(p => p.id === id);
      if (prod) {
        cart.addItem(prod, 1);
        openCartDrawer();
        showToast(`"${prod.name}" incorporado a su selección de cava.`);
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

async function init() {
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
    renderCategories();
    renderPromosGrid();
    renderProducts();
  } catch (err) {
    console.error('Error loading products from backend:', err);
    showToast('Conectando con la cava online...');
  }
}

document.addEventListener('DOMContentLoaded', init);

