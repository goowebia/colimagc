// ==========================================================================
// LIVE LEADERBOARD MODAL - CLUB DE GOLF COLIMA
// Proyección instantánea (0ms) en ventana/modal para móvil y escritorio
// ==========================================================================

import { renderRankingModalContent } from './ranking_acumulado.js';

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

let liveDb = null;
let liveSupabaseClient = null;
let currentTournamentId = null;
let currentView = 'posiciones';
let tournamentData = null;
let cachedTeams = null;
let cachedScores = null;
let cachedOyeses = null;
let realtimeChannel = null;

export function initLiveLeaderboardModal(supabaseClient, db) {
    liveSupabaseClient = supabaseClient;
    liveDb = db;

    // Attach global functions to window
    window.openLiveLeaderboardModal = openLiveLeaderboardModal;
    window.closeLiveLeaderboardModal = closeLiveLeaderboardModal;
    window.switchLiveModalView = switchLiveModalView;
    window.showLiveScorecard = showLiveScorecard;
    window.closeLiveScorecard = closeLiveScorecard;
    window.printLiveModal = printLiveModal;
    window.shareLiveLeaderboard = shareLiveLeaderboard;
}

function getScoreDay(scoreObj) {
    if (!scoreObj) return 1;
    if (scoreObj.hole_scores) {
        try {
            const hs = typeof scoreObj.hole_scores === 'string' ? JSON.parse(scoreObj.hole_scores) : scoreObj.hole_scores;
            if (hs && hs._day) {
                const d = parseInt(hs._day);
                if (!isNaN(d) && d >= 1 && d <= 10) return d;
            }
        } catch (e) {}
    }
    const cn = String(scoreObj.coursename || '').toUpperCase();
    const m = cn.match(/(?:D[IÍ]A|RONDA|FECHA)\s*(\d+)/i);
    if (m) {
        const d = parseInt(m[1]);
        if (!isNaN(d) && d >= 1 && d <= 10) return d;
    }
    return 1;
}

function getDayLabel(dayNum, configObj) {
    const cfg = configObj || tournamentData?.config || {};
    const lbl = cfg.dayLabels && cfg.dayLabels[dayNum - 1];
    if (lbl && String(lbl).trim()) return String(lbl).trim().toUpperCase();
    return `DÍA ${dayNum}`;
}

function isCategoryStableford(catName, configObj) {
    const cfg = configObj || tournamentData?.config || {};
    const cats = cfg.categories || [];
    const clean = String(catName || '').trim().toUpperCase();
    const cleanShort = clean.replace(/^CATEGOR[IÍ]A\s+/i, '').trim();
    const found = cats.find(c => {
        const n = (typeof c === 'object' ? c.name : c || '').trim().toUpperCase();
        const nShort = n.replace(/^CATEGOR[IÍ]A\s+/i, '').trim();
        return n === clean || nShort === cleanShort;
    });
    if (found && typeof found === 'object' && found.format) {
        return String(found.format).toUpperCase() === 'STABLEFORD';
    }
    if (clean.includes('STABLEFORD')) return true;
    if (String(cfg.modalidad || '').toUpperCase() === 'STABLEFORD' && (!found || !found.format)) {
        return true;
    }
    return false;
}

function calcHoleStablefordPoints(grossStrokes, holePar, holeIdx, ventaja) {
    const g = parseInt(grossStrokes);
    if (isNaN(g) || g <= 0) return null;
    const v = Math.max(0, Math.round(ventaja || 0));
    const strokesReceived = Math.floor(v / 18) + (holeIdx <= (v % 18) ? 1 : 0);
    const netScore = g - strokesReceived;
    const diff = netScore - holePar;
    return Math.max(0, 2 - diff);
}

function calcCardStablefordPoints(holeScoresObj, gross, ventaja) {
    let hs = holeScoresObj || {};
    if (typeof hs === 'string') {
        try { hs = JSON.parse(hs); } catch (e) { hs = {}; }
    }
    if (hs._stablefordManual !== undefined && hs._stablefordManual !== null && hs._stablefordManual !== '') {
        const m = parseInt(hs._stablefordManual);
        if (!isNaN(m)) return m;
    }
    let totalPts = 0;
    let holesCount = 0;
    for (let i = 0; i < CLUB_COLIMA_HOLES.length; i++) {
        const h = CLUB_COLIMA_HOLES[i];
        const pts = calcHoleStablefordPoints(hs[`h${h.hole}`], h.par, h.idx, ventaja);
        if (pts !== null) {
            totalPts += pts;
            holesCount++;
        }
    }
    if (holesCount > 0) return totalPts;
    if (hs._stableford !== undefined && hs._stableford !== null) {
        const saved = parseInt(hs._stableford);
        if (!isNaN(saved)) return saved;
    }
    const g = parseInt(gross) || 0;
    if (g > 0) {
        const net = g - (ventaja || 0);
        return Math.max(0, 36 + (68 - net));
    }
    return 0;
}

function calcSegmentStablefordPoints(tbInfo, startHole, endHole, ventaja) {
    if (!tbInfo) return null;
    const hs = tbInfo.holeScores || {};
    let ptsSum = 0;
    let count = 0;
    const expectedHoles = endHole - startHole + 1;
    for (let h = startHole; h <= endHole; h++) {
        const hDef = CLUB_COLIMA_HOLES[h - 1];
        if (!hDef) continue;
        const pts = calcHoleStablefordPoints(hs[`h${h}`], hDef.par, hDef.idx, ventaja);
        if (pts !== null) {
            ptsSum += pts;
            count++;
        }
    }
    if (count === expectedHoles) return ptsSum;
    return null;
}

function getTiebreakScoreInfo(scoreObj) {
    if (!scoreObj) return { inStrokes: 0, outStrokes: 0, holeScores: {}, gross: 0, day: 1 };
    let hs = {};
    if (scoreObj.hole_scores) {
        try {
            hs = typeof scoreObj.hole_scores === 'string' ? JSON.parse(scoreObj.hole_scores) : scoreObj.hole_scores;
        } catch (e) { hs = {}; }
    } else if (Array.isArray(scoreObj.holes)) {
        scoreObj.holes.forEach((v, idx) => { hs[`h${idx + 1}`] = v; });
    }

    let inStrokes = 0;
    for (let i = 1; i <= 9; i++) {
        const v = parseInt(hs[`h${i}`]);
        if (!isNaN(v) && v > 0) inStrokes += v;
    }
    let outStrokes = 0;
    for (let i = 10; i <= 18; i++) {
        const v = parseInt(hs[`h${i}`]);
        if (!isNaN(v) && v > 0) outStrokes += v;
    }

    if (inStrokes === 0 && (scoreObj.out_score || scoreObj.in_score || scoreObj.in)) {
        inStrokes = scoreObj.out_score || scoreObj.in_score || scoreObj.in || 0;
    }
    if (outStrokes === 0 && (scoreObj.in_score || scoreObj.out_score || scoreObj.out)) {
        outStrokes = scoreObj.in_score || scoreObj.out_score || scoreObj.out || 0;
    }

    return {
        inStrokes,
        outStrokes,
        holeScores: hs,
        gross: scoreObj.gross || scoreObj.total || (inStrokes + outStrokes) || 0,
        day: getScoreDay(scoreObj)
    };
}

function calcSegmentNetScore(tbInfo, startHole, endHole, ventaja) {
    if (!tbInfo) return null;
    const hs = tbInfo.holeScores || {};
    let sum = 0;
    let count = 0;
    const expectedHoles = endHole - startHole + 1;
    for (let h = startHole; h <= endHole; h++) {
        const v = parseInt(hs[`h${h}`]);
        if (!isNaN(v) && v > 0) {
            sum += v;
            count++;
        }
    }
    if (count === expectedHoles && sum > 0) {
        return sum - ((ventaja || 0) * expectedHoles / 18);
    }
    if (startHole === 10 && endHole === 18 && tbInfo.outStrokes > 0) {
        return tbInfo.outStrokes - ((ventaja || 0) * 9 / 18);
    }
    if (startHole === 1 && endHole === 9 && tbInfo.inStrokes > 0) {
        return tbInfo.inStrokes - ((ventaja || 0) * 9 / 18);
    }
    return null;
}

function evaluateCardTiebreak(tbA, tbB, ventajaA, ventajaB, daySuffix = '', isStableford = false) {
    const segments = [
        { s: 10, e: 18, label: `Últ. 9 hoyos (10-18)${daySuffix}` },
        { s: 13, e: 18, label: `Últ. 6 hoyos (13-18)${daySuffix}` },
        { s: 16, e: 18, label: `Últ. 3 hoyos (16-18)${daySuffix}` },
        { s: 18, e: 18, label: `Últ. hoyo (18)${daySuffix}` },
        { s: 1,  e: 9,  label: `1ª Vuelta (1-9)${daySuffix}` },
        { s: 4,  e: 9,  label: `Hoyos 4-9${daySuffix}` },
        { s: 7,  e: 9,  label: `Hoyos 7-9${daySuffix}` },
        { s: 9,  e: 9,  label: `Hoyo 9${daySuffix}` }
    ];

    if (isStableford) {
        for (const seg of segments) {
            const ptsA = calcSegmentStablefordPoints(tbA, seg.s, seg.e, ventajaA);
            const ptsB = calcSegmentStablefordPoints(tbB, seg.s, seg.e, ventajaB);
            if (ptsA !== null && ptsB !== null && ptsA !== ptsB) {
                return { diff: ptsB - ptsA, reason: `${seg.label} (Pts)` };
            }
        }
    }

    for (const seg of segments) {
        const netA = calcSegmentNetScore(tbA, seg.s, seg.e, ventajaA);
        const netB = calcSegmentNetScore(tbB, seg.s, seg.e, ventajaB);
        if (netA !== null && netB !== null && Math.abs(netA - netB) > 0.0001) {
            return { diff: netA - netB, reason: seg.label };
        }
    }

    if (tbA && tbB && tbA.gross > 0 && tbB.gross > 0) {
        if (isStableford) {
            const cardPtsA = calcCardStablefordPoints(tbA.holeScores, tbA.gross, ventajaA);
            const cardPtsB = calcCardStablefordPoints(tbB.holeScores, tbB.gross, ventajaB);
            if (cardPtsA !== cardPtsB) {
                return { diff: cardPtsB - cardPtsA, reason: `Puntos${daySuffix}` };
            }
        }
        const cardNetA = tbA.gross - (ventajaA || 0);
        const cardNetB = tbB.gross - (ventajaB || 0);
        if (Math.abs(cardNetA - cardNetB) > 0.0001) {
            return { diff: cardNetA - cardNetB, reason: `Score Neto${daySuffix}` };
        }
    }

    return { diff: 0, reason: null };
}

function compareGolfTiebreaker(a, b) {
    // 1. Mayor número de rondas jugadas primero (en vista acumulada)
    const rA = a.rounds || 1;
    const rB = b.rounds || 1;
    if (rA !== rB) {
        return rB - rA;
    }

    const isStb = Boolean(a.isStableford || b.isStableford);

    // 2. Principal: En Stableford mayor puntaje gana; en Stroke Play menor Neto gana
    if (isStb) {
        const ptsA = a.pts || 0;
        const ptsB = b.pts || 0;
        if (ptsA !== ptsB) {
            return ptsB - ptsA;
        }
    } else {
        if (a.neto !== b.neto) {
            return a.neto - b.neto;
        }
    }

    const vA = a.advantagePerDay !== undefined ? a.advantagePerDay : (a.team?.ventaja ?? a.advantage ?? 0);
    const vB = b.advantagePerDay !== undefined ? b.advantagePerDay : (b.team?.ventaja ?? b.advantage ?? 0);

    const cardsA = Array.isArray(a.dayCardsDesc) && a.dayCardsDesc.length > 0
        ? a.dayCardsDesc
        : [a._tiebreak || getTiebreakScoreInfo(a.scoreObj || a.latestScore)];
    const cardsB = Array.isArray(b.dayCardsDesc) && b.dayCardsDesc.length > 0
        ? b.dayCardsDesc
        : [b._tiebreak || getTiebreakScoreInfo(b.scoreObj || b.latestScore)];

    const maxLen = Math.max(cardsA.length, cardsB.length);
    for (let i = 0; i < maxLen; i++) {
        const cA = cardsA[i];
        const cB = cardsB[i];
        if (!cA || !cB) continue;
        const suffix = maxLen > 1 ? ` · D${cA.day || (maxLen - i)}` : '';
        const res = evaluateCardTiebreak(cA, cB, vA, vB, suffix, isStb);
        if (res.diff !== 0) {
            return res.diff;
        }
    }

    return 0;
}

function isFirstAbsoluteCategory(catName, allCatNames = []) {
    const c = (catName || '').toUpperCase().trim();
    if (c.includes('CAMPEONATO') || c.includes('SCRATCH') || c.includes('AA') || c.includes('1ª') || c.includes('1A') || c.includes('PRIMERA')) {
        return true;
    }
    const hasHigher = allCatNames.some(other => {
        const o = (other || '').toUpperCase().trim();
        return o.includes('CAMPEONATO') || o.includes('SCRATCH') || o.includes('AA') || o.includes('1ª') || o.includes('1A') || o.includes('PRIMERA');
    });
    if (!hasHigher && (c === 'A' || c === 'CATEGORÍA A' || c === 'CATEGORIA A')) {
        return true;
    }
    return false;
}

export async function openLiveLeaderboardModal(tournamentId = null) {
    let allTournaments = [];
    try {
        const { data: tList } = await liveDb.from('tournaments').select('*').order('created_at', { ascending: false });
        if (tList && tList.length > 0) {
            allTournaments = tList;
        }
    } catch (e) {}

    // Official Ranking tournament IDs
    const id8 = 'b73a7380-589d-4986-84c4-7618d805fced';
    const id22 = '291bcd9c-674b-431e-9fd4-5690ce2b7b94';
    const id5 = '69452b77-44c7-400a-bb88-a763da03196b';
    const id26 = 'dfecb440-d4ee-485f-b6d1-ad27f5032fc7';

    // Helpers to safely identify the 4 ranking stages without colliding with subsequent tournaments (e.g. Torneo Anual 5/Nov/26)
    const isTour8 = (t) => t && (t.id === id8 || ((t.name?.toLowerCase().includes('8') || t.name?.toLowerCase().includes('1ª') || t.name?.toLowerCase().includes('1a')) && t.name?.toLowerCase().includes('ago') && !t.name?.toLowerCase().includes('nov')));
    const isTour22 = (t) => t && (t.id === id22 || (t.name?.toLowerCase().includes('22') && t.name?.toLowerCase().includes('ago')));
    const isTour5 = (t) => t && (t.id === id5 || ((t.name?.toLowerCase().includes('5') || t.name?.toLowerCase().includes('3ª') || t.name?.toLowerCase().includes('3a')) && (t.name?.toLowerCase().includes('sep') || t.name?.toLowerCase().includes('sept')) && !t.name?.toLowerCase().includes('nov')));
    const isTour26 = (t) => t && (t.id === id26 || ((t.name?.toLowerCase().includes('26') || t.name?.toLowerCase().includes('4ª') || t.name?.toLowerCase().includes('4a')) && (t.name?.toLowerCase().includes('sep') || t.name?.toLowerCase().includes('sept')) && !t.name?.toLowerCase().includes('nov')));

    const t8 = allTournaments.find(isTour8);
    const t22 = allTournaments.find(isTour22);
    const t5 = allTournaments.find(isTour5);
    const t26 = allTournaments.find(isTour26);

    const finalId8 = t8 ? t8.id : id8;
    const finalId22 = t22 ? t22.id : id22;
    const finalId5 = t5 ? t5.id : id5;
    const finalId26 = t26 ? t26.id : id26;

    // Check if 4a fecha has scores recorded (in progress/live)
    let fecha4HasScores = false;
    if (finalId26 && finalId26 !== 'tourney-4-pending') {
        try {
            const { count } = await liveDb.from('scores').select('id', { count: 'exact', head: true }).eq('eventid', finalId26);
            if (count && count > 0) fecha4HasScores = true;
        } catch(e) {}
    }

    // If no ID passed, prioritize Torneo del Mecate if active today, otherwise Fecha 4 / Fecha 3
    const nowCheck = new Date();
    const isMecateDay = nowCheck <= new Date(2026, 8, 20, 23, 59, 59);
    if (!tournamentId || tournamentId === '5-sept-pending' || tournamentId === '69452b77-44c7-400a-bb88-a763da03196b') {
        if (!tournamentId && isMecateDay) {
            tournamentId = idMecate;
        }
        if (tournamentId === '69452b77-44c7-400a-bb88-a763da03196b' || !tournamentId || tournamentId === '5-sept-pending') {
            if (tournamentId === '69452b77-44c7-400a-bb88-a763da03196b') {
                currentTournamentId = finalId5;
                tournamentData = t5 || allTournaments.find(t => t.id === finalId5) || null;
            } else if (fecha4HasScores && t26) {
                currentTournamentId = finalId26;
                tournamentData = t26;
            } else if (t5) {
                currentTournamentId = finalId5;
                tournamentData = t5;
            } else {
                currentTournamentId = finalId5;
                tournamentData = {
                    id: finalId5,
                    name: '5 SEPTIEMBRE',
                    courses: 'Club de Golf Colima',
                    config: {
                        categories: [
                            { name: 'CATEGORIA A', pct: 80 },
                            { name: 'CATEGORIA B', pct: 80 },
                            { name: 'CATEGORIA C', pct: 80 }
                        ]
                    }
                };
            }
        }
    } else {
        currentTournamentId = tournamentId;
        tournamentData = allTournaments.find(t => t.id === tournamentId) || null;
    }

    const tMecate = allTournaments.find(t => t.id === 'f116975d-d521-4001-91b5-2e21510f6be7' || t.name?.toLowerCase().includes('mecate'));
    const idMecate = tMecate ? tMecate.id : 'f116975d-d521-4001-91b5-2e21510f6be7';

    const is8Ago = (tournamentData?.name && isTour8(tournamentData)) || currentTournamentId === finalId8;
    const is22Ago = (tournamentData?.name && isTour22(tournamentData)) || currentTournamentId === finalId22;
    const is5Sept = (tournamentData?.name && isTour5(tournamentData)) || currentTournamentId === finalId5;
    const is26Sept = (tournamentData?.name && isTour26(tournamentData)) || currentTournamentId === finalId26;
    const isMecate = currentTournamentId === idMecate || tournamentData?.name?.toLowerCase().includes('mecate');
    const isRankingTour = !isMecate && (is8Ago || is22Ago || is5Sept || is26Sept);
    const isFinished = !isMecate && (is8Ago || is22Ago || is5Sept);

    let modal = document.getElementById('live-leaderboard-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'live-leaderboard-modal';
        modal.className = 'fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/95 backdrop-blur-2xl transition-all duration-300 opacity-0';
        document.body.appendChild(modal);
    }

    // Lock body scroll
    document.body.style.overflow = 'hidden';

    // Render Shell structure
    modal.innerHTML = `
        <div class="relative w-full max-w-5xl h-[94vh] max-h-[95vh] bg-slate-950/95 border border-slate-800 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col transform scale-95 transition-all duration-300" id="live-modal-content">
            
            <!-- Glow background accents -->
            <div class="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] ${isFinished ? 'bg-amber-500/10' : 'bg-emerald-500/10'} blur-[100px] rounded-full pointer-events-none"></div>
            <div class="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>

            <!-- 1. MODAL HEADER -->
            <div class="relative z-10 px-4 sm:px-8 py-4 sm:py-5 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl flex flex-col gap-3">
                <div class="flex items-center justify-between gap-2">
                    <!-- Left: Logos & Title -->
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl shadow-md shrink-0">
                            <img src="./golcolima.jpg" alt="Club Colima" class="h-9 sm:h-11 w-auto object-contain rounded-xl" onerror="this.style.display='none'">
                            <img src="./logoclub.png" alt="Asociación" class="h-9 sm:h-11 w-auto object-contain rounded-xl" onerror="this.style.display='none'">
                        </div>
                        <div class="min-w-0">
                            <div class="flex items-center gap-2">
                                ${isFinished ? `
                                    <div class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 w-max">
                                        <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                                        <span class="text-[9px] font-black uppercase tracking-wider">Torneo Finalizado · Resultados</span>
                                    </div>
                                ` : `
                                    <span class="flex h-2 w-2 relative shrink-0">
                                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <span class="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-400">Torneo en Vivo / Salidas</span>
                                `}
                            </div>
                            <h2 id="live-modal-tournament-name" class="text-base sm:text-2xl font-black uppercase tracking-tight text-white truncate leading-tight mt-0.5">
                                ${tournamentData?.name || 'Cargando Torneo...'}
                            </h2>
                            <p id="live-modal-location" class="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 truncate">
                                <span class="material-icons text-[12px] text-emerald-400">location_on</span>
                                <span>${tournamentData?.courses || 'Club de Golf Colima'}</span>
                            </p>
                        </div>
                    </div>

                    <!-- Right: Quick Actions + Close -->
                    <div class="flex items-center gap-2 shrink-0">
                        <button onclick="shareLiveLeaderboard()" title="Compartir Leaderboard" class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer">
                            <span class="material-icons text-sm sm:text-base">share</span>
                        </button>
                        <button onclick="printLiveModal()" title="Imprimir / Reporte PDF" class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer">
                            <span class="material-icons text-sm sm:text-base">print</span>
                        </button>
                        <button onclick="closeLiveLeaderboardModal()" title="Cerrar (Esc)" class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-500/15 hover:bg-red-500/20 border border-emerald-500/30 hover:border-red-500/40 flex items-center justify-center text-emerald-400 hover:text-red-400 transition-all cursor-pointer">
                            <span class="material-icons text-base sm:text-lg">close</span>
                        </button>
                    </div>
                </div>

                <!-- SWITCHER PILLS (Exclusively for Ranking Tournament) -->
                ${isRankingTour ? `
                <div class="flex items-center gap-2 overflow-x-auto pb-1 pt-1 custom-scrollbar">
                    <span class="text-[9px] font-black uppercase text-slate-400 shrink-0 flex items-center gap-1">
                        <span class="material-icons text-xs text-amber-400">event</span> Fechas Jugadas:
                    </span>
                    <button onclick="openLiveLeaderboardModal('${finalId8}')"
                        class="px-3 py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0
                        ${currentTournamentId === finalId8 
                            ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30 ring-2 ring-amber-400' 
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400'}">
                        <span class="w-2 h-2 rounded-full ${currentTournamentId === finalId8 ? 'bg-slate-950' : 'bg-amber-400'}"></span>
                        1ª Fecha · 8 Ago
                    </button>
                    <button onclick="openLiveLeaderboardModal('${finalId22}')"
                        class="px-3 py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0
                        ${currentTournamentId === finalId22 
                            ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30 ring-2 ring-amber-400' 
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400'}">
                        <span class="w-2 h-2 rounded-full ${currentTournamentId === finalId22 ? 'bg-slate-950' : 'bg-amber-400'}"></span>
                        2ª Fecha · 22 Ago
                    </button>
                    <button onclick="openLiveLeaderboardModal('${finalId5}')"
                        class="px-3 py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0
                        ${currentTournamentId === finalId5
                            ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30 ring-2 ring-amber-400' 
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400'}">
                        <span class="w-2 h-2 rounded-full ${currentTournamentId === finalId5 ? 'bg-slate-950' : 'bg-amber-400'}"></span>
                        3ª Fecha · 5 Sept
                    </button>
                    ${fecha4HasScores ? `
                        <button onclick="openLiveLeaderboardModal('${finalId26}')"
                            class="px-3 py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0
                            ${currentTournamentId === finalId26
                                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400'
                                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-400'}">
                            <span class="w-2 h-2 rounded-full ${currentTournamentId === finalId26 ? 'bg-slate-950' : 'bg-emerald-400 animate-pulse'}"></span>
                            4ª Fecha · 26 Sept
                        </button>
                    ` : ''}
                </div>
                ` : ''}

                <!-- View Switcher Tabs -->
                <div class="flex p-1 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-inner mt-1 gap-1">
                    <button onclick="switchLiveModalView('posiciones')" id="modal-tab-posiciones"
                        class="flex-1 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 ${isFinished ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'}">
                        🏆 Leaderboard
                    </button>
                    ${isRankingTour ? `
                        <button onclick="switchLiveModalView('ranking-acumulado')" id="modal-tab-ranking-acumulado"
                            class="flex-1 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 text-slate-400 hover:text-white flex items-center justify-center gap-1">
                            <span class="material-icons text-xs sm:text-sm text-amber-400">emoji_events</span>
                            <span>Ranking Acumulado</span>
                        </button>
                    ` : ''}
                    <button onclick="switchLiveModalView('salidas')" id="modal-tab-salidas"
                        class="flex-1 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 text-slate-400 hover:text-white">
                        🚩 Salidas
                    </button>
                    <button onclick="switchLiveModalView('oyeses')" id="modal-tab-oyeses"
                        class="flex-1 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 text-slate-400 hover:text-white">
                        🎯 Oye's
                    </button>
                </div>
            </div>

            <!-- 2. SCROLLABLE CONTENT BODY -->
            <div id="live-modal-content-area" class="relative z-10 flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar space-y-6">
                <div class="flex flex-col items-center justify-center py-24 gap-4">
                    <div class="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p class="text-xs font-black text-slate-400 uppercase tracking-widest">Cargando Resultados en Vivo...</p>
                </div>
            </div>

            <!-- 3. FOOTER INFO -->
            <div class="relative z-10 px-6 py-3 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <div class="flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Colima Golf Club &middot; En Vivo</span>
                </div>
                <a href="${window.location.origin}/torneo/?id=${currentTournamentId}" target="_blank" class="hover:text-emerald-400 transition-colors flex items-center gap-1 text-[9px]">
                    <span>Abrir en pestaña completa</span>
                    <span class="material-icons text-[12px]">open_in_new</span>
                </a>
            </div>
        </div>
    `;

    // Trigger smooth fade in & scale transition
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
        const content = document.getElementById('live-modal-content');
        if (content) {
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
        }
    }, 10);

    // Attach Escape Key Listener
    window.addEventListener('keydown', handleEscapeKey);

    // Fetch data and subscribe
    await loadLiveModalData();
    subscribeToLiveModalUpdates();
}

function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        const scorecardModal = document.getElementById('live-scorecard-modal');
        if (scorecardModal) {
            closeLiveScorecard();
        } else {
            closeLiveLeaderboardModal();
        }
    }
}

export function closeLiveLeaderboardModal() {
    const modal = document.getElementById('live-leaderboard-modal');
    if (!modal) return;

    // Unsubscribe from Realtime
    unsubscribeFromLiveModalUpdates();
    window.removeEventListener('keydown', handleEscapeKey);

    const content = document.getElementById('live-modal-content');
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

async function loadLiveModalData() {
    if (currentTournamentId === '5-sept-pending') {
        tournamentData = {
            id: '5-sept-pending',
            name: '3ª FECHA · 5 DE SEPTIEMBRE',
            courses: 'Club de Golf Colima',
            config: {
                categories: [
                    { name: 'CATEGORIA A', pct: 80 },
                    { name: 'CATEGORIA B', pct: 80 },
                    { name: 'CATEGORIA C', pct: 80 }
                ]
            }
        };
        cachedTeams = [];
        cachedScores = [];
        cachedOyeses = [];
        currentView = 'posiciones';

        const nameEl = document.getElementById('live-modal-tournament-name');
        const locEl = document.getElementById('live-modal-location');
        if (nameEl) nameEl.textContent = '3ª FECHA · 5 DE SEPTIEMBRE';
        if (locEl) locEl.innerHTML = `<span class="material-icons text-[12px] text-emerald-400">location_on</span> <span>Club de Golf Colima</span>`;

        ['posiciones', 'salidas', 'oyeses'].forEach(tab => {
            const btn = document.getElementById(`modal-tab-${tab}`);
            if (!btn) return;
            if (tab === currentView) {
                btn.className = 'flex-1 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20';
            } else {
                btn.className = 'flex-1 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 text-slate-400 hover:text-white';
            }
        });

        renderLiveModalCurrentView();
        return;
    }

    try {
        const [tRes, teamsRes, scoresRes, oyesesRes] = await Promise.all([
            liveDb.from('tournaments').select('*').eq('id', currentTournamentId).single(),
            liveDb.from('teams').select('*').eq('eventid', String(currentTournamentId)),
            liveDb.from('scores').select('*').eq('eventid', String(currentTournamentId)),
            liveDb.from('oyeses').select('*').eq('eventid', String(currentTournamentId))
        ]);

        if (tRes.data) {
            tournamentData = tRes.data;
            const nameEl = document.getElementById('live-modal-tournament-name');
            const locEl = document.getElementById('live-modal-location');
            if (nameEl) nameEl.textContent = tournamentData.name || 'TORNEO DE GOLF';
            if (locEl) locEl.innerHTML = `<span class="material-icons text-[12px] text-emerald-400">location_on</span> <span>${tournamentData.courses || 'Club de Golf Colima'}</span>`;
        }

        cachedTeams = teamsRes.data || [];
        cachedScores = scoresRes.data || [];
        cachedOyeses = oyesesRes.data || [];

        // Automatic smart view selection:
        // If there are no scores yet but there are registered teams, default to 'salidas'!
        // If there are scores (or finished tournament), default to 'posiciones' (Leaderboard).
        if (cachedScores.length === 0 && cachedTeams.length > 0) {
            currentView = 'salidas';
        } else {
            currentView = 'posiciones';
        }

        // Apply active tab styling based on currentView and tournament status
        const is8Ago = tournamentData?.name?.toLowerCase().includes('8') && tournamentData?.name?.toLowerCase().includes('agosto');
        const activeColorClass = is8Ago 
            ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' 
            : 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20';

        ['posiciones', 'salidas', 'oyeses'].forEach(tab => {
            const btn = document.getElementById(`modal-tab-${tab}`);
            if (!btn) return;
            if (tab === currentView) {
                btn.className = `flex-1 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 ${activeColorClass}`;
            } else {
                btn.className = 'flex-1 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 text-slate-400 hover:text-white';
            }
        });

        renderLiveModalCurrentView();
    } catch (err) {
        console.error('Error loading live tournament data:', err);
        const container = document.getElementById('live-modal-content-area');
        if (container) {
            container.innerHTML = `
                <div class="py-20 text-center space-y-3">
                    <span class="material-icons text-red-400 text-4xl">error_outline</span>
                    <p class="text-red-400 text-xs font-black uppercase">No se pudieron cargar los datos del torneo.</p>
                    <button onclick="openLiveLeaderboardModal('${currentTournamentId}')" class="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider">Reintentar</button>
                </div>
            `;
        }
    }
}

export function switchLiveModalView(view) {
    currentView = view;
    
    const is8Ago = tournamentData?.name?.toLowerCase().includes('8') && tournamentData?.name?.toLowerCase().includes('agosto');
    const activeColorClass = is8Ago 
        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black' 
        : 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black';

    // Update tab styling
    ['posiciones', 'ranking-acumulado', 'salidas', 'oyeses'].forEach(tab => {
        const btn = document.getElementById(`modal-tab-${tab}`);
        if (!btn) return;
        if (tab === view) {
            btn.className = `flex-1 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 ${tab === 'ranking-acumulado' ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20' : activeColorClass}`;
        } else {
            btn.className = 'flex-1 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 text-slate-400 hover:text-white';
        }
    });

    renderLiveModalCurrentView();
}

function renderLiveModalCurrentView() {
    const container = document.getElementById('live-modal-content-area');
    if (!container) return;

    if (currentView === 'posiciones') {
        renderLeaderboardView(container);
    } else if (currentView === 'ranking-acumulado') {
        renderRankingModalContent('live-modal-content-area');
    } else if (currentView === 'salidas') {
        renderSalidasView(container);
    } else if (currentView === 'oyeses') {
        renderOyesesView(container);
    }
}

function renderLeaderboardView(container) {
    const teams = cachedTeams || [];
    const scores = cachedScores || [];

    const totalDays = Math.max(1, parseInt(tournamentData?.config?.totalDays || 1));
    if (!window._liveModalDayFilter || (totalDays === 1)) {
        window._liveModalDayFilter = 'all';
    }
    const dayFilter = window._liveModalDayFilter;

    window.setLiveModalDayFilter = (val) => {
        window._liveModalDayFilter = val;
        renderLeaderboardView(container);
    };

    if (scores.length === 0) {
        container.innerHTML = `
            <div class="py-24 text-center space-y-4 max-w-md mx-auto">
                <div class="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                    <span class="material-icons text-3xl">emoji_events</span>
                </div>
                <div class="space-y-2">
                    <h4 class="text-base font-black uppercase tracking-tight text-white">Esperando Registro de Scores</h4>
                    <p class="text-xs text-slate-400 leading-relaxed font-medium">
                        ${teams.length > 0 
                            ? 'Los jugadores y salidas ya están registrados. En cuanto comiencen a capturarse los scores hoyo por hoyo, el leaderboard se actualizará automáticamente en tiempo real.' 
                            : `El torneo "${tournamentData?.name || 'Torneo'}" se encuentra en preparación. En cuanto se creen los registros y se capturen los primeros scores, la tabla de posiciones aparecerá aquí en tiempo real.`}
                    </p>
                </div>
            </div>`;
        return;
    }

    const categories = {};
    teams.forEach(t => {
        const cat = (t.category || 'GENERAL').replace(/\s+/g, ' ').trim();
        const teamScores = scores.filter(s => String(s.teamid) === String(t.id));
        if (teamScores.length === 0) return;

        const byDay = {};
        teamScores.forEach(s => {
            const d = totalDays > 1 ? getScoreDay(s) : 1;
            if (!byDay[d]) byDay[d] = s;
        });

        const advantagePerDay = t.ventaja || 0;
        const isStb = isCategoryStableford(cat, tournamentData?.config);

        if (dayFilter !== 'all') {
            const targetDay = parseInt(dayFilter);
            const dayScore = byDay[targetDay];
            if (!dayScore) return;
            const gross = dayScore.gross || dayScore.total || 0;
            const neto = gross - advantagePerDay;
            const pts  = calcCardStablefordPoints(dayScore.hole_scores, gross, advantagePerDay);
            const tbCard = getTiebreakScoreInfo(dayScore);

            if (!categories[cat]) categories[cat] = [];
            categories[cat].push({
                team: t,
                total: gross,
                gross,
                neto,
                pts,
                isStableford: isStb,
                advantage: advantagePerDay,
                advantagePerDay,
                rounds: 1,
                byDay: { [targetDay]: dayScore },
                scoreObj: dayScore,
                dayCardsDesc: [tbCard],
                _tiebreak: tbCard
            });
        } else {
            const playedDaysNums = Object.keys(byDay).map(Number).sort((a, b) => a - b);
            if (playedDaysNums.length === 0) return;

            let grossTotal = 0;
            let ptsTotal = 0;
            playedDaysNums.forEach(d => {
                const g = byDay[d].gross || byDay[d].total || 0;
                grossTotal += g;
                ptsTotal += calcCardStablefordPoints(byDay[d].hole_scores, g, advantagePerDay);
            });
            const roundsCount = playedDaysNums.length;
            const advantageTotal = advantagePerDay * roundsCount;
            const netoTotal = grossTotal - advantageTotal;
            const dayCardsDesc = [...playedDaysNums].sort((a, b) => b - a).map(d => getTiebreakScoreInfo(byDay[d]));
            const latest = byDay[playedDaysNums[playedDaysNums.length - 1]];

            if (!categories[cat]) categories[cat] = [];
            categories[cat].push({
                team: t,
                total: grossTotal,
                gross: grossTotal,
                neto: netoTotal,
                pts: ptsTotal,
                isStableford: isStb,
                advantage: advantageTotal,
                advantagePerDay,
                rounds: roundsCount,
                byDay,
                scoreObj: latest,
                dayCardsDesc,
                _tiebreak: dayCardsDesc[0]
            });
        }
    });

    const dayFilterBarHtml = totalDays > 1 ? `
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 mb-6 flex flex-wrap items-center justify-between gap-2.5">
            <div class="flex items-center gap-2">
                <span class="material-icons text-amber-400" style="font-size:18px">calendar_month</span>
                <span class="text-[11px] font-black uppercase text-white tracking-wider">Leaderboard:</span>
            </div>
            <div class="flex flex-wrap items-center gap-1.5">
                <button type="button" onclick="setLiveModalDayFilter('all')"
                    class="px-3.5 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer border
                    ${dayFilter === 'all'
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/20'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}">
                    🏆 Acumulado (${totalDays} Días)
                </button>
                ${Array.from({ length: totalDays }, (_, idx) => {
                    const dNum = idx + 1;
                    const lbl = getDayLabel(dNum);
                    const isAct = String(dayFilter) === String(dNum);
                    return `
                    <button type="button" onclick="setLiveModalDayFilter(${dNum})"
                        class="px-3 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer border
                        ${isAct
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}">
                        📅 ${lbl}
                    </button>`;
                }).join('')}
            </div>
        </div>
    ` : '';

    const sortedCats = Object.keys(categories).sort();
    if (sortedCats.length === 0) {
        container.innerHTML = `
            ${dayFilterBarHtml}
            <div class="py-24 text-center space-y-3">
                <span class="material-icons text-slate-600 text-5xl">emoji_events</span>
                <p class="text-xs font-black uppercase tracking-widest text-slate-400">Sin scores registrados para esta selección</p>
            </div>`;
        return;
    }

    container.innerHTML = dayFilterBarHtml + sortedCats.map(catName => {
        const sortedItems = categories[catName].sort(compareGolfTiebreaker);
        const isFirstCat = isFirstAbsoluteCategory(catName, sortedCats);
        const isCatStb = isCategoryStableford(catName, tournamentData?.config);

        for (let i = 0; i < sortedItems.length; i++) {
            const cur = sortedItems[i];
            const next = i < sortedItems.length - 1 ? sortedItems[i + 1] : null;
            const tiedWithNext = next && next.rounds === cur.rounds && (isCatStb ? next.pts === cur.pts : next.neto === cur.neto);
            if (i === 0 && tiedWithNext && isFirstCat) {
                cur._suddenDeath1st = true;
                next._suddenDeath1st = true;
            }
            if (i < 3 && next && tiedWithNext) {
                const cardsA = cur.dayCardsDesc || [cur._tiebreak];
                const cardsB = next.dayCardsDesc || [next._tiebreak];
                const maxL = Math.max(cardsA.length, cardsB.length);
                for (let k = 0; k < maxL; k++) {
                    const suffix = maxL > 1 ? ` · D${cardsA[k]?.day || (maxL - k)}` : '';
                    const r = evaluateCardTiebreak(cardsA[k], cardsB[k], cur.advantagePerDay, next.advantagePerDay, suffix, isCatStb);
                    if (r.diff !== 0 && r.reason) {
                        cur._resolvedBy = r.reason;
                        break;
                    }
                }
            }
        }

        return `
        <div class="space-y-4 mb-8">
            <div class="flex items-center gap-3 px-1">
                <div class="w-1.5 h-6 ${isCatStb ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)]' : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)]'} rounded-full"></div>
                <h3 class="text-lg sm:text-xl font-black uppercase tracking-tight text-white">${catName}</h3>
                ${isCatStb ? `<span class="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[9px] font-black uppercase">⭐ Stableford (Puntos)</span>` : ''}
                <span class="text-[10px] font-bold text-slate-500 uppercase ml-auto">${sortedItems.length} JUGADORES</span>
            </div>

            <div class="bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
                <div class="overflow-x-auto custom-scrollbar">
                    <table class="w-full text-left min-w-[520px] sm:min-w-full">
                        <thead>
                            <tr class="bg-slate-950/70 text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-800">
                                <th class="px-3 sm:px-5 py-4 w-12 sm:w-16 text-center">POS</th>
                                <th class="px-3 sm:px-5 py-4">EQUIPO / JUGADOR</th>
                                <th class="px-2 sm:px-4 py-4 text-center">RDS</th>
                                ${totalDays > 1 && dayFilter === 'all' ? Array.from({ length: totalDays }, (_, dIdx) => `
                                    <th class="px-2 sm:px-3 py-4 text-center ${isCatStb ? 'text-amber-400/80' : 'text-emerald-400/80'}">D${dIdx + 1}</th>
                                `).join('') : ''}
                                <th class="px-2 sm:px-4 py-4 text-center">VTJ</th>
                                <th class="px-2 sm:px-4 py-4 text-center">GROSS</th>
                                <th class="px-3 sm:px-5 py-4 text-center ${isCatStb ? 'bg-amber-500/10 text-amber-300' : 'bg-emerald-500/10 text-emerald-400'}">${isCatStb ? 'PUNTOS' : 'NETO'}</th>
                                <th class="px-2 sm:px-4 py-4 text-center w-14">INFO</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60">
                            ${sortedItems.map((item, idx) => {
                                const ventajaDisplay = item.advantage === 0 ? '0' : `-${Math.abs(item.advantage)}`;
                                const isLeader = idx === 0;
                                return `
                                <tr class="hover:bg-white/[0.02] transition-colors">
                                    <td class="px-3 sm:px-5 py-3.5 sm:py-4 text-center">
                                        <span class="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl font-black text-xs sm:text-sm mx-auto ${isLeader ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20' : 'bg-slate-800 text-white'}">
                                            #${idx + 1}
                                        </span>
                                    </td>
                                    <td class="px-3 sm:px-5 py-3.5 sm:py-4">
                                        <div class="flex items-center gap-1.5 flex-wrap">
                                            <p class="font-black text-xs sm:text-sm uppercase text-white truncate max-w-[140px] sm:max-w-none">${item.team.teamname || 'JUGADOR'}</p>
                                            ${item._suddenDeath1st ? `<span class="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[8px] font-black uppercase">⚡ Muerte Súbita</span>` : ''}
                                            ${!item._suddenDeath1st && item._resolvedBy && idx < 3 ? `<span class="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[8px] font-black uppercase">✓ ${item._resolvedBy}</span>` : ''}
                                        </div>
                                    </td>
                                    <td class="px-2 sm:px-4 py-3.5 sm:py-4 text-center text-slate-300 font-bold text-xs sm:text-sm">${item.rounds}${totalDays > 1 && dayFilter === 'all' ? `/${totalDays}` : ''}</td>
                                    ${totalDays > 1 && dayFilter === 'all' ? Array.from({ length: totalDays }, (_, dIdx) => {
                                        const sc = item.byDay && item.byDay[dIdx + 1];
                                        const g = sc ? (sc.gross || sc.total || 0) : null;
                                        const dayPts = (sc && isCatStb) ? calcCardStablefordPoints(sc.hole_scores, g, item.advantagePerDay) : null;
                                        return `<td class="px-2 sm:px-3 py-3.5 sm:py-4 text-center font-black text-xs ${g !== null ? 'text-white' : 'text-slate-600'}">${g !== null ? (isCatStb ? `${dayPts}p` : g) : '—'}</td>`;
                                    }).join('') : ''}
                                    <td class="px-2 sm:px-4 py-3.5 sm:py-4 text-center text-blue-400 font-bold text-xs sm:text-sm">${ventajaDisplay}</td>
                                    <td class="px-2 sm:px-4 py-3.5 sm:py-4 text-center text-slate-200 font-bold text-xs sm:text-sm">${item.gross}</td>
                                    <td class="px-3 sm:px-5 py-3.5 sm:py-4 text-center ${isCatStb ? 'bg-amber-500/10' : 'bg-emerald-500/10'}">
                                        <span class="text-base sm:text-lg font-black ${isCatStb ? 'text-amber-300' : 'text-emerald-400'}">${isCatStb ? item.pts : item.neto}</span>
                                    </td>
                                    <td class="px-2 sm:px-4 py-3.5 sm:py-4 text-center">
                                        <button onclick="showLiveScorecard('${item.team.id}', '${(item.team.teamname || '').replace(/'/g, "\\'")}')" 
                                            class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-400 flex items-center justify-center mx-auto transition-all cursor-pointer" title="Ver Tarjeta de Score">
                                            <span class="material-icons text-sm">visibility</span>
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
        `;
    }).join('');
}

function renderSalidasView(container) {
    const teams = cachedTeams || [];

    if (teams.length === 0) {
        container.innerHTML = `
            <div class="py-24 text-center space-y-3">
                <span class="material-icons text-slate-600 text-5xl">golf_course</span>
                <p class="text-xs font-black uppercase tracking-widest text-slate-400">No hay salidas programadas.</p>
            </div>`;
        return;
    }

    const holeGroups = {};
    teams.forEach(t => {
        const h = (t.hole !== null && t.hole !== undefined && t.hole !== '') ? t.hole : (t.starting_hole || 'SIN HOYO');
        if (!holeGroups[h]) holeGroups[h] = [];
        holeGroups[h].push(t);
    });

    const sortedHoles = Object.keys(holeGroups).sort((a, b) => (parseInt(a) || 99) - (parseInt(b) || 99));

    container.innerHTML = `
        <div class="grid gap-6 pb-6">
            ${sortedHoles.map(hole => `
                <div class="bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
                    <div class="bg-slate-950/80 px-6 py-4 flex items-center justify-between border-b border-slate-800">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                <span class="material-icons text-sm">flag</span>
                            </div>
                            <h3 class="text-base sm:text-lg font-black uppercase text-white tracking-tight">
                                ${isNaN(parseInt(hole)) ? hole : `Hoyo ${hole}`}
                            </h3>
                        </div>
                        <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest">${holeGroups[hole].length} EQUIPOS</span>
                    </div>

                    <div class="p-4 sm:p-6 grid gap-4 grid-cols-1 md:grid-cols-2">
                        ${holeGroups[hole].map(t => {
                            const players = t.players && Array.isArray(t.players)
                                ? t.players.map(p => `${p.name} <strong class="text-white">(${p.hdcp || 0})</strong>`)
                                : [t.player1, t.player2, t.player3, t.player4].filter(p => p && p.trim() !== '');
                            return `
                                <div class="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div class="min-w-0 w-full flex-1">
                                        <p class="text-[8px] font-black text-slate-500 uppercase mb-0.5">Equipo #${t.teamnumber || '?'}</p>
                                        <h4 class="font-black text-xs sm:text-sm uppercase text-white truncate mb-2 leading-tight">${t.teamname || 'EQUIPO'}</h4>
                                        <div class="grid grid-cols-2 gap-x-2 gap-y-1">
                                            ${players.map(p => `<div class="text-[9px] font-bold text-slate-400 uppercase truncate">${p}</div>`).join('')}
                                        </div>
                                    </div>
                                    <div class="shrink-0 flex items-center gap-2">
                                        <div class="flex flex-col items-center px-3 py-1.5 bg-slate-800 rounded-xl border border-slate-700 min-w-[45px]">
                                            <span class="text-[7px] font-black text-slate-400 uppercase">HCP</span>
                                            <span class="text-xs font-black text-white leading-none mt-0.5">${t.hdcp || 0}</span>
                                        </div>
                                        <div class="flex flex-col items-center px-3 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/30 min-w-[45px]">
                                            <span class="text-[7px] font-black text-emerald-400 uppercase">VTJ</span>
                                            <span class="text-xs font-black text-emerald-400 leading-none mt-0.5">${t.ventaja || 0}</span>
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

function renderOyesesView(container) {
    const oyeses = cachedOyeses || [];

    if (oyeses.length === 0) {
        container.innerHTML = `
            <div class="py-24 text-center space-y-3">
                <span class="material-icons text-slate-600 text-5xl">military_tech</span>
                <p class="text-xs font-black uppercase tracking-widest text-slate-400">No hay registros de Oye's.</p>
                <p class="text-[11px] text-slate-500">Los tiros más cercanos a la bandera se publicarán aquí.</p>
            </div>`;
        return;
    }

    const grouped = {};
    oyeses.forEach(o => {
        const h = o.hole || '?';
        if (!grouped[h]) grouped[h] = [];
        grouped[h].push(o);
    });

    const sortedHoles = Object.keys(grouped).sort((a, b) => (parseInt(a) || 99) - (parseInt(b) || 99));

    container.innerHTML = `
        <div class="space-y-8 pb-6">
            <div class="text-center space-y-1">
                <h3 class="text-xl font-black uppercase tracking-tight text-white">Premios Oye's a la Bandera</h3>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Tiro más cercano al hoyo</p>
            </div>

            ${sortedHoles.map(hole => {
                const players = grouped[hole].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
                return `
                <div class="space-y-3">
                    <div class="flex items-center gap-3">
                        <div class="h-px flex-1 bg-slate-800"></div>
                        <span class="text-xs font-black uppercase tracking-[0.25em] px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                            🚩 Hoyo ${hole}
                        </span>
                        <div class="h-px flex-1 bg-slate-800"></div>
                    </div>

                    <div class="grid gap-2.5">
                        ${players.map((p, idx) => `
                            <div class="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border ${idx === 0 ? 'border-amber-500/40 bg-amber-500/5 shadow-lg shadow-amber-500/5' : 'border-slate-800'}">
                                <div class="flex items-center gap-3 min-w-0 flex-1">
                                    <div class="w-8 h-8 rounded-xl ${idx === 0 ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'} flex items-center justify-center font-black text-xs shrink-0">
                                        ${idx === 0 ? '🥇' : idx + 1}
                                    </div>
                                    <h4 class="text-xs sm:text-sm font-black uppercase text-white truncate">${p.player_name || p.playername}</h4>
                                </div>
                                <div class="px-3.5 py-1.5 rounded-xl bg-slate-950 font-black text-emerald-400 text-xs shrink-0 border border-slate-800">
                                    ${p.distance}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
            }).join('')}
        </div>
    `;
}

export function showLiveScorecard(teamId, teamName) {
    let modal = document.getElementById('live-scorecard-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'live-scorecard-modal';
        modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl animate-fade-in';
        document.body.appendChild(modal);
    }

    const teamScores = (cachedScores || []).filter(s => String(s.teamid) === String(teamId));
    const teamObj = (cachedTeams || []).find(t => String(t.id) === String(teamId));
    const ventaja = teamObj?.ventaja || 0;

    if (!teamScores || teamScores.length === 0) {
        modal.innerHTML = `
            <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center max-w-sm w-full space-y-4 shadow-2xl">
                <span class="material-icons text-amber-400 text-4xl">info</span>
                <h3 class="font-black text-white uppercase text-sm">Sin Scorecard</h3>
                <p class="text-slate-400 text-xs font-bold">No hay tarjetas registradas para ${teamName}.</p>
                <button onclick="closeLiveScorecard()" class="px-6 py-2.5 bg-emerald-500 text-slate-950 rounded-xl font-black text-xs uppercase cursor-pointer">Cerrar</button>
            </div>`;
        return;
    }

    const sortedTeamScores = [...teamScores].sort((a, b) => getScoreDay(a) - getScoreDay(b));
    const totalDays = Math.max(1, parseInt(tournamentData?.config?.totalDays || 1));

    const contentHtml = sortedTeamScores.map((s) => {
        let holeScoresObj = {};
        if (s.hole_scores) {
            try {
                holeScoresObj = typeof s.hole_scores === 'string' ? JSON.parse(s.hole_scores) : s.hole_scores;
            } catch (e) { holeScoresObj = {}; }
        }

        const dayNum = getScoreDay(s);
        const headerLabel = totalDays > 1 ? getDayLabel(dayNum) : (s.coursename || 'CLUB DE GOLF COLIMA');

        const inSum  = s.in_score  !== undefined && s.in_score  !== null ? s.in_score  : (s.in  || 0);
        const outSum = s.out_score !== undefined && s.out_score !== null ? s.out_score : (s.out || 0);
        const gross  = s.gross || s.total || 0;
        const net    = s.net   !== undefined && s.net   !== null ? s.net : (gross > 0 ? (gross - ventaja) : 0);

        const holesArray = [];
        for (let i = 1; i <= 18; i++) {
            holesArray.push(holeScoresObj[`h${i}`] !== undefined ? holeScoresObj[`h${i}`] : '-');
        }

        return `
            <div class="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden mb-5">
                <div class="bg-emerald-500 px-5 py-3 flex justify-between items-center text-slate-950">
                    <h4 class="font-black uppercase text-[10px] sm:text-xs tracking-widest">${headerLabel}</h4>
                    <div class="flex items-center gap-2">
                        <span class="text-[9px] font-black uppercase bg-slate-950/20 px-2.5 py-1 rounded-full">Gross: ${gross}</span>
                        <span class="text-[9px] font-black uppercase bg-slate-950/40 text-blue-300 px-2.5 py-1 rounded-full">VTJ: −${ventaja}</span>
                        <span class="text-[10px] font-black uppercase bg-slate-950 text-emerald-400 px-2.5 py-1 rounded-full">Neto: ${net}</span>
                    </div>
                </div>
                <div class="p-4 sm:p-6">
                    <p class="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2">VUELTA 1-9 (IN)</p>
                    <div class="grid grid-cols-9 gap-1 sm:gap-1.5 mb-4">
                        ${holesArray.slice(0, 9).map((val, i) => `
                            <div class="flex flex-col items-center">
                                <span class="text-[8px] text-slate-500 font-bold mb-0.5">#${i + 1}</span>
                                <div class="w-full py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-center font-black text-[11px] sm:text-xs text-white">${val}</div>
                            </div>
                        `).join('')}
                    </div>

                    <p class="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2">VUELTA 10-18 (OUT)</p>
                    <div class="grid grid-cols-9 gap-1 sm:gap-1.5 mb-5">
                        ${holesArray.slice(9, 18).map((val, i) => `
                            <div class="flex flex-col items-center">
                                <span class="text-[8px] text-slate-500 font-bold mb-0.5">#${i + 10}</span>
                                <div class="w-full py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-center font-black text-[11px] sm:text-xs text-white">${val}</div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="flex justify-between items-center pt-3 border-t border-slate-800">
                        <div class="flex gap-2">
                            <div class="text-center px-3 py-1 bg-slate-800 rounded-xl">
                                <p class="text-[7px] text-slate-400 font-black">IN (1-9)</p>
                                <p class="font-black text-white text-xs sm:text-sm">${inSum}</p>
                            </div>
                            <div class="text-center px-3 py-1 bg-slate-800 rounded-xl">
                                <p class="text-[7px] text-slate-400 font-black">OUT (10-18)</p>
                                <p class="font-black text-white text-xs sm:text-sm">${outSum}</p>
                            </div>
                            <div class="text-center px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                                <p class="text-[7px] text-blue-400 font-black">VENTAJA</p>
                                <p class="font-black text-blue-400 text-xs sm:text-sm">−${ventaja}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-[7px] text-slate-400 font-black uppercase">TOTAL NETO</p>
                            <p class="text-xl sm:text-2xl font-black text-emerald-400">${net}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    modal.innerHTML = `
        <div class="w-full max-w-2xl bg-slate-950/95 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div class="p-4 sm:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <span class="material-icons">sports_golf</span>
                    </div>
                    <div>
                        <h3 class="font-black uppercase text-white text-sm sm:text-base truncate">${teamName}</h3>
                        <p class="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Tarjeta Oficial de Score</p>
                    </div>
                </div>
                <button onclick="closeLiveScorecard()" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer">
                    <span class="material-icons text-sm">close</span>
                </button>
            </div>
            <div class="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3">${contentHtml}</div>
        </div>
    `;
}

export function closeLiveScorecard() {
    const modal = document.getElementById('live-scorecard-modal');
    if (modal) modal.remove();
}

function subscribeToLiveModalUpdates() {
    if (!liveSupabaseClient || !currentTournamentId || currentTournamentId === '5-sept-pending') return;

    try {
        if (realtimeChannel) {
            liveSupabaseClient.removeChannel(realtimeChannel);
        }

        realtimeChannel = liveSupabaseClient.channel(`live-modal-${currentTournamentId}`)
            .on('postgres_changes', { event: '*', schema: 'colimaGC', table: 'scores', filter: `eventid=eq.${currentTournamentId}` }, async () => {
                const { data } = await liveDb.from('scores').select('*').eq('eventid', String(currentTournamentId));
                if (data) cachedScores = data;
                renderLiveModalCurrentView();
            })
            .on('postgres_changes', { event: '*', schema: 'colimaGC', table: 'oyeses', filter: `eventid=eq.${currentTournamentId}` }, async () => {
                const { data } = await liveDb.from('oyeses').select('*').eq('eventid', String(currentTournamentId));
                if (data) cachedOyeses = data;
                renderLiveModalCurrentView();
            })
            .on('postgres_changes', { event: '*', schema: 'colimaGC', table: 'teams', filter: `eventid=eq.${currentTournamentId}` }, async () => {
                const { data } = await liveDb.from('teams').select('*').eq('eventid', String(currentTournamentId));
                if (data) cachedTeams = data;
                renderLiveModalCurrentView();
            })
            .subscribe();
    } catch (e) {
        console.warn('Realtime subscription delayed:', e);
    }
}

function unsubscribeFromLiveModalUpdates() {
    if (realtimeChannel && liveSupabaseClient) {
        try {
            liveSupabaseClient.removeChannel(realtimeChannel);
            realtimeChannel = null;
        } catch (e) {
            console.warn(e);
        }
    }
}

export function shareLiveLeaderboard() {
    const url = `${window.location.origin}/torneo/?id=${currentTournamentId}`;
    if (navigator.share) {
        navigator.share({
            title: tournamentData?.name || 'Leaderboard en Vivo · Club de Golf Colima',
            text: `Sigue los resultados en vivo del torneo ${tournamentData?.name || ''} en Club de Golf Colima:`,
            url: url
        }).catch(() => {});
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            alert('¡Enlace del Leaderboard copiado al portapapeles!');
        });
    }
}

export function printLiveModal() {
    if (!tournamentData) return;
    const url = `${window.location.origin}/torneo/?id=${currentTournamentId}&view=${currentView}`;
    window.open(url, '_blank');
}
