import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tztolxgsaktqindoimtu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dG9seGdzYWt0cWluZG9pbXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzQ4ODAsImV4cCI6MjEwMTg1MDg4MH0.E2GABiOMXYb5hEwE9ErIcJa6_LHkj9lJUglQVoiLl0M';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
const db = supabaseClient.schema('colimaGC');

let currentTournamentId = null;
let currentView = 'posiciones';
let tournamentData = null;

// Cache data in memory for 0ms mobile tab switching
let cachedTeams = null;
let cachedScores = null;
let cachedOyeses = null;

// Hole data for Club de Golf Colima for tiebreaker difficulty order
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
        } catch(e) { hs = {}; }
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

// Attach functions to window for HTML onclick events
window.switchView = function(view) {
    currentView = view;
    updateUI();
    renderCurrentViewFromCache();
};

window.printView = async function() {
    if (!tournamentData) return;

    const printWindow = window.open('', '_blank');
    const tournamentName = tournamentData.name;
    const location = tournamentData.courses || tournamentData.course || '';

    let reportTitle = '';
    let contentHtml = '';

    const PRINT_CAT_THEMES = [
        { bg: 'linear-gradient(135deg, #059669, #10b981)', color: '#ffffff' },
        { bg: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', color: '#ffffff' },
        { bg: 'linear-gradient(135deg, #6d28d9, #8b5cf6)', color: '#ffffff' },
        { bg: 'linear-gradient(135deg, #b45309, #f59e0b)', color: '#ffffff' },
        { bg: 'linear-gradient(135deg, #be123c, #f43f5e)', color: '#ffffff' },
        { bg: 'linear-gradient(135deg, #0e7490, #06b6d4)', color: '#ffffff' },
    ];

    if (currentView === 'posiciones') {
        const totalDays = Math.max(1, parseInt(tournamentData?.config?.totalDays || 1));
        const dayFilter = window._visorDayFilter || 'all';
        reportTitle = totalDays > 1
            ? (dayFilter === 'all' ? `LEADERBOARD ACUMULADO (${totalDays} DÍAS)` : `LEADERBOARD · ${getDayLabel(parseInt(dayFilter))}`)
            : 'LEADERBOARD EN VIVO';
        const teams = cachedTeams || [];
        const scores = cachedScores || [];

        const categories = {};
        teams.forEach(t => {
            const cat = t.category || 'GENERAL';
            const teamScores = scores.filter(s => String(s.teamid) === String(t.id));
            if (teamScores.length === 0) return;

            const byDay = {};
            teamScores.forEach(s => {
                const d = totalDays > 1 ? getScoreDay(s) : 1;
                if (!byDay[d]) byDay[d] = s;
            });

            const advantagePerDay = t.ventaja || 0;

            if (dayFilter !== 'all') {
                const targetDay = parseInt(dayFilter);
                const dayScore = byDay[targetDay];
                if (!dayScore) return;
                const gross = dayScore.gross || dayScore.total || 0;
                const neto = gross - advantagePerDay;
                const tbCard = getTiebreakScoreInfo(dayScore);
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push({
                    team: t,
                    total: gross,
                    gross,
                    neto,
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
                playedDaysNums.forEach(d => { grossTotal += (byDay[d].gross || byDay[d].total || 0); });
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
                            <th style="padding: 12px; text-align: center; width: 55px; font-weight: 800; font-size: 10px; color: #64748b;">POS</th>
                            <th style="padding: 12px; text-align: left; font-weight: 800; font-size: 10px; color: #64748b;">PARTICIPANTE / EQUIPO</th>
                            <th style="padding: 12px; text-align: center; width: 45px; font-weight: 800; font-size: 10px; color: #64748b;">RDS</th>
                            ${totalDays > 1 && dayFilter === 'all' ? Array.from({ length: totalDays }, (_, dIdx) => `
                                <th style="padding: 12px; text-align: center; width: 45px; font-weight: 800; font-size: 10px; color: #059669;">D${dIdx + 1}</th>
                            `).join('') : ''}
                            <th style="padding: 12px; text-align: center; width: 65px; font-weight: 800; font-size: 10px; color: #64748b;">VENTAJA</th>
                            <th style="padding: 12px; text-align: center; width: 65px; font-weight: 800; font-size: 10px; color: #64748b;">GROSS</th>
                            <th style="padding: 12px; text-align: center; width: 85px; background: #f1f5f9; font-weight: 800; font-size: 10px; color: #047857;">NETO</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${categories[cat].sort(compareGolfTiebreaker).map((item, idx) => {
                            const ventajaDisplay = item.advantage === 0 ? '0' : `-${Math.abs(item.advantage)}`;
                            return `
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 12px; text-align: center; font-weight: 800; color: #334155;">#${idx + 1}</td>
                                <td style="padding: 12px; font-weight: 700; text-transform: uppercase; font-size: 12px; color: #0f172a;">${item.team.teamname}</td>
                                <td style="padding: 12px; text-align: center; color: #64748b; font-weight: 600;">${item.rounds}${totalDays > 1 && dayFilter === 'all' ? `/${totalDays}` : ''}</td>
                                ${totalDays > 1 && dayFilter === 'all' ? Array.from({ length: totalDays }, (_, dIdx) => {
                                    const sc = item.byDay && item.byDay[dIdx + 1];
                                    const g = sc ? (sc.gross || sc.total || 0) : null;
                                    return `<td style="padding: 12px; text-align: center; font-weight: 700; color: ${g !== null ? '#0f172a' : '#94a3b8'};">${g !== null ? g : '—'}</td>`;
                                }).join('') : ''}
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
        const oyeses = cachedOyeses || [];
        const grouped = {};
        oyeses.forEach(o => {
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
        reportTitle = 'LISTA DE SALIDAS';
        const teams = cachedTeams || [];
        const holes = {};
        teams.forEach(t => {
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
                .print-header-container { padding: 25px 40px; background: white; border-bottom: 4px solid #0f172a; }
                .print-content { padding: 25px 40px; }
                @media print { thead { display: table-header-group; } body { padding: 0; } }
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
                            <div class="print-content">${contentHtml}</div>
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

    const teamScores = (cachedScores || []).filter(s => String(s.teamid) === String(teamId));
    const teamObj = (cachedTeams || []).find(t => String(t.id) === String(teamId));
    const ventaja = teamObj?.ventaja || 0;

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

    const sortedTeamScores = [...teamScores].sort((a, b) => getScoreDay(a) - getScoreDay(b));
    const totalDays = Math.max(1, parseInt(tournamentData?.config?.totalDays || 1));

    const contentHtml = sortedTeamScores.map((s) => {
        let holeScoresObj = {};
        if (s.hole_scores) {
            try {
                holeScoresObj = typeof s.hole_scores === 'string' ? JSON.parse(s.hole_scores) : s.hole_scores;
            } catch(e) { holeScoresObj = {}; }
        }

        const dayNum = getScoreDay(s);
        const headerLabel = totalDays > 1 ? getDayLabel(dayNum) : (s.coursename || 'CLUB DE GOLF COLIMA');

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
                    <h4 class="font-black uppercase text-[11px] tracking-widest">${headerLabel}</h4>
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

// Internal core logic: Single-pass parallel fetch for ultra-fast mobile loading
async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    currentTournamentId = urlParams.get('id') || urlParams.get('tournament');
    const viewParam = urlParams.get('view');
    if (viewParam && ['posiciones', 'oyeses', 'salidas'].includes(viewParam)) {
        currentView = viewParam;
    }

    let allTournamentsList = [];
    try {
        const { data: tList } = await db.from('tournaments').select('id, name').order('created_at', { ascending: false });
        if (tList && tList.length > 0) {
            allTournamentsList = tList;
        }
    } catch (e) {}

    const id8 = 'b73a7380-589d-4986-84c4-7618d805fced';
    const id22 = '291bcd9c-674b-431e-9fd4-5690ce2b7b94';
    const id5 = '69452b77-44c7-400a-bb88-a763da03196b';
    const id26 = 'dfecb440-d4ee-485f-b6d1-ad27f5032fc7';

    const isTour8 = (t) => t && (t.id === id8 || ((t.name?.toLowerCase().includes('8') || t.name?.toLowerCase().includes('1ª') || t.name?.toLowerCase().includes('1a')) && t.name?.toLowerCase().includes('ago') && !t.name?.toLowerCase().includes('nov')));
    const isTour22 = (t) => t && (t.id === id22 || (t.name?.toLowerCase().includes('22') && t.name?.toLowerCase().includes('ago')));
    const isTour5 = (t) => t && (t.id === id5 || ((t.name?.toLowerCase().includes('5') || t.name?.toLowerCase().includes('3ª') || t.name?.toLowerCase().includes('3a')) && (t.name?.toLowerCase().includes('sep') || t.name?.toLowerCase().includes('sept')) && !t.name?.toLowerCase().includes('nov')));
    const isTour26 = (t) => t && (t.id === id26 || ((t.name?.toLowerCase().includes('26') || t.name?.toLowerCase().includes('4ª') || t.name?.toLowerCase().includes('4a')) && (t.name?.toLowerCase().includes('sep') || t.name?.toLowerCase().includes('sept')) && !t.name?.toLowerCase().includes('nov')));

    const t8 = allTournamentsList.find(isTour8);
    const t22 = allTournamentsList.find(isTour22);
    const t5 = allTournamentsList.find(isTour5);
    const t26 = allTournamentsList.find(isTour26);

    const finalId8 = t8 ? t8.id : id8;
    const finalId22 = t22 ? t22.id : id22;
    const finalId5 = t5 ? t5.id : id5;
    const finalId26 = t26 ? t26.id : id26;

    const tMecate = allTournamentsList.find(t => t.id === 'f116975d-d521-4001-91b5-2e21510f6be7' || t.name?.toLowerCase().includes('mecate'));
    const idMecate = tMecate ? tMecate.id : 'f116975d-d521-4001-91b5-2e21510f6be7';

    const nowCheckTorneo = new Date();
    const isMecateTodayTorneo = nowCheckTorneo <= new Date(2026, 8, 20, 23, 59, 59);
    if (!currentTournamentId || currentTournamentId === '5-sept-pending' || currentTournamentId === '69452b77-44c7-400a-bb88-a763da03196b') {
        currentTournamentId = (!currentTournamentId && isMecateTodayTorneo) ? idMecate : finalId5;
    }

    if (currentTournamentId === '5-sept-pending') {
        tournamentData = {
            id: '5-sept-pending',
            name: '3ª FECHA · 5 DE SEPTIEMBRE',
            courses: 'CLUB DE GOLF COLIMA',
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

        document.getElementById('tournament-name').textContent = tournamentData.name;
        document.getElementById('tournament-location').innerHTML = `<span class="material-icons-round text-[12px]">location_on</span> ${tournamentData.courses}`;

        const liveIndicator = document.getElementById('live-indicator');
        const liveStatusText = liveIndicator?.nextElementSibling;
        if (liveIndicator) {
            liveIndicator.innerHTML = `
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            `;
        }
        if (liveStatusText) {
            liveStatusText.textContent = 'Live Update · En Vivo';
            liveStatusText.className = 'text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500';
        }

        const pillsContainer = document.getElementById('torneo-date-pills');
        if (pillsContainer) {
            pillsContainer.innerHTML = `
                <span class="text-[9px] font-black uppercase text-slate-400 shrink-0">Fechas:</span>
                <a href="/torneo/?id=${id8}"
                    style="text-decoration:none;"
                    class="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0
                    ${currentTournamentId === id8 
                        ? 'bg-amber-500 text-slate-950 font-black shadow-lg' 
                        : 'bg-white/5 text-amber-300 border border-amber-500/40 hover:bg-white/10'}">
                    <span style="width:6px; height:6px; border-radius:9999px; background:${currentTournamentId === id8 ? '#020617' : '#f59e0b'};"></span>
                    1ª Fecha · 8 Ago (Finalizado)
                </a>
                <a href="/torneo/?id=${id22}"
                    style="text-decoration:none;"
                    class="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0
                    ${currentTournamentId === id22 
                        ? 'bg-amber-500 text-slate-950 font-black shadow-lg' 
                        : 'bg-white/5 text-amber-300 border border-amber-500/40 hover:bg-white/10'}">
                    <span style="width:6px; height:6px; border-radius:9999px; background:${currentTournamentId === id22 ? '#020617' : '#f59e0b'};"></span>
                    2ª Fecha · 22 Ago (Finalizado)
                </a>
                <a href="/torneo/?id=${id5}"
                    style="text-decoration:none;"
                    class="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0
                    ${currentTournamentId === id5 && currentTournamentId !== id8 && currentTournamentId !== id22
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-lg' 
                        : 'bg-white/5 text-emerald-300 border border-emerald-500/40 hover:bg-white/10'}">
                    <span style="width:6px; height:6px; border-radius:9999px; background:${currentTournamentId === id5 && currentTournamentId !== id8 && currentTournamentId !== id22 ? '#020617' : '#10b981'};"></span>
                    3ª Fecha · 5 Sept (En Vivo)
                </a>
            `;
        }

        const btnOyes = document.getElementById('btn-oyeses');
        if (btnOyes) btnOyes.classList.add('hidden');

        currentView = 'posiciones';
        updateUI();
        renderCurrentViewFromCache();
        return;
    }

    try {
        // Run single parallel query for all data at once (1 round trip for mobile networks)
        const [tRes, teamsRes, scoresRes, oyesesRes] = await Promise.all([
            db.from('tournaments').select('*').eq('id', currentTournamentId).single(),
            db.from('teams').select('*').eq('eventid', String(currentTournamentId)),
            db.from('scores').select('*').eq('eventid', String(currentTournamentId)),
            db.from('oyeses').select('*').eq('eventid', String(currentTournamentId))
        ]);

        if (tRes.error || !tRes.data) throw new Error("Torneo no encontrado");
        tournamentData = tRes.data;
        cachedTeams = teamsRes.data || [];
        cachedScores = scoresRes.data || [];
        cachedOyeses = oyesesRes.data || [];

        document.getElementById('tournament-name').textContent = tournamentData.name || 'TORNEO DE GOLF';
        document.getElementById('tournament-location').innerHTML = `<span class="material-icons-round text-[12px]">location_on</span> ${tournamentData.courses || 'CLUB DE GOLF COLIMA'}`;

        let fecha4HasScores = false;
        try {
            const { count: s4Count } = await db.from('scores').select('id', { count: 'exact', head: true }).eq('eventid', finalId26);
            if (s4Count && s4Count > 0) fecha4HasScores = true;
        } catch (e) {}

        const isMecate = currentTournamentId === idMecate || tournamentData?.name?.toLowerCase().includes('mecate');
        const is8Ago = (tournamentData.name && isTour8(tournamentData)) || currentTournamentId === finalId8;
        const is22Ago = (tournamentData.name && isTour22(tournamentData)) || currentTournamentId === finalId22;
        const is5Sept = (tournamentData.name && isTour5(tournamentData)) || currentTournamentId === finalId5;
        const is26Sept = (tournamentData.name && isTour26(tournamentData)) || currentTournamentId === finalId26;
        const isFinished = !isMecate && (is8Ago || is22Ago || is5Sept);

        const liveIndicator = document.getElementById('live-indicator');
        const liveStatusText = liveIndicator?.nextElementSibling;
        if (isFinished) {
            if (liveIndicator) liveIndicator.innerHTML = '<span style="width:8px; height:8px; border-radius:9999px; background:#f59e0b; display:inline-block;"></span>';
            if (liveStatusText) {
                liveStatusText.textContent = 'Torneo Finalizado · Resultados';
                liveStatusText.className = 'text-[10px] font-black uppercase tracking-[0.2em] text-amber-400';
            }
        } else {
            if (liveIndicator) {
                liveIndicator.innerHTML = `
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                `;
            }
            if (liveStatusText) {
                liveStatusText.textContent = 'Live Update · En Vivo';
                liveStatusText.className = 'text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500';
            }
        }

        const pillsContainer = document.getElementById('torneo-date-pills');
        if (pillsContainer) {
            if (isMecate) {
                pillsContainer.innerHTML = '';
                pillsContainer.classList.add('hidden');
            } else {
                pillsContainer.classList.remove('hidden');
                pillsContainer.innerHTML = `
                    <span class="text-[9px] font-black uppercase text-slate-400 shrink-0">Fechas:</span>
                    <a href="/torneo/?id=${finalId8}"
                        style="text-decoration:none;"
                        class="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0
                        ${currentTournamentId === finalId8 
                            ? 'bg-amber-500 text-slate-950 font-black shadow-lg' 
                            : 'bg-white/5 text-amber-300 border border-amber-500/40 hover:bg-white/10'}">
                        <span style="width:6px; height:6px; border-radius:9999px; background:${currentTournamentId === finalId8 ? '#020617' : '#f59e0b'};"></span>
                        1ª Fecha · 8 Ago (Finalizado)
                    </a>
                    <a href="/torneo/?id=${finalId22}"
                        style="text-decoration:none;"
                        class="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0
                        ${currentTournamentId === finalId22 
                            ? 'bg-amber-500 text-slate-950 font-black shadow-lg' 
                            : 'bg-white/5 text-amber-300 border border-amber-500/40 hover:bg-white/10'}">
                        <span style="width:6px; height:6px; border-radius:9999px; background:${currentTournamentId === finalId22 ? '#020617' : '#f59e0b'};"></span>
                        2ª Fecha · 22 Ago (Finalizado)
                    </a>
                    <a href="/torneo/?id=${finalId5}"
                        style="text-decoration:none;"
                        class="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0
                        ${currentTournamentId === finalId5
                            ? 'bg-amber-500 text-slate-950 font-black shadow-lg' 
                            : 'bg-white/5 text-amber-300 border border-amber-500/40 hover:bg-white/10'}">
                        <span style="width:6px; height:6px; border-radius:9999px; background:${currentTournamentId === finalId5 ? '#020617' : '#f59e0b'};"></span>
                        3ª Fecha · 5 Sept (Finalizado)
                    </a>
                    ${fecha4HasScores ? `
                    <a href="/torneo/?id=${finalId26}"
                        style="text-decoration:none;"
                        class="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0
                        ${currentTournamentId === finalId26
                            ? 'bg-emerald-500 text-slate-950 font-black shadow-lg' 
                            : 'bg-white/5 text-emerald-300 border border-emerald-500/40 hover:bg-white/10'}">
                        <span style="width:6px; height:6px; border-radius:9999px; background:${currentTournamentId === finalId26 ? '#020617' : '#10b981'};"></span>
                        4ª Fecha · 26 Sept (Gran Final)
                    </a>
                    ` : ''}
                    <a href="/torneo/?id=${idMecate}"
                        style="text-decoration:none;"
                        class="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 ml-auto bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20"
                        title="Ver Torneo del Mecate 19 Sep">
                        🚩 Torneo del Mecate (19 Sep)
                    </a>
                `;
            }
        }

        // Smart initial view: If no explicit view is passed in URL query params,
        // and there are no scores yet (pre-tournament), show 'salidas' by default!
        if (!viewParam) {
            if (cachedScores.length === 0 && cachedTeams.length > 0) {
                currentView = 'salidas';
            } else {
                currentView = 'posiciones';
            }
        }

        const btnOyes = document.getElementById('btn-oyeses');
        if (cachedOyeses.length === 0) {
            btnOyes.classList.add('hidden');
            if (currentView === 'oyeses') currentView = cachedScores.length > 0 ? 'posiciones' : 'salidas';
        } else {
            btnOyes.classList.remove('hidden');
        }

        updateUI();
        renderCurrentViewFromCache();

        // Background WebSockets subscription after UI is drawn to prevent blocking mobile thread
        setTimeout(() => subscribeToUpdates(), 800);
    } catch (err) {
        showError(err.message);
    }
}

function renderCurrentViewFromCache() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');

    if (currentView === 'posiciones') {
        renderLeaderboardFromCache();
    } else if (currentView === 'oyeses') {
        renderOyesesFromCache();
    } else {
        renderSalidasFromCache();
    }
}

function renderSalidasFromCache() {
    const content = document.getElementById('content-area');
    const teams = cachedTeams || [];

    if (teams.length === 0) {
        content.innerHTML = `
            <div class="py-24 text-center space-y-4 max-w-md mx-auto">
                <div class="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                    <span class="material-icons-round text-3xl">flag</span>
                </div>
                <div class="space-y-2">
                    <h4 class="text-base font-black uppercase tracking-tight text-white">Salidas por Asignar</h4>
                    <p class="text-xs text-slate-400 leading-relaxed font-medium">
                        Las salidas por hoyo y grupos de jugadores se publicarán aquí en cuanto sean asignadas por el Caddie Master y Comité Organizador.
                    </p>
                </div>
            </div>`;
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

function renderLeaderboardFromCache() {
    const content = document.getElementById('content-area');
    const teams = cachedTeams || [];
    const scores = cachedScores || [];

    const totalDays = Math.max(1, parseInt(tournamentData?.config?.totalDays || 1));
    if (!window._visorDayFilter || totalDays === 1) {
        window._visorDayFilter = 'all';
    }
    const dayFilter = window._visorDayFilter;

    window.setVisorDayFilter = (val) => {
        window._visorDayFilter = val;
        renderLeaderboardFromCache();
    };

    if (scores.length === 0) {
        content.innerHTML = `
            <div class="py-24 text-center space-y-4 max-w-md mx-auto">
                <div class="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                    <span class="material-icons-round text-3xl">emoji_events</span>
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
        <div class="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-4 mb-8 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
                <span class="material-icons-round text-amber-400">calendar_month</span>
                <span class="text-xs font-black uppercase text-white tracking-wider">Vista del Leaderboard:</span>
            </div>
            <div class="flex flex-wrap items-center gap-2">
                <button type="button" onclick="setVisorDayFilter('all')"
                    class="px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border
                    ${dayFilter === 'all'
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/20'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'}">
                    🏆 Acumulado (${totalDays} Días)
                </button>
                ${Array.from({ length: totalDays }, (_, idx) => {
                    const dNum = idx + 1;
                    const lbl = getDayLabel(dNum);
                    const isAct = String(dayFilter) === String(dNum);
                    return `
                    <button type="button" onclick="setVisorDayFilter(${dNum})"
                        class="px-3.5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border
                        ${isAct
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'}">
                        📅 ${lbl}
                    </button>`;
                }).join('')}
            </div>
        </div>
    ` : '';

    const sortedCats = Object.keys(categories).sort();
    if (sortedCats.length === 0) {
        content.innerHTML = `
            ${dayFilterBarHtml}
            <div class="py-20 text-center opacity-50">
                <p class="text-xs font-black uppercase tracking-widest text-white">Sin scores capturados para este día todavía.</p>
            </div>`;
        return;
    }

    content.innerHTML = dayFilterBarHtml + sortedCats.map(catName => {
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
        <div class="space-y-6 mb-12 animate-fade-in">
           <div class="flex items-center gap-4 px-2">
              <div class="w-1.5 h-10 ${isCatStb ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'} rounded-full"></div>
              <h3 class="text-xl font-black uppercase tracking-tight text-white">${catName}</h3>
              ${isCatStb ? `<span class="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase">⭐ Stableford (Puntos)</span>` : ''}
           </div>
           <div class="bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 shadow-xl overflow-hidden">
             <div class="overflow-x-auto custom-scrollbar">
               <table class="w-full text-left min-w-[580px] md:min-w-full">
                 <thead>
                   <tr class="bg-black/40 text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">
                     <th class="px-3 md:px-6 py-5 w-16 md:w-20 text-center">POS</th>
                     <th class="px-3 md:px-6 py-5">EQUIPO / JUGADORES</th>
                     <th class="px-2 md:px-4 py-5 text-center">RDS</th>
                     ${totalDays > 1 && dayFilter === 'all' ? Array.from({ length: totalDays }, (_, dIdx) => `
                         <th class="px-2 md:px-4 py-5 text-center ${isCatStb ? 'text-amber-400' : 'text-emerald-400'}">D${dIdx + 1}</th>
                     `).join('') : ''}
                     <th class="px-2 md:px-5 py-5 text-center">VENTAJA</th>
                     <th class="px-2 md:px-5 py-5 text-center">GROSS</th>
                     <th class="px-3 md:px-6 py-5 text-center bg-black/40 ${isCatStb ? 'text-amber-400' : 'text-emerald-500'}">${isCatStb ? 'PUNTOS' : 'NETO'}</th>
                     <th class="px-2 md:px-5 py-5 text-center w-16 md:w-24">INFO</th>
                   </tr>
                 </thead>
                 <tbody class="divide-y divide-white/5">
                   ${sortedItems.map((item, idx) => {
                     const ventajaDisplay = item.advantage === 0 ? '0' : `-${Math.abs(item.advantage)}`;
                     return `
                     <tr class="hover:bg-white/[0.02] transition-colors group">
                       <td class="px-3 md:px-6 py-4 md:py-5 text-center">
                         <span class="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg md:rounded-xl ${idx === 0 ? 'bg-amber-400 text-slate-950' : 'bg-white/5 text-white'} font-black text-xs md:text-sm mx-auto">#${idx+1}</span>
                       </td>
                       <td class="px-3 md:px-6 py-4 md:py-5">
                         <div class="flex items-center gap-2 flex-wrap">
                           <p class="font-black text-[12px] md:text-[13px] uppercase text-white truncate max-w-[130px] md:max-w-none">${item.team.teamname}</p>
                           ${item._suddenDeath1st ? `<span class="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[8px] font-black uppercase">⚡ Muerte Súbita</span>` : ''}
                           ${!item._suddenDeath1st && item._resolvedBy && idx < 3 ? `<span class="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[8px] font-black uppercase">✓ ${item._resolvedBy}</span>` : ''}
                         </div>
                       </td>
                       <td class="px-2 md:px-4 py-4 md:py-5 text-center text-white/70 font-bold text-xs md:text-sm">${item.rounds}${totalDays > 1 && dayFilter === 'all' ? `/${totalDays}` : ''}</td>
                       ${totalDays > 1 && dayFilter === 'all' ? Array.from({ length: totalDays }, (_, dIdx) => {
                           const sc = item.byDay && item.byDay[dIdx + 1];
                           const g = sc ? (sc.gross || sc.total || 0) : null;
                           const dayPts = (sc && isCatStb) ? calcCardStablefordPoints(sc.hole_scores, g, item.advantagePerDay) : null;
                           return `<td class="px-2 md:px-4 py-4 md:py-5 text-center font-black text-xs md:text-sm ${g !== null ? 'text-white' : 'text-white/30'}">${g !== null ? (isCatStb ? `${dayPts}p` : g) : '—'}</td>`;
                       }).join('') : ''}
                       <td class="px-2 md:px-5 py-4 md:py-5 text-center text-blue-400 font-bold text-xs md:text-sm">${ventajaDisplay}</td>
                       <td class="px-2 md:px-5 py-4 md:py-5 text-center text-white font-bold text-xs md:text-sm">${item.gross}</td>
                       <td class="px-3 md:px-6 py-4 md:py-5 text-center ${isCatStb ? 'bg-amber-500/10' : 'bg-emerald-500/10'}">
                         <span class="text-lg md:text-xl font-black ${isCatStb ? 'text-amber-300' : 'text-emerald-400'}">${isCatStb ? item.pts : item.neto}</span>
                       </td>
                       <td class="px-2 md:px-5 py-4 md:py-5 text-center">
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
        `;
    }).join('');
}

function renderOyesesFromCache() {
    const content = document.getElementById('content-area');
    const oyeses = cachedOyeses || [];

    if (oyeses.length === 0) {
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
    const is8Ago = tournamentData?.name?.toLowerCase().includes('8') && tournamentData?.name?.toLowerCase().includes('agosto');
    const activeColorClass = is8Ago ? 'bg-amber-500' : 'bg-emerald-500';

    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active', 'bg-emerald-500', 'bg-amber-500', 'text-slate-950', 'shadow-lg', 'shadow-emerald-500/20', 'shadow-amber-500/20'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.add('text-white/50'));

    const activeBtn = document.getElementById(`btn-${currentView}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-white/50');
        activeBtn.classList.add('active', activeColorClass, 'text-slate-950', 'shadow-lg');
    }
}

function subscribeToUpdates() {
    try {
        supabaseClient.removeAllChannels();
        supabaseClient.channel('tournament-live')
            .on('postgres_changes', { event: '*', schema: 'colimaGC', table: 'scores', filter: `eventid=eq.${currentTournamentId}` }, async () => {
                const { data } = await db.from('scores').select('*').eq('eventid', String(currentTournamentId));
                if (data) cachedScores = data;
                renderCurrentViewFromCache();
            })
            .on('postgres_changes', { event: '*', schema: 'colimaGC', table: 'oyeses', filter: `eventid=eq.${currentTournamentId}` }, async () => {
                const { data } = await db.from('oyeses').select('*').eq('eventid', String(currentTournamentId));
                if (data) cachedOyeses = data;
                renderCurrentViewFromCache();
            })
            .on('postgres_changes', { event: '*', schema: 'colimaGC', table: 'teams', filter: `eventid=eq.${currentTournamentId}` }, async () => {
                const { data } = await db.from('teams').select('*').eq('eventid', String(currentTournamentId));
                if (data) cachedTeams = data;
                renderCurrentViewFromCache();
            })
            .subscribe();
    } catch (e) {
        console.warn('Realtime subscription delayed:', e);
    }
}

function showError(msg) {
    document.getElementById('content-area').innerHTML = `<div class="py-20 text-center"><span class="material-icons-round text-red-500 mb-4">error</span><p class="text-red-500 font-black uppercase text-[10px]">${msg}</p></div>`;
}

// Start
init();
