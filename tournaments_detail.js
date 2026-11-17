// ================================================
// tournaments_detail.js — ColimaGC
// Master Console idéntica al diseño de PassGolf
// ================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 'https://tztolxgsaktqindoimtu.supabase.co';
const SUPABASE_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dG9seGdzYWt0cWluZG9pbXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzQ4ODAsImV4cCI6MjEwMTg1MDg4MH0.E2GABiOMXYb5hEwE9ErIcJa6_LHkj9lJUglQVoiLl0M';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const supabaseTarget = supabase.schema('colimaGC');

let currentTournamentID = null;
let currentTournamentName = '';
let currentTournamentConfig = { teamSize: 2, categories: [], modalidad: 'A GO GO' };
let currentTournamentCourses = ['Campo Principal'];
let currentTSection = 'teams';

let _appRef = null;
let _getLayoutRef = null;
let _showNotificationRef = null;

export async function renderTournamentSection(id, appEl, getLayout, db, supabaseClientRef, showNotification) {
    _appRef = appEl;
    _getLayoutRef = getLayout;
    _showNotificationRef = showNotification;
    currentTournamentID = id;

    const { data: tData } = await supabaseTarget.from('tournaments').select('*').eq('id', id).single();
    if (!tData) {
        showNotification('Error', 'Torneo no encontrado.', 'error');
        return;
    }

    currentTournamentName = tData.name;
    currentTournamentConfig = tData.config || { teamSize: 2, categories: [], modalidad: 'A GO GO' };
    currentTournamentCourses = tData.courses ? tData.courses.split(',').map(c => c.trim()) : ['Campo Principal'];

    window._setTSection = setSection;
    await setSection('teams');
}

// ================================================
// SHELL DEL TORNEO — Header + Tabs
// ================================================
async function setSection(section) {
    currentTSection = section;

    const tabs = [
        { id: 'teams',      label: 'Registros',    icon: 'groups' },
        { id: 'scores',     label: 'Scores',        icon: 'score' },
        { id: 'oyeses',     label: "Oye's",         icon: 'sports_golf' },
        { id: 'posiciones', label: 'Posiciones',    icon: 'leaderboard' },
        { id: 'widgets',    label: 'Nerve Center',  icon: 'analytics' },
    ];

    const [teamsRes, scoresRes, oyesesRes] = await Promise.all([
        supabaseTarget.from('teams').select('id', { count: 'exact' }).eq('eventid', String(currentTournamentID)),
        supabaseTarget.from('scores').select('id', { count: 'exact' }).eq('eventid', String(currentTournamentID)),
        supabaseTarget.from('oyeses').select('id', { count: 'exact' }).eq('eventid', String(currentTournamentID))
    ]);
    const teamsCount = teamsRes.count || 0;
    const scoresCount = scoresRes.count || 0;
    const oyesesCount = oyesesRes.count || 0;

    const teamUnitLabel = (currentTournamentConfig?.teamSize || 1) === 1 ? 'Jugadores' : 'Grupos';

    _appRef.innerHTML = _getLayoutRef(`
        <div class="animate-fade-in h-full flex flex-col">

            <!-- HEADER DEL TORNEO -->
            <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div class="flex items-center gap-3">
                    <button onclick="window.renderTournaments()"
                        class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all shrink-0" title="Volver a Torneos">
                        <span class="material-icons" style="font-size:20px">arrow_back</span>
                    </button>
                    <div class="flex items-center gap-3">
                        <div onclick="window.renderDashboard && window.renderDashboard()" class="flex items-center gap-2.5 p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md shrink-0 cursor-pointer hover:scale-105 transition-all" title="Ir al Panel Principal">
                            <img src="./golcolima.jpg" alt="Club Colima" class="h-14 w-auto object-contain rounded-xl" onerror="this.style.display='none'">
                            <img src="./logoclub.png" alt="Asociación" class="h-14 w-auto object-contain rounded-xl" onerror="this.style.display='none'">
                        </div>
                        <div>
                            <h1 class="text-2xl font-black text-white uppercase tracking-tight leading-none">${currentTournamentName}</h1>
                            <p class="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1">Dashboard de Control &nbsp;·&nbsp;
                                <span class="text-slate-400">${teamsCount} ${teamUnitLabel} · ${scoresCount} Scores · ${oyesesCount} Oye's</span>
                            </p>
                        </div>
                    </div>
                </div>
                <a href="${window.location.origin}/torneo/?id=${currentTournamentID}" target="_blank"
                    class="flex items-center gap-2 px-5 py-3 bg-primary text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 self-start">
                    <span class="material-icons" style="font-size:16px">open_in_new</span> Visor Live
                </a>
            </div>

            <!-- TABS -->
            <div class="flex gap-2 mb-6 overflow-x-auto pb-1">
                ${tabs.map(tab => `
                    <button onclick="window._setTSection('${tab.id}')"
                        class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all
                        ${currentTSection === tab.id
                            ? 'bg-primary text-slate-900 shadow-md shadow-primary/30'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'}">
                        <span class="material-icons" style="font-size:15px">${tab.icon}</span>
                        ${tab.label}
                    </button>`).join('')}
            </div>

            <!-- CONTENT -->
            <div id="tournament-section-content" class="flex-1 min-h-0"></div>
        </div>`);

    window._setTSection = setSection;

    const content = document.getElementById('tournament-section-content');
    if (!content) return;

    const config = currentTournamentConfig;
    const teamSize = config?.teamSize || 2;
    const categories = config?.categories || [];
    const modalidad = config?.modalidad || 'A GO GO';
    const courses = currentTournamentCourses;

    switch (section) {
        case 'teams':     await renderTeams(content, teamSize, categories, courses, modalidad); break;
        case 'scores':    await renderScores(content, courses); break;
        case 'oyeses':    await renderOyeses(content, courses); break;
        case 'posiciones':await renderPosiciones(content); break;
        case 'widgets':   await renderNerveCenter(content, teamsCount, scoresCount, oyesesCount); break;
    }
}

// ================================================
// SECTION: REGISTROS (Teams)
// ================================================
async function renderTeams(content, teamSize, categories, courses, modalidad) {
    const [{ data: teams }, { data: members }] = await Promise.all([
        supabaseTarget.from('teams').select('*').eq('eventid', String(currentTournamentID)).order('hole', { ascending: true }),
        supabaseTarget.from('members').select('*').order('name', { ascending: true })
    ]);

    const teamsArr = teams || [];
    window._allClubMembers = members || [];

    if (window._cfgCollapsed === undefined) {
        window._cfgCollapsed = (teamsArr.length > 0);
    }
    if (!window._mobileRegView) {
        window._mobileRegView = 'register';
    }

    content.innerHTML = `
        <!-- SWITCHER MÓVIL (Solo visible en pantallas pequeñas) -->
        <div class="lg:hidden flex p-1.5 bg-slate-900 border border-slate-800 rounded-2xl mb-4 gap-1.5">
            <button type="button" onclick="setMobileRegView('register')" id="mobile-reg-tab-form"
                class="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${window._mobileRegView === 'register' ? 'bg-primary text-slate-900 shadow-md shadow-primary/20' : 'text-slate-400 hover:text-white'}">
                <span class="material-icons" style="font-size:16px">person_add</span> + Registrar
            </button>
            <button type="button" onclick="setMobileRegView('list')" id="mobile-reg-tab-list"
                class="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${window._mobileRegView === 'list' ? 'bg-primary text-slate-900 shadow-md shadow-primary/20' : 'text-slate-400 hover:text-white'}">
                <span class="material-icons" style="font-size:16px">groups</span> Lista (${teamsArr.length})
            </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">

            <!-- ====== PANEL IZQUIERDO: REGISTRO Y CONFIG ====== -->
            <div id="reg-form-panel" class="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col gap-6 overflow-y-auto ${window._mobileRegView === 'list' ? 'hidden lg:flex' : 'flex'}">

                <!-- CONFIGURACIÓN ACORDEÓN (COLAPSABLE) -->
                <div class="bg-slate-950/60 border border-slate-800 rounded-2xl shadow-lg transition-all shrink-0">
                    <!-- BOTÓN ENCABEZADO CON FLECHA -->
                    <button type="button" onclick="toggleConfigAccordion()"
                        class="w-full flex items-center justify-between p-4 bg-slate-800/40 hover:bg-slate-800/80 transition-all text-left group cursor-pointer rounded-2xl">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 bg-slate-800 border border-slate-700/60 group-hover:border-primary/50 group-hover:bg-primary/10 rounded-xl flex items-center justify-center transition-all">
                                <span class="material-icons text-slate-400 group-hover:text-primary text-base">settings</span>
                            </div>
                            <div>
                                <div class="flex items-center gap-2 flex-wrap">
                                    <h3 class="font-black text-white uppercase tracking-widest text-xs">Configuración</h3>
                                    <span class="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                                        ${teamSize} Jugador${teamSize > 1 ? 'es' : ''}
                                    </span>
                                    <span id="cfg-days-badge" class="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                                        ${currentTournamentConfig?.totalDays || 1} ${(currentTournamentConfig?.totalDays || 1) === 1 ? 'Día' : 'Días'}
                                    </span>
                                </div>
                                <p id="cfg-subtitle-summary" class="text-[9.5px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                                    ${modalidad} · ${categories.length} Cat.
                                </p>
                            </div>
                        </div>

                        <div class="flex items-center gap-2">
                            <span id="cfg-status-text" class="text-[9px] font-black text-slate-500 uppercase tracking-wider group-hover:text-primary transition-all hidden sm:inline">
                                ${window._cfgCollapsed ? 'Modificar' : 'Contraer'}
                            </span>
                            <div class="w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 group-hover:text-white transition-all">
                                <span id="cfg-toggle-arrow" class="material-icons text-base transition-transform duration-300 ${window._cfgCollapsed ? '' : 'rotate-180'}">
                                    expand_more
                                </span>
                            </div>
                        </div>
                    </button>

                    <!-- CUERPO DE CONFIGURACIÓN -->
                    <div id="cfg-accordion-body" class="${window._cfgCollapsed ? 'hidden' : 'block'} p-4 pt-3 border-t border-slate-800/80 space-y-4">
                        <!-- DURACIÓN DEL EVENTO (DÍAS / RONDAS) -->
                        <div>
                            <p class="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Duración del Torneo (Días de Juego)</p>
                            <div class="grid grid-cols-4 gap-2">
                                ${[1, 2, 3, 4].map(d => {
                                    const curDays = currentTournamentConfig?.totalDays || 1;
                                    return `
                                    <button type="button" onclick="updateTotalDays(${d})" id="td-btn-${d}"
                                        class="py-2.5 rounded-xl border text-[10px] font-black uppercase transition-all
                                        ${curDays === d
                                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-inner'
                                            : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'}">
                                        ${d} ${d === 1 ? 'Día' : 'Días'}
                                    </button>`;
                                }).join('')}
                            </div>
                            <div id="cfg-day-labels-container" class="${(currentTournamentConfig?.totalDays || 1) > 1 ? 'grid' : 'hidden'} grid-cols-2 gap-2 mt-2.5">
                                ${[1, 2, 3, 4].slice(0, currentTournamentConfig?.totalDays || 1).map((d, idx) => {
                                    const lbl = (currentTournamentConfig?.dayLabels && currentTournamentConfig.dayLabels[idx]) || `DÍA ${d}`;
                                    return `
                                    <div>
                                        <label class="block text-[8px] font-black text-slate-500 uppercase mb-0.5">Nombre Día ${d}</label>
                                        <input id="cfg-day-lbl-${idx}" value="${lbl}" onchange="updateDayLabel(${idx}, this.value)"
                                            class="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-[10px] font-bold uppercase focus:outline-none focus:border-primary">
                                    </div>`;
                                }).join('')}
                            </div>
                        </div>

                        <!-- MODALIDAD -->
                        <div>
                            <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Modalidad</p>
                            <div class="grid grid-cols-2 gap-2">
                                ${[1,2,3,4].map(n => `
                                    <button onclick="updateTeamSize(${n})" id="ts-btn-${n}"
                                        class="py-3 rounded-xl border text-[10px] font-black uppercase transition-all
                                        ${teamSize === n
                                            ? 'bg-slate-900 border-white text-white shadow-inner'
                                            : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'}">
                                        ${n} Jugador${n > 1 ? 'es' : ''}
                                    </button>`).join('')}
                            </div>
                        </div>

                        <!-- SISTEMA DE JUEGO -->
                        <div>
                            <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Sistema de Juego</p>
                            <select id="cfg-modalidad" onchange="updateModalidad(this.value)"
                                class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-black uppercase focus:outline-none focus:border-primary transition-all">
                                ${['A GO GO','STROKE PLAY (INDIVIDUAL)','STROKE PLAY (EQUIPO)','MEJOR BOLA','STABLEFORD','SCRAMBLE'].map(m =>
                                    `<option value="${m}" ${modalidad === m ? 'selected' : ''}>${m}</option>`).join('')}
                            </select>
                        </div>

                        <!-- GESTIONAR CATEGORÍAS -->
                        <div>
                            <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Gestionar Categorías y Modalidad por Categoría</p>
                            <div class="flex flex-wrap sm:flex-nowrap gap-2 mb-3">
                                <input id="new-cat-name" placeholder="Nueva Cat (ej. C)..."
                                    class="flex-1 min-w-[110px] px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold uppercase placeholder:text-slate-600 focus:outline-none focus:border-primary transition-all">
                                <input id="new-cat-pct" type="number" value="80" min="1" max="100" placeholder="%" title="Porcentaje de Hándicap (ej. 80%)"
                                    class="w-16 px-2 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold text-center focus:outline-none focus:border-primary transition-all">
                                <select id="new-cat-format" title="Modalidad de juego para esta categoría"
                                    class="px-2.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-[10px] font-black uppercase focus:outline-none focus:border-primary transition-all">
                                    <option value="STROKE">⛳ Golpes (Stroke)</option>
                                    <option value="STABLEFORD">⭐ Stableford (Pts)</option>
                                </select>
                                <button onclick="addCategoryToConfig()" title="Agregar Categoría"
                                    class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-slate-900 font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 shrink-0">
                                    <span class="material-icons" style="font-size:20px">add</span>
                                </button>
                            </div>
                            <!-- Tags de categorías -->
                            <div id="cat-tags" class="flex flex-wrap gap-2">
                                ${categories.map(c => renderCatTag(c)).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- REGISTRO DE PARTICIPANTE -->
                <div class="border-t border-slate-800 pt-4 shrink-0">
                    <div class="flex items-center justify-between gap-2 mb-4">
                        <div class="flex items-center gap-2">
                            <span class="material-icons text-primary" style="font-size:18px">person_add</span>
                            <h3 class="font-black text-white uppercase tracking-widest text-xs">Registro de Participante</h3>
                        </div>
                        <span class="text-[9px] font-bold text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Autocompleta Socios</span>
                    </div>

                    <!-- Datalist de Socios -->
                    <datalist id="club-members-datalist">
                        ${(window._allClubMembers || []).map(m => `<option value="${m.name}">#${m.member_number} · Index: ${m.current_handicap !== undefined && m.current_handicap !== null ? m.current_handicap : 0}</option>`).join('')}
                    </datalist>

                    <div class="space-y-3">
                        ${[1,2,3,4].filter(n => n <= teamSize).map(n => `
                            <input id="reg-p${n}" placeholder="${n === 1 ? 'Jugador Principal (Escribe para buscar socio)' : 'Jugador ' + n}"
                                ${n === 1 ? 'list="club-members-datalist" oninput="onPlayer1Select(this.value)" autocomplete="off"' : ''}
                                class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-base sm:text-sm font-bold placeholder:text-slate-500 focus:outline-none focus:border-primary transition-all">`).join('')}

                        <div>
                            <label class="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Categoría del Jugador</label>
                            <select id="reg-cat" onchange="autoCalcVentaja()" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-base sm:text-sm font-bold focus:outline-none focus:border-primary transition-all">
                                <option value="">Selecciona Categoría...</option>
                                ${categories.map(c => {
                                    const name = typeof c === 'object' ? c.name : c;
                                    const pct  = typeof c === 'object' ? (c.pct || 100) : 100;
                                    const fmt  = typeof c === 'object' && c.format === 'STABLEFORD' ? ' · ⭐ STABLEFORD' : '';
                                    return `<option value="${name}">${name} (${pct}%${fmt})</option>`;
                                }).join('')}
                            </select>
                        </div>

                        <!-- MODO DE HANDICAP: INDEX VS DIRECTO -->
                        <div class="space-y-2 pt-1">
                            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Ingreso de Hándicap</label>
                            <div class="flex gap-1.5 p-1 bg-slate-800 border border-slate-700 rounded-xl">
                                <button type="button" id="mode-btn-index" onclick="setHdcpMode('index')"
                                    class="flex-1 py-2 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all bg-primary text-slate-900">
                                    🎯 Index + Marcas
                                </button>
                                <button type="button" id="mode-btn-direct" onclick="setHdcpMode('direct')"
                                    class="flex-1 py-2 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all text-slate-400 hover:text-white">
                                    🔢 Directo
                                </button>
                            </div>
                        </div>

                        <!-- CAMPOS MODO INDEX -->
                        <div id="section-index-mode" class="space-y-3">
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="block text-[9px] font-black text-slate-400 uppercase mb-1">Handicap Index</label>
                                    <input id="reg-index" type="number" step="0.1" min="0" max="54" placeholder="Ej. 12.0" oninput="autoCalcVentaja()" inputmode="decimal"
                                        class="w-full px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-base sm:text-sm font-bold text-center focus:outline-none focus:border-primary transition-all">
                                </div>
                                <div>
                                    <label class="block text-[9px] font-black text-slate-400 uppercase mb-1">HCP de Campo</label>
                                    <input id="reg-hdcp-calc" type="number" readonly placeholder="0"
                                        class="w-full px-3 py-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-emerald-400 text-base sm:text-sm font-black text-center cursor-not-allowed">
                                </div>
                            </div>
                            <div>
                                <label class="block text-[9px] font-black text-slate-400 uppercase mb-1">Marcas de Salida (Tees)</label>
                                <select id="reg-tee" onchange="autoCalcVentaja()" class="w-full px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-base sm:text-xs font-bold focus:outline-none focus:border-primary transition-all">
                                    <option value="BLANCA">⚪ Blancas (66.5 / 125)</option>
                                    <option value="DORADA">🟡 Doradas (65.7 / 122)</option>
                                    <option value="PLATEADA">🔘 Plateadas (65.5 / 121)</option>
                                    <option value="AZUL">🔵 Azules (68.0 / 128)</option>
                                </select>
                            </div>
                        </div>

                        <!-- CAMPOS MODO DIRECTO -->
                        <div id="section-direct-mode" class="hidden space-y-2">
                            <label class="block text-[9px] font-black text-slate-400 uppercase">Hándicap de Campo Directo</label>
                            <input id="reg-hdcp" type="number" min="0" max="54" value="0" oninput="autoCalcVentaja()" inputmode="numeric"
                                class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-base sm:text-sm font-bold text-center focus:outline-none focus:border-primary transition-all">
                        </div>

                        <!-- Ventaja calculada automáticamente -->
                        <div id="ventaja-preview" class="hidden">
                            <div class="flex items-center justify-between px-4 py-3 bg-primary/10 border border-primary/20 rounded-xl">
                                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ventaja Calculada</span>
                                <span id="ventaja-value" class="text-xl font-black text-primary">0</span>
                            </div>
                        </div>

                        <button onclick="doRegisterTeam(${teamSize})"
                            class="w-full py-3.5 bg-primary text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20">
                            + Registrar
                        </button>
                    </div>
                </div>
            </div>

            <!-- ====== PANEL DERECHO: LISTA DE PARTICIPANTES ====== -->
            <div id="reg-list-panel" class="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden ${window._mobileRegView === 'list' ? 'flex' : 'hidden lg:flex'}">

                <!-- Header con ordenamiento y buscador responsive -->
                <div class="px-4 sm:px-5 py-3.5 border-b border-slate-800 space-y-3">
                    <div class="flex items-center justify-between gap-2">
                        <span class="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                            <span class="material-icons text-primary" style="font-size:18px">groups</span> Participantes
                        </span>
                        <span id="reg-count-badge" class="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs font-black text-white">${teamsArr.length} ${teamSize === 1 ? 'Jugadores' : 'Grupos'}</span>
                    </div>

                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <!-- Sort buttons -->
                        <div class="flex flex-wrap gap-1">
                            <button id="sort-registro" onclick="sortTeams('registro')" title="Orden de registro"
                                class="px-2.5 sm:px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all bg-primary text-slate-900">
                                F. Registro
                            </button>
                            <button id="sort-categoria" onclick="sortTeams('categoria')" title="Por categoría"
                                class="px-2.5 sm:px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all bg-slate-800 border border-slate-700 text-slate-400 hover:text-white">
                                Categoría
                            </button>
                            <button id="sort-ventaja" onclick="sortTeams('ventaja')" title="Por ventaja"
                                class="px-2.5 sm:px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all bg-slate-800 border border-slate-700 text-slate-400 hover:text-white">
                                Ventaja
                            </button>
                            <button id="sort-hoyo" onclick="sortTeams('hoyo')" title="Por hoyo de salida"
                                class="px-2.5 sm:px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all bg-slate-800 border border-slate-700 text-slate-400 hover:text-white">
                                Hoyo
                            </button>
                        </div>

                        <div class="flex items-center gap-2 w-full sm:w-auto">
                            <input id="reg-search" placeholder="Buscar..." onkeyup="filterTeams(this.value)"
                                class="flex-1 sm:w-36 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold placeholder:text-slate-500 focus:outline-none focus:border-primary transition-all">
                            <button onclick="openImportTeamsModal()" title="Importar jugadores de otro torneo"
                                class="flex items-center gap-1 px-3 py-2 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 rounded-xl text-amber-400 transition-all text-xs font-black shrink-0">
                                <span class="material-icons" style="font-size:15px">file_download</span> Importar
                            </button>
                            <button onclick="printTeamsList()" title="Imprimir PDF"
                                class="flex items-center gap-1 px-3 py-2 bg-primary/10 border border-primary/30 hover:bg-primary/20 rounded-xl text-primary transition-all text-xs font-black shrink-0">
                                <span class="material-icons" style="font-size:15px">print</span> Imprimir
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Grid de participantes -->
                <div id="teams-grid" class="flex-1 overflow-y-auto p-4">
                    ${teamsArr.length === 0
                        ? `<div class="flex flex-col items-center justify-center h-full py-16 gap-3 text-center">
                            <span class="material-icons text-slate-700" style="font-size:3rem">group_off</span>
                            <p class="text-slate-600 font-black uppercase tracking-widest text-xs">Sin registros aún.</p>
                           </div>`
                        : `<div class="grid grid-cols-1 xl:grid-cols-2 gap-3" id="teams-inner">${teamsArr.map((t, i) => renderTeamCard(t, i)).join('')}</div>`}
                </div>
            </div>
        </div>

        <!-- ===== MODAL EDITAR PARTICIPANTE ===== -->
        <div id="edit-team-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.75)">
            <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 class="font-black text-white uppercase tracking-widest text-sm">Editar Participante</h3>
                    <button onclick="closeEditModal()" class="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 transition-all">
                        <span class="material-icons" style="font-size:16px">close</span>
                    </button>
                </div>
                <input type="hidden" id="edit-team-id">

                <!-- Jugadores -->
                <div id="edit-players-container" class="space-y-3"></div>

                <!-- Categoría -->
                <div>
                    <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Categoría</label>
                    <select id="edit-cat" onchange="editAutoVentaja()"
                        class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-primary transition-all">
                        <option value="">Categoría...</option>
                    </select>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Hándicap (Index)</label>
                        <input id="edit-hdcp" type="number" min="0" max="54" oninput="editAutoVentaja()"
                            class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-bold text-center focus:outline-none focus:border-primary transition-all">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Ventaja (Calculada)</label>
                        <input id="edit-ventaja" type="number" readonly title="La ventaja se calcula automáticamente según el hándicap y la categoría"
                            class="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/60 rounded-xl text-primary font-black text-sm text-center cursor-not-allowed select-none">
                    </div>
                </div>
                <div>
                    <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">🚩 Hoyo de Salida</label>
                    <input id="edit-hole" type="number" min="1" max="18" placeholder="Ej. 5"
                        class="w-full px-4 py-3 bg-slate-800 border border-primary/50 rounded-xl text-white text-xl font-black text-center focus:outline-none focus:border-primary transition-all">
                </div>
                <div class="flex gap-3 pt-2">
                    <button onclick="closeEditModal()" class="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black uppercase tracking-widest text-xs transition-all">Cancelar</button>
                    <button onclick="saveEditTeam()" class="flex-1 py-3 bg-primary text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">Guardar</button>
                </div>
            </div>
        </div>

        <!-- ===== MODAL EDITAR CATEGORÍA ===== -->
        <div id="edit-cat-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.75)">
            <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
                <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div class="flex items-center gap-2">
                        <span class="material-icons text-primary" style="font-size:18px">category</span>
                        <h3 class="font-black text-white uppercase tracking-widest text-sm">Editar Categoría</h3>
                    </div>
                    <button onclick="closeEditCatModal()" class="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 transition-all">
                        <span class="material-icons" style="font-size:16px">close</span>
                    </button>
                </div>
                <input type="hidden" id="edit-cat-old-name">

                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nombre de Categoría</label>
                    <input id="edit-cat-new-name" type="text" placeholder="Ej. CATEGORÍA A"
                        class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-bold uppercase focus:outline-none focus:border-primary transition-all">
                </div>

                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Porcentaje de Ventaja (%)</label>
                    <input id="edit-cat-new-pct" type="number" min="0" max="100" placeholder="80"
                        class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-bold text-center focus:outline-none focus:border-primary transition-all">
                </div>

                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Modalidad de la Categoría</label>
                    <select id="edit-cat-new-format"
                        class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-black uppercase focus:outline-none focus:border-primary transition-all">
                        <option value="STROKE">⛳ Stroke Play (Por Golpes)</option>
                        <option value="STABLEFORD">⭐ Stableford (Por Puntos)</option>
                    </select>
                </div>

                <div class="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] text-amber-300 font-bold leading-relaxed">
                    ⚡ <strong>Actualización Automática:</strong> Al modificar esta categoría, todos los participantes registrados en ella actualizarán su categoría y ventaja automáticamente.
                </div>

                <div class="flex gap-3 pt-2">
                    <button onclick="closeEditCatModal()" class="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black uppercase tracking-widest text-xs transition-all">Cancelar</button>
                    <button onclick="saveEditCategory()" class="flex-1 py-3 bg-primary text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">Guardar</button>
                </div>
            </div>
        </div>`;

    // Expose functions
    window._currentCategories = [...categories];
    window._currentTeamSize   = teamSize;
    window._currentModalidad  = modalidad;
    window._teamsData         = teamsArr;
    window._teamsSort         = 'registro';
    window._regHdcpMode       = 'index'; // 'index' or 'direct'
    window._editHdcpMode      = 'index';

    // Tees data
    window.COLIMA_TEES = {
        'BLANCA':      { name: '⚪ Blancas', rating: 66.5, slope: 125, par: 68 },
        'DORADA':      { name: '🟡 Doradas', rating: 65.7, slope: 122, par: 68 },
        'PLATEADA':    { name: '🔘 Plateadas', rating: 65.5, slope: 121, par: 68 },
        'AZUL':        { name: '🔵 Azules', rating: 68.0, slope: 128, par: 68 },
        // Compatibility aliases with existing records
        'WHITE':       { name: '⚪ Blancas', rating: 66.5, slope: 125, par: 68 },
        'WHITE_BLUE':  { name: '⚪ Blancas', rating: 66.5, slope: 125, par: 68 },
        'GOLD':        { name: '🟡 Doradas', rating: 65.7, slope: 122, par: 68 },
        'GOLD_YELLOW': { name: '🟡 Doradas', rating: 65.7, slope: 122, par: 68 },
        'SILVER':      { name: '🔘 Plateadas', rating: 65.5, slope: 121, par: 68 },
        'RED_MEN':     { name: '🔘 Plateadas', rating: 65.5, slope: 121, par: 68 },
        'RED_LADIES':  { name: '🔘 Plateadas', rating: 65.5, slope: 121, par: 68 }
    };

    window.setMobileRegView = (view) => {
        window._mobileRegView = view;
        const formPanel = document.getElementById('reg-form-panel');
        const listPanel = document.getElementById('reg-list-panel');
        const tabForm = document.getElementById('mobile-reg-tab-form');
        const tabList = document.getElementById('mobile-reg-tab-list');
        if (!formPanel || !listPanel) return;

        if (view === 'register') {
            formPanel.classList.remove('hidden');
            formPanel.classList.add('flex');
            listPanel.classList.add('hidden');
            listPanel.classList.remove('flex');
            if (tabForm) tabForm.className = 'flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-primary text-slate-900 shadow-md shadow-primary/20';
            if (tabList) tabList.className = 'flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 text-slate-400 hover:text-white';
        } else {
            formPanel.classList.add('hidden');
            formPanel.classList.remove('flex');
            listPanel.classList.remove('hidden');
            listPanel.classList.add('flex');
            if (tabForm) tabForm.className = 'flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 text-slate-400 hover:text-white';
            if (tabList) tabList.className = 'flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-primary text-slate-900 shadow-md shadow-primary/20';
        }
    };

    window.onPlayer1Select = (val) => {
        const members = window._allClubMembers || [];
        const clean = (val || '').toLowerCase().trim();
        const match = members.find(m => m.name.toLowerCase().trim() === clean);
        if (match) {
            window._selectedRegMemberId = match.id;
            const idxInput = document.getElementById('reg-index');
            if (idxInput) {
                idxInput.value = (match.current_handicap !== undefined && match.current_handicap !== null) ? match.current_handicap : '0.0';
                setHdcpMode('index');
            }
            const catSelect = document.getElementById('reg-cat');
            if (catSelect && match.category) {
                for (let opt of catSelect.options) {
                    if (opt.value.toUpperCase() === match.category.toUpperCase()) {
                        catSelect.value = opt.value;
                        break;
                    }
                }
            }
            autoCalcVentaja();
        } else {
            window._selectedRegMemberId = null;
        }
    };

    window.calculateCourseHdcp = (playerIndex, teeKey) => {
        const tee = window.COLIMA_TEES[teeKey] || window.COLIMA_TEES['BLANCA'] || window.COLIMA_TEES['WHITE'];
        const raw = (playerIndex * (tee.slope / 113)) + (tee.rating - tee.par);
        return Math.max(0, Math.round(raw));
    };

    window.setHdcpMode = (mode) => {
        window._regHdcpMode = mode;
        const btnIdx = document.getElementById('mode-btn-index');
        const btnDir = document.getElementById('mode-btn-direct');
        const secIdx = document.getElementById('section-index-mode');
        const secDir = document.getElementById('section-direct-mode');
        if (mode === 'index') {
            if (btnIdx) btnIdx.className = 'flex-1 py-2 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all bg-primary text-slate-900';
            if (btnDir) btnDir.className = 'flex-1 py-2 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all text-slate-400 hover:text-white';
            if (secIdx) secIdx.classList.remove('hidden');
            if (secDir) secDir.classList.add('hidden');
        } else {
            if (btnIdx) btnIdx.className = 'flex-1 py-2 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all text-slate-400 hover:text-white';
            if (btnDir) btnDir.className = 'flex-1 py-2 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all bg-primary text-slate-900';
            if (secIdx) secIdx.classList.add('hidden');
            if (secDir) secDir.classList.remove('hidden');
        }
        autoCalcVentaja();
    };

    // Auto-calc ventaja helper
    window.autoCalcVentaja = () => {
        let hdcp = 0;
        if (window._regHdcpMode === 'index') {
            const indexVal = parseFloat(document.getElementById('reg-index')?.value || '0') || 0;
            const teeKey   = document.getElementById('reg-tee')?.value || 'BLANCA';
            hdcp = window.calculateCourseHdcp(indexVal, teeKey);
            const calcEl = document.getElementById('reg-hdcp-calc');
            if (calcEl) calcEl.value = hdcp;
        } else {
            hdcp = parseInt(document.getElementById('reg-hdcp')?.value || '0') || 0;
        }

        const catEl   = document.getElementById('reg-cat');
        const catName = catEl ? catEl.value : '';
        const catObj  = window._currentCategories.find(c => (typeof c === 'object' ? c.name : c) === catName);
        const pct     = catObj && typeof catObj === 'object' ? (catObj.pct || 100) : 100;
        const ventaja = Math.round(hdcp * pct / 100);

        const preview = document.getElementById('ventaja-preview');
        const valEl   = document.getElementById('ventaja-value');
        if (preview && valEl) {
            if (hdcp > 0 || catName) {
                preview.classList.remove('hidden');
                valEl.textContent = ventaja;
            } else {
                preview.classList.add('hidden');
            }
        }
    };

    window.toggleConfigAccordion = () => {
        window._cfgCollapsed = !window._cfgCollapsed;
        const body = document.getElementById('cfg-accordion-body');
        const arrow = document.getElementById('cfg-toggle-arrow');
        const statusText = document.getElementById('cfg-status-text');
        if (body) {
            if (window._cfgCollapsed) {
                body.classList.add('hidden');
                body.classList.remove('block');
            } else {
                body.classList.remove('hidden');
                body.classList.add('block');
            }
        }
        if (arrow) {
            if (window._cfgCollapsed) {
                arrow.classList.remove('rotate-180');
            } else {
                arrow.classList.add('rotate-180');
            }
        }
        if (statusText) {
            statusText.textContent = window._cfgCollapsed ? 'Modificar' : 'Contraer';
        }
    };

    window.addCategoryToConfig  = addCategoryToConfig;
    window.removeCatFromConfig  = removeCatFromConfig;
    window.updateTeamSize       = updateTeamSize;
    window.updateModalidad      = updateModalidad;
    window.doRegisterTeam       = (size) => doRegisterTeam(size);
    window.deleteTeamById       = deleteTeamById;
    window.filterTeams          = filterTeams;
    window.sortTeams            = sortTeams;
    window.printTeamsList       = () => printTeamsList(window._teamsData);
    window.openEditModal        = openEditModal;
    window.closeEditModal       = closeEditModal;
    window.saveEditTeam         = saveEditTeam;
    window.editAutoVentaja      = editAutoVentaja;
}

const CAT_THEMES = [
    { bg: 'bg-gradient-to-r from-emerald-950/90 via-emerald-900/40 to-slate-900', border: 'border-emerald-500/50', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' },
    { bg: 'bg-gradient-to-r from-blue-950/90 via-blue-900/40 to-slate-900', border: 'border-blue-500/50', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30', dot: 'bg-blue-400' },
    { bg: 'bg-gradient-to-r from-purple-950/90 via-purple-900/40 to-slate-900', border: 'border-purple-500/50', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', dot: 'bg-purple-400' },
    { bg: 'bg-gradient-to-r from-amber-950/90 via-amber-900/40 to-slate-900', border: 'border-amber-500/50', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', dot: 'bg-amber-400' },
    { bg: 'bg-gradient-to-r from-rose-950/90 via-rose-900/40 to-slate-900', border: 'border-rose-500/50', text: 'text-rose-400', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30', dot: 'bg-rose-400' },
    { bg: 'bg-gradient-to-r from-cyan-950/90 via-cyan-900/40 to-slate-900', border: 'border-cyan-500/50', text: 'text-cyan-400', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', dot: 'bg-cyan-400' }
];

// ---- Sort helper ----
function sortTeams(mode) {
    window._teamsSort = mode;
    ['registro','categoria','ventaja','hoyo'].forEach(m => {
        const btn = document.getElementById(`sort-${m}`);
        if (!btn) return;
        if (m === mode) {
            btn.className = btn.className.replace('bg-slate-800 border border-slate-700 text-slate-400 hover:text-white', 'bg-primary text-slate-900');
        } else {
            btn.className = btn.className.replace('bg-primary text-slate-900', 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white');
        }
    });

    const inner = document.getElementById('teams-inner');
    if (!inner) return;

    let teams = [...(window._teamsData || [])];

    if (mode === 'categoria') {
        const catMap = {};
        teams.forEach(t => {
            const cat = (t.category || 'SIN CATEGORÍA').toUpperCase();
            if (!catMap[cat]) catMap[cat] = [];
            catMap[cat].push(t);
        });

        const sortedCats = Object.keys(catMap).sort((a,b) => {
            if (a === 'SIN CATEGORÍA') return 1;
            if (b === 'SIN CATEGORÍA') return -1;
            return a.localeCompare(b);
        });

        inner.innerHTML = `<div class="space-y-6 col-span-full">` + sortedCats.map((cat, catIdx) => {
            const groupTeams = catMap[cat];
            const theme = CAT_THEMES[catIdx % CAT_THEMES.length];
            return `
            <div class="space-y-3">
                <div class="relative flex items-center justify-between ${theme.bg} border ${theme.border} rounded-2xl px-5 py-3 shadow-xl backdrop-blur-md overflow-hidden">
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full ${theme.dot} shadow-sm"></span>
                        <span class="text-[10px] font-black uppercase ${theme.text} tracking-wider hidden sm:inline">CATEGORÍA</span>
                    </div>

                    <!-- TITULO CENTRADO DE LA CATEGORIA -->
                    <h3 class="absolute left-1/2 -translate-x-1/2 font-black text-white text-sm sm:text-base uppercase tracking-widest text-center flex items-center gap-2">
                        <span class="${theme.text}">CATEGORÍA ${cat}</span>
                    </h3>

                    <span class="px-3 py-1 ${theme.badge} border rounded-full text-[10px] font-black uppercase tracking-wider ml-auto sm:ml-0">
                        ${groupTeams.length} ${groupTeams.length === 1 ? 'Jugador' : 'Jugadores'}
                    </span>
                </div>
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    ${groupTeams.map((t, i) => renderTeamCard(t, i)).join('')}
                </div>
            </div>`;
        }).join('') + `</div>`;

    } else if (mode === 'hoyo') {
        const holeMap = {};
        teams.forEach(t => {
            const h = t.hole ? `HOYO ${t.hole}` : 'SIN HOYO ASIGNADO';
            if (!holeMap[h]) holeMap[h] = [];
            holeMap[h].push(t);
        });

        const sortedHoles = Object.keys(holeMap).sort((a,b) => {
            if (a === 'SIN HOYO ASIGNADO') return 1;
            if (b === 'SIN HOYO ASIGNADO') return -1;
            const numA = parseInt(a.replace('HOYO ', '')) || 0;
            const numB = parseInt(b.replace('HOYO ', '')) || 0;
            return numA - numB;
        });

        inner.innerHTML = `<div class="space-y-6 col-span-full">` + sortedHoles.map((hKey, hIdx) => {
            const groupTeams = holeMap[hKey];
            const theme = CAT_THEMES[hIdx % CAT_THEMES.length];
            return `
            <div class="space-y-3">
                <div class="relative flex items-center justify-between ${theme.bg} border ${theme.border} rounded-2xl px-5 py-3 shadow-xl backdrop-blur-md overflow-hidden">
                    <div class="flex items-center gap-2">
                        <span class="material-icons ${theme.text}" style="font-size:16px">flag</span>
                        <span class="text-[10px] font-black uppercase ${theme.text} tracking-wider hidden sm:inline">SALIDA</span>
                    </div>

                    <!-- TITULO CENTRADO DEL HOYO -->
                    <h3 class="absolute left-1/2 -translate-x-1/2 font-black text-white text-sm sm:text-base uppercase tracking-widest text-center flex items-center gap-2">
                        <span class="${theme.text}">${hKey}</span>
                    </h3>

                    <span class="px-3 py-1 ${theme.badge} border rounded-full text-[10px] font-black uppercase tracking-wider ml-auto sm:ml-0">
                        ${groupTeams.length} ${groupTeams.length === 1 ? 'Jugador' : 'Jugadores'}
                    </span>
                </div>
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    ${groupTeams.map((t, i) => renderTeamCard(t, i)).join('')}
                </div>
            </div>`;
        }).join('') + `</div>`;

    } else {
        if (mode === 'ventaja') teams.sort((a,b) => (b.ventaja||0) - (a.ventaja||0));
        inner.innerHTML = `<div class="grid grid-cols-1 xl:grid-cols-2 gap-3 col-span-full">${teams.map((t,i) => renderTeamCard(t,i)).join('')}</div>`;
    }
}

// ---- Edit modal ----
function openEditModal(id) {
    const t = window._teamsData.find(x => x.id === id);
    if (!t) return;
    document.getElementById('edit-team-id').value = t.id;

    const teamSize = window._currentTeamSize || 1;
    const container = document.getElementById('edit-players-container');
    if (container) {
        container.innerHTML = [1, 2, 3, 4].filter(n => n <= teamSize).map(n => `
            <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">${n === 1 ? 'Jugador Principal' : 'Jugador ' + n}</label>
                <input id="edit-p${n}" value="${t['player' + n] || (n === 1 ? t.teamname || '' : '')}"
                    class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-primary transition-all">
            </div>
        `).join('');
    }

    // Populate categories
    const catSel = document.getElementById('edit-cat');
    if (catSel) {
        catSel.innerHTML = `<option value="">Categoría...</option>` + (window._currentCategories || []).map(c => {
            const name = typeof c === 'object' ? c.name : c;
            return `<option value="${name}" ${name === t.category ? 'selected' : ''}>${name}</option>`;
        }).join('');
    }

    document.getElementById('edit-hdcp').value = t.hdcp || 0;
    document.getElementById('edit-hole').value = t.hole || '';
    
    editAutoVentaja();

    document.getElementById('edit-team-modal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('edit-team-modal').classList.add('hidden');
}

function editAutoVentaja() {
    const hdcp  = parseInt(document.getElementById('edit-hdcp')?.value || '0') || 0;
    const catName = document.getElementById('edit-cat')?.value || '';
    const catObj  = window._currentCategories?.find(c => (typeof c === 'object' ? c.name : c) === catName);
    const pct     = catObj && typeof catObj === 'object' ? (catObj.pct || 100) : 100;
    const ventaja = Math.round(hdcp * pct / 100);
    const vEl = document.getElementById('edit-ventaja');
    if (vEl) vEl.value = ventaja;
}

async function saveEditTeam() {
    const id = document.getElementById('edit-team-id').value;
    const teamSize = window._currentTeamSize || 1;

    const p1 = document.getElementById('edit-p1')?.value.trim() || '';
    const p2 = teamSize >= 2 ? (document.getElementById('edit-p2')?.value.trim() || '') : '';
    const p3 = teamSize >= 3 ? (document.getElementById('edit-p3')?.value.trim() || '') : '';
    const p4 = teamSize >= 4 ? (document.getElementById('edit-p4')?.value.trim() || '') : '';

    const catName = document.getElementById('edit-cat')?.value || '';
    const hdcp    = parseInt(document.getElementById('edit-hdcp')?.value || '0') || 0;
    
    const catObj  = window._currentCategories?.find(c => (typeof c === 'object' ? c.name : c) === catName);
    const pct     = catObj && typeof catObj === 'object' ? (catObj.pct || 100) : 100;
    const ventaja = Math.round(hdcp * pct / 100);

    const holeVal = document.getElementById('edit-hole')?.value.trim() || '';
    const hole    = holeVal ? (parseInt(holeVal) || null) : null;

    const teamName = teamSize === 1 ? p1 : [p1, p2, p3, p4].filter(Boolean).join(' / ');

    const { error } = await supabaseTarget.from('teams').update({
        teamname: teamName.toUpperCase(),
        player1:  p1.toUpperCase(),
        player2:  p2.toUpperCase(),
        player3:  p3.toUpperCase(),
        player4:  p4.toUpperCase(),
        category: catName.toUpperCase(),
        hdcp,
        ventaja,
        hole
    }).eq('id', id);

    if (error) {
        _showNotificationRef('Error', error.message, 'error');
    } else {
        closeEditModal();
        _showNotificationRef('\u00a1Guardado!', 'Participante actualizado.', 'success');
        setTimeout(() => setSection('teams'), 800);
    }
}

function isCategoryStableford(catName, configObj) {
    const cfg = configObj || currentTournamentConfig || {};
    const cats = cfg.categories || window._currentCategories || [];
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
    // Si el torneo entero es STABLEFORD y la categoría no especifica STROKE
    if (String(cfg.modalidad || '').toUpperCase() === 'STABLEFORD' && (!found || !found.format)) {
        return true;
    }
    return false;
}

function renderCatTag(c) {
    const name   = typeof c === 'object' ? c.name : c;
    const pct    = typeof c === 'object' ? (c.pct || 100) : 100;
    const format = (typeof c === 'object' && c.format) ? c.format : 'STROKE';
    const isStb  = format === 'STABLEFORD';
    const escaped = name.replace(/'/g, "\\'");
    return `<span class="inline-flex items-center gap-1.5 px-3 py-1 ${isStb ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-primary/15 border-primary/30 text-primary'} border rounded-full text-[10px] font-black uppercase">
        <span>${name} (${pct}% · ${isStb ? '⭐ STABLEFORD' : '⛳ GOLPES'})</span>
        <button type="button" onclick="openEditCategoryModal('${escaped}')" class="ml-1 hover:text-white transition-colors flex items-center" title="Editar Categoría">
            <span class="material-icons" style="font-size:12px">edit</span>
        </button>
        <button type="button" onclick="removeCatFromConfig('${escaped}')" class="hover:text-red-400 transition-colors font-bold text-xs" title="Eliminar Categoría">×</button>
    </span>`;
}

function renderTeamCard(t, idx) {
    const players = [t.player1, t.player2, t.player3, t.player4].filter(Boolean);
    const name    = t.teamname || players[0] || '—';
    const cat     = t.category || '';
    const isStb   = cat ? isCategoryStableford(cat, currentTournamentConfig) : false;
    const hdcp    = t.hdcp || 0;
    const ventaja = t.ventaja || 0;
    const hole    = t.hole; // null means unassigned
    const num     = String(idx + 1).padStart(2, '0');

    return `
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden group hover:border-slate-600 hover:shadow-lg hover:shadow-slate-900/50 transition-all" data-team-name="${name.toLowerCase()}">
            <!-- Top bar: number + name + category + actions -->
            <div class="flex items-center gap-3 px-4 pt-4 pb-3">
                <div class="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-white font-black text-sm shrink-0 border border-slate-600">#${num}</div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                        <p class="font-black text-white uppercase text-sm truncate">${name}</p>
                        ${cat
                            ? `<button type="button" onclick="openEditModal('${t.id}')" title="Cambiar Categoría" class="px-2 py-0.5 ${isStb ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-primary/15 text-primary border-primary/30'} border rounded-full text-[9px] font-black uppercase tracking-wide hover:opacity-80 transition-opacity cursor-pointer">CAT. ${cat}${isStb ? ' · ⭐ PTS' : ''}</button>`
                            : `<button type="button" onclick="openEditModal('${t.id}')" class="px-2 py-0.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 rounded-full text-[9px] font-black uppercase tracking-wide flex items-center gap-0.5 cursor-pointer"><span class="material-icons" style="font-size:10px">add</span>Asignar Cat.</button>`}
                    </div>
                    ${players.length > 1 ? `<p class="text-slate-500 text-[11px] font-bold mt-0.5 truncate">${players.slice(1).join(' · ')}</p>` : ''}
                </div>
                <!-- Action buttons -->
                <div class="flex items-center gap-1.5 shrink-0">
                    <button onclick="openEditModal('${t.id}')" title="Editar"
                        class="w-7 h-7 sm:w-8 sm:h-8 bg-slate-700/80 hover:bg-primary/20 hover:border-primary/40 border border-slate-600 rounded-lg flex items-center justify-center transition-all text-slate-300 hover:text-primary active:scale-95">
                        <span class="material-icons text-slate-300 hover:text-primary" style="font-size:14px">edit</span>
                    </button>
                    <button onclick="deleteTeamById('${t.id}', '${name.replace(/'/g, "\\'")}')" title="Borrar"
                        class="w-7 h-7 sm:w-8 sm:h-8 bg-red-900/20 hover:bg-red-900/40 border border-red-900/30 rounded-lg flex items-center justify-center transition-all text-red-400 hover:text-red-300 active:scale-95">
                        <span class="material-icons text-red-400" style="font-size:14px">delete</span>
                    </button>
                </div>
            </div>

            <!-- Bottom stats -->
            <div class="flex items-center gap-0 border-t border-slate-700/50">
                <div class="flex-1 px-3 py-2.5 border-r border-slate-700/50">
                    <p class="text-[9px] font-black text-slate-600 uppercase tracking-wider">Categoría</p>
                    <p class="text-xs font-black ${cat ? (isStb ? 'text-amber-300' : 'text-emerald-400') : 'text-amber-500'} uppercase truncate">${cat ? `${cat}${isStb ? ' (PTS)' : ''}` : 'Sin asignar'}</p>
                </div>
                <div class="flex-1 px-3 py-2.5 border-r border-slate-700/50">
                    <p class="text-[9px] font-black text-slate-600 uppercase tracking-wider">HDCP</p>
                    <p class="text-base font-black text-slate-300">${hdcp}</p>
                </div>
                <div class="flex-1 px-3 py-2.5 border-r border-slate-700/50">
                    <p class="text-[9px] font-black text-slate-600 uppercase tracking-wider">Ventaja</p>
                    <p class="text-base font-black text-primary">${ventaja} <span class="text-[9px] text-slate-500">gls</span></p>
                </div>
                <div class="px-3 py-2.5 text-right min-w-[56px]">
                    <p class="text-[9px] font-black text-slate-600 uppercase tracking-wider">Hoyo</p>
                    ${hole
                        ? `<p class="text-xl font-black text-white leading-none">${hole}</p>`
                        : `<button onclick="openEditModal('${t.id}')" class="text-[9px] font-black text-slate-600 hover:text-primary transition-colors uppercase tracking-wide flex items-center gap-0.5">
                             <span class="material-icons" style="font-size:10px">add</span>Asignar
                           </button>`}
                </div>
            </div>
        </div>`;
}

// --- Config helpers ---
async function saveConfig() {
    const newConfig = {
        ...(currentTournamentConfig || {}),
        teamSize:   window._currentTeamSize,
        categories: window._currentCategories,
        modalidad:  window._currentModalidad,
        totalDays:  window._currentTotalDays || currentTournamentConfig?.totalDays || 1,
        dayLabels:  window._currentDayLabels || currentTournamentConfig?.dayLabels || ['DÍA 1', 'DÍA 2', 'DÍA 3', 'DÍA 4']
    };
    const { error } = await supabaseTarget.from('tournaments').update({ config: newConfig }).eq('id', currentTournamentID);
    if (!error) currentTournamentConfig = newConfig;
    return error;
}

window.updateTotalDays = async function(d) {
    window._currentTotalDays = d;
    if (!window._currentDayLabels || !Array.isArray(window._currentDayLabels)) {
        window._currentDayLabels = currentTournamentConfig?.dayLabels || ['DÍA 1', 'DÍA 2', 'DÍA 3', 'DÍA 4'];
    }
    [1, 2, 3, 4].forEach(i => {
        const btn = document.getElementById(`td-btn-${i}`);
        if (!btn) return;
        if (i === d) {
            btn.className = 'py-2.5 rounded-xl border text-[10px] font-black uppercase transition-all bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-inner';
        } else {
            btn.className = 'py-2.5 rounded-xl border text-[10px] font-black uppercase transition-all bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300';
        }
    });
    const badge = document.getElementById('cfg-days-badge');
    if (badge) badge.textContent = `${d} ${d === 1 ? 'Día' : 'Días'}`;

    const lblContainer = document.getElementById('cfg-day-labels-container');
    if (lblContainer) {
        if (d > 1) {
            lblContainer.classList.remove('hidden');
            lblContainer.classList.add('grid');
            lblContainer.innerHTML = [1, 2, 3, 4].slice(0, d).map((dayNum, idx) => {
                const lbl = window._currentDayLabels[idx] || `DÍA ${dayNum}`;
                return `
                <div>
                    <label class="block text-[8px] font-black text-slate-500 uppercase mb-0.5">Nombre Día ${dayNum}</label>
                    <input id="cfg-day-lbl-${idx}" value="${lbl}" onchange="updateDayLabel(${idx}, this.value)"
                        class="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-[10px] font-bold uppercase focus:outline-none focus:border-primary">
                </div>`;
            }).join('');
        } else {
            lblContainer.classList.add('hidden');
            lblContainer.classList.remove('grid');
        }
    }
    await saveConfig();
    _showNotificationRef('Duración Actualizada', `Torneo configurado a ${d} ${d === 1 ? 'día' : 'días'}.`, 'success');
};

window.updateDayLabel = async function(idx, val) {
    if (!window._currentDayLabels || !Array.isArray(window._currentDayLabels)) {
        window._currentDayLabels = [...(currentTournamentConfig?.dayLabels || ['DÍA 1', 'DÍA 2', 'DÍA 3', 'DÍA 4'])];
    }
    window._currentDayLabels[idx] = (val || `DÍA ${idx + 1}`).trim().toUpperCase();
    await saveConfig();
};

window.openImportTeamsModal = async function() {
    let modal = document.getElementById('import-teams-modal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'import-teams-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in';
    modal.innerHTML = `
        <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                <div class="flex items-center gap-2">
                    <span class="material-icons text-amber-400" style="font-size:18px">file_download</span>
                    <h3 class="font-black text-white uppercase tracking-widest text-sm">Importar Jugadores</h3>
                </div>
                <button onclick="document.getElementById('import-teams-modal')?.remove()" class="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 transition-all">
                    <span class="material-icons" style="font-size:16px">close</span>
                </button>
            </div>
            <p class="text-xs text-slate-400 font-bold leading-relaxed">
                Selecciona un torneo anterior para copiar automáticamente sus participantes registrados (con su categoría, hándicap y ventaja) sin tener que volver a capturarlos:
            </p>
            <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Torneo Origen</label>
                <select id="import-source-tournament" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold uppercase focus:outline-none focus:border-primary">
                    <option value="">Cargando torneos...</option>
                </select>
            </div>
            <div class="flex gap-3 pt-2">
                <button onclick="document.getElementById('import-teams-modal')?.remove()" class="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black uppercase tracking-widest text-xs transition-all">Cancelar</button>
                <button id="btn-confirm-import" onclick="executeImportTeams()" class="flex-1 py-3 bg-amber-500 text-slate-950 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20">Importar</button>
            </div>
        </div>`;
    document.body.appendChild(modal);

    const { data: tours } = await supabaseTarget.from('tournaments').select('id, name, created_at').order('created_at', { ascending: false });
    const sel = document.getElementById('import-source-tournament');
    if (sel) {
        const others = (tours || []).filter(t => String(t.id) !== String(currentTournamentID));
        sel.innerHTML = others.length === 0
            ? `<option value="">No hay otros torneos disponibles</option>`
            : `<option value="">Selecciona un torneo...</option>` + others.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    }
};

window.executeImportTeams = async function() {
    const sel = document.getElementById('import-source-tournament');
    const sourceId = sel?.value;
    if (!sourceId) {
        _showNotificationRef('Selecciona un torneo', 'Elige el torneo del cual deseas copiar los jugadores.', 'error');
        return;
    }

    const btn = document.getElementById('btn-confirm-import');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Importando...';
    }

    const { data: sourceTeams, error } = await supabaseTarget.from('teams').select('*').eq('eventid', String(sourceId));
    if (error || !sourceTeams || sourceTeams.length === 0) {
        _showNotificationRef('Sin jugadores', 'El torneo seleccionado no tiene jugadores registrados.', 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Importar'; }
        return;
    }

    const existingNames = new Set((window._teamsData || []).map(t => (t.teamname || '').trim().toUpperCase()));
    const toInsert = sourceTeams
        .filter(st => !existingNames.has((st.teamname || '').trim().toUpperCase()))
        .map(st => ({
            eventid:   String(currentTournamentID),
            teamname:  st.teamname,
            player1:   st.player1 || st.teamname,
            player2:   st.player2 || '',
            player3:   st.player3 || '',
            player4:   st.player4 || '',
            category:  st.category || '',
            hdcp:      st.hdcp || 0,
            ventaja:   st.ventaja || 0,
            hole:      st.hole || null
        }));

    if (toInsert.length === 0) {
        document.getElementById('import-teams-modal')?.remove();
        _showNotificationRef('Aviso', 'Todos los jugadores de ese torneo ya están registrados aquí.', 'info');
        return;
    }

    const { error: insErr } = await supabaseTarget.from('teams').insert(toInsert);
    document.getElementById('import-teams-modal')?.remove();
    if (insErr) {
        _showNotificationRef('Error', insErr.message, 'error');
    } else {
        _showNotificationRef('¡Jugadores Importados!', `Se copiaron ${toInsert.length} jugadores exitosamente.`, 'success');
        setSection('teams');
    }
};

function updateConfigSubtitleSummary() {
    const sub = document.getElementById('cfg-subtitle-summary');
    if (sub) {
        const mod = window._currentModalidad || currentTournamentConfig?.modalidad || 'STROKE PLAY (INDIVIDUAL)';
        const count = (window._currentCategories || []).length;
        sub.textContent = `${mod} · ${count} Cat.`;
    }
}

function refreshRegCatDropdown() {
    const sel = document.getElementById('reg-cat');
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = `<option value="">Selecciona Categoría...</option>${window._currentCategories.map(c => {
        const n   = typeof c === 'object' ? c.name : c;
        const pct = typeof c === 'object' ? (c.pct || 100) : 100;
        const fmt = (typeof c === 'object' && c.format === 'STABLEFORD') ? ' · ⭐ STABLEFORD' : '';
        return `<option value="${n}" ${n === cur ? 'selected' : ''}>${n} (${pct}%${fmt})</option>`;
    }).join('')}`;
    updateConfigSubtitleSummary();
}

window.addCategoryToConfig = async function() {
    const nameEl   = document.getElementById('new-cat-name');
    const pctEl    = document.getElementById('new-cat-pct');
    const formatEl = document.getElementById('new-cat-format');
    const name     = nameEl?.value.trim().toUpperCase();
    const pct      = parseInt(pctEl?.value || '80') || 80;
    const format   = formatEl?.value || 'STROKE';
    if (!name) return;
    const exists = window._currentCategories.some(c => (typeof c === 'object' ? c.name : c) === name);
    if (exists) {
        _showNotificationRef('Categoría existente', `La categoría "${name}" ya existe.`, 'info');
        return;
    }
    window._currentCategories.push({ name, pct, format });
    if (nameEl) nameEl.value = '';
    if (pctEl) pctEl.value = '80';
    if (formatEl) formatEl.value = 'STROKE';
    refreshCatTags();
    refreshRegCatDropdown();
    const err = await saveConfig();
    if (err) _showNotificationRef('Error guardando', err.message, 'error');
    else _showNotificationRef('Categoría Creada', `Categoría "${name}" (${pct}% · ${format === 'STABLEFORD' ? 'Stableford' : 'Stroke Play'}) agregada.`, 'success');
};

window.removeCatFromConfig = async function(catName) {
    window._currentCategories = window._currentCategories.filter(c => (typeof c === 'object' ? c.name : c) !== catName);
    refreshCatTags();
    refreshRegCatDropdown();
    await saveConfig();
};

window.openEditCategoryModal = function(catName) {
    const catObj = (window._currentCategories || []).find(c => (typeof c === 'object' ? c.name : c) === catName);
    if (!catObj) return;
    const name   = typeof catObj === 'object' ? catObj.name : catObj;
    const pct    = typeof catObj === 'object' ? (catObj.pct || 100) : 100;
    const format = (typeof catObj === 'object' && catObj.format) ? catObj.format : 'STROKE';

    const oldEl    = document.getElementById('edit-cat-old-name');
    const nameEl   = document.getElementById('edit-cat-new-name');
    const pctEl    = document.getElementById('edit-cat-new-pct');
    const formatEl = document.getElementById('edit-cat-new-format');

    if (oldEl) oldEl.value = name;
    if (nameEl) nameEl.value = name;
    if (pctEl) pctEl.value = pct;
    if (formatEl) formatEl.value = format;

    const modal = document.getElementById('edit-cat-modal');
    if (modal) modal.classList.remove('hidden');
};

window.closeEditCatModal = function() {
    const modal = document.getElementById('edit-cat-modal');
    if (modal) modal.classList.add('hidden');
};

window.saveEditCategory = async function() {
    const oldName   = document.getElementById('edit-cat-old-name')?.value || '';
    const newName   = document.getElementById('edit-cat-new-name')?.value.trim().toUpperCase();
    const newPct    = parseInt(document.getElementById('edit-cat-new-pct')?.value || '100') || 100;
    const newFormat = document.getElementById('edit-cat-new-format')?.value || 'STROKE';

    if (!newName) {
        _showNotificationRef('Nombre Requerido', 'Ingresa un nombre para la categoría.', 'error');
        return;
    }

    const idx = (window._currentCategories || []).findIndex(c => (typeof c === 'object' ? c.name : c) === oldName);
    if (idx === -1) return;

    window._currentCategories[idx] = { name: newName, pct: newPct, format: newFormat };

    closeEditCatModal();
    refreshCatTags();
    refreshRegCatDropdown();
    await saveConfig();

    // Cascade update all existing teams in this category
    const { data: affectedTeams, error: fetchErr } = await supabaseTarget
        .from('teams')
        .select('*')
        .eq('eventid', String(currentTournamentID))
        .eq('category', oldName.toUpperCase());

    if (!fetchErr && affectedTeams && affectedTeams.length > 0) {
        for (const t of affectedTeams) {
            const hdcp = t.hdcp || 0;
            const newVentaja = Math.round(hdcp * newPct / 100);
            await supabaseTarget
                .from('teams')
                .update({ category: newName.toUpperCase(), ventaja: newVentaja })
                .eq('id', t.id);
        }
    }

    _showNotificationRef('Categoría Actualizada', `Categoría "${newName}" (${newPct}% · ${newFormat === 'STABLEFORD' ? 'Stableford' : 'Stroke Play'}) guardada.`, 'success');

    // Refresh teams section to reflect new category names and calculated ventajas
    setSection('teams');
};

window.updateTeamSize = async function(n) {
    window._currentTeamSize = n;
    [1,2,3,4].forEach(i => {
        const btn = document.getElementById(`ts-btn-${i}`);
        if (!btn) return;
        if (i === n) {
            btn.className = btn.className.replace('bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300', 'bg-slate-900 border-white text-white shadow-inner');
        } else {
            btn.className = btn.className.replace('bg-slate-900 border-white text-white shadow-inner', 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300');
        }
    });
    await saveConfig();
};

window.updateModalidad = async function(val) {
    window._currentModalidad = val;
    updateConfigSubtitleSummary();
    await saveConfig();
};

function refreshCatTags() {
    const el = document.getElementById('cat-tags');
    if (el) el.innerHTML = window._currentCategories.map(c => renderCatTag(c)).join('');
}

// --- Register team ---
async function doRegisterTeam(teamSize) {
    const p1 = document.getElementById('reg-p1')?.value.trim();
    if (!p1) { _showNotificationRef('Campo requerido', 'El nombre del jugador 1 es obligatorio.', 'error'); return; }

    const p2 = teamSize >= 2 ? (document.getElementById('reg-p2')?.value.trim() || '') : '';
    const p3 = teamSize >= 3 ? (document.getElementById('reg-p3')?.value.trim() || '') : '';
    const p4 = teamSize >= 4 ? (document.getElementById('reg-p4')?.value.trim() || '') : '';

    const catEl   = document.getElementById('reg-cat');
    const catName = catEl ? catEl.value : '';

    let playerIndex = 0;
    let teeColor    = 'BLANCA';
    let hdcp        = 0;

    if (window._regHdcpMode === 'index') {
        playerIndex = parseFloat(document.getElementById('reg-index')?.value || '0') || 0;
        teeColor    = document.getElementById('reg-tee')?.value || 'BLANCA';
        hdcp        = window.calculateCourseHdcp(playerIndex, teeColor);
    } else {
        hdcp = parseInt(document.getElementById('reg-hdcp')?.value || '0') || 0;
    }

    const catObj  = window._currentCategories.find(c => (typeof c === 'object' ? c.name : c) === catName);
    const pct     = catObj && typeof catObj === 'object' ? (catObj.pct || 100) : 100;
    const ventaja = Math.round(hdcp * pct / 100);
    const hole    = null;

    const teamName = teamSize === 1 ? p1 : [p1, p2, p3, p4].filter(Boolean).join(' / ');

    const payload = {
        eventid:      String(currentTournamentID),
        teamname:     teamName.toUpperCase(),
        player1:      p1.toUpperCase(),
        player2:      p2.toUpperCase(),
        player3:      p3.toUpperCase(),
        player4:      p4.toUpperCase(),
        category:     catName.toUpperCase(),
        hdcp,
        ventaja,
        hole,
        player_index: playerIndex,
        tee_color:    teeColor
    };

    let { error } = await supabaseTarget.from('teams').insert([payload]);

    if (error) {
        // Fallback without player_index/tee_color if columns not present yet
        delete payload.player_index;
        delete payload.tee_color;
        ({ error } = await supabaseTarget.from('teams').insert([payload]));
    }

    if (error) {
        _showNotificationRef('Error', error.message, 'error');
    } else {
        _showNotificationRef('¡Registrado!', `${teamName} se ha registrado correctamente.`, 'success');

        // Clear input form
        ['reg-p1', 'reg-p2', 'reg-p3', 'reg-p4', 'reg-index', 'reg-hdcp', 'reg-hdcp-calc'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        const vPreview = document.getElementById('ventaja-preview');
        if (vPreview) vPreview.classList.add('hidden');

        // Keep configuration collapsed so registration form stays at the very top
        window._cfgCollapsed = true;

        // Immediately refresh team list section
        await setSection('teams');

        // Focus directly on the first player input for fast consecutive registrations
        setTimeout(() => {
            document.getElementById('reg-p1')?.focus();
        }, 100);
    }
}

async function deleteTeamById(id, name) {
    _showNotificationRef('Eliminar Registro', `¿Eliminar a "${name}"?`, 'confirm', async () => {
        await supabaseTarget.from('teams').delete().eq('id', id);
        setSection('teams');
    });
}

function filterTeams(query) {
    const q = query.toLowerCase();
    document.querySelectorAll('#teams-inner > div[data-team-name]').forEach(card => {
        const n = card.dataset.teamName || '';
        card.style.display = n.includes(q) ? '' : 'none';
    });
}

function printTeamsList() {
    const teams = window._teamsData || [];
    if (!teams.length) return;

    // Always sort by hole for shotgun print priority
    let sorted = [...teams];
    sorted.sort((a,b) => (a.hole||99) - (b.hole||99));

    const tournamentName = currentTournamentName || 'TORNEO DE GOLF';
    const courseName     = (currentTournamentCourses && currentTournamentCourses.length) ? currentTournamentCourses.join(' / ') : 'CLUB DE GOLF COLIMA';
    const now            = new Date().toLocaleString('es-MX', { dateStyle:'short', timeStyle:'short' });

    const origin = window.location.origin;
    const logoLeftUrl  = `${origin}/golcolima.jpg`;
    const logoRightUrl = `${origin}/logoclub.png`;

    // Group teams by hole
    const byHole = {};
    sorted.forEach(t => {
        const h = t.hole ? t.hole : 'Sin Hoyo';
        if (!byHole[h]) byHole[h] = [];
        byHole[h].push(t);
    });

    const holeKeys = Object.keys(byHole).sort((a,b) => {
        if (a === 'Sin Hoyo') return 1;
        if (b === 'Sin Hoyo') return -1;
        return parseInt(a) - parseInt(b);
    });

    let rowsHtml = '';
    holeKeys.forEach(hKey => {
        const group = byHole[hKey];
        const holeLabel = hKey === 'Sin Hoyo' ? 'SIN HOYO' : `HOYO ${hKey}`;

        for (let i = 0; i < group.length; i += 2) {
            const left  = group[i];
            const right = group[i+1];

            const leftPlayers  = [left.player1, left.player2, left.player3, left.player4].filter(Boolean).join(', ');
            const rightPlayers = right ? [right.player1, right.player2, right.player3, right.player4].filter(Boolean).join(', ') : '';

            rowsHtml += `
            <tr class="shotgun-row">
                <td class="box-td">
                    <div class="square-box">${left.ventaja || 0}</div>
                </td>
                <td class="hdcp-td">${left.hdcp || 0}</td>
                <td class="team-td left-align">
                    <div class="team-title">EQUIPO #${sorted.indexOf(left) + 1}</div>
                    <div class="team-name">${left.teamname} (${left.hdcp || 0})</div>
                    ${leftPlayers && leftPlayers !== left.teamname ? `<div class="player-sub">${leftPlayers}</div>` : ''}
                </td>
                <td class="hole-td">${holeLabel}</td>
                <td class="team-td right-align">
                    ${right ? `
                        <div class="team-title">EQUIPO #${sorted.indexOf(right) + 1}</div>
                        <div class="team-name">${right.teamname} (${right.hdcp || 0})</div>
                        ${rightPlayers && rightPlayers !== right.teamname ? `<div class="player-sub">${rightPlayers}</div>` : ''}
                    ` : '<div class="empty-slot">—</div>'}
                </td>
                <td class="hdcp-td">${right ? (right.hdcp || 0) : '—'}</td>
                <td class="box-td">
                    <div class="square-box">${right ? (right.ventaja || 0) : '—'}</div>
                </td>
            </tr>`;
        }
    });

    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>${courseName} — LAYOUT DE SALIDAS (SHOTGUN)</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #fff; color: #000; padding: 20px 28px; }

        .header-top { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px; }
        .logo-area { display: flex; align-items: center; gap: 12px; }
        .logo-img { height: 50px; width: auto; object-fit: contain; }
        
        .header-info { text-align: right; }
        .course-title { font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; margin: 0; color: #000; }
        .shotgun-subtitle { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #000; margin-top: 2px; }

        .thick-line { border-bottom: 3.5px solid #000; margin-top: 6px; margin-bottom: 14px; }

        table.shotgun-table th { font-size: 8px; font-weight: 900; color: #666; text-transform: uppercase; padding: 0 4px 6px 4px; letter-spacing: 0.5px; }
        .box-th { width: 44px; text-align: center; }
        .hdcp-th { width: 32px; text-align: center; }
        .hole-th { width: 95px; text-align: center; }

        .box-td { width: 44px; text-align: center; }
        .square-box { width: 32px; height: 32px; border: 2px solid #000; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; font-size: 13px; color: #000; }

        .hdcp-td { width: 32px; text-align: center; font-weight: 900; font-size: 12px; color: #000; }

        .team-td { padding: 4px 10px !important; width: 38%; }
        .left-align { text-align: left; }
        .right-align { text-align: right; }

        .team-title { font-size: 10px; font-weight: 900; color: #000; text-transform: uppercase; }
        .team-name { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #000; margin-top: 1px; }
        .player-sub { font-size: 9px; font-weight: 500; color: #555; }
        .empty-slot { font-size: 11px; color: #ccc; font-style: italic; }

        .hole-td { text-align: center; font-weight: 900; font-size: 12px; color: #777; text-transform: uppercase; width: 95px; letter-spacing: 0.5px; white-space: nowrap; }

        @media print {
            body { padding: 10px 16px; }
            .logo-img { height: 45px; }
        }
    </style>
    </head><body>
    <div class="header-top">
        <div class="logo-area">
            <img src="${logoLeftUrl}" class="logo-img" alt="Logo Campo" onerror="this.style.display='none'" />
            <img src="${logoRightUrl}" class="logo-img" alt="Logo Asociación" onerror="this.style.display='none'" />
        </div>
        <div class="header-info">
            <h1 class="course-title">${courseName.toUpperCase()}</h1>
            <div class="shotgun-subtitle">LAYOUT DE SALIDAS (SHOTGUN)</div>
        </div>
    </div>
    <div class="thick-line"></div>

    <table class="shotgun-table">
        <thead>
            <tr>
                <th class="box-th">VTJ</th>
                <th class="hdcp-th">HCP</th>
                <th class="team-td left-align">PARTICIPANTE / EQUIPO</th>
                <th class="hole-th">SALIDA</th>
                <th class="team-th right-align">PARTICIPANTE / EQUIPO</th>
                <th class="hdcp-th">HCP</th>
                <th class="box-th">VTJ</th>
            </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
    </table>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 600);
}

// Hole data for Club de Golf Colima (matching Scorecard photo)
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

// Helpers para Torneos Multidía (1 a 4 Días)
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
    const cfg = configObj || currentTournamentConfig || {};
    const lbl = cfg.dayLabels && cfg.dayLabels[dayNum - 1];
    if (lbl && String(lbl).trim()) return String(lbl).trim().toUpperCase();
    return `DÍA ${dayNum}`;
}

// ================================================
// CÁLCULO DE PUNTOS STABLEFORD HOYO POR HOYO
// ================================================
// Tabla Oficial Stableford Neto (con ventaja al 80%):
// Doble Bogey Neto o más (+2 o más): 0 pts
// Bogey Neto (+1):                   1 pt
// Par Neto (0):                      2 pts
// Birdie Neto (-1):                  3 pts
// Eagle Neto (-2):                   4 pts
// Albatros Neto (-3 o mejor):        5 pts
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

async function renderScores(content, courses) {
    const [teamsRes, scoresRes] = await Promise.all([
        supabaseTarget.from('teams').select('*').eq('eventid', String(currentTournamentID)).order('hole'),
        supabaseTarget.from('scores').select('*').eq('eventid', String(currentTournamentID)).order('created_at', { ascending: false })
    ]);
    const teams  = teamsRes.data  || [];
    const scores = scoresRes.data || [];

    const totalDays = Math.max(1, parseInt(currentTournamentConfig?.totalDays || 1));
    if (!window._activeScoreDay || window._activeScoreDay > totalDays || window._activeScoreDay < 1) {
        window._activeScoreDay = 1;
    }
    const activeDay = window._activeScoreDay;

    window._scoresTeamsList   = teams;
    window._scoresList        = scores;
    if (!window._selectedScoreTeam || !teams.some(t => String(t.id) === String(window._selectedScoreTeam.id))) {
        window._selectedScoreTeam = teams[0] || null;
    }
    window._currentHoleScores = {};
    if (!window._mobileScoreView) {
        window._mobileScoreView = 'list';
    }
    if (!window._scoreStatusFilter) {
        window._scoreStatusFilter = 'all';
    }

    const hasScoreOnActiveDay = (teamId) => scores.some(s => String(s.teamid) === String(teamId) && getScoreDay(s) === activeDay);

    const pendingTeams  = teams.filter(t => !hasScoreOnActiveDay(t.id));
    const capturedTeams = teams.filter(t =>  hasScoreOnActiveDay(t.id));

    const renderScoreCardItem = (t, hasScore) => {
        const isSelected = window._selectedScoreTeam?.id === t.id;
        const players = [t.player1, t.player2, t.player3, t.player4].filter(Boolean);
        const name = t.teamname || players[0] || '—';

        // Resumen por día cuando el torneo es de 2+ días
        let multiDayPills = '';
        if (totalDays > 1) {
            const pills = Array.from({ length: totalDays }, (_, idx) => {
                const dNum = idx + 1;
                const sc = scores.find(s => String(s.teamid) === String(t.id) && getScoreDay(s) === dNum);
                const g = sc ? (sc.gross || sc.total || 0) : null;
                const isCur = dNum === activeDay;
                return `<span class="px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase border ${
                    g ? (isCur ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30')
                      : (isCur ? 'bg-amber-500/20 text-amber-300 border-amber-400/50' : 'bg-slate-900/70 text-slate-500 border-slate-700/60')
                }">D${dNum}: ${g || '--'}</span>`;
            }).join('');
            multiDayPills = `<div class="flex flex-wrap gap-1 mt-1.5">${pills}</div>`;
        }

        return `
        <div onclick="selectTeamForScorecard('${t.id}')" id="player-card-${t.id}" data-player-search="${name.toLowerCase()}" data-player-status="${hasScore ? 'captured' : 'pending'}"
            class="p-3.5 sm:p-3 rounded-2xl border transition-all cursor-pointer active:scale-[0.99] ${isSelected ? 'bg-primary/15 border-primary shadow-lg shadow-primary/10' : (hasScore ? 'bg-slate-800/40 border-slate-700/40 hover:border-slate-600' : 'bg-slate-800/90 border-slate-700/80 hover:border-primary/50')}">
            <div class="flex items-center justify-between gap-3">
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                        <p class="font-black text-white uppercase text-xs sm:text-sm truncate">${name}</p>
                        ${t.hole ? `<span class="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[8px] font-black px-1.5 py-0.5 rounded">🚩 ${t.hole}</span>` : ''}
                    </div>
                    <div class="flex items-center gap-2 mt-1">
                        ${t.category ? `<span class="px-2 py-0.5 bg-primary/15 text-primary border border-primary/30 rounded-full text-[9px] font-black uppercase">${t.category}</span>` : ''}
                        <span class="text-[10px] text-slate-400 font-bold">Ventaja: ${t.ventaja || 0} gls</span>
                    </div>
                    ${multiDayPills}
                </div>
                <div class="shrink-0 flex items-center gap-2">
                    ${hasScore 
                        ? `<span class="px-2.5 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-[10px] font-black uppercase flex items-center gap-1"><span class="material-icons" style="font-size:13px">check_circle</span> ${totalDays > 1 ? `D${activeDay} Listo` : 'Capturado'}</span>` 
                        : `<span class="px-2.5 py-1.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-xl text-[10px] font-black uppercase flex items-center gap-1"><span class="material-icons" style="font-size:13px">edit</span> ${totalDays > 1 ? `Capturar D${activeDay}` : 'Capturar'}</span>`}
                    <span class="material-icons text-slate-600 lg:hidden text-base">chevron_right</span>
                </div>
            </div>
        </div>`;
    };

    const daySelectorBar = totalDays > 1 ? `
        <div class="bg-slate-900 border border-emerald-500/30 rounded-2xl p-3 sm:p-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-emerald-500/5">
            <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <span class="material-icons" style="font-size:18px">calendar_month</span>
                </div>
                <div>
                    <p class="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Captura por Día · Torneo de ${totalDays} Días</p>
                    <p class="text-xs font-bold text-slate-300">Selecciona el día para capturar o editar las tarjetas correspondientes:</p>
                </div>
            </div>
            <div class="grid grid-cols-2 sm:flex items-center gap-2">
                ${Array.from({ length: totalDays }, (_, idx) => {
                    const dNum = idx + 1;
                    const lbl = getDayLabel(dNum, currentTournamentConfig);
                    const countDay = teams.filter(t => scores.some(s => String(s.teamid) === String(t.id) && getScoreDay(s) === dNum)).length;
                    const isAct = dNum === activeDay;
                    return `
                    <button type="button" onclick="setActiveScoreDay(${dNum})"
                        class="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border cursor-pointer
                        ${isAct
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}">
                        <span>${lbl}</span>
                        <span class="px-1.5 py-0.5 rounded-full text-[9px] ${isAct ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-900 text-slate-400'}">${countDay}/${teams.length}</span>
                    </button>`;
                }).join('')}
            </div>
        </div>
    ` : '';

    content.innerHTML = `
        ${daySelectorBar}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[calc(100vh-180px)] lg:min-h-[600px]">

            <!-- ====== PANEL IZQUIERDO: SELECCIÓN DE JUGADOR ====== -->
            <div id="scores-players-panel" class="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 overflow-hidden ${window._mobileScoreView === 'card' ? 'hidden lg:flex' : 'flex'}">
                <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div class="flex items-center gap-2">
                        <span class="material-icons text-primary" style="font-size:20px">sports_golf</span>
                        <h3 class="font-black text-white uppercase tracking-widest text-xs sm:text-sm">Seleccionar Jugador</h3>
                    </div>
                    <span class="text-xs font-black text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">${teams.length} Registrados</span>
                </div>

                <!-- Buscador con ícono -->
                <div class="relative">
                    <input id="score-player-search" placeholder="BUSCAR JUGADOR O EQUIPO..." onkeyup="filterScorePlayers(this.value)"
                        class="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-base sm:text-xs font-bold uppercase placeholder:text-slate-500 focus:outline-none focus:border-primary transition-all">
                    <span class="material-icons absolute left-3 top-3 text-slate-500" style="font-size:18px">search</span>
                </div>

                <!-- Filtros rápidos de estado -->
                <div class="flex gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60">
                    <button type="button" onclick="filterScoreStatus('all')" id="filter-score-all"
                        class="flex-1 py-2 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all ${window._scoreStatusFilter === 'all' ? 'bg-primary text-slate-900 font-black shadow-sm' : 'text-slate-400 hover:bg-slate-700'}">
                        Todos (${teams.length})
                    </button>
                    <button type="button" onclick="filterScoreStatus('pending')" id="filter-score-pending"
                        class="flex-1 py-2 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all ${window._scoreStatusFilter === 'pending' ? 'bg-amber-500 text-slate-900 font-black shadow-sm' : 'text-amber-400 hover:bg-slate-700'}">
                        ⏳ Faltan (${pendingTeams.length})
                    </button>
                    <button type="button" onclick="filterScoreStatus('captured')" id="filter-score-captured"
                        class="flex-1 py-2 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all ${window._scoreStatusFilter === 'captured' ? 'bg-emerald-500 text-slate-900 font-black shadow-sm' : 'text-emerald-400 hover:bg-slate-700'}">
                        ✓ Listos (${capturedTeams.length})
                    </button>
                </div>

                <!-- Lista de Jugadores / Equipos Ordenada -->
                <div id="score-players-list" class="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[350px]">
                    ${teams.length === 0
                        ? `<div class="py-16 text-center text-slate-500 font-black uppercase tracking-widest text-xs">Sin participantes registrados aún.</div>`
                        : `
                            ${pendingTeams.length > 0 ? `
                                <div class="text-[9px] font-black uppercase text-amber-400 tracking-widest pt-1 pb-1 flex items-center gap-1.5">
                                    <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span> Faltan por Capturar (${pendingTeams.length})
                                </div>
                                ${pendingTeams.map(t => renderScoreCardItem(t, false)).join('')}
                            ` : ''}

                            ${capturedTeams.length > 0 ? `
                                ${pendingTeams.length > 0 ? `
                                    <div class="relative py-3 flex items-center">
                                        <div class="flex-grow border-t border-slate-700/80"></div>
                                        <span class="flex-shrink mx-2 text-[9px] font-black uppercase text-slate-400 tracking-widest bg-slate-900 px-2.5 py-0.5 border border-slate-800 rounded-full flex items-center gap-1">
                                            <span class="material-icons text-emerald-400" style="font-size:12px">check_circle</span> CAPTURADOS (${capturedTeams.length})
                                        </span>
                                        <div class="flex-grow border-t border-slate-700/80"></div>
                                    </div>
                                ` : `
                                    <div class="text-[9px] font-black uppercase text-emerald-400 tracking-widest pt-1 pb-1 flex items-center gap-1.5">
                                        <span class="material-icons text-emerald-400" style="font-size:12px">check_circle</span> Capturados (${capturedTeams.length})
                                    </div>
                                `}
                                ${capturedTeams.map(t => renderScoreCardItem(t, true)).join('')}
                            ` : ''}
                        `}
                </div>
            </div>

            <!-- ====== PANEL DERECHO: SCORECARD INTERACTIVO ====== -->
            <div id="scores-card-panel" class="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden ${window._mobileScoreView === 'card' ? 'flex' : 'hidden lg:flex'}">
                <div id="scorecard-wrapper" class="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto space-y-5">
                    <!-- Poblado por selectTeamForScorecard -->
                </div>
            </div>
        </div>`;

    window.setMobileScoreView = (view) => {
        window._mobileScoreView = view;
        const playersPanel = document.getElementById('scores-players-panel');
        const scorecardPanel = document.getElementById('scores-card-panel');
        if (!playersPanel || !scorecardPanel) return;

        if (window.innerWidth < 1024) {
            if (view === 'list') {
                playersPanel.classList.remove('hidden');
                playersPanel.classList.add('flex');
                scorecardPanel.classList.add('hidden');
                scorecardPanel.classList.remove('flex');
            } else {
                playersPanel.classList.add('hidden');
                playersPanel.classList.remove('flex');
                scorecardPanel.classList.remove('hidden');
                scorecardPanel.classList.add('flex');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } else {
            playersPanel.classList.remove('hidden');
            playersPanel.classList.add('flex');
            scorecardPanel.classList.remove('hidden');
            scorecardPanel.classList.add('flex');
        }
    };

    window.filterScoreStatus = (status) => {
        window._scoreStatusFilter = status;
        const btnAll = document.getElementById('filter-score-all');
        const btnPend = document.getElementById('filter-score-pending');
        const btnCapt = document.getElementById('filter-score-captured');
        [btnAll, btnPend, btnCapt].forEach(b => {
            if (b) b.className = 'flex-1 py-2 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all text-slate-400 hover:bg-slate-700';
        });
        if (status === 'all' && btnAll) btnAll.className = 'flex-1 py-2 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all bg-primary text-slate-900 shadow-sm';
        if (status === 'pending' && btnPend) btnPend.className = 'flex-1 py-2 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all bg-amber-500 text-slate-900 shadow-sm';
        if (status === 'captured' && btnCapt) btnCapt.className = 'flex-1 py-2 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all bg-emerald-500 text-slate-900 shadow-sm';

        const q = (document.getElementById('score-player-search')?.value || '').toLowerCase();
        document.querySelectorAll('#score-players-list div[data-player-search]').forEach(card => {
            const n = card.dataset.playerSearch || '';
            const st = card.dataset.playerStatus || '';
            const matchesText = n.includes(q);
            const matchesStatus = (status === 'all') || (st === status);
            card.style.display = (matchesText && matchesStatus) ? '' : 'none';
        });
    };

    window.filterScorePlayers = (query) => {
        const q = query.toLowerCase();
        const status = window._scoreStatusFilter || 'all';
        document.querySelectorAll('#score-players-list div[data-player-search]').forEach(card => {
            const n = card.dataset.playerSearch || '';
            const st = card.dataset.playerStatus || '';
            const matchesText = n.includes(q);
            const matchesStatus = (status === 'all') || (st === status);
            card.style.display = (matchesText && matchesStatus) ? '' : 'none';
        });
    };

    window.setActiveScoreDay = (dayNum) => {
        window._activeScoreDay = parseInt(dayNum) || 1;
        setSection('scores');
    };

    window.selectTeamForScorecard = (teamId) => {
        const teams = window._scoresTeamsList || [];
        const scores = window._scoresList || [];
        const team = teams.find(t => String(t.id) === String(teamId));
        if (!team) return;

        window._selectedScoreTeam = team;
        const curDay = window._activeScoreDay || 1;

        teams.forEach(t => {
            const el = document.getElementById(`player-card-${t.id}`);
            if (!el) return;
            const hasScore = scores.some(s => String(s.teamid) === String(t.id) && getScoreDay(s) === curDay);
            if (t.id === team.id) {
                el.className = 'p-3.5 sm:p-3 rounded-2xl border transition-all cursor-pointer active:scale-[0.99] bg-primary/15 border-primary shadow-lg shadow-primary/10';
            } else {
                el.className = `p-3.5 sm:p-3 rounded-2xl border transition-all cursor-pointer active:scale-[0.99] ${hasScore ? 'bg-slate-800/40 border-slate-700/40 hover:border-slate-600' : 'bg-slate-800/90 border-slate-700/80 hover:border-primary/50'}`;
            }
        });

        const existingScore = scores.find(s => String(s.teamid) === String(team.id) && getScoreDay(s) === curDay);
        let holeScores = {};
        if (existingScore && existingScore.hole_scores) {
            try {
                holeScores = typeof existingScore.hole_scores === 'string'
                    ? JSON.parse(existingScore.hole_scores)
                    : { ...existingScore.hole_scores };
            } catch(e) { holeScores = {}; }
        }
        window._currentHoleScores = holeScores;

        renderScorecardBody(team, existingScore);

        if (window.innerWidth < 1024) {
            window.setMobileScoreView('card');
        }
    };

    window.deleteScorecardForDay = (scoreId, dayLabel, teamName) => {
        if (!scoreId) return;
        _showNotificationRef('Eliminar Tarjeta', `¿Eliminar la tarjeta de ${dayLabel} para ${teamName}?`, 'confirm', async () => {
            await supabaseTarget.from('scores').delete().eq('id', scoreId);
            _showNotificationRef('Tarjeta Eliminada', `Se eliminó el registro de ${dayLabel}.`, 'success');
            setSection('scores');
        });
    };

    window.handleHoleKeyDown = (e, holeNum) => {
        const allowedControlKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter'];
        if (allowedControlKeys.includes(e.key)) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const nextEl = document.getElementById(`score-h${holeNum + 1}`);
                if (nextEl) { nextEl.focus(); nextEl.select(); }
            }
            return;
        }

        const isDigit = /^[0-9]$/.test(e.key);
        if (!isDigit) {
            e.preventDefault();
            _showNotificationRef('Solo Números', 'Solo se permiten dígitos numéricos (1-15) para los scores de cada hoyo.', 'error');
        }
    };

    window.onHoleInput = (holeNum, inputEl) => {
        const val = typeof inputEl === 'object' ? inputEl.value : String(inputEl);
        if (!window._currentHoleScores) window._currentHoleScores = {};
        const n = parseInt(val);
        if (!isNaN(n) && n > 0 && n <= 20) {
            window._currentHoleScores[`h${holeNum}`] = n;
        } else {
            delete window._currentHoleScores[`h${holeNum}`];
        }
        recalcScorecardTotals();

        // Auto-advance to next hole input
        if (val.length === 1 && val >= '2' && val <= '9') {
            const nextEl = document.getElementById(`score-h${holeNum + 1}`);
            if (nextEl) {
                setTimeout(() => { nextEl.focus(); nextEl.select(); }, 40);
            }
        } else if (val.length >= 2) {
            const nextEl = document.getElementById(`score-h${holeNum + 1}`);
            if (nextEl) {
                setTimeout(() => { nextEl.focus(); nextEl.select(); }, 40);
            }
        }
    };

    window.saveScorecard = async () => {
        if (window._isSavingScorecard) return;

        const team = window._selectedScoreTeam;
        if (!team) {
            _showNotificationRef('Selecciona un jugador', 'Debes seleccionar un jugador de la lista.', 'error');
            return;
        }

        const curDay = window._activeScoreDay || 1;
        const tDays = Math.max(1, parseInt(currentTournamentConfig?.totalDays || 1));
        const dayLabel = getDayLabel(curDay, currentTournamentConfig);

        const scores = { ...(window._currentHoleScores || {}) };
        let outSum = 0; for (let i = 1; i <= 9; i++)  { const v = parseInt(scores[`h${i}`]); if (!isNaN(v) && v > 0) outSum += v; }
        let inSum  = 0; for (let i = 10; i <= 18; i++) { const v = parseInt(scores[`h${i}`]); if (!isNaN(v) && v > 0) inSum += v; }
        const gross = outSum + inSum;
        const net   = gross > 0 ? (gross - (team.ventaja || 0)) : 0;

        if (gross === 0) {
            _showNotificationRef('Scorecard vacía', 'Ingresa al menos un score en algún hoyo.', 'error');
            return;
        }

        scores._day = curDay;
        scores._dayLabel = dayLabel;
        scores._stableford = calcCardStablefordPoints(scores, gross, team.ventaja || 0);

        const btn = document.getElementById('btn-save-scorecard');
        if (btn) {
            btn.disabled = true;
            btn.classList.add('opacity-50', 'pointer-events-none');
            btn.innerHTML = `<span class="material-icons animate-spin" style="font-size:18px">sync</span> Guardando...`;
        }
        window._isSavingScorecard = true;

        try {
            // Check memory first for this specific day, then check database directly
            let existing = (window._scoresList || []).find(s => String(s.teamid) === String(team.id) && getScoreDay(s) === curDay);
            if (!existing) {
                const { data: dbExisting } = await supabaseTarget.from('scores')
                    .select('*')
                    .eq('eventid', String(currentTournamentID))
                    .eq('teamid', String(team.id));
                if (dbExisting && dbExisting.length > 0) {
                    existing = dbExisting.find(s => getScoreDay(s) === curDay) || (tDays === 1 ? dbExisting[0] : null);
                }
            }

            const courseField = tDays > 1
                ? (dayLabel.toUpperCase().includes('DÍA') || dayLabel.toUpperCase().includes('DIA') ? dayLabel : `DÍA ${curDay} · ${dayLabel}`)
                : ((currentTournamentCourses && currentTournamentCourses.length) ? currentTournamentCourses[0] : 'CLUB DE GOLF COLIMA');

            const payload = {
                eventid:     String(currentTournamentID),
                teamid:      team.id,
                coursename:  courseField,
                total:       gross,
                gross:       gross,
                net:         net,
                out_score:   outSum,
                in_score:    inSum,
                hole_scores: JSON.stringify(scores)
            };

            let error;
            if (existing) {
                ({ error } = await supabaseTarget.from('scores').update(payload).eq('id', existing.id));
            } else {
                ({ error } = await supabaseTarget.from('scores').insert([payload]));
            }

            if (error) {
                // Retry without coursename if column not present in schema
                delete payload.coursename;
                if (existing) {
                    ({ error } = await supabaseTarget.from('scores').update(payload).eq('id', existing.id));
                } else {
                    ({ error } = await supabaseTarget.from('scores').insert([payload]));
                }
            }

            if (error) {
                // Fallback if detailed columns do not exist yet in DB table
                console.warn('Fallback insert without hole_scores column:', error.message);
                const simplePayload = { eventid: String(currentTournamentID), teamid: team.id, total: gross };
                if (existing) {
                    ({ error } = await supabaseTarget.from('scores').update(simplePayload).eq('id', existing.id));
                } else {
                    ({ error } = await supabaseTarget.from('scores').insert([simplePayload]));
                }
            }

            if (error) {
                _showNotificationRef('Error', error.message, 'error');
                if (btn) {
                    btn.disabled = false;
                    btn.classList.remove('opacity-50', 'pointer-events-none');
                    btn.innerHTML = `<span class="material-icons" style="font-size:18px">save</span> Guardar Scorecard`;
                }
            } else {
                // Auto-sync a WHS si es torneo individual o modalidad stroke individual
                try {
                    const isIndividual = (window._currentTeamSize === 1) || (window._currentModalidad && (window._currentModalidad.includes('INDIVIDUAL') || window._currentModalidad.includes('STROKE')));
                    if (isIndividual && gross > 0) {
                        await syncTournamentScoreToWHS(team, gross, scores);
                    }
                } catch (e) {
                    console.warn('WHS auto-sync notice:', e);
                }

                _showNotificationRef('¡Scorecard Guardado!', `Scorecard de ${team.teamname} (${tDays > 1 ? dayLabel : 'Torneo'}) guardado (Gross: ${gross}, Neto: ${net}).`, 'success');
                setTimeout(() => setSection('scores'), 700);
            }
        } catch (err) {
            console.error('Error saving scorecard:', err);
            _showNotificationRef('Error', err.message || 'Error inesperado', 'error');
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('opacity-50', 'pointer-events-none');
                btn.innerHTML = `<span class="material-icons" style="font-size:18px">save</span> Guardar Scorecard`;
            }
        } finally {
            window._isSavingScorecard = false;
        }
    };

    // Preserve previously selected team if still valid, else auto-select first pending team
    const preferredTeam = (window._selectedScoreTeam && teams.some(t => String(t.id) === String(window._selectedScoreTeam.id)))
        ? window._selectedScoreTeam
        : (pendingTeams.length > 0 ? pendingTeams[0] : (teams.length > 0 ? teams[0] : null));
    if (preferredTeam) {
        selectTeamForScorecard(preferredTeam.id);
    }
}

function renderScorecardBody(team, existingScore) {
    const wrapper = document.getElementById('scorecard-wrapper');
    if (!wrapper) return;

    const players = [team.player1, team.player2, team.player3, team.player4].filter(Boolean);
    const teamName = team.teamname || players[0] || '—';
    const ventaja = team.ventaja || 0;
    const hdcp = team.hdcp || 0;
    const holeNum = team.hole || '—';
    const courseName = (currentTournamentCourses && currentTournamentCourses.length) ? currentTournamentCourses[0] : 'GOLF COLIMA';
    const isStb = isCategoryStableford(team.category, currentTournamentConfig);

    const totalDays = Math.max(1, parseInt(currentTournamentConfig?.totalDays || 1));
    const activeDay = window._activeScoreDay || 1;
    const dayLabel  = getDayLabel(activeDay, currentTournamentConfig);

    // Calcular acumulado del jugador en todos los días capturados
    const playerAllScores = (window._scoresList || []).filter(s => String(s.teamid) === String(team.id));
    const sumGrossAllDays = playerAllScores.reduce((acc, s) => acc + (s.gross || s.total || 0), 0);
    const sumNetAllDays   = playerAllScores.reduce((acc, s) => acc + ((s.gross || s.total || 0) - ventaja), 0);
    const sumPtsAllDays   = playerAllScores.reduce((acc, s) => acc + calcCardStablefordPoints(s.hole_scores, s.gross || s.total || 0, ventaja), 0);

    const inHoles  = CLUB_COLIMA_HOLES.slice(0, 9);  // Hoyos 1-9 (IN)
    const outHoles = CLUB_COLIMA_HOLES.slice(9, 18); // Hoyos 10-18 (OUT)

    wrapper.innerHTML = `
        <!-- HEADER DEL SCORECARD -->
        <div class="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-3.5">
            <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                    <!-- Botón Volver (Visible en móvil) -->
                    <button type="button" onclick="setMobileScoreView('list')"
                        class="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-primary font-black text-xs uppercase transition-all shrink-0 active:scale-95 shadow-sm">
                        <span class="material-icons" style="font-size:16px">arrow_back</span> Jugadores
                    </button>
                    <div class="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-black text-sm shrink-0">
                        #${holeNum}
                    </div>
                    <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <h2 class="text-sm sm:text-base font-black text-white uppercase truncate max-w-[200px] sm:max-w-none">${teamName}</h2>
                            ${team.category ? `<span class="px-2.5 py-0.5 ${isStb ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'} border rounded-full text-[9px] sm:text-[10px] font-black uppercase">CAT. ${team.category}${isStb ? ' · ⭐ STABLEFORD' : ''}</span>` : ''}
                            <span class="px-2.5 py-0.5 bg-primary/15 text-primary border border-primary/30 rounded-full text-[9px] sm:text-[10px] font-black uppercase">VTJ: ${ventaja} GLS</span>
                            ${totalDays > 1 ? `<span class="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[9px] sm:text-[10px] font-black uppercase">📅 ${dayLabel}</span>` : ''}
                        </div>
                        <p class="text-[10px] sm:text-[11px] text-slate-400 font-bold mt-0.5 truncate">
                            ${players[0] || teamName} ${hdcp ? `(HCP ${hdcp})` : ''}
                            ${totalDays > 1 && playerAllScores.length > 0
                                ? (isStb
                                    ? ` · <span class="text-amber-300 font-black">Acumulado (${playerAllScores.length}/${totalDays} días): ⭐ ${sumPtsAllDays} PTS (Gross ${sumGrossAllDays})</span>`
                                    : ` · <span class="text-emerald-400 font-black">Acumulado (${playerAllScores.length}/${totalDays} días): Gross ${sumGrossAllDays} / Neto ${sumNetAllDays}</span>`)
                                : ''}
                        </p>
                    </div>
                </div>

                ${totalDays > 1 ? `
                <div class="flex items-center gap-1.5 flex-wrap">
                    ${Array.from({ length: totalDays }, (_, idx) => {
                        const dNum = idx + 1;
                        const sc = playerAllScores.find(s => getScoreDay(s) === dNum);
                        const g = sc ? (sc.gross || sc.total || 0) : null;
                        const pts = (sc && isStb) ? calcCardStablefordPoints(sc.hole_scores, g, ventaja) : null;
                        const isCur = dNum === activeDay;
                        return `<button type="button" onclick="setActiveScoreDay(${dNum})"
                            class="px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border cursor-pointer
                            ${isCur
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                                : (g ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25' : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white')}">
                            D${dNum}${g ? (isStb ? `: ${pts}pts` : `: ${g}`) : ''}
                        </button>`;
                    }).join('')}
                </div>` : ''}
            </div>

            <!-- TOTALES RESPONSIVE -->
            <div class="grid grid-cols-3 ${isStb ? 'sm:grid-cols-7' : 'sm:grid-cols-6'} gap-2">
                <div class="px-2 py-2 bg-slate-900/90 border border-slate-700/70 rounded-xl text-center">
                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-wider truncate">${totalDays > 1 ? 'RONDA / DÍA' : 'CAMPO'}</p>
                    <p class="text-[11px] font-black text-white uppercase truncate">${totalDays > 1 ? dayLabel : courseName}</p>
                </div>
                <div class="px-2 py-2 bg-slate-900/90 border border-slate-700/70 rounded-xl text-center">
                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-wider">IN (1-9)</p>
                    <p id="sc-in" class="text-base font-black text-white">0</p>
                </div>
                <div class="px-2 py-2 bg-slate-900/90 border border-slate-700/70 rounded-xl text-center">
                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-wider">OUT (10-18)</p>
                    <p id="sc-out" class="text-base font-black text-white">0</p>
                </div>
                <div class="px-2 py-2 bg-blue-500/20 border border-blue-500/40 rounded-xl text-center">
                    <p class="text-[8px] font-black text-blue-300 uppercase tracking-wider">GROSS ${totalDays > 1 ? `D${activeDay}` : ''}</p>
                    <p id="sc-gross" class="text-xl font-black text-blue-300 leading-tight">0</p>
                </div>
                <div class="px-2 py-2 bg-slate-900/90 border border-slate-700/70 rounded-xl text-center">
                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-wider">VTJ</p>
                    <p class="text-base font-black text-blue-400">−${ventaja}</p>
                </div>
                <div class="px-2 py-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-center">
                    <p class="text-[8px] font-black text-emerald-400 uppercase tracking-wider">NETO ${totalDays > 1 ? `D${activeDay}` : ''}</p>
                    <p id="sc-net" class="text-xl font-black text-emerald-400 leading-tight">0</p>
                </div>
                ${isStb ? `
                <div class="px-2 py-2 bg-amber-500/25 border-2 border-amber-400/60 rounded-xl text-center col-span-3 sm:col-span-1 shadow-md shadow-amber-500/10">
                    <p class="text-[8px] font-black text-amber-300 uppercase tracking-wider">⭐ PTS STABLEFORD</p>
                    <p id="sc-stb-pts" class="text-xl font-black text-amber-300 leading-tight">0</p>
                </div>` : ''}
            </div>
        </div>

        <!-- VUELTA 1-9 (IN) -->
        <div class="bg-slate-800/30 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3">
            <div class="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
                <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> VUELTA 1-9 (IN)</span>
                <span class="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">PAR 34</span>
            </div>
            <div class="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 sm:gap-2.5">
                ${inHoles.map(h => renderHoleCard(h)).join('')}
            </div>
        </div>

        <!-- VUELTA 10-18 (OUT) -->
        <div class="bg-slate-800/30 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3">
            <div class="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
                <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-blue-500"></span> VUELTA 10-18 (OUT)</span>
                <span class="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">PAR 34</span>
            </div>
            <div class="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 sm:gap-2.5">
                ${outHoles.map(h => renderHoleCard(h)).join('')}
            </div>
        </div>

        <!-- BOTTOM ACTIONS -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div class="flex items-center gap-3">
                <div class="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                    <span class="material-icons text-base">sync</span>
                    <span class="uppercase text-[10px] tracking-wider">${isStb ? 'Cálculo Automático de Golpes y Puntos Stableford (80% HCP)' : 'Cálculo Automático Activo'}</span>
                </div>
                ${existingScore ? `
                <button type="button" onclick="deleteScorecardForDay('${existingScore.id}', '${dayLabel.replace(/'/g, "\\'")}', '${teamName.replace(/'/g, "\\'")}')"
                    class="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer">
                    <span class="material-icons" style="font-size:14px">delete</span> Borrar ${totalDays > 1 ? `D${activeDay}` : 'Tarjeta'}
                </button>` : ''}
            </div>
            <button id="btn-save-scorecard" onclick="saveScorecard()"
                class="w-full sm:w-auto px-8 py-3.5 bg-primary text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                <span class="material-icons" style="font-size:18px">save</span> Guardar ${totalDays > 1 ? dayLabel : 'Scorecard'}
            </button>
        </div>`;

    recalcScorecardTotals();
}

function renderHoleCard(h) {
    const val = window._currentHoleScores?.[`h${h.hole}`] || '';
    const hasVal = val !== '' && !isNaN(val) && parseInt(val) > 0;
    return `
    <div id="hole-card-${h.hole}"
        class="flex flex-col items-center justify-between p-2.5 sm:p-2 rounded-2xl border transition-all ${hasVal ? 'bg-emerald-500/20 border-emerald-500/60 shadow-md shadow-emerald-500/10' : 'bg-slate-800/90 border-slate-700/80 hover:border-slate-600'}">
        <div class="flex items-center justify-between w-full px-1">
            <span class="text-xs sm:text-[10px] font-black text-slate-300">#${h.hole}</span>
            <span class="text-[9px] sm:text-[8px] font-bold text-slate-400 uppercase">PAR ${h.par}</span>
        </div>
        <input id="score-h${h.hole}" type="text" inputmode="numeric" pattern="[0-9]*" value="${val}" autocomplete="off"
            onkeydown="handleHoleKeyDown(event, ${h.hole})"
            oninput="onHoleInput(${h.hole}, this)"
            onfocus="this.select()"
            style="font-size: 20px;"
            class="w-full text-center py-2 sm:py-1.5 my-1 ${hasVal ? 'bg-emerald-950/90 border-2 border-emerald-500/60 text-emerald-300' : 'bg-slate-900/90 border-2 border-slate-700/80 text-white'} rounded-xl font-black text-xl sm:text-lg focus:outline-none focus:border-primary transition-all">
        <div class="flex items-center justify-between w-full px-0.5 text-[9px] sm:text-[8px] font-black uppercase text-slate-400 tracking-wider">
            <span>IDX ${h.idx}</span>
            <span id="hole-pts-${h.hole}" class="text-amber-300 font-black hidden"></span>
        </div>
    </div>`;
}

function recalcScorecardTotals() {
    const team = window._selectedScoreTeam;
    const ventaja = team?.ventaja || 0;
    const isStb = team ? isCategoryStableford(team.category, currentTournamentConfig) : false;
    const scores = window._currentHoleScores || {};

    let inSum = 0;
    for (let i = 1; i <= 9; i++) {
        const v = parseInt(scores[`h${i}`]);
        if (!isNaN(v) && v > 0) inSum += v;
    }

    let outSum = 0;
    for (let i = 10; i <= 18; i++) {
        const v = parseInt(scores[`h${i}`]);
        if (!isNaN(v) && v > 0) outSum += v;
    }

    const gross = inSum + outSum;
    const net = gross > 0 ? (gross - ventaja) : 0;
    const stbPts = calcCardStablefordPoints(scores, gross, ventaja);

    const inEl    = document.getElementById('sc-in');
    const outEl   = document.getElementById('sc-out');
    const grossEl = document.getElementById('sc-gross');
    const netEl   = document.getElementById('sc-net');
    const stbEl   = document.getElementById('sc-stb-pts');

    if (inEl)    inEl.textContent    = inSum    || '0';
    if (outEl)   outEl.textContent   = outSum   || '0';
    if (grossEl) grossEl.textContent = gross   || '0';
    if (netEl)   netEl.textContent   = net     || '0';
    if (stbEl)   stbEl.textContent   = stbPts  || '0';

    for (let i = 1; i <= 18; i++) {
        const card = document.getElementById(`hole-card-${i}`);
        const inputEl = document.getElementById(`score-h${i}`);
        const ptsEl = document.getElementById(`hole-pts-${i}`);
        const v = parseInt(scores[`h${i}`]);
        const hDef = CLUB_COLIMA_HOLES[i - 1];
        if (ptsEl && hDef) {
            if (isStb && !isNaN(v) && v > 0) {
                const hPts = calcHoleStablefordPoints(v, hDef.par, hDef.idx, ventaja);
                ptsEl.textContent = `${hPts}P`;
                ptsEl.classList.remove('hidden');
            } else {
                ptsEl.classList.add('hidden');
            }
        }
        if (card) {
            if (!isNaN(v) && v > 0) {
                card.className = 'flex flex-col items-center justify-between p-2.5 sm:p-2 rounded-2xl border transition-all bg-emerald-500/20 border-emerald-500/60 shadow-md shadow-emerald-500/10';
                if (inputEl) {
                    inputEl.className = 'w-full text-center py-2 sm:py-1.5 my-1 bg-emerald-950/90 border-2 border-emerald-500/60 rounded-xl text-emerald-300 font-black text-xl sm:text-lg focus:outline-none focus:border-primary transition-all';
                }
            } else {
                card.className = 'flex flex-col items-center justify-between p-2.5 sm:p-2 rounded-2xl border transition-all bg-slate-800/90 border-slate-700/80 hover:border-slate-600';
                if (inputEl) {
                    inputEl.className = 'w-full text-center py-2 sm:py-1.5 my-1 bg-slate-900/90 border-2 border-slate-700/80 rounded-xl text-white font-black text-xl sm:text-lg focus:outline-none focus:border-primary transition-all';
                }
            }
        }
    }
}

// ================================================
// SECTION: OYE'S
// ================================================
const HOLE_COLORS = {
    1:  { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/40', header: '#10b981' },
    2:  { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/40', header: '#10b981' },
    3:  { bg: 'bg-cyan-500',    text: 'text-cyan-400',    border: 'border-cyan-500/40',    header: '#06b6d4' },
    4:  { bg: 'bg-blue-500',    text: 'text-blue-400',    border: 'border-blue-500/40',    header: '#3b82f6' },
    5:  { bg: 'bg-indigo-500',  text: 'text-indigo-400',  border: 'border-indigo-500/40',  header: '#6366f1' },
    6:  { bg: 'bg-purple-500',  text: 'text-purple-400',  border: 'border-purple-500/40',  header: '#a855f7' },
    7:  { bg: 'bg-amber-500',   text: 'text-amber-400',   border: 'border-amber-500/40',   header: '#f59e0b' },
    8:  { bg: 'bg-orange-500',  text: 'text-orange-400',  border: 'border-orange-500/40',  header: '#f97316' },
    9:  { bg: 'bg-cyan-500',    text: 'text-cyan-400',    border: 'border-cyan-500/40',    header: '#06b6d4' },
    10: { bg: 'bg-rose-500',    text: 'text-rose-400',    border: 'border-rose-500/40',    header: '#f43f5e' },
    11: { bg: 'bg-indigo-500',  text: 'text-indigo-400',  border: 'border-indigo-500/40',  header: '#6366f1' },
    12: { bg: 'bg-teal-500',    text: 'text-teal-400',    border: 'border-teal-500/40',    header: '#14b8a6' },
    13: { bg: 'bg-yellow-500',  text: 'text-yellow-400',  border: 'border-yellow-500/40',  header: '#eab308' },
    14: { bg: 'bg-lime-500',    text: 'text-lime-400',    border: 'border-lime-500/40',    header: '#84cc16' },
    15: { bg: 'bg-sky-500',     text: 'text-sky-400',     border: 'border-sky-500/40',     header: '#0ea5e9' },
    16: { bg: 'bg-violet-500',  text: 'text-violet-400',  border: 'border-violet-500/40',  header: '#8b5cf6' },
    17: { bg: 'bg-pink-500',    text: 'text-pink-400',    border: 'border-pink-500/40',    header: '#ec4899' },
    18: { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/40', header: '#10b981' }
};

async function renderOyeses(content, courses) {
    const [oyesesRes, teamsRes] = await Promise.all([
        supabaseTarget.from('oyeses').select('*').eq('eventid', String(currentTournamentID)).order('created_at', { ascending: false }),
        supabaseTarget.from('teams').select('*').eq('eventid', String(currentTournamentID))
    ]);

    const oyesesList = oyesesRes.data || [];
    const teamsList  = teamsRes.data  || [];

    // Registered player names for datalist autocomplete
    const playerNames = new Set();
    teamsList.forEach(t => {
        if (t.teamname) playerNames.add(t.teamname);
        if (t.player1) playerNames.add(t.player1);
        if (t.player2) playerNames.add(t.player2);
        if (t.player3) playerNames.add(t.player3);
        if (t.player4) playerNames.add(t.player4);
    });

    let config = currentTournamentConfig || {};
    let activeHoles = config.oyeses_holes || [2, 7, 9, 11, 17];
    let judgeCodes  = config.judge_codes || {};

    // Ensure codes exist
    let updatedCodes = false;
    activeHoles.forEach(h => {
        if (!judgeCodes[h]) {
            const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
            judgeCodes[h] = `H${h}-${randStr}`;
            updatedCodes = true;
        }
    });

    if (updatedCodes) {
        config.judge_codes = judgeCodes;
        config.oyeses_holes = activeHoles;
        await supabaseTarget.from('tournaments').update({ config }).eq('id', currentTournamentID);
        currentTournamentConfig = config;
    }

    const courseName = (courses && courses.length > 0) ? courses[0] : 'CLUB DE GOLF COLIMA';

    content.innerHTML = `
        <div class="space-y-6">

            <!-- ====== PANEL IZQUIERDO Y DERECHO ====== -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <!-- PANEL IZQUIERDO: ACCIONES & REGISTRO MANUAL -->
                <div class="space-y-4">
                    <!-- BOTONES DE GESTION SUPERIOR -->
                    <div class="space-y-2">
                        <button onclick="openOyesConfigModal()"
                            class="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20">
                            <span class="material-icons" style="font-size:18px">settings</span> Modificar Hoyos con Premio
                        </button>
                        <button onclick="openOyesCodesModal()"
                            class="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all">
                            <span class="material-icons" style="font-size:18px">vpn_key</span> Ver Códigos de Jueces
                        </button>
                    </div>

                    <!-- CARD NUEVO REGISTRO OYE'S -->
                    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                        <div class="flex items-center gap-2 border-b border-slate-800 pb-3">
                            <div class="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                                <span class="material-icons" style="font-size:16px">add_location_alt</span>
                            </div>
                            <div>
                                <h3 class="font-black text-white uppercase tracking-wider text-xs">Nuevo Registro Oye's</h3>
                                <p class="text-[9px] font-bold text-slate-500 uppercase">Registro Manual de Respaldo</p>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <div>
                                <label class="block text-[9px] font-black text-slate-400 uppercase mb-1">Hoyo y Campo</label>
                                <select id="admin-oye-hole" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-primary transition-all">
                                    ${activeHoles.map(h => `<option value="${h}">Hoyo #${h} — ${courseName}</option>`).join('')}
                                </select>
                            </div>

                            <div>
                                <label class="block text-[9px] font-black text-slate-400 uppercase mb-1">Nombre del Jugador</label>
                                <input id="admin-oye-player" placeholder="Escribe el nombre..." list="admin-players-list"
                                    class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold uppercase placeholder:text-slate-600 focus:outline-none focus:border-primary transition-all">
                                <datalist id="admin-players-list">
                                    ${Array.from(playerNames).map(n => `<option value="${n}">`).join('')}
                                </datalist>
                            </div>

                            <div>
                                <label class="block text-[9px] font-black text-slate-400 uppercase mb-1">Distancia (MTS)</label>
                                <input id="admin-oye-distance" type="number" step="0.01" placeholder="Ej. 1.25"
                                    class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-black text-center placeholder:text-slate-600 focus:outline-none focus:border-primary transition-all">
                            </div>

                            <button onclick="saveAdminOye()"
                                class="w-full py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-md flex items-center justify-center gap-2">
                                <span class="material-icons" style="font-size:16px">add</span> Registrar Oye's
                            </button>
                        </div>
                    </div>
                </div>

                <!-- PANEL DERECHO: GRID DE HOYOS REGISTRADOS -->
                <div class="lg:col-span-2 space-y-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="font-black text-white uppercase tracking-widest text-sm">Actividad Reciente / Gestión</h3>
                            <p class="text-[10px] font-bold text-slate-500 uppercase">${courseName}</p>
                        </div>
                        <span class="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs font-black text-white">${oyesesList.length} registros</span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${activeHoles.map(hNum => {
                            const holeTheme = HOLE_COLORS[hNum] || HOLE_COLORS[2];
                            const holeMarks = oyesesList.filter(o => String(o.hole) === String(hNum))
                                .sort((a,b) => parseFloat(a.distance) - parseFloat(b.distance));
                            return `
                            <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                                <!-- HEADER DEL HOYO -->
                                <div class="px-4 py-3 ${holeTheme.bg} flex items-center justify-between text-slate-950">
                                    <div class="flex items-center gap-2 font-black uppercase text-xs">
                                        <span class="material-icons" style="font-size:16px">flag</span>
                                        <span>HOYO #${hNum}</span>
                                    </div>
                                    <span class="px-2 py-0.5 bg-black/20 rounded-md text-[9px] font-black uppercase">${holeMarks.length} MARCAS</span>
                                </div>

                                <!-- CUERPO DE MARCAS -->
                                <div class="p-3 divide-y divide-slate-800/80 flex-1 min-h-[140px] space-y-2">
                                    ${holeMarks.length === 0
                                        ? `<div class="h-full flex items-center justify-center py-8 text-center text-slate-600 font-bold uppercase text-[10px]">Sin marcas registradas</div>`
                                        : holeMarks.map((m, idx) => `
                                            <div class="pt-2 first:pt-0 flex items-center justify-between gap-2">
                                                <div class="flex items-center gap-2.5 min-w-0 flex-1">
                                                    <span class="w-6 h-6 rounded-lg ${idx===0?'bg-amber-500/20 text-amber-400 font-black':'bg-slate-800 text-slate-400 font-bold'} text-[10px] flex items-center justify-center shrink-0">
                                                        #${idx + 1}
                                                    </span>
                                                    <span class="font-black text-white uppercase text-xs truncate">${m.player_name}</span>
                                                </div>
                                                <div class="flex items-center gap-2 shrink-0">
                                                    <span class="font-black ${holeTheme.text} text-xs font-mono mr-1">${m.distance}</span>
                                                    <button onclick="editOyeMark('${m.id}', '${m.player_name}', '${m.distance}', '${hNum}')" title="Editar marca"
                                                        class="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg flex items-center justify-center transition-all border border-slate-700">
                                                        <span class="material-icons" style="font-size:13px">edit</span>
                                                    </button>
                                                    <button onclick="deleteOyeMark('${m.id}')" title="Eliminar marca"
                                                        class="w-7 h-7 bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 rounded-lg flex items-center justify-center transition-all border border-rose-500/20">
                                                        <span class="material-icons" style="font-size:13px">delete</span>
                                                    </button>
                                                </div>
                                            </div>`).join('')}
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>

        <!-- ===== MODAL CONFIGURAR HOYOS ===== -->
        <div id="oyes-config-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.75)">
            <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
                <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 class="font-black text-white uppercase tracking-widest text-sm">Modificar Hoyos con Premio</h3>
                    <button onclick="closeOyesConfigModal()" class="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 transition-all">
                        <span class="material-icons" style="font-size:16px">close</span>
                    </button>
                </div>

                <p class="text-xs text-slate-400 font-bold">Escribe los números de los hoyos PAR 3 (o que tendrán premio) separados por comas:</p>

                <div class="py-2">
                    <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Hoyos Participantes (Separados por Coma)</label>
                    <input id="input-oyes-holes" value="${activeHoles.join(', ')}" placeholder="Ej. 2, 5, 7, 11, 14, 16"
                        class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-base font-black text-center focus:outline-none focus:border-primary transition-all">
                </div>

                <div class="flex gap-3 pt-2">
                    <button onclick="closeOyesConfigModal()" class="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black uppercase tracking-widest text-xs transition-all">Cancelar</button>
                    <button onclick="saveOyesConfig()" class="flex-1 py-3 bg-emerald-500 text-slate-950 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">Guardar Hoyos</button>
                </div>
            </div>
        </div>

        <!-- ===== MODAL CODIGOS DE JUECES ===== -->
        <div id="oyes-codes-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.75)">
            <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
                <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div class="flex items-center gap-2">
                        <span class="material-icons text-emerald-400" style="font-size:20px">vpn_key</span>
                        <h3 class="font-black text-white uppercase tracking-widest text-sm">Accesos de Juez</h3>
                    </div>
                    <button onclick="closeOyesCodesModal()" class="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 transition-all">
                        <span class="material-icons" style="font-size:16px">close</span>
                    </button>
                </div>

                <p class="text-xs text-slate-400 font-bold leading-relaxed">
                    Envía esta liga por WhatsApp a los jueces en campo para que puedan capturar distancias sin descargar nada:
                </p>

                <!-- LIGA SHAREABLE -->
                <div class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-2">
                    <span class="text-xs font-black text-emerald-400 truncate">${window.location.origin}/oyes/index.html</span>
                    <button onclick="navigator.clipboard.writeText('${window.location.origin}/oyes/index.html'); (window.showNotification ? window.showNotification('Copiado', 'Enlace copiado al portapapeles.', 'success') : alert('Enlace copiado al portapapeles.'))"
                        class="px-3 py-1.5 bg-emerald-500 text-slate-950 font-black rounded-lg text-[10px] uppercase hover:bg-emerald-400 transition-all shrink-0">
                        Copiar Liga
                    </button>
                </div>

                <!-- GRID DE CODIGOS DE ACCESO -->
                <div class="grid grid-cols-2 gap-3">
                    ${activeHoles.map(h => `
                        <div class="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-center">
                            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">HOYO ${h}</p>
                            <p class="text-lg font-black text-white tracking-widest uppercase mt-0.5">${judgeCodes[h] || `H${h}-CODE`}</p>
                        </div>`).join('')}
                </div>

                <button onclick="closeOyesCodesModal()" class="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all">
                    Cerrar Códigos
                </button>
            </div>
        </div>`;

    // Expose helpers
    window.openOyesConfigModal = () => document.getElementById('oyes-config-modal')?.classList.remove('hidden');
    window.closeOyesConfigModal = () => document.getElementById('oyes-config-modal')?.classList.add('hidden');

    window.openOyesCodesModal = () => document.getElementById('oyes-codes-modal')?.classList.remove('hidden');
    window.closeOyesCodesModal = () => document.getElementById('oyes-codes-modal')?.classList.add('hidden');

    window.saveOyesConfig = async () => {
        const rawVal = document.getElementById('input-oyes-holes')?.value || '';
        const selected = rawVal.split(',')
            .map(s => parseInt(s.trim()))
            .filter(n => !isNaN(n) && n >= 1 && n <= 18);

        if (selected.length === 0) {
            _showNotificationRef('Selección requerida', 'Ingresa los números de hoyo (1 al 18) separados por comas.', 'error');
            return;
        }

        selected.sort((a,b) => a - b);

        // Generate codes for new holes
        const newJudgeCodes = { ...judgeCodes };
        selected.forEach(h => {
            if (!newJudgeCodes[h]) {
                const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
                newJudgeCodes[h] = `H${h}-${randStr}`;
            }
        });

        const newConfig = { ...config, oyeses_holes: selected, judge_codes: newJudgeCodes };
        const { error } = await supabaseTarget.from('tournaments').update({ config: newConfig }).eq('id', currentTournamentID);
        if (error) {
            _showNotificationRef('Error', error.message, 'error');
        } else {
            currentTournamentConfig = newConfig;
            closeOyesConfigModal();
            _showNotificationRef('Hoyos Actualizados', 'Configuración de hoyos Oye\'s guardada.', 'success');
            setTimeout(() => setSection('oyeses'), 800);
        }
    };

    window.saveAdminOye = async () => {
        const holeVal  = document.getElementById('admin-oye-hole')?.value;
        const player   = document.getElementById('admin-oye-player')?.value.trim().toUpperCase();
        const distVal  = document.getElementById('admin-oye-distance')?.value.trim();

        if (!player || !distVal) {
            _showNotificationRef('Datos incompletos', 'Ingresa el nombre del jugador y la distancia.', 'error');
            return;
        }

        const distance = distVal.endsWith('m') ? distVal : `${distVal}m`;

        const { error } = await supabaseTarget.from('oyeses').insert([{
            eventid:    String(currentTournamentID),
            coursename: courseName,
            hole:       String(holeVal),
            player_name: player,
            distance:   distance
        }]);

        if (error) {
            _showNotificationRef('Error', error.message, 'error');
        } else {
            _showNotificationRef('Oye Registrado', `${player} en Hoyo ${holeVal} (${distance}).`, 'success');
            setTimeout(() => setSection('oyeses'), 800);
        }
    };

    window.deleteOyeMark = (id) => {
        _showNotificationRef('Eliminar Registro', '¿Eliminar este registro de Oye\'s?', 'confirm', async () => {
            await supabaseTarget.from('oyeses').delete().eq('id', id);
            setSection('oyeses');
        });
    };

    window.editOyeMark = (id, currentName, currentDist, holeNum) => {
        const existing = document.getElementById('edit-oye-modal');
        if (existing) existing.remove();

        const editModal = document.createElement('div');
        editModal.id = 'edit-oye-modal';
        editModal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 style="background:rgba(0,0,0,0.75)"';
        editModal.innerHTML = `
            <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
                <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 class="font-black text-white uppercase tracking-widest text-sm">Editar Registro Oye's — Hoyo #${holeNum}</h3>
                    <button onclick="document.getElementById('edit-oye-modal').remove()" class="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 transition-all">
                        <span class="material-icons" style="font-size:16px">close</span>
                    </button>
                </div>
                <div class="space-y-3">
                    <div>
                        <label class="block text-[9px] font-black text-slate-400 uppercase mb-1">Nombre del Jugador</label>
                        <input id="edit-oye-name" value="${currentName}" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold uppercase focus:outline-none focus:border-primary transition-all">
                    </div>
                    <div>
                        <label class="block text-[9px] font-black text-slate-400 uppercase mb-1">Distancia (MTS)</label>
                        <input id="edit-oye-dist" value="${currentDist.replace('m','')}" type="number" step="0.01" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-black text-center focus:outline-none focus:border-primary transition-all">
                    </div>
                </div>
                <div class="flex gap-3 pt-2">
                    <button onclick="document.getElementById('edit-oye-modal').remove()" class="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black uppercase text-xs transition-all">Cancelar</button>
                    <button onclick="saveEditedOyeMark('${id}')" class="flex-1 py-3 bg-emerald-500 text-slate-950 rounded-xl font-black uppercase text-xs hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">Guardar Cambios</button>
                </div>
            </div>`;
        document.body.appendChild(editModal);

        window.saveEditedOyeMark = async (markId) => {
            const newName = document.getElementById('edit-oye-name')?.value.trim().toUpperCase();
            const newDist = document.getElementById('edit-oye-dist')?.value.trim();
            if (!newName || !newDist) {
                _showNotificationRef('Datos Incompletos', 'Ingresa el nombre y la distancia.', 'error');
                return;
            }
            const distFormatted = newDist.endsWith('m') ? newDist : `${newDist}m`;
            const { error } = await supabaseTarget.from('oyeses').update({ player_name: newName, distance: distFormatted }).eq('id', markId);
            if (error) {
                _showNotificationRef('Error', error.message, 'error');
            } else {
                document.getElementById('edit-oye-modal')?.remove();
                _showNotificationRef('Registro Actualizado', 'Marca modificada exitosamente.', 'success');
                setTimeout(() => setSection('oyeses'), 600);
            }
        };
    };
}

window.openScorecardModalAdmin = async function(teamId, teamName) {
    let modal = document.getElementById('admin-scorecard-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'admin-scorecard-modal';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in';
        document.body.appendChild(modal);
    }
    modal.classList.remove('hidden');
    modal.innerHTML = `<div class="p-8 bg-slate-900 border border-slate-700 rounded-3xl text-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div><p class="text-xs text-slate-400 font-bold uppercase mt-3">Cargando Tarjeta...</p></div>`;

    const [{ data: teamScores, error }, { data: teamData }] = await Promise.all([
        supabaseTarget.from('scores').select('*').eq('teamid', teamId).eq('eventid', String(currentTournamentID)),
        supabaseTarget.from('teams').select('ventaja, hdcp, category').eq('id', teamId).maybeSingle()
    ]);

    const ventaja = teamData?.ventaja || 0;
    const isStb = isCategoryStableford(teamData?.category, currentTournamentConfig);

    if (error || !teamScores || teamScores.length === 0) {
        modal.innerHTML = `
            <div class="bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center max-w-sm w-full space-y-4">
                <span class="material-icons text-amber-400 text-4xl">info</span>
                <h3 class="font-black text-white uppercase text-sm">Sin Scorecard</h3>
                <p class="text-slate-400 text-xs font-bold">No hay scores registrados para ${teamName}.</p>
                <button onclick="document.getElementById('admin-scorecard-modal').classList.add('hidden')" class="px-6 py-2.5 bg-primary text-slate-900 rounded-xl font-black text-xs uppercase">Cerrar</button>
            </div>`;
        return;
    }

    const sortedTeamScores = [...teamScores].sort((a, b) => getScoreDay(a) - getScoreDay(b));

    const contentHtml = sortedTeamScores.map((s) => {
        let holeScoresObj = {};
        if (s.hole_scores) {
            try {
                holeScoresObj = typeof s.hole_scores === 'string' ? JSON.parse(s.hole_scores) : s.hole_scores;
            } catch(e) { holeScoresObj = {}; }
        }

        const dayNum = getScoreDay(s);
        const totalDays = Math.max(1, parseInt(currentTournamentConfig?.totalDays || 1));
        const headerLabel = totalDays > 1
            ? getDayLabel(dayNum, currentTournamentConfig)
            : (s.coursename || 'CLUB DE GOLF COLIMA');

        const outSum = s.out_score !== undefined && s.out_score !== null ? s.out_score : 0;
        const inSum  = s.in_score  !== undefined && s.in_score  !== null ? s.in_score  : 0;
        const gross  = s.gross || s.total || 0;
        const net    = s.net   !== undefined && s.net   !== null ? s.net : (gross > 0 ? (gross - ventaja) : 0);
        const stbPts = calcCardStablefordPoints(holeScoresObj, gross, ventaja);

        const holesArray = [];
        for (let i = 1; i <= 18; i++) {
            holesArray.push(holeScoresObj[`h${i}`] !== undefined ? holeScoresObj[`h${i}`] : '-');
        }

        return `
            <div class="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden mb-4">
                <div class="bg-primary/20 border-b border-primary/30 px-5 py-3 flex flex-wrap justify-between items-center gap-2">
                    <span class="font-black uppercase text-xs text-white tracking-widest">${headerLabel}</span>
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-[10px] font-black uppercase bg-slate-800 px-3 py-1 rounded-full text-slate-300">GROSS: ${gross}</span>
                        <span class="text-[10px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full">VTJ: −${ventaja}</span>
                        ${isStb
                            ? `<span class="text-xs font-black uppercase bg-amber-400 text-slate-950 px-3 py-1 rounded-full">⭐ PUNTOS: ${stbPts}</span>`
                            : `<span class="text-xs font-black uppercase bg-primary text-slate-900 px-3 py-1 rounded-full">NETO: ${net}</span>`}
                    </div>
                </div>
                <div class="p-5 space-y-4">
                    <div>
                        <p class="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5">VUELTA 1-9 (IN)</p>
                        <div class="grid grid-cols-9 gap-1.5">
                            ${holesArray.slice(0, 9).map((val, i) => `
                                <div class="flex flex-col items-center">
                                    <span class="text-[8px] text-slate-500 font-bold mb-1">#${i+1}</span>
                                    <div class="w-full py-2 bg-slate-800 border border-slate-700 rounded-xl text-center font-black text-xs text-white">${val}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div>
                        <p class="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5">VUELTA 10-18 (OUT)</p>
                        <div class="grid grid-cols-9 gap-1.5">
                            ${holesArray.slice(9, 18).map((val, i) => `
                                <div class="flex flex-col items-center">
                                    <span class="text-[8px] text-slate-500 font-bold mb-1">#${i+10}</span>
                                    <div class="w-full py-2 bg-slate-800 border border-slate-700 rounded-xl text-center font-black text-xs text-white">${val}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="flex justify-between items-center pt-3 border-t border-slate-800">
                        <div class="flex gap-3">
                            <div class="text-center px-3 py-1 bg-slate-800 rounded-lg">
                                <p class="text-[8px] text-slate-400 font-black">IN (1-9)</p>
                                <p class="font-black text-white text-xs">${outSum}</p>
                            </div>
                            <div class="text-center px-3 py-1 bg-slate-800 rounded-lg">
                                <p class="text-[8px] text-slate-400 font-black">OUT (10-18)</p>
                                <p class="font-black text-white text-xs">${inSum}</p>
                            </div>
                            <div class="text-center px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <p class="text-[8px] text-blue-400 font-black">VENTAJA</p>
                                <p class="font-black text-blue-400 text-xs">−${ventaja}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-[8px] text-slate-400 font-black uppercase">${isStb ? 'PUNTOS STABLEFORD' : 'TOTAL NETO'}</p>
                            <p class="text-xl font-black ${isStb ? 'text-amber-400' : 'text-primary'}">${isStb ? `${stbPts} PTS` : net}</p>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');

    modal.innerHTML = `
        <div class="w-full max-w-2xl bg-slate-950/95 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div class="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                        <span class="material-icons" style="font-size:20px">sports_golf</span>
                    </div>
                    <div>
                        <h3 class="font-black uppercase text-white text-base truncate">${teamName}</h3>
                        <p class="text-[10px] text-primary font-black uppercase tracking-widest">Tarjeta Oficial de Scorecard</p>
                    </div>
                </div>
                <button onclick="document.getElementById('admin-scorecard-modal').classList.add('hidden')" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                    <span class="material-icons" style="font-size:18px">close</span>
                </button>
            </div>
            <div class="p-6 overflow-y-auto space-y-4 flex-1">${contentHtml}</div>
        </div>`;
};

// ================================================
// SECTION: POSICIONES & CRITERIO DE DESEMPATE OFICIAL
// ================================================
// CRITERIO DE DESEMPATE OFICIAL:
// 1°, 2° y 3° de cada categoría se desempatan por:
// - Mejor tarjeta de los últimos 9 hoyos (10 al 18)
// - Últimos 6 hoyos (13 al 18)
// - Últimos 3 hoyos (16 al 18)
// - Último hoyo (18)
// - Primera vuelta (1 al 9), últimos 6 (4 al 9), últimos 3 (7 al 9), hoyo 9
// - De ser necesario se toma el score de días previos hasta el primer día bajo el mismo criterio.
// NOTA: En categorías donde se juega con el 80% del hándicap (ventaja), este se aplica proporcionalmente al desempate.
// Solo la primera categoría absoluta se juega a muerte súbita si hay empate en el 1er lugar.

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

    let inStrokes = 0; // Hoyos 1-9
    for (let i = 1; i <= 9; i++) {
        const v = parseInt(hs[`h${i}`]);
        if (!isNaN(v) && v > 0) inStrokes += v;
    }
    let outStrokes = 0; // Hoyos 10-18
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
    // Fallback para vueltas completas si no hay hoyo por hoyo
    if (startHole === 10 && endHole === 18 && tbInfo.outStrokes > 0) {
        return tbInfo.outStrokes - ((ventaja || 0) * 9 / 18);
    }
    if (startHole === 1 && endHole === 9 && tbInfo.inStrokes > 0) {
        return tbInfo.inStrokes - ((ventaja || 0) * 9 / 18);
    }
    return null;
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
                // En Stableford mayor puntaje gana (diff negativo favorece a A)
                return { diff: ptsB - ptsA, reason: `${seg.label} (Pts)` };
            }
        }
        // Fallback a menor score neto en los mismos segmentos si no hay hoyo por hoyo
    }

    for (const seg of segments) {
        const netA = calcSegmentNetScore(tbA, seg.s, seg.e, ventajaA);
        const netB = calcSegmentNetScore(tbB, seg.s, seg.e, ventajaB);
        if (netA !== null && netB !== null && Math.abs(netA - netB) > 0.0001) {
            return { diff: netA - netB, reason: seg.label };
        }
    }

    // Si en un día intermedio/primer día la tarjeta total de ese día difiere
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

    const vA = a.ventajaPerDay !== undefined ? a.ventajaPerDay : (a.team?.ventaja ?? a.ventaja ?? 0);
    const vB = b.ventajaPerDay !== undefined ? b.ventajaPerDay : (b.team?.ventaja ?? b.ventaja ?? 0);

    // 3. Evaluar desde el último día jugado hacia el primer día (Día N ... Día 1)
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
            if (res.diff < 0) a._tiebreakReason = res.reason;
            else b._tiebreakReason = res.reason;
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

async function renderPosiciones(content) {
    const [teamsRes, scoresRes] = await Promise.all([
        supabaseTarget.from('teams').select('*').eq('eventid', String(currentTournamentID)),
        supabaseTarget.from('scores').select('*').eq('eventid', String(currentTournamentID)).order('created_at', { ascending: false })
    ]);
    const teams  = teamsRes.data  || [];
    const scores = scoresRes.data || [];

    const totalDays = Math.max(1, parseInt(currentTournamentConfig?.totalDays || 1));
    if (!window._posicionesDayFilter) {
        window._posicionesDayFilter = 'all'; // 'all' o 1..totalDays
    }
    if (totalDays === 1) {
        window._posicionesDayFilter = 'all';
    }
    const dayFilter = window._posicionesDayFilter;

    window.setPosicionesDayFilter = (filterVal) => {
        window._posicionesDayFilter = filterVal;
        setSection('posiciones');
    };

    const categories = {};
    teams.forEach(t => {
        const cat = (t.category || 'GENERAL').trim();
        const allTeamScores = scores.filter(s => String(s.teamid) === String(t.id));
        if (allTeamScores.length === 0) return;

        // Agrupar por día (1..totalDays) quedándose con el registro más reciente de cada día
        const byDay = {};
        allTeamScores.forEach(s => {
            const d = totalDays > 1 ? getScoreDay(s) : 1;
            if (!byDay[d]) byDay[d] = s;
        });

        const ventajaPerDay = t.ventaja || 0;
        const isStb = isCategoryStableford(cat, currentTournamentConfig);

        if (dayFilter !== 'all') {
            const targetDay = parseInt(dayFilter);
            const dayScore = byDay[targetDay];
            if (!dayScore) return;
            const gross = dayScore.gross || dayScore.total || 0;
            const neto  = gross > 0 ? (gross - ventajaPerDay) : 0;
            const pts   = calcCardStablefordPoints(dayScore.hole_scores, gross, ventajaPerDay);
            const tbCard = getTiebreakScoreInfo(dayScore);

            if (!categories[cat]) categories[cat] = [];
            categories[cat].push({
                team: t,
                gross,
                neto,
                pts,
                isStableford: isStb,
                rounds: 1,
                ventaja: ventajaPerDay,
                ventajaPerDay,
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
                ptsTotal += calcCardStablefordPoints(byDay[d].hole_scores, g, ventajaPerDay);
            });
            const roundsCount = playedDaysNums.length;
            const ventajaTotal = ventajaPerDay * roundsCount;
            const netoTotal = grossTotal - ventajaTotal;

            // Tarjetas ordenadas del último día jugado hacia el Día 1 para el desempate oficial
            const dayCardsDesc = [...playedDaysNums].sort((a, b) => b - a).map(d => getTiebreakScoreInfo(byDay[d]));
            const latestScore = byDay[playedDaysNums[playedDaysNums.length - 1]];

            if (!categories[cat]) categories[cat] = [];
            categories[cat].push({
                team: t,
                gross: grossTotal,
                neto: netoTotal,
                pts: ptsTotal,
                isStableford: isStb,
                rounds: roundsCount,
                ventaja: ventajaTotal,
                ventajaPerDay,
                byDay,
                scoreObj: latestScore,
                dayCardsDesc,
                _tiebreak: dayCardsDesc[0]
            });
        }
    });

    const sortedCatKeys = Object.keys(categories).sort();
    const html = sortedCatKeys.map((cat, catIdx) => {
        const sorted = categories[cat].sort(compareGolfTiebreaker);
        const isFirstCat = isFirstAbsoluteCategory(cat, sortedCatKeys);
        const isCatStb = isCategoryStableford(cat, currentTournamentConfig);

        // Detectar empates en Neto (o Puntos en Stableford) y asignar razón de desempate en Top 3
        for (let i = 0; i < sorted.length; i++) {
            const cur = sorted[i];
            const prev = i > 0 ? sorted[i - 1] : null;
            const next = i < sorted.length - 1 ? sorted[i + 1] : null;
            const tiedWithPrev = prev && prev.rounds === cur.rounds && (isCatStb ? prev.pts === cur.pts : prev.neto === cur.neto);
            const tiedWithNext = next && next.rounds === cur.rounds && (isCatStb ? next.pts === cur.pts : next.neto === cur.neto);

            if (tiedWithPrev || tiedWithNext) {
                cur._isTiedNet = true;
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
                        const r = evaluateCardTiebreak(cardsA[k], cardsB[k], cur.ventajaPerDay, next.ventajaPerDay, suffix, isCatStb);
                        if (r.diff !== 0 && r.reason) {
                            cur._resolvedBy = r.reason;
                            break;
                        }
                    }
                }
            }
        }

        const theme = CAT_THEMES[catIdx % CAT_THEMES.length];
        const catTitle = cat.toUpperCase().startsWith('CATEGORÍA') || cat.toUpperCase().startsWith('CATEGORIA')
            ? cat.toUpperCase()
            : `CATEGORÍA ${cat.toUpperCase()}`;
        return `
            <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <!-- TITULO CENTRADO CON PALETA DE COLOR -->
                <div class="relative flex items-center justify-between ${theme.bg} border-b ${theme.border} px-6 py-3.5 shadow-md overflow-hidden">
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full ${theme.dot} shadow-sm"></span>
                        <span class="text-[10px] font-black uppercase ${theme.text} tracking-wider hidden sm:inline">${isCatStb ? '⭐ STABLEFORD (PTS)' : '⛳ STROKE PLAY'}</span>
                    </div>

                    <h3 class="absolute left-1/2 -translate-x-1/2 font-black text-white text-sm sm:text-base uppercase tracking-widest text-center flex items-center gap-2">
                        <span class="${theme.text}">${catTitle}</span>
                        ${isCatStb ? `<span class="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[9px] font-black hidden md:inline">STABLEFORD</span>` : ''}
                    </h3>

                    <span class="px-3 py-1 ${theme.badge} border rounded-full text-[10px] font-black uppercase tracking-wider ml-auto sm:ml-0">
                        ${sorted.length} ${sorted.length === 1 ? 'Jugador' : 'Jugadores'}
                    </span>
                </div>

                <div class="divide-y divide-slate-800">
                    ${sorted.map((item, i) => {
                        const dayColsHtml = (totalDays > 1 && dayFilter === 'all')
                            ? `<div class="hidden md:flex items-center gap-1.5">
                                ${Array.from({ length: totalDays }, (_, dIdx) => {
                                    const dNum = dIdx + 1;
                                    const sc = item.byDay && item.byDay[dNum];
                                    const g = sc ? (sc.gross || sc.total || 0) : null;
                                    const n = g ? (g - item.ventajaPerDay) : null;
                                    const dayPts = (sc && isCatStb) ? calcCardStablefordPoints(sc.hole_scores, g, item.ventajaPerDay) : null;
                                    return `<div class="text-center w-14 py-1.5 rounded-xl border ${g ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-950/40 border-slate-800/60'}">
                                        <p class="text-[8px] font-black ${g ? (isCatStb ? 'text-amber-400' : 'text-emerald-400') : 'text-slate-600'} uppercase">D${dNum}</p>
                                        <p class="text-sm font-black ${g ? 'text-white' : 'text-slate-600'} leading-tight">${g !== null ? (isCatStb ? `${dayPts}p` : g) : '—'}</p>
                                        ${g !== null ? `<p class="text-[8px] font-bold text-slate-400 leading-none mt-0.5">${isCatStb ? `G:${g}` : `N:${n}`}</p>` : ''}
                                    </div>`;
                                }).join('')}
                               </div>`
                            : '';

                        return `
                        <div class="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 ${i===0?'bg-primary/5':''}">
                            <div class="w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0
                                ${i===0?'bg-primary text-slate-900':i===1?'bg-slate-600 text-white':i===2?'bg-orange-800/40 text-orange-300':'bg-slate-800 text-slate-500'}">
                                ${i+1}
                            </div>
                            <div class="flex-1 min-w-[140px]">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <p class="font-black text-white uppercase text-sm truncate">${item.team.teamname}</p>
                                    ${item._suddenDeath1st ? `<span class="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[9px] font-black uppercase tracking-wider">⚡ Empate 1° · Muerte Súbita</span>` : ''}
                                    ${!item._suddenDeath1st && item._resolvedBy && i < 3 ? `<span class="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[9px] font-black uppercase tracking-wider">✓ Desempate: ${item._resolvedBy}</span>` : ''}
                                </div>
                                <p class="text-slate-400 text-xs mt-0.5">
                                    ${totalDays > 1 && dayFilter === 'all'
                                        ? `${item.rounds}/${totalDays} día${item.rounds!==1?'s':''} jugado${item.rounds!==1?'s':''} · VTJ/día: −${item.ventajaPerDay}`
                                        : `Ventaja: −${item.ventajaPerDay}`}
                                </p>
                            </div>
                            ${dayColsHtml}
                            <div class="text-center w-14 sm:w-16"><p class="text-[9px] text-slate-500 font-black">GROSS</p><p class="text-lg sm:text-xl font-black text-slate-300">${item.gross}</p></div>
                            <div class="text-center w-14 sm:w-16"><p class="text-[9px] text-blue-400 font-black">VTJ</p><p class="text-lg sm:text-xl font-black text-blue-400">−${item.ventaja}</p></div>
                            ${isCatStb ? `
                            <div class="text-center w-20 sm:w-24 bg-amber-500/15 border border-amber-400/40 rounded-xl py-2">
                                <p class="text-[9px] text-amber-300 font-black">PUNTOS</p>
                                <p class="text-xl sm:text-2xl font-black text-amber-300">${item.pts}</p>
                            </div>` : `
                            <div class="text-center w-20 sm:w-24 bg-primary/10 border border-primary/20 rounded-xl py-2">
                                <p class="text-[9px] text-primary font-black">NETO</p>
                                <p class="text-xl sm:text-2xl font-black text-primary">${item.neto}</p>
                            </div>`}

                            <!-- BOTON OJO PARA VER TARJETA DE SCORECARD -->
                            <button onclick="openScorecardModalAdmin('${item.team.id}', '${item.team.teamname.replace(/'/g, "\\'")}')"
                                title="Ver Tarjeta de Score Completa"
                                class="w-9 h-9 bg-slate-800 hover:bg-primary/20 hover:border-primary/40 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-all shrink-0">
                                <span class="material-icons" style="font-size:16px">visibility</span>
                            </button>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
    }).join('');

    const dayFilterBarHtml = totalDays > 1 ? `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2">
                <span class="material-icons text-amber-400" style="font-size:18px">emoji_events</span>
                <span class="text-xs font-black uppercase text-white tracking-wider">Vista del Leaderboard:</span>
            </div>
            <div class="flex flex-wrap items-center gap-2">
                <button type="button" onclick="setPosicionesDayFilter('all')"
                    class="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border
                    ${dayFilter === 'all'
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/20'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}">
                    🏆 Acumulado (${totalDays} Días)
                </button>
                ${Array.from({ length: totalDays }, (_, idx) => {
                    const dNum = idx + 1;
                    const lbl = getDayLabel(dNum, currentTournamentConfig);
                    const isAct = String(dayFilter) === String(dNum);
                    return `
                    <button type="button" onclick="setPosicionesDayFilter(${dNum})"
                        class="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border
                        ${isAct
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}">
                        📅 ${lbl}
                    </button>`;
                }).join('')}
            </div>
        </div>
    ` : '';

    content.innerHTML = `
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="font-black text-white uppercase tracking-tight text-xl">Tabla de Posiciones ${totalDays > 1 ? (dayFilter === 'all' ? '· Acumulado General' : `· ${getDayLabel(parseInt(dayFilter), currentTournamentConfig)}`) : ''}</h2>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Desempate Oficial: Últ. 9 hoyos (10-18) → 6 hoyos → 3 hoyos → Hoyo 18 → 1ª Vuelta → 1er Día (con 80% HCP)</p>
                </div>
                <a href="${window.location.origin}/torneo/?id=${currentTournamentID}" target="_blank"
                    class="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-xl text-xs font-black uppercase hover:bg-primary/20 transition-all">
                    <span class="material-icons" style="font-size:14px">open_in_new</span> Ver Live
                </a>
            </div>
            ${dayFilterBarHtml}
            ${Object.keys(categories).length === 0
                ? `<div class="py-20 text-center text-slate-600 font-black uppercase tracking-widest text-xs">Sin scores capturados todavía${dayFilter !== 'all' ? ' para este día' : ''}.</div>`
                : html}
        </div>`;
}

// ================================================
// SECTION: NERVE CENTER
// ================================================
async function renderNerveCenter(content, teamsCount, scoresCount, oyesesCount) {
    const liveUrl = `${window.location.origin}/torneo/?id=${currentTournamentID}`;

    content.innerHTML = `
        <div class="space-y-6">
            <h2 class="font-black text-white uppercase tracking-tight text-xl">Nerve Center</h2>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
                ${[
                    { label:'Participantes', val: teamsCount,  icon:'groups',      color:'blue' },
                    { label:'Scores',        val: scoresCount, icon:'score',        color:'green' },
                    { label:"Oye's",         val: oyesesCount, icon:'sports_golf',  color:'purple' },
                ].map(s => `
                    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-5">
                        <div class="w-14 h-14 rounded-2xl flex items-center justify-center
                            ${s.color==='blue'?'bg-blue-500/10 border border-blue-500/20':
                              s.color==='green'?'bg-primary/10 border border-primary/20':
                              'bg-purple-500/10 border border-purple-500/20'}">
                            <span class="material-icons ${s.color==='blue'?'text-blue-400':s.color==='green'?'text-primary':'text-purple-400'}">${s.icon}</span>
                        </div>
                        <div>
                            <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">${s.label}</p>
                            <p class="text-4xl font-black text-white">${s.val}</p>
                        </div>
                    </div>`).join('')}
            </div>

            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-5">
                <div>
                    <h4 class="font-black text-white uppercase tracking-tight mb-1">URL del Visor en Vivo</h4>
                    <p class="text-slate-500 text-sm mb-4">Comparte esta URL con los participantes para que vean el leaderboard en tiempo real.</p>
                </div>
                <div class="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                    <span class="material-icons text-primary" style="font-size:16px">link</span>
                    <span class="text-sm font-bold text-slate-300 truncate flex-1">${liveUrl}</span>
                    <button onclick="navigator.clipboard.writeText('${liveUrl}').then(()=>window.showNotification('¡Copiado!','URL copiada al portapapeles.','success'))"
                        class="px-4 py-2 bg-primary/20 text-primary rounded-xl text-xs font-black uppercase hover:bg-primary/30 transition-colors whitespace-nowrap">
                        Copiar URL
                    </button>
                </div>
                <a href="${liveUrl}" target="_blank"
                    class="inline-flex items-center gap-2 px-6 py-3.5 bg-primary text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                    <span class="material-icons" style="font-size:16px">open_in_new</span> Abrir Visor en Vivo
                </a>
            </div>
        </div>`;
}

// ================================================
// WHS SYNC HELPERS (Individual Tournaments)
// ================================================
async function syncTournamentScoreToWHS(team, gross, holeScores) {
    try {
        const { data: members } = await supabaseTarget.from('members').select('*');
        if (!members || members.length === 0) return;

        let member = null;
        if (team.member_id) {
            member = members.find(m => String(m.id) === String(team.member_id));
        }
        if (!member) {
            const pName = (team.player1 || team.teamname || '').toLowerCase().trim();
            member = members.find(m => m.name.toLowerCase().trim() === pName);
        }
        if (!member) return; // Jugador foráneo o invitado externo

        const teeColor = team.tee_color || 'BLANCA';
        const teeMap = {
            'BLANCA':      { rating: 66.5, slope: 125 },
            'DORADA':      { rating: 65.7, slope: 122 },
            'PLATEADA':    { rating: 65.5, slope: 121 },
            'AZUL':        { rating: 68.0, slope: 128 },
            'WHITE':       { rating: 66.5, slope: 125 },
            'GOLD':        { rating: 65.7, slope: 122 },
            'SILVER':      { rating: 65.5, slope: 121 }
        };
        const teeInfo = teeMap[teeColor.toUpperCase()] || teeMap['BLANCA'];
        const diff = parseFloat((((gross - teeInfo.rating) * 113) / teeInfo.slope).toFixed(1));

        // Obtener datos del torneo
        const { data: tourData } = await supabaseTarget.from('tournaments').select('*').eq('id', String(currentTournamentID)).single();
        const tourName = tourData?.name || 'Torneo Colima';
        const tourDate = tourData?.date || new Date().toISOString().split('T')[0];

        const dbStarter = supabase.schema('starter');

        // Verificar si ya existe registro para este torneo
        const { data: existingWHS } = await dbStarter.from('member_scores')
            .select('id')
            .eq('member_id', member.id)
            .eq('date_played', tourDate);

        let holeScoresObj = holeScores;
        if (typeof holeScoresObj === 'string') {
            try { holeScoresObj = JSON.parse(holeScoresObj); } catch(e) { holeScoresObj = null; }
        }

        const whsPayload = {
            member_id:     member.id,
            date_played:   tourDate,
            gross_score:   gross,
            course_rating: teeInfo.rating,
            slope_rating:  teeInfo.slope,
            differential:  diff,
            hole_scores:   holeScoresObj,
            course_name:   'CLUB DE GOLF COLIMA',
            tee_color:     teeColor,
            notes:         `Torneo: ${tourName}`
        };

        if (existingWHS && existingWHS.length > 0) {
            await dbStarter.from('member_scores').update(whsPayload).eq('id', existingWHS[0].id);
        } else {
            await dbStarter.from('member_scores').insert([whsPayload]);
        }

        // Recalcular Handicap Index del socio
        await recalculateMemberHandicapWHS(member.id);

    } catch (err) {
        console.error('Error auto-syncing tournament score to WHS:', err);
    }
}

async function recalculateMemberHandicapWHS(memberId) {
    try {
        const dbStarter = supabase.schema('starter');
        const { data: scores } = await dbStarter.from('member_scores')
            .select('*')
            .eq('member_id', memberId)
            .order('date_played', { ascending: false })
            .limit(20);

        if (!scores || scores.length === 0) return;

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

        await supabaseTarget.from('members').update({
            current_handicap: newHandicapIndex
        }).eq('id', memberId);

    } catch (err) {
        console.error('Error recalculating handicap:', err);
    }
}

