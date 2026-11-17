// ==========================================================================
// RANKING ACUMULADO DINÁMICO - CLUB DE GOLF COLIMA
// I RANKING STROKE PLAY INTERCLUBES 2026
// Regla Oficial: Cuatro Fechas · Dos Tarjetas · Un Campeón
// Cálculo dinámico de las 2 mejores tarjetas netas por jugador en Cat A, B, C
// ==========================================================================

let rankingDb = null;
let rankingSupabaseClient = null;
let cachedRankingData = null;
let currentCategoryFilter = 'TODAS';
let currentSearchQuery = '';

export function initRankingAcumulado(supabaseClient, db) {
    rankingSupabaseClient = supabaseClient;
    rankingDb = db;

    if (typeof window !== 'undefined') {
        window.openRankingAcumuladoModal = openRankingAcumuladoModal;
        window.closeRankingAcumuladoModal = closeRankingAcumuladoModal;
        window.setRankingCategoryFilter = setRankingCategoryFilter;
        window.filterRankingBySearch = filterRankingBySearch;
        window.printRankingAcumulado = printRankingAcumulado;
        window.refreshRankingAcumuladoData = refreshRankingAcumuladoData;
    }
}

// Normalizador de nombres para cruce consistente entre torneos
function normalizePlayerKey(str) {
    if (!str) return '';
    return str
        .trim()
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ');
}

function cleanTokens(str) {
    return str.toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 2 && !['DEL','LOS','LAS','SAN','JOSE','LUIS','FRANCISCO','JESUS','MARIA'].includes(t));
}

function normalizeCategory(cat) {
    if (!cat) return 'CATEGORIA B';
    const c = cat.replace(/\s+/g, ' ').trim().toUpperCase();
    if (c.endsWith(' A') || c === 'A' || c === 'CATEGORIA A' || c.includes('CAT A') || c.includes('CATEGORIA A')) return 'CATEGORIA A';
    if (c.endsWith(' B') || c === 'B' || c === 'CATEGORIA B' || c.includes('CAT B') || c.includes('CATEGORIA B')) return 'CATEGORIA B';
    if (c.endsWith(' C') || c === 'C' || c === 'CATEGORIA C' || c.includes('CAT C') || c.includes('CATEGORIA C')) return 'CATEGORIA C';
    return 'CATEGORIA B';
}

// Clasificador de torneos del ranking
function isRankingTournament(t) {
    if (!t || !t.name) return false;
    if (['b73a7380-589d-4986-84c4-7618d805fced', '291bcd9c-674b-431e-9fd4-5690ce2b7b94', '69452b77-44c7-400a-bb88-a763da03196b', 'dfecb440-d4ee-485f-b6d1-ad27f5032fc7'].includes(t.id)) {
        return true;
    }
    const n = t.name.toLowerCase();
    if (n.includes('nov') || n.includes('pavo') || n.includes('ramos') || n.includes('mecate')) return false;
    return (n.includes('agosto') || n.includes('sept') || n.includes('ranking')) && (n.includes('8') || n.includes('22') || n.includes('5') || n.includes('26'));
}

// Obtención y cálculo en tiempo real del Ranking Acumulado
export async function getCalculatedRankingData(forceRefresh = false) {
    if (cachedRankingData && !forceRefresh) {
        return cachedRankingData;
    }

    try {
        // 1. Obtener todos los torneos del ranking ordenados cronológicamente
        const { data: allTours, error: tErr } = await rankingDb
            .from('tournaments')
            .select('id, name, created_at')
            .order('created_at', { ascending: true });

        if (tErr || !allTours) {
            console.error('Error fetching tournaments for ranking:', tErr);
            return null;
        }

        const rankingTours = allTours.filter(isRankingTournament);

        // Si no se encontraron por nombre, usar los más recientes
        const activeTours = rankingTours.length > 0 ? rankingTours : allTours.slice(-4);

        // Identificar y etiquetar las 4 fechas oficiales
        // Fecha 1: 8 Agosto
        // Fecha 2: 22 Agosto
        // Fecha 3: 5 Septiembre
        // Fecha 4: 26 Septiembre (o la fecha final cuando se cree)
        const tourFechas = [];
        activeTours.forEach((t) => {
            const n = t.name.toLowerCase();
            let label = t.name;
            let shortDate = '';
            let order = 99;

            if (t.id === 'b73a7380-589d-4986-84c4-7618d805fced' || ((n.includes('8') || n.includes('1ª') || n.includes('1a')) && n.includes('ago') && !n.includes('nov'))) {
                label = '1ª Fecha (8 Ago)';
                shortDate = '8 AGO';
                order = 1;
            } else if (t.id === '291bcd9c-674b-431e-9fd4-5690ce2b7b94' || (n.includes('22') && n.includes('ago'))) {
                label = '2ª Fecha (22 Ago)';
                shortDate = '22 AGO';
                order = 2;
            } else if (t.id === '69452b77-44c7-400a-bb88-a763da03196b' || ((n.includes('5') || n.includes('3ª') || n.includes('3a')) && (n.includes('sep') || n.includes('sept')) && !n.includes('nov'))) {
                label = '3ª Fecha (5 Sept)';
                shortDate = '5 SEPT';
                order = 3;
            } else if (t.id === 'dfecb440-d4ee-485f-b6d1-ad27f5032fc7' || ((n.includes('26') || n.includes('4ª') || n.includes('4a')) && (n.includes('sep') || n.includes('sept')) && !n.includes('nov'))) {
                label = '4ª Fecha · Final (26 Sept)';
                shortDate = '26 SEPT';
                order = 4;
            } else {
                order = tourFechas.length + 1;
                shortDate = t.name.slice(0, 10);
            }

            tourFechas.push({
                id: t.id,
                name: t.name,
                label,
                shortDate,
                order,
                created_at: t.created_at
            });
        });

        tourFechas.sort((a, b) => a.order - b.order || new Date(a.created_at) - new Date(b.created_at));

        // Siempre aseguramos que exista la columna de la 4ª fecha del 26 de septiembre aunque aún no tenga registros en DB
        const hasF4 = tourFechas.some(f => f.order === 4 || f.shortDate.includes('26') || f.name.toLowerCase().includes('26'));
        if (!hasF4 && tourFechas.length <= 3) {
            tourFechas.push({
                id: 'tourney-4-placeholder',
                name: '4ª FECHA (26 SEPT)',
                label: '4ª Fecha · Gran Final (26 Sept)',
                shortDate: '26 SEPT',
                order: 4,
                isPending: true
            });
        }

        const tourIds = tourFechas.filter(f => !f.isPending).map(f => f.id);

        // 2. Traer todos los equipos/jugadores y scores de esos torneos
        const [teamsRes, scoresRes] = await Promise.all([
            rankingDb.from('teams').select('*').in('eventid', tourIds),
            rankingDb.from('scores').select('*').in('eventid', tourIds)
        ]);

        const allTeams = teamsRes.data || [];
        const allScores = scoresRes.data || [];

        // 3. Agrupar por jugador con unificación inteligente entre fechas
        const playerProfiles = [];

        allTeams.forEach(t => {
            const rawName = (t.teamname || '').trim();
            if (!rawName) return;
            const cat = normalizeCategory(t.category);
            const tokens = cleanTokens(rawName);

            // Buscar si ya existe este jugador en su misma categoría
            let profile = playerProfiles.find(p => {
                if (p.category !== cat) return false;
                const pTokens = cleanTokens(p.name);
                const common = tokens.filter(tok => pTokens.includes(tok));
                if (common.length >= 2) return true;
                // Tokens poco comunes / nombres únicos
                const rareTokens = tokens.filter(tok => tok.length >= 4);
                const pRareTokens = pTokens.filter(tok => tok.length >= 4);
                const rareCommon = rareTokens.filter(tok => pRareTokens.includes(tok));
                if (rareCommon.some(rt => ['INDALECIO', 'CUAUHTEMOC', 'CUAHUTEMOC', 'SHIAN', 'AYEN', 'LUPITA', 'CAIN', 'HOFFMAN'].includes(rt))) return true;
                return false;
            });

            if (!profile) {
                profile = {
                    key: normalizePlayerKey(rawName),
                    name: rawName,
                    category: cat,
                    scoresByFecha: {}
                };
                playerProfiles.push(profile);
            } else {
                // Preferir nombre claro y conciso
                if (rawName.split(' ').length < profile.name.split(' ').length && rawName.split(' ').length >= 2) {
                    profile.name = rawName;
                }
            }

            // Buscar scores del equipo en este torneo
            const teamScores = allScores.filter(s => String(s.teamid) === String(t.id));
            if (teamScores.length > 0) {
                const gross = teamScores.reduce((acc, s) => acc + (s.total || 0), 0);
                const ventaja = t.ventaja || 0;
                const neto = gross - (ventaja * teamScores.length);
                const latest = teamScores[0];

                profile.scoresByFecha[t.eventid] = {
                    gross,
                    neto,
                    ventaja,
                    rounds: teamScores.length,
                    in_score: latest.in_score || 0,
                    out_score: latest.out_score || 0
                };
            }
        });

        // 4. Calcular para cada jugador sus 2 mejores tarjetas
        const calculatedPlayers = playerProfiles.map(player => {
            const dateScores = [];
            tourFechas.forEach(f => {
                if (!f.isPending && player.scoresByFecha[f.id]) {
                    dateScores.push({
                        fechaId: f.id,
                        fechaOrder: f.order,
                        fechaLabel: f.shortDate,
                        ...player.scoresByFecha[f.id]
                    });
                }
            });

            // Ordenar por score NETO ascendente (menor es mejor en golf)
            dateScores.sort((a, b) => a.neto - b.neto);

            const roundsPlayed = dateScores.length;
            const isQualified = roundsPlayed >= 2;

            // Identificar los 2 mejores scores y los descartados
            let bestTwo = [];
            let discarded = [];
            let accumulatedNeto = 0;

            if (roundsPlayed >= 2) {
                bestTwo = dateScores.slice(0, 2);
                discarded = dateScores.slice(2);
                accumulatedNeto = bestTwo.reduce((sum, s) => sum + s.neto, 0);
            } else if (roundsPlayed === 1) {
                bestTwo = [dateScores[0]];
                accumulatedNeto = dateScores[0].neto;
            }

            const bestTwoFechaIds = new Set(bestTwo.map(b => b.fechaId));
            const discardedFechaIds = new Set(discarded.map(d => d.fechaId));

            // Mejor tarjeta individual para desempates
            const bestSingleNeto = bestTwo.length > 0 ? bestTwo[0].neto : 999;
            const bestOut = bestTwo.length > 0 ? Math.min(...bestTwo.map(b => b.out_score || 999)) : 999;
            const bestIn = bestTwo.length > 0 ? Math.min(...bestTwo.map(b => b.in_score || 999)) : 999;

            return {
                ...player,
                roundsPlayed,
                isQualified,
                bestTwo,
                discarded,
                bestTwoFechaIds,
                discardedFechaIds,
                accumulatedNeto,
                bestSingleNeto,
                bestOut,
                bestIn
            };
        });

        // 5. Agrupar por categoría y ordenar con reglas oficiales de desempate
        const categories = {
            'CATEGORIA A': [],
            'CATEGORIA B': [],
            'CATEGORIA C': []
        };

        calculatedPlayers.forEach(p => {
            let cat = p.category;
            if (!categories[cat]) {
                if (cat.includes('A')) cat = 'CATEGORIA A';
                else if (cat.includes('B')) cat = 'CATEGORIA B';
                else if (cat.includes('C')) cat = 'CATEGORIA C';
                else cat = 'CATEGORIA B'; // fallback
            }
            categories[cat].push(p);
        });

        // Ordenamiento por categoría:
        // 1. Los calificados (>= 2 fechas) van primero, ordenados por menor acumulado neto
        // 2. Desempate por mejor tarjeta individual, luego out, luego in
        // 3. Los jugadores con 1 sola fecha van al final ordenados por su score único
        Object.keys(categories).forEach(cat => {
            categories[cat].sort((a, b) => {
                // Calificados primero
                if (a.isQualified && !b.isQualified) return -1;
                if (!a.isQualified && b.isQualified) return 1;

                if (a.isQualified && b.isQualified) {
                    if (a.accumulatedNeto !== b.accumulatedNeto) {
                        return a.accumulatedNeto - b.accumulatedNeto;
                    }
                    if (a.bestSingleNeto !== b.bestSingleNeto) {
                        return a.bestSingleNeto - b.bestSingleNeto;
                    }
                    if (a.bestOut !== b.bestOut) {
                        return a.bestOut - b.bestOut;
                    }
                    return a.bestIn - b.bestIn;
                }

                // Ambos con 1 sola fecha
                return a.accumulatedNeto - b.accumulatedNeto;
            });
        });

        cachedRankingData = {
            tourFechas,
            categories,
            allPlayers: calculatedPlayers,
            totalPlayers: calculatedPlayers.length,
            totalQualified: calculatedPlayers.filter(p => p.isQualified).length,
            lastUpdated: new Date()
        };

        return cachedRankingData;
    } catch (err) {
        console.error('Error calculating ranking acumulado:', err);
        return null;
    }
}

// Modal Principal de Ranking Acumulado
export async function openRankingAcumuladoModal(initialCategory = 'TODAS') {
    currentCategoryFilter = initialCategory;
    currentSearchQuery = '';

    let modal = document.getElementById('ranking-acumulado-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'ranking-acumulado-modal';
        modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/95 backdrop-blur-2xl transition-all duration-300 opacity-0';
        document.body.appendChild(modal);
    }

    document.body.style.overflow = 'hidden';

    modal.innerHTML = `
        <div class="relative w-full max-w-6xl h-[95vh] max-h-[96vh] bg-slate-950/95 border-2 border-amber-500/40 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col transform scale-95 transition-all duration-300" id="ranking-modal-content">
            
            <!-- Glow background accents -->
            <div class="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-amber-500/15 blur-[120px] rounded-full pointer-events-none"></div>
            <div class="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none"></div>

            <!-- 1. MODAL HEADER -->
            <div class="relative z-10 px-4 sm:px-8 py-4 sm:py-5 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl flex flex-col gap-3">
                <div class="flex items-center justify-between gap-3">
                    <!-- Left: Logos & Title -->
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl shadow-md shrink-0">
                            <img src="./golcolima.jpg" alt="Club Colima" class="h-9 sm:h-12 w-auto object-contain rounded-xl" onerror="this.style.display='none'">
                            <img src="./logoclub.png" alt="Asociación" class="h-9 sm:h-12 w-auto object-contain rounded-xl" onerror="this.style.display='none'">
                        </div>
                        <div class="min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                    <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                    TEMPORADA OFICIAL 2026
                                </span>
                                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
                                    4 Fechas · 2 Tarjetas · 1 Campeón
                                </span>
                            </div>
                            <h2 class="text-base sm:text-2xl font-black uppercase tracking-tight text-white truncate leading-tight mt-0.5">
                                I RANKING STROKE PLAY INTERCLUBES
                            </h2>
                            <p class="text-[9.5px] sm:text-[10.5px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 truncate">
                                <span class="material-icons text-xs">emoji_events</span>
                                <span>TABLA GENERAL ACUMULADA · RUMBO A LA GRAN FINAL</span>
                            </p>
                        </div>
                    </div>

                    <!-- Right: Quick Actions + Close -->
                    <div class="flex items-center gap-2 shrink-0">
                        <button onclick="refreshRankingAcumuladoData()" title="Actualizar datos" class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer">
                            <span class="material-icons text-sm sm:text-base">refresh</span>
                        </button>
                        <button onclick="printRankingAcumulado()" title="Imprimir / Exportar PDF" class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer">
                            <span class="material-icons text-sm sm:text-base">print</span>
                        </button>
                        <button onclick="closeRankingAcumuladoModal()" title="Cerrar (Esc)" class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500/15 hover:bg-red-500/20 border border-amber-500/30 hover:border-red-500/40 flex items-center justify-center text-amber-400 hover:text-red-400 transition-all cursor-pointer">
                            <span class="material-icons text-base sm:text-lg">close</span>
                        </button>
                    </div>
                </div>

                <!-- 2. CATEGORY SELECTOR + SEARCH BAR -->
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                    <!-- Category Tabs -->
                    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar shrink-0">
                        <button onclick="setRankingCategoryFilter('TODAS')" id="ranking-tab-TODAS"
                            class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${currentCategoryFilter === 'TODAS' ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/20' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'}">
                            🏆 Todas
                        </button>
                        <button onclick="setRankingCategoryFilter('CATEGORIA A')" id="ranking-tab-CATEGORIA A"
                            class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${currentCategoryFilter === 'CATEGORIA A' ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/20' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'}">
                            Cat A (0-10)
                        </button>
                        <button onclick="setRankingCategoryFilter('CATEGORIA B')" id="ranking-tab-CATEGORIA B"
                            class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${currentCategoryFilter === 'CATEGORIA B' ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/20' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'}">
                            Cat B (11-20)
                        </button>
                        <button onclick="setRankingCategoryFilter('CATEGORIA C')" id="ranking-tab-CATEGORIA C"
                            class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${currentCategoryFilter === 'CATEGORIA C' ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/20' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'}">
                            Cat C (21-36)
                        </button>
                    </div>

                    <!-- Search Input -->
                    <div class="relative min-w-[200px] sm:w-64">
                        <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                        <input type="text" id="ranking-player-search" oninput="filterRankingBySearch(this.value)"
                            placeholder="Buscar jugador..."
                            class="w-full pl-9 pr-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-all">
                    </div>
                </div>
            </div>

            <!-- 2. SCROLLABLE CONTENT BODY -->
            <div id="ranking-modal-body" class="relative z-10 flex-1 overflow-y-auto p-3 sm:p-6 custom-scrollbar space-y-6">
                <div class="flex flex-col items-center justify-center py-24 gap-4">
                    <div class="w-12 h-12 border-4 border-amber-500/20 border-t-amber-400 rounded-full animate-spin"></div>
                    <p class="text-xs font-black text-amber-300 uppercase tracking-widest">Calculando Ranking Acumulado Oficial...</p>
                </div>
            </div>

            <!-- 3. FOOTER INFO -->
            <div class="relative z-10 px-4 sm:px-6 py-2.5 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 text-[9.5px] text-slate-400 font-bold uppercase tracking-wider">
                <div class="flex items-center gap-3">
                    <span class="flex items-center gap-1 text-amber-400">
                        <span class="material-icons text-xs">verified</span>
                        Regla Oficial: Suma de las 2 mejores tarjetas netas
                    </span>
                    <span class="hidden sm:inline text-slate-600">|</span>
                    <span class="hidden sm:inline text-slate-400">
                        Premiación: 🥇 70% Polla + Trofeo · 🥈 20% Polla + Trofeo
                    </span>
                </div>
                <div class="text-[9px] text-slate-500">
                    Sede Oficial: Club de Golf Colima
                </div>
            </div>
        </div>
    `;

    // Animación de entrada suave
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
        const content = document.getElementById('ranking-modal-content');
        if (content) {
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
        }
    }, 10);

    window.addEventListener('keydown', handleRankingEscapeKey);

    await renderRankingModalContent();
}

function handleRankingEscapeKey(e) {
    if (e.key === 'Escape') {
        closeRankingAcumuladoModal();
    }
}

export function closeRankingAcumuladoModal() {
    const modal = document.getElementById('ranking-acumulado-modal');
    if (!modal) return;

    window.removeEventListener('keydown', handleRankingEscapeKey);

    const content = document.getElementById('ranking-modal-content');
    if (content) {
        content.classList.remove('scale-100');
        content.classList.add('scale-95');
    }
    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');

    setTimeout(() => {
        modal.remove();
        document.body.style.overflow = '';
    }, 300);
}

export async function refreshRankingAcumuladoData() {
    cachedRankingData = null;
    await renderRankingModalContent();
}

export function setRankingCategoryFilter(cat) {
    currentCategoryFilter = cat;
    ['TODAS', 'CATEGORIA A', 'CATEGORIA B', 'CATEGORIA C'].forEach(c => {
        const btn = document.getElementById(`ranking-tab-${c}`);
        if (!btn) return;
        if (c === cat) {
            btn.className = 'px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/20';
        } else {
            btn.className = 'px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700';
        }
    });
    renderRankingModalContent();
}

export function filterRankingBySearch(query) {
    currentSearchQuery = (query || '').trim().toLowerCase();
    renderRankingModalContent();
}

// Renderizado del contenido interior del modal
export async function renderRankingModalContent(targetElementId = 'ranking-modal-body') {
    const container = document.getElementById(targetElementId);
    if (!container) return;

    const data = await getCalculatedRankingData();
    if (!data) {
        container.innerHTML = `
            <div class="py-20 text-center space-y-3">
                <span class="material-icons text-red-400 text-4xl">error_outline</span>
                <p class="text-red-400 text-xs font-black uppercase">No se pudieron cargar los datos del ranking acumulado.</p>
                <button onclick="refreshRankingAcumuladoData()" class="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer">Reintentar</button>
            </div>
        `;
        return;
    }

    const { tourFechas, categories, totalPlayers, totalQualified } = data;

    // Filtrar por categoría seleccionada
    const categoriesToRender = {};
    if (currentCategoryFilter === 'TODAS') {
        Object.assign(categoriesToRender, categories);
    } else if (categories[currentCategoryFilter]) {
        categoriesToRender[currentCategoryFilter] = categories[currentCategoryFilter];
    } else {
        categoriesToRender[currentCategoryFilter] = [];
    }

    // Filtrar por buscador si hay término
    if (currentSearchQuery) {
        Object.keys(categoriesToRender).forEach(cat => {
            categoriesToRender[cat] = categoriesToRender[cat].filter(p =>
                p.name.toLowerCase().includes(currentSearchQuery) ||
                p.category.toLowerCase().includes(currentSearchQuery)
            );
        });
    }

    // Contar jugadores visibles
    let visibleCount = 0;
    Object.values(categoriesToRender).forEach(arr => { visibleCount += arr.length; });

    // Tarjetas resumen superior
    const catALeader = categories['CATEGORIA A']?.[0]?.name || 'Por definir';
    const catBLeader = categories['CATEGORIA B']?.[0]?.name || 'Por definir';
    const catCLeader = categories['CATEGORIA C']?.[0]?.name || 'Por definir';

    let html = `
        <!-- STATS BANNER (5 TARJETAS COMPACTAS INCLUYENDO CAT A, B Y C) -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            <div class="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-0.5">
                <span class="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Registrados</span>
                <div class="flex items-baseline gap-1.5">
                    <span class="text-xl sm:text-2xl font-black text-white">${totalPlayers}</span>
                    <span class="text-[8px] font-bold text-slate-500 uppercase">jugadores</span>
                </div>
            </div>

            <div class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-0.5">
                <span class="text-[8.5px] font-bold text-emerald-400 uppercase tracking-wider block">Calificados</span>
                <div class="flex items-baseline gap-1.5">
                    <span class="text-xl sm:text-2xl font-black text-emerald-300">${totalQualified}</span>
                    <span class="text-[8px] font-bold text-emerald-400/80 uppercase">con 2+ rds</span>
                </div>
            </div>

            <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-0.5">
                <span class="text-[8.5px] font-bold text-amber-400 uppercase tracking-wider block">Líder Cat A (0-10)</span>
                <p class="text-xs sm:text-sm font-black text-white truncate">${catALeader}</p>
                <span class="text-[8px] font-bold text-amber-400/90 uppercase block">${categories['CATEGORIA A']?.[0]?.accumulatedNeto ? categories['CATEGORIA A'][0].accumulatedNeto + ' Neto (2 Rds)' : 'En juego'}</span>
            </div>

            <div class="p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl space-y-0.5">
                <span class="text-[8.5px] font-bold text-purple-400 uppercase tracking-wider block">Líder Cat B (11-20)</span>
                <p class="text-xs sm:text-sm font-black text-white truncate">${catBLeader}</p>
                <span class="text-[8px] font-bold text-purple-400/90 uppercase block">${categories['CATEGORIA B']?.[0]?.accumulatedNeto ? categories['CATEGORIA B'][0].accumulatedNeto + ' Neto (2 Rds)' : 'En juego'}</span>
            </div>

            <div class="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl space-y-0.5 col-span-2 sm:col-span-1">
                <span class="text-[8.5px] font-bold text-cyan-400 uppercase tracking-wider block">Líder Cat C (21-36)</span>
                <p class="text-xs sm:text-sm font-black text-white truncate">${catCLeader}</p>
                <span class="text-[8px] font-bold text-cyan-400/90 uppercase block">${categories['CATEGORIA C']?.[0]?.accumulatedNeto ? categories['CATEGORIA C'][0].accumulatedNeto + ' Neto (2 Rds)' : 'En juego'}</span>
            </div>
        </div>

        <!-- EXPLICACIÓN REGLA OFICIAL BANNER -->
        <div class="p-3.5 bg-gradient-to-r from-amber-500/10 via-slate-900/60 to-emerald-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                    2/4
                </div>
                <div>
                    <h4 class="text-xs font-black uppercase text-white tracking-wide">Cómputo Automático de las 2 Mejores Tarjetas</h4>
                    <p class="text-[10px] text-slate-300 font-medium">
                        El sistema suma automáticamente los dos scores netos más bajos de cada jugador. Las tarjetas descartadas aparecen atenuadas con <span class="line-through text-slate-400">tachado</span>.
                    </p>
                </div>
            </div>
            <span class="px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-700 text-emerald-400 text-[9px] font-black uppercase tracking-wider shrink-0">
                ★ Marca = Ronda Computada
            </span>
        </div>
    `;

    if (visibleCount === 0) {
        html += `
            <div class="py-16 text-center space-y-3">
                <span class="material-icons text-slate-600 text-5xl">person_off</span>
                <p class="text-xs font-black uppercase tracking-widest text-slate-400">
                    ${currentSearchQuery ? `No se encontraron jugadores que coincidan con "${currentSearchQuery}"` : 'No hay jugadores registrados en esta categoría'}
                </p>
            </div>
        `;
        container.innerHTML = html;
        return;
    }

    // Renderizar tablas por categoría
    Object.keys(categoriesToRender).forEach(catName => {
        const catPlayers = categoriesToRender[catName];
        if (catPlayers.length === 0) return;

        let catHcpDesc = '0 - 10';
        if (catName.endsWith(' B') || catName.includes('CAT B') || catName.includes('CATEGORIA B')) catHcpDesc = '11 - 20';
        else if (catName.endsWith(' C') || catName.includes('CAT C') || catName.includes('CATEGORIA C')) catHcpDesc = '21 - 36';
        else if (catName.endsWith(' A') || catName.includes('CAT A') || catName.includes('CATEGORIA A')) catHcpDesc = '0 - 10';

        html += `
            <div class="space-y-3 pt-2">
                <!-- Header Categoría -->
                <div class="flex items-center justify-between gap-2 px-1">
                    <div class="flex items-center gap-2.5">
                        <div class="w-2 h-6 bg-gradient-to-b from-amber-400 to-emerald-400 rounded-full shadow-lg"></div>
                        <h3 class="text-base sm:text-lg font-black uppercase tracking-tight text-white">${catName}</h3>
                        <span class="px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-[9px] font-bold rounded-full uppercase">
                            HCP ${catHcpDesc} (al 80%)
                        </span>
                    </div>
                    <span class="text-[10px] font-black text-amber-400 uppercase tracking-wider">
                        ${catPlayers.length} Jugadores
                    </span>
                </div>

                <!-- Tabla de Posiciones Acumuladas -->
                <div class="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                    <div class="overflow-x-auto custom-scrollbar">
                        <table class="w-full text-left min-w-[700px]">
                            <thead>
                                <tr class="bg-slate-950/80 text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-800">
                                    <th class="px-3 sm:px-4 py-3.5 w-12 text-center">POS</th>
                                    <th class="px-3 sm:px-4 py-3.5 min-w-[160px]">JUGADOR</th>
                                    ${tourFechas.map(f => `
                                        <th class="px-2.5 sm:px-3 py-3.5 text-center whitespace-nowrap">
                                            <span>${f.shortDate}</span>
                                            ${f.isPending ? '<span class="block text-[7.5px] text-slate-500 font-normal">Próxima</span>' : ''}
                                        </th>
                                    `).join('')}
                                    <th class="px-3 py-3.5 text-center text-slate-300 bg-slate-950/40">2 MEJORES</th>
                                    <th class="px-3 py-3.5 text-center bg-amber-500/10 text-amber-300 font-black">ACUMULADO</th>
                                    <th class="px-3 py-3.5 text-center w-28">ESTATUS</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-800/60">
                                ${catPlayers.map((player, idx) => {
                                    const isPodium = idx < 3 && player.isQualified;
                                    let posBadgeClass = 'bg-slate-800 text-slate-300';
                                    let posText = `#${idx + 1}`;

                                    if (idx === 0 && player.isQualified) {
                                        posBadgeClass = 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 ring-2 ring-amber-400/50';
                                        posText = '🥇 1';
                                    } else if (idx === 1 && player.isQualified) {
                                        posBadgeClass = 'bg-slate-200 text-slate-950 shadow-md shadow-slate-200/20';
                                        posText = '🥈 2';
                                    } else if (idx === 2 && player.isQualified) {
                                        posBadgeClass = 'bg-amber-700 text-white shadow-md shadow-amber-700/20';
                                        posText = '🥉 3';
                                    }

                                    return `
                                        <tr class="hover:bg-white/[0.02] transition-colors ${isPodium ? 'bg-amber-500/[0.02]' : ''}">
                                            <!-- Posición -->
                                            <td class="px-3 sm:px-4 py-3 text-center">
                                                <span class="w-8 h-8 flex items-center justify-center rounded-xl font-black text-xs mx-auto ${posBadgeClass}">
                                                    ${posText}
                                                </span>
                                            </td>

                                            <!-- Jugador -->
                                            <td class="px-3 sm:px-4 py-3">
                                                <p class="font-black text-xs sm:text-sm uppercase text-white truncate max-w-[180px] sm:max-w-[220px]">
                                                    ${player.name}
                                                </p>
                                                <span class="text-[8.5px] font-bold text-slate-400 uppercase">
                                                    ${player.roundsPlayed} ${player.roundsPlayed === 1 ? 'ronda jugada' : 'rondas jugadas'}
                                                </span>
                                            </td>

                                            <!-- Fechas individuales -->
                                            ${tourFechas.map(f => {
                                                if (f.isPending) {
                                                    return `
                                                        <td class="px-2.5 sm:px-3 py-3 text-center">
                                                            <span class="text-slate-600 text-[10px] font-bold block">—</span>
                                                        </td>
                                                    `;
                                                }

                                                const s = player.scoresByFecha[f.id];
                                                if (!s) {
                                                    return `
                                                        <td class="px-2.5 sm:px-3 py-3 text-center">
                                                            <span class="text-slate-600 text-xs font-bold block" title="No participó en esta fecha">—</span>
                                                        </td>
                                                    `;
                                                }

                                                const isBest = player.bestTwoFechaIds.has(f.id);
                                                const isDiscarded = player.discardedFechaIds.has(f.id);

                                                return `
                                                    <td class="px-2.5 sm:px-3 py-3 text-center">
                                                        <div class="inline-flex flex-col items-center">
                                                            <span class="text-xs sm:text-sm font-black ${isBest ? 'text-emerald-400 font-black' : isDiscarded ? 'text-slate-500 line-through' : 'text-slate-200'}">
                                                                ${s.neto}
                                                            </span>
                                                            <span class="text-[7.5px] font-bold ${isBest ? 'text-emerald-400/80' : 'text-slate-500'}">
                                                                ${isBest ? '★ Mejor' : isDiscarded ? 'descartada' : `G:${s.gross}`}
                                                            </span>
                                                        </div>
                                                    </td>
                                                `;
                                            }).join('')}

                                            <!-- 2 Mejores Rondas Desglose -->
                                            <td class="px-3 py-3 text-center bg-slate-950/40">
                                                ${player.isQualified ? `
                                                    <span class="text-[11px] font-bold text-slate-300">
                                                        ${player.bestTwo.map(b => b.neto).join(' + ')}
                                                    </span>
                                                ` : `
                                                    <span class="text-[10px] text-slate-500 font-medium">
                                                        ${player.bestTwo.length === 1 ? player.bestTwo[0].neto + ' (1 sola)' : 'Sin rondas'}
                                                    </span>
                                                `}
                                            </td>

                                            <!-- Acumulado Neto -->
                                            <td class="px-3 py-3 text-center bg-amber-500/10">
                                                <div class="inline-flex flex-col items-center">
                                                    <span class="text-sm sm:text-base font-black ${player.isQualified ? 'text-amber-300' : 'text-slate-400'}">
                                                        ${player.accumulatedNeto || '—'}
                                                    </span>
                                                    ${player.isQualified ? `
                                                        <span class="text-[7.5px] font-bold text-amber-400/80 uppercase">Neto Total</span>
                                                    ` : `
                                                        <span class="text-[7.5px] font-bold text-slate-500 uppercase">Incompleto</span>
                                                    `}
                                                </div>
                                            </td>

                                            <!-- Estatus Oficial -->
                                            <td class="px-3 py-3 text-center">
                                                ${player.isQualified ? `
                                                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[8px] font-black uppercase tracking-wider">
                                                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                                        Calificado
                                                    </span>
                                                ` : `
                                                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[8px] font-bold uppercase tracking-wider" title="Requiere jugar al menos 2 fechas para competir por el trofeo oficial">
                                                        Requiere F4
                                                    </span>
                                                `}
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Función para imprimir el reporte oficial del ranking acumulado
export function printRankingAcumulado() {
    window.print();
}
