// ==============================================================================
// DASHBOARD MODULE (CLASSIC DARK THEME)
// Sistema Colima Golf Club
// ==============================================================================

export const renderDashboardModule = async (container, db, supabaseClient, hasPermission) => {
    const userStr = sessionStorage.getItem('cgc_user_data');
    const currentUser = userStr ? JSON.parse(userStr) : { full_name: 'Administrador', role: 'admin' };
    const firstName = (currentUser.full_name || 'Administrador').split(' ')[0];

    container.innerHTML = `
        <div class="space-y-8 max-w-7xl mx-auto animate-fade-in pb-12">
            
            <!-- Hero Welcome Card -->
            <div class="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl">
                <div class="absolute -right-10 -bottom-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div class="space-y-2">
                        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                            <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            Sistema Operativo 2026
                        </div>
                        <h1 class="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
                            ¡Hola, ${firstName}!
                        </h1>
                        <p class="text-slate-400 text-xs sm:text-sm max-w-xl font-medium">
                            Bienvenido al panel central de administración de <span class="text-white font-bold">Club de Golf Colima</span>. Selecciona un módulo o revisa el estado operativo en tiempo real.
                        </p>
                    </div>

                    <div class="flex flex-wrap items-center gap-3 shrink-0">
                        ${hasPermission('tournaments') ? `
                        <button onclick="window.renderTournaments()" class="flex items-center gap-2 px-5 py-3.5 bg-primary text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 cursor-pointer">
                            <span class="material-icons text-base">emoji_events</span> Ir a Torneos
                        </button>` : ''}
                        ${hasPermission('casaclub') ? `
                        <button onclick="window.renderReception()" class="flex items-center gap-2 px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-slate-700 cursor-pointer">
                            <span class="material-icons text-emerald-400 text-base">point_of_sale</span> Recepción
                        </button>` : ''}
                    </div>
                </div>
            </div>

            <!-- KPI Metric Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                <!-- Torneos Card -->
                <div onclick="window.renderTournaments && window.renderTournaments()" class="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-primary/40 transition-all cursor-pointer group relative overflow-hidden shadow-xl">
                    <div class="flex items-center justify-between">
                        <div class="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <span class="material-icons">emoji_events</span>
                        </div>
                        <span class="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-800 px-2.5 py-1 rounded-full">Activos</span>
                    </div>
                    <div class="mt-4">
                        <h3 id="dash-kpi-tournaments" class="text-3xl font-black text-white">...</h3>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Torneos Registrados</p>
                    </div>
                </div>

                <!-- Socios Card -->
                <div onclick="window.renderMembers && window.renderMembers()" class="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-blue-500/40 transition-all cursor-pointer group relative overflow-hidden shadow-xl">
                    <div class="flex items-center justify-between">
                        <div class="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                            <span class="material-icons">groups</span>
                        </div>
                        <span class="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">Padrón</span>
                    </div>
                    <div class="mt-4">
                        <h3 id="dash-kpi-members" class="text-3xl font-black text-white">...</h3>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Socios & Titulares</p>
                    </div>
                </div>

                <!-- Salidas Card -->
                <div onclick="window.renderReception && window.renderReception()" class="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/40 transition-all cursor-pointer group relative overflow-hidden shadow-xl">
                    <div class="flex items-center justify-between">
                        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                            <span class="material-icons">schedule</span>
                        </div>
                        <span class="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">Hoy</span>
                    </div>
                    <div class="mt-4">
                        <h3 id="dash-kpi-today-teetimes" class="text-3xl font-black text-white">...</h3>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Salidas Casa Club</p>
                    </div>
                </div>

                <!-- Handicaps WHS Card -->
                <div onclick="window.renderHandicapHub && window.renderHandicapHub()" class="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-amber-500/40 transition-all cursor-pointer group relative overflow-hidden shadow-xl">
                    <div class="flex items-center justify-between">
                        <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                            <span class="material-icons">analytics</span>
                        </div>
                        <span class="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">WHS</span>
                    </div>
                    <div class="mt-4">
                        <h3 id="dash-kpi-avg-hcp" class="text-3xl font-black text-white">...</h3>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Promedio Handicap</p>
                    </div>
                </div>

            </div>

            <!-- Operational Sections Quick Navigation Grid -->
            <div>
                <div class="flex items-center justify-between mb-5">
                    <div>
                        <h2 class="text-xl font-black text-white uppercase tracking-tight">Módulos del Sistema</h2>
                        <p class="text-slate-500 text-xs font-bold uppercase tracking-wider mt-0.5">Acceso rápido a las operaciones del club</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    
                    ${hasPermission('tournaments') ? `
                    <div onclick="window.renderTournaments()" class="bg-slate-900 border border-slate-800 hover:border-primary/40 rounded-3xl p-6 transition-all cursor-pointer group flex flex-col justify-between shadow-xl">
                        <div class="flex items-start justify-between">
                            <div class="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <span class="material-icons text-2xl">emoji_events</span>
                            </div>
                            <span class="material-icons text-slate-600 group-hover:text-primary group-hover:translate-x-1 transition-all">arrow_forward</span>
                        </div>
                        <div class="mt-6">
                            <h3 class="text-lg font-black text-white uppercase group-hover:text-primary transition-colors">Gestión de Torneos</h3>
                            <p class="text-xs text-slate-400 mt-1 font-medium">Administración de instancias de torneo, tarjetas O'Yes y leaderboard en vivo.</p>
                        </div>
                    </div>` : ''}

                    ${hasPermission('members') ? `
                    <div onclick="window.renderMembers()" class="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-3xl p-6 transition-all cursor-pointer group flex flex-col justify-between shadow-xl">
                        <div class="flex items-start justify-between">
                            <div class="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                <span class="material-icons text-2xl">groups</span>
                            </div>
                            <span class="material-icons text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all">arrow_forward</span>
                        </div>
                        <div class="mt-6">
                            <h3 class="text-lg font-black text-white uppercase group-hover:text-blue-400 transition-colors">Socios & Membresías</h3>
                            <p class="text-xs text-slate-400 mt-1 font-medium">Padrón de socios, control de pagos, vigencias de cuotas y expedientes de handicap.</p>
                        </div>
                    </div>` : ''}

                    ${hasPermission('casaclub') ? `
                    <div onclick="window.renderReception()" class="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-6 transition-all cursor-pointer group flex flex-col justify-between shadow-xl">
                        <div class="flex items-start justify-between">
                            <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                <span class="material-icons text-2xl">point_of_sale</span>
                            </div>
                            <span class="material-icons text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all">arrow_forward</span>
                        </div>
                        <div class="mt-6">
                            <h3 class="text-lg font-black text-white uppercase group-hover:text-emerald-400 transition-colors">Recepción & Tee Times</h3>
                            <p class="text-xs text-slate-400 mt-1 font-medium">Control de salidas cada 20 min, cobro de Green Fees, renta de carritos y corte de caja.</p>
                        </div>
                    </div>` : ''}

                    ${hasPermission('caddiemaster') ? `
                    <div onclick="window.renderCaddieMaster()" class="bg-slate-900 border border-slate-800 hover:border-teal-500/40 rounded-3xl p-6 transition-all cursor-pointer group flex flex-col justify-between shadow-xl">
                        <div class="flex items-start justify-between">
                            <div class="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                                <span class="material-icons text-2xl">golf_course</span>
                            </div>
                            <span class="material-icons text-slate-600 group-hover:text-teal-400 group-hover:translate-x-1 transition-all">arrow_forward</span>
                        </div>
                        <div class="mt-6">
                            <h3 class="text-lg font-black text-white uppercase group-hover:text-teal-400 transition-colors">Caddie Master & Hoyo 1</h3>
                            <p class="text-xs text-slate-400 mt-1 font-medium">Verificación express de jugadores en campo, asignación de caddies y bitácora.</p>
                        </div>
                    </div>` : ''}

                    ${hasPermission('handicaphub') ? `
                    <div onclick="window.renderHandicapHub()" class="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-6 transition-all cursor-pointer group flex flex-col justify-between shadow-xl">
                        <div class="flex items-start justify-between">
                            <div class="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                                <span class="material-icons text-2xl">analytics</span>
                            </div>
                            <span class="material-icons text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all">arrow_forward</span>
                        </div>
                        <div class="mt-6">
                            <h3 class="text-lg font-black text-white uppercase group-hover:text-amber-400 transition-colors">Handicaps WHS Oficial</h3>
                            <p class="text-xs text-slate-400 mt-1 font-medium">Tabla general por tee (Azul, Blanco, Dorado, Rojo) y cálculo diferencial WHS.</p>
                        </div>
                    </div>` : ''}

                    ${hasPermission('reports') ? `
                    <div onclick="window.renderReports()" class="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-6 transition-all cursor-pointer group flex flex-col justify-between shadow-xl">
                        <div class="flex items-start justify-between">
                            <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                <span class="material-icons text-2xl">insights</span>
                            </div>
                            <span class="material-icons text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all">arrow_forward</span>
                        </div>
                        <div class="mt-6">
                            <h3 class="text-lg font-black text-white uppercase group-hover:text-emerald-400 transition-colors">Reportes & Analíticas</h3>
                            <p class="text-xs text-slate-400 mt-1 font-medium">Afluencia, renta de carritos, horas pico, ranking de socios y exportación a Excel/PDF.</p>
                        </div>
                    </div>` : ''}

                </div>
            </div>

        </div>
    `;

    // Load Metrics Asynchronously
    try {
        // 1. Torneos count
        const { count: countTournaments } = await db.from('tournaments').select('*', { count: 'exact', head: true });
        const elTournaments = document.getElementById('dash-kpi-tournaments');
        if (elTournaments) elTournaments.textContent = countTournaments || 0;

        // 2. Socios count & average handicap
        const { data: membersData } = await db.from('members').select('current_handicap, status');
        if (membersData) {
            const elMembers = document.getElementById('dash-kpi-members');
            if (elMembers) elMembers.textContent = membersData.length;

            const hcps = membersData.map(m => parseFloat(m.current_handicap)).filter(h => !isNaN(h));
            const avgHcp = hcps.length > 0 ? (hcps.reduce((a, b) => a + b, 0) / hcps.length).toFixed(1) : '15.2';
            const elAvgHcp = document.getElementById('dash-kpi-avg-hcp');
            if (elAvgHcp) elAvgHcp.textContent = avgHcp;
        }

        // 3. Today's Tee Times
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: todayTeeTimes } = await db.from('tee_times').select('id').eq('play_date', todayStr);
        const elTeeTimes = document.getElementById('dash-kpi-today-teetimes');
        if (elTeeTimes) elTeeTimes.textContent = todayTeeTimes ? todayTeeTimes.length : 0;
    } catch (e) {
        console.warn('Error loading dashboard metrics:', e);
    }
};
