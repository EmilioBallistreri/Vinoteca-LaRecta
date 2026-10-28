import { api } from './api.js';
import { cart, FREE_SHIPPING_THRESHOLD } from './cart.js';
import { auth } from './auth.js';

// Subcategorías oficiales organizadas por cada una de las 6 categorías
const SUBCATEGORIES_MAP = {
  promos: ['Combos Degustación', 'Cajas x6', 'Packs con Copas', 'Ofertas Especiales'],
  vinos: ['Malbec', 'Cabernet Sauvignon', 'Red Blend & Cortes', 'Blancos & Rosados'],
  espumantes: ['Extra Brut', 'Brut Nature', 'Champagne Francés', 'Rosé & Método Tradicional'],
  whiskys: ['Single Malt Escocés', 'Blended Scotch', 'Bourbon Americano', 'Irlandés & Otros'],
  aperitivos: ['Gin Premium', 'Vermouth & Bitter', 'Fernet & Digestivos', 'Licores Finos'],
  delicatessen: ['Aceites de Oliva Extra Virgen', 'Conservas & Ahumados', 'Chocolates & Dulces Finos', 'Tablas & Embutidos Artesanales']
};

const CATEGORY_TITLES = {
  todos: { tag: 'Catálogo General de Cava', title: 'Todas las Colecciones' },
  promos: { tag: 'Selección & Oportunidades', title: 'Promos & Ofertas Especiales' },
  vinos: { tag: 'Vinos de Autor & Guarda', title: 'Vinos de Alta Gama' },
  espumantes: { tag: 'Método Tradicional & Cuvées', title: 'Espumantes & Champagne' },
  whiskys: { tag: 'Destilados Nobles Añejados', title: 'Whiskys del Mundo' },
  aperitivos: { tag: 'Coctelería & Botánicos', title: 'Aperitivos & Licores Finos' },
  delicatessen: { tag: 'Maridajes & Gastronomía', title: 'Delicatessen Sibarita' }
};

// Estado local de la página de productos
const state = {
  products: [],
  filteredProducts: [],
  activeCategory: 'todos',
  activeSubcategory: 'todos',
  searchQuery: '',
  sortBy: 'featured',
  selectedProduct: null,
  selectedPaymentMethod: 'Transferencia Bancaria (10% OFF)'
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(amount || 0);
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

// ================= RENDER DE SUBCATEGORÍAS =================
function renderSubcategories() {
  const bar = document.getElementById('subcategoriesBar');
  const list = document.getElementById('subcategoriesList');
  if (!bar || !list) return;

  if (state.activeCategory === 'todos') {
    bar.style.display = 'none';
    return;
  }

  const subcats = SUBCATEGORIES_MAP[state.activeCategory] || [];
  if (subcats.length === 0) {
    bar.style.display = 'none';
    return;
  }

  bar.style.display = 'flex';
  list.innerHTML = `
    <button class="subcat-filter-btn ${state.activeSubcategory === 'todos' ? 'active' : ''}" data-subcat="todos">
      Ver Todos los ${state.activeCategory.charAt(0).toUpperCase() + state.activeCategory.slice(1)}
    </button>
    ${subcats.map(sub => `
      <button class="subcat-filter-btn ${state.activeSubcategory === sub ? 'active' : ''}" data-subcat="${sub}">
        ${sub}
      </button>
    `).join('')}
  `;

  list.querySelectorAll('.subcat-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sub = btn.getAttribute('data-subcat');
      setSubcategory(sub);
    });
  });
}

// ================= RENDER DE PRODUCTOS =================
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const countBadge = document.getElementById('resultsCountBadge');
  if (!grid) return;

  if (countBadge) {
    countBadge.textContent = `${state.filteredProducts.length} ${state.filteredProducts.length === 1 ? 'etiqueta encontrada' : 'etiquetas disponibles'}`;
  }

  if (state.filteredProducts.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4.5rem 1.5rem; background: var(--bg-surface); border: 1px solid var(--gold-border); border-radius: 8px;">
        <h3 style="font-family: var(--font-serif); font-size: 1.8rem; color: #fff; margin-bottom: 0.6rem;">No se encontraron etiquetas</h3>
        <p style="font-size: 0.95rem; color: var(--text-muted); margin-bottom: 1.5rem;">
          No hay productos que coincidan con los filtros seleccionados o el término de búsqueda.
        </p>
        <button id="resetFiltersCatalogBtn" class="btn-secondary">
          Restablecer Filtros y Ver Todas las Categorías
        </button>
      </div>
    `;
    document.getElementById('resetFiltersCatalogBtn')?.addEventListener('click', () => {
      setCategory('todos');
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
          <img src="${product.image}" alt="${product.name}" loading="lazy" />
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

  // Eventos de botones de cada card
  grid.querySelectorAll('[data-action="add-cart"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const prod = state.products.find(p => p.id === id);
      if (prod) {
        cart.addItem(prod, 1);
        showToast(`Agregado a la Cava: ${prod.name}`);
      }
    });
  });

  grid.querySelectorAll('[data-action="quickview"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const prod = state.products.find(p => p.id === id);
      if (prod) openProductModal(prod);
    });
  });
}

// ================= MODAL FICHA TÉCNICA =================
function openProductModal(product) {
  state.selectedProduct = product;
  const modal = document.getElementById('productDetailModal');
  const body = document.getElementById('productModalBody');
  if (!modal || !body) return;

  const cuotasAmount = Math.round(product.price / 3);
  const transferPrice = Math.round(product.price * 0.90);
  const isOutOfStock = product.stock <= 0;

  body.innerHTML = `
    <div class="product-modal-grid">
      <div class="modal-img-col">
        <img src="${product.image}" alt="${product.name}" />
      </div>
      <div class="modal-info-col">
        <span class="modal-bodega">${product.bodega ? product.bodega + ' • ' : ''}${product.category.toUpperCase()} • ${product.subcategory || ''}</span>
        <h2 class="modal-title">${product.name}</h2>
        ${product.badge ? `<span class="card-badge ${product.badge.includes('PROMO') ? 'promo' : ''}" style="position: static; display: inline-block; margin-bottom: 1rem;">${product.badge}</span>` : ''}

        <div class="modal-price-box">
          <div class="modal-price">${formatCurrency(product.price)}</div>
          ${product.originalPrice ? `<span class="card-original-price" style="font-size: 1.1rem;">${formatCurrency(product.originalPrice)}</span>` : ''}
          <div class="modal-cuotas-notice">
            💳 <strong>3 Cuotas fijas sin interés</strong> de ${formatCurrency(cuotasAmount)} con todas las tarjetas
          </div>
          <div class="modal-cuotas-notice" style="color: var(--status-available);">
            ⚡ <strong>${formatCurrency(transferPrice)}</strong> con Bonificación por Transferencia Bancaria (10% OFF)
          </div>
        </div>

        <div class="modal-desc-block">
          <h4>Descripción Enológica</h4>
          <p>${product.description || 'Etiqueta de partida limitada seleccionada por Vinoteca La Recta. Conservada bajo estricto control higrométrico y de temperatura.'}</p>
        </div>

        <div style="margin: 1.5rem 0;">
          <span style="font-size: 0.85rem; color: var(--text-muted);">
            Disponibilidad en Cava: <strong style="color: ${isOutOfStock ? '#ff6b6b' : 'var(--gold-champagne)'}">${isOutOfStock ? 'Sin stock momentáneo' : product.stock + ' botellas'}</strong>
          </span>
        </div>

        <button id="modalAddToCartBtn" class="btn-primary" style="width: 100%; justify-content: center; padding: 1rem;" ${isOutOfStock ? 'disabled' : ''}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          ${isOutOfStock ? 'Partida Agotada' : 'Adquirir Botella / Agregar a la Cava'}
        </button>
      </div>
    </div>
  `;

  document.getElementById('modalAddToCartBtn')?.addEventListener('click', () => {
    cart.addItem(product, 1);
    showToast(`Agregado a la Cava: ${product.name}`);
    modal.classList.remove('active');
  });

  modal.classList.add('active');
}

// ================= FILTRADO & ORDENAMIENTO =================
function applyFilters() {
  let list = [...state.products];

  // 1. Categoría
  if (state.activeCategory !== 'todos') {
    if (state.activeCategory === 'promos') {
      list = list.filter(p => p.category === 'promos' || (p.discount && p.discount > 0));
    } else {
      list = list.filter(p => p.category.toLowerCase() === state.activeCategory.toLowerCase());
    }
  }

  // 2. Subcategoría
  if (state.activeSubcategory !== 'todos') {
    list = list.filter(p => p.subcategory && p.subcategory.toLowerCase() === state.activeSubcategory.toLowerCase());
  }

  // 3. Búsqueda de texto
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.bodega && p.bodega.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q) ||
      (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }

  // 4. Ordenamiento
  switch (state.sortBy) {
    case 'price-asc':
      list.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      list.sort((a, b) => b.price - a.price);
      break;
    case 'name-asc':
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'discount':
      list.sort((a, b) => (b.discount || 0) - (a.discount || 0));
      break;
    case 'featured':
    default:
      list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
      break;
  }

  state.filteredProducts = list;
  renderProducts();
}

function setCategory(catId) {
  state.activeCategory = catId;
  state.activeSubcategory = 'todos';

  // Actualizar Pills y Cards visuales
  document.querySelectorAll('.catalog-pill-item, .catalog-cat-card').forEach(item => {
    if (item.getAttribute('data-category') === catId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  const headerTag = document.getElementById('catalogHeaderTag');
  const headerTitle = document.getElementById('catalogHeaderTitle');
  const meta = CATEGORY_TITLES[catId] || CATEGORY_TITLES.todos;
  if (headerTag) headerTag.textContent = meta.tag;
  if (headerTitle) headerTitle.textContent = meta.title;

  // Actualizar URL sin recargar
  const url = new URL(window.location);
  if (catId === 'todos') {
    url.searchParams.delete('categoria');
  } else {
    url.searchParams.set('categoria', catId);
  }
  url.searchParams.delete('subcategoria');
  window.history.replaceState({}, '', url);

  renderSubcategories();
  applyFilters();
}

function setSubcategory(subcat) {
  state.activeSubcategory = subcat;

  const url = new URL(window.location);
  if (subcat === 'todos') {
    url.searchParams.delete('subcategoria');
  } else {
    url.searchParams.set('subcategoria', subcat);
  }
  window.history.replaceState({}, '', url);

  renderSubcategories();
  applyFilters();
}

// ================= CARRITO Y CHECKOUT UI =================
function updateCartDrawerUI(cartData) {
  const countEls = [
    document.getElementById('navCartCount'),
    document.getElementById('floatingCartCount')
  ];
  countEls.forEach(el => {
    if (el) el.textContent = cartData.totalQuantity;
  });

  const itemsContainer = document.getElementById('cartDrawerItems');
  const subtotalEl = document.getElementById('cartDrawerSubtotal');
  const transferEl = document.getElementById('cartDrawerTransfer');
  const totalEl = document.getElementById('cartDrawerTotal');
  const cuotasEl = document.getElementById('cartDrawerCuotas');
  const progressFill = document.getElementById('shippingProgressFill');
  const progressText = document.getElementById('shippingNoticeText');

  if (subtotalEl) subtotalEl.textContent = formatCurrency(cartData.subtotal);
  if (transferEl) transferEl.textContent = `-${formatCurrency(cartData.transferDiscount)}`;
  if (totalEl) totalEl.textContent = formatCurrency(cartData.total);

  if (cuotasEl) {
    const cuota = Math.round(cartData.total / 3);
    cuotasEl.textContent = `o 3 pagos fijos sin interés de ${formatCurrency(cuota)}`;
  }

  if (progressFill && progressText) {
    const remaining = FREE_SHIPPING_THRESHOLD - cartData.total;
    if (remaining <= 0) {
      progressFill.style.width = '100%';
      progressText.innerHTML = '🎉 ¡Felicitaciones! Su envío es <strong>100% BONIFICADO</strong> en Córdoba.';
    } else {
      const pct = Math.min(100, Math.round((cartData.total / FREE_SHIPPING_THRESHOLD) * 100));
      progressFill.style.width = `${pct}%`;
      progressText.innerHTML = `Faltan <strong>${formatCurrency(remaining)}</strong> para Despacho Gratuito en Córdoba.`;
    }
  }

  if (!itemsContainer) return;
  if (cartData.items.length === 0) {
    itemsContainer.innerHTML = `
      <div style="text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
        <p style="font-size: 1.1rem; color: #fff; margin-bottom: 0.5rem;">Su Cava de compras está vacía</p>
        <p style="font-size: 0.85rem;">Explore nuestro catálogo de autor y seleccione sus etiquetas favoritas.</p>
      </div>
    `;
    return;
  }

  itemsContainer.innerHTML = cartData.items.map(item => `
    <div class="cart-item-row" data-id="${item.id}">
      <img src="${item.image}" alt="${item.name}" />
      <div class="cart-item-info">
        <h4 class="cart-item-title">${item.name}</h4>
        <div class="cart-item-unit-price">${formatCurrency(item.price)} por botella</div>
        <div class="cart-item-stepper">
          <button data-action="dec-cart" data-id="${item.id}">-</button>
          <span>${item.quantity}</span>
          <button data-action="inc-cart" data-id="${item.id}">+</button>
          <button data-action="rem-cart" data-id="${item.id}" style="margin-left: auto; color: #ff6b6b; font-size: 0.75rem;">Quitar</button>
        </div>
      </div>
    </div>
  `).join('');

  itemsContainer.querySelectorAll('[data-action="inc-cart"]').forEach(btn => {
    btn.onclick = () => cart.updateQuantity(btn.getAttribute('data-id'), 1);
  });
  itemsContainer.querySelectorAll('[data-action="dec-cart"]').forEach(btn => {
    btn.onclick = () => cart.updateQuantity(btn.getAttribute('data-id'), -1);
  });
  itemsContainer.querySelectorAll('[data-action="rem-cart"]').forEach(btn => {
    btn.onclick = () => cart.removeItem(btn.getAttribute('data-id'));
  });
}

function openCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  const drawer = document.getElementById('cartDrawerOverlay');
  if (drawer) drawer.classList.remove('active');
  if (!modal) return;

  const cartData = cart.getCartData();
  if (cartData.items.length === 0) {
    showToast('Su selección de Cava está vacía.');
    return;
  }

  const user = auth.getUser();
  if (user) {
    const nameInput = document.getElementById('checkoutName');
    const emailInput = document.getElementById('checkoutEmail');
    const phoneInput = document.getElementById('checkoutPhone');
    const addrInput = document.getElementById('checkoutAddress');
    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput && user.phone) phoneInput.value = user.phone;
    if (addrInput && user.address) addrInput.value = user.address;
  }

  updateCheckoutSummary();
  modal.classList.add('active');
}

function updateCheckoutSummary() {
  const cartData = cart.getCartData();
  const subtotalEl = document.getElementById('checkoutSubtotal');
  const discountEl = document.getElementById('checkoutDiscount');
  const totalEl = document.getElementById('checkoutTotal');
  const countEl = document.getElementById('checkoutItemsCount');

  const isTransfer = state.selectedPaymentMethod.includes('Transferencia');
  const discount = isTransfer ? cartData.transferDiscount : 0;
  const finalTotal = isTransfer ? Math.round(cartData.subtotal * 0.90) : cartData.subtotal;

  if (countEl) countEl.textContent = cartData.totalQuantity;
  if (subtotalEl) subtotalEl.textContent = formatCurrency(cartData.subtotal);
  if (discountEl) discountEl.textContent = isTransfer ? `-${formatCurrency(discount)}` : '$0';
  if (totalEl) totalEl.textContent = formatCurrency(finalTotal);
}

// ================= INICIALIZACIÓN =================
document.addEventListener('DOMContentLoaded', async () => {
  auth.init();
  cart.init();

  // Leer parámetros de URL (?categoria=promos, ?subcategoria=Malbec)
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('categoria');
  const subParam = urlParams.get('subcategoria');

  if (catParam && ['promos', 'vinos', 'espumantes', 'whiskys', 'aperitivos', 'delicatessen'].includes(catParam.toLowerCase())) {
    state.activeCategory = catParam.toLowerCase();
  }

  if (subParam) {
    state.activeSubcategory = subParam;
  }

  // Cargar productos
  try {
    const products = await api.getProducts();
    state.products = products;
    setCategory(state.activeCategory);
    if (subParam) setSubcategory(subParam);
  } catch (err) {
    console.error('Error cargando catálogo:', err);
    showToast('Error de conexión al cargar etiquetas.');
  }

  // Eventos de pills y cards de categoría
  document.querySelectorAll('.catalog-pill-item, .catalog-cat-card').forEach(item => {
    item.addEventListener('click', () => {
      const cat = item.getAttribute('data-category');
      setCategory(cat);
    });
  });

  // Botón "Ver Todas las Categorías"
  document.getElementById('viewAllCategoriesBtn')?.addEventListener('click', () => {
    setCategory('todos');
  });

  // Búsqueda en catálogo
  const searchInput = document.getElementById('catalogSearchInput');
  searchInput?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    applyFilters();
  });

  // Ordenamiento
  const sortSelect = document.getElementById('sortSelect');
  sortSelect?.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    applyFilters();
  });

  // Drawer de Carrito (siempre actualiza UI al abrir, incluso vacío)
  const cartDrawer = document.getElementById('cartDrawerOverlay');
  const openCart = () => {
    updateCartDrawerUI(cart.getCartData());
    cartDrawer?.classList.add('active');
  };
  const closeCart = () => cartDrawer?.classList.remove('active');

  document.getElementById('navCartBtn')?.addEventListener('click', openCart);
  document.getElementById('floatingCartBtn')?.addEventListener('click', openCart);
  document.getElementById('cartCloseBtn')?.addEventListener('click', closeCart);

  // Cerrar modales
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-overlay')?.classList.remove('active');
    });
  });

  // Formas de pago en checkout
  document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      state.selectedPaymentMethod = e.target.value;
      document.querySelectorAll('.payment-radio-card').forEach(card => card.classList.remove('selected'));
      e.target.closest('.payment-radio-card')?.classList.add('selected');
      updateCheckoutSummary();
    });
  });

  // Checkout modal trigger
  document.getElementById('cartDrawerCheckoutBtn')?.addEventListener('click', openCheckoutModal);

  // Finalizar Compra Form
  document.getElementById('checkoutForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cartData = cart.getCartData();
    if (cartData.items.length === 0) return;

    const isTransfer = state.selectedPaymentMethod.includes('Transferencia');
    const finalTotal = isTransfer ? Math.round(cartData.subtotal * 0.90) : cartData.subtotal;

    const orderData = {
      customer: {
        name: document.getElementById('checkoutName').value,
        email: document.getElementById('checkoutEmail').value,
        phone: document.getElementById('checkoutPhone').value,
        address: document.getElementById('checkoutAddress').value
      },
      items: cartData.items.map(it => ({
        id: it.id,
        name: it.name,
        price: it.price,
        quantity: it.quantity
      })),
      paymentMethod: state.selectedPaymentMethod,
      subtotal: cartData.subtotal,
      discount: isTransfer ? cartData.transferDiscount : 0,
      shippingCost: 0,
      total: finalTotal,
      notes: document.getElementById('checkoutNotes').value
    };

    try {
      const order = await api.createOrder(orderData);
      cart.clear();
      document.getElementById('checkoutModal')?.classList.remove('active');

      // Mostrar modal éxito y mensaje de WhatsApp
      const successModal = document.getElementById('orderSuccessModal');
      const detailsEl = document.getElementById('orderSuccessDetails');
      const wspBtn = document.getElementById('orderSuccessWspBtn');

      if (detailsEl) {
        detailsEl.innerHTML = `
          <div style="text-align: center; margin-bottom: 1.5rem;">
            <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(197, 160, 89, 0.15); border: 2px solid var(--gold-primary); display: inline-flex; align-items: center; justify-content: center; color: var(--gold-champagne); margin-bottom: 0.8rem;">
              ✓
            </div>
            <h3 style="font-family: var(--font-serif); font-size: 2rem; color: #fff;">Pedido Formalizado</h3>
            <span style="color: var(--gold-champagne); font-weight: 700;">Código de Reserva: #${order.id}</span>
          </div>
          <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6; text-align: center;">
            Estimado/a <strong>${order.customer.name}</strong>, su pedido por <strong>${formatCurrency(order.total)}</strong> ha sido registrado en nuestra cava.
          </p>
        `;
      }

      if (wspBtn) {
        const textMsg = encodeURIComponent(
          `Hola Vinoteca La Recta! Deseo confirmar mi pedido #${order.id}.\n` +
          `Cliente: ${order.customer.name}\n` +
          `Total: ${formatCurrency(order.total)}\n` +
          `Pago: ${order.paymentMethod}\n` +
          `Entrega: ${order.customer.address}`
        );
        wspBtn.href = `https://wa.me/5493512460017?text=${textMsg}`;
      }

      successModal?.classList.add('active');
    } catch (err) {
      alert('Error formalizando pedido: ' + err.message);
    }
  });

  // Login / Auth Tabs
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
      if (errEl) errEl.textContent = 'Registrando cliente...';
      const res = await api.register({ name, email, phone, address, password: pass });
      auth.setUser(res.user);
      auth.closeModal();

      if (auth.isAdmin()) {
        showToast(`¡Bienvenido Administrador ${res.user.name}! Se le ha habilitado el Panel de Administración.`);
      } else {
        showToast(`Cuenta creada con éxito. ¡Bienvenido/a ${res.user.name}!`);
      }
    } catch (err) {
      if (errEl) errEl.textContent = err.message;
    }
  });

  // Quick Superadmin Chips en Demo
  document.querySelectorAll('.quick-admin-chip').forEach(chip => {
    chip.addEventListener('click', async () => {
      const email = chip.getAttribute('data-email');
      const pass = chip.getAttribute('data-pass');
      try {
        const res = await api.login(email, pass);
        auth.setUser(res.user);
        auth.closeModal();
        showToast(`Sesión iniciada como Administrador (${res.user.name})`);
      } catch (err) {
        alert(err.message);
      }
    });
  });

  // Escuchar actualizaciones de carrito
  window.addEventListener('vlr:cart-updated', (e) => {
    updateCartDrawerUI(e.detail);
  });
});
