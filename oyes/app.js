const SUPABASE_URL = 'https://tztolxgsaktqindoimtu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dG9seGdzYWt0cWluZG9pbXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzQ4ODAsImV4cCI6MjEwMTg1MDg4MH0.E2GABiOMXYb5hEwE9ErIcJa6_LHkj9lJUglQVoiLl0M';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const db = supabaseClient.schema('colimaGC');

let activeTournament = null;
let activeHole = null;
let activeCourse = 'CLUB DE GOLF COLIMA';

// Modern Mobile Toast Notification (No Browser Alerts!)
function showOyesToast(title, message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    container.innerHTML = ''; // Single toast at a time

    const toast = document.createElement('div');
    toast.className = `toast-slide p-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3.5 ${
        type === 'success' 
            ? 'bg-slate-900/95 border-emerald-500/50 shadow-emerald-500/20 text-white'
            : 'bg-slate-900/95 border-rose-500/50 shadow-rose-500/20 text-white'
    }`;

    const icon = type === 'success' ? 'check_circle' : 'error_outline';
    const iconColor = type === 'success' ? 'text-emerald-400' : 'text-rose-400';

    toast.innerHTML = `
        <div class="w-10 h-10 rounded-xl ${type === 'success' ? 'bg-emerald-500/20' : 'bg-rose-500/20'} flex items-center justify-center shrink-0">
            <span class="material-icons-round ${iconColor} text-xl">${icon}</span>
        </div>
        <div class="flex-1 min-w-0">
            <h4 class="font-black uppercase text-xs tracking-wide text-white">${title}</h4>
            <p class="text-[11px] font-bold text-slate-300 truncate mt-0.5">${message}</p>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

window.loginJudge = async function() {
    const codeInput = document.getElementById('judge-code')?.value.trim().toUpperCase();
    if (!codeInput) {
        showOyesToast('Hoyo Requerido', 'Ingresa el número de hoyo asignado (ej. 2 o hoyo 2).', 'error');
        return;
    }

    const { data: tournaments } = await db.from('tournaments').select('*').order('created_at', { ascending: false });
    if (!tournaments || tournaments.length === 0) {
        showOyesToast('Sin Torneos', 'No hay torneos activos en este momento.', 'error');
        return;
    }

    let foundTournament = null;
    let foundHole = null;

    // 1. Try numeric extraction (e.g. "hoyo 2" -> 2, "2" -> 2, "H2" -> 2)
    const numMatch = parseInt(codeInput.replace(/[^0-9]/g, ''));
    if (!isNaN(numMatch) && numMatch >= 1 && numMatch <= 18) {
        tournaments.forEach(t => {
            if (foundTournament) return;
            const config = typeof t.config === 'object' ? t.config : {};
            const activeHoles = config.oyeses_holes || [2, 5, 7, 11, 14, 16];
            if (activeHoles.includes(numMatch)) {
                foundTournament = t;
                foundHole = numMatch;
            }
        });
    }

    // 2. Try exact code match if not found by number
    if (!foundTournament) {
        tournaments.forEach(t => {
            if (foundTournament) return;
            const config = typeof t.config === 'object' ? t.config : {};
            const judgeCodes = config.judge_codes || {};
            Object.entries(judgeCodes).forEach(([h, code]) => {
                if (code.toUpperCase() === codeInput) {
                    foundTournament = t;
                    foundHole = h;
                }
            });
        });
    }

    if (!foundTournament || !foundHole) {
        showOyesToast('Hoyo No Encontrado', `No hay Oye's configurado para "${codeInput}". Ingresa un hoyo válido (ej. hoyo 2).`, 'error');
        return;
    }

    activeTournament = foundTournament;
    activeHole = String(foundHole);
    activeCourse = (foundTournament.courses && foundTournament.courses.length) ? foundTournament.courses[0] : 'CLUB DE GOLF COLIMA';

    document.getElementById('screen-login').classList.add('hidden');
    document.getElementById('screen-capture').classList.remove('hidden');

    const badgeEl = document.getElementById('judge-hole-badge');
    if (badgeEl) badgeEl.textContent = `#${activeHole}`;

    document.getElementById('judge-course-name').textContent = activeCourse;
    document.getElementById('judge-hole-title').textContent = `HOYO ${activeHole}`;
    document.getElementById('tournament-subtitle').textContent = activeTournament.name;

    showOyesToast('Acceso Concedido', `Conectado al Hoyo ${activeHole} — ${activeTournament.name}`, 'success');

    await loadPlayersDatalist();
    await loadHoleMarks();
};

window.logoutJudge = function() {
    activeTournament = null;
    activeHole = null;
    document.getElementById('screen-capture').classList.add('hidden');
    document.getElementById('screen-login').classList.remove('hidden');
    showOyesToast('Sesión Cerrada', 'Has salido del hoyo asignado.', 'success');
};

async function loadPlayersDatalist() {
    if (!activeTournament) return;
    const { data: teams } = await db.from('teams').select('*').eq('eventid', String(activeTournament.id));
    const datalist = document.getElementById('players-datalist');
    if (!datalist || !teams) return;

    const names = new Set();
    teams.forEach(t => {
        if (t.teamname) names.add(t.teamname);
        if (t.player1) names.add(t.player1);
        if (t.player2) names.add(t.player2);
        if (t.player3) names.add(t.player3);
        if (t.player4) names.add(t.player4);
    });

    datalist.innerHTML = Array.from(names).map(n => `<option value="${n}">`).join('');
}

async function loadHoleMarks() {
    if (!activeTournament || !activeHole) return;
    const { data: marks } = await db.from('oyeses').select('*')
        .eq('eventid', String(activeTournament.id))
        .eq('hole', String(activeHole));

    const listEl = document.getElementById('judge-hole-list');
    const countEl = document.getElementById('judge-hole-count');

    const sorted = (marks || []).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    if (countEl) countEl.textContent = sorted.length;

    if (!listEl) return;
    if (sorted.length === 0) {
        listEl.innerHTML = `<div class="py-6 text-center text-slate-500 text-xs font-bold uppercase">Sin marcas en este hoyo.</div>`;
        return;
    }

    listEl.innerHTML = sorted.map((m, idx) => `
        <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 transition-all ${idx === 0 ? 'border-emerald-500/40 bg-emerald-500/5' : ''}">
            <div class="flex items-center gap-3 min-w-0 flex-1">
                <span class="w-7 h-7 rounded-xl ${idx === 0 ? 'bg-amber-500/20 text-amber-400 font-black' : 'bg-slate-700/80 text-slate-300 font-bold'} text-xs flex items-center justify-center shrink-0">
                    ${idx === 0 ? '🥇' : `#${idx + 1}`}
                </span>
                <span class="font-black text-white text-xs uppercase truncate">${m.player_name}</span>
            </div>
            <div class="flex items-center gap-2.5 shrink-0">
                <span class="font-black text-emerald-400 text-sm">${m.distance}</span>
                <button onclick="deleteJudgeOyeMark('${m.id}', '${m.player_name}')" title="Eliminar marca"
                    class="w-7 h-7 bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 rounded-lg flex items-center justify-center transition-all">
                    <span class="material-icons-round text-sm">delete</span>
                </button>
            </div>
        </div>
    `).join('');
}

window.submitJudgeOye = async function() {
    const playerEl = document.getElementById('judge-player-name');
    const distEl   = document.getElementById('judge-distance');
    const btn      = document.getElementById('btn-submit-oye');

    const player   = playerEl?.value.trim().toUpperCase();
    const distance = distEl?.value.trim();

    if (!player || !distance) {
        showOyesToast('Datos Incompletos', 'Ingresa el nombre del jugador y la distancia.', 'error');
        return;
    }

    const distFormatted = distance.endsWith('m') ? distance : `${distance}m`;

    if (btn) btn.disabled = true;

    const { error } = await db.from('oyeses').insert([{
        eventid:     String(activeTournament.id),
        coursename:  activeCourse,
        hole:        String(activeHole),
        player_name: player,
        distance:    distFormatted
    }]);

    if (btn) btn.disabled = false;

    if (error) {
        showOyesToast('Error al Guardar', error.message, 'error');
    } else {
        showOyesToast('¡Oye Registrado!', `${player} — Hoyo ${activeHole} (${distFormatted})`, 'success');
        if (playerEl) playerEl.value = '';
        if (distEl) distEl.value = '';
        await loadHoleMarks();
    }
};

window.deleteJudgeOyeMark = async function(id, playerName) {
    if (confirm(`¿Eliminar la marca de ${playerName}?`)) {
        const { error } = await db.from('oyeses').delete().eq('id', id);
        if (error) {
            showOyesToast('Error', error.message, 'error');
        } else {
            showOyesToast('Eliminado', `Marca de ${playerName} eliminada.`, 'success');
            await loadHoleMarks();
        }
    }
};

// Check code parameter in URL if provided (e.g. /oyes/index.html?code=hoyo2)
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
        const input = document.getElementById('judge-code');
        if (input) {
            input.value = code.toUpperCase();
            loginJudge();
        }
    }
};
