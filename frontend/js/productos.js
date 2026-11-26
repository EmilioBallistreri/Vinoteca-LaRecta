import { api } from './api.js';
import { cart, FREE_SHIPPING_THRESHOLD } from './cart.js';
import { auth } from './auth.js';
import { applySiteCustomization } from './festivities.js';

// Subcategorías oficiales organizadas por cada una de las 6 categorías
const SUBCATEGORIES_MAP = {
  promos: ['Combos Degustación', 'Cajas x6', 'Dúos Exclusivos', 'Delicatessen & Maridajes', 'Ofertas Especiales'],
  vinos: ['Malbec', 'Cabernet Sauvignon', 'Cabernet Franc', 'Red Blend & Cortes', 'Blancos & Rosados', 'Chardonnay', 'Pinot Noir'],
  espumantes: ['Extra Brut', 'Brut Nature', 'Sidras Artesanales & Cuvées', 'Champagne Francés', 'Rosé & Método Tradicional'],
  aperitivos: ['Gin Premium', 'Vermouth & Bitter', 'Whiskys & Destilados Finos', 'Fernet & Digestivos', 'Licores Finos']
};

const CATEGORY_TITLES = {
  todos: { tag: 'Catálogo General de Cava', title: 'Todas las Colecciones' },
  vinos: { tag: 'Vinos de Autor & Guarda', title: 'Vinos de Alta Gama' },
  espumantes: { tag: 'Método Tradicional, Cuvées & Sidras', title: 'Espumantes y Sidras' },
  aperitivos: { tag: 'Coctelería, Gins & Destilados Finos', title: 'Aperitivos de Selección' },
  promos: { tag: 'Selección & Oportunidades', title: 'Promociones Exclusivas de Vinoteca La Recta' }
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
  selectedPaymentMethod: 'Transferencia Bancaria (Alias)'
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

          <div class="card-purchase-row">
            <div class="card-qty-stepper ${isOutOfStock ? 'disabled' : ''}">
              <button type="button" class="card-qty-btn dec" data-action="card-qty-dec" data-id="${product.id}" aria-label="Disminuir cantidad" ${isOutOfStock ? 'disabled' : ''}>-</button>
              <span class="card-qty-val" data-qty-id="${product.id}">1</span>
              <button type="button" class="card-qty-btn inc" data-action="card-qty-inc" data-id="${product.id}" aria-label="Aumentar cantidad" ${isOutOfStock ? 'disabled' : ''}>+</button>
            </div>
            <button class="card-add-btn" data-action="add-cart" data-id="${product.id}" ${isOutOfStock ? 'disabled' : ''}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              <span class="card-add-text-desktop">${isOutOfStock ? 'Partida Agotada' : 'Agregar al Carrito'}</span>
              <span class="card-add-text-mobile">${isOutOfStock ? 'Agotada' : 'Agregar'}</span>
            </button>
          </div>
        </div>
      </article>
    `;
}).join('');

  // Steppers de cantidad en cards
  grid.querySelectorAll('[data-action="card-qty-inc"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const valEl = grid.querySelector(`[data-qty-id="${id}"]`);
      if (!valEl) return;
      const prod = state.products.find(p => p.id === id);
      const max = (prod && prod.stock > 0) ? prod.stock : 99;
      let current = parseInt(valEl.textContent, 10) || 1;
      if (current < max) {
        valEl.textContent = current + 1;
      }
    });
  });

  grid.querySelectorAll('[data-action="card-qty-dec"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const valEl = grid.querySelector(`[data-qty-id="${id}"]`);
      if (!valEl) return;
      let current = parseInt(valEl.textContent, 10) || 1;
      if (current > 1) {
        valEl.textContent = current - 1;
      }
    });
  });

  // Eventos de botones de cada card
  grid.querySelectorAll('[data-action="add-cart"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const prod = state.products.find(p => p.id === id);
      if (prod) {
        const valEl = btn.closest('.card-purchase-row')?.querySelector(`[data-qty-id="${id}"]`);
        const qty = parseInt(valEl?.textContent, 10) || 1;
        cart.addItem(prod, qty);
        showAddedToCartModal(prod, qty);
        if (valEl) valEl.textContent = '1';
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
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-purchase-row') || e.target.closest('.card-qty-stepper') || e.target.closest('[data-action="add-cart"]')) return;
      const id = card.getAttribute('data-id');
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

  const isOutOfStock = product.stock <= 0;
  const whatsappUrl = `https://wa.me/5493512460017?text=${encodeURIComponent('Hola Vinoteca La Recta! Quisiera consultar disponibilidad para retirar ' + product.name + ' con pago en efectivo/transferencia.')}`;

  const images = (Array.isArray(product.images) && product.images.length > 0)
    ? product.images
    : [product.image];

  body.innerHTML = `
    <div class="product-modal-grid">
      <div class="modal-img-col">
        <img id="modalProductMainImg" src="${images[0]}" alt="${product.name}" />
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
      <div class="modal-info-col">
        <span class="modal-bodega">${product.bodega ? product.bodega + ' • ' : ''}${product.category.toUpperCase()} • ${product.subcategory || ''}</span>
        <h2 class="modal-title">${product.name}</h2>
        ${product.badge ? `<span class="card-badge promo" style="position: static; display: inline-block; margin-bottom: 0.85rem;">${product.badge}</span>` : ''}

        <div class="modal-price-box">
          <div style="display: flex; align-items: baseline; gap: 0.85rem; flex-wrap: wrap;">
            <span class="modal-price" style="color: var(--gold-light);">${formatCurrency(product.price)}</span>
            ${product.originalPrice ? `<span class="card-original-price" style="font-size: 1.2rem; color: #888; text-decoration: line-through;">${formatCurrency(product.originalPrice)}</span>` : ''}
          </div>
        </div>

        <!-- Descripción (Primera) -->
        <div class="modal-desc-block" style="margin-bottom: 1.25rem;">
          <h4>Descripción</h4>
          <p>${product.description || 'Etiqueta de partida limitada seleccionada por Vinoteca La Recta. Conservada bajo estricto control higrométrico y de temperatura.'}</p>
        </div>

        <!-- Metodología de Venta & Retiro (Segunda) -->
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

        <div style="margin: 1.5rem 0;">
          <span style="font-size: 0.85rem; color: var(--text-muted);">
            ${isOutOfStock ? 'Sin stock' : 'Hasta agotar stock'}
          </span>
        </div>

        <button class="btn-primary" id="modalAddToCartBtn" style="width: 100%; justify-content: center;" ${isOutOfStock ? 'disabled' : ''}>
          ${isOutOfStock ? 'Agotado' : 'Agregar al Carrito'}
        </button>
      </div>
    </div>
  `;

  // Miniaturas modal
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

  document.getElementById('modalAddToCartBtn')?.addEventListener('click', () => {
    cart.addItem(product, 1);
    modal.classList.remove('active');
    showAddedToCartModal(product, 1);
  });

  modal.classList.add('active');
}

function closeProductModal() {
  document.getElementById('productDetailModal')?.classList.remove('active');
}

// ================= DRAWER DE CARRITO =================
function openCartDrawer() {
  const cartDrawer = document.getElementById('cartDrawerOverlay');
  updateCartDrawerUI(cart.getCartData());
  cartDrawer?.classList.add('active');
}

function closeCartDrawer() {
  const cartDrawer = document.getElementById('cartDrawerOverlay');
  cartDrawer?.classList.remove('active');
}

// ================= MODAL POST-AGREGADO AL CARRITO (CONTINUAR O FINALIZAR) =================
function showAddedToCartModal(product, quantity = 1) {
  closeProductModal();

  const modal = document.getElementById('addedToCartModal');
  if (!modal) return;

  const imgEl = document.getElementById('postAddProductImg');
  const nameEl = document.getElementById('postAddProductName');
  const qtyEl = document.getElementById('postAddProductQty');
  const priceEl = document.getElementById('postAddProductPrice');

  if (imgEl) {
    imgEl.src = product.image || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&h=1000&q=85&fm=webp';
    imgEl.alt = product.name || 'Producto agregado';
  }
  if (nameEl) nameEl.textContent = product.name || 'Vino de Cava';
  if (qtyEl) qtyEl.textContent = `${quantity} ${quantity === 1 ? 'unidad' : 'unidades'}`;
  if (priceEl) priceEl.textContent = formatCurrency((product.price || 0) * quantity);

  modal.classList.add('active');
}

function closeAddedToCartModal() {
  document.getElementById('addedToCartModal')?.classList.remove('active');
}

function initAddedToCartModal() {
  const modal = document.getElementById('addedToCartModal');
  if (!modal) return;

  document.getElementById('postAddContinueBtn')?.addEventListener('click', () => {
    closeAddedToCartModal();
  });

  document.getElementById('postAddCloseBtn')?.addEventListener('click', () => {
    closeAddedToCartModal();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeAddedToCartModal();
    }
  });

  document.getElementById('postAddCheckoutBtn')?.addEventListener('click', () => {
    closeAddedToCartModal();
    openCartDrawer();
  });
}

// ================= WHATSAPP EXPRESS CHECKOUT (OPCIÓN 1) =================

function getCustomerForOrder() {
  const formalUser = auth.getUser();
  if (formalUser && formalUser.name) {
    return {
      name: formalUser.name,
      phone: formalUser.phone || ''
    };
  }
  return null;
}

function executeWhatsAppOrder(customer) {
  const url = cart.getWhatsAppOrderUrl(customer);

  // Registrar pedido para que quede en el historial de "Mis Pedidos" del cliente
  try {
    const orderData = {
      customer: {
        userId: customer.id || auth.getUser()?.id || '',
        name: customer.name,
        dni: customer.dni || auth.getUser()?.dni || '',
        phone: customer.phone,
        email: customer.email || auth.getUser()?.email || ''
      },
      items: [...cart.items],
      subtotal: cart.getSubtotal(),
      total: cart.getSubtotal(),
      paymentMethod: 'WhatsApp (Efectivo o Transferencia al retirar)',
      deliveryMethod: 'Retiro en el local (Av. Recta Martinolli 8255)',
      channel: 'WhatsApp',
      status: 'Pendiente'
    };
    api.createOrder(orderData).catch(() => null);
  } catch (err) {}

  window.open(url, '_blank');
  cart.clear();
  closeCartDrawer();
  document.getElementById('wspExpressModal')?.classList.remove('active');
  showToast('¡Pedido derivado a WhatsApp! Tu selección ha sido procesada.');
}

function handleWhatsAppCheckout() {
  const cartData = cart.getCartData();
  if (!cartData.items || cartData.items.length === 0) {
    showToast('Tu selección de cava se encuentra vacía.');
    return;
  }

  const customer = getCustomerForOrder();
  if (customer && customer.name) {
    executeWhatsAppOrder(customer);
  } else {
    const modal = document.getElementById('wspExpressModal');
    if (modal) {
      modal.classList.add('active');
      const nameInput = document.getElementById('wspCustomerName');
      const dniInput = document.getElementById('wspCustomerDni');
      const phoneInput = document.getElementById('wspCustomerPhone');
      if (nameInput) {
        nameInput.value = '';
        setTimeout(() => nameInput.focus(), 150);
      }
      if (dniInput) dniInput.value = '';
      if (phoneInput) phoneInput.value = '';
    }
  }
}

function initWspExpressModal() {
  const modal = document.getElementById('wspExpressModal');
  if (!modal) return;

  document.getElementById('closeWspExpressBtn')?.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  const form = document.getElementById('wspExpressForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('wspCustomerName')?.value.trim();
      const dni = document.getElementById('wspCustomerDni')?.value.trim();
      const phone = document.getElementById('wspCustomerPhone')?.value.trim();

      if (!name || !dni || !phone) {
        showToast('Por favor completa Nombre, DNI y Teléfono para continuar.');
        return;
      }

      // Auto-registrar al cliente y guardar en la sesión activa
      const cleanPhone = phone.replace(/\D/g, '');
      const cleanDni = dni.replace(/\D/g, '');
      const userEmail = `cliente_${cleanPhone || cleanDni || Date.now()}@vinotecalarecta.com.ar`;
      const clientUser = {
        id: 'cli_' + Date.now().toString(36),
        name: name,
        dni: dni,
        phone: phone,
        email: userEmail,
        role: 'cliente',
        createdAt: new Date().toISOString()
      };

      auth.setUser(clientUser);
      try {
        localStorage.removeItem('vlr_guest_customer');
      } catch (err) {}

      // Intentar persistir en backend de forma asíncrona
      try {
        api.register({
          name: name,
          dni: dni,
          phone: phone,
          email: userEmail,
          password: 'vlr_' + (cleanPhone.slice(-4) || '1234')
        }).catch(() => null);
      } catch (err) {}

      executeWhatsAppOrder(clientUser);
    });
  }
}

// ================= MIS PEDIDOS (ACTIVIDAD DEL CLIENTE) =================

async function openMyOrdersModal() {
  const user = auth.getUser();
  if (!user) {
    showToast('Por favor ingresa a tu cuenta para consultar tus pedidos.');
    auth.openModal('login');
    return;
  }

  const modal = document.getElementById('myOrdersModal');
  const content = document.getElementById('myOrdersContent');
  if (!modal || !content) return;

  modal.classList.add('active');
  content.innerHTML = `
    <div class="orders-loading-state">
      <p>Consultando tu registro de pedidos...</p>
    </div>
  `;

  try {
    const allOrders = await api.getOrders();
    const cleanPhone = (user.phone || '').replace(/\D/g, '');
    const cleanDni = (user.dni || '').replace(/\D/g, '');
    const userEmail = (user.email || '').toLowerCase().trim();
    const userName = (user.name || '').toLowerCase().trim();

    const myOrders = allOrders.filter(order => {
      const cust = order.customer || {};
      const orderPhone = (cust.phone || '').replace(/\D/g, '');
      const orderDni = (cust.dni || '').replace(/\D/g, '');
      const orderEmail = (cust.email || '').toLowerCase().trim();
      const orderName = (cust.name || '').toLowerCase().trim();
      const orderUserId = cust.userId;

      if (user.id && orderUserId && orderUserId === user.id) return true;
      if (cleanPhone && orderPhone && (orderPhone.endsWith(cleanPhone) || cleanPhone.endsWith(orderPhone))) return true;
      if (cleanDni && orderDni && orderDni === cleanDni) return true;
      if (userEmail && orderEmail && userEmail === orderEmail) return true;
      if (userName && orderName && userName === orderName) return true;
      return false;
    });

    if (myOrders.length === 0) {
      content.innerHTML = `
        <div class="orders-empty-state">
          <div class="empty-icon">🍷</div>
          <h4>No tienes pedidos registrados todavía</h4>
          <p>Cuando realices un pedido por la Web o vía WhatsApp, quedará registrado aquí con el detalle de etiquetas y su estado de preparación.</p>
          <button type="button" class="btn-primary" id="ordersEmptyCloseBtn" style="margin: 0 auto; padding: 0.6rem 1.4rem;">
            Explorar Colecciones
          </button>
        </div>
      `;
      document.getElementById('ordersEmptyCloseBtn')?.addEventListener('click', () => {
        modal.classList.remove('active');
      });
      return;
    }

    content.innerHTML = `
      <div class="orders-client-list">
        ${myOrders.map(order => {
          const statusStr = order.status || 'Pendiente';
          const statusSlug = statusStr.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
          const dateFormatted = order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-AR', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
          }) : 'Reciente';

          const itemsList = Array.isArray(order.items) ? order.items : [];
          const orderTotal = order.total || order.subtotal || 0;

          return `
            <div class="order-client-card">
              <div class="order-client-card-header">
                <div class="order-client-meta-left">
                  <span class="order-client-id">Pedido #${order.id}</span>
                  <span class="order-client-date">Fecha: ${dateFormatted} hs</span>
                </div>
                <span class="order-status-badge status-${statusSlug}">${statusStr}</span>
              </div>

              <div class="order-client-items-box">
                ${itemsList.map(item => `
                  <div class="order-client-item-line">
                    <span>${item.quantity}x ${item.name}</span>
                    <strong>${formatCurrency(item.price * item.quantity)}</strong>
                  </div>
                `).join('')}
              </div>

              <div class="order-client-card-footer">
                <div class="order-client-total-wrap">
                  <span>Total Abonado / A abonar:</span>
                  <strong>${formatCurrency(orderTotal)}</strong>
                </div>
                <a href="https://wa.me/5493512460017?text=${encodeURIComponent(`Hola Vinoteca La Recta! Quisiera consultar sobre el estado de mi Pedido #${order.id}.`)}" target="_blank" rel="noopener noreferrer" class="order-client-wsp-btn">
                  Consultar por WhatsApp
                </a>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (err) {
    content.innerHTML = `
      <div class="orders-loading-state" style="color: #e74c3c;">
        <p>Ocurrió un error al cargar tus pedidos. Por favor intenta nuevamente.</p>
      </div>
    `;
  }
}

// ================= ACCESO OCULTO PARA DUEÑOS / ADMINISTRACIÓN =================

function initSecretAdminAccess() {
  const trigger = document.getElementById('secretAdminTrigger');
  const modal = document.getElementById('adminSecretModal');
  const form = document.getElementById('adminSecretLoginForm');
  const errEl = document.getElementById('adminSecretError');

  if (trigger && modal) {
    trigger.addEventListener('click', () => {
      modal.classList.add('active');
      if (errEl) errEl.textContent = '';
      setTimeout(() => document.getElementById('adminSecretEmail')?.focus(), 150);
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      modal?.classList.add('active');
      if (errEl) errEl.textContent = '';
      setTimeout(() => document.getElementById('adminSecretEmail')?.focus(), 150);
    }
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('adminSecretEmail')?.value.trim();
      const pass = document.getElementById('adminSecretPassword')?.value;

      try {
        if (errEl) errEl.textContent = 'Verificando credenciales de administración...';
        const res = await api.login(email, pass);
        if (!res.user.role.includes('admin')) {
          throw new Error('Esta cuenta no posee privilegios administrativos.');
        }
        auth.setUser(res.user);
        window.location.href = '/admin.html';
      } catch (err) {
        if (errEl) errEl.textContent = err.message || 'Credenciales incorrectas.';
      }
    });
  }
}

// ================= FILTRADO & ORDENAMIENTO =================
function applyFilters() {
  let list = [...state.products];

  // 1. Categoría
  if (state.activeCategory !== 'todos') {
    if (state.activeCategory.toLowerCase() === 'promos') {
      list = list.filter(p => p.category === 'promos' || (p.discount && p.discount > 0) || (p.originalPrice && p.originalPrice > p.price));
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

  // Sincronizar etiqueta canónica con la categoría activa para SEO limpio
  const canonicalTag = document.querySelector('link[rel="canonical"]');
  if (canonicalTag) {
    if (catId !== 'todos' && ['promos', 'vinos', 'espumantes', 'aperitivos'].includes(catId.toLowerCase())) {
      canonicalTag.setAttribute('href', `https://vinotecalarecta.com/productos.html?categoria=${catId.toLowerCase()}`);
    } else {
      canonicalTag.setAttribute('href', 'https://vinotecalarecta.com/productos.html');
    }
  }

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
  const headerPill = document.getElementById('cartDrawerCountPill');
  if (headerPill) {
    const totalBottles = cartData.totalQuantity || 0;
    const totalLabels = cartData.items ? cartData.items.length : 0;
    headerPill.textContent = totalBottles > 0 ? `${totalBottles} ${totalBottles === 1 ? 'unidad' : 'unidades'} • ${totalLabels} ${totalLabels === 1 ? 'etiqueta' : 'etiquetas'}` : '0 productos';
  }
  const clearAllBtn = document.getElementById('cartClearAllBtn');
  if (clearAllBtn) {
    clearAllBtn.style.display = cartData.items && cartData.items.length > 0 ? 'inline-flex' : 'none';
    clearAllBtn.onclick = () => {
      cart.clear();
    };
  }

  const itemsContainer = document.getElementById('cartDrawerItems');
  const drawerFooter = document.getElementById('cartDrawerFooter');
  const subtotalEl = document.getElementById('cartDrawerSubtotal');
  const transferEl = document.getElementById('cartDrawerTransfer');
  const totalEl = document.getElementById('cartDrawerTotal');
  const cuotasEl = document.getElementById('cartDrawerCuotas');
  const progressFill = document.getElementById('shippingProgressFill');
  const progressText = document.getElementById('shippingNoticeText');
  const wspBtn = document.getElementById('cartDrawerWspBtn');

  if (subtotalEl) subtotalEl.textContent = formatCurrency(cartData.subtotal);
  if (transferEl) transferEl.textContent = formatCurrency(cart.getTransferTotal());
  if (totalEl) totalEl.textContent = formatCurrency(cartData.total);

  if (cuotasEl) {
    cuotasEl.textContent = 'Medios de pago: Efectivo al retirar o Transferencia con Alias';
  }

  const noticeContainer = document.getElementById('cartUserStatusNotice');
  if (noticeContainer) {
    const currentUser = auth.getUser();
    if (currentUser && currentUser.name) {
      noticeContainer.innerHTML = `
        <div class="cart-user-badge">
          <span>Comprando como: <strong>${currentUser.name}</strong></span>
          <button type="button" id="cartChangeUserBtn" class="cart-change-user-btn" title="Cambiar usuario o comprar con otros datos">Cambiar</button>
        </div>
      `;
      document.getElementById('cartChangeUserBtn')?.addEventListener('click', () => {
        auth.setUser(null);
        try { localStorage.removeItem('vlr_guest_customer'); } catch (e) {}
        const nameInput = document.getElementById('wspCustomerName');
        const phoneInput = document.getElementById('wspCustomerPhone');
        if (nameInput) nameInput.value = '';
        if (phoneInput) phoneInput.value = '';
        showToast('Sesión desvinculada. Puedes ingresar tus nuevos datos.');
        updateCartDrawerUI(cart.getCartData());
      });
    } else {
      noticeContainer.innerHTML = '';
    }
  }

  if (wspBtn) {
    wspBtn.href = cart.getWhatsAppOrderUrl(auth.getUser());
  }

  if (progressFill) progressFill.style.display = 'none';
  if (progressText) {
    progressText.innerHTML = `🏬 Retiro exclusivo en el local: <strong>Av. Recta Martinolli 8255</strong>`;
    progressText.style.color = 'var(--gold-champagne)';
  }

  if (!itemsContainer) return;
  if (cartData.items.length === 0) {
    if (drawerFooter) drawerFooter.style.display = 'none';
    itemsContainer.innerHTML = `
      <div style="text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
        <p style="font-size: 1.1rem; color: #fff; margin-bottom: 0.5rem;">Su carrito está vacío</p>
        <p style="font-size: 0.85rem;">Explore nuestro catálogo de autor y seleccione sus etiquetas favoritas.</p>
      </div>
    `;
    return;
  }

  if (drawerFooter) drawerFooter.style.display = 'block';

  itemsContainer.innerHTML = cartData.items.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <img src="${item.image}" alt="${item.name}" class="cart-item-img" />
      <div class="cart-item-info">
        <span class="cart-item-bodega">${item.bodega || ''}</span>
        <h4 class="cart-item-title" title="${item.name}">${item.name}</h4>
        <div class="cart-item-controls">
          <div class="qty-stepper">
            <button class="qty-btn" data-action="dec-cart" data-id="${item.id}">-</button>
            <span class="qty-val">${item.quantity}</span>
            <button class="qty-btn" data-action="inc-cart" data-id="${item.id}">+</button>
          </div>
          <span class="cart-item-price-badge">${formatCurrency(item.price * item.quantity)}</span>
          <button class="cart-item-remove-btn" data-action="rem-cart" data-id="${item.id}" title="Quitar">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  itemsContainer.querySelectorAll('[data-action="inc-cart"]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      const itm = cart.items.find(i => i.id === id);
      if (itm) cart.updateQuantity(id, itm.quantity + 1);
    };
  });
  itemsContainer.querySelectorAll('[data-action="dec-cart"]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      const itm = cart.items.find(i => i.id === id);
      if (itm) cart.updateQuantity(id, itm.quantity - 1);
    };
  });
  itemsContainer.querySelectorAll('[data-action="rem-cart"]').forEach(btn => {
    btn.onclick = () => cart.removeItem(btn.getAttribute('data-id'));
  });
}

function openCheckoutModal() {
  const user = auth.getUser();
  if (!user) {
    const drawer = document.getElementById('cartDrawerOverlay');
    if (drawer) drawer.classList.remove('active');
    sessionStorage.setItem('vlr_pending_checkout', 'true');
    showToast('Para continuar con tu compra, por favor regístrate o inicia sesión.');
    auth.openModal('register');
    return;
  }

  const modal = document.getElementById('checkoutModal');
  const drawer = document.getElementById('cartDrawerOverlay');
  if (drawer) drawer.classList.remove('active');
  if (!modal) return;

  const cartData = cart.getCartData();
  if (cartData.items.length === 0) {
    showToast('Su selección de Cava está vacía.');
    return;
  }

  const nameInput = document.getElementById('checkoutName');
  const emailInput = document.getElementById('checkoutEmail');
  const phoneInput = document.getElementById('checkoutPhone');
  const addrInput = document.getElementById('checkoutAddress');
  if (nameInput) nameInput.value = user.name || '';
  if (emailInput) emailInput.value = user.email || '';
  if (phoneInput && user.phone) phoneInput.value = user.phone;
  if (addrInput && user.address) addrInput.value = user.address;

  updatePaymentMethodUI();
  updateCheckoutSummary();
  modal.classList.add('active');
}

function updatePaymentMethodUI() {
  const isTransfer = (state.selectedPaymentMethod || '').toLowerCase().includes('transferencia');
  const transferBox = document.getElementById('transferDetailsBox');
  const submitBtn = document.getElementById('checkoutSubmitBtn') || document.querySelector('#checkoutForm button[type="submit"]');

  if (transferBox) {
    transferBox.style.display = isTransfer ? 'block' : 'none';
  }
  if (submitBtn) {
    submitBtn.textContent = isTransfer
      ? 'Ya he realizado la transferencia'
      : 'Finalizar Pedido (Abonar en el Local)';
  }
}

function updateCheckoutSummary() {
  const cartData = cart.getCartData();
  const subtotalEl = document.getElementById('checkoutSubtotal');
  const discountEl = document.getElementById('checkoutDiscount');
  const totalEl = document.getElementById('checkoutTotal');
  const countEl = document.getElementById('checkoutItemsCount');

  if (countEl) countEl.textContent = cartData.totalQuantity;
  if (subtotalEl) subtotalEl.textContent = formatCurrency(cartData.subtotal);
  if (discountEl) discountEl.textContent = '$0';
  if (totalEl) totalEl.textContent = formatCurrency(cartData.subtotal);
}

// ================= INICIALIZACIÓN =================

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

document.addEventListener('DOMContentLoaded', async () => {
  initMobileMenu();
  auth.init();
  cart.init();
  updateCartDrawerUI(cart.getCartData());

  // Leer parámetros de URL (?categoria=promos, ?subcategoria=Malbec)
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('categoria');
  const subParam = urlParams.get('subcategoria');

  if (catParam && ['promos', 'vinos', 'espumantes', 'aperitivos'].includes(catParam.toLowerCase())) {
    state.activeCategory = catParam.toLowerCase();
    const initCanonical = document.querySelector('link[rel="canonical"]');
    if (initCanonical) {
      initCanonical.setAttribute('href', `https://vinotecalarecta.com/productos.html?categoria=${catParam.toLowerCase()}`);
    }
  }

  if (subParam) {
    state.activeSubcategory = subParam;
  }

  // Cargar productos y configuración festiva
  try {
    const [products, siteConfig] = await Promise.all([
      api.getProducts(),
      api.getSiteConfig().catch(() => null)
    ]);
    if (siteConfig) {
      applySiteCustomization(siteConfig);
    }
    state.products = products;
    setCategory(state.activeCategory);
    if (subParam) setSubcategory(subParam);
    if (catParam) {
      setTimeout(() => {
        const grid = document.getElementById('productsGrid');
        if (grid) {
          const topOffset = grid.getBoundingClientRect().top + window.pageYOffset - 110;
          window.scrollTo({ top: topOffset, behavior: 'smooth' });
        }
      }, 150);
    }
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
  document.getElementById('navCartBtn')?.addEventListener('click', openCartDrawer);
  document.getElementById('floatingCartBtn')?.addEventListener('click', openCartDrawer);
  document.getElementById('cartCloseBtn')?.addEventListener('click', closeCartDrawer);
  document.getElementById('cartDrawerOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'cartDrawerOverlay') closeCartDrawer();
  });

  // Modal Post-Agregado al Carrito
  initAddedToCartModal();

  // Cerrar modales
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-overlay')?.classList.remove('active');
    });
  });

  // Formas de pago en checkout
  document.querySelectorAll('.payment-radio-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.payment-radio-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        state.selectedPaymentMethod = radio.value;
        updatePaymentMethodUI();
        updateCheckoutSummary();
      }
    });
  });

  // Copiar datos bancarios al portapapeles
  document.querySelectorAll('.btn-copy-data').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const val = btn.getAttribute('data-copy');
      if (!val) return;
      try {
        await navigator.clipboard.writeText(val);
      } catch {
        const temp = document.createElement('input');
        temp.value = val;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
      }
      const prevHtml = btn.innerHTML;
      btn.classList.add('copied');
      btn.innerHTML = `✓ Copiado`;
      showToast(`Copiado: ${val}`);
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = prevHtml;
      }, 2000);
    });
  });

  // Checkout modal trigger
  document.getElementById('cartDrawerCheckoutBtn')?.addEventListener('click', openCheckoutModal);
  document.getElementById('cartDrawerWspBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    handleWhatsAppCheckout();
  });

  // Modal WhatsApp Express
  initWspExpressModal();

  // Finalizar Compra Form
  document.getElementById('checkoutForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentUser = auth.getUser();
    if (!currentUser) {
      document.getElementById('checkoutModal')?.classList.remove('active');
      sessionStorage.setItem('vlr_pending_checkout', 'true');
      showToast('Para finalizar tu compra debes registrarte o iniciar sesión.');
      auth.openModal('register');
      return;
    }

    const cartData = cart.getCartData();
    if (cartData.items.length === 0) {
      showToast('El carrito está vacío.');
      return;
    }

    const submitBtn = document.getElementById('checkoutSubmitBtn') || document.querySelector('#checkoutForm button[type="submit"]');
    const prevBtnText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Registrando Pedido...';
    }

    const orderData = {
      customer: {
        userId: currentUser.id,
        name: document.getElementById('checkoutName').value.trim() || currentUser.name,
        email: document.getElementById('checkoutEmail').value.trim() || currentUser.email,
        phone: document.getElementById('checkoutPhone').value.trim() || currentUser.phone || '',
        address: document.getElementById('checkoutAddress').value.trim()
      },
      items: cartData.items.map(it => ({
        id: it.id,
        name: it.name,
        price: it.price,
        quantity: it.quantity
      })),
      paymentMethod: state.selectedPaymentMethod,
      subtotal: cartData.subtotal,
      discount: 0,
      shippingCost: 0,
      total: cartData.subtotal,
      notes: document.getElementById('checkoutNotes')?.value || ''
    };

    try {
      const order = await api.createOrder(orderData);
      cart.clear();
      document.getElementById('checkoutModal')?.classList.remove('active');
      closeCartDrawer();

      // Mostrar modal éxito y mensaje de WhatsApp
      const successModal = document.getElementById('orderSuccessModal');
      const detailsEl = document.getElementById('orderSuccessDetails');
      const wspBtn = document.getElementById('orderSuccessWspBtn');

      const isTransfer = (order.paymentMethod || '').toLowerCase().includes('transferencia');

      // Formato de lista de productos con cantidad, nombre y precio
      const itemsListWhatsApp = order.items.map(i =>
        `• ${i.quantity}x ${i.name} — ${formatCurrency(i.price)} c/u (${formatCurrency(i.price * i.quantity)})`
      ).join('\n');

      let wspMessage = '';
      if (isTransfer) {
        wspMessage = encodeURIComponent(
          `Hola Vinoteca La Recta! He realizado un pedido por la web.\n\n` +
          `*Número de Pedido:* #${order.id}\n` +
          `*Cliente:* ${order.customer.name}\n` +
          `*Teléfono:* ${order.customer.phone}\n` +
          `*Punto de Retiro:* Av. Recta Martinolli 8255, Argüello\n\n` +
          `*Productos comprados:*\n${itemsListWhatsApp}\n\n` +
          `*TOTAL:* ${formatCurrency(order.total)}\n` +
          `*Medio de pago efectuado:* Transferencia bancaria (Banco Macro - Alias: vinotecamartinolli.)\n\n` +
          `Adjunto el comprobante de la transferencia realizada.`
        );
      } else {
        wspMessage = encodeURIComponent(
          `Hola Vinoteca La Recta! He realizado una compra por la web.\n\n` +
          `*Número de Pedido:* #${order.id}\n` +
          `*Cliente:* ${order.customer.name}\n` +
          `*Teléfono:* ${order.customer.phone}\n` +
          `*Punto de Retiro:* Av. Recta Martinolli 8255, Argüello\n\n` +
          `*Pedido realizado:*\n${itemsListWhatsApp}\n\n` +
          `*TOTAL A ABONAR:* ${formatCurrency(order.total)}\n` +
          `*Medio de pago efectuado:* Efectivo en el local al momento de retirar\n\n` +
          `_Aviso al comercio para coordinar el retiro de mi compra. Muchas gracias!_`
        );
      }

      if (detailsEl) {
        detailsEl.innerHTML = `
          <div style="text-align: center; margin-bottom: 1.75rem;">
            <div style="width: 72px; height: 72px; border-radius: 50%; background: rgba(197, 160, 89, 0.12); border: 2px solid var(--gold-primary); display: inline-flex; align-items: center; justify-content: center; color: var(--gold-light); margin-bottom: 1.25rem;">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 style="font-family: var(--font-serif); font-size: 2.1rem; color: #fff; margin-bottom: 0.4rem;">
              ${isTransfer ? '¡Transferencia Registrada!' : '¡Compra Finalizada con Éxito!'}
            </h2>
            <span style="font-family: var(--font-brand); font-size: 0.95rem; color: var(--gold-champagne); letter-spacing: 0.15em;">NÚMERO DE ORDEN: #${order.id}</span>
            <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.85rem; line-height: 1.6;">
              Estimado/a <strong>${order.customer.name}</strong>, hemos asentado tu pedido en el sistema.
              ${isTransfer
                ? '<br><span style="color: var(--gold-champagne); font-weight: 600;">Comparte el comprobante de la misma por WhatsApp</span> para validar la transferencia y alistar tu pedido para retiro.'
                : '<br>Tus botellas quedarán listas para retirar y abonar en efectivo en nuestro local de <strong>Av. Recta Martinolli 8255</strong>.'}
            </p>
          </div>

          ${isTransfer ? `
          <div style="background: rgba(197, 160, 89, 0.08); border: 1px dashed var(--gold-primary); border-radius: 6px; padding: 1.1rem; margin-bottom: 1.25rem; font-size: 0.88rem; text-align: center;">
            <div style="color: var(--gold-champagne); font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;">Datos de Transferencia Bancaria</div>
            <div style="color: #fff; font-size: 0.95rem;"><strong>Banco Macro SA</strong> · Titular: <strong>Maria Florencia Almada</strong></div>
            <div style="color: var(--gold-light); font-family: monospace; font-size: 1rem; margin-top: 3px;">Alias: <strong>vinotecamartinolli.</strong></div>
            <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 2px;">CBU: 2850322430094253760801</div>
          </div>
          ` : ''}

          <div style="background: var(--bg-surface); border: 1px solid var(--gold-border); border-radius: 6px; padding: 1.35rem; margin-bottom: 1.5rem; font-size: 0.9rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.6rem; color: var(--text-muted);">
              <span>Medio de Pago:</span>
              <strong style="color: ${isTransfer ? 'var(--gold-champagne)' : '#fff'};">${order.paymentMethod}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.6rem; color: var(--text-muted);">
              <span>Punto de Retiro:</span>
              <strong style="color: #fff;">Av. Recta Martinolli 8255, Argüello</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 0.75rem; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 1.2rem; color: #fff;">
              <strong>Total del Pedido:</strong>
              <strong style="color: var(--gold-champagne);">${formatCurrency(order.total)}</strong>
            </div>
          </div>
        `;
      }

      if (wspBtn) {
        wspBtn.href = `https://wa.me/5493512460017?text=${wspMessage}`;
        wspBtn.innerHTML = isTransfer
          ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg> Compartir Comprobante por WhatsApp`
          : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg> Avisar a la Vinoteca por WhatsApp`;
      }

      successModal?.classList.add('active');
    } catch (err) {
      alert('Error formalizando pedido: ' + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = prevBtnText;
      }
    }
  });

  // Reanudar checkout tras login/registro y sincronizar carrito
  window.addEventListener('vlr:auth-changed', (e) => {
    updateCartDrawerUI(cart.getCartData());
    if (e.detail?.user && sessionStorage.getItem('vlr_pending_checkout') === 'true') {
      sessionStorage.removeItem('vlr_pending_checkout');
      setTimeout(() => {
        openCheckoutModal();
      }, 350);
    }
  });

  // Login / Auth Tabs
  document.getElementById('tabLoginBtn')?.addEventListener('click', () => auth.switchTab('login'));
  document.getElementById('tabRegisterBtn')?.addEventListener('click', () => auth.switchTab('register'));

  // Acceso Administrativo Oculto & Mis Pedidos
  initSecretAdminAccess();
  window.addEventListener('vlr:view-orders', () => openMyOrdersModal());

  // Login form submit (Cliente: Nombre, DNI y Teléfono)
  document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('loginName')?.value.trim();
    const dni = document.getElementById('loginDni')?.value.trim();
    const phone = document.getElementById('loginPhone')?.value.trim();
    const errEl = document.getElementById('authError');

    if (!name || !dni || !phone) {
      if (errEl) errEl.textContent = 'Por favor completa Nombre, DNI y Teléfono.';
      return;
    }

    try {
      if (errEl) errEl.textContent = 'Accediendo a tu cuenta...';
      const allUsers = await api.getUsers().catch(() => []);
      const cleanPhone = phone.replace(/\D/g, '');
      const cleanDni = dni.replace(/\D/g, '');

      const found = allUsers.find(u => {
        const uPhone = (u.phone || '').replace(/\D/g, '');
        const uDni = (u.dni || '').replace(/\D/g, '');
        return (cleanDni && uDni === cleanDni) || (cleanPhone && uPhone === cleanPhone);
      });

      let userToSet;
      if (found) {
        userToSet = { ...found, name: name || found.name, dni: dni || found.dni, phone: phone || found.phone };
      } else {
        const userEmail = `cliente_${cleanPhone || cleanDni || Date.now()}@vinotecalarecta.com.ar`;
        userToSet = {
          id: 'cli_' + Date.now().toString(36),
          name: name,
          dni: dni,
          phone: phone,
          email: userEmail,
          role: 'cliente',
          createdAt: new Date().toISOString()
        };
        api.register({
          name: name,
          dni: dni,
          phone: phone,
          email: userEmail,
          password: 'vlr_' + (cleanPhone.slice(-4) || '1234')
        }).catch(() => null);
      }

      auth.setUser(userToSet);
      auth.closeModal();
      showToast(`¡Bienvenido/a ${userToSet.name}! Sesión iniciada.`);
    } catch (err) {
      if (errEl) errEl.textContent = err.message || 'Error al iniciar sesión.';
    }
  });

  // Register form submit (Cliente: Nombre, DNI y Teléfono)
  document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName')?.value.trim();
    const dni = document.getElementById('regDni')?.value.trim();
    const phone = document.getElementById('regPhone')?.value.trim();
    const errEl = document.getElementById('authError');

    if (!name || !dni || !phone) {
      if (errEl) errEl.textContent = 'Por favor completa Nombre, DNI y Teléfono.';
      return;
    }

    try {
      if (errEl) errEl.textContent = 'Registrando cliente...';
      const cleanPhone = phone.replace(/\D/g, '');
      const cleanDni = dni.replace(/\D/g, '');
      const userEmail = `cliente_${cleanPhone || cleanDni || Date.now()}@vinotecalarecta.com.ar`;
      const newUser = {
        id: 'cli_' + Date.now().toString(36),
        name: name,
        dni: dni,
        phone: phone,
        email: userEmail,
        role: 'cliente',
        createdAt: new Date().toISOString()
      };

      auth.setUser(newUser);
      api.register({
        name: name,
        dni: dni,
        phone: phone,
        email: userEmail,
        password: 'vlr_' + (cleanPhone.slice(-4) || '1234')
      }).catch(() => null);

      auth.closeModal();
      showToast(`Cuenta creada con éxito. ¡Bienvenido/a ${newUser.name}!`);
    } catch (err) {
      if (errEl) errEl.textContent = err.message || 'Error al crear la cuenta.';
    }
  });

  // Escuchar actualizaciones de carrito
  window.addEventListener('vlr:cart-updated', (e) => {
    updateCartDrawerUI(e.detail);
  });
});
