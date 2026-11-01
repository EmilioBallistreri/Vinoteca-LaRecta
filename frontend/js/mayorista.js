import { api } from './api.js';
import { cart } from './cart.js';
import { auth } from './auth.js';

const WHOLESALE_STORAGE_KEY = 'vlr_wholesale_cart_v1';

const state = {
  products: [],
  filteredProducts: [],
  activeCategory: 'todos',
  searchQuery: '',
  wholesaleItems: [] // [{ id, name, bodega, image, unitPrice, unitsPerBox, boxes, maxBoxes }]
};

function formatCurrency(val) {
  return '$' + Math.round(Number(val) || 0).toLocaleString('es-AR');
}

function showToast(msg) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="toast-icon">❖</span>
    <span>${msg}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 350);
  }, 3800);
}

function getDiscountRate(totalBoxes) {
  if (totalBoxes >= 12) return 0.25;
  if (totalBoxes >= 6) return 0.20;
  if (totalBoxes >= 3) return 0.15;
  if (totalBoxes >= 1) return 0.10;
  return 0.10;
}

function loadWholesaleCart() {
  try {
    const raw = localStorage.getItem(WHOLESALE_STORAGE_KEY);
    state.wholesaleItems = raw ? JSON.parse(raw) : [];
  } catch (e) {
    state.wholesaleItems = [];
  }
}

function saveWholesaleCart() {
  localStorage.setItem(WHOLESALE_STORAGE_KEY, JSON.stringify(state.wholesaleItems));
  renderWholesaleOrderPanel();
}

function addBoxesToWholesale(product, boxesToAdd = 1) {
  const unitsPerBox = Number(product.unitsPerBox) > 0 ? Number(product.unitsPerBox) : 6;
  const maxBoxes = Math.max(1, Math.floor((Number(product.stock) || 24) / unitsPerBox));

  const existing = state.wholesaleItems.find(i => i.id === product.id);
  if (existing) {
    existing.boxes = Math.min(maxBoxes, existing.boxes + boxesToAdd);
  } else {
    state.wholesaleItems.push({
      id: product.id,
      name: product.name,
      bodega: product.bodega || 'Selección de Cava',
      image: product.image,
      unitPrice: Number(product.price) || 0,
      unitsPerBox,
      boxes: Math.min(maxBoxes, boxesToAdd),
      maxBoxes
    });
  }
  saveWholesaleCart();
  showToast(`Se sumaron ${boxesToAdd} ${boxesToAdd === 1 ? 'caja cerrada' : 'cajas cerradas'} de "${product.name}" al pedido mayorista.`);
}

function updateWholesaleBoxQty(productId, newBoxes) {
  if (newBoxes <= 0) {
    state.wholesaleItems = state.wholesaleItems.filter(i => i.id !== productId);
  } else {
    const item = state.wholesaleItems.find(i => i.id === productId);
    if (item) {
      item.boxes = Math.min(item.maxBoxes || 50, newBoxes);
    }
  }
  saveWholesaleCart();
}

function getWholesaleSummary() {
  const totalBoxes = state.wholesaleItems.reduce((sum, i) => sum + i.boxes, 0);
  const totalBottles = state.wholesaleItems.reduce((sum, i) => sum + (i.boxes * i.unitsPerBox), 0);
  const subtotalList = state.wholesaleItems.reduce((sum, i) => sum + (i.unitPrice * i.unitsPerBox * i.boxes), 0);
  const discountRate = getDiscountRate(totalBoxes);
  const discountAmount = Math.round(subtotalList * discountRate);
  const finalTotal = subtotalList - discountAmount;

  return {
    totalBoxes,
    totalBottles,
    subtotalList,
    discountRate,
    discountPct: Math.round(discountRate * 100),
    discountAmount,
    finalTotal
  };
}

function applyWholesaleFilters() {
  let list = [...state.products];

  if (state.activeCategory !== 'todos') {
    list = list.filter(p => (p.category || '').toLowerCase().includes(state.activeCategory.toLowerCase()));
  }

  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.bodega && p.bodega.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.subcategory && p.subcategory.toLowerCase().includes(q))
    );
  }

  state.filteredProducts = list;
  renderWholesaleProducts();
}

function renderWholesaleProducts() {
  const grid = document.getElementById('wholesaleProductsGrid');
  if (!grid) return;

  if (!state.filteredProducts.length) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3.5rem 1rem; color: var(--text-muted); background: var(--bg-card); border: 1px solid var(--gold-border); border-radius: 12px;">
        No se encontraron etiquetas para el filtro seleccionado.
      </div>
    `;
    return;
  }

  const summary = getWholesaleSummary();
  const activeRate = summary.totalBoxes > 0 ? summary.discountRate : 0.15; // Mostrar ref 15% mayorista por defecto

  grid.innerHTML = state.filteredProducts.map(prod => {
    const unitsPerBox = Number(prod.unitsPerBox) > 0 ? Number(prod.unitsPerBox) : 6;
    const availableBoxes = Math.floor((Number(prod.stock) || 0) / unitsPerBox);
    const isOut = availableBoxes <= 0 && (Number(prod.stock) || 0) <= 0;

    const unitRetail = Number(prod.price) || 0;
    const unitWholesale = Math.round(unitRetail * (1 - activeRate));
    const boxWholesalePrice = unitWholesale * unitsPerBox;
    const boxListPrice = unitRetail * unitsPerBox;

    return `
      <article class="wholesale-prod-card" data-id="${prod.id}">
        <div class="wholesale-prod-top">
          <img src="${prod.image}" alt="${prod.name}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80';" />
          <span class="wholesale-box-badge">📦 Caja × ${unitsPerBox} u.</span>
          <span class="wholesale-stock-badge">${availableBoxes > 0 ? `${availableBoxes} cajas disp.` : `${prod.stock || 0} u. disp.`}</span>
        </div>
        <div class="wholesale-prod-body">
          <span class="wholesale-prod-bodega">${prod.bodega || prod.category}</span>
          <h3 class="wholesale-prod-title">${prod.name}</h3>

          <div class="wholesale-price-box">
            <div class="wholesale-price-row">
              <span>P. Unitario Lista:</span>
              <span style="text-decoration: line-through;">${formatCurrency(unitRetail)}</span>
            </div>
            <div class="wholesale-price-row">
              <span>P. Unitario Mayorista (${Math.round(activeRate * 100)}% OFF):</span>
              <strong style="color: var(--status-available);">${formatCurrency(unitWholesale)} c/u</strong>
            </div>
            <div class="wholesale-price-row box-total">
              <span>Valor Caja (×${unitsPerBox}):</span>
              <div>
                <span style="font-size: 0.74rem; color: var(--text-muted); text-decoration: line-through; margin-right: 0.35rem;">${formatCurrency(boxListPrice)}</span>
                <strong>${formatCurrency(boxWholesalePrice)}</strong>
              </div>
            </div>
          </div>

          <div class="wholesale-card-actions">
            <div class="qty-stepper" style="padding: 0.2rem 0.3rem;">
              <button type="button" class="qty-btn" data-action="card-dec" data-id="${prod.id}">-</button>
              <span class="qty-val" id="boxQty_${prod.id}" style="min-width: 28px; font-size: 0.85rem;">1</span>
              <button type="button" class="qty-btn" data-action="card-inc" data-id="${prod.id}">+</button>
            </div>
            <button type="button" class="wholesale-add-btn" data-action="add-box" data-id="${prod.id}" ${isOut ? 'disabled' : ''}>
              ${isOut ? 'Sin Stock' : '+ Sumar Cajas'}
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  grid.querySelectorAll('[data-action="card-inc"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const el = document.getElementById(`boxQty_${id}`);
      if (el) el.textContent = Math.min(50, (parseInt(el.textContent, 10) || 1) + 1);
    });
  });

  grid.querySelectorAll('[data-action="card-dec"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const el = document.getElementById(`boxQty_${id}`);
      if (el) el.textContent = Math.max(1, (parseInt(el.textContent, 10) || 1) - 1);
    });
  });

  grid.querySelectorAll('[data-action="add-box"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const prod = state.products.find(p => p.id === id);
      const qtyEl = document.getElementById(`boxQty_${id}`);
      const boxes = qtyEl ? (parseInt(qtyEl.textContent, 10) || 1) : 1;
      if (prod) {
        addBoxesToWholesale(prod, boxes);
        if (qtyEl) qtyEl.textContent = '1';
      }
    });
  });
}

function renderWholesaleOrderPanel() {
  const summary = getWholesaleSummary();
  const badgeEl = document.getElementById('wholesaleBoxesBadge');
  const tierStatusEl = document.getElementById('wholesaleTierStatus');
  const listEl = document.getElementById('wholesaleCartList');
  const subEl = document.getElementById('wholesaleSubtotalList');
  const discLabelEl = document.getElementById('wholesaleDiscountLabel');
  const discAmountEl = document.getElementById('wholesaleDiscountAmount');
  const totalEl = document.getElementById('wholesaleFinalTotal');

  if (badgeEl) {
    badgeEl.textContent = `${summary.totalBoxes} ${summary.totalBoxes === 1 ? 'caja' : 'cajas'} • ${summary.totalBottles} u.`;
  }

  if (tierStatusEl) {
    if (summary.totalBoxes === 0) {
      tierStatusEl.innerHTML = `📦 Sume cajas cerradas para activar su escala de descuento mayorista (hasta <strong>25% OFF</strong>).`;
    } else if (summary.totalBoxes < 3) {
      const missing = 3 - summary.totalBoxes;
      tierStatusEl.innerHTML = `✨ Escala actual: <strong>10% OFF Mayorista</strong>. Sume <strong>${missing} ${missing === 1 ? 'caja más' : 'cajas más'}</strong> para pasar al <strong>15% OFF</strong>.`;
    } else if (summary.totalBoxes < 6) {
      const missing = 6 - summary.totalBoxes;
      tierStatusEl.innerHTML = `🔥 Escala activa: <strong>15% OFF Mayorista</strong>. Sume <strong>${missing} ${missing === 1 ? 'caja más' : 'cajas más'}</strong> para alcanzar el <strong>20% OFF</strong>.`;
    } else if (summary.totalBoxes < 12) {
      const missing = 12 - summary.totalBoxes;
      tierStatusEl.innerHTML = `🚀 Escala activa: <strong>20% OFF Mayorista</strong>. Sume <strong>${missing} ${missing === 1 ? 'caja más' : 'cajas más'}</strong> para el máximo <strong>25% OFF</strong>.`;
    } else {
      tierStatusEl.innerHTML = `👑 <strong>¡Escala Máxima 25% OFF Mayorista Activada!</strong> Beneficio máximo de distribuidora aplicado.`;
    }
  }

  if (listEl) {
    if (state.wholesaleItems.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 1.5rem 0.5rem; color: var(--text-muted); font-size: 0.84rem;">
          Aún no ha sumado cajas a su pedido comercial. Seleccione las etiquetas del catálogo izquierdo.
        </div>
      `;
    } else {
      listEl.innerHTML = state.wholesaleItems.map(item => {
        const lineUnits = item.boxes * item.unitsPerBox;
        const discountedUnit = Math.round(item.unitPrice * (1 - summary.discountRate));
        const lineTotal = discountedUnit * lineUnits;
        return `
          <div class="wholesale-cart-row">
            <div class="wholesale-cart-row-info">
              <div class="wholesale-cart-row-title">${item.name}</div>
              <div class="wholesale-cart-row-meta">
                ${item.boxes} ${item.boxes === 1 ? 'caja' : 'cajas'} (${lineUnits} bot.) • ${formatCurrency(lineTotal)}
              </div>
            </div>
            <div class="qty-stepper" style="padding: 0.1rem 0.2rem;">
              <button type="button" class="qty-btn" data-waction="dec" data-id="${item.id}" style="width:22px;height:22px;">-</button>
              <span class="qty-val" style="min-width:22px;font-size:0.8rem;">${item.boxes}</span>
              <button type="button" class="qty-btn" data-waction="inc" data-id="${item.id}" style="width:22px;height:22px;">+</button>
            </div>
            <button type="button" class="cart-item-remove-btn" data-waction="rem" data-id="${item.id}" title="Quitar" style="padding: 0.2rem 0.4rem;">✕</button>
          </div>
        `;
      }).join('');

      listEl.querySelectorAll('[data-waction="inc"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const itm = state.wholesaleItems.find(i => i.id === id);
          if (itm) updateWholesaleBoxQty(id, itm.boxes + 1);
        });
      });

      listEl.querySelectorAll('[data-waction="dec"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const itm = state.wholesaleItems.find(i => i.id === id);
          if (itm) updateWholesaleBoxQty(id, itm.boxes - 1);
        });
      });

      listEl.querySelectorAll('[data-waction="rem"]').forEach(btn => {
        btn.addEventListener('click', () => {
          updateWholesaleBoxQty(btn.getAttribute('data-id'), 0);
        });
      });
    }
  }

  if (subEl) subEl.textContent = formatCurrency(summary.subtotalList);
  if (discLabelEl) discLabelEl.textContent = `Bonificación Mayorista (${summary.discountPct}%):`;
  if (discAmountEl) discAmountEl.textContent = `-${formatCurrency(summary.discountAmount)}`;
  if (totalEl) totalEl.textContent = formatCurrency(summary.finalTotal);

  // Refresh catalog prices if discount tier changed
  renderWholesaleProducts();
}

function getBusinessFormData() {
  return {
    companyName: document.getElementById('bizCompanyName')?.value.trim() || '',
    segment: document.getElementById('bizSegment')?.value || 'Comercio',
    cuit: document.getElementById('bizCuit')?.value.trim() || '',
    ivaCondition: document.getElementById('bizIva')?.value || 'Responsable Inscripto',
    contactName: document.getElementById('bizContactName')?.value.trim() || '',
    phone: document.getElementById('bizPhone')?.value.trim() || '',
    email: document.getElementById('bizEmail')?.value.trim() || '',
    address: document.getElementById('bizAddress')?.value.trim() || '',
    paymentMethod: document.getElementById('bizPayment')?.value || 'Transferencia Bancaria Mayorista',
    notes: document.getElementById('bizNotes')?.value.trim() || ''
  };
}

function buildWholesaleWhatsAppUrl(orderId = null) {
  const summary = getWholesaleSummary();
  const biz = getBusinessFormData();

  let msg = `🏢 *PEDIDO MAYORISTA COMERCIAL — VINOTECA LA RECTA*\n`;
  if (orderId) msg += `*Orden Web:* #${orderId}\n`;
  msg += `*Comercio / Razón Social:* ${biz.companyName || 'A confirmar'}\n`;
  msg += `*Rubro:* ${biz.segment}\n`;
  if (biz.cuit) msg += `*CUIT:* ${biz.cuit} (${biz.ivaCondition})\n`;
  if (biz.contactName) msg += `*Contacto:* ${biz.contactName}\n`;
  if (biz.phone) msg += `*Teléfono:* ${biz.phone}\n`;
  if (biz.address) msg += `*Dirección de Entrega:* ${biz.address}\n`;
  msg += `*Modalidad de Pago:* ${biz.paymentMethod}\n\n`;

  msg += `*DETALLE DE CAJAS CERRADAS (${summary.totalBoxes} cajas / ${summary.totalBottles} botellas):*\n`;
  state.wholesaleItems.forEach(item => {
    const totalUnits = item.boxes * item.unitsPerBox;
    const unitDisc = Math.round(item.unitPrice * (1 - summary.discountRate));
    const lineSub = unitDisc * totalUnits;
    msg += `• *${item.boxes}x Caja* (×${item.unitsPerBox} u. = ${totalUnits} bot.) — *${item.name}* | ${formatCurrency(lineSub)}\n`;
  });

  msg += `\n*Subtotal Lista:* ${formatCurrency(summary.subtotalList)}\n`;
  msg += `*Bonificación Mayorista (${summary.discountPct}% OFF):* -${formatCurrency(summary.discountAmount)}\n`;
  msg += `*TOTAL FINAL MAYORISTA:* *${formatCurrency(summary.finalTotal)}*\n`;
  if (biz.notes) msg += `\n*Notas:* ${biz.notes}\n`;

  return `https://wa.me/5493512460017?text=${encodeURIComponent(msg)}`;
}

function setupEvents() {
  // Search input
  document.getElementById('wholesaleSearchInput')?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    applyWholesaleFilters();
  });

  // Category pills
  document.querySelectorAll('.wholesale-cat-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.wholesale-cat-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.activeCategory = pill.getAttribute('data-cat') || 'todos';
      applyWholesaleFilters();
    });
  });

  // Pre-fill user data if logged in
  const user = auth.getUser();
  if (user) {
    const contactEl = document.getElementById('bizContactName');
    const emailEl = document.getElementById('bizEmail');
    const phoneEl = document.getElementById('bizPhone');
    const addrEl = document.getElementById('bizAddress');
    if (contactEl && !contactEl.value) contactEl.value = user.name || '';
    if (emailEl && !emailEl.value) emailEl.value = user.email || '';
    if (phoneEl && !phoneEl.value && user.phone) phoneEl.value = user.phone;
    if (addrEl && !addrEl.value && user.address) addrEl.value = user.address;
  }

  // Submit Wholesale Order via Web
  document.getElementById('wholesaleOrderForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.wholesaleItems.length === 0) {
      showToast('Agregue al menos 1 caja cerrada al pedido mayorista antes de confirmar.');
      return;
    }

    const submitBtn = document.getElementById('submitWholesaleWebBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'REGISTRANDO ORDEN MAYORISTA...';
    }

    try {
      const summary = getWholesaleSummary();
      const biz = getBusinessFormData();
      const wspUrlPre = buildWholesaleWhatsAppUrl('MAY');

      const orderPayload = {
        isWholesale: true,
        businessInfo: {
          companyName: biz.companyName,
          segment: biz.segment,
          cuit: biz.cuit,
          ivaCondition: biz.ivaCondition,
          totalBoxes: summary.totalBoxes,
          totalBottles: summary.totalBottles,
          discountPct: summary.discountPct
        },
        customer: {
          name: `${biz.companyName} (${biz.contactName})`,
          email: biz.email,
          phone: biz.phone,
          address: biz.address
        },
        items: state.wholesaleItems.map(item => {
          const totalUnits = item.boxes * item.unitsPerBox;
          const unitDisc = Math.round(item.unitPrice * (1 - summary.discountRate));
          return {
            id: item.id,
            name: `[CAJA ×${item.unitsPerBox}] ${item.name} (${item.boxes} cajas)`,
            price: unitDisc,
            quantity: totalUnits,
            boxes: item.boxes,
            unitsPerBox: item.unitsPerBox
          };
        }),
        paymentMethod: `${biz.paymentMethod} (${summary.discountPct}% OFF Mayorista)`,
        subtotal: summary.subtotalList,
        discount: summary.discountAmount,
        shippingCost: 0,
        total: summary.finalTotal,
        notes: `[COMERCIO: ${biz.companyName} | RUBRO: ${biz.segment} | CUIT: ${biz.cuit} | ${biz.ivaCondition}] ${biz.notes}`
      };

      const createdOrder = await api.createOrder(orderPayload);
      const finalWspUrl = buildWholesaleWhatsAppUrl(createdOrder.id);

      // Clear wholesale cart
      state.wholesaleItems = [];
      saveWholesaleCart();

      const detailsEl = document.getElementById('wholesaleSuccessDetails');
      const wspBtn = document.getElementById('wholesaleSuccessWspBtn');
      const modal = document.getElementById('wholesaleSuccessModal');

      if (detailsEl) {
        detailsEl.innerHTML = `
          <div style="text-align: center;">
            <span class="wholesale-badge">Orden Comercial Registrada</span>
            <h2 style="font-family: var(--font-serif); font-size: 2rem; color: #fff; margin: 0.5rem 0;">Pedido Mayorista #${createdOrder.id}</h2>
            <p style="color: var(--text-muted); font-size: 0.92rem; line-height: 1.6;">
              Hemos registrado el pedido mayorista para <strong>${biz.companyName}</strong> (${summary.totalBoxes} cajas cerradas / ${summary.totalBottles} unidades) por un total de <strong style="color: var(--gold-champagne);">${formatCurrency(summary.finalTotal)}</strong>.
            </p>
          </div>
        `;
      }
      if (wspBtn) wspBtn.href = finalWspUrl;
      if (modal) modal.classList.add('active');
    } catch (err) {
      showToast('Error al registrar el pedido mayorista: ' + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'TERMINAR PEDIDO MAYORISTA POR LA WEB &rarr;';
      }
    }
  });

  // Submit Wholesale Order via WhatsApp directly
  document.getElementById('submitWholesaleWspBtn')?.addEventListener('click', () => {
    if (state.wholesaleItems.length === 0) {
      showToast('Agregue al menos 1 caja cerrada al pedido mayorista para enviarlo por WhatsApp.');
      return;
    }
    const url = buildWholesaleWhatsAppUrl();
    window.open(url, '_blank', 'noopener,noreferrer');
  });

  document.getElementById('closeWholesaleSuccessBtn')?.addEventListener('click', () => {
    document.getElementById('wholesaleSuccessModal')?.classList.remove('active');
  });

  // Auth modal tabs & forms
  document.getElementById('tabLoginBtn')?.addEventListener('click', () => auth.switchTab('login'));
  document.getElementById('tabRegisterBtn')?.addEventListener('click', () => auth.switchTab('register'));

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
      showToast(`¡Bienvenido/a ${res.user.name}!`);
    } catch (err) {
      if (errEl) errEl.textContent = err.message;
    }
  });

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
      showToast(`Cuenta creada exitosamente. Bienvenido/a ${res.user.name}.`);
    } catch (err) {
      if (errEl) errEl.textContent = err.message;
    }
  });

  // Retail Cart Drawer open/close
  document.getElementById('navCartBtn')?.addEventListener('click', () => {
    document.getElementById('cartDrawerOverlay')?.classList.add('active');
  });
  document.getElementById('cartCloseBtn')?.addEventListener('click', () => {
    document.getElementById('cartDrawerOverlay')?.classList.remove('active');
  });
}

async function initWholesalePage() {
  auth.updateHeaderUI();
  loadWholesaleCart();
  setupEvents();

  const navBadge = document.getElementById('navCartCount');
  if (navBadge) navBadge.textContent = cart.getCount();

  try {
    const products = await api.getProducts();
    state.products = Array.isArray(products) ? products : [];
    applyWholesaleFilters();
    renderWholesaleOrderPanel();
  } catch (err) {
    console.error('Error cargando catálogo mayorista:', err);
  }
}

document.addEventListener('DOMContentLoaded', initWholesalePage);
