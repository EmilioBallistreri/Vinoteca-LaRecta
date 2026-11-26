/**
 * Generador Dinámico de Sitemap XML para Vinoteca La Recta
 * Dominio: https://vinotecalarecta.com
 * 
 * Lee las categorías y productos activos desde la base de datos (store.json)
 * y genera frontend/sitemap.xml compatible con Google Search Console.
 */

const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://vinotecalarecta.com';
const STORE_PATH = path.join(__dirname, '../data/store.json');
const SITEMAP_PATH = path.join(__dirname, '../../frontend/sitemap.xml');

function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

function generateSitemapXML() {
  const today = getTodayISO();

  // 1. Rutas públicas fijas principales
  const urls = [
    {
      loc: `${DOMAIN}/`,
      lastmod: today,
      changefreq: 'daily',
      priority: '1.0',
      comment: 'Página Principal / Cava y Portada'
    },
    {
      loc: `${DOMAIN}/productos.html`,
      lastmod: today,
      changefreq: 'daily',
      priority: '0.9',
      comment: 'Catálogo General de Productos'
    }
  ];

  // 2. Extraer categorías activas de productos desde store.json
  let categories = ['promos', 'vinos', 'espumantes', 'aperitivos'];
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const store = JSON.parse(raw);
      if (store && Array.isArray(store.products)) {
        const foundCategories = store.products
          .map(p => (p.category || '').toLowerCase().trim())
          .filter(cat => cat.length > 0);
        const uniqueCategories = [...new Set(foundCategories)];
        if (uniqueCategories.length > 0) {
          categories = uniqueCategories;
        }
      }
    }
  } catch (err) {
    console.warn('[Sitemap] Advertencia al leer store.json, usando categorías por defecto:', err.message);
  }

  // Orden preferencial de categorías para SEO
  const categoryOrder = ['promos', 'vinos', 'espumantes', 'aperitivos'];
  categories.sort((a, b) => {
    const idxA = categoryOrder.indexOf(a);
    const idxB = categoryOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  // Agregar URLs de categorías al sitemap
  categories.forEach(cat => {
    urls.push({
      loc: `${DOMAIN}/productos.html?categoria=${encodeURIComponent(cat)}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: '0.8',
      comment: `Categoría: ${cat.charAt(0).toUpperCase() + cat.slice(1)}`
    });
  });

  // Construcción del documento XML estándar sitemaps.org
  const xmlEntries = urls.map(entry => {
    const commentStr = entry.comment ? `  <!-- ${entry.comment} -->\n` : '';
    return `${commentStr}  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
  }).join('\n\n');

  const sitemapXML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

${xmlEntries}

</urlset>
`;

  return sitemapXML;
}

function writeSitemap() {
  const xml = generateSitemapXML();
  fs.writeFileSync(SITEMAP_PATH, xml, 'utf-8');
  console.log(`✅ [Sitemap] Archivo generado exitosamente en: ${SITEMAP_PATH}`);
  return xml;
}

if (require.main === module) {
  writeSitemap();
}

module.exports = {
  generateSitemapXML,
  writeSitemap
};
