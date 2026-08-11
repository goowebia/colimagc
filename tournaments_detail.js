// ================================================
// tournaments_detail.js — ColimaGC
// Master Console idéntica al diseño de PassGolf
// ================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tztolxgsaktqindoimtu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dG9seGdzYWt0cWluZG9pbXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzQ4ODAsImV4cCI6MjEwMTg1MDg4MH0.E2GABiOMXYb5hEwE9ErIcJa6_LHkj9lJUglQVoiLl0M';

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
                        class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all shrink-0">
                        <span class="material-icons" style="font-size:20px">arrow_back</span>
                    </button>
                    <div class="flex items-center gap-3">
                        <div class="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md shrink-0">
                            <img src="./golcolima.jpg" alt="Club Colima" class="h-10 w-auto object-contain rounded-xl" onerror="this.style.display='none'">
                            <img src="./logoclub.png" alt="Asociación" class="h-10 w-auto object-contain rounded-xl" onerror="this.style.display='none'">
                        </div>
                        <div>
                            <h1 class="text-2xl font-black text-white uppercase tracking-tight leading-none">${currentTournamentName}</h1>
                            <p class="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1">Dashboard de Control &nbsp;·&nbsp;
                                <span class="text-slate-400">${teamsCount} ${teamUnitLabel} · ${scoresCount} Scores · ${oyesesCount} Oye's</span>
                            </p>
                        </div>
                    </div>
                </div>
                <a href="/torneo/index.html?id=${currentTournamentID}" target="_blank"
                    class="flex items-center gap-2 px-4 py-2.5 bg-primary text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 self-start">
                    <span class="material-icons" style="font-size:15px">open_in_new</span> Visor Live
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
    const { data: teams } = await supabaseTarget
        .from('teams').select('*')
        .eq('eventid', String(currentTournamentID))
        .order('hole', { ascending: true });

    const teamsArr = teams || [];

    content.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">

            <!-- ====== PANEL IZQUIERDO ====== -->
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-6 overflow-y-auto">

                <!-- CONFIGURACIÓN -->
                <div>
                    <div class="flex items-center gap-2 mb-5">
                        <div class="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                            <span class="material-icons text-slate-400" style="font-size:18px">settings</span>
                        </div>
                        <h3 class="font-black text-white uppercase tracking-widest text-xs">Configuración</h3>
                    </div>

                    <!-- MODALIDAD -->
                    <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Modalidad</p>
                    <div class="grid grid-cols-2 gap-2 mb-5">
                        ${[1,2,3,4].map(n => `
                            <button onclick="updateTeamSize(${n})" id="ts-btn-${n}"
                                class="py-3 rounded-xl border text-[10px] font-black uppercase transition-all
                                ${teamSize === n
                                    ? 'bg-slate-900 border-white text-white shadow-inner'
                                    : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'}">
                                ${n} Jugador${n > 1 ? 'es' : ''}
                            </button>`).join('')}
                    </div>

                    <!-- SISTEMA DE JUEGO -->
                    <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Sistema de Juego</p>
                    <select id="cfg-modalidad" onchange="updateModalidad(this.value)"
                        class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-black uppercase focus:outline-none focus:border-primary transition-all mb-5">
                        ${['A GO GO','STROKE PLAY (INDIVIDUAL)','STROKE PLAY (EQUIPO)','MEJOR BOLA','STABLEFORD','SCRAMBLE'].map(m =>
                            `<option value="${m}" ${modalidad === m ? 'selected' : ''}>${m}</option>`).join('')}
                    </select>

                    <!-- GESTIONAR CATEGORÍAS -->
                    <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Gestionar Categorías</p>
                    <div class="flex gap-2 mb-3">
                        <input id="new-cat-name" placeholder="Nueva Cat..."
                            class="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold placeholder:text-slate-600 focus:outline-none focus:border-primary transition-all">
                        <input id="new-cat-pct" type="number" value="100" min="1" max="100" placeholder="%"
                            class="w-16 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold text-center focus:outline-none focus:border-primary transition-all">
                        <button onclick="addCategoryToConfig()"
                            class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-slate-900 font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                            <span class="material-icons" style="font-size:20px">add</span>
                        </button>
                    </div>
                    <!-- Tags de categorías -->
                    <div id="cat-tags" class="flex flex-wrap gap-2">
                        ${categories.map(c => renderCatTag(c)).join('')}
                    </div>
                </div>

                <!-- REGISTRO DE PARTICIPANTE -->
                <div class="border-t border-slate-800 pt-5">
                    <div class="flex items-center gap-2 mb-4">
                        <span class="material-icons text-primary" style="font-size:18px">person_add</span>
                        <h3 class="font-black text-white uppercase tracking-widest text-xs">Registro de Participante</h3>
                    </div>

                    <div class="space-y-3">
                        ${[1,2,3,4].filter(n => n <= teamSize).map(n => `
                            <input id="reg-p${n}" placeholder="${n === 1 ? 'Jugador Principal' : 'Jugador ' + n}"
                                class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-bold placeholder:text-slate-600 focus:outline-none focus:border-primary transition-all">`).join('')}

                        ${categories.length > 0 ? `
                        <select id="reg-cat" onchange="autoCalcVentaja()" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-primary transition-all">
                            <option value="">Categoría...</option>
                            ${categories.map(c => {
                                const name = typeof c === 'object' ? c.name : c;
                                return `<option value="${name}">${name}</option>`;
                            }).join('')}
                        </select>` : ''}

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
                                    <input id="reg-index" type="number" step="0.1" min="0" max="54" placeholder="Ej. 12.0" oninput="autoCalcVentaja()"
                                        class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-bold text-center focus:outline-none focus:border-primary transition-all">
                                </div>
                                <div>
                                    <label class="block text-[9px] font-black text-slate-400 uppercase mb-1">HCP de Campo</label>
                                    <input id="reg-hdcp-calc" type="number" readonly placeholder="0"
                                        class="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-emerald-400 text-sm font-black text-center cursor-not-allowed">
                                </div>
                            </div>
                            <div>
                                <label class="block text-[9px] font-black text-slate-400 uppercase mb-1">Marcas de Salida (Tees)</label>
                                <select id="reg-tee" onchange="autoCalcVentaja()" class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-primary transition-all">
                                    <option value="WHITE_BLUE">🔵⚪ Blancas / Azules (104.5 / 67.5)</option>
                                    <option value="GOLD_YELLOW">🟡🟡 Doradas / Amarillas (99.6 / 65.8)</option>
                                    <option value="RED_MEN">🔴🔴 Rojas Caballeros (95.9 / 64.5)</option>
                                    <option value="RED_LADIES">🔴🔴 Rojas Damas (95.9 / 64.5)</option>
                                    <option value="SILVER">⚪⚪ Plateadas Damas (94.6 / 64.1)</option>
                                </select>
                            </div>
                        </div>

                        <!-- CAMPOS MODO DIRECTO -->
                        <div id="section-direct-mode" class="hidden space-y-2">
                            <label class="block text-[9px] font-black text-slate-400 uppercase">Hándicap de Campo Directo</label>
                            <input id="reg-hdcp" type="number" min="0" max="54" value="0" oninput="autoCalcVentaja()"
                                class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-bold text-center focus:outline-none focus:border-primary transition-all">
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

            <!-- ====== PANEL DERECHO ====== -->
            <div class="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">

                <!-- Header con ordenamiento -->
                <div class="px-5 py-3 border-b border-slate-800 flex flex-wrap items-center gap-2">
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Participantes</span>

                    <!-- Sort buttons -->
                    <div class="flex gap-1">
                        <button id="sort-registro" onclick="sortTeams('registro')" title="Orden de registro"
                            class="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all bg-primary text-slate-900">
                            F. Registro
                        </button>
                        <button id="sort-categoria" onclick="sortTeams('categoria')" title="Por categoría"
                            class="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all bg-slate-800 border border-slate-700 text-slate-400 hover:text-white">
                            Categoría
                        </button>
                        <button id="sort-ventaja" onclick="sortTeams('ventaja')" title="Por ventaja"
                            class="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all bg-slate-800 border border-slate-700 text-slate-400 hover:text-white">
                            Ventaja
                        </button>
                        <button id="sort-hoyo" onclick="sortTeams('hoyo')" title="Por hoyo de salida"
                            class="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all bg-slate-800 border border-slate-700 text-slate-400 hover:text-white">
                            Hoyo Salida
                        </button>
                    </div>

                    <div class="flex items-center gap-2 ml-auto">
                        <span id="reg-count-badge" class="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs font-black text-white">${teamsArr.length} ${teamSize === 1 ? 'Jugadores' : 'Grupos'}</span>
                        <input id="reg-search" placeholder="Buscar..." onkeyup="filterTeams(this.value)"
                            class="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold placeholder:text-slate-600 focus:outline-none focus:border-primary transition-all w-32">
                        <button onclick="printTeamsList()" title="Imprimir PDF"
                            class="flex items-center gap-1 px-3 py-2 bg-primary/10 border border-primary/30 hover:bg-primary/20 rounded-xl text-primary transition-all text-xs font-black">
                            <span class="material-icons" style="font-size:15px">print</span> Imprimir
                        </button>
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
                    <input id="edit-cat-new-pct" type="number" min="0" max="100" placeholder="100"
                        class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-bold text-center focus:outline-none focus:border-primary transition-all">
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
        'WHITE_BLUE':  { name: '🔵⚪ Blancas / Azules', rating: 67.5, slope: 104.5, par: 68 },
        'GOLD_YELLOW': { name: '🟡🟡 Doradas / Amarillas', rating: 65.8, slope: 99.6, par: 68 },
        'RED_MEN':     { name: '🔴🔴 Rojas Caballeros', rating: 64.5, slope: 95.9, par: 68 },
        'RED_LADIES':  { name: '🔴🔴 Rojas Damas', rating: 64.5, slope: 95.9, par: 68 },
        'SILVER':      { name: '⚪⚪ Plateadas Damas', rating: 64.1, slope: 94.6, par: 68 }
    };

    window.calculateCourseHdcp = (playerIndex, teeKey) => {
        const tee = window.COLIMA_TEES[teeKey] || window.COLIMA_TEES['WHITE_BLUE'];
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
            const teeKey   = document.getElementById('reg-tee')?.value || 'WHITE_BLUE';
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

    window.addCategoryToConfig = addCategoryToConfig;
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

function renderCatTag(c) {
    const name = typeof c === 'object' ? c.name : c;
    const pct  = typeof c === 'object' ? (c.pct || 100) : 100;
    const escaped = name.replace(/'/g, "\\'");
    return `<span class="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/15 border border-primary/30 rounded-full text-[10px] font-black text-primary uppercase">
        <span>${name} (${pct}%)</span>
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
                        ${cat ? `<span class="px-2 py-0.5 bg-primary/15 text-primary border border-primary/30 rounded-full text-[9px] font-black uppercase tracking-wide">${cat}</span>` : ''}
                    </div>
                    ${players.length > 1 ? `<p class="text-slate-500 text-[11px] font-bold mt-0.5 truncate">${players.slice(1).join(' · ')}</p>` : ''}
                </div>
                <!-- Action buttons -->
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onclick="openEditModal('${t.id}')"
                        class="w-7 h-7 bg-slate-700 hover:bg-primary/20 hover:border-primary/40 border border-slate-600 rounded-lg flex items-center justify-center transition-all">
                        <span class="material-icons text-slate-300 hover:text-primary" style="font-size:13px">edit</span>
                    </button>
                    <button onclick="deleteTeamById('${t.id}', '${name.replace(/'/g, "\\'")}')"
                        class="w-7 h-7 bg-red-900/20 hover:bg-red-900/40 border border-red-900/30 rounded-lg flex items-center justify-center transition-all">
                        <span class="material-icons text-red-400" style="font-size:13px">delete</span>
                    </button>
                </div>
            </div>

            <!-- Bottom stats -->
            <div class="flex items-center gap-0 border-t border-slate-700/50">
                <div class="flex-1 px-4 py-2.5 border-r border-slate-700/50">
                    <p class="text-[9px] font-black text-slate-600 uppercase tracking-wider">HDCP</p>
                    <p class="text-base font-black text-slate-300">${hdcp}</p>
                </div>
                <div class="flex-1 px-4 py-2.5 border-r border-slate-700/50">
                    <p class="text-[9px] font-black text-slate-600 uppercase tracking-wider">Ventaja</p>
                    <p class="text-base font-black text-primary">${ventaja} <span class="text-[9px] text-slate-500">gls</span></p>
                </div>
                <div class="px-4 py-2.5 text-right min-w-[60px]">
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
        teamSize:   window._currentTeamSize,
        categories: window._currentCategories,
        modalidad:  window._currentModalidad
    };
    const { error } = await supabaseTarget.from('tournaments').update({ config: newConfig }).eq('id', currentTournamentID);
    if (!error) currentTournamentConfig = newConfig;
    return error;
}

function refreshRegCatDropdown() {
    const sel = document.getElementById('reg-cat');
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = `<option value="">Categoría...</option>${window._currentCategories.map(c => {
        const n = typeof c === 'object' ? c.name : c;
        return `<option value="${n}" ${n === cur ? 'selected' : ''}>${n}</option>`;
    }).join('')}`;
}

window.addCategoryToConfig = async function() {
    const nameEl = document.getElementById('new-cat-name');
    const pctEl  = document.getElementById('new-cat-pct');
    const name = nameEl?.value.trim().toUpperCase();
    const pct  = parseInt(pctEl?.value || '100') || 100;
    if (!name) return;
    const exists = window._currentCategories.some(c => (typeof c === 'object' ? c.name : c) === name);
    if (exists) return;
    window._currentCategories.push({ name, pct });
    if (nameEl) nameEl.value = '';
    if (pctEl) pctEl.value = '100';
    refreshCatTags();
    refreshRegCatDropdown();
    const err = await saveConfig();
    if (err) _showNotificationRef('Error guardando', err.message, 'error');
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
    const name = typeof catObj === 'object' ? catObj.name : catObj;
    const pct  = typeof catObj === 'object' ? (catObj.pct || 100) : 100;

    const oldEl  = document.getElementById('edit-cat-old-name');
    const nameEl = document.getElementById('edit-cat-new-name');
    const pctEl  = document.getElementById('edit-cat-new-pct');

    if (oldEl) oldEl.value = name;
    if (nameEl) nameEl.value = name;
    if (pctEl) pctEl.value = pct;

    const modal = document.getElementById('edit-cat-modal');
    if (modal) modal.classList.remove('hidden');
};

window.closeEditCatModal = function() {
    const modal = document.getElementById('edit-cat-modal');
    if (modal) modal.classList.add('hidden');
};

window.saveEditCategory = async function() {
    const oldName = document.getElementById('edit-cat-old-name')?.value || '';
    const newName = document.getElementById('edit-cat-new-name')?.value.trim().toUpperCase();
    const newPct  = parseInt(document.getElementById('edit-cat-new-pct')?.value || '100') || 100;

    if (!newName) {
        _showNotificationRef('Nombre Requerido', 'Ingresa un nombre para la categoría.', 'error');
        return;
    }

    const idx = (window._currentCategories || []).findIndex(c => (typeof c === 'object' ? c.name : c) === oldName);
    if (idx === -1) return;

    window._currentCategories[idx] = { name: newName, pct: newPct };

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

    _showNotificationRef('Categoría Actualizada', `Categoría "${newName}" (${newPct}%) guardada. ${affectedTeams ? affectedTeams.length : 0} registros actualizados.`, 'success');

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
    let teeColor    = 'WHITE_BLUE';
    let hdcp        = 0;

    if (window._regHdcpMode === 'index') {
        playerIndex = parseFloat(document.getElementById('reg-index')?.value || '0') || 0;
        teeColor    = document.getElementById('reg-tee')?.value || 'WHITE_BLUE';
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
        ['reg-p1', 'reg-p2', 'reg-p3', 'reg-p4', 'reg-index', 'reg-hdcp'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        // Immediately refresh team list section
        setSection('teams');
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

async function renderScores(content, courses) {
    const [teamsRes, scoresRes] = await Promise.all([
        supabaseTarget.from('teams').select('*').eq('eventid', String(currentTournamentID)).order('hole'),
        supabaseTarget.from('scores').select('*').eq('eventid', String(currentTournamentID)).order('created_at', { ascending: false })
    ]);
    const teams  = teamsRes.data  || [];
    const scores = scoresRes.data || [];

    window._scoresTeamsList   = teams;
    window._scoresList        = scores;
    window._selectedScoreTeam = teams[0] || null;
    window._currentHoleScores = {};

    const pendingTeams  = teams.filter(t => !scores.some(s => String(s.teamid) === String(t.id)));
    const capturedTeams = teams.filter(t =>  scores.some(s => String(s.teamid) === String(t.id)));

    const renderScoreCardItem = (t, hasScore) => {
        const isSelected = window._selectedScoreTeam?.id === t.id;
        const players = [t.player1, t.player2, t.player3, t.player4].filter(Boolean);
        const name = t.teamname || players[0] || '—';
        return `
        <div onclick="selectTeamForScorecard('${t.id}')" id="player-card-${t.id}" data-player-search="${name.toLowerCase()}"
            class="p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' : (hasScore ? 'bg-slate-800/40 border-slate-700/40 opacity-80 hover:opacity-100' : 'bg-slate-800/90 border-slate-700/80 hover:border-slate-500')}">
            <div class="flex items-center justify-between gap-2">
                <div class="min-w-0 flex-1">
                    <p class="font-black text-white uppercase text-xs truncate">${name}</p>
                    ${players.length > 1 ? `<p class="text-[10px] text-slate-500 font-bold truncate mt-0.5">${players[0]}</p>` : ''}
                    ${t.category ? `<span class="inline-block mt-1 px-2 py-0.5 bg-primary/15 text-primary border border-primary/30 rounded-full text-[9px] font-black uppercase">${t.category}</span>` : ''}
                </div>
                ${hasScore 
                    ? `<span class="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[9px] font-black uppercase shrink-0 flex items-center gap-1"><span class="material-icons" style="font-size:11px">check_circle</span> Capturado</span>` 
                    : `<span class="px-2 py-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-lg text-[9px] font-black uppercase shrink-0 flex items-center gap-1"><span class="material-icons" style="font-size:11px">hourglass_empty</span> Pendiente</span>`}
            </div>
        </div>`;
    };

    content.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)] min-h-[600px]">

            <!-- ====== PANEL IZQUIERDO: SELECCIÓN DE JUGADOR ====== -->
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 overflow-hidden">
                <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div class="flex items-center gap-2">
                        <span class="material-icons text-primary" style="font-size:18px">sports_golf</span>
                        <h3 class="font-black text-white uppercase tracking-widest text-xs">Seleccionar Jugador</h3>
                    </div>
                </div>

                <!-- Buscador -->
                <input id="score-player-search" placeholder="BUSCAR JUGADOR..." onkeyup="filterScorePlayers(this.value)"
                    class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold uppercase placeholder:text-slate-600 focus:outline-none focus:border-primary transition-all">

                <!-- Header badge count -->
                <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <span class="text-amber-400">⏳ Pendientes (${pendingTeams.length})</span>
                    <span class="text-emerald-400">✓ Capturados (${capturedTeams.length})</span>
                </div>

                <!-- Lista de Jugadores / Equipos Ordenada -->
                <div id="score-players-list" class="flex-1 overflow-y-auto space-y-2 pr-1">
                    ${teams.length === 0
                        ? `<div class="py-12 text-center text-slate-600 font-black uppercase tracking-widest text-xs">Sin registrados aún.</div>`
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
            <div class="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
                <div id="scorecard-wrapper" class="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
                    <!-- Poblado por selectTeamForScorecard -->
                </div>
            </div>
        </div>`;

    window.filterScorePlayers = (query) => {
        const q = query.toLowerCase();
        document.querySelectorAll('#score-players-list > div[data-player-search]').forEach(card => {
            const n = card.dataset.playerSearch || '';
            card.style.display = n.includes(q) ? '' : 'none';
        });
    };

    window.selectTeamForScorecard = (teamId) => {
        const teams = window._scoresTeamsList || [];
        const scores = window._scoresList || [];
        const team = teams.find(t => String(t.id) === String(teamId));
        if (!team) return;

        window._selectedScoreTeam = team;

        teams.forEach(t => {
            const el = document.getElementById(`player-card-${t.id}`);
            if (!el) return;
            const hasScore = scores.some(s => String(s.teamid) === String(t.id));
            if (t.id === team.id) {
                el.className = 'p-3 rounded-xl border transition-all cursor-pointer bg-primary/10 border-primary shadow-lg shadow-primary/10';
            } else {
                el.className = `p-3 rounded-xl border transition-all cursor-pointer ${hasScore ? 'bg-slate-800/40 border-slate-700/40 opacity-80 hover:opacity-100' : 'bg-slate-800/90 border-slate-700/80 hover:border-slate-500'}`;
            }
        });

        const existingScore = scores.find(s => String(s.teamid) === String(team.id));
        let holeScores = {};
        if (existingScore && existingScore.hole_scores) {
            try {
                holeScores = typeof existingScore.hole_scores === 'string'
                    ? JSON.parse(existingScore.hole_scores)
                    : existingScore.hole_scores;
            } catch(e) { holeScores = {}; }
        }
        window._currentHoleScores = holeScores;

        renderScorecardBody(team, existingScore);
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
        const team = window._selectedScoreTeam;
        if (!team) {
            _showNotificationRef('Selecciona un jugador', 'Debes seleccionar un jugador de la lista.', 'error');
            return;
        }

        const scores = window._currentHoleScores || {};
        let outSum = 0; for (let i = 1; i <= 9; i++)  { const v = parseInt(scores[`h${i}`]); if (!isNaN(v) && v > 0) outSum += v; }
        let inSum  = 0; for (let i = 10; i <= 18; i++) { const v = parseInt(scores[`h${i}`]); if (!isNaN(v) && v > 0) inSum += v; }
        const gross = outSum + inSum;
        const net   = gross > 0 ? (gross - (team.ventaja || 0)) : 0;

        if (gross === 0) {
            _showNotificationRef('Scorecard vacía', 'Ingresa al menos un score en algún hoyo.', 'error');
            return;
        }

        const existing = (window._scoresList || []).find(s => String(s.teamid) === String(team.id));

        const payload = {
            eventid:     String(currentTournamentID),
            teamid:      team.id,
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
        } else {
            _showNotificationRef('¡Scorecard Guardado!', `Scorecard de ${team.teamname} guardado correctamente (Gross: ${gross}, Neto: ${net}).`, 'success');
            setTimeout(() => setSection('scores'), 800);
        }
    };

    // Auto-select first pending team if available, otherwise first team
    const initialTeam = pendingTeams.length > 0 ? pendingTeams[0] : (teams.length > 0 ? teams[0] : null);
    if (initialTeam) {
        selectTeamForScorecard(initialTeam.id);
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

    const inHoles  = CLUB_COLIMA_HOLES.slice(0, 9);  // Hoyos 1-9 (IN)
    const outHoles = CLUB_COLIMA_HOLES.slice(9, 18); // Hoyos 10-18 (OUT)

    wrapper.innerHTML = `
        <!-- HEADER DEL SCORECARD -->
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-black text-sm shrink-0">
                    #${holeNum}
                </div>
                <div>
                    <div class="flex items-center gap-2 flex-wrap">
                        <h2 class="text-base font-black text-white uppercase">${teamName}</h2>
                        <span class="px-3 py-1 bg-primary/15 text-primary border border-primary/30 rounded-full text-[10px] font-black uppercase">VENTAJA: ${ventaja} GOLPES</span>
                    </div>
                    <p class="text-[11px] text-slate-400 font-bold mt-0.5">P1: ${players[0] || teamName} (HCP ${hdcp})</p>
                </div>
            </div>

            <!-- TOTALES DERECHA -->
            <div class="flex items-center gap-2">
                <div class="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-center min-w-[80px]">
                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-wider">CAMPO</p>
                    <p class="text-xs font-black text-white uppercase truncate max-w-[80px]">${courseName}</p>
                </div>
                <div class="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-center min-w-[45px]">
                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-wider">IN (1-9)</p>
                    <p id="sc-in" class="text-base font-black text-white">0</p>
                </div>
                <div class="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-center min-w-[45px]">
                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-wider">OUT (10-18)</p>
                    <p id="sc-out" class="text-base font-black text-white">0</p>
                </div>
                <div class="px-3.5 py-2 bg-blue-500/20 border border-blue-500/40 rounded-xl text-center min-w-[60px]">
                    <p class="text-[8px] font-black text-blue-300 uppercase tracking-wider">GROSS</p>
                    <p id="sc-gross" class="text-2xl font-black text-blue-300 leading-none">0</p>
                </div>
                <div class="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-center min-w-[45px]">
                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-wider">VTJ</p>
                    <p class="text-base font-black text-blue-400">−${ventaja}</p>
                </div>
                <div class="px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-center min-w-[85px]">
                    <p class="text-[8px] font-black text-emerald-400 uppercase tracking-wider">TOTAL NETO</p>
                    <p id="sc-net" class="text-2xl font-black text-emerald-400 leading-none">0</p>
                </div>
            </div>
        </div>

        <!-- VUELTA 1-9 (IN) -->
        <div class="bg-slate-800/30 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div class="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
                <span>VUELTA 1-9 (IN)</span>
                <span class="text-[10px] text-slate-500">PAR 34</span>
            </div>
            <div class="grid grid-cols-9 gap-1.5">
                ${inHoles.map(h => renderHoleCard(h)).join('')}
            </div>
        </div>

        <!-- VUELTA 10-18 (OUT) -->
        <div class="bg-slate-800/30 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div class="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
                <span>VUELTA 10-18 (OUT)</span>
                <span class="text-[10px] text-slate-500">PAR 34</span>
            </div>
            <div class="grid grid-cols-9 gap-1.5">
                ${outHoles.map(h => renderHoleCard(h)).join('')}
            </div>
        </div>

        <!-- BOTTOM ACTIONS -->
        <div class="flex items-center justify-between pt-2">
            <div class="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                <span class="material-icons" style="font-size:16px">sync</span>
                <span class="uppercase text-[10px] tracking-wider">Autocálculo Activo</span>
            </div>
            <button onclick="saveScorecard()"
                class="px-8 py-3.5 bg-primary text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
                <span class="material-icons" style="font-size:18px">save</span> Guardar Scorecard
            </button>
        </div>`;

    recalcScorecardTotals();
}

function renderHoleCard(h) {
    const val = window._currentHoleScores?.[`h${h.hole}`] || '';
    const hasVal = val !== '' && !isNaN(val) && parseInt(val) > 0;
    return `
    <div id="hole-card-${h.hole}"
        class="flex flex-col items-center justify-between p-2 rounded-2xl border transition-all ${hasVal ? 'bg-emerald-500/20 border-emerald-500/50 shadow-md shadow-emerald-500/10' : 'bg-slate-800 border-slate-700/80'}">
        <div class="text-center">
            <p class="text-[10px] font-black text-slate-400">#${h.hole}</p>
            <p class="text-[8px] font-bold text-slate-500 uppercase">PAR ${h.par}</p>
        </div>
        <input id="score-h${h.hole}" type="text" inputmode="numeric" pattern="[0-9]*" value="${val}" autocomplete="off"
            onkeydown="handleHoleKeyDown(event, ${h.hole})"
            oninput="onHoleInput(${h.hole}, this)"
            onfocus="this.select()"
            class="w-full text-center py-2 my-1 bg-slate-900/80 border border-slate-700 rounded-xl text-white font-black text-base focus:outline-none focus:border-primary transition-all">
        <div class="text-[8px] font-black uppercase text-slate-500 tracking-wider">
            IDX ${h.idx}
        </div>
    </div>`;
}

function recalcScorecardTotals() {
    const team = window._selectedScoreTeam;
    const ventaja = team?.ventaja || 0;
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

    const inEl    = document.getElementById('sc-in');
    const outEl   = document.getElementById('sc-out');
    const grossEl = document.getElementById('sc-gross');
    const netEl   = document.getElementById('sc-net');

    if (inEl)    inEl.textContent    = inSum    || '0';
    if (outEl)   outEl.textContent   = outSum   || '0';
    if (grossEl) grossEl.textContent = gross   || '0';
    if (netEl)   netEl.textContent   = net     || '0';

    for (let i = 1; i <= 18; i++) {
        const card = document.getElementById(`hole-card-${i}`);
        const inputEl = document.getElementById(`score-h${i}`);
        const v = parseInt(scores[`h${i}`]);
        if (card) {
            if (!isNaN(v) && v > 0) {
                card.className = 'flex flex-col items-center justify-between p-2 rounded-2xl border transition-all bg-emerald-500/20 border-emerald-500/50 shadow-md shadow-emerald-500/10';
                if (inputEl) inputEl.className = 'w-full text-center py-2 my-1 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-300 font-black text-base focus:outline-none focus:border-primary transition-all';
            } else {
                card.className = 'flex flex-col items-center justify-between p-2 rounded-2xl border transition-all bg-slate-800 border-slate-700/80';
                if (inputEl) inputEl.className = 'w-full text-center py-2 my-1 bg-slate-900/80 border border-slate-700 rounded-xl text-white font-black text-base focus:outline-none focus:border-primary transition-all';
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
        supabaseTarget.from('teams').select('ventaja, hdcp').eq('id', teamId).maybeSingle()
    ]);

    const ventaja = teamData?.ventaja || 0;

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

    const contentHtml = teamScores.map((s) => {
        let holeScoresObj = {};
        if (s.hole_scores) {
            try {
                holeScoresObj = typeof s.hole_scores === 'string' ? JSON.parse(s.hole_scores) : s.hole_scores;
            } catch(e) { holeScoresObj = {}; }
        }

        const outSum = s.out_score !== undefined && s.out_score !== null ? s.out_score : 0;
        const inSum  = s.in_score  !== undefined && s.in_score  !== null ? s.in_score  : 0;
        const gross  = s.gross || s.total || 0;
        const net    = s.net   !== undefined && s.net   !== null ? s.net : (gross > 0 ? (gross - ventaja) : 0);

        const holesArray = [];
        for (let i = 1; i <= 18; i++) {
            holesArray.push(holeScoresObj[`h${i}`] !== undefined ? holeScoresObj[`h${i}`] : '-');
        }

        return `
            <div class="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden mb-4">
                <div class="bg-primary/20 border-b border-primary/30 px-5 py-3 flex justify-between items-center">
                    <span class="font-black uppercase text-xs text-white tracking-widest">${s.coursename || 'CLUB DE GOLF COLIMA'}</span>
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] font-black uppercase bg-slate-800 px-3 py-1 rounded-full text-slate-300">GROSS: ${gross}</span>
                        <span class="text-[10px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full">VTJ: −${ventaja}</span>
                        <span class="text-xs font-black uppercase bg-primary text-slate-900 px-3 py-1 rounded-full">NETO: ${net}</span>
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
                            <p class="text-[8px] text-slate-400 font-black uppercase">TOTAL NETO</p>
                            <p class="text-xl font-black text-primary">${net}</p>
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
// SECTION: POSICIONES
// ================================================
async function renderPosiciones(content) {
    const [teamsRes, scoresRes] = await Promise.all([
        supabaseTarget.from('teams').select('*').eq('eventid', String(currentTournamentID)),
        supabaseTarget.from('scores').select('*').eq('eventid', String(currentTournamentID)).order('created_at', { ascending: false })
    ]);
    const teams  = teamsRes.data  || [];
    const scores = scoresRes.data || [];

    const categories = {};
    teams.forEach(t => {
        const cat = t.category || 'GENERAL';
        const ts  = scores.filter(s => String(s.teamid) === String(t.id));
        if (ts.length === 0) return;

        const latest = ts[0];
        const gross   = latest.gross || latest.total || 0;
        const ventaja = t.ventaja || 0;
        const neto    = (latest.net !== undefined && latest.net !== null && latest.net > 0)
            ? latest.net
            : (gross > 0 ? (gross - ventaja) : 0);

        if (!categories[cat]) categories[cat] = [];
        categories[cat].push({ team: t, gross, neto, rounds: 1, ventaja });
    });

    const sortedCatKeys = Object.keys(categories).sort();
    const html = sortedCatKeys.map((cat, catIdx) => {
        const sorted = categories[cat].sort((a, b) => a.neto - b.neto);
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
                        <span class="text-[10px] font-black uppercase ${theme.text} tracking-wider hidden sm:inline">POSICIONES</span>
                    </div>

                    <h3 class="absolute left-1/2 -translate-x-1/2 font-black text-white text-sm sm:text-base uppercase tracking-widest text-center">
                        <span class="${theme.text}">${catTitle}</span>
                    </h3>

                    <span class="px-3 py-1 ${theme.badge} border rounded-full text-[10px] font-black uppercase tracking-wider ml-auto sm:ml-0">
                        ${sorted.length} ${sorted.length === 1 ? 'Jugador' : 'Jugadores'}
                    </span>
                </div>

                <div class="divide-y divide-slate-800">
                    ${sorted.map((item, i) => `
                        <div class="flex items-center gap-4 px-6 py-4 ${i===0?'bg-primary/5':''}">
                            <div class="w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0
                                ${i===0?'bg-primary text-slate-900':i===1?'bg-slate-600 text-white':i===2?'bg-orange-800/40 text-orange-300':'bg-slate-800 text-slate-500'}">
                                ${i+1}
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="font-black text-white uppercase text-sm truncate">${item.team.teamname}</p>
                                <p class="text-slate-500 text-xs">${item.rounds} ronda${item.rounds!==1?'s':''} · Ventaja: −${item.ventaja}</p>
                            </div>
                            <div class="text-center w-16"><p class="text-[9px] text-slate-500 font-black">GROSS</p><p class="text-xl font-black text-slate-300">${item.gross}</p></div>
                            <div class="text-center w-16"><p class="text-[9px] text-blue-400 font-black">VTJ</p><p class="text-xl font-black text-blue-400">−${item.ventaja}</p></div>
                            <div class="text-center w-24 bg-primary/10 border border-primary/20 rounded-xl py-2">
                                <p class="text-[9px] text-primary font-black">NETO</p>
                                <p class="text-2xl font-black text-primary">${item.neto}</p>
                            </div>

                            <!-- BOTON OJO PARA VER TARJETA DE SCORECARD -->
                            <button onclick="openScorecardModalAdmin('${item.team.id}', '${item.team.teamname.replace(/'/g, "\\'")}')"
                                title="Ver Tarjeta de Score Completa"
                                class="w-9 h-9 bg-slate-800 hover:bg-primary/20 hover:border-primary/40 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-all shrink-0">
                                <span class="material-icons" style="font-size:16px">visibility</span>
                            </button>
                        </div>`).join('')}
                </div>
            </div>`;
    }).join('');

    content.innerHTML = `
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <h2 class="font-black text-white uppercase tracking-tight text-xl">Tabla de Posiciones</h2>
                <a href="/torneo/index.html?id=${currentTournamentID}" target="_blank"
                    class="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-xl text-xs font-black uppercase hover:bg-primary/20 transition-all">
                    <span class="material-icons" style="font-size:14px">open_in_new</span> Ver Live
                </a>
            </div>
            ${Object.keys(categories).length === 0
                ? `<div class="py-20 text-center text-slate-600 font-black uppercase tracking-widest text-xs">Sin scores capturados todavía.</div>`
                : html}
        </div>`;
}

// ================================================
// SECTION: NERVE CENTER
// ================================================
async function renderNerveCenter(content, teamsCount, scoresCount, oyesesCount) {
    const liveUrl = `${window.location.origin}/torneo/index.html?id=${currentTournamentID}`;

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
