// Auto-redirect if accessed subpaths without index.html
if (window.location.pathname === '/oyes' || window.location.pathname === '/oyes/') {
    window.location.href = '/oyes/index.html' + window.location.search;
} else if (window.location.pathname === '/torneo' || window.location.pathname === '/torneo/') {
    window.location.href = '/torneo/index.html' + window.location.search;
}

import { createClient } from '@supabase/supabase-js';
import { hashPassword, renderUsersModule } from './users.js';
import { renderDashboardModule } from './dashboard.js';

const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 'https://tztolxgsaktqindoimtu.supabase.co';
const SUPABASE_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dG9seGdzYWt0cWluZG9pbXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzQ4ODAsImV4cCI6MjEwMTg1MDg4MH0.E2GABiOMXYb5hEwE9ErIcJa6_LHkj9lJUglQVoiLl0M';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
const db = supabaseClient.schema('colimaGC');
const usersDb = supabaseClient.schema('usuarios');

// ================================================
// AUTH & PERMISSIONS SYSTEM
// ================================================
const CREDENTIALS_ADMIN = { username: 'colimagc', password: 'colimagc2026', role: 'admin', name: 'Administrador' };

const getActiveUser = () => {
    const data = sessionStorage.getItem('cgc_user_data');
    if (data) {
        try { return JSON.parse(data); } catch (e) { console.warn(e); }
    }
    const legacyAuth = sessionStorage.getItem('cgc_auth');
    if (legacyAuth === 'admin' || legacyAuth === '1') {
        return {
            username: 'colimagc',
            full_name: 'Administrador',
            role: 'admin',
            allowed_sections: ['dashboard', 'tournaments', 'members', 'casaclub', 'caddiemaster', 'handicaphub', 'reports', 'noticias', 'landing', 'users']
        };
    } else if (legacyAuth === 'caddie') {
        return {
            username: 'caddiemaster',
            full_name: 'Caddie Master',
            role: 'caddie',
            allowed_sections: ['dashboard', 'casaclub', 'caddiemaster', 'landing']
        };
    }
    return null;
};

let currentUser = getActiveUser();

window.hasPermission = (sectionKey) => {
    const user = getActiveUser();
    if (!user) return false;
    if (user.role === 'admin' || user.username === 'colimagc') return true;
    const allowed = Array.isArray(user.allowed_sections) ? user.allowed_sections : ['tournaments'];
    return allowed.includes(sectionKey);
};

const app = document.getElementById('app');

// ================================================
// NOTIFICATION SYSTEM
// ================================================
window.showNotification = (title, message, type = 'success', onConfirm = null) => {
    const existing = document.querySelector('.notification-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'notification-overlay';

    const iconMap = { success: 'check_circle', error: 'warning', confirm: 'help' };
    const iconClassMap = { success: 'notify-success', error: 'notify-error', confirm: 'notify-confirm' };

    overlay.innerHTML = `
        <div class="notification-modal">
            <div class="notify-icon ${iconClassMap[type] || 'notify-success'}">
                <span class="material-icons" style="font-size:2.5rem">${iconMap[type] || 'check_circle'}</span>
            </div>
            <h2 class="text-2xl font-bold mb-2 text-slate-900 dark:text-white">${title}</h2>
            <p class="text-slate-500 mb-8">${message}</p>
            <div class="flex gap-4">
                ${onConfirm ? `
                    <button class="notify-btn btn-confirm flex-1 font-bold py-3" id="confirm-yes">Sí, Proceder</button>
                    <button class="notify-btn btn-cancel flex-1 font-bold py-3" id="confirm-no">Cancelar</button>
                ` : `
                    <button class="notify-btn btn-ok font-bold py-3" id="notify-close">Entendido</button>
                `}
            </div>
        </div>`;

    document.body.appendChild(overlay);

    if (onConfirm) {
        document.getElementById('confirm-yes').onclick = () => {
            onConfirm();
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 400);
        };
        document.getElementById('confirm-no').onclick = () => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 400);
        };
    } else {
        document.getElementById('notify-close').onclick = () => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 400);
        };
    }

    setTimeout(() => overlay.classList.add('show'), 10);
};

// ================================================
// TOGGLE SIDEBAR
// ================================================
window.toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar && overlay) {
        const isVisible = sidebar.classList.contains('translate-x-0');
        if (isVisible) {
            sidebar.classList.replace('translate-x-0', '-translate-x-full');
            overlay.classList.add('hidden');
        } else {
            sidebar.classList.replace('-translate-x-full', 'translate-x-0');
            overlay.classList.remove('hidden');
        }
    }
};

// Guard wrapper for restricted views
const guardView = (sectionKey, renderFn) => {
    if (window.hasPermission(sectionKey)) {
        renderFn();
    } else {
        renderRestrictedView(sectionKey);
    }
};

const renderRestrictedView = (sectionKey) => {
    app.innerHTML = getLayout(`
        <div class="py-24 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-5 animate-fade-in">
            <div class="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center text-red-400">
                <span class="material-icons" style="font-size:3rem">lock</span>
            </div>
            <div>
                <h2 class="text-2xl font-black text-white uppercase tracking-tight">Acceso Restringido</h2>
                <p class="text-slate-400 text-xs mt-2 leading-relaxed">
                    No tienes permisos suficientes para acceder a la sección <span class="font-bold text-white uppercase">[${sectionKey}]</span>. Contacta al Administrador del portal para solicitar acceso.
                </p>
            </div>
            <button onclick="window.renderDashboard()" class="px-6 py-3.5 bg-primary text-slate-900 font-black rounded-xl text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-primary/20">
                Volver al Panel Principal
            </button>
        </div>
    `, sectionKey);
};

// ================================================
// LAYOUT SHELL (header + sidebar)
// ================================================
const getLayout = (content, activeTab = 'dashboard') => {
    const user = getActiveUser();
    const titleMap = {
        'dashboard': 'Panel Principal',
        'tournaments': 'Gestión de Torneos',
        'members': 'Gestión de Socios & Membresías',
        'casaclub': 'Recepción & Tee Times (Casa Club)',
        'caddiemaster': 'Caddie Master',
        'handicaphub': 'Handicaps WHS',
        'reports': 'Reportes & Métricas Operativas',
        'noticias': 'Gestión de Noticias & Artículos',
        'users': 'Gestión de Usuarios & Permisos',
        'landing': 'Sitio Web / Landing'
    };

    return `
    <div class="flex h-screen overflow-hidden relative bg-background-dark">
        <!-- Sidebar -->
        <aside id="sidebar-menu" class="fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 transform -translate-x-full transition-transform duration-300 ease-in-out shadow-2xl">
            <div class="p-6 flex items-center justify-between border-b border-slate-800">
                <div onclick="window.renderDashboard && window.renderDashboard(); window.toggleSidebar();" class="flex items-center gap-3 cursor-pointer hover:scale-105 transition-all" title="Ir al Panel Principal">
                    <div class="flex items-center gap-2.5 p-2 bg-white/5 border border-white/10 rounded-2xl shadow-md backdrop-blur-md">
                        <img src="./golcolima.jpg" alt="Club Colima" class="h-14 w-auto object-contain rounded-xl" onerror="this.style.display='none'">
                        <img src="./logoclub.png" alt="Asociación" class="h-14 w-auto object-contain rounded-xl" onerror="this.style.display='none'">
                    </div>
                    <div>
                        <h1 class="font-black text-white text-base leading-tight uppercase">Colima GC</h1>
                        <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sistema Club</p>
                    </div>
                </div>
                <button class="p-2 text-slate-400 hover:text-primary transition-colors cursor-pointer" onclick="window.toggleSidebar()">
                    <span class="material-icons">close</span>
                </button>
            </div>
            <nav class="flex-1 mt-4 px-3 space-y-1.5 overflow-y-auto">

                ${window.hasPermission('dashboard') ? `
                <a onclick="window.renderDashboard(); window.toggleSidebar();"
                    class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold
                    ${activeTab === 'dashboard' ? 'bg-primary/10 border-l-4 border-primary text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}">
                    <span class="material-icons ${activeTab === 'dashboard' ? 'text-primary' : ''}">dashboard</span>
                    <span class="text-sm">Panel Principal</span>
                </a>
                ` : ''}

                ${window.hasPermission('tournaments') ? `
                <a onclick="window.renderTournaments(); window.toggleSidebar();"
                    class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold
                    ${activeTab === 'tournaments' ? 'bg-primary/10 border-l-4 border-primary text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}">
                    <span class="material-icons ${activeTab === 'tournaments' ? 'text-primary' : ''}">emoji_events</span>
                    <span class="text-sm">Torneos</span>
                </a>
                ` : ''}

                ${window.hasPermission('members') ? `
                <a onclick="window.renderMembers(); window.toggleSidebar();"
                    class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold
                    ${activeTab === 'members' ? 'bg-primary/10 border-l-4 border-primary text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}">
                    <span class="material-icons ${activeTab === 'members' ? 'text-primary' : ''}">groups</span>
                    <span class="text-sm">Socios & Membresías</span>
                </a>
                ` : ''}

                ${window.hasPermission('casaclub') ? `
                <a onclick="window.renderReception(); window.toggleSidebar();"
                    class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold
                    ${activeTab === 'casaclub' ? 'bg-emerald-500/10 border-l-4 border-emerald-400 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}">
                    <span class="material-icons ${activeTab === 'casaclub' ? 'text-emerald-400' : ''}">point_of_sale</span>
                    <span class="text-sm">Recepción & Tee Times</span>
                </a>
                ` : ''}

                ${window.hasPermission('caddiemaster') ? `
                <a onclick="window.renderCaddieMaster(); window.toggleSidebar();"
                    class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold
                    ${activeTab === 'caddiemaster' ? 'bg-primary/10 border-l-4 border-primary text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}">
                    <span class="material-icons ${activeTab === 'caddiemaster' ? 'text-primary' : ''}">golf_course</span>
                    <span class="text-sm">Caddie Master</span>
                </a>
                ` : ''}

                ${window.hasPermission('handicaphub') ? `
                <a onclick="window.renderHandicapHub(); window.toggleSidebar();"
                    class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold
                    ${activeTab === 'handicaphub' ? 'bg-primary/10 border-l-4 border-primary text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}">
                    <span class="material-icons ${activeTab === 'handicaphub' ? 'text-amber-400' : ''}">analytics</span>
                    <span class="text-sm">Handicaps WHS</span>
                </a>
                ` : ''}

                ${window.hasPermission('reports') ? `
                <a onclick="window.renderReports(); window.toggleSidebar();"
                    class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold
                    ${activeTab === 'reports' ? 'bg-emerald-500/10 border-l-4 border-emerald-400 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}">
                    <span class="material-icons ${activeTab === 'reports' ? 'text-emerald-400' : ''}">insights</span>
                    <span class="text-sm">Reportes & Métricas</span>
                </a>
                ` : ''}

                ${window.hasPermission('noticias') ? `
                <a onclick="window.renderNoticias(); window.toggleSidebar();"
                    class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold
                    ${activeTab === 'noticias' ? 'bg-amber-500/10 border-l-4 border-amber-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}">
                    <span class="material-icons ${activeTab === 'noticias' ? 'text-amber-400' : ''}">feed</span>
                    <span class="text-sm">Noticias & Artículos</span>
                </a>
                ` : ''}

                ${window.hasPermission('users') ? `
                <a onclick="window.renderUsers(); window.toggleSidebar();"
                    class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold
                    ${activeTab === 'users' ? 'bg-purple-500/10 border-l-4 border-purple-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}">
                    <span class="material-icons ${activeTab === 'users' ? 'text-purple-400' : ''}">manage_accounts</span>
                    <span class="text-sm">Gestión Usuarios</span>
                </a>
                ` : ''}

                <div class="pt-3 border-t border-slate-800/80">
                    <a onclick="window.renderLandingPage(); window.toggleSidebar();"
                        class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold
                        ${activeTab === 'landing' ? 'bg-primary/10 border-l-4 border-primary text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}">
                        <span class="material-icons ${activeTab === 'landing' ? 'text-emerald-400' : ''}">language</span>
                        <span class="text-sm">Sitio Web / Landing</span>
                    </a>
                </div>

            </nav>
            <div class="p-4 border-t border-slate-800 space-y-3">
                <div onclick="logout()" class="flex items-center gap-3 px-3 py-3 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-700 transition-colors">
                    <div class="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 overflow-hidden flex items-center justify-center font-bold text-xs text-primary">
                        <img src="./golcolima.jpg" alt="Usuario" class="w-full h-full object-cover" onerror="this.style.display='none'">
                    </div>
                    <div class="flex-1 overflow-hidden">
                        <p class="text-xs font-bold text-white truncate">${user?.full_name || 'Administrador'}</p>
                        <p class="text-[10px] text-slate-500 uppercase tracking-tighter truncate">${user?.role || 'Staff'}</p>
                    </div>
                    <span class="material-icons text-slate-400 text-sm">logout</span>
                </div>

                <!-- GooWeb Sidebar Credit -->
                <a href="https://gooweb.click/" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-950/50 hover:bg-slate-800/80 border border-slate-800/80 hover:border-emerald-500/40 transition-all duration-300 group" title="Desarrollado por GooWeb">
                    <span class="text-[9px] text-slate-500 font-bold uppercase tracking-wider group-hover:text-slate-400">Powered by</span>
                    <img src="./gooweb1.png" alt="GooWeb" class="h-4 w-auto object-contain transition-transform group-hover:scale-110">
                    <span class="text-[10px] font-black text-slate-400 group-hover:text-white uppercase tracking-wide">GooWeb</span>
                    <span class="material-icons text-slate-600 group-hover:text-emerald-400 text-[10px] transition-colors">open_in_new</span>
                </a>
            </div>
        </aside>

        <!-- Sidebar Overlay -->
        <div id="sidebar-overlay" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 hidden" onclick="window.toggleSidebar()"></div>

        <!-- Main -->
        <main class="flex-1 flex flex-col overflow-hidden">
            <header class="h-20 border-b border-slate-800 bg-slate-900 px-4 sm:px-8 flex items-center justify-between shrink-0">
                <div class="flex items-center gap-4">
                    <button class="p-2 bg-slate-800 rounded-xl border border-slate-700 text-slate-400 hover:text-primary transition-all" onclick="window.toggleSidebar()">
                        <span class="material-icons">menu</span>
                    </button>
                    <div class="flex items-center gap-3">
                        <div onclick="window.renderDashboard && window.renderDashboard()" class="flex items-center gap-2.5 p-2 bg-white/5 border border-white/10 rounded-2xl shadow-md backdrop-blur-md cursor-pointer hover:scale-105 transition-all" title="Ir al Panel Principal">
                            <img src="./golcolima.jpg" alt="Club Colima" class="h-14 w-auto object-contain rounded-xl" onerror="this.style.display='none'">
                            <img src="./logoclub.png" alt="Asociación" class="h-14 w-auto object-contain rounded-xl" onerror="this.style.display='none'">
                        </div>
                        <div class="hidden sm:block">
                            <p class="text-base font-black text-white leading-tight uppercase">${titleMap[activeTab] || 'Portal Colima GC'}</p>
                            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Club de Golf Colima</p>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="window.renderDashboard()" class="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md" title="Ir al Panel Principal">
                        <span class="material-icons text-lg">dashboard</span>
                    </button>
                    <div onclick="window.renderDashboard()" class="w-11 h-11 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center overflow-hidden cursor-pointer hover:scale-105 transition-all shadow-md" title="Panel Principal">
                        <img src="./golcolima.jpg" alt="Colima Golf" class="w-full h-full object-cover rounded-2xl">
                    </div>
                </div>
            </header>
            <div class="flex-1 overflow-y-auto p-6 sm:p-8 view-container bg-background-dark">
                ${content}
            </div>
        </main>
    </div>`;
};

// ================================================
// LOGIN VIEW
// ================================================
const renderLogin = () => {
    app.innerHTML = `
    <div class="relative min-h-screen flex items-center justify-center bg-golf-hero px-4 py-12">
        <div class="w-full max-w-md animate-fade-in relative z-10">
            <div class="flex flex-col items-center mb-8">
                <div class="p-3 bg-white/5 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-md mb-3">
                    <img src="./golcolima.jpg" alt="Club Colima" class="h-20 w-auto object-contain rounded-2xl" onerror="this.style.display='none'">
                </div>
                <h1 class="text-2xl font-black text-white tracking-tight text-center uppercase">Club de Golf Colima</h1>
                <p class="text-primary font-bold text-[10px] uppercase tracking-[0.4em] mt-1">Sistema de Torneos & Club</p>
            </div>

            <div class="bg-slate-900/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-700/50">
                <div class="p-10">
                    <div class="mb-8 text-center">
                        <h2 class="text-xl font-black text-white">Portal Administrativo</h2>
                        <p class="text-slate-400 text-[10px] mt-1 font-bold uppercase tracking-wider">Ingresa con tus credenciales asignadas</p>
                    </div>
                    <form id="login-form" class="space-y-5">
                        <div class="space-y-2">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuario</label>
                            <div class="relative group">
                                <span class="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-xl">person</span>
                                <input id="username" class="block w-full pl-12 pr-4 py-4 border-2 border-slate-800 rounded-2xl bg-slate-800/50 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary transition-all text-sm font-bold" placeholder="colimagc" required type="text">
                            </div>
                        </div>
                        <div class="space-y-2">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                            <div class="relative group">
                                <span class="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-xl">lock</span>
                                <input id="password" class="block w-full pl-12 pr-4 py-4 border-2 border-slate-800 rounded-2xl bg-slate-800/50 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary transition-all text-sm font-bold" placeholder="••••••••" required type="password">
                            </div>
                        </div>
                        <div id="login-error" class="hidden text-red-400 text-xs font-bold text-center pt-1">Usuario o contraseña incorrectos.</div>
                        <div class="pt-2">
                            <button type="submit" id="login-submit-btn" class="w-full h-14 bg-primary hover:bg-primary/90 text-slate-900 font-black rounded-2xl shadow-lg shadow-primary/20 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                                <span class="material-icons text-sm">login</span> Ingresar al Sistema
                            </button>
                        </div>
                    </form>

                    <!-- LOGO ASOCIACION ABAJO DEL BOTON -->
                    <div class="mt-6 pt-4 border-t border-slate-800/80 flex flex-col items-center justify-center gap-1.5">
                        <div class="p-2 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
                            <img src="./logoclub.png" alt="Asociación" class="h-14 w-auto object-contain rounded-xl" onerror="this.style.display='none'">
                        </div>
                    </div>
                </div>
                <div class="px-10 py-5 bg-slate-800/40 border-t border-slate-700 flex flex-col items-center justify-center gap-2">
                    <div class="flex items-center gap-2">
                        <span class="material-icons text-xs text-primary">verified_user</span>
                        <p class="text-[9px] text-slate-500 font-black uppercase tracking-widest">Conexión Segura · Colima GC · 2026</p>
                    </div>
                    <a href="https://gooweb.click/" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-emerald-400 transition-colors group">
                        <span>Sistema desarrollado por</span>
                        <img src="./gooweb1.png" alt="GooWeb" class="h-3.5 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity">
                        <span class="font-black text-slate-400 group-hover:text-white uppercase">GooWeb</span>
                    </a>
                </div>
            </div>
        </div>
    </div>`;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const u = document.getElementById('username').value.trim().toLowerCase();
        const p = document.getElementById('password').value;
        const errEl = document.getElementById('login-error');
        errEl.classList.add('hidden');

        const btn = document.getElementById('login-submit-btn');
        btn.disabled = true;
        btn.innerHTML = `<span class="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span> Verificando...`;

        try {
            const inputHash = await hashPassword(p);
            let authenticatedUser = null;

            // 1. Try fetching from Supabase "usuarios".portal_users table
            try {
                const { data, error } = await usersDb.from('portal_users').select('*').eq('username', u).eq('is_active', true).single();
                if (!error && data) {
                    if (data.password_hash === inputHash || data.password_hash === p) {
                        authenticatedUser = data;
                    }
                }
            } catch (errDb) {
                console.warn('DB auth check failed:', errDb);
            }

            // 2. Fallback to local cached users if database failed or user not found
            if (!authenticatedUser) {
                const cachedUsersStr = localStorage.getItem('cgc_cached_users');
                if (cachedUsersStr) {
                    const cachedUsers = JSON.parse(cachedUsersStr);
                    const match = cachedUsers.find(x => x.username.toLowerCase() === u && x.is_active !== false);
                    if (match && (match.password_hash === inputHash || match.password_hash === p)) {
                        authenticatedUser = match;
                    }
                }
            }

            // 3. Fallback to default hardcoded credentials
            if (!authenticatedUser) {
                if (u === 'colimagc' && (p === 'colimagc2026' || inputHash === '8c49f828dbbc919041b9ef2b0eb58afac2f53c5699d60e9ef544f9a4eb501603')) {
                    authenticatedUser = {
                        username: 'colimagc',
                        full_name: 'Administrador',
                        role: 'admin',
                        allowed_sections: ['dashboard', 'tournaments', 'members', 'caddiemaster', 'handicaphub', 'noticias', 'landing', 'users']
                    };
                } else if (u === 'caddiemaster' && p === 'caddiemaster2026') {
                    authenticatedUser = {
                        username: 'caddiemaster',
                        full_name: 'Caddie Master',
                        role: 'caddie',
                        allowed_sections: ['dashboard', 'caddiemaster', 'landing']
                    };
                }
            }

            if (authenticatedUser) {
                currentUser = authenticatedUser;
                sessionStorage.setItem('cgc_user_data', JSON.stringify(authenticatedUser));
                sessionStorage.setItem('cgc_auth', authenticatedUser.role);
                routeUserToAllowedSection();
            } else {
                errEl.classList.remove('hidden');
                btn.disabled = false;
                btn.innerHTML = `<span class="material-icons text-sm">login</span> Ingresar al Sistema`;
            }
        } catch (err) {
            console.error('Login error:', err);
            errEl.classList.remove('hidden');
            btn.disabled = false;
            btn.innerHTML = `<span class="material-icons text-sm">login</span> Ingresar al Sistema`;
        }
    });
};

// ================================================
// LOGOUT
// ================================================
window.logout = () => {
    currentUser = null;
    sessionStorage.removeItem('cgc_auth');
    sessionStorage.removeItem('cgc_user_data');
    renderLogin();
};

// ================================================
// DASHBOARD VIEW
// ================================================
window.renderDashboard = async () => {
    guardView('dashboard', async () => {
        app.innerHTML = getLayout('<div id="dashboard-app-root"></div>', 'dashboard');
        const container = document.getElementById('dashboard-app-root');
        if (container) {
            renderDashboardModule(container, db, supabaseClient, window.hasPermission);
        }
    });
};

// ================================================
// TOURNAMENTS LIST VIEW
// ================================================
const renderTournaments = async () => {
    guardView('tournaments', async () => {
        app.innerHTML = getLayout(`
            <div class="animate-fade-in space-y-6">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-3xl font-black tracking-tight text-white">Gestión de Torneos</h2>
                        <p class="text-slate-500 mt-1">Administración de instancias de Golf Target.</p>
                    </div>
                    <button onclick="renderNewTournament()" class="flex items-center gap-2 px-6 py-3 bg-primary text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20">
                        <span class="material-icons text-lg">add</span> Nuevo Proyecto
                    </button>
                </div>
                <div id="tournaments-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div class="col-span-full flex items-center justify-center py-16">
                        <div class="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    </div>
                </div>
            </div>`, 'tournaments');

        const { data, error } = await db.from('tournaments').select('*');

        const grid = document.getElementById('tournaments-grid');
        if (!grid) return;

        if (error || !data || data.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full py-24 flex flex-col items-center justify-center gap-4 text-center">
                    <div class="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center">
                        <span class="material-icons text-slate-600" style="font-size:2rem">emoji_events</span>
                    </div>
                    <p class="text-slate-500 font-bold uppercase tracking-widest text-xs">No hay torneos aún.</p>
                    <button onclick="renderNewTournament()" class="mt-2 px-5 py-2.5 bg-primary text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        Crear el primer torneo
                    </button>
                </div>`;
            return;
        }

        function parseTournamentDate(t) {
            if (t.date) return new Date(t.date);
            if (t.config?.date) return new Date(t.config.date);
            const name = t.name || '';
            const months = {
                ene: 0, enero: 0, feb: 1, febrero: 1, mar: 2, marzo: 2, abr: 3, abril: 3,
                may: 4, mayo: 4, jun: 5, junio: 5, jul: 6, julio: 6, ago: 7, agosto: 7,
                sep: 8, sept: 8, septiembre: 8, oct: 9, octubre: 9, nov: 10, noviembre: 10,
                dic: 11, diciembre: 11
            };
            const regex = /(\d{1,2})\s*(?:al\s*\d{1,2}\s*)?(?:de\s*)?[\/\-]?\s*(ene|enero|feb|febrero|mar|marzo|abr|abril|may|mayo|jun|junio|jul|julio|ago|agosto|sep|sept|septiembre|oct|octubre|nov|noviembre|dic|diciembre)/i;
            const m = name.match(regex);
            if (m) {
                const day = parseInt(m[1]);
                const monthKey = m[2].toLowerCase();
                const month = months[monthKey] !== undefined ? months[monthKey] : 0;
                const yearMatch = name.match(/(?:20)?(2[5-9])/);
                const year = yearMatch ? 2000 + parseInt(yearMatch[1]) : 2026;
                return new Date(year, month, day);
            }
            return new Date(t.created_at || Date.now());
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Sort tournaments chronologically by their real tournament date
        const sortedTournaments = [...data].sort((a, b) => parseTournamentDate(a) - parseTournamentDate(b));

        grid.innerHTML = sortedTournaments.map(t => {
            const courses = t.courses || '—';
            const tDate = parseTournamentDate(t);
            const isPast = tDate < today;
            const formattedDate = tDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
            const visorUrl = `${window.location.origin}/torneo/?id=${t.id}`;
            const posterThumb = t.config?.poster_url || './golcolima.jpg';
            return `
                <div class="group bg-slate-900 border ${isPast ? 'border-slate-800 hover:border-amber-500/40' : 'border-emerald-500/30 hover:border-emerald-400 shadow-lg shadow-emerald-500/5'} rounded-2xl p-6 transition-all cursor-pointer flex flex-col gap-5" onclick="renderTournamentDetail('${t.id}')">
                    <div class="flex items-start justify-between">
                        <div class="flex items-center gap-2 flex-wrap">
                            <div class="w-12 h-12 ${isPast ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-500/20'} rounded-2xl overflow-hidden flex items-center justify-center shrink-0">
                                <img src="${posterThumb}" alt="${t.name}" class="w-full h-full object-cover" onerror="this.src='./golcolima.jpg'">
                            </div>
                            <span class="px-2.5 py-0.5 rounded-full ${isPast ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300' : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'} text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5">
                                <span class="w-1.5 h-1.5 rounded-full ${isPast ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}"></span>
                                ${isPast ? 'Finalizado' : 'Próximo Torneo'}
                            </span>
                            ${(t.config?.totalDays || 1) > 1 ? `
                            <span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                <span class="material-icons" style="font-size:11px">date_range</span> ${t.config.totalDays} Días
                            </span>` : ''}
                        </div>
                        <div class="flex gap-1.5 shrink-0">
                            <button onclick="event.stopPropagation(); renderEditTournament('${t.id}')" class="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors text-slate-400 hover:text-white cursor-pointer" title="Editar">
                                <span class="material-icons" style="font-size:16px">edit</span>
                            </button>
                            <button onclick="event.stopPropagation(); deleteTournament('${t.id}', '${t.name}')" class="w-8 h-8 bg-slate-800 hover:bg-red-900/40 rounded-lg flex items-center justify-center transition-colors text-slate-400 hover:text-red-400 cursor-pointer" title="Eliminar">
                                <span class="material-icons" style="font-size:16px">delete</span>
                            </button>
                        </div>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-lg font-black uppercase tracking-tight text-white leading-tight">${t.name}</h3>
                        <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 mt-1">
                            <span class="material-icons" style="font-size:12px">location_on</span> ${courses}
                        </p>
                        <p class="text-[11px] font-bold ${isPast ? 'text-amber-400/90' : 'text-emerald-400'} mt-2 flex items-center gap-1.5">
                            <span class="material-icons" style="font-size:14px">${isPast ? 'event_available' : 'event'}</span>
                            <span>Fecha: ${formattedDate}</span>
                        </p>
                    </div>
                    <div class="border-t border-slate-800 pt-4 flex items-center justify-between">
                        <span class="text-[10px] font-black uppercase tracking-widest ${isPast ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'} flex items-center gap-1 cursor-pointer hover:underline" onclick="event.stopPropagation(); renderTournamentDetail('${t.id}')">
                            Master Console <span class="material-icons" style="font-size:14px">arrow_forward</span>
                        </span>
                        <a href="${visorUrl}" target="_blank" onclick="event.stopPropagation()" class="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white flex items-center gap-1 transition-colors">
                            <span class="material-icons" style="font-size:14px">open_in_new</span> Visor
                        </a>
                    </div>
                </div>`;
        }).join('');
    });
};

// ================================================
// TOURNAMENT FORM (New / Edit)
// ================================================
const renderTournamentForm = async (tournament = null) => {
    const isEdit = !!tournament;
    const t = tournament || { name: '', courses: '' };

    window._editConfig = (isEdit && t.config) ? t.config : null;
    window._editId     = t.id || '';
    window._formTotalDays = (t.config && t.config.totalDays) ? parseInt(t.config.totalDays) : 1;
    window._formDayLabels = (t.config && Array.isArray(t.config.dayLabels)) ? [...t.config.dayLabels] : ['DÍA 1', 'DÍA 2', 'DÍA 3', 'DÍA 4'];
    window._formPosterUrl = (t.config && t.config.poster_url) ? t.config.poster_url : '';
    window._formPosterFile = null;

    const compressTournamentPoster = (file, maxWidth = 1000, maxHeight = 1300, quality = 0.82) => {
        return new Promise((resolve) => {
            if (!file || !file.type.startsWith('image/')) {
                resolve({ file, dataUrl: '' });
                return;
            }
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (ev) => {
                const img = new Image();
                img.src = ev.target.result;
                img.onload = () => {
                    let w = img.width;
                    let h = img.height;
                    if (w > maxWidth || h > maxHeight) {
                        if (w / maxWidth > h / maxHeight) {
                            h = Math.round((h * maxWidth) / w);
                            w = maxWidth;
                        } else {
                            w = Math.round((w * maxHeight) / h);
                            h = maxHeight;
                        }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, w, h);
                    const mime = 'image/webp';
                    const dataUrl = canvas.toDataURL(mime, quality);
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
                            const webpFile = new File([blob], cleanName, { type: mime, lastModified: Date.now() });
                            resolve({ file: webpFile, dataUrl });
                        } else {
                            resolve({ file, dataUrl: ev.target.result });
                        }
                    }, mime, quality);
                };
                img.onerror = () => resolve({ file, dataUrl: ev.target.result });
            };
            reader.onerror = () => resolve({ file, dataUrl: '' });
        });
    };

    window.handleTournamentPosterChange = async (inputEl) => {
        const file = inputEl?.files?.[0];
        if (!file) return;
        const { file: optimizedFile, dataUrl } = await compressTournamentPoster(file);
        window._formPosterFile = optimizedFile;
        window._formPosterUrl = dataUrl;
        window.refreshTournamentPosterPreview();
        inputEl.value = '';
    };

    window.clearTournamentPoster = () => {
        window._formPosterFile = null;
        window._formPosterUrl = '';
        window.refreshTournamentPosterPreview();
    };

    window.refreshTournamentPosterPreview = () => {
        const imgEl = document.getElementById('t-poster-preview-img');
        const badgeEl = document.getElementById('t-poster-badge');
        const btnClear = document.getElementById('t-poster-clear-btn');
        const hasCustom = !!window._formPosterUrl;
        if (imgEl) {
            imgEl.src = hasCustom ? window._formPosterUrl : './golcolima.jpg';
        }
        if (badgeEl) {
            badgeEl.textContent = hasCustom ? 'Cartel Personalizado del Torneo' : 'Por Defecto: Logo del Club';
            badgeEl.className = hasCustom
                ? 'px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[9px] font-black uppercase tracking-widest'
                : 'px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[9px] font-black uppercase tracking-widest';
        }
        if (btnClear) {
            if (hasCustom) btnClear.classList.remove('hidden');
            else btnClear.classList.add('hidden');
        }
    };

    window.setFormTotalDays = (days) => {
        window._formTotalDays = days;
        [1, 2, 3, 4].forEach(d => {
            const btn = document.getElementById(`form-day-btn-${d}`);
            if (!btn) return;
            if (d === days) {
                btn.className = 'py-3 rounded-xl border-2 border-primary bg-primary/15 text-primary font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-primary/10';
            } else {
                btn.className = 'py-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:text-white font-black text-xs uppercase tracking-wider transition-all';
            }
        });
        const labelsWrap = document.getElementById('form-day-labels-wrap');
        if (labelsWrap) {
            if (days > 1) {
                labelsWrap.classList.remove('hidden');
                labelsWrap.innerHTML = Array.from({ length: days }, (_, idx) => `
                    <div>
                        <label class="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Etiqueta Día ${idx + 1}</label>
                        <input id="form-day-label-${idx}" value="${window._formDayLabels[idx] || `DÍA ${idx + 1}`}"
                            oninput="window._formDayLabels[${idx}] = this.value.toUpperCase()"
                            placeholder="Ej. DÍA ${idx + 1} (JUE 5 NOV)"
                            class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold uppercase focus:outline-none focus:border-primary transition-all">
                    </div>
                `).join('');
            } else {
                labelsWrap.classList.add('hidden');
            }
        }
    };

    app.innerHTML = getLayout(`
        <div class="animate-fade-in max-w-xl mx-auto space-y-6">
            <div class="flex items-center gap-4">
                <button onclick="renderTournaments()" class="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center transition-colors">
                    <span class="material-icons text-slate-400">arrow_back</span>
                </button>
                <div>
                    <h2 class="text-2xl font-black text-white">${isEdit ? 'Editar Torneo' : 'Nuevo Torneo'}</h2>
                    <p class="text-slate-500 text-sm">${isEdit ? 'Modifica los datos del torneo.' : 'Crea una nueva instancia de torneo (1 a 4 días).'}</p>
                </div>
            </div>

            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
                <div class="space-y-2">
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Torneo *</label>
                    <input id="t-name" value="${t.name || ''}" class="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-primary transition-all font-bold text-lg" placeholder="Ej. TORNEO ANUAL DEL CLUB 5 AL 8 NOV 2026" type="text">
                </div>
                <div class="space-y-2">
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Campo(s) / Sede</label>
                    <input id="t-courses" value="${t.courses || 'Club de Golf Colima'}" class="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-primary transition-all font-bold" placeholder="Ej. Club de Golf Colima" type="text">
                    <p class="text-[10px] text-slate-600">Separa múltiples campos con coma.</p>
                </div>

                <!-- DURACIÓN DEL TORNEO (1 A 4 DÍAS) -->
                <div class="space-y-3 pt-2 border-t border-slate-800">
                    <div>
                        <label class="block text-[10px] font-black text-emerald-400 uppercase tracking-widest">Duración del Evento (Días / Rondas de Juego)</label>
                        <p class="text-[11px] text-slate-400 mt-0.5">En eventos de 2 a 4 días subes a los jugadores una sola vez, capturas scores por día y el Leaderboard suma los golpes acumulados.</p>
                    </div>
                    <div class="grid grid-cols-4 gap-2.5">
                        ${[1, 2, 3, 4].map(d => `
                            <button type="button" id="form-day-btn-${d}" onclick="setFormTotalDays(${d})"
                                class="${window._formTotalDays === d ? 'py-3 rounded-xl border-2 border-primary bg-primary/15 text-primary font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-primary/10' : 'py-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:text-white font-black text-xs uppercase tracking-wider transition-all'}">
                                ${d} ${d === 1 ? 'Día' : 'Días'}
                            </button>
                        `).join('')}
                    </div>
                    <div id="form-day-labels-wrap" class="${window._formTotalDays > 1 ? '' : 'hidden'} grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        ${Array.from({ length: window._formTotalDays }, (_, idx) => `
                            <div>
                                <label class="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Etiqueta Día ${idx + 1}</label>
                                <input id="form-day-label-${idx}" value="${window._formDayLabels[idx] || `DÍA ${idx + 1}`}"
                                    oninput="window._formDayLabels[${idx}] = this.value.toUpperCase()"
                                    placeholder="Ej. DÍA ${idx + 1} (JUE 5 NOV)"
                                    class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold uppercase focus:outline-none focus:border-primary transition-all">
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- CARTEL / IMAGEN DEL TORNEO (OPCIONAL, CON FALLBACK AL LOGO DEL CLUB) -->
                <div class="space-y-3 pt-4 border-t border-slate-800">
                    <div class="flex items-center justify-between gap-2">
                        <div>
                            <label class="block text-[10px] font-black text-amber-400 uppercase tracking-widest">Imagen / Cartel del Torneo (Opcional)</label>
                            <p class="text-[11px] text-slate-400 mt-0.5">Se muestra en la portada principal ("En Competencia Ahora / Próximo Torneo"). Si no subes imagen, se usa automáticamente el <strong>Logo del Club de Golf Colima</strong>.</p>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-950/70 border border-slate-800 rounded-2xl">
                        <div class="w-32 h-36 rounded-2xl overflow-hidden border-2 border-slate-700 bg-white flex items-center justify-center shrink-0 shadow-lg">
                            <img id="t-poster-preview-img" src="${window._formPosterUrl || './golcolima.jpg'}" alt="Vista previa del torneo" class="w-full h-full object-cover" onerror="this.src='./golcolima.jpg'">
                        </div>

                        <div class="flex-1 space-y-3 text-center sm:text-left w-full">
                            <div>
                                <span id="t-poster-badge" class="${window._formPosterUrl ? 'px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[9px] font-black uppercase tracking-widest' : 'px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[9px] font-black uppercase tracking-widest'}">
                                    ${window._formPosterUrl ? 'Cartel Personalizado del Torneo' : 'Por Defecto: Logo del Club'}
                                </span>
                            </div>

                            <input id="t-poster-file-input" type="file" accept="image/*" class="hidden" onchange="handleTournamentPosterChange(this)">

                            <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                <button type="button" onclick="document.getElementById('t-poster-file-input').click()"
                                    class="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/20">
                                    <span class="material-icons text-sm">upload</span> Subir Imagen / Cartel
                                </button>
                                <button type="button" id="t-poster-clear-btn" onclick="clearTournamentPoster()"
                                    class="${window._formPosterUrl ? '' : 'hidden'} px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer">
                                    <span class="material-icons text-sm">restart_alt</span> Usar Logo del Club
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex gap-4">
                <button onclick="renderTournaments()" class="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black uppercase tracking-widest text-xs transition-all">
                    Cancelar
                </button>
                <button id="btn-save-tournament" onclick="saveTournament()"
                    class="flex-1 py-4 bg-primary text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20">
                    ${isEdit ? 'Guardar Cambios' : 'Crear Torneo'}
                </button>
            </div>
        </div>`, 'tournaments');
};

window.renderNewTournament = () => renderTournamentForm(null);
window.renderEditTournament = async (id) => {
    const { data } = await db.from('tournaments').select('*').eq('id', id).single();
    if (data) renderTournamentForm(data);
};

window.saveTournament = async () => {
    const name    = document.getElementById('t-name')?.value.trim();
    const courses = document.getElementById('t-courses')?.value.trim();
    const existingId = window._editId || '';
    const totalDays = window._formTotalDays || 1;
    const dayLabels = (window._formDayLabels || ['DÍA 1', 'DÍA 2', 'DÍA 3', 'DÍA 4']).slice(0, totalDays).map((l, i) => (l && l.trim()) ? l.trim().toUpperCase() : `DÍA ${i + 1}`);

    if (!name) {
        window.showNotification('Campo requerido', 'Por favor ingresa el nombre del torneo.', 'error');
        return;
    }

    const saveBtn = document.getElementById('btn-save-tournament');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Guardando...';
    }

    let finalPosterUrl = window._formPosterUrl || '';

    // Si el usuario seleccionó un archivo nuevo, intentar subirlo a /upload.php; si no responde (ej. local), guardar el WebP optimizado
    if (window._formPosterFile) {
        const formData = new FormData();
        formData.append('image', window._formPosterFile);
        const uploadEndpoints = ['/upload.php', `${window.location.origin}/upload.php`, 'https://colimagolf.com/upload.php'];
        for (const ep of uploadEndpoints) {
            try {
                const res = await fetch(ep, { method: 'POST', body: formData });
                if (res.ok) {
                    const json = await res.json();
                    if (json.success && (json.url || json.relative_url)) {
                        finalPosterUrl = json.url || json.relative_url;
                        break;
                    }
                }
            } catch (eUp) {}
        }
    }

    const baseConfig = (existingId && window._editConfig)
        ? { ...window._editConfig }
        : { teamSize: 1, categories: [], modalidad: 'STROKE PLAY (INDIVIDUAL)' };

    baseConfig.totalDays = totalDays;
    baseConfig.dayLabels = dayLabels;
    if (finalPosterUrl) {
        baseConfig.poster_url = finalPosterUrl;
    } else {
        delete baseConfig.poster_url;
    }

    const payload = {
        name: name.toUpperCase(),
        courses: courses || 'Club de Golf Colima',
        config: baseConfig
    };

    let error;
    if (existingId) {
        ({ error } = await db.from('tournaments').update(payload).eq('id', existingId));
    } else {
        ({ error } = await db.from('tournaments').insert([payload]));
    }

    if (error) {
        console.error(error);
        window.showNotification('Error', error.message, 'error');
    } else {
        window.showNotification('¡Listo!', existingId ? 'Torneo actualizado.' : 'Torneo creado exitosamente.', 'success');
        window._editConfig = null;
        window._editId = '';
        setTimeout(() => renderTournaments(), 1200);
    }
};

window.deleteTournament = (id, name) => {
    window.showNotification('Eliminar Torneo', `¿Estás seguro de que quieres eliminar "${name}"? Esta acción no se puede deshacer.`, 'confirm', async () => {
        await db.from('tournaments').delete().eq('id', id);
        renderTournaments();
    });
};

// ================================================
// TOURNAMENT DETAIL (Master Console)
// ================================================
window.renderTournamentDetail = async (id) => {
    const { renderTournamentSection } = await import('./tournaments_detail.js');
    renderTournamentSection(id, app, getLayout, db, supabaseClient, window.showNotification);
};

// ================================================
// MEMBERS MODULE (Socios & Membresías)
// ================================================
window.renderMembers = async () => {
    guardView('members', async () => {
        app.innerHTML = getLayout('<div id="members-app-root"></div>', 'members');
        const container = document.getElementById('members-app-root');
        if (container) {
            const { renderMembersModule } = await import('./members.js');
            renderMembersModule(container);
        }
    });
};

// ================================================
// CASA CLUB / RECEPCIÓN & TEE TIMES MODULE
// ================================================
window.renderReception = async () => {
    guardView('casaclub', async () => {
        app.innerHTML = getLayout('<div id="reception-app-root"></div>', 'casaclub');
        const container = document.getElementById('reception-app-root');
        if (container) {
            const { renderReceptionModule } = await import('./reception.js');
            renderReceptionModule(container);
        }
    });
};

// ================================================
// CADDIE MASTER MODULE (Verificación & Salidas)
// ================================================
window.renderCaddieMaster = async () => {
    guardView('caddiemaster', async () => {
        app.innerHTML = getLayout('<div id="caddie-app-root"></div>', 'caddiemaster');
        const container = document.getElementById('caddie-app-root');
        if (container) {
            const { renderCaddieMasterModule } = await import('./caddiemaster.js');
            renderCaddieMasterModule(container);
        }
    });
};

// ================================================
// HANDICAPS WHS MODULE (SpeiHandicap Hub)
// ================================================
window.renderHandicapHub = async () => {
    guardView('handicaphub', async () => {
        app.innerHTML = getLayout('<div id="handicap-app-root"></div>', 'handicaphub');
        const container = document.getElementById('handicap-app-root');
        if (container) {
            const { renderHandicapHubModule } = await import('./handicap_hub.js');
            renderHandicapHubModule(container);
        }
    });
};

// ================================================
// REPORTES & MÉTRICAS OPERATIVAS MODULE
// ================================================
window.renderReports = async () => {
    guardView('reports', async () => {
        app.innerHTML = getLayout('<div id="reports-app-root"></div>', 'reports');
        const container = document.getElementById('reports-app-root');
        if (container) {
            const { renderReportsModule } = await import('./reports.js');
            renderReportsModule(container);
        }
    });
};

// ================================================
// NOTICIAS & ARTÍCULOS MODULE
// ================================================
window.renderNoticias = async () => {
    guardView('noticias', async () => {
        app.innerHTML = getLayout('<div id="noticias-app-root"></div>', 'noticias');
        const container = document.getElementById('noticias-app-root');
        if (container) {
            const { renderNoticiasModule } = await import('./noticias.js');
            renderNoticiasModule(container, db, supabaseClient, window.showNotification);
        }
    });
};

// ================================================
// GESTIÓN DE USUARIOS MODULE
// ================================================
window.renderUsers = async () => {
    guardView('users', async () => {
        app.innerHTML = getLayout('<div id="users-app-root"></div>', 'users');
        const container = document.getElementById('users-app-root');
        if (container) {
            renderUsersModule(container, supabaseClient, window.showNotification);
        }
    });
};

// ================================================
// LANDING PAGE MODULE (Club Official Homepage)
// ================================================
window.renderLandingPage = async () => {
    app.innerHTML = '<div id="landing-app-root"></div>';
    const container = document.getElementById('landing-app-root');
    if (container) {
        const { renderLandingPageModule } = await import('./landing_page.js');
        renderLandingPageModule(container);
    }
};

window.renderLogin = renderLogin;

// ================================================
// BOOT SEQUENCE & DYNAMIC ROUTING
// ================================================
const routeUserToAllowedSection = () => {
    if (window.hasPermission('dashboard')) {
        window.renderDashboard();
    } else if (window.hasPermission('casaclub')) {
        window.renderReception();
    } else if (window.hasPermission('caddiemaster')) {
        window.renderCaddieMaster();
    } else if (window.hasPermission('reports')) {
        window.renderReports();
    } else if (window.hasPermission('noticias')) {
        window.renderNoticias();
    } else if (window.hasPermission('tournaments')) {
        window.renderTournaments();
    } else if (window.hasPermission('members')) {
        window.renderMembers();
    } else if (window.hasPermission('handicaphub')) {
        window.renderHandicapHub();
    } else if (window.hasPermission('users')) {
        window.renderUsers();
    } else {
        window.renderDashboard();
    }
};

const activeUser = getActiveUser();
if (activeUser) {
    routeUserToAllowedSection();
} else if (window.location.hash === '#admin' || window.location.hash === '#login') {
    renderLogin();
} else {
    window.renderLandingPage();
}

// Expose functions globally for inline handlers
window.renderTournaments = renderTournaments;
window.renderNewTournament = () => renderTournamentForm(null);
window.renderReception = window.renderReception;
window.renderReports = window.renderReports;
