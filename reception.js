import { createClient } from '@supabase/supabase-js';

// ── Detección de rol (lee sessionStorage igual que main.js) ──────────────────
function isAdminUser() {
    try {
        const data = sessionStorage.getItem('cgc_user_data');
        if (data) {
            const u = JSON.parse(data);
            return u.role === 'admin' || u.username === 'colimagc';
        }
        // Compatibilidad con sesión legacy
        const legacy = sessionStorage.getItem('cgc_auth');
        return legacy === 'admin' || legacy === '1';
    } catch (e) { return false; }
}

const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 'https://tztolxgsaktqindoimtu.supabase.co';
const SUPABASE_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dG9seGdzYWt0cWluZG9pbXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzQ4ODAsImV4cCI6MjEwMTg1MDg4MH0.E2GABiOMXYb5hEwE9ErIcJa6_LHkj9lJUglQVoiLl0M';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
const db = supabaseClient.schema('colimaGC');

// Default interval tee times (every 20 minutes from 07:00 to 17:00)
const DEFAULT_SLOTS = [
    '07:00', '07:20', '07:40',
    '08:00', '08:20', '08:40',
    '09:00', '09:20', '09:40',
    '10:00', '10:20', '10:40',
    '11:00', '11:20', '11:40',
    '12:00', '12:20', '12:40',
    '13:00', '13:20', '13:40',
    '14:00', '14:20', '14:40',
    '15:00', '15:20', '15:40',
    '16:00', '16:20', '16:40',
    '17:00'
];

// Default Pricing Configuration (Tarifa Única 18/9 Hoyos + Renta Equipo)
const DEFAULT_PRICES = {
    greenFee18Guest: 1200,
    greenFee9Guest: 1200, // Unificado a tarifa única
    greenFee18Member: 0,
    greenFee9Member: 0,
    cart18: 500,
    cart9: 500, // Unificado a tarifa única
    clubRentalFee: 400, // Renta de equipo (palos de golf)
    practiceTeeFee: 150,
    bucket100Fee: 120
};

// Default Convenios Configuration
const DEFAULT_CONVENIOS = [
    { id: 'manzanillo', name: 'Manzanillo Golf', green_fee_18: 800, green_fee_9: 800, cart_fee_18: 500, cart_fee_9: 500, is_active: true }
];

let currentPrices = { ...DEFAULT_PRICES };
try {
    const savedPrices = localStorage.getItem('cgc_reception_prices');
    if (savedPrices) {
        currentPrices = { ...DEFAULT_PRICES, ...JSON.parse(savedPrices) };
        if (!currentPrices.clubRentalFee) currentPrices.clubRentalFee = 400;
        // Igualar tarifas para que 9 hoyos cueste lo mismo que 18
        currentPrices.greenFee9Guest = currentPrices.greenFee18Guest;
        currentPrices.cart9 = currentPrices.cart18;
    }
} catch (e) {
    console.warn('Error reading price config:', e);
}

let currentConvenios = [...DEFAULT_CONVENIOS];
try {
    const savedConv = localStorage.getItem('cgc_convenios');
    if (savedConv) currentConvenios = JSON.parse(savedConv);
} catch (e) {
    console.warn('Error reading convenios config:', e);
}

function getLocalDateString(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Module State
let selectedDate = getLocalDateString();
let activeReceptionTab = 'SLOTS'; // 'SLOTS' | 'CORTE'
let allMembers = [];
let dayTeeTimes = [];
let selectedBooking = null; // null for new, or booking object for edit/view
let currentPlayersForm = []; // array of player objects in POS form

export async function renderReceptionModule(container) {
    renderMainShell(container);
    await loadInitialData();
}

function renderMainShell(container) {
    const todayFormatted = formatFullDate(selectedDate);

    container.innerHTML = `
        <div class="space-y-6">
            <!-- Header Banner -->
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-lg shadow-primary/10">
                        <span class="material-icons" style="font-size:32px">point_of_sale</span>
                    </div>
                    <div>
                        <div class="flex items-center gap-2.5">
                            <h2 class="text-2xl font-black text-white uppercase tracking-tight">Recepción & Tee Times</h2>
                            <span class="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-black uppercase">Casa Club</span>
                        </div>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Control de Reservas, Cobro de Green Fees & Pase Express a Caddie Master</p>
                    </div>
                </div>

                <!-- Date Navigation Bar -->
                <div class="flex flex-wrap items-center gap-2 bg-slate-950/80 border border-slate-800 p-2 rounded-2xl shrink-0">
                    <button id="btn-date-prev" class="w-9 h-9 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center justify-center transition-all" title="Día Anterior">
                        <span class="material-icons text-base">chevron_left</span>
                    </button>

                    <div class="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-700/80 rounded-xl">
                        <span class="material-icons text-primary text-base">calendar_today</span>
                        <input id="reception-date-input" type="date" value="${selectedDate}" style="color-scheme: dark;"
                            class="bg-transparent text-white font-black text-xs uppercase focus:outline-none cursor-pointer">
                    </div>

                    <button id="btn-date-next" class="w-9 h-9 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center justify-center transition-all" title="Día Siguiente">
                        <span class="material-icons text-base">chevron_right</span>
                    </button>

                    <button id="btn-date-today" class="px-3 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary rounded-xl font-black text-xs uppercase tracking-wider transition-all">
                        Hoy
                    </button>
                </div>
            </div>

            <!-- Summary KPI Cards -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tee Times Agendados</p>
                        <h4 id="kpi-slots-count" class="text-2xl font-black text-white mt-1">0</h4>
                        <p class="text-[10px] font-bold text-slate-400 mt-0.5">Slots ocupados</p>
                    </div>
                    <div class="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <span class="material-icons">schedule</span>
                    </div>
                </div>

                <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Jugadores</p>
                        <h4 id="kpi-players-count" class="text-2xl font-black text-emerald-400 mt-1">0</h4>
                        <p class="text-[10px] font-bold text-slate-400 mt-0.5">Socios + Invitados</p>
                    </div>
                    <div class="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <span class="material-icons">groups</span>
                    </div>
                </div>

                <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ingresos del Día</p>
                        <h4 id="kpi-revenue-total" class="text-2xl font-black text-primary mt-1">$0</h4>
                        <p class="text-[10px] font-bold text-slate-400 mt-0.5">Green Fees + Carros</p>
                    </div>
                    <div class="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <span class="material-icons">payments</span>
                    </div>
                </div>

                <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carritos Rentados</p>
                        <h4 id="kpi-carts-count" class="text-2xl font-black text-amber-400 mt-1">0</h4>
                        <p class="text-[10px] font-bold text-slate-400 mt-0.5">Carros en campo</p>
                    </div>
                    <div class="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <span class="material-icons">electric_car</span>
                    </div>
                </div>
            </div>

            <!-- Navigation Sub-tabs -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
                <div class="flex items-center gap-2 flex-wrap">
                    <button id="tab-reception-slots" class="px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-primary text-slate-950 shadow-lg shadow-primary/20">
                        <span class="material-icons" style="font-size:18px">grid_view</span> Parrilla de Salidas & Cobro
                    </button>
                    <button id="tab-reception-reservas" class="px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-slate-900 text-slate-400 border border-slate-800 hover:text-white">
                        <span class="material-icons" style="font-size:18px">event_note</span> Reservas
                        <span id="tab-reservas-badge" class="px-2 py-0.5 bg-slate-800 text-amber-400 rounded-lg text-[10px] font-black border border-slate-700">0</span>
                    </button>
                    <button id="tab-reception-corte" class="px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-slate-900 text-slate-400 border border-slate-800 hover:text-white">
                        <span class="material-icons" style="font-size:18px">receipt_long</span> Corte de Caja & Recibos
                    </button>
                </div>

                <div class="flex items-center gap-2 flex-wrap">
                    <button onclick="window.openDrivingRangeModal()" class="px-4 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20 active:scale-95">
                        <span class="material-icons text-sm">sports_golf</span> 🏌️ Cobro Práctica / Pelotas
                    </button>
                    ${isAdminUser()
                        ? `<button onclick="window.openReceptionPriceConfigModal()" class="px-4 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 bg-slate-900 text-slate-300 border border-slate-800 hover:text-white hover:border-slate-700">
                            <span class="material-icons text-sm text-amber-400">tune</span> Configurar Tarifas
                        </button>`
                        : `<button disabled title="Solo el Administrador puede modificar tarifas" class="px-4 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed opacity-50">
                            <span class="material-icons text-sm text-slate-600">lock</span> Configurar Tarifas
                        </button>`
                    }
                    <button onclick="window.startNewBookingFromScratch()" class="px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20">
                        <span class="material-icons text-sm">add_circle</span> + Nueva Salida / Cobro
                    </button>
                </div>
            </div>

            <!-- Tab 1: Slots Grid + Point of Sale Terminal -->
            <div id="reception-view-slots" class="space-y-6">
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    <!-- Left: 20-min Slot Agenda Grid (col-span-5) -->
                    <div class="lg:col-span-5 space-y-4">
                        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                                <div>
                                    <h3 class="font-black text-white uppercase text-xs tracking-wider flex items-center gap-2">
                                        <span class="material-icons text-primary text-base">alarm</span> Salidas cada 20 Minutos
                                    </h3>
                                    <div class="flex items-center gap-1.5 mt-1">
                                        <span class="material-icons text-xs text-primary">event</span>
                                        <span id="reception-slots-date-label" class="text-xs font-black text-emerald-400 uppercase">${todayFormatted}</span>
                                    </div>
                                </div>
                                <div class="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 shrink-0">
                                    <button type="button" onclick="window.stepReceptionDate(-1)" class="w-6 h-6 flex items-center justify-center hover:bg-slate-800 rounded text-slate-400 hover:text-white" title="Día Anterior">
                                        <span class="material-icons text-sm">chevron_left</span>
                                    </button>
                                    <input type="date" id="reception-slots-quick-date" value="${selectedDate}" onchange="window.setReceptionDate(this.value)" style="color-scheme: dark;"
                                        class="bg-transparent text-white font-black text-[11px] uppercase focus:outline-none cursor-pointer">
                                    <button type="button" onclick="window.stepReceptionDate(1)" class="w-6 h-6 flex items-center justify-center hover:bg-slate-800 rounded text-slate-400 hover:text-white" title="Día Siguiente">
                                        <span class="material-icons text-sm">chevron_right</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Mini Metrics Quick Strip -->
                            <div class="grid grid-cols-4 gap-2 bg-slate-950/90 border border-slate-800/80 p-2 rounded-2xl text-center">
                                <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-1.5">
                                    <p class="text-[8px] font-black text-slate-400 uppercase">Tee Times</p>
                                    <p id="mini-kpi-slots" class="text-sm font-black text-white leading-tight mt-0.5">0</p>
                                </div>
                                <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-1.5">
                                    <p class="text-[8px] font-black text-slate-400 uppercase">Jugadores</p>
                                    <p id="mini-kpi-players" class="text-sm font-black text-emerald-400 leading-tight mt-0.5">0</p>
                                </div>
                                <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-1.5">
                                    <p class="text-[8px] font-black text-slate-400 uppercase">Carritos</p>
                                    <p id="mini-kpi-carts" class="text-sm font-black text-amber-400 leading-tight mt-0.5">0</p>
                                </div>
                                <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-1.5">
                                    <p class="text-[8px] font-black text-slate-400 uppercase">Total Hoy</p>
                                    <p id="mini-kpi-revenue" class="text-xs font-black text-primary leading-tight mt-1">$0</p>
                                </div>
                            </div>

                            <!-- Legend -->
                            <div class="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase pb-1">
                                <span class="flex items-center gap-1 text-slate-400"><span class="w-2.5 h-2.5 rounded-full bg-slate-700"></span> Libre</span>
                                <span class="flex items-center gap-1 text-amber-400"><span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Reserva Tel.</span>
                                <span class="flex items-center gap-1 text-blue-400"><span class="w-2.5 h-2.5 rounded-full bg-blue-400"></span> Pagado / En Tee</span>
                                <span class="flex items-center gap-1 text-emerald-400"><span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> En Campo</span>
                            </div>

                            <!-- Slots Scrollable List -->
                            <div id="reception-slots-container" class="space-y-2.5 max-h-[620px] overflow-y-auto custom-scrollbar pr-1">
                                <div class="py-12 text-center">
                                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Point of Sale Terminal & Foursome Register (col-span-7) -->
                    <div class="lg:col-span-7 space-y-4">
                        <div id="reception-pos-card" class="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
                            <!-- POS Header & Form will be dynamically injected here -->
                        </div>
                    </div>

                </div>
            </div>

            <!-- Tab 2: Corte de Caja & Historial de Recibos -->
            <div id="reception-view-corte" class="hidden space-y-6">
                <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                        <div>
                            <h3 class="font-black text-white uppercase text-lg tracking-tight flex items-center gap-2">
                                <span class="material-icons text-primary">receipt_long</span> Corte de Caja & Recibos Emitidos
                            </h3>
                            <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                Fecha: <span id="reception-corte-date-label" class="text-emerald-400 font-black">${todayFormatted}</span>
                            </p>
                        </div>
                        <div class="flex items-center gap-3">
                            <button onclick="window.printDailyCorte()" class="px-5 py-3 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2">
                                <span class="material-icons text-base">print</span> Imprimir Corte de Turno
                            </button>
                        </div>
                    </div>

                    <!-- Financial Summary Breakdown -->
                    <div id="corte-financial-summary" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <!-- Populated dynamically -->
                    </div>

                    <!-- Transactions Table -->
                    <div id="corte-table-container">
                        <!-- Populated dynamically -->
                    </div>
                </div>
            </div>

            <!-- Tab 3: Reservas Agrupadas por Fecha -->
            <div id="reception-view-reservas" class="hidden space-y-5">
                <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                        <div>
                            <h3 class="font-black text-white uppercase text-lg tracking-tight flex items-center gap-2">
                                <span class="material-icons text-amber-400">event_note</span> Reservas Pendientes & Confirmadas
                            </h3>
                            <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                Grupos agrupados por fecha y horario de salida
                            </p>
                        </div>
                        <button onclick="window.refreshReservasView()" class="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-slate-700">
                            <span class="material-icons text-sm text-primary">refresh</span> Actualizar
                        </button>
                    </div>
                    <div id="reservas-list-container" class="space-y-4">
                        <div class="py-12 text-center">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Tab bindings
    const tabSlots = document.getElementById('tab-reception-slots');
    const tabCorte = document.getElementById('tab-reception-corte');
    const tabReservas = document.getElementById('tab-reception-reservas');
    const viewSlots = document.getElementById('reception-view-slots');
    const viewCorte = document.getElementById('reception-view-corte');
    const viewReservas = document.getElementById('reception-view-reservas');

    const TAB_ACTIVE = 'px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-primary text-slate-950 shadow-lg shadow-primary/20';
    const TAB_INACTIVE = 'px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-slate-900 text-slate-400 border border-slate-800 hover:text-white';

    tabSlots.onclick = () => {
        activeReceptionTab = 'SLOTS';
        tabSlots.className = TAB_ACTIVE;
        tabCorte.className = TAB_INACTIVE;
        tabReservas.className = TAB_INACTIVE + ' gap-2';
        viewSlots.classList.remove('hidden');
        viewCorte.classList.add('hidden');
        viewReservas.classList.add('hidden');
    };

    tabCorte.onclick = () => {
        activeReceptionTab = 'CORTE';
        tabCorte.className = TAB_ACTIVE;
        tabSlots.className = TAB_INACTIVE;
        tabReservas.className = TAB_INACTIVE + ' gap-2';
        viewCorte.classList.remove('hidden');
        viewSlots.classList.add('hidden');
        viewReservas.classList.add('hidden');
        renderCorteView();
    };

    tabReservas.onclick = () => {
        activeReceptionTab = 'RESERVAS';
        tabReservas.className = TAB_ACTIVE + ' gap-2';
        tabSlots.className = TAB_INACTIVE;
        tabCorte.className = TAB_INACTIVE;
        viewReservas.classList.remove('hidden');
        viewSlots.classList.add('hidden');
        viewCorte.classList.add('hidden');
        renderReservasView();
    };

    // Date navigation bindings
    document.getElementById('reception-date-input').onchange = (e) => {
        selectedDate = e.target.value;
        loadDayBookings();
    };

    document.getElementById('btn-date-today').onclick = () => {
        selectedDate = getLocalDateString();
        document.getElementById('reception-date-input').value = selectedDate;
        loadDayBookings();
    };

    document.getElementById('btn-date-prev').onclick = () => {
        const d = new Date(selectedDate + 'T00:00:00');
        d.setDate(d.getDate() - 1);
        selectedDate = getLocalDateString(d);
        document.getElementById('reception-date-input').value = selectedDate;
        loadDayBookings();
    };

    document.getElementById('btn-date-next').onclick = () => {
        const d = new Date(selectedDate + 'T00:00:00');
        d.setDate(d.getDate() + 1);
        selectedDate = getLocalDateString(d);
        document.getElementById('reception-date-input').value = selectedDate;
        loadDayBookings();
    };
}

async function loadInitialData() {
    await Promise.all([
        loadMembersData(),
        loadConveniosData()
    ]);
    await loadDayBookings();
}

async function loadMembersData() {
    try {
        const { data: members } = await db.from('members').select('*').order('member_number', { ascending: true });
        allMembers = members || [];
    } catch (e) {
        console.warn('Error loading members in reception:', e);
        allMembers = [];
    }
}

async function loadConveniosData() {
    try {
        const { data: convenios, error } = await db.from('convenios').select('*').order('name', { ascending: true });
        if (!error && convenios && convenios.length > 0) {
            currentConvenios = convenios;
            localStorage.setItem('cgc_convenios', JSON.stringify(convenios));
        }
    } catch (e) {
        console.warn('Error loading convenios from Supabase:', e);
    }
}

async function loadDayBookings() {
    try {
        // 1. Try Supabase
        const { data, error } = await db.from('tee_times').select('*').eq('booking_date', selectedDate).order('booking_time', { ascending: true });

        if (!error && data) {
            dayTeeTimes = data;
            // Also update local cache for offline redundancy
            saveBookingsToLocalCache(selectedDate, data);
        } else {
            // Fallback to local cache if table doesn't exist yet or connection error
            dayTeeTimes = getBookingsFromLocalCache(selectedDate);
        }
    } catch (err) {
        console.warn('Supabase tee_times fetch fallback:', err);
        dayTeeTimes = getBookingsFromLocalCache(selectedDate);
    }

    updateKPICards();
    renderSlotsGrid();
    
    // Synchronize all date UI labels and pickers
    const labelSlots = document.getElementById('reception-slots-date-label');
    const labelCorte = document.getElementById('reception-corte-date-label');
    const inputTop = document.getElementById('reception-date-input');
    const inputQuick = document.getElementById('reception-slots-quick-date');
    const inputPosDate = document.getElementById('pos-date');

    const dateFormatted = formatFullDate(selectedDate);
    if (labelSlots) labelSlots.textContent = dateFormatted;
    if (labelCorte) labelCorte.textContent = dateFormatted;
    if (inputTop) inputTop.value = selectedDate;
    if (inputQuick) inputQuick.value = selectedDate;
    if (inputPosDate) inputPosDate.value = selectedDate;

    // If no booking is selected, initialize a new clean POS form for the next operational slot
    const defaultSlotTime = getNextOperationalSlot(selectedDate);
    if (!selectedBooking) {
        initNewBookingForm(defaultSlotTime);
    } else {
        // Refresh selected booking if updated
        const updated = dayTeeTimes.find(b => b.id === selectedBooking.id);
        if (updated) {
            selectedBooking = updated;
            renderPOSCard();
        } else {
            initNewBookingForm(defaultSlotTime);
        }
    }

    if (activeReceptionTab === 'CORTE') {
        renderCorteView();
    }
}

function updateKPICards() {
    const kpiSlots = document.getElementById('kpi-slots-count');
    const kpiPlayers = document.getElementById('kpi-players-count');
    const kpiRevenue = document.getElementById('kpi-revenue-total');
    const kpiCarts = document.getElementById('kpi-carts-count');

    const miniSlots = document.getElementById('mini-kpi-slots');
    const miniPlayers = document.getElementById('mini-kpi-players');
    const miniCarts = document.getElementById('mini-kpi-carts');
    const miniRevenue = document.getElementById('mini-kpi-revenue');

    let totalPlayers = 0;
    let totalRevenue = 0;
    let totalCarts = 0;
    let activeSlots = 0;

    dayTeeTimes.forEach(b => {
        if (b.status !== 'CANCELLED' && b.status !== 'BLOCKED') {
            activeSlots++;
            totalPlayers += parseInt(b.total_players || 0);
            totalCarts += parseInt(b.total_carts || 0);
            if (b.status === 'PAID' || b.status === 'ON_COURSE' || b.status === 'COMPLETED') {
                totalRevenue += parseFloat(b.total_amount || 0);
            }
        }
    });

    const revStr = `$${totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

    if (kpiSlots) kpiSlots.textContent = activeSlots;
    if (kpiPlayers) kpiPlayers.textContent = totalPlayers;
    if (kpiRevenue) kpiRevenue.textContent = revStr;
    if (kpiCarts) kpiCarts.textContent = totalCarts;

    if (miniSlots) miniSlots.textContent = activeSlots;
    if (miniPlayers) miniPlayers.textContent = totalPlayers;
    if (miniRevenue) miniRevenue.textContent = revStr;
    if (miniCarts) miniCarts.textContent = totalCarts;
}

function getNextOperationalSlot(dateStr = selectedDate) {
    const today = getLocalDateString();
    if (dateStr !== today) {
        return DEFAULT_SLOTS[0] || '07:00';
    }
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const nextSlot = DEFAULT_SLOTS.find(t => {
        const [h, m] = t.split(':').map(Number);
        return (h * 60 + m) >= currentMins;
    });
    return nextSlot || DEFAULT_SLOTS[DEFAULT_SLOTS.length - 1] || '17:00';
}

window.togglePastReceptionSlots = function() {
    window._showPastReceptionSlots = !window._showPastReceptionSlots;
    renderSlotsGrid();
};

function renderSlotsGrid() {
    const container = document.getElementById('reception-slots-container');
    if (!container) return;

    const today = getLocalDateString();
    const isToday = selectedDate === today;
    const nowMinutes = isToday
        ? new Date().getHours() * 60 + new Date().getMinutes()
        : 0;

    let slotsToRender = DEFAULT_SLOTS;
    let headerToggleHtml = '';

    if (isToday) {
        const pastEmptySlots = DEFAULT_SLOTS.filter(timeStr => {
            const [h, m] = timeStr.split(':').map(Number);
            const isPast = (h * 60 + m) < nowMinutes;
            const booking = dayTeeTimes.find(b => b.booking_time === timeStr && b.status !== 'CANCELLED');
            return isPast && !booking;
        });

        if (!window._showPastReceptionSlots) {
            slotsToRender = DEFAULT_SLOTS.filter(timeStr => {
                const [h, m] = timeStr.split(':').map(Number);
                const isPast = (h * 60 + m) < nowMinutes;
                const booking = dayTeeTimes.find(b => b.booking_time === timeStr && b.status !== 'CANCELLED');
                return !isPast || booking;
            });

            if (pastEmptySlots.length > 0) {
                headerToggleHtml = `
                    <div class="flex items-center justify-between p-2.5 px-3 bg-slate-950/60 border border-slate-800 rounded-xl mb-2 text-xs">
                        <span class="text-slate-400 font-bold text-[11px] flex items-center gap-1.5">
                            <span class="material-icons text-xs text-slate-500">history</span>
                            ${pastEmptySlots.length} horarios matutinos pasados ocultos
                        </span>
                        <button type="button" onclick="window.togglePastReceptionSlots()" class="text-primary hover:underline text-[10px] font-black uppercase">
                            Ver Anteriores
                        </button>
                    </div>`;
            }
        } else {
            headerToggleHtml = `
                <div class="flex items-center justify-between p-2.5 px-3 bg-slate-950/60 border border-slate-800 rounded-xl mb-2 text-xs">
                    <span class="text-slate-300 font-bold text-[11px] flex items-center gap-1.5">
                        <span class="material-icons text-xs text-primary">schedule</span>
                        Mostrando todos los horarios (incluyendo pasados)
                    </span>
                    <button type="button" onclick="window.togglePastReceptionSlots()" class="text-primary hover:underline text-[10px] font-black uppercase">
                        Ocultar Pasados
                    </button>
                </div>`;
        }
    }

    container.innerHTML = headerToggleHtml + slotsToRender.map(timeStr => {
        const booking = dayTeeTimes.find(b => b.booking_time === timeStr && b.status !== 'CANCELLED');
        const isSelected = (selectedBooking && selectedBooking.booking_time === timeStr) || (!selectedBooking && window._formTime === timeStr);
        const [h, m] = timeStr.split(':').map(Number);
        const isPast = isToday && (h * 60 + m) < nowMinutes;

        if (!booking) {
            // Free Slot (🟢 Libre o 🕒 Pasado)
            return `
                <div onclick="window.selectSlotForBooking('${timeStr}', null)"
                    class="p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group
                    ${isSelected ? 'bg-primary/20 border-primary shadow-lg ring-2 ring-primary/40' : (isPast ? 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-900/90 hover:border-slate-700' : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/80 hover:border-slate-700')}">
                    <div class="flex items-center gap-3">
                        <span class="w-16 text-center font-black text-sm ${isPast ? 'text-slate-400 bg-slate-900/70' : 'text-slate-300 bg-slate-900'} border border-slate-800 px-2 py-1 rounded-xl group-hover:text-primary transition-colors">
                            ${timeStr}
                        </span>
                        <div>
                            <p class="font-black text-xs ${isPast ? 'text-slate-400' : 'text-slate-300'} uppercase flex items-center gap-1.5">
                                <span class="w-2 h-2 rounded-full ${isPast ? 'bg-slate-600' : 'bg-emerald-400'}"></span> ${isPast ? 'Horario Pasado' : 'Horario Libre'}
                            </p>
                            <p class="text-[10px] text-slate-500 font-bold">${isPast ? 'Disponible para registro o walk-in' : 'Disponible para reservar o cobrar'}</p>
                        </div>
                    </div>
                    <button class="px-3 py-1.5 bg-slate-800 group-hover:bg-primary group-hover:text-slate-950 text-slate-400 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1">
                        <span class="material-icons text-xs">add</span> Ocupar
                    </button>
                </div>`;
        }

        // Occupied Slot: status check
        let statusBadge = '';
        let borderClass = 'border-slate-700';
        let bgClass = 'bg-slate-800/90';

        if (booking.status === 'RESERVED') {
            borderClass = 'border-amber-500/50 hover:border-amber-400';
            bgClass = 'bg-amber-500/10';
            statusBadge = `<span class="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[9px] font-black uppercase">🟡 Reserva Tel.</span>`;
        } else if (booking.status === 'PAID') {
            borderClass = 'border-blue-500/50 hover:border-blue-400';
            bgClass = 'bg-blue-500/10';
            statusBadge = `<span class="px-2.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-[9px] font-black uppercase">🔵 Pagado / En Tee</span>`;
        } else if (booking.status === 'ON_COURSE' || booking.status === 'COMPLETED') {
            borderClass = 'border-emerald-500/50 hover:border-emerald-400';
            bgClass = 'bg-emerald-500/10';
            statusBadge = `<span class="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[9px] font-black uppercase">⛳ En Campo</span>`;
        } else if (booking.status === 'BLOCKED') {
            borderClass = 'border-rose-500/40';
            bgClass = 'bg-rose-500/10';
            statusBadge = `<span class="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-[9px] font-black uppercase">🔴 Bloqueado</span>`;
        }

        const playersPreview = Array.isArray(booking.players)
            ? booking.players.map(p => p.name).filter(Boolean).join(', ')
            : (booking.contact_name || 'Sin nombres');

        const caddieExtra = (booking.caddie_assigned || booking.cart_numbers)
            ? `<p class="text-[9px] text-emerald-400 font-bold truncate mt-0.5"><span class="material-icons align-middle text-[11px]">sports_golf</span> Caddie: ${booking.caddie_assigned || 'S/C'} ${booking.cart_numbers ? '| Carro #' + booking.cart_numbers : ''}</p>`
            : '';

        return `
            <div onclick="window.selectSlotForBooking('${timeStr}', '${booking.id}')"
                class="p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${bgClass} ${borderClass}
                ${isSelected ? 'ring-2 ring-primary/60 shadow-xl' : ''}">
                <div class="flex items-center gap-3 min-w-0">
                    <span class="w-16 text-center font-black text-sm text-white bg-slate-900/90 border border-slate-700 px-2 py-1 rounded-xl shrink-0">
                        ${timeStr}
                    </span>
                    <div class="min-w-0">
                        <div class="flex items-center gap-2">
                            <p class="font-black text-white text-xs uppercase truncate">${booking.contact_name || 'Reserva'}</p>
                            <span class="text-[10px] font-bold text-slate-400 shrink-0">(${booking.total_players || 1} jug)</span>
                        </div>
                        <p class="text-[10px] text-slate-400 font-bold truncate mt-0.5">${playersPreview}</p>
                        ${caddieExtra}
                    </div>
                </div>
                <div class="flex flex-col items-end gap-1 shrink-0">
                    ${statusBadge}
                    <span class="text-[10px] font-black text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700">
                        Folio: #${booking.folio ? booking.folio.split('-').pop() : '—'}
                    </span>
                </div>
            </div>`;
    }).join('');
}

window.selectSlotForBooking = function(timeStr, bookingId) {
    if (bookingId) {
        selectedBooking = dayTeeTimes.find(b => String(b.id) === String(bookingId)) || null;
        if (selectedBooking) {
            window._formTime = selectedBooking.booking_time;
            currentPlayersForm = Array.isArray(selectedBooking.players) && selectedBooking.players.length > 0
                ? JSON.parse(JSON.stringify(selectedBooking.players))
                : [createDefaultPlayer(1)];
        }
    } else {
        selectedBooking = null;
        initNewBookingForm(timeStr);
    }
    renderSlotsGrid();
    renderPOSCard();
};

window.startNewBookingFromScratch = function() {
    selectedBooking = null;
    const nextAvailable = getNextOperationalSlot(selectedDate);
    initNewBookingForm(nextAvailable);
    renderSlotsGrid();
    renderPOSCard();
};

window.handlePosTimeChange = function(newTime) {
    window._formTime = newTime;
    if (selectedBooking) {
        selectedBooking.booking_time = newTime;
    }
    renderSlotsGrid();
    renderPOSCard();
};

function initNewBookingForm(timeStr = '08:00') {
    selectedBooking = null;
    currentPlayersForm = [
        createDefaultPlayer(1)
    ];
    window._formTime = timeStr;
    renderPOSCard();
}

function createDefaultPlayer(index = 1) {
    return {
        id: 'p_' + Math.random().toString(36).substr(2, 9),
        name: '',
        player_type: 'GUEST', // 'GUEST' | 'MEMBER' | 'CONVENIO' | 'CORTESIA'
        is_member: false,
        member_id: null,
        member_number: '',
        convenio_id: null,
        convenio_name: '',
        holes: 18,
        has_cart: false,
        has_clubs: false,
        green_fee: currentPrices.greenFee18Guest,
        cart_fee: 0,
        club_fee: 0,
        payment_method: window._posPaymentMethod === 'CORTESIA' ? 'CORTESIA' : 'EFECTIVO',
        transaction_ref: ''
    };
}

function renderPOSCard() {
    const card = document.getElementById('reception-pos-card');
    if (!card) return;

    const isEdit = !!selectedBooking;
    const timeVal = isEdit ? selectedBooking.booking_time : (window._formTime || '08:00');
    const contactName = isEdit ? (selectedBooking.contact_name || '') : (currentPlayersForm[0]?.name || '');
    const contactPhone = isEdit ? (selectedBooking.contact_phone || '') : '';
    const paymentMethod = isEdit ? (selectedBooking.payment_method || 'EFECTIVO') : (window._posPaymentMethod || 'EFECTIVO');
    const startingHole = isEdit ? (selectedBooking.starting_hole || 1) : 1;
    const notes = isEdit ? (selectedBooking.notes || '') : '';
    const folio = isEdit ? selectedBooking.folio : generateFolioPreview();
    const status = isEdit ? selectedBooking.status : 'NEW';

    card.innerHTML = `
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            
            <!-- Top Control Bar -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-lg shadow-primary/10">
                        <span class="material-icons text-2xl">sports_score</span>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h3 class="text-xl font-black text-white uppercase tracking-tight">
                                ${isEdit ? `Editar Salida: Folio ${folio}` : 'Nuevo Registro de Salida'}
                            </h3>
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                status === 'PAID' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                                status === 'ON_COURSE' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                                status === 'RESERVED' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                                'bg-slate-800 text-slate-300 border border-slate-700'
                            }">
                                ${status === 'PAID' ? 'Pagado / Autorizado' : status === 'ON_COURSE' ? 'En Campo' : status === 'RESERVED' ? 'Reserva Telefónica' : 'Nuevo'}
                            </span>
                        </div>
                        <p class="text-xs font-bold text-slate-400 mt-0.5">Captura de Jugadores, Green Fees, Carritos, Renta de Equipo & Cobro POS</p>
                    </div>
                </div>

                <div class="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                    ${(isEdit && isAdminUser()) ? `
                        <button type="button" onclick="window.cancelBooking('${selectedBooking.id}')"
                            class="px-3.5 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400 hover:text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm" title="Eliminar y liberar este horario (Solo Administrador)">
                            <span class="material-icons text-sm">delete_forever</span> Borrar Salida
                        </button>
                    ` : ''}

                    ${isEdit ? `
                        <button type="button" onclick="window.printReceiptModal('${selectedBooking.id}', selectedBooking)"
                            class="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5">
                            <span class="material-icons text-sm">print</span> Pase
                        </button>
                    ` : ''}

                    <button type="button" onclick="window.startNewBookingFromScratch()"
                        class="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5" title="Limpiar y crear nuevo">
                        <span class="material-icons text-sm">add_circle_outline</span> Nuevo
                    </button>
                </div>
            </div>

            <!-- Form Body -->
            <form id="reception-pos-form" onsubmit="event.preventDefault();" class="space-y-6">
                
                <!-- Group & Time Metadata Strip -->
                <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                    <div class="sm:col-span-3 space-y-1">
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Horario de Salida *</label>
                        <select id="pos-time" onchange="window.handlePosTimeChange(this.value)"
                            class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                            ${DEFAULT_SLOTS.map(t => `<option value="${t}" ${t === timeVal ? 'selected' : ''}>${t} hrs</option>`).join('')}
                        </select>
                    </div>

                    <div class="sm:col-span-3 space-y-1">
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Hoyo de Salida (Tee)</label>
                        <select id="pos-starting-hole"
                            class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                            ${Array.from({ length: 18 }, (_, i) => i + 1).map(h => `
                                <option value="${h}" ${h === startingHole ? 'selected' : ''}>Hoyo ${h}${h === 1 ? ' (Tee Inicial)' : (h === 10 ? ' (Vuelta 2)' : '')}</option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="sm:col-span-3 space-y-1">
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono de Contacto</label>
                        <input id="pos-contact-phone" type="tel" value="${contactPhone}" placeholder="Ej. 312 123 4567"
                            class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-primary">
                    </div>

                    <div class="sm:col-span-3 space-y-1">
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Folio de Ticket</label>
                        <div class="px-3.5 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-black text-primary flex items-center justify-between">
                            <span>${folio}</span>
                            <span class="material-icons text-sm text-slate-600">confirmation_number</span>
                        </div>
                    </div>
                </div>

                <!-- Players Section -->
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <h4 class="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                                <span class="material-icons text-primary text-base">groups</span> Jugadores del Grupo (${currentPlayersForm.length})
                            </h4>
                            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Máximo 8 jugadores</span>
                        </div>

                        <button type="button" onclick="window.addPlayerToPOSForm()"
                            class="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md">
                            <span class="material-icons text-sm">person_add</span> + Agregar Jugador
                        </button>
                    </div>

                    <!-- Dynamic Player Cards List -->
                    <div id="pos-players-list" class="space-y-3">
                        ${currentPlayersForm.map((player, idx) => renderPlayerRowHTML(player, idx)).join('')}
                    </div>
                </div>

                <!-- Summary & Notes -->
                <div class="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <span class="material-icons text-sm text-slate-400">edit_note</span> Notas u Observaciones de la Salida
                        </label>
                        <input id="pos-notes" type="text" value="${notes}" placeholder="Ej. Palos rentados, cortesía aprobada por presidencia"
                            class="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-primary">
                    </div>

                    <!-- Live Total Calculation Bar with Method Breakdown -->
                    <div class="pt-4 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl">
                        <div class="space-y-2">
                            <div class="flex items-center gap-4 text-xs font-bold text-slate-400 flex-wrap">
                                <span>Green Fees: <strong id="pos-calc-greenfees" class="text-white font-black">$0</strong></span>
                                <span>Carritos: <strong id="pos-calc-carts" class="text-white font-black">$0</strong></span>
                                <span>Renta Equipo: <strong id="pos-calc-clubs" class="text-blue-400 font-black">$0</strong></span>
                            </div>
                            <!-- Live Breakdown by Payment Method -->
                            <div id="pos-calc-method-breakdown" class="flex items-center gap-2 flex-wrap text-xs">
                                <!-- Populated dynamically by recalculatePOSFormTotals -->
                            </div>
                        </div>

                        <div class="text-right shrink-0">
                            <p class="text-[10px] font-black uppercase text-primary tracking-widest">Total a Cobrar</p>
                            <h3 id="pos-calc-grand-total" class="text-3xl font-black text-emerald-400 leading-none mt-0.5">$0.00</h3>
                        </div>
                    </div>
                </div>

                <!-- Action Submit Buttons -->
                ${(() => {
                    const isAlreadyPaid = isEdit && (status === 'PAID' || status === 'ON_COURSE');
                    const isReservation = isEdit && status === 'RESERVED';
                    const isAdmin = isAdminUser();

                    if (isAlreadyPaid) {
                        return `
                            <div class="space-y-3 pt-2">
                                <div class="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs">
                                    <div class="flex items-center gap-2.5">
                                        <span class="w-8 h-8 rounded-xl ${status === 'ON_COURSE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'} flex items-center justify-center shrink-0">
                                            <span class="material-icons text-base">${status === 'ON_COURSE' ? 'sports_golf' : 'check_circle'}</span>
                                        </span>
                                        <div>
                                            <span class="font-black text-white uppercase">${status === 'ON_COURSE' ? '⛳ Salida en Campo' : '🔵 Salida Pagada & Autorizada'}</span>
                                            <p class="text-[10px] text-slate-400 font-bold">Esta salida ya cuenta con registro de pago en caja.</p>
                                        </div>
                                    </div>
                                    <span class="px-3 py-1 bg-emerald-500 text-slate-950 font-black text-[10px] rounded-lg uppercase">PAGADO</span>
                                </div>

                                <div class="grid grid-cols-1 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4">
                                    <button type="button" onclick="window.printReceiptModal('${selectedBooking.id}', selectedBooking)"
                                        class="py-4 bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg">
                                        <span class="material-icons text-primary text-base">print</span> 🖨️ Re-imprimir Pase
                                    </button>

                                    <button type="button" onclick="window.saveBookingAction('${status}')"
                                        class="py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/20 hover:scale-[1.01] active:scale-98">
                                        <span class="material-icons text-base">save</span> 💾 Guardar Cambios
                                    </button>

                                    ${isAdmin ? `
                                        <button type="button" onclick="window.cancelBooking('${selectedBooking.id}')"
                                            class="py-4 bg-rose-600/20 hover:bg-rose-600/30 border-2 border-rose-500/60 text-rose-300 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-500/10 hover:scale-[1.01] active:scale-98">
                                            <span class="material-icons text-base text-rose-400">delete_forever</span> 🗑️ Borrar Salida (Admin)
                                        </button>
                                    ` : ''}
                                </div>
                            </div>`;
                    } else if (isReservation) {
                        return `
                            <div class="grid grid-cols-1 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4 pt-2">
                                <button type="button" onclick="window.saveBookingAction('RESERVED')"
                                    class="py-4 bg-amber-500/20 hover:bg-amber-500/30 border-2 border-amber-500/50 text-amber-400 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/10">
                                    <span class="material-icons text-base">bookmark</span> 💾 Actualizar Reserva
                                </button>

                                <button type="button" onclick="window.saveBookingAction('PAID')"
                                    class="py-4 bg-primary hover:bg-primary/90 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-98">
                                    <span class="material-icons text-base">payments</span> 💳 Cobrar & Autorizar Salida
                                </button>

                                ${isAdmin ? `
                                    <button type="button" onclick="window.cancelBooking('${selectedBooking.id}')"
                                        class="py-4 bg-rose-600/20 hover:bg-rose-600/30 border-2 border-rose-500/60 text-rose-300 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-500/10 hover:scale-[1.01] active:scale-98">
                                        <span class="material-icons text-base text-rose-400">delete_forever</span> 🗑️ Borrar Reserva (Admin)
                                    </button>
                                ` : ''}
                            </div>`;
                    } else {
                        return `
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <button type="button" onclick="window.saveBookingAction('RESERVED')"
                                    class="py-4 bg-amber-500/20 hover:bg-amber-500/30 border-2 border-amber-500/50 text-amber-400 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/10">
                                    <span class="material-icons text-base">bookmark</span> Guardar Reserva Telefónica (Pendiente de Pago)
                                </button>

                                <button type="button" onclick="window.saveBookingAction('PAID')"
                                    class="py-4 bg-primary hover:bg-primary/90 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-98">
                                    <span class="material-icons text-base">payments</span> 💳 Cobrar & Autorizar Salida (Caddie Master)
                                </button>
                            </div>`;
                    }
                })()}

            </form>
        </div>
    `;

    recalculatePOSFormTotals();
}

function renderPlayerRowHTML(player, idx) {
    const isEdit = !!selectedBooking;
    const playerType = player.player_type || (player.is_member ? 'MEMBER' : (player.convenio_id ? 'CONVENIO' : 'GUEST'));
    const isMember = playerType === 'MEMBER';
    const isConvenio = playerType === 'CONVENIO';
    const isCortesia = playerType === 'CORTESIA' || player.payment_method === 'CORTESIA';
    const holes = player.holes || 18;
    const hasCart = !!player.has_cart;
    const hasClubs = !!player.has_clubs;
    const playerPaymentMethod = player.payment_method || (isCortesia ? 'CORTESIA' : 'EFECTIVO');

    // Selected member info if any
    const selectedMemberObj = isMember && player.member_id ? allMembers.find(m => String(m.id) === String(player.member_id)) : null;
    const todayStr = getLocalDateString();
    const memberIsPaid = selectedMemberObj ? (selectedMemberObj.paid_until && selectedMemberObj.paid_until >= todayStr && selectedMemberObj.status === 'ACTIVE') : true;

    // Fees calculation fallback - Tarifa plana sin importar si juegan 9 o 18 hoyos
    let defaultGF = currentPrices.greenFee18Guest;
    let defaultCart = hasCart ? currentPrices.cart18 : 0;
    let defaultClubs = hasClubs ? (currentPrices.clubRentalFee || 400) : 0;

    if (isCortesia || isMember) {
        defaultGF = 0;
        if (isConvenio) {
            const conv = currentConvenios.find(c => String(c.id) === String(player.convenio_id)) || currentConvenios[0];
            defaultCart = hasCart ? (parseFloat(conv.cart_fee_18) || currentPrices.cart18) : 0;
        } else {
            defaultCart = hasCart ? currentPrices.cart18 : 0;
        }
    } else if (isConvenio) {
        const conv = currentConvenios.find(c => String(c.id) === String(player.convenio_id)) || currentConvenios[0];
        if (conv) {
            defaultGF = parseFloat(conv.green_fee_18) || currentPrices.greenFee18Guest;
            if (hasCart) {
                defaultCart = parseFloat(conv.cart_fee_18) || currentPrices.cart18;
            }
        }
    } else {
        defaultGF = currentPrices.greenFee18Guest;
        defaultCart = hasCart ? currentPrices.cart18 : 0;
    }

    const greenFee = isCortesia ? 0 : (player.green_fee !== undefined ? player.green_fee : defaultGF);
    const cartFee = hasCart ? (player.cart_fee !== undefined ? player.cart_fee : defaultCart) : 0;
    const clubFee = hasClubs ? (player.club_fee !== undefined ? player.club_fee : defaultClubs) : 0;
    const playerSubtotal = (parseFloat(greenFee) || 0) + (parseFloat(cartFee) || 0) + (parseFloat(clubFee) || 0);

    player.green_fee = parseFloat(greenFee) || 0;
    player.cart_fee = parseFloat(cartFee) || 0;
    player.club_fee = parseFloat(clubFee) || 0;

    return `
        <div id="player-row-${player.id}" class="bg-slate-950/70 border ${isCortesia ? 'border-purple-500/50 shadow-lg shadow-purple-500/5' : isConvenio ? 'border-indigo-500/40' : isMember ? 'border-emerald-500/30' : 'border-slate-800'} rounded-2xl p-4 space-y-3 relative group transition-all">
            
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div class="flex flex-wrap items-center gap-2">
                    <span class="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-black text-white">
                        #${idx + 1}
                    </span>
                    <span class="text-xs font-black uppercase text-slate-300">Jugador ${idx + 1}</span>
                    
                    <!-- 4-Pill Switch: Invitado | Socio | Convenio | Cortesía -->
                    <div class="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-[10px] font-black flex-wrap gap-0.5">
                        <button type="button" onclick="window.setPlayerType('${player.id}', 'GUEST')"
                            class="px-2.5 py-1 rounded-lg transition-all ${playerType === 'GUEST' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-white'}">
                            No Socio / Invitado
                        </button>
                        <button type="button" onclick="window.setPlayerType('${player.id}', 'MEMBER')"
                            class="px-2.5 py-1 rounded-lg transition-all ${playerType === 'MEMBER' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}">
                            Socio del Club
                        </button>
                        <button type="button" onclick="window.setPlayerType('${player.id}', 'CONVENIO')"
                            class="px-2.5 py-1 rounded-lg transition-all ${playerType === 'CONVENIO' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}">
                            🤝 Convenio
                        </button>
                        <button type="button" onclick="window.setPlayerType('${player.id}', 'CORTESIA')"
                            class="px-2.5 py-1 rounded-lg transition-all ${playerType === 'CORTESIA' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-slate-400 hover:text-white'}">
                            ⛳ Cortesía Directiva
                        </button>
                    </div>
                </div>

                ${currentPlayersForm.length > 1 ? `
                    <button type="button" onclick="window.removePlayerFromPOSForm('${player.id}')"
                        class="text-rose-400 hover:text-rose-300 text-xs font-black uppercase flex items-center gap-1 self-end sm:self-auto transition-colors" title="Eliminar Jugador">
                        <span class="material-icons text-sm">remove_circle_outline</span> Quitar
                    </button>
                ` : ''}
            </div>

            <!-- Player Inputs Grid (12 cols) -->
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                
                <!-- Player Name / Selector (sm:col-span-6) -->
                <div class="sm:col-span-6">
                    ${isMember ? `
                        <div>
                            <div class="flex items-center justify-between mb-1.5 h-3.5">
                                <label class="block text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none">Nombre del Socio *</label>
                                ${selectedMemberObj ? `
                                    <span class="text-[9px] font-bold ${memberIsPaid ? 'text-emerald-400' : 'text-rose-400'} leading-none">
                                        ${memberIsPaid ? '✅ Cuota al Día' : '⚠️ Cuota Vencida'}
                                    </span>
                                ` : ''}
                            </div>
                            <div class="relative">
                                <input type="text"
                                    id="member-input-${player.id}"
                                    list="members-autocomplete-list"
                                    value="${escapeHtml(selectedMemberObj ? selectedMemberObj.name : (player.name || ''))}"
                                    placeholder="Escribe el nombre del socio..."
                                    autocomplete="off"
                                    oninput="window.onMemberTyped('${player.id}', this.value)"
                                    onchange="window.onMemberSearchChange('${player.id}', this.value)"
                                    class="w-full h-11 px-3.5 bg-slate-900 border ${selectedMemberObj ? 'border-emerald-500/60 text-emerald-300' : 'border-slate-700 text-white'} rounded-xl text-xs font-black uppercase placeholder:normal-case placeholder:text-slate-500 focus:outline-none focus:border-primary pr-8">
                                ${selectedMemberObj ? `
                                    <button type="button" onclick="window.clearSelectedMember('${player.id}')"
                                        class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-400 text-xs font-black transition-colors" title="Cambiar socio">
                                        <span class="material-icons text-sm">close</span>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    ` : isConvenio ? `
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                                <label class="block text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 h-3.5 leading-none">Convenio *</label>
                                <select onchange="window.onPlayerConvenioSelected('${player.id}', this.value)"
                                    class="w-full h-11 px-2.5 bg-slate-900 border border-indigo-500/40 rounded-xl text-xs font-black text-white focus:outline-none focus:border-indigo-400">
                                    ${currentConvenios.map(c => `
                                        <option value="${c.id}" ${(player.convenio_id === c.id || player.convenio_name === c.name) ? 'selected' : ''}>
                                            ${c.name}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 h-3.5 leading-none">Nombre Jugador *</label>
                                <input type="text" value="${escapeHtml(player.name || '')}" placeholder="Ej. Carlos Mendoza"
                                    oninput="window.onPlayerNameInput('${player.id}', this.value)"
                                    class="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-primary">
                            </div>
                        </div>
                    ` : isCortesia ? `
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                                <label class="block text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1.5 h-3.5 leading-none">Beneficiario *</label>
                                <input type="text" value="${escapeHtml(player.name || '')}" placeholder="Ej. Lic. Manuel Mendoza"
                                    oninput="window.onPlayerNameInput('${player.id}', this.value)"
                                    class="w-full h-11 px-3 bg-slate-900 border border-purple-500/40 rounded-xl text-xs font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-400">
                            </div>
                            <div>
                                <label class="block text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1.5 h-3.5 leading-none flex items-center gap-1">
                                    <span class="material-icons text-xs">verified_user</span> ¿Quién Autoriza? *
                                </label>
                                <input type="text" value="${escapeHtml(player.authorized_by || '')}" placeholder="Ej. Presidencia"
                                    oninput="window.onPlayerAuthorizedByInput('${player.id}', this.value)"
                                    class="w-full h-11 px-3 bg-slate-900 border border-amber-500/50 rounded-xl text-xs font-black text-amber-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-400">
                            </div>
                        </div>
                    ` : `
                        <div>
                            <label class="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 h-3.5 leading-none">Nombre Completo del Invitado *</label>
                            <input type="text" value="${escapeHtml(player.name || '')}" placeholder="Ej. Carlos Mendoza"
                                oninput="window.onPlayerNameInput('${player.id}', this.value)"
                                class="w-full h-11 px-3.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-primary">
                        </div>
                    `}
                </div>

                <!-- Hoyos: 18 vs 9 (sm:col-span-2) -->
                <div class="sm:col-span-2">
                    <label class="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 h-3.5 leading-none">Hoyos</label>
                    <select onchange="window.onPlayerHolesChange('${player.id}', parseInt(this.value))"
                        class="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary cursor-pointer">
                        <option value="18" ${holes === 18 ? 'selected' : ''}>18 Hoyos</option>
                        <option value="9" ${holes === 9 ? 'selected' : ''}>9 Hoyos</option>
                    </select>
                </div>

                <!-- Rentas Adicionales: Carrito (sm:col-span-2) -->
                <div class="sm:col-span-2">
                    <label class="block text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1.5 h-3.5 leading-none">Carrito</label>
                    <label class="flex items-center justify-center gap-2 w-full h-11 px-3 bg-slate-900 border ${hasCart ? 'border-amber-500/60 bg-amber-950/20 text-amber-300 shadow-sm shadow-amber-500/10' : 'border-slate-700 text-slate-400 hover:border-slate-600'} rounded-xl cursor-pointer transition-all select-none">
                        <input type="checkbox" ${hasCart ? 'checked' : ''} onchange="window.onPlayerCartToggle('${player.id}', this.checked)"
                            class="rounded text-amber-500 focus:ring-0 focus:outline-none w-4 h-4 bg-slate-800 border-slate-700 cursor-pointer">
                        <span class="text-xs font-black uppercase tracking-wider">🚗 Carro</span>
                    </label>
                </div>

                <!-- Rentas Adicionales: Palos / Equipo (sm:col-span-2) -->
                <div class="sm:col-span-2">
                    <label class="block text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1.5 h-3.5 leading-none">Equipo</label>
                    <label class="flex items-center justify-center gap-2 w-full h-11 px-3 bg-slate-900 border ${hasClubs ? 'border-blue-500/60 bg-blue-950/20 text-blue-300 shadow-sm shadow-blue-500/10' : 'border-slate-700 text-slate-400 hover:border-blue-500/40'} rounded-xl cursor-pointer transition-all select-none">
                        <input type="checkbox" ${hasClubs ? 'checked' : ''} onchange="window.onPlayerClubToggle('${player.id}', this.checked)"
                            class="rounded text-blue-500 focus:ring-0 focus:outline-none w-4 h-4 bg-slate-800 border-slate-700 cursor-pointer">
                        <span class="text-xs font-black uppercase tracking-wider">🏌️ Palos</span>
                    </label>
                </div>

            </div>

            <!-- Individual Player Payment Method Row -->
            <div class="pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900/30 p-2.5 rounded-xl">
                <div class="flex items-center gap-2 flex-wrap">
                    ${isMember ? `
                        <div class="flex items-center gap-2">
                            <span class="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                                <span class="material-icons text-sm">badge</span> Socio del Club
                            </span>
                            ${(hasCart || hasClubs) ? `
                                <span class="text-[9px] text-amber-400 font-bold uppercase tracking-wider">
                                    Paga adicionales: ${hasCart ? '🚗 Carro ($' + cartFee + ')' : ''} ${hasClubs ? '🏌️ Equipo ($' + clubFee + ')' : ''}
                                </span>
                            ` : ''}
                        </div>
                    ` : isCortesia ? `
                        <div class="flex items-center gap-2">
                            <span class="px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-300 font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                                <span class="material-icons text-sm">flag</span> Cortesía Directiva (Exento)
                            </span>
                        </div>
                    ` : `
                        <label class="text-[9px] font-black text-slate-400 uppercase tracking-wider">Forma de Pago Jugador #${idx + 1}:</label>
                        <select onchange="window.onPlayerPaymentMethodChange('${player.id}', this.value)"
                            class="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-black text-white focus:outline-none focus:border-primary">
                            <option value="EFECTIVO" ${playerPaymentMethod === 'EFECTIVO' ? 'selected' : ''}>💵 Efectivo</option>
                            <option value="TARJETA" ${playerPaymentMethod === 'TARJETA' ? 'selected' : ''}>💳 Tarjeta (TPV)</option>
                            <option value="TRANSFERENCIA" ${playerPaymentMethod === 'TRANSFERENCIA' ? 'selected' : ''}>📲 Transferencia SPEI</option>
                        </select>

                        ${(playerPaymentMethod === 'TARJETA' || playerPaymentMethod === 'TRANSFERENCIA') ? `
                            <input type="text" value="${escapeHtml(player.transaction_ref || '')}"
                                placeholder="${playerPaymentMethod === 'TRANSFERENCIA' ? '# Folio SPEI' : '# Ref / Aprobación TPV'}"
                                oninput="window.onPlayerTransactionRefInput('${player.id}', this.value)"
                                class="px-2.5 py-1 bg-slate-900 border border-blue-500/50 rounded-lg text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400 w-40 animate-fade-in">
                        ` : ''}
                    `}
                </div>

                <div class="text-right flex items-center justify-end gap-2 sm:self-center">
                    <span class="text-[10px] text-slate-400 font-bold uppercase">Subtotal Jugador #${idx + 1}:</span>
                    <span class="text-sm font-black ${isCortesia && !hasCart && !hasClubs ? 'text-purple-400' : isMember && !hasCart && !hasClubs ? 'text-emerald-400' : 'text-emerald-400'}">
                        $${playerSubtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

        </div>
    `;
}

// Player form manipulation
window.addPlayerToPOSForm = function() {
    if (currentPlayersForm.length >= 8) {
        window.showNotification('Límite de Jugadores', 'Un grupo puede tener un máximo de 8 jugadores en un solo recibo.', 'error');
        return;
    }
    currentPlayersForm.push(createDefaultPlayer(currentPlayersForm.length + 1));
    renderPOSCard();
};

window.removePlayerFromPOSForm = function(playerId) {
    if (currentPlayersForm.length <= 1) return;
    currentPlayersForm = currentPlayersForm.filter(p => p.id !== playerId);
    renderPOSCard();
};

window.setPlayerType = function(playerId, type) {
    const p = currentPlayersForm.find(x => x.id === playerId);
    if (!p) return;
    
    // Normalizar type si viene como booleano legacy
    if (type === true) type = 'MEMBER';
    if (type === false) type = 'GUEST';

    p.player_type = type;
    p.is_member = (type === 'MEMBER');

    if (type === 'MEMBER') {
        p.convenio_id = null;
        p.convenio_name = '';
        p.green_fee = 0;
        p.payment_method = 'SOCIO';
        p.cart_fee = p.has_cart ? currentPrices.cart18 : 0;
        p.club_fee = p.has_clubs ? (currentPrices.clubRentalFee || 400) : 0;
    } else if (type === 'CONVENIO') {
        p.member_id = null;
        p.member_number = '';
        p.payment_method = p.payment_method === 'CORTESIA' ? 'EFECTIVO' : (p.payment_method || 'EFECTIVO');
        const conv = currentConvenios[0];
        if (conv) {
            p.convenio_id = conv.id;
            p.convenio_name = conv.name;
            p.green_fee = parseFloat(conv.green_fee_18) || currentPrices.greenFee18Guest;
            p.cart_fee = p.has_cart ? (parseFloat(conv.cart_fee_18) || currentPrices.cart18) : 0;
        } else {
            p.green_fee = currentPrices.greenFee18Guest;
            p.cart_fee = p.has_cart ? currentPrices.cart18 : 0;
        }
        p.club_fee = p.has_clubs ? (currentPrices.clubRentalFee || 400) : 0;
    } else if (type === 'CORTESIA') {
        p.member_id = null;
        p.member_number = '';
        p.convenio_id = null;
        p.convenio_name = '';
        p.green_fee = 0;
        p.payment_method = 'CORTESIA';
        p.cart_fee = p.has_cart ? currentPrices.cart18 : 0;
        p.club_fee = p.has_clubs ? (currentPrices.clubRentalFee || 400) : 0;
    } else { // GUEST
        p.member_id = null;
        p.member_number = '';
        p.convenio_id = null;
        p.convenio_name = '';
        p.payment_method = p.payment_method === 'CORTESIA' ? 'EFECTIVO' : (p.payment_method || 'EFECTIVO');
        p.green_fee = currentPrices.greenFee18Guest;
        p.cart_fee = p.has_cart ? currentPrices.cart18 : 0;
        p.club_fee = p.has_clubs ? (currentPrices.clubRentalFee || 400) : 0;
    }
    renderPOSCard();
};

window.onPlayerPaymentMethodChange = function(playerId, method) {
    const p = currentPlayersForm.find(x => x.id === playerId);
    if (!p) return;
    p.payment_method = method;
    if (method === 'CORTESIA') {
        p.green_fee = 0;
        p.player_type = 'CORTESIA';
    } else if (p.player_type === 'CORTESIA') {
        p.player_type = 'GUEST';
        p.green_fee = currentPrices.greenFee18Guest;
    }
    renderPOSCard();
};

window.onPlayerTransactionRefInput = function(playerId, val) {
    const p = currentPlayersForm.find(x => x.id === playerId);
    if (p) p.transaction_ref = val;
};

window.onPlayerAuthorizedByInput = function(playerId, val) {
    const p = currentPlayersForm.find(x => x.id === playerId);
    if (p) p.authorized_by = val;
};

window.applyGlobalPaymentMethod = function(method) {
    window._posPaymentMethod = method;
    if (method !== 'MIXTO') {
        currentPlayersForm.forEach(p => {
            if (p.player_type === 'MEMBER' || p.is_member) {
                p.payment_method = 'SOCIO';
                return;
            }
            p.payment_method = method;
            if (method === 'CORTESIA') {
                p.green_fee = 0;
                p.player_type = 'CORTESIA';
            } else if (p.player_type === 'CORTESIA') {
                p.player_type = 'GUEST';
                p.green_fee = currentPrices.greenFee18Guest;
            }
        });
    }
    renderPOSCard();
};

window.onPlayerConvenioSelected = function(playerId, convenioId) {
    const p = currentPlayersForm.find(x => x.id === playerId);
    if (!p) return;
    const conv = currentConvenios.find(c => String(c.id) === String(convenioId));
    if (conv) {
        p.convenio_id = conv.id;
        p.convenio_name = conv.name;
        p.green_fee = parseFloat(conv.green_fee_18) || currentPrices.greenFee18Guest;
        if (p.has_cart) {
            p.cart_fee = parseFloat(conv.cart_fee_18) || currentPrices.cart18;
        }
    }
    renderPOSCard();
};

window.onMemberSelected = function(playerId, memberId) {
    const p = currentPlayersForm.find(x => x.id === playerId);
    if (!p) return;
    const member = allMembers.find(m => String(m.id) === String(memberId));
    if (member) {
        p.member_id = member.id;
        p.member_number = member.member_number;
        p.name = member.name;
        p.green_fee = 0;
    } else {
        p.member_id = null;
        p.member_number = '';
        p.name = '';
        p.green_fee = 0;
    }
    renderPOSCard();
};

window.onMemberTyped = function(playerId, val) {
    const p = currentPlayersForm.find(x => x.id === playerId);
    if (!p) return;
    p.name = val;
    const trimmed = (val || '').trim().toLowerCase();
    if (!trimmed) {
        p.member_id = null;
        p.member_number = '';
        return;
    }
    const match = allMembers.find(m => (m.name || '').toLowerCase() === trimmed);
    if (match) {
        p.member_id = match.id;
        p.member_number = match.member_number;
        p.name = match.name;
        p.green_fee = 0;
        renderPOSCard();
    }
};

window.onMemberSearchChange = function(playerId, val) {
    const p = currentPlayersForm.find(x => x.id === playerId);
    if (!p) return;
    const trimmed = (val || '').trim().toLowerCase();
    if (!trimmed) {
        p.member_id = null;
        p.member_number = '';
        p.name = '';
        renderPOSCard();
        return;
    }
    const match = allMembers.find(m => (m.name || '').toLowerCase() === trimmed) 
               || allMembers.find(m => (m.name || '').toLowerCase().includes(trimmed));
    if (match) {
        p.member_id = match.id;
        p.member_number = match.member_number;
        p.name = match.name;
        p.green_fee = 0;
    } else {
        p.member_id = null;
        p.member_number = '';
        p.name = val;
    }
    renderPOSCard();
};

window.clearSelectedMember = function(playerId) {
    const p = currentPlayersForm.find(x => x.id === playerId);
    if (p) {
        p.member_id = null;
        p.member_number = '';
        p.name = '';
        renderPOSCard();
        setTimeout(() => {
            document.getElementById(`member-input-${playerId}`)?.focus();
        }, 50);
    }
};

window.onPlayerNameInput = function(playerId, val) {
    const p = currentPlayersForm.find(x => x.id === playerId);
    if (p) p.name = val;
};

window.onPlayerHolesChange = function(playerId, holes) {
    const p = currentPlayersForm.find(x => x.id === playerId);
    if (!p) return;
    p.holes = holes;
    // Tarifa única: se cobra lo mismo 18 o 9 hoyos. Mantenemos 'holes' para control del Caddie Master.
    renderPOSCard();
};

window.onPlayerCartToggle = function(playerId, checked) {
    const p = currentPlayersForm.find(x => x.id === playerId);
    if (!p) return;
    p.has_cart = checked;
    
    if (checked) {
        if (p.player_type === 'CONVENIO') {
            const conv = currentConvenios.find(c => String(c.id) === String(p.convenio_id)) || currentConvenios[0];
            p.cart_fee = conv ? (parseFloat(conv.cart_fee_18) || currentPrices.cart18) : currentPrices.cart18;
        } else {
            p.cart_fee = currentPrices.cart18;
        }
    } else {
        p.cart_fee = 0;
    }
    renderPOSCard();
};

window.onPlayerClubToggle = function(playerId, checked) {
    const p = currentPlayersForm.find(x => x.id === playerId);
    if (!p) return;
    p.has_clubs = checked;
    p.club_fee = checked ? (currentPrices.clubRentalFee || 400) : 0;
    renderPOSCard();
};

window.onPlayerGreenFeeInput = function(playerId, val) {
    const p = currentPlayersForm.find(x => x.id === playerId);
    if (p) {
        p.green_fee = val;
        recalculatePOSFormTotals();
    }
};

window.onPlayerCartFeeInput = function(playerId, val) {
    const p = currentPlayersForm.find(x => x.id === playerId);
    if (p) {
        p.cart_fee = val;
        recalculatePOSFormTotals();
    }
};

window.onPlayerClubFeeInput = function(playerId, val) {
    const p = currentPlayersForm.find(x => x.id === playerId);
    if (p) {
        p.club_fee = val;
        recalculatePOSFormTotals();
    }
};

function recalculatePOSFormTotals() {
    let sumGreenFees = 0;
    let sumCarts = 0;
    let sumClubs = 0;
    const totalsByMethod = {
        EFECTIVO: 0,
        TARJETA: 0,
        TRANSFERENCIA: 0,
        CORTESIA: 0
    };
    let cortesiaPlayerCount = 0;
    let memberPlayerCount = 0;

    currentPlayersForm.forEach(p => {
        const gf = parseFloat(p.green_fee || 0);
        const cf = parseFloat(p.cart_fee || 0);
        const clubF = parseFloat(p.club_fee || 0);
        const pTotal = gf + cf + clubF;
        const pMethod = p.payment_method || (p.player_type === 'CORTESIA' ? 'CORTESIA' : (p.player_type === 'MEMBER' ? 'SOCIO' : 'EFECTIVO'));

        sumGreenFees += gf;
        sumCarts += cf;
        sumClubs += clubF;

        if (p.player_type === 'MEMBER' || p.is_member || pMethod === 'SOCIO') {
            memberPlayerCount++;
            if ((cf + clubF) > 0) {
                totalsByMethod.EFECTIVO += (cf + clubF);
            }
        } else if (totalsByMethod[pMethod] !== undefined) {
            totalsByMethod[pMethod] += pTotal;
        } else {
            totalsByMethod.EFECTIVO += pTotal;
        }

        if (pMethod === 'CORTESIA' || p.player_type === 'CORTESIA') {
            cortesiaPlayerCount++;
        }
    });

    const grandTotal = sumGreenFees + sumCarts + sumClubs;

    const elGf = document.getElementById('pos-calc-greenfees');
    const elCarts = document.getElementById('pos-calc-carts');
    const elClubs = document.getElementById('pos-calc-clubs');
    const elTotal = document.getElementById('pos-calc-grand-total');
    const elBreakdown = document.getElementById('pos-calc-method-breakdown');

    if (elGf) elGf.textContent = `$${sumGreenFees.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    if (elCarts) elCarts.textContent = `$${sumCarts.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    if (elClubs) elClubs.textContent = `$${sumClubs.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    if (elTotal) elTotal.textContent = `$${grandTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

    if (elBreakdown) {
        const items = [];
        if (totalsByMethod.EFECTIVO > 0) items.push(`<span class="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold">💵 Efectivo: <strong>$${totalsByMethod.EFECTIVO.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></span>`);
        if (totalsByMethod.TARJETA > 0) items.push(`<span class="px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400 font-bold">💳 Tarjeta: <strong>$${totalsByMethod.TARJETA.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></span>`);
        if (totalsByMethod.TRANSFERENCIA > 0) items.push(`<span class="px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400 font-bold">📲 SPEI: <strong>$${totalsByMethod.TRANSFERENCIA.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></span>`);
        if (memberPlayerCount > 0) items.push(`<span class="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 font-bold">🟢 Socios: <strong>${memberPlayerCount} Jugador${memberPlayerCount > 1 ? 'es' : ''}</strong></span>`);
        if (cortesiaPlayerCount > 0) items.push(`<span class="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-300 font-bold">⛳ Cortesías: <strong>${cortesiaPlayerCount} Jugador${cortesiaPlayerCount > 1 ? 'es' : ''} ($0)</strong></span>`);

        elBreakdown.innerHTML = items.length > 0 ? items.join(' ') : '<span class="text-slate-500 font-bold text-[10px]">Sin cobro pendiente</span>';
    }
}

// Save or Authorize Booking
window.saveBookingAction = async function(targetStatus) {
    const timeVal = document.getElementById('pos-time')?.value || '08:00';
    const startingHole = parseInt(document.getElementById('pos-starting-hole')?.value) || 1;
    const contactPhone = document.getElementById('pos-contact-phone')?.value.trim() || '';
    const paymentMethodSelect = document.getElementById('pos-payment-method')?.value || 'EFECTIVO';
    const notes = document.getElementById('pos-notes')?.value.trim() || '';

    // Validate players
    if (!currentPlayersForm || currentPlayersForm.length === 0) {
        window.showNotification('Datos Requeridos', 'Agrega al menos un jugador al registro.', 'error');
        return;
    }

    for (let i = 0; i < currentPlayersForm.length; i++) {
        const p = currentPlayersForm[i];
        if (!p.name || p.name.trim() === '') {
            window.showNotification('Nombre Requerido', `Ingresa el nombre del Jugador #${i + 1}.`, 'error');
            return;
        }
    }

    const contactName = currentPlayersForm[0].name;
    const totalPlayers = currentPlayersForm.length;
    const totalCarts = currentPlayersForm.filter(p => p.has_cart).length;
    const totalClubs = currentPlayersForm.filter(p => p.has_clubs).length;
    let greenFeeTotal = 0;
    let cartFeeTotal = 0;
    let clubRentalTotal = 0;

    currentPlayersForm.forEach(p => {
        greenFeeTotal += parseFloat(p.green_fee || 0);
        cartFeeTotal += parseFloat(p.cart_fee || 0);
        clubRentalTotal += parseFloat(p.club_fee || 0);
    });

    const totalAmount = greenFeeTotal + cartFeeTotal + clubRentalTotal;
    const groupType = totalPlayers === 1 ? 'INDIVIDUAL' : (totalPlayers === 2 ? 'PAREJA' : (totalPlayers <= 4 ? 'FOURSOME' : 'GRUPO'));
    const isEdit = !!selectedBooking;
    const wasAlreadyPaid = isEdit && (selectedBooking.status === 'PAID' || selectedBooking.status === 'ON_COURSE');
    const finalStatus = wasAlreadyPaid ? selectedBooking.status : targetStatus;
    const finalPaidAt = wasAlreadyPaid ? (selectedBooking.paid_at || new Date().toISOString()) : (targetStatus === 'PAID' ? new Date().toISOString() : null);
    const folio = isEdit ? selectedBooking.folio : generateFolio(selectedDate);

    // If all paying players have the same payment method, use that; otherwise 'MIXTO'
    const payingPlayers = currentPlayersForm.filter(p => (parseFloat(p.green_fee || 0) + parseFloat(p.cart_fee || 0) + parseFloat(p.club_fee || 0)) > 0);
    let finalPaymentMethod = 'EFECTIVO';
    if (payingPlayers.length > 0) {
        const distinctPayingMethods = [...new Set(payingPlayers.map(p => p.payment_method || 'EFECTIVO'))];
        finalPaymentMethod = distinctPayingMethods.length === 1 ? distinctPayingMethods[0] : 'MIXTO';
    } else {
        const hasCortesia = currentPlayersForm.some(p => p.player_type === 'CORTESIA' || p.payment_method === 'CORTESIA');
        finalPaymentMethod = hasCortesia ? 'CORTESIA' : 'SOCIO';
    }

    const authorizerNames = currentPlayersForm
        .filter(p => p.player_type === 'CORTESIA' || p.payment_method === 'CORTESIA')
        .map(p => p.authorized_by)
        .filter(Boolean);
    const authorizedByStr = authorizerNames.length > 0 ? [...new Set(authorizerNames)].join(', ') : null;

    const payload = {
        folio: folio,
        booking_date: selectedDate,
        booking_time: timeVal,
        contact_name: contactName,
        contact_phone: contactPhone,
        group_type: groupType,
        players: currentPlayersForm,
        total_players: totalPlayers,
        total_holes: currentPlayersForm[0]?.holes || 18,
        total_carts: totalCarts,
        total_club_rentals: totalClubs,
        green_fee_total: greenFeeTotal,
        cart_fee_total: cartFeeTotal,
        club_rental_total: clubRentalTotal,
        total_amount: totalAmount,
        payment_method: finalPaymentMethod,
        authorized_by: authorizedByStr,
        transaction_ref: currentPlayersForm.map(p => p.transaction_ref).filter(Boolean).join(', ') || null,
        status: finalStatus,
        starting_hole: startingHole,
        notes: notes,
        paid_at: finalPaidAt,
        updated_at: new Date().toISOString()
    };

    // Helper for gracefully stripping columns if SQL migration hasn't been executed yet
    const sanitizePayload = (pl) => {
        const copy = { ...pl };
        delete copy.authorized_by;
        delete copy.club_rental_total;
        delete copy.total_club_rentals;
        return copy;
    };

    try {
        let savedBooking = null;

        if (isEdit) {
            let { data, error } = await db.from('tee_times').update(payload).eq('id', selectedBooking.id).select().single();
            if (error && error.message && (error.message.includes('authorized_by') || error.message.includes('club_rental_total') || error.message.includes('total_club_rentals'))) {
                const res2 = await db.from('tee_times').update(sanitizePayload(payload)).eq('id', selectedBooking.id).select().single();
                data = res2.data;
                error = res2.error;
            }
            if (!error && data) {
                savedBooking = data;
            } else {
                // Fallback to local storage update
                savedBooking = updateLocalBooking(selectedBooking.id, payload);
            }
        } else {
            let { data, error } = await db.from('tee_times').insert([payload]).select().single();
            if (error && error.message && (error.message.includes('authorized_by') || error.message.includes('club_rental_total') || error.message.includes('total_club_rentals'))) {
                const res2 = await db.from('tee_times').insert([sanitizePayload(payload)]).select().single();
                data = res2.data;
                error = res2.error;
            }
            if (!error && data) {
                savedBooking = data;
            } else {
                // Fallback to local storage insert
                payload.id = 'tt_' + Math.random().toString(36).substr(2, 9);
                payload.created_at = new Date().toISOString();
                savedBooking = insertLocalBooking(payload);
            }
        }

        // Realtime Broadcast Alert to Caddie Master
        try {
            localStorage.setItem('cgc_caddie_alert_sync', JSON.stringify({
                timestamp: Date.now(),
                type: finalStatus,
                booking_id: savedBooking.id,
                folio: savedBooking.folio,
                contact_name: savedBooking.contact_name,
                total_players: savedBooking.total_players
            }));
        } catch (e) {}

        selectedBooking = savedBooking;
        await loadDayBookings();

        if (wasAlreadyPaid) {
            window.showNotification(
                '¡Cambios Guardados!',
                `Se actualizaron los datos de la salida de ${contactName} (Folio: ${folio}).`,
                'success'
            );
        } else if (targetStatus === 'PAID') {
            // Abre recibo DESPUÉS de loadDayBookings, pasando el objeto directo
            window.printReceiptModal(savedBooking.id, savedBooking);
            window.showNotification(
                '¡Salida Autorizada & Pagada!',
                `Se autorizó la salida para el grupo de ${contactName} (Folio: ${folio}). El Caddie Master ya tiene la alerta en su pantalla.`,
                'success'
            );
        } else {
            window.showNotification(
                '¡Reserva Guardada!',
                `Reserva telefónica registrada para las ${timeVal} hrs a nombre de ${contactName}.`,
                'success'
            );
        }

    } catch (err) {
        console.error('Error saving booking:', err);
        window.showNotification('Error', 'No se pudo guardar la información: ' + err.message, 'error');
    }
};

window.cancelBooking = function(bookingId) {
    const booking = dayTeeTimes.find(b => String(b.id) === String(bookingId)) || (selectedBooking && String(selectedBooking.id) === String(bookingId) ? selectedBooking : null);
    if (!booking) return;

    window.showNotification(
        'Eliminar / Liberar Salida',
        `¿Confirmas que deseas eliminar permanentemente la salida ${booking.folio} (${booking.contact_name}) y liberar el horario de las ${booking.booking_time} hrs? (Solo Administrador)`,
        'confirm',
        async () => {
            try {
                const { error } = await db.from('tee_times').delete().eq('id', booking.id);
                deleteLocalBooking(booking.id);

                // Notificar en tiempo real a Caddie Master para que lo retire de pantalla
                try {
                    localStorage.setItem('cgc_caddie_alert_sync', JSON.stringify({
                        timestamp: Date.now(),
                        type: 'CANCELLED',
                        booking_id: booking.id,
                        folio: booking.folio
                    }));
                    window.dispatchEvent(new StorageEvent('storage', { key: 'cgc_caddie_alert_sync' }));
                } catch (e) {}

                window.showNotification('Salida Eliminada', `La salida ${booking.folio} ha sido eliminada y el horario de las ${booking.booking_time} hrs quedó disponible.`, 'success');
                selectedBooking = null;
                initNewBookingForm(booking.booking_time || '08:00');
                await loadDayBookings();
            } catch (e) {
                console.error('Error al eliminar salida:', e);
                deleteLocalBooking(booking.id);
                selectedBooking = null;
                initNewBookingForm('08:00');
                await loadDayBookings();
            }
        }
    );
};

// =========================================================================
// CORTE DE CAJA & FINANCIAL REPORT
// =========================================================================
function renderCorteView() {
    const summaryContainer = document.getElementById('corte-financial-summary');
    const tableContainer = document.getElementById('corte-table-container');
    if (!summaryContainer || !tableContainer) return;

    let totalEfectivo = 0;
    let totalTarjeta = 0;
    let totalSpei = 0;
    let totalCargoSocio = 0;
    let totalCortesia = 0;
    let grandTotal = 0;

    const paidBookings = dayTeeTimes.filter(b => b.status === 'PAID' || b.status === 'ON_COURSE' || b.status === 'COMPLETED');

    paidBookings.forEach(b => {
        const amt = parseFloat(b.total_amount || 0);
        grandTotal += amt;

        if (Array.isArray(b.players) && b.players.length > 0 && b.players.some(p => p.payment_method)) {
            b.players.forEach(p => {
                const pAmt = (parseFloat(p.green_fee || 0) + parseFloat(p.cart_fee || 0));
                const pm = p.payment_method || b.payment_method || 'EFECTIVO';
                if (pm === 'EFECTIVO') totalEfectivo += pAmt;
                else if (pm === 'TARJETA') totalTarjeta += pAmt;
                else if (pm === 'TRANSFERENCIA') totalSpei += pAmt;
                else if (pm === 'CARGO_SOCIO') totalCargoSocio += pAmt;
                else if (pm === 'CORTESIA') totalCortesia += pAmt;
            });
        } else {
            if (b.payment_method === 'EFECTIVO') totalEfectivo += amt;
            else if (b.payment_method === 'TARJETA') totalTarjeta += amt;
            else if (b.payment_method === 'TRANSFERENCIA') totalSpei += amt;
            else if (b.payment_method === 'CARGO_SOCIO') totalCargoSocio += amt;
            else if (b.payment_method === 'CORTESIA') totalCortesia += amt;
        }
    });

    summaryContainer.innerHTML = `
        <div class="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">💵 Efectivo en Caja</p>
            <h4 class="text-xl font-black text-white mt-1">$${totalEfectivo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h4>
        </div>
        <div class="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">💳 Tarjeta / TPV</p>
            <h4 class="text-xl font-black text-white mt-1">$${totalTarjeta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h4>
        </div>
        <div class="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">📲 SPEI / Transferencia</p>
            <h4 class="text-xl font-black text-white mt-1">$${totalSpei.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h4>
        </div>
        <div class="bg-slate-950/70 border border-primary/40 bg-primary/5 rounded-2xl p-4">
            <p class="text-[10px] font-black text-primary uppercase tracking-widest">💰 Total Cobrado</p>
            <h4 class="text-2xl font-black text-emerald-400 mt-1">$${grandTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h4>
        </div>
    `;

    if (paidBookings.length === 0) {
        tableContainer.innerHTML = `
            <div class="py-12 text-center bg-slate-950/40 border border-slate-800 rounded-2xl">
                <span class="material-icons text-slate-600 text-4xl mb-2">point_of_sale</span>
                <p class="text-xs text-slate-500 font-bold uppercase tracking-wider">Aún no hay cobros registrados el día de hoy.</p>
            </div>`;
        return;
    }

    tableContainer.innerHTML = `
        <div class="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table class="w-full text-left border-collapse text-xs">
                <thead>
                    <tr class="bg-slate-900 border-b border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        <th class="px-5 py-3.5">Folio / Hora</th>
                        <th class="px-5 py-3.5">Titular / Foursome</th>
                        <th class="px-5 py-3.5 text-center">Jugadores</th>
                        <th class="px-5 py-3.5 text-center">Carros</th>
                        <th class="px-5 py-3.5">Forma de Pago</th>
                        <th class="px-5 py-3.5 text-right">Monto Total</th>
                        <th class="px-5 py-3.5 text-right">Ticket</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                    ${paidBookings.map(b => {
                        const total = parseFloat(b.total_amount || 0);
                        const playerNames = Array.isArray(b.players) ? b.players.map(p => p.name).join(', ') : b.contact_name;
                        const methodBadge = b.payment_method === 'MIXTO' 
                            ? '<span class="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-black">🔀 Pago Mixto</span>'
                            : b.payment_method === 'TARJETA'
                            ? '<span class="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg text-[10px] font-black">💳 Tarjeta TPV</span>'
                            : b.payment_method === 'TRANSFERENCIA'
                            ? '<span class="px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-lg text-[10px] font-black">📲 SPEI</span>'
                            : b.payment_method === 'CARGO_SOCIO'
                            ? '<span class="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-lg text-[10px] font-black">📑 Cargo Socio</span>'
                            : b.payment_method === 'CORTESIA'
                            ? '<span class="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-lg text-[10px] font-black">⛳ Cortesía</span>'
                            : '<span class="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-black">💵 Efectivo</span>';

                        return `
                            <tr class="hover:bg-slate-800/40 transition-colors">
                                <td class="px-5 py-3.5">
                                    <span class="font-black text-white bg-slate-800 px-2.5 py-1 rounded-md text-[11px] border border-slate-700">
                                        #${b.folio}
                                    </span>
                                    <p class="text-[10px] font-bold text-slate-400 mt-1">${b.booking_time} hrs</p>
                                </td>
                                <td class="px-5 py-3.5">
                                    <p class="font-black text-white uppercase text-sm">${b.contact_name}</p>
                                    <p class="text-[10px] text-slate-400 font-bold truncate max-w-xs mt-0.5">${playerNames}</p>
                                </td>
                                <td class="px-5 py-3.5 text-center font-black text-slate-200">
                                    ${b.total_players} jug (${b.total_holes || 18}h)
                                </td>
                                <td class="px-5 py-3.5 text-center font-black text-amber-400">
                                    ${b.total_carts > 0 ? `🚗 ${b.total_carts}` : '—'}
                                </td>
                                <td class="px-5 py-3.5">
                                    ${methodBadge}
                                </td>
                                <td class="px-5 py-3.5 text-right font-black text-emerald-400 text-sm">
                                    $${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </td>
                                <td class="px-5 py-3.5 text-right">
                                    <button onclick="window.printReceiptModal('${b.id}')"
                                        class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg font-black text-[10px] uppercase transition-all border border-slate-700">
                                        <span class="material-icons text-xs">receipt</span> Ver
                                    </button>
                                </td>
                            </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Print daily corte summary modal / window
window.printDailyCorte = function() {
    window.print();
};

// =========================================================================
// RECEIPT / PASE MODAL
// =========================================================================
window.printReceiptModal = function(bookingId, fallbackBooking) {
    const booking = dayTeeTimes.find(b => String(b.id) === String(bookingId)) || fallbackBooking;
    if (!booking) return;

    let modal = document.getElementById('modal-receipt-print');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-receipt-print';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in';
        document.body.appendChild(modal);
    }

    const total = parseFloat(booking.total_amount || 0);
    const dateFormatted = formatFullDate(booking.booking_date);
    const players = Array.isArray(booking.players) ? booking.players : [];
    const transRef = booking.transaction_ref ? booking.transaction_ref : null;

    const paymentLabel = {
        MIXTO: '🔀 Pago Mixto / Individual',
        EFECTIVO: '💵 Efectivo en Caja',
        TARJETA: '💳 Tarjeta Débito / Crédito (TPV)',
        TRANSFERENCIA: '📲 Transferencia SPEI',
        CARGO_SOCIO: '📑 Cargo a Cuenta de Socio',
        CORTESIA: '⛳ Cortesía de la Directiva'
    }[booking.payment_method] || booking.payment_method || 'EFECTIVO';

    modal.innerHTML = `
        <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <!-- Header -->
            <div class="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/80">
                <div class="flex items-center gap-3">
                    <img src="/logoclub.png" alt="Club de Golf Colima" class="h-10 w-10 rounded-xl object-contain bg-white p-1">
                    <div>
                        <h3 class="font-black uppercase text-white text-base leading-none">Pase de Salida & Recibo</h3>
                        <p class="text-[10px] text-slate-400 font-bold uppercase mt-1">Club de Golf Colima · Casa Club</p>
                    </div>
                </div>
                <button onclick="document.getElementById('modal-receipt-print').classList.add('hidden')" class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                    <span class="material-icons text-sm">close</span>
                </button>
            </div>

            <!-- Receipt Printable Content -->
            <div id="printable-receipt-area" class="p-6 overflow-y-auto custom-scrollbar space-y-5 bg-slate-950/60 text-slate-200">
                
                <!-- Ticket Badge -->
                <div class="text-center p-4 bg-slate-900 border-2 border-dashed border-slate-700 rounded-2xl space-y-1">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pase Oficial de Salida</p>
                    <h2 class="text-3xl font-black text-primary tracking-tight">${booking.folio}</h2>
                    <p class="text-xs font-black text-emerald-400 uppercase">🟢 SALIDA AUTORIZADA AL CAMPO</p>
                </div>

                <!-- Details Grid -->
                <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                    <div class="flex justify-between">
                        <span class="text-slate-400 font-bold">Fecha de Juego:</span>
                        <span class="font-black text-white uppercase">${dateFormatted}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400 font-bold">Horario de Salida:</span>
                        <span class="font-black text-white text-sm bg-slate-800 px-2 py-0.5 rounded border border-slate-700">${booking.booking_time} hrs (Hoyo #${booking.starting_hole || 1})</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400 font-bold">Titular del Grupo:</span>
                        <span class="font-black text-white uppercase">${booking.contact_name}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400 font-bold">Forma de Pago:</span>
                        <span class="font-black text-emerald-400 uppercase">${paymentLabel}</span>
                    </div>
                    ${transRef ? `
                    <div class="flex justify-between">
                        <span class="text-slate-400 font-bold">Ref. / Aprobaciones:</span>
                        <span class="font-black text-blue-400 truncate max-w-[200px]">${transRef}</span>
                    </div>` : ''}
                </div>

                <!-- Players Table -->
                <div class="space-y-2">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jugadores Registrados (${players.length}):</p>
                    <div class="bg-slate-900/80 border border-slate-800 rounded-xl divide-y divide-slate-800">
                        ${players.map((p, i) => {
                            const pMethod = p.payment_method || booking.payment_method || 'EFECTIVO';
                            const pMethodLabel = {
                                EFECTIVO: '💵 Efectivo',
                                TARJETA: `💳 Tarjeta ${p.transaction_ref ? `(#${p.transaction_ref})` : ''}`,
                                TRANSFERENCIA: `📲 SPEI ${p.transaction_ref ? `(#${p.transaction_ref})` : ''}`,
                                CARGO_SOCIO: '📑 Cargo Socio',
                                CORTESIA: '⛳ Cortesía Directiva'
                            }[pMethod] || pMethod;
                            const pTotal = (parseFloat(p.green_fee || 0) + parseFloat(p.cart_fee || 0) + parseFloat(p.club_fee || 0));

                            return `
                                <div class="p-3 flex items-center justify-between text-xs">
                                    <div>
                                        <p class="font-black text-white uppercase">${i+1}. ${escapeHtml(p.name || `Jugador #${i+1}`)}</p>
                                        <p class="text-[10px] text-slate-400 font-bold">
                                            ${p.is_member ? `Socio #${p.member_number}` : p.convenio_name ? `Convenio (${p.convenio_name})` : (p.player_type === 'CORTESIA' || p.payment_method === 'CORTESIA') ? 'Cortesía Directiva' : 'Invitado'}
                                            · ${p.holes || 18} Hoyos ${p.has_cart ? '· 🚗 Carrito' : ''} ${p.has_clubs ? '· 🏌️ Equipo' : ''}
                                            <span class="text-primary font-bold ml-1">· ${pMethodLabel}</span>
                                        </p>
                                    </div>
                                    <span class="font-black text-slate-200">$${pTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Total -->
                <div class="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                        <p class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Pagado</p>
                        <p class="text-[10px] text-slate-500 font-bold">I.V.A. Incluido</p>
                    </div>
                    <h3 class="text-2xl font-black text-emerald-400">$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</h3>
                </div>

                <div class="text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Presenta este folio en la caseta de Caddie Master para recibir tus carros y caddies asignados.
                </div>
            </div>

            <!-- Footer -->
            <div class="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-2 flex-wrap">
                <button type="button" onclick="document.getElementById('modal-receipt-print').classList.add('hidden')"
                    class="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-xs uppercase">
                    Cerrar
                </button>
                <div class="flex items-center gap-2">
                    <button type="button" onclick="window.shareReceiptWhatsApp(${JSON.stringify(booking).replace(/"/g, '&quot;')})"
                        class="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase flex items-center gap-1.5 shadow-lg shadow-emerald-600/20">
                        <span class="material-icons text-base">chat</span> WhatsApp
                    </button>
                    <button type="button" onclick="window.printReceiptWindow(${JSON.stringify(booking).replace(/"/g, '&quot;')})"
                        class="px-6 py-3 bg-primary hover:bg-primary/90 text-slate-950 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 shadow-lg shadow-primary/20">
                        <span class="material-icons text-base">print</span> Imprimir Pase
                    </button>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
};

// ── Imprimir en ventana limpia con logo ──────────────────────────────────────
window.printReceiptWindow = function(booking) {
    if (typeof booking === 'string') { try { booking = JSON.parse(booking); } catch(e) { return; } }

    const total = parseFloat(booking.total_amount || 0);
    const players = Array.isArray(booking.players) ? booking.players : [];
    const transRef = booking.transaction_ref || null;
    const logoUrl = window.location.origin + '/logoclub.png';

    const paymentLabel = {
        EFECTIVO: 'Efectivo en Caja',
        TARJETA: 'Tarjeta Débito / Crédito (TPV)',
        TRANSFERENCIA: 'Transferencia SPEI',
        CARGO_SOCIO: 'Cargo a Cuenta de Socio',
        CORTESIA: 'Cortesía / Directiva'
    }[booking.payment_method] || booking.payment_method || '';

    const dateFormatted = (() => {
        try {
            const d = new Date(booking.booking_date + 'T00:00:00');
            return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        } catch(e) { return booking.booking_date; }
    })();

    const playersHTML = players.map((p, i) => `
        <tr>
            <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                <strong>${i+1}. ${p.name}</strong><br>
                <small style="color:#6b7280;">${p.is_member ? 'Socio #' + p.member_number : ((p.player_type === 'CORTESIA' || p.payment_method === 'CORTESIA') ? '⛳ Cortesía Directiva' + (p.authorized_by ? ' (Autorizó: ' + p.authorized_by + ')' : '') : 'Invitado')} · ${p.holes || 18} Hoyos${p.has_cart ? ' · 🚗 Carrito' : ''}${p.has_clubs ? ' · 🏌️ Equipo' : ''}</small>
            </td>
            <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:900;">
                $${(parseFloat(p.green_fee || 0) + parseFloat(p.cart_fee || 0) + parseFloat(p.club_fee || 0)).toFixed(2)}
            </td>
        </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Pase de Salida · ${booking.folio}</title>
<style>
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; }
    .no-print { display: none !important; }
  }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #111; margin: 0; padding: 24px; max-width: 400px; margin: 0 auto; }
  .header { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #16a34a; padding-bottom: 14px; margin-bottom: 16px; }
  .header img { width: 54px; height: 54px; object-fit: contain; }
  .header h1 { font-size: 15px; font-weight: 900; margin: 0; text-transform: uppercase; color: #111; }
  .header p { font-size: 11px; color: #6b7280; margin: 2px 0 0; text-transform: uppercase; font-weight: 700; }
  .folio-box { background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 12px; text-align: center; padding: 14px; margin-bottom: 16px; }
  .folio-box .label { font-size: 10px; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; }
  .folio-box .folio { font-size: 26px; font-weight: 900; color: #16a34a; letter-spacing: 0.05em; }
  .folio-box .status { font-size: 11px; font-weight: 800; color: #15803d; text-transform: uppercase; }
  .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; }
  .info-row { display: flex; justify-content: space-between; align-items: center; font-size: 11px; padding: 3px 0; }
  .info-row .lbl { color: #6b7280; font-weight: 700; }
  .info-row .val { font-weight: 900; color: #111; text-transform: uppercase; }
  .info-row .val.green { color: #16a34a; }
  .info-row .val.blue { color: #2563eb; }
  .section-title { font-size: 10px; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .total-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; margin: 14px 0; }
  .total-box .t-label { font-size: 11px; font-weight: 800; color: #6b7280; text-transform: uppercase; }
  .total-box .t-label small { display: block; font-size: 10px; color: #9ca3af; font-weight: 600; }
  .total-box .t-amount { font-size: 22px; font-weight: 900; color: #16a34a; }
  .footer-note { font-size: 10px; color: #9ca3af; text-align: center; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 12px; }
  .print-btn { display: block; width: 100%; padding: 12px; background: #16a34a; color: #fff; border: none; border-radius: 10px; font-weight: 900; font-size: 13px; text-transform: uppercase; cursor: pointer; margin-top: 20px; }
</style>
</head>
<body>
  <div class="header">
    <img src="${logoUrl}" alt="Club de Golf Colima" onerror="this.style.display='none'">
    <div>
      <h1>Club de Golf Colima</h1>
      <p>Pase de Salida & Recibo · Casa Club</p>
    </div>
  </div>

  <div class="folio-box">
    <div class="label">Pase Oficial de Salida</div>
    <div class="folio">${booking.folio}</div>
    <div class="status">🟢 Salida Autorizada al Campo</div>
  </div>

  <div class="info-box">
    <div class="info-row"><span class="lbl">Fecha de Juego:</span><span class="val">${dateFormatted}</span></div>
    <div class="info-row"><span class="lbl">Horario de Salida:</span><span class="val">${booking.booking_time} hrs · Hoyo #${booking.starting_hole || 1}</span></div>
    <div class="info-row"><span class="lbl">Titular del Grupo:</span><span class="val">${booking.contact_name}</span></div>
    <div class="info-row"><span class="lbl">Forma de Pago:</span><span class="val green">${paymentLabel}</span></div>
    ${transRef ? `<div class="info-row"><span class="lbl">Ref. / Aprobación:</span><span class="val blue">${transRef}</span></div>` : ''}
  </div>

  <div class="section-title">Jugadores Registrados (${players.length})</div>
  <table>
    <tbody>${playersHTML}</tbody>
  </table>

  <div class="total-box">
    <div class="t-label">Total Pagado <small>I.V.A. Incluido</small></div>
    <div class="t-amount">$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</div>
  </div>

  <div class="footer-note">Presenta este folio en la caseta del Caddie Master<br>para recibir tus carros y caddies asignados.</div>

  <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimir</button>
</body>
</html>`;

    const printWin = window.open('', '_blank', 'width=460,height=720,menubar=no,toolbar=no,location=no');
    if (!printWin) {
        window.showNotification('Aviso', 'Permite las ventanas emergentes para este sitio e intenta nuevamente.', 'error');
        return;
    }
    printWin.document.write(html);
    printWin.document.close();
    printWin.onload = () => { printWin.focus(); printWin.print(); };
};

// ── Compartir recibo por WhatsApp ────────────────────────────────────────────
window.shareReceiptWhatsApp = function(booking) {
    if (typeof booking === 'string') { try { booking = JSON.parse(booking); } catch(e) { return; } }

    const total = parseFloat(booking.total_amount || 0);
    const players = Array.isArray(booking.players) ? booking.players : [];
    const dateFormatted = (() => {
        try {
            const d = new Date(booking.booking_date + 'T00:00:00');
            return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        } catch(e) { return booking.booking_date; }
    })();

    const paymentLabel = {
        EFECTIVO: 'Efectivo en Caja',
        TARJETA: 'Tarjeta Débito / Crédito (TPV)',
        TRANSFERENCIA: 'Transferencia SPEI',
        CARGO_SOCIO: 'Cargo a Cuenta de Socio',
        CORTESIA: 'Cortesía / Directiva'
    }[booking.payment_method] || booking.payment_method || '';

    const playerLines = players.map((p, i) =>
        `  ${i+1}. ${p.name} (${p.is_member ? 'Socio' : 'Invitado'} · ${p.holes || 18} hoyos${p.has_cart ? ' · 🚗' : ''})`
    ).join('\n');

    const msg = [
        `🏌️ *Club de Golf Colima — Pase de Salida*`,
        ``,
        `🎫 *Folio:* ${booking.folio}`,
        `📅 *Fecha:* ${dateFormatted}`,
        `⏰ *Horario:* ${booking.booking_time} hrs · Hoyo #${booking.starting_hole || 1}`,
        `👤 *Titular:* ${booking.contact_name}`,
        ``,
        `👥 *Jugadores (${players.length}):*`,
        playerLines,
        ``,
        `💳 *Forma de pago:* ${paymentLabel}`,
        booking.transaction_ref ? `🔖 *Referencia:* ${booking.transaction_ref}` : '',
        `💰 *Total Pagado:* $${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`,
        ``,
        `_Presenta este folio en la caseta del Caddie Master para recibir carros y caddies asignados._`,
        ``,
        `⛳ Club de Golf Colima · Casa Club`
    ].filter(l => l !== '').join('\n');

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
};

let activePriceConfigTab = 'GENERAL'; // 'GENERAL' or 'CONVENIOS'
let editingConvenioId = null;

window.openReceptionPriceConfigModal = function() {
    activePriceConfigTab = 'GENERAL';
    editingConvenioId = null;
    renderPriceConfigModalContent();
};

function renderPriceConfigModalContent() {
    let modal = document.getElementById('modal-price-config');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-price-config';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <!-- Header -->
            <div class="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/80">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <span class="material-icons">tune</span>
                    </div>
                    <div>
                        <h3 class="font-black uppercase text-white text-base leading-none">Tarifas & Convenios Predeterminados</h3>
                        <p class="text-[10px] text-slate-400 font-bold uppercase mt-1">Precios oficiales en terminal de cobro (Solo Administrador)</p>
                    </div>
                </div>
                <button onclick="document.getElementById('modal-price-config').classList.add('hidden')" class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                    <span class="material-icons text-sm">close</span>
                </button>
            </div>

            <!-- Tab Switcher -->
            <div class="flex border-b border-slate-800 bg-slate-950/60 p-2 gap-2">
                <button type="button" onclick="window.switchPriceConfigTab('GENERAL')"
                    class="flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activePriceConfigTab === 'GENERAL' ? 'bg-primary text-slate-950 shadow-md shadow-primary/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}">
                    <span class="material-icons text-sm">payments</span> Tarifas Base (Invitados)
                </button>
                <button type="button" onclick="window.switchPriceConfigTab('CONVENIOS')"
                    class="flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activePriceConfigTab === 'CONVENIOS' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}">
                    <span class="material-icons text-sm">handshake</span> Convenios Interclubes (${currentConvenios.length})
                </button>
            </div>

            <!-- Body Content -->
            <div class="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5 text-xs">
                ${activePriceConfigTab === 'GENERAL' ? `
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="space-y-1.5 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Green Fee (Invitado) · Tarifa Única</label>
                            <div class="relative">
                                <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 font-black">$</span>
                                <input id="cfg-gf-18-guest" type="number" step="50" value="${currentPrices.greenFee18Guest}" class="w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-black text-sm focus:outline-none focus:border-primary">
                            </div>
                            <p class="text-[9px] text-slate-500 font-bold">Misma tarifa jueguen 9 o 18 hoyos</p>
                        </div>
                        <div class="space-y-1.5 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Renta Carrito · Tarifa Única</label>
                            <div class="relative">
                                <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 font-black">$</span>
                                <input id="cfg-cart-18" type="number" step="50" value="${currentPrices.cart18}" class="w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-black text-sm focus:outline-none focus:border-primary">
                            </div>
                            <p class="text-[9px] text-slate-500 font-bold">Misma tarifa jueguen 9 o 18 hoyos</p>
                        </div>
                        <div class="space-y-1.5 p-4 bg-slate-950/60 border border-blue-500/30 rounded-2xl">
                            <label class="block text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">
                                <span class="material-icons text-xs">sports_golf</span> Renta de Equipo (Palos)
                            </label>
                            <div class="relative">
                                <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400 font-black">$</span>
                                <input id="cfg-club-rental" type="number" step="50" value="${currentPrices.clubRentalFee || 400}" class="w-full pl-8 pr-4 py-3 bg-slate-800 border border-blue-500/40 rounded-xl text-white font-black text-sm focus:outline-none focus:border-blue-400">
                            </div>
                            <p class="text-[9px] text-slate-500 font-bold">Costo por set de palos de renta ($400 base)</p>
                        </div>
                        <div class="space-y-1.5 p-4 bg-slate-950/60 border border-purple-500/30 rounded-2xl">
                            <label class="block text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1">
                                <span class="material-icons text-xs">sports_golf</span> Renta Tee de Práctica
                            </label>
                            <div class="relative">
                                <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 font-black">$</span>
                                <input id="cfg-practice-tee" type="number" step="25" value="${currentPrices.practiceTeeFee || 150}" class="w-full pl-8 pr-4 py-3 bg-slate-800 border border-purple-500/40 rounded-xl text-white font-black text-sm focus:outline-none focus:border-purple-400">
                            </div>
                            <p class="text-[9px] text-slate-500 font-bold">Acceso a área de tiro / práctica</p>
                        </div>
                        <div class="space-y-1.5 p-4 bg-slate-950/60 border border-teal-500/30 rounded-2xl sm:col-span-2">
                            <label class="block text-[10px] font-black text-teal-400 uppercase tracking-widest flex items-center gap-1">
                                <span class="material-icons text-xs">sports_baseball</span> Cubeta 100 Pelotas (Práctica)
                            </label>
                            <div class="relative">
                                <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-400 font-black">$</span>
                                <input id="cfg-bucket-100" type="number" step="10" value="${currentPrices.bucket100Fee || 120}" class="w-full pl-8 pr-4 py-3 bg-slate-800 border border-teal-500/40 rounded-xl text-white font-black text-sm focus:outline-none focus:border-teal-400">
                            </div>
                            <p class="text-[9px] text-slate-500 font-bold">Precio unitario por cubeta de 100 pelotas</p>
                        </div>
                    </div>
                ` : `
                    <div class="space-y-4">
                        <!-- Add / Edit Convenio Box -->
                        <div class="p-4 bg-slate-950/80 border border-indigo-500/30 rounded-2xl space-y-3">
                            <h4 class="font-black uppercase text-white text-xs flex items-center gap-2">
                                <span class="material-icons text-indigo-400 text-sm">add_circle</span> ${editingConvenioId ? 'Editar Convenio' : 'Nuevo Convenio Interclubes'}
                            </h4>
                            <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                <div class="sm:col-span-12">
                                    <label class="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nombre del Club o Convenio *</label>
                                    <input id="conv-name" type="text" placeholder="Ej. Manzanillo Golf / Club Atlas" class="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-black text-xs focus:outline-none focus:border-indigo-400">
                                </div>
                                <div class="sm:col-span-6">
                                    <label class="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Green Fee Convenio ($)</label>
                                    <input id="conv-gf-18" type="number" step="50" placeholder="800" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-emerald-400 font-black text-xs text-right focus:outline-none focus:border-indigo-400">
                                </div>
                                <div class="sm:col-span-6">
                                    <label class="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Renta Carrito Convenio ($)</label>
                                    <input id="conv-cart-18" type="number" step="50" placeholder="500" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-amber-400 font-black text-xs text-right focus:outline-none focus:border-indigo-400">
                                </div>
                            </div>
                            <div class="flex justify-end gap-2 pt-2 border-t border-slate-800/80">
                                ${editingConvenioId ? `
                                    <button type="button" onclick="window.cancelEditConvenio()" class="px-3.5 py-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl font-bold text-xs uppercase">Cancelar</button>
                                ` : ''}
                                <button type="button" onclick="window.saveConvenioItem()" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase flex items-center gap-1.5 shadow-md shadow-indigo-600/20">
                                    <span class="material-icons text-sm">save</span> ${editingConvenioId ? 'Actualizar' : 'Guardar Convenio'}
                                </button>
                            </div>
                        </div>

                        <!-- Existing Convenios List -->
                        <div class="space-y-2">
                            <h4 class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Convenios Registrados:</h4>
                            ${currentConvenios.length === 0 ? `
                                <div class="p-6 text-center bg-slate-950/40 border border-slate-800 rounded-2xl text-slate-500 font-bold uppercase text-xs">
                                    No hay convenios registrados aún. Agrega uno arriba.
                                </div>
                            ` : `
                                <div class="space-y-2">
                                    ${currentConvenios.map(c => `
                                        <div class="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all">
                                            <div class="space-y-1">
                                                <div class="flex items-center gap-2">
                                                    <span class="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-md text-[9px] font-black uppercase">Convenio</span>
                                                    <h5 class="font-black text-white text-sm uppercase">${escapeHtml(c.name)}</h5>
                                                </div>
                                                <div class="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-bold">
                                                    <span>Green Fee: <strong class="text-emerald-400 font-black">$${parseFloat(c.green_fee_18 || 0).toLocaleString()}</strong></span>
                                                    <span>Renta Carro: <strong class="text-amber-400 font-black">$${parseFloat(c.cart_fee_18 || 0).toLocaleString()}</strong></span>
                                                </div>
                                            </div>
                                            <div class="flex items-center gap-1.5 self-end sm:self-auto">
                                                <button type="button" onclick="window.startEditConvenio('${c.id}')" class="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all" title="Editar Convenio">
                                                    <span class="material-icons text-sm">edit</span>
                                                </button>
                                                <button type="button" onclick="window.deleteConvenioItem('${c.id}')" class="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all" title="Eliminar Convenio">
                                                    <span class="material-icons text-sm">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>
                    </div>
                `}
            </div>

            <!-- Modal Footer -->
            <div class="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-2">
                <button type="button" onclick="document.getElementById('modal-price-config').classList.add('hidden')" class="px-5 py-3 bg-slate-800 text-slate-300 rounded-xl font-black text-xs uppercase">Cerrar</button>
                ${activePriceConfigTab === 'GENERAL' ? `
                    <button type="button" onclick="window.savePriceConfig()" class="px-6 py-3 bg-primary text-slate-950 rounded-xl font-black text-xs uppercase">Guardar Tarifas</button>
                ` : ''}
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

window.switchPriceConfigTab = function(tab) {
    activePriceConfigTab = tab;
    renderPriceConfigModalContent();
};

window.savePriceConfig = function() {
    currentPrices.greenFee18Guest = parseFloat(document.getElementById('cfg-gf-18-guest')?.value) || 1200;
    currentPrices.cart18 = parseFloat(document.getElementById('cfg-cart-18')?.value) || 500;
    currentPrices.clubRentalFee = parseFloat(document.getElementById('cfg-club-rental')?.value) || 400;
    currentPrices.practiceTeeFee = parseFloat(document.getElementById('cfg-practice-tee')?.value) || 150;
    currentPrices.bucket100Fee = parseFloat(document.getElementById('cfg-bucket-100')?.value) || 120;
    // Tarifas unificadas: 9 hoyos se iguala a 18
    currentPrices.greenFee9Guest = currentPrices.greenFee18Guest;
    currentPrices.cart9 = currentPrices.cart18;

    localStorage.setItem('cgc_reception_prices', JSON.stringify(currentPrices));
    document.getElementById('modal-price-config')?.classList.add('hidden');
    window.showNotification('Tarifas Guardadas', 'Las nuevas tarifas base se aplicaron a los próximos registros.', 'success');
};

window.startEditConvenio = function(id) {
    const conv = currentConvenios.find(c => String(c.id) === String(id));
    if (!conv) return;
    editingConvenioId = id;
    renderPriceConfigModalContent();
    const nameEl = document.getElementById('conv-name');
    const gf18El = document.getElementById('conv-gf-18');
    const c18El = document.getElementById('conv-cart-18');

    if (nameEl) nameEl.value = conv.name || '';
    if (gf18El) gf18El.value = conv.green_fee_18 || 0;
    if (c18El) c18El.value = conv.cart_fee_18 || 0;
};

window.cancelEditConvenio = function() {
    editingConvenioId = null;
    renderPriceConfigModalContent();
};

window.saveConvenioItem = async function() {
    const name = document.getElementById('conv-name')?.value.trim();
    const gf18 = parseFloat(document.getElementById('conv-gf-18')?.value) || 0;
    const c18 = parseFloat(document.getElementById('conv-cart-18')?.value) || 0;

    if (!name) {
        window.showNotification('Nombre Requerido', 'Ingresa el nombre del convenio o club.', 'error');
        return;
    }

    const payload = {
        name: name,
        green_fee_18: gf18,
        green_fee_9: gf18,
        cart_fee_18: c18,
        cart_fee_9: c18,
        is_active: true,
        updated_at: new Date().toISOString()
    };

    if (editingConvenioId) {
        // Update
        const idx = currentConvenios.findIndex(c => String(c.id) === String(editingConvenioId));
        if (idx !== -1) {
            currentConvenios[idx] = { ...currentConvenios[idx], ...payload };
        }
        try {
            await db.from('convenios').update(payload).eq('id', editingConvenioId);
        } catch(e) { console.warn('Supabase update convenio error:', e); }
        window.showNotification('Convenio Actualizado', `El convenio "${name}" ha sido actualizado.`, 'success');
        editingConvenioId = null;
    } else {
        // Insert
        const newId = 'conv_' + Math.random().toString(36).substr(2, 9);
        payload.id = newId;
        payload.created_at = new Date().toISOString();
        try {
            const { data } = await db.from('convenios').insert([payload]).select().single();
            if (data && data.id) payload.id = data.id;
        } catch(e) { console.warn('Supabase insert convenio error:', e); }
        currentConvenios.push(payload);
        window.showNotification('Convenio Creado', `El convenio "${name}" ha sido registrado exitosamente.`, 'success');
    }

    localStorage.setItem('cgc_convenios', JSON.stringify(currentConvenios));
    renderPriceConfigModalContent();
    renderPOSCard();
};

window.deleteConvenioItem = async function(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este convenio?')) return;
    currentConvenios = currentConvenios.filter(c => String(c.id) !== String(id));
    try {
        await db.from('convenios').delete().eq('id', id);
    } catch(e) { console.warn('Supabase delete convenio error:', e); }
    localStorage.setItem('cgc_convenios', JSON.stringify(currentConvenios));
    window.showNotification('Convenio Eliminado', 'El convenio ha sido retirado.', 'info');
    renderPriceConfigModalContent();
    renderPOSCard();
};

// ── Mostrar/Ocultar campo de número de transacción & ajuste por Cortesía ────
window.toggleTransactionField = function(paymentMethod) {
    window._posPaymentMethod = paymentMethod;
    const fieldWrapper = document.getElementById('pos-transaction-field');
    const labelEl = fieldWrapper?.querySelector('label');
    const inputEl = document.getElementById('pos-transaction-ref');

    if (fieldWrapper) {
        const requiresRef = ['TARJETA', 'TRANSFERENCIA'].includes(paymentMethod);
        if (requiresRef) {
            fieldWrapper.classList.remove('hidden');
            if (labelEl) {
                labelEl.textContent = paymentMethod === 'TRANSFERENCIA'
                    ? '# Referencia / Folio SPEI *'
                    : '# Aprobación / Referencia TPV *';
            }
            if (inputEl) {
                inputEl.placeholder = paymentMethod === 'TRANSFERENCIA'
                    ? 'Ej. 123456789012'
                    : 'Ej. 481920';
            }
        } else {
            fieldWrapper.classList.add('hidden');
            if (inputEl) inputEl.value = '';
        }
    }

    if (paymentMethod === 'CORTESIA') {
        currentPlayersForm.forEach(p => {
            p.green_fee = 0;
            if (!p.has_cart) {
                p.cart_fee = 0;
            } else if (p.cart_fee === undefined || p.cart_fee === null) {
                p.cart_fee = currentPrices.cart18;
            }
        });
        renderPOSCard();
    } else {
        currentPlayersForm.forEach(p => {
            const playerType = p.player_type || (p.is_member ? 'MEMBER' : (p.convenio_id ? 'CONVENIO' : 'GUEST'));
            const hasCart = !!p.has_cart;

            if (playerType === 'MEMBER') {
                p.green_fee = 0;
                p.cart_fee = hasCart ? currentPrices.cart18 : 0;
            } else if (playerType === 'CONVENIO') {
                const conv = currentConvenios.find(c => String(c.id) === String(p.convenio_id)) || currentConvenios[0];
                p.green_fee = conv ? (parseFloat(conv.green_fee_18) || currentPrices.greenFee18Guest) : currentPrices.greenFee18Guest;
                p.cart_fee = hasCart ? (conv ? (parseFloat(conv.cart_fee_18) || currentPrices.cart18) : currentPrices.cart18) : 0;
            } else {
                p.green_fee = currentPrices.greenFee18Guest;
                p.cart_fee = hasCart ? currentPrices.cart18 : 0;
            }
        });
        renderPOSCard();
    }
};

// =========================================================================
// HELPERS & LOCAL STORAGE CACHING
// =========================================================================
function generateFolio(dateStr) {
    const cleanDate = dateStr.replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `CC-${cleanDate}-${randomSuffix}`;
}

function generateFolioPreview() {
    return `CC-${selectedDate.replace(/-/g, '')}-...`;
}

function formatFullDate(dateStr) {
    try {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
        return dateStr;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getBookingsFromLocalCache(dateStr) {
    try {
        const str = localStorage.getItem(`cgc_tee_times_${dateStr}`);
        return str ? JSON.parse(str) : [];
    } catch (e) {
        return [];
    }
}

function saveBookingsToLocalCache(dateStr, bookings) {
    try {
        localStorage.setItem(`cgc_tee_times_${dateStr}`, JSON.stringify(bookings));
    } catch (e) {}
}

function insertLocalBooking(booking) {
    const list = getBookingsFromLocalCache(booking.booking_date);
    list.push(booking);
    saveBookingsToLocalCache(booking.booking_date, list);
    return booking;
}

function updateLocalBooking(bookingId, updates) {
    const list = getBookingsFromLocalCache(selectedDate);
    const idx = list.findIndex(b => String(b.id) === String(bookingId));
    if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        saveBookingsToLocalCache(selectedDate, list);
        return list[idx];
    }
    return updates;
}

function deleteLocalBooking(bookingId) {
    const list = getBookingsFromLocalCache(selectedDate);
    const filtered = list.filter(b => String(b.id) !== String(bookingId));
    saveBookingsToLocalCache(selectedDate, filtered);
}

// Global Date Navigation Handlers
window.setReceptionDate = function(newDate) {
    if (!newDate) return;
    selectedDate = newDate;
    loadDayBookings();
};

window.stepReceptionDate = function(offsetDays) {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + offsetDays);
    selectedDate = d.toISOString().split('T')[0];
    loadDayBookings();
};

// ================================================
// RESERVAS VIEW
// ================================================

async function renderReservasView() {
    const container = document.getElementById('reservas-list-container');
    if (!container) return;

    container.innerHTML = `<div class="py-10 text-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></div>`;

    // Load all upcoming bookings (from today forward) from Supabase + local cache
    let allBookings = [];
    try {
        const today = getLocalDateString();
        const { data, error } = await db.from('tee_times')
            .select('*')
            .gte('booking_date', today)
            .in('status', ['RESERVED', 'PAID'])
            .order('booking_date', { ascending: true })
            .order('booking_time', { ascending: true });
        if (!error && data) {
            allBookings = data;
        }
    } catch (e) {
        console.warn('Reservas fallback to local:', e);
    }

    // Also pull from all local cache keys for upcoming dates
    if (allBookings.length === 0) {
        const today = new Date();
        for (let i = 0; i <= 30; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            const dateStr = getLocalDateString(d);
            const cached = getBookingsFromLocalCache(dateStr);
            cached.forEach(b => {
                if (b.status === 'RESERVED' || b.status === 'PAID') {
                    allBookings.push(b);
                }
            });
        }
    }

    // Update badge count
    const badge = document.getElementById('tab-reservas-badge');
    if (badge) badge.textContent = allBookings.length;

    if (allBookings.length === 0) {
        container.innerHTML = `
            <div class="py-16 text-center text-slate-400">
                <span class="material-icons text-5xl text-slate-700 block mb-3">event_busy</span>
                <p class="font-black text-sm uppercase tracking-wider">Sin reservas pendientes</p>
                <p class="text-xs mt-1">No hay grupos reservados para los próximos días.</p>
            </div>`;
        return;
    }

    // Group by date
    const grouped = {};
    allBookings.forEach(b => {
        const key = b.booking_date;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(b);
    });

    const statusColors = {
        RESERVED: { dot: 'bg-amber-400', text: 'text-amber-400', badge: 'bg-amber-500/15 border-amber-500/30', label: '🟡 Reserva Tel.' },
        PAID:     { dot: 'bg-blue-400',  text: 'text-blue-400',  badge: 'bg-blue-500/15 border-blue-500/30',   label: '🔵 Pagado / En Tee' },
    };

    container.innerHTML = Object.entries(grouped).map(([date, bookings]) => {
        const dateLabel = formatFullDate(date);
        const rows = bookings.map(b => {
            const sc = statusColors[b.status] || statusColors['RESERVED'];
            const players = Array.isArray(b.players)
                ? b.players.map(p => `<span class="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-200">${escapeHtml(p.name) || 'Sin nombre'}</span>`).join('')
                : `<span class="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-200">${escapeHtml(b.contact_name) || 'Sin nombre'}</span>`;
            return `
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl hover:border-slate-600 transition-all">
                    <div class="flex items-start gap-4">
                        <div class="flex flex-col items-center justify-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 shrink-0 min-w-[64px] text-center">
                            <span class="font-black text-base text-white leading-none">${b.booking_time || '--:--'}</span>
                            <span class="text-[9px] text-slate-400 font-bold uppercase mt-0.5">hrs</span>
                        </div>
                        <div class="space-y-1.5 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="font-black text-white text-sm uppercase">${escapeHtml(b.contact_name) || 'Grupo sin nombre'}</span>
                                <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${sc.badge} ${sc.text}">${sc.label}</span>
                                <span class="text-[10px] font-bold text-slate-400">${b.total_players || 1} jugador${(b.total_players||1)>1?'es':''}</span>
                            </div>
                            <div class="flex flex-wrap gap-1">
                                ${players}
                            </div>
                            <div class="flex items-center gap-3 text-[10px] font-bold text-slate-400 flex-wrap">
                                <span class="flex items-center gap-1"><span class="material-icons text-slate-500" style="font-size:12px">golf_course</span> ${b.total_holes || 18} Hoyos</span>
                                ${b.total_carts ? `<span class="flex items-center gap-1"><span class="material-icons text-amber-400/70" style="font-size:12px">electric_car</span> ${b.total_carts} Carrito${b.total_carts>1?'s':''}</span>` : ''}
                                ${b.folio ? `<span class="text-slate-500">Folio: ${b.folio.split('-').pop()}</span>` : ''}
                                ${b.contact_phone ? `<span class="flex items-center gap-1"><span class="material-icons text-slate-500" style="font-size:12px">phone</span> ${escapeHtml(b.contact_phone)}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <button onclick="window.setReceptionDate('${b.booking_date}'); window.selectSlotForBooking('${b.booking_time}', '${b.id}'); document.getElementById('tab-reception-slots').click();"
                            class="px-3.5 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1">
                            <span class="material-icons text-sm">open_in_new</span> Ver
                        </button>
                    </div>
                </div>`;
        }).join('');

        return `
            <div class="space-y-2">
                <div class="flex items-center gap-3">
                    <span class="material-icons text-primary text-base">calendar_today</span>
                    <h4 class="font-black text-white uppercase text-sm tracking-wider">${dateLabel}</h4>
                    <span class="px-2.5 py-0.5 bg-slate-800 rounded-full text-[10px] font-black text-slate-300 border border-slate-700">${bookings.length} reserva${bookings.length>1?'s':''}</span>
                </div>
                <div class="space-y-2 pl-6 border-l-2 border-slate-800">${rows}</div>
            </div>`;
    }).join('');
}

window.refreshReservasView = function() {
    renderReservasView();
};

// ============================================================================
// MODAL DE COBRO DE TEE DE PRÁCTICA & CUBETAS DE PELOTAS (DRIVING RANGE)
// ============================================================================

let drState = {
    isMember: false,
    memberId: null,
    memberNumber: '',
    customerName: '',
    customerPhone: '',
    hasTeePractice: true,
    hasClubRental: false,
    bucketsCount: 1,
    paymentMethod: 'EFECTIVO',
    transactionRef: '',
    authorizedBy: '',
    notes: '',
    printTicket: true
};

window.openDrivingRangeModal = function() {
    drState = {
        isMember: false,
        memberId: null,
        memberNumber: '',
        customerName: '',
        customerPhone: '',
        hasTeePractice: true,
        hasClubRental: false,
        bucketsCount: 1,
        paymentMethod: 'EFECTIVO',
        transactionRef: '',
        authorizedBy: '',
        notes: '',
        printTicket: true
    };
    renderDrivingRangeModalContent();
};

window.closeDrivingRangeModal = function() {
    const modal = document.getElementById('modal-driving-range-pos');
    if (modal) modal.classList.add('hidden');
};

function renderDrivingRangeModalContent() {
    let modal = document.getElementById('modal-driving-range-pos');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-driving-range-pos';
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in';
        document.body.appendChild(modal);
    }

    const teeFee = drState.hasTeePractice ? (parseFloat(currentPrices.practiceTeeFee) || 150) : 0;
    const clubFee = drState.hasClubRental ? (parseFloat(currentPrices.clubRentalFee) || 400) : 0;
    const bucketUnitPrice = parseFloat(currentPrices.bucket100Fee) || 120;
    const totalBucketsFee = drState.bucketsCount * bucketUnitPrice;
    const isCortesia = drState.paymentMethod === 'CORTESIA';
    const grandTotal = isCortesia ? 0 : (teeFee + clubFee + totalBucketsFee);

    modal.innerHTML = `
        <div class="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <!-- Header -->
            <div class="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/80">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                        <span class="material-icons text-2xl">sports_golf</span>
                    </div>
                    <div>
                        <h3 class="font-black uppercase text-white text-base leading-tight">Cobro de Práctica & Cubetas</h3>
                        <p class="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Acceso a Driving Range & Vale para Caddie Master</p>
                    </div>
                </div>
                <button type="button" onclick="window.closeDrivingRangeModal()" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                    <span class="material-icons text-base">close</span>
                </button>
            </div>

            <!-- Body Content -->
            <div class="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5 text-xs">
                
                <!-- 1. Tipo de Cliente: Visitante vs Socio -->
                <div class="space-y-2">
                    <div class="flex items-center justify-between">
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Cliente *</label>
                        <div class="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-[10px] font-black">
                            <button type="button" onclick="window.setDRCustomerType(false)"
                                class="px-3 py-1.5 rounded-lg transition-all ${!drState.isMember ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}">
                                Visitante / No Socio
                            </button>
                            <button type="button" onclick="window.setDRCustomerType(true)"
                                class="px-3 py-1.5 rounded-lg transition-all ${drState.isMember ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'}">
                                Socio del Club
                            </button>
                        </div>
                    </div>

                    ${drState.isMember ? `
                        <div class="space-y-1">
                            <div class="relative">
                                <input type="text"
                                    id="dr-member-input"
                                    list="members-autocomplete-list"
                                    value="${escapeHtml(drState.customerName || '')}"
                                    placeholder="Escribe el nombre o número de socio..."
                                    autocomplete="off"
                                    oninput="window.onDRMemberInput(this.value)"
                                    class="w-full px-4 py-3 bg-slate-800 border ${drState.memberId ? 'border-emerald-500 text-emerald-300' : 'border-slate-700 text-white'} rounded-xl text-xs font-black uppercase placeholder:normal-case placeholder:text-slate-500 focus:outline-none focus:border-primary">
                                ${drState.memberId ? `
                                    <span class="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[9px] font-black">
                                        Socio #${drState.memberNumber}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    ` : `
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nombre Completo *</label>
                                <input type="text" value="${escapeHtml(drState.customerName || '')}"
                                    placeholder="Ej. Ing. Roberto Gómez"
                                    oninput="window.setDRCustomerName(this.value)"
                                    class="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400">
                            </div>
                            <div>
                                <label class="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Teléfono (Opcional)</label>
                                <input type="tel" value="${escapeHtml(drState.customerPhone || '')}"
                                    placeholder="Ej. 312 123 4567"
                                    oninput="window.setDRCustomerPhone(this.value)"
                                    class="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400">
                            </div>
                        </div>
                    `}
                </div>

                <!-- 2. Conceptos a Cobrar -->
                <div class="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span class="material-icons text-sm text-purple-400">checklist</span> Conceptos de Práctica
                    </p>

                    <!-- Renta de Tee de Práctica -->
                    <div class="flex items-center justify-between p-3 bg-slate-900 border ${drState.hasTeePractice ? 'border-purple-500/40 bg-purple-950/10' : 'border-slate-800'} rounded-xl transition-all">
                        <label class="flex items-center gap-3 cursor-pointer select-none">
                            <input type="checkbox" ${drState.hasTeePractice ? 'checked' : ''}
                                onchange="window.setDRTeePractice(this.checked)"
                                class="w-4 h-4 rounded text-purple-600 focus:ring-0 focus:outline-none bg-slate-800 border-slate-700">
                            <div>
                                <p class="text-xs font-black text-white">Renta de Tee de Práctica</p>
                                <p class="text-[10px] text-slate-400 font-bold">Uso y acceso a tapete / pasto de tiro</p>
                            </div>
                        </label>
                        <span class="text-sm font-black text-purple-400">
                            $${(parseFloat(currentPrices.practiceTeeFee) || 150).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    <!-- Renta de Equipo (Palos) -->
                    <div class="flex items-center justify-between p-3 bg-slate-900 border ${drState.hasClubRental ? 'border-blue-500/40 bg-blue-950/10' : 'border-slate-800'} rounded-xl transition-all">
                        <label class="flex items-center gap-3 cursor-pointer select-none">
                            <input type="checkbox" ${drState.hasClubRental ? 'checked' : ''}
                                onchange="window.setDRClubRental(this.checked)"
                                class="w-4 h-4 rounded text-blue-600 focus:ring-0 focus:outline-none bg-slate-800 border-slate-700">
                            <div>
                                <p class="text-xs font-black text-white flex items-center gap-1.5">
                                    <span class="material-icons text-blue-400 text-sm">sports_golf</span> Renta de Equipo (Palos)
                                </p>
                                <p class="text-[10px] text-slate-400 font-bold">Set de bastones para la sesión de práctica</p>
                            </div>
                        </label>
                        <span class="text-sm font-black text-blue-400">
                            $${(parseFloat(currentPrices.clubRentalFee) || 400).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    <!-- Cubetas de 100 Pelotas Stepper -->
                    <div class="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-4">
                        <div>
                            <p class="text-xs font-black text-white flex items-center gap-1.5">
                                <span class="material-icons text-teal-400 text-sm">sports_baseball</span> Cubeta(s) de 100 Pelotas
                            </p>
                            <p class="text-[10px] text-slate-400 font-bold">
                                $${bucketUnitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })} c/u (${drState.bucketsCount * 100} pelotas en total)
                            </p>
                        </div>

                        <div class="flex items-center gap-2">
                            <button type="button" onclick="window.setDRBucketsCount(-1)"
                                class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-sm flex items-center justify-center transition-all border border-slate-700">
                                -
                            </button>
                            <span class="w-10 text-center font-black text-base text-teal-400">
                                ${drState.bucketsCount}
                            </span>
                            <button type="button" onclick="window.setDRBucketsCount(1)"
                                class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-sm flex items-center justify-center transition-all border border-slate-700">
                                +
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 3. Forma de Pago -->
                <div class="space-y-3">
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Forma de Pago *</label>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button type="button" onclick="window.setDRPaymentMethod('EFECTIVO')"
                            class="p-2.5 rounded-xl border text-center transition-all ${drState.paymentMethod === 'EFECTIVO' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-black' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}">
                            💵 Efectivo
                        </button>
                        <button type="button" onclick="window.setDRPaymentMethod('TARJETA')"
                            class="p-2.5 rounded-xl border text-center transition-all ${drState.paymentMethod === 'TARJETA' ? 'bg-blue-500/20 border-blue-500 text-blue-400 font-black' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}">
                            💳 Tarjeta TPV
                        </button>
                        <button type="button" onclick="window.setDRPaymentMethod('TRANSFERENCIA')"
                            class="p-2.5 rounded-xl border text-center transition-all ${drState.paymentMethod === 'TRANSFERENCIA' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 font-black' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}">
                            📲 SPEI
                        </button>
                        <button type="button" onclick="window.setDRPaymentMethod('CORTESIA')"
                            class="p-2.5 rounded-xl border text-center transition-all ${drState.paymentMethod === 'CORTESIA' ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-black' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}">
                            ⛳ Cortesía
                        </button>
                    </div>

                    ${(drState.paymentMethod === 'TARJETA' || drState.paymentMethod === 'TRANSFERENCIA') ? `
                        <div class="pt-1">
                            <label class="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                ${drState.paymentMethod === 'TRANSFERENCIA' ? '# Folio SPEI *' : '# Referencia / Aprobación TPV *'}
                            </label>
                            <input type="text" value="${escapeHtml(drState.transactionRef || '')}"
                                placeholder="Ej. 94820194"
                                oninput="window.setDRTransactionRef(this.value)"
                                class="w-full px-3.5 py-2.5 bg-slate-800 border border-blue-500/50 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-blue-400">
                        </div>
                    ` : drState.paymentMethod === 'CORTESIA' ? `
                        <div class="pt-1">
                            <label class="block text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                <span class="material-icons text-xs">verified_user</span> ¿Quién Autoriza la Cortesía? *
                            </label>
                            <input type="text" value="${escapeHtml(drState.authorizedBy || '')}"
                                placeholder="Ej. Presidente / Directiva"
                                oninput="window.setDRAuthorizedBy(this.value)"
                                class="w-full px-3.5 py-2.5 bg-slate-800 border border-amber-500/50 rounded-xl text-xs font-black text-amber-300 focus:outline-none focus:border-amber-400">
                        </div>
                    ` : ''}
                </div>

                <!-- 4. Notas -->
                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Notas u Observaciones (Opcional)</label>
                    <input type="text" value="${escapeHtml(drState.notes || '')}"
                        placeholder="Ej. Alumno con Pro de Golf, sesión vespertina"
                        oninput="window.setDRNotes(this.value)"
                        class="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400">
                </div>

                <!-- 5. Resumen Total -->
                <div class="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total a Cobrar</p>
                        <p class="text-xs text-slate-400 font-bold mt-0.5">
                            ${drState.hasTeePractice ? 'Tee' : ''} ${drState.hasClubRental ? '+ Equipo' : ''} ${(drState.hasTeePractice || drState.hasClubRental) && drState.bucketsCount > 0 ? '+' : ''} ${drState.bucketsCount > 0 ? `${drState.bucketsCount} cubeta(s)` : ''}
                        </p>
                    </div>
                    <div class="text-right">
                        <span class="text-2xl font-black ${isCortesia ? 'text-purple-400' : 'text-emerald-400'}">
                            $${grandTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                        <p class="text-[9px] font-black text-slate-500 uppercase">${drState.paymentMethod}</p>
                    </div>
                </div>

                <!-- Print Ticket Toggle -->
                <label class="flex items-center gap-2 px-1 cursor-pointer select-none text-slate-300">
                    <input type="checkbox" ${drState.printTicket ? 'checked' : ''}
                        onchange="drState.printTicket = this.checked;"
                        class="w-4 h-4 rounded text-purple-600 focus:ring-0 bg-slate-800 border-slate-700">
                    <span class="text-xs font-bold">🖨️ Imprimir ticket / vale de pelotas al guardar</span>
                </label>

            </div>

            <!-- Modal Footer -->
            <div class="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-2">
                <button type="button" onclick="window.closeDrivingRangeModal()"
                    class="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-xs uppercase transition-all">
                    Cancelar
                </button>
                <button type="button" onclick="window.saveDrivingRangeSession()"
                    class="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-xl shadow-purple-600/20 active:scale-95 transition-all">
                    <span class="material-icons text-sm">payments</span> Cobrar & Enviar a Caddie Master
                </button>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

window.setDRCustomerType = function(isMember) {
    drState.isMember = isMember;
    drState.customerName = '';
    drState.memberId = null;
    drState.memberNumber = '';
    renderDrivingRangeModalContent();
    if (isMember) {
        setTimeout(() => document.getElementById('dr-member-input')?.focus(), 50);
    }
};

window.onDRMemberInput = function(val) {
    drState.customerName = val;
    const trimmed = (val || '').trim().toLowerCase();
    const match = allMembers.find(m => (m.name || '').toLowerCase() === trimmed)
               || allMembers.find(m => (m.name || '').toLowerCase().includes(trimmed));
    if (match) {
        drState.memberId = match.id;
        drState.memberNumber = match.member_number;
        drState.customerName = match.name;
    } else {
        drState.memberId = null;
        drState.memberNumber = '';
    }
    renderDrivingRangeModalContent();
};

window.setDRCustomerName = function(val) {
    drState.customerName = val;
};

window.setDRCustomerPhone = function(val) {
    drState.customerPhone = val;
};

window.setDRTeePractice = function(checked) {
    drState.hasTeePractice = checked;
    renderDrivingRangeModalContent();
};

window.setDRClubRental = function(checked) {
    drState.hasClubRental = checked;
    renderDrivingRangeModalContent();
};

window.setDRBucketsCount = function(delta) {
    const next = drState.bucketsCount + delta;
    if (next < 0) return;
    drState.bucketsCount = next;
    renderDrivingRangeModalContent();
};

window.setDRPaymentMethod = function(method) {
    drState.paymentMethod = method;
    renderDrivingRangeModalContent();
};

window.setDRTransactionRef = function(val) {
    drState.transactionRef = val;
};

window.setDRAuthorizedBy = function(val) {
    drState.authorizedBy = val;
};

window.setDRNotes = function(val) {
    drState.notes = val;
};

window.saveDrivingRangeSession = async function() {
    if (!drState.customerName || drState.customerName.trim() === '') {
        window.showNotification?.('Nombre Requerido', 'Ingresa el nombre del socio o visitante.', 'error');
        return;
    }

    if (!drState.hasTeePractice && !drState.hasClubRental && drState.bucketsCount <= 0) {
        window.showNotification?.('Conceptos Requeridos', 'Selecciona al menos un concepto (Tee, Equipo o Cubetas).', 'error');
        return;
    }

    if (drState.paymentMethod === 'CORTESIA' && (!drState.authorizedBy || !drState.authorizedBy.trim())) {
        window.showNotification?.('Autorización Requerida', 'Ingresa el nombre de quién autoriza la cortesía.', 'error');
        return;
    }

    const teeFee = drState.hasTeePractice ? (parseFloat(currentPrices.practiceTeeFee) || 150) : 0;
    const clubFee = drState.hasClubRental ? (parseFloat(currentPrices.clubRentalFee) || 400) : 0;
    const bucketUnitPrice = parseFloat(currentPrices.bucket100Fee) || 120;
    const totalBucketsFee = drState.bucketsCount * bucketUnitPrice;
    const isCortesia = drState.paymentMethod === 'CORTESIA';
    const totalAmount = isCortesia ? 0 : (teeFee + clubFee + totalBucketsFee);

    const randomSuffix = String(Math.floor(Math.random() * 900) + 100);
    const folio = `PRAC-${selectedDate.replace(/-/g, '')}-${randomSuffix}`;

    const sessionPayload = {
        folio: folio,
        session_date: selectedDate,
        created_at: new Date().toISOString(),
        customer_name: drState.customerName.trim(),
        is_member: drState.isMember,
        member_id: drState.memberId || null,
        has_tee_practice: drState.hasTeePractice,
        tee_practice_fee: teeFee,
        has_club_rental: drState.hasClubRental,
        club_rental_fee: clubFee,
        buckets_count: drState.bucketsCount,
        bucket_unit_price: bucketUnitPrice,
        total_buckets_fee: totalBucketsFee,
        total_amount: totalAmount,
        payment_method: drState.paymentMethod,
        transaction_ref: drState.transactionRef || null,
        authorized_by: isCortesia ? drState.authorizedBy.trim() : null,
        status: 'PAID',
        balls_delivered: false,
        notes: drState.notes || null
    };

    // 1. Persist to Supabase
    try {
        let { data, error } = await db.from('driving_range_sessions').insert([sessionPayload]).select().single();
        if (error && (error.message.includes('has_club_rental') || error.message.includes('club_rental_fee'))) {
            const retryPayload = { ...sessionPayload };
            delete retryPayload.has_club_rental;
            delete retryPayload.club_rental_fee;
            const res2 = await db.from('driving_range_sessions').insert([retryPayload]).select().single();
            data = res2.data;
            error = res2.error;
        }
        if (!error && data && data.id) {
            sessionPayload.id = data.id;
        }
    } catch (err) {
        console.warn('Driving range session save exception:', err);
    }

    // 2. Cache locally & trigger cross-tab sync to Caddie Master
    try {
        const cacheKey = `cgc_driving_range_${selectedDate}`;
        const existing = JSON.parse(localStorage.getItem(cacheKey) || '[]');
        existing.unshift(sessionPayload);
        localStorage.setItem(cacheKey, JSON.stringify(existing));
        localStorage.setItem('cgc_driving_range_sync', String(Date.now()));
        window.dispatchEvent(new StorageEvent('storage', { key: 'cgc_driving_range_sync' }));
    } catch(e) {
        console.warn('Local storage sync error:', e);
    }

    // 3. Print Ticket if requested
    if (drState.printTicket) {
        window.printDrivingRangeTicket(sessionPayload);
    }

    window.closeDrivingRangeModal();
    window.showNotification?.('Cobro Registrado', `Folio #${folio} enviado a Caddie Master.`, 'success');
};

window.printDrivingRangeTicket = function(session) {
    const printWin = window.open('', '_blank', 'width=380,height=600');
    if (!printWin) return;

    const timeStr = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const isCortesia = session.payment_method === 'CORTESIA';

    printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ticket Práctica #${session.folio}</title>
            <style>
                body { font-family: monospace, sans-serif; font-size: 12px; margin: 0; padding: 15px; color: #000; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .bold { font-weight: bold; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                .box-vale { border: 2px dashed #000; padding: 10px; margin-top: 15px; text-align: center; }
                table { width: 100%; font-size: 12px; }
                @media print {
                    @page { margin: 0; size: 80mm auto; }
                    body { padding: 8px; }
                }
            </style>
        </head>
        <body onload="window.print();">
            <div class="text-center">
                <h3 style="margin: 0; font-size: 15px;">CLUB DE GOLF COLIMA</h3>
                <p style="margin: 3px 0 0 0; font-size: 10px;">CASA CLUB · TEE DE PRÁCTICA</p>
                <div class="divider"></div>
                <p class="bold" style="margin: 0; font-size: 13px;">TICKET DE COBRO # ${session.folio}</p>
                <p style="margin: 3px 0 0 0; font-size: 10px;">${session.session_date} · ${timeStr} hrs</p>
            </div>
            
            <div class="divider"></div>
            <div>
                <p style="margin: 2px 0;"><strong>Cliente:</strong> ${escapeHtml(session.customer_name)}</p>
                <p style="margin: 2px 0;"><strong>Tipo:</strong> ${session.is_member ? 'SOCIO DEL CLUB' : 'VISITANTE'}</p>
                ${isCortesia && session.authorized_by ? `<p style="margin: 2px 0;"><strong>Autorizó:</strong> ${escapeHtml(session.authorized_by)}</p>` : ''}
            </div>

            <div class="divider"></div>
            <table>
                ${session.has_tee_practice ? `
                    <tr>
                        <td>Renta Tee de Práctica</td>
                        <td class="text-right">$${Number(session.tee_practice_fee).toFixed(2)}</td>
                    </tr>
                ` : ''}
                ${session.buckets_count > 0 ? `
                    <tr>
                        <td>${session.buckets_count} Cubeta(s) (100 pelotas c/u)</td>
                        <td class="text-right">$${Number(session.total_buckets_fee).toFixed(2)}</td>
                    </tr>
                ` : ''}
                <tr>
                    <td colspan="2"><div class="divider"></div></td>
                </tr>
                <tr>
                    <td class="bold" style="font-size: 13px;">TOTAL:</td>
                    <td class="text-right bold" style="font-size: 13px;">$${Number(session.total_amount).toFixed(2)} MXN</td>
                </tr>
                <tr>
                    <td>Forma de Pago:</td>
                    <td class="text-right">${session.payment_method}</td>
                </tr>
                ${session.transaction_ref ? `
                    <tr>
                        <td>Ref / Folio:</td>
                        <td class="text-right">${session.transaction_ref}</td>
                    </tr>
                ` : ''}
            </table>

            <div class="box-vale">
                <p style="margin: 0; font-size: 10px; font-weight: bold; letter-spacing: 1px;">VALE PARA CADDIE MASTER</p>
                <h2 style="margin: 6px 0; font-size: 18px;">${session.buckets_count} CUBETA(S)</h2>
                <p style="margin: 0; font-size: 11px; font-weight: bold;">TOTAL: ${session.buckets_count * 100} PELOTAS</p>
                <p style="margin: 4px 0 0 0; font-size: 9px;">Presentar este vale en caseta para entrega de pelotas.</p>
            </div>

            <p class="text-center" style="margin-top: 15px; font-size: 9px;">¡Gracias por su visita al Club de Golf Colima!</p>
        </body>
        </html>
    `);
    printWin.document.close();
};

