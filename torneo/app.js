const SUPABASE_URL = 'https://tztolxgsaktqindoimtu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dG9seGdzYWt0cWluZG9pbXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzQ4ODAsImV4cCI6MjEwMTg1MDg4MH0.E2GABiOMXYb5hEwE9ErIcJa6_LHkj9lJUglQVoiLl0M';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const db = supabaseClient.schema('colimaGC');

let currentTournamentId = null;
let currentView = 'salidas';
let tournamentData = null;

// Attach functions to window for HTML onclick events
window.switchView = function(view) {
    currentView = view;
    updateUI();
    fetchDataForView();
};

window.printView = async function() {
    if (!tournamentData) return;
    
    const printWindow = window.open('', '_blank');
    const tournamentName = tournamentData.name;
    const location = tournamentData.courses || tournamentData.course || '';
    
    let reportTitle = '';
    let contentHtml = '';

    const PRINT_CAT_THEMES = [
        { bg: 'linear-gradient(135deg, #059669, #10b981)', color: '#ffffff' }, // Emerald
        { bg: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', color: '#ffffff' }, // Blue
        { bg: 'linear-gradient(135deg, #6d28d9, #8b5cf6)', color: '#ffffff' }, // Purple
        { bg: 'linear-gradient(135deg, #b45309, #f59e0b)', color: '#ffffff' }, // Amber
        { bg: 'linear-gradient(135deg, #be123c, #f43f5e)', color: '#ffffff' }, // Rose
        { bg: 'linear-gradient(135deg, #0e7490, #06b6d4)', color: '#ffffff' }, // Cyan
    ];
    
    if (currentView === 'posiciones') {
        reportTitle = 'LEADERBOARD EN VIVO';
        const [teamsRes, scoresRes] = await Promise.all([
            db.from('teams').select('*').eq('eventid', String(currentTournamentId)),
            db.from('scores').select('*').eq('eventid', String(currentTournamentId))
        ]);
        
        const categories = {};
        teamsRes.data?.forEach(t => {
            const cat = t.category || 'GENERAL';
            const teamScores = scoresRes.data?.filter(s => String(s.teamid) === String(t.id));
            if (teamScores?.length > 0) {
                const totalAgg = teamScores.reduce((acc, s) => acc + (s.total || 0), 0);
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push({ team: t, total: totalAgg, rounds: teamScores.length });
            }
        });
        
        contentHtml = Object.keys(categories).sort().map((cat, catIdx) => {
            const theme = PRINT_CAT_THEMES[catIdx % PRINT_CAT_THEMES.length];
            const catTitle = cat.toUpperCase().startsWith('CATEGORÍA') || cat.toUpperCase().startsWith('CATEGORIA')
                ? cat.toUpperCase()
                : `CATEGORÍA ${cat.toUpperCase()}`;

            return `
            <div class="category-block" style="margin-bottom: 35px; page-break-inside: avoid; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <h2 style="background: ${theme.bg}; color: ${theme.color}; padding: 12px 20px; text-transform: uppercase; font-size: 15px; font-weight: 900; letter-spacing: 1.5px; text-align: center; margin: 0;">${catTitle}</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                            <th style="padding: 12px; text-align: center; width: 60px; font-weight: 800; font-size: 10px; color: #64748b;">POS</th>
                            <th style="padding: 12px; text-align: left; font-weight: 800; font-size: 10px; color: #64748b;">PARTICIPANTE / EQUIPO</th>
                            <th style="padding: 12px; text-align: center; width: 40px; font-weight: 800; font-size: 10px; color: #64748b;">RDS</th>
                            <th style="padding: 12px; text-align: center; width: 70px; font-weight: 800; font-size: 10px; color: #64748b;">VENTAJA</th>
                            <th style="padding: 12px; text-align: center; width: 70px; font-weight: 800; font-size: 10px; color: #64748b;">GROSS</th>
                            <th style="padding: 12px; text-align: center; width: 90px; background: #f1f5f9; font-weight: 800; font-size: 10px; color: #047857;">NETO</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${categories[cat].map(item => {
                            const advantage = item.team.ventaja || 0;
                            const gross = item.total;
                            const neto = gross - (advantage * item.rounds);
                            return { ...item, gross, neto, advantage };
                        }).sort((a,b)=>a.neto - b.neto).map((item, idx) => {
                            const ventajaDisplay = item.advantage === 0 ? '0' : `-${Math.abs(item.advantage)}`;
                            return `
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 12px; text-align: center; font-weight: 800; color: #334155;">#${idx + 1}</td>
                                <td style="padding: 12px; font-weight: 700; text-transform: uppercase; font-size: 12px; color: #0f172a;">${item.team.teamname}</td>
                                <td style="padding: 12px; text-align: center; color: #64748b; font-weight: 600;">${item.rounds}</td>
                                <td style="padding: 12px; text-align: center; color: #2563eb; font-weight: 800;">${ventajaDisplay}</td>
                                <td style="padding: 12px; text-align: center; font-weight: 700; color: #334155;">${item.gross}</td>
                                <td style="padding: 12px; text-align: center; font-weight: 900; background: #f8fafc; color: #059669; font-size: 14px;">${item.neto}</td>
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        }).join('');
        
    } else if (currentView === 'oyeses') {
        reportTitle = 'MARCAS OYE\'S';
        const { data: oyeses } = await db.from('oyeses').select('*').eq('eventid', String(currentTournamentId));
        const grouped = {};
        oyeses?.forEach(o => {
            const course = o.coursename || 'GENERAL';
            if (!grouped[course]) grouped[course] = {};
            const hole = o.hole || '?';
            if (!grouped[course][hole]) grouped[course][hole] = [];
            grouped[course][hole].push(o);
        });
        
        const oyeColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

        contentHtml = Object.entries(grouped).map(([course, holes]) => `
            <div class="course-block" style="margin-bottom: 50px;">
                <h2 style="border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 25px; text-transform: uppercase;">${course}</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    ${Object.entries(holes).sort((a,b)=>parseInt(a[0])-parseInt(b[0])).map(([hole, players], hIdx) => {
                        const hColor = oyeColors[hIdx % oyeColors.length];
                        return `
                            <div style="page-break-inside: avoid; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
                                <div style="background: ${hColor}; color: white; padding: 10px 15px; font-weight: 900; border-bottom: 1px solid #ddd;">HOYO ${hole}</div>
                                <table style="width: 100%; border-collapse: collapse;">
                                    ${players.sort((a,b)=>parseFloat(a.distance)-parseFloat(b.distance)).map((p, ix) => `
                                        <tr style="border-bottom: 1px solid #f8fafc;">
                                            <td style="padding: 10px; width: 30px; font-weight: 800; color: #94a3b8;">${ix+1}</td>
                                            <td style="padding: 10px; font-weight: 700; text-transform: uppercase; font-size: 11px;">${p.playername}</td>
                                            <td style="padding: 10px; text-align: right; font-weight: 800; color: #10b981;">${p.distance}m</td>
                                        </tr>
                                    `).join('')}
                                </table>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `).join('');
        
    } else {
        // Salidas printout
        reportTitle = 'LISTA DE SALIDAS';
        const { data: teams } = await db.from('teams').select('*').eq('eventid', String(currentTournamentId));
        const holes = {};
        teams?.forEach(t => {
            const h = t.starting_hole || 'TBA';
            if (!holes[h]) holes[h] = [];
            holes[h].push(t);
        });
        
        contentHtml = `
            <div style="display: grid; grid-template-columns: 1fr; gap: 30px;">
                ${Object.keys(holes).sort((a,b)=>(parseInt(a)||99)-(parseInt(b)||99)).map(h => `
                    <div style="page-break-inside: avoid; border: 1px solid #000; border-radius: 12px; overflow: hidden;">
                        <div style="background: #000; color: white; padding: 12px 20px; font-weight: 900; font-size: 16px; text-align: center;">HOYO ${h}</div>
                        <div style="padding: 15px; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
                            ${holes[h].map(t => {
                                const playersList = t.players && Array.isArray(t.players) 
                                    ? t.players.map(p => `${p.name} <strong>(${p.hdcp || 0})</strong>`).join(' - ')
                                    : [t.player1, t.player2, t.player3, t.player4].filter(p=>p).join(' - ');
                                
                                return `
                                    <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; justify-between; align-items: center;">
                                        <div style="min-width: 0; flex: 1;">
                                            <div style="font-weight: 900; font-size: 11px; margin-bottom: 4px; text-transform: uppercase;">TEAM #${t.teamnumber || '?'}: ${t.teamname}</div>
                                            <div style="font-size: 8px; color: #64748b; font-weight: 700; text-transform: uppercase;">${playersList}</div>
                                        </div>
                                        <div style="background: #fff; padding: 5px 10px; border-radius: 6px; border: 1px solid #cbd5e1; text-align: center; margin-left: 10px; flex-shrink: 0;">
                                            <div style="font-size: 7px; color: #94a3b8; font-weight: 800;">HCP</div>
                                            <div style="font-weight: 900; font-size: 14px;">${t.ventaja || 0}</div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    const logoClubUrl = new URL('../golcolima.jpg', window.location.href).href;
    const logoAssocUrl = new URL('../logoclub.png', window.location.href).href;

    printWindow.document.write(`
        <html>
        <head>
            <title>${reportTitle} - ${tournamentName}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                body { font-family: 'Inter', sans-serif; color: #1e293b; margin: 0; padding: 0; }
                table.main-table { width: 100%; border-collapse: collapse; }
                .print-header-container {
                    padding: 25px 40px;
                    background: white;
                    border-bottom: 4px solid #0f172a;
                }
                .print-content {
                    padding: 25px 40px;
                }
                @media print {
                    thead { display: table-header-group; }
                    body { padding: 0; }
                }
                .header-table { width: 100%; border-collapse: collapse; }
            </style>
        </head>
        <body>
            <table class="main-table">
                <thead>
                    <tr>
                        <td>
                            <div class="print-header-container">
                                <table class="header-table">
                                    <tr>
                                        <td align="left" style="vertical-align: bottom;">
                                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                                <img src="${logoClubUrl}" style="height: 55px; width: 55px; object-fit: contain; border-radius: 8px; border: 1px solid #cbd5e1; padding: 2px; background: #fff;" onerror="this.style.display='none'">
                                                <img src="${logoAssocUrl}" style="height: 55px; width: 55px; object-fit: contain; border-radius: 8px; border: 1px solid #cbd5e1; padding: 2px; background: #fff;" onerror="this.style.display='none'">
                                            </div>
                                            <h1 style="margin: 0; font-size: 22px; font-weight: 900; text-transform: uppercase; color: #0f172a;">${tournamentName}</h1>
                                            <p style="margin: 3px 0 0 0; color: #64748b; font-weight: 700; font-size: 12px;">${location}</p>
                                        </td>
                                        <td align="right" style="vertical-align: bottom;">
                                            <p style="margin: 0; font-weight: 900; color: #059669; font-size: 15px; letter-spacing: 1px;">${reportTitle}</p>
                                            <p style="margin: 4px 0 0 0; font-size: 10px; font-weight: 700; color: #94a3b8;">SISTEMA PASSGOLF • ${new Date().toLocaleDateString()}</p>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <div class="print-content">
                                ${contentHtml}
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            <script>
                window.onload = () => {
                    const images = Array.from(document.images);
                    const loadPromises = images.map(img => {
                        if (img.complete) return Promise.resolve();
                        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
                    });
                    Promise.all(loadPromises).then(() => {
                        setTimeout(() => { window.print(); window.close(); }, 500);
                    });
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
};

window.showScorecard = async function(teamId, teamName) {
    let modal = document.getElementById('scorecard-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-950/90 backdrop-blur-md animate-fade-in';
        modal.id = 'scorecard-modal';
        document.body.appendChild(modal);
    }
    modal.classList.remove('hidden');
    modal.innerHTML = `<div class="p-8 bg-slate-900 border border-slate-700 rounded-3xl text-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div></div>`;

    const [{ data: scoresData }, { data: teamData }] = await Promise.all([
        db.from('scores').select('*').eq('eventid', String(currentTournamentId)),
        db.from('teams').select('ventaja, hdcp').eq('id', teamId).maybeSingle()
    ]);

    const teamScores = (scoresData || []).filter(s => String(s.teamid) === String(teamId));
    const ventaja = teamData?.ventaja || 0;

    if (!teamScores || teamScores.length === 0) {
        modal.innerHTML = `
            <div class="bg-slate-900 border border-white/10 rounded-[2rem] p-6 text-center max-w-sm w-full space-y-4">
                <span class="material-icons-round text-amber-400 text-4xl">info</span>
                <h3 class="font-black text-white uppercase text-sm">Sin Scorecard</h3>
                <p class="text-slate-400 text-xs font-bold">No hay tarjetas registradas para ${teamName}.</p>
                <button onclick="document.getElementById('scorecard-modal').remove()" class="px-6 py-2.5 bg-emerald-500 text-slate-950 rounded-xl font-black text-xs uppercase">Cerrar</button>
            </div>`;
        return;
    }

    const contentHtml = teamScores.map((s) => {
        let holeScoresObj = {};
        if (s.hole_scores) {
            try {
                holeScoresObj = typeof s.hole_scores === 'string' ? JSON.parse(s.hole_scores) : s.hole_scores;
            } catch(e) { holeScoresObj = {}; }
        }

        const outSum = s.out_score !== undefined && s.out_score !== null ? s.out_score : (s.out || 0);
        const inSum  = s.in_score  !== undefined && s.in_score  !== null ? s.in_score  : (s.in  || 0);
        const gross  = s.gross || s.total || 0;
        const net    = s.net   !== undefined && s.net   !== null ? s.net : (gross > 0 ? (gross - ventaja) : 0);

        const holesArray = [];
        for (let i = 1; i <= 18; i++) {
            holesArray.push(holeScoresObj[`h${i}`] !== undefined ? holeScoresObj[`h${i}`] : '-');
        }

        return `
            <div class="bg-slate-900 rounded-[2rem] border border-white/10 shadow-xl overflow-hidden mb-6">
                <div class="bg-emerald-500 px-6 py-4 flex justify-between items-center text-slate-950">
                    <h4 class="font-black uppercase text-[11px] tracking-widest">${s.coursename || 'CLUB DE GOLF COLIMA'}</h4>
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] font-black uppercase bg-slate-950/20 px-3 py-1 rounded-full">Gross: ${gross}</span>
                        <span class="text-[10px] font-black uppercase bg-slate-950/40 text-blue-300 px-3 py-1 rounded-full border border-blue-400/30">VTJ: −${ventaja}</span>
                        <span class="text-xs font-black uppercase bg-slate-950 text-emerald-400 px-3 py-1 rounded-full">Neto: ${net}</span>
                    </div>
                </div>
                <div class="p-6">
                    <p class="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2">VUELTA 1-9 (IN)</p>
                    <div class="grid grid-cols-9 gap-1.5 mb-5">
                        ${holesArray.slice(0, 9).map((val, i) => `
                            <div class="flex flex-col items-center">
                                <span class="text-[8px] text-slate-500 font-bold mb-1">#${i+1}</span>
                                <div class="w-full py-2 bg-slate-800 border border-slate-700/80 rounded-xl text-center font-black text-xs text-white">${val}</div>
                            </div>
                        `).join('')}
                    </div>

                    <p class="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2">VUELTA 10-18 (OUT)</p>
                    <div class="grid grid-cols-9 gap-1.5 mb-6">
                        ${holesArray.slice(9, 18).map((val, i) => `
                            <div class="flex flex-col items-center">
                                <span class="text-[8px] text-slate-500 font-bold mb-1">#${i+10}</span>
                                <div class="w-full py-2 bg-slate-800 border border-slate-700/80 rounded-xl text-center font-black text-xs text-white">${val}</div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="flex justify-between items-center pt-4 border-t border-white/10">
                        <div class="flex gap-3">
                            <div class="text-center px-3 py-1.5 bg-slate-800 rounded-xl">
                                <p class="text-[8px] text-slate-400 font-black">IN (1-9)</p>
                                <p class="font-black text-white text-sm">${outSum}</p>
                            </div>
                            <div class="text-center px-3 py-1.5 bg-slate-800 rounded-xl">
                                <p class="text-[8px] text-slate-400 font-black">OUT (10-18)</p>
                                <p class="font-black text-white text-sm">${inSum}</p>
                            </div>
                            <div class="text-center px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                                <p class="text-[8px] text-blue-400 font-black">VENTAJA</p>
                                <p class="font-black text-blue-400 text-sm">−${ventaja}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-[8px] text-slate-400 font-black uppercase">TOTAL NETO</p>
                            <p class="text-2xl font-black text-emerald-400">${net}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    modal.innerHTML = `
        <div class="w-full max-w-2xl bg-slate-950/95 backdrop-blur-3xl rounded-[2.5rem] border border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div class="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                        <span class="material-icons-round">sports_golf</span>
                    </div>
                    <div>
                        <h3 class="font-black uppercase text-white text-base truncate">${teamName}</h3>
                        <p class="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Tarjeta Oficial de Score</p>
                    </div>
                </div>
                <button onclick="document.getElementById('scorecard-modal').remove()" class="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                    <span class="material-icons-round text-sm">close</span>
                </button>
            </div>
            <div class="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">${contentHtml}</div>
        </div>
    `;
};

// Internal core logic
async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    currentTournamentId = urlParams.get('id') || urlParams.get('tournament');
    const viewParam = urlParams.get('view');
    if (viewParam && ['posiciones', 'oyeses', 'salidas'].includes(viewParam)) {
        currentView = viewParam;
    }

    if (!currentTournamentId) {
        showError("No se especificó un ID de torneo.");
        return;
    }

    await loadTournamentData();
    updateUI();
    subscribeToUpdates();
}

async function loadTournamentData() {
    try {
        const [{ data: tData, error: tError }, { count: oyeCount }] = await Promise.all([
            db.from('tournaments').select('*').eq('id', currentTournamentId).single(),
            db.from('oyeses').select('id', { count: 'exact', head: true }).eq('eventid', String(currentTournamentId))
        ]);

        if (tError || !tData) throw new Error("Torneo no encontrado");
        tournamentData = tData;

        document.getElementById('tournament-name').textContent = 'CLUB DE GOLF COLIMA';
        document.getElementById('tournament-location').innerHTML = `<span class="material-icons-round text-[12px]">emoji_events</span> ${tData.name}`;

        const btnOyes = document.getElementById('btn-oyeses');
        if (oyeCount === 0) {
            btnOyes.classList.add('hidden');
            if (currentView === 'oyeses') currentView = 'salidas';
        } else {
            btnOyes.classList.remove('hidden');
        }

        updateUI();
        await fetchDataForView();
    } catch (err) {
        showError(err.message);
    }
}

async function fetchDataForView() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.remove('hidden');
    const content = document.getElementById('content-area');
    content.innerHTML = ''; // Clear content

    if (currentView === 'posiciones') {
        await renderLeaderboard();
    } else if (currentView === 'oyeses') {
        await renderOyeses();
    } else {
        await renderSalidas();
    }

    if (loader) loader.classList.add('hidden');
}

async function renderSalidas() {
    const content = document.getElementById('content-area');
    const { data: teams, error } = await db.from('teams').select('*').eq('eventid', String(currentTournamentId));

    if (error || !teams || teams.length === 0) {
        content.innerHTML = `<div class="py-20 text-center opacity-40"><p class="text-[10px] font-black uppercase tracking-widest">No hay salidas programadas.</p></div>`;
        return;
    }

    const holeGroups = {};
    teams.forEach(t => {
        const h = (t.hole !== null && t.hole !== undefined && t.hole !== '') ? t.hole : (t.starting_hole || 'SIN HOYO');
        if (!holeGroups[h]) holeGroups[h] = [];
        holeGroups[h].push(t);
    });

    const sortedHoles = Object.keys(holeGroups).sort((a, b) => (parseInt(a)||99)-(parseInt(b)||99));

    content.innerHTML = `
        <div class="grid gap-6 animate-fade-in pb-20 px-1 sm:px-0">
            ${sortedHoles.map(hole => `
                <div class="bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 shadow-xl overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div class="bg-black/40 px-6 py-5 flex items-center relative border-b border-white/5">
                        <div class="flex items-center gap-4 z-10">
                            <div class="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"><span class="material-icons-round text-emerald-500 text-sm">flag</span></div>
                        </div>
                        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <h3 class="text-xl font-black uppercase text-white tracking-tight">${isNaN(parseInt(hole)) ? hole : `Hoyo ${hole}`}</h3>
                        </div>
                        <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-auto z-10">${holeGroups[hole].length} EQUIPOS</span>
                    </div>
                    <div class="p-6 grid gap-4 grid-cols-1 md:grid-cols-2">
                        ${holeGroups[hole].map(t => {
                            const players = t.players && Array.isArray(t.players)
                                ? t.players.map(p => `${p.name} <strong class="text-white">(${p.hdcp || 0})</strong>`)
                                : [t.player1, t.player2, t.player3, t.player4].filter(p => p && p.trim() !== '');
                            return `
                                <div class="p-5 bg-white/[0.02] rounded-3xl border border-white/5 hover:bg-white/5 transition-all flex flex-col sm:flex-row justify-between items-center gap-5 text-center sm:text-left">
                                    <div class="min-w-0 w-full flex-1 order-2 sm:order-1">
                                        <p class="text-[8px] font-black text-slate-600 uppercase mb-1">Equipo #${t.teamnumber || '?'}</p>
                                        <h4 class="font-black text-[15px] sm:text-[14px] uppercase text-white truncate mb-2 leading-tight">${t.teamname || 'EQUIPO'}</h4>
                                        <div class="grid grid-cols-2 gap-x-3 gap-y-2 mt-3">
                                            ${players.map(p => `<div class="text-[10px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-tight leading-tight">${p}</div>`).join('')}
                                        </div>
                                    </div>
                                    <div class="shrink-0 flex items-center gap-2 order-1 sm:order-2">
                                        <div class="flex flex-col items-center px-3.5 py-2 bg-slate-800/80 rounded-2xl border border-slate-700/80 min-w-[50px]">
                                            <span class="text-[7px] font-black text-slate-400 uppercase tracking-wider mb-0.5">HCP</span>
                                            <span class="text-sm font-black text-white leading-none">${t.hdcp || 0}</span>
                                        </div>
                                        <div class="flex flex-col items-center px-3.5 py-2 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 min-w-[50px]">
                                            <span class="text-[7px] font-black text-emerald-400 uppercase tracking-wider mb-0.5">VTJ</span>
                                            <span class="text-sm font-black text-emerald-400 leading-none">${t.ventaja || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

async function renderLeaderboard() {
    const content = document.getElementById('content-area');
    const [teamsRes, scoresRes] = await Promise.all([
        db.from('teams').select('*').eq('eventid', String(currentTournamentId)),
        db.from('scores').select('*').eq('eventid', String(currentTournamentId))
    ]);

    const teams = teamsRes.data || [];
    const scores = scoresRes.data || [];

    if (!scores || scores.length === 0) {
        content.innerHTML = `<div class="py-20 text-center opacity-40"><p class="text-[10px] font-black uppercase tracking-widest text-white/50">Esperando resultados...</p></div>`;
        return;
    }

    const categories = {};
    teams.forEach(t => {
        const cat = t.category || 'GENERAL';
        const teamScores = scores.filter(s => String(s.teamid) === String(t.id));
        if (teamScores.length > 0) {
            const total = teamScores.reduce((acc, s) => acc + (s.total || 0), 0);
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push({ team: t, total, rounds: teamScores.length });
        }
    });

    content.innerHTML = Object.keys(categories).sort().map(catName => `
        <div class="space-y-6 mb-12 animate-fade-in">
           <div class="flex items-center gap-4 px-2">
              <div class="w-1.5 h-10 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
              <h3 class="text-xl font-black uppercase tracking-tight text-white">${catName}</h3>
           </div>
           <div class="bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 shadow-xl overflow-hidden">
             <div class="overflow-x-auto custom-scrollbar">
               <table class="w-full text-left min-w-[550px] md:min-w-full">
                 <thead>
                   <tr class="bg-black/40 text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">
                     <th class="px-3 md:px-6 py-5 w-16 md:w-20 text-center">POS</th>
                     <th class="px-3 md:px-6 py-5">EQUIPO / JUGADORES</th>
                     <th class="px-3 md:px-6 py-5 text-center">RDS</th>
                     <th class="px-3 md:px-6 py-5 text-center">VENTAJA</th>
                     <th class="px-3 md:px-6 py-5 text-center">GROSS</th>
                     <th class="px-3 md:px-6 py-5 text-center bg-black/40 text-emerald-500">NETO</th>
                     <th class="px-3 md:px-6 py-5 text-center w-20 md:w-24">INFO</th>
                   </tr>
                 </thead>
                 <tbody class="divide-y divide-white/5">
                   ${categories[catName].map(item => {
                     const advantage = item.team.ventaja || 0;
                     const gross = item.total;
                     const neto = gross - (advantage * item.rounds);
                     return { ...item, gross, neto, advantage };
                   }).sort((a,b)=>a.neto - b.neto).map((item, idx) => {
                     const ventajaDisplay = item.advantage === 0 ? '0' : `-${Math.abs(item.advantage)}`;
                     return `
                     <tr class="hover:bg-white/[0.02] transition-colors group">
                       <td class="px-3 md:px-6 py-4 md:py-5 text-center">
                         <span class="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg md:rounded-xl bg-white/5 text-white font-black text-xs md:text-sm mx-auto">#${idx+1}</span>
                       </td>
                       <td class="px-3 md:px-6 py-4 md:py-5">
                         <p class="font-black text-[12px] md:text-[13px] uppercase text-white truncate max-w-[120px] md:max-w-none">${item.team.teamname}</p>
                       </td>
                       <td class="px-3 md:px-6 py-4 md:py-5 text-center text-white/70 font-bold text-xs md:text-sm">${item.rounds}</td>
                       <td class="px-3 md:px-6 py-4 md:py-5 text-center text-blue-400 font-bold text-xs md:text-sm">${ventajaDisplay}</td>
                       <td class="px-3 md:px-6 py-4 md:py-5 text-center text-white font-bold text-xs md:text-sm">${item.gross}</td>
                       <td class="px-3 md:px-6 py-4 md:py-5 text-center bg-emerald-500/10">
                         <span class="text-lg md:text-xl font-black text-emerald-400">${item.neto}</span>
                       </td>
                       <td class="px-3 md:px-6 py-4 md:py-5 text-center">
                         <button onclick="showScorecard('${item.team.id}', '${item.team.teamname.replace(/'/g, "\\'")}')" class="w-8 h-8 md:w-10 md:h-10 bg-white/5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg md:rounded-xl flex items-center justify-center mx-auto transition-all">
                           <span class="material-icons-round text-xs md:text-sm">visibility</span>
                         </button>
                       </td>
                     </tr>
                    `;
                   }).join('')}
                 </tbody>
               </table>
             </div>
           </div>
        </div>
    `).join('');
}

async function renderOyeses() {
    const content = document.getElementById('content-area');
    const { data: oyeses, error } = await db.from('oyeses').select('*').eq('eventid', String(currentTournamentId));

    if (error || !oyeses || oyeses.length === 0) {
        content.innerHTML = `<div class="py-20 text-center opacity-40"><p class="text-[10px] font-black uppercase tracking-widest text-white/50">No hay registros de Oye's.</p></div>`;
        return;
    }

    const oyeColors = {
        1:  '#10b981', 2:  '#10b981', 3:  '#06b6d4', 4:  '#3b82f6', 5:  '#6366f1',
        6:  '#a855f7', 7:  '#f59e0b', 8:  '#f97316', 9:  '#06b6d4', 10: '#f43f5e',
        11: '#6366f1', 12: '#14b8a6', 13: '#eab308', 14: '#84cc16', 15: '#0ea5e9',
        16: '#8b5cf6', 17: '#ec4899', 18: '#10b981'
    };

    const grouped = {};
    oyeses.forEach(o => {
        const h = o.hole || '?';
        if (!grouped[h]) grouped[h] = [];
        grouped[h].push(o);
    });

    const sortedHoles = Object.keys(grouped).sort((a, b) => (parseInt(a)||99) - (parseInt(b)||99));

    content.innerHTML = `
        <div class="space-y-12 animate-fade-in pb-16">
            <div class="text-center">
                <h2 class="text-2xl font-black uppercase tracking-tight text-white mb-1">${tournamentData ? tournamentData.name : 'OYE\'S LEADERBOARD'}</h2>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Premios a la bandera</p>
            </div>

            ${sortedHoles.map(hole => {
                const hNum = parseInt(hole) || 1;
                const hColor = oyeColors[hNum] || '#10b981';
                const players = grouped[hole].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

                return `
                <div class="space-y-4">
                    <div class="flex items-center gap-4">
                        <div class="h-px flex-1 bg-white/10"></div>
                        <span class="text-xs font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full border border-white/10" style="color:${hColor}; background: ${hColor}15">
                            Hoyo ${hole}
                        </span>
                        <div class="h-px flex-1 bg-white/10"></div>
                    </div>

                    <div class="grid gap-3">
                        ${players.map((p, idx) => `
                            <div class="flex items-center justify-between p-4 sm:p-5 rounded-[2rem] bg-white/5 border border-white/5 ${idx===0?'border-emerald-500/30 shadow-lg shadow-emerald-500/5':''}">
                                <div class="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                    <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl ${idx===0?'bg-amber-500/20 text-amber-400 border border-amber-500/30':'bg-white/5 text-slate-400'} flex items-center justify-center font-black text-sm shrink-0">
                                        ${idx===0?'🥇':(idx+1)}
                                    </div>
                                    <h4 class="text-xs sm:text-sm font-black uppercase tracking-tight text-white truncate">${p.player_name || p.playername}</h4>
                                </div>
                                <div class="px-4 py-2 rounded-2xl bg-black/40 font-black text-emerald-400 text-xs sm:text-sm shrink-0">
                                    ${p.distance}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
            }).join('')}
        </div>`;
}

function updateUI() {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active', 'bg-emerald-500', 'text-slate-950', 'shadow-lg', 'shadow-emerald-500/20'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.add('text-white/50'));
    
    const activeBtn = document.getElementById(`btn-${currentView}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-white/50');
        activeBtn.classList.add('active', 'bg-emerald-500', 'text-slate-950', 'shadow-lg', 'shadow-emerald-500/20');
    }
}

function subscribeToUpdates() {
    supabaseClient.removeAllChannels();
    supabaseClient.channel('tournament-live')
        .on('postgres_changes', { event: '*', schema: 'colimaGC', table: 'scores', filter: `eventid=eq.${currentTournamentId}` }, () => {
            if (currentView === 'posiciones') fetchDataForView();
        })
        .on('postgres_changes', { event: '*', schema: 'colimaGC', table: 'oyeses', filter: `eventid=eq.${currentTournamentId}` }, () => {
            if (currentView === 'oyeses') fetchDataForView();
        })
        .on('postgres_changes', { event: '*', schema: 'colimaGC', table: 'teams', filter: `eventid=eq.${currentTournamentId}` }, () => {
            if (currentView === 'salidas') fetchDataForView();
        })
        .subscribe();
}

function showError(msg) {
    document.getElementById('content-area').innerHTML = `<div class="py-20 text-center"><span class="material-icons-round text-red-500 mb-4">error</span><p class="text-red-500 font-black uppercase text-[10px]">${msg}</p></div>`;
}

// Start
init();
