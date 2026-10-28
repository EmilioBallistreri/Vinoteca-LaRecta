import { api } from './api.js';

const USER_STORAGE_KEY = 'vlr_user';

export const auth = {
  currentUser: null,

  init() {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      this.currentUser = stored ? JSON.parse(stored) : null;
    } catch {
      this.currentUser = null;
    }
    this.updateUI();
  },

  getUser() {
    return this.currentUser;
  },

  isAdmin() {
    return this.currentUser && (
      this.currentUser.role === 'superadministrador' ||
      this.currentUser.role === 'administrador'
    );
  },

  isSuperAdmin() {
    return this.currentUser && this.currentUser.role === 'superadministrador';
  },

  setUser(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
    this.updateUI();
    window.dispatchEvent(new CustomEvent('vlr:auth-changed', { detail: { user } }));
  },

  logout() {
    this.setUser(null);
    window.location.reload();
  },

  updateUI() {
    const userContainer = document.getElementById('navUserContainer');
    if (!userContainer) return;

    if (!this.currentUser) {
      userContainer.innerHTML = `
        <button id="openRegisterBtn" class="nav-btn register-nav-btn" title="Crear una cuenta nueva">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
          <span class="btn-text">Registrarse</span>
        </button>
        <button id="openAuthBtn" class="nav-btn auth-btn" title="Iniciar sesión">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span class="btn-text">Ingresar</span>
        </button>
      `;
      const regBtn = document.getElementById('openRegisterBtn');
      if (regBtn) regBtn.onclick = () => auth.openModal('register');
      const loginBtn = document.getElementById('openAuthBtn');
      if (loginBtn) loginBtn.onclick = () => auth.openModal('login');
    } else {
      const isAdmin = this.isAdmin();
      const firstName = this.currentUser.name.split(' ')[0];
      const roleLabel = isAdmin ? 'Administrador' : 'Cliente';
      userContainer.innerHTML = `
        ${isAdmin ? `
          <a href="/admin.html" class="nav-btn admin-link-btn" title="Panel de Administración">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span class="btn-text">Panel Admin</span>
          </a>
        ` : ''}
        <div class="user-menu-dropdown">
          <button id="userDropdownTrigger" class="nav-btn user-btn ${isAdmin ? 'admin-highlight-btn' : ''}" title="Cuenta: ${this.currentUser.name} (${roleLabel})">
            <span class="user-avatar-badge ${isAdmin ? 'admin-badge' : ''}">${firstName.charAt(0).toUpperCase()}</span>
            <span class="user-name-label">${firstName}</span>
            <span class="user-role-pill ${isAdmin ? 'admin-role' : 'client-role'}">${roleLabel}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div id="userDropdownContent" class="dropdown-content">
            <div class="dropdown-header">
              <span class="dropdown-user-fullname">${this.currentUser.name}</span>
              <span class="dropdown-user-email">${this.currentUser.email}</span>
              <span class="dropdown-user-role ${this.currentUser.role}">Rol asignado: ${roleLabel}</span>
            </div>
            ${isAdmin ? `
              <a href="/admin.html" class="dropdown-item gold-highlight" style="background: rgba(197, 160, 89, 0.15); border-left: 3px solid var(--gold-light);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <strong>Ir al Panel de Administración &rarr;</strong>
              </a>
            ` : ''}
            <button id="viewOrdersBtn" class="dropdown-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              Mis Pedidos
            </button>
            <div class="dropdown-divider"></div>
            <button id="logoutBtn" class="dropdown-item logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Cerrar Sesión
            </button>
          </div>
        </div>
      `;

      const trigger = document.getElementById('userDropdownTrigger');
      const menu = document.getElementById('userDropdownContent');
      if (trigger && menu) {
        trigger.onclick = (e) => {
          e.stopPropagation();
          menu.classList.toggle('active');
        };
        document.addEventListener('click', () => menu.classList.remove('active'));
      }

      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) logoutBtn.onclick = () => auth.logout();

      const viewOrdersBtn = document.getElementById('viewOrdersBtn');
      if (viewOrdersBtn) {
        viewOrdersBtn.onclick = () => {
          window.dispatchEvent(new CustomEvent('vlr:view-orders', { detail: { email: this.currentUser.email } }));
        };
      }
    }
  },

  openModal(initialTab = 'login') {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.classList.add('active');
    this.switchTab(initialTab);
  },

  closeModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.remove('active');
  },

  switchTab(tab) {
    const tabLogin = document.getElementById('tabLoginBtn');
    const tabRegister = document.getElementById('tabRegisterBtn');
    const formLogin = document.getElementById('loginForm');
    const formRegister = document.getElementById('registerForm');
    const authError = document.getElementById('authError');
    if (authError) authError.textContent = '';

    if (tab === 'login') {
      tabLogin?.classList.add('active');
      tabRegister?.classList.remove('active');
      if (formLogin) formLogin.style.display = 'block';
      if (formRegister) formRegister.style.display = 'none';
    } else {
      tabLogin?.classList.remove('active');
      tabRegister?.classList.add('active');
      if (formLogin) formLogin.style.display = 'none';
      if (formRegister) formRegister.style.display = 'block';
    }
  }
};
