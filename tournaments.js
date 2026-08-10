import { supabase } from './supabase.js';

window.renderPublicWidget = async (view) => {
  window._isPublicWidget = true; // Flag for read-only / results only mode
  const app = document.getElementById('app');
  app.innerHTML = `
    <div id="public-widget-container" class="min-h-screen bg-slate-950 text-white p-4 md:p-8 animate-fade-in">
       <!-- Premium Background -->
       <div class="fixed inset-0 pointer-events-none overflow-hidden">
           <div class="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full"></div>
           <div class="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full"></div>
       </div>
       <div id="tournament-section-content" class="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div class="col-span-full flex flex-col items-center justify-center p-20 gap-4">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Sincronizando Live Results</p>
          </div>
       </div>
    </div>
  `;

  // Fetch tournament basic data to set context
  const { data: tData } = await supabaseTarget.from('tournaments').select('*').eq('id', currentTournamentID).single();
  if (!tData) {
    document.getElementById('tournament-section-content').innerHTML = `
      <div class="col-span-full py-32 text-center">
        <div class="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <span class="material-icons text-red-500">priority_high</span>
        </div>
        <p class="text-slate-400 font-black uppercase tracking-widest text-[10px]">Torneo no encontrado.</p>
      </div>
    `;
    return;
  }
  currentTournamentName = tData.name;
  currentTournamentConfig = tData.config || { teamSize: 2, categories: [] };
  currentTournamentCourses = tData.courses ? tData.courses.split(',').map(c => c.trim()) : ["Campo Principal"];

  // Helper function to simulate section switching within public container
  window._setTSection(view);
};


// --- TOURNAMENTS (GOLF TARGET INTEGRATION) ---
const supabaseTarget = supabase.schema('colimaGC');
let currentTournamentID = null;
let currentTournamentName = "";
let currentTournamentConfig = { teamSize: 2, categories: [], modalidad: 'A GO GO' };
let currentTournamentCourses = ["Campo Principal"];
let currentTSection = 'teams'; // 'teams', 'scores', 'oyeses', 'posiciones', 'widgets'

window.initTournamentsView = async function () {
  const container = document.getElementById('tournaments-view-container');
  if (!container) return;

  // Collaborator Access Control
  if (window.currentUser?.role === 'collaborator' && window.currentUser?.tournament_id) {
    currentTournamentID = window.currentUser.tournament_id;
    const { data: tData } = await supabaseTarget.from('tournaments').select('*').eq('id', currentTournamentID).single();
    if (tData) {
      currentTournamentName = tData.name;
      currentTournamentConfig = tData.config || { teamSize: 2, categories: [] };
      currentTournamentCourses = tData.courses ? tData.courses.split(',').map(c => c.trim()) : ["Campo Principal"];
      await renderTournamentDashboard(container);

      // Hide the back button in dashboard for collaborators
      const backBtn = document.querySelector('button[onclick="currentTournamentID = null; window.initTournamentsView()"]');
      if (backBtn) backBtn.classList.add('hidden');
      return;
    }
  }

  if (!currentTournamentID) {
    await renderTournamentsGrid(container);
  } else {
    // Buscar configuración actualizada antes de renderizar
    const { data } = await supabaseTarget.from('tournaments').select('*').eq('id', currentTournamentID).single();
    if (data) {
      currentTournamentName = data.name;
      currentTournamentConfig = data.config || { teamSize: 2, categories: [] };
    }
    await renderTournamentDashboard(container);
  }
};

async function renderTournamentsGrid(container) {
  container.innerHTML = `
    <div class="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
      <div>
        <h2 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Gesti&oacute;n de Torneos</h2>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Administraci&oacute;n de instancias de Golf Target.</p>
      </div>
      <button id="btn-create-tournament" class="flex items-center gap-2 px-6 py-4 bg-primary text-slate-900 font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/20">
        <span class="material-icons text-lg">add</span> Nuevo Proyecto
      </button>
    </div>
    <div id="tournaments-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div class="col-span-full flex justify-center p-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    </div>
  `;

  document.getElementById('btn-create-tournament').onclick = () => window._showCreateTournamentModal();

  const { data: rawTournaments, error } = await supabaseTarget.from('tournaments').select('*').order('created_at', { ascending: false });

  // Filter for Collaborators
  let tournaments = rawTournaments;
  if (window.currentUser?.role === 'collaborator' && window.currentUser?.tournament_id) {
    tournaments = rawTournaments.filter(t => t.id === window.currentUser.tournament_id);
  }

  const grid = document.getElementById('tournaments-grid');
  if (error) {
    grid.innerHTML = `<div class="col-span-full p-10 bg-red-50 text-red-500 rounded-2xl text-center">Error: ${error.message}</div>`;
    return;
  }

  if (!tournaments || tournaments.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-inner">
        <span class="material-icons text-7xl text-slate-200 mb-6">emoji_events</span>
        <p class="text-slate-400 font-bold uppercase tracking-[0.3em]">No hay torneos registrados.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = tournaments.map(t => `
    <div class="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[3rem] hover:border-primary/50 hover:-translate-y-2 transition-all cursor-pointer shadow-sm hover:shadow-2xl overflow-hidden relative" onclick="window._openTournament('${t.id}', '${t.name.replace(/'/g, "\\'")}')">
      <div class="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[3rem] -mr-8 -mt-8 group-hover:bg-primary/20 transition-all"></div>
      <div class="flex justify-between items-start mb-8 relative z-10">
        <div class="w-16 h-16 bg-primary text-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
          <span class="material-icons text-3xl">emoji_events</span>
        </div>
        <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
          <button onclick="event.stopPropagation(); window._showEditTournamentModal('${t.id}', '${t.name.replace(/'/g, "\\'")}', '${(t.courses || t.course || "").replace(/'/g, "\\'")}')" class="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm">
            <span class="material-icons text-sm">edit</span>
          </button>
          <button onclick="event.stopPropagation(); window._deleteTournament('${t.id}', '${t.name.replace(/'/g, "\\'")}')" class="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 transition-all shadow-sm">
            <span class="material-icons text-sm">delete</span>
          </button>
        </div>
      </div>
      <h3 class="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-2 truncate">${t.name}</h3>
      <p class="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
        <span class="material-icons text-xs text-primary">location_on</span> ${t.courses || t.course || "SIN CAMPO"}
      </p>
      <div class="mt-10 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2">
           <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
           <span class="text-[9px] font-black uppercase text-emerald-500 tracking-widest">Master Console</span>
        </div>
        <div class="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-slate-900 transition-all">
          <span class="material-icons">chevron_right</span>
        </div>
      </div>
    </div>
  `).join('');
};

window._showEditTournamentModal = (id, name, currentCourses) => {
  window.showNotification('Editar Torneo', `
    <div class="space-y-4 text-left py-4">
      <div>
        <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Nombre del Torneo</label>
        <input id="edit-t-name" value="${name}" class="w-full px-5 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border-none font-bold text-sm uppercase focus:ring-2 focus:ring-primary/20">
      </div>
      <div>
        <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Campo(s) (Separa con comas)</label>
        <input id="edit-t-courses" value="${currentCourses}" class="w-full px-5 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border-none font-bold text-sm uppercase focus:ring-2 focus:ring-primary/20" placeholder="Ej: Island Navidad, Tamarindo, Corazon">
      </div>
    </div>
  `, 'confirm', async () => {
    const newName = document.getElementById('edit-t-name').value.trim();
    const newCourses = document.getElementById('edit-t-courses').value.trim();
    if (!newName || !newCourses) return;

    const { error } = await supabaseTarget.from('tournaments')
      .update({
        name: newName.toUpperCase(),
        course: newCourses.toUpperCase(),
        courses: newCourses.toUpperCase()
      })
      .eq('id', id);

    if (error) window.showNotification('Error', error.message, 'error');
    else {
      window.showNotification('Actualizado', 'Torneo modificado con éxito.', 'success');
      window.initTournamentsView();
    }
  });
};

window._deleteTournament = (id, name) => {
  window.showNotification('Eliminar Torneo', `¿Estás seguro de que deseas eliminar "${name}"? Esta acción borrará a todos los equipos y scores asociados.`, 'confirm', async () => {
    const { error } = await supabaseTarget.from('tournaments').delete().eq('id', id);
    if (error) window.showNotification('Error', error.message, 'error');
    else {
      window.showNotification('Eliminado', 'Torneo eliminado correctamente.', 'success');
      window.initTournamentsView();
    }
  });
};

window._openTournament = async function (id, name) {
  currentTournamentID = id;
  currentTournamentName = name;
  const { data } = await supabaseTarget.from('tournaments').select('*').eq('id', id).single();
  if (data) {
    currentTournamentConfig = data.config || { teamSize: 2, categories: [] };
    currentTournamentCourses = data.courses ? data.courses.split(',').map(c => c.trim()) : ["Campo Principal"];
  }
  window.initTournamentsView();
};

window._showCreateTournamentModal = function () {
  window.showNotification('Nuevo Torneo', `
    <div class="space-y-4 text-left py-4">
      <div>
        <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Nombre del Torneo</label>
        <input id="new-t-name" class="w-full px-5 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border-none font-bold text-sm uppercase placeholder:text-slate-300 focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Ej: COPA PRESIDENTE">
      </div>
      <div>
        <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Nombre del Campo</label>
        <input id="new-t-course" class="w-full px-5 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border-none font-bold text-sm uppercase placeholder:text-slate-300 focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Ej: CLUB DE CAMPO">
      </div>
    </div>
    `, 'confirm', async () => {
    const name = document.getElementById('new-t-name').value.trim();
    const course = document.getElementById('new-t-course').value.trim();
    if (!name || !course) return;

    const { error } = await supabaseTarget.from('tournaments').insert({
      name: name.toUpperCase(),
      course: course.toUpperCase(),
      courses: course.toUpperCase(), // Se guarda como lista inicial
      config: { title: name.toUpperCase(), teamSize: 2, categories: [] }
    });

    if (error) window.showNotification('Error', error.message, 'error');
    else {
      window.showNotification('Creado', 'Torneo registrado con éxito.', 'success');
      renderTournamentsGrid(document.getElementById('tournaments-view-container'));
    }
  });
};

async function renderTournamentDashboard(container) {
  container.innerHTML = `
    <div class="flex flex-col gap-8">
      <!-- HEADER -->
      <div class="flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-5 w-full md:w-auto">
          <button onclick="window._backToTournamentList()" class="w-14 h-14 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm hover:shadow-lg">
            <span class="material-icons">arrow_back</span>
          </button>
          <div class="flex-1">
            <h2 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">${currentTournamentName}</h2>
            <div class="flex items-center gap-3 mt-1.5">
              <p class="text-primary text-[10px] font-black uppercase tracking-[0.4em]">Dashboard de Control</p>
              <span class="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
              <p id="stats-summary" class="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Cargando estadísticas...</p>
            </div>
          </div>
        </div>

        <div class="flex items-center p-2 bg-slate-100 dark:bg-slate-800 rounded-[1.5rem] w-full md:w-auto shadow-inner">
          <button onclick="window._setTSection('teams')" id="ts-btn-teams" class="ts-section-btn flex-1 md:flex-none px-8 py-3.5 rounded-[1.1rem] font-black uppercase text-[10px] tracking-widest transition-all ${currentTSection === 'teams' ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-700'}">Registros</button>
          <button onclick="window._setTSection('scores')" id="ts-btn-scores" class="ts-section-btn flex-1 md:flex-none px-8 py-3.5 rounded-[1.1rem] font-black uppercase text-[10px] tracking-widest transition-all ${currentTSection === 'scores' ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-700'}">Scores</button>
          <button onclick="window._setTSection('oyeses')" id="ts-btn-oyeses" class="ts-section-btn flex-1 md:flex-none px-8 py-3.5 rounded-[1.1rem] font-black uppercase text-[10px] tracking-widest transition-all ${currentTSection === 'oyeses' ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-700'}">Oye's</button>
          <button onclick="window._setTSection('posiciones')" id="ts-btn-posiciones" class="ts-section-btn flex-1 md:flex-none px-8 py-3.5 rounded-[1.1rem] font-black uppercase text-[10px] tracking-widest transition-all ${currentTSection === 'posiciones' ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-700'}">Posiciones</button>
          <button onclick="window._setTSection('widgets')" id="ts-btn-widgets" class="ts-section-btn flex-1 md:flex-none px-8 py-3.5 rounded-[1.1rem] font-black uppercase text-[10px] tracking-widest transition-all ${currentTSection === 'widgets' ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-700'}">Nerve Center</button>
        </div>
      </div>

      <!-- MAIN CONTENT GRID -->
      <div id="tournament-section-content" class="animate-fade-in grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-12 flex justify-center p-20"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
      </div>
    </div>
    `;

  await window._refreshTournamentStats();
  window._setTSection(currentTSection);
}

window._refreshTournamentStats = async function () {
  const tReq = supabaseTarget.from('teams').select('id', { count: 'exact', head: true }).eq('eventid', currentTournamentID);
  const sReq = supabaseTarget.from('scores').select('id', { count: 'exact', head: true }).eq('eventid', currentTournamentID);
  const oReq = supabaseTarget.from('oyeses').select('id', { count: 'exact', head: true }).eq('eventid', currentTournamentID);

  const [teams, scores, oyeses] = await Promise.all([tReq, sReq, oReq]);
  const statsSummary = document.getElementById('stats-summary');
  if (statsSummary) {
    statsSummary.textContent = `${teams.count || 0} GRUPOS • ${scores.count || 0} SCORES • ${oyeses.count || 0} OYE'S`;
  }
};

window._backToTournamentList = function () {
  currentTournamentID = null;
  currentTSection = 'teams';
  window.initTournamentsView();
};

const DEFAULT_PARS = [4, 4, 3, 5, 4, 3, 4, 4, 4, 4, 4, 3, 4, 4, 5, 4, 4, 4];

window._setTSection = async function (section) {
  currentTSection = section;
  document.querySelectorAll('.ts-section-btn').forEach(b => {
    b.classList.remove('bg-primary', 'text-slate-900', 'shadow-lg', 'shadow-primary/20');
    b.classList.add('text-slate-500');
  });
  const activeBtn = document.getElementById(`ts-btn-${section}`);
  if (activeBtn) {
    activeBtn.classList.add('bg-primary', 'text-slate-900', 'shadow-lg', 'shadow-primary/20');
    activeBtn.classList.remove('text-slate-500');
  }

  const content = document.getElementById('tournament-section-content');

  let hasOldFormat = false;
  let dbCategorias = Array.isArray(currentTournamentConfig.categories) ? currentTournamentConfig.categories.map((c, idx) => {
    if (typeof c === 'string') {
      hasOldFormat = true;
      return { id: Date.now() + idx, name: c, porcentaje_ventaja: 0 };
    }
    // Allow numeric or string IDs, just cast them properly instead of overriding
    if (!c.id) {
      hasOldFormat = true;
      return { id: Date.now() + idx, name: c.name, porcentaje_ventaja: c.porcentaje_ventaja || 0 };
    }
    return { id: String(c.id).match(/^[0-9]+$/) ? parseInt(c.id, 10) : c.id, name: c.name, porcentaje_ventaja: c.porcentaje_ventaja || 0 };
  }) : [];

  // Update silently to assign permanent numeric ID for older categories
  if (hasOldFormat) {
    currentTournamentConfig.categories = dbCategorias;
    supabaseTarget.from('tournaments')
      .update({ config: currentTournamentConfig })
      .eq('id', currentTournamentID)
      .then(() => { });
  }

  if (section === 'teams') {
    content.innerHTML = `
      <!-- SIDEBAR: CONFIG & REGISTRO -->
      <div class="lg:col-span-4 space-y-8">
        <!-- CONFIGURACION -->
        <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl group">
          <div class="flex items-center gap-3 mb-8">
            <div class="w-10 h-10 bg-slate-900 dark:bg-black text-white rounded-xl flex items-center justify-center">
              <span class="material-icons text-xl">settings</span>
            </div>
            <h3 class="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Configuraci&oacute;n</h3>
          </div>

          <div class="space-y-8">
            <div>
              <label class="block text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 ml-1 italic">Modalidad</label>
              <div class="grid grid-cols-2 gap-3">
                ${[1, 2, 3, 4].map(size => `
                  <button onclick="window._updateTournamentSize(${size})" class="px-3 py-4 rounded-2xl font-black uppercase text-[10px] tracking-tighter border transition-all ${currentTournamentConfig.teamSize === size ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-900 hover:text-slate-900 dark:hover:text-white'}">
                    ${size} Jugador${size > 1 ? 'es' : ''}
                  </button>
                `).join('')}
              </div>
            </div>

            <div>
              <label class="block text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 ml-1 italic">Sistema de Juego</label>
              <select onchange="window._updateTournamentModality(this.value)" class="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-black text-[10px] uppercase text-primary ring-2 ring-primary/5 focus:ring-primary/20 transition-all outline-none">
                <option value="INDIVIDUAL" ${currentTournamentConfig.modalidad === 'INDIVIDUAL' ? 'selected' : ''}>Stroke Play (Individual)</option>
                <option value="A GO GO" ${currentTournamentConfig.modalidad === 'A GO GO' ? 'selected' : ''}>A Go Go</option>
              </select>
            </div>

            <div class="pt-8 border-t border-slate-50 dark:border-slate-800 animate-fade-in">
                <label class="block text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 ml-1 italic">Gestionar Categor&iacute;as</label>
                <div class="flex gap-2 mb-4">
                  <input id="new-cat-input" class="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl border-none font-bold text-xs uppercase" placeholder="NUEVA CAT...">
                  <input id="new-cat-perc" type="number" class="w-20 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl border-none font-bold text-xs" placeholder="%">
                  <button onclick="window._addCategory()" class="w-11 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
                    <span class="material-icons">add</span>
                  </button>
                </div>
                <div class="flex flex-wrap gap-2" id="categories-list">
                  ${dbCategorias.map(cat => `
                    <div class="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                      <span class="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">${cat.name} (${cat.porcentaje_ventaja || 0}%)</span>
                      <button onclick="window._removeCategory('${cat.id}')" class="text-slate-300 hover:text-red-500 transition-colors">
                        <span class="material-icons text-sm">close</span>
                      </button>
                    </div>
                  `).join('')}
                  ${!dbCategorias.length ? '<p class="text-[9px] font-bold text-slate-300 uppercase italic">Sin categor&iacute;as</p>' : ''}
                </div>
              </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-[6px] bg-primary"></div>
          <div class="flex items-center gap-3 mb-8">
            <div class="w-10 h-10 bg-primary text-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span class="material-icons text-xl">person_add</span>
            </div>
             <h3 class="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200" id="reg-form-title">
                Registro de ${currentTournamentConfig.teamSize === 1 ? 'Participante' : 'Equipo'}
             </h3>
          </div>

          <button id="btn-cancel-edit" class="hidden absolute top-8 right-8 text-[9px] font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all uppercase tracking-widest" onclick="window._cancelTeamEdit()">Cancelar Edici&oacute;n</button>

          <form id="team-reg-form" class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
              ${dbCategorias.length ? `
                <div class="bg-emerald-50 dark:bg-emerald-500/5 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/10">
                  <label class="block text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2 ml-1">Categor&iacute;a</label>
                  <select id="reg-category" class="w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-xs font-black uppercase appearance-none cursor-pointer focus:ring-2 focus:ring-emerald-500/20">
                    <option value="">-- ELIGE --</option>
                    ${dbCategorias.map(cat => `<option value="${cat.id}">${cat.name} (${cat.porcentaje_ventaja || 0}%)</option>`).join('')}
                  </select>
                </div>
              ` : ''}
              <div class="bg-blue-50 dark:bg-blue-500/5 p-4 rounded-2xl border border-blue-100 dark:border-blue-500/10">
                <label class="block text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2 ml-1">Hoyo de Salida</label>
                <input type="text" id="reg-starting-hole" placeholder="EJ. 10" class="w-full px-4 py-3 bg-white dark:bg-slate-800 border-none rounded-xl text-xs font-black uppercase placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500/20 transition-all">
              </div>
            </div>

            <div class="space-y-5">
              ${Array.from({ length: currentTournamentConfig.teamSize }).map((_, i) => `
                <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-4">
                  <div class="flex items-center gap-3">
                    <span class="w-7 h-7 bg-primary text-slate-900 rounded-lg flex items-center justify-center text-[11px] font-black">${i + 1}</span>
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Datos del Jugador</span>
                  </div>
                  <input type="text" placeholder="NOMBRE COMPLETO" class="reg-p-name w-full px-4 py-3 bg-white dark:bg-slate-800 border-none rounded-xl text-xs font-bold uppercase placeholder:text-slate-300 focus:ring-2 focus:ring-primary/20 transition-all">
                  <div class="grid grid-cols-2 gap-3">
                    <div class="relative">
                      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">HCP</span>
                      <input type="text" placeholder="0.0" class="reg-p-hcp w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border-none rounded-xl text-xs font-black placeholder:text-slate-300 focus:ring-2 focus:ring-primary/20 transition-all">
                    </div>
                    <input type="text" placeholder="CLUB" class="reg-p-club w-full px-4 py-3 bg-white dark:bg-slate-800 border-none rounded-xl text-xs font-bold uppercase placeholder:text-slate-300 focus:ring-2 focus:ring-primary/20 transition-all">
                  </div>
                </div>
              `).join('')}
            </div>

            <button type="submit" class="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all mt-4">
              Confirmar Registro
            </button>
          </form>
        </div>
      </div>

      <div class="lg:col-span-8 flex flex-col gap-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 gap-4">
          <div class="flex items-center gap-3">
             <div class="w-2 h-8 bg-primary rounded-full"></div>
             <h3 class="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">Participantes Registrados</h3>
          </div>
          <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
             <div class="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
               <button onclick="window._changeTeamSort('registro')" class="sort-btn px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${window._teamSort === 'registro' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}">F. Registro</button>
               <button onclick="window._changeTeamSort('ventaja')" class="sort-btn px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${window._teamSort === 'ventaja' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}">Ventaja</button>
               <button onclick="window._changeTeamSort('hoyo')" class="sort-btn px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${window._teamSort === 'hoyo' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}">Hoyo</button>
             </div>

             <button onclick="window._printTeamList()" class="hidden md:flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm border border-slate-200 dark:border-slate-700">
               <span class="material-icons text-sm">print</span>
               <span class="text-[9px] font-black uppercase tracking-widest">Imprimir</span>
             </button>

             <div class="relative w-full sm:w-auto">
               <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
               <input type="text" id="team-search-input" class="w-full sm:w-48 pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold uppercase placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 transition-all" placeholder="BUSCAR...">
             </div>
             <p id="groups-count-badge" class="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap border border-slate-200 dark:border-slate-700">-- Grupos</p>
          </div>
        </div>

        <div id="teams-grid-view" class="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
           <div class="col-span-full flex justify-center p-20"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        </div>
      </div>
    `;

    document.getElementById('team-reg-form').onsubmit = async (e) => {
      e.preventDefault();
      const names = Array.from(document.querySelectorAll('.reg-p-name')).map(el => el.value.trim().toUpperCase());
      const hcps = Array.from(document.querySelectorAll('.reg-p-hcp')).map(el => el.value.trim());
      const clubs = Array.from(document.querySelectorAll('.reg-p-club')).map(el => el.value.trim().toUpperCase());
      const catIdStr = document.getElementById('reg-category')?.value || null;
      const startingHole = document.getElementById('reg-starting-hole')?.value.trim().toUpperCase() || null;
      let catId = catIdStr ? parseInt(catIdStr, 10) : null;
      if (isNaN(catId)) catId = null;
      const catObj = catId ? dbCategorias.find(c => String(c.id) === String(catId)) : null;
      const cat = catObj ? catObj.name : null;

      if (names.some(n => !n)) {
        window.showNotification('Error', 'Todos los nombres son requeridos.', 'error');
        return;
      }

      const players = names.map((n, i) => ({ id: `p-${Date.now()}-${i}`, name: n, hdcp: parseFloat(hcps[i]) || 0, club: clubs[i] }));
      const teamLabel = currentTournamentConfig.teamSize === 1 ? names[0] : players.map(p => p.name.split(' ')[0]).join(', ');
      const teamName = teamLabel;

      // CALCULAR VENTAJA: Priorizar porcentaje de categoría si existe
      let ventaja = 0;
      const totalHdcps = players.reduce((acc, p) => acc + (p.hdcp || 0), 0);

      if (catObj && catObj.porcentaje_ventaja !== undefined) {
        ventaja = Math.floor(totalHdcps * (parseFloat(catObj.porcentaje_ventaja) / 100) + 0.5);
      } else {
        ventaja = totalHdcps; // 100% por defecto siempre
      }

      if (window._editingTeamId) {
        const { error } = await supabaseTarget.from('teams').update({
          name: teamName,
          teamname: teamName,
          players: players,
          category: cat,
          categoria_id: catId,
          ventaja: ventaja,
          starting_hole: startingHole
        }).eq('id', window._editingTeamId);

        if (error) window.showNotification('Error', error.message, 'error');
        else {
          window.showNotification('¡Actualizado!', 'Registro modificado con éxito.', 'success');
          window._cancelTeamEdit();
          window._setTSection('teams');
          window._refreshTournamentStats();
        }
      } else {
        const { error } = await supabaseTarget.from('teams').insert({
          name: teamName,
          teamname: teamName,
          players: players,
          category: cat,
          categoria_id: catId,
          ventaja: ventaja,
          eventid: String(currentTournamentID),
          starting_hole: startingHole
        });

        if (error) window.showNotification('Error', error.message, 'error');
        else {
          window.showNotification('Éxito', 'Registro completado.', 'success');
          document.getElementById('team-reg-form').reset();
          window._setTSection('teams');
          window._refreshTournamentStats();
        }
      }
    };

    window._cancelTeamEdit = () => {
      window._editingTeamId = null;
      document.getElementById('team-reg-form').reset();
      document.getElementById('reg-form-title').textContent = `Inscripci\xf3n ${currentTournamentConfig.teamSize === 1 ? 'Singles' : 'Grupal'}`;
      document.getElementById('btn-cancel-edit').classList.add('hidden');
    };

    window._editTeam = (id) => {
      const t = teams.find(team => team.id === id);
      if (!t) return;
      window._editingTeamId = id;
      document.getElementById('reg-form-title').textContent = 'Editando Registro';
      document.getElementById('btn-cancel-edit').classList.remove('hidden');

      if (document.getElementById('reg-starting-hole')) {
        document.getElementById('reg-starting-hole').value = t.starting_hole || '';
      }

      if ((t.categoria_id || t.category) && document.getElementById('reg-category')) {
        const sel = t.categoria_id || dbCategorias.find(c => c.name === t.category)?.id;
        if (sel) { document.getElementById('reg-category').value = String(sel); }
      }

      const nameInputs = document.querySelectorAll('.reg-p-name');
      const hcpInputs = document.querySelectorAll('.reg-p-hcp');
      const clubInputs = document.querySelectorAll('.reg-p-club');

      t.players.forEach((p, i) => {
        if (nameInputs[i]) nameInputs[i].value = p.name;
        if (hcpInputs[i]) hcpInputs[i].value = p.hdcp;
        if (clubInputs[i]) clubInputs[i].value = p.club;
      });

      document.getElementById('team-reg-form').scrollIntoView({ behavior: 'smooth' });
    };

    window._deleteTeam = (id) => {
      window.showNotification('Eliminar', '\xbfSeguro que quieres borrar este registro y sus scores?', 'confirm', async () => {
        // ALWAYS delete scores first to avoid foreign key constraints
        await supabaseTarget.from('scores').delete().eq('teamid', id);

        const { error } = await supabaseTarget.from('teams').delete().eq('id', id);
        if (error) window.showNotification('Error', error.message, 'error');
        else {
          window.showNotification('Borrado', 'Registro eliminado.', 'success');
          window._setTSection('teams');
          window._refreshTournamentStats();
        }
      });
    };

    const { data: teams } = await supabaseTarget.from('teams').select('*').eq('eventid', currentTournamentID).order('teamname', { ascending: false });
    if (!window._teamSort) window._teamSort = 'registro';

    const renderTeamsGrid = (query = "") => {
      const grid = document.getElementById('teams-grid-view');
      const q = query.toLowerCase();
      
      let sortedTeams = [...(teams || [])];
      if (window._teamSort === 'ventaja') {
        sortedTeams.sort((a, b) => (b.ventaja || 0) - (a.ventaja || 0));
      } else if (window._teamSort === 'hoyo') {
        sortedTeams.sort((a, b) => {
          const hA = parseInt(a.starting_hole) || 999;
          const hB = parseInt(b.starting_hole) || 999;
          if (hA !== hB) return hA - hB;
          return (a.starting_hole || '').localeCompare(b.starting_hole || '');
        });
      }

      const filteredTeams = sortedTeams.filter(t =>
        t.teamname.toLowerCase().includes(q) ||
        t.players?.some(p => p.name.toLowerCase().includes(q))
      );

      document.getElementById('groups-count-badge').textContent = `${filteredTeams.length} Grupos`;

      if (!filteredTeams || filteredTeams.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full py-32 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800 shadow-inner">
            <span class="material-icons text-6xl text-slate-100 mb-4">groups</span>
            <p class="text-slate-300 font-black uppercase tracking-[0.3em] text-xs">Sin registros todav&iacute;a.</p>
          </div>
        `;
      } else {
        grid.innerHTML = filteredTeams.map((t) => {
          const originalIdx = teams.indexOf(t);
          const teamNumber = teams.length - originalIdx;

          let sumHcp = 0;
          t.players?.forEach(p => { sumHcp += parseFloat(p.hdcp) || 0; });

          const catId = t.categoria_id || t.category;
          const catObj = dbCategorias.find(c => String(c.id) === String(catId));
          const catNameStr = catObj?.name || t.category || '';

          let ventaja = 0;
          if (catObj && catObj.porcentaje_ventaja !== undefined) {
            ventaja = Math.floor(sumHcp * (catObj.porcentaje_ventaja / 100) + 0.5);
          } else {
            ventaja = sumHcp; // 100% por defecto siempre
          }

          return `
          <div class="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all overflow-hidden relative">
            <div class="px-7 py-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <div class="flex items-center gap-3">
                     <span class="w-8 h-8 rounded-xl bg-slate-900 text-white text-[10px] font-black flex items-center justify-center">#${teamNumber}</span>
                     <div>
                       <div class="flex items-center gap-2">
                         <h4 class="text-[11px] font-black uppercase tracking-tight text-slate-800 dark:text-slate-200 truncate max-w-[200px] leading-none">${currentTournamentConfig.teamSize > 1 ? `EQUIPO #${teamNumber}` : t.teamname}</h4>
                         ${t.starting_hole ? `<span class="bg-blue-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">🚩 S: ${t.starting_hole}</span>` : ''}
                       </div>
                       <p class="text-[8px] text-slate-400 font-bold uppercase mt-1 truncate max-w-[250px]">${t.players?.map(p => p.name.split(' ')[0]).join(', ') || ''}</p>
                       ${catNameStr ? `<span class="text-[9px] font-black text-primary uppercase tracking-wider mt-1.5 flex items-center gap-2">${catNameStr} <span class="bg-slate-200 dark:bg-slate-700 text-slate-500 px-1 py-0.5 inline-block rounded font-bold text-[8px] tracking-widest">Suma HDCP: ${parseFloat(sumHcp).toFixed(0)}</span> <span class="text-[#0d9488] bg-[#f0fdfa] border border-[#ccfbf1] px-1.5 py-0.5 rounded-md font-extrabold tracking-widest">VENTAJA: ${parseFloat(ventaja).toFixed(0)} GOLPES</span></span>` : ''}
                     </div>
                  </div>
              <div class="flex gap-1">
                <button onclick="window._editTeam('${t.id}')" class="w-9 h-9 text-slate-300 hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
                  <span class="material-icons text-lg">edit</span>
                </button>
                <button onclick="window._deleteTeam('${t.id}')" class="w-9 h-9 text-slate-300 hover:text-red-50 hover:bg-red-500 rounded-xl transition-all">
                  <span class="material-icons text-lg">delete_outline</span>
                </button>
              </div>
            </div>
            <div class="p-7 space-y-4">
              ${t.players?.map(p => `
                <div class="flex items-center justify-between group/p">
                  <div class="flex-1 min-w-0 pr-4">
                    <p class="text-[11px] font-black text-slate-900 dark:text-white uppercase truncate">${p.name}</p>
                    <p class="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate">${p.club || 'SIN CLUB'}</p>
                  </div>
                  <div class="flex flex-col items-center justify-center w-12 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span class="text-[7px] font-black text-slate-300 leading-none mb-1">HCP</span>
                    <span class="text-[10px] font-black text-primary leading-none">${p.hdcp || '0'}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `}).join('');
      }
    };

    // Sorting helpers
    window._changeTeamSort = (s) => {
      window._teamSort = s;
      renderTeamsGrid(document.getElementById('team-search-input')?.value || "");
      // Update UI buttons
      document.querySelectorAll('.sort-btn').forEach(b => {
        b.classList.remove('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-primary');
        b.classList.add('text-slate-500');
        if (b.innerText.toLowerCase().includes(s.substring(0, 3))) {
           b.classList.add('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-primary');
           b.classList.remove('text-slate-500');
        }
      });
    };

    window._printTeamList = () => {
      const sortedTeams = [...teams];
      
      // Grouping teams by hole
      const holeGroups = {};
      sortedTeams.forEach(t => {
        const hole = t.starting_hole || 'TBA';
        if (!holeGroups[hole]) holeGroups[hole] = [];
        holeGroups[hole].push(t);
      });

      // Sort holes numerically
      const holes = Object.keys(holeGroups).sort((a, b) => {
        const numA = parseInt(a) || 999;
        const numB = parseInt(b) || 999;
        if (numA !== numB) return numA - numB;
        return a.localeCompare(b);
      });

      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Salidas Shotgun - ${currentTournamentName}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
              
              body { 
                font-family: 'Inter', sans-serif; 
                padding: 20px; 
                color: #000; 
                background: #fff;
              }
              
              .print-container { max-width: 800px; margin: 0 auto; }
              
              .header { 
                display: flex; 
                align-items: center; 
                justify-content: space-between; 
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 4px solid #000;
              }
              
              .logo { height: 60px; object-fit: contain; }
              
              .title-box { text-align: right; }
              .title-box h1 { margin: 0; font-size: 20px; font-weight: 900; text-transform: uppercase; line-height: 1; }
              .title-box h2 { margin: 5px 0 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #444; }

              .shotgun-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
              
              .hole-row { border-bottom: 2px solid #eee; page-break-inside: avoid; break-inside: avoid; }
              
              .team-cell { padding: 10px; width: 42%; vertical-align: middle; }
              .hole-cell { 
                width: 16%; 
                text-align: center; 
                vertical-align: middle; 
                background: #000; 
                color: #fff; 
                font-weight: 900; 
                font-size: 14px;
                text-transform: uppercase;
                height: 60px;
              }

              .team-content { display: flex; align-items: center; gap: 8px; }
              .left-team { justify-content: flex-end; text-align: right; }
              .right-team { justify-content: flex-start; text-align: left; }

              .hcp-circle {
                width: 32px;
                height: 32px;
                border: 2px solid #000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 900;
                flex-shrink: 0;
              }

              .hcp-total {
                width: 35px;
                height: 35px;
                background: #f0f0f0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: 800;
                flex-shrink: 0;
              }

              .names-container { flex-grow: 1; min-width: 0; }
              .team-title { font-size: 11px; font-weight: 900; text-transform: uppercase; margin-bottom: 2px; }
              .players-list { font-size: 8px; font-weight: 700; text-transform: uppercase; color: #555; line-height: 1.2; }



              .meta {
                margin-top: 10px;
                text-align: center;
                font-size: 8px;
                font-weight: 700;
                color: #999;
                text-transform: uppercase;
              }

              @media print {
                body { padding: 0; margin: 0; }
                .no-print { display: none; }
                thead { display: table-header-group; }
                @page { margin: 1cm; }
              }
            </style>
          </head>
          <body>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <td>
                    <div class="header" style="margin-bottom: 20px;">
                      <img src="logo_colima.png" class="logo" onerror="this.src='https://via.placeholder.com/200x60?text=GOLF+ASOCIACION'">
                      <div class="title-box">
                        <h1>${currentTournamentName}</h1>
                        <h2>Layout de Salidas (Shotgun)</h2>
                      </div>
                    </div>
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <table class="shotgun-table" style="width: 100%;">
                      <tbody>


                  ${holes.map(hole => {
                    const teamsInHole = holeGroups[hole];
                    // We render in pairs
                    const rows = [];
                    for(let i = 0; i < teamsInHole.length; i += 2) {
                      const t1 = teamsInHole[i];
                      const t2 = teamsInHole[i+1]; // Might be undefined
                      
                      const renderTeam = (t, isLeft) => {
                        if (!t) return `<td class="team-cell"></td>`;
                        
                        let sumHcp = 0;
                        t.players?.forEach(p => { sumHcp += parseFloat(p.hdcp) || 0; });
                        const names = t.players?.map(p => `${p.name} <strong>(${p.hdcp || 0})</strong>`).join(' - ') || '---';
                        const teamNum = teams.length - teams.indexOf(t);

                        return `
                          <td class="team-cell">
                            <div class="team-content ${isLeft ? 'left-team' : 'right-team'}">
                              ${isLeft ? `
                                <div class="hcp-circle" title="Ventaja">${t.ventaja || 0}</div>
                                <div class="hcp-total" title="Suma HCP">${Math.round(sumHcp)}</div>
                                <div class="names-container">
                                  <div class="team-title">EQUIPO #${teamNum}</div>
                                  <div class="players-list">${names}</div>
                                </div>
                              ` : `
                                <div class="names-container">
                                  <div class="team-title">EQUIPO #${teamNum}</div>
                                  <div class="players-list">${names}</div>
                                </div>
                                <div class="hcp-total" title="Suma HCP">${Math.round(sumHcp)}</div>
                                <div class="hcp-circle" title="Ventaja">${t.ventaja || 0}</div>
                              `}
                            </div>
                          </td>
                        `;
                      };

                      rows.push(`
                        <tr class="hole-row">
                          ${renderTeam(t1, true)}
                          <td class="hole-cell">HOYO ${hole}</td>
                          ${renderTeam(t2, false)}
                        </tr>
                      `);
                    }
                    return rows.join('');
                  }).join('')}
                </tbody>
              </table>



                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td>
                    <div class="meta" style="padding-top: 15px; border-top: 1px dashed #ddd; margin-top: 20px;">
                      Generado por PassGolf • ${new Date().toLocaleDateString('es-MX')} • ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
            
            <script>
              window.onload = () => {
                const images = Array.from(document.images);
                const loadPromises = images.map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
                });
                Promise.all(loadPromises).then(() => {
                    setTimeout(() => { window.print(); }, 1000);
                });
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    };

    renderTeamsGrid();

    const searchInput = document.getElementById('team-search-input');
    if (searchInput) {
      searchInput.oninput = (e) => renderTeamsGrid(e.target.value);
    }

    // Real-time listener for admin teams list
    supabase.channel('teams-admin-' + currentTournamentID)
      .on('postgres_changes', { event: '*', schema: 'colimaGC', table: 'teams', filter: `eventid=eq.${currentTournamentID}` }, () => {
        window._setTSection('teams');
      }).subscribe();
  } else if (section === 'scores') {
    content.innerHTML = `
      <div class="lg:col-span-4 space-y-6">
        <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-[700px]">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <span class="material-icons text-emerald-500">search</span>
              <h3 class="text-[10px] font-black uppercase tracking-widest">Seleccionar Jugador</h3>
            </div>
            <button onclick="window._printScorecards()" class="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg hover:bg-slate-200 transition-all active:scale-95 border border-slate-200 dark:border-slate-700">
               <span class="material-icons text-sm">print</span>
               <span class="text-[8px] font-black uppercase tracking-widest">Tarjetas</span>
            </button>
          </div>
          <input type="text" id="score-search" class="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-bold text-xs uppercase mb-6 focus:ring-2 focus:ring-primary/20 transition-all" placeholder="BUSCAR JUGADOR...">
          
          <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8" id="players-list-scores">
             <div class="flex justify-center p-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-8">
        <div id="scorecard-container" class="bg-slate-200 dark:bg-slate-900/50 rounded-[3rem] p-10 border border-slate-300 dark:border-slate-800 shadow-inner h-full flex flex-col items-center justify-center text-center">
           <span class="material-icons text-7xl text-slate-400 mb-6">edit_note</span>
           <h3 class="text-xl font-black text-slate-500 uppercase tracking-tighter">Panel de Captura</h3>
           <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 max-w-xs">Seleccione un participante para abrir su tarjeta de score.</p>
        </div>
      </div>
    `;

    const { data: teams } = await supabaseTarget.from('teams').select('*').eq('eventid', String(currentTournamentID)).order('teamname', { ascending: true });
    let { data: scores } = await supabaseTarget.from('scores').select('*').eq('eventid', String(currentTournamentID));
    if (!scores) scores = [];

    const renderPlayers = (query = "") => {
      const list = document.getElementById('players-list-scores');
      const q = query.toLowerCase();
      const filtered = teams.filter(t =>
        t.teamname.toLowerCase().includes(q) ||
        t.players?.some(p => p.name.toLowerCase().includes(q))
      );

      const registered = filtered.filter(t => scores.some(s => s.teamid === t.id));
      const pending = filtered.filter(t => !scores.some(s => s.teamid === t.id));

      list.innerHTML = `
        <div class="space-y-3">
          <p class="text-[8px] font-black uppercase text-emerald-500 tracking-[0.3em] mb-4 flex items-center gap-2 px-1">
            <span class="material-icons text-sm">check_circle</span> Registrados (${registered.length})
          </p>
          ${registered.map(t => `
             <button onclick="window._openScorecard('${t.id}')" class="w-full text-left p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/5 border-2 border-emerald-500/20 hover:border-emerald-500 transition-all">
                <p class="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 leading-tight">${currentTournamentConfig.teamSize > 1 ? `EQUIPO #${teams.length - teams.indexOf(t)}` : t.teamname}</p>
                <p class="text-[8px] font-bold text-emerald-600/60 uppercase mt-1 truncate">${t.players?.map(p => p.name.split(' ')[0]).join(', ') || ''}</p>
                ${(t.categoria_id || t.category) ? `<span class="text-[7px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded mt-2 inline-block">${dbCategorias.find(c => String(c.id) == String(t.categoria_id))?.name || t.category}</span>` : ''}
             </button>
          `).join('')}
        </div>
        <div class="space-y-3">
          <p class="text-[8px] font-black uppercase text-slate-400 tracking-[0.3em] mb-4 flex items-center gap-2 px-1">
            <span class="material-icons text-sm">schedule</span> Pendientes (${pending.length})
          </p>
          ${pending.map(t => `
             <button onclick="window._openScorecard('${t.id}')" class="w-full text-left p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:border-slate-300 transition-all">
                <p class="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 leading-tight">${currentTournamentConfig.teamSize > 1 ? `EQUIPO #${teams.length - teams.indexOf(t)}` : t.teamname}</p>
                <p class="text-[8px] font-bold text-slate-400 uppercase mt-1 truncate">${t.players?.map(p => p.name.split(' ')[0]).join(', ') || ''}</p>
                ${(t.categoria_id || t.category) ? `<span class="text-[7px] font-black text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded mt-2 inline-block">${dbCategorias.find(c => String(c.id) == String(t.categoria_id))?.name || t.category}</span>` : ''}
             </button>
          `).join('')}
        </div>
      `;
    };

    renderPlayers();
    document.getElementById('score-search').oninput = (e) => renderPlayers(e.target.value);

    window._printScorecards = async function () {
      const { data: teams } = await supabaseTarget.from('teams').select('*').eq('eventid', String(currentTournamentID));
      const { data: scores } = await supabaseTarget.from('scores').select('*').eq('eventid', String(currentTournamentID));
      const { data: leaderboard } = await supabaseTarget.from('vw_leaderboard_resultados').select('*').eq('eventid', String(currentTournamentID));

      if (!teams || teams.length === 0) {
        window.showNotification('Error', 'No hay equipos registrados.', 'error');
        return;
      }

      const courseName = currentTournamentCourses[0];
      const { data: pubCourses } = await supabase.from('golf_courses').select('*');
      const { data: targetCourses } = await supabaseTarget.from('golf_courses').select('*');
      const allCourses = [...(pubCourses || []), ...(targetCourses || [])];
      
      const cleanStr = (s) => s?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, '').toUpperCase() || '';
      const scClean = cleanStr(courseName);
      const course = allCourses.find(c => cleanStr(c.name).includes(scClean) || scClean.includes(cleanStr(c.name)));

      const dbCategorias = Array.isArray(currentTournamentConfig.categories) ? currentTournamentConfig.categories : [];

      // Sorteo: Ganador al final
      const sortedLB = (leaderboard || []).sort((a, b) => (b.neto || 0) - (a.neto || 0));
      const teamsWithScores = sortedLB.map(lb => teams.find(t => t.id === lb.id)).filter(Boolean);
      const teamsWithoutScores = teams.filter(t => !teamsWithScores.some(ts => ts.id === t.id));
      const finalSortedTeams = [...teamsWithoutScores, ...teamsWithScores];

      const printWindow = window.open('', '_blank');
      let html = `
        <html>
          <head>
            <title>Tarjetas - ${currentTournamentName}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
              body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background: white; color: black; }
              .print-container { width: 100%; display: flex; flex-wrap: wrap; gap: 0; }
              .scorecard-group { width: 100%; height: 100vh; display: flex; flex-wrap: wrap; page-break-after: always; padding: 15px; box-sizing: border-box; justify-content: space-between; align-content: flex-start; }
              .scorecard { width: 49%; height: 48%; border: 3px solid black; padding: 12px; box-sizing: border-box; display: flex; flex-direction: column; gap: 5px; margin-bottom: 2%; }
              .header { border-bottom: 2px solid black; padding-bottom: 5px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: flex-start; }
              .tournament-name { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #666; }
              .team-name { font-size: 14px; font-weight: 900; color: black; margin: 1px 0; }
              .grid { width: 100%; border-collapse: collapse; margin-top: 5px; }
              .grid th, .grid td { border: 1px solid black; text-align: center; font-size: 8px; padding: 2px; font-weight: 700; }
              .grid th { background: #f0f0f0; font-size: 7px; }
              .player-info { margin-top: 3px; font-size: 8px; font-weight: 800; text-transform: uppercase; display: flex; flex-direction: column; gap: 1px; }
              .advantage-badge { background: black; color: white; padding: 1px 6px; font-size: 9px; font-weight: 900; border-radius: 4px; }
              @page { size: landscape; margin: 0; }
              .stats-row { display: flex; justify-content: space-between; align-items: center; margin-top: 2px; }
            </style>
          </head>
          <body>
            <div class="print-container">
      `;

      function generateCardHTML(team, score, courseInfo) {
        if (!team) return '';
        const holes = score?.holes || new Array(18).fill('');
        const outTotal = holes.slice(0, 9).reduce((a, b) => (parseFloat(a) || 0) + (parseFloat(b) || 0), 0) || '';
        const inTotal = holes.slice(9, 18).reduce((a, b) => (parseFloat(a) || 0) + (parseFloat(b) || 0), 0) || '';
        const total = (parseFloat(outTotal) || 0) + (parseFloat(inTotal) || 0) || '';
        
        const catId = team.categoria_id || team.category;
        const catObj = dbCategorias.find(c => String(c.id) === String(catId));
        const catName = catObj?.name || team.category || 'GENERAL';
        const ventaja = team.ventaja || 0;
        const teamNum = teams.length - teams.indexOf(team);

        return `
          <div class="scorecard">
            <div class="header">
              <div style="flex: 1;">
                <div class="tournament-name">${currentTournamentName}</div>
                <div class="stats-row">
                  <div class="team-name">EQUIPO #${teamNum} ${currentTournamentConfig.teamSize === 1 ? '' : '- ' + team.teamname}</div>
                  <div class="advantage-badge">VENTAJA: ${ventaja}</div>
                </div>
              </div>
              <img src="logo_colima.png" style="height: 35px; object-fit: contain; margin-left: 10px;" onerror="this.style.visibility='hidden'">
            </div>
            <div class="player-info">
               ${team.players?.map((p, i) => `<div>JUGADOR ${i+1}: ${p.name} (HCP: ${p.hdcp})</div>`).join('')}
            </div>
            <table class="grid">
              <tr>
                <th style="width: 15%;">HOYO</th> 
                ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(h => `<th>${h}</th>`).join('')}
                <th style="background: #ddd;">OUT</th>
              </tr>
              <tr>
                <td>PAR</td>
                ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(h => `<td>${courseInfo ? (courseInfo['p' + h] || 4) : 4}</td>`).join('')}
                <td style="background: #ddd;">36</td>
              </tr>
              <tr style="height: 20px;">
                <td>SCORE</td>
                ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(idx => `<td>${holes[idx] || ''}</td>`).join('')}
                <td style="background: #ddd; font-size: 10px;">${outTotal}</td>
              </tr>
              <tr style="height: 3px; border:none;"><td colspan="11" style="border:none;"></td></tr>
              <tr>
                <th>HOYO</th> 
                ${[10, 11, 12, 13, 14, 15, 16, 17, 18].map(h => `<th>${h}</th>`).join('')}
                <th style="background: #ddd;">IN</th>
                <th style="background: #000; color: #fff;">TOT</th>
              </tr>
              <tr>
                <td>PAR</td>
                ${[10, 11, 12, 13, 14, 15, 16, 17, 18].map(h => `<td>${courseInfo ? (courseInfo['p' + h] || 4) : 4}</td>`).join('')}
                <td style="background: #ddd;">36</td>
                <td style="background: #f0f0f0;">72</td>
              </tr>
              <tr style="height: 20px;">
                <td>SCORE</td>
                ${[9, 10, 11, 12, 13, 14, 15, 16, 17].map(idx => `<td>${holes[idx] || ''}</td>`).join('')}
                <td style="background: #ddd; font-size: 10px;">${inTotal}</td>
                <td style="background: #f0f0f0; font-size: 11px;">${total}</td>
              </tr>
            </table>
            <div class="stats-row" style="font-size: 7px; font-weight: 800; opacity: 0.6; text-transform: uppercase;">
               <span>CATEGOR&Iacute;A: ${catName}</span>
               <span>CAMPO: ${courseName}</span>
            </div>
          </div>
        `;
      }

      for (let i = 0; i < finalSortedTeams.length; i += 4) {
        html += '<div class="scorecard-group">';
        for (let j = 0; j < 4; j++) {
           if (finalSortedTeams[i + j]) {
             html += generateCardHTML(finalSortedTeams[i + j], scores.find(s => s.teamid === finalSortedTeams[i + j].id), course);
           }
        }
        html += '</div>';
      }

      html += `
            </div>
            <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 1500); };</script>
          </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
    };

    window._openScorecard = async function (teamId, courseIdx = 0) {
      console.log("Opening Scorecard for:", teamId, "CourseIdx:", courseIdx);
      const selectedCourse = currentTournamentCourses[courseIdx] || currentTournamentCourses[0];
      const team = teams.find(t => String(t.id) === String(teamId));
      if (!team) {
        console.error("Team not found in local list:", teamId);
        window.showNotification('Error', 'No se encontró el equipo en la sesión actual.', 'error');
        return;
      }

      const { data: scoreData, error: sErr } = await supabaseTarget.from('scores')
        .select('*')
        .eq('teamid', teamId)
        .eq('coursename', selectedCourse)
        .maybeSingle();

      // Búsqueda Ultra-Robusta del Campo (maneja acentos, entidades HTML y nombres parciales)
      const cleanStr = (s) => s?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/&[a-z0-9]+;/gi, '').replace(/[^a-z0-9]/gi, '').toUpperCase() || '';
      const scClean = cleanStr(selectedCourse);

      const { data: pubCourses } = await supabase.from('golf_courses').select('*');
      const { data: targetCourses } = await supabaseTarget.from('golf_courses').select('*');
      const allPossibleCourses = [...(pubCourses || []), ...(targetCourses || [])];

      const proCourse = allPossibleCourses.find(c => {
        const cnClean = cleanStr(c.name);
        if (scClean.includes(cnClean) || cnClean.includes(scClean)) return true;
        
        // Coincidencia por palabras clave compartidas (útil para "Corazon Resort" vs "El Corazón Manzanillo")
        const genericWords = ['CLUB', 'GOLF', 'RESORT', 'FOUR', 'SEASONS'];
        const isSignificant = (w) => w.length > 3 && !genericWords.includes(w);
        const cWords = (c.name || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().split(/[^A-Z]/).filter(isSignificant);
        const sWords = (selectedCourse || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().split(/[^A-Z]/).filter(isSignificant);
        return cWords.some(w => sWords.includes(w));
      });

      if (sErr) {
        window.showNotification('Error', 'Error al cargar tarjeta: ' + sErr.message, 'error');
        return;
      }

      const existingHoles = scoreData?.holes || new Array(18).fill(0);

      // CALCULAR VENTAJA EN VIVO PARA LA TARJETA
      const sumHcp = team.players?.reduce((acc, p) => acc + (parseFloat(p.hdcp) || 0), 0) || 0;
      const catId = team.categoria_id || team.category;
      const catObj = dbCategorias.find(c => String(c.id) === String(catId));

      let ventaja = 0;
      if (catObj && catObj.porcentaje_ventaja !== undefined) {
        ventaja = Math.floor(sumHcp * (parseFloat(catObj.porcentaje_ventaja) / 100) + 0.5);
      } else {
        ventaja = sumHcp;
      }

      const baseGallinos = Math.floor(ventaja / 18);
      const remainingGallinos = Math.round(ventaja % 18);

      const getGallinos = (holeNum) => {
        if (!proCourse) return 0;
        const hIndex = proCourse[`h${holeNum}`] || 0;
        if (hIndex === 0) return 0;
        return baseGallinos + (hIndex <= remainingGallinos ? 1 : 0);
      };

      const scorecardContainer = document.getElementById('scorecard-container');
      scorecardContainer.classList.remove('items-center', 'justify-center', 'text-center');
      scorecardContainer.innerHTML = `
        <div class="w-full h-full flex flex-col gap-8 animate-fade-in">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="flex items-center gap-4">
               <div class="w-12 h-12 bg-primary text-slate-900 rounded-2xl flex items-center justify-center font-black">#${teams.length - teams.indexOf(team)}</div>
               <div>
                 <div class="flex items-center gap-3">
                   <h3 class="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none">${currentTournamentConfig.teamSize > 1 ? `EQUIPO #${teams.length - teams.indexOf(team)}` : team.teamname}</h3>
                   <span class="text-[#0d9488] bg-[#f0fdfa] border border-[#ccfbf1] px-1.5 py-0.5 rounded-md font-extrabold text-[10px] tracking-widest mt-1">VENTAJA: ${parseFloat(ventaja).toFixed(0)} GOLPES</span>
                 </div>
                 <div class="mt-2 flex flex-wrap gap-2">
                   ${team.players?.map((p, i) => `
                     <span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[7px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                       P${i + 1}: ${p.name.split(' ')[0]} (HCP ${p.hdcp || '0'})
                     </span>
                   `).join('') || ''}
                 </div>
               </div>
            </div>

            <!-- SELECTOR DE CAMPO -->
            <div class="flex items-center gap-4">
                <div class="flex-1">
                  <label class="block text-[8px] font-black uppercase text-slate-400 mb-1 ml-1">Seleccionar Campo / Rda</label>
                  <select onchange="window._openScorecard('${teamId}', this.selectedIndex)" class="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 font-black text-[10px] uppercase text-emerald-500 ring-2 ring-emerald-500/10 focus:ring-emerald-500/30 transition-all outline-none">
                    ${currentTournamentCourses.map((c, i) => `
                      <option value="${i}" ${i === courseIdx ? 'selected' : ''}>${c}</option>
                    `).join('')}
                  </select>
                </div>
                <div class="flex gap-2">
                   <div class="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl flex flex-col items-center">
                     <span class="text-[7px] font-black text-slate-400 uppercase">OUT</span>
                     <span id="sc-out" class="text-base font-black text-slate-900 dark:text-white">${scoreData?.out || 0}</span>
                   </div>
                   <div class="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl flex flex-col items-center">
                     <span class="text-[7px] font-black text-slate-400 uppercase">IN</span>
                     <span id="sc-in" class="text-base font-black text-slate-900 dark:text-white">${scoreData?.in || 0}</span>
                   </div>
                    <div class="bg-primary px-8 py-3 rounded-2xl flex flex-col items-center shadow-xl shadow-primary/20">
                      <span class="text-[8px] font-black text-slate-900 uppercase tracking-widest">TOTAL NETO</span>
                      <span id="sc-total" class="text-2xl font-black text-slate-900">${scoreData?.total || 0}</span>
                    </div>
                 </div>
             </div>
          </div>

          <div class="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <!-- VUELTA 1-9 -->
            <div class="bg-slate-300/50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-300 dark:border-slate-800">
               <p class="text-[9px] font-black uppercase text-slate-500 tracking-[0.3em] mb-6 ml-1">Vuelta 1-9 (OUT)</p>
               <div class="grid grid-cols-9 gap-3">
                  ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(h => {
        const g = getGallinos(h);
        const par = proCourse ? proCourse[`p${h}`] : 4;
        const hIndex = proCourse ? proCourse[`h${h}`] : '--';
        return `
                    <div class="flex flex-col gap-2 relative group/hole">
                      <div class="flex items-center justify-between px-1">
                        <span class="text-[9px] font-black text-slate-400">#${h}</span>
                        <span class="text-[8px] font-bold text-slate-300 italic">PAR ${par}</span>
                      </div>
                      <div class="relative">
                        <input type="number" data-hole="${h - 1}" class="hole-input w-full px-2 py-5 bg-white dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-[1.5rem] text-center font-black text-2xl transition-all shadow-md" value="${existingHoles[h - 1] || ''}" oninput="window._updateScoreCalc()">
                      </div>
                      <div class="flex items-center justify-center">
                        <span class="text-[10px] font-black text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-3 py-1 rounded-full mt-1 uppercase tracking-tighter shadow-sm">IDX ${hIndex}</span>
                      </div>
                    </div>
                  `;
      }).join('')}
                </div>
            </div>
            <!-- VUELTA 10-18 -->
            <div class="bg-slate-300/50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-300 dark:border-slate-800">
               <p class="text-[9px] font-black uppercase text-slate-500 tracking-[0.3em] mb-6 ml-1">Vuelta 10-18 (IN)</p>
               <div class="grid grid-cols-9 gap-3">
                  ${[10, 11, 12, 13, 14, 15, 16, 17, 18].map(h => {
        const g = getGallinos(h);
        const par = proCourse ? proCourse[`p${h}`] : 4;
        const hIndex = proCourse ? proCourse[`h${h}`] : '--';
        return `
                    <div class="flex flex-col gap-2 relative group/hole">
                      <div class="flex items-center justify-between px-1">
                        <span class="text-[9px] font-black text-slate-400">#${h}</span>
                        <span class="text-[8px] font-bold text-slate-300 italic">PAR ${par}</span>
                      </div>
                      <div class="relative">
                        <input type="number" data-hole="${h - 1}" class="hole-input w-full px-2 py-5 bg-white dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-[1.5rem] text-center font-black text-2xl transition-all shadow-md" value="${existingHoles[h - 1] || ''}" oninput="window._updateScoreCalc()">
                      </div>
                      <div class="flex items-center justify-center">
                        <span class="text-[10px] font-black text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-3 py-1 rounded-full mt-1 uppercase tracking-tighter shadow-sm">IDX ${hIndex}</span>
                      </div>
                    </div>
                  `;
      }).join('')}
                </div>
            </div>
          </div>

          <div class="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div class="flex items-center gap-6">
              <button onclick="window._resetScorecard('${teamId}', this.selectedIndex)" class="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-2xl flex items-center justify-center transition-all">
                <span class="material-icons">restart_alt</span>
              </button>
              <p class="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-2">
                 <span class="material-icons text-sm text-primary">sync</span> Autoc&aacute;lculo activo
              </p>
            </div>
            <button onclick="window._saveScore('${teamId}')" class="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all flex items-center gap-3">
              <span class="material-icons">save</span> Guardar Scorecard
            </button>
          </div>
          <script>
            {
               const inputs = document.querySelectorAll('.hole-input');
               inputs.forEach((input, index) => {
                  input.oninput = (e) => {
                     window._updateScoreCalc();
                     if (e.target.value.length >= 1) {
                        const next = inputs[index + 1];
                        if (next) next.focus();
                     }
                  };
               });
            }
          </script>
        </div>
      `;
    };

    window._resetScorecard = (teamId) => {
      window.showNotification('Reiniciar', '¿Seguro que quieres borrar TODOS los golpes de esta tarjeta y resetear su score?', 'confirm', async () => {
        document.querySelectorAll('.hole-input').forEach(i => i.value = '');
        window._updateScoreCalc();

        await supabaseTarget.from('scores').delete().eq('teamid', String(teamId)).eq('eventid', String(currentTournamentID));

        window.showNotification('Limpio', 'Puntajes eliminados exitosamente.', 'info');
        setTimeout(() => {
          window._setTSection('scores');
          if (window._refreshTournamentStats) window._refreshTournamentStats();
        }, 500);
      });
    };

    window._updateScoreCalc = function () {
      const inputs = Array.from(document.querySelectorAll('.hole-input'));
      const holes = inputs.map(i => parseInt(i.value) || 0);
      const out = holes.slice(0, 9).reduce((a, b) => a + b, 0);
      const _in = holes.slice(9, 18).reduce((a, b) => a + b, 0);
      const total = out + _in;
      document.getElementById('sc-out').textContent = out;
      document.getElementById('sc-in').textContent = _in;
      document.getElementById('sc-total').textContent = total;
    };

    window._saveScore = async function (teamId) {
      const inputs = Array.from(document.querySelectorAll('.hole-input'));
      const holes = inputs.map(i => parseInt(i.value) || 0);
      const out = holes.slice(0, 9).reduce((a, b) => a + b, 0);
      const _in = holes.slice(9, 18).reduce((a, b) => a + b, 0);

      const selectedCourse = document.querySelector('select[onchange^="window._openScorecard"]')?.options[document.querySelector('select[onchange^="window._openScorecard"]')?.selectedIndex].text || currentTournamentCourses[0];

      const { error } = await supabaseTarget.from('scores').upsert({
        teamid: String(teamId),
        eventid: String(currentTournamentID),
        coursename: selectedCourse,
        holes: holes,
        out: out,
        in: _in,
        total: out + _in
      }, { onConflict: 'teamid,coursename' });

      if (error) window.showNotification('Error', error.message, 'error');
      else {
        window.showNotification('¡Guardado!', 'Score actualizado y sincronizado en la nube.', 'success');
        window._setTSection('scores');
        window._refreshTournamentStats();
      }
    };
  } else if (section === 'oyeses') {
    if (window._isPublicWidget) {
      content.innerHTML = `
        <div class="lg:col-span-12 flex flex-col items-center mb-12">
            <h1 class="text-4xl md:text-5xl font-black text-[#1b4f72] dark:text-white uppercase tracking-tighter text-center">${currentTournamentName}</h1>
            <div class="flex items-center gap-3 mt-4">
               <span class="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
               <p class="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Marcas Oye's Live Results</p>
            </div>
            
            <div class="w-full max-w-2xl flex items-center gap-6 mt-12">
               <div class="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
               <span class="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] whitespace-nowrap">Powered by Golf Targets</span>
               <div class="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
            </div>
        </div>

        <div class="lg:col-span-12 flex flex-col gap-6 w-full">
           <div id="oyeses-grouped-list" class="space-y-8 pb-20">
              <div class="flex justify-center p-20"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div></div>
           </div>
        </div>
      `;
    } else {
      const { data: oyesConfigData } = await supabaseTarget.from('oyes_config')
        .select('*')
        .eq('tournament_id', String(currentTournamentID))
        .order('hoyo', { ascending: true });
      const hasConfig = oyesConfigData && oyesConfigData.length > 0;

      content.innerHTML = `
        <div class="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div class="lg:col-span-4">
            <div class="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm sticky top-8">
              
              <div class="flex flex-col gap-4 mb-8">
                 <button onclick="window._configOyesHoles()" class="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-[0_4px_14px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2">
                   <span class="material-icons text-sm">settings</span> ${hasConfig ? "Modificar Hoyos con Premio" : "Configurar Hoyos con Oye's"}
                 </button>
                 ${hasConfig ? `
                 <button onclick="window._viewOyesCodes()" class="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-2xl font-bold uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2">
                   <span class="material-icons text-sm">key</span> Ver Códigos de Jueces
                 </button>
                 ` : ''}
              </div>
              <div class="w-full h-px bg-slate-100 dark:bg-slate-800 mb-8 block"></div>

              <div class="flex items-center gap-4 mb-8">
                 <div class="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
                   <span class="material-icons">track_changes</span>
                 </div>
                 <div>
                   <h3 class="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Nuevo Registro Oye's</h3>
                   <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">${hasConfig ? 'Registro Manual de Respaldo' : 'Solo jugadores inscritos'}</p>
                 </div>
              </div>

              <form id="oye-reg-form" class="space-y-6 ${!hasConfig ? 'opacity-50 pointer-events-none' : ''}">
                ${!hasConfig ? '<p class="text-[9px] font-bold text-red-500 uppercase text-center">Primero configura los hoyos arriba ☝️</p>' : ''}
                <div>
                  <label class="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Hoyo y Campo</label>
                  <div class="grid grid-cols-5 gap-2">
                     <select id="oye-hole" required class="col-span-2 px-2 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-black text-center text-sm text-emerald-600 outline-none">
                       ${hasConfig ? oyesConfigData.map(c => `<option value="${c.hoyo}">${c.hoyo}</option>`).join('') : '<option value="">--</option>'}
                     </select>
                     <select id="oye-course" class="col-span-3 px-2 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-black text-[10px] uppercase text-amber-500 outline-none">
                       ${currentTournamentCourses.map(c => `<option value="${c}">${c}</option>`).join('')}
                     </select>
                  </div>
                </div>

                <div>
                  <label class="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Nombre del Jugador</label>
                  <input id="oye-name" type="text" required class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-black text-xs uppercase placeholder:text-slate-300 focus:ring-2 focus:ring-amber-500/20 transition-all" placeholder="NOMBRE DEL JUGADOR...">
                </div>

                <div>
                  <label class="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Distancia (MTS)</label>
                  <input id="oye-dist" type="text" required class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-black text-center text-sm focus:ring-2 focus:ring-amber-500/20 transition-all" placeholder="Ej. 1.25">
                </div>

                <button type="submit" ${!hasConfig ? 'disabled' : ''} class="w-full py-5 ${hasConfig ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-900 active:scale-95 shadow-xl' : 'bg-slate-300 dark:bg-slate-800 text-slate-500'} rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all">
                  <span class="material-icons">add</span> Registrar Oye's
                </button>
              </form>
            </div>
          </div>

          <div class="lg:col-span-8 flex flex-col gap-6">
            <div class="flex items-center justify-between px-4">
              <div class="flex items-center gap-3">
                 <div class="w-2 h-8 bg-amber-500 rounded-full"></div>
                 <h3 class="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">Actividad Reciente / Gesti&oacute;n</h3>
              </div>
              <p id="oyeses-count-badge" class="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">-- Registros</p>
            </div>

            <div id="oyeses-grouped-list" class="space-y-8 pb-20">
               <div class="flex justify-center p-20"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div></div>
            </div>
          </div>
        </div>
      `;

      if(document.getElementById('oye-reg-form')) {
          document.getElementById('oye-reg-form').onsubmit = async (e) => {
            e.preventDefault();
            if (!hasConfig) return;
            const hole = document.getElementById('oye-hole').value;
            const name = document.getElementById('oye-name').value;
            const dist = document.getElementById('oye-dist').value;
            const course = document.getElementById('oye-course').value;

            const { error } = await supabaseTarget.from('oyeses').insert({
              eventid: String(currentTournamentID),
              hole,
              playername: name.toUpperCase(),
              distance: parseFloat(dist),
              coursename: course
            });

            if (error) window.showNotification('Error', error.message, 'error');
            else {
              window.showNotification('Éxito', 'Oye registrado.', 'success');
              document.getElementById('oye-name').value = '';
              document.getElementById('oye-dist').value = '';
              window._setTSection('oyeses');
              window._refreshTournamentStats();
            }
          };
      }

      window._configOyesHoles = () => {
         const currentHoles = hasConfig ? oyesConfigData.map(c => c.hoyo).join(', ') : '';
         const inputHoles = prompt("¿En qué hoyos habrá premio Oye's?\\nEscribe los números separados por coma (Ej. 2, 6, 8, 11, 15, 17)", currentHoles);
         if (inputHoles === null) return;
         
         const holesArray = inputHoles.split(',').map(h => parseInt(h.trim())).filter(h => !isNaN(h));
         
         if (holesArray.length === 0) {
             window.showNotification("Aviso", "No se guardó ninguna configuración.", "info");
             return;
         }

         const selectedCourse = currentTournamentCourses[0] || 'CAMPO PRINCIPAL';

         window.showNotification("Guardando...", "Generando códigos y preparando hoyos...", "info");

         setTimeout(async () => {
             // 1. Delete previous config
             await supabaseTarget.from('oyes_config').delete().eq('tournament_id', String(currentTournamentID));

             // 2. Insert new config
             const inserts = holesArray.map(h => {
                 // Generate a random 4-letter suffix
                 const randStr = Math.random().toString(36).substring(2,6).toUpperCase();
                 return {
                     tournament_id: String(currentTournamentID),
                     campo: selectedCourse,
                     hoyo: h,
                     codigo_juez: `H${h}-${randStr}`
                 };
             });

             const { error } = await supabaseTarget.from('oyes_config').insert(inserts);

             if (error) {
                 window.showNotification("Error", error.message, "error");
             } else {
                 window.showNotification("¡Listo!", "Se han generado los hoyos y los accesos para jueces.", "success");
                 window._setTSection('oyeses'); // Refresh view
             }
         }, 500);
      };

      window._viewOyesCodes = () => {
         if (!hasConfig) return;
         
         let html = `<div class="space-y-4 mb-6"><p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Envía esta liga por WhatsApp a los Jueces en Campo para que puedan capturar distancias sin descargar nada:</p>
         <div class="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center select-all"><b class="text-emerald-500 text-sm tracking-wider">https://golfmanzanillo.mx/oyes</b></div>
         <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-6 mb-2">Códigos de Acceso:</p>`;
         
         html += `<div class="grid grid-cols-2 gap-3">`;
         oyesConfigData.forEach(c => {
             html += `
               <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                 <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Hoyo ${c.hoyo}</p>
                 <p class="text-lg font-black text-slate-900 dark:text-white tracking-widest select-all">${c.codigo_juez}</p>
               </div>
             `;
         });
         html += `</div></div>`;

         const modal = document.createElement('div');
         modal.className = 'fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in';
         modal.innerHTML = `
           <div class="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-8 relative shadow-2xl">
              <h3 class="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-6 flex items-center gap-2"><span class="material-icons text-emerald-500">key</span> Accesos de Juez</h3>
              ${html}
              <button class="w-full mt-4 py-4 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all close-btn">Cerrar Códigos</button>
           </div>
         `;
         document.body.appendChild(modal);
         modal.querySelector('.close-btn').onclick = () => modal.remove();
      };
    }

    const fetchOyeses = async () => {
      const { data } = await supabaseTarget.from('oyeses').select('*').eq('eventid', String(currentTournamentID)).order('hole', { ascending: true });
      const grid = document.getElementById('oyeses-grouped-list');
      const badge = document.getElementById('oyeses-count-badge');
      if (badge) badge.textContent = `${data?.length || 0} Registros`;

      if (!data || data.length === 0) {
        grid.innerHTML = '<div class="py-20 text-center text-slate-400 font-bold uppercase tracking-widest italic text-xs">Sin registros de oye\'s en este torneo.</div>';
        return;
      }

      // 1. Agrupar por Campo primero
      const groupedByCourse = {};
      data.forEach(o => {
        const c = o.coursename || 'CAMPO DESCONOCIDO';
        if (!groupedByCourse[c]) groupedByCourse[c] = {};
        if (!groupedByCourse[c][o.hole]) groupedByCourse[c][o.hole] = [];
        groupedByCourse[c][o.hole].push(o);
      });

      const colors = ['emerald', 'amber', 'sky', 'indigo', 'rose'];

      grid.innerHTML = Object.keys(groupedByCourse).sort().map((course, cIdx) => {
        const color = colors[cIdx % colors.length];
        const holesData = groupedByCourse[course];

        return `
          <div class="space-y-6 animate-fade-in" style="animation-delay: ${cIdx * 0.1}s">
            <div class="flex flex-col items-center justify-center px-4 pb-6 border-b-2 border-slate-100 dark:border-slate-800 gap-3">
               <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-${color}-500/10 text-${color}-600 flex items-center justify-center font-black">
                    <span class="material-icons">landscape</span>
                  </div>
                  <h3 class="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">${course}</h3>
               </div>
               <p class="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Oye's Leaderboard</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              ${Object.keys(holesData).sort((a, b) => parseInt(a) - parseInt(b)).map((hole, hIdx) => {
          const records = holesData[hole].sort((a, b) => a.distance - b.distance);
          
          const holeColorList = [
              { color: 'emerald' },
              { color: 'amber' },
              { color: 'sky' },
              { color: 'indigo' },
              { color: 'rose' },
              { color: 'teal' },
              { color: 'fuchsia' }
          ];
          const holeColorObj = holeColorList[hIdx % holeColorList.length];
          const holeColor = holeColorObj.color;

          return `
                  <div class="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all h-full group">
                    <div class="bg-${holeColor}-500 px-8 py-5 flex justify-between items-center">
                       <h4 class="text-white font-black uppercase text-[12px] tracking-widest flex items-center gap-2">
                         <span class="material-icons text-sm">flag</span> Hoyo #${hole}
                       </h4>
                       <span class="px-3 py-1 bg-white/20 text-white rounded-full text-[9px] font-black uppercase tracking-widest">${records.length} Marcas</span>
                    </div>
                    <div class="divide-y divide-slate-50 dark:divide-slate-800">
                      ${records.map((o, idx) => `
                        <div class="px-8 py-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <div class="flex items-center gap-5">
                            <div class="w-10 h-10 rounded-xl ${idx === 0 ? `bg-${holeColor}-500 text-white` : 'bg-slate-100 dark:bg-slate-800 text-slate-400'} flex items-center justify-center text-[11px] font-black shadow-sm">
                              ${idx === 0 ? '<span class="material-icons text-base">emoji_events</span>' : `#${idx + 1}`}
                            </div>
                            <div>
                              <p class="text-[12px] font-black uppercase text-slate-900 dark:text-white leading-tight">${o.playername}</p>
                              <p class="text-[9px] font-bold text-${holeColor}-500 uppercase mt-1 tracking-widest">${o.distance} MTS</p>
                            </div>
                          </div>
                          ${window._isPublicWidget ? '' : `
                            <div class="flex items-center gap-1">
                              <button onclick="window._editOye('${o.id}', '${o.distance}', '${o.playername.replace(/'/g, "\\'")}')" class="w-10 h-10 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all flex items-center justify-center">
                                <span class="material-icons text-sm">edit</span>
                              </button>
                              <button onclick="window._deleteOye('${o.id}')" class="w-10 h-10 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex items-center justify-center">
                                <span class="material-icons text-sm">delete</span>
                              </button>
                            </div>
                          `}
                        </div>
                      `).join('')}
                    </div>
                  </div>
                `;
        }).join('')}
            </div>
          </div>
        `;
      }).join('');
    };
    fetchOyeses();

    // Real-Time Listener - Cleanup first to avoid duplication crash
    if (window._oyesLiveChannel) {
      supabase.removeChannel(window._oyesLiveChannel);
    }
    window._oyesLiveChannel = supabase.channel('oyeses-live-' + currentTournamentID)
      .on('postgres_changes', { event: '*', schema: 'colimaGC', table: 'oyeses', filter: `eventid=eq.${currentTournamentID}` }, () => {
        fetchOyeses();
      });
    window._oyesLiveChannel.subscribe();

    window._deleteOye = (id) => {
      window.showNotification('Eliminar', '¿Seguro que quieres borrar este registro?', 'confirm', async () => {
        await supabaseTarget.from('oyeses').delete().eq('id', id);
        window._setTSection('oyeses');
        window._refreshTournamentStats();
      });
    };

    window._editOye = (id, currentDist, currentName) => {
      const newDist = prompt(`Ingresa la nueva distancia (MTS) para ${currentName}:`, currentDist);
      if (newDist === null || newDist.trim() === '') return;
      const parsedDist = parseFloat(newDist);
      if (isNaN(parsedDist)) {
        window.showNotification("Error", "Distancia inválida", "error");
        return;
      }
      
      window.showNotification('Actualizando', 'Guardando cambios...', 'info');
      setTimeout(async () => {
        const { error } = await supabaseTarget.from('oyeses').update({ distance: parsedDist }).eq('id', id);
        if (error) {
           window.showNotification("Error", error.message, "error");
        } else {
           window.showNotification("Éxito", "Distancia actualizada.", "success");
           window._setTSection('oyeses');
           window._refreshTournamentStats();
        }
      }, 300);
    };

  } else if (section === 'posiciones') {
    content.innerHTML = `
      <div class="lg:col-span-12 flex flex-col gap-10">
        ${window._isPublicWidget ? `
           <div class="flex flex-col items-center mb-6">
              <h1 class="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter text-center leading-tight">${currentTournamentName}</h1>
              <div class="flex items-center gap-3 mt-4">
                 <span id="live-indicator" class="flex h-2 w-2 relative">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                 <p class="text-[10px] md:text-xs font-black text-emerald-500 uppercase tracking-[0.3em]">Leaderboard Live Update</p>
              </div>

              <div class="w-full max-w-2xl flex items-center gap-6 mt-12 mb-8">
                <div class="flex-1 h-px bg-white/10"></div>
                <span class="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em] whitespace-nowrap">Resultados en Tiempo Real</span>
                <div class="flex-1 h-px bg-white/10"></div>
              </div>
           </div>
        ` : ''}
        <div id="leaderboard-content" class="space-y-16">
           <div class="flex justify-center p-20"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        </div>
      </div>
    `;
    const fetchLeaderboard = async () => {
      const { data: teams, error: tErr } = await supabaseTarget.from('vw_leaderboard_resultados').select('*').eq('eventid', currentTournamentID);
      const { data: scores } = await supabaseTarget.from('scores').select('*').eq('eventid', currentTournamentID);
      const lbContent = document.getElementById('leaderboard-content');

      if (tErr) console.error("Error cargando Leaderboard SQL:", tErr);

      if (!teams || teams.length === 0 || !scores || scores.length === 0) {
        lbContent.innerHTML = `
          <div class="py-32 text-center bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <span class="material-icons text-7xl text-slate-100 mb-6">${tErr ? 'lock_outline' : 'workspace_premium'}</span>
            <h3 class="text-xl font-black text-slate-400 uppercase tracking-tighter">${tErr ? 'Espera...' : 'Sin Scores Registrados'}</h3>
            <p class="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-2">${tErr ? 'Inyectando permisos para calcular base de datos...' : 'La tabla de posiciones se sumará automáticamente.'}</p>
          </div>
        `;
        return;
      }

      // Group by category and sum all scores per team
      const categories = {};
      teams.forEach(t => {
        const catId = t.categoria_id || t.category;
        const catObj = dbCategorias.find(c => String(c.id) === String(catId));
        const catNameStr = catObj?.name || t.category || 'CATEGORÍA GENERAL';

        const teamScores = scores.filter(s => s.teamid === t.id);

        if (teamScores.length > 0) {
          // Valores que llegarán directamente calculados desde Supabase (Vista o Tabla Modificada)
          const ventaja = parseFloat(t.ventaja || teamScores[0]?.ventaja || 0);
          const totalNeto = parseFloat(t.neto || teamScores[0]?.neto || t.total_neto || teamScores[0]?.total_neto || 0);

          const totalOut = teamScores.reduce((acc, s) => acc + (s.out || 0), 0);
          const totalIn = teamScores.reduce((acc, s) => acc + (s.in || 0), 0);
          const totalGross = teamScores.reduce((acc, s) => acc + (s.total || 0), 0);

          if (!categories[catNameStr]) categories[catNameStr] = [];
          categories[catNameStr].push({
            team: t,
            totalGross,
            totalNeto,
            totalOut,
            totalIn,
            rounds: teamScores.length,
            ventaja
          });
        }
      });

      if (Object.keys(categories).length === 0) {
        lbContent.innerHTML = `<div class="py-20 text-center text-slate-400 font-bold uppercase tracking-widest">Esperando primer score registrado...</div>`;
        return;
      }

      const catColors = ['bg-emerald-500', 'bg-sky-500', 'bg-rose-500', 'bg-amber-500', 'bg-indigo-500'];

      lbContent.innerHTML = Object.keys(categories).sort().map((catName, catIdx) => {
        const colorClass = catColors[catIdx % catColors.length];
        return `
        <div class="space-y-6 animate-fade-in">
           <div class="flex items-center gap-4 px-4">
              <div class="w-1.5 h-10 ${colorClass} rounded-full"></div>
              <h3 class="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">${catName}</h3>
           </div>
           
           <div class="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
             <div class="overflow-x-auto">
               <table class="w-full text-left">
                 <thead>
                   <tr class="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                     <th class="px-6 py-5 w-16 text-center rounded-tl-[3rem]">POS</th>
                     <th class="px-6 py-5">EQUIPO / JUGADORES</th>
                     <th class="px-6 py-5 text-center">CATEGORÍA</th>
                     <th class="px-4 py-5 w-24 text-center text-[#1b4f72]">VENTAJA</th>
                     <th class="px-4 py-5 w-24 text-center bg-slate-800">GROSS</th>
                     <th class="px-4 py-5 w-24 text-center bg-emerald-500/20 text-emerald-300">NETO</th>
                     <th class="px-6 py-5 text-center w-20 text-slate-400 rounded-tr-[3rem]">INFO</th>
                   </tr>
                 </thead>
                 <tbody class="divide-y divide-slate-50 dark:divide-slate-800">
                   ${categories[catName].sort((a, b) => {
                       // 1° Criterio: Neto total REDONDEADO (menor gana)
                       const netoRedondeadoA = Math.round(a.totalNeto || 0);
                       const netoRedondeadoB = Math.round(b.totalNeto || 0);
                       const netoDiff = netoRedondeadoA - netoRedondeadoB;
                       if (netoDiff !== 0) return netoDiff;

                       // 2° Criterio (Desempate): Segunda vuelta OUT (hoyos 10-18, menor gana)
                       const inDiff = a.totalIn - b.totalIn;
                       if (inDiff !== 0) return inDiff;

                       // 3° Criterio (Desempate): Primera vuelta IN (hoyos 1-9, menor gana)
                       const outDiff = a.totalOut - b.totalOut;
                       if (outDiff !== 0) return outDiff;

                       // 4° Criterio (Desempate): Mejor handicap REDONDEADO (menor ventaja gana)
                       const ventajaRedondeadaA = Math.round(a.ventaja || 0);
                       const ventajaRedondeadaB = Math.round(b.ventaja || 0);
                       const ventajaDiff = ventajaRedondeadaA - ventajaRedondeadaB;
                       if (ventajaDiff !== 0) return ventajaDiff;

                       // 5° Criterio (Desempate Final): Neto exacto con decimales
                       a.showDecimal = true;
                       b.showDecimal = true;
                       return (a.totalNeto || 0) - (b.totalNeto || 0);
                    }).map((item, idx) => `
                     <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800 transition-colors">
                       <td class="px-6 py-6 text-center">
                         <span class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-sm mx-auto shadow-sm">#${idx + 1}</span>
                       </td>
                       <td class="px-6 py-6">
                         <div class="flex flex-col justify-center">
                           <p class="font-black text-[14px] uppercase text-slate-900 dark:text-white leading-none mb-1.5">
                              ${currentTournamentConfig.teamSize > 1 ? `EQUIPO #${teams.length - teams.indexOf(item.team)} - <span class="text-primary">${item.team.teamname}</span>` : item.team.teamname}
                           </p>
                           <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate max-w-[250px] sm:max-w-[350px] lg:max-w-[450px]">
                              ${item.team.players?.map(p => p.name).join(' • ') || 'Sin jugadores registrados'}
                           </p>
                         </div>
                       </td>
                       <td class="px-6 py-6 text-center">
                          <span class="text-[9px] font-black text-white ${colorClass} px-3 py-1.5 rounded-full uppercase tracking-widest whitespace-nowrap shadow-sm">${catName}</span>
                       </td>
                       <td class="px-4 py-6 text-center bg-sky-50 dark:bg-sky-900/20">
                          <span class="text-xs font-black text-[#1b4f72] dark:text-[#a9cce3]">${item.ventaja > 0 ? '-' : ''}${item.showDecimal ? parseFloat(item.ventaja || 0).toFixed(1) : Math.round(item.ventaja || 0)}</span>
                       </td>
                       <td class="px-4 py-6 text-center bg-slate-50/80 dark:bg-slate-800/80">
                          <span class="text-[19px] font-black text-slate-900 dark:text-white">${item.totalGross || 0}</span>
                       </td>
                       <td class="px-4 py-6 text-center bg-emerald-50 dark:bg-emerald-900/20 shadow-[inset_0_3px_15px_-5px_rgba(16,185,129,0.2)]">
                          <span class="text-[19px] font-black text-emerald-600 dark:text-emerald-400">${item.showDecimal ? parseFloat(item.totalNeto || 0).toFixed(1) : Math.round(item.totalNeto || 0)}</span>
                       </td>
                       <td class="px-6 py-6 text-center">
                         <button onclick="window._viewTeamScorecards('${item.team.id}', '${item.team.teamname.replace(/'/g, "\\'")}')" class="w-10 h-10 bg-white dark:bg-slate-800 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95 mx-auto">
                           <span class="material-icons text-sm">visibility</span>
                         </button>
                       </td>
                     </tr>
                   `).join('')}
                 </tbody>
               </table>
             </div>
           </div>
        </div>
      `;
      }).join('');
    };

    window._viewTeamScorecards = async (teamId, teamName) => {
      const { data: teamData } = await supabaseTarget.from('teams').select('*').eq('id', teamId).single();
      const { data: teamScores, error } = await supabaseTarget.from('scores').select('*').eq('teamid', teamId).eq('eventid', currentTournamentID);

      const { data: pubCourses } = await supabase.from('golf_courses').select('*');
      const { data: targetCourses } = await supabaseTarget.from('golf_courses').select('*');
      const allPossibleCourses = [...(pubCourses || []), ...(targetCourses || [])];
      const cleanStr = (s) => s?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/&[a-z0-9]+;/gi, '').replace(/[^a-z0-9]/gi, '').toUpperCase() || '';

      if (error) {
        window.showNotification('Error', error.message, 'error');
        return;
      }

      // Calcular ventaja en vivo
      const sumHcp = teamData?.players?.reduce((acc, p) => acc + (parseFloat(p.hdcp) || 0), 0) || 0;
      const catId = teamData?.categoria_id || teamData?.category;
      const catObj = dbCategorias.find(c => String(c.id) === String(catId));

      let teamVentaja = 0;
      if (catObj && catObj.porcentaje_ventaja !== undefined) {
        teamVentaja = Math.floor(sumHcp * (parseFloat(catObj.porcentaje_ventaja) / 100) + 0.5);
      } else {
        teamVentaja = sumHcp;
      }

      // Colores por curso: 1:Emerald, 2:Amber, 3:Sky, 4:Indigo, 5:Rose
      const colors = ['bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-indigo-500', 'bg-rose-500'];
      const textColors = ['text-emerald-500', 'text-amber-500', 'text-sky-500', 'text-indigo-500', 'text-rose-500'];

      const modalContent = `
        <div class="w-full max-w-4xl mx-auto space-y-10 px-2 py-6">
          <div class="text-center space-y-2">
            <p class="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">RESUMEN DE RONDAS</p>
            <h2 class="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">${teamName}</h2>
          </div>
          
          <div class="grid grid-cols-1 gap-10">
            ${teamScores.map((s, idx) => {
        const holes = s.holes || new Array(18).fill(0);
        const scClean = cleanStr(s.coursename);
        const courseInfo = allPossibleCourses?.find(c => {
          const cnClean = cleanStr(c.name);
          if (scClean.includes(cnClean) || cnClean.includes(scClean)) return true;
          
          // Coincidencia por palabras clave compartidas
          const genericWords = ['CLUB', 'GOLF', 'RESORT', 'FOUR', 'SEASONS'];
          const isSignificant = (w) => w.length > 3 && !genericWords.includes(w);
          const cWords = (c.name || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().split(/[^A-Z]/).filter(isSignificant);
          const sWords = (s.coursename || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().split(/[^A-Z]/).filter(isSignificant);
          return cWords.some(w => sWords.includes(w));
        });

        const getGallinos = (holeNum) => {
          if (!courseInfo) return 0;
          const hIdx = courseInfo[`h${holeNum}`];
          if (!hIdx) return 0;
          let count = 0;
          let tempV = teamVentaja;
          while (tempV >= hIdx) { count++; tempV -= 18; }
          return count;
        };

        return `
              <div class="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden relative">
                <!-- HEADER TARJETA -->
                <div class="bg-slate-900 p-8 flex justify-between items-center border-b border-white/5">
                   <div class="flex items-center gap-5">
                      <div class="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                        <span class="material-icons">golf_course</span>
                      </div>
                      <div>
                        <h4 class="text-white font-black uppercase text-xl leading-none">${s.coursename}</h4>
                        <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Campo Oficial en Juego</p>
                      </div>
                   </div>
                   <div class="flex gap-4">
                      <div class="px-6 py-3 bg-white/5 rounded-2xl border border-white/5 text-center">
                        <p class="text-[8px] font-black text-slate-500 uppercase">GROSS</p>
                        <p class="text-xl font-black text-white">${s.total}</p>
                      </div>
                      <div class="px-6 py-3 bg-emerald-500 rounded-2xl text-center shadow-lg shadow-emerald-500/20">
                        <p class="text-[8px] font-black text-white/50 uppercase">NETO</p>
                        <p class="text-xl font-black text-white">${Math.round(s.total - teamVentaja)}</p>
                      </div>
                   </div>
                </div>

                <div class="p-10 space-y-10">
                  <div class="grid grid-cols-9 gap-3">
                     ${holes.slice(0, 9).map((h, i) => {
          const hNum = i + 1;
          const g = getGallinos(hNum);
          const par = courseInfo ? courseInfo[`p${hNum}`] : 4;
          return `
                         <div class="flex flex-col items-center gap-2">
                            <span class="text-[9px] font-black text-slate-400">#${hNum} <span class="text-[7px] text-slate-300 font-bold ml-1">${par}</span></span>
                            <div class="w-full py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center font-black text-lg text-slate-900 dark:text-white relative border border-slate-100 dark:border-slate-800">
                              ${h || '-'}
                              ${g > 0 ? `<div class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">-${g}</div>` : ''}
                            </div>
                         </div>
                       `;
        }).join('')}
                  </div>
                  <div class="grid grid-cols-9 gap-3">
                     ${holes.slice(9, 18).map((h, i) => {
          const hNum = i + 10;
          const g = getGallinos(hNum);
          const par = courseInfo ? courseInfo[`p${hNum}`] : 4;
          return `
                         <div class="flex flex-col items-center gap-2">
                            <span class="text-[9px] font-black text-slate-400">#${hNum} <span class="text-[7px] text-slate-300 font-bold ml-1">${par}</span></span>
                            <div class="w-full py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center font-black text-lg text-slate-900 dark:text-white relative border border-slate-100 dark:border-slate-800">
                              ${h || '-'}
                              ${g > 0 ? `<div class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">-${g}</div>` : ''}
                            </div>
                         </div>
                       `;
        }).join('')}
                  </div>
                  
                  <div class="pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div class="flex gap-10">
                       <div class="text-center">
                         <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">IN (1-9)</span>
                         <span class="text-xl font-black text-slate-900 dark:text-white">${s.out}</span>
                       </div>
                       <div class="text-center">
                         <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">OUT (10-18)</span>
                         <span class="text-xl font-black text-slate-900 dark:text-white">${s.in}</span>
                       </div>
                    </div>
                    <div class="flex items-center gap-6">
                       <div class="text-right">
                         <p class="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Ajuste de Ventaja</p>
                         <p class="text-sm font-black text-slate-400">Total: -${Math.round(teamVentaja)} golpes</p>
                       </div>
                       <div class="w-12 h-12 rounded-full border-4 border-indigo-500/20 flex items-center justify-center">
                         <span class="material-icons text-indigo-500 text-sm">trending_down</span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            `;
      }).join('')}
          ${teamScores.length === 0 ? '<div class="py-32 text-center text-slate-200 font-black uppercase tracking-[0.5em] italic text-xl">Sin rondas registradas</div>' : ''}
          
          <button onclick="window._closeCustomModal()" class="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] hover:bg-primary hover:text-slate-900 transition-all shadow-2xl active:scale-95">Regresar a Posiciones</button>
        </div>
      `;

      // Mostrar en un modal personalizado mucho más grande
      const modal = document.createElement('div');
      modal.id = 'custom-score-modal';
      modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-4 animate-fade-in';
      modal.innerHTML = `
        <div class="bg-slate-50 dark:bg-slate-950 w-full max-w-5xl max-h-[90vh] rounded-[4rem] shadow-full overflow-hidden flex flex-col relative border border-white/10">
           <div class="flex-1 overflow-y-auto custom-scrollbar">
              ${modalContent}
           </div>
        </div>
      `;
      document.body.appendChild(modal);
      window._closeCustomModal = () => modal.remove();
    };

    fetchLeaderboard();

    // Real-Time Listeners - Cleanup first
    if (window._leaderboardLiveChannel) {
        supabase.removeChannel(window._leaderboardLiveChannel);
    }
    window._leaderboardLiveChannel = supabase.channel('leaderboard-live-' + currentTournamentID)
      .on('postgres_changes', { event: '*', schema: 'colimaGC', table: 'scores', filter: `eventid=eq.${currentTournamentID}` }, () => {
        fetchLeaderboard();
      })
      .on('postgres_changes', { event: '*', schema: 'colimaGC', table: 'teams', filter: `eventid=eq.${currentTournamentID}` }, () => {
        fetchLeaderboard();
      }).subscribe();
  } else if (section === 'widgets') {
    content.innerHTML = `
      <div class="lg:col-span-12 grid grid-cols-1 gap-8 pt-4">
        <div class="bg-slate-900 dark:bg-black p-10 rounded-[3.5rem] border border-slate-800 shadow-2xl overflow-hidden relative group">
          <div class="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-all"></div>
          <h4 class="text-white font-black uppercase text-[10px] tracking-widest mb-8 flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary"><span class="material-icons text-sm">share</span></span>
            Códigos de Embebido
          </h4>
          
          <div class="space-y-8">
            <div>
              <label class="block text-[8px] font-black uppercase text-slate-500 tracking-[0.2em] mb-3 ml-1">Live Tournament Portal (Premium Mobile)</label>
              <div class="relative">
                <pre class="bg-black/50 p-6 rounded-2xl text-[10px] text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-white/5 ring-1 ring-white/5"><code id="code-posiciones">&lt;style&gt;
  .contenedor-iframe-passgolf { position: relative; width: 100%; height: 1600px; overflow: hidden; }
  .contenedor-iframe-passgolf iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
&lt;/style&gt;
&lt;div class="contenedor-iframe-passgolf"&gt;
  &lt;iframe src="https://golfmanzanillo.mx/torneo/?id=${currentTournamentID}" title="Live Tournament Portal"&gt;&lt;/iframe&gt;
&lt;/div&gt;</code></pre>
                <button onclick="window._copyWidget('code-posiciones')" class="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-lg hover:bg-primary hover:text-slate-900 transition-all">
                  <span class="material-icons text-sm">content_copy</span>
                </button>
              </div>
            </div>
          </div>
          <p class="text-[10px] text-slate-500 mt-10 italic leading-relaxed">Nota: Se ha habilitado el nuevo portal optimizado para móviles. El portal incluye sus propias pestañas de navegación.</p>
        </div>

        <div class="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
           <div class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
             <span class="material-icons text-4xl">smartphone</span>
           </div>
           <h3 class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Nuevo Portal Móvil</h3>
           <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed max-w-xs">
             Hemos diseñado una experiencia premium exclusiva para celulares. Sincronización en vivo y diseño de alto impacto.
           </p>
            <button onclick="window.open('https://golfmanzanillo.mx/torneo/?id=${currentTournamentID}', '_blank')" class="mt-8 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-900/10 active:scale-95 transition-all">Abrir Portal Premium</button>
        </div>

        </div>
      </div>
    `;

    // Load Pro Courses
    const loadProCourses = async () => {
      const { data: courses } = await supabaseTarget.from('golf_courses').select('*').order('name');
      const grid = document.getElementById('courses-pro-list');
      if (!courses || courses.length === 0) {
        grid.innerHTML = '<div class="col-span-full p-10 text-center text-slate-400 font-bold uppercase tracking-widest italic text-xs">No hay campos registrados en el esquema pro.</div>';
        return;
      }

      grid.innerHTML = courses.map(c => `
        <div class="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-primary transition-all">
          <div class="flex items-center justify-between mb-6">
            <h5 class="text-lg font-black text-slate-900 dark:text-white uppercase truncate pr-4">${c.name}</h5>
            <button onclick='window._openEditCourseHoles("${c.id}")' class="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-primary shadow-sm active:scale-90 transition-all">
              <span class="material-icons text-sm">settings_input_component</span>
            </button>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-white/50 dark:bg-slate-900/50 p-4 rounded-2xl">
              <label class="block text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Par</label>
              <p class="text-xl font-black text-slate-900 dark:text-white">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].reduce((acc, i) => acc + (c[`p${i}`] || 0), 0)}</p>
            </div>
            <div class="bg-white/50 dark:bg-slate-900/50 p-4 rounded-2xl">
              <label class="block text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">HCP Config</label>
              <p class="text-base font-black text-emerald-500 uppercase">18 HOYOS OK</p>
            </div>
          </div>
        </div>
      `).join('');
    };
    loadProCourses();

    window._openEditCourseHoles = async (id) => {
      const { data: c } = await supabaseTarget.from('golf_courses').select('*').eq('id', id).single();
      if (!c) return;

      let modalHtml = `
        <div class="max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar text-left py-4">
          <h4 class="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8">${c.name} - Configuración Pro</h4>
          <div class="space-y-12">
            <!-- VUELTA 1-9 -->
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Métricas Hoyos 1-9</p>
              <div class="grid grid-cols-9 gap-3">
                ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(h => `
                  <div class="space-y-2">
                    <span class="block text-[8px] font-black text-slate-500 text-center">H#${h}</span>
                    <input id="p-hcp-${h}" type="number" value="${c[`h${h}`] || 0}" class="w-full p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-center font-black text-xs border-none" placeholder="HD">
                    <input id="p-par-${h}" type="number" value="${c[`p${h}`] || 4}" class="w-full p-2 bg-emerald-500/10 text-emerald-600 rounded-lg text-center font-black text-xs border-none" placeholder="PAR">
                  </div>
                `).join('')}
              </div>
            </div>
            <!-- VUELTA 10-18 -->
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Métricas Hoyos 10-18</p>
              <div class="grid grid-cols-9 gap-3">
                ${[10, 11, 12, 13, 14, 15, 16, 17, 18].map(h => `
                  <div class="space-y-2">
                    <span class="block text-[8px] font-black text-slate-500 text-center">H#${h}</span>
                    <input id="p-hcp-${h}" type="number" value="${c[`h${h}`] || 0}" class="w-full p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-center font-black text-xs border-none" placeholder="HD">
                    <input id="p-par-${h}" type="number" value="${c[`p${h}`] || 4}" class="w-full p-2 bg-emerald-500/10 text-emerald-600 rounded-lg text-center font-black text-xs border-none" placeholder="PAR">
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          <p class="text-[9px] text-slate-400 mt-10 italic uppercase font-bold tracking-widest text-center">"HCP" es la dificultad (1 es el más difícil) • "PAR" es el score par del hoyo.</p>
        </div>
      `;

      window.showNotification('', modalHtml, 'confirm', async () => {
        const updateObj = {};
        for (let i = 1; i <= 18; i++) {
          updateObj[`h${i}`] = parseInt(document.getElementById(`p-hcp-${i}`).value) || 0;
          updateObj[`p${i}`] = parseInt(document.getElementById(`p-par-${i}`).value) || 4;
        }

        const { error } = await supabaseTarget.from('golf_courses').update(updateObj).eq('id', id);
        if (error) window.showNotification('Error', error.message, 'error');
        else {
          window.showNotification('¡Actualizado!', 'Configuración de campo guardada con éxito.', 'success');
          loadProCourses();
        }
      });
    };
  }
};

window._copyWidget = (id) => {
  const text = document.getElementById(id).textContent;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      window.showNotification('Copiado', 'Código copiado al portapapeles.', 'success');
    }).catch(() => {
      // Fallback
      _fallbackCopy(text);
    });
  } else {
    _fallbackCopy(text);
  }
};

const _fallbackCopy = (text) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    window.showNotification('Copiado', 'Código copiado (fallback).', 'success');
  } catch (err) {
    window.showNotification('Error', 'No se pudo copiar el código.', 'error');
  }
  document.body.removeChild(textArea);
};

window._updateTournamentSize = async function (size) {
  currentTournamentConfig.teamSize = size;
  // Sugerir modalidad por defecto según tamaño
  if (size === 1) currentTournamentConfig.modalidad = 'INDIVIDUAL';
  else currentTournamentConfig.modalidad = 'A GO GO';

  const { error } = await supabaseTarget.from('tournaments').update({ config: currentTournamentConfig }).eq('id', currentTournamentID);
  if (error) window.showNotification('Error', error.message, 'error');
  else window._setTSection('teams');
};

window._updateTournamentModality = async function (modalidad) {
  currentTournamentConfig.modalidad = modalidad;
  const { error } = await supabaseTarget.from('tournaments').update({ config: currentTournamentConfig }).eq('id', currentTournamentID);
  if (error) window.showNotification('Error', error.message, 'error');
  else window.showNotification('¡Sistema Cambiado!', `Ahora jugando ${modalidad}`, 'success');
};

window._addCategory = async function () {
  const input = document.getElementById('new-cat-input');
  const percInput = document.getElementById('new-cat-perc');
  const catName = input.value.trim().toUpperCase();
  const perc = parseFloat(percInput.value) || 0;
  if (!catName) return;

  if (!currentTournamentConfig.categories) currentTournamentConfig.categories = [];

  if (currentTournamentConfig.categories.some(c => (typeof c === 'string' ? c === catName : c.name === catName))) {
    window.showNotification('Aviso', 'La categoría ya existe.', 'info');
    return;
  }

  currentTournamentConfig.categories.push({
    id: Date.now(),
    name: catName,
    porcentaje_ventaja: perc
  });

  const { error } = await supabaseTarget.from('tournaments')
    .update({ config: currentTournamentConfig })
    .eq('id', currentTournamentID);

  if (error) window.showNotification('Error', error.message, 'error');
  else {
    window.showNotification('Creado', 'Categoría agregada correctamente.', 'success');
    window._setTSection('teams');
  }
};

window._removeCategory = async function (id) {
  const numericId = parseInt(id, 10);
  currentTournamentConfig.categories = currentTournamentConfig.categories.filter(c => c.id !== numericId);

  const { error } = await supabaseTarget.from('tournaments')
    .update({ config: currentTournamentConfig })
    .eq('id', currentTournamentID);

  if (error) window.showNotification('Error', error.message, 'error');
  else window._setTSection('teams');
};

window._deleteTeam = function (id) {
  window.showNotification('¿Eliminar Registro?', 'Se borrara al jugador/equipo y todos sus datos de score permanentemente.', 'confirm', async () => {
    await supabaseTarget.from('scores').delete().eq('teamid', id);
    const { error } = await supabaseTarget.from('teams').delete().eq('id', id);
    if (error) window.showNotification('Error', error.message, 'error');
    else {
      window.showNotification('Eliminado', 'Registro removido.', 'success');
      window._setTSection('teams');
      window._refreshTournamentStats();
    }
  });
};

window._expandRanking = () => {
  const extras = document.querySelectorAll('.ranking-row-extra');
  extras.forEach(el => el.classList.remove('hidden'));
  const btn = document.getElementById('ranking-expand-container');
  if (btn) btn.remove();
};
