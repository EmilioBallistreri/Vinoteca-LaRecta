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


-- 5. TABLA DE PRODUCTOS (CATÁLOGO EN LA NUBE)
create table if not exists products (
  id text primary key,
  name text not null,
  category text not null,
  subcategory text default '',
  bodega text default '',
  price numeric not null,
  original_price numeric,
  discount numeric default 0,
  stock numeric default 99,
  badge text,
  image text,
  description text default '',
  is_featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table products enable row level security;
drop policy if exists "Lectura pública products" on products;
create policy "Lectura pública products" on products for select using (true);

drop policy if exists "Escritura pública products" on products;
create policy "Escritura pública products" on products for all using (true) with check (true);

-- Productos iniciales del catálogo
insert into products (id, name, category, subcategory, bodega, price, original_price, discount, stock, badge, image, description, is_featured)
values ('prod-pommery-brut', 'Pommery Brut con Estuche x 750 c.c', 'espumantes', 'Champagne Francés', 'Vranken-Pommery', 125000, 152000, 18, 99, 'PRE-VENTA', '/public/products/pommery-brut-750.png', 'Champagne francés de prestigio mundial originario de Reims. Presentación con estuche oficial de lujo. Burbujas delicadas, armonía, vivacidad y una finura excepcional en boca.', true)
on conflict (id) do nothing;
insert into products (id, name, category, subcategory, bodega, price, original_price, discount, stock, badge, image, description, is_featured)
values ('prod-rosell-boher-rose', 'Rosell Boher Rosé x 750 c.c', 'espumantes', 'Cuvée Rosé & Champenoise', 'Rosell Boher', 41500, 49500, 16, 99, 'PRE-VENTA', '/public/products/rosell-boher-rose-750.png', '100% Pinot Noir elaborado bajo el exigente método tradicional Champenoise. Espuma persistente, aromas a frambuesas frescas, pan tostado y un final untuoso y elegante.', true)
on conflict (id) do nothing;
insert into products (id, name, category, subcategory, bodega, price, original_price, discount, stock, badge, image, description, is_featured)
values ('prod-nieto-senetiner-bn', 'Nieto Senetiner Brut Nature x 750 c.c', 'espumantes', 'Brut Nature', 'Nieto Senetiner', 11900, 14500, 18, 99, 'PRE-VENTA', '/public/products/nieto-senetiner-brut-nature-750.png', 'Corte refinado de uvas Pinot Noir y Chardonnay de Luján de Cuyo. Muy seco, fresco y equilibrado, con notas a manzana verde, damascos y flores blancas.', true)
on conflict (id) do nothing;
insert into products (id, name, category, subcategory, bodega, price, original_price, discount, stock, badge, image, description, is_featured)
values ('prod-las-perdices-champenoise', 'Las Perdices Método Champenoise Extra Brut / Brut Nature / Brut Rosé x 750 c.c', 'espumantes', 'Método Champenoise', 'Viña Las Perdices', 12500, 14500, 14, 99, 'PRE-VENTA', '/public/products/las-perdices-champenoise.png', 'Elaboración artesanal bajo método tradicional champenoise con prolongada guarda sobre lías. Selección disponible en variedades Extra Brut, Brut Nature o Brut Rosé.', true)
on conflict (id) do nothing;
insert into products (id, name, category, subcategory, bodega, price, original_price, discount, stock, badge, image, description, is_featured)
values ('prod-dv-catena-malbec', 'DV Catena Malbec-Malbec x 750 c.c', 'vinos', 'Malbec', 'Catena Zapata', 17500, 22200, 21, 99, 'PRE-VENTA', '/public/products/dv-catena-malbec-malbec.png', 'Blend histórico de viñedos de altura Angélica (Lunlunta) y La Pirámide (Agrelo). Crianza de 18 meses en barricas de roble francés. Ciruelas maduras, pimienta negra y taninos dulces.', true)
on conflict (id) do nothing;
insert into products (id, name, category, subcategory, bodega, price, original_price, discount, stock, badge, image, description, is_featured)
values ('prod-septima-gran-reserva', 'Séptima Gran Reserva Blend x 750 c.c', 'vinos', 'Cortes de Autor', 'Bodega Séptima', 22500, 27000, 17, 99, 'PRE-VENTA', '/public/products/septima-gran-reserva-blend.png', 'Corte de guarda superior compuesto por Malbec, Cabernet Sauvignon y Tannat de Agrelo. Crianza en roble que aporta notas a chocolate amargo, vainilla, tabaco y frutos negros confitados.', true)
on conflict (id) do nothing;
insert into products (id, name, category, subcategory, bodega, price, original_price, discount, stock, badge, image, description, is_featured)
values ('prod-salentein-reserva-malbec', 'Salentein Reserva Malbec x 750 c.c', 'vinos', 'Malbec', 'Bodegas Salentein', 10500, 12900, 19, 99, 'PRE-VENTA', '/public/products/salentein-reserva-malbec.png', 'Nacido en las terrazas de Valle de Uco a más de 1.100 metros de altitud. Intenso color violáceo, aromas a moras, guindas y un sutil fondo floral con roble perfectamente ensamblado.', true)
on conflict (id) do nothing;
insert into products (id, name, category, subcategory, bodega, price, original_price, discount, stock, badge, image, description, is_featured)
values ('prod-callejon-crimen-reserva', 'Callejón del Crimen Reserva Malbec o Cabernet Franc x 750 c.c', 'vinos', 'Malbec / Cabernet Franc', 'Callejón del Crimen', 9750, 11900, 18, 99, 'PRE-VENTA', '/public/products/callejon-del-crimen-reserva.png', 'Cosecha de terroir pedregoso en Vista Flores, Valle de Uco. Partida disponible a elección en variedades Malbec o Cabernet Franc Reserva de gran tipicidad y frescura.', true)
on conflict (id) do nothing;
insert into products (id, name, category, subcategory, bodega, price, original_price, discount, stock, badge, image, description, is_featured)
values ('prod-fernet-branca-750', 'Fernet Branca x 750 c.c', 'aperitivos', 'Fernet', 'Fratelli Branca', 16500, 17900, 8, 99, 'PRE-VENTA', '/public/products/fernet-branca-750.png', 'El aperitivo e ícono tradicional por excelencia. Madurado durante 12 meses en cubas de roble de Eslavonia con infusión secreta de 27 hierbas botánicas de los cinco continentes.', true)
on conflict (id) do nothing;
insert into products (id, name, category, subcategory, bodega, price, original_price, discount, stock, badge, image, description, is_featured)
values ('prod-campari-750', 'Campari x 750 c.c', 'aperitivos', 'Aperitivos Clásicos', 'Grupo Campari', 10500, 11900, 12, 99, 'PRE-VENTA', '/public/products/campari-750.png', 'Legendaria receta creada en Milán en 1860 a partir de hierbas aromáticas, cortezas y frutas en alcohol. El corazón de la coctelería clásica para Campari Tonic, Negroni y Americano.', true)
on conflict (id) do nothing;
insert into products (id, name, category, subcategory, bodega, price, original_price, discount, stock, badge, image, description, is_featured)
values ('prod-aperol-750', 'Aperol x 750 c.c', 'aperitivos', 'Aperitivos Clásicos', 'Grupo Campari', 10500, 11900, 12, 99, 'PRE-VENTA', '/public/products/aperol-750.png', 'La esencia del aperitivo italiano y del Aperol Spritz. Receta inalterada con naranja amarga, genciana, ruibarbo y hierbas selectas. Color naranja brillante y graduación alcohólica ligera.', true)
on conflict (id) do nothing;
insert into products (id, name, category, subcategory, bodega, price, original_price, discount, stock, badge, image, description, is_featured)
values ('prod-cinzano-1l', 'Cinzano Vermouth Rosso x 1 L.', 'aperitivos', 'Vermuts de Autor', 'Cinzano', 8300, 9500, 13, 99, 'PRE-VENTA', '/public/products/cinzano-rosso-1l.png', 'Auténtica fórmula italiana nacida en Turín en 1757. Infusión de más de 35 extractos botánicos con armónicas notas especiadas y dulces. Presentación tradicional de 1 Litro.', true)
on conflict (id) do nothing;
insert into products (id, name, category, subcategory, bodega, price, original_price, discount, stock, badge, image, description, is_featured)
values ('promo-salentein-combo', 'Combo Exclusivo de Bodegas Salentein', 'promos', '', 'Bodegas Salentein', 152000, null, 0, 99, 'PROMO EXCLUSIVA', '/public/promotions/salentein-1-cover.png', '1 caja Salentein Malbec + 1 caja Salentein Extra Brut $ 152.000 y llevate de regalo 1 frapera de aluminio, con manijas de cuero y logo de la bodega ideal para vestir tu mesa', true)
on conflict (id) do nothing;
insert into products (id, name, category, subcategory, bodega, price, original_price, discount, stock, badge, image, description, is_featured)
values ('promo-las-perdices-exploracion', 'Combo Exclusivo Bodega Las Perdices', 'promos', 'Cajas x6', 'Viña Las Perdices', 81250, 97000, 0, 99, 'PROMO EXCLUSIVA', '/public/promotions/lasperdices-1-cover.png', 'Comprando 5 botellas de Exploración Malbec la sexta botella va sin cargo.! Valor del combo $ 81.250', true)
on conflict (id) do nothing;
insert into products (id, name, category, subcategory, bodega, price, original_price, discount, stock, badge, image, description, is_featured)
values ('promo-don-nicanor-combo', 'Combo Exclusivo Don Nicanor', 'promos', 'Cajas x6', 'Nieto Senetiner', 110000, null, 0, 99, 'PROMO EXCLUSIVA', '/public/promotions/donnicanor-1-cover.png', 'Comprando 1 caja de Don Nicanor Barrel Select x 6 unid a $ 110.000, llevate de obsequio 1 sacacorchos premium con logo de la bodega.', true)
on conflict (id) do nothing;
