import{t as e}from"./main-CTM-C1Mc.js";import{createClient as t}from"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";async function n(e){e.innerHTML=`
        <div class="space-y-6">
            <!-- Header Banner SpeiHandicap Style -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <span class="material-icons" style="font-size:30px">analytics</span>
                    </div>
                    <div>
                        <h2 class="text-2xl font-black text-white uppercase tracking-tight">Handicap del Club · Club de Golf Colima</h2>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Tabla General de Handicaps por Tee de Salida & Consultas Individuales WHS</p>
                    </div>
                </div>

                <!-- Date Picker & Quick Actions -->
                <div class="flex items-center gap-3">
                    <div class="px-4 py-2 bg-slate-800 border border-slate-700 rounded-2xl">
                        <label class="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Selección Fecha de Handicap</label>
                        <input id="whs-date-picker" type="date" value="${v}" class="bg-transparent text-xs font-black text-amber-400 focus:outline-none cursor-pointer">
                    </div>
                </div>
            </div>

            <!-- Sub Tabs Bar (SpeiHandicap Navigation Style) -->
            <div class="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button id="hub-tab-club" class="px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20">
                    <span class="material-icons" style="font-size:18px">table_chart</span> Club Handicap (Tabla General)
                </button>
                <button id="hub-tab-individual" class="px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-slate-900 text-slate-400 border border-slate-800 hover:text-white">
                    <span class="material-icons" style="font-size:18px">person</span> Handicap Individual
                </button>
            </div>

            <!-- Main Content Area -->
            <div id="whs-hub-content" class="w-full">
                <div class="py-16 text-center bg-slate-900/50 border border-slate-800 rounded-3xl">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mx-auto"></div>
                    <p class="text-xs text-slate-500 font-bold uppercase tracking-widest mt-3">Cargando Datos WHS...</p>
                </div>
            </div>
        </div>
    `;let t=document.getElementById(`hub-tab-club`),n=document.getElementById(`hub-tab-individual`);t.onclick=()=>{g=`CLUB_HANDICAP`,t.className=`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20`,n.className=`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-slate-900 text-slate-400 border border-slate-800 hover:text-white`,s()},n.onclick=()=>{g=`INDIVIDUAL`,n.className=`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20`,t.className=`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-slate-900 text-slate-400 border border-slate-800 hover:text-white`,c()},document.getElementById(`whs-date-picker`).onchange=e=>{v=e.target.value,g===`CLUB_HANDICAP`?s():c()},await r()}async function r(){try{let{data:e}=await d.from(`members`).select(`*`).order(`name`,{ascending:!0});if(p=e||[],p.length>0){m=p[0];let{data:e}=await f.from(`member_scores`).select(`*`).eq(`member_id`,m.id).order(`date_played`,{ascending:!1}).limit(20);h=e||[]}s()}catch(e){console.error(`Error loading WHS hub data:`,e)}}function i(e){return Math.max(0,parseFloat(e)||0).toFixed(1)}function a(e,t){let n=Math.max(0,parseFloat(e)||0)*(t.slope/113),r=Math.floor(n),i=n-r>=.5?r+1:r;return Math.max(0,i)}function o(e){return y.map(t=>a(e,t))}function s(){let e=document.getElementById(`whs-hub-content`);if(!e)return;let t=p.filter(e=>!_||`${e.name} ${e.member_number}`.toLowerCase().includes(_));e.innerHTML=`
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
            <!-- Header Controls for Club Handicap Table -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <span class="material-icons">groups</span>
                    </div>
                    <div>
                        <h3 class="font-black text-white text-lg uppercase tracking-tight">HANDICAP DEL CLUB</h3>
                        <p class="text-xs text-slate-400 font-bold uppercase">Club: <span class="text-white">CLUB DE GOLF COLIMA</span> · Fecha: <span class="text-amber-400 font-black">${v}</span></p>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <div class="relative w-full sm:w-72">
                        <span class="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                        <input id="club-search-input" type="text" value="${_}" placeholder="Buscar jugador..." class="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-400">
                    </div>
                    <button onclick="window.print()" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 transition-all shrink-0">
                        <span class="material-icons" style="font-size:16px">print</span> Imprimir
                    </button>
                </div>
            </div>

            <!-- General SpeiHandicap Table (Exact Match to SpeiHandicap Screenshot 1 & 2) -->
            <div class="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <div class="overflow-x-auto custom-scrollbar">
                    <table class="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr class="bg-slate-900 border-b border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                                <th class="px-6 py-4">Jugador</th>
                                <th class="px-6 py-4 text-center text-rose-500 font-black">Index</th>
                                <th class="px-6 py-4 text-center text-slate-200 font-black">B</th>
                                <th class="px-6 py-4 text-center text-amber-400 font-black">D</th>
                                <th class="px-6 py-4 text-center text-rose-400 font-black">P</th>
                                <th class="px-4 py-4 text-right">Consulta WHS</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60 font-bold">
                            ${t.map(e=>{let t=parseFloat(e.current_handicap||0),[n,r,a]=o(t);return`
                                    <tr onclick="window.viewMemberWHSProfile('${e.id}')"
                                        class="hover:bg-slate-800/50 transition-colors cursor-pointer group">
                                        <td class="px-6 py-4">
                                            <div class="flex items-center gap-3">
                                                <span class="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 font-black text-[10px] rounded-md">#${e.member_number}</span>
                                                <span class="font-black text-white uppercase group-hover:text-amber-400 transition-colors text-sm">${e.name}</span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 text-center font-black text-rose-500 text-base">${i(t)}</td>
                                        <td class="px-6 py-4 text-center font-black text-slate-200 text-base">${n}</td>
                                        <td class="px-6 py-4 text-center font-black text-amber-400 text-base">${r}</td>
                                        <td class="px-6 py-4 text-center font-black text-rose-400 text-base">${a}</td>
                                        <td class="px-4 py-4 text-right" onclick="event.stopPropagation()">
                                            <button onclick="window.viewMemberWHSProfile('${e.id}')" class="px-3 py-1.5 bg-slate-800 hover:bg-amber-500/20 hover:border-amber-500/40 border border-slate-700 rounded-xl text-[11px] font-black text-amber-400 transition-all">
                                                Ver Tarjetas ➔
                                            </button>
                                        </td>
                                    </tr>`}).join(``)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `,document.getElementById(`club-search-input`).oninput=e=>{_=e.target.value.toLowerCase().trim(),s()}}function c(){let e=document.getElementById(`whs-hub-content`);if(!e)return;if(!m){e.innerHTML=`
            <div class="py-16 text-center bg-slate-900 border border-slate-800 rounded-3xl">
                <p class="text-xs text-slate-400 font-bold uppercase">Selecciona un jugador para consultar.</p>
            </div>`;return}let t=v,n=new Date;n.setDate(n.getDate()-365);let r=n.toISOString().split(`T`)[0],o=h.filter(e=>e.date_played>=r),s=i(o.length>0?Math.min(...o.map(e=>parseFloat(e.differential)||99)):m.current_handicap||0),c=[...h].sort((e,t)=>(parseFloat(e.differential)||0)-(parseFloat(t.differential)||0)),l=h.length,u=1;u=l>=20?8:l>=19?7:l>=17?6:l>=15?5:l>=12?4:l>=9?3:l>=6?2:1;let d=new Set(c.slice(0,u).map(e=>e.id)),f=parseFloat(m.current_handicap||0),g=y.map(e=>{let t=a(f,e);return{...e,ch:t}});e.innerHTML=`
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 animate-fade-in">
            <!-- Selector Dropdown Inside Individual View -->
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div class="relative w-full sm:w-80">
                    <label class="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Seleccionar Jugador</label>
                    <select id="select-individual-member" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-amber-400">
                        ${p.map(e=>`
                            <option value="${e.id}" ${String(e.id)===String(m.id)?`selected`:``}>${e.name} (#${e.member_number})</option>
                        `).join(``)}
                    </select>
                </div>
                <button onclick="window.renderHandicapHubModule(document.getElementById('handicap-app-root'))" class="px-4 py-2.5 bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold uppercase transition-all">
                    ⬅ Volver a Tabla General del Club
                </button>
            </div>

            <!-- Header SpeiHandicap Card -->
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
                <div class="flex items-center gap-5">
                    <div class="p-3 bg-white/5 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md shrink-0">
                        <img src="./golcolima.jpg" alt="Club Colima" class="h-16 w-auto object-contain rounded-xl" onerror="this.style.display='none'">
                    </div>
                    <div>
                        <p class="font-black text-blue-400 text-lg uppercase tracking-wide">ID Jugador: #${m.member_number}</p>
                        <h3 class="font-black text-white text-2xl uppercase tracking-tight leading-tight mt-0.5">${m.name}</h3>
                        <p class="text-xs text-slate-400 font-bold uppercase mt-1">Fecha Handicap: <span class="text-slate-200">${t}</span></p>
                    </div>
                </div>

                <div class="flex items-center gap-4 bg-slate-950/80 p-4 border border-slate-800 rounded-2xl self-start lg:self-auto">
                    <div class="text-center px-4 border-r border-slate-800">
                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Handicap Índice</p>
                        <p class="text-3xl font-black text-rose-500 leading-tight mt-0.5">${i(f)}</p>
                    </div>
                    <div class="text-center px-4">
                        <p class="text-[9px] font-black text-amber-400 uppercase tracking-widest">Low H.I. (365d)</p>
                        <p class="text-3xl font-black text-amber-400 leading-tight mt-0.5">${s}</p>
                    </div>
                </div>
            </div>

            <!-- Color Badges (Tee Handicap Calculator - Exact Match to SpeiHandicap) -->
            <div>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Calculadora de Handicap de Campo por Marca de Salida (Tees)</p>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    ${g.map(e=>`
                        <div class="p-5 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-2 shadow-lg hover:border-slate-700 transition-all">
                            <span class="inline-block px-5 py-1.5 rounded-lg font-black text-sm uppercase shadow-md ${e.bg}">${e.label}</span>
                            <p class="text-4xl font-black ${e.text} mt-2">${e.ch}</p>
                            <p class="text-xs font-bold text-slate-500 uppercase">RTG: ${e.rating} / SLO: ${e.slope}</p>
                        </div>
                    `).join(``)}
                </div>
            </div>

            <!-- 20 Recent WHS Rounds Table (Estilo SpeiHandicap) -->
            <div class="space-y-4 pt-2">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 class="font-black text-white uppercase text-base tracking-tight flex items-center gap-2">
                        <span class="material-icons text-amber-400">history_edu</span> Historial de Rondas WHS Registradas
                    </h4>
                    <span class="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                        🌟 Las rondas verdes promedian tu Handicap Index actual (${u} de ${l})
                    </span>
                </div>

                ${h.length===0?`
                    <div class="py-16 text-center bg-slate-950/60 border border-slate-800 rounded-3xl">
                        <span class="material-icons text-slate-600 text-5xl mb-2">sports_golf</span>
                        <p class="text-sm font-black text-slate-400 uppercase tracking-widest">Aún no hay tarjetas capturadas para este jugador</p>
                        <p class="text-xs text-slate-600 mt-1">Registra rondas desde el portal de Caddie Master para actualizar este historial.</p>
                    </div>
                `:`
                    <div class="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                        <div class="overflow-x-auto custom-scrollbar">
                            <table class="w-full text-left border-collapse min-w-[750px] text-xs">
                                <thead>
                                    <tr class="bg-slate-900 border-b border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                        <th class="px-5 py-4">Fecha</th>
                                        <th class="px-5 py-4">Campo</th>
                                        <th class="px-5 py-4 text-center">Tee</th>
                                        <th class="px-5 py-4 text-center">RTG / SLO</th>
                                        <th class="px-5 py-4 text-center">Score (SA)</th>
                                        <th class="px-5 py-4 text-center">Diferencial (WHS)</th>
                                        <th class="px-5 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-800/60">
                                    ${h.map(e=>{let t=d.has(e.id),n=i(parseFloat(e.differential||0)),r=e.tee_color||`BLANCO`;return`
                                            <tr class="hover:bg-slate-800/50 transition-colors ${t?`bg-emerald-500/10`:``}">
                                                <td class="px-5 py-4 text-slate-300 font-bold">${new Date(e.date_played+`T00:00:00`).toLocaleDateString(`es-MX`,{day:`2-digit`,month:`short`,year:`numeric`})}</td>
                                                <td class="px-5 py-4 font-black text-white uppercase text-sm">${e.course_name||`CLUB DE GOLF COLIMA`}</td>
                                                <td class="px-5 py-4 text-center">
                                                    <span class="px-3 py-1 rounded-lg font-black text-[10px] uppercase bg-slate-800 text-slate-300 border border-slate-700">${r}</span>
                                                </td>
                                                <td class="px-5 py-4 text-center font-bold text-slate-400">${e.course_rating||67.5} / ${e.slope_rating||114}</td>
                                                <td class="px-5 py-4 text-center font-black text-white text-base">${e.gross_score}</td>
                                                <td class="px-5 py-4 text-center font-black text-base ${t?`text-emerald-400`:`text-slate-400`}">
                                                    ${t?`🌟 `:``}${n}
                                                </td>
                                                <td class="px-5 py-4 text-right">
                                                    <div class="flex items-center justify-end gap-2">
                                                        ${e.hole_scores?`
                                                            <button onclick="window.toggleWHSDetail('${e.id}')" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-all">
                                                                Ver 18 Hoyos
                                                            </button>
                                                        `:``}
                                                        <button onclick="window.deleteWHSScoreItem('${e.id}', '${m.id}')" title="Eliminar ronda" class="w-8 h-8 bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 rounded-xl flex items-center justify-center transition-all">
                                                            <span class="material-icons" style="font-size:16px">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            ${e.hole_scores?`
                                                <tr id="whs-detail-${e.id}" class="hidden bg-slate-950">
                                                    <td colspan="7" class="p-5">
                                                        <div class="text-xs font-black text-slate-400 uppercase mb-3 flex items-center justify-between">
                                                            <span>Tarjeta Hoyo por Hoyo (${e.gross_score} Golpes Gross)</span>
                                                            <span class="text-emerald-400 font-bold">Diferencial: ${n}</span>
                                                        </div>
                                                        <div class="grid grid-cols-9 sm:grid-cols-18 gap-1.5 text-center text-xs">
                                                            ${Object.entries(e.hole_scores).map(([e,t])=>`
                                                                <div class="p-2 bg-slate-900 border border-slate-800 rounded-xl">
                                                                    <p class="text-[9px] font-bold text-slate-500">${e.replace(`h`,`#`)}</p>
                                                                    <p class="font-black text-emerald-400 text-sm">${t||`—`}</p>
                                                                </div>
                                                            `).join(``)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            `:``}
                                        `}).join(``)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `}
            </div>
        </div>
    `,document.getElementById(`select-individual-member`).onchange=e=>{window.viewMemberWHSProfile(e.target.value)}}async function l(e){try{let{data:t}=await f.from(`member_scores`).select(`*`).eq(`member_id`,e).order(`date_played`,{ascending:!1}).limit(20);if(!t||t.length===0)return;let n=t.map(e=>parseFloat(e.differential)||0).sort((e,t)=>e-t),r=n.length,i=1;i=r>=20?8:r>=19?7:r>=17?6:r>=15?5:r>=12?4:r>=9?3:r>=6?2:1;let a=n.slice(0,i).reduce((e,t)=>e+t,0)/i,o=parseFloat(a.toFixed(1));await d.from(`members`).update({current_handicap:o}).eq(`id`,e)}catch(e){console.error(`Error recalculating handicap:`,e)}}var u,d,f,p,m,h,g,_,v,y;e((()=>{u=t(`https://tztolxgsaktqindoimtu.supabase.co`,`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dG9seGdzYWt0cWluZG9pbXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzQ4ODAsImV4cCI6MjEwMTg1MDg4MH0.E2GABiOMXYb5hEwE9ErIcJa6_LHkj9lJUglQVoiLl0M`),d=u.schema(`members`),f=u.schema(`starter`),p=[],m=null,h=[],g=`CLUB_HANDICAP`,_=``,v=new Date().toISOString().split(`T`)[0],y=[{color:`BLANCO`,code:`B`,label:`Blanco (B)`,bg:`bg-slate-200 text-slate-950`,text:`text-slate-200`,rating:67.5,slope:114,par:68},{color:`DORADO`,code:`D`,label:`Dorado (D)`,bg:`bg-amber-400 text-slate-950`,text:`text-amber-400`,rating:65.8,slope:110,par:68},{color:`PLATA / ROJO`,code:`P`,label:`Plata / Rojo (P)`,bg:`bg-rose-600 text-white`,text:`text-rose-400`,rating:64.5,slope:108,par:68}],window.viewMemberWHSProfile=async function(e){let t=document.getElementById(`hub-tab-individual`),n=document.getElementById(`hub-tab-club`);if(g=`INDIVIDUAL`,t&&n&&(t.className=`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20`,n.className=`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-slate-900 text-slate-400 border border-slate-800 hover:text-white`),m=p.find(t=>String(t.id)===String(e)),m){let{data:e}=await f.from(`member_scores`).select(`*`).eq(`member_id`,m.id).order(`date_played`,{ascending:!1}).limit(20);h=e||[]}c()},window.toggleWHSDetail=function(e){let t=document.getElementById(`whs-detail-${e}`);t&&t.classList.toggle(`hidden`)},window.deleteWHSScoreItem=async function(e,t){window.showNotification(`Eliminar Tarjeta`,`¿Deseas eliminar esta ronda del historial del socio? El Handicap Index se recalculará automáticamente.`,`confirm`,async()=>{let{error:n}=await f.from(`member_scores`).delete().eq(`id`,e);if(n){window.showNotification(`Error`,`No se pudo eliminar la tarjeta: `+n.message,`error`);return}await l(t),window.showNotification(`Tarjeta Eliminada`,`Se eliminó la ronda y se recalculó el Handicap del socio.`,`success`),await selectMemberForWHS(t)})}}))();export{n as renderHandicapHubModule};