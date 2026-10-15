# 🍷 E-Commerce Vinoteca La Recta

Plataforma integral de comercio electrónico para **Vinoteca La Recta**, diseñada con estética moderna, profesional, formal y elegante en tonos obsidiana y dorados champagne inspirados en el logo oficial de la marca.

---

## 📁 Arquitectura del Proyecto

El sistema está dividido limpiamente en dos carpetas independientes para facilitar futuras mejoras y mantenimientos:

```
web-vinoteca-la-recta/
├── backend/                  # Servidor API REST y persistencia
│   ├── data/
│   │   ├── db.js             # Gestor de base de datos y métodos CRUD
│   │   └── store.json        # Base de datos persistente (productos, pedidos, usuarios, logs)
│   ├── server.js             # Servidor Express con endpoints y servicio estático
│   └── package.json          # Dependencias de backend (express, cors, morgan, etc.)
│
├── frontend/                 # Interfaz de usuario de la tienda y panel de control
│   ├── public/
│   │   └── logo-vinoteca.jpg # Logo oficial de Vinoteca La Recta
│   ├── css/
│   │   ├── styles.css        # Sistema de diseño de lujo (storefront, carrito, modales)
│   │   └── admin.css         # Estilos del panel administrativo (KPIs, tablas, estados)
│   ├── js/
│   │   ├── api.js            # Cliente centralizado para comunicación con la API
│   │   ├── cart.js           # Gestor de carrito, cuotas y descuento por transferencia
│   │   ├── auth.js           # Manejo de sesiones de clientes y administradores
│   │   ├── app.js            # Controlador principal de la tienda y catálogo
│   │   └── admin.js          # Controlador del panel de administración
│   ├── index.html            # Tienda E-Commerce para clientes y visitantes
│   └── admin.html            # Panel de Administración exclusivo
│
├── package.json              # Scripts raíz para arranque directo
└── README.md                 # Documentación del proyecto
```

---

## 🚀 Puesta en Marcha

### 1. Iniciar el Servidor Completo
Desde la raíz del proyecto (`c:\proyectos\web-vinoteca-la-recta`):

```bash
npm start
# O en modo desarrollo con recarga automática:
npm run dev
```

El servidor iniciará en:
- **Tienda Online (Storefront):** [http://localhost:5000](http://localhost:5000)
- **Panel Administrativo:** [http://localhost:5000/admin.html](http://localhost:5000/admin.html) (o [http://localhost:5000/admin](http://localhost:5000/admin))
- **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔐 Cuentas de Superadministradores

Los tres correos solicitados están pre-configurados con rol de **superadministrador** y contraseña universal temporal:

| Superadministrador | Correo Electrónico | Contraseña Temporal |
| :--- | :--- | :--- |
| **Vinoteca La Recta (Principal)** | `vinotecalarecta7@gmail.com` | `AdminRecta2024!` |
| **Flor Almada** | `floralmada07@gmail.com` | `AdminRecta2024!` |
| **Martín Ballistreri** | `martinballistreri07@gmail.com` | `AdminRecta2024!` |

> 💡 *En la pantalla de acceso del panel (`admin.html`) y en el modal de ingreso de la tienda, se incluyeron botones de acceso rápido con un clic para iniciar sesión de demostración como cualquiera de los tres administradores.*

---

## ✨ Características y Secciones

### 🛍️ Tienda Online (`index.html`)
1. **Barra de Anuncios Superior:**
   - 💳 *3 Cuotas sin interés* • ⚡ *10% OFF Transferencia* • 🚚 *Envío Gratis +$ 60.000*.
   - Accesos directos a Instagram (`@vinoteca.larecta`) y WhatsApp (`3512460017`).
2. **Encabezado y Navegación:**
   - Logo oficial circular con relieve y tipografía de marca (*VINOTECA LA RECTA*).
   - Menú: **INICIO**, **PRODUCTOS**, **PROMOS** (con distintivo dinámico `OFF`), **COMUNIDAD**, **CONTACTO**.
   - Acceso al panel Admin, botón de Ingresar / Mi Cuenta, y Carrito con contador interactivo.
3. **Hero Section de Lujo:**
   - *"El Arte del Buen Beber"* con estética de cava boutique, llamadas a la acción y beneficios destacados.
4. **Categorías Solicitadas:**
   - 🍷 **Vinos** (Malbec, Cabernet, Blends, Blancos, Rosados)
   - 🥂 **Espumantes** (Método Champenoise y Charmat)
   - 🥃 **Whiskys** (Single Malts y Blended escoceses)
   - 🍸 **Aperitivos** (Gins de autor, Vermuts artesanales, Fernet)
   - 🧀 **Delicatessen** (Jamón crudo ibérico, Aceites de oliva virgen extra, Parmigiano Reggiano)
   - 🔥 **Promos** (Combos 2x1, sets de degustación con copas de cristal)
5. **Catálogo Interactivo:**
   - Filtros por categoría instantáneos.
   - Buscador en tiempo real por nombre, bodega o tipo de bebida.
   - Tarjetas con cálculo automático de **3 cuotas fijas** y **precio con 10% OFF por transferencia**.
   - Indicador de disponibilidad en tiempo real (*Disponible*, *Últimas unidades*, *Agotado*).
   - Modal de vista rápida de producto con notas de cata y maridaje.
6. **Apartado "Súmate a nuestra comunidad":**
   - Personalizado para Vinoteca La Recta.
   - Enlace directo al Instagram oficial: [@vinoteca.larecta](https://instagram.com/vinoteca.larecta).
   - Enlace directo a WhatsApp: [+54 9 351 246-0017](https://wa.me/5493512460017).
   - Formulario de suscripción al Club VIP con beneficios exclusivos.
7. **Botones Flotantes:**
   - 🟢 **WhatsApp Flotante:** Con animación de pulso y mensaje predeterminado listo para enviar.
   - 🛒 **Carrito Flotante:** Indicador de cantidad de productos que despliega el drawer lateral.
8. **Carrito Lateral y Checkout:**
   - Barra de progreso interactiva para alcanzar el **Envío Gratis** (+$60.000).
   - Selector de medios de pago:
     - Transferencia bancaria con **10% de descuento automático**.
     - Tarjetas en **3 cuotas sin interés**.
     - Efectivo contra entrega.
   - Confirmación con botón para enviar el comprobante y resumen detallado directamente al WhatsApp de la vinoteca.

---

### 🛡️ Panel de Administración (`admin.html`)
Diseñado con los más altos estándares visuales y 5 secciones operativas completas:

1. **Dashboard General:**
   - KPIs: Total facturado en ARS, pedidos pendientes de entrega, total de productos activos y alertas de stock crítico.
   - Métricas y últimos pedidos ingresados con estado en vivo.
   - Accesos directos a creación de productos y gestión de ventas.
2. **Control de Stock:**
   - Listado completo de existencias con filtros por categoría y búsqueda rápida.
   - Ajustador de stock en línea (botones `+` y `-` que impactan inmediatamente en la base de datos).
   - Creación y edición de productos (nombre, categoría, bodega, precio, descuento, stock, stock mínimo, imagen, notas de cata).
   - Eliminación de productos con confirmación.
3. **Ventas y Pedidos:**
   - Bandeja de pedidos con filtrado por estado (*Pendiente, Pagado, En preparación, Enviado, Completado, Cancelado*).
   - Selector de cambio de estado en tiempo real.
   - Modal de detalle de pedido con desglose de ítems, cantidades, dirección de entrega y notas del cliente.
4. **Clientes y Accesos:**
   - Registro de clientes con datos de contacto y direcciones de envío.
   - Gestión de administradores autorizados con sus respectivos roles (*superadministrador* / *administrador*).
   - Alta de nuevos administradores.
5. **Registro de Actividad (Auditoría):**
   - Historial detallado cronológico de cada evento en la tienda:
     - Modificaciones de stock.
     - Cambios de estado en los pedidos.
     - Inicios de sesión de administradores y clientes.
     - Creación y edición de productos.
     - Registro de nuevos usuarios.
