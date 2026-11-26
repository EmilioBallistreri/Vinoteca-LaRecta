// Integración de Base de Datos Cloud en Tiempo Real con Supabase
// Vinoteca La Recta
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function getCredentials() {
  const envUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    return { url: envUrl.trim(), key: envKey.trim() };
  }

  // Check store.json for credentials configured via Admin Panel
  try {
    const storePath = path.join(__dirname, 'store.json');
    if (fs.existsSync(storePath)) {
      const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      if (store.cloudDatabase && store.cloudDatabase.url && store.cloudDatabase.key) {
        return {
          url: store.cloudDatabase.url.trim(),
          key: store.cloudDatabase.key.trim()
        };
      }
    }
  } catch (_) {}

  return { url: null, key: null };
}

let cachedClient = null;
let lastCredsKey = '';

function getSupabase() {
  const creds = getCredentials();
  if (!creds.url || !creds.key) return null;

  const currentKey = `${creds.url}_${creds.key}`;
  if (cachedClient && lastCredsKey === currentKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(creds.url, creds.key, {
      auth: { persistSession: false }
    });
    lastCredsKey = currentKey;
    return cachedClient;
  } catch (err) {
    console.error('Error al inicializar cliente de Supabase:', err.message);
    return null;
  }
}

function isConfigured() {
  const creds = getCredentials();
  return Boolean(creds.url && creds.key);
}

async function testConnection(url, key) {
  try {
    const testClient = (url && key) 
      ? createClient(url.trim(), key.trim(), { auth: { persistSession: false } })
      : getSupabase();

    if (!testClient) return { success: false, error: 'Credenciales incompletas' };

    const { data, error } = await testClient
      .from('site_config')
      .select('id, active_festivity')
      .limit(1);

    if (error) {
      // If table doesn't exist yet, but credentials authenticated:
      if (error.code === '42P01') {
        return { 
          success: true, 
          needsSchema: true, 
          message: 'Conexión exitosa a Supabase. Requiere ejecutar el script SQL de tablas iniciales (supabase_schema.sql).' 
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true, message: 'Conexión a Supabase establecida correctamente.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================= SITE CONFIG (FESTIVIDADES Y TEMÁTICAS) =================

async function getCloudSiteConfig() {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('site_config')
      .select('*')
      .eq('id', 'main')
      .single();

    if (error || !data) return null;

    return {
      activeFestivity: data.active_festivity || 'clasico',
      banner: data.banner || {},
      heroSlides: data.hero_slides || [],
      customTheme: data.custom_theme || {},
      updatedAt: data.updated_at
    };
  } catch (_) {
    return null;
  }
}

async function saveCloudSiteConfig(config) {
  const client = getSupabase();
  if (!client) return false;

  try {
    const payload = {
      id: 'main',
      active_festivity: config.activeFestivity || 'clasico',
      banner: config.banner || {},
      hero_slides: config.heroSlides || [],
      custom_theme: config.customTheme || {},
      updated_at: new Date().toISOString()
    };

    const { error } = await client
      .from('site_config')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase upsert site_config warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error saving site_config to Supabase:', err.message);
    return false;
  }
}

// ================= ORDERS =================

async function getCloudOrders() {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !Array.isArray(data)) return null;

    return data.map(row => ({
      id: row.id,
      isWholesale: row.is_wholesale,
      customer: row.customer,
      items: row.items,
      paymentMethod: row.payment_method,
      subtotal: Number(row.subtotal),
      discount: Number(row.discount || 0),
      shippingCost: Number(row.shipping_cost || 0),
      total: Number(row.total),
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at
    }));
  } catch (_) {
    return null;
  }
}

async function saveCloudOrder(order) {
  const client = getSupabase();
  if (!client) return false;

  try {
    const payload = {
      id: order.id,
      is_wholesale: Boolean(order.isWholesale),
      customer: order.customer,
      items: order.items,
      payment_method: order.paymentMethod,
      subtotal: order.subtotal,
      discount: order.discount || 0,
      shipping_cost: order.shippingCost || 0,
      total: order.total,
      status: order.status || 'Pendiente',
      notes: order.notes || '',
      created_at: order.createdAt || new Date().toISOString()
    };

    const { error } = await client.from('orders').upsert(payload, { onConflict: 'id' });
    return !error;
  } catch (_) {
    return false;
  }
}

// ================= USERS =================

async function getCloudUsers() {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('users')
      .select('id, name, email, phone, address, role, created_at, last_login')
      .order('created_at', { ascending: false });

    if (error || !Array.isArray(data)) return null;

    return data.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      role: row.role,
      createdAt: row.created_at,
      lastLogin: row.last_login
    }));
  } catch (_) {
    return null;
  }
}

async function saveCloudUser(user) {
  const client = getSupabase();
  if (!client) return false;

  try {
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email.toLowerCase(),
      password: user.password || '',
      phone: user.phone || '',
      address: user.address || '',
      role: user.role || 'cliente',
      created_at: user.createdAt || new Date().toISOString(),
      last_login: user.lastLogin || new Date().toISOString()
    };

    const { error } = await client.from('users').upsert(payload, { onConflict: 'email' });
    return !error;
  } catch (_) {
    return false;
  }
}

// ================= ACTIVITY =================

async function getCloudActivity(limit = 60) {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('activity')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !Array.isArray(data)) return null;

    return data.map(row => ({
      id: row.id,
      timestamp: row.created_at,
      user: row.user_email,
      userName: row.user_name,
      role: row.role,
      action: row.action,
      description: row.description,
      badgeColor: row.badge_color || 'gold'
    }));
  } catch (_) {
    return null;
  }
}

async function logCloudActivity(entry) {
  const client = getSupabase();
  if (!client) return false;

  try {
    const payload = {
      id: entry.id || ('act-' + Date.now()),
      user_email: entry.user || '',
      user_name: entry.userName || '',
      role: entry.role || 'sistema',
      action: entry.action || 'GENERAL',
      description: entry.description || '',
      badge_color: entry.badgeColor || 'gold',
      created_at: entry.timestamp || new Date().toISOString()
    };

    const { error } = await client.from('activity').insert(payload);
    return !error;
  } catch (_) {
    return false;
  }
}

module.exports = {
  getCredentials,
  isConfigured,
  getSupabase,
  testConnection,
  getCloudSiteConfig,
  saveCloudSiteConfig,
  getCloudOrders,
  saveCloudOrder,
  getCloudUsers,
  saveCloudUser,
  getCloudActivity,
  logCloudActivity
};
