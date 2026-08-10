const SUPABASE_URL = 'https://obnmnilpcmxriyzoxazl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TzyuevZidaxKYipqCidq8g_2lSbBQQT';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const db = supabaseClient.schema('golf_target');

let currentTournamentId = null;
let currentView = 'posiciones';
let tournamentData = null;

// Initialization
async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    currentTournamentId = urlParams.get('id') || urlParams.get('tournament');
    const viewParam = urlParams.get('view');
    if (viewParam && ['posiciones', 'oyeses'].includes(viewParam)) {
        currentView = viewParam;
    }

    if (!currentTournamentId) {
        showError("No se especificó un ID de torneo.");
        return;
    }

    // Initial fetch
    await loadTournamentData();
    updateUI();

    // Subscribe to changes
    subscribeToUpdates();
}

async function loadTournamentData() {
    try {
        // Fetch tournament basic info
        const { data: tData, error: tError } = await db.from('tournaments')
            .select('*')
            .eq('id', currentTournamentId)
            .single();

        if (tError || !tData) throw new Error("Torneo no encontrado");
        tournamentData = tData;

        // Update Header
        document.getElementById('tournament-name').textContent = tData.name;
        document.getElementById('tournament-location').innerHTML = `
            <span class="material-icons-round text-[12px]">location_on</span> ${tData.courses || tData.course || 'Campo no especificado'}
        `;

        await fetchDataForView();
    } catch (err) {
        showError(err.message);
    }
}

async function fetchDataForView() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.remove('hidden');

    if (currentView === 'posiciones') {
        await renderLeaderboard();
    } else {
        await renderOyeses();
    }

    if (loader) loader.classList.add('hidden');
}

async function renderLeaderboard() {
    const content = document.getElementById('content-area');

    // Fetch teams and scores
    const [teamsRes, scoresRes] = await Promise.all([
        db.from('teams').select('*').eq('eventid', currentTournamentId),
        db.from('scores').select('*').eq('eventid', currentTournamentId)
    ]);

    if (teamsRes.error || scoresRes.error) {
        content.innerHTML = `<p class="text-center text-red-400 py-10 font-bold uppercase text-[10px]">Error cargando datos</p>`;
        return;
    }

    const teams = teamsRes.data || [];
    const scores = scoresRes.data || [];

    // Calculate totals
    const leaderboard = teams.map(team => {
        const teamScores = scores.filter(s => s.teamid === team.id);

        let totalGross = 0;
        let totalNet = 0;
        let holesPlayed = 0;

        teamScores.forEach(s => {
            const holeScores = s.scores || {};
            Object.values(holeScores).forEach(score => {
                if (score && score > 0) {
                    totalGross += parseInt(score);
                    holesPlayed++;
                }
            });
            const hcp = parseFloat(s.handicap) || 0;
            totalNet = totalGross - (hcp * (holesPlayed / 18));
        });

        return {
            ...team,
            totalGross,
            totalNet: Math.round(totalNet * 10) / 10,
            holesPlayed
        };
    });

    // Sort by Net score (lower is better)
    leaderboard.sort((a, b) => a.totalNet - b.totalNet);

    if (leaderboard.length === 0) {
        content.innerHTML = `
            <div class="py-20 text-center opacity-40">
                <span class="material-icons-round text-5xl mb-4">sports_golf</span>
                <p class="text-[10px] font-black uppercase tracking-widest">Esperando los primeros resultados...</p>
            </div>
        `;
        return;
    }

    content.innerHTML = `
        <div class="grid gap-3">
            ${leaderboard.map((item, index) => {
        const rank = index + 1;
        const players = item.players || [];
        const names = players.map(p => p.name).join(' & ');

        return `
                    <div class="score-card flex items-center gap-4 animate-fade-in" style="animation-delay: ${index * 0.05}s">
                        <div class="rank-badge ${rank <= 3 ? 'rank-' + rank : ''}">${rank}</div>
                        <div class="flex-1 min-w-0">
                            <h4 class="text-sm font-black uppercase truncate tracking-tight">${item.name || names}</h4>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">${item.category || 'Categoría Única'}</span>
                                <span class="w-1 h-1 rounded-full bg-white/10"></span>
                                <span class="text-[9px] font-black text-emerald-500/80">${item.holesPlayed} Hoyos</span>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-xl font-black tracking-tighter ${item.totalNet <= 0 ? 'text-emerald-400' : 'text-slate-200'}">
                                ${item.totalNet > 0 ? '+' : ''}${item.totalNet}
                            </p>
                            <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">NETO</p>
                        </div>
                    </div>
                `;
    }).join('')}
        </div>
    `;
}

async function renderOyeses() {
    const content = document.getElementById('content-area');
    const { data: oyeses, error } = await db.from('oyeses').select('*').eq('eventid', String(currentTournamentId));

    if (error) {
        content.innerHTML = `<p class="text-center text-red-400 py-10 font-bold uppercase text-[10px]">Error cargando Oye's</p>`;
        return;
    }

    if (!oyeses || oyeses.length === 0) {
        content.innerHTML = `
            <div class="py-20 text-center opacity-40">
                <span class="material-icons-round text-5xl mb-4">near_me</span>
                <p class="text-[10px] font-black uppercase tracking-widest">No hay registros de Oye's aún.</p>
            </div>
        `;
        return;
    }

    // Helper for course colors based on Tailwind Palette
    const getCourseColor = (name = "") => {
        const n = name.toUpperCase();
        if (n.includes('ALTOZANO')) return { text: 'text-blue-500', bg: 'bg-blue-500', hex: '#3b82f6', light: 'bg-blue-500/10' };
        if (n.includes('ISLA NAVIDAD')) return { text: 'text-amber-500', bg: 'bg-amber-500', hex: '#f59e0b', light: 'bg-amber-500/10' };
        if (n.includes('COLIMA')) return { text: 'text-rose-500', bg: 'bg-rose-500', hex: '#f43f5e', light: 'bg-rose-500/10' };
        if (n.includes('HADAS')) return { text: 'text-purple-500', bg: 'bg-purple-500', hex: '#a855f7', light: 'bg-purple-500/10' };
        if (n.includes('SANTIAGO')) return { text: 'text-cyan-500', bg: 'bg-cyan-500', hex: '#06b6d4', light: 'bg-cyan-500/10' };
        if (n.includes('TAMARINDO')) return { text: 'text-sky-500', bg: 'bg-sky-500', hex: '#0ea5e9', light: 'bg-sky-500/10' };
        if (n.includes('CORAZON RESORT')) return { text: 'text-emerald-500', bg: 'bg-emerald-500', hex: '#10b981', light: 'bg-emerald-500/10' };
        return { text: 'text-emerald-500', bg: 'bg-emerald-500', hex: '#10b981', light: 'bg-emerald-500/10' };
    };

    // Group by Course first
    const byCourse = {};
    oyeses.forEach(o => {
        const c = o.coursename || 'Campo Desconocido';
        if (!byCourse[c]) byCourse[c] = {};

        const h = o.hole || 'H';
        if (!byCourse[c][h]) byCourse[c][h] = [];
        byCourse[c][h].push(o);
    });

    content.innerHTML = Object.entries(byCourse).map(([courseName, holeGroups]) => {
        const colors = getCourseColor(courseName);

        return `
            <div class="space-y-8 mb-12">
                <!-- Course Header -->
                <div class="flex flex-col items-center gap-2">
                   <div class="w-10 h-10 rounded-2xl ${colors.light} flex items-center justify-center ${colors.text} mb-1">
                       <span class="material-icons-round">landscape</span>
                   </div>
                   <h2 class="text-sm font-black uppercase text-center tracking-[0.2em] text-white">${courseName}</h2>
                   <p class="text-[8px] font-bold uppercase ${colors.text} tracking-[0.4em] opacity-80">Oye's Leaderboard</p>
                </div>

                <!-- Holes within Course -->
                <div class="space-y-10">
                    ${Object.entries(holeGroups).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([hole, records]) => {
            const sortedRecords = records.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

            return `
                        <div class="space-y-4">
                            <div class="flex items-center gap-3">
                                <div class="h-px flex-1 bg-white/5"></div>
                                <h3 class="text-[10px] font-black uppercase ${colors.text} tracking-[0.3em]">Hoyo ${hole}</h3>
                                <div class="h-px flex-1 bg-white/5"></div>
                            </div>
                            <div class="grid gap-3">
                                ${sortedRecords.map((r, idx) => {
                const isWinner = idx === 0;
                return `
                                        <div class="score-card oyes-card flex items-center justify-between gap-4 animate-fade-in relative overflow-hidden" 
                                             style="animation-delay: ${idx * 0.05}s; border-left: 4px solid ${colors.hex}">
                                            <div class="flex items-center gap-4">
                                                <div class="w-8 h-8 rounded-lg ${colors.light} flex items-center justify-center ${colors.text} text-xs font-black">
                                                    ${isWinner ? '<span class="material-icons-round text-sm">workspace_premium</span>' : (idx + 1)}
                                                </div>
                                                <div class="min-w-0">
                                                    <h4 class="text-xs font-black uppercase tracking-tight truncate">${r.playername}</h4>
                                                    <p class="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">${courseName}</p>
                                                </div>
                                            </div>
                                            <div class="distance-badge ${colors.light} ${colors.text} text-[11px] font-black px-3 py-1.5 rounded-xl border border-white/5 shadow-lg">
                                                ${r.distance} <span class="text-[8px] opacity-70 ml-0.5">MTS</span>
                                            </div>
                                        </div>
                                    `;
            }).join('')}
                            </div>
                        </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }).join('<div class="h-px w-full bg-white/5 my-12"></div>');
}

function switchView(view) {
    currentView = view;
    updateUI();
    fetchDataForView();
}

function updateUI() {
    // Update tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-${currentView}`);
    if (activeBtn) activeBtn.classList.add('active');
}

function subscribeToUpdates() {
    console.log("Subscribing to live updates for tournament:", currentTournamentId);

    // Cleanup previous channels to avoid duplication
    supabaseClient.removeAllChannels();

    supabaseClient.channel('tournament-mobile-sync')
        .on('postgres_changes', {
            event: '*',
            schema: 'golf_target',
            table: 'scores',
            filter: `eventid=eq.${currentTournamentId}`
        }, () => {
            console.log("Scores updated via realtime");
            if (currentView === 'posiciones') fetchDataForView();
        })
        .on('postgres_changes', {
            event: '*',
            schema: 'golf_target',
            table: 'oyeses',
            filter: `eventid=eq.${currentTournamentId}`
        }, () => {
            console.log("Oye's updated via realtime");
            if (currentView === 'oyeses') fetchDataForView();
        })
        .subscribe((status) => {
            console.log("Realtime connection status:", status);
        });
}

function showError(msg) {
    const area = document.getElementById('content-area');
    area.innerHTML = `
        <div class="py-20 text-center">
            <div class="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <span class="material-icons-round text-red-500">priority_high</span>
            </div>
            <p class="text-sm font-black uppercase text-red-500 mb-2">Error de Sistema</p>
            <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">${msg}</p>
        </div>
    `;
}

init();
