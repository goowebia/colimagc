import{t as e}from"./main-CTM-C1Mc.js";import{createClient as t}from"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";async function n(e){e.innerHTML=`
        <div class="space-y-6">
            <!-- Header Banner -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                        <span class="material-icons" style="font-size:30px">golf_course</span>
                    </div>
                    <div>
                        <h2 class="text-2xl font-black text-white uppercase tracking-tight">Portal Caddie Master</h2>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Verificación Express, Registro de Salidas & Scorecards 18 Hoyos</p>
                    </div>
                </div>
                <div class="text-right px-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-2xl shrink-0">
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha de Hoy</p>
                    <p class="text-xs font-black text-emerald-400 uppercase mt-0.5">${new Date().toLocaleDateString(`es-MX`,{weekday:`long`,day:`numeric`,month:`long`,year:`numeric`})}</p>
                </div>
            </div>

            <!-- Sub Navigation Tabs -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
                <div class="flex items-center gap-2">
                    <button id="tab-caddie-verify" class="px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-primary text-slate-950 shadow-lg shadow-primary/20">
                        <span class="material-icons" style="font-size:18px">how_to_reg</span> Verificación & Salidas
                    </button>
                    <button id="tab-caddie-log" class="px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-slate-900 text-slate-400 border border-slate-800 hover:text-white">
                        <span class="material-icons" style="font-size:18px">history</span> Bitácora de Salidas de Hoy
                        <span id="tab-caddie-badge" class="px-2 py-0.5 bg-slate-800 text-emerald-400 rounded-lg text-[10px] font-black border border-slate-700">0</span>
                    </button>
                </div>
                <button onclick="window.renderHandicapHub()" class="px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30">
                    <span class="material-icons" style="font-size:18px">analytics</span> Consultar Handicaps WHS (SpeiHandicap)
                </button>
            </div>

            <!-- Tab Content 1: Verificación & Registro de Salida -->
            <div id="caddie-tab-verification" class="space-y-6">
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <!-- Search Column -->
                    <div class="lg:col-span-5 space-y-4">
                        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                            <h3 class="font-black text-white uppercase text-xs tracking-wider flex items-center gap-2">
                                <span class="material-icons text-primary text-base">person_search</span> Buscar Socio al Llegar
                            </h3>
                            <div class="relative">
                                <span class="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                                <input id="caddie-search-input" type="text" placeholder="Escribe Nombre o # Socio..." autocomplete="off"
                                    class="w-full pl-12 pr-4 py-4 bg-slate-800 border-2 border-slate-700 rounded-2xl text-sm font-black text-white placeholder:text-slate-500 focus:outline-none focus:border-primary transition-all">
                            </div>

                            <div id="caddie-search-results" class="space-y-2 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
                                <p class="text-xs text-slate-500 font-bold uppercase text-center py-4">Ingresa el nombre o número para verificar</p>
                            </div>
                        </div>
                    </div>

                    <!-- Express Verification Card Column -->
                    <div class="lg:col-span-7">
                        <div id="caddie-verification-card" class="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl text-center min-h-[420px] flex flex-col items-center justify-center">
                            <div class="w-20 h-20 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-600 mb-4">
                                <span class="material-icons text-4xl">how_to_reg</span>
                            </div>
                            <h3 class="font-black text-white text-lg uppercase">Esperando Selección</h3>
                            <p class="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 max-w-sm">Busca y selecciona un socio a la izquierda para verificar su semáforo de cuota y autorizar su salida al campo.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab Content 2: Bitácora de Salidas Diarias -->
            <div id="caddie-tab-log" class="hidden space-y-4">
                <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 class="font-black text-white uppercase text-base tracking-tight flex items-center gap-2">
                                <span class="material-icons text-emerald-400">history</span> Bitácora de Salidas de Hoy
                            </h3>
                            <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Captura de Scorecards 18 Hoyos y registro de jugadores en campo</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="relative w-64">
                                <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                                <input id="log-search-input" type="text" placeholder="Filtrar bitácora de hoy..." class="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-primary">
                            </div>
                            <div class="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-black uppercase shrink-0">
                                Total Salidas: <span id="caddie-outputs-count">0</span>
                            </div>
                        </div>
                    </div>

                    <div id="caddie-outputs-table-container">
                        <div class="py-8 text-center">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;let t=document.getElementById(`tab-caddie-verify`),n=document.getElementById(`tab-caddie-log`),a=document.getElementById(`caddie-tab-verification`),s=document.getElementById(`caddie-tab-log`);t.onclick=()=>{t.className=`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-primary text-slate-950 shadow-lg shadow-primary/20`,n.className=`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-slate-900 text-slate-400 border border-slate-800 hover:text-white`,a.classList.remove(`hidden`),s.classList.add(`hidden`)},n.onclick=()=>{n.className=`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-primary text-slate-950 shadow-lg shadow-primary/20`,t.className=`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-slate-900 text-slate-400 border border-slate-800 hover:text-white`,s.classList.remove(`hidden`),a.classList.add(`hidden`)},document.getElementById(`caddie-search-input`).oninput=e=>{i(e.target.value.toLowerCase().trim())},document.getElementById(`log-search-input`).oninput=()=>{o()},await r()}async function r(){try{let e=new Date().toISOString().split(`T`)[0],[{data:t},{data:n}]=await Promise.all([u.from(`members`).select(`*`).order(`member_number`,{ascending:!0}),d.from(`daily_outputs`).select(`*`).order(`created_at`,{ascending:!1})]);f=t||[],p=(n||[]).filter(t=>t.created_at&&t.created_at.startsWith(e)),i(``),o()}catch(e){console.error(`Error loading caddie master data:`,e),f=[],p=[],o()}}function i(e){let t=document.getElementById(`caddie-search-results`);if(!t)return;let n=new Date().toISOString().split(`T`)[0],r=f.filter(t=>!e||`${t.name} ${t.member_number} ${t.category}`.toLowerCase().includes(e));if(r.length===0){t.innerHTML=`<p class="text-xs text-slate-500 font-bold uppercase text-center py-6">No se encontraron socios con ese término.</p>`;return}t.innerHTML=r.map(e=>{let t=e.paid_until&&e.paid_until>=n&&e.status===`ACTIVE`,r=m&&String(m.id)===String(e.id);return`
            <div onclick="window.selectCaddieMember('${e.id}')"
                class="p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3
                ${r?`bg-primary/20 border-primary shadow-lg`:`bg-slate-800/80 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600`}">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-black text-white text-xs shrink-0">
                        ${e.member_number.replace(`SOC-`,``)}
                    </div>
                    <div class="min-w-0">
                        <p class="font-black text-white text-xs uppercase truncate">${e.name}</p>
                        <p class="text-[10px] text-slate-400 font-bold uppercase">${e.category||`TITULAR`}</p>
                    </div>
                </div>
                <span class="w-3 h-3 rounded-full shrink-0 ${t?`bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]`:`bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]`}"></span>
            </div>`}).join(``)}function a(){let e=document.getElementById(`caddie-verification-card`);if(!e||!m)return;let t=new Date().toISOString().split(`T`)[0],n=m.paid_until&&m.paid_until>=t&&m.status===`ACTIVE`,i=m.paid_until?new Date(m.paid_until+`T00:00:00`).toLocaleDateString(`es-MX`,{day:`2-digit`,month:`long`,year:`numeric`}):`Sin Fecha`;n?(e.className=`bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-8 shadow-2xl space-y-6 animate-fade-in text-left`,e.innerHTML=`
            <div class="flex items-center justify-between gap-4 bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-2xl">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
                        <span class="material-icons" style="font-size:32px">check_circle</span>
                    </div>
                    <div>
                        <span class="px-3 py-1 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase rounded-full tracking-wider">🟢 AUTORIZADO</span>
                        <h3 class="font-black text-white text-xl uppercase mt-1">SOCIO AL CORRIENTE</h3>
                    </div>
                </div>
            </div>

            <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3">
                <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-400 font-bold"># Socio / Expediente:</span>
                    <span class="font-black text-white text-sm bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">#${m.member_number}</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-400 font-bold">Nombre del Socio:</span>
                    <span class="font-black text-white uppercase text-base">${m.name}</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-400 font-bold">Categoría:</span>
                    <span class="font-black text-slate-300 uppercase">${m.category||`TITULAR`}</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-400 font-bold">Cuota Vigente Hasta:</span>
                    <span class="font-black text-emerald-400 uppercase">${i}</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-400 font-bold">Handicap Index:</span>
                    <span class="font-black text-amber-400 text-base">${m.current_handicap===void 0?`0.0`:m.current_handicap}</span>
                </div>
            </div>

            <form id="form-register-output" class="space-y-4 pt-2 border-t border-slate-800">
                <h4 class="font-black uppercase text-xs text-white tracking-wider">Registrar Salida al Campo Hoy</h4>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Hoyo de Salida</label>
                        <select id="out-hole" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                            <option value="1" selected>HOYO 1 (Tee Inicial)</option>
                            <option value="10">HOYO 10 (Vuelta 2)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Invitados / Acompañantes</label>
                        <input id="out-guests" type="number" min="0" max="4" value="0" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                    </div>
                </div>

                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Notas (Carro #, Caddie, etc.)</label>
                    <input id="out-notes" type="text" placeholder="Ej. Carro #12, Caddie Pedro" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-primary">
                </div>

                <button type="submit"
                    class="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/20">
                    <span class="material-icons">play_circle_filled</span> Registrar Salida al Campo
                </button>
            </form>
        `,document.getElementById(`form-register-output`).onsubmit=async e=>{e.preventDefault();let t=parseInt(document.getElementById(`out-hole`).value)||1,n=parseInt(document.getElementById(`out-guests`).value)||0,i=document.getElementById(`out-notes`).value.trim(),a={member_id:m.id,member_number:m.member_number,member_name:m.name,starting_hole:t,guests_count:n,notes:i,score_status:`PENDING`},{error:o}=await d.from(`daily_outputs`).insert([a]);if(o){window.showNotification(`Error`,`No se pudo registrar la salida: `+o.message,`error`);return}window.showNotification(`¡Salida Registrada!`,`Salida registrada para ${m.name} por el Hoyo #${t}.`,`success`),await r()}):(e.className=`bg-slate-900 border-2 border-rose-500/60 rounded-3xl p-8 shadow-2xl space-y-6 animate-fade-in text-left`,e.innerHTML=`
            <div class="flex items-center justify-between gap-4 bg-rose-500/10 border border-rose-500/30 p-5 rounded-2xl">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/30">
                        <span class="material-icons" style="font-size:32px">warning</span>
                    </div>
                    <div>
                        <span class="px-3 py-1 bg-rose-500 text-white font-black text-[10px] uppercase rounded-full tracking-wider">🔴 NO AUTORIZADO</span>
                        <h3 class="font-black text-white text-xl uppercase mt-1">PAGO PENDIENTE / INACTIVO</h3>
                    </div>
                </div>
            </div>

            <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3">
                <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-400 font-bold"># Socio / Expediente:</span>
                    <span class="font-black text-white text-sm bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">#${m.member_number}</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-400 font-bold">Nombre del Socio:</span>
                    <span class="font-black text-white uppercase text-base">${m.name}</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-400 font-bold">Cuota Vencida Desde:</span>
                    <span class="font-black text-rose-400 uppercase text-sm">${i}</span>
                </div>
            </div>

            <div class="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 font-bold leading-relaxed">
                ⚠️ Este socio cuenta con adeudo o suspensión de membresía. Por favor solícitale acudir a Recepción / Caja para regularizar su cuota antes de salir a jugar.
            </div>

            <button onclick="window.payMemberModal('${m.id}')"
                class="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-amber-500/20">
                <span class="material-icons">payments</span> Registrar Pago de Emergencia en Caja
            </button>
        `)}function o(){let e=document.getElementById(`caddie-outputs-table-container`),t=document.getElementById(`caddie-outputs-count`),n=document.getElementById(`tab-caddie-badge`),r=document.getElementById(`log-search-input`),i=r?r.value.toLowerCase().trim():``;if(!e)return;t&&(t.textContent=p.length),n&&(n.textContent=p.length);let a=p.filter(e=>!i||`${e.member_name} ${e.member_number} ${e.notes||``}`.toLowerCase().includes(i));if(a.length===0){e.innerHTML=`
            <div class="py-12 text-center bg-slate-950/40 border border-slate-800 rounded-2xl">
                <span class="material-icons text-slate-600 text-4xl mb-2">sports_golf</span>
                <p class="text-xs text-slate-500 font-bold uppercase tracking-wider">Aún no hay salidas registradas con ese término el día de hoy.</p>
            </div>`;return}e.innerHTML=`
        <div class="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table class="w-full text-left border-collapse text-xs">
                <thead>
                    <tr class="bg-slate-900 border-b border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        <th class="px-5 py-3.5">Hora de Salida</th>
                        <th class="px-5 py-3.5"># Socio</th>
                        <th class="px-5 py-3.5">Jugador</th>
                        <th class="px-5 py-3.5 text-center">Hoyo Salida</th>
                        <th class="px-5 py-3.5 text-center">Score / Estatus</th>
                        <th class="px-5 py-3.5 text-right">Acciones de Scorecard</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                    ${a.map(e=>{let t=new Date(e.created_at).toLocaleTimeString(`es-MX`,{hour:`2-digit`,minute:`2-digit`}),n=e.score_status||`PENDING`,r=e.gross_score!==null&&e.gross_score!==void 0?e.gross_score:null,i=``;return i=n===`CAPTURED`?`<span class="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-black text-xs">🟢 Gross: ${r}</span>`:n===`NO_CARD`?`<span class="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full font-black text-xs">🟡 No Entregó (Par 78)</span>`:`<span class="px-3 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full font-black text-[10px]">⏳ Pendiente</span>`,`
                            <tr class="hover:bg-slate-800/40 transition-colors">
                                <td class="px-5 py-3.5 font-black text-emerald-400 text-sm">${t}</td>
                                <td class="px-5 py-3.5"><span class="font-black text-slate-300 bg-slate-800 px-2.5 py-1 rounded-md text-[11px]">#${e.member_number}</span></td>
                                <td class="px-5 py-3.5 font-black text-white uppercase text-sm">${e.member_name}</td>
                                <td class="px-5 py-3.5 text-center font-black text-blue-400">Hoyo #${e.starting_hole||1}</td>
                                <td class="px-5 py-3.5 text-center font-bold">${i}</td>
                                <td class="px-5 py-3.5 text-right">
                                    <div class="flex items-center justify-end gap-2">
                                        <button onclick="window.openScoreCaptureModal('${e.id}')"
                                            class="px-3.5 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary rounded-xl font-black text-xs uppercase flex items-center gap-1.5 transition-all shadow-md">
                                            <span class="material-icons" style="font-size:16px">edit_note</span> ${n===`PENDING`?`Capturar Scorecard`:`Editar Scorecard`}
                                        </button>
                                        <button onclick="window.setNoScorePar('${e.id}')"
                                            title="Marcar No Entregó Tarjeta (Asigna Par de Campo 78)"
                                            class="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 transition-all shadow-md">
                                            <span class="material-icons" style="font-size:16px">block</span> No Entregó (Par 78)
                                        </button>
                                    </div>
                                </td>
                            </tr>`}).join(``)}
                </tbody>
            </table>
        </div>`}function s(e){let t=window._caddieHoleScores?.[`h${e.hole}`]??``,n=t!==``&&!isNaN(t)&&parseInt(t)>0;return`
    <div id="caddie-hole-card-${e.hole}"
        class="flex flex-col items-center justify-between p-2 rounded-2xl border transition-all ${n?`bg-emerald-500/20 border-emerald-500/50 shadow-md`:`bg-slate-800 border-slate-700`}">
        <div class="text-center">
            <p class="text-[10px] font-black text-slate-300">#${e.hole}</p>
            <p class="text-[8px] font-bold text-slate-500 uppercase">PAR ${e.par}</p>
        </div>
        <input id="caddie-score-h${e.hole}" type="text" inputmode="numeric" pattern="[0-9]*" value="${t}" placeholder="" autocomplete="off"
            oninput="window.onCaddieHoleInput(${e.hole}, this)"
            onfocus="this.select()"
            class="w-full text-center py-2 my-1 bg-slate-900 border border-slate-700 rounded-xl text-white font-black text-base focus:outline-none focus:border-primary transition-all">
        <div class="text-[8px] font-black uppercase text-amber-400 tracking-wider">
            IDX ${e.idx}
        </div>
    </div>`}async function c(e){try{let{data:t}=await d.from(`member_scores`).select(`*`).eq(`member_id`,e).order(`date_played`,{ascending:!1}).limit(20);if(!t||t.length===0)return;let n=t.map(e=>parseFloat(e.differential)||0).sort((e,t)=>e-t),r=n.length,i=1;i=r>=20?8:r>=19?7:r>=17?6:r>=15?5:r>=12?4:r>=9?3:r>=6?2:1;let a=n.slice(0,i).reduce((e,t)=>e+t,0)/i,o=parseFloat(a.toFixed(1));await u.from(`members`).update({current_handicap:o}).eq(`id`,e)}catch(e){console.error(`Error recalculating handicap:`,e)}}var l,u,d,f,p,m,h,g,_,v;e((()=>{l=t(`https://tztolxgsaktqindoimtu.supabase.co`,`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dG9seGdzYWt0cWluZG9pbXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzQ4ODAsImV4cCI6MjEwMTg1MDg4MH0.E2GABiOMXYb5hEwE9ErIcJa6_LHkj9lJUglQVoiLl0M`),u=l.schema(`members`),d=l.schema(`starter`),f=[],p=[],m=null,h=[{hole:1,par:4,idx:3},{hole:2,par:3,idx:7},{hole:3,par:4,idx:15},{hole:4,par:4,idx:9},{hole:5,par:3,idx:17},{hole:6,par:5,idx:1},{hole:7,par:3,idx:5},{hole:8,par:4,idx:11},{hole:9,par:4,idx:13},{hole:10,par:4,idx:4},{hole:11,par:3,idx:10},{hole:12,par:4,idx:16},{hole:13,par:4,idx:14},{hole:14,par:3,idx:18},{hole:15,par:5,idx:2},{hole:16,par:3,idx:8},{hole:17,par:4,idx:6},{hole:18,par:4,idx:12}],g=78,_=70,v=113,window.selectCaddieMember=function(e){m=f.find(t=>String(t.id)===String(e)),i(document.getElementById(`caddie-search-input`)?.value.toLowerCase().trim()||``),a()},window.setNoScorePar=async function(e){let t=p.find(t=>String(t.id)===String(e));t&&window.showNotification(`No Entregó Tarjeta`,`¿Confirmas marcar que el socio ${t.member_name} no entregó tarjeta? Se le asignará automáticamente Par de Campo (${g}).`,`confirm`,async()=>{await d.from(`daily_outputs`).update({score_status:`NO_CARD`,gross_score:g}).eq(`id`,t.id);let e={};h.forEach(t=>{e[`h${t.hole}`]=t.par});let n=parseFloat((113/v*8).toFixed(1));await d.from(`member_scores`).insert([{member_id:t.member_id,output_id:t.id,date_played:new Date().toISOString().split(`T`)[0],gross_score:g,course_rating:_,slope_rating:v,differential:n,hole_scores:e,delivered:!1,notes:`No entregó tarjeta (Par de Campo 78)`}]),await c(t.member_id),window.showNotification(`Score Registrado`,`Se asignó Par de Campo (${g}) a ${t.member_name} y se recalculó su Handicap Index.`,`success`),await r()})},window.openScoreCaptureModal=function(e){let t=p.find(t=>String(t.id)===String(e));if(!t)return;let n=f.find(e=>String(e.id)===String(t.member_id)),r=n&&n.current_handicap||0,i=document.getElementById(`modal-member-crud`);i||(i=document.createElement(`div`),i.id=`modal-member-crud`,i.className=`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in`,document.body.appendChild(i)),window._caddieHoleScores={},h.forEach(e=>{window._caddieHoleScores[`h${e.hole}`]=``});let a=h.slice(0,9),o=h.slice(9,18);i.innerHTML=`
        <div class="w-full max-w-4xl bg-slate-950/95 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <!-- Header -->
            <div class="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                <div class="flex items-center gap-3">
                    <div class="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                        <span class="material-icons">edit_note</span>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h3 class="font-black uppercase text-white text-lg leading-none">${t.member_name}</h3>
                            <span class="px-2.5 py-0.5 bg-slate-800 text-slate-300 font-black text-[10px] rounded-md border border-slate-700">#${t.member_number}</span>
                        </div>
                        <p class="text-xs text-slate-400 font-bold uppercase mt-1">Handicap Index: <span class="text-amber-400 font-black">${r}</span> · Campo: Club de Golf Colima</p>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <!-- Totals Bar -->
                    <div class="flex items-center gap-2 bg-slate-900 p-1.5 border border-slate-800 rounded-2xl">
                        <div class="px-3 py-1.5 bg-slate-800 rounded-xl text-center">
                            <p class="text-[8px] font-black text-slate-400 uppercase tracking-wider">IN (1-9)</p>
                            <p id="caddie-sc-in" class="text-sm font-black text-white">34</p>
                        </div>
                        <div class="px-3 py-1.5 bg-slate-800 rounded-xl text-center">
                            <p class="text-[8px] font-black text-slate-400 uppercase tracking-wider">OUT (10-18)</p>
                            <p id="caddie-sc-out" class="text-sm font-black text-white">34</p>
                        </div>
                        <div class="px-4 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-center">
                            <p class="text-[8px] font-black text-emerald-400 uppercase tracking-wider">GROSS TOTAL</p>
                            <p id="caddie-sc-gross" class="text-xl font-black text-emerald-400 leading-none">68</p>
                        </div>
                    </div>

                    <button onclick="document.getElementById('modal-member-crud').classList.add('hidden')" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                        <span class="material-icons" style="font-size:18px">close</span>
                    </button>
                </div>
            </div>

            <!-- Body Scorecard -->
            <div class="p-6 overflow-y-auto custom-scrollbar space-y-5 flex-1">
                <!-- Action Bar Inside Modal -->
                <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3 px-4">
                    <span class="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <span class="material-icons text-primary text-sm">tune</span> Presets Rápidos
                    </span>
                    <div class="flex items-center gap-2">
                        <button type="button" onclick="window.caddieFillPar()" class="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-400 rounded-xl font-black text-[10px] uppercase transition-all">
                            ⚡ Auto-llenar Par (68)
                        </button>
                        <button type="button" onclick="window.caddieFillPar78()" class="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400 rounded-xl font-black text-[10px] uppercase transition-all">
                            ⚡ Auto-llenar Par (78)
                        </button>
                    </div>
                </div>

                <!-- VUELTA 1-9 (IN) -->
                <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div class="flex items-center justify-between text-xs font-black text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-2">
                        <span>VUELTA 1-9 (IN)</span>
                        <span class="text-[10px] text-slate-500">PAR 34</span>
                    </div>
                    <div class="grid grid-cols-9 gap-2">
                        ${a.map(e=>s(e)).join(``)}
                    </div>
                </div>

                <!-- VUELTA 10-18 (OUT) -->
                <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div class="flex items-center justify-between text-xs font-black text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-2">
                        <span>VUELTA 10-18 (OUT)</span>
                        <span class="text-[10px] text-slate-500">PAR 34</span>
                    </div>
                    <div class="grid grid-cols-9 gap-2">
                        ${o.map(e=>s(e)).join(``)}
                    </div>
                </div>

                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Notas del Caddie Master</label>
                    <input id="score-modal-notes" type="text" placeholder="Ej. Tarjeta entregada en caseta" class="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-primary">
                </div>
            </div>

            <!-- Footer -->
            <div class="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3">
                <button type="button" onclick="window.setNoScorePar('${t.id}'); document.getElementById('modal-member-crud').classList.add('hidden');"
                    class="px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 transition-all">
                    <span class="material-icons" style="font-size:16px">block</span> No Entregó Tarjeta (Par 78)
                </button>
                <div class="flex gap-2">
                    <button type="button" onclick="document.getElementById('modal-member-crud').classList.add('hidden')" class="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-xs uppercase">Cancelar</button>
                    <button type="button" onclick="window.saveCaddieScorecard('${t.id}', '${t.member_id}', '${t.member_name.replace(/'/g,`\\'`)}')" class="px-7 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-xs uppercase transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5">
                        <span class="material-icons" style="font-size:16px">save</span> Guardar Scorecard
                    </button>
                </div>
            </div>
        </div>
    `,i.classList.remove(`hidden`),window.recalcCaddieScorecardTotals()},window.onCaddieHoleInput=function(e,t){let n=parseInt(t.value),r=document.getElementById(`caddie-hole-card-${e}`);!isNaN(n)&&n>0?(window._caddieHoleScores[`h${e}`]=n,r&&(r.className=`flex flex-col items-center justify-between p-2 rounded-2xl border transition-all bg-emerald-500/20 border-emerald-500/50 shadow-md`)):(window._caddieHoleScores[`h${e}`]=``,r&&(r.className=`flex flex-col items-center justify-between p-2 rounded-2xl border transition-all bg-slate-800 border-slate-700`)),window.recalcCaddieScorecardTotals()},window.caddieFillPar=function(){h.forEach(e=>{window._caddieHoleScores[`h${e.hole}`]=e.par;let t=document.getElementById(`caddie-score-h${e.hole}`);t&&(t.value=e.par)}),window.recalcCaddieScorecardTotals()},window.caddieFillPar78=function(){h.forEach(e=>{e.par+1;let t=e.hole<=10?e.par+ +(e.hole%2==0):e.par;window._caddieHoleScores[`h${e.hole}`]=t;let n=document.getElementById(`caddie-score-h${e.hole}`);n&&(n.value=t)}),window.recalcCaddieScorecardTotals()},window.recalcCaddieScorecardTotals=function(){let e=window._caddieHoleScores||{},t=0;for(let n=1;n<=9;n++){let r=parseInt(e[`h${n}`]);!isNaN(r)&&r>0&&(t+=r)}let n=0;for(let t=10;t<=18;t++){let r=parseInt(e[`h${t}`]);!isNaN(r)&&r>0&&(n+=r)}let r=t+n,i=document.getElementById(`caddie-sc-in`),a=document.getElementById(`caddie-sc-out`),o=document.getElementById(`caddie-sc-gross`);i&&(i.textContent=t),a&&(a.textContent=n),o&&(o.textContent=r)},window.saveCaddieScorecard=async function(e,t,n){let i=window._caddieHoleScores||{},a=0;for(let e=1;e<=18;e++){let t=parseInt(i[`h${e}`]);!isNaN(t)&&t>0&&(a+=t)}if(a===0){window.showNotification(`Ingresa Scores`,`Por favor ingresa los golpes de al menos un hoyo.`,`error`);return}let o=document.getElementById(`score-modal-notes`)?.value.trim()||`Scorecard 18 Hoyos Caddie Master`;await d.from(`daily_outputs`).update({score_status:`CAPTURED`,gross_score:a}).eq(`id`,e);let s=parseFloat((113/v*(a-_)).toFixed(1));await d.from(`member_scores`).insert([{member_id:t,output_id:e,date_played:new Date().toISOString().split(`T`)[0],gross_score:a,course_rating:_,slope_rating:v,differential:s,hole_scores:i,delivered:!0,notes:o}]),await c(t),window.showNotification(`¡Scorecard Guardado!`,`Scorecard de 18 hoyos (Gross: ${a}) guardado para ${n}. Handicap recalculado.`,`success`),document.getElementById(`modal-member-crud`)?.classList.add(`hidden`),await r()}}))();export{n as renderCaddieMasterModule};