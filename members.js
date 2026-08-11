import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 'https://tztolxgsaktqindoimtu.supabase.co';
const SUPABASE_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dG9seGdzYWt0cWluZG9pbXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzQ4ODAsImV4cCI6MjEwMTg1MDg4MH0.E2GABiOMXYb5hEwE9ErIcJa6_LHkj9lJUglQVoiLl0M';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
const dbMembers = supabaseClient.schema('members');
const dbStarter = supabaseClient.schema('starter');

let currentMembers = [];
let currentPayments = [];
let activeFilter = 'ALL';
let searchQuery = '';
let viewMode = 'TABLE'; // 'TABLE' or 'CARDS'

// Official Club de Golf Colima & WHS Tees Configuration
const TEES_CONFIG = [
    { color: 'AZUL', code: 'A', label: 'Azul', bg: 'bg-blue-600 text-white', text: 'text-blue-400', rating: 72.1, slope: 132, par: 72 },
    { color: 'BLANCO', code: 'B', label: 'Blanco', bg: 'bg-slate-200 text-slate-950', text: 'text-slate-200', rating: 67.5, slope: 105, par: 68 },
    { color: 'VERDE', code: 'V', label: 'Verde', bg: 'bg-emerald-500 text-slate-950', text: 'text-emerald-400', rating: 68.2, slope: 124, par: 72 },
    { color: 'DORADO', code: 'D', label: 'Dorado / Amarillo', bg: 'bg-amber-400 text-slate-950', text: 'text-amber-400', rating: 65.8, slope: 100, par: 68 },
    { color: 'ROJO', code: 'P', label: 'Plata / Rojo', bg: 'bg-rose-600 text-white', text: 'text-rose-400', rating: 64.5, slope: 96, par: 68 }
];

export async function renderMembersModule(container) {
    container.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
                <h2 class="text-2xl font-black text-white uppercase tracking-tight">Gestión de Socios & Membresías</h2>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Padrón de Socios, Control de Cuotas, Expedientes & Handicaps WHS</p>
            </div>
            <button id="btn-add-member" class="flex items-center justify-center gap-2 px-5 py-3 bg-primary text-slate-900 rounded-xl font-black uppercase text-xs hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                <span class="material-icons" style="font-size:18px">person_add</span> Nuevo Socio
            </button>
        </div>

        <div id="members-kpis" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Socios</p>
                    <p id="kpi-total" class="text-3xl font-black text-white mt-1">-</p>
                </div>
                <div class="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <span class="material-icons">groups</span>
                </div>
            </div>
            <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                    <p class="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Al Corriente 🟢</p>
                    <p id="kpi-active" class="text-3xl font-black text-emerald-400 mt-1">-</p>
                </div>
                <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <span class="material-icons">check_circle</span>
                </div>
            </div>
            <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                    <p class="text-[10px] font-black text-rose-400 uppercase tracking-widest">Con Adeudo 🔴</p>
                    <p id="kpi-inactive" class="text-3xl font-black text-rose-400 mt-1">-</p>
                </div>
                <div class="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <span class="material-icons">warning</span>
                </div>
            </div>
            <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                    <p class="text-[10px] font-black text-amber-400 uppercase tracking-widest">Cobrado este Mes</p>
                    <p id="kpi-income" class="text-3xl font-black text-amber-400 mt-1">$0</p>
                </div>
                <div class="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <span class="material-icons">payments</span>
                </div>
            </div>
        </div>

        <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6">
            <div class="flex flex-wrap items-center gap-3">
                <div class="relative w-full sm:w-80">
                    <span class="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                    <input id="search-member-input" type="text" placeholder="Buscar por socio, # o categoría..." class="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary transition-all font-bold">
                </div>

                <div id="filter-pills" class="flex items-center gap-2 overflow-x-auto custom-scrollbar">
                    <button data-filter="ALL" class="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-primary text-slate-900 shadow-md shadow-primary/20">Todos</button>
                    <button data-filter="ACTIVE" class="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-slate-800 text-slate-400 hover:text-white">🟢 Al Corriente</button>
                    <button data-filter="INACTIVE" class="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-slate-800 text-slate-400 hover:text-white">🔴 Con Adeudo</button>
                </div>
            </div>

            <!-- View Mode Switcher -->
            <div class="flex items-center gap-1 bg-slate-900 p-1.5 border border-slate-800 rounded-xl self-end lg:self-auto">
                <button id="btn-view-table" class="px-3 py-1.5 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all bg-slate-800 text-white border border-slate-700">
                    <span class="material-icons" style="font-size:15px">format_list_bulleted</span> Lista
                </button>
                <button id="btn-view-cards" class="px-3 py-1.5 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all text-slate-400 hover:text-white">
                    <span class="material-icons" style="font-size:15px">grid_view</span> Tarjetas
                </button>
            </div>
        </div>

        <div id="members-list-container" class="w-full">
            <div class="py-16 text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p class="text-xs text-slate-500 font-bold uppercase tracking-widest mt-3">Cargando Padrón de Socios...</p>
            </div>
        </div>
    `;

    document.getElementById('btn-add-member').onclick = () => openNewMemberModal();
    document.getElementById('search-member-input').oninput = (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        filterAndRenderMembers();
    };

    const btnTable = document.getElementById('btn-view-table');
    const btnCards = document.getElementById('btn-view-cards');

    btnTable.onclick = () => {
        viewMode = 'TABLE';
        btnTable.className = 'px-3 py-1.5 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all bg-slate-800 text-white border border-slate-700';
        btnCards.className = 'px-3 py-1.5 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all text-slate-400 hover:text-white';
        filterAndRenderMembers();
    };

    btnCards.onclick = () => {
        viewMode = 'CARDS';
        btnCards.className = 'px-3 py-1.5 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all bg-slate-800 text-white border border-slate-700';
        btnTable.className = 'px-3 py-1.5 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all text-slate-400 hover:text-white';
        filterAndRenderMembers();
    };

    document.querySelectorAll('#filter-pills button').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('#filter-pills button').forEach(b => {
                b.className = 'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-slate-800 text-slate-400 hover:text-white';
            });
            btn.className = 'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-primary text-slate-900 shadow-md shadow-primary/20';
            activeFilter = btn.dataset.filter;
            filterAndRenderMembers();
        };
    });

    await loadMembersData();
}

async function loadMembersData() {
    try {
        const [{ data: members, error: mErr }, { data: payments, error: pErr }] = await Promise.all([
            dbMembers.from('members').select('*').order('member_number', { ascending: true }),
            dbMembers.from('member_payments').select('*').order('created_at', { ascending: false })
        ]);

        if (mErr) {
            console.warn('Error loading members table:', mErr.message);
        }

        currentMembers = members || [];
        currentPayments = payments || [];

        updateKPIs();
        filterAndRenderMembers();
    } catch (e) {
        console.error('Error fetching members:', e);
        currentMembers = [];
        filterAndRenderMembers();
    }
}

function updateKPIs() {
    const today = new Date().toISOString().split('T')[0];
    const total = currentMembers.length;
    let active = 0;
    let inactive = 0;

    currentMembers.forEach(m => {
        const isPaid = m.paid_until && m.paid_until >= today && m.status === 'ACTIVE';
        if (isPaid) active++;
        else inactive++;
    });

    const currentMonthPrefix = new Date().toISOString().slice(0, 7);
    const thisMonthIncome = currentPayments
        .filter(p => p.created_at && p.created_at.startsWith(currentMonthPrefix))
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const elTotal = document.getElementById('kpi-total');
    const elActive = document.getElementById('kpi-active');
    const elInactive = document.getElementById('kpi-inactive');
    const elIncome = document.getElementById('kpi-income');

    if (elTotal) elTotal.textContent = total;
    if (elActive) elActive.textContent = active;
    if (elInactive) elInactive.textContent = inactive;
    if (elIncome) elIncome.textContent = `$${thisMonthIncome.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;
}

function filterAndRenderMembers() {
    const container = document.getElementById('members-list-container');
    if (!container) return;

    const today = new Date().toISOString().split('T')[0];

    const filtered = currentMembers.filter(m => {
        const isPaid = m.paid_until && m.paid_until >= today && m.status === 'ACTIVE';
        const matchesFilter = activeFilter === 'ALL' ||
            (activeFilter === 'ACTIVE' && isPaid) ||
            (activeFilter === 'INACTIVE' && !isPaid);

        const text = `${m.name} ${m.member_number} ${m.category} ${m.phone || ''}`.toLowerCase();
        const matchesSearch = text.includes(searchQuery);

        return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="py-16 text-center bg-slate-900/50 border border-slate-800 rounded-3xl">
                <span class="material-icons text-slate-600 text-5xl mb-3">group_off</span>
                <p class="text-sm font-black text-slate-400 uppercase tracking-widest">No se encontraron socios</p>
                <p class="text-xs text-slate-600 mt-1">Prueba con otro término de búsqueda o registra un nuevo socio.</p>
            </div>`;
        return;
    }

    if (viewMode === 'TABLE') {
        renderTableView(container, filtered, today);
    } else {
        renderCardsView(container, filtered, today);
    }
}

// RENDER TABLE VIEW (LISTA DE SOCIOS)
function renderTableView(container, members, today) {
    container.innerHTML = `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div class="overflow-x-auto custom-scrollbar">
                <table class="w-full text-left border-collapse min-w-[850px]">
                    <thead>
                        <tr class="bg-slate-950/60 border-b border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            <th class="px-6 py-4"># Socio</th>
                            <th class="px-6 py-4">Socio / Nombre</th>
                            <th class="px-6 py-4">Categoría</th>
                            <th class="px-6 py-4 text-center">Estatus Cuota</th>
                            <th class="px-6 py-4 text-center">Vence Cuota</th>
                            <th class="px-6 py-4 text-center">HCP Index</th>
                            <th class="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 text-xs">
                        ${members.map(m => {
                            const isPaid = m.paid_until && m.paid_until >= today && m.status === 'ACTIVE';
                            const initials = m.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                            const formattedPaidUntil = m.paid_until
                                ? new Date(m.paid_until + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                                : 'Sin Fecha';

                            return `
                                <tr onclick="window.openMemberProfileModal('${m.id}')"
                                    class="hover:bg-slate-800/50 transition-colors cursor-pointer group">
                                    <td class="px-6 py-4">
                                        <span class="font-black text-slate-300 bg-slate-800 border border-slate-700 px-3 py-1 rounded-lg text-[11px] tracking-wider">#${m.member_number}</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-3">
                                            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600/50 flex items-center justify-center font-black text-white text-xs shrink-0 shadow-md">
                                                ${initials}
                                            </div>
                                            <div>
                                                <p class="font-black text-white uppercase group-hover:text-primary transition-colors text-sm">${m.name}</p>
                                                <p class="text-[10px] text-slate-500 font-bold">${m.email || m.phone || 'Sin datos de contacto'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 font-black text-slate-400 uppercase text-[11px]">
                                        ${m.category || 'TITULAR'}
                                    </td>
                                    <td class="px-6 py-4 text-center">
                                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isPaid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}">
                                            <span class="w-2 h-2 rounded-full ${isPaid ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]'}"></span>
                                            ${isPaid ? 'AL CORRIENTE' : 'ADEUDO / INACTIVO'}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-center font-black ${isPaid ? 'text-emerald-400' : 'text-rose-400'} uppercase text-xs">
                                        ${formattedPaidUntil}
                                    </td>
                                    <td class="px-6 py-4 text-center font-black text-amber-400 text-sm">
                                        ${m.current_handicap !== undefined && m.current_handicap !== null ? m.current_handicap : '0.0'}
                                    </td>
                                    <td class="px-6 py-4 text-right" onclick="event.stopPropagation()">
                                        <div class="flex items-center justify-end gap-1.5">
                                            <button onclick="window.openMemberProfileModal('${m.id}')"
                                                title="Ver Expediente WHS"
                                                class="w-8 h-8 bg-slate-800 hover:bg-primary/20 hover:border-primary/40 border border-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary transition-all">
                                                <span class="material-icons" style="font-size:16px">visibility</span>
                                            </button>
                                            <button onclick="window.payMemberModal('${m.id}')"
                                                title="Registrar Pago"
                                                class="w-8 h-8 bg-slate-800 hover:bg-emerald-500/20 hover:border-emerald-500/40 border border-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-400 transition-all">
                                                <span class="material-icons" style="font-size:16px">payments</span>
                                            </button>
                                            <button onclick="window.editMemberModal('${m.id}')"
                                                title="Editar Socio"
                                                class="w-8 h-8 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all">
                                                <span class="material-icons" style="font-size:16px">edit</span>
                                            </button>
                                            <button onclick="window.deleteMemberModal('${m.id}', '${m.name.replace(/'/g, "\\'")}')"
                                                title="Eliminar Socio"
                                                class="w-8 h-8 bg-slate-800 hover:bg-rose-500/20 hover:border-rose-500/40 border border-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 transition-all">
                                                <span class="material-icons" style="font-size:16px">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
}

// RENDER CARDS VIEW (TARJETAS)
function renderCardsView(container, members, today) {
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            ${members.map(m => {
                const isPaid = m.paid_until && m.paid_until >= today && m.status === 'ACTIVE';
                const initials = m.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                const formattedPaidUntil = m.paid_until
                    ? new Date(m.paid_until + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Sin Fecha';

                return `
                    <div onclick="window.openMemberProfileModal('${m.id}')"
                        class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative flex flex-col justify-between hover:border-slate-700 transition-all group cursor-pointer">
                        <div>
                            <div class="flex items-start justify-between gap-3 mb-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600/50 flex items-center justify-center font-black text-white text-base shadow-md">
                                        ${initials}
                                    </div>
                                    <div>
                                        <span class="text-[9px] font-black uppercase bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-md tracking-wider">#${m.member_number}</span>
                                        <h3 class="font-black text-white text-base uppercase leading-snug mt-1 truncate max-w-[180px] group-hover:text-primary transition-colors">${m.name}</h3>
                                    </div>
                                </div>
                                <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0
                                    ${isPaid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}">
                                    ${isPaid ? '🟢 AL CORRIENTE' : '🔴 ADEUDO / INACTIVO'}
                                </span>
                            </div>

                            <div class="space-y-2 text-xs border-t border-slate-800 pt-4 mb-4">
                                <div class="flex justify-between items-center">
                                    <span class="text-slate-500 font-bold">Categoría:</span>
                                    <span class="font-black text-slate-300 uppercase">${m.category || 'TITULAR'}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-slate-500 font-bold">Vence Cuota:</span>
                                    <span class="font-black ${isPaid ? 'text-emerald-400' : 'text-rose-400'} uppercase">${formattedPaidUntil}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-slate-500 font-bold">Plan / Frecuencia:</span>
                                    <span class="font-black text-blue-400 uppercase">${m.payment_frequency || 'MENSUAL'}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-slate-500 font-bold">Handicap Index:</span>
                                    <span class="font-black text-amber-400">${m.current_handicap !== undefined && m.current_handicap !== null ? m.current_handicap : '0.0'}</span>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center gap-2 pt-2 border-t border-slate-800" onclick="event.stopPropagation()">
                            <button onclick="window.payMemberModal('${m.id}')"
                                class="flex-1 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-all">
                                <span class="material-icons" style="font-size:15px">payments</span> Registrar Pago
                            </button>
                            <button onclick="window.openMemberProfileModal('${m.id}')"
                                title="Ver Expediente WHS"
                                class="w-9 h-9 bg-slate-800 hover:bg-primary/20 hover:border-primary/40 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-all">
                                <span class="material-icons" style="font-size:16px">visibility</span>
                            </button>
                            <button onclick="window.editMemberModal('${m.id}')"
                                title="Editar Socio"
                                class="w-9 h-9 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
                                <span class="material-icons" style="font-size:16px">edit</span>
                            </button>
                            <button onclick="window.deleteMemberModal('${m.id}', '${m.name.replace(/'/g, "\\'")}')"
                                title="Eliminar Socio"
                                class="w-9 h-9 bg-slate-800 hover:bg-rose-500/20 hover:border-rose-500/40 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-400 transition-all">
                                <span class="material-icons" style="font-size:16px">delete</span>
                            </button>
                        </div>
                    </div>`;
            }).join('')}
        </div>`;
}

// ================================================
// MODAL: FICHA / EXPEDIENTE DE SOCIO & HANDICAP WHS (Estilo SpeiHandicap)
// ================================================
window.openMemberProfileModal = async function(memberId) {
    const member = currentMembers.find(m => String(m.id) === String(memberId));
    if (!member) return;

    let modal = document.getElementById('modal-member-crud');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-member-crud';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in';
        document.body.appendChild(modal);
    }

    const today = new Date().toISOString().split('T')[0];
    const isPaid = member.paid_until && member.paid_until >= today && member.status === 'ACTIVE';
    const initials = member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const formattedPaidUntil = member.paid_until
        ? new Date(member.paid_until + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
        : 'Sin Fecha';

    // 1. Fetch Member Scores history (from starter.member_scores)
    const { data: memberScores } = await dbStarter.from('member_scores')
        .select('*')
        .eq('member_id', member.id)
        .order('date_played', { ascending: false })
        .limit(20);

    const scoresList = memberScores || [];

    // Calculate Low H.I. (minimum differential in past 365 days)
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];

    const yearScores = scoresList.filter(s => s.date_played >= oneYearAgoStr);
    const lowHI = yearScores.length > 0
        ? Math.min(...yearScores.map(s => parseFloat(s.differential) || 99)).toFixed(1)
        : (member.current_handicap || 0.0);

    // Calculate best differentials (top N used for WHS index calculation)
    const sortedDiffs = [...scoresList].sort((a, b) => (parseFloat(a.differential) || 0) - (parseFloat(b.differential) || 0));
    const count = scoresList.length;
    let numUsed = 1;
    if (count >= 20) numUsed = 8;
    else if (count >= 19) numUsed = 7;
    else if (count >= 17) numUsed = 6;
    else if (count >= 15) numUsed = 5;
    else if (count >= 12) numUsed = 4;
    else if (count >= 9) numUsed = 3;
    else if (count >= 6) numUsed = 2;
    else numUsed = 1;

    const usedIds = new Set(sortedDiffs.slice(0, numUsed).map(s => s.id));

    // Calculate Course Handicaps per Tee
    const hi = parseFloat(member.current_handicap || 0);
    const teeHandicaps = TEES_CONFIG.map(t => {
        const raw = hi * (113 / t.slope) + (t.rating - t.par);
        const ch = Math.round(raw);
        return { ...t, ch };
    });

    // Member payments history
    const memberPaymentsList = currentPayments.filter(p => String(p.member_id) === String(member.id));

    modal.innerHTML = `
        <div class="w-full max-w-4xl bg-slate-950/95 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <!-- Header Banner SpeiHandicap Style -->
            <div class="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90">
                <div class="flex items-center gap-4">
                    <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600/50 flex items-center justify-center font-black text-white text-2xl shadow-xl shrink-0">
                        ${initials}
                    </div>
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 font-black text-[10px] rounded-md uppercase">ID / SOCIO #${member.member_number}</span>
                            <span class="px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isPaid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}">
                                ${isPaid ? '🟢 AL CORRIENTE' : '🔴 ADEUDO / INACTIVO'}
                            </span>
                        </div>
                        <h3 class="font-black uppercase text-white text-xl leading-tight">${member.name}</h3>
                        <p class="text-xs text-slate-400 font-bold uppercase mt-0.5">${member.category || 'SOCIO TITULAR'} · CLUB DE GOLF COLIMA</p>
                    </div>
                </div>

                <div class="flex items-center gap-3 self-end sm:self-auto">
                    <div class="text-right px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-2xl">
                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Handicap Índice WHS</p>
                        <p class="text-2xl font-black text-rose-500 mt-0.5">${hi.toFixed(1)}</p>
                        <p class="text-[9px] font-bold text-slate-500 uppercase">Low H.I.: <span class="text-amber-400 font-black">${lowHI}</span></p>
                    </div>
                    <button onclick="document.getElementById('modal-member-crud').classList.add('hidden')" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                        <span class="material-icons" style="font-size:18px">close</span>
                    </button>
                </div>
            </div>

            <!-- Sub Tabs Modal -->
            <div class="flex items-center gap-2 px-6 pt-4 border-b border-slate-800 bg-slate-950">
                <button id="modal-tab-whs" class="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-primary text-slate-950 shadow-md">
                    <span class="material-icons" style="font-size:16px">analytics</span> Historial WHS & Tarjetas (${scoresList.length})
                </button>
                <button id="modal-tab-payments" class="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-slate-900 text-slate-400 border border-slate-800 hover:text-white">
                    <span class="material-icons" style="font-size:16px">payments</span> Pagos de Cuotas (${memberPaymentsList.length})
                </button>
            </div>

            <!-- Body Content -->
            <div class="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
                <!-- TAB WHS HANDICAP -->
                <div id="modal-content-whs" class="space-y-6">
                    <!-- Course Handicap Per Tee Selector (Estilo SpeiHandicap Badges) -->
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Calculadora de Handicap de Campo por Marca de Salida (Tees)</p>
                        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            ${teeHandicaps.map(t => `
                                <div class="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-1">
                                    <span class="px-2.5 py-0.5 rounded-md font-black text-[10px] uppercase shadow-md ${t.bg}">${t.color}</span>
                                    <p class="text-2xl font-black ${t.text} mt-1">${t.ch}</p>
                                    <p class="text-[8px] font-bold text-slate-500 uppercase">${t.rating} / ${t.slope}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- 20 Recent WHS Rounds Table (Estilo SpeiHandicap) -->
                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-black text-white uppercase text-xs tracking-wider flex items-center gap-2">
                                <span class="material-icons text-amber-400 text-sm">history_edu</span> Historial de Rondas WHS Registradas
                            </h4>
                            <span class="text-[10px] font-bold text-slate-400 uppercase">🌟 Las rondas verdes promedian tu Handicap Index</span>
                        </div>

                        ${scoresList.length === 0 ? `
                            <div class="py-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl">
                                <span class="material-icons text-slate-600 text-4xl mb-2">golf_course</span>
                                <p class="text-xs text-slate-500 font-bold uppercase tracking-wider">Aún no hay tarjetas capturadas para este socio.</p>
                            </div>
                        ` : `
                            <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                                <table class="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr class="bg-slate-950/80 border-b border-slate-800 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                            <th class="px-4 py-3">Fecha</th>
                                            <th class="px-4 py-3">Campo</th>
                                            <th class="px-4 py-3 text-center">Tee</th>
                                            <th class="px-4 py-3 text-center">RTG / SLO</th>
                                            <th class="px-4 py-3 text-center">Score (SA)</th>
                                            <th class="px-4 py-3 text-center">Diferencial</th>
                                            <th class="px-4 py-3 text-right">Detalle</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-800/60">
                                        ${scoresList.map(s => {
                                            const isUsed = usedIds.has(s.id);
                                            const diffVal = parseFloat(s.differential || 0).toFixed(1);
                                            const teeCol = s.tee_color || 'BLANCO';
                                            return `
                                                <tr class="hover:bg-slate-800/40 transition-colors ${isUsed ? 'bg-emerald-500/5' : ''}">
                                                    <td class="px-4 py-3 text-slate-300 font-bold">${new Date(s.date_played + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                    <td class="px-4 py-3 font-black text-white uppercase text-xs">${s.course_name || 'CLUB DE GOLF COLIMA'}</td>
                                                    <td class="px-4 py-3 text-center">
                                                        <span class="px-2.5 py-0.5 rounded-md font-black text-[9px] uppercase bg-slate-800 text-slate-300 border border-slate-700">${teeCol}</span>
                                                    </td>
                                                    <td class="px-4 py-3 text-center font-bold text-slate-400">${s.course_rating || 70.5} / ${s.slope_rating || 113}</td>
                                                    <td class="px-4 py-3 text-center font-black text-white text-sm">${s.gross_score}</td>
                                                    <td class="px-4 py-3 text-center font-black text-sm ${isUsed ? 'text-emerald-400' : 'text-slate-400'}">
                                                        ${isUsed ? '🌟 ' : ''}${diffVal}
                                                    </td>
                                                    <td class="px-4 py-3 text-right">
                                                        ${s.hole_scores ? `
                                                            <button onclick="window.toggleHoleDetail('${s.id}')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-300 transition-all">
                                                                Ver Hoyos
                                                            </button>
                                                        ` : '—'}
                                                    </td>
                                                </tr>
                                                ${s.hole_scores ? `
                                                    <tr id="hole-detail-${s.id}" class="hidden bg-slate-950/80">
                                                        <td colspan="7" class="p-4">
                                                            <div class="text-[10px] font-black text-slate-400 uppercase mb-2">Desglose 18 Hoyos:</div>
                                                            <div class="grid grid-cols-9 sm:grid-cols-18 gap-1.5 text-center text-xs">
                                                                ${Object.entries(s.hole_scores).map(([hk, hv]) => `
                                                                    <div class="p-1.5 bg-slate-900 border border-slate-800 rounded-lg">
                                                                        <p class="text-[8px] font-bold text-slate-500">${hk.replace('h', '#')}</p>
                                                                        <p class="font-black text-emerald-400">${hv || '—'}</p>
                                                                    </div>
                                                                `).join('')}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ` : ''}
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `}
                    </div>
                </div>

                <!-- TAB PAYMENTS CUOTAS -->
                <div id="modal-content-payments" class="hidden space-y-4">
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="font-black text-white uppercase text-xs tracking-wider flex items-center gap-2">
                            <span class="material-icons text-emerald-400 text-sm">history</span> Historial de Pagos Recaudados
                        </h4>
                        <button onclick="document.getElementById('modal-member-crud').classList.add('hidden'); window.payMemberModal('${member.id}');"
                            class="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 rounded-lg font-black text-[10px] uppercase flex items-center gap-1 transition-all">
                            <span class="material-icons" style="font-size:14px">add</span> Registrar Nuevo Pago
                        </button>
                    </div>

                    ${memberPaymentsList.length === 0 ? `
                        <div class="py-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl">
                            <p class="text-xs text-slate-500 font-bold uppercase tracking-wider">Sin pagos registrados en el historial</p>
                        </div>
                    ` : `
                        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                            <table class="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr class="bg-slate-950/60 border-b border-slate-800 text-[9px] font-black uppercase text-slate-500 tracking-wider">
                                        <th class="px-4 py-3">Fecha de Pago</th>
                                        <th class="px-4 py-3">Monto ($)</th>
                                        <th class="px-4 py-3">Periodo</th>
                                        <th class="px-4 py-3">Nueva Vigencia</th>
                                        <th class="px-4 py-3">Notas</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-800/60">
                                    ${memberPaymentsList.map(p => `
                                        <tr class="hover:bg-slate-800/40 transition-colors">
                                            <td class="px-4 py-3 text-slate-400 font-bold">${new Date(p.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                            <td class="px-4 py-3 font-black text-amber-400">$${parseFloat(p.amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                            <td class="px-4 py-3 text-slate-300 font-bold uppercase">${p.months_added || 1} mes(es) (${p.period_type || 'MENSUAL'})</td>
                                            <td class="px-4 py-3 font-black text-emerald-400 uppercase">${new Date(p.paid_until_new + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                            <td class="px-4 py-3 text-slate-500 font-bold">${p.notes || '—'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            </div>

            <!-- Footer Actions -->
            <div class="p-5 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3">
                <div class="flex gap-2">
                    <button onclick="document.getElementById('modal-member-crud').classList.add('hidden'); window.editMemberModal('${member.id}');"
                        class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 transition-all">
                        <span class="material-icons" style="font-size:16px">edit</span> Editar Datos
                    </button>
                    <button onclick="document.getElementById('modal-member-crud').classList.add('hidden'); window.deleteMemberModal('${member.id}', '${member.name.replace(/'/g, "\\'")}');"
                        class="px-4 py-2.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 transition-all">
                        <span class="material-icons" style="font-size:16px">delete</span> Dar de Baja
                    </button>
                </div>
                <button onclick="document.getElementById('modal-member-crud').classList.add('hidden')"
                    class="px-6 py-2.5 bg-primary text-slate-900 rounded-xl font-black text-xs uppercase hover:bg-primary/90 transition-all">
                    Cerrar
                </button>
            </div>
        </div>
    `;

    const tabWhs = document.getElementById('modal-tab-whs');
    const tabPay = document.getElementById('modal-tab-payments');
    const contentWhs = document.getElementById('modal-content-whs');
    const contentPay = document.getElementById('modal-content-payments');

    tabWhs.onclick = () => {
        tabWhs.className = 'px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-primary text-slate-950 shadow-md';
        tabPay.className = 'px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-slate-900 text-slate-400 border border-slate-800 hover:text-white';
        contentWhs.classList.remove('hidden');
        contentPay.classList.add('hidden');
    };

    tabPay.onclick = () => {
        tabPay.className = 'px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-primary text-slate-950 shadow-md';
        tabWhs.className = 'px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-slate-900 text-slate-400 border border-slate-800 hover:text-white';
        contentPay.classList.remove('hidden');
        contentWhs.classList.add('hidden');
    };

    modal.classList.remove('hidden');
};

window.toggleHoleDetail = function(scoreId) {
    const row = document.getElementById(`hole-detail-${scoreId}`);
    if (row) row.classList.toggle('hidden');
};

// ================================================
// MODAL: NUEVO SOCIO
// ================================================
function openNewMemberModal() {
    let modal = document.getElementById('modal-member-crud');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-member-crud';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in';
        document.body.appendChild(modal);
    }

    const nextNum = `SOC-${String(currentMembers.length + 101).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    modal.innerHTML = `
        <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                        <span class="material-icons">person_add</span>
                    </div>
                    <div>
                        <h3 class="font-black uppercase text-white text-base">Nuevo Socio</h3>
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Dar de alta en el padrón</p>
                    </div>
                </div>
                <button onclick="document.getElementById('modal-member-crud').classList.add('hidden')" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                    <span class="material-icons" style="font-size:18px">close</span>
                </button>
            </div>

            <form id="form-save-member" class="p-6 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"># Socio / Expediente</label>
                        <input id="m-num" type="text" value="${nextNum}" required class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Categoría</label>
                        <select id="m-cat" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                            <option value="SOCIO TITULAR">SOCIO TITULAR</option>
                            <option value="SOCIO DAMA">SOCIO DAMA</option>
                            <option value="SOCIO JUVENIL">SOCIO JUVENIL</option>
                            <option value="SOCIO HONORARIO">SOCIO HONORARIO</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nombre Completo</label>
                    <input id="m-name" type="text" placeholder="Ej. Carlos Fernández" required class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Correo Electrónico</label>
                        <input id="m-email" type="email" placeholder="socio@correo.com" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Teléfono</label>
                        <input id="m-phone" type="tel" placeholder="312 000 0000" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-primary">
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Frecuencia</label>
                        <select id="m-freq" class="w-full px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                            <option value="MENSUAL">MENSUAL</option>
                            <option value="BIMESTRAL">BIMESTRAL</option>
                            <option value="TRIMESTRAL">TRIMESTRAL</option>
                            <option value="ANUAL">ANUAL</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Pagado Hasta</label>
                        <input id="m-paid" type="date" value="${today}" required class="w-full px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Handicap Index</label>
                        <input id="m-hdcp" type="number" step="0.1" value="0.0" class="w-full px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                    </div>
                </div>

                <div class="pt-4 border-t border-slate-800 flex justify-end gap-3">
                    <button type="button" onclick="document.getElementById('modal-member-crud').classList.add('hidden')" class="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-xs uppercase">Cancelar</button>
                    <button type="submit" class="px-6 py-3 bg-primary text-slate-900 rounded-xl font-black text-xs uppercase hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">Guardar Socio</button>
                </div>
            </form>
        </div>
    `;

    modal.classList.remove('hidden');

    document.getElementById('form-save-member').onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            member_number: document.getElementById('m-num').value.trim(),
            name: document.getElementById('m-name').value.trim(),
            email: document.getElementById('m-email').value.trim(),
            phone: document.getElementById('m-phone').value.trim(),
            category: document.getElementById('m-cat').value,
            payment_frequency: document.getElementById('m-freq').value,
            paid_until: document.getElementById('m-paid').value,
            current_handicap: parseFloat(document.getElementById('m-hdcp').value) || 0.0,
            status: 'ACTIVE'
        };

        const { error } = await dbMembers.from('members').insert([payload]);
        if (error) {
            window.showNotification('Error', 'No se pudo registrar el socio: ' + error.message, 'error');
            return;
        }

        window.showNotification('¡Socio Guardado!', `Se registró a ${payload.name} correctamente.`, 'success');
        modal.classList.add('hidden');
        await loadMembersData();
    };
}

// Attach to window for dynamic HTML onclick bindings
window.payMemberModal = function(memberId) {
    const member = currentMembers.find(m => String(m.id) === String(memberId));
    if (!member) return;

    let modal = document.getElementById('modal-member-crud');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-member-crud';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in';
        document.body.appendChild(modal);
    }

    const currentPaidDate = member.paid_until ? new Date(member.paid_until + 'T00:00:00') : new Date();

    modal.innerHTML = `
        <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <span class="material-icons">payments</span>
                    </div>
                    <div>
                        <h3 class="font-black uppercase text-white text-base">Registrar Pago</h3>
                        <p class="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">${member.name} (#${member.member_number})</p>
                    </div>
                </div>
                <button onclick="document.getElementById('modal-member-crud').classList.add('hidden')" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                    <span class="material-icons" style="font-size:18px">close</span>
                </button>
            </div>

            <form id="form-pay-member" class="p-6 space-y-4">
                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Periodo a Abonar</label>
                    <div class="grid grid-cols-3 gap-2 mb-3">
                        <button type="button" data-months="1" class="btn-period p-3 bg-slate-800 hover:bg-primary/20 border border-slate-700 hover:border-primary rounded-xl text-center font-black text-xs text-white uppercase transition-all flex flex-col items-center">
                            +1 Mes
                        </button>
                        <button type="button" data-months="3" class="btn-period p-3 bg-slate-800 hover:bg-primary/20 border border-slate-700 hover:border-primary rounded-xl text-center font-black text-xs text-white uppercase transition-all flex flex-col items-center">
                            +3 Meses
                        </button>
                        <button type="button" data-months="12" class="btn-period p-3 bg-slate-800 hover:bg-primary/20 border border-slate-700 hover:border-primary rounded-xl text-center font-black text-xs text-white uppercase transition-all flex flex-col items-center">
                            +1 Año
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Meses a Agregar</label>
                        <input id="pay-months" type="number" min="1" value="1" required class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Monto Pagado ($)</label>
                        <input id="pay-amount" type="number" step="50" value="1500" required class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                    </div>
                </div>

                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nueva Fecha Límite de Pago</label>
                    <input id="pay-new-date" type="date" required class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-emerald-400 focus:outline-none focus:border-primary">
                </div>

                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Notas / Recibo (Opcional)</label>
                    <input id="pay-notes" type="text" placeholder="Ej. Transferencia Banco BBVA #1234" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-primary">
                </div>

                <div class="pt-4 border-t border-slate-800 flex justify-end gap-3">
                    <button type="button" onclick="document.getElementById('modal-member-crud').classList.add('hidden')" class="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-xs uppercase">Cancelar</button>
                    <button type="submit" class="px-6 py-3 bg-emerald-500 text-slate-950 rounded-xl font-black text-xs uppercase hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">Aplicar Pago</button>
                </div>
            </form>
        </div>
    `;

    modal.classList.remove('hidden');

    const updateCalculatedDate = () => {
        const addM = parseInt(document.getElementById('pay-months').value) || 1;
        const d = new Date(currentPaidDate);
        d.setMonth(d.getMonth() + addM);
        document.getElementById('pay-new-date').value = d.toISOString().split('T')[0];
    };

    updateCalculatedDate();

    document.querySelectorAll('.btn-period').forEach(btn => {
        btn.onclick = () => {
            const m = parseInt(btn.dataset.months);
            document.getElementById('pay-months').value = m;
            updateCalculatedDate();
        };
    });

    document.getElementById('pay-months').oninput = updateCalculatedDate;

    document.getElementById('form-pay-member').onsubmit = async (e) => {
        e.preventDefault();
        const monthsAdded = parseInt(document.getElementById('pay-months').value) || 1;
        const amount = parseFloat(document.getElementById('pay-amount').value) || 0;
        const newPaidUntil = document.getElementById('pay-new-date').value;
        const notes = document.getElementById('pay-notes').value.trim();

        const { error: mErr } = await dbMembers.from('members')
            .update({
                paid_until: newPaidUntil,
                status: 'ACTIVE'
            })
            .eq('id', member.id);

        if (mErr) {
            window.showNotification('Error', 'No se pudo actualizar la cuota del socio: ' + mErr.message, 'error');
            return;
        }

        await dbMembers.from('member_payments').insert([{
            member_id: member.id,
            amount: amount,
            period_type: member.payment_frequency || 'MENSUAL',
            months_added: monthsAdded,
            paid_until_new: newPaidUntil,
            notes: notes
        }]);

        window.showNotification('¡Pago Registrado!', `El socio ${member.name} está al corriente hasta ${newPaidUntil}.`, 'success');
        modal.classList.add('hidden');
        await loadMembersData();
    };
};

window.editMemberModal = function(memberId) {
    const member = currentMembers.find(m => String(m.id) === String(memberId));
    if (!member) return;

    let modal = document.getElementById('modal-member-crud');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-member-crud';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <span class="material-icons">edit</span>
                    </div>
                    <div>
                        <h3 class="font-black uppercase text-white text-base">Editar Socio</h3>
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">${member.name}</p>
                    </div>
                </div>
                <button onclick="document.getElementById('modal-member-crud').classList.add('hidden')" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                    <span class="material-icons" style="font-size:18px">close</span>
                </button>
            </div>

            <form id="form-edit-member" class="p-6 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"># Socio</label>
                        <input id="em-num" type="text" value="${member.member_number}" required class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Categoría</label>
                        <select id="em-cat" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                            <option value="SOCIO TITULAR" ${member.category==='SOCIO TITULAR'?'selected':''}>SOCIO TITULAR</option>
                            <option value="SOCIO DAMA" ${member.category==='SOCIO DAMA'?'selected':''}>SOCIO DAMA</option>
                            <option value="SOCIO JUVENIL" ${member.category==='SOCIO JUVENIL'?'selected':''}>SOCIO JUVENIL</option>
                            <option value="SOCIO HONORARIO" ${member.category==='SOCIO HONORARIO'?'selected':''}>SOCIO HONORARIO</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nombre Completo</label>
                    <input id="em-name" type="text" value="${member.name}" required class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Correo</label>
                        <input id="em-email" type="email" value="${member.email || ''}" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Teléfono</label>
                        <input id="em-phone" type="tel" value="${member.phone || ''}" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-primary">
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Frecuencia</label>
                        <select id="em-freq" class="w-full px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                            <option value="MENSUAL" ${member.payment_frequency==='MENSUAL'?'selected':''}>MENSUAL</option>
                            <option value="BIMESTRAL" ${member.payment_frequency==='BIMESTRAL'?'selected':''}>BIMESTRAL</option>
                            <option value="TRIMESTRAL" ${member.payment_frequency==='TRIMESTRAL'?'selected':''}>TRIMESTRAL</option>
                            <option value="ANUAL" ${member.payment_frequency==='ANUAL'?'selected':''}>ANUAL</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Pagado Hasta</label>
                        <input id="em-paid" type="date" value="${member.paid_until || ''}" required class="w-full px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Handicap Index</label>
                        <input id="em-hdcp" type="number" step="0.1" value="${member.current_handicap !== undefined ? member.current_handicap : 0.0}" class="w-full px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                    </div>
                </div>

                <div class="pt-4 border-t border-slate-800 flex justify-end gap-3">
                    <button type="button" onclick="document.getElementById('modal-member-crud').classList.add('hidden')" class="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-xs uppercase">Cancelar</button>
                    <button type="submit" class="px-6 py-3 bg-blue-500 text-white rounded-xl font-black text-xs uppercase hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20">Guardar Cambios</button>
                </div>
            </form>
        </div>
    `;

    modal.classList.remove('hidden');

    document.getElementById('form-edit-member').onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            member_number: document.getElementById('em-num').value.trim(),
            name: document.getElementById('em-name').value.trim(),
            email: document.getElementById('em-email').value.trim(),
            phone: document.getElementById('em-phone').value.trim(),
            category: document.getElementById('em-cat').value,
            payment_frequency: document.getElementById('em-freq').value,
            paid_until: document.getElementById('em-paid').value,
            current_handicap: parseFloat(document.getElementById('em-hdcp').value) || 0.0
        };

        const { error } = await dbMembers.from('members').update(payload).eq('id', member.id);
        if (error) {
            window.showNotification('Error', 'No se pudieron guardar los cambios: ' + error.message, 'error');
            return;
        }

        window.showNotification('¡Socio Actualizado!', `Se modificaron los datos de ${payload.name}.`, 'success');
        modal.classList.add('hidden');
        await loadMembersData();
    };
};

window.deleteMemberModal = function(memberId, memberName) {
    window.showNotification(
        'Dar de Baja Socio',
        `¿Estás seguro de dar de baja al socio ${memberName}? Esto eliminará su registro de membresía.`,
        'confirm',
        async () => {
            const { error } = await dbMembers.from('members').delete().eq('id', memberId);
            if (error) {
                window.showNotification('Error', 'No se pudo eliminar el socio: ' + error.message, 'error');
                return;
            }
            window.showNotification('Socio Eliminado', `Se dio de baja a ${memberName}.`, 'success');
            await loadMembersData();
        }
    );
};
