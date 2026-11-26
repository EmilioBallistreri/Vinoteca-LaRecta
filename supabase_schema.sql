-- =========================================================================
-- ESQUEMA INICIAL DE BASE DE DATOS EN LA NUBE - SUPABASE
-- Proyecto: Vinoteca La Recta (https://vinotecalarecta.com)
--
-- Instrucciones de instalación:
-- 1. Creá un proyecto gratuito en https://supabase.com
-- 2. En el menú lateral izquierdo, abrí "SQL Editor"
-- 3. Copiá y pegá todo este script y presioná "RUN"
-- 4. Copiá la URL y la Anon Key desde Project Settings -> API
--    y colocalas en el panel de administración o en Vercel Environment Variables.
-- =========================================================================

-- 1. TABLA DE CONFIGURACIÓN DEL SITIO (Festividades, Cava, Temáticas)
create table if not exists site_config (
  id text primary key default 'main',
  active_festivity text default 'clasico',
  banner jsonb default '{"text": "🍇 Bienvenidos a Vinoteca La Recta • Vinos de Selección Exclusiva en Córdoba", "badge": "DESTACADO", "enabled": true}'::jsonb,
  hero_slides jsonb default '[]'::jsonb,
  custom_theme jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- Políticas RLS para site_config (Lectura y Escritura permitidas con anon key)
alter table site_config enable row level security;
drop policy if exists "Lectura pública site_config" on site_config;
create policy "Lectura pública site_config" on site_config for select using (true);

drop policy if exists "Escritura pública site_config" on site_config;
create policy "Escritura pública site_config" on site_config for all using (true) with check (true);

-- Registro por defecto
insert into site_config (id, active_festivity)
values ('main', 'clasico')
on conflict (id) do nothing;


-- 2. TABLA DE PEDIDOS (VENTAS RETAIL Y MAYORISTAS)
create table if not exists orders (
  id text primary key,
  is_wholesale boolean default false,
  customer jsonb not null,
  items jsonb not null,
  payment_method text,
  subtotal numeric,
  discount numeric default 0,
  shipping_cost numeric default 0,
  total numeric not null,
  status text default 'Pendiente',
  notes text default '',
  created_at timestamptz default now()
);

alter table orders enable row level security;
drop policy if exists "Lectura pública orders" on orders;
create policy "Lectura pública orders" on orders for select using (true);

drop policy if exists "Escritura pública orders" on orders;
create policy "Escritura pública orders" on orders for all using (true) with check (true);


-- 3. TABLA DE USUARIOS Y ACCESOS
create table if not exists users (
  id text primary key,
  name text not null,
  email text unique not null,
  password text,
  phone text,
  address text,
  role text default 'cliente',
  created_at timestamptz default now(),
  last_login timestamptz default now()
);

alter table users enable row level security;
drop policy if exists "Lectura pública users" on users;
create policy "Lectura pública users" on users for select using (true);

drop policy if exists "Escritura pública users" on users;
create policy "Escritura pública users" on users for all using (true) with check (true);

-- Superadministrador principal único
insert into users (id, name, email, password, role)
values ('admin-1', 'Vinoteca La Recta', 'vinotecalarecta7@gmail.com', 'MiClaveSecreta123!', 'superadministrador')
on conflict (email) do nothing;


-- 4. TABLA DE AUDITORÍA Y ACTIVIDAD
create table if not exists activity (
  id text primary key,
  user_email text,
  user_name text,
  role text,
  action text,
  description text,
  badge_color text default 'gold',
  created_at timestamptz default now()
);

alter table activity enable row level security;
drop policy if exists "Lectura pública activity" on activity;
create policy "Lectura pública activity" on activity for select using (true);

drop policy if exists "Escritura pública activity" on activity;
create policy "Escritura pública activity" on activity for all using (true) with check (true);
