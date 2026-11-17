import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 'https://tztolxgsaktqindoimtu.supabase.co';
const SUPABASE_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dG9seGdzYWt0cWluZG9pbXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzQ4ODAsImV4cCI6MjEwMTg1MDg4MH0.E2GABiOMXYb5hEwE9ErIcJa6_LHkj9lJUglQVoiLl0M';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
const db = supabaseClient.schema('colimaGC');

// State
let currentPeriod = 'this_month'; // 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom'
let startDate = '';
let endDate = '';
let activeReportTab = 'AFLUENCIA'; // 'AFLUENCIA' | 'CARRITOS' | 'SOCIOS' | 'FINANZAS'
let rawBookings = [];
let allMembers = [];
let chartInstances = {};

export async function renderReportsModule(container) {
    calculateDateRange(currentPeriod);
    renderMainShell(container);
    await loadDataAndRender();
}

function calculateDateRange(period) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (period === 'today') {
        startDate = toYMD(now);
        endDate = toYMD(now);
    } else if (period === 'this_week') {
        const day = now.getDay();
        const diffToMonday = (day === 0 ? -6 : 1) - day;
        const monday = new Date(now);
        monday.setDate(now.getDate() + diffToMonday);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        startDate = toYMD(monday);
        endDate = toYMD(sunday);
    } else if (period === 'this_month') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        startDate = toYMD(firstDay);
        endDate = toYMD(lastDay);
    } else if (period === 'this_year') {
        const firstDay = new Date(now.getFullYear(), 0, 1);
        const lastDay = new Date(now.getFullYear(), 11, 31);
        startDate = toYMD(firstDay);
        endDate = toYMD(lastDay);
    }
}

function renderMainShell(container) {
    container.innerHTML = `
        <div class="space-y-6 pb-12 animate-fade-in print:bg-white print:text-black">
            <!-- Header & Filter Bar -->
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl print:hidden">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
                        <span class="material-icons" style="font-size:32px">insights</span>
                    </div>
                    <div>
                        <div class="flex items-center gap-2.5">
                            <h2 class="text-2xl font-black text-white uppercase tracking-tight">Reportes & Métricas Operativas</h2>
                            <span class="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-black uppercase">Analíticas</span>
                        </div>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Control de Jugadores, Carritos, Horas Pico, Ranking de Socios y Caja</p>
                    </div>
                </div>

                <!-- Export & Refresh Actions -->
                <div class="flex flex-wrap items-center gap-2.5">
                    <button id="btn-export-csv" class="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer">
                        <span class="material-icons text-emerald-400 text-base">download</span> Exportar Excel
                    </button>
                    <button id="btn-print-report" class="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer">
                        <span class="material-icons text-blue-400 text-base">print</span> Imprimir / PDF
                    </button>
                    <button id="btn-refresh-data" class="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-primary/20 cursor-pointer">
                        <span class="material-icons text-base">sync</span> Actualizar
                    </button>
                </div>
            </div>

            <!-- Date Range Controls -->
            <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl print:hidden">
                <div class="flex flex-wrap items-center gap-2" id="period-presets">
                    <button data-period="today" class="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${currentPeriod === 'today' ? 'bg-primary text-slate-900 shadow-md shadow-primary/20' : 'bg-slate-800/80 text-slate-400 hover:text-white'}">Hoy</button>
                    <button data-period="this_week" class="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${currentPeriod === 'this_week' ? 'bg-primary text-slate-900 shadow-md shadow-primary/20' : 'bg-slate-800/80 text-slate-400 hover:text-white'}">Esta Semana</button>
                    <button data-period="this_month" class="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${currentPeriod === 'this_month' ? 'bg-primary text-slate-900 shadow-md shadow-primary/20' : 'bg-slate-800/80 text-slate-400 hover:text-white'}">Este Mes</button>
                    <button data-period="this_year" class="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${currentPeriod === 'this_year' ? 'bg-primary text-slate-900 shadow-md shadow-primary/20' : 'bg-slate-800/80 text-slate-400 hover:text-white'}">Año Actual</button>
                    <button data-period="custom" class="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${currentPeriod === 'custom' ? 'bg-primary text-slate-900 shadow-md shadow-primary/20' : 'bg-slate-800/80 text-slate-400 hover:text-white'}">Personalizado</button>
                </div>

                <div class="flex items-center gap-2 bg-slate-950/80 border border-slate-800 p-1.5 rounded-xl">
                    <span class="material-icons text-slate-500 text-sm ml-2">date_range</span>
                    <input id="report-start-date" type="date" value="${startDate}" style="color-scheme: dark;"
                        class="bg-transparent text-white font-bold text-xs uppercase focus:outline-none cursor-pointer">
                    <span class="text-slate-600 font-black text-xs">AL</span>
                    <input id="report-end-date" type="date" value="${endDate}" style="color-scheme: dark;"
                        class="bg-transparent text-white font-bold text-xs uppercase focus:outline-none cursor-pointer mr-2">
                    <button id="btn-apply-custom-dates" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-primary border border-primary/30 rounded-lg text-xs font-black uppercase transition-all cursor-pointer">
                        Filtrar
                    </button>
                </div>
            </div>

            <!-- Print Header (Visible only when printing) -->
            <div class="hidden print:block mb-6 border-b-2 border-slate-900 pb-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-black uppercase text-slate-900">Club de Golf Colima</h1>
                        <h2 class="text-base font-bold text-slate-700 uppercase">Informe Ejecutivo de Operaciones & Métricas</h2>
                    </div>
                    <div class="text-right text-xs font-bold text-slate-600">
                        <p>Periodo: <span class="font-black text-slate-900">${startDate} al ${endDate}</span></p>
                        <p>Generado: ${new Date().toLocaleString('es-MX')}</p>
                    </div>
                </div>
            </div>

            <!-- Top Summary KPI Cards -->
            <div id="reports-kpis" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Jugadores</p>
                        <h3 id="kpi-total-players" class="text-3xl font-black text-white mt-1">...</h3>
                        <p id="kpi-players-breakdown" class="text-[10px] font-bold text-emerald-400 mt-1">Calculando...</p>
                    </div>
                    <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <span class="material-icons">groups</span>
                    </div>
                </div>

                <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carritos Rentados</p>
                        <h3 id="kpi-total-carts" class="text-3xl font-black text-white mt-1">...</h3>
                        <p id="kpi-carts-income" class="text-[10px] font-bold text-teal-400 mt-1">Calculando...</p>
                    </div>
                    <div class="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                        <span class="material-icons">electric_rickshaw</span>
                    </div>
                </div>

                <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingresos Totales (Caja)</p>
                        <h3 id="kpi-total-revenue" class="text-3xl font-black text-amber-400 mt-1">...</h3>
                        <p id="kpi-revenue-breakdown" class="text-[10px] font-bold text-slate-400 mt-1">Calculando...</p>
                    </div>
                    <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <span class="material-icons">payments</span>
                    </div>
                </div>

                <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horario Pico</p>
                        <h3 id="kpi-peak-hour" class="text-2xl font-black text-white mt-1">...</h3>
                        <p id="kpi-peak-day" class="text-[10px] font-bold text-purple-400 mt-1">Calculando...</p>
                    </div>
                    <div class="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <span class="material-icons">schedule</span>
                    </div>
                </div>
            </div>

            <!-- Tab Navigation -->
            <div class="border-b border-slate-800 flex items-center gap-2 overflow-x-auto pb-1 print:hidden" id="report-tabs">
                <button data-tab="AFLUENCIA" class="report-tab-btn flex items-center gap-2 px-5 py-3 border-b-2 font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${activeReportTab === 'AFLUENCIA' ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-400 hover:text-white'}">
                    <span class="material-icons text-base">bar_chart</span> Afluencia & Horas Pico
                </button>
                <button data-tab="CARRITOS" class="report-tab-btn flex items-center gap-2 px-5 py-3 border-b-2 font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${activeReportTab === 'CARRITOS' ? 'border-teal-400 text-teal-400 bg-teal-500/5' : 'border-transparent text-slate-400 hover:text-white'}">
                    <span class="material-icons text-base">electric_rickshaw</span> Renta de Carritos
                </button>
                <button data-tab="SOCIOS" class="report-tab-btn flex items-center gap-2 px-5 py-3 border-b-2 font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${activeReportTab === 'SOCIOS' ? 'border-blue-400 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-white'}">
                    <span class="material-icons text-base">emoji_events</span> Ranking Socios & Fidelidad
                </button>
                <button data-tab="FINANZAS" class="report-tab-btn flex items-center gap-2 px-5 py-3 border-b-2 font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${activeReportTab === 'FINANZAS' ? 'border-amber-400 text-amber-400 bg-amber-500/5' : 'border-transparent text-slate-400 hover:text-white'}">
                    <span class="material-icons text-base">account_balance_wallet</span> Caja & Métodos de Pago
                </button>
            </div>

            <!-- Dynamic Tab Content -->
            <div id="reports-tab-content" class="space-y-6">
                <div class="py-16 text-center text-slate-500">
                    <div class="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3"></div>
                    <p class="font-bold text-xs uppercase tracking-widest">Cargando métricas del periodo...</p>
                </div>
            </div>
        </div>
    `;

    bindHeaderEvents(container);
}

function bindHeaderEvents(container) {
    // Presets
    const presets = container.querySelectorAll('#period-presets button');
    presets.forEach(btn => {
        btn.onclick = async () => {
            currentPeriod = btn.getAttribute('data-period');
            calculateDateRange(currentPeriod);
            container.querySelector('#report-start-date').value = startDate;
            container.querySelector('#report-end-date').value = endDate;
            presets.forEach(b => {
                b.className = `px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${b === btn ? 'bg-primary text-slate-900 shadow-md shadow-primary/20' : 'bg-slate-800/80 text-slate-400 hover:text-white'}`;
            });
            await loadDataAndRender();
        };
    });

    // Custom Date Filter Button
    const btnCustom = container.querySelector('#btn-apply-custom-dates');
    if (btnCustom) {
        btnCustom.onclick = async () => {
            const s = container.querySelector('#report-start-date').value;
            const e = container.querySelector('#report-end-date').value;
            if (!s || !e) return;
            startDate = s;
            endDate = e;
            currentPeriod = 'custom';
            presets.forEach(b => {
                b.className = `px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${b.getAttribute('data-period') === 'custom' ? 'bg-primary text-slate-900 shadow-md shadow-primary/20' : 'bg-slate-800/80 text-slate-400 hover:text-white'}`;
            });
            await loadDataAndRender();
        };
    }

    // Tab buttons
    const tabBtns = container.querySelectorAll('.report-tab-btn');
    tabBtns.forEach(btn => {
        btn.onclick = () => {
            activeReportTab = btn.getAttribute('data-tab');
            tabBtns.forEach(b => {
                const isActive = b === btn;
                const tab = b.getAttribute('data-tab');
                const color = tab === 'AFLUENCIA' ? 'emerald' : tab === 'CARRITOS' ? 'teal' : tab === 'SOCIOS' ? 'blue' : 'amber';
                b.className = `report-tab-btn flex items-center gap-2 px-5 py-3 border-b-2 font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${isActive ? `border-${color}-400 text-${color}-400 bg-${color}-500/5` : 'border-transparent text-slate-400 hover:text-white'}`;
            });
            renderActiveTabContent();
        };
    });

    // Refresh
    const btnRefresh = container.querySelector('#btn-refresh-data');
    if (btnRefresh) {
        btnRefresh.onclick = async () => {
            btnRefresh.classList.add('animate-pulse');
            await loadDataAndRender();
            btnRefresh.classList.remove('animate-pulse');
        };
    }

    // Export CSV
    const btnCsv = container.querySelector('#btn-export-csv');
    if (btnCsv) {
        btnCsv.onclick = () => exportToCSV();
    }

    // Print
    const btnPrint = container.querySelector('#btn-print-report');
    if (btnPrint) {
        btnPrint.onclick = () => window.print();
    }
}

// ── Data Fetching ─────────────────────────────────────────────────────────────
async function loadDataAndRender() {
    try {
        // Fetch tee_times in range
        const { data: bookings, error: bErr } = await db
            .from('tee_times')
            .select('*')
            .gte('booking_date', startDate)
            .lte('booking_date', endDate)
            .neq('status', 'CANCELLED')
            .order('booking_date', { ascending: true })
            .order('booking_time', { ascending: true });

        if (bErr) throw bErr;
        rawBookings = bookings || [];

        // Fetch members for ranking / inactive check
        const { data: members, error: mErr } = await db
            .from('members')
            .select('*');

        if (!mErr && members) {
            allMembers = members;
        }

        updateTopKPIs();
        renderActiveTabContent();
    } catch (err) {
        console.error('Error loading reports data:', err);
        const container = document.getElementById('reports-tab-content');
        if (container) {
            container.innerHTML = `
                <div class="p-8 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center">
                    <span class="material-icons text-rose-400 text-4xl mb-2">error_outline</span>
                    <h4 class="text-lg font-black text-white">Error al cargar datos de reportes</h4>
                    <p class="text-xs text-rose-300 mt-1">${err.message || 'Verifica la conexión a Supabase'}</p>
                </div>
            `;
        }
    }
}

// ── Top KPIs Calculation ──────────────────────────────────────────────────────
function updateTopKPIs() {
    let totalPlayers = 0;
    let memberPlayers = 0;
    let guestPlayers = 0;
    let convenioPlayers = 0;
    let cortesiaPlayers = 0;
    let totalCarts = 0;
    let cartsIncome = 0;
    let totalRevenue = 0;
    let greenFeesIncome = 0;
    let clubRentalIncome = 0;
    const hourCounts = {};
    const dayCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    rawBookings.forEach(b => {
        const players = Array.isArray(b.players) ? b.players : [];
        const count = players.length > 0 ? players.length : (b.total_players || 1);
        totalPlayers += count;

        let bookingCarts = 0;
        if (players.length > 0) {
            players.forEach(p => {
                const pType = p.player_type || (p.is_member || p.isMember ? 'MEMBER' : (p.convenio_id ? 'CONVENIO' : (p.payment_method === 'CORTESIA' ? 'CORTESIA' : 'GUEST')));
                if (pType === 'MEMBER' || p.is_member || p.isMember) {
                    memberPlayers++;
                } else if (pType === 'CORTESIA' || p.payment_method === 'CORTESIA' || b.payment_method === 'CORTESIA') {
                    cortesiaPlayers++;
                } else if (pType === 'CONVENIO' || p.convenio_id) {
                    convenioPlayers++;
                } else {
                    guestPlayers++;
                }
                if (p.has_cart || p.hasCart) {
                    bookingCarts++;
                }
            });
        } else {
            if (b.payment_method === 'CORTESIA') {
                cortesiaPlayers += count;
            } else {
                guestPlayers += count;
            }
        }

        // If no player objects had has_cart set, fallback to total_carts field
        if (bookingCarts === 0 && b.total_carts) {
            bookingCarts = Number(b.total_carts) || 0;
        }

        totalCarts += bookingCarts;
        cartsIncome += Number(b.cart_fee_total) || 0;
        greenFeesIncome += Number(b.green_fee_total) || 0;
        clubRentalIncome += Number(b.club_rental_total) || 0;
        totalRevenue += Number(b.total_amount) || 0;

        // Peak hour tracking
        const slot = (b.booking_time || '08:00').substring(0, 5);
        hourCounts[slot] = (hourCounts[slot] || 0) + count;

        // Day of week
        if (b.booking_date) {
            const [y, m, d] = b.booking_date.split('-').map(Number);
            const dt = new Date(y, m - 1, d);
            dayCounts[dt.getDay()] = (dayCounts[dt.getDay()] || 0) + count;
        }
    });

    // Determine Peak Hour
    let peakHour = '--:--';
    let peakHourMax = 0;
    Object.entries(hourCounts).forEach(([h, cnt]) => {
        if (cnt > peakHourMax) {
            peakHourMax = cnt;
            peakHour = h;
        }
    });

    // Determine Peak Day
    let peakDayIdx = 0;
    let peakDayMax = 0;
    Object.entries(dayCounts).forEach(([dIdx, cnt]) => {
        if (cnt > peakDayMax) {
            peakDayMax = cnt;
            peakDayIdx = Number(dIdx);
        }
    });

    // Update DOM
    const elTP = document.getElementById('kpi-total-players');
    if (elTP) elTP.textContent = totalPlayers.toLocaleString();

    const elPB = document.getElementById('kpi-players-breakdown');
    if (elPB) {
        const parts = [];
        parts.push(`<span class="text-emerald-400 font-bold">${memberPlayers} Socios</span>`);
        if (convenioPlayers > 0) parts.push(`<span class="text-indigo-400 font-bold">${convenioPlayers} Convenios</span>`);
        parts.push(`<span class="text-blue-400 font-bold">${guestPlayers} Invitados</span>`);
        if (cortesiaPlayers > 0) parts.push(`<span class="text-purple-400 font-bold">${cortesiaPlayers} Cortesías</span>`);
        elPB.innerHTML = parts.join(' · ');
    }

    const elTC = document.getElementById('kpi-total-carts');
    if (elTC) elTC.textContent = totalCarts.toLocaleString();

    const elCI = document.getElementById('kpi-carts-income');
    if (elCI) elCI.textContent = `$${cartsIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })} recaudados`;

    const elTR = document.getElementById('kpi-total-revenue');
    if (elTR) elTR.textContent = `$${totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

    const elRB = document.getElementById('kpi-revenue-breakdown');
    if (elRB) elRB.textContent = `GF: $${greenFeesIncome.toLocaleString()} | Carros: $${cartsIncome.toLocaleString()}${clubRentalIncome > 0 ? ` | Equipos: $${clubRentalIncome.toLocaleString()}` : ''}`;

    const elPH = document.getElementById('kpi-peak-hour');
    if (elPH) elPH.textContent = peakHour !== '--:--' ? `${peakHour} hrs` : 'Sin datos';

    const elPD = document.getElementById('kpi-peak-day');
    if (elPD) elPD.textContent = peakDayMax > 0 ? `Día más activo: ${dayNames[peakDayIdx]}` : 'Sin salidas';
}

// ── Tab Router ────────────────────────────────────────────────────────────────
function renderActiveTabContent() {
    const container = document.getElementById('reports-tab-content');
    if (!container) return;

    if (activeReportTab === 'AFLUENCIA') {
        renderAfluenciaTab(container);
    } else if (activeReportTab === 'CARRITOS') {
        renderCarritosTab(container);
    } else if (activeReportTab === 'SOCIOS') {
        renderSociosTab(container);
    } else if (activeReportTab === 'FINANZAS') {
        renderFinanzasTab(container);
    }
}

// ── TAB 1: AFLUENCIA & HORAS PICO ─────────────────────────────────────────────
function renderAfluenciaTab(container) {
    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Main Chart: Players over time (Socios vs Invitados) -->
            <div class="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-base font-black text-white uppercase tracking-tight">Evolución de Jugadores en el Periodo</h3>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Socios vs. Invitados / Externos por Fecha</p>
                    </div>
                    <span class="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase">
                        ${rawBookings.length} Salidas Registradas
                    </span>
                </div>
                <div class="relative h-72 w-full">
                    <canvas id="chart-afluencia-timeline"></canvas>
                </div>
            </div>

            <!-- Day of Week Distribution -->
            <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
                <div>
                    <h3 class="text-base font-black text-white uppercase tracking-tight">Afluencia por Día de la Semana</h3>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Volumen Acumulado de Jugadores</p>
                </div>
                <div class="relative h-64 w-full">
                    <canvas id="chart-afluencia-weekdays"></canvas>
                </div>
            </div>
        </div>

        <!-- Horas Pico Bar Chart -->
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-base font-black text-white uppercase tracking-tight">Horarios Más Solicitados (Distribución de Horas Pico)</h3>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Cantidad de Jugadores según la Franja Horaria de Salida</p>
                </div>
                <span class="material-icons text-purple-400">schedule</span>
            </div>
            <div class="relative h-72 w-full">
                <canvas id="chart-horas-pico"></canvas>
            </div>
        </div>

        <!-- Summary Table of Daily Activity -->
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-base font-black text-white uppercase tracking-tight">Desglose Detallado por Fecha</h3>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Resumen de Salidas, Jugadores y Recaudación</p>
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                    <thead>
                        <tr class="border-b border-slate-800 text-slate-400 font-black uppercase tracking-wider">
                            <th class="py-3 px-4">Fecha</th>
                            <th class="py-3 px-4 text-center">Salidas (Grupos)</th>
                            <th class="py-3 px-4 text-center">Total Jugadores</th>
                            <th class="py-3 px-4 text-center">Socios</th>
                            <th class="py-3 px-4 text-center">Invitados</th>
                            <th class="py-3 px-4 text-center">Carritos</th>
                            <th class="py-3 px-4 text-right">Recaudación</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 font-bold" id="table-afluencia-body">
                        ${renderAfluenciaTableRows()}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    setTimeout(() => {
        initAfluenciaCharts();
    }, 50);
}

function renderAfluenciaTableRows() {
    if (rawBookings.length === 0) {
        return `<tr><td colspan="7" class="py-8 text-center text-slate-500 font-bold">No hay registros en el periodo seleccionado</td></tr>`;
    }

    const byDate = {};
    rawBookings.forEach(b => {
        const d = b.booking_date;
        if (!byDate[d]) {
            byDate[d] = { count: 0, players: 0, members: 0, guests: 0, carts: 0, total: 0 };
        }
        byDate[d].count++;
        const pArr = Array.isArray(b.players) ? b.players : [];
        const pCount = pArr.length > 0 ? pArr.length : (b.total_players || 1);
        byDate[d].players += pCount;

        pArr.forEach(p => {
            if (p.is_member || p.isMember) byDate[d].members++;
            else byDate[d].guests++;
        });

        byDate[d].carts += Number(b.total_carts) || 0;
        byDate[d].total += Number(b.total_amount) || 0;
    });

    const dates = Object.keys(byDate).sort().reverse();
    return dates.map(d => {
        const r = byDate[d];
        return `
            <tr class="hover:bg-slate-800/40 transition-colors">
                <td class="py-3.5 px-4 text-white font-black">${d}</td>
                <td class="py-3.5 px-4 text-center text-slate-300">${r.count}</td>
                <td class="py-3.5 px-4 text-center text-emerald-400 font-black">${r.players}</td>
                <td class="py-3.5 px-4 text-center text-blue-400">${r.members}</td>
                <td class="py-3.5 px-4 text-center text-amber-400">${r.guests}</td>
                <td class="py-3.5 px-4 text-center text-teal-400">${r.carts}</td>
                <td class="py-3.5 px-4 text-right text-emerald-400 font-black">$${r.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
            </tr>
        `;
    }).join('');
}

function initAfluenciaCharts() {
    if (typeof Chart === 'undefined') return;

    // 1. Timeline Chart (Stacked/Grouped Bar by Date)
    const byDate = {};
    rawBookings.forEach(b => {
        const d = b.booking_date;
        if (!byDate[d]) byDate[d] = { members: 0, guests: 0 };
        const pArr = Array.isArray(b.players) ? b.players : [];
        pArr.forEach(p => {
            if (p.is_member || p.isMember) byDate[d].members++;
            else byDate[d].guests++;
        });
        if (pArr.length === 0) {
            byDate[d].guests += (b.total_players || 1);
        }
    });

    const sortedDates = Object.keys(byDate).sort();
    const labelsDate = sortedDates.map(d => d.substring(5)); // MM-DD
    const memberData = sortedDates.map(d => byDate[d].members);
    const guestData = sortedDates.map(d => byDate[d].guests);

    createOrUpdateChart('chart-afluencia-timeline', {
        type: 'bar',
        data: {
            labels: labelsDate.length > 0 ? labelsDate : ['Sin datos'],
            datasets: [
                {
                    label: 'Socios',
                    data: memberData.length > 0 ? memberData : [0],
                    backgroundColor: 'rgba(48, 161, 98, 0.85)',
                    borderColor: '#30A162',
                    borderWidth: 1,
                    borderRadius: 6
                },
                {
                    label: 'Invitados',
                    data: guestData.length > 0 ? guestData : [0],
                    backgroundColor: 'rgba(59, 130, 246, 0.85)',
                    borderColor: '#3B82F6',
                    borderWidth: 1,
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#94a3b8', font: { weight: 'bold', size: 11 } } },
                tooltip: { padding: 10, cornerRadius: 8 }
            },
            scales: {
                x: { stacked: true, grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#94a3b8', font: { weight: 'bold' } } },
                y: { stacked: true, grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#94a3b8', stepSize: 1 } }
            }
        }
    });

    // 2. Day of Week Chart
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    rawBookings.forEach(b => {
        if (b.booking_date) {
            const [y, m, d] = b.booking_date.split('-').map(Number);
            const dt = new Date(y, m - 1, d);
            const cnt = Array.isArray(b.players) && b.players.length > 0 ? b.players.length : (b.total_players || 1);
            dayCounts[dt.getDay()] += cnt;
        }
    });

    // Reorder Mon to Sun
    const weekLabels = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const weekData = [dayCounts[1], dayCounts[2], dayCounts[3], dayCounts[4], dayCounts[5], dayCounts[6], dayCounts[0]];

    createOrUpdateChart('chart-afluencia-weekdays', {
        type: 'bar',
        data: {
            labels: weekLabels,
            datasets: [{
                label: 'Jugadores',
                data: weekData,
                backgroundColor: 'rgba(168, 85, 247, 0.75)',
                borderColor: '#A855F7',
                borderWidth: 1,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { padding: 10, cornerRadius: 8 }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { weight: 'bold', size: 10 } } },
                y: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#94a3b8', stepSize: 2 } }
            }
        }
    });

    // 3. Peak Hours Chart
    const slots = [
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

    const slotCounts = {};
    slots.forEach(s => slotCounts[s] = 0);

    rawBookings.forEach(b => {
        const time = (b.booking_time || '08:00').substring(0, 5);
        const cnt = Array.isArray(b.players) && b.players.length > 0 ? b.players.length : (b.total_players || 1);
        if (slotCounts[time] !== undefined) {
            slotCounts[time] += cnt;
        } else {
            slotCounts[time] = cnt;
        }
    });

    const hourLabels = Object.keys(slotCounts);
    const hourData = Object.values(slotCounts);

    createOrUpdateChart('chart-horas-pico', {
        type: 'bar',
        data: {
            labels: hourLabels,
            datasets: [{
                label: 'Jugadores por Horario',
                data: hourData,
                backgroundColor: hourData.map(v => v === Math.max(...hourData) && v > 0 ? 'rgba(239, 68, 68, 0.85)' : 'rgba(56, 189, 248, 0.75)'),
                borderColor: hourData.map(v => v === Math.max(...hourData) && v > 0 ? '#EF4444' : '#38BDF8'),
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: (ctx) => ` ${ctx.parsed.y} jugador(es) salieron a las ${ctx.label}`
                    }
                }
            },
            scales: {
                x: { grid: { color: 'rgba(51, 65, 85, 0.2)' }, ticks: { color: '#94a3b8', font: { weight: 'bold', size: 9 }, maxRotation: 45 } },
                y: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#94a3b8', stepSize: 1 } }
            }
        }
    });
}

// ── TAB 2: RENTA DE CARRITOS ──────────────────────────────────────────────────
function renderCarritosTab(container) {
    let totalCarts = 0;
    let cartsIncome = 0;
    let totalBookingsWithCarts = 0;
    const byDateCarts = {};

    rawBookings.forEach(b => {
        const d = b.booking_date;
        const carts = Number(b.total_carts) || 0;
        const income = Number(b.cart_fee_total) || 0;

        totalCarts += carts;
        cartsIncome += income;
        if (carts > 0) totalBookingsWithCarts++;

        if (!byDateCarts[d]) byDateCarts[d] = { carts: 0, income: 0 };
        byDateCarts[d].carts += carts;
        byDateCarts[d].income += income;
    });

    const percentWithCart = rawBookings.length > 0 ? Math.round((totalBookingsWithCarts / rawBookings.length) * 100) : 0;
    const avgCartsPerBooking = rawBookings.length > 0 ? (totalCarts / rawBookings.length).toFixed(1) : 0;

    container.innerHTML = `
        <!-- KPI Row -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Carritos Rentados</p>
                    <h3 class="text-3xl font-black text-teal-400 mt-1">${totalCarts}</h3>
                    <p class="text-[10px] font-bold text-slate-400 mt-1">En ${rawBookings.length} salidas registradas</p>
                </div>
                <div class="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <span class="material-icons">electric_rickshaw</span>
                </div>
            </div>

            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingresos por Renta</p>
                    <h3 class="text-3xl font-black text-emerald-400 mt-1">$${cartsIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
                    <p class="text-[10px] font-bold text-slate-400 mt-1">Promedio por carrito: $${totalCarts > 0 ? (cartsIncome / totalCarts).toFixed(0) : '0'}</p>
                </div>
                <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <span class="material-icons">paid</span>
                </div>
            </div>

            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adopción de Carritos</p>
                    <h3 class="text-3xl font-black text-white mt-1">${percentWithCart}%</h3>
                    <p class="text-[10px] font-bold text-purple-400 mt-1">Promedio: ${avgCartsPerBooking} carritos / grupo</p>
                </div>
                <div class="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <span class="material-icons">donut_large</span>
                </div>
            </div>
        </div>

        <!-- Carts Evolution Chart -->
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-base font-black text-white uppercase tracking-tight">Renta de Carritos por Fecha</h3>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Volumen Diario de Carritos e Ingresos Recaudados</p>
                </div>
                <span class="material-icons text-teal-400">trending_up</span>
            </div>
            <div class="relative h-72 w-full">
                <canvas id="chart-carritos-timeline"></canvas>
            </div>
        </div>

        <!-- Carts Table -->
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 class="text-base font-black text-white uppercase tracking-tight">Registro de Renta por Fecha</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                    <thead>
                        <tr class="border-b border-slate-800 text-slate-400 font-black uppercase tracking-wider">
                            <th class="py-3 px-4">Fecha</th>
                            <th class="py-3 px-4 text-center">Carritos Rentados</th>
                            <th class="py-3 px-4 text-right">Ingreso por Carritos</th>
                            <th class="py-3 px-4 text-right">Ingreso Promedio</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 font-bold">
                        ${Object.keys(byDateCarts).sort().reverse().map(d => `
                            <tr class="hover:bg-slate-800/40 transition-colors">
                                <td class="py-3.5 px-4 text-white font-black">${d}</td>
                                <td class="py-3.5 px-4 text-center text-teal-400 font-black">${byDateCarts[d].carts}</td>
                                <td class="py-3.5 px-4 text-right text-emerald-400 font-black">$${byDateCarts[d].income.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                <td class="py-3.5 px-4 text-right text-slate-300">$${byDateCarts[d].carts > 0 ? (byDateCarts[d].income / byDateCarts[d].carts).toFixed(2) : '0.00'}</td>
                            </tr>
                        `).join('') || `<tr><td colspan="4" class="py-8 text-center text-slate-500 font-bold">Sin rentas de carritos en el periodo</td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    setTimeout(() => {
        if (typeof Chart === 'undefined') return;
        const sortedDates = Object.keys(byDateCarts).sort();
        const labels = sortedDates.map(d => d.substring(5));
        const cartsData = sortedDates.map(d => byDateCarts[d].carts);
        const incomeData = sortedDates.map(d => byDateCarts[d].income);

        createOrUpdateChart('chart-carritos-timeline', {
            type: 'line',
            data: {
                labels: labels.length > 0 ? labels : ['Sin datos'],
                datasets: [
                    {
                        label: 'Carritos Rentados',
                        data: cartsData.length > 0 ? cartsData : [0],
                        borderColor: '#2DD4BF',
                        backgroundColor: 'rgba(45, 212, 191, 0.15)',
                        fill: true,
                        tension: 0.3,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Ingresos ($)',
                        data: incomeData.length > 0 ? incomeData : [0],
                        borderColor: '#30A162',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        tension: 0.3,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#94a3b8', font: { weight: 'bold' } } }
                },
                scales: {
                    x: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#94a3b8', font: { weight: 'bold' } } },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: { color: 'rgba(51, 65, 85, 0.3)' },
                        ticks: { color: '#2DD4BF', stepSize: 1 }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: { color: '#30A162' }
                    }
                }
            }
        });
    }, 50);
}

// ── TAB 3: RANKING DE SOCIOS & FIDELIDAD ───────────────────────────────────────
function renderSociosTab(container) {
    const memberStats = {};

    rawBookings.forEach(b => {
        const pArr = Array.isArray(b.players) ? b.players : [];
        const isGuestCount = pArr.filter(p => !p.is_member && !p.isMember).length;

        pArr.forEach(p => {
            if (p.is_member || p.isMember) {
                const key = p.member_number || p.member_id || p.name;
                if (!memberStats[key]) {
                    memberStats[key] = {
                        name: p.name || 'Socio',
                        number: p.member_number || '--',
                        gamesCount: 0,
                        lastDate: b.booking_date,
                        guestsBrought: 0
                    };
                }
                memberStats[key].gamesCount++;
                if (b.booking_date > memberStats[key].lastDate) {
                    memberStats[key].lastDate = b.booking_date;
                }
                if (p.name === b.contact_name || p === pArr[0]) {
                    memberStats[key].guestsBrought += isGuestCount;
                }
            }
        });
    });

    const sortedMembers = Object.values(memberStats).sort((a, b) => b.gamesCount - a.gamesCount);
    const top10 = sortedMembers.slice(0, 10);

    const activeRoster = allMembers.filter(m => (m.status === 'ACTIVE' || !m.status));
    const playedMemberNumbers = new Set(Object.values(memberStats).map(m => m.number));

    const inactiveMembers = activeRoster.filter(m => {
        return !playedMemberNumbers.has(m.member_number);
    });

    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Top 3 Podium Cards -->
            <div class="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                ${renderPodiumCard(top10[0], 1, 'amber-400', '🥇 1er Lugar')}
                ${renderPodiumCard(top10[1], 2, 'slate-300', '🥈 2do Lugar')}
                ${renderPodiumCard(top10[2], 3, 'amber-600', '🥉 3er Lugar')}
            </div>

            <!-- Top 10 Ranking Table -->
            <div class="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-base font-black text-white uppercase tracking-tight">Ranking de Socios con Más Salidas</h3>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Socios más activos en el periodo seleccionado</p>
                    </div>
                    <span class="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-black uppercase">
                        ${sortedMembers.length} Socios Activos
                    </span>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs">
                        <thead>
                            <tr class="border-b border-slate-800 text-slate-400 font-black uppercase tracking-wider">
                                <th class="py-3 px-4 text-center">#</th>
                                <th class="py-3 px-4">Socio</th>
                                <th class="py-3 px-4 text-center">Núm. Socio</th>
                                <th class="py-3 px-4 text-center">Salidas / Juegos</th>
                                <th class="py-3 px-4 text-center">Invitados Traídos</th>
                                <th class="py-3 px-4 text-right">Última Salida</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60 font-bold">
                            ${top10.map((m, idx) => `
                                <tr class="hover:bg-slate-800/40 transition-colors">
                                    <td class="py-3.5 px-4 text-center font-black ${idx === 0 ? 'text-amber-400 text-sm' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'}">
                                        ${idx + 1}
                                    </td>
                                    <td class="py-3.5 px-4 text-white font-black flex items-center gap-2.5">
                                        <div class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-primary font-bold text-xs">
                                            ${m.name.charAt(0)}
                                        </div>
                                        ${m.name}
                                    </td>
                                    <td class="py-3.5 px-4 text-center text-slate-300">${m.number}</td>
                                    <td class="py-3.5 px-4 text-center text-emerald-400 font-black text-sm">${m.gamesCount}</td>
                                    <td class="py-3.5 px-4 text-center text-blue-400 font-black">${m.guestsBrought}</td>
                                    <td class="py-3.5 px-4 text-right text-slate-400">${m.lastDate || '--'}</td>
                                </tr>
                            `).join('') || `<tr><td colspan="6" class="py-8 text-center text-slate-500 font-bold">No hay registros de salidas de socios en el periodo</td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Inactive Members Alert Panel -->
            <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="material-icons text-rose-400 text-lg">warning_amber</span>
                            <h3 class="text-base font-black text-white uppercase tracking-tight">Socios Inactivos</h3>
                        </div>
                        <span class="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[10px] font-black">
                            ${inactiveMembers.length} Socios
                        </span>
                    </div>
                    <p class="text-xs font-bold text-slate-400 mt-1">
                        Socios activos en el padrón que no han salido al campo en el periodo seleccionado.
                    </p>

                    <div class="mt-4 space-y-2.5 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                        ${inactiveMembers.slice(0, 15).map(m => `
                            <div class="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors">
                                <div>
                                    <p class="text-xs font-black text-white">${m.name}</p>
                                    <p class="text-[10px] font-bold text-slate-500">#${m.member_number} · ${m.phone || 'Sin tel.'}</p>
                                </div>
                                <span class="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md text-[9px] font-black uppercase">
                                    Sin Salidas
                                </span>
                            </div>
                        `).join('') || `<p class="py-6 text-center text-xs text-slate-500 font-bold">¡Excelente! Todos los socios han tenido actividad.</p>`}
                    </div>
                </div>

                ${inactiveMembers.length > 15 ? `
                    <p class="text-[10px] text-center font-bold text-slate-500 pt-2 border-t border-slate-800">
                        +${inactiveMembers.length - 15} socios adicionales sin salidas
                    </p>
                ` : ''}
            </div>
        </div>
    `;
}

function renderPodiumCard(member, rank, color, label) {
    if (!member) {
        return `
            <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 opacity-60">
                <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">${label}</p>
                <h4 class="text-lg font-black text-slate-400 mt-2">Sin datos</h4>
            </div>
        `;
    }

    return `
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden shadow-xl hover:border-${color}/40 transition-all">
            <div class="flex items-center justify-between">
                <span class="px-3 py-1 bg-${color}/10 text-${color} border border-${color}/20 rounded-full text-[10px] font-black uppercase tracking-wider">
                    ${label}
                </span>
                <span class="material-icons text-${color}">workspace_premium</span>
            </div>
            <div class="mt-4">
                <h4 class="text-lg font-black text-white truncate">${member.name}</h4>
                <p class="text-xs font-bold text-slate-400 mt-0.5">Socio #${member.number}</p>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                    <p class="text-[10px] font-bold text-slate-500 uppercase">Salidas</p>
                    <p class="text-xl font-black text-emerald-400">${member.gamesCount} juegos</p>
                </div>
                <div class="text-right">
                    <p class="text-[10px] font-bold text-slate-500 uppercase">Invitados</p>
                    <p class="text-sm font-black text-blue-400">${member.guestsBrought} personas</p>
                </div>
            </div>
        </div>
    `;
}

// ── TAB 4: FINANZAS & MÉTODOS DE PAGO ──────────────────────────────────────────
function renderFinanzasTab(container) {
    const paymentMethods = {
        'EFECTIVO': { count: 0, total: 0, label: 'Efectivo en Caja', color: '#10B981', icon: 'payments', isCourtesy: false },
        'TARJETA': { count: 0, total: 0, label: 'Tarjeta Crédito/Débito', color: '#3B82F6', icon: 'credit_card', isCourtesy: false },
        'TRANSFERENCIA': { count: 0, total: 0, label: 'Transferencia Bancaria (SPEI)', color: '#8B5CF6', icon: 'account_balance', isCourtesy: false },
        'CARGO_SOCIO': { count: 0, total: 0, label: 'Cargo a Cuenta de Socio', color: '#F59E0B', icon: 'badge', isCourtesy: false },
        'CORTESIA': { count: 0, total: 0, label: 'Cortesía de la Directiva', color: '#A855F7', icon: 'flag', isCourtesy: true }
    };

    let grandTotal = 0;
    let totalGreenFees = 0;
    let totalCarts = 0;
    let totalClubIncome = 0;
    let totalClubRentals = 0;
    let totalCortesiaPlayers = 0;
    const courtesyEntries = [];

    rawBookings.forEach(b => {
        const amt = Number(b.total_amount) || 0;
        grandTotal += amt;
        totalGreenFees += Number(b.green_fee_total) || 0;
        totalCarts += Number(b.cart_fee_total) || 0;
        totalClubIncome += Number(b.club_rental_total) || 0;
        totalClubRentals += Number(b.total_club_rentals) || 0;

        const players = Array.isArray(b.players) ? b.players : [];
        let bookingHasCourtesy = false;
        const cortesiaBeneficiaries = [];
        const cortesiaAuthorizers = [];

        if (players.length > 0) {
            players.forEach(p => {
                const pType = p.player_type || (p.is_member ? 'MEMBER' : (p.convenio_id ? 'CONVENIO' : 'GUEST'));
                const pMethod = (p.payment_method || (pType === 'CORTESIA' ? 'CORTESIA' : (b.payment_method || 'EFECTIVO'))).toUpperCase();
                const pAmt = (Number(p.green_fee) || 0) + (Number(p.cart_fee) || 0) + (Number(p.club_fee) || 0);

                if (pMethod === 'CORTESIA' || pType === 'CORTESIA' || b.payment_method === 'CORTESIA') {
                    paymentMethods['CORTESIA'].count++;
                    totalCortesiaPlayers++;
                    bookingHasCourtesy = true;
                    cortesiaBeneficiaries.push(p.name || 'Beneficiario');
                    if (p.authorized_by) cortesiaAuthorizers.push(p.authorized_by);
                } else if (paymentMethods[pMethod]) {
                    paymentMethods[pMethod].count++;
                    paymentMethods[pMethod].total += pAmt;
                } else {
                    paymentMethods['EFECTIVO'].count++;
                    paymentMethods['EFECTIVO'].total += pAmt;
                }
            });
        } else {
            const method = (b.payment_method || 'EFECTIVO').toUpperCase();
            if (method === 'CORTESIA' || amt === 0) {
                const pCount = b.total_players || 1;
                paymentMethods['CORTESIA'].count += pCount;
                totalCortesiaPlayers += pCount;
                bookingHasCourtesy = true;
                cortesiaBeneficiaries.push(b.contact_name || 'Beneficiario');
                if (b.authorized_by) cortesiaAuthorizers.push(b.authorized_by);
            } else if (paymentMethods[method]) {
                paymentMethods[method].count++;
                paymentMethods[method].total += amt;
            } else {
                paymentMethods['EFECTIVO'].count++;
                paymentMethods['EFECTIVO'].total += amt;
            }
        }

        if (b.authorized_by && !cortesiaAuthorizers.includes(b.authorized_by)) {
            cortesiaAuthorizers.push(b.authorized_by);
        }

        if (bookingHasCourtesy || b.payment_method === 'CORTESIA' || amt === 0) {
            const uniqueAuthorizers = [...new Set(cortesiaAuthorizers.filter(Boolean))];
            courtesyEntries.push({
                ...b,
                cortesiaBeneficiaries: cortesiaBeneficiaries.length > 0 ? cortesiaBeneficiaries.join(', ') : (b.contact_name || 'Cortesía Directiva'),
                cortesiaAuthorizers: uniqueAuthorizers.length > 0 ? uniqueAuthorizers.join(', ') : (b.authorized_by || 'Directiva'),
                cortesiaCount: cortesiaBeneficiaries.length > 0 ? cortesiaBeneficiaries.length : (b.total_players || 1)
            });
        }
    });

    container.innerHTML = `
        <!-- Main Financial Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Cobrado (Caja)</p>
                    <h3 class="text-2xl font-black text-emerald-400 mt-1">$${grandTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
                    <p class="text-[10px] font-bold text-slate-400 mt-1">En ${rawBookings.length} folios procesados</p>
                </div>
                <div class="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <span class="material-icons">account_balance_wallet</span>
                </div>
            </div>

            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Green Fees Recaudados</p>
                    <h3 class="text-2xl font-black text-blue-400 mt-1">$${totalGreenFees.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
                    <p class="text-[10px] font-bold text-slate-400 mt-1">${grandTotal > 0 ? Math.round((totalGreenFees / grandTotal) * 100) : 0}% del ingreso</p>
                </div>
                <div class="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <span class="material-icons">sports_golf</span>
                </div>
            </div>

            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Renta de Carritos</p>
                    <h3 class="text-2xl font-black text-teal-400 mt-1">$${totalCarts.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
                    <p class="text-[10px] font-bold text-slate-400 mt-1">${grandTotal > 0 ? Math.round((totalCarts / grandTotal) * 100) : 0}% del ingreso</p>
                </div>
                <div class="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <span class="material-icons">electric_rickshaw</span>
                </div>
            </div>

            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Renta de Equipo (Palos)</p>
                    <h3 class="text-2xl font-black text-amber-400 mt-1">$${totalClubIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
                    <p class="text-[10px] font-bold text-slate-400 mt-1">${totalClubRentals} equipos rentados</p>
                </div>
                <div class="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <span class="material-icons">golf_course</span>
                </div>
            </div>
        </div>

        <!-- Payment Methods Doughnut + Breakdown -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
                <div>
                    <h3 class="text-base font-black text-white uppercase tracking-tight">Distribución por Método de Pago</h3>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Participación en Ingresos de Caja</p>
                    <div class="relative h-60 w-full flex items-center justify-center mt-2">
                        <canvas id="chart-payment-methods"></canvas>
                    </div>
                </div>
                ${totalCortesiaPlayers > 0 ? `
                    <div class="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-center">
                        <p class="text-xs font-black text-purple-300">⛳ ${totalCortesiaPlayers} Cortesía${totalCortesiaPlayers === 1 ? '' : 's'} Autorizada${totalCortesiaPlayers === 1 ? '' : 's'}</p>
                        <p class="text-[10px] text-slate-400 font-bold mt-0.5">Exentas de cobro de Green Fee</p>
                    </div>
                ` : ''}
            </div>

            <div class="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-base font-black text-white uppercase tracking-tight">Desglose de Métodos de Pago & Cortesías</h3>
                            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Montos en caja y volumen de cortesías por unidad</p>
                        </div>
                    </div>

                    <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        ${Object.keys(paymentMethods).map(k => {
                            const p = paymentMethods[k];

                            if (p.isCourtesy) {
                                return `
                                    <div class="p-4 bg-purple-950/40 border-2 border-purple-500/40 rounded-2xl flex items-center justify-between shadow-lg shadow-purple-950/20">
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                                                <span class="material-icons text-base">flag</span>
                                            </div>
                                            <div>
                                                <p class="text-xs font-black text-white flex items-center gap-1.5">
                                                    ${p.label}
                                                    <span class="text-[9px] font-black uppercase px-1.5 py-0.5 bg-purple-500/30 text-purple-300 rounded">Sin Cobro</span>
                                                </p>
                                                <p class="text-[10px] font-bold text-slate-400">
                                                    ${p.count === 0 ? 'Sin cortesías registradas' : `${p.count} jugador${p.count === 1 ? '' : 'es'} exento${p.count === 1 ? '' : 's'}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <span class="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-xl text-base font-black inline-block">
                                                ${p.count} ${p.count === 1 ? 'Cortesía' : 'Cortesías'}
                                            </span>
                                            <p class="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">Unidades</p>
                                        </div>
                                    </div>
                                `;
                            }

                            const pct = grandTotal > 0 ? Math.round((p.total / grandTotal) * 100) : 0;
                            return `
                                <div class="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center" style="color: ${p.color};">
                                            <span class="material-icons text-base">${p.icon}</span>
                                        </div>
                                        <div>
                                            <p class="text-xs font-black text-white">${p.label}</p>
                                            <p class="text-[10px] font-bold text-slate-500">${p.count} transacciones (${pct}%)</p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-sm font-black text-white">$${p.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                                        <p class="text-[9px] font-bold text-slate-500 uppercase">Recaudado</p>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>

        <!-- Courtesy Bookings Table (Audit) -->
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                        <span class="material-icons text-purple-400">flag</span> Auditoría de Cortesías y Salidas Exentas
                    </h3>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Registros y jugadores exentos con cortesía de la directiva</p>
                </div>
                <span class="px-3 py-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-black uppercase">
                    ⛳ ${totalCortesiaPlayers} Cortesía${totalCortesiaPlayers === 1 ? '' : 's'} (${courtesyEntries.length} Folios)
                </span>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                    <thead>
                        <tr class="border-b border-slate-800 text-slate-400 font-black uppercase tracking-wider bg-slate-950/40">
                            <th class="py-3 px-4">Folio</th>
                            <th class="py-3 px-4">Fecha & Hora</th>
                            <th class="py-3 px-4">Titular del Grupo</th>
                            <th class="py-3 px-4">Beneficiario(s) Cortesía</th>
                            <th class="py-3 px-4 text-amber-400">Autorizado Por</th>
                            <th class="py-3 px-4 text-center">Cortesías</th>
                            <th class="py-3 px-4 text-center">Carritos</th>
                            <th class="py-3 px-4">Notas</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 font-bold">
                        ${courtesyEntries.map(b => `
                            <tr class="hover:bg-slate-800/40 transition-colors">
                                <td class="py-3.5 px-4 text-slate-300 font-mono font-black">#${b.folio || '--'}</td>
                                <td class="py-3.5 px-4 text-white font-black">${b.booking_date} · ${b.booking_time} hrs</td>
                                <td class="py-3.5 px-4 text-slate-300">${b.contact_name}</td>
                                <td class="py-3.5 px-4 text-purple-300 font-black flex items-center gap-1.5">
                                    <span class="material-icons text-purple-400 text-xs">verified</span> ${b.cortesiaBeneficiaries}
                                </td>
                                <td class="py-3.5 px-4 text-amber-300 font-black">
                                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-black">
                                        <span class="material-icons text-sm text-amber-400">how_to_reg</span>
                                        ${b.cortesiaAuthorizers || 'Directiva'}
                                    </span>
                                </td>
                                <td class="py-3.5 px-4 text-center">
                                    <span class="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-lg text-[11px] font-black border border-purple-500/30">
                                        ${b.cortesiaCount} cortesía${b.cortesiaCount === 1 ? '' : 's'}
                                    </span>
                                </td>
                                <td class="py-3.5 px-4 text-center text-teal-400">${b.total_carts > 0 ? `🚗 ${b.total_carts}` : '—'}</td>
                                <td class="py-3.5 px-4 text-slate-400 italic">${b.notes || 'Cortesía autorizada'}</td>
                            </tr>
                        `).join('') || `<tr><td colspan="8" class="py-8 text-center text-slate-500 font-bold">No hay cortesías registradas en este periodo</td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    setTimeout(() => {
        if (typeof Chart === 'undefined') return;
        const monetaryMethods = Object.values(paymentMethods).filter(p => !p.isCourtesy);
        const labels = monetaryMethods.map(p => p.label);
        const data = monetaryMethods.map(p => p.total);
        const colors = monetaryMethods.map(p => p.color);

        createOrUpdateChart('chart-payment-methods', {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data.some(v => v > 0) ? data : [1],
                    backgroundColor: data.some(v => v > 0) ? colors : ['#334155'],
                    borderWidth: 2,
                    borderColor: '#0f172a'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8', font: { weight: 'bold', size: 10 } } }
                },
                cutout: '68%'
            }
        });
    }, 50);
}

// ── Chart Helper ──────────────────────────────────────────────────────────────
function createOrUpdateChart(canvasId, config) {
    try {
        if (chartInstances[canvasId]) {
            chartInstances[canvasId].destroy();
        }
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;
        chartInstances[canvasId] = new Chart(ctx, config);
        return chartInstances[canvasId];
    } catch (err) {
        console.warn('Error creating chart on', canvasId, err);
        return null;
    }
}

// ── CSV Export ────────────────────────────────────────────────────────────────
function exportToCSV() {
    if (rawBookings.length === 0) {
        alert('No hay datos disponibles para exportar en este periodo.');
        return;
    }

    const headers = [
        'Folio',
        'Fecha',
        'Hora',
        'Contacto',
        'Telefono',
        'Tipo de Grupo',
        'Total Jugadores',
        'Socios',
        'Invitados',
        'Cortesias',
        'Autorizado Por (Cortesias)',
        'Total Carritos',
        'Green Fee Total ($)',
        'Renta Carritos ($)',
        'Total Cobrado ($)',
        'Metodo de Pago',
        'Estatus',
        'Notas'
    ];

    const rows = rawBookings.map(b => {
        const pArr = Array.isArray(b.players) ? b.players : [];
        let membersCount = 0;
        let guestsCount = 0;
        let cortesiasCount = 0;
        const authorizers = [];
        pArr.forEach(p => {
            const pType = p.player_type || (p.is_member || p.isMember ? 'MEMBER' : (p.convenio_id ? 'CONVENIO' : 'GUEST'));
            if (pType === 'MEMBER' || p.is_member || p.isMember) membersCount++;
            else if (pType === 'CORTESIA' || p.payment_method === 'CORTESIA' || b.payment_method === 'CORTESIA') {
                cortesiasCount++;
                if (p.authorized_by) authorizers.push(p.authorized_by);
            }
            else guestsCount++;
        });
        if (pArr.length === 0) {
            if (b.payment_method === 'CORTESIA') cortesiasCount = b.total_players || 1;
            else guestsCount = b.total_players || 1;
        }
        if (b.authorized_by) authorizers.push(b.authorized_by);
        const uniqueAuthorizers = [...new Set(authorizers.filter(Boolean))];
        const authorizersStr = uniqueAuthorizers.length > 0 ? uniqueAuthorizers.join(', ') : (cortesiasCount > 0 ? 'Directiva' : '');

        return [
            `"${b.folio || ''}"`,
            `"${b.booking_date || ''}"`,
            `"${b.booking_time || ''}"`,
            `"${(b.contact_name || '').replace(/"/g, '""')}"`,
            `"${b.contact_phone || ''}"`,
            `"${b.group_type || ''}"`,
            b.total_players || 1,
            membersCount,
            guestsCount,
            cortesiasCount,
            `"${authorizersStr.replace(/"/g, '""')}"`,
            b.total_carts || 0,
            b.green_fee_total || 0,
            b.cart_fee_total || 0,
            b.total_amount || 0,
            `"${b.payment_method || ''}"`,
            `"${b.status || ''}"`,
            `"${(b.notes || '').replace(/"/g, '""')}"`
        ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_ColimaGC_${startDate}_al_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
