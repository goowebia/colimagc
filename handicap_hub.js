import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://tztolxgsaktqindoimtu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dG9seGdzYWt0cWluZG9pbXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzQ4ODAsImV4cCI6MjEwMTg1MDg4MH0.E2GABiOMXYb5hEwE9ErIcJa6_LHkj9lJUglQVoiLl0M';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
const dbMembers = supabaseClient.schema('members');
const dbStarter = supabaseClient.schema('starter');

let allMembers = [];
let selectedMember = null;
let memberScores = [];
let activeHubTab = 'CLUB_HANDICAP'; // 'CLUB_HANDICAP' or 'INDIVIDUAL'
let clubSearchQuery = '';
let selectedHcpDate = new Date().toISOString().split('T')[0];

// Official Club de Golf Colima & SpeiHandicap Tees Configuration
const TEES_CONFIG = [
    { color: 'BLANCO', code: 'B', label: 'Blanco (B)', bg: 'bg-slate-200 text-slate-950', text: 'text-slate-200', rating: 67.5, slope: 114, par: 68 },
    { color: 'DORADO', code: 'D', label: 'Dorado (D)', bg: 'bg-amber-400 text-slate-950', text: 'text-amber-400', rating: 65.8, slope: 110, par: 68 },
    { color: 'PLATA / ROJO', code: 'P', label: 'Plata / Rojo (P)', bg: 'bg-rose-600 text-white', text: 'text-rose-400', rating: 64.5, slope: 108, par: 68 }
];

export async function renderHandicapHubModule(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Header Banner SpeiHandicap Style -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <span class="material-icons" style="font-size:30px">analytics</span>
                    </div>
                    <div>
                        <h2 class="text-2xl font-black text-white uppercase tracking-tight">Handicap del Club · Club de Golf Colima</h2>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Tabla General de Handicaps por Tee de Salida & Consultas Individuales WHS</p>
                    </div>
                </div>

                <!-- Date Picker & Quick Actions -->
                <div class="flex items-center gap-3">
                    <div class="px-4 py-2 bg-slate-800 border border-slate-700 rounded-2xl">
                        <label class="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Selección Fecha de Handicap</label>
                        <input id="whs-date-picker" type="date" value="${selectedHcpDate}" class="bg-transparent text-xs font-black text-amber-400 focus:outline-none cursor-pointer">
                    </div>
                </div>
            </div>

            <!-- Sub Tabs Bar (SpeiHandicap Navigation Style) -->
            <div class="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button id="hub-tab-club" class="px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20">
                    <span class="material-icons" style="font-size:18px">table_chart</span> Club Handicap (Tabla General)
                </button>
                <button id="hub-tab-individual" class="px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-slate-900 text-slate-400 border border-slate-800 hover:text-white">
                    <span class="material-icons" style="font-size:18px">person</span> Handicap Individual
                </button>
            </div>

            <!-- Main Content Area -->
            <div id="whs-hub-content" class="w-full">
                <div class="py-16 text-center bg-slate-900/50 border border-slate-800 rounded-3xl">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mx-auto"></div>
                    <p class="text-xs text-slate-500 font-bold uppercase tracking-widest mt-3">Cargando Datos WHS...</p>
                </div>
            </div>
        </div>
    `;

    const btnClub = document.getElementById('hub-tab-club');
    const btnIndiv = document.getElementById('hub-tab-individual');

    btnClub.onclick = () => {
        activeHubTab = 'CLUB_HANDICAP';
        btnClub.className = 'px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20';
        btnIndiv.className = 'px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-slate-900 text-slate-400 border border-slate-800 hover:text-white';
        renderClubHandicapTable();
    };

    btnIndiv.onclick = () => {
        activeHubTab = 'INDIVIDUAL';
        btnIndiv.className = 'px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20';
        btnClub.className = 'px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-slate-900 text-slate-400 border border-slate-800 hover:text-white';
        renderIndividualView();
    };

    document.getElementById('whs-date-picker').onchange = (e) => {
        selectedHcpDate = e.target.value;
        if (activeHubTab === 'CLUB_HANDICAP') renderClubHandicapTable();
        else renderIndividualView();
    };

    await loadInitialData();
}

async function loadInitialData() {
    try {
        const { data: members } = await dbMembers.from('members').select('*').order('name', { ascending: true });
        allMembers = members || [];

        if (allMembers.length > 0) {
            selectedMember = allMembers[0];
            const { data: scores } = await dbStarter.from('member_scores')
                .select('*')
                .eq('member_id', selectedMember.id)
                .order('date_played', { ascending: false })
                .limit(20);
            memberScores = scores || [];
        }

        renderClubHandicapTable();
    } catch (e) {
        console.error('Error loading WHS hub data:', e);
    }
}

// Format Index value (Clean positive decimal, e.g. 24.8 or 17.4)
function formatIndexVal(val) {
    const v = Math.max(0, parseFloat(val) || 0);
    return v.toFixed(1);
}

// Compute Course Handicap per Tee using exact USGA / SpeiHandicap rounding rule:
// If decimal >= 0.5 -> round UP, if < 0.5 -> round DOWN (stay)
function computeCourseHandicapInteger(hi, tee) {
    const validIndex = Math.max(0, parseFloat(hi) || 0);
    const raw = validIndex * (tee.slope / 113);
    const integerPart = Math.floor(raw);
    const decimalPart = raw - integerPart;

    // Strict USGA / SpeiHandicap Rule: >= 0.5 rounds UP, < 0.5 rounds DOWN
    const ch = decimalPart >= 0.5 ? integerPart + 1 : integerPart;
    return Math.max(0, ch);
}

function computeAllMemberTeeHandicaps(hi) {
    return TEES_CONFIG.map(t => computeCourseHandicapInteger(hi, t));
}

// ================================================
// TAB 1: CLUB HANDICAP (TABLA GENERAL ESTILO SPEIHANDICAP)
// ================================================
function renderClubHandicapTable() {
    const container = document.getElementById('whs-hub-content');
    if (!container) return;

    const filtered = allMembers.filter(m => {
        if (!clubSearchQuery) return true;
        return `${m.name} ${m.member_number}`.toLowerCase().includes(clubSearchQuery);
    });

    container.innerHTML = `
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
            <!-- Header Controls for Club Handicap Table -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <span class="material-icons">groups</span>
                    </div>
                    <div>
                        <h3 class="font-black text-white text-lg uppercase tracking-tight">HANDICAP DEL CLUB</h3>
                        <p class="text-xs text-slate-400 font-bold uppercase">Club: <span class="text-white">CLUB DE GOLF COLIMA</span> · Fecha: <span class="text-amber-400 font-black">${selectedHcpDate}</span></p>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <div class="relative w-full sm:w-72">
                        <span class="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                        <input id="club-search-input" type="text" value="${clubSearchQuery}" placeholder="Buscar jugador..." class="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-400">
                    </div>
                    <button onclick="window.print()" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 transition-all shrink-0">
                        <span class="material-icons" style="font-size:16px">print</span> Imprimir
                    </button>
                </div>
            </div>

            <!-- General SpeiHandicap Table (Exact Match to SpeiHandicap Screenshot 1 & 2) -->
            <div class="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <div class="overflow-x-auto custom-scrollbar">
                    <table class="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr class="bg-slate-900 border-b border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                                <th class="px-6 py-4">Jugador</th>
                                <th class="px-6 py-4 text-center text-rose-500 font-black">Index</th>
                                <th class="px-6 py-4 text-center text-slate-200 font-black">B</th>
                                <th class="px-6 py-4 text-center text-amber-400 font-black">D</th>
                                <th class="px-6 py-4 text-center text-rose-400 font-black">P</th>
                                <th class="px-4 py-4 text-right">Consulta WHS</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60 font-bold">
                            ${filtered.map(m => {
                                const hi = parseFloat(m.current_handicap || 0);
                                const [chB, chD, chP] = computeAllMemberTeeHandicaps(hi);

                                return `
                                    <tr onclick="window.viewMemberWHSProfile('${m.id}')"
                                        class="hover:bg-slate-800/50 transition-colors cursor-pointer group">
                                        <td class="px-6 py-4">
                                            <div class="flex items-center gap-3">
                                                <span class="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 font-black text-[10px] rounded-md">#${m.member_number}</span>
                                                <span class="font-black text-white uppercase group-hover:text-amber-400 transition-colors text-sm">${m.name}</span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 text-center font-black text-rose-500 text-base">${formatIndexVal(hi)}</td>
                                        <td class="px-6 py-4 text-center font-black text-slate-200 text-base">${chB}</td>
                                        <td class="px-6 py-4 text-center font-black text-amber-400 text-base">${chD}</td>
                                        <td class="px-6 py-4 text-center font-black text-rose-400 text-base">${chP}</td>
                                        <td class="px-4 py-4 text-right" onclick="event.stopPropagation()">
                                            <button onclick="window.viewMemberWHSProfile('${m.id}')" class="px-3 py-1.5 bg-slate-800 hover:bg-amber-500/20 hover:border-amber-500/40 border border-slate-700 rounded-xl text-[11px] font-black text-amber-400 transition-all">
                                                Ver Tarjetas ➔
                                            </button>
                                        </td>
                                    </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    document.getElementById('club-search-input').oninput = (e) => {
        clubSearchQuery = e.target.value.toLowerCase().trim();
        renderClubHandicapTable();
    };
}

window.viewMemberWHSProfile = async function(memberId) {
    const btnIndiv = document.getElementById('hub-tab-individual');
    const btnClub = document.getElementById('hub-tab-club');

    activeHubTab = 'INDIVIDUAL';
    if (btnIndiv && btnClub) {
        btnIndiv.className = 'px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20';
        btnClub.className = 'px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-slate-900 text-slate-400 border border-slate-800 hover:text-white';
    }

    selectedMember = allMembers.find(m => String(m.id) === String(memberId));
    if (selectedMember) {
        const { data: scores } = await dbStarter.from('member_scores')
            .select('*')
            .eq('member_id', selectedMember.id)
            .order('date_played', { ascending: false })
            .limit(20);
        memberScores = scores || [];
    }
    renderIndividualView();
};

// ================================================
// TAB 2: HANDICAP INDIVIDUAL (JUGADOR & TARJETAS 18 HOYOS)
// ================================================
function renderIndividualView() {
    const container = document.getElementById('whs-hub-content');
    if (!container) return;

    if (!selectedMember) {
        container.innerHTML = `
            <div class="py-16 text-center bg-slate-900 border border-slate-800 rounded-3xl">
                <p class="text-xs text-slate-400 font-bold uppercase">Selecciona un jugador para consultar.</p>
            </div>`;
        return;
    }

    const todayStr = selectedHcpDate;

    // Calculate Low H.I. (Min differential in past 365 days)
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];

    const yearScores = memberScores.filter(s => s.date_played >= oneYearAgoStr);
    const minDiff = yearScores.length > 0
        ? Math.min(...yearScores.map(s => parseFloat(s.differential) || 99))
        : (selectedMember.current_handicap || 0.0);

    const lowHIFormatted = formatIndexVal(minDiff);

    // Calculate best differentials (top N used for WHS index calculation)
    const sortedDiffs = [...memberScores].sort((a, b) => (parseFloat(a.differential) || 0) - (parseFloat(b.differential) || 0));
    const count = memberScores.length;
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
    const hi = parseFloat(selectedMember.current_handicap || 0);
    const teeHandicaps = TEES_CONFIG.map(t => {
        const ch = computeCourseHandicapInteger(hi, t);
        return { ...t, ch };
    });

    container.innerHTML = `
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 animate-fade-in">
            <!-- Selector Dropdown Inside Individual View -->
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div class="relative w-full sm:w-80">
                    <label class="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Seleccionar Jugador</label>
                    <select id="select-individual-member" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-amber-400">
                        ${allMembers.map(m => `
                            <option value="${m.id}" ${String(m.id)===String(selectedMember.id)?'selected':''}>${m.name} (#${m.member_number})</option>
                        `).join('')}
                    </select>
                </div>
                <button onclick="window.renderHandicapHubModule(document.getElementById('handicap-app-root'))" class="px-4 py-2.5 bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold uppercase transition-all">
                    ⬅ Volver a Tabla General del Club
                </button>
            </div>

            <!-- Header SpeiHandicap Card -->
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
                <div class="flex items-center gap-5">
                    <div class="p-3 bg-white/5 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md shrink-0">
                        <img src="./golcolima.jpg" alt="Club Colima" class="h-16 w-auto object-contain rounded-xl" onerror="this.style.display='none'">
                    </div>
                    <div>
                        <p class="font-black text-blue-400 text-lg uppercase tracking-wide">ID Jugador: #${selectedMember.member_number}</p>
                        <h3 class="font-black text-white text-2xl uppercase tracking-tight leading-tight mt-0.5">${selectedMember.name}</h3>
                        <p class="text-xs text-slate-400 font-bold uppercase mt-1">Fecha Handicap: <span class="text-slate-200">${todayStr}</span></p>
                    </div>
                </div>

                <div class="flex items-center gap-4 bg-slate-950/80 p-4 border border-slate-800 rounded-2xl self-start lg:self-auto">
                    <div class="text-center px-4 border-r border-slate-800">
                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Handicap Índice</p>
                        <p class="text-3xl font-black text-rose-500 leading-tight mt-0.5">${formatIndexVal(hi)}</p>
                    </div>
                    <div class="text-center px-4">
                        <p class="text-[9px] font-black text-amber-400 uppercase tracking-widest">Low H.I. (365d)</p>
                        <p class="text-3xl font-black text-amber-400 leading-tight mt-0.5">${lowHIFormatted}</p>
                    </div>
                </div>
            </div>

            <!-- Color Badges (Tee Handicap Calculator - Exact Match to SpeiHandicap) -->
            <div>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Calculadora de Handicap de Campo por Marca de Salida (Tees)</p>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    ${teeHandicaps.map(t => `
                        <div class="p-5 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-2 shadow-lg hover:border-slate-700 transition-all">
                            <span class="inline-block px-5 py-1.5 rounded-lg font-black text-sm uppercase shadow-md ${t.bg}">${t.label}</span>
                            <p class="text-4xl font-black ${t.text} mt-2">${t.ch}</p>
                            <p class="text-xs font-bold text-slate-500 uppercase">RTG: ${t.rating} / SLO: ${t.slope}</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- 20 Recent WHS Rounds Table (Estilo SpeiHandicap) -->
            <div class="space-y-4 pt-2">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 class="font-black text-white uppercase text-base tracking-tight flex items-center gap-2">
                        <span class="material-icons text-amber-400">history_edu</span> Historial de Rondas WHS Registradas
                    </h4>
                    <span class="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                        🌟 Las rondas verdes promedian tu Handicap Index actual (${numUsed} de ${count})
                    </span>
                </div>

                ${memberScores.length === 0 ? `
                    <div class="py-16 text-center bg-slate-950/60 border border-slate-800 rounded-3xl">
                        <span class="material-icons text-slate-600 text-5xl mb-2">sports_golf</span>
                        <p class="text-sm font-black text-slate-400 uppercase tracking-widest">Aún no hay tarjetas capturadas para este jugador</p>
                        <p class="text-xs text-slate-600 mt-1">Registra rondas desde el portal de Caddie Master para actualizar este historial.</p>
                    </div>
                ` : `
                    <div class="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                        <div class="overflow-x-auto custom-scrollbar">
                            <table class="w-full text-left border-collapse min-w-[750px] text-xs">
                                <thead>
                                    <tr class="bg-slate-900 border-b border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                        <th class="px-5 py-4">Fecha</th>
                                        <th class="px-5 py-4">Campo</th>
                                        <th class="px-5 py-4 text-center">Tee</th>
                                        <th class="px-5 py-4 text-center">RTG / SLO</th>
                                        <th class="px-5 py-4 text-center">Score (SA)</th>
                                        <th class="px-5 py-4 text-center">Diferencial (WHS)</th>
                                        <th class="px-5 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-800/60">
                                    ${memberScores.map(s => {
                                        const isUsed = usedIds.has(s.id);
                                        const rawDiff = parseFloat(s.differential || 0);
                                        const diffVal = formatIndexVal(rawDiff);
                                        const teeCol = s.tee_color || 'BLANCO';
                                        return `
                                            <tr class="hover:bg-slate-800/50 transition-colors ${isUsed ? 'bg-emerald-500/10' : ''}">
                                                <td class="px-5 py-4 text-slate-300 font-bold">${new Date(s.date_played + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                <td class="px-5 py-4 font-black text-white uppercase text-sm">${s.course_name || 'CLUB DE GOLF COLIMA'}</td>
                                                <td class="px-5 py-4 text-center">
                                                    <span class="px-3 py-1 rounded-lg font-black text-[10px] uppercase bg-slate-800 text-slate-300 border border-slate-700">${teeCol}</span>
                                                </td>
                                                <td class="px-5 py-4 text-center font-bold text-slate-400">${s.course_rating || 67.5} / ${s.slope_rating || 114}</td>
                                                <td class="px-5 py-4 text-center font-black text-white text-base">${s.gross_score}</td>
                                                <td class="px-5 py-4 text-center font-black text-base ${isUsed ? 'text-emerald-400' : 'text-slate-400'}">
                                                    ${isUsed ? '🌟 ' : ''}${diffVal}
                                                </td>
                                                <td class="px-5 py-4 text-right">
                                                    <div class="flex items-center justify-end gap-2">
                                                        ${s.hole_scores ? `
                                                            <button onclick="window.toggleWHSDetail('${s.id}')" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-all">
                                                                Ver 18 Hoyos
                                                            </button>
                                                        ` : ''}
                                                        <button onclick="window.deleteWHSScoreItem('${s.id}', '${selectedMember.id}')" title="Eliminar ronda" class="w-8 h-8 bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 rounded-xl flex items-center justify-center transition-all">
                                                            <span class="material-icons" style="font-size:16px">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            ${s.hole_scores ? `
                                                <tr id="whs-detail-${s.id}" class="hidden bg-slate-950">
                                                    <td colspan="7" class="p-5">
                                                        <div class="text-xs font-black text-slate-400 uppercase mb-3 flex items-center justify-between">
                                                            <span>Tarjeta Hoyo por Hoyo (${s.gross_score} Golpes Gross)</span>
                                                            <span class="text-emerald-400 font-bold">Diferencial: ${diffVal}</span>
                                                        </div>
                                                        <div class="grid grid-cols-9 sm:grid-cols-18 gap-1.5 text-center text-xs">
                                                            ${Object.entries(s.hole_scores).map(([hk, hv]) => `
                                                                <div class="p-2 bg-slate-900 border border-slate-800 rounded-xl">
                                                                    <p class="text-[9px] font-bold text-slate-500">${hk.replace('h', '#')}</p>
                                                                    <p class="font-black text-emerald-400 text-sm">${hv || '—'}</p>
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
                    </div>
                `}
            </div>
        </div>
    `;

    document.getElementById('select-individual-member').onchange = (e) => {
        window.viewMemberWHSProfile(e.target.value);
    };
}

window.toggleWHSDetail = function(scoreId) {
    const row = document.getElementById(`whs-detail-${scoreId}`);
    if (row) row.classList.toggle('hidden');
};

window.deleteWHSScoreItem = async function(scoreId, memberId) {
    window.showNotification(
        'Eliminar Tarjeta',
        '¿Deseas eliminar esta ronda del historial del socio? El Handicap Index se recalculará automáticamente.',
        'confirm',
        async () => {
            const { error } = await dbStarter.from('member_scores').delete().eq('id', scoreId);
            if (error) {
                window.showNotification('Error', 'No se pudo eliminar la tarjeta: ' + error.message, 'error');
                return;
            }

            await recalculateMemberHandicap(memberId);
            window.showNotification('Tarjeta Eliminada', 'Se eliminó la ronda y se recalculó el Handicap del socio.', 'success');
            await selectMemberForWHS(memberId);
        }
    );
};

// USGA / WHS Handicap Index Recalculation Algorithm
async function recalculateMemberHandicap(memberId) {
    try {
        const { data: scores } = await dbStarter.from('member_scores')
            .select('*')
            .eq('member_id', memberId)
            .order('date_played', { ascending: false })
            .limit(20);

        if (!scores || scores.length === 0) {
            return;
        }

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

        await dbMembers.from('members').update({
            current_handicap: newHandicapIndex
        }).eq('id', memberId);

    } catch (err) {
        console.error('Error recalculating handicap:', err);
    }
}
