// Catálogo de Festividades y Diseños Únicos para Vinoteca La Recta
// Cada festividad posee su propia paleta cromática, tipografía de acento, ornamentos flotantes, cinta superior y sugerencias de banner/promos.

export const FESTIVITIES_CATALOG = {
  clasico: {
    id: 'clasico',
    name: 'Clásico Cava de Autor',
    emoji: '🍷',
    season: 'Todo el año (Por defecto)',
    description: 'Estética original de Vinoteca La Recta: negro ónix profundo, dorado champagne y acentos borgoña imperial.',
    colors: {
      primary: '#c5a059',
      secondary: '#dfba73',
      accent: '#7a1c28',
      bgGlow: 'rgba(197, 160, 89, 0.12)',
      border: 'rgba(197, 160, 89, 0.35)'
    },
    ribbonText: '',
    particles: [],
    defaultBanner: {
      enabled: false,
      badge: 'SELECCIÓN DE CAVA',
      title: 'Grandes Vinos & Partidas Limitadas',
      subtitle: 'Descubrí nuestras etiquetas de guarda, cajas cerradas con descuento y destilados importados.',
      ctaText: 'Ver Promociones',
      ctaLink: '#promos'
    }
  },

  navidad: {
    id: 'navidad',
    name: 'Navidad en la Cava',
    emoji: '🎄',
    season: 'Diciembre • Nochebuena & Navidad',
    description: 'Diseño Pino Nórdico & Carmesí Real: guirnalda de luces cálidas en cabecera, destellos dorados y nieve suave para regalos y mesas navideñas.',
    colors: {
      primary: '#e53935',
      secondary: '#ffd54f',
      accent: '#1b5e20',
      bgGlow: 'rgba(27, 94, 32, 0.28)',
      border: 'rgba(255, 213, 79, 0.45)'
    },
    ribbonText: '🎄 ESPECIAL NAVIDAD EN LA RECTA • Estuches de Regalo, Cajas Navideñas y Espumantes para Nochebuena 🎁',
    particles: ['❄️', '✨', '🎄', '🎁', '⭐'],
    defaultBanner: {
      enabled: true,
      badge: '🎄 EDICIÓN ESPECIAL NAVIDAD',
      title: 'Regalá Grandes Momentos en esta Nochebuena',
      subtitle: 'Armamos estuches empresariales, cajas navideñas seleccionadas y combos de espumantes y vinos de guarda listos para el arbolito.',
      ctaText: 'Ver Combos Navideños',
      ctaLink: '#promos'
    }
  },

  anio_nuevo: {
    id: 'anio_nuevo',
    name: 'Año Nuevo & Brindis Imperial',
    emoji: '🥂',
    season: 'Fin de Año • 31 de Diciembre / Enero',
    description: 'Diseño Gala Midnight & Platino Burbujeante: estética de gala con burbujas de champagne ascendentes y destellos estelares dorados.',
    colors: {
      primary: '#ffe082',
      secondary: '#ffffff',
      accent: '#b388ff',
      bgGlow: 'rgba(255, 224, 130, 0.22)',
      border: 'rgba(255, 224, 130, 0.5)'
    },
    ribbonText: '🥂 ¡FELIZ AÑO NUEVO! • Cava de Champagnes, Espumantes Método Tradicional y Cajas para el Gran Brindis ✨',
    particles: ['🥂', '✨', '🍾', '🎆', '⭐'],
    defaultBanner: {
      enabled: true,
      badge: '🥂 GRAN BRINDIS DE FIN DE AÑO',
      title: 'Recibí el Nuevo Año con Etiquetas Inolvidables',
      subtitle: 'Selección exclusiva de Champagnes importados, Brut Nature por caja cerrada y destilados de gala para despedir el año.',
      ctaText: 'Elegir para el Brindis',
      ctaLink: '#promos'
    }
  },

  halloween: {
    id: 'halloween',
    name: 'Halloween & Noche de Brujas',
    emoji: '🎃',
    season: 'Octubre • Noche de Brujas',
    description: 'Diseño Cava Nocturna & Ámbar Calabaza: atmósfera púrpura abisal, bruma mística y acentos naranja fuego para pociones, gins y tintos intensos.',
    colors: {
      primary: '#ff6d00',
      secondary: '#ffab40',
      accent: '#7b1fa2',
      bgGlow: 'rgba(123, 31, 162, 0.32)',
      border: 'rgba(255, 109, 0, 0.5)'
    },
    ribbonText: '🎃 HALLOWEEN EN LA CAVA • Pociones, Destilados Oscuros, Tintos de Noche y Promos Embrujadas 🦇',
    particles: ['🎃', '🦇', '🕸️', '🌙', '🍷'],
    defaultBanner: {
      enabled: true,
      badge: '🎃 NOCHE DE HALLOWEEN EN LA RECTA',
      title: 'Elixires, Tintos Intensos & Combos de Noche',
      subtitle: 'Descuentos de ultratumba en Malbecs de guarda, Gins botánicos, Whiskys ahumados y combos para tu fiesta de Halloween.',
      ctaText: 'Descubrir Promos de Halloween',
      ctaLink: '#promos'
    }
  },

  fechas_patrias: {
    id: 'fechas_patrias',
    name: 'Fechas Patrias Argentinas',
    emoji: '🇦🇷',
    season: '25 de Mayo / 20 de Junio / 9 de Julio',
    description: 'Diseño Escarapela & Sol de Mayo: cinta celeste y blanca ceremonial, acentos azul patrio y oro sol para maridar locro, asado y empanadas.',
    colors: {
      primary: '#4fc3f7',
      secondary: '#ffb300',
      accent: '#0288d1',
      bgGlow: 'rgba(79, 195, 247, 0.22)',
      border: 'rgba(79, 195, 247, 0.5)'
    },
    ribbonText: '🇦🇷 CELEBREMOS NUESTRA PATRIA • Grandes Malbecs y Tintos Argentinos para la Mesa Criolla y el Asado ☀️',
    particles: ['🇦🇷', '☀️', '🍷', '🌾', '✨'],
    defaultBanner: {
      enabled: true,
      badge: '🇦🇷 ORGULLO Y VINO NACIONAL',
      title: 'Etiquetas Argentinas para la Mesa Patria',
      subtitle: 'Celebrá nuestras fechas patrias con los mejores Malbecs, Cabernets y Torrontés de nuestras bodegas de Mendoza, Salta y Patagonia.',
      ctaText: 'Ver Selección Patria',
      ctaLink: '#promos'
    }
  },

  vendimia: {
    id: 'vendimia',
    name: 'Fiesta de la Vendimia',
    emoji: '🍇',
    season: 'Marzo / Abril • Tiempo de Cosecha',
    description: 'Diseño Terroir & Púrpura Malbec: tonos borgoña uva, cobre otoñal y hojas de vid celebrando la nueva cosecha de nuestras bodegas.',
    colors: {
      primary: '#ce93d8',
      secondary: '#ffab91',
      accent: '#6a1b9a',
      bgGlow: 'rgba(106, 27, 154, 0.28)',
      border: 'rgba(206, 147, 216, 0.45)'
    },
    ribbonText: '🍇 TIEMPO DE VENDIMIA • Celebramos la Cosecha con Descuentos en Bodegas de Autor y Cajas Cerradas 🍷',
    particles: ['🍇', '🍂', '🍷', '🌿', '✨'],
    defaultBanner: {
      enabled: true,
      badge: '🍇 ESPECIAL VENDIMIA',
      title: 'Homenaje a la Tierra, la Vid y el Vino',
      subtitle: 'Viví la época más importante de la enología con precios especiales en cajas x6, varietales de altura y partidas limitadas.',
      ctaText: 'Explorar Especial Vendimia',
      ctaLink: '#promos'
    }
  },

  san_valentin: {
    id: 'san_valentin',
    name: 'San Valentín & Enamorados',
    emoji: '💘',
    season: '14 de Febrero • Mes del Amor',
    description: 'Diseño Terciopelo Rubí & Champagne Rosé: atmósfera íntima y romántica con destellos rubí y cuarzo rosado para cenas de a dos.',
    colors: {
      primary: '#f48fb1',
      secondary: '#ff80ab',
      accent: '#ad1457',
      bgGlow: 'rgba(173, 20, 87, 0.28)',
      border: 'rgba(244, 143, 177, 0.48)'
    },
    ribbonText: '💘 ESPECIAL SAN VALENTÍN • Espumantes Rosé, Pinot Noir y Estuches para un Brindis Inolvidable de a Dos 🥂',
    particles: ['💘', '🌹', '🥂', '✨', '🍷'],
    defaultBanner: {
      enabled: true,
      badge: '💘 BRINDIS DE SAN VALENTÍN',
      title: 'El Maridaje Perfecto para una Noche Especial',
      subtitle: 'Sorprendé con nuestra curaduría de Espumantes Rosé, Pinot Noir sedosos, chocolates y delicatessen para compartir.',
      ctaText: 'Ver Regalos de San Valentín',
      ctaLink: '#promos'
    }
  },

  dia_del_padre: {
    id: 'dia_del_padre',
    name: 'Especial Día del Padre',
    emoji: '🥃',
    season: 'Junio • Homenaje a Papá',
    description: 'Diseño Roble Ahumado & Ámbar Single Malt: estética señorial inspirada en barricas de roble, cuero, whiskys escoceses y grandes reservas.',
    colors: {
      primary: '#f59e0b',
      secondary: '#fcd34d',
      accent: '#78350f',
      bgGlow: 'rgba(180, 83, 9, 0.26)',
      border: 'rgba(245, 158, 11, 0.48)'
    },
    ribbonText: '🥃 ESPECIAL DÍA DEL PADRE • Whiskys Single Malt, Grandes Reservas, Habanos y Estuches de Colección para Papá 🎁',
    particles: ['🥃', '🎩', '🎁', '🍷', '✨'],
    defaultBanner: {
      enabled: true,
      badge: '🥃 HOMENAJE A PAPÁ EN LA RECTA',
      title: 'Un Regalo con Carácter, Linaje y Guarda',
      subtitle: 'Whiskys importados, Vinos Ícono de guarda, copas de cristal y estuches de madera pensados para sorprender a papá.',
      ctaText: 'Elegir el Regalo de Papá',
      ctaLink: '#promos'
    }
  },

  dia_de_la_madre: {
    id: 'dia_de_la_madre',
    name: 'Especial Día de la Madre',
    emoji: '🌸',
    season: 'Octubre • Homenaje a Mamá',
    description: 'Diseño Oro Rosa & Jardín de Cava: paleta luminosa en oro rosado, marfil y flores de primavera para agasajar a mamá.',
    colors: {
      primary: '#f06292',
      secondary: '#f8bbd0',
      accent: '#880e4f',
      bgGlow: 'rgba(236, 64, 122, 0.22)',
      border: 'rgba(240, 98, 146, 0.48)'
    },
    ribbonText: '🌸 ESPECIAL DÍA DE LA MADRE • Estuches Exclusivos, Espumantes, Blancos Aromáticos y Regalos con Estilo 🥂',
    particles: ['🌸', '💐', '🥂', '✨', '🎁'],
    defaultBanner: {
      enabled: true,
      badge: '🌸 DÍA DE LA MADRE EN LA CAVA',
      title: 'Brindemos por Ella con Etiquetas de Autor',
      subtitle: 'Estuches delicados con espumantes, vinos elegantes, gins florales y delicatessen seleccionados especialmente para mamá.',
      ctaText: 'Ver Regalos para Mamá',
      ctaLink: '#promos'
    }
  },

  dia_del_amigo: {
    id: 'dia_del_amigo',
    name: 'Semana de la Amistad',
    emoji: '🍻',
    season: '20 de Julio • Día del Amigo',
    description: 'Diseño Noche de Juntada & Brindis Grupal: tonos azul eléctrico, cian y ámbar festivo ideales para combos de aperitivos, gin y cajas x6.',
    colors: {
      primary: '#26c6da',
      secondary: '#ffca28',
      accent: '#00838f',
      bgGlow: 'rgba(38, 198, 218, 0.22)',
      border: 'rgba(38, 198, 218, 0.48)'
    },
    ribbonText: '🍻 SEMANA DEL AMIGO EN LA RECTA • Combos de Gin, Fernet, Aperitivos y Cajas x6 para Festejar con Amigos 🥂',
    particles: ['🍻', '🍸', '🍷', '🎉', '✨'],
    defaultBanner: {
      enabled: true,
      badge: '🍻 ESPECIAL DÍA DEL AMIGO',
      title: 'La Juntada Empieza en Vinoteca La Recta',
      subtitle: 'Aprovechá nuestros combos de previa, cajas de vino x6 para el asado con amigos, gins botánicos y aperitivos a precio especial.',
      ctaText: 'Ver Combos para Amigos',
      ctaLink: '#promos'
    }
  }
};

export function applySiteCustomization(siteConfig) {
  if (!siteConfig) return;
  const festId = siteConfig.activeFestivity || 'clasico';
  const fest = FESTIVITIES_CATALOG[festId] || FESTIVITIES_CATALOG.clasico;

  document.body.setAttribute('data-festivity', fest.id);

  // Set CSS custom properties on body so each festivity has its own unique look
  if (fest.id !== 'clasico') {
    document.body.style.setProperty('--fest-primary', fest.colors.primary);
    document.body.style.setProperty('--fest-secondary', fest.colors.secondary);
    document.body.style.setProperty('--fest-accent', fest.colors.accent);
    document.body.style.setProperty('--fest-glow', fest.colors.bgGlow);
    document.body.style.setProperty('--fest-border', fest.colors.border);
  } else {
    document.body.style.removeProperty('--fest-primary');
    document.body.style.removeProperty('--fest-secondary');
    document.body.style.removeProperty('--fest-accent');
    document.body.style.removeProperty('--fest-glow');
    document.body.style.removeProperty('--fest-border');
  }

  // 1. Top Festive Ribbon
  const ribbon = document.getElementById('festivityTopRibbon');
  if (ribbon) {
    if (fest.id !== 'clasico' && fest.ribbonText) {
      ribbon.style.display = 'block';
      ribbon.innerHTML = `
        <div class="container festivity-ribbon-inner">
          <span class="festivity-ribbon-badge">${fest.emoji} ${fest.name}</span>
          <span class="festivity-ribbon-text">${fest.ribbonText}</span>
          <a href="#promos" class="festivity-ribbon-link">Ver Especial &rarr;</a>
        </div>
      `;
    } else {
      ribbon.style.display = 'none';
      ribbon.innerHTML = '';
    }
  }

  // 2. Ambient Floating Ornaments (Unique per festivity)
  const ambient = document.getElementById('festivityAmbientDecor');
  if (ambient) {
    if (fest.id !== 'clasico' && Array.isArray(fest.particles) && fest.particles.length > 0) {
      const itemsHtml = Array.from({ length: 14 }).map((_, idx) => {
        const symbol = fest.particles[idx % fest.particles.length];
        const left = ((idx * 7.3) + 3) % 96;
        const delay = (idx * 1.1).toFixed(1);
        const duration = 11 + (idx % 6) * 2;
        const size = 0.85 + (idx % 3) * 0.22;
        return `<span class="fest-particle" style="left:${left}%; animation-delay:${delay}s; animation-duration:${duration}s; font-size:${size}rem;">${symbol}</span>`;
      }).join('');
      ambient.innerHTML = `<div class="festivity-garland-bar"></div>${itemsHtml}`;
      ambient.style.display = 'block';
    } else {
      ambient.innerHTML = '';
      ambient.style.display = 'none';
    }
  }

  // 3. Festive Banner on Home Page (#festivityBannerSection)
  const bannerSection = document.getElementById('festivityBannerSection');
  if (bannerSection) {
    const b = siteConfig.banner || {};
    if (b.enabled) {
      const bgStyle = b.image
        ? `background-image: linear-gradient(90deg, rgba(9,9,11,0.92) 0%, rgba(9,9,11,0.72) 55%, rgba(9,9,11,0.88) 100%), url('${b.image}'); background-size: cover; background-position: center;`
        : '';
      bannerSection.style.display = 'block';
      bannerSection.innerHTML = `
        <div class="container">
          <div class="festivity-campaign-card" style="${bgStyle}">
            <div class="festivity-campaign-glow"></div>
            <div class="festivity-campaign-content">
              <span class="festivity-campaign-badge">${b.badge || `${fest.emoji} ${fest.name.toUpperCase()}`}</span>
              <h2 class="festivity-campaign-title">${b.title || fest.defaultBanner.title}</h2>
              <p class="festivity-campaign-sub">${b.subtitle || fest.defaultBanner.subtitle}</p>
              <div class="festivity-campaign-actions">
                <a href="${b.ctaLink || '#promos'}" class="btn-primary festivity-cta-btn">
                  <span>${b.ctaText || 'Ver Promociones Especiales'}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </a>
                <a href="/productos.html?categoria=promos" class="btn-secondary">
                  Explorar Combos en Catálogo
                </a>
              </div>
            </div>
            <div class="festivity-campaign-emblem" aria-hidden="true">
              <div class="emblem-ring">
                <span class="emblem-emoji">${fest.emoji}</span>
              </div>
              <span class="emblem-caption">${fest.name}</span>
            </div>
          </div>
        </div>
      `;
    } else {
      bannerSection.style.display = 'none';
      bannerSection.innerHTML = '';
    }
  }

  // 4. Update Hero Texts if on Home Page
  const tagTextEl = document.getElementById('heroTagText');
  const mainTitleEl = document.getElementById('heroMainTitle');
  const highlightEl = document.getElementById('heroHighlightText');
  const descEl = document.getElementById('heroDescriptionText');

  if (tagTextEl && siteConfig.heroTag) tagTextEl.textContent = siteConfig.heroTag;
  if (mainTitleEl && siteConfig.heroTitle) mainTitleEl.textContent = siteConfig.heroTitle;
  if (highlightEl && siteConfig.heroHighlight) highlightEl.textContent = siteConfig.heroHighlight;
  if (descEl && siteConfig.heroDescription) descEl.textContent = siteConfig.heroDescription;

  // 5. Update Hero Carousel Slides if on Home Page
  const heroCarousel = document.getElementById('heroCarousel');
  const heroDotsContainer = document.getElementById('heroDotsContainer');
  if (heroCarousel && Array.isArray(siteConfig.heroSlides) && siteConfig.heroSlides.length > 0) {
    const slidesHtml = siteConfig.heroSlides.map((slide, idx) => `
      <div class="hero-slide ${idx === 0 ? 'active' : ''}" style="background-image: url('${slide.image}');"></div>
    `).join('') + `<div class="hero-overlay"></div>`;
    heroCarousel.innerHTML = slidesHtml;

    if (heroDotsContainer) {
      heroDotsContainer.innerHTML = siteConfig.heroSlides.map((slide, idx) => `
        <span class="hero-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}" title="${slide.label || `Imagen ${idx + 1}`}"></span>
      `).join('');
    }
  }
}

