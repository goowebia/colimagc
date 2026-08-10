import{t as e}from"./main-CTM-C1Mc.js";import{createClient as t}from"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";async function n(e,t,n,i,a,o){M=t,N=n,P=o,D=e;let{data:s}=await E.from(`tournaments`).select(`*`).eq(`id`,e).single();if(!s){o(`Error`,`Torneo no encontrado.`,`error`);return}O=s.name,k=s.config||{teamSize:2,categories:[],modalidad:`A GO GO`},A=s.courses?s.courses.split(`,`).map(e=>e.trim()):[`Campo Principal`],window._setTSection=r,await r(`teams`)}async function r(e){j=e;let t=[{id:`teams`,label:`Registros`,icon:`groups`},{id:`scores`,label:`Scores`,icon:`score`},{id:`oyeses`,label:`Oye's`,icon:`sports_golf`},{id:`posiciones`,label:`Posiciones`,icon:`leaderboard`},{id:`widgets`,label:`Nerve Center`,icon:`analytics`}],[n,a,o]=await Promise.all([E.from(`teams`).select(`id`,{count:`exact`}).eq(`eventid`,String(D)),E.from(`scores`).select(`id`,{count:`exact`}).eq(`eventid`,String(D)),E.from(`oyeses`).select(`id`,{count:`exact`}).eq(`eventid`,String(D))]),s=n.count||0,c=a.count||0,l=o.count||0,u=(k?.teamSize||1)===1?`Jugadores`:`Grupos`;M.innerHTML=N(`
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
                            <h1 class="text-2xl font-black text-white uppercase tracking-tight leading-none">${O}</h1>
                            <p class="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1">Dashboard de Control &nbsp;·&nbsp;
                                <span class="text-slate-400">${s} ${u} · ${c} Scores · ${l} Oye's</span>
                            </p>
                        </div>
                    </div>
                </div>
                <a href="/torneo/index.html?id=${D}" target="_blank"
                    class="flex items-center gap-2 px-4 py-2.5 bg-primary text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 self-start">
                    <span class="material-icons" style="font-size:15px">open_in_new</span> Visor Live
                </a>
            </div>

            <!-- TABS -->
            <div class="flex gap-2 mb-6 overflow-x-auto pb-1">
                ${t.map(e=>`
                    <button onclick="window._setTSection('${e.id}')"
                        class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all
                        ${j===e.id?`bg-primary text-slate-900 shadow-md shadow-primary/30`:`bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700`}">
                        <span class="material-icons" style="font-size:15px">${e.icon}</span>
                        ${e.label}
                    </button>`).join(``)}
            </div>

            <!-- CONTENT -->
            <div id="tournament-section-content" class="flex-1 min-h-0"></div>
        </div>`),window._setTSection=r;let d=document.getElementById(`tournament-section-content`);if(!d)return;let f=k,p=f?.teamSize||2,m=f?.categories||[],h=f?.modalidad||`A GO GO`,g=A;switch(e){case`teams`:await i(d,p,m,g,h);break;case`scores`:await y(d,g);break;case`oyeses`:await C(d,g);break;case`posiciones`:await w(d);break;case`widgets`:await T(d,s,c,l)}}async function i(e,t,n,r,i){let{data:f}=await E.from(`teams`).select(`*`).eq(`eventid`,String(D)).order(`hole`,{ascending:!0}),p=f||[];e.innerHTML=`
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
                        ${[1,2,3,4].map(e=>`
                            <button onclick="updateTeamSize(${e})" id="ts-btn-${e}"
                                class="py-3 rounded-xl border text-[10px] font-black uppercase transition-all
                                ${t===e?`bg-slate-900 border-white text-white shadow-inner`:`bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300`}">
                                ${e} Jugador${e>1?`es`:``}
                            </button>`).join(``)}
                    </div>

                    <!-- SISTEMA DE JUEGO -->
                    <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Sistema de Juego</p>
                    <select id="cfg-modalidad" onchange="updateModalidad(this.value)"
                        class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-black uppercase focus:outline-none focus:border-primary transition-all mb-5">
                        ${[`A GO GO`,`STROKE PLAY (INDIVIDUAL)`,`STROKE PLAY (EQUIPO)`,`MEJOR BOLA`,`STABLEFORD`,`SCRAMBLE`].map(e=>`<option value="${e}" ${i===e?`selected`:``}>${e}</option>`).join(``)}
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
                        ${n.map(e=>u(e)).join(``)}
                    </div>
                </div>

                <!-- REGISTRO DE PARTICIPANTE -->
                <div class="border-t border-slate-800 pt-5">
                    <div class="flex items-center gap-2 mb-4">
                        <span class="material-icons text-primary" style="font-size:18px">person_add</span>
                        <h3 class="font-black text-white uppercase tracking-widest text-xs">Registro de Participante</h3>
                    </div>

                    <div class="space-y-3">
                        ${[1,2,3,4].filter(e=>e<=t).map(e=>`
                            <input id="reg-p${e}" placeholder="${e===1?`Jugador Principal`:`Jugador `+e}"
                                class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-bold placeholder:text-slate-600 focus:outline-none focus:border-primary transition-all">`).join(``)}

                        ${n.length>0?`
                        <select id="reg-cat" onchange="autoCalcVentaja()" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-primary transition-all">
                            <option value="">Categoría...</option>
                            ${n.map(e=>{let t=typeof e==`object`?e.name:e;return`<option value="${t}">${t}</option>`}).join(``)}
                        </select>`:``}

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

                        <button onclick="doRegisterTeam(${t})"
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
                        <span id="reg-count-badge" class="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs font-black text-white">${p.length} ${t===1?`Jugadores`:`Grupos`}</span>
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
                    ${p.length===0?`<div class="flex flex-col items-center justify-center h-full py-16 gap-3 text-center">
                            <span class="material-icons text-slate-700" style="font-size:3rem">group_off</span>
                            <p class="text-slate-600 font-black uppercase tracking-widest text-xs">Sin registros aún.</p>
                           </div>`:`<div class="grid grid-cols-1 xl:grid-cols-2 gap-3" id="teams-inner">${p.map((e,t)=>d(e,t)).join(``)}</div>`}
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
        </div>`,window._currentCategories=[...n],window._currentTeamSize=t,window._currentModalidad=i,window._teamsData=p,window._teamsSort=`registro`,window._regHdcpMode=`index`,window._editHdcpMode=`index`,window.COLIMA_TEES={WHITE_BLUE:{name:`🔵⚪ Blancas / Azules`,rating:67.5,slope:104.5,par:68},GOLD_YELLOW:{name:`🟡🟡 Doradas / Amarillas`,rating:65.8,slope:99.6,par:68},RED_MEN:{name:`🔴🔴 Rojas Caballeros`,rating:64.5,slope:95.9,par:68},RED_LADIES:{name:`🔴🔴 Rojas Damas`,rating:64.5,slope:95.9,par:68},SILVER:{name:`⚪⚪ Plateadas Damas`,rating:64.1,slope:94.6,par:68}},window.calculateCourseHdcp=(e,t)=>{let n=window.COLIMA_TEES[t]||window.COLIMA_TEES.WHITE_BLUE,r=e*(n.slope/113)+(n.rating-n.par);return Math.max(0,Math.round(r))},window.setHdcpMode=e=>{window._regHdcpMode=e;let t=document.getElementById(`mode-btn-index`),n=document.getElementById(`mode-btn-direct`),r=document.getElementById(`section-index-mode`),i=document.getElementById(`section-direct-mode`);e===`index`?(t&&(t.className=`flex-1 py-2 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all bg-primary text-slate-900`),n&&(n.className=`flex-1 py-2 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all text-slate-400 hover:text-white`),r&&r.classList.remove(`hidden`),i&&i.classList.add(`hidden`)):(t&&(t.className=`flex-1 py-2 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all text-slate-400 hover:text-white`),n&&(n.className=`flex-1 py-2 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all bg-primary text-slate-900`),r&&r.classList.add(`hidden`),i&&i.classList.remove(`hidden`)),autoCalcVentaja()},window.autoCalcVentaja=()=>{let e=0;if(window._regHdcpMode===`index`){let t=parseFloat(document.getElementById(`reg-index`)?.value||`0`)||0,n=document.getElementById(`reg-tee`)?.value||`WHITE_BLUE`;e=window.calculateCourseHdcp(t,n);let r=document.getElementById(`reg-hdcp-calc`);r&&(r.value=e)}else e=parseInt(document.getElementById(`reg-hdcp`)?.value||`0`)||0;let t=document.getElementById(`reg-cat`),n=t?t.value:``,r=window._currentCategories.find(e=>(typeof e==`object`?e.name:e)===n),i=r&&typeof r==`object`&&r.pct||100,a=Math.round(e*i/100),o=document.getElementById(`ventaja-preview`),s=document.getElementById(`ventaja-value`);o&&s&&(e>0||n?(o.classList.remove(`hidden`),s.textContent=a):o.classList.add(`hidden`))},window.addCategoryToConfig=addCategoryToConfig,window.removeCatFromConfig=removeCatFromConfig,window.updateTeamSize=updateTeamSize,window.updateModalidad=updateModalidad,window.doRegisterTeam=e=>h(e),window.deleteTeamById=g,window.filterTeams=_,window.sortTeams=a,window.printTeamsList=()=>v(window._teamsData),window.openEditModal=o,window.closeEditModal=s,window.saveEditTeam=l,window.editAutoVentaja=c}function a(e){window._teamsSort=e,[`registro`,`categoria`,`ventaja`,`hoyo`].forEach(t=>{let n=document.getElementById(`sort-${t}`);n&&(n.className=t===e?n.className.replace(`bg-slate-800 border border-slate-700 text-slate-400 hover:text-white`,`bg-primary text-slate-900`):n.className.replace(`bg-primary text-slate-900`,`bg-slate-800 border border-slate-700 text-slate-400 hover:text-white`))});let t=document.getElementById(`teams-inner`);if(!t)return;let n=[...window._teamsData||[]];if(e===`categoria`){let e={};n.forEach(t=>{let n=(t.category||`SIN CATEGORÍA`).toUpperCase();e[n]||(e[n]=[]),e[n].push(t)}),t.innerHTML=`<div class="space-y-6 col-span-full">`+Object.keys(e).sort((e,t)=>e===`SIN CATEGORÍA`?1:t===`SIN CATEGORÍA`?-1:e.localeCompare(t)).map((t,n)=>{let r=e[t],i=F[n%F.length];return`
            <div class="space-y-3">
                <div class="relative flex items-center justify-between ${i.bg} border ${i.border} rounded-2xl px-5 py-3 shadow-xl backdrop-blur-md overflow-hidden">
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full ${i.dot} shadow-sm"></span>
                        <span class="text-[10px] font-black uppercase ${i.text} tracking-wider hidden sm:inline">CATEGORÍA</span>
                    </div>

                    <!-- TITULO CENTRADO DE LA CATEGORIA -->
                    <h3 class="absolute left-1/2 -translate-x-1/2 font-black text-white text-sm sm:text-base uppercase tracking-widest text-center flex items-center gap-2">
                        <span class="${i.text}">CATEGORÍA ${t}</span>
                    </h3>

                    <span class="px-3 py-1 ${i.badge} border rounded-full text-[10px] font-black uppercase tracking-wider ml-auto sm:ml-0">
                        ${r.length} ${r.length===1?`Jugador`:`Jugadores`}
                    </span>
                </div>
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    ${r.map((e,t)=>d(e,t)).join(``)}
                </div>
            </div>`}).join(``)+`</div>`}else if(e===`hoyo`){let e={};n.forEach(t=>{let n=t.hole?`HOYO ${t.hole}`:`SIN HOYO ASIGNADO`;e[n]||(e[n]=[]),e[n].push(t)}),t.innerHTML=`<div class="space-y-6 col-span-full">`+Object.keys(e).sort((e,t)=>e===`SIN HOYO ASIGNADO`?1:t===`SIN HOYO ASIGNADO`?-1:(parseInt(e.replace(`HOYO `,``))||0)-(parseInt(t.replace(`HOYO `,``))||0)).map((t,n)=>{let r=e[t],i=F[n%F.length];return`
            <div class="space-y-3">
                <div class="relative flex items-center justify-between ${i.bg} border ${i.border} rounded-2xl px-5 py-3 shadow-xl backdrop-blur-md overflow-hidden">
                    <div class="flex items-center gap-2">
                        <span class="material-icons ${i.text}" style="font-size:16px">flag</span>
                        <span class="text-[10px] font-black uppercase ${i.text} tracking-wider hidden sm:inline">SALIDA</span>
                    </div>

                    <!-- TITULO CENTRADO DEL HOYO -->
                    <h3 class="absolute left-1/2 -translate-x-1/2 font-black text-white text-sm sm:text-base uppercase tracking-widest text-center flex items-center gap-2">
                        <span class="${i.text}">${t}</span>
                    </h3>

                    <span class="px-3 py-1 ${i.badge} border rounded-full text-[10px] font-black uppercase tracking-wider ml-auto sm:ml-0">
                        ${r.length} ${r.length===1?`Jugador`:`Jugadores`}
                    </span>
                </div>
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    ${r.map((e,t)=>d(e,t)).join(``)}
                </div>
            </div>`}).join(``)+`</div>`}else e===`ventaja`&&n.sort((e,t)=>(t.ventaja||0)-(e.ventaja||0)),t.innerHTML=`<div class="grid grid-cols-1 xl:grid-cols-2 gap-3 col-span-full">${n.map((e,t)=>d(e,t)).join(``)}</div>`}function o(e){let t=window._teamsData.find(t=>t.id===e);if(!t)return;document.getElementById(`edit-team-id`).value=t.id;let n=window._currentTeamSize||1,r=document.getElementById(`edit-players-container`);r&&(r.innerHTML=[1,2,3,4].filter(e=>e<=n).map(e=>`
            <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">${e===1?`Jugador Principal`:`Jugador `+e}</label>
                <input id="edit-p${e}" value="${t[`player`+e]||e===1&&t.teamname||``}"
                    class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-primary transition-all">
            </div>
        `).join(``));let i=document.getElementById(`edit-cat`);i&&(i.innerHTML=`<option value="">Categoría...</option>`+(window._currentCategories||[]).map(e=>{let n=typeof e==`object`?e.name:e;return`<option value="${n}" ${n===t.category?`selected`:``}>${n}</option>`}).join(``)),document.getElementById(`edit-hdcp`).value=t.hdcp||0,document.getElementById(`edit-hole`).value=t.hole||``,c(),document.getElementById(`edit-team-modal`).classList.remove(`hidden`)}function s(){document.getElementById(`edit-team-modal`).classList.add(`hidden`)}function c(){let e=parseInt(document.getElementById(`edit-hdcp`)?.value||`0`)||0,t=document.getElementById(`edit-cat`)?.value||``,n=window._currentCategories?.find(e=>(typeof e==`object`?e.name:e)===t),r=n&&typeof n==`object`&&n.pct||100,i=Math.round(e*r/100),a=document.getElementById(`edit-ventaja`);a&&(a.value=i)}async function l(){let e=document.getElementById(`edit-team-id`).value,t=window._currentTeamSize||1,n=document.getElementById(`edit-p1`)?.value.trim()||``,i=t>=2&&document.getElementById(`edit-p2`)?.value.trim()||``,a=t>=3&&document.getElementById(`edit-p3`)?.value.trim()||``,o=t>=4&&document.getElementById(`edit-p4`)?.value.trim()||``,c=document.getElementById(`edit-cat`)?.value||``,l=parseInt(document.getElementById(`edit-hdcp`)?.value||`0`)||0,u=window._currentCategories?.find(e=>(typeof e==`object`?e.name:e)===c),d=u&&typeof u==`object`&&u.pct||100,f=Math.round(l*d/100),p=document.getElementById(`edit-hole`)?.value.trim()||``,m=p&&parseInt(p)||null,h=t===1?n:[n,i,a,o].filter(Boolean).join(` / `),{error:g}=await E.from(`teams`).update({teamname:h.toUpperCase(),player1:n.toUpperCase(),player2:i.toUpperCase(),player3:a.toUpperCase(),player4:o.toUpperCase(),category:c.toUpperCase(),hdcp:l,ventaja:f,hole:m}).eq(`id`,e);g?P(`Error`,g.message,`error`):(s(),P(`¡Guardado!`,`Participante actualizado.`,`success`),setTimeout(()=>r(`teams`),800))}function u(e){let t=typeof e==`object`?e.name:e,n=typeof e==`object`&&e.pct||100,r=t.replace(/'/g,`\\'`);return`<span class="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/15 border border-primary/30 rounded-full text-[10px] font-black text-primary uppercase">
        <span>${t} (${n}%)</span>
        <button type="button" onclick="openEditCategoryModal('${r}')" class="ml-1 hover:text-white transition-colors flex items-center" title="Editar Categoría">
            <span class="material-icons" style="font-size:12px">edit</span>
        </button>
        <button type="button" onclick="removeCatFromConfig('${r}')" class="hover:text-red-400 transition-colors font-bold text-xs" title="Eliminar Categoría">×</button>
    </span>`}function d(e,t){let n=[e.player1,e.player2,e.player3,e.player4].filter(Boolean),r=e.teamname||n[0]||`—`,i=e.category||``,a=e.hdcp||0,o=e.ventaja||0,s=e.hole,c=String(t+1).padStart(2,`0`);return`
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden group hover:border-slate-600 hover:shadow-lg hover:shadow-slate-900/50 transition-all" data-team-name="${r.toLowerCase()}">
            <!-- Top bar: number + name + category + actions -->
            <div class="flex items-center gap-3 px-4 pt-4 pb-3">
                <div class="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-white font-black text-sm shrink-0 border border-slate-600">#${c}</div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                        <p class="font-black text-white uppercase text-sm truncate">${r}</p>
                        ${i?`<span class="px-2 py-0.5 bg-primary/15 text-primary border border-primary/30 rounded-full text-[9px] font-black uppercase tracking-wide">${i}</span>`:``}
                    </div>
                    ${n.length>1?`<p class="text-slate-500 text-[11px] font-bold mt-0.5 truncate">${n.slice(1).join(` · `)}</p>`:``}
                </div>
                <!-- Action buttons -->
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onclick="openEditModal('${e.id}')"
                        class="w-7 h-7 bg-slate-700 hover:bg-primary/20 hover:border-primary/40 border border-slate-600 rounded-lg flex items-center justify-center transition-all">
                        <span class="material-icons text-slate-300 hover:text-primary" style="font-size:13px">edit</span>
                    </button>
                    <button onclick="deleteTeamById('${e.id}', '${r.replace(/'/g,`\\'`)}')"
                        class="w-7 h-7 bg-red-900/20 hover:bg-red-900/40 border border-red-900/30 rounded-lg flex items-center justify-center transition-all">
                        <span class="material-icons text-red-400" style="font-size:13px">delete</span>
                    </button>
                </div>
            </div>

            <!-- Bottom stats -->
            <div class="flex items-center gap-0 border-t border-slate-700/50">
                <div class="flex-1 px-4 py-2.5 border-r border-slate-700/50">
                    <p class="text-[9px] font-black text-slate-600 uppercase tracking-wider">HDCP</p>
                    <p class="text-base font-black text-slate-300">${a}</p>
                </div>
                <div class="flex-1 px-4 py-2.5 border-r border-slate-700/50">
                    <p class="text-[9px] font-black text-slate-600 uppercase tracking-wider">Ventaja</p>
                    <p class="text-base font-black text-primary">${o} <span class="text-[9px] text-slate-500">gls</span></p>
                </div>
                <div class="px-4 py-2.5 text-right min-w-[60px]">
                    <p class="text-[9px] font-black text-slate-600 uppercase tracking-wider">Hoyo</p>
                    ${s?`<p class="text-xl font-black text-white leading-none">${s}</p>`:`<button onclick="openEditModal('${e.id}')" class="text-[9px] font-black text-slate-600 hover:text-primary transition-colors uppercase tracking-wide flex items-center gap-0.5">
                             <span class="material-icons" style="font-size:10px">add</span>Asignar
                           </button>`}
                </div>
            </div>
        </div>`}async function f(){let e={teamSize:window._currentTeamSize,categories:window._currentCategories,modalidad:window._currentModalidad},{error:t}=await E.from(`tournaments`).update({config:e}).eq(`id`,D);return t||(k=e),t}function p(){let e=document.getElementById(`reg-cat`);if(!e)return;let t=e.value;e.innerHTML=`<option value="">Categoría...</option>${window._currentCategories.map(e=>{let n=typeof e==`object`?e.name:e;return`<option value="${n}" ${n===t?`selected`:``}>${n}</option>`}).join(``)}`}function m(){let e=document.getElementById(`cat-tags`);e&&(e.innerHTML=window._currentCategories.map(e=>u(e)).join(``))}async function h(e){let t=document.getElementById(`reg-p1`)?.value.trim();if(!t){P(`Campo requerido`,`El nombre del jugador 1 es obligatorio.`,`error`);return}let n=e>=2&&document.getElementById(`reg-p2`)?.value.trim()||``,i=e>=3&&document.getElementById(`reg-p3`)?.value.trim()||``,a=e>=4&&document.getElementById(`reg-p4`)?.value.trim()||``,o=document.getElementById(`reg-cat`),s=o?o.value:``,c=0,l=`WHITE_BLUE`,u=0;window._regHdcpMode===`index`?(c=parseFloat(document.getElementById(`reg-index`)?.value||`0`)||0,l=document.getElementById(`reg-tee`)?.value||`WHITE_BLUE`,u=window.calculateCourseHdcp(c,l)):u=parseInt(document.getElementById(`reg-hdcp`)?.value||`0`)||0;let d=window._currentCategories.find(e=>(typeof e==`object`?e.name:e)===s),f=d&&typeof d==`object`&&d.pct||100,p=Math.round(u*f/100),m=e===1?t:[t,n,i,a].filter(Boolean).join(` / `),h={eventid:String(D),teamname:m.toUpperCase(),player1:t.toUpperCase(),player2:n.toUpperCase(),player3:i.toUpperCase(),player4:a.toUpperCase(),category:s.toUpperCase(),hdcp:u,ventaja:p,hole:null,player_index:c,tee_color:l},{error:g}=await E.from(`teams`).insert([h]);g&&(delete h.player_index,delete h.tee_color,{error:g}=await E.from(`teams`).insert([h])),g?P(`Error`,g.message,`error`):(P(`¡Registrado!`,`${m} se ha registrado correctamente.`,`success`),[`reg-p1`,`reg-p2`,`reg-p3`,`reg-p4`,`reg-index`,`reg-hdcp`].forEach(e=>{let t=document.getElementById(e);t&&(t.value=``)}),r(`teams`))}async function g(e,t){P(`Eliminar Registro`,`¿Eliminar a "${t}"?`,`confirm`,async()=>{await E.from(`teams`).delete().eq(`id`,e),r(`teams`)})}function _(e){let t=e.toLowerCase();document.querySelectorAll(`#teams-inner > div[data-team-name]`).forEach(e=>{let n=e.dataset.teamName||``;e.style.display=n.includes(t)?``:`none`})}function v(){let e=window._teamsData||[];if(!e.length)return;let t=[...e];t.sort((e,t)=>(e.hole||99)-(t.hole||99));let n=A&&A.length?A.join(` / `):`CLUB DE GOLF COLIMA`;new Date().toLocaleString(`es-MX`,{dateStyle:`short`,timeStyle:`short`});let r=window.location.origin,i=`${r}/golcolima.jpg`,a=`${r}/logoclub.png`,o={};t.forEach(e=>{let t=e.hole?e.hole:`Sin Hoyo`;o[t]||(o[t]=[]),o[t].push(e)});let s=Object.keys(o).sort((e,t)=>e===`Sin Hoyo`?1:t===`Sin Hoyo`?-1:parseInt(e)-parseInt(t)),c=``;s.forEach(e=>{let n=o[e],r=e===`Sin Hoyo`?`SIN HOYO`:`HOYO ${e}`;for(let e=0;e<n.length;e+=2){let i=n[e],a=n[e+1],o=[i.player1,i.player2,i.player3,i.player4].filter(Boolean).join(`, `),s=a?[a.player1,a.player2,a.player3,a.player4].filter(Boolean).join(`, `):``;c+=`
            <tr class="shotgun-row">
                <td class="box-td">
                    <div class="square-box">${i.ventaja||0}</div>
                </td>
                <td class="hdcp-td">${i.hdcp||0}</td>
                <td class="team-td left-align">
                    <div class="team-title">EQUIPO #${t.indexOf(i)+1}</div>
                    <div class="team-name">${i.teamname} (${i.hdcp||0})</div>
                    ${o&&o!==i.teamname?`<div class="player-sub">${o}</div>`:``}
                </td>
                <td class="hole-td">${r}</td>
                <td class="team-td right-align">
                    ${a?`
                        <div class="team-title">EQUIPO #${t.indexOf(a)+1}</div>
                        <div class="team-name">${a.teamname} (${a.hdcp||0})</div>
                        ${s&&s!==a.teamname?`<div class="player-sub">${s}</div>`:``}
                    `:`<div class="empty-slot">—</div>`}
                </td>
                <td class="hdcp-td">${a?a.hdcp||0:`—`}</td>
                <td class="box-td">
                    <div class="square-box">${a?a.ventaja||0:`—`}</div>
                </td>
            </tr>`}});let l=window.open(``,`_blank`);l.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>${n} — LAYOUT DE SALIDAS (SHOTGUN)</title>
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
            <img src="${i}" class="logo-img" alt="Logo Campo" onerror="this.style.display='none'" />
            <img src="${a}" class="logo-img" alt="Logo Asociación" onerror="this.style.display='none'" />
        </div>
        <div class="header-info">
            <h1 class="course-title">${n.toUpperCase()}</h1>
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
        <tbody>${c}</tbody>
    </table>
    </body></html>`),l.document.close(),setTimeout(()=>l.print(),600)}async function y(e,t){let[n,i]=await Promise.all([E.from(`teams`).select(`*`).eq(`eventid`,String(D)).order(`hole`),E.from(`scores`).select(`*`).eq(`eventid`,String(D)).order(`created_at`,{ascending:!1})]),a=n.data||[],o=i.data||[];window._scoresTeamsList=a,window._scoresList=o,window._selectedScoreTeam=a[0]||null,window._currentHoleScores={};let s=a.filter(e=>!o.some(t=>String(t.teamid)===String(e.id))),c=a.filter(e=>o.some(t=>String(t.teamid)===String(e.id))),l=(e,t)=>{let n=window._selectedScoreTeam?.id===e.id,r=[e.player1,e.player2,e.player3,e.player4].filter(Boolean),i=e.teamname||r[0]||`—`;return`
        <div onclick="selectTeamForScorecard('${e.id}')" id="player-card-${e.id}" data-player-search="${i.toLowerCase()}"
            class="p-3 rounded-xl border transition-all cursor-pointer ${n?`bg-primary/10 border-primary shadow-lg shadow-primary/10`:t?`bg-slate-800/40 border-slate-700/40 opacity-80 hover:opacity-100`:`bg-slate-800/90 border-slate-700/80 hover:border-slate-500`}">
            <div class="flex items-center justify-between gap-2">
                <div class="min-w-0 flex-1">
                    <p class="font-black text-white uppercase text-xs truncate">${i}</p>
                    ${r.length>1?`<p class="text-[10px] text-slate-500 font-bold truncate mt-0.5">${r[0]}</p>`:``}
                    ${e.category?`<span class="inline-block mt-1 px-2 py-0.5 bg-primary/15 text-primary border border-primary/30 rounded-full text-[9px] font-black uppercase">${e.category}</span>`:``}
                </div>
                ${t?`<span class="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[9px] font-black uppercase shrink-0 flex items-center gap-1"><span class="material-icons" style="font-size:11px">check_circle</span> Capturado</span>`:`<span class="px-2 py-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-lg text-[9px] font-black uppercase shrink-0 flex items-center gap-1"><span class="material-icons" style="font-size:11px">hourglass_empty</span> Pendiente</span>`}
            </div>
        </div>`};e.innerHTML=`
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
                    <span class="text-amber-400">⏳ Pendientes (${s.length})</span>
                    <span class="text-emerald-400">✓ Capturados (${c.length})</span>
                </div>

                <!-- Lista de Jugadores / Equipos Ordenada -->
                <div id="score-players-list" class="flex-1 overflow-y-auto space-y-2 pr-1">
                    ${a.length===0?`<div class="py-12 text-center text-slate-600 font-black uppercase tracking-widest text-xs">Sin registrados aún.</div>`:`
                            ${s.length>0?`
                                <div class="text-[9px] font-black uppercase text-amber-400 tracking-widest pt-1 pb-1 flex items-center gap-1.5">
                                    <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span> Faltan por Capturar (${s.length})
                                </div>
                                ${s.map(e=>l(e,!1)).join(``)}
                            `:``}

                            ${c.length>0?`
                                ${s.length>0?`
                                    <div class="relative py-3 flex items-center">
                                        <div class="flex-grow border-t border-slate-700/80"></div>
                                        <span class="flex-shrink mx-2 text-[9px] font-black uppercase text-slate-400 tracking-widest bg-slate-900 px-2.5 py-0.5 border border-slate-800 rounded-full flex items-center gap-1">
                                            <span class="material-icons text-emerald-400" style="font-size:12px">check_circle</span> CAPTURADOS (${c.length})
                                        </span>
                                        <div class="flex-grow border-t border-slate-700/80"></div>
                                    </div>
                                `:`
                                    <div class="text-[9px] font-black uppercase text-emerald-400 tracking-widest pt-1 pb-1 flex items-center gap-1.5">
                                        <span class="material-icons text-emerald-400" style="font-size:12px">check_circle</span> Capturados (${c.length})
                                    </div>
                                `}
                                ${c.map(e=>l(e,!0)).join(``)}
                            `:``}
                        `}
                </div>
            </div>

            <!-- ====== PANEL DERECHO: SCORECARD INTERACTIVO ====== -->
            <div class="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
                <div id="scorecard-wrapper" class="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
                    <!-- Poblado por selectTeamForScorecard -->
                </div>
            </div>
        </div>`,window.filterScorePlayers=e=>{let t=e.toLowerCase();document.querySelectorAll(`#score-players-list > div[data-player-search]`).forEach(e=>{let n=e.dataset.playerSearch||``;e.style.display=n.includes(t)?``:`none`})},window.selectTeamForScorecard=e=>{let t=window._scoresTeamsList||[],n=window._scoresList||[],r=t.find(t=>String(t.id)===String(e));if(!r)return;window._selectedScoreTeam=r,t.forEach(e=>{let t=document.getElementById(`player-card-${e.id}`);if(!t)return;let i=n.some(t=>String(t.teamid)===String(e.id));t.className=e.id===r.id?`p-3 rounded-xl border transition-all cursor-pointer bg-primary/10 border-primary shadow-lg shadow-primary/10`:`p-3 rounded-xl border transition-all cursor-pointer ${i?`bg-slate-800/40 border-slate-700/40 opacity-80 hover:opacity-100`:`bg-slate-800/90 border-slate-700/80 hover:border-slate-500`}`});let i=n.find(e=>String(e.teamid)===String(r.id)),a={};if(i&&i.hole_scores)try{a=typeof i.hole_scores==`string`?JSON.parse(i.hole_scores):i.hole_scores}catch{a={}}window._currentHoleScores=a,b(r,i)},window.handleHoleKeyDown=(e,t)=>{if([`Backspace`,`Delete`,`Tab`,`ArrowLeft`,`ArrowRight`,`ArrowUp`,`ArrowDown`,`Enter`].includes(e.key)){if(e.key===`Enter`){e.preventDefault();let n=document.getElementById(`score-h${t+1}`);n&&(n.focus(),n.select())}return}/^[0-9]$/.test(e.key)||(e.preventDefault(),P(`Solo Números`,`Solo se permiten dígitos numéricos (1-15) para los scores de cada hoyo.`,`error`))},window.onHoleInput=(e,t)=>{let n=typeof t==`object`?t.value:String(t);window._currentHoleScores||(window._currentHoleScores={});let r=parseInt(n);if(!isNaN(r)&&r>0&&r<=20?window._currentHoleScores[`h${e}`]=r:delete window._currentHoleScores[`h${e}`],S(),n.length===1&&n>=`2`&&n<=`9`){let t=document.getElementById(`score-h${e+1}`);t&&setTimeout(()=>{t.focus(),t.select()},40)}else if(n.length>=2){let t=document.getElementById(`score-h${e+1}`);t&&setTimeout(()=>{t.focus(),t.select()},40)}},window.saveScorecard=async()=>{let e=window._selectedScoreTeam;if(!e){P(`Selecciona un jugador`,`Debes seleccionar un jugador de la lista.`,`error`);return}let t=window._currentHoleScores||{},n=0;for(let e=1;e<=9;e++){let r=parseInt(t[`h${e}`]);!isNaN(r)&&r>0&&(n+=r)}let i=0;for(let e=10;e<=18;e++){let n=parseInt(t[`h${e}`]);!isNaN(n)&&n>0&&(i+=n)}let a=n+i,o=a>0?a-(e.ventaja||0):0;if(a===0){P(`Scorecard vacía`,`Ingresa al menos un score en algún hoyo.`,`error`);return}let s=(window._scoresList||[]).find(t=>String(t.teamid)===String(e.id)),c={eventid:String(D),teamid:e.id,total:a,gross:a,net:o,out_score:n,in_score:i,hole_scores:JSON.stringify(t)},l;if(s?{error:l}=await E.from(`scores`).update(c).eq(`id`,s.id):{error:l}=await E.from(`scores`).insert([c]),l){console.warn(`Fallback insert without hole_scores column:`,l.message);let t={eventid:String(D),teamid:e.id,total:a};s?{error:l}=await E.from(`scores`).update(t).eq(`id`,s.id):{error:l}=await E.from(`scores`).insert([t])}l?P(`Error`,l.message,`error`):(P(`¡Scorecard Guardado!`,`Scorecard de ${e.teamname} guardado correctamente (Gross: ${a}, Neto: ${o}).`,`success`),setTimeout(()=>r(`scores`),800))};let u=s.length>0?s[0]:a.length>0?a[0]:null;u&&selectTeamForScorecard(u.id)}function b(e,t){let n=document.getElementById(`scorecard-wrapper`);if(!n)return;let r=[e.player1,e.player2,e.player3,e.player4].filter(Boolean),i=e.teamname||r[0]||`—`,a=e.ventaja||0,o=e.hdcp||0,s=e.hole||`—`,c=A&&A.length?A[0]:`GOLF COLIMA`,l=I.slice(0,9),u=I.slice(9,18);n.innerHTML=`
        <!-- HEADER DEL SCORECARD -->
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-black text-sm shrink-0">
                    #${s}
                </div>
                <div>
                    <div class="flex items-center gap-2 flex-wrap">
                        <h2 class="text-base font-black text-white uppercase">${i}</h2>
                        <span class="px-3 py-1 bg-primary/15 text-primary border border-primary/30 rounded-full text-[10px] font-black uppercase">VENTAJA: ${a} GOLPES</span>
                    </div>
                    <p class="text-[11px] text-slate-400 font-bold mt-0.5">P1: ${r[0]||i} (HCP ${o})</p>
                </div>
            </div>

            <!-- TOTALES DERECHA -->
            <div class="flex items-center gap-2">
                <div class="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-center min-w-[80px]">
                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-wider">CAMPO</p>
                    <p class="text-xs font-black text-white uppercase truncate max-w-[80px]">${c}</p>
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
                    <p class="text-base font-black text-blue-400">−${a}</p>
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
                ${l.map(e=>x(e)).join(``)}
            </div>
        </div>

        <!-- VUELTA 10-18 (OUT) -->
        <div class="bg-slate-800/30 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div class="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
                <span>VUELTA 10-18 (OUT)</span>
                <span class="text-[10px] text-slate-500">PAR 34</span>
            </div>
            <div class="grid grid-cols-9 gap-1.5">
                ${u.map(e=>x(e)).join(``)}
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
        </div>`,S()}function x(e){let t=window._currentHoleScores?.[`h${e.hole}`]||``,n=t!==``&&!isNaN(t)&&parseInt(t)>0;return`
    <div id="hole-card-${e.hole}"
        class="flex flex-col items-center justify-between p-2 rounded-2xl border transition-all ${n?`bg-emerald-500/20 border-emerald-500/50 shadow-md shadow-emerald-500/10`:`bg-slate-800 border-slate-700/80`}">
        <div class="text-center">
            <p class="text-[10px] font-black text-slate-400">#${e.hole}</p>
            <p class="text-[8px] font-bold text-slate-500 uppercase">PAR ${e.par}</p>
        </div>
        <input id="score-h${e.hole}" type="text" inputmode="numeric" pattern="[0-9]*" value="${t}" autocomplete="off"
            onkeydown="handleHoleKeyDown(event, ${e.hole})"
            oninput="onHoleInput(${e.hole}, this)"
            onfocus="this.select()"
            class="w-full text-center py-2 my-1 bg-slate-900/80 border border-slate-700 rounded-xl text-white font-black text-base focus:outline-none focus:border-primary transition-all">
        <div class="text-[8px] font-black uppercase text-slate-500 tracking-wider">
            IDX ${e.idx}
        </div>
    </div>`}function S(){let e=window._selectedScoreTeam?.ventaja||0,t=window._currentHoleScores||{},n=0;for(let e=1;e<=9;e++){let r=parseInt(t[`h${e}`]);!isNaN(r)&&r>0&&(n+=r)}let r=0;for(let e=10;e<=18;e++){let n=parseInt(t[`h${e}`]);!isNaN(n)&&n>0&&(r+=n)}let i=n+r,a=i>0?i-e:0,o=document.getElementById(`sc-in`),s=document.getElementById(`sc-out`),c=document.getElementById(`sc-gross`),l=document.getElementById(`sc-net`);o&&(o.textContent=n||`0`),s&&(s.textContent=r||`0`),c&&(c.textContent=i||`0`),l&&(l.textContent=a||`0`);for(let e=1;e<=18;e++){let n=document.getElementById(`hole-card-${e}`),r=document.getElementById(`score-h${e}`),i=parseInt(t[`h${e}`]);n&&(!isNaN(i)&&i>0?(n.className=`flex flex-col items-center justify-between p-2 rounded-2xl border transition-all bg-emerald-500/20 border-emerald-500/50 shadow-md shadow-emerald-500/10`,r&&(r.className=`w-full text-center py-2 my-1 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-300 font-black text-base focus:outline-none focus:border-primary transition-all`)):(n.className=`flex flex-col items-center justify-between p-2 rounded-2xl border transition-all bg-slate-800 border-slate-700/80`,r&&(r.className=`w-full text-center py-2 my-1 bg-slate-900/80 border border-slate-700 rounded-xl text-white font-black text-base focus:outline-none focus:border-primary transition-all`)))}}async function C(e,t){let[n,i]=await Promise.all([E.from(`oyeses`).select(`*`).eq(`eventid`,String(D)).order(`created_at`,{ascending:!1}),E.from(`teams`).select(`*`).eq(`eventid`,String(D))]),a=n.data||[],o=i.data||[],s=new Set;o.forEach(e=>{e.teamname&&s.add(e.teamname),e.player1&&s.add(e.player1),e.player2&&s.add(e.player2),e.player3&&s.add(e.player3),e.player4&&s.add(e.player4)});let c=k||{},l=c.oyeses_holes||[2,7,9,11,17],u=c.judge_codes||{},d=!1;l.forEach(e=>{if(!u[e]){let t=Math.random().toString(36).substring(2,6).toUpperCase();u[e]=`H${e}-${t}`,d=!0}}),d&&(c.judge_codes=u,c.oyeses_holes=l,await E.from(`tournaments`).update({config:c}).eq(`id`,D),k=c);let f=t&&t.length>0?t[0]:`CLUB DE GOLF COLIMA`;e.innerHTML=`
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
                                    ${l.map(e=>`<option value="${e}">Hoyo #${e} — ${f}</option>`).join(``)}
                                </select>
                            </div>

                            <div>
                                <label class="block text-[9px] font-black text-slate-400 uppercase mb-1">Nombre del Jugador</label>
                                <input id="admin-oye-player" placeholder="Escribe el nombre..." list="admin-players-list"
                                    class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold uppercase placeholder:text-slate-600 focus:outline-none focus:border-primary transition-all">
                                <datalist id="admin-players-list">
                                    ${Array.from(s).map(e=>`<option value="${e}">`).join(``)}
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
                            <p class="text-[10px] font-bold text-slate-500 uppercase">${f}</p>
                        </div>
                        <span class="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs font-black text-white">${a.length} registros</span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${l.map(e=>{let t=L[e]||L[2],n=a.filter(t=>String(t.hole)===String(e)).sort((e,t)=>parseFloat(e.distance)-parseFloat(t.distance));return`
                            <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                                <!-- HEADER DEL HOYO -->
                                <div class="px-4 py-3 ${t.bg} flex items-center justify-between text-slate-950">
                                    <div class="flex items-center gap-2 font-black uppercase text-xs">
                                        <span class="material-icons" style="font-size:16px">flag</span>
                                        <span>HOYO #${e}</span>
                                    </div>
                                    <span class="px-2 py-0.5 bg-black/20 rounded-md text-[9px] font-black uppercase">${n.length} MARCAS</span>
                                </div>

                                <!-- CUERPO DE MARCAS -->
                                <div class="p-3 divide-y divide-slate-800/80 flex-1 min-h-[140px] space-y-2">
                                    ${n.length===0?`<div class="h-full flex items-center justify-center py-8 text-center text-slate-600 font-bold uppercase text-[10px]">Sin marcas registradas</div>`:n.map((n,r)=>`
                                            <div class="pt-2 first:pt-0 flex items-center justify-between gap-2">
                                                <div class="flex items-center gap-2.5 min-w-0 flex-1">
                                                    <span class="w-6 h-6 rounded-lg ${r===0?`bg-amber-500/20 text-amber-400 font-black`:`bg-slate-800 text-slate-400 font-bold`} text-[10px] flex items-center justify-center shrink-0">
                                                        #${r+1}
                                                    </span>
                                                    <span class="font-black text-white uppercase text-xs truncate">${n.player_name}</span>
                                                </div>
                                                <div class="flex items-center gap-2 shrink-0">
                                                    <span class="font-black ${t.text} text-xs font-mono mr-1">${n.distance}</span>
                                                    <button onclick="editOyeMark('${n.id}', '${n.player_name}', '${n.distance}', '${e}')" title="Editar marca"
                                                        class="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg flex items-center justify-center transition-all border border-slate-700">
                                                        <span class="material-icons" style="font-size:13px">edit</span>
                                                    </button>
                                                    <button onclick="deleteOyeMark('${n.id}')" title="Eliminar marca"
                                                        class="w-7 h-7 bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 rounded-lg flex items-center justify-center transition-all border border-rose-500/20">
                                                        <span class="material-icons" style="font-size:13px">delete</span>
                                                    </button>
                                                </div>
                                            </div>`).join(``)}
                                </div>
                            </div>`}).join(``)}
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
                    <input id="input-oyes-holes" value="${l.join(`, `)}" placeholder="Ej. 2, 5, 7, 11, 14, 16"
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
                    ${l.map(e=>`
                        <div class="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-center">
                            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">HOYO ${e}</p>
                            <p class="text-lg font-black text-white tracking-widest uppercase mt-0.5">${u[e]||`H${e}-CODE`}</p>
                        </div>`).join(``)}
                </div>

                <button onclick="closeOyesCodesModal()" class="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all">
                    Cerrar Códigos
                </button>
            </div>
        </div>`,window.openOyesConfigModal=()=>document.getElementById(`oyes-config-modal`)?.classList.remove(`hidden`),window.closeOyesConfigModal=()=>document.getElementById(`oyes-config-modal`)?.classList.add(`hidden`),window.openOyesCodesModal=()=>document.getElementById(`oyes-codes-modal`)?.classList.remove(`hidden`),window.closeOyesCodesModal=()=>document.getElementById(`oyes-codes-modal`)?.classList.add(`hidden`),window.saveOyesConfig=async()=>{let e=(document.getElementById(`input-oyes-holes`)?.value||``).split(`,`).map(e=>parseInt(e.trim())).filter(e=>!isNaN(e)&&e>=1&&e<=18);if(e.length===0){P(`Selección requerida`,`Ingresa los números de hoyo (1 al 18) separados por comas.`,`error`);return}e.sort((e,t)=>e-t);let t={...u};e.forEach(e=>{if(!t[e]){let n=Math.random().toString(36).substring(2,6).toUpperCase();t[e]=`H${e}-${n}`}});let n={...c,oyeses_holes:e,judge_codes:t},{error:i}=await E.from(`tournaments`).update({config:n}).eq(`id`,D);i?P(`Error`,i.message,`error`):(k=n,closeOyesConfigModal(),P(`Hoyos Actualizados`,`Configuración de hoyos Oye's guardada.`,`success`),setTimeout(()=>r(`oyeses`),800))},window.saveAdminOye=async()=>{let e=document.getElementById(`admin-oye-hole`)?.value,t=document.getElementById(`admin-oye-player`)?.value.trim().toUpperCase(),n=document.getElementById(`admin-oye-distance`)?.value.trim();if(!t||!n){P(`Datos incompletos`,`Ingresa el nombre del jugador y la distancia.`,`error`);return}let i=n.endsWith(`m`)?n:`${n}m`,{error:a}=await E.from(`oyeses`).insert([{eventid:String(D),coursename:f,hole:String(e),player_name:t,distance:i}]);a?P(`Error`,a.message,`error`):(P(`Oye Registrado`,`${t} en Hoyo ${e} (${i}).`,`success`),setTimeout(()=>r(`oyeses`),800))},window.deleteOyeMark=e=>{P(`Eliminar Registro`,`¿Eliminar este registro de Oye's?`,`confirm`,async()=>{await E.from(`oyeses`).delete().eq(`id`,e),r(`oyeses`)})},window.editOyeMark=(e,t,n,i)=>{let a=document.getElementById(`edit-oye-modal`);a&&a.remove();let o=document.createElement(`div`);o.id=`edit-oye-modal`,o.className=`fixed inset-0 z-50 flex items-center justify-center p-4 style="background:rgba(0,0,0,0.75)"`,o.innerHTML=`
            <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
                <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 class="font-black text-white uppercase tracking-widest text-sm">Editar Registro Oye's — Hoyo #${i}</h3>
                    <button onclick="document.getElementById('edit-oye-modal').remove()" class="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 transition-all">
                        <span class="material-icons" style="font-size:16px">close</span>
                    </button>
                </div>
                <div class="space-y-3">
                    <div>
                        <label class="block text-[9px] font-black text-slate-400 uppercase mb-1">Nombre del Jugador</label>
                        <input id="edit-oye-name" value="${t}" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold uppercase focus:outline-none focus:border-primary transition-all">
                    </div>
                    <div>
                        <label class="block text-[9px] font-black text-slate-400 uppercase mb-1">Distancia (MTS)</label>
                        <input id="edit-oye-dist" value="${n.replace(`m`,``)}" type="number" step="0.01" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-black text-center focus:outline-none focus:border-primary transition-all">
                    </div>
                </div>
                <div class="flex gap-3 pt-2">
                    <button onclick="document.getElementById('edit-oye-modal').remove()" class="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black uppercase text-xs transition-all">Cancelar</button>
                    <button onclick="saveEditedOyeMark('${e}')" class="flex-1 py-3 bg-emerald-500 text-slate-950 rounded-xl font-black uppercase text-xs hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">Guardar Cambios</button>
                </div>
            </div>`,document.body.appendChild(o),window.saveEditedOyeMark=async e=>{let t=document.getElementById(`edit-oye-name`)?.value.trim().toUpperCase(),n=document.getElementById(`edit-oye-dist`)?.value.trim();if(!t||!n){P(`Datos Incompletos`,`Ingresa el nombre y la distancia.`,`error`);return}let i=n.endsWith(`m`)?n:`${n}m`,{error:a}=await E.from(`oyeses`).update({player_name:t,distance:i}).eq(`id`,e);a?P(`Error`,a.message,`error`):(document.getElementById(`edit-oye-modal`)?.remove(),P(`Registro Actualizado`,`Marca modificada exitosamente.`,`success`),setTimeout(()=>r(`oyeses`),600))}}}async function w(e){let[t,n]=await Promise.all([E.from(`teams`).select(`*`).eq(`eventid`,String(D)),E.from(`scores`).select(`*`).eq(`eventid`,String(D)).order(`created_at`,{ascending:!1})]),r=t.data||[],i=n.data||[],a={};r.forEach(e=>{let t=e.category||`GENERAL`,n=i.filter(t=>String(t.teamid)===String(e.id));if(n.length===0)return;let r=n[0],o=r.gross||r.total||0,s=e.ventaja||0,c=r.net!==void 0&&r.net!==null&&r.net>0?r.net:o>0?o-s:0;a[t]||(a[t]=[]),a[t].push({team:e,gross:o,neto:c,rounds:1,ventaja:s})});let o=Object.keys(a).sort().map((e,t)=>{let n=a[e].sort((e,t)=>e.neto-t.neto),r=F[t%F.length],i=e.toUpperCase().startsWith(`CATEGORÍA`)||e.toUpperCase().startsWith(`CATEGORIA`)?e.toUpperCase():`CATEGORÍA ${e.toUpperCase()}`;return`
            <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <!-- TITULO CENTRADO CON PALETA DE COLOR -->
                <div class="relative flex items-center justify-between ${r.bg} border-b ${r.border} px-6 py-3.5 shadow-md overflow-hidden">
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full ${r.dot} shadow-sm"></span>
                        <span class="text-[10px] font-black uppercase ${r.text} tracking-wider hidden sm:inline">POSICIONES</span>
                    </div>

                    <h3 class="absolute left-1/2 -translate-x-1/2 font-black text-white text-sm sm:text-base uppercase tracking-widest text-center">
                        <span class="${r.text}">${i}</span>
                    </h3>

                    <span class="px-3 py-1 ${r.badge} border rounded-full text-[10px] font-black uppercase tracking-wider ml-auto sm:ml-0">
                        ${n.length} ${n.length===1?`Jugador`:`Jugadores`}
                    </span>
                </div>

                <div class="divide-y divide-slate-800">
                    ${n.map((e,t)=>`
                        <div class="flex items-center gap-4 px-6 py-4 ${t===0?`bg-primary/5`:``}">
                            <div class="w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0
                                ${t===0?`bg-primary text-slate-900`:t===1?`bg-slate-600 text-white`:t===2?`bg-orange-800/40 text-orange-300`:`bg-slate-800 text-slate-500`}">
                                ${t+1}
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="font-black text-white uppercase text-sm truncate">${e.team.teamname}</p>
                                <p class="text-slate-500 text-xs">${e.rounds} ronda${e.rounds===1?``:`s`} · Ventaja: −${e.ventaja}</p>
                            </div>
                            <div class="text-center w-16"><p class="text-[9px] text-slate-500 font-black">GROSS</p><p class="text-xl font-black text-slate-300">${e.gross}</p></div>
                            <div class="text-center w-16"><p class="text-[9px] text-blue-400 font-black">VTJ</p><p class="text-xl font-black text-blue-400">−${e.ventaja}</p></div>
                            <div class="text-center w-24 bg-primary/10 border border-primary/20 rounded-xl py-2">
                                <p class="text-[9px] text-primary font-black">NETO</p>
                                <p class="text-2xl font-black text-primary">${e.neto}</p>
                            </div>

                            <!-- BOTON OJO PARA VER TARJETA DE SCORECARD -->
                            <button onclick="openScorecardModalAdmin('${e.team.id}', '${e.team.teamname.replace(/'/g,`\\'`)}')"
                                title="Ver Tarjeta de Score Completa"
                                class="w-9 h-9 bg-slate-800 hover:bg-primary/20 hover:border-primary/40 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-all shrink-0">
                                <span class="material-icons" style="font-size:16px">visibility</span>
                            </button>
                        </div>`).join(``)}
                </div>
            </div>`}).join(``);e.innerHTML=`
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <h2 class="font-black text-white uppercase tracking-tight text-xl">Tabla de Posiciones</h2>
                <a href="/torneo/index.html?id=${D}" target="_blank"
                    class="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-xl text-xs font-black uppercase hover:bg-primary/20 transition-all">
                    <span class="material-icons" style="font-size:14px">open_in_new</span> Ver Live
                </a>
            </div>
            ${Object.keys(a).length===0?`<div class="py-20 text-center text-slate-600 font-black uppercase tracking-widest text-xs">Sin scores capturados todavía.</div>`:o}
        </div>`}async function T(e,t,n,r){let i=`${window.location.origin}/torneo/index.html?id=${D}`;e.innerHTML=`
        <div class="space-y-6">
            <h2 class="font-black text-white uppercase tracking-tight text-xl">Nerve Center</h2>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
                ${[{label:`Participantes`,val:t,icon:`groups`,color:`blue`},{label:`Scores`,val:n,icon:`score`,color:`green`},{label:`Oye's`,val:r,icon:`sports_golf`,color:`purple`}].map(e=>`
                    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-5">
                        <div class="w-14 h-14 rounded-2xl flex items-center justify-center
                            ${e.color===`blue`?`bg-blue-500/10 border border-blue-500/20`:e.color===`green`?`bg-primary/10 border border-primary/20`:`bg-purple-500/10 border border-purple-500/20`}">
                            <span class="material-icons ${e.color===`blue`?`text-blue-400`:e.color===`green`?`text-primary`:`text-purple-400`}">${e.icon}</span>
                        </div>
                        <div>
                            <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">${e.label}</p>
                            <p class="text-4xl font-black text-white">${e.val}</p>
                        </div>
                    </div>`).join(``)}
            </div>

            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-5">
                <div>
                    <h4 class="font-black text-white uppercase tracking-tight mb-1">URL del Visor en Vivo</h4>
                    <p class="text-slate-500 text-sm mb-4">Comparte esta URL con los participantes para que vean el leaderboard en tiempo real.</p>
                </div>
                <div class="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                    <span class="material-icons text-primary" style="font-size:16px">link</span>
                    <span class="text-sm font-bold text-slate-300 truncate flex-1">${i}</span>
                    <button onclick="navigator.clipboard.writeText('${i}').then(()=>window.showNotification('¡Copiado!','URL copiada al portapapeles.','success'))"
                        class="px-4 py-2 bg-primary/20 text-primary rounded-xl text-xs font-black uppercase hover:bg-primary/30 transition-colors whitespace-nowrap">
                        Copiar URL
                    </button>
                </div>
                <a href="${i}" target="_blank"
                    class="inline-flex items-center gap-2 px-6 py-3.5 bg-primary text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                    <span class="material-icons" style="font-size:16px">open_in_new</span> Abrir Visor en Vivo
                </a>
            </div>
        </div>`}var E,D,O,k,A,j,M,N,P,F,I,L;e((()=>{E=t(`https://tztolxgsaktqindoimtu.supabase.co`,`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dG9seGdzYWt0cWluZG9pbXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzQ4ODAsImV4cCI6MjEwMTg1MDg4MH0.E2GABiOMXYb5hEwE9ErIcJa6_LHkj9lJUglQVoiLl0M`).schema(`colimaGC`),D=null,O=``,k={teamSize:2,categories:[],modalidad:`A GO GO`},A=[`Campo Principal`],j=`teams`,M=null,N=null,P=null,F=[{bg:`bg-gradient-to-r from-emerald-950/90 via-emerald-900/40 to-slate-900`,border:`border-emerald-500/50`,text:`text-emerald-400`,badge:`bg-emerald-500/20 text-emerald-300 border-emerald-500/30`,dot:`bg-emerald-400`},{bg:`bg-gradient-to-r from-blue-950/90 via-blue-900/40 to-slate-900`,border:`border-blue-500/50`,text:`text-blue-400`,badge:`bg-blue-500/20 text-blue-300 border-blue-500/30`,dot:`bg-blue-400`},{bg:`bg-gradient-to-r from-purple-950/90 via-purple-900/40 to-slate-900`,border:`border-purple-500/50`,text:`text-purple-400`,badge:`bg-purple-500/20 text-purple-300 border-purple-500/30`,dot:`bg-purple-400`},{bg:`bg-gradient-to-r from-amber-950/90 via-amber-900/40 to-slate-900`,border:`border-amber-500/50`,text:`text-amber-400`,badge:`bg-amber-500/20 text-amber-300 border-amber-500/30`,dot:`bg-amber-400`},{bg:`bg-gradient-to-r from-rose-950/90 via-rose-900/40 to-slate-900`,border:`border-rose-500/50`,text:`text-rose-400`,badge:`bg-rose-500/20 text-rose-300 border-rose-500/30`,dot:`bg-rose-400`},{bg:`bg-gradient-to-r from-cyan-950/90 via-cyan-900/40 to-slate-900`,border:`border-cyan-500/50`,text:`text-cyan-400`,badge:`bg-cyan-500/20 text-cyan-300 border-cyan-500/30`,dot:`bg-cyan-400`}],window.addCategoryToConfig=async function(){let e=document.getElementById(`new-cat-name`),t=document.getElementById(`new-cat-pct`),n=e?.value.trim().toUpperCase(),r=parseInt(t?.value||`100`)||100;if(!n||window._currentCategories.some(e=>(typeof e==`object`?e.name:e)===n))return;window._currentCategories.push({name:n,pct:r}),e&&(e.value=``),t&&(t.value=`100`),m(),p();let i=await f();i&&P(`Error guardando`,i.message,`error`)},window.removeCatFromConfig=async function(e){window._currentCategories=window._currentCategories.filter(t=>(typeof t==`object`?t.name:t)!==e),m(),p(),await f()},window.openEditCategoryModal=function(e){let t=(window._currentCategories||[]).find(t=>(typeof t==`object`?t.name:t)===e);if(!t)return;let n=typeof t==`object`?t.name:t,r=typeof t==`object`&&t.pct||100,i=document.getElementById(`edit-cat-old-name`),a=document.getElementById(`edit-cat-new-name`),o=document.getElementById(`edit-cat-new-pct`);i&&(i.value=n),a&&(a.value=n),o&&(o.value=r);let s=document.getElementById(`edit-cat-modal`);s&&s.classList.remove(`hidden`)},window.closeEditCatModal=function(){let e=document.getElementById(`edit-cat-modal`);e&&e.classList.add(`hidden`)},window.saveEditCategory=async function(){let e=document.getElementById(`edit-cat-old-name`)?.value||``,t=document.getElementById(`edit-cat-new-name`)?.value.trim().toUpperCase(),n=parseInt(document.getElementById(`edit-cat-new-pct`)?.value||`100`)||100;if(!t){P(`Nombre Requerido`,`Ingresa un nombre para la categoría.`,`error`);return}let i=(window._currentCategories||[]).findIndex(t=>(typeof t==`object`?t.name:t)===e);if(i===-1)return;window._currentCategories[i]={name:t,pct:n},closeEditCatModal(),m(),p(),await f();let{data:a,error:o}=await E.from(`teams`).select(`*`).eq(`eventid`,String(D)).eq(`category`,e.toUpperCase());if(!o&&a&&a.length>0)for(let e of a){let r=e.hdcp||0,i=Math.round(r*n/100);await E.from(`teams`).update({category:t.toUpperCase(),ventaja:i}).eq(`id`,e.id)}P(`Categoría Actualizada`,`Categoría "${t}" (${n}%) guardada. ${a?a.length:0} registros actualizados.`,`success`),r(`teams`)},window.updateTeamSize=async function(e){window._currentTeamSize=e,[1,2,3,4].forEach(t=>{let n=document.getElementById(`ts-btn-${t}`);n&&(n.className=t===e?n.className.replace(`bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300`,`bg-slate-900 border-white text-white shadow-inner`):n.className.replace(`bg-slate-900 border-white text-white shadow-inner`,`bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300`))}),await f()},window.updateModalidad=async function(e){window._currentModalidad=e,await f()},I=[{hole:1,par:4,idx:3},{hole:2,par:3,idx:7},{hole:3,par:4,idx:15},{hole:4,par:4,idx:9},{hole:5,par:3,idx:17},{hole:6,par:5,idx:1},{hole:7,par:3,idx:5},{hole:8,par:4,idx:11},{hole:9,par:4,idx:13},{hole:10,par:4,idx:4},{hole:11,par:3,idx:10},{hole:12,par:4,idx:16},{hole:13,par:4,idx:14},{hole:14,par:3,idx:18},{hole:15,par:5,idx:2},{hole:16,par:3,idx:8},{hole:17,par:4,idx:6},{hole:18,par:4,idx:12}],L={1:{bg:`bg-emerald-500`,text:`text-emerald-400`,border:`border-emerald-500/40`,header:`#10b981`},2:{bg:`bg-emerald-500`,text:`text-emerald-400`,border:`border-emerald-500/40`,header:`#10b981`},3:{bg:`bg-cyan-500`,text:`text-cyan-400`,border:`border-cyan-500/40`,header:`#06b6d4`},4:{bg:`bg-blue-500`,text:`text-blue-400`,border:`border-blue-500/40`,header:`#3b82f6`},5:{bg:`bg-indigo-500`,text:`text-indigo-400`,border:`border-indigo-500/40`,header:`#6366f1`},6:{bg:`bg-purple-500`,text:`text-purple-400`,border:`border-purple-500/40`,header:`#a855f7`},7:{bg:`bg-amber-500`,text:`text-amber-400`,border:`border-amber-500/40`,header:`#f59e0b`},8:{bg:`bg-orange-500`,text:`text-orange-400`,border:`border-orange-500/40`,header:`#f97316`},9:{bg:`bg-cyan-500`,text:`text-cyan-400`,border:`border-cyan-500/40`,header:`#06b6d4`},10:{bg:`bg-rose-500`,text:`text-rose-400`,border:`border-rose-500/40`,header:`#f43f5e`},11:{bg:`bg-indigo-500`,text:`text-indigo-400`,border:`border-indigo-500/40`,header:`#6366f1`},12:{bg:`bg-teal-500`,text:`text-teal-400`,border:`border-teal-500/40`,header:`#14b8a6`},13:{bg:`bg-yellow-500`,text:`text-yellow-400`,border:`border-yellow-500/40`,header:`#eab308`},14:{bg:`bg-lime-500`,text:`text-lime-400`,border:`border-lime-500/40`,header:`#84cc16`},15:{bg:`bg-sky-500`,text:`text-sky-400`,border:`border-sky-500/40`,header:`#0ea5e9`},16:{bg:`bg-violet-500`,text:`text-violet-400`,border:`border-violet-500/40`,header:`#8b5cf6`},17:{bg:`bg-pink-500`,text:`text-pink-400`,border:`border-pink-500/40`,header:`#ec4899`},18:{bg:`bg-emerald-500`,text:`text-emerald-400`,border:`border-emerald-500/40`,header:`#10b981`}},window.openScorecardModalAdmin=async function(e,t){let n=document.getElementById(`admin-scorecard-modal`);n||(n=document.createElement(`div`),n.id=`admin-scorecard-modal`,n.className=`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in`,document.body.appendChild(n)),n.classList.remove(`hidden`),n.innerHTML=`<div class="p-8 bg-slate-900 border border-slate-700 rounded-3xl text-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div><p class="text-xs text-slate-400 font-bold uppercase mt-3">Cargando Tarjeta...</p></div>`;let[{data:r,error:i},{data:a}]=await Promise.all([E.from(`scores`).select(`*`).eq(`teamid`,e).eq(`eventid`,String(D)),E.from(`teams`).select(`ventaja, hdcp`).eq(`id`,e).maybeSingle()]),o=a?.ventaja||0;if(i||!r||r.length===0){n.innerHTML=`
            <div class="bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center max-w-sm w-full space-y-4">
                <span class="material-icons text-amber-400 text-4xl">info</span>
                <h3 class="font-black text-white uppercase text-sm">Sin Scorecard</h3>
                <p class="text-slate-400 text-xs font-bold">No hay scores registrados para ${t}.</p>
                <button onclick="document.getElementById('admin-scorecard-modal').classList.add('hidden')" class="px-6 py-2.5 bg-primary text-slate-900 rounded-xl font-black text-xs uppercase">Cerrar</button>
            </div>`;return}let s=r.map(e=>{let t={};if(e.hole_scores)try{t=typeof e.hole_scores==`string`?JSON.parse(e.hole_scores):e.hole_scores}catch{t={}}let n=e.out_score!==void 0&&e.out_score!==null?e.out_score:0,r=e.in_score!==void 0&&e.in_score!==null?e.in_score:0,i=e.gross||e.total||0,a=e.net!==void 0&&e.net!==null?e.net:i>0?i-o:0,s=[];for(let e=1;e<=18;e++)s.push(t[`h${e}`]===void 0?`-`:t[`h${e}`]);return`
            <div class="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden mb-4">
                <div class="bg-primary/20 border-b border-primary/30 px-5 py-3 flex justify-between items-center">
                    <span class="font-black uppercase text-xs text-white tracking-widest">${e.coursename||`CLUB DE GOLF COLIMA`}</span>
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] font-black uppercase bg-slate-800 px-3 py-1 rounded-full text-slate-300">GROSS: ${i}</span>
                        <span class="text-[10px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full">VTJ: −${o}</span>
                        <span class="text-xs font-black uppercase bg-primary text-slate-900 px-3 py-1 rounded-full">NETO: ${a}</span>
                    </div>
                </div>
                <div class="p-5 space-y-4">
                    <div>
                        <p class="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5">VUELTA 1-9 (IN)</p>
                        <div class="grid grid-cols-9 gap-1.5">
                            ${s.slice(0,9).map((e,t)=>`
                                <div class="flex flex-col items-center">
                                    <span class="text-[8px] text-slate-500 font-bold mb-1">#${t+1}</span>
                                    <div class="w-full py-2 bg-slate-800 border border-slate-700 rounded-xl text-center font-black text-xs text-white">${e}</div>
                                </div>
                            `).join(``)}
                        </div>
                    </div>

                    <div>
                        <p class="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5">VUELTA 10-18 (OUT)</p>
                        <div class="grid grid-cols-9 gap-1.5">
                            ${s.slice(9,18).map((e,t)=>`
                                <div class="flex flex-col items-center">
                                    <span class="text-[8px] text-slate-500 font-bold mb-1">#${t+10}</span>
                                    <div class="w-full py-2 bg-slate-800 border border-slate-700 rounded-xl text-center font-black text-xs text-white">${e}</div>
                                </div>
                            `).join(``)}
                        </div>
                    </div>

                    <div class="flex justify-between items-center pt-3 border-t border-slate-800">
                        <div class="flex gap-3">
                            <div class="text-center px-3 py-1 bg-slate-800 rounded-lg">
                                <p class="text-[8px] text-slate-400 font-black">IN (1-9)</p>
                                <p class="font-black text-white text-xs">${n}</p>
                            </div>
                            <div class="text-center px-3 py-1 bg-slate-800 rounded-lg">
                                <p class="text-[8px] text-slate-400 font-black">OUT (10-18)</p>
                                <p class="font-black text-white text-xs">${r}</p>
                            </div>
                            <div class="text-center px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <p class="text-[8px] text-blue-400 font-black">VENTAJA</p>
                                <p class="font-black text-blue-400 text-xs">−${o}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-[8px] text-slate-400 font-black uppercase">TOTAL NETO</p>
                            <p class="text-xl font-black text-primary">${a}</p>
                        </div>
                    </div>
                </div>
            </div>`}).join(``);n.innerHTML=`
        <div class="w-full max-w-2xl bg-slate-950/95 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div class="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                        <span class="material-icons" style="font-size:20px">sports_golf</span>
                    </div>
                    <div>
                        <h3 class="font-black uppercase text-white text-base truncate">${t}</h3>
                        <p class="text-[10px] text-primary font-black uppercase tracking-widest">Tarjeta Oficial de Scorecard</p>
                    </div>
                </div>
                <button onclick="document.getElementById('admin-scorecard-modal').classList.add('hidden')" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                    <span class="material-icons" style="font-size:18px">close</span>
                </button>
            </div>
            <div class="p-6 overflow-y-auto space-y-4 flex-1">${s}</div>
        </div>`}}))();export{n as renderTournamentSection};