const fs = require('fs');
const path = require('path');
const os = require('os');

const isVercel = Boolean(process.env.VERCEL);
const STORE_PATH = isVercel
  ? path.join(os.tmpdir(), 'store.json')
  : path.join(__dirname, 'store.json');
const SEED_PATH = path.join(__dirname, 'store.json');


// Default initial database seeds
const DEFAULT_STORE = {
  users: [
    {
      id: 'admin-1',
      name: 'Vinoteca La Recta (Principal)',
      email: 'vinotecalarecta7@gmail.com',
      password: 'AdminRecta2024!',
      role: 'superadministrador',
      createdAt: '2024-01-15T10:00:00.000Z',
      lastLogin: new Date().toISOString()
    },
    {
      id: 'admin-2',
      name: 'Flor Almada',
      email: 'floralmada07@gmail.com',
      password: 'AdminRecta2024!',
      role: 'superadministrador',
      createdAt: '2024-01-15T10:00:00.000Z',
      lastLogin: new Date().toISOString()
    },
    {
      id: 'admin-3',
      name: 'Martín Ballistreri',
      email: 'martinballistreri07@gmail.com',
      password: 'AdminRecta2024!',
      role: 'superadministrador',
      createdAt: '2024-01-15T10:00:00.000Z',
      lastLogin: new Date().toISOString()
    },
    {
      id: 'cust-1',
      name: 'Gonzalo Ramírez',
      email: 'gonzalo.ramirez@gmail.com',
      password: 'Cliente2024!',
      phone: '+54 351 555-1234',
      address: 'Av. Recta Martinolli 6840, Argüello, Córdoba',
      role: 'cliente',
      createdAt: '2024-02-10T14:30:00.000Z'
    },
    {
      id: 'cust-2',
      name: 'Luciana Morales',
      email: 'luciana.morales@yahoo.com.ar',
      password: 'Cliente2024!',
      phone: '+54 351 444-9876',
      address: 'Country Las Delicias, Córdoba',
      role: 'cliente',
      createdAt: '2024-02-18T18:15:00.000Z'
    }
  ],
  products: [
    // PROMOS
    {
      id: 'prod-promo-1',
      name: 'Combo Degustación Gran Malbec (3 Botellas)',
      category: 'promos',
      subcategory: 'Vinos',
      bodega: 'Catena Zapata & Rutini',
      price: 68500,
      originalPrice: 84000,
      discount: 18,
      stock: 14,
      minStock: 5,
      isFeatured: true,
      badge: 'PROMO 18% OFF',
      image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
      description: 'Selección premium: 1 D.V. Catena Cabernet-Malbec, 1 Rutini Single Vineyard y 1 Angélica Zapata. Incluye estuche de madera de regalo.'
    },
    {
      id: 'prod-promo-2',
      name: 'Dúo Espumantes Chandon + 2 Copas de Cristal',
      category: 'promos',
      subcategory: 'Espumantes',
      bodega: 'Bodegas Chandon',
      price: 36200,
      originalPrice: 45000,
      discount: 20,
      stock: 9,
      minStock: 4,
      isFeatured: true,
      badge: 'PROMO 20% OFF',
      image: 'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?auto=format&fit=crop&w=800&q=80',
      description: '2 Botellas Chandon Extra Brut 750ml acompañadas de dos copas de cristal grabadas Vinoteca La Recta.'
    },
    {
      id: 'prod-promo-3',
      name: 'Box Aperitivos: Gin Hendrick\'s + 4 Tónicas Britvic',
      category: 'promos',
      subcategory: 'Aperitivos',
      bodega: 'Hendrick\'s Distillery',
      price: 52000,
      originalPrice: 62000,
      discount: 16,
      stock: 6,
      minStock: 3,
      isFeatured: true,
      badge: 'OFERTA ESPECIAL',
      image: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=800&q=80',
      description: 'El kit perfecto para los amantes del Gin Tonic clásico. Botella 700ml con botánicos seleccionados y tónicas premium.'
    },
    {
      id: 'prod-promo-4',
      name: 'Pack 6x5 Rutini Cabernet Malbec',
      category: 'promos',
      subcategory: 'Vinos',
      bodega: 'Rutini Wines',
      price: 97500,
      originalPrice: 117000,
      discount: 17,
      stock: 8,
      minStock: 3,
      isFeatured: false,
      badge: 'LLEVÁS 6 PAGÁS 5',
      image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80',
      description: 'Caja cerrada de 6 unidades pagando solamente 5. Ideal para cava o celebraciones especiales.'
    },

    // VINOS
    {
      id: 'prod-vino-1',
      name: 'Catena Zapata Malbec Argentino 2020',
      category: 'vinos',
      subcategory: 'Tinto',
      bodega: 'Catena Zapata',
      price: 112000,
      originalPrice: null,
      discount: 0,
      stock: 12,
      minStock: 4,
      isFeatured: true,
      badge: 'ÍCONO',
      image: 'https://images.unsplash.com/photo-1558001373-7b93ee48ffa0?auto=format&fit=crop&w=800&q=80',
      description: 'La máxima expresión del Malbec argentino. Viñedos históricos Nicasia y Adrianna. Crianza de 24 meses en roble francés.'
    },
    {
      id: 'prod-vino-2',
      name: 'El Enemigo Cabernet Franc 2021',
      category: 'vinos',
      subcategory: 'Tinto',
      bodega: 'Aleanna (Alejandro Vigil)',
      price: 28900,
      originalPrice: null,
      discount: 0,
      stock: 18,
      minStock: 5,
      isFeatured: true,
      badge: '94 PTS PARKER',
      image: 'https://images.unsplash.com/photo-1586370434639-0fe43b2d32e6?auto=format&fit=crop&w=800&q=80',
      description: 'Gualtallary, Mendoza. Notas especiadas, taninos finos y frescura vibrante característica de los viñedos de altura.'
    },
    {
      id: 'prod-vino-3',
      name: 'Rutini Encuentro Malbec 750ml',
      category: 'vinos',
      subcategory: 'Tinto',
      bodega: 'Rutini Wines',
      price: 19500,
      originalPrice: 22000,
      discount: 11,
      stock: 24,
      minStock: 6,
      isFeatured: false,
      badge: 'RECOMENDADO',
      image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
      description: 'Gran estructura, notas de frutas rojas maduras, vainilla y chocolate aportados por el roble.'
    },
    {
      id: 'prod-vino-4',
      name: 'Luigi Bosca De Sangre White Blend',
      category: 'vinos',
      subcategory: 'Blanco',
      bodega: 'Luigi Bosca',
      price: 24800,
      originalPrice: null,
      discount: 0,
      stock: 10,
      minStock: 4,
      isFeatured: false,
      badge: null,
      image: 'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?auto=format&fit=crop&w=800&q=80',
      description: 'Blend de Chardonnay, Semillón y Sauvignon Blanc. Complejo, untuoso y con acidez equilibrada.'
    },
    {
      id: 'prod-vino-5',
      name: 'Angélica Zapata Cabernet Franc Alta',
      category: 'vinos',
      subcategory: 'Tinto',
      bodega: 'Catena Zapata',
      price: 34500,
      originalPrice: null,
      discount: 0,
      stock: 7,
      minStock: 3,
      isFeatured: true,
      badge: 'ALTA GAMA',
      image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80',
      description: 'Elegancia pura de los viñedos La Pirámide. Aromas a grosellas y cedro, final persistente.'
    },

    // ESPUMANTES
    {
      id: 'prod-espu-1',
      name: 'Baron B Extra Brut Cuvée Spéciale',
      category: 'espumantes',
      subcategory: 'Cuvée Prestige',
      bodega: 'Baron B',
      price: 31000,
      originalPrice: null,
      discount: 0,
      stock: 15,
      minStock: 4,
      isFeatured: true,
      badge: 'PRESTIGE',
      image: 'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?auto=format&fit=crop&w=800&q=80',
      description: 'Elaborado bajo el método tradicional champenoise con uvas Chardonnay y Pinot Noir de altura.'
    },
    {
      id: 'prod-espu-2',
      name: 'Chandon Apéritif 750ml',
      category: 'espumantes',
      subcategory: 'Apéritif',
      bodega: 'Chandon',
      price: 14900,
      originalPrice: 17000,
      discount: 12,
      stock: 22,
      minStock: 6,
      isFeatured: false,
      badge: 'TENDENCIA',
      image: 'https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&w=800&q=80',
      description: 'Maceración de naranjas amargas y hierbas aromáticas. Servir con hielo y piel de naranja.'
    },
    {
      id: 'prod-espu-3',
      name: 'D.V. Catena Nature Método Tradicional',
      category: 'espumantes',
      subcategory: 'Nature',
      bodega: 'Catena Zapata',
      price: 26500,
      originalPrice: null,
      discount: 0,
      stock: 11,
      minStock: 4,
      isFeatured: false,
      badge: null,
      image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
      description: '30 meses sobre borras. Burbuja finísima, notas de pan tostado, brioche y frutos secos.'
    },

    // WHISKYS
    {
      id: 'prod-whisky-1',
      name: 'The Macallan Double Cask 12 Años 700ml',
      category: 'whiskys',
      subcategory: 'Single Malt',
      bodega: 'The Macallan Distillers (Escocia)',
      price: 135000,
      originalPrice: 150000,
      discount: 10,
      stock: 5,
      minStock: 2,
      isFeatured: true,
      badge: 'SINGLE MALT',
      image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=800&q=80',
      description: 'Madurado en barricas de roble americano y europeo sazonadas con jerez oloroso. Miel, cítricos y jengibre.'
    },
    {
      id: 'prod-whisky-2',
      name: 'Johnnie Walker Black Label 12 Años 1 Litro',
      category: 'whiskys',
      subcategory: 'Blended Scotch',
      bodega: 'Johnnie Walker',
      price: 43000,
      originalPrice: null,
      discount: 0,
      stock: 16,
      minStock: 5,
      isFeatured: false,
      badge: 'CLÁSICO',
      image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=800&q=80',
      description: 'El blend escocés por excelencia. Rico, suave y con ese característico final ahumado.'
    },
    {
      id: 'prod-whisky-3',
      name: 'Jameson Irish Whiskey Black Barrel 750ml',
      category: 'whiskys',
      subcategory: 'Irish Whiskey',
      bodega: 'Jameson',
      price: 38900,
      originalPrice: null,
      discount: 0,
      stock: 9,
      minStock: 3,
      isFeatured: false,
      badge: null,
      image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=800&q=80',
      description: 'Triple destilación con añejamiento en barricas de roble carbonizadas dos veces.'
    },

    // APERITIVOS
    {
      id: 'prod-aper-1',
      name: 'Gin Hendrick\'s Original 700ml (Escocia)',
      category: 'aperitivos',
      subcategory: 'Gin',
      bodega: 'William Grant & Sons',
      price: 48900,
      originalPrice: null,
      discount: 0,
      stock: 14,
      minStock: 4,
      isFeatured: true,
      badge: 'TOP SELLER',
      image: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=800&q=80',
      description: 'Destilado con infusión de pepino y pétalos de rosa búlgara. Perfecto con tónica y rodaja de pepino.'
    },
    {
      id: 'prod-aper-2',
      name: 'Vermut Antica Formula Carpano 1 Litro',
      category: 'aperitivos',
      subcategory: 'Vermut Rosso',
      bodega: 'Fratelli Branca',
      price: 36000,
      originalPrice: null,
      discount: 0,
      stock: 8,
      minStock: 3,
      isFeatured: false,
      badge: 'ARTESANAL',
      image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
      description: 'El rey de los vermuts italianos. Notas de vainilla de Madagascar, cacao y azafrán.'
    },
    {
      id: 'prod-aper-3',
      name: 'Fernet Branca Edición Especial 1 Litro',
      category: 'aperitivos',
      subcategory: 'Amargo',
      bodega: 'Fratelli Branca',
      price: 15800,
      originalPrice: 17500,
      discount: 10,
      stock: 35,
      minStock: 10,
      isFeatured: false,
      badge: 'CÓRDOBA',
      image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
      description: 'La tradición cordobesa indiscutible. Receta secreta de 27 hierbas recolectadas en 4 continentes.'
    },

    // DELICATESSEN
    {
      id: 'prod-deli-1',
      name: 'Jamón Crudo Reserva 18 Meses Feteado al Vacío 200g',
      category: 'delicatessen',
      subcategory: 'Chacinados',
      bodega: 'Cabaña Las Dinas',
      price: 16500,
      originalPrice: null,
      discount: 0,
      stock: 20,
      minStock: 5,
      isFeatured: true,
      badge: 'GOURMET',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      description: 'Curación artesanal en Tandil. Feteado ultra fino, veteado de grasa noble y aroma suave.'
    },
    {
      id: 'prod-deli-2',
      name: 'Aceite de Oliva Zuelo Virgen Extra Primer Prensado 500ml',
      category: 'delicatessen',
      subcategory: 'Olivas & Aceites',
      bodega: 'Familia Zuccardi',
      price: 14200,
      originalPrice: null,
      discount: 0,
      stock: 18,
      minStock: 5,
      isFeatured: false,
      badge: null,
      image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80',
      description: 'Cosecha temprana en Maipú, Mendoza. Notas herbales a tomate verde y manzana, amargor sutil.'
    },
    {
      id: 'prod-deli-3',
      name: 'Queso Parmigiano Reggiano DOP Cuña 250g',
      category: 'delicatessen',
      subcategory: 'Quesos de Autor',
      bodega: 'Importado de Parma, Italia',
      price: 22800,
      originalPrice: null,
      discount: 0,
      stock: 12,
      minStock: 3,
      isFeatured: false,
      badge: 'D.O.P. ITALIA',
      image: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=800&q=80',
      description: '24 meses de maduración. Textura granulada con cristales de tirosina, sabor umami profundo.'
    }
  ],
  orders: [
    {
      id: 'ORD-7001',
      customer: {
        name: 'Gonzalo Ramírez',
        email: 'gonzalo.ramirez@gmail.com',
        phone: '+54 351 555-1234',
        address: 'Av. Recta Martinolli 6840, Argüello, Córdoba'
      },
      items: [
        { id: 'prod-vino-1', name: 'Catena Zapata Malbec Argentino 2020', price: 112000, quantity: 1 },
        { id: 'prod-promo-2', name: 'Dúo Espumantes Chandon + 2 Copas', price: 36200, quantity: 1 }
      ],
      paymentMethod: 'Transferencia Bancaria (10% OFF)',
      subtotal: 148200,
      discount: 14820,
      shippingCost: 0,
      total: 133380,
      status: 'En preparación',
      notes: 'Entregar por la tarde después de las 16hs.',
      createdAt: '2024-03-01T15:30:00.000Z'
    },
    {
      id: 'ORD-7002',
      customer: {
        name: 'Luciana Morales',
        email: 'luciana.morales@yahoo.com.ar',
        phone: '+54 351 444-9876',
        address: 'Country Las Delicias, Lote 42, Córdoba'
      },
      items: [
        { id: 'prod-promo-1', name: 'Combo Degustación Gran Malbec', price: 68500, quantity: 2 },
        { id: 'prod-deli-1', name: 'Jamón Crudo Reserva 18 Meses', price: 16500, quantity: 2 }
      ],
      paymentMethod: '3 Cuotas Sin Interés',
      subtotal: 170000,
      discount: 0,
      shippingCost: 0,
      total: 170000,
      status: 'Enviado',
      notes: 'Dejar en guardia si no responde el timbre.',
      createdAt: '2024-03-02T11:20:00.000Z'
    },
    {
      id: 'ORD-7003',
      customer: {
        name: 'Carlos Benítez',
        email: 'carlos.benitez@outlook.com',
        phone: '+54 351 222-3344',
        address: 'Villa Belgrano, Córdoba'
      },
      items: [
        { id: 'prod-whisky-1', name: 'The Macallan Double Cask 12 Años', price: 135000, quantity: 1 }
      ],
      paymentMethod: 'Efectivo contra entrega',
      subtotal: 135000,
      discount: 0,
      shippingCost: 0,
      total: 135000,
      status: 'Completado',
      notes: 'Llamar antes de llegar.',
      createdAt: '2024-02-28T09:15:00.000Z'
    }
  ],
  activity: [
    {
      id: 'act-1',
      timestamp: '2024-03-02T14:10:00.000Z',
      user: 'floralmada07@gmail.com',
      userName: 'Flor Almada',
      role: 'superadministrador',
      action: 'STOCK_UPDATE',
      description: 'Actualizó stock de Catena Zapata Malbec Argentino (+6 unidades)',
      badgeColor: 'gold'
    },
    {
      id: 'act-2',
      timestamp: '2024-03-02T11:22:00.000Z',
      user: 'martinballistreri07@gmail.com',
      userName: 'Martín Ballistreri',
      role: 'superadministrador',
      action: 'ORDER_STATUS',
      description: 'Marcó pedido #ORD-7002 como ENVIADO con cadete privado',
      badgeColor: 'blue'
    },
    {
      id: 'act-3',
      timestamp: '2024-03-01T15:32:00.000Z',
      user: 'vinotecalarecta7@gmail.com',
      userName: 'Vinoteca La Recta (Principal)',
      role: 'superadministrador',
      action: 'NEW_ORDER',
      description: 'Ingresó nuevo pedido #ORD-7001 por $133.380 (Gonzalo Ramírez)',
      badgeColor: 'green'
    },
    {
      id: 'act-4',
      timestamp: '2024-03-01T09:00:00.000Z',
      user: 'vinotecalarecta7@gmail.com',
      userName: 'Vinoteca La Recta (Principal)',
      role: 'superadministrador',
      action: 'ADMIN_LOGIN',
      description: 'Inicio de sesión exitoso desde panel administrativo',
      badgeColor: 'purple'
    }
  ]
};

// Ensure data file exists
function initStore() {
  if (!fs.existsSync(STORE_PATH)) {
    let initialData = DEFAULT_STORE;
    if (fs.existsSync(SEED_PATH)) {
      try {
        const raw = fs.readFileSync(SEED_PATH, 'utf8');
        initialData = JSON.parse(raw);
      } catch (e) {
        initialData = DEFAULT_STORE;
      }
    }
    try {
      fs.writeFileSync(STORE_PATH, JSON.stringify(initialData, null, 2), 'utf8');
    } catch (e) {
      console.warn('Could not write initial store to STORE_PATH:', e.message);
    }
  }
}

function readStore() {
  initStore();
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      return JSON.parse(raw);
    }
    if (fs.existsSync(SEED_PATH)) {
      const raw = fs.readFileSync(SEED_PATH, 'utf8');
      return JSON.parse(raw);
    }
    return DEFAULT_STORE;
  } catch (err) {
    console.error('Error reading store, falling back to defaults:', err.message);
    return DEFAULT_STORE;
  }
}

function writeStore(data) {
  try {
    const tempPath = STORE_PATH + '.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, STORE_PATH);
  } catch (err) {
    console.error('Error writing store:', err.message);
  }
}


module.exports = {
  // PRODUCTS
  getProducts(filter = {}) {
    const store = readStore();
    let prods = [...store.products];

    if (filter.category && filter.category !== 'todos') {
      prods = prods.filter(p => p.category.toLowerCase() === filter.category.toLowerCase());
    }

    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      prods = prods.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.bodega && p.bodega.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(q))
      );
    }

    if (filter.isFeatured) {
      prods = prods.filter(p => p.isFeatured);
    }

    if (filter.promoOnly) {
      prods = prods.filter(p => p.category === 'promos' || (p.discount && p.discount > 0));
    }

    return prods;
  },

  getProductById(id) {
    const store = readStore();
    return store.products.find(p => p.id === id);
  },

  createProduct(data, user) {
    const store = readStore();
    const newProduct = {
      id: 'prod-' + Date.now(),
      name: data.name,
      category: data.category || 'vinos',
      subcategory: data.subcategory || '',
      bodega: data.bodega || '',
      price: Number(data.price) || 0,
      originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
      discount: Number(data.discount) || 0,
      stock: Number(data.stock) || 0,
      minStock: Number(data.minStock) || 3,
      isFeatured: Boolean(data.isFeatured),
      badge: data.badge || null,
      image: data.image || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
      description: data.description || '',
      createdAt: new Date().toISOString()
    };
    store.products.unshift(newProduct);

    // Activity log
    this.logActivity({
      user: user?.email || 'admin',
      userName: user?.name || 'Administrador',
      role: user?.role || 'superadministrador',
      action: 'PRODUCT_CREATED',
      description: `Creó el producto "${newProduct.name}" (Stock: ${newProduct.stock})`,
      badgeColor: 'green'
    }, store);

    writeStore(store);
    return newProduct;
  },

  updateProduct(id, updates, user) {
    const store = readStore();
    const index = store.products.findIndex(p => p.id === id);
    if (index === -1) return null;

    const old = store.products[index];
    store.products[index] = {
      ...old,
      ...updates,
      price: updates.price !== undefined ? Number(updates.price) : old.price,
      discount: updates.discount !== undefined ? Number(updates.discount) : old.discount,
      stock: updates.stock !== undefined ? Number(updates.stock) : old.stock,
      minStock: updates.minStock !== undefined ? Number(updates.minStock) : old.minStock,
      updatedAt: new Date().toISOString()
    };

    this.logActivity({
      user: user?.email || 'admin',
      userName: user?.name || 'Administrador',
      role: user?.role || 'superadministrador',
      action: 'PRODUCT_UPDATED',
      description: `Modificó datos del producto "${store.products[index].name}"`,
      badgeColor: 'blue'
    }, store);

    writeStore(store);
    return store.products[index];
  },

  updateStock(id, newStock, user) {
    const store = readStore();
    const index = store.products.findIndex(p => p.id === id);
    if (index === -1) return null;

    const oldStock = store.products[index].stock;
    store.products[index].stock = Number(newStock);
    store.products[index].updatedAt = new Date().toISOString();

    this.logActivity({
      user: user?.email || 'admin',
      userName: user?.name || 'Administrador',
      role: user?.role || 'superadministrador',
      action: 'STOCK_UPDATE',
      description: `Ajustó stock de "${store.products[index].name}" de ${oldStock} a ${newStock} un.`,
      badgeColor: 'gold'
    }, store);

    writeStore(store);
    return store.products[index];
  },

  deleteProduct(id, user) {
    const store = readStore();
    const prod = store.products.find(p => p.id === id);
    if (!prod) return false;

    store.products = store.products.filter(p => p.id !== id);

    this.logActivity({
      user: user?.email || 'admin',
      userName: user?.name || 'Administrador',
      role: user?.role || 'superadministrador',
      action: 'PRODUCT_DELETED',
      description: `Eliminó el producto "${prod.name}"`,
      badgeColor: 'red'
    }, store);

    writeStore(store);
    return true;
  },

  // USERS & AUTH
  getUsers() {
    const store = readStore();
    // Return users without password hash/string for safety
    return store.users.map(({ password, ...u }) => u);
  },

  findUserByEmail(email) {
    const store = readStore();
    return store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  authenticate(email, password) {
    const store = readStore();
    const user = store.users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) return null;

    // Record login activity
    user.lastLogin = new Date().toISOString();
    this.logActivity({
      user: user.email,
      userName: user.name,
      role: user.role,
      action: user.role.includes('admin') ? 'ADMIN_LOGIN' : 'CLIENT_LOGIN',
      description: `Ingresó al sistema (${user.role})`,
      badgeColor: user.role.includes('admin') ? 'purple' : 'gray'
    }, store);

    writeStore(store);
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  registerClient(data) {
    const store = readStore();
    const existing = store.users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      throw new Error('El correo electrónico ya está registrado.');
    }

    const newUser = {
      id: 'cust-' + Date.now(),
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone || '',
      address: data.address || '',
      role: 'cliente',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    store.users.push(newUser);

    this.logActivity({
      user: newUser.email,
      userName: newUser.name,
      role: 'cliente',
      action: 'CLIENT_REGISTER',
      description: `Nuevo cliente registrado: ${newUser.name} (${newUser.email})`,
      badgeColor: 'green'
    }, store);

    writeStore(store);
    const { password: _, ...safeUser } = newUser;
    return safeUser;
  },

  addAdmin(data, performingUser) {
    const store = readStore();
    const existing = store.users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      throw new Error('Ya existe un usuario con este correo electrónico.');
    }

    const newAdmin = {
      id: 'admin-' + Date.now(),
      name: data.name,
      email: data.email,
      password: data.password || 'AdminRecta2024!',
      role: data.role || 'administrador',
      createdAt: new Date().toISOString()
    };

    store.users.push(newAdmin);

    this.logActivity({
      user: performingUser?.email || 'admin',
      userName: performingUser?.name || 'Administrador',
      role: performingUser?.role || 'superadministrador',
      action: 'ADMIN_CREATED',
      description: `Creó acceso administrativo para ${newAdmin.name} (${newAdmin.email}) con rol [${newAdmin.role}]`,
      badgeColor: 'gold'
    }, store);

    writeStore(store);
    const { password: _, ...safeAdmin } = newAdmin;
    return safeAdmin;
  },

  deleteUser(id, performingUser) {
    const store = readStore();
    const user = store.users.find(u => u.id === id);
    if (!user) return false;

    // Prevent deleting the main superadmin
    if (user.email === 'vinotecalarecta7@gmail.com') {
      throw new Error('No es posible eliminar al Superadministrador principal.');
    }

    store.users = store.users.filter(u => u.id !== id);

    this.logActivity({
      user: performingUser?.email || 'admin',
      userName: performingUser?.name || 'Administrador',
      role: performingUser?.role || 'superadministrador',
      action: 'USER_DELETED',
      description: `Eliminó el usuario ${user.name} (${user.email})`,
      badgeColor: 'red'
    }, store);

    writeStore(store);
    return true;
  },

  // ORDERS
  getOrders(filter = {}) {
    const store = readStore();
    let ords = [...store.orders];

    if (filter.customerEmail) {
      ords = ords.filter(o => o.customer.email.toLowerCase() === filter.customerEmail.toLowerCase());
    }

    if (filter.status && filter.status !== 'todos') {
      ords = ords.filter(o => o.status.toLowerCase() === filter.status.toLowerCase());
    }

    // Sort newest first
    return ords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  createOrder(data) {
    const store = readStore();

    const orderId = 'ORD-' + (Math.floor(1000 + Math.random() * 9000));
    const newOrder = {
      id: orderId,
      customer: {
        name: data.customer.name,
        email: data.customer.email,
        phone: data.customer.phone || '',
        address: data.customer.address || ''
      },
      items: data.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      paymentMethod: data.paymentMethod || 'Transferencia Bancaria (10% OFF)',
      subtotal: data.subtotal,
      discount: data.discount || 0,
      shippingCost: data.shippingCost || 0,
      total: data.total,
      status: 'Pendiente',
      notes: data.notes || '',
      createdAt: new Date().toISOString()
    };

    // Decrement stock for ordered items
    data.items.forEach(orderedItem => {
      const prod = store.products.find(p => p.id === orderedItem.id);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - orderedItem.quantity);
      }
    });

    store.orders.unshift(newOrder);

    this.logActivity({
      user: newOrder.customer.email,
      userName: newOrder.customer.name,
      role: 'cliente',
      action: 'NEW_ORDER',
      description: `Nuevo pedido #${newOrder.id} creado por $${newOrder.total.toLocaleString('es-AR')}`,
      badgeColor: 'green'
    }, store);

    writeStore(store);
    return newOrder;
  },

  updateOrderStatus(orderId, status, user) {
    const store = readStore();
    const order = store.orders.find(o => o.id === orderId);
    if (!order) return null;

    const oldStatus = order.status;
    order.status = status;
    order.updatedAt = new Date().toISOString();

    this.logActivity({
      user: user?.email || 'admin',
      userName: user?.name || 'Administrador',
      role: user?.role || 'superadministrador',
      action: 'ORDER_STATUS',
      description: `Actualizó pedido #${order.id} de "${oldStatus}" a "${status}"`,
      badgeColor: 'blue'
    }, store);

    writeStore(store);
    return order;
  },

  // ACTIVITY LOGS
  getActivityLogs(limit = 50) {
    const store = readStore();
    return store.activity.slice(0, limit);
  },

  logActivity(entry, optionalStore) {
    const store = optionalStore || readStore();
    const logItem = {
      id: 'act-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      user: entry.user || 'sistema',
      userName: entry.userName || 'Sistema',
      role: entry.role || 'sistema',
      action: entry.action || 'GENERAL',
      description: entry.description,
      badgeColor: entry.badgeColor || 'gray'
    };

    store.activity.unshift(logItem);
    // Keep max 200 logs
    if (store.activity.length > 200) {
      store.activity = store.activity.slice(0, 200);
    }

    if (!optionalStore) {
      writeStore(store);
    }
    return logItem;
  },

  // STATS FOR DASHBOARD
  getStats() {
    const store = readStore();

    const totalSales = store.orders
      .filter(o => o.status !== 'Cancelado')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const totalOrders = store.orders.length;
    const pendingOrders = store.orders.filter(o => o.status === 'Pendiente' || o.status === 'En preparación').length;

    const totalProducts = store.products.length;
    const lowStockProducts = store.products.filter(p => p.stock <= (p.minStock || 3));
    const outOfStockProducts = store.products.filter(p => p.stock === 0);

    const totalCustomers = store.users.filter(u => u.role === 'cliente').length;

    // Sales by category
    const salesByCategory = {};
    store.orders.forEach(order => {
      order.items.forEach(item => {
        const product = store.products.find(p => p.id === item.id);
        const cat = product?.category || 'Otros';
        salesByCategory[cat] = (salesByCategory[cat] || 0) + (item.price * item.quantity);
      });
    });

    return {
      totalSales,
      totalOrders,
      pendingOrders,
      totalProducts,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      lowStockItems: lowStockProducts,
      totalCustomers,
      salesByCategory,
      recentOrders: store.orders.slice(0, 5)
    };
  }
};
