import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 'https://tztolxgsaktqindoimtu.supabase.co';
const SUPABASE_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dG9seGdzYWt0cWluZG9pbXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzQ4ODAsImV4cCI6MjEwMTg1MDg4MH0.E2GABiOMXYb5hEwE9ErIcJa6_LHkj9lJUglQVoiLl0M';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
const dbColima = supabaseClient.schema('colimaGC');
const dbStarter = supabaseClient.schema('starter');

function getLocalDateString(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatCaddieFullDate(dateStr) {
    if (!dateStr) return '';
    try {
        const [y, m, d] = dateStr.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
        return dateStr;
    }
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

let allMembers = [];
let todayOutputs = [];
let todayTeeTimes = [];
let todayDrivingRange = [];
let pendingNineHoles = [];
let selectedItem = null; // Can be { type: 'MEMBER', data: member } or { type: 'TEETIME', data: booking }
let activeTab = 'TEETIMES'; // 'TEETIMES' | 'ONCOURSE' | 'LOG' | 'PRACTICA'
let realtimeChannel = null;
let selectedCaddieDate = getLocalDateString();

// Hole data for Club de Golf Colima (IN Par 34, OUT Par 34 => Par 68, Handicap Par 78)
const CLUB_COLIMA_HOLES = [
    { hole: 1,  par: 4, idx: 3 },
    { hole: 2,  par: 3, idx: 7 },
    { hole: 3,  par: 4, idx: 15 },
    { hole: 4,  par: 4, idx: 9 },
    { hole: 5,  par: 3, idx: 17 },
    { hole: 6,  par: 5, idx: 1 },
    { hole: 7,  par: 3, idx: 5 },
    { hole: 8,  par: 4, idx: 11 },
    { hole: 9,  par: 4, idx: 13 },
    { hole: 10, par: 4, idx: 4 },
    { hole: 11, par: 3, idx: 10 },
    { hole: 12, par: 4, idx: 16 },
    { hole: 13, par: 4, idx: 14 },
    { hole: 14, par: 3, idx: 18 },
    { hole: 15, par: 5, idx: 2 },
    { hole: 16, par: 3, idx: 8 },
    { hole: 17, par: 4, idx: 6 },
    { hole: 18, par: 4, idx: 12 }
];

// Club de Golf Colima oficial (9 hoyos jugados 2 veces: IN 34 + OUT 34 = Par 68)
const COURSE_PAR = 68;
const COURSE_RATING = 67.5;
const COURSE_SLOPE = 114;

export async function renderCaddieMasterModule(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Header Banner -->
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                        <span class="material-icons" style="font-size:30px">golf_course</span>
                    </div>
                    <div>
                        <div class="flex items-center gap-2.5">
                            <h2 class="text-2xl font-black text-white uppercase tracking-tight">Portal Caddie Master</h2>
                            <span class="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-black uppercase">Operación en Campo</span>
                        </div>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Control de Salidas, Sincronización con Recepción & Scorecards</p>
                    </div>
                </div>

                <!-- Date Navigation Bar -->
                <div class="flex flex-wrap items-center gap-2 bg-slate-950/80 border border-slate-800 p-2 rounded-2xl shrink-0">
                    <button id="btn-caddie-date-prev" class="w-9 h-9 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center justify-center transition-all" title="Día Anterior">
                        <span class="material-icons text-base">chevron_left</span>
                    </button>

                    <div class="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-700/80 rounded-xl">
                        <span class="material-icons text-primary text-base">calendar_today</span>
                        <input id="caddie-date-input" type="date" value="${selectedCaddieDate}" style="color-scheme: dark;"
                            class="bg-transparent text-white font-black text-xs uppercase focus:outline-none cursor-pointer">
                    </div>

                    <button id="btn-caddie-date-next" class="w-9 h-9 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center justify-center transition-all" title="Día Siguiente">
                        <span class="material-icons text-base">chevron_right</span>
                    </button>

                    <button id="btn-caddie-date-today" class="px-3 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary rounded-xl font-black text-xs uppercase tracking-wider transition-all">
                        Hoy
                    </button>

                    <button onclick="window.refreshCaddieData()" class="w-9 h-9 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center justify-center transition-all border border-slate-700" title="Actualizar Datos">
                        <span class="material-icons text-base">refresh</span>
                    </button>
                </div>
            </div>

            <!-- Pending Paid Departures Alert Banner Container -->
            <div id="caddie-pending-alert-container"></div>

            <!-- Sub Navigation Tabs -->
            <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap border-b border-slate-800 pb-3">
                <button id="tab-caddie-teetimes" class="px-3.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 sm:gap-2 bg-primary text-slate-950 shadow-md shadow-primary/20 shrink-0">
                    <span class="material-icons" style="font-size:16px">point_of_sale</span> Salidas de Recepción
                    <span id="tab-caddie-teetimes-badge" class="px-2 py-0.5 bg-slate-900 text-slate-200 rounded-md text-[10px] font-black border border-slate-700">0</span>
                </button>
                <button id="tab-caddie-oncourse" class="px-3.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 sm:gap-2 bg-slate-900 text-slate-400 border border-slate-800 hover:text-white shrink-0">
                    <span class="material-icons" style="font-size:16px">sports_golf</span> Jugadores en Campo
                    <span id="tab-caddie-oncourse-badge" class="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md text-[10px] font-black border border-emerald-500/30">0</span>
                </button>
                <button id="tab-caddie-log" class="px-3.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 sm:gap-2 bg-slate-900 text-slate-400 border border-slate-800 hover:text-white shrink-0">
                    <span class="material-icons" style="font-size:16px">history</span> Bitácora de Hoy
                    <span id="tab-caddie-badge" class="px-2 py-0.5 bg-slate-800 text-emerald-400 rounded-md text-[10px] font-black border border-slate-700">0</span>
                </button>
                <button id="tab-caddie-practica" class="px-3.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 sm:gap-2 bg-slate-900 text-slate-400 border border-slate-800 hover:text-white shrink-0">
                    <span class="material-icons" style="font-size:16px">sports_baseball</span> Práctica & Pelotas
                    <span id="tab-caddie-practica-badge" class="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-md text-[10px] font-black border border-purple-500/30">0</span>
                </button>
                <button id="btn-pending-nine-holes" onclick="window.openPendingNineHolesModal()" class="px-3.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 sm:gap-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 shrink-0">
                    <span class="material-icons text-amber-400" style="font-size:16px">timer</span> Scores Pendientes (9H)
                    <span id="tab-caddie-p9-badge" class="px-2 py-0.5 bg-amber-500 text-slate-950 rounded-md text-[10px] font-black">0</span>
                </button>
            </div>

            <!-- Tab Content 1: Salidas & Tee Times de Recepción (Principal / Predeterminada) -->
            <div id="caddie-tab-teetimes" class="space-y-6">
                <!-- Summary KPI Cards -->
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Grupos Agendados</p>
                            <h4 id="kpi-caddie-total-groups" class="text-2xl font-black text-white mt-1">0</h4>
                            <p class="text-[10px] font-bold text-slate-400 mt-0.5">Total en recepción</p>
                        </div>
                        <div class="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                            <span class="material-icons">groups</span>
                        </div>
                    </div>

                    <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Listos por Salir</p>
                            <h4 id="kpi-caddie-pending-groups" class="text-2xl font-black text-amber-400 mt-1">0</h4>
                            <p class="text-[10px] font-bold text-slate-400 mt-0.5">Pagados / En Tee</p>
                        </div>
                        <div class="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                            <span class="material-icons">pending_actions</span>
                        </div>
                    </div>

                    <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Grupos en Campo</p>
                            <h4 id="kpi-caddie-oncourse-groups" class="text-2xl font-black text-emerald-400 mt-1">0</h4>
                            <p class="text-[10px] font-bold text-slate-400 mt-0.5">Jugando actualmente</p>
                        </div>
                        <div class="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <span class="material-icons">sports_golf</span>
                        </div>
                    </div>

                    <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carritos Asignados</p>
                            <h4 id="kpi-caddie-carts" class="text-2xl font-black text-primary mt-1">0</h4>
                            <p class="text-[10px] font-bold text-slate-400 mt-0.5">En operación</p>
                        </div>
                        <div class="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                            <span class="material-icons">electric_car</span>
                        </div>
                    </div>
                </div>

                <!-- Tee Times List Grid -->
                <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                        <div>
                            <h3 class="font-black text-white uppercase text-base tracking-tight flex items-center gap-2">
                                <span class="material-icons text-primary">receipt_long</span> Salidas Generadas en Recepción
                            </h3>
                            <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                Autoriza la salida, asigna caddies y carritos a los grupos registrados en Casa Club
                            </p>
                        </div>
                        <div class="relative w-full sm:w-72">
                            <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                            <input id="teetimes-search-input" type="text" placeholder="Filtrar por nombre, folio o caddie..." class="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-primary">
                        </div>
                    </div>

                    <div id="caddie-teetimes-container" class="space-y-3">
                        <div class="py-12 text-center">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab Content 2.5: Jugadores en Campo Actualmente -->
            <div id="caddie-tab-oncourse" class="hidden space-y-4">
                <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                        <div>
                            <div class="flex items-center gap-2.5">
                                <h3 class="font-black text-white uppercase text-base tracking-tight flex items-center gap-2">
                                    <span class="material-icons text-emerald-400">sports_golf</span> Jugadores en Campo Actualmente
                                </h3>
                                <span class="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-black uppercase">En Vivo</span>
                            </div>
                            <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                Golfistas jugando hoy con entrega de tarjeta pendiente. Al registrar su score o marcar no entregó, se retiran automáticamente de esta vista.
                            </p>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="relative w-64">
                                <span class="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                                <input id="oncourse-search-input" type="text" oninput="window.renderOnCoursePlayersList()" placeholder="Buscar jugador, caddie, carro..." class="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-primary">
                            </div>
                            <div class="px-4 py-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-black uppercase shrink-0">
                                Jugando: <span id="oncourse-players-count">0</span>
                            </div>
                        </div>
                    </div>

                    <div id="oncourse-players-container" class="space-y-3">
                        <div class="py-12 text-center">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab Content 3: Bitácora de Salidas Diarias -->
            <div id="caddie-tab-log" class="hidden space-y-4">
                <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 class="font-black text-white uppercase text-base tracking-tight flex items-center gap-2">
                                <span class="material-icons text-emerald-400">history</span> Bitácora de Salidas
                            </h3>
                            <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Captura de Scorecards 18 Hoyos y registro de jugadores en campo</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="relative w-64">
                                <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                                <input id="log-search-input" type="text" placeholder="Filtrar bitácora..." class="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-primary">
                            </div>
                            <div class="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-black uppercase shrink-0">
                                Total Salidas: <span id="caddie-outputs-count">0</span>
                            </div>
                        </div>
                    </div>

                    <div id="caddie-outputs-table-container">
                        <div class="py-8 text-center">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab Content 5: Práctica & Cubetas de Pelotas -->
            <div id="caddie-tab-practica" class="hidden space-y-4">
                <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                        <div>
                            <div class="flex items-center gap-2.5">
                                <span class="material-icons text-purple-400 text-2xl">sports_baseball</span>
                                <h3 class="font-black text-white uppercase text-base tracking-tight">Tee de Práctica & Entrega de Pelotas</h3>
                            </div>
                            <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                Control de cubetas cobradas en recepción y confirmación de entrega en el driving range
                            </p>
                        </div>
                        <div class="flex items-center gap-2">
                            <span id="caddie-practica-summary" class="px-3 py-1.5 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-black uppercase">
                                0 Registros Hoy
                            </span>
                        </div>
                    </div>

                    <div id="caddie-practica-container" class="space-y-3">
                        <div class="py-8 text-center">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Tab bindings
    const btnTeeTimes = document.getElementById('tab-caddie-teetimes');
    const btnOnCourse = document.getElementById('tab-caddie-oncourse');
    const btnLog = document.getElementById('tab-caddie-log');
    const btnPractica = document.getElementById('tab-caddie-practica');
    const contentTeeTimes = document.getElementById('caddie-tab-teetimes');
    const contentOnCourse = document.getElementById('caddie-tab-oncourse');
    const contentLog = document.getElementById('caddie-tab-log');
    const contentPractica = document.getElementById('caddie-tab-practica');

    const TAB_ACTIVE = 'px-3.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 sm:gap-2 bg-primary text-slate-950 shadow-md shadow-primary/20 shrink-0';
    const TAB_INACTIVE = 'px-3.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 sm:gap-2 bg-slate-900 text-slate-400 border border-slate-800 hover:text-white shrink-0';

    const setTabUI = (tab) => {
        activeTab = tab;
        if (btnTeeTimes) btnTeeTimes.className = (tab === 'TEETIMES') ? TAB_ACTIVE : TAB_INACTIVE;
        if (btnOnCourse) btnOnCourse.className = (tab === 'ONCOURSE') ? TAB_ACTIVE : TAB_INACTIVE;
        if (btnLog) btnLog.className = (tab === 'LOG') ? TAB_ACTIVE : TAB_INACTIVE;
        if (btnPractica) btnPractica.className = (tab === 'PRACTICA') ? TAB_ACTIVE : TAB_INACTIVE;

        if (contentTeeTimes) contentTeeTimes.classList.toggle('hidden', tab !== 'TEETIMES');
        if (contentOnCourse) contentOnCourse.classList.toggle('hidden', tab !== 'ONCOURSE');
        if (contentLog) contentLog.classList.toggle('hidden', tab !== 'LOG');
        if (contentPractica) contentPractica.classList.toggle('hidden', tab !== 'PRACTICA');
    };

    if (btnTeeTimes) {
        btnTeeTimes.onclick = () => {
            setTabUI('TEETIMES');
            renderTeeTimesList();
        };
    }

    if (btnOnCourse) {
        btnOnCourse.onclick = () => {
            setTabUI('ONCOURSE');
            window.renderOnCoursePlayersList();
        };
    }

    if (btnLog) {
        btnLog.onclick = () => {
            setTabUI('LOG');
            renderOutputsTable();
        };
    }

    if (btnPractica) {
        btnPractica.onclick = () => {
            setTabUI('PRACTICA');
            renderDrivingRangeTab();
        };
    }

    window.switchToReceptionTab = () => {
        if (btnTeeTimes) btnTeeTimes.click();
    };

    window.switchCaddieTab = (tabName) => {
        if (tabName === 'TEETIMES' && btnTeeTimes) btnTeeTimes.click();
        else if (tabName === 'ONCOURSE' && btnOnCourse) btnOnCourse.click();
        else if (tabName === 'LOG' && btnLog) btnLog.click();
        else if (tabName === 'PRACTICA' && btnPractica) btnPractica.click();
    };

    // Date navigation bindings
    document.getElementById('caddie-date-input').onchange = (e) => {
        selectedCaddieDate = e.target.value;
        loadCaddieData();
    };

    document.getElementById('btn-caddie-date-today').onclick = () => {
        selectedCaddieDate = getLocalDateString();
        document.getElementById('caddie-date-input').value = selectedCaddieDate;
        loadCaddieData();
    };

    document.getElementById('btn-caddie-date-prev').onclick = () => {
        const d = new Date(selectedCaddieDate + 'T00:00:00');
        d.setDate(d.getDate() - 1);
        selectedCaddieDate = getLocalDateString(d);
        document.getElementById('caddie-date-input').value = selectedCaddieDate;
        loadCaddieData();
    };

    document.getElementById('btn-caddie-date-next').onclick = () => {
        const d = new Date(selectedCaddieDate + 'T00:00:00');
        d.setDate(d.getDate() + 1);
        selectedCaddieDate = getLocalDateString(d);
        document.getElementById('caddie-date-input').value = selectedCaddieDate;
        loadCaddieData();
    };

    const caddieSearch = document.getElementById('caddie-search-input');
    if (caddieSearch) {
        caddieSearch.oninput = (e) => {
            const query = e.target.value.toLowerCase().trim();
            renderSearchResults(query);
        };
    }

    document.getElementById('teetimes-search-input').oninput = () => {
        renderTeeTimesList();
    };

    document.getElementById('log-search-input').oninput = () => {
        renderOutputsTable();
    };

    setTabUI('TEETIMES');
    await loadCaddieData();
    setupRealtimeCaddie();
}

window.refreshCaddieData = async function() {
    await loadCaddieData();
    window.showNotification?.('Datos Actualizados', 'Información de salidas y socios sincronizada.', 'info');
};

function setupRealtimeCaddie() {
    try {
        if (realtimeChannel) {
            supabaseClient.removeChannel(realtimeChannel);
        }
        realtimeChannel = supabaseClient.channel('caddie_master_realtime')
            .on('postgres_changes', { event: '*', schema: 'colimaGC', table: 'tee_times' }, (payload) => {
                console.log('Realtime tee_times change detected in caddie master:', payload);
                loadCaddieData();
            })
            .on('postgres_changes', { event: '*', schema: 'colimaGC', table: 'daily_outputs' }, () => {
                loadCaddieData();
            })
            .on('postgres_changes', { event: '*', schema: 'colimaGC', table: 'driving_range_sessions' }, () => {
                loadCaddieData();
            })
            .on('postgres_changes', { event: '*', schema: 'colimaGC', table: 'pending_nine_holes' }, () => {
                loadCaddieData();
            })
            .subscribe();

        window.addEventListener('storage', (e) => {
            if (e.key === 'cgc_caddie_alert_sync' || e.key?.startsWith('cgc_tee_times_') || e.key === 'cgc_driving_range_sync' || e.key?.startsWith('cgc_driving_range_') || e.key === 'cgc_pending_nine_holes_sync') {
                loadCaddieData();
            }
        });
    } catch (e) {
        console.warn('Realtime subscription error in caddiemaster:', e);
    }
}

async function loadCaddieData() {
    try {
        const queryDate = selectedCaddieDate || getLocalDateString();

        // 1. Fetch Members
        const { data: members } = await dbColima.from('members').select('*').order('member_number', { ascending: true });
        allMembers = members || [];

        // 2. Fetch Daily Outputs (try colimaGC first, then starter)
        let outputs = [];
        try {
            const { data: colimaOutputs, error: outErr } = await dbColima.from('daily_outputs').select('*').order('created_at', { ascending: false });
            if (!outErr && colimaOutputs) {
                outputs = colimaOutputs;
            } else {
                const { data: starterOutputs } = await dbStarter.from('daily_outputs').select('*').order('created_at', { ascending: false });
                outputs = starterOutputs || [];
            }
        } catch (e) {
            const { data: starterOutputs } = await dbStarter.from('daily_outputs').select('*').order('created_at', { ascending: false });
            outputs = starterOutputs || [];
        }

        todayOutputs = (outputs || []).filter(o => o.created_at && o.created_at.startsWith(queryDate));

        // 3. Fetch Today's Tee Times from Recepción for queryDate
        try {
            const { data: teeTimes, error: ttErr } = await dbColima.from('tee_times')
                .select('*')
                .eq('booking_date', queryDate)
                .order('booking_time', { ascending: true });

            if (!ttErr && teeTimes && teeTimes.length > 0) {
                todayTeeTimes = teeTimes;
                localStorage.setItem(`cgc_tee_times_${queryDate}`, JSON.stringify(teeTimes));
            } else {
                const cached = localStorage.getItem(`cgc_tee_times_${queryDate}`);
                todayTeeTimes = cached ? JSON.parse(cached) : (teeTimes || []);
            }
        } catch (e) {
            const cached = localStorage.getItem(`cgc_tee_times_${queryDate}`);
            todayTeeTimes = cached ? JSON.parse(cached) : [];
        }

        // 4. Fetch Today's Driving Range & Practice Sessions
        try {
            const { data: drSessions, error: drErr } = await dbColima.from('driving_range_sessions')
                .select('*')
                .eq('session_date', queryDate)
                .order('created_at', { ascending: false });

            if (!drErr && drSessions) {
                todayDrivingRange = drSessions;
                localStorage.setItem(`cgc_driving_range_${queryDate}`, JSON.stringify(drSessions));
            } else {
                const cached = localStorage.getItem(`cgc_driving_range_${queryDate}`);
                todayDrivingRange = cached ? JSON.parse(cached) : (drSessions || []);
            }
        } catch (e) {
            const cached = localStorage.getItem(`cgc_driving_range_${queryDate}`);
            todayDrivingRange = cached ? JSON.parse(cached) : [];
        }

        // 5. Fetch Pending 9-Hole Scores
        try {
            const todayStr = getLocalDateString();
            try {
                await dbColima.from('pending_nine_holes')
                    .update({ status: 'EXPIRED' })
                    .eq('status', 'PENDING')
                    .lt('expires_at', todayStr);
            } catch(e) {}

            const { data: p9, error: p9Err } = await dbColima.from('pending_nine_holes')
                .select('*')
                .eq('status', 'PENDING')
                .gte('expires_at', todayStr)
                .order('played_date', { ascending: false });

            if (!p9Err && p9) {
                pendingNineHoles = p9;
                localStorage.setItem('cgc_pending_nine_holes', JSON.stringify(p9));
            } else {
                const cached = localStorage.getItem('cgc_pending_nine_holes');
                pendingNineHoles = cached ? JSON.parse(cached) : [];
            }
        } catch (e) {
            const cached = localStorage.getItem('cgc_pending_nine_holes');
            pendingNineHoles = cached ? JSON.parse(cached) : [];
        }

        const p9Badge = document.getElementById('tab-caddie-p9-badge');
        if (p9Badge) p9Badge.textContent = pendingNineHoles.length;

        // Check local cache if teeTimes still empty
        if (todayTeeTimes.length === 0) {
            const cached = localStorage.getItem(`cgc_tee_times_${queryDate}`);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        todayTeeTimes = parsed;
                    }
                } catch(e) {}
            }
        }

        // Update UI date input
        const dateInput = document.getElementById('caddie-date-input');
        if (dateInput) dateInput.value = queryDate;

        // Ensure daily_outputs exist for all groups ON_COURSE or COMPLETED
        for (const t of todayTeeTimes) {
            if (t.status === 'ON_COURSE' || t.status === 'COMPLETED') {
                const players = Array.isArray(t.players) && t.players.length > 0
                    ? t.players
                    : [{ name: t.contact_name, is_member: false, player_type: 'GUEST' }];

                for (let idx = 0; idx < players.length; idx++) {
                    const p = players[idx];
                    const pName = p.name || t.contact_name || `Jugador #${idx + 1}`;
                    const exists = todayOutputs.some(o => 
                        (o.tee_time_id === t.id || o.folio === t.folio) && 
                        (o.member_name === pName || (!p.name && o.member_name === t.contact_name))
                    );

                    if (!exists) {
                        const outPayload = {
                            tee_time_id: t.id,
                            folio: t.folio,
                            member_id: p.member_id || null,
                            member_number: p.member_number || (p.is_member ? 'SOC' : 'INV'),
                            member_name: pName,
                            player_type: p.is_member ? 'MEMBER' : (p.player_type || 'GUEST'),
                            starting_hole: t.starting_hole || 1,
                            caddie_name: t.caddie_assigned || '',
                            cart_number: t.cart_numbers || '',
                            score_status: 'PENDING'
                        };
                        try {
                            const { data, error } = await dbColima.from('daily_outputs').insert([outPayload]).select().single();
                            if (!error && data) {
                                todayOutputs.push(data);
                            } else {
                                const { data: d2 } = await dbStarter.from('daily_outputs').insert([outPayload]).select().single();
                                if (d2) todayOutputs.push(d2);
                            }
                        } catch(err) {
                            try {
                                const { data: d2 } = await dbStarter.from('daily_outputs').insert([outPayload]).select().single();
                                if (d2) todayOutputs.push(d2);
                            } catch(e3) {}
                        }
                    }
                }
            }
        }

        // Update Tab Badges & KPIs
        updateCaddieBadgesAndKPIs();

        // Render views
        if (document.getElementById('caddie-search-results')) {
            renderSearchResults(document.getElementById('caddie-search-input')?.value.toLowerCase().trim() || '');
        }
        renderTeeTimesList();
        renderOutputsTable();
        window.renderOnCoursePlayersList();
        renderDrivingRangeTab();

    } catch (e) {
        console.error('Error loading caddie master data:', e);
    }
}

function updateCaddieBadgesAndKPIs() {
    const badgeOutputs = document.getElementById('tab-caddie-badge');
    const badgeTeeTimes = document.getElementById('tab-caddie-teetimes-badge');
    const badgeOnCourse = document.getElementById('tab-caddie-oncourse-badge');
    const badgePractica = document.getElementById('tab-caddie-practica-badge');
    const countOutputs = document.getElementById('caddie-outputs-count');

    const kpiTotal = document.getElementById('kpi-caddie-total-groups');
    const kpiPending = document.getElementById('kpi-caddie-pending-groups');
    const kpiOnCourse = document.getElementById('kpi-caddie-oncourse-groups');
    const kpiCarts = document.getElementById('kpi-caddie-carts');

    const activeTeeTimes = todayTeeTimes.filter(t => t.status !== 'CANCELLED' && t.status !== 'BLOCKED');
    const pendingCount = activeTeeTimes.filter(t => t.status === 'PAID' || t.status === 'RESERVED').length;
    const onCourseCount = activeTeeTimes.filter(t => t.status === 'ON_COURSE' || t.status === 'COMPLETED').length;
    let totalCarts = 0;
    activeTeeTimes.forEach(t => { totalCarts += parseInt(t.total_carts || 0); });

    // Calculate count of players currently ON COURSE who have NOT delivered/captured score yet
    let pendingOnCoursePlayers = 0;
    todayTeeTimes.filter(t => t.status === 'ON_COURSE').forEach(t => {
        const players = Array.isArray(t.players) && t.players.length > 0 ? t.players : [{ name: t.contact_name }];
        players.forEach(p => {
            const pName = p.name || t.contact_name;
            const pOutput = todayOutputs.find(o => 
                (o.tee_time_id === t.id || o.folio === t.folio) && 
                (o.member_name === pName || (!p.name && o.member_name === t.contact_name))
            );
            const pStatus = pOutput ? (pOutput.score_status || 'PENDING') : 'PENDING';
            if (pStatus !== 'CAPTURED' && pStatus !== 'NO_CARD' && pStatus !== 'PARTIAL_9') {
                pendingOnCoursePlayers++;
            }
        });
    });

    const pendingBallsDeliveries = todayDrivingRange.filter(s => !s.balls_delivered && s.status !== 'CANCELLED');
    const p9ActiveCount = pendingNineHoles.filter(p => p.status === 'PENDING').length;

    if (badgeOutputs) badgeOutputs.textContent = todayOutputs.length;
    if (badgeTeeTimes) badgeTeeTimes.textContent = pendingCount;
    if (badgeOnCourse) badgeOnCourse.textContent = pendingOnCoursePlayers;
    if (badgePractica) badgePractica.textContent = pendingBallsDeliveries.length;
    const p9Badge = document.getElementById('tab-caddie-p9-badge');
    if (p9Badge) p9Badge.textContent = p9ActiveCount;
    if (countOutputs) countOutputs.textContent = todayOutputs.length;

    if (kpiTotal) kpiTotal.textContent = activeTeeTimes.length;
    if (kpiPending) kpiPending.textContent = pendingCount;
    if (kpiOnCourse) kpiOnCourse.textContent = onCourseCount;
    if (kpiCarts) kpiCarts.textContent = totalCarts;

    // Render prominent notification banner for paid departures
    renderPendingDeparturesAlert();
}

function renderPendingDeparturesAlert() {
    const container = document.getElementById('caddie-pending-alert-container');
    if (!container) return;

    const pendingPaid = todayTeeTimes.filter(t => t.status === 'PAID');
    const pendingBallsDeliveries = todayDrivingRange.filter(s => !s.balls_delivered && s.status !== 'CANCELLED');

    if (pendingPaid.length === 0 && pendingBallsDeliveries.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div class="space-y-3">
            ${pendingBallsDeliveries.length > 0 ? `
                <div class="relative overflow-hidden bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-2 border-purple-500/80 rounded-3xl p-5 shadow-2xl shadow-purple-500/20 animate-fade-in">
                    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div class="flex items-center gap-4 min-w-0">
                            <div class="w-12 h-12 rounded-2xl bg-purple-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/40">
                                <span class="material-icons animate-pulse text-2xl">sports_baseball</span>
                            </div>
                            <div class="min-w-0">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="px-2.5 py-0.5 bg-purple-400 text-slate-950 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                        🏌️ Entrega(s) de Pelotas de Práctica (${pendingBallsDeliveries.length})
                                    </span>
                                    <span class="text-xs text-purple-300 font-bold">Listas para entregar en Tee de Práctica</span>
                                </div>
                                <div class="mt-2 flex flex-wrap items-center gap-2">
                                    ${pendingBallsDeliveries.map(s => `
                                        <div class="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-purple-500/40 text-xs shadow-md">
                                            <span class="font-black text-purple-300">#${s.folio || '—'}</span>
                                            <span class="font-black text-white uppercase truncate max-w-[150px] sm:max-w-none">${escapeHtml(s.customer_name)}</span>
                                            <span class="text-[10px] text-teal-300 font-bold">(${s.buckets_count} cubeta${s.buckets_count > 1 ? 's' : ''} · ${s.buckets_count * 100} pelotas)</span>
                                            <button type="button" onclick="window.deliverDrivingRangeBalls('${s.id}')"
                                                class="ml-1 px-3 py-1 bg-purple-500 hover:bg-purple-400 text-slate-950 rounded-lg font-black text-[10px] uppercase transition-all shadow-md flex items-center gap-1">
                                                <span class="material-icons text-xs">check</span> Entregar
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        <button type="button" onclick="window.switchCaddieTab('PRACTICA')"
                            class="px-5 py-3 bg-purple-500 hover:bg-purple-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-purple-500/20 shrink-0 flex items-center justify-center gap-2">
                            <span class="material-icons text-base">sports_baseball</span> Ver Práctica (${pendingBallsDeliveries.length})
                        </button>
                    </div>
                </div>
            ` : ''}

            ${pendingPaid.length > 0 ? `
                <div class="relative overflow-hidden bg-gradient-to-r from-blue-950 via-slate-900 to-emerald-950 border-2 border-emerald-500/80 rounded-3xl p-5 shadow-2xl shadow-emerald-500/20 animate-fade-in">
                    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div class="flex items-center gap-4 min-w-0">
                            <div class="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/40">
                                <span class="material-icons animate-pulse text-2xl">notifications_active</span>
                            </div>
                            <div class="min-w-0">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="px-2.5 py-0.5 bg-emerald-400 text-slate-950 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                        🔔 Salida(s) Pagada(s) en Recepción (${pendingPaid.length})
                                    </span>
                                    <span class="text-xs text-emerald-300 font-bold">Listos en Tee para autorizar salida</span>
                                </div>
                                <div class="mt-2 flex flex-wrap items-center gap-2">
                                    ${pendingPaid.map(b => `
                                        <div class="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-emerald-500/40 text-xs shadow-md">
                                            <span class="font-black text-emerald-400">${b.booking_time} hrs</span>
                                            <span class="font-black text-white uppercase truncate max-w-[150px] sm:max-w-none">${b.contact_name || 'Grupo'}</span>
                                            <span class="text-[10px] text-slate-400 font-bold">(Folio ${b.folio || '—'} · ${b.total_players} jug · Hoyo #${b.starting_hole || 1})</span>
                                            <button type="button" onclick="window.openAuthorizeModal('${b.id}')"
                                                class="ml-1 px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-black text-[10px] uppercase transition-all shadow-md flex items-center gap-1">
                                                <span class="material-icons text-xs">play_arrow</span> Dar Salida
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        <button type="button" onclick="window.switchToReceptionTab()"
                            class="px-5 py-3 bg-blue-500 hover:bg-blue-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20 shrink-0 flex items-center justify-center gap-2">
                            <span class="material-icons text-base">point_of_sale</span> Ver Salidas de Recepción (${pendingPaid.length})
                        </button>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// Búsqueda Unificada (Socios + Pases de Recepción)
function renderSearchResults(query) {
    const container = document.getElementById('caddie-search-results');
    if (!container) return;

    const today = selectedCaddieDate || getLocalDateString();

    // Filter members
    const memberMatches = allMembers.filter(m => {
        if (!query) return true;
        const text = `${m.name} ${m.member_number} ${m.category}`.toLowerCase();
        return text.includes(query);
    });

    // Filter today's tee times / vouchers
    const teeTimeMatches = todayTeeTimes.filter(t => {
        if (!query) return false; // only show tee times when user searches or if active
        if (t.status === 'CANCELLED') return false;
        const playersStr = Array.isArray(t.players) ? t.players.map(p => p.name).join(' ') : '';
        const text = `${t.folio || ''} ${t.contact_name || ''} ${playersStr}`.toLowerCase();
        return text.includes(query);
    });

    if (memberMatches.length === 0 && teeTimeMatches.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 font-bold uppercase text-center py-6">No se encontraron socios ni pases con ese término.</p>`;
        return;
    }

    let html = '';

    // If there are Reception Tee Times matching the search query:
    if (teeTimeMatches.length > 0) {
        html += `<div class="text-[10px] font-black text-blue-400 uppercase tracking-widest px-2 py-1">Pases de Recepción (${teeTimeMatches.length})</div>`;
        html += teeTimeMatches.map(t => {
            const isSelected = selectedItem && selectedItem.type === 'TEETIME' && String(selectedItem.data.id) === String(t.id);
            const isPaid = t.status === 'PAID' || t.status === 'ON_COURSE';

            return `
                <div onclick="window.selectCaddieTeeTime('${t.id}')"
                    class="p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3
                    ${isSelected ? 'bg-blue-500/20 border-blue-500 shadow-lg' : 'bg-slate-800/90 border-blue-500/30 hover:bg-slate-800 hover:border-blue-400'}">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-black text-xs shrink-0">
                            ${t.booking_time}
                        </div>
                        <div class="min-w-0">
                            <div class="flex items-center gap-2">
                                <p class="font-black text-white text-xs uppercase truncate">${t.contact_name || 'Grupo'}</p>
                                <span class="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[9px] font-black border border-blue-500/20">PASE</span>
                            </div>
                            <p class="text-[10px] text-slate-400 font-bold uppercase truncate mt-0.5">Folio: ${t.folio} · ${t.total_players} jug · Hoyo #${t.starting_hole || 1}</p>
                        </div>
                    </div>
                    <span class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase shrink-0 ${isPaid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}">
                        ${t.status === 'PAID' ? '🔵 PAGADO' : (t.status === 'ON_COURSE' ? '⛳ EN CAMPO' : '🟡 RESERVA')}
                    </span>
                </div>`;
        }).join('');
    }

    // Member matches
    if (memberMatches.length > 0) {
        if (teeTimeMatches.length > 0) {
            html += `<div class="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 pt-2">Socios del Club (${memberMatches.length})</div>`;
        }
        html += memberMatches.map(m => {
            const isPaid = m.paid_until && m.paid_until >= today && m.status === 'ACTIVE';
            const isSelected = selectedItem && selectedItem.type === 'MEMBER' && String(selectedItem.data.id) === String(m.id);

            return `
                <div onclick="window.selectCaddieMember('${m.id}')"
                    class="p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3
                    ${isSelected ? 'bg-primary/20 border-primary shadow-lg' : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'}">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-black text-white text-xs shrink-0">
                            ${(m.member_number || '').replace('SOC-', '')}
                        </div>
                        <div class="min-w-0">
                            <p class="font-black text-white text-xs uppercase truncate">${m.name}</p>
                            <p class="text-[10px] text-slate-400 font-bold uppercase">${m.category || 'TITULAR'}</p>
                        </div>
                    </div>
                    <span class="w-3 h-3 rounded-full shrink-0 ${isPaid ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]'}"></span>
                </div>`;
        }).join('');
    }

    container.innerHTML = html;
}

window.selectCaddieMember = function(memberId) {
    const member = allMembers.find(m => String(m.id) === String(memberId));
    if (member) {
        selectedItem = { type: 'MEMBER', data: member };
        renderSearchResults(document.getElementById('caddie-search-input')?.value.toLowerCase().trim() || '');
        renderVerificationCard();
    }
};

window.selectCaddieTeeTime = function(teeTimeId) {
    const booking = todayTeeTimes.find(t => String(t.id) === String(teeTimeId));
    if (booking) {
        selectedItem = { type: 'TEETIME', data: booking };
        renderSearchResults(document.getElementById('caddie-search-input')?.value.toLowerCase().trim() || '');
        renderVerificationCard();
    }
};

function renderVerificationCard() {
    const card = document.getElementById('caddie-verification-card');
    if (!card || !selectedItem) return;

    const today = selectedCaddieDate || getLocalDateString();

    // Case 1: Selected a Reception Voucher (Tee Time Booking)
    if (selectedItem.type === 'TEETIME') {
        const b = selectedItem.data;
        const isPaid = b.status === 'PAID' || b.status === 'ON_COURSE';
        const isAlreadyOut = b.status === 'ON_COURSE';
        const pendingMatches = [];
        playersList.forEach(p => {
            const pName = (p.name || '').trim().toLowerCase();
            const match = pendingNineHoles.find(item => 
                (p.member_id && String(item.member_id) === String(p.member_id)) ||
                (pName && (item.member_name || '').trim().toLowerCase() === pName)
            );
            if (match) pendingMatches.push({ player: p, pending: match });
        });

        let suggestedHole = parseInt(b.starting_hole) || 1;
        if (pendingMatches.length > 0) {
            suggestedHole = pendingMatches[0].pending.round_type === 'FRONT_9' ? 10 : 1;
        }

        const pendingAlertHTML = pendingMatches.length > 0 ? `
            <div class="bg-amber-500/15 border-2 border-amber-500/60 rounded-2xl p-4 space-y-2 animate-fade-in shadow-lg shadow-amber-500/10">
                <div class="flex items-center justify-between gap-2">
                    <span class="flex items-center gap-1.5 text-amber-400 font-black text-xs uppercase tracking-wider">
                        <span class="material-icons text-base">notification_important</span> ¡Scorecard Incompleto de 9 Hoyos Detectado!
                    </span>
                    <span class="px-2 py-0.5 bg-amber-500/30 text-amber-200 rounded text-[9px] font-black uppercase">Vigencia 6 Días</span>
                </div>
                ${pendingMatches.map(pm => {
                    const roundName = pm.pending.round_type === 'FRONT_9' ? '1ra Vuelta (Hoyos 1-9 · Blancas)' : '2da Vuelta (Hoyos 10-18 · Azules)';
                    const nextHole = pm.pending.round_type === 'FRONT_9' ? 10 : 1;
                    const nextName = pm.pending.round_type === 'FRONT_9' ? '2da Vuelta (Hoyo 10 · Marcas Azules)' : '1ra Vuelta (Hoyo 1 · Marcas Blancas)';
                    return `
                        <div class="bg-slate-900/90 border border-amber-500/40 rounded-xl p-3 space-y-1 text-xs">
                            <p class="font-black text-white text-sm uppercase">${pm.pending.member_name}</p>
                            <p class="text-slate-300 font-bold">
                                Jugó ${roundName} el día <strong>${pm.pending.played_date}</strong> (${pm.pending.partial_gross} golpes).
                            </p>
                            <p class="text-amber-300 font-black flex items-center gap-1">
                                <span class="material-icons text-sm">arrow_forward</span> Le corresponde salir por: <strong>Hoyo #${nextHole} (${nextName})</strong> para completar su tarjeta oficial de 18 hoyos.
                            </p>
                        </div>
                    `;
                }).join('')}
            </div>
        ` : '';

        card.className = 'bg-slate-900 border-2 border-blue-500/60 rounded-3xl p-8 shadow-2xl space-y-6 animate-fade-in text-left';
        card.innerHTML = `
            <div class="flex items-center justify-between gap-4 bg-blue-500/10 border border-blue-500/30 p-5 rounded-2xl">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-blue-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
                        <span class="material-icons" style="font-size:32px">receipt_long</span>
                    </div>
                    <div>
                        <span class="px-3 py-1 bg-blue-500 text-slate-950 font-black text-[10px] uppercase rounded-full tracking-wider">
                            ${isAlreadyOut ? '⛳ EN CAMPO' : (isPaid ? '🟢 AUTORIZADO (PAGADO EN RECEPCIÓN)' : '🟡 RESERVA TELEFÓNICA')}
                        </span>
                        <h3 class="font-black text-white text-xl uppercase mt-1">GRUPO: ${b.contact_name}</h3>
                    </div>
                </div>
            </div>

            ${pendingAlertHTML}

            <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3">
                <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-400 font-bold">Folio de Recepción:</span>
                    <span class="font-black text-white text-sm bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">${b.folio}</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-400 font-bold">Horario de Salida:</span>
                    <span class="font-black text-primary uppercase text-base">${b.booking_time} hrs · Hoyo #${b.starting_hole || 1}</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-400 font-bold">Total Jugadores & Carritos:</span>
                    <span class="font-black text-emerald-400 uppercase">${b.total_players} Jugadores · ${b.total_carts || 0} Carrito(s)${b.total_club_rentals ? ` · ${b.total_club_rentals} Equipo(s)` : ''}</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-400 font-bold">Total Pagado:</span>
                    <span class="font-black text-white uppercase text-sm">$${parseFloat(b.total_amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} (${b.payment_method})</span>
                </div>
                
                <div class="pt-2 border-t border-slate-700/80">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Integrantes del Grupo:</p>
                    <div class="space-y-1.5">
                        ${playersList.map((p, idx) => `
                            <div class="flex items-center justify-between px-3 py-2 bg-slate-900/90 rounded-xl border border-slate-700 text-xs">
                                <div class="flex items-center gap-2">
                                    <span class="font-black text-primary">#${idx + 1}</span>
                                    <span class="font-black text-white uppercase">${p.name || 'Sin Nombre'}</span>
                                    <span class="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[9px] font-black">${p.player_type || 'INVITADO'}</span>
                                </div>
                                <span class="text-slate-400 font-bold">${p.holes || 18} Hoyos ${p.has_cart ? '· 🚗 Carro' : ''} ${p.has_clubs ? '· 🏌️ Palos' : ''}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <form id="form-register-teetime-output" class="space-y-4 pt-2 border-t border-slate-800">
                <h4 class="font-black uppercase text-xs text-white tracking-wider">Asignar Recursos y Dar Salida</h4>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Hoyo de Salida</label>
                        <select id="tt-out-hole" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                            ${Array.from({ length: 18 }, (_, i) => i + 1).map(h => `
                                <option value="${h}" ${suggestedHole === h ? 'selected' : ''}>HOYO ${h}${h === 1 ? ' (Tee Inicial)' : (h === 10 ? ' (Vuelta 2)' : '')}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Carrito(s) Asignados (#)</label>
                        <input id="tt-out-carts" type="text" value="${b.cart_numbers || ''}" placeholder="Ej. Carro #4, #12" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                    </div>
                </div>

                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Caddie(s) Asignados</label>
                    <input id="tt-out-caddie" type="text" value="${b.caddie_assigned || ''}" placeholder="Ej. Caddie Pedro y Luis" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-primary">
                </div>

                <button type="submit"
                    class="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/20">
                    <span class="material-icons">play_circle_filled</span> ${isAlreadyOut ? 'Actualizar Salida en Campo' : '⛳ Autorizar Salida al Campo'}
                </button>
            </form>
        `;

        document.getElementById('form-register-teetime-output').onsubmit = async (e) => {
            e.preventDefault();
            const hole = parseInt(document.getElementById('tt-out-hole').value) || 1;
            const carts = document.getElementById('tt-out-carts').value.trim();
            const caddie = document.getElementById('tt-out-caddie').value.trim();

            await authorizeTeeTimeDeparture(b.id, hole, carts, caddie);
        };
        return;
    }

    // Case 2: Selected a Member
    const member = selectedItem.data;
    const isPaid = member.paid_until && member.paid_until >= today && member.status === 'ACTIVE';
    const formattedPaidUntil = member.paid_until
        ? new Date(member.paid_until + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
        : 'Sin Fecha';

    if (isPaid) {
        const mPending = pendingNineHoles.find(item => 
            (String(item.member_id) === String(member.id)) ||
            ((item.member_name || '').trim().toLowerCase() === (member.name || '').trim().toLowerCase())
        );

        let suggestedMemberHole = 1;
        let memberPendingAlertHTML = '';
        if (mPending) {
            suggestedMemberHole = mPending.round_type === 'FRONT_9' ? 10 : 1;
            const roundName = mPending.round_type === 'FRONT_9' ? '1ra Vuelta (Hoyos 1-9 · Blancas)' : '2da Vuelta (Hoyos 10-18 · Azules)';
            const nextName = mPending.round_type === 'FRONT_9' ? '2da Vuelta (Hoyo 10 · Marcas Azules)' : '1ra Vuelta (Hoyo 1 · Marcas Blancas)';
            memberPendingAlertHTML = `
                <div class="bg-amber-500/15 border-2 border-amber-500/60 rounded-2xl p-4 space-y-2 animate-fade-in shadow-lg shadow-amber-500/10">
                    <div class="flex items-center justify-between gap-2">
                        <span class="flex items-center gap-1.5 text-amber-400 font-black text-xs uppercase tracking-wider">
                            <span class="material-icons text-base">notification_important</span> ¡Scorecard Incompleto de 9 Hoyos!
                        </span>
                        <span class="px-2 py-0.5 bg-amber-500/30 text-amber-200 rounded text-[9px] font-black uppercase">Vigencia 6 Días</span>
                    </div>
                    <div class="bg-slate-900/90 border border-amber-500/40 rounded-xl p-3 space-y-1 text-xs">
                        <p class="font-black text-white text-sm uppercase">${mPending.member_name}</p>
                        <p class="text-slate-300 font-bold">
                            Jugó ${roundName} el día <strong>${mPending.played_date}</strong> (${mPending.partial_gross} golpes).
                        </p>
                        <p class="text-amber-300 font-black flex items-center gap-1">
                            <span class="material-icons text-sm">arrow_forward</span> Le corresponde salir por: <strong>Hoyo #${suggestedMemberHole} (${nextName})</strong> para completar su tarjeta oficial de 18 hoyos.
                        </p>
                    </div>
                </div>
            `;
        }

        card.className = 'bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-8 shadow-2xl space-y-6 animate-fade-in text-left';
        card.innerHTML = `
            <div class="flex items-center justify-between gap-4 bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-2xl">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
                        <span class="material-icons" style="font-size:32px">check_circle</span>
                    </div>
                    <div>
                        <span class="px-3 py-1 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase rounded-full tracking-wider">🟢 AUTORIZADO</span>
                        <h3 class="font-black text-white text-xl uppercase mt-1">SOCIO AL CORRIENTE</h3>
                    </div>
                </div>
            </div>

            ${memberPendingAlertHTML}

            <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3">
                <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-400 font-bold"># Socio / Expediente:</span>
                    <span class="font-black text-white text-sm bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">#${member.member_number}</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-400 font-bold">Nombre del Socio:</span>
                    <span class="font-black text-white uppercase text-base">${member.name}</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-400 font-bold">Categoría:</span>
                    <span class="font-black text-slate-300 uppercase">${member.category || 'TITULAR'}</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-400 font-bold">Cuota Vigente Hasta:</span>
                    <span class="font-black text-emerald-400 uppercase">${formattedPaidUntil}</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-400 font-bold">Handicap Index:</span>
                    <span class="font-black text-amber-400 text-base">${member.current_handicap !== undefined ? member.current_handicap : '0.0'}</span>
                </div>
            </div>

            <form id="form-register-output" class="space-y-4 pt-2 border-t border-slate-800">
                <h4 class="font-black uppercase text-xs text-white tracking-wider">Registrar Salida al Campo Hoy</h4>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Hoyo de Salida</label>
                        <select id="out-hole" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                            ${Array.from({ length: 18 }, (_, i) => i + 1).map(h => `
                                <option value="${h}" ${h === suggestedMemberHole ? 'selected' : ''}>HOYO ${h}${h === 1 ? ' (Tee Inicial)' : (h === 10 ? ' (Vuelta 2)' : '')}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Invitados / Acompañantes</label>
                        <input id="out-guests" type="number" min="0" max="4" value="0" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Caddie Asignado</label>
                        <input id="out-caddie" type="text" placeholder="Ej. Caddie Pedro" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Carrito #</label>
                        <input id="out-cart" type="text" placeholder="Ej. Carro #12" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-primary">
                    </div>
                </div>

                <button type="submit"
                    class="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/20">
                    <span class="material-icons">play_circle_filled</span> Registrar Salida al Campo
                </button>
            </form>
        `;

        document.getElementById('form-register-output').onsubmit = async (e) => {
            e.preventDefault();
            const hole = parseInt(document.getElementById('out-hole').value) || 1;
            const guests = parseInt(document.getElementById('out-guests').value) || 0;
            const caddie = document.getElementById('out-caddie').value.trim();
            const cart = document.getElementById('out-cart').value.trim();

            const payload = {
                member_id: member.id,
                member_number: member.member_number,
                member_name: member.name,
                player_type: 'MEMBER',
                starting_hole: hole,
                guests_count: guests,
                caddie_name: caddie,
                cart_number: cart,
                notes: `Salida individual socio ${member.name}`,
                score_status: 'PENDING'
            };

            // Insert into colimaGC.daily_outputs or fallback to starter
            try {
                const { error: err1 } = await dbColima.from('daily_outputs').insert([payload]);
                if (err1) {
                    await dbStarter.from('daily_outputs').insert([payload]);
                }
            } catch (err) {
                await dbStarter.from('daily_outputs').insert([payload]);
            }

            window.showNotification?.('¡Salida Registrada!', `Salida autorizada para ${member.name} por el Hoyo #${hole}.`, 'success');
            await loadCaddieData();
        };

    } else {
        card.className = 'bg-slate-900 border-2 border-rose-500/60 rounded-3xl p-8 shadow-2xl space-y-6 animate-fade-in text-left';
        card.innerHTML = `
            <div class="flex items-center justify-between gap-4 bg-rose-500/10 border border-rose-500/30 p-5 rounded-2xl">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/30">
                        <span class="material-icons" style="font-size:32px">warning</span>
                    </div>
                    <div>
                        <span class="px-3 py-1 bg-rose-500 text-white font-black text-[10px] uppercase rounded-full tracking-wider">🔴 NO AUTORIZADO</span>
                        <h3 class="font-black text-white text-xl uppercase mt-1">PAGO PENDIENTE / INACTIVO</h3>
                    </div>
                </div>
            </div>

            <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3">
                <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-400 font-bold"># Socio / Expediente:</span>
                    <span class="font-black text-white text-sm bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">#${member.member_number}</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-400 font-bold">Nombre del Socio:</span>
                    <span class="font-black text-white uppercase text-base">${member.name}</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-400 font-bold">Cuota Vencida Desde:</span>
                    <span class="font-black text-rose-400 uppercase text-sm">${formattedPaidUntil}</span>
                </div>
            </div>

            <div class="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 font-bold leading-relaxed">
                ⚠️ Este socio cuenta con adeudo o suspensión de membresía. Por favor solícitale acudir a Recepción / Casa Club para regularizar su cuota antes de salir a jugar.
            </div>
        `;
    }
}

function renderCaddiePlayerHoleCard(outId, h, val) {
    const hasVal = val !== '' && !isNaN(val) && parseInt(val) > 0;
    return `
    <div id="caddie-card-${outId}-h${h.hole}"
        class="flex flex-col items-center justify-between p-2 rounded-2xl border transition-all ${hasVal ? 'bg-emerald-500/20 border-emerald-500/60 shadow-md shadow-emerald-500/10' : 'bg-slate-900/90 border-slate-800/90 hover:border-slate-700'}">
        <div class="flex items-center justify-between w-full px-1">
            <span class="text-xs sm:text-[10px] font-black text-slate-300">#${h.hole}</span>
            <span class="text-[9px] sm:text-[8px] font-bold text-slate-400 uppercase">PAR ${h.par}</span>
        </div>
        <input id="caddie-score-${outId}-h${h.hole}" type="text" inputmode="numeric" pattern="[0-9]*" value="${hasVal ? val : ''}" autocomplete="off"
            onkeydown="window.handleCaddieHoleKeyDown(event, '${outId}', ${h.hole})"
            oninput="window.onCaddiePlayerHoleInput('${outId}', ${h.hole}, this)"
            onfocus="this.select()"
            style="font-size: 18px;"
            class="w-full text-center py-2 sm:py-1.5 my-1 ${hasVal ? 'bg-emerald-950/90 border-2 border-emerald-500/60 text-emerald-300' : 'bg-slate-950 border-2 border-slate-700/80 text-white'} rounded-xl font-black text-lg focus:outline-none focus:border-primary transition-all">
        <div class="text-[9px] sm:text-[8px] font-black uppercase text-slate-400 tracking-wider">
            IDX ${h.idx}
        </div>
    </div>`;
}

function renderPlayerScorecardInline(t, p, idx, outId, pOutput, pStatus, pGross) {
    const pName = p.name || t.contact_name || `Jugador #${idx + 1}`;
    window._playerHoleScores = window._playerHoleScores || {};
    if (!window._playerHoleScores[outId]) {
        window._playerHoleScores[outId] = {};
        if (pOutput && pOutput.hole_scores) {
            try {
                const parsed = typeof pOutput.hole_scores === 'string' ? JSON.parse(pOutput.hole_scores) : pOutput.hole_scores;
                window._playerHoleScores[outId] = parsed || {};
            } catch(e) {}
        }
    }

    const currentScores = window._playerHoleScores[outId] || {};
    let inSum = 0;
    for (let i = 1; i <= 9; i++) {
        const v = parseInt(currentScores[`h${i}`]);
        if (!isNaN(v) && v > 0) inSum += v;
    }
    let outSum = 0;
    for (let i = 10; i <= 18; i++) {
        const v = parseInt(currentScores[`h${i}`]);
        if (!isNaN(v) && v > 0) outSum += v;
    }
    const grossSum = inSum + outSum;
    const memberObj = allMembers.find(m => String(m.id) === String(p.member_id));
    const hcp = memberObj ? (memberObj.current_handicap || 0) : 0;
    const netSum = grossSum > 0 ? Math.max(0, Math.round(grossSum - hcp)) : 0;

    const inHoles = CLUB_COLIMA_HOLES.slice(0, 9);
    const outHoles = CLUB_COLIMA_HOLES.slice(9, 18);

    const isPending = pStatus === 'PENDING';
    const isCaptured = pStatus === 'CAPTURED';
    const isNoCard = pStatus === 'NO_CARD';

    return `
        <div class="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 space-y-4 shadow-lg">
            <!-- Player Bar -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div class="flex items-center gap-2.5 flex-wrap">
                    <span class="w-7 h-7 rounded-lg bg-primary/20 text-primary border border-primary/40 flex items-center justify-center font-black text-xs">#${idx + 1}</span>
                    <h4 class="font-black text-white text-sm uppercase">${pName}</h4>
                    <span class="text-[9px] px-2 py-0.5 rounded-lg ${p.is_member ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'} font-black">
                        ${p.is_member ? 'SOCIO' : (p.player_type || 'INVITADO')}
                    </span>
                    ${p.has_cart ? '<span class="text-amber-400 text-xs material-icons" title="Renta Carrito">electric_car</span>' : ''}
                    ${p.has_clubs ? '<span class="text-blue-400 text-xs material-icons" title="Renta de Equipo (Palos)">sports_golf</span>' : ''}
                </div>

                <div class="flex items-center gap-2 shrink-0">
                    ${isCaptured ? `
                        <span class="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-black flex items-center gap-1">
                            <span class="material-icons text-xs">check_circle</span> GROSS: ${pGross} GOLPES
                        </span>
                        <button type="button" onclick="window.togglePlayerScorecardCollapse('${outId}')"
                            class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black uppercase flex items-center gap-1 transition-all">
                            <span class="material-icons text-xs">edit</span> Ver / Editar Scorecard
                        </button>
                    ` : (isNoCard ? `
                        <span class="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-xl text-xs font-black flex items-center gap-1">
                            <span class="material-icons text-xs">block</span> NO ENTREGÓ (PAR ${COURSE_PAR} ARCHIVADO)
                        </span>
                        <button type="button" onclick="window.togglePlayerScorecardCollapse('${outId}')"
                            class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black uppercase flex items-center gap-1 transition-all">
                            <span class="material-icons text-xs">edit</span> Ver / Editar Scorecard
                        </button>
                    ` : `
                        <span class="text-xs text-amber-400 font-black uppercase tracking-wider flex items-center gap-1">
                            <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span> Pendiente de entrega
                        </span>
                    `)}
                </div>
            </div>

            <!-- Scorecard Panel (visible if pending, toggleable if captured/no_card) -->
            <div id="scorecard-panel-${outId}" class="${(isCaptured || isNoCard) ? 'hidden' : ''} space-y-4">
                <!-- Totales Responsive -->
                <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div class="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-center">
                        <p class="text-[8px] font-black text-slate-400 uppercase tracking-wider">CAMPO</p>
                        <p class="text-[11px] font-black text-white uppercase truncate">CLUB COLIMA GOLF</p>
                    </div>
                    <div class="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-center">
                        <p class="text-[8px] font-black text-slate-400 uppercase tracking-wider">IN (1-9)</p>
                        <p id="caddie-in-${outId}" class="text-base font-black text-white">${inSum}</p>
                    </div>
                    <div class="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-center">
                        <p class="text-[8px] font-black text-slate-400 uppercase tracking-wider">OUT (10-18)</p>
                        <p id="caddie-out-${outId}" class="text-base font-black text-white">${outSum}</p>
                    </div>
                    <div class="px-3 py-2 bg-blue-500/20 border border-blue-500/40 rounded-xl text-center">
                        <p class="text-[8px] font-black text-blue-300 uppercase tracking-wider">GROSS</p>
                        <p id="caddie-gross-${outId}" class="text-xl font-black text-blue-300 leading-tight">${grossSum}</p>
                    </div>
                    <div class="px-3 py-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-center col-span-2 sm:col-span-1">
                        <p class="text-[8px] font-black text-emerald-400 uppercase tracking-wider">TOTAL NETO (HCP ${hcp})</p>
                        <p id="caddie-net-${outId}" data-hcp="${hcp}" class="text-xl font-black text-emerald-400 leading-tight">${netSum}</p>
                    </div>
                </div>

                <!-- VUELTA 1-9 (IN) -->
                <div class="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                    <div class="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
                        <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> VUELTA 1-9 (IN)</span>
                        <span class="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded font-black">PAR 34</span>
                    </div>
                    <div class="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
                        ${inHoles.map(h => renderCaddiePlayerHoleCard(outId, h, currentScores[`h${h.hole}`] || '')).join('')}
                    </div>
                </div>

                <!-- VUELTA 10-18 (OUT) -->
                <div class="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                    <div class="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
                        <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-blue-500"></span> VUELTA 10-18 (OUT)</span>
                        <span class="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded font-black">PAR 34</span>
                    </div>
                    <div class="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
                        ${outHoles.map(h => renderCaddiePlayerHoleCard(outId, h, currentScores[`h${h.hole}`] || '')).join('')}
                    </div>
                </div>

                <!-- ACTIONS BAR -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
                    <div class="flex items-center gap-2 flex-wrap">
                        <button type="button" onclick="window.fillPlayerPar('${outId}')"
                            class="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all">
                            <span class="material-icons text-sm text-primary">tune</span> Llenar Par (${COURSE_PAR})
                        </button>
                        <button type="button" onclick="window.clearPlayerScorecard('${outId}')"
                            class="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-xs font-black uppercase transition-all">
                            Limpiar
                        </button>
                        <button type="button" onclick="window.submitQuickNoScore('${t.id}', '${pName.replace(/'/g, "\\'")}', '${p.member_id || ''}')"
                            class="px-3.5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all">
                            <span class="material-icons text-sm">block</span> No Entregó Tarjeta (Par ${COURSE_PAR})
                        </button>
                    </div>

                    <button type="button" onclick="window.savePlayerDetailedScorecard('${t.id}', '${pName.replace(/'/g, "\\'")}', '${p.member_id || ''}', '${outId}')"
                        class="px-7 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5">
                        <span class="material-icons text-sm">save</span> Guardar Scorecard
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Render Tee Times List (Tab 2)
function renderTeeTimesList() {
    const container = document.getElementById('caddie-teetimes-container');
    const filterInput = document.getElementById('teetimes-search-input');
    const query = filterInput ? filterInput.value.toLowerCase().trim() : '';

    if (!container) return;

    const filtered = todayTeeTimes.filter(t => {
        if (t.status === 'CANCELLED') return false;
        if (!query) return true;
        const playersStr = Array.isArray(t.players) ? t.players.map(p => p.name).join(' ') : '';
        const searchCorpus = `${t.folio || ''} ${t.contact_name || ''} ${playersStr} ${t.caddie_assigned || ''} ${t.cart_numbers || ''}`.toLowerCase();
        return searchCorpus.includes(query);
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="py-12 text-center bg-slate-950/40 border border-slate-800 rounded-2xl">
                <span class="material-icons text-slate-600 text-4xl mb-2">sports_golf</span>
                <p class="text-xs text-slate-500 font-bold uppercase tracking-wider">No hay salidas de recepción registradas para hoy con ese término.</p>
            </div>`;
        return;
    }

    container.innerHTML = filtered.map(t => {
        const isPaid = t.status === 'PAID';
        const isOnCourse = t.status === 'ON_COURSE';
        const isReserved = t.status === 'RESERVED';
        const players = Array.isArray(t.players) ? t.players : [];

        let statusBadge = '';
        if (isOnCourse) {
            statusBadge = `<span class="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-black uppercase flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-400"></span> ⛳ En Campo</span>`;
        } else if (isPaid) {
            statusBadge = `<span class="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-black uppercase flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-400"></span> 🔵 Pagado / En Tee</span>`;
        } else {
            statusBadge = `<span class="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-black uppercase flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-400"></span> 🟡 Reserva</span>`;
        }

        return `
            <div class="bg-slate-950/80 border ${isOnCourse ? 'border-emerald-500/40' : (isPaid ? 'border-blue-500/40' : 'border-slate-800')} rounded-2xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition-all">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div class="flex items-center gap-3">
                        <span class="px-3.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl font-black text-sm text-white">
                            ${t.booking_time} hrs
                        </span>
                        <div>
                            <div class="flex items-center gap-2">
                                <h4 class="font-black text-white uppercase text-sm">${t.contact_name || 'Grupo'}</h4>
                                <span class="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded-lg text-[10px] font-black text-slate-400">${t.folio}</span>
                            </div>
                            <p class="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Tee Inicial: <span class="text-white font-black">Hoyo #${t.starting_hole || 1}</span> · ${t.total_players} Jugadores · ${t.total_carts || 0} Carrito(s)</p>
                        </div>
                    </div>

                    <div class="flex items-center gap-3 shrink-0">
                        ${statusBadge}
                        <button onclick="window.openAuthorizeModal('${t.id}')"
                            class="px-4 py-2 ${isOnCourse ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'} rounded-xl font-black text-xs uppercase flex items-center gap-1.5 transition-all">
                            <span class="material-icons text-sm">${isOnCourse ? 'edit' : 'play_arrow'}</span>
                            ${isOnCourse ? 'Modificar Salida' : '⛳ Dar Salida'}
                        </button>
                    </div>
                </div>

                <!-- Players & Score Capture Section -->
                ${(isOnCourse || t.status === 'COMPLETED') ? `
                    <div class="pt-2 border-t border-slate-800/80 space-y-3">
                        <div class="flex items-center justify-between">
                            <h5 class="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                                <span class="material-icons text-sm text-primary">edit_note</span> Captura de Scores / Entrega de Tarjeta
                            </h5>
                            <span class="text-[10px] font-bold text-slate-400 uppercase">
                                ${isOnCourse ? '🏌️ En Campo' : '🏁 Concluido'}
                            </span>
                        </div>

                        <div class="space-y-2.5">
                            ${players.map((p, idx) => {
                                const pName = p.name || t.contact_name || `Jugador #${idx + 1}`;
                                const pOutput = todayOutputs.find(o => (o.tee_time_id === t.id || o.folio === t.folio) && (o.member_name === pName || (!p.name && o.member_name === t.contact_name)));
                                const outId = pOutput ? pOutput.id : `tmp_${t.id}_${idx}`;
                                const pStatus = pOutput ? (pOutput.score_status || 'PENDING') : 'PENDING';
                                const pGross = pOutput ? pOutput.gross_score : null;

                                return `
                                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-900/90 rounded-2xl border ${pStatus === 'CAPTURED' ? 'border-emerald-500/40 shadow-emerald-500/5' : (pStatus === 'NO_CARD' ? 'border-amber-500/40 shadow-amber-500/5' : 'border-slate-800')} shadow-sm hover:border-slate-700 transition-all">
                                        <div class="flex items-center gap-3 min-w-0">
                                            <span class="w-7 h-7 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-black text-xs shrink-0">#${idx + 1}</span>
                                            <div class="min-w-0">
                                                <div class="flex items-center gap-2 flex-wrap">
                                                    <span class="font-black text-white text-xs sm:text-sm uppercase truncate">${pName}</span>
                                                    <span class="text-[9px] px-2 py-0.5 rounded-lg ${p.is_member ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'} font-black shrink-0">
                                                        ${p.is_member ? 'SOCIO' : (p.player_type || 'INVITADO')}
                                                    </span>
                                                    ${p.has_cart ? '<span class="text-amber-400 text-xs material-icons" title="Renta Carrito">electric_car</span>' : ''}
                                                </div>
                                                <div class="mt-0.5 flex items-center gap-2">
                                                    ${pStatus === 'CAPTURED' ? `
                                                        <span class="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-black flex items-center gap-1">
                                                            <span class="material-icons text-xs">check_circle</span> Gross: ${pGross} golpes
                                                        </span>
                                                    ` : (pStatus === 'NO_CARD' ? `
                                                        <span class="px-2.5 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-black flex items-center gap-1">
                                                            <span class="material-icons text-xs">block</span> No entregó tarjeta (Par ${COURSE_PAR} archivado)
                                                        </span>
                                                    ` : `
                                                        <span class="text-[10px] font-bold text-amber-400/90 flex items-center gap-1">
                                                            <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span> Pendiente de entrega
                                                        </span>
                                                    `)}
                                                </div>
                                            </div>
                                        </div>

                                        <!-- 2 Buttons: Agregar Score & No entregó tarjeta -->
                                        <div class="flex items-center gap-2 shrink-0">
                                            <button type="button" onclick="window.openScoreCaptureForPlayer('${t.id}', '${pName.replace(/'/g, "\\'")}', '${p.member_id || ''}')"
                                                class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-95">
                                                <span class="material-icons text-sm">${pStatus === 'CAPTURED' ? 'edit' : 'add_chart'}</span>
                                                ${pStatus === 'CAPTURED' ? 'Editar Score' : 'Agregar Score'}
                                            </button>

                                            <button type="button" onclick="window.submitQuickNoScore('${t.id}', '${pName.replace(/'/g, "\\'")}', '${p.member_id || ''}')"
                                                title="Asignar automáticamente Par de Campo (${COURSE_PAR}) y archivar tarjeta"
                                                class="px-3.5 py-2 ${pStatus === 'NO_CARD' ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40'} font-black text-xs uppercase rounded-xl transition-all flex items-center gap-1.5 active:scale-95">
                                                <span class="material-icons text-sm">block</span> No entregó tarjeta
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : `
                    <!-- Players Badges -->
                    <div class="flex flex-wrap items-center gap-2">
                        ${players.map((p, idx) => `
                            <div class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-black">
                                <span class="text-primary text-[10px]">#${idx + 1}</span>
                                <span class="text-white uppercase">${p.name || 'Sin Nombre'}</span>
                                <span class="text-[9px] px-1.5 py-0.5 rounded ${p.is_member ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'} font-bold">
                                    ${p.is_member ? 'SOCIO' : (p.player_type || 'INVITADO')}
                                </span>
                                ${p.has_cart ? '<span class="text-amber-400 text-[10px] material-icons" title="Renta Carrito">electric_car</span>' : ''}
                                ${p.has_clubs ? '<span class="text-blue-400 text-[10px] material-icons" title="Renta de Equipo (Palos)">sports_golf</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                `}

                ${(t.caddie_assigned || t.cart_numbers) ? `
                    <div class="flex items-center gap-4 text-xs font-bold text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                        ${t.caddie_assigned ? `<span class="flex items-center gap-1 text-emerald-400"><span class="material-icons text-sm">sports_golf</span> Caddie: <strong>${t.caddie_assigned}</strong></span>` : ''}
                        ${t.cart_numbers ? `<span class="flex items-center gap-1 text-amber-400"><span class="material-icons text-sm">electric_car</span> Carrito(s): <strong>${t.cart_numbers}</strong></span>` : ''}
                        ${t.departure_time ? `<span class="text-slate-500 text-[10px]">Salida: ${new Date(t.departure_time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>` : ''}
                    </div>
                ` : ''}
            </div>`;
    }).join('');
}

window.renderOnCoursePlayersList = function() {
    const container = document.getElementById('oncourse-players-container');
    const badgeEl = document.getElementById('tab-caddie-oncourse-badge');
    const countEl = document.getElementById('oncourse-players-count');
    if (!container) return;

    const query = (document.getElementById('oncourse-search-input')?.value || '').trim().toLowerCase();

    // Find all players currently ON COURSE whose score is PENDING
    const onCourseBookings = todayTeeTimes.filter(t => t.status === 'ON_COURSE');
    const activePlayers = [];

    onCourseBookings.forEach(t => {
        const players = Array.isArray(t.players) && t.players.length > 0 
            ? t.players 
            : [{ name: t.contact_name, is_member: true, player_type: 'SOCIO' }];

        players.forEach((p, idx) => {
            const pName = p.name || t.contact_name || `Jugador #${idx + 1}`;
            const pOutput = todayOutputs.find(o => 
                (o.tee_time_id === t.id || o.folio === t.folio) && 
                (o.member_name === pName || (!p.name && o.member_name === t.contact_name))
            );

            const pStatus = pOutput ? (pOutput.score_status || 'PENDING') : 'PENDING';

            // User requirement: If score has been captured, 9 holes recorded, or marked no_card, do not show!
            if (pStatus === 'CAPTURED' || pStatus === 'NO_CARD' || pStatus === 'PARTIAL_9') {
                return;
            }

            if (query) {
                const matchName = pName.toLowerCase().includes(query);
                const matchCaddie = (t.caddie_assigned || '').toLowerCase().includes(query);
                const matchCart = (t.cart_numbers || '').toLowerCase().includes(query);
                const matchFolio = (t.folio || '').toLowerCase().includes(query);
                if (!matchName && !matchCaddie && !matchCart && !matchFolio) return;
            }

            activePlayers.push({
                booking: t,
                player: p,
                playerIndex: idx,
                name: pName,
                output: pOutput,
                status: pStatus
            });
        });
    });

    if (badgeEl) badgeEl.textContent = activePlayers.length;
    if (countEl) countEl.textContent = activePlayers.length;

    if (activePlayers.length === 0) {
        container.innerHTML = `
            <div class="py-12 px-4 text-center bg-slate-950/40 border border-slate-800/80 rounded-2xl">
                <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-3">
                    <span class="material-icons text-3xl">sports_golf</span>
                </div>
                <h4 class="text-white font-black uppercase text-sm">No hay jugadores pendientes en campo</h4>
                <p class="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1 max-w-md mx-auto">
                    Todos los jugadores de las salidas en campo ya entregaron su tarjeta o tienen su score registrado.
                </p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            ${activePlayers.map(item => {
                const { booking: t, player: p, playerIndex: idx, name: pName } = item;
                const startingHole = t.starting_hole || 1;

                return `
                    <div class="p-4 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl space-y-3 transition-all shadow-md">
                        <div class="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                            <div class="flex items-center gap-2">
                                <span class="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-xl font-black text-xs text-emerald-400">
                                    ⛳ Hoyo #${startingHole}
                                </span>
                                <span class="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-black uppercase">
                                    ${t.booking_time} hrs
                                </span>
                            </div>
                            <span class="text-[10px] font-bold text-slate-500 uppercase">Folio: ${t.folio}</span>
                        </div>

                        <div class="flex items-center justify-between gap-3">
                            <div class="min-w-0">
                                <div class="flex items-center gap-2">
                                    <h4 class="font-black text-white text-sm uppercase truncate">${pName}</h4>
                                    <span class="text-[9px] px-2 py-0.5 rounded-lg ${p.is_member ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'} font-black">
                                        ${p.is_member ? 'SOCIO' : (p.player_type || 'INVITADO')}
                                    </span>
                                </div>
                                <div class="flex items-center gap-3 text-[11px] text-slate-400 font-bold mt-1 flex-wrap">
                                    ${t.caddie_assigned ? `<span class="flex items-center gap-1 text-slate-300"><span class="material-icons text-xs text-primary">sports_golf</span> ${t.caddie_assigned}</span>` : ''}
                                    ${t.cart_numbers ? `<span class="flex items-center gap-1 text-amber-400"><span class="material-icons text-xs">electric_car</span> ${t.cart_numbers}</span>` : '<span class="text-slate-500 text-[10px]">A pie</span>'}
                                    ${p.has_clubs ? `<span class="flex items-center gap-1 text-blue-400"><span class="material-icons text-xs">sports_golf</span> Renta Palos</span>` : ''}
                                </div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="pt-2 border-t border-slate-800/60 flex items-center gap-2 justify-end">
                            <button type="button" onclick="window.openScoreCaptureForPlayer('${t.id}', '${pName.replace(/'/g, "\\'")}', '${p.member_id || ''}')"
                                class="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-95">
                                <span class="material-icons text-sm">add_chart</span> Agregar Score
                            </button>

                            <button type="button" onclick="window.submitQuickNoScore('${t.id}', '${pName.replace(/'/g, "\\'")}', '${p.member_id || ''}')"
                                title="Asignar automáticamente Par de Campo (${COURSE_PAR}) y archivar tarjeta"
                                class="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 font-black text-xs uppercase rounded-xl transition-all flex items-center gap-1.5 active:scale-95">
                                <span class="material-icons text-sm">block</span> No entregó tarjeta
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
};

// Modal: Autorizar Salida de Grupo (Check-in a Tee)
window.openAuthorizeModal = function(teeTimeId) {
    const b = todayTeeTimes.find(t => String(t.id) === String(teeTimeId));
    if (!b) return;

    let modal = document.getElementById('modal-member-crud');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-member-crud';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in';
        document.body.appendChild(modal);
    }

    const players = Array.isArray(b.players) ? b.players : [];

    modal.innerHTML = `
        <div class="w-full max-w-xl bg-slate-950/95 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col" onclick="event.stopPropagation()">
            <div class="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                <div class="flex items-center gap-3">
                    <div class="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                        <span class="material-icons">sports_golf</span>
                    </div>
                    <div>
                        <h3 class="font-black uppercase text-white text-base leading-none">Autorizar Salida al Campo</h3>
                        <p class="text-xs text-slate-400 font-bold uppercase mt-1">Folio: ${b.folio} · ${b.booking_time} hrs</p>
                    </div>
                </div>
                <button type="button" onclick="window.closeCaddieModal()" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all" title="Cerrar">
                    <span class="material-icons" style="font-size:18px">close</span>
                </button>
            </div>

            <div class="p-6 space-y-5">
                <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-slate-400 font-bold">Contacto / Responsable:</span>
                        <span class="font-black text-white uppercase">${b.contact_name}</span>
                    </div>
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-slate-400 font-bold">Jugadores en el Grupo:</span>
                        <span class="font-black text-emerald-400">${b.total_players} (${players.map(p => p.name).filter(Boolean).join(', ') || 'Nombres pendientes'})</span>
                    </div>
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-slate-400 font-bold">Carritos Pagados en Recepción:</span>
                        <span class="font-black text-amber-400">${b.total_carts || 0} Carrito(s)</span>
                    </div>
                </div>

                <form id="form-modal-authorize-departure" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Hoyo de Salida *</label>
                            <select id="modal-out-hole" class="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                                ${Array.from({ length: 18 }, (_, i) => i + 1).map(h => `
                                    <option value="${h}" ${(parseInt(b.starting_hole) || 1) === h ? 'selected' : ''}>Hoyo ${h}${h === 1 ? ' (Tee Principal)' : (h === 10 ? ' (Vuelta 2)' : '')}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Número de Carrito(s)</label>
                            <input id="modal-out-cart" type="text" value="${b.cart_numbers || ''}" placeholder="Ej. Carro #3, #7" class="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                        </div>
                    </div>

                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Caddie(s) Asignado(s)</label>
                        <input id="modal-out-caddie" type="text" value="${b.caddie_assigned || ''}" placeholder="Ej. Caddie Juan Pérez" class="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-primary">
                    </div>

                    <div class="pt-3 border-t border-slate-800 flex justify-end gap-3">
                        <button type="button" onclick="window.closeCaddieModal()" class="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-xs uppercase transition-all">
                            Cancelar
                        </button>
                        <button type="submit" class="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-xs uppercase transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5">
                            <span class="material-icons text-sm">check_circle</span> Confirmar Salida
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in';
    modal.style.display = 'flex';
    modal.classList.remove('hidden');
    modal.onclick = (e) => {
        if (e.target === modal) window.closeCaddieModal();
    };

    document.getElementById('form-modal-authorize-departure').onsubmit = async (e) => {
        e.preventDefault();
        const hole = parseInt(document.getElementById('modal-out-hole').value) || 1;
        const carts = document.getElementById('modal-out-cart').value.trim();
        const caddie = document.getElementById('modal-out-caddie').value.trim();

        await authorizeTeeTimeDeparture(b.id, hole, carts, caddie);
        window.closeCaddieModal();
    };
};

async function authorizeTeeTimeDeparture(teeTimeId, hole, carts, caddie) {
    const booking = todayTeeTimes.find(t => String(t.id) === String(teeTimeId));
    if (!booking) return;

    try {
        const departureIso = new Date().toISOString();

        // 1. Update colimaGC.tee_times
        await dbColima.from('tee_times').update({
            status: 'ON_COURSE',
            departure_time: departureIso,
            starting_hole: hole,
            cart_numbers: carts,
            caddie_assigned: caddie
        }).eq('id', booking.id);

        // 2. Insert players into daily_outputs for scorecard tracking
        const players = Array.isArray(booking.players) && booking.players.length > 0
            ? booking.players
            : [{ name: booking.contact_name, is_member: false, player_type: 'GUEST' }];

        for (const p of players) {
            const outPayload = {
                tee_time_id: booking.id,
                folio: booking.folio,
                member_id: p.member_id || null,
                member_number: p.member_number || 'INV',
                member_name: p.name || booking.contact_name,
                player_type: p.is_member ? 'MEMBER' : (p.player_type || 'GUEST'),
                starting_hole: hole,
                caddie_name: caddie,
                cart_number: carts,
                score_status: 'PENDING'
            };

            try {
                const { error: err1 } = await dbColima.from('daily_outputs').insert([outPayload]);
                if (err1) {
                    await dbStarter.from('daily_outputs').insert([outPayload]);
                }
            } catch (err) {
                await dbStarter.from('daily_outputs').insert([outPayload]);
            }
        }

        window.showNotification?.('¡Salida Autorizada!', `Grupo ${booking.contact_name} en campo por el Hoyo #${hole}.`, 'success');
        await loadCaddieData();

    } catch (e) {
        console.error('Error authorizing departure:', e);
        window.showNotification?.('Error', 'No se pudo actualizar la salida: ' + e.message, 'error');
    }
}

// Bitácora de Salidas de Hoy (Tab 3)
function renderOutputsTable() {
    const container = document.getElementById('caddie-outputs-table-container');
    const filterInput = document.getElementById('log-search-input');
    const logQuery = filterInput ? filterInput.value.toLowerCase().trim() : '';

    if (!container) return;

    const filtered = todayOutputs.filter(o => {
        if (!logQuery) return true;
        return `${o.member_name} ${o.member_number} ${o.caddie_name || ''} ${o.cart_number || ''} ${o.notes || ''}`.toLowerCase().includes(logQuery);
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="py-12 text-center bg-slate-950/40 border border-slate-800 rounded-2xl">
                <span class="material-icons text-slate-600 text-4xl mb-2">sports_golf</span>
                <p class="text-xs text-slate-500 font-bold uppercase tracking-wider">Aún no hay salidas registradas con ese término el día de hoy.</p>
            </div>`;
        return;
    }

    container.innerHTML = `
        <div class="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table class="w-full text-left border-collapse text-xs">
                <thead>
                    <tr class="bg-slate-900 border-b border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        <th class="px-5 py-3.5">Hora</th>
                        <th class="px-5 py-3.5"># Socio / ID</th>
                        <th class="px-5 py-3.5">Jugador</th>
                        <th class="px-5 py-3.5 text-center">Hoyo Salida</th>
                        <th class="px-5 py-3.5">Caddie / Carro</th>
                        <th class="px-5 py-3.5 text-center">Score / Estatus</th>
                        <th class="px-5 py-3.5 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                    ${filtered.map(o => {
                        const timeStr = new Date(o.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
                        const status = o.score_status || 'PENDING';
                        const scoreVal = o.gross_score !== null && o.gross_score !== undefined ? o.gross_score : null;

                        let scoreBadgeHtml = '';
                        if (status === 'CAPTURED') {
                            scoreBadgeHtml = `<span class="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-black text-xs">🟢 Gross: ${scoreVal}</span>`;
                        } else if (status === 'PARTIAL_9') {
                            scoreBadgeHtml = `<span class="px-3 py-1 bg-amber-500/15 text-amber-300 border border-amber-500/40 rounded-full font-black text-xs">⏱️ 9 Hoyos (${scoreVal} g)</span>`;
                        } else if (status === 'NO_CARD') {
                            scoreBadgeHtml = `<span class="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full font-black text-xs">🟡 No Entregó (Par ${COURSE_PAR})</span>`;
                        } else {
                            scoreBadgeHtml = `<span class="px-3 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full font-black text-[10px]">⏳ En Juego</span>`;
                        }

                        return `
                            <tr class="hover:bg-slate-800/40 transition-colors">
                                <td class="px-5 py-3.5 font-black text-emerald-400 text-sm">${timeStr}</td>
                                <td class="px-5 py-3.5"><span class="font-black text-slate-300 bg-slate-800 px-2.5 py-1 rounded-md text-[11px]">#${o.member_number || 'INV'}</span></td>
                                <td class="px-5 py-3.5 font-black text-white uppercase text-sm">${o.member_name}</td>
                                <td class="px-5 py-3.5 text-center font-black text-blue-400">Hoyo #${o.starting_hole || 1}</td>
                                <td class="px-5 py-3.5 text-slate-400 font-bold">
                                    ${o.caddie_name ? `<span class="text-slate-300">🏌️ ${o.caddie_name}</span>` : 'S/C'}
                                    ${o.cart_number ? `<span class="text-amber-400 ml-1.5">🚗 ${o.cart_number}</span>` : ''}
                                </td>
                                <td class="px-5 py-3.5 text-center font-bold">${scoreBadgeHtml}</td>
                                <td class="px-5 py-3.5 text-right">
                                    <div class="flex items-center justify-end gap-2">
                                        <button onclick="window.openScoreCaptureModal('${o.id}')"
                                            class="px-3.5 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary rounded-xl font-black text-xs uppercase flex items-center gap-1.5 transition-all shadow-md">
                                            <span class="material-icons" style="font-size:16px">edit_note</span> ${status==='PENDING'?'Capturar Scorecard':(status==='PARTIAL_9'?'Completar 18H':'Editar Scorecard')}
                                        </button>
                                        <button onclick="window.setNoScorePar('${o.id}')"
                                            title="Marcar No Entregó Tarjeta (Asigna Par de Campo ${COURSE_PAR})"
                                            class="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 transition-all shadow-md">
                                            <span class="material-icons" style="font-size:16px">block</span> No Entregó (Par ${COURSE_PAR})
                                        </button>
                                    </div>
                                </td>
                            </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
}

// Quick action: No entrego tarjeta (auto Par 78)
window.setNoScorePar = async function(outputId) {
    const output = todayOutputs.find(o => String(o.id) === String(outputId));
    if (!output) return;

    window.showNotification?.(
        'No Entregó Tarjeta',
        `¿Confirmas marcar que el jugador ${output.member_name} no entregó tarjeta? Se le asignará automáticamente Par de Campo (${COURSE_PAR}).`,
        'confirm',
        async () => {
            // 1. Update daily_output status
            try {
                await dbColima.from('daily_outputs').update({
                    score_status: 'NO_CARD',
                    gross_score: COURSE_PAR
                }).eq('id', output.id);
            } catch (e) {
                await dbStarter.from('daily_outputs').update({
                    score_status: 'NO_CARD',
                    gross_score: COURSE_PAR
                }).eq('id', output.id);
            }

            // Create default par hole scores
            const defaultHoles = {};
            CLUB_COLIMA_HOLES.forEach(h => { defaultHoles[`h${h.hole}`] = h.par; });

            // 2. Insert into member_scores if member_id exists
            if (output.member_id) {
                const diff = parseFloat(((113 / COURSE_SLOPE) * (COURSE_PAR - COURSE_RATING)).toFixed(1));
                const scorePayload = {
                    member_id: output.member_id,
                    output_id: output.id,
                    date_played: selectedCaddieDate || getLocalDateString(),
                    gross_score: COURSE_PAR,
                    course_rating: COURSE_RATING,
                    slope_rating: COURSE_SLOPE,
                    differential: diff,
                    hole_scores: defaultHoles,
                    delivered: false,
                    notes: `No entregó tarjeta (Par de Campo ${COURSE_PAR})`
                };

                try {
                    await dbColima.from('member_scores').insert([scorePayload]);
                } catch (e) {
                    await dbStarter.from('member_scores').insert([scorePayload]);
                }

                await recalculateMemberHandicap(output.member_id);
            }

            window.showNotification?.('Score Registrado', `Se asignó Par de Campo (${COURSE_PAR}) a ${output.member_name}.`, 'success');
            await loadCaddieData();
            if (activeTab === 'ONCOURSE') {
                window.renderOnCoursePlayersList();
            }
        }
    );
};

window.calcQuickGross = function(outId) {
    const elIda = document.getElementById(`quick-ida-${outId}`);
    const elVuelta = document.getElementById(`quick-vuelta-${outId}`);
    const elGross = document.getElementById(`quick-gross-val-${outId}`);
    if (!elGross) return;

    const ida = parseInt(elIda?.value) || 0;
    const vuelta = parseInt(elVuelta?.value) || 0;
    if (ida > 0 || vuelta > 0) {
        elGross.textContent = `${ida + vuelta} golpes`;
    } else {
        elGross.textContent = '—';
    }
};

window.submitQuickScore = async function(teeTimeId, playerName, memberId) {
    const booking = todayTeeTimes.find(t => String(t.id) === String(teeTimeId));
    if (!booking) return;

    const pName = playerName || booking.contact_name;
    let output = todayOutputs.find(o => 
        (o.tee_time_id === booking.id || o.folio === booking.folio) && 
        (o.member_name === pName || (!playerName && o.member_name === booking.contact_name))
    );

    const outId = output ? output.id : `tmp_${booking.id}_${pName}`;
    const elIda = document.getElementById(`quick-ida-${outId}`);
    const elVuelta = document.getElementById(`quick-vuelta-${outId}`);

    const ida = parseInt(elIda?.value) || 0;
    const vuelta = parseInt(elVuelta?.value) || 0;
    const gross = ida + vuelta;

    if (gross <= 0) {
        window.showNotification?.('Score Inválido', 'Por favor ingresa los golpes de Ida y/o Vuelta.', 'error');
        return;
    }

    try {
        if (!output || String(output.id).startsWith('tmp_')) {
            const outPayload = {
                tee_time_id: booking.id,
                folio: booking.folio,
                member_id: memberId || null,
                member_number: memberId ? 'SOC' : 'INV',
                member_name: pName,
                player_type: memberId ? 'MEMBER' : 'GUEST',
                starting_hole: booking.starting_hole || 1,
                caddie_name: booking.caddie_assigned || '',
                cart_number: booking.cart_numbers || '',
                score_status: 'CAPTURED',
                gross_score: gross
            };
            try {
                const { data } = await dbColima.from('daily_outputs').insert([outPayload]).select().single();
                output = data;
            } catch (e) {
                try {
                    const { data } = await dbStarter.from('daily_outputs').insert([outPayload]).select().single();
                    output = data;
                } catch (e2) {}
            }
        } else {
            try {
                await dbColima.from('daily_outputs').update({
                    score_status: 'CAPTURED',
                    gross_score: gross
                }).eq('id', output.id);
            } catch (e) {
                await dbStarter.from('daily_outputs').update({
                    score_status: 'CAPTURED',
                    gross_score: gross
                }).eq('id', output.id);
            }
        }

        const effectiveMemberId = memberId || (output && output.member_id);
        if (effectiveMemberId && effectiveMemberId !== 'null' && effectiveMemberId !== 'undefined' && effectiveMemberId !== '') {
            const diff = parseFloat(((113 / COURSE_SLOPE) * (gross - COURSE_RATING)).toFixed(1));
            const holeScores = {};
            CLUB_COLIMA_HOLES.slice(0, 9).forEach(h => { holeScores[`h${h.hole}`] = Math.round(ida / 9) || h.par; });
            CLUB_COLIMA_HOLES.slice(9, 18).forEach(h => { holeScores[`h${h.hole}`] = Math.round(vuelta / 9) || h.par; });

            const scorePayload = {
                member_id: effectiveMemberId,
                output_id: output ? output.id : null,
                date_played: selectedCaddieDate || getLocalDateString(),
                gross_score: gross,
                course_rating: COURSE_RATING,
                slope_rating: COURSE_SLOPE,
                differential: diff,
                hole_scores: holeScores,
                delivered: true,
                notes: `Captura rápida Caddie Master (Ida: ${ida}, Vuelta: ${vuelta})`
            };

            try {
                await dbColima.from('member_scores').insert([scorePayload]);
            } catch (e) {
                await dbStarter.from('member_scores').insert([scorePayload]);
            }

            await recalculateMemberHandicap(effectiveMemberId);
        }

        window.showNotification?.('¡Score Guardado!', `Score Gross de ${gross} guardado para ${pName}.`, 'success');
        await loadCaddieData();

    } catch (err) {
        console.error('Error in submitQuickScore:', err);
        window.showNotification?.('Error', 'No se pudo guardar el score: ' + err.message, 'error');
    }
};

window.submitQuickNoScore = async function(teeTimeId, playerName, memberId) {
    const booking = todayTeeTimes.find(t => String(t.id) === String(teeTimeId));
    if (!booking) return;

    const pName = playerName || booking.contact_name;
    let output = todayOutputs.find(o => 
        (o.tee_time_id === booking.id || o.folio === booking.folio) && 
        (o.member_name === pName || (!playerName && o.member_name === booking.contact_name))
    );

    if (!output || String(output.id).startsWith('tmp_')) {
        const outPayload = {
            tee_time_id: booking.id,
            folio: booking.folio,
            member_id: memberId || null,
            member_number: memberId ? 'SOC' : 'INV',
            member_name: pName,
            player_type: memberId ? 'MEMBER' : 'GUEST',
            starting_hole: booking.starting_hole || 1,
            caddie_name: booking.caddie_assigned || '',
            cart_number: booking.cart_numbers || '',
            score_status: 'NO_CARD',
            gross_score: COURSE_PAR
        };
        try {
            const { data } = await dbColima.from('daily_outputs').insert([outPayload]).select().single();
            if (data) output = data;
        } catch (e) {
            try {
                const { data } = await dbStarter.from('daily_outputs').insert([outPayload]).select().single();
                if (data) output = data;
            } catch (e2) {}
        }
        if (!output) {
            output = { id: `tmp_${booking.id}_${encodeURIComponent(pName)}`, ...outPayload };
        }
        if (!todayOutputs.find(o => o.id === output.id)) {
            todayOutputs.push(output);
        }
    }

    await window.setNoScorePar(output.id, output);
};

window.openScoreCaptureForPlayer = async function(teeTimeId, playerName, memberId) {
    const booking = todayTeeTimes.find(t => String(t.id) === String(teeTimeId));
    if (!booking) {
        console.warn('Booking not found for teeTimeId:', teeTimeId);
        return;
    }

    const pName = playerName || booking.contact_name;
    let output = todayOutputs.find(o => 
        (o.tee_time_id === booking.id || o.folio === booking.folio) && 
        (o.member_name === pName || (!playerName && o.member_name === booking.contact_name))
    );

    if (!output) {
        const tempId = `tmp_${booking.id}_${encodeURIComponent(pName).replace(/[^a-zA-Z0-9]/g, '')}`;
        output = {
            id: tempId,
            tee_time_id: booking.id,
            folio: booking.folio,
            member_id: memberId || null,
            member_number: memberId ? 'SOC' : 'INV',
            member_name: pName,
            player_type: memberId ? 'MEMBER' : 'GUEST',
            starting_hole: booking.starting_hole || 1,
            caddie_name: booking.caddie_assigned || '',
            cart_number: booking.cart_numbers || '',
            score_status: 'PENDING',
            gross_score: null,
            hole_scores: {}
        };
        todayOutputs.push(output);

        const outPayload = {
            tee_time_id: booking.id,
            folio: booking.folio,
            member_id: memberId || null,
            member_number: memberId ? 'SOC' : 'INV',
            member_name: pName,
            player_type: memberId ? 'MEMBER' : 'GUEST',
            starting_hole: booking.starting_hole || 1,
            caddie_name: booking.caddie_assigned || '',
            cart_number: booking.cart_numbers || '',
            score_status: 'PENDING'
        };

        dbColima.from('daily_outputs').insert([outPayload]).select().single()
            .then(res => { if (res.data) output.id = res.data.id; })
            .catch(() => {
                dbStarter.from('daily_outputs').insert([outPayload]).select().single()
                    .then(res2 => { if (res2.data) output.id = res2.data.id; })
                    .catch(() => {});
            });
    }

    window.openScoreCaptureModal(output.id, output);
};

window.openPlayerDetailScoreModal = window.openScoreCaptureForPlayer;

window.togglePlayerScorecardCollapse = function(outId) {
    const el = document.getElementById(`scorecard-panel-${outId}`);
    if (el) {
        el.classList.toggle('hidden');
    }
};

window.handleCaddieHoleKeyDown = function(event, outId, holeNum) {
    if (event.key === 'Enter' || event.key === 'ArrowRight') {
        event.preventDefault();
        const nextInput = document.getElementById(`caddie-score-${outId}-h${holeNum + 1}`);
        if (nextInput) {
            nextInput.focus();
            nextInput.select();
        }
    } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        const prevInput = document.getElementById(`caddie-score-${outId}-h${holeNum - 1}`);
        if (prevInput) {
            prevInput.focus();
            prevInput.select();
        }
    }
};

window.onCaddiePlayerHoleInput = function(outId, holeNum, inputEl) {
    const v = parseInt(inputEl.value);
    window._playerHoleScores = window._playerHoleScores || {};
    window._playerHoleScores[outId] = window._playerHoleScores[outId] || {};

    const card = document.getElementById(`caddie-card-${outId}-h${holeNum}`);
    if (!isNaN(v) && v > 0) {
        window._playerHoleScores[outId][`h${holeNum}`] = v;
        if (card) {
            card.className = "flex flex-col items-center justify-between p-2 rounded-2xl border transition-all bg-emerald-500/20 border-emerald-500/60 shadow-md shadow-emerald-500/10";
            inputEl.className = "w-full text-center py-2 sm:py-1.5 my-1 bg-emerald-950/90 border-2 border-emerald-500/60 text-emerald-300 rounded-xl font-black text-lg focus:outline-none focus:border-primary transition-all";
        }
    } else {
        window._playerHoleScores[outId][`h${holeNum}`] = '';
        if (card) {
            card.className = "flex flex-col items-center justify-between p-2 rounded-2xl border transition-all bg-slate-900/90 border-slate-800/90 hover:border-slate-700";
            inputEl.className = "w-full text-center py-2 sm:py-1.5 my-1 bg-slate-950 border-2 border-slate-700/80 text-white rounded-xl font-black text-lg focus:outline-none focus:border-primary transition-all";
        }
    }
    window.recalcPlayerScorecardTotals(outId);
};

window.recalcPlayerScorecardTotals = function(outId) {
    const scores = window._playerHoleScores?.[outId] || {};
    let inSum = 0;
    for (let i = 1; i <= 9; i++) {
        const v = parseInt(scores[`h${i}`]);
        if (!isNaN(v) && v > 0) inSum += v;
    }
    let outSum = 0;
    for (let i = 10; i <= 18; i++) {
        const v = parseInt(scores[`h${i}`]);
        if (!isNaN(v) && v > 0) outSum += v;
    }
    const gross = inSum + outSum;

    const elIn = document.getElementById(`caddie-in-${outId}`);
    const elOut = document.getElementById(`caddie-out-${outId}`);
    const elGross = document.getElementById(`caddie-gross-${outId}`);
    const elNet = document.getElementById(`caddie-net-${outId}`);

    if (elIn) elIn.textContent = inSum;
    if (elOut) elOut.textContent = outSum;
    if (elGross) elGross.textContent = gross;
    if (elNet) {
        const hcp = parseFloat(elNet.getAttribute('data-hcp') || 0);
        elNet.textContent = gross > 0 ? Math.max(0, Math.round(gross - hcp)) : 0;
    }
};

window.fillPlayerPar = function(outId) {
    window._playerHoleScores = window._playerHoleScores || {};
    window._playerHoleScores[outId] = {};
    CLUB_COLIMA_HOLES.forEach(h => {
        window._playerHoleScores[outId][`h${h.hole}`] = h.par;
        const inputEl = document.getElementById(`caddie-score-${outId}-h${h.hole}`);
        const card = document.getElementById(`caddie-card-${outId}-h${h.hole}`);
        if (inputEl) {
            inputEl.value = h.par;
            inputEl.className = "w-full text-center py-2 sm:py-1.5 my-1 bg-emerald-950/90 border-2 border-emerald-500/60 text-emerald-300 rounded-xl font-black text-lg focus:outline-none focus:border-primary transition-all";
        }
        if (card) {
            card.className = "flex flex-col items-center justify-between p-2 rounded-2xl border transition-all bg-emerald-500/20 border-emerald-500/60 shadow-md shadow-emerald-500/10";
        }
    });
    window.recalcPlayerScorecardTotals(outId);
};

window.clearPlayerScorecard = function(outId) {
    window._playerHoleScores = window._playerHoleScores || {};
    window._playerHoleScores[outId] = {};
    CLUB_COLIMA_HOLES.forEach(h => {
        const inputEl = document.getElementById(`caddie-score-${outId}-h${h.hole}`);
        const card = document.getElementById(`caddie-card-${outId}-h${h.hole}`);
        if (inputEl) {
            inputEl.value = '';
            inputEl.className = "w-full text-center py-2 sm:py-1.5 my-1 bg-slate-950 border-2 border-slate-700/80 text-white rounded-xl font-black text-lg focus:outline-none focus:border-primary transition-all";
        }
        if (card) {
            card.className = "flex flex-col items-center justify-between p-2 rounded-2xl border transition-all bg-slate-900/90 border-slate-800/90 hover:border-slate-700";
        }
    });
    window.recalcPlayerScorecardTotals(outId);
};

window.savePlayerDetailedScorecard = async function(teeTimeId, playerName, memberId, outId) {
    const booking = todayTeeTimes.find(t => String(t.id) === String(teeTimeId));
    if (!booking) return;

    const pName = playerName || booking.contact_name;
    let output = todayOutputs.find(o => 
        (o.tee_time_id === booking.id || o.folio === booking.folio) && 
        (o.member_name === pName || (!playerName && o.member_name === booking.contact_name))
    );

    const scores = window._playerHoleScores?.[outId] || {};
    let gross = 0;
    for (let i = 1; i <= 18; i++) {
        const v = parseInt(scores[`h${i}`]);
        if (!isNaN(v) && v > 0) gross += v;
    }

    if (gross === 0) {
        window.showNotification?.('Score Vacío', 'Por favor ingresa los golpes de los hoyos o presiona "Llenar Par".', 'error');
        return;
    }

    try {
        if (!output || String(output.id).startsWith('tmp_')) {
            const outPayload = {
                tee_time_id: booking.id,
                folio: booking.folio,
                member_id: memberId || null,
                member_number: memberId ? 'SOC' : 'INV',
                member_name: pName,
                player_type: memberId ? 'MEMBER' : 'GUEST',
                starting_hole: booking.starting_hole || 1,
                caddie_name: booking.caddie_assigned || '',
                cart_number: booking.cart_numbers || '',
                score_status: 'CAPTURED',
                gross_score: gross,
                hole_scores: scores
            };
            try {
                const { data } = await dbColima.from('daily_outputs').insert([outPayload]).select().single();
                output = data;
            } catch (e) {
                try {
                    const { data } = await dbStarter.from('daily_outputs').insert([outPayload]).select().single();
                    output = data;
                } catch (e2) {}
            }
        } else {
            try {
                await dbColima.from('daily_outputs').update({
                    score_status: 'CAPTURED',
                    gross_score: gross,
                    hole_scores: scores
                }).eq('id', output.id);
            } catch (e) {
                await dbStarter.from('daily_outputs').update({
                    score_status: 'CAPTURED',
                    gross_score: gross,
                    hole_scores: scores
                }).eq('id', output.id);
            }
        }

        const effectiveMemberId = memberId || (output && output.member_id);
        if (effectiveMemberId && effectiveMemberId !== 'null' && effectiveMemberId !== 'undefined' && effectiveMemberId !== '') {
            const diff = parseFloat((((gross - COURSE_RATING) * 113) / COURSE_SLOPE).toFixed(1));

            const scorePayload = {
                member_id: effectiveMemberId,
                output_id: output ? output.id : null,
                date_played: selectedCaddieDate || getLocalDateString(),
                gross_score: gross,
                course_rating: COURSE_RATING,
                slope_rating: COURSE_SLOPE,
                differential: diff,
                hole_scores: scores,
                delivered: true,
                course_name: 'CLUB DE GOLF COLIMA',
                notes: `Scorecard 18 Hoyos Caddie Master (Gross: ${gross})`
            };

            try {
                await dbColima.from('member_scores').insert([scorePayload]);
            } catch (e) {
                await dbStarter.from('member_scores').insert([scorePayload]);
            }

            await recalculateMemberHandicap(effectiveMemberId);
        }

        window.showNotification?.('¡Scorecard Guardado!', `Scorecard de 18 hoyos (Gross: ${gross}) guardado para ${pName}.`, 'success');
        await loadCaddieData();

    } catch (err) {
        console.error('Error saving player scorecard:', err);
        window.showNotification?.('Error', 'No se pudo guardar el scorecard: ' + err.message, 'error');
    }
};

window.closeCaddieModal = function() {
    const modal = document.getElementById('modal-member-crud');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        modal.innerHTML = '';
    }
};

// ============================================================================
// MODAL: CAPTURA DE SCORECARD (18 HOYOS Y 9 HOYOS CON VIGENCIA DE 6 DÍAS)
// ============================================================================

window.setCaddieScoreMode = function(mode, outputId, forceResetPending = false) {
    window._caddieScoreMode = mode;
    if (forceResetPending) {
        window._caddiePendingRecord = null;
        window._completingPendingRecord = null;
    }
    window.openScoreCaptureModal(outputId);
};

window.setCaddieNineRound = function(roundType, outputId) {
    window._caddieNineHolesRound = roundType;
    window.openScoreCaptureModal(outputId);
};

window.openScoreCaptureModal = function(outputId, fallbackOutput = null) {
    let output = todayOutputs.find(o => String(o.id) === String(outputId)) || fallbackOutput;
    if (!output) {
        output = {
            id: outputId,
            member_name: 'Jugador',
            member_number: 'INV',
            player_type: 'GUEST',
            starting_hole: 1,
            score_status: 'PENDING',
            hole_scores: {}
        };
    }

    const member = allMembers.find(m => String(m.id) === String(output.member_id));
    const handicap = member ? (member.current_handicap || 0) : 0;

    // Detectar si el jugador tiene una tarjeta pendiente de 9 hoyos vigente
    const matchingPending = window._completingPendingRecord || (window._caddiePendingRecord !== undefined ? window._caddiePendingRecord : pendingNineHoles.find(p => 
        (p.status === 'PENDING') && (
            (output.member_id && String(p.member_id) === String(output.member_id)) ||
            ((p.member_name || '').trim().toLowerCase() === (output.member_name || '').trim().toLowerCase())
        )
    ));

    // Determinar modo de captura
    if (matchingPending) {
        window._caddieScoreMode = 'COMPLETING_18';
        window._caddiePendingRecord = matchingPending;
    } else if (!window._caddieScoreMode || window._caddieScoreMode === 'COMPLETING_18') {
        window._caddieScoreMode = '18_HOLES';
        window._caddiePendingRecord = null;
    }

    if (!window._caddieNineHolesRound) {
        window._caddieNineHolesRound = (output.starting_hole && parseInt(output.starting_hole) >= 10) ? 'BACK_9' : 'FRONT_9';
    }

    let modal = document.getElementById('modal-member-crud');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-member-crud';
        document.body.appendChild(modal);
    }
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in';
    modal.style.display = 'flex';
    modal.classList.remove('hidden');
    modal.onclick = (e) => {
        if (e.target === modal) window.closeCaddieModal();
    };

    // Inicializar scores
    window._caddieHoleScores = {};
    CLUB_COLIMA_HOLES.forEach(h => {
        if (matchingPending && matchingPending.hole_scores && matchingPending.hole_scores[`h${h.hole}`] !== undefined && matchingPending.hole_scores[`h${h.hole}`] !== '') {
            window._caddieHoleScores[`h${h.hole}`] = matchingPending.hole_scores[`h${h.hole}`];
        } else {
            window._caddieHoleScores[`h${h.hole}`] = (output.hole_scores && output.hole_scores[`h${h.hole}`]) || '';
        }
    });

    const is9Holes = window._caddieScoreMode === '9_HOLES';
    const isCompleting = window._caddieScoreMode === 'COMPLETING_18';
    const inHoles = CLUB_COLIMA_HOLES.slice(0, 9);
    const outHoles = CLUB_COLIMA_HOLES.slice(9, 18);

    modal.innerHTML = `
        <div class="w-full max-w-4xl bg-slate-950/95 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]" onclick="event.stopPropagation()">
            <!-- Header -->
            <div class="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                <div class="flex items-center gap-3">
                    <div class="w-11 h-11 rounded-2xl ${is9Holes ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'} border flex items-center justify-center shrink-0">
                        <span class="material-icons">${is9Holes ? 'timer' : (isCompleting ? 'workspace_premium' : 'edit_note')}</span>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h3 class="font-black uppercase text-white text-lg leading-none">${output.member_name}</h3>
                            <span class="px-2.5 py-0.5 bg-slate-800 text-slate-300 font-black text-[10px] rounded-md border border-slate-700">#${output.member_number || 'INV'}</span>
                        </div>
                        <p class="text-xs text-slate-400 font-bold uppercase mt-1">Handicap Index: <span class="text-amber-400 font-black">${handicap}</span> · Campo: Club de Golf Colima</p>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <!-- Totals Bar -->
                    <div class="flex items-center gap-2 bg-slate-900 p-1.5 border border-slate-800 rounded-2xl">
                        <div class="px-3 py-1.5 bg-slate-800 rounded-xl text-center">
                            <p class="text-[8px] font-black text-slate-400 uppercase tracking-wider">IN (1-9)</p>
                            <p id="caddie-sc-in" class="text-sm font-black text-white">0</p>
                        </div>
                        <div class="px-3 py-1.5 bg-slate-800 rounded-xl text-center">
                            <p class="text-[8px] font-black text-slate-400 uppercase tracking-wider">OUT (10-18)</p>
                            <p id="caddie-sc-out" class="text-sm font-black text-white">0</p>
                        </div>
                        <div class="px-4 py-1.5 ${is9Holes ? 'bg-amber-500/20 border-amber-500/40' : 'bg-emerald-500/20 border-emerald-500/40'} border rounded-xl text-center">
                            <p id="caddie-sc-gross-label" class="text-[8px] font-black ${is9Holes ? 'text-amber-400' : 'text-emerald-400'} uppercase tracking-wider">
                                ${is9Holes ? 'GROSS 9 HOYOS' : 'GROSS TOTAL'}
                            </p>
                            <p id="caddie-sc-gross" class="text-xl font-black ${is9Holes ? 'text-amber-400' : 'text-emerald-400'} leading-none">0</p>
                        </div>
                    </div>

                    <button type="button" onclick="window.closeCaddieModal()" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all" title="Cerrar">
                        <span class="material-icons" style="font-size:18px">close</span>
                    </button>
                </div>
            </div>

            <!-- Body Scorecard -->
            <div class="p-6 overflow-y-auto custom-scrollbar space-y-5 flex-1">
                ${isCompleting ? `
                    <!-- Banner de Tarjeta Incompleta Encontrada -->
                    <div class="bg-blue-500/15 border-2 border-blue-500/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                        <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                <span class="px-2.5 py-0.5 bg-blue-500 text-slate-950 rounded-md text-[10px] font-black uppercase tracking-wider">
                                    ⛳ Completando 18 Hoyos
                                </span>
                                <span class="text-[10px] text-blue-300 font-bold uppercase">
                                    Vigente hasta ${matchingPending.expires_at}
                                </span>
                            </div>
                            <p class="text-xs font-bold text-white">
                                Este jugador jugó ${matchingPending.round_type === 'FRONT_9' ? '1ra Vuelta (Hoyos 1 al 9 · Marcas Blancas)' : '2da Vuelta (Hoyos 10 al 18 · Marcas Azules)'} el día <strong>${matchingPending.played_date}</strong> con <strong>${matchingPending.partial_gross} golpes</strong>.
                            </p>
                            <p class="text-[11px] text-slate-400 font-medium">
                                Los 9 hoyos jugados están cargados y bloqueados. Ahora captura la vuelta restante para consolidar los 18 hoyos y enviarlos a Handicap Index WHS.
                            </p>
                        </div>
                        <button type="button" onclick="window.setCaddieScoreMode('18_HOLES', '${output.id}', true)"
                            class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-[10px] font-black uppercase shrink-0 transition-all">
                            Capturar 18 Nuevos
                        </button>
                    </div>
                ` : `
                    <!-- Selector de Modalidad: 18 Hoyos vs 9 Hoyos -->
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3 px-4">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-xs font-black text-slate-400 uppercase tracking-wider">Modalidad:</span>
                            <div class="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                                <button type="button" onclick="window.setCaddieScoreMode('18_HOLES', '${output.id}')"
                                    class="px-3.5 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 ${!is9Holes ? 'bg-primary text-slate-950 shadow-md shadow-primary/20' : 'text-slate-400 hover:text-white'}">
                                    <span class="material-icons text-sm">flag</span> 18 Hoyos Completo
                                </button>
                                <button type="button" onclick="window.setCaddieScoreMode('9_HOLES', '${output.id}')"
                                    class="px-3.5 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 ${is9Holes ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-white'}">
                                    <span class="material-icons text-sm">timer</span> 9 Hoyos (Media Ronda)
                                </button>
                            </div>
                        </div>

                        ${is9Holes ? `
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Vuelta jugada hoy:</span>
                                <div class="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                                    <button type="button" onclick="window.setCaddieNineRound('FRONT_9', '${output.id}')"
                                        class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${window._caddieNineHolesRound === 'FRONT_9' ? 'bg-slate-200 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}">
                                        ⚪ 1ra Vuelta (1-9 · Blancas)
                                    </button>
                                    <button type="button" onclick="window.setCaddieNineRound('BACK_9', '${output.id}')"
                                        class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${window._caddieNineHolesRound === 'BACK_9' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}">
                                        🔵 2da Vuelta (10-18 · Azules)
                                    </button>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `}

                <!-- Presets Rápidos -->
                <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3 px-4">
                    <span class="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <span class="material-icons text-primary text-sm">tune</span> Presets Rápidos
                    </span>
                    <div class="flex items-center gap-2">
                        <button type="button" onclick="window.caddieFillPar()" class="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 rounded-xl font-black text-[10px] uppercase transition-all">
                            ⚡ Auto-llenar Par ${is9Holes ? '(Par 34)' : `(${COURSE_PAR})`}
                        </button>
                        <button type="button" onclick="window.caddieClearScores()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl font-black text-[10px] uppercase transition-all">
                            Limpiar
                        </button>
                    </div>
                </div>

                <!-- VUELTA 1-9 (IN) - Marcas Blancas -->
                <div class="bg-slate-900 border ${is9Holes && window._caddieNineHolesRound === 'FRONT_9' ? 'border-amber-500/50 shadow-lg shadow-amber-950/20' : 'border-slate-800'} rounded-2xl p-4 space-y-3 transition-all">
                    <div class="flex items-center justify-between text-xs font-black uppercase tracking-widest border-b border-slate-800 pb-2">
                        <span class="flex items-center gap-2 ${is9Holes && window._caddieNineHolesRound !== 'FRONT_9' ? 'text-slate-500' : 'text-slate-200'}">
                            <span class="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-400"></span>
                            VUELTA 1-9 (IN) · TEES BLANCAS
                            ${isCompleting && matchingPending.round_type === 'FRONT_9' ? '<span class="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[9px] font-black border border-blue-500/30">JUGADO PREVIAMENTE</span>' : ''}
                        </span>
                        <span class="text-[10px] ${is9Holes && window._caddieNineHolesRound !== 'FRONT_9' ? 'text-slate-600' : 'text-slate-400'}">PAR 34</span>
                    </div>
                    <div class="grid grid-cols-9 gap-2">
                        ${inHoles.map(h => renderCaddieHoleCard(h)).join('')}
                    </div>
                </div>

                <!-- VUELTA 10-18 (OUT) - Marcas Azules -->
                <div class="bg-slate-900 border ${is9Holes && window._caddieNineHolesRound === 'BACK_9' ? 'border-amber-500/50 shadow-lg shadow-amber-950/20' : 'border-slate-800'} rounded-2xl p-4 space-y-3 transition-all">
                    <div class="flex items-center justify-between text-xs font-black uppercase tracking-widest border-b border-slate-800 pb-2">
                        <span class="flex items-center gap-2 ${is9Holes && window._caddieNineHolesRound !== 'BACK_9' ? 'text-slate-500' : 'text-slate-200'}">
                            <span class="w-2.5 h-2.5 rounded-full bg-blue-500 border border-blue-400"></span>
                            VUELTA 10-18 (OUT) · TEES AZULES
                            ${isCompleting && matchingPending.round_type === 'BACK_9' ? '<span class="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[9px] font-black border border-blue-500/30">JUGADO PREVIAMENTE</span>' : ''}
                        </span>
                        <span class="text-[10px] ${is9Holes && window._caddieNineHolesRound !== 'BACK_9' ? 'text-slate-600' : 'text-slate-400'}">PAR 34</span>
                    </div>
                    <div class="grid grid-cols-9 gap-2">
                        ${outHoles.map(h => renderCaddieHoleCard(h)).join('')}
                    </div>
                </div>

                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Notas del Caddie Master</label>
                    <input id="score-modal-notes" type="text" placeholder="${is9Holes ? 'Ej. Jugó solo 9 hoyos por lluvia / tiempo' : 'Ej. Tarjeta entregada en caseta'}" class="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-primary">
                </div>
            </div>

            <!-- Footer -->
            <div class="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3">
                <button type="button" onclick="window.setNoScorePar('${output.id}'); window.closeCaddieModal();"
                    class="px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 transition-all">
                    <span class="material-icons" style="font-size:16px">block</span> No Entregó Tarjeta (Par ${COURSE_PAR})
                </button>
                <div class="flex gap-2">
                    <button type="button" onclick="window.closeCaddieModal()" class="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-xs uppercase transition-all">Cancelar</button>
                    <button type="button" onclick="window.saveCaddieScorecard('${output.id}', '${output.member_id || ''}', '${output.member_name.replace(/'/g, "\\'")}')"
                        class="px-7 py-3 ${is9Holes ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'} rounded-xl font-black text-xs uppercase transition-all shadow-lg flex items-center gap-1.5 active:scale-95">
                        <span class="material-icons" style="font-size:16px">${is9Holes ? 'timer' : (isCompleting ? 'workspace_premium' : 'save')}</span>
                        ${is9Holes ? 'Guardar 9 Hoyos (Pendiente 6 Días)' : (isCompleting ? 'Completar 18 Hoyos (Enviar a Handicap)' : 'Guardar Scorecard')}
                    </button>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    window.recalcCaddieScorecardTotals();

    // Focus appropriate first hole
    setTimeout(() => {
        let firstHoleToFocus = 1;
        if (is9Holes && window._caddieNineHolesRound === 'BACK_9') {
            firstHoleToFocus = 10;
        } else if (isCompleting && matchingPending) {
            firstHoleToFocus = matchingPending.round_type === 'FRONT_9' ? 10 : 1;
        }
        document.getElementById(`caddie-score-h${firstHoleToFocus}`)?.focus();
    }, 100);
};

function renderCaddieHoleCard(h) {
    const val = window._caddieHoleScores?.[`h${h.hole}`] ?? '';
    const hasVal = val !== '' && !isNaN(val) && parseInt(val) > 0;
    const is9Holes = window._caddieScoreMode === '9_HOLES';
    const isCompleting = window._caddieScoreMode === 'COMPLETING_18';
    const pending = window._caddiePendingRecord;

    // Check if hole is disabled/dimmed (in 9-hole mode)
    let isDisabled = false;
    let isLocked = false;

    if (is9Holes) {
        if (window._caddieNineHolesRound === 'FRONT_9' && h.hole > 9) isDisabled = true;
        if (window._caddieNineHolesRound === 'BACK_9' && h.hole <= 9) isDisabled = true;
    } else if (isCompleting && pending) {
        if (pending.round_type === 'FRONT_9' && h.hole <= 9) isLocked = true;
        if (pending.round_type === 'BACK_9' && h.hole > 9) isLocked = true;
    }

    if (isDisabled) {
        return `
        <div id="caddie-hole-card-${h.hole}"
            class="flex flex-col items-center justify-between p-2 rounded-2xl border border-slate-800 bg-slate-950/40 opacity-30 select-none">
            <div class="text-center">
                <p class="text-[10px] font-black text-slate-500">#${h.hole}</p>
                <p class="text-[8px] font-bold text-slate-600 uppercase">PAR ${h.par}</p>
            </div>
            <div class="w-full text-center py-2 my-1 bg-slate-900/50 border border-slate-800 rounded-xl font-black text-sm text-slate-600">
                —
            </div>
            <div class="text-[7px] font-bold uppercase text-slate-600">
                2da Fecha
            </div>
        </div>`;
    }

    if (isLocked) {
        return `
        <div id="caddie-hole-card-${h.hole}"
            class="flex flex-col items-center justify-between p-2 rounded-2xl border border-blue-500/40 bg-blue-950/20 shadow-sm shadow-blue-500/5">
            <div class="text-center">
                <p class="text-[10px] font-black text-blue-300">#${h.hole}</p>
                <p class="text-[8px] font-bold text-slate-400 uppercase">PAR ${h.par}</p>
            </div>
            <input id="caddie-score-h${h.hole}" type="text" readonly value="${val}"
                class="w-full text-center py-2 my-1 bg-blue-900/40 border border-blue-500/50 text-blue-200 rounded-xl font-black text-base cursor-not-allowed select-none">
            <div class="text-[7px] font-black uppercase text-blue-300 tracking-wider">
                ✓ Jugado
            </div>
        </div>`;
    }

    return `
    <div id="caddie-hole-card-${h.hole}"
        class="flex flex-col items-center justify-between p-2 rounded-2xl border transition-all ${hasVal ? 'bg-emerald-500/20 border-emerald-500/50 shadow-md shadow-emerald-500/10' : 'bg-slate-800 border-slate-700'}">
        <div class="text-center">
            <p class="text-[10px] font-black text-slate-300">#${h.hole}</p>
            <p class="text-[8px] font-bold text-slate-500 uppercase">PAR ${h.par}</p>
        </div>
        <input id="caddie-score-h${h.hole}" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" value="${val}" placeholder="" autocomplete="off"
            oninput="window.onCaddieHoleInput(${h.hole}, this)"
            onkeydown="window.onCaddieHoleKeyDown(event, ${h.hole})"
            onfocus="this.select()"
            class="w-full text-center py-2 my-1 bg-slate-900 border ${hasVal ? 'border-emerald-500/60 text-emerald-300' : 'border-slate-700 text-white'} rounded-xl font-black text-base focus:outline-none focus:border-primary transition-all">
        <div class="text-[8px] font-black uppercase text-amber-400 tracking-wider">
            IDX ${h.idx}
        </div>
    </div>`;
}

window.onCaddieHoleKeyDown = function(event, hole) {
    const is9Holes = window._caddieScoreMode === '9_HOLES';
    const isCompleting = window._caddieScoreMode === 'COMPLETING_18';
    const pending = window._caddiePendingRecord;

    const findNextHole = (current, forward) => {
        let h = current + (forward ? 1 : -1);
        while (h >= 1 && h <= 18) {
            let isSkipped = false;
            if (is9Holes) {
                if (window._caddieNineHolesRound === 'FRONT_9' && h > 9) isSkipped = true;
                if (window._caddieNineHolesRound === 'BACK_9' && h <= 9) isSkipped = true;
            } else if (isCompleting && pending) {
                if (pending.round_type === 'FRONT_9' && h <= 9) isSkipped = true;
                if (pending.round_type === 'BACK_9' && h > 9) isSkipped = true;
            }
            if (!isSkipped) return h;
            h += forward ? 1 : -1;
        }
        return null;
    };

    if (event.key === 'Enter' || event.key === 'ArrowRight') {
        event.preventDefault();
        const nextH = findNextHole(hole, true);
        if (nextH) {
            const nextInput = document.getElementById(`caddie-score-h${nextH}`);
            if (nextInput) { nextInput.focus(); nextInput.select(); }
        }
    } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        const prevH = findNextHole(hole, false);
        if (prevH) {
            const prevInput = document.getElementById(`caddie-score-h${prevH}`);
            if (prevInput) { prevInput.focus(); prevInput.select(); }
        }
    } else if (event.key === 'Backspace' && (!event.target.value || event.target.value === '')) {
        const prevH = findNextHole(hole, false);
        if (prevH) {
            const prevInput = document.getElementById(`caddie-score-h${prevH}`);
            if (prevInput) { prevInput.focus(); prevInput.select(); }
        }
    }
};

window.onCaddieHoleInput = function(hole, inputEl) {
    const raw = inputEl.value.replace(/[^0-9]/g, '');
    inputEl.value = raw;
    const v = parseInt(raw);
    const card = document.getElementById(`caddie-hole-card-${hole}`);

    if (!isNaN(v) && v > 0) {
        window._caddieHoleScores[`h${hole}`] = v;
        if (card) card.className = "flex flex-col items-center justify-between p-2 rounded-2xl border transition-all bg-emerald-500/20 border-emerald-500/50 shadow-md shadow-emerald-500/10";
        inputEl.className = "w-full text-center py-2 my-1 bg-slate-900 border border-emerald-500/60 text-emerald-300 rounded-xl font-black text-base focus:outline-none focus:border-primary transition-all";

        // Auto-brinco a la siguiente casilla de hoyo editable
        const is9Holes = window._caddieScoreMode === '9_HOLES';
        const isCompleting = window._caddieScoreMode === 'COMPLETING_18';
        const pending = window._caddiePendingRecord;

        let nextH = hole + 1;
        while (nextH <= 18) {
            let isSkipped = false;
            if (is9Holes) {
                if (window._caddieNineHolesRound === 'FRONT_9' && nextH > 9) isSkipped = true;
                if (window._caddieNineHolesRound === 'BACK_9' && nextH <= 9) isSkipped = true;
            } else if (isCompleting && pending) {
                if (pending.round_type === 'FRONT_9' && nextH <= 9) isSkipped = true;
                if (pending.round_type === 'BACK_9' && nextH > 9) isSkipped = true;
            }
            if (!isSkipped) break;
            nextH++;
        }

        if (nextH <= 18) {
            setTimeout(() => {
                const nextInput = document.getElementById(`caddie-score-h${nextH}`);
                if (nextInput) {
                    nextInput.focus();
                    nextInput.select();
                }
            }, 10);
        }
    } else {
        window._caddieHoleScores[`h${hole}`] = '';
        if (card) card.className = "flex flex-col items-center justify-between p-2 rounded-2xl border transition-all bg-slate-800 border-slate-700";
        inputEl.className = "w-full text-center py-2 my-1 bg-slate-900 border border-slate-700 text-white rounded-xl font-black text-base focus:outline-none focus:border-primary transition-all";
    }
    window.recalcCaddieScorecardTotals();
};

window.caddieFillPar = function() {
    const is9Holes = window._caddieScoreMode === '9_HOLES';
    const isCompleting = window._caddieScoreMode === 'COMPLETING_18';
    const pending = window._caddiePendingRecord;

    CLUB_COLIMA_HOLES.forEach(h => {
        let shouldFill = true;
        if (is9Holes) {
            if (window._caddieNineHolesRound === 'FRONT_9' && h.hole > 9) shouldFill = false;
            if (window._caddieNineHolesRound === 'BACK_9' && h.hole <= 9) shouldFill = false;
        } else if (isCompleting && pending) {
            if (pending.round_type === 'FRONT_9' && h.hole <= 9) shouldFill = false;
            if (pending.round_type === 'BACK_9' && h.hole > 9) shouldFill = false;
        }

        if (shouldFill) {
            window._caddieHoleScores[`h${h.hole}`] = h.par;
            const el = document.getElementById(`caddie-score-h${h.hole}`);
            const card = document.getElementById(`caddie-hole-card-${h.hole}`);
            if (el) {
                el.value = h.par;
                el.className = "w-full text-center py-2 my-1 bg-slate-900 border border-emerald-500/60 text-emerald-300 rounded-xl font-black text-base focus:outline-none focus:border-primary transition-all";
            }
            if (card) card.className = "flex flex-col items-center justify-between p-2 rounded-2xl border transition-all bg-emerald-500/20 border-emerald-500/50 shadow-md shadow-emerald-500/10";
        }
    });
    window.recalcCaddieScorecardTotals();
};

window.caddieClearScores = function() {
    const is9Holes = window._caddieScoreMode === '9_HOLES';
    const isCompleting = window._caddieScoreMode === 'COMPLETING_18';
    const pending = window._caddiePendingRecord;

    CLUB_COLIMA_HOLES.forEach(h => {
        let shouldClear = true;
        if (isCompleting && pending) {
            if (pending.round_type === 'FRONT_9' && h.hole <= 9) shouldClear = false;
            if (pending.round_type === 'BACK_9' && h.hole > 9) shouldClear = false;
        }

        if (shouldClear) {
            window._caddieHoleScores[`h${h.hole}`] = '';
            const el = document.getElementById(`caddie-score-h${h.hole}`);
            const card = document.getElementById(`caddie-hole-card-${h.hole}`);
            if (el) {
                el.value = '';
                el.className = "w-full text-center py-2 my-1 bg-slate-900 border border-slate-700 text-white rounded-xl font-black text-base focus:outline-none focus:border-primary transition-all";
            }
            if (card) card.className = "flex flex-col items-center justify-between p-2 rounded-2xl border transition-all bg-slate-800 border-slate-700";
        }
    });
    window.recalcCaddieScorecardTotals();
};

window.recalcCaddieScorecardTotals = function() {
    const scores = window._caddieHoleScores || {};
    const is9Holes = window._caddieScoreMode === '9_HOLES';

    let inSum = 0;
    for (let i = 1; i <= 9; i++) {
        const v = parseInt(scores[`h${i}`]);
        if (!isNaN(v) && v > 0) inSum += v;
    }

    let outSum = 0;
    for (let i = 10; i <= 18; i++) {
        const v = parseInt(scores[`h${i}`]);
        if (!isNaN(v) && v > 0) outSum += v;
    }

    const gross = is9Holes
        ? (window._caddieNineHolesRound === 'FRONT_9' ? inSum : outSum)
        : (inSum + outSum);

    const elIn = document.getElementById('caddie-sc-in');
    const elOut = document.getElementById('caddie-sc-out');
    const elGross = document.getElementById('caddie-sc-gross');
    const elGrossLabel = document.getElementById('caddie-sc-gross-label');

    if (elIn) elIn.textContent = inSum;
    if (elOut) elOut.textContent = outSum;
    if (elGross) elGross.textContent = gross;
    if (elGrossLabel) elGrossLabel.textContent = is9Holes ? 'GROSS 9 HOYOS' : 'GROSS TOTAL';
};

window.saveCaddieScorecard = async function(outputId, memberId, memberName) {
    const scores = window._caddieHoleScores || {};
    const is9Holes = window._caddieScoreMode === '9_HOLES';
    const isCompleting = window._caddieScoreMode === 'COMPLETING_18';
    const pendingRecord = window._caddiePendingRecord;

    let output = todayOutputs.find(o => String(o.id) === String(outputId));
    const effectiveMemberId = (memberId && memberId !== 'null' && memberId !== 'undefined' && memberId !== '') ? memberId : (output ? output.member_id : null);
    const effectiveName = memberName || (output ? output.member_name : 'Jugador');
    const memberObj = allMembers.find(m => String(m.id) === String(effectiveMemberId));
    const effectiveMemberNumber = output?.member_number || (memberObj ? memberObj.member_number : 'INV');
    const notes = document.getElementById('score-modal-notes')?.value.trim() || '';

    // ========================================================================
    // CASO A: GUARDAR 9 HOYOS (MEDIA RONDA CON VIGENCIA DE 6 DÍAS)
    // ========================================================================
    if (is9Holes) {
        const roundType = window._caddieNineHolesRound || 'FRONT_9';
        const startH = roundType === 'FRONT_9' ? 1 : 10;
        const endH = roundType === 'FRONT_9' ? 9 : 18;

        let partialGross = 0;
        let holesFilled = 0;
        for (let i = startH; i <= endH; i++) {
            const v = parseInt(scores[`h${i}`]);
            if (!isNaN(v) && v > 0) {
                partialGross += v;
                holesFilled++;
            }
        }

        if (partialGross === 0 || holesFilled === 0) {
            window.showNotification?.('Ingresa Scores', 'Por favor ingresa los golpes de la vuelta de 9 hoyos.', 'error');
            return;
        }

        const playedDate = selectedCaddieDate || getLocalDateString();
        const [py, pm, pd] = playedDate.split('-').map(Number);
        const expObj = new Date(py, pm - 1, pd + 6);
        const expDate = `${expObj.getFullYear()}-${String(expObj.getMonth() + 1).padStart(2, '0')}-${String(expObj.getDate()).padStart(2, '0')}`;

        const p9Payload = {
            member_id: effectiveMemberId,
            member_number: effectiveMemberNumber,
            member_name: effectiveName,
            player_type: effectiveMemberId ? 'MEMBER' : 'GUEST',
            tee_time_id: output?.tee_time_id || null,
            folio: output?.folio || null,
            round_type: roundType,
            starting_hole: startH,
            played_date: playedDate,
            expires_at: expDate,
            status: 'PENDING',
            hole_scores: scores,
            partial_gross: partialGross,
            caddie_name: output?.caddie_name || '',
            notes: notes || `Media ronda 9 hoyos (${roundType === 'FRONT_9' ? '1-9 Blancas' : '10-18 Azules'})`
        };

        try {
            const { data, error } = await dbColima.from('pending_nine_holes').insert([p9Payload]).select().single();
            if (!error && data) {
                pendingNineHoles.unshift(data);
            } else {
                p9Payload.id = 'p9_' + Date.now();
                pendingNineHoles.unshift(p9Payload);
            }
        } catch (e) {
            p9Payload.id = 'p9_' + Date.now();
            pendingNineHoles.unshift(p9Payload);
        }

        try {
            localStorage.setItem('cgc_pending_nine_holes', JSON.stringify(pendingNineHoles));
            localStorage.setItem('cgc_pending_nine_holes_sync', String(Date.now()));
        } catch(e) {}

        // Actualizar daily_outputs a PARTIAL_9
        const outStatus = 'PARTIAL_9';
        if (output && output.id && !String(output.id).startsWith('tmp_')) {
            try {
                await dbColima.from('daily_outputs').update({
                    score_status: outStatus,
                    gross_score: partialGross,
                    hole_scores: scores
                }).eq('id', output.id);
            } catch (e) {
                try {
                    await dbStarter.from('daily_outputs').update({
                        score_status: outStatus,
                        gross_score: partialGross,
                        hole_scores: scores
                    }).eq('id', output.id);
                } catch(e2) {}
            }
            output.score_status = outStatus;
            output.gross_score = partialGross;
            output.hole_scores = scores;
        }

        window.showNotification?.(
            '¡9 Hoyos Registrados!',
            `Tarjeta de 9 hoyos (${partialGross} golpes) guardada para ${effectiveName}. Tiene 6 días para completar los 18 hoyos.`,
            'success'
        );

        window.closeCaddieModal();
        await loadCaddieData();
        if (activeTab === 'ONCOURSE') window.renderOnCoursePlayersList();
        return;
    }

    // ========================================================================
    // CASO B & C: GUARDAR O COMPLETAR 18 HOYOS CONSOLIDADOS
    // ========================================================================
    let gross = 0;
    for (let i = 1; i <= 18; i++) {
        const v = parseInt(scores[`h${i}`]);
        if (!isNaN(v) && v > 0) gross += v;
    }

    if (gross === 0) {
        window.showNotification?.('Ingresa Scores', 'Por favor ingresa los golpes de los hoyos.', 'error');
        return;
    }

    // 1. Insert or Update daily_outputs
    if (String(outputId).startsWith('tmp_') || !output || !output.id || String(output.id).startsWith('tmp_')) {
        const outPayload = {
            tee_time_id: output ? output.tee_time_id : null,
            folio: output ? output.folio : null,
            member_id: effectiveMemberId,
            member_name: effectiveName,
            player_type: effectiveMemberId ? 'MEMBER' : 'GUEST',
            starting_hole: output ? (output.starting_hole || 1) : 1,
            caddie_name: output ? (output.caddie_name || '') : '',
            cart_number: output ? (output.cart_number || '') : '',
            score_status: 'CAPTURED',
            gross_score: gross,
            hole_scores: scores
        };

        try {
            const { data } = await dbColima.from('daily_outputs').insert([outPayload]).select().single();
            if (data && data.id) outputId = data.id;
        } catch (e) {
            try {
                const { data } = await dbStarter.from('daily_outputs').insert([outPayload]).select().single();
                if (data && data.id) outputId = data.id;
            } catch (e2) {}
        }
    } else {
        try {
            await dbColima.from('daily_outputs').update({
                score_status: 'CAPTURED',
                gross_score: gross,
                hole_scores: scores
            }).eq('id', outputId);
        } catch (e) {
            try {
                await dbStarter.from('daily_outputs').update({
                    score_status: 'CAPTURED',
                    gross_score: gross,
                    hole_scores: scores
                }).eq('id', outputId);
            } catch (e2) {}
        }
    }

    if (output) {
        output.score_status = 'CAPTURED';
        output.gross_score = gross;
        output.hole_scores = scores;
    }

    // Si había una tarjeta pendiente de 9 hoyos asociada, marcarla como COMPLETED
    if (pendingRecord || isCompleting) {
        const pId = pendingRecord?.id;
        if (pId) {
            try {
                await dbColima.from('pending_nine_holes').update({
                    status: 'COMPLETED',
                    completed_at: new Date().toISOString(),
                    completed_by: 'Caddie Master'
                }).eq('id', pId);
            } catch(e) {}

            const idx = pendingNineHoles.findIndex(p => String(p.id) === String(pId));
            if (idx >= 0) pendingNineHoles[idx].status = 'COMPLETED';
            try {
                localStorage.setItem('cgc_pending_nine_holes', JSON.stringify(pendingNineHoles));
                localStorage.setItem('cgc_pending_nine_holes_sync', String(Date.now()));
            } catch(e) {}
        }
    }

    // 2. Insert into member_scores si es socio para cálculo WHS
    if (effectiveMemberId) {
        const diff = parseFloat(((113 / COURSE_SLOPE) * (gross - COURSE_RATING)).toFixed(1));
        const scorePayload = {
            member_id: effectiveMemberId,
            output_id: (outputId && !String(outputId).startsWith('tmp_')) ? outputId : null,
            date_played: selectedCaddieDate || getLocalDateString(),
            gross_score: gross,
            course_rating: COURSE_RATING,
            slope_rating: COURSE_SLOPE,
            differential: diff,
            hole_scores: scores,
            delivered: true,
            notes: notes || (isCompleting ? 'Scorecard 18 Hoyos Consolidado (2 vueltas de 9 hoyos combinadas)' : 'Scorecard 18 Hoyos Caddie Master')
        };

        try {
            await dbColima.from('member_scores').insert([scorePayload]);
        } catch (e) {
            try {
                await dbStarter.from('member_scores').insert([scorePayload]);
            } catch (e2) {}
        }

        // 3. Recalculate WHS Handicap
        await recalculateMemberHandicap(effectiveMemberId);
    }

    window._completingPendingRecord = null;
    window._caddiePendingRecord = null;
    window._caddieScoreMode = '18_HOLES';

    const successMsg = isCompleting
        ? `¡Tarjeta de 18 hoyos consolidada y completada (Gross: ${gross})! Se envió al cálculo de Handicap Index.`
        : `Scorecard de 18 hoyos (Gross: ${gross}) guardado para ${effectiveName}.`;

    window.showNotification?.('¡Scorecard Guardado!', successMsg, 'success');
    window.closeCaddieModal();
    await loadCaddieData();
    if (activeTab === 'ONCOURSE') {
        window.renderOnCoursePlayersList();
    }
};

// USGA / WHS Handicap Index Recalculation Algorithm
async function recalculateMemberHandicap(memberId) {
    try {
        let scores = [];
        try {
            const { data } = await dbColima.from('member_scores')
                .select('*')
                .eq('member_id', memberId)
                .order('date_played', { ascending: false })
                .limit(20);
            scores = data || [];
        } catch (e) {
            const { data } = await dbStarter.from('member_scores')
                .select('*')
                .eq('member_id', memberId)
                .order('date_played', { ascending: false })
                .limit(20);
            scores = data || [];
        }

        if (!scores || scores.length === 0) return;

        const diffs = scores.map(s => parseFloat(s.differential) || 0.0).sort((a, b) => a - b);
        const count = diffs.length;

        let numToUse = 1;
        if (count >= 20) numToUse = 8;
        else if (count >= 19) numToUse = 7;
        else if (count >= 17) numToUse = 6;
        else if (count >= 15) numToUse = 5;
        else if (count >= 12) numToUse = 4;
        else if (count >= 9) numToUse = 3;
        else if (count >= 6) numToUse = 2;
        else numToUse = 1;

        const bestDiffs = diffs.slice(0, numToUse);
        const avgDiff = bestDiffs.reduce((sum, v) => sum + v, 0) / numToUse;
        const newHandicapIndex = parseFloat(avgDiff.toFixed(1));

        await dbColima.from('members').update({
            current_handicap: newHandicapIndex
        }).eq('id', memberId);

    } catch (err) {
        console.error('Error recalculating handicap:', err);
    }
}

// ============================================================================
// TEE DE PRÁCTICA & CUBETAS DE PELOTAS (CADDIE MASTER)
// ============================================================================

function renderDrivingRangeTab() {
    const container = document.getElementById('caddie-practica-container');
    const summaryBadge = document.getElementById('caddie-practica-summary');
    if (!container) return;

    if (summaryBadge) {
        let totalBuckets = 0;
        todayDrivingRange.forEach(s => { totalBuckets += parseInt(s.buckets_count || 0); });
        summaryBadge.textContent = `${todayDrivingRange.length} Registro(s) · ${totalBuckets} Cubetas (${totalBuckets * 100} Pelotas)`;
    }

    if (!todayDrivingRange || todayDrivingRange.length === 0) {
        container.innerHTML = `
            <div class="py-12 text-center bg-slate-950/40 border border-slate-800/80 rounded-3xl p-8">
                <div class="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-3">
                    <span class="material-icons text-3xl">sports_baseball</span>
                </div>
                <h4 class="text-white font-black text-sm uppercase">Sin Registros de Práctica Hoy</h4>
                <p class="text-xs text-slate-400 font-bold mt-1">Los cobros de cubetas y tee de práctica registrados en Recepción aparecerán aquí para entrega.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="space-y-3">
            ${todayDrivingRange.map(s => {
                const isDelivered = !!s.balls_delivered;
                const timeStr = s.created_at ? new Date(s.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '--:--';
                const deliveredTimeStr = s.delivered_at ? new Date(s.delivered_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '';

                return `
                    <div class="p-4 bg-slate-950/60 border ${isDelivered ? 'border-slate-800' : 'border-purple-500/40 shadow-lg shadow-purple-950/20'} rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
                        <div class="flex items-start gap-3">
                            <div class="w-12 h-12 rounded-2xl ${isDelivered ? 'bg-slate-800 text-slate-400' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'} flex items-center justify-center shrink-0">
                                <span class="material-icons text-2xl">${isDelivered ? 'check_circle' : 'sports_baseball'}</span>
                            </div>
                            <div class="space-y-1">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="text-xs font-mono font-black text-slate-400">#${s.folio || '—'}</span>
                                    <span class="text-sm font-black text-white uppercase">${escapeHtml(s.customer_name)}</span>
                                    <span class="px-2 py-0.5 ${s.is_member ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-300 border-slate-700'} border rounded-md text-[9px] font-black uppercase">
                                        ${s.is_member ? 'Socio' : 'Visitante'}
                                    </span>
                                    <span class="text-[10px] text-slate-500 font-bold">Hora: ${timeStr} hrs</span>
                                </div>
                                <div class="flex items-center gap-3 text-xs text-slate-400 font-bold flex-wrap">
                                    <span class="flex items-center gap-1 text-teal-400 font-black">
                                        <span class="material-icons text-sm">inventory_2</span>
                                        ${s.buckets_count} Cubeta${s.buckets_count > 1 ? 's' : ''} (${s.buckets_count * 100} Pelotas)
                                    </span>
                                    ${s.has_tee_practice ? `
                                        <span class="flex items-center gap-1 text-purple-300">
                                            <span class="material-icons text-sm">golf_course</span> Incluye Renta de Tee
                                        </span>
                                    ` : ''}
                                    ${s.has_club_rental ? `
                                        <span class="flex items-center gap-1 text-amber-300">
                                            <span class="material-icons text-sm">sports_golf</span> Renta de Equipo (Palos)
                                        </span>
                                    ` : ''}
                                    <span class="text-slate-400">
                                        Total: <strong>$${Number(s.total_amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong> (${s.payment_method})
                                    </span>
                                    ${s.authorized_by ? `
                                        <span class="text-amber-400 italic">Autorizó: ${escapeHtml(s.authorized_by)}</span>
                                    ` : ''}
                                </div>
                                ${s.notes ? `<p class="text-[11px] text-slate-500 italic">Nota: ${escapeHtml(s.notes)}</p>` : ''}
                            </div>
                        </div>

                        <div class="flex items-center gap-3 self-end md:self-center shrink-0">
                            ${isDelivered ? `
                                <div class="text-right">
                                    <span class="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-black uppercase">
                                        <span class="material-icons text-sm">done_all</span> ${s.has_club_rental ? 'Pelotas y Equipo Entregados' : 'Pelotas Entregadas'}
                                    </span>
                                    <p class="text-[10px] text-slate-500 font-bold mt-0.5">${deliveredTimeStr ? `A las ${deliveredTimeStr} hrs` : ''} (${s.delivered_by || 'Caddie Master'})</p>
                                </div>
                            ` : `
                                <button type="button" onclick="window.deliverDrivingRangeBalls('${s.id}')"
                                    class="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                                    <span class="material-icons text-base">check_circle</span> Entregar ${s.buckets_count} Cubeta${s.buckets_count > 1 ? 's' : ''}${s.has_club_rental ? ' + Equipo' : ''}
                                </button>
                            `}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

window.deliverDrivingRangeBalls = async function(sessionId) {
    let session = todayDrivingRange.find(s => String(s.id) === String(sessionId));
    if (!session) {
        session = todayDrivingRange.find(s => s.id === sessionId || s.folio === sessionId);
    }
    if (!session) return;

    session.balls_delivered = true;
    session.delivered_at = new Date().toISOString();
    session.delivered_by = 'Caddie Master';

    try {
        await dbColima.from('driving_range_sessions').update({
            balls_delivered: true,
            delivered_at: session.delivered_at,
            delivered_by: 'Caddie Master'
        }).eq('id', session.id);
    } catch (e) {
        console.warn('Supabase update driving_range_sessions error:', e);
    }

    try {
        const cacheKey = `cgc_driving_range_${selectedCaddieDate}`;
        localStorage.setItem(cacheKey, JSON.stringify(todayDrivingRange));
        localStorage.setItem('cgc_driving_range_sync', String(Date.now()));
    } catch(e) {}

    updateCaddieBadgesAndKPIs();
    renderDrivingRangeTab();
    window.showNotification?.('Pelotas Entregadas', `Se confirmó la entrega de ${session.buckets_count} cubeta(s) a ${session.customer_name}.`, 'success');
};

// ============================================================================
// MODAL: CONTROL DE SCORES PENDIENTES DE 9 HOYOS (VIGENCIA 6 DÍAS)
// ============================================================================

window.openPendingNineHolesModal = function() {
    let modal = document.getElementById('modal-member-crud');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-member-crud';
        document.body.appendChild(modal);
    }
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in';
    modal.style.display = 'flex';
    modal.classList.remove('hidden');
    modal.onclick = (e) => {
        if (e.target === modal) window.closeCaddieModal();
    };

    if (!pendingNineHoles || pendingNineHoles.length === 0) {
        try {
            const cached = localStorage.getItem('cgc_pending_nine_holes');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed)) pendingNineHoles = parsed;
            }
        } catch(e) {}
    }

    const todayStr = getLocalDateString();
    const activePending = (pendingNineHoles || []).filter(p => p.status === 'PENDING' && (!p.expires_at || p.expires_at >= todayStr));

    const renderCards = (list) => {
        if (!list || list.length === 0) {
            return `
                <div class="py-16 text-center bg-slate-950/50 border border-slate-800 rounded-3xl p-8 space-y-3">
                    <div class="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-2">
                        <span class="material-icons text-3xl">done_all</span>
                    </div>
                    <h4 class="text-white font-black text-sm uppercase">Sin Scores Pendientes</h4>
                    <p class="text-xs text-slate-400 font-bold max-w-md mx-auto">
                        No hay tarjetas de 9 hoyos esperando ser completadas. Cuando un jugador entregue solo media ronda, aparecerá aquí por 6 días.
                    </p>
                </div>
            `;
        }

        return `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${list.map(p => {
                    const playedDateStr = p.played_date || 'Hoy';
                    let daysLeft = 6;
                    if (p.played_date) {
                        try {
                            const [py, pm, pd] = p.played_date.split('-').map(Number);
                            const [ty, tm, td] = todayStr.split('-').map(Number);
                            const pDate = new Date(py, pm - 1, pd);
                            const curDate = new Date(ty, tm - 1, td);
                            const elapsedDays = Math.round((curDate - pDate) / (1000 * 60 * 60 * 24));
                            daysLeft = Math.max(0, Math.min(6, 6 - elapsedDays));
                        } catch(e) {}
                    } else if (p.expires_at) {
                        try {
                            const [ey, em, ed] = p.expires_at.split('-').map(Number);
                            const [ty, tm, td] = todayStr.split('-').map(Number);
                            const expDate = new Date(ey, em - 1, ed);
                            const curDate = new Date(ty, tm - 1, td);
                            const diffDays = Math.round((expDate - curDate) / (1000 * 60 * 60 * 24));
                            daysLeft = Math.max(0, Math.min(6, diffDays));
                        } catch(e) {}
                    }

                    const isFront = p.round_type === 'FRONT_9';
                    const roundName = isFront ? '1ra Vuelta (Hoyos 1 al 9)' : '2da Vuelta (Hoyos 10 al 18)';
                    const roundTees = isFront ? 'Marcas Blancas' : 'Marcas Azules';
                    const nextVuelta = isFront ? '2da Vuelta (Hoyos 10 al 18 · Azules)' : '1ra Vuelta (Hoyos 1 al 9 · Blancas)';
                    const nextHole = isFront ? 10 : 1;

                    let badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                    if (daysLeft <= 1) {
                        badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
                    } else if (daysLeft <= 3) {
                        badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                    }

                    const daysBadgeText = daysLeft === 0 
                        ? '¡Vence hoy!' 
                        : `Quedan ${daysLeft} día${daysLeft === 1 ? '' : 's'}`;

                    return `
                        <div class="p-5 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl space-y-4 shadow-xl transition-all flex flex-col justify-between">
                            <div class="space-y-3">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="space-y-0.5">
                                        <div class="flex items-center gap-2 flex-wrap">
                                            <h4 class="font-black text-white text-base uppercase">${escapeHtml(p.member_name)}</h4>
                                            <span class="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-md text-[10px] font-black">
                                                #${p.member_number || 'SOC'}
                                            </span>
                                        </div>
                                        <p class="text-[11px] text-slate-400 font-bold">Jugó el <strong>${playedDateStr}</strong></p>
                                    </div>

                                    <span class="px-2.5 py-1 ${badgeColor} border rounded-xl text-[10px] font-black uppercase shrink-0 flex items-center gap-1">
                                        <span class="material-icons text-xs">${daysLeft === 0 ? 'warning' : 'schedule'}</span> ${daysBadgeText}
                                    </span>
                                </div>

                                <div class="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                                    <div class="flex items-center justify-between text-xs">
                                        <span class="text-slate-400 font-bold flex items-center gap-1.5">
                                            <span class="w-2.5 h-2.5 rounded-full ${isFront ? 'bg-slate-200' : 'bg-blue-500'}"></span>
                                            ${roundName} (${roundTees})
                                        </span>
                                        <span class="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg font-black text-xs">
                                            ${p.partial_gross} golpes
                                        </span>
                                    </div>
                                    <div class="text-[11px] text-emerald-400 font-black flex items-center gap-1">
                                        <span class="material-icons text-sm">arrow_forward</span> Le falta: ${nextVuelta} (Hoyo #${nextHole})
                                    </div>
                                </div>

                                ${p.notes ? `<p class="text-[11px] text-slate-500 italic">Nota: ${escapeHtml(p.notes)}</p>` : ''}
                            </div>

                            <div class="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                                <button type="button" onclick="window.cancelPendingNineHoles('${p.id}')"
                                    class="px-3.5 py-2.5 bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/80 hover:border-rose-500/40 rounded-xl text-[10px] font-black uppercase transition-all"
                                    title="Descartar esta tarjeta sin penalizar">
                                    Descartar
                                </button>
                                <button type="button" onclick="window.startCompletingPendingScore('${p.id}')"
                                    class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 active:scale-95">
                                    <span class="material-icons text-sm">sports_golf</span> Completar 18 Hoyos
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    };

    modal.innerHTML = `
        <div class="w-full max-w-4xl bg-slate-950/95 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onclick="event.stopPropagation()">
            <!-- Header -->
            <div class="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                <div class="flex items-center gap-3.5">
                    <div class="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                        <span class="material-icons text-2xl">timer</span>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h3 class="font-black uppercase text-white text-lg leading-none">Scores Pendientes de 9 Hoyos</h3>
                            <span class="px-2.5 py-0.5 bg-amber-500 text-slate-950 rounded-lg text-xs font-black">
                                ${activePending.length}
                            </span>
                        </div>
                        <p class="text-xs text-slate-400 font-bold uppercase mt-1">Vigencia de 6 días naturales antes de ser descartados sin penalizar</p>
                    </div>
                </div>

                <button type="button" onclick="window.closeCaddieModal()" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all" title="Cerrar">
                    <span class="material-icons" style="font-size:18px">close</span>
                </button>
            </div>

            <!-- Filter -->
            <div class="p-4 border-b border-slate-800/80 bg-slate-900/40 flex items-center gap-3">
                <div class="relative flex-1">
                    <span class="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                    <input id="pending-9h-filter" type="text" placeholder="Buscar socio por nombre o número..."
                        oninput="window.filterPendingNineHolesList(this.value)"
                        class="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-primary">
                </div>
            </div>

            <!-- Content List -->
            <div id="pending-9h-cards-container" class="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                ${renderCards(activePending)}
            </div>

            <!-- Footer -->
            <div class="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
                <button type="button" onclick="window.closeCaddieModal()" class="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-xs uppercase transition-all">
                    Cerrar
                </button>
            </div>
        </div>
    `;

    window.filterPendingNineHolesList = function(query) {
        const container = document.getElementById('pending-9h-cards-container');
        if (!container) return;
        const q = (query || '').trim().toLowerCase();
        const filtered = activePending.filter(p => {
            if (!q) return true;
            return (p.member_name || '').toLowerCase().includes(q) || (p.member_number || '').toLowerCase().includes(q);
        });
        container.innerHTML = renderCards(filtered);
    };
};

window.startCompletingPendingScore = function(pendingId) {
    const pending = (pendingNineHoles || []).find(p => String(p.id) === String(pendingId));
    if (!pending) return;

    window.closeCaddieModal();

    // Check if there is an existing output today for this player
    let output = todayOutputs.find(o => 
        (pending.member_id && String(o.member_id) === String(pending.member_id)) ||
        ((o.member_name || '').trim().toLowerCase() === (pending.member_name || '').trim().toLowerCase())
    );

    if (!output) {
        output = {
            id: 'tmp_comp_' + Date.now(),
            member_id: pending.member_id,
            member_number: pending.member_number,
            member_name: pending.member_name,
            player_type: pending.player_type || 'MEMBER',
            starting_hole: pending.round_type === 'FRONT_9' ? 10 : 1,
            score_status: 'PENDING',
            hole_scores: {}
        };
        todayOutputs.unshift(output);
    }

    window._completingPendingRecord = pending;
    window._caddiePendingRecord = pending;
    window._caddieScoreMode = 'COMPLETING_18';

    setTimeout(() => {
        window.openScoreCaptureModal(output.id, output);
    }, 150);
};

window.cancelPendingNineHoles = function(pendingId) {
    const pending = (pendingNineHoles || []).find(p => String(p.id) === String(pendingId));
    if (!pending) return;

    window.showNotification?.(
        'Descartar Tarjeta de 9 Hoyos',
        `¿Deseas cancelar y descartar la tarjeta incompleta de ${pending.member_name}? Esta tarjeta no penalizará ni afectará su hándicap.`,
        'confirm',
        async () => {
            pending.status = 'CANCELLED';
            try {
                await dbColima.from('pending_nine_holes').update({ status: 'CANCELLED' }).eq('id', pending.id);
            } catch(e) {}

            try {
                localStorage.setItem('cgc_pending_nine_holes', JSON.stringify(pendingNineHoles));
                localStorage.setItem('cgc_pending_nine_holes_sync', String(Date.now()));
            } catch(e) {}

            updateCaddieBadgesAndKPIs();
            window.openPendingNineHolesModal();
            window.showNotification?.('Tarjeta Descartada', `La tarjeta de 9 hoyos de ${pending.member_name} ha sido descartada sin penalización.`, 'success');
        }
    );
};
