// Auto-redirect if accessed subpaths without index.html
if (window.location.pathname === '/oyes' || window.location.pathname === '/oyes/') {
    window.location.href = '/oyes/index.html';
} else if (window.location.pathname === '/torneo' || window.location.pathname === '/torneo/') {
    window.location.href = '/torneo/index.html';
}


import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 'https://tztolxgsaktqindoimtu.supabase.co';
const SUPABASE_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dG9seGdzYWt0cWluZG9pbXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzQ4ODAsImV4cCI6MjEwMTg1MDg4MH0.E2GABiOMXYb5hEwE9ErIcJa6_LHkj9lJUglQVoiLl0M';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
const db = supabaseClient.schema('colimaGC');

// // ================================================
// AUTH
// ================================================
const CREDENTIALS_ADMIN = { username: 'colimagc', password: 'colimagc2026', role: 'admin', name: 'Administrador' };
const CREDENTIALS_CADDIE = { username: 'caddiemaster', password: 'caddiemaster2026', role: 'caddie', name: 'Caddie Master' };
let currentUser = null;

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

// ================================================
// LAYOUT SHELL (header + sidebar)
// ================================================
const getLayout = (content, activeTab = 'tournaments') => `
    <div class="flex h-screen overflow-hidden relative bg-background-dark">
        <!-- Sidebar -->
        <aside id="sidebar-menu" class="fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 transform -translate-x-full transition-transform duration-300 ease-in-out shadow-2xl">
            <div class="p-6 flex items-center justify-between border-b border-slate-800">
                <div class="flex items-center gap-3">
                    <div class="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-xl shadow-md">
                        <img src="./golcolima.jpg" alt="Club Colima" class="h-9 w-auto object-contain rounded-lg" onerror="this.style.display='none'">
                        <img src="./logoclub.png" alt="Asociación" class="h-9 w-auto object-contain rounded-lg" onerror="this.style.display='none'">
                    </div>
                    <div>
                        <h1 class="font-black text-white text-base leading-tight uppercase">Colima GC</h1>
                        <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sistema Club</p>
                    </div>
                </div>
                <button class="p-2 text-slate-400 hover:text-primary transition-colors" onclick="window.toggleSidebar()">
                    <span class="material-icons">close</span>
                </button>
            </div>
            <nav class="flex-1 mt-4 px-3 space-y-1.5 overflow-y-auto">
                <a onclick="window.renderLandingPage(); window.toggleSidebar();"
                    class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold
                    ${activeTab === 'landing' ? 'bg-primary/10 border-l-4 border-primary text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}">
                    <span class="material-icons ${activeTab === 'landing' ? 'text-emerald-400' : ''}">language</span>
                    <span class="text-sm">Sitio Web / Landing</span>
                </a>
                <a onclick="window.renderTournaments(); window.toggleSidebar();"
                    class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold
                    ${activeTab === 'tournaments' ? 'bg-primary/10 border-l-4 border-primary text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}">
                    <span class="material-icons ${activeTab === 'tournaments' ? 'text-primary' : ''}">emoji_events</span>
                    <span class="text-sm">Torneos</span>
                </a>
                <a onclick="window.renderMembers(); window.toggleSidebar();"
                    class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold
                    ${activeTab === 'members' ? 'bg-primary/10 border-l-4 border-primary text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}">
                    <span class="material-icons ${activeTab === 'members' ? 'text-primary' : ''}">groups</span>
                    <span class="text-sm">Socios & Membresías</span>
                </a>
                <a onclick="window.renderCaddieMaster(); window.toggleSidebar();"
                    class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold
                    ${activeTab === 'caddiemaster' ? 'bg-primary/10 border-l-4 border-primary text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}">
                    <span class="material-icons ${activeTab === 'caddiemaster' ? 'text-primary' : ''}">golf_course</span>
                    <span class="text-sm">Caddie Master</span>
                </a>
                <a onclick="window.renderHandicapHub(); window.toggleSidebar();"
                    class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold
                    ${activeTab === 'handicaphub' ? 'bg-primary/10 border-l-4 border-primary text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}">
                    <span class="material-icons ${activeTab === 'handicaphub' ? 'text-amber-400' : ''}">analytics</span>
                    <span class="text-sm">Handicaps WHS</span>
                </a>
            </nav>
            <div class="p-4 border-t border-slate-800">
                <div onclick="logout()" class="flex items-center gap-3 px-3 py-3 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-700 transition-colors">
                    <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">${currentUser?.role==='caddie'?'CM':'CG'}</div>
                    <div class="flex-1">
                        <p class="text-xs font-bold text-white">${currentUser?.full_name || 'Administrador'}</p>
                        <p class="text-[10px] text-slate-500 uppercase tracking-tighter">ColimaGC</p>
                    </div>
                    <span class="material-icons text-slate-400 text-sm">logout</span>
                </div>
            </div>
        </aside>

        <!-- Sidebar Overlay -->
        <div id="sidebar-overlay" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 hidden" onclick="window.toggleSidebar()"></div>

        <!-- Main -->
        <main class="flex-1 flex flex-col overflow-hidden">
            <header class="h-16 border-b border-slate-800 bg-slate-900 px-4 sm:px-8 flex items-center justify-between shrink-0">
                <div class="flex items-center gap-4">
                    <button class="p-2 bg-slate-800 rounded-xl border border-slate-700 text-slate-400 hover:text-primary transition-all" onclick="window.toggleSidebar()">
                        <span class="material-icons">menu</span>
                    </button>
                    <div class="flex items-center gap-3">
                        <div class="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-xl shadow-md backdrop-blur-md">
                            <img src="./golcolima.jpg" alt="Club Colima" class="h-8 w-auto object-contain rounded-lg" onerror="this.style.display='none'">
                            <img src="./logoclub.png" alt="Asociación" class="h-8 w-auto object-contain rounded-lg" onerror="this.style.display='none'">
                        </div>
                        <div>
                            <p class="text-sm font-black text-white leading-tight uppercase">${activeTab === 'members' ? 'Gestión de Socios' : 'Gestión de Torneos'}</p>
                            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Club de Golf Colima</p>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black text-sm">CG</div>
                </div>
            </header>
            <div class="flex-1 overflow-y-auto p-6 sm:p-8 view-container bg-background-dark">
                ${content}
            </div>
        </main>
    </div>`;

// ================================================
// LOGIN VIEW
// ================================================
const renderLogin = () => {
    app.innerHTML = `
    <div class="relative min-h-screen flex items-center justify-center bg-golf-hero px-4 py-12">
        <div class="w-full max-w-md animate-fade-in relative z-10">
            <div class="flex flex-col items-center mb-8">
                <div class="p-2.5 bg-white/5 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md mb-3">
                    <img src="./golcolima.jpg" alt="Club Colima" class="h-16 w-auto object-contain rounded-xl" onerror="this.style.display='none'">
                </div>
                <h1 class="text-2xl font-black text-white tracking-tight text-center uppercase">Club de Golf Colima</h1>
                <p class="text-primary font-bold text-[10px] uppercase tracking-[0.4em] mt-1">Sistema de Torneos</p>
            </div>

            <div class="bg-slate-900/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-700/50">
                <div class="p-10">
                    <div class="mb-8 text-center">
                        <h2 class="text-xl font-black text-white">Portal Administrativo</h2>
                        <p class="text-slate-400 text-[10px] mt-1 font-bold uppercase tracking-wider">Solo personal autorizado</p>
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
                            <button type="submit" class="w-full h-14 bg-primary hover:bg-primary/90 text-slate-900 font-black rounded-2xl shadow-lg shadow-primary/20 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                                <span class="material-icons text-sm">login</span> Ingresar al Sistema
                            </button>
                        </div>
                    </form>

                    <!-- LOGO ASOCIACION ABAJO DEL BOTON -->
                    <div class="mt-6 pt-4 border-t border-slate-800/80 flex flex-col items-center justify-center gap-1.5">
                        <div class="p-2 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
                            <img src="./logoclub.png" alt="Asociación" class="h-12 w-auto object-contain rounded-xl" onerror="this.style.display='none'">
                        </div>
                    </div>
                </div>
                <div class="px-10 py-5 bg-slate-800/40 border-t border-slate-700 flex items-center justify-center gap-2">
                    <span class="material-icons text-xs text-primary">verified_user</span>
                    <p class="text-[9px] text-slate-500 font-black uppercase tracking-widest">Conexión Segura · Colima GC · 2026</p>
                </div>
            </div>
        </div>
    </div>`;

    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const u = document.getElementById('username').value.trim();
        const p = document.getElementById('password').value;
        if (u === CREDENTIALS_ADMIN.username && p === CREDENTIALS_ADMIN.password) {
            currentUser = { full_name: 'Administrador', role: 'admin' };
            sessionStorage.setItem('cgc_auth', 'admin');
            renderTournaments();
        } else if (u === CREDENTIALS_CADDIE.username && p === CREDENTIALS_CADDIE.password) {
            currentUser = { full_name: 'Caddie Master', role: 'caddie' };
            sessionStorage.setItem('cgc_auth', 'caddie');
            window.renderCaddieMaster();
        } else {
            document.getElementById('login-error').classList.remove('hidden');
        }
    });
};

// ================================================
// LOGOUT
// ================================================
window.logout = () => {
    currentUser = null;
    sessionStorage.removeItem('cgc_auth');
    renderLogin();
};

// ================================================
// TOURNAMENTS LIST VIEW
// ================================================
const renderTournaments = async () => {
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
        </div>`);

    const { data, error } = await db.from('tournaments').select('*').order('created_at', { ascending: false });

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

    grid.innerHTML = data.map(t => {
        const config = t.config || {};
        const courses = t.courses || '—';
        const createdAt = new Date(t.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
        return `
            <div class="group bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer flex flex-col gap-5" onclick="renderTournamentDetail('${t.id}')">
                <div class="flex items-start justify-between">
                    <div class="w-12 h-12 bg-primary/15 border border-primary/25 rounded-2xl flex items-center justify-center">
                        <span class="material-icons text-primary">emoji_events</span>
                    </div>
                    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="event.stopPropagation(); renderEditTournament('${t.id}')" class="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors" title="Editar">
                            <span class="material-icons text-slate-400 hover:text-white" style="font-size:16px">edit</span>
                        </button>
                        <button onclick="event.stopPropagation(); deleteTournament('${t.id}', '${t.name}')" class="w-8 h-8 bg-slate-800 hover:bg-red-900/40 rounded-lg flex items-center justify-center transition-colors" title="Eliminar">
                            <span class="material-icons text-slate-400 hover:text-red-400" style="font-size:16px">delete</span>
                        </button>
                    </div>
                </div>
                <div class="flex-1">
                    <h3 class="text-lg font-black uppercase tracking-tight text-white leading-tight">${t.name}</h3>
                    <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 mt-1">
                        <span class="material-icons" style="font-size:12px">location_on</span> ${courses}
                    </p>
                    <p class="text-[10px] font-bold text-slate-600 mt-1">${createdAt}</p>
                </div>
                <div class="border-t border-slate-800 pt-4 flex items-center justify-between">
                    <span class="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 cursor-pointer hover:underline" onclick="event.stopPropagation(); renderTournamentDetail('${t.id}')">
                        Master Console <span class="material-icons" style="font-size:14px">arrow_forward</span>
                    </span>
                    <a href="/torneo/index.html?id=${t.id}" target="_blank" onclick="event.stopPropagation()" class="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white flex items-center gap-1 transition-colors">
                        <span class="material-icons" style="font-size:14px">open_in_new</span> Visor
                    </a>
                </div>
            </div>`;
    }).join('');
};

// ================================================
// TOURNAMENT FORM (New / Edit)
// ================================================
const renderTournamentForm = async (tournament = null) => {
    const isEdit = !!tournament;
    const t = tournament || { name: '', courses: '' };

    // Store existing config safely as a global (no JSON in onclick attrs)
    window._editConfig = (isEdit && t.config) ? t.config : null;
    window._editId     = t.id || '';

    app.innerHTML = getLayout(`
        <div class="animate-fade-in max-w-xl mx-auto space-y-6">
            <div class="flex items-center gap-4">
                <button onclick="renderTournaments()" class="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center transition-colors">
                    <span class="material-icons text-slate-400">arrow_back</span>
                </button>
                <div>
                    <h2 class="text-2xl font-black text-white">${isEdit ? 'Editar Torneo' : 'Nuevo Torneo'}</h2>
                    <p class="text-slate-500 text-sm">${isEdit ? 'Modifica los datos del torneo.' : 'Crea una nueva instancia de torneo.'}</p>
                </div>
            </div>

            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
                <div class="space-y-2">
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Torneo *</label>
                    <input id="t-name" value="${t.name || ''}" class="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-primary transition-all font-bold text-lg" placeholder="Ej. Torneo Día del Padre 2026" type="text">
                </div>
                <div class="space-y-2">
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Campo(s) / Sede</label>
                    <input id="t-courses" value="${t.courses || ''}" class="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-primary transition-all font-bold" placeholder="Ej. Club de Golf Colima, Altozano Colima" type="text">
                    <p class="text-[10px] text-slate-600">Separa múltiples campos con coma.</p>
                </div>
            </div>

            <div class="flex gap-4">
                <button onclick="renderTournaments()" class="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black uppercase tracking-widest text-xs transition-all">
                    Cancelar
                </button>
                <button onclick="saveTournament()"
                    class="flex-1 py-4 bg-primary text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20">
                    ${isEdit ? 'Guardar Cambios' : 'Crear Torneo'}
                </button>
            </div>
        </div>`);
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

    if (!name) {
        window.showNotification('Campo requerido', 'Por favor ingresa el nombre del torneo.', 'error');
        return;
    }

    // Preserve existing config on edit; start fresh on create
    const payload = {
        name: name.toUpperCase(),
        courses: courses || '',
        config: existingId && window._editConfig
            ? window._editConfig
            : { teamSize: 1, categories: [], modalidad: 'A GO GO' }
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
    // Import tournament detail logic from tournaments.js
    const { renderTournamentSection } = await import('./tournaments_detail.js');
    renderTournamentSection(id, app, getLayout, db, supabaseClient, window.showNotification);
};

// ================================================
// MEMBERS MODULE (Socios & Membresías)
// ================================================
window.renderMembers = async () => {
    app.innerHTML = getLayout('<div id="members-app-root"></div>', 'members');
    const container = document.getElementById('members-app-root');
    if (container) {
        const { renderMembersModule } = await import('./members.js');
        renderMembersModule(container);
    }
};

// ================================================
// CADDIE MASTER MODULE (Verificación & Salidas)
// ================================================
window.renderCaddieMaster = async () => {
    app.innerHTML = getLayout('<div id="caddie-app-root"></div>', 'caddiemaster');
    const container = document.getElementById('caddie-app-root');
    if (container) {
        const { renderCaddieMasterModule } = await import('./caddiemaster.js');
        renderCaddieMasterModule(container);
    }
};

// ================================================
// HANDICAPS WHS MODULE (SpeiHandicap Hub)
// ================================================
window.renderHandicapHub = async () => {
    app.innerHTML = getLayout('<div id="handicap-app-root"></div>', 'handicaphub');
    const container = document.getElementById('handicap-app-root');
    if (container) {
        const { renderHandicapHubModule } = await import('./handicap_hub.js');
        renderHandicapHubModule(container);
    }
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

// Expose Login for Landing Page button
window.renderLogin = renderLogin;

// ================================================
// BOOT
// ================================================
const authState = sessionStorage.getItem('cgc_auth');
if (authState === 'admin' || authState === '1') {
    currentUser = { full_name: 'Administrador', role: 'admin' };
    renderTournaments();
} else if (authState === 'caddie') {
    currentUser = { full_name: 'Caddie Master', role: 'caddie' };
    window.renderCaddieMaster();
} else if (window.location.hash === '#admin' || window.location.hash === '#login') {
    renderLogin();
} else {
    window.renderLandingPage();
}

// Expose for inline event handlers
window.renderTournaments = renderTournaments;
window.renderNewTournament = () => renderTournamentForm(null);
