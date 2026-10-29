// Cart state manager for Vinoteca La Recta
const CART_STORAGE_KEY = 'vlr_cart';
export const FREE_SHIPPING_THRESHOLD = 60000;

export const cart = {
  items: [],

  init() {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      this.items = saved ? JSON.parse(saved) : [];
    } catch {
      this.items = [];
    }
    this.emitChange();
  },

  save() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
    this.emitChange();
  },

  emitChange() {
    window.dispatchEvent(new CustomEvent('vlr:cart-updated', {
      detail: this.getCartData()
    }));
  },

  getCartData() {
    const subtotal = this.getSubtotal();
    const transferDiscount = Math.round(subtotal * 0.10);
    return {
      items: this.items,
      count: this.getCount(),
      totalQuantity: this.getCount(),
      subtotal,
      transferDiscount,
      total: subtotal
    };
  },

  getWhatsAppOrderUrl(user = null) {
    const formatCurrency = (amount) => new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount || 0);

    const itemsList = this.items.map(item =>
      `• ${item.quantity}x ${item.name} — ${formatCurrency(item.price * item.quantity)} (${formatCurrency(item.price)} c/u)`
    ).join('\n');

    const subtotal = this.getSubtotal();
    const transferTotal = this.getTransferTotal();

    let message = `🍷 *PEDIDO - VINOTECA LA RECTA*\n\n`;
    if (user && user.name) {
      message += `*Cliente:* ${user.name}\n`;
      if (user.phone) message += `*Teléfono:* ${user.phone}\n`;
      if (user.address) message += `*Dirección:* ${user.address}\n`;
      message += `\n`;
    }
    message += `*Detalle del Pedido:*\n${itemsList}\n\n`;
    message += `*Total:* ${formatCurrency(subtotal)}\n`;
    message += `*Abonando por Transferencia (10% OFF):* ${formatCurrency(transferTotal)}\n\n`;
    message += `_Hola! Quiero realizar este pedido desde la tienda online._`;

    return `https://wa.me/5493512460017?text=${encodeURIComponent(message)}`;
  },

  addItem(product, quantity = 1) {
    const existing = this.items.find(i => i.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        bodega: product.bodega,
        category: product.category,
        quantity: quantity
      });
    }
    this.save();
    return true;
  },

  updateQuantity(productId, newQty) {
    if (newQty <= 0) {
      this.removeItem(productId);
      return;
    }
    const item = this.items.find(i => i.id === productId);
    if (item) {
      item.quantity = newQty;
      this.save();
    }
  },

  removeItem(productId) {
    this.items = this.items.filter(i => i.id !== productId);
    this.save();
  },

  clear() {
    this.items = [];
    this.save();
  },

  getCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getSubtotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  // 10% OFF on bank transfer
  getTransferTotal() {
    const subtotal = this.getSubtotal();
    return Math.round(subtotal * 0.90);
  },

  // 3 cuotas sin interés
  getCuotasAmount(cuotas = 3) {
    const subtotal = this.getSubtotal();
    return Math.round(subtotal / cuotas);
  },

  getFreeShippingDifference() {
    const subtotal = this.getSubtotal();
    return Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  },

  isFreeShipping() {
    return this.getSubtotal() >= FREE_SHIPPING_THRESHOLD;
  }
};

cart.init();
