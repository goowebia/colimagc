import{t as e}from"./main-CTM-C1Mc.js";import{createClient as t}from"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";async function n(e){e.innerHTML=`
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
                <h2 class="text-2xl font-black text-white uppercase tracking-tight">Gestión de Socios & Membresías</h2>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Padrón de Socios, Control de Cuotas, Expedientes & Handicaps WHS</p>
            </div>
            <button id="btn-add-member" class="flex items-center justify-center gap-2 px-5 py-3 bg-primary text-slate-900 rounded-xl font-black uppercase text-xs hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                <span class="material-icons" style="font-size:18px">person_add</span> Nuevo Socio
            </button>
        </div>

        <div id="members-kpis" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Socios</p>
                    <p id="kpi-total" class="text-3xl font-black text-white mt-1">-</p>
                </div>
                <div class="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <span class="material-icons">groups</span>
                </div>
            </div>
            <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                    <p class="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Al Corriente 🟢</p>
                    <p id="kpi-active" class="text-3xl font-black text-emerald-400 mt-1">-</p>
                </div>
                <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <span class="material-icons">check_circle</span>
                </div>
            </div>
            <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                    <p class="text-[10px] font-black text-rose-400 uppercase tracking-widest">Con Adeudo 🔴</p>
                    <p id="kpi-inactive" class="text-3xl font-black text-rose-400 mt-1">-</p>
                </div>
                <div class="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <span class="material-icons">warning</span>
                </div>
            </div>
            <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                    <p class="text-[10px] font-black text-amber-400 uppercase tracking-widest">Cobrado este Mes</p>
                    <p id="kpi-income" class="text-3xl font-black text-amber-400 mt-1">$0</p>
                </div>
                <div class="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <span class="material-icons">payments</span>
                </div>
            </div>
        </div>

        <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6">
            <div class="flex flex-wrap items-center gap-3">
                <div class="relative w-full sm:w-80">
                    <span class="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                    <input id="search-member-input" type="text" placeholder="Buscar por socio, # o categoría..." class="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary transition-all font-bold">
                </div>

                <div id="filter-pills" class="flex items-center gap-2 overflow-x-auto custom-scrollbar">
                    <button data-filter="ALL" class="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-primary text-slate-900 shadow-md shadow-primary/20">Todos</button>
                    <button data-filter="ACTIVE" class="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-slate-800 text-slate-400 hover:text-white">🟢 Al Corriente</button>
                    <button data-filter="INACTIVE" class="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-slate-800 text-slate-400 hover:text-white">🔴 Con Adeudo</button>
                </div>
            </div>

            <!-- View Mode Switcher -->
            <div class="flex items-center gap-1 bg-slate-900 p-1.5 border border-slate-800 rounded-xl self-end lg:self-auto">
                <button id="btn-view-table" class="px-3 py-1.5 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all bg-slate-800 text-white border border-slate-700">
                    <span class="material-icons" style="font-size:15px">format_list_bulleted</span> Lista
                </button>
                <button id="btn-view-cards" class="px-3 py-1.5 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all text-slate-400 hover:text-white">
                    <span class="material-icons" style="font-size:15px">grid_view</span> Tarjetas
                </button>
            </div>
        </div>

        <div id="members-list-container" class="w-full">
            <div class="py-16 text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p class="text-xs text-slate-500 font-bold uppercase tracking-widest mt-3">Cargando Padrón de Socios...</p>
            </div>
        </div>
    `,document.getElementById(`btn-add-member`).onclick=()=>c(),document.getElementById(`search-member-input`).oninput=e=>{h=e.target.value.toLowerCase().trim(),a()};let t=document.getElementById(`btn-view-table`),n=document.getElementById(`btn-view-cards`);t.onclick=()=>{g=`TABLE`,t.className=`px-3 py-1.5 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all bg-slate-800 text-white border border-slate-700`,n.className=`px-3 py-1.5 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all text-slate-400 hover:text-white`,a()},n.onclick=()=>{g=`CARDS`,n.className=`px-3 py-1.5 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all bg-slate-800 text-white border border-slate-700`,t.className=`px-3 py-1.5 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all text-slate-400 hover:text-white`,a()},document.querySelectorAll(`#filter-pills button`).forEach(e=>{e.onclick=()=>{document.querySelectorAll(`#filter-pills button`).forEach(e=>{e.className=`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-slate-800 text-slate-400 hover:text-white`}),e.className=`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-primary text-slate-900 shadow-md shadow-primary/20`,m=e.dataset.filter,a()}}),await r()}async function r(){try{let[{data:e,error:t},{data:n,error:r}]=await Promise.all([u.from(`members`).select(`*`).order(`member_number`,{ascending:!0}),u.from(`member_payments`).select(`*`).order(`created_at`,{ascending:!1})]);t&&console.warn(`Error loading members table:`,t.message),f=e||[],p=n||[],i(),a()}catch(e){console.error(`Error fetching members:`,e),f=[],a()}}function i(){let e=new Date().toISOString().split(`T`)[0],t=f.length,n=0,r=0;f.forEach(t=>{t.paid_until&&t.paid_until>=e&&t.status===`ACTIVE`?n++:r++});let i=new Date().toISOString().slice(0,7),a=p.filter(e=>e.created_at&&e.created_at.startsWith(i)).reduce((e,t)=>e+(parseFloat(t.amount)||0),0),o=document.getElementById(`kpi-total`),s=document.getElementById(`kpi-active`),c=document.getElementById(`kpi-inactive`),l=document.getElementById(`kpi-income`);o&&(o.textContent=t),s&&(s.textContent=n),c&&(c.textContent=r),l&&(l.textContent=`$${a.toLocaleString(`es-MX`,{minimumFractionDigits:0})}`)}function a(){let e=document.getElementById(`members-list-container`);if(!e)return;let t=new Date().toISOString().split(`T`)[0],n=f.filter(e=>{let n=e.paid_until&&e.paid_until>=t&&e.status===`ACTIVE`,r=m===`ALL`||m===`ACTIVE`&&n||m===`INACTIVE`&&!n,i=`${e.name} ${e.member_number} ${e.category} ${e.phone||``}`.toLowerCase().includes(h);return r&&i});if(n.length===0){e.innerHTML=`
            <div class="py-16 text-center bg-slate-900/50 border border-slate-800 rounded-3xl">
                <span class="material-icons text-slate-600 text-5xl mb-3">group_off</span>
                <p class="text-sm font-black text-slate-400 uppercase tracking-widest">No se encontraron socios</p>
                <p class="text-xs text-slate-600 mt-1">Prueba con otro término de búsqueda o registra un nuevo socio.</p>
            </div>`;return}g===`TABLE`?o(e,n,t):s(e,n,t)}function o(e,t,n){e.innerHTML=`
        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div class="overflow-x-auto custom-scrollbar">
                <table class="w-full text-left border-collapse min-w-[850px]">
                    <thead>
                        <tr class="bg-slate-950/60 border-b border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            <th class="px-6 py-4"># Socio</th>
                            <th class="px-6 py-4">Socio / Nombre</th>
                            <th class="px-6 py-4">Categoría</th>
                            <th class="px-6 py-4 text-center">Estatus Cuota</th>
                            <th class="px-6 py-4 text-center">Vence Cuota</th>
                            <th class="px-6 py-4 text-center">HCP Index</th>
                            <th class="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 text-xs">
                        ${t.map(e=>{let t=e.paid_until&&e.paid_until>=n&&e.status===`ACTIVE`,r=e.name.split(` `).map(e=>e[0]).join(``).substring(0,2).toUpperCase(),i=e.paid_until?new Date(e.paid_until+`T00:00:00`).toLocaleDateString(`es-MX`,{day:`2-digit`,month:`short`,year:`numeric`}):`Sin Fecha`;return`
                                <tr onclick="window.openMemberProfileModal('${e.id}')"
                                    class="hover:bg-slate-800/50 transition-colors cursor-pointer group">
                                    <td class="px-6 py-4">
                                        <span class="font-black text-slate-300 bg-slate-800 border border-slate-700 px-3 py-1 rounded-lg text-[11px] tracking-wider">#${e.member_number}</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-3">
                                            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600/50 flex items-center justify-center font-black text-white text-xs shrink-0 shadow-md">
                                                ${r}
                                            </div>
                                            <div>
                                                <p class="font-black text-white uppercase group-hover:text-primary transition-colors text-sm">${e.name}</p>
                                                <p class="text-[10px] text-slate-500 font-bold">${e.email||e.phone||`Sin datos de contacto`}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 font-black text-slate-400 uppercase text-[11px]">
                                        ${e.category||`TITULAR`}
                                    </td>
                                    <td class="px-6 py-4 text-center">
                                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${t?`bg-emerald-500/10 text-emerald-400 border border-emerald-500/30`:`bg-rose-500/10 text-rose-400 border border-rose-500/30`}">
                                            <span class="w-2 h-2 rounded-full ${t?`bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]`:`bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]`}"></span>
                                            ${t?`AL CORRIENTE`:`ADEUDO / INACTIVO`}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-center font-black ${t?`text-emerald-400`:`text-rose-400`} uppercase text-xs">
                                        ${i}
                                    </td>
                                    <td class="px-6 py-4 text-center font-black text-amber-400 text-sm">
                                        ${e.current_handicap!==void 0&&e.current_handicap!==null?e.current_handicap:`0.0`}
                                    </td>
                                    <td class="px-6 py-4 text-right" onclick="event.stopPropagation()">
                                        <div class="flex items-center justify-end gap-1.5">
                                            <button onclick="window.openMemberProfileModal('${e.id}')"
                                                title="Ver Expediente WHS"
                                                class="w-8 h-8 bg-slate-800 hover:bg-primary/20 hover:border-primary/40 border border-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary transition-all">
                                                <span class="material-icons" style="font-size:16px">visibility</span>
                                            </button>
                                            <button onclick="window.payMemberModal('${e.id}')"
                                                title="Registrar Pago"
                                                class="w-8 h-8 bg-slate-800 hover:bg-emerald-500/20 hover:border-emerald-500/40 border border-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-400 transition-all">
                                                <span class="material-icons" style="font-size:16px">payments</span>
                                            </button>
                                            <button onclick="window.editMemberModal('${e.id}')"
                                                title="Editar Socio"
                                                class="w-8 h-8 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all">
                                                <span class="material-icons" style="font-size:16px">edit</span>
                                            </button>
                                            <button onclick="window.deleteMemberModal('${e.id}', '${e.name.replace(/'/g,`\\'`)}')"
                                                title="Eliminar Socio"
                                                class="w-8 h-8 bg-slate-800 hover:bg-rose-500/20 hover:border-rose-500/40 border border-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 transition-all">
                                                <span class="material-icons" style="font-size:16px">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>`}).join(``)}
                    </tbody>
                </table>
            </div>
        </div>`}function s(e,t,n){e.innerHTML=`
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            ${t.map(e=>{let t=e.paid_until&&e.paid_until>=n&&e.status===`ACTIVE`,r=e.name.split(` `).map(e=>e[0]).join(``).substring(0,2).toUpperCase(),i=e.paid_until?new Date(e.paid_until+`T00:00:00`).toLocaleDateString(`es-MX`,{day:`2-digit`,month:`short`,year:`numeric`}):`Sin Fecha`;return`
                    <div onclick="window.openMemberProfileModal('${e.id}')"
                        class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative flex flex-col justify-between hover:border-slate-700 transition-all group cursor-pointer">
                        <div>
                            <div class="flex items-start justify-between gap-3 mb-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600/50 flex items-center justify-center font-black text-white text-base shadow-md">
                                        ${r}
                                    </div>
                                    <div>
                                        <span class="text-[9px] font-black uppercase bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-md tracking-wider">#${e.member_number}</span>
                                        <h3 class="font-black text-white text-base uppercase leading-snug mt-1 truncate max-w-[180px] group-hover:text-primary transition-colors">${e.name}</h3>
                                    </div>
                                </div>
                                <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0
                                    ${t?`bg-emerald-500/10 text-emerald-400 border border-emerald-500/30`:`bg-rose-500/10 text-rose-400 border border-rose-500/30`}">
                                    ${t?`🟢 AL CORRIENTE`:`🔴 ADEUDO / INACTIVO`}
                                </span>
                            </div>

                            <div class="space-y-2 text-xs border-t border-slate-800 pt-4 mb-4">
                                <div class="flex justify-between items-center">
                                    <span class="text-slate-500 font-bold">Categoría:</span>
                                    <span class="font-black text-slate-300 uppercase">${e.category||`TITULAR`}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-slate-500 font-bold">Vence Cuota:</span>
                                    <span class="font-black ${t?`text-emerald-400`:`text-rose-400`} uppercase">${i}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-slate-500 font-bold">Plan / Frecuencia:</span>
                                    <span class="font-black text-blue-400 uppercase">${e.payment_frequency||`MENSUAL`}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-slate-500 font-bold">Handicap Index:</span>
                                    <span class="font-black text-amber-400">${e.current_handicap!==void 0&&e.current_handicap!==null?e.current_handicap:`0.0`}</span>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center gap-2 pt-2 border-t border-slate-800" onclick="event.stopPropagation()">
                            <button onclick="window.payMemberModal('${e.id}')"
                                class="flex-1 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-all">
                                <span class="material-icons" style="font-size:15px">payments</span> Registrar Pago
                            </button>
                            <button onclick="window.openMemberProfileModal('${e.id}')"
                                title="Ver Expediente WHS"
                                class="w-9 h-9 bg-slate-800 hover:bg-primary/20 hover:border-primary/40 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-all">
                                <span class="material-icons" style="font-size:16px">visibility</span>
                            </button>
                            <button onclick="window.editMemberModal('${e.id}')"
                                title="Editar Socio"
                                class="w-9 h-9 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
                                <span class="material-icons" style="font-size:16px">edit</span>
                            </button>
                            <button onclick="window.deleteMemberModal('${e.id}', '${e.name.replace(/'/g,`\\'`)}')"
                                title="Eliminar Socio"
                                class="w-9 h-9 bg-slate-800 hover:bg-rose-500/20 hover:border-rose-500/40 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-400 transition-all">
                                <span class="material-icons" style="font-size:16px">delete</span>
                            </button>
                        </div>
                    </div>`}).join(``)}
        </div>`}function c(){let e=document.getElementById(`modal-member-crud`);e||(e=document.createElement(`div`),e.id=`modal-member-crud`,e.className=`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in`,document.body.appendChild(e));let t=`SOC-${String(f.length+101).padStart(3,`0`)}`,n=new Date().toISOString().split(`T`)[0];e.innerHTML=`
        <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                        <span class="material-icons">person_add</span>
                    </div>
                    <div>
                        <h3 class="font-black uppercase text-white text-base">Nuevo Socio</h3>
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Dar de alta en el padrón</p>
                    </div>
                </div>
                <button onclick="document.getElementById('modal-member-crud').classList.add('hidden')" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                    <span class="material-icons" style="font-size:18px">close</span>
                </button>
            </div>

            <form id="form-save-member" class="p-6 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"># Socio / Expediente</label>
                        <input id="m-num" type="text" value="${t}" required class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Categoría</label>
                        <select id="m-cat" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                            <option value="SOCIO TITULAR">SOCIO TITULAR</option>
                            <option value="SOCIO DAMA">SOCIO DAMA</option>
                            <option value="SOCIO JUVENIL">SOCIO JUVENIL</option>
                            <option value="SOCIO HONORARIO">SOCIO HONORARIO</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nombre Completo</label>
                    <input id="m-name" type="text" placeholder="Ej. Carlos Fernández" required class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Correo Electrónico</label>
                        <input id="m-email" type="email" placeholder="socio@correo.com" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Teléfono</label>
                        <input id="m-phone" type="tel" placeholder="312 000 0000" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-primary">
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Frecuencia</label>
                        <select id="m-freq" class="w-full px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                            <option value="MENSUAL">MENSUAL</option>
                            <option value="BIMESTRAL">BIMESTRAL</option>
                            <option value="TRIMESTRAL">TRIMESTRAL</option>
                            <option value="ANUAL">ANUAL</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Pagado Hasta</label>
                        <input id="m-paid" type="date" value="${n}" required class="w-full px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Handicap Index</label>
                        <input id="m-hdcp" type="number" step="0.1" value="0.0" class="w-full px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                    </div>
                </div>

                <div class="pt-4 border-t border-slate-800 flex justify-end gap-3">
                    <button type="button" onclick="document.getElementById('modal-member-crud').classList.add('hidden')" class="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-xs uppercase">Cancelar</button>
                    <button type="submit" class="px-6 py-3 bg-primary text-slate-900 rounded-xl font-black text-xs uppercase hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">Guardar Socio</button>
                </div>
            </form>
        </div>
    `,e.classList.remove(`hidden`),document.getElementById(`form-save-member`).onsubmit=async t=>{t.preventDefault();let n={member_number:document.getElementById(`m-num`).value.trim(),name:document.getElementById(`m-name`).value.trim(),email:document.getElementById(`m-email`).value.trim(),phone:document.getElementById(`m-phone`).value.trim(),category:document.getElementById(`m-cat`).value,payment_frequency:document.getElementById(`m-freq`).value,paid_until:document.getElementById(`m-paid`).value,current_handicap:parseFloat(document.getElementById(`m-hdcp`).value)||0,status:`ACTIVE`},{error:i}=await u.from(`members`).insert([n]);if(i){window.showNotification(`Error`,`No se pudo registrar el socio: `+i.message,`error`);return}window.showNotification(`¡Socio Guardado!`,`Se registró a ${n.name} correctamente.`,`success`),e.classList.add(`hidden`),await r()}}var l,u,d,f,p,m,h,g,_;e((()=>{l=t(`https://tztolxgsaktqindoimtu.supabase.co`,`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dG9seGdzYWt0cWluZG9pbXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzQ4ODAsImV4cCI6MjEwMTg1MDg4MH0.E2GABiOMXYb5hEwE9ErIcJa6_LHkj9lJUglQVoiLl0M`),u=l.schema(`members`),d=l.schema(`starter`),f=[],p=[],m=`ALL`,h=``,g=`TABLE`,_=[{color:`AZUL`,code:`A`,label:`Azul`,bg:`bg-blue-600 text-white`,text:`text-blue-400`,rating:72.1,slope:132,par:72},{color:`BLANCO`,code:`B`,label:`Blanco`,bg:`bg-slate-200 text-slate-950`,text:`text-slate-200`,rating:67.5,slope:105,par:68},{color:`VERDE`,code:`V`,label:`Verde`,bg:`bg-emerald-500 text-slate-950`,text:`text-emerald-400`,rating:68.2,slope:124,par:72},{color:`DORADO`,code:`D`,label:`Dorado / Amarillo`,bg:`bg-amber-400 text-slate-950`,text:`text-amber-400`,rating:65.8,slope:100,par:68},{color:`ROJO`,code:`P`,label:`Plata / Rojo`,bg:`bg-rose-600 text-white`,text:`text-rose-400`,rating:64.5,slope:96,par:68}],window.openMemberProfileModal=async function(e){let t=f.find(t=>String(t.id)===String(e));if(!t)return;let n=document.getElementById(`modal-member-crud`);n||(n=document.createElement(`div`),n.id=`modal-member-crud`,n.className=`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in`,document.body.appendChild(n));let r=new Date().toISOString().split(`T`)[0],i=t.paid_until&&t.paid_until>=r&&t.status===`ACTIVE`,a=t.name.split(` `).map(e=>e[0]).join(``).substring(0,2).toUpperCase();t.paid_until&&new Date(t.paid_until+`T00:00:00`).toLocaleDateString(`es-MX`,{day:`2-digit`,month:`long`,year:`numeric`});let{data:o}=await d.from(`member_scores`).select(`*`).eq(`member_id`,t.id).order(`date_played`,{ascending:!1}).limit(20),s=o||[],c=new Date;c.setDate(c.getDate()-365);let l=c.toISOString().split(`T`)[0],u=s.filter(e=>e.date_played>=l),m=u.length>0?Math.min(...u.map(e=>parseFloat(e.differential)||99)).toFixed(1):t.current_handicap||0,h=[...s].sort((e,t)=>(parseFloat(e.differential)||0)-(parseFloat(t.differential)||0)),g=s.length,v=1;v=g>=20?8:g>=19?7:g>=17?6:g>=15?5:g>=12?4:g>=9?3:g>=6?2:1;let y=new Set(h.slice(0,v).map(e=>e.id)),b=parseFloat(t.current_handicap||0),x=_.map(e=>{let t=b*(113/e.slope)+(e.rating-e.par),n=Math.round(t);return{...e,ch:n}}),S=p.filter(e=>String(e.member_id)===String(t.id));n.innerHTML=`
        <div class="w-full max-w-4xl bg-slate-950/95 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <!-- Header Banner SpeiHandicap Style -->
            <div class="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90">
                <div class="flex items-center gap-4">
                    <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600/50 flex items-center justify-center font-black text-white text-2xl shadow-xl shrink-0">
                        ${a}
                    </div>
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 font-black text-[10px] rounded-md uppercase">ID / SOCIO #${t.member_number}</span>
                            <span class="px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${i?`bg-emerald-500/10 text-emerald-400 border border-emerald-500/30`:`bg-rose-500/10 text-rose-400 border border-rose-500/30`}">
                                ${i?`🟢 AL CORRIENTE`:`🔴 ADEUDO / INACTIVO`}
                            </span>
                        </div>
                        <h3 class="font-black uppercase text-white text-xl leading-tight">${t.name}</h3>
                        <p class="text-xs text-slate-400 font-bold uppercase mt-0.5">${t.category||`SOCIO TITULAR`} · CLUB DE GOLF COLIMA</p>
                    </div>
                </div>

                <div class="flex items-center gap-3 self-end sm:self-auto">
                    <div class="text-right px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-2xl">
                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Handicap Índice WHS</p>
                        <p class="text-2xl font-black text-rose-500 mt-0.5">${b.toFixed(1)}</p>
                        <p class="text-[9px] font-bold text-slate-500 uppercase">Low H.I.: <span class="text-amber-400 font-black">${m}</span></p>
                    </div>
                    <button onclick="document.getElementById('modal-member-crud').classList.add('hidden')" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                        <span class="material-icons" style="font-size:18px">close</span>
                    </button>
                </div>
            </div>

            <!-- Sub Tabs Modal -->
            <div class="flex items-center gap-2 px-6 pt-4 border-b border-slate-800 bg-slate-950">
                <button id="modal-tab-whs" class="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-primary text-slate-950 shadow-md">
                    <span class="material-icons" style="font-size:16px">analytics</span> Historial WHS & Tarjetas (${s.length})
                </button>
                <button id="modal-tab-payments" class="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-slate-900 text-slate-400 border border-slate-800 hover:text-white">
                    <span class="material-icons" style="font-size:16px">payments</span> Pagos de Cuotas (${S.length})
                </button>
            </div>

            <!-- Body Content -->
            <div class="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
                <!-- TAB WHS HANDICAP -->
                <div id="modal-content-whs" class="space-y-6">
                    <!-- Course Handicap Per Tee Selector (Estilo SpeiHandicap Badges) -->
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Calculadora de Handicap de Campo por Marca de Salida (Tees)</p>
                        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            ${x.map(e=>`
                                <div class="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-1">
                                    <span class="px-2.5 py-0.5 rounded-md font-black text-[10px] uppercase shadow-md ${e.bg}">${e.color}</span>
                                    <p class="text-2xl font-black ${e.text} mt-1">${e.ch}</p>
                                    <p class="text-[8px] font-bold text-slate-500 uppercase">${e.rating} / ${e.slope}</p>
                                </div>
                            `).join(``)}
                        </div>
                    </div>

                    <!-- 20 Recent WHS Rounds Table (Estilo SpeiHandicap) -->
                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-black text-white uppercase text-xs tracking-wider flex items-center gap-2">
                                <span class="material-icons text-amber-400 text-sm">history_edu</span> Historial de Rondas WHS Registradas
                            </h4>
                            <span class="text-[10px] font-bold text-slate-400 uppercase">🌟 Las rondas verdes promedian tu Handicap Index</span>
                        </div>

                        ${s.length===0?`
                            <div class="py-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl">
                                <span class="material-icons text-slate-600 text-4xl mb-2">golf_course</span>
                                <p class="text-xs text-slate-500 font-bold uppercase tracking-wider">Aún no hay tarjetas capturadas para este socio.</p>
                            </div>
                        `:`
                            <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                                <table class="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr class="bg-slate-950/80 border-b border-slate-800 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                            <th class="px-4 py-3">Fecha</th>
                                            <th class="px-4 py-3">Campo</th>
                                            <th class="px-4 py-3 text-center">Tee</th>
                                            <th class="px-4 py-3 text-center">RTG / SLO</th>
                                            <th class="px-4 py-3 text-center">Score (SA)</th>
                                            <th class="px-4 py-3 text-center">Diferencial</th>
                                            <th class="px-4 py-3 text-right">Detalle</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-800/60">
                                        ${s.map(e=>{let t=y.has(e.id),n=parseFloat(e.differential||0).toFixed(1),r=e.tee_color||`BLANCO`;return`
                                                <tr class="hover:bg-slate-800/40 transition-colors ${t?`bg-emerald-500/5`:``}">
                                                    <td class="px-4 py-3 text-slate-300 font-bold">${new Date(e.date_played+`T00:00:00`).toLocaleDateString(`es-MX`,{day:`2-digit`,month:`short`,year:`numeric`})}</td>
                                                    <td class="px-4 py-3 font-black text-white uppercase text-xs">${e.course_name||`CLUB DE GOLF COLIMA`}</td>
                                                    <td class="px-4 py-3 text-center">
                                                        <span class="px-2.5 py-0.5 rounded-md font-black text-[9px] uppercase bg-slate-800 text-slate-300 border border-slate-700">${r}</span>
                                                    </td>
                                                    <td class="px-4 py-3 text-center font-bold text-slate-400">${e.course_rating||70.5} / ${e.slope_rating||113}</td>
                                                    <td class="px-4 py-3 text-center font-black text-white text-sm">${e.gross_score}</td>
                                                    <td class="px-4 py-3 text-center font-black text-sm ${t?`text-emerald-400`:`text-slate-400`}">
                                                        ${t?`🌟 `:``}${n}
                                                    </td>
                                                    <td class="px-4 py-3 text-right">
                                                        ${e.hole_scores?`
                                                            <button onclick="window.toggleHoleDetail('${e.id}')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-300 transition-all">
                                                                Ver Hoyos
                                                            </button>
                                                        `:`—`}
                                                    </td>
                                                </tr>
                                                ${e.hole_scores?`
                                                    <tr id="hole-detail-${e.id}" class="hidden bg-slate-950/80">
                                                        <td colspan="7" class="p-4">
                                                            <div class="text-[10px] font-black text-slate-400 uppercase mb-2">Desglose 18 Hoyos:</div>
                                                            <div class="grid grid-cols-9 sm:grid-cols-18 gap-1.5 text-center text-xs">
                                                                ${Object.entries(e.hole_scores).map(([e,t])=>`
                                                                    <div class="p-1.5 bg-slate-900 border border-slate-800 rounded-lg">
                                                                        <p class="text-[8px] font-bold text-slate-500">${e.replace(`h`,`#`)}</p>
                                                                        <p class="font-black text-emerald-400">${t||`—`}</p>
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
                        `}
                    </div>
                </div>

                <!-- TAB PAYMENTS CUOTAS -->
                <div id="modal-content-payments" class="hidden space-y-4">
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="font-black text-white uppercase text-xs tracking-wider flex items-center gap-2">
                            <span class="material-icons text-emerald-400 text-sm">history</span> Historial de Pagos Recaudados
                        </h4>
                        <button onclick="document.getElementById('modal-member-crud').classList.add('hidden'); window.payMemberModal('${t.id}');"
                            class="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 rounded-lg font-black text-[10px] uppercase flex items-center gap-1 transition-all">
                            <span class="material-icons" style="font-size:14px">add</span> Registrar Nuevo Pago
                        </button>
                    </div>

                    ${S.length===0?`
                        <div class="py-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl">
                            <p class="text-xs text-slate-500 font-bold uppercase tracking-wider">Sin pagos registrados en el historial</p>
                        </div>
                    `:`
                        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                            <table class="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr class="bg-slate-950/60 border-b border-slate-800 text-[9px] font-black uppercase text-slate-500 tracking-wider">
                                        <th class="px-4 py-3">Fecha de Pago</th>
                                        <th class="px-4 py-3">Monto ($)</th>
                                        <th class="px-4 py-3">Periodo</th>
                                        <th class="px-4 py-3">Nueva Vigencia</th>
                                        <th class="px-4 py-3">Notas</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-800/60">
                                    ${S.map(e=>`
                                        <tr class="hover:bg-slate-800/40 transition-colors">
                                            <td class="px-4 py-3 text-slate-400 font-bold">${new Date(e.created_at).toLocaleDateString(`es-MX`,{day:`2-digit`,month:`short`,year:`numeric`})}</td>
                                            <td class="px-4 py-3 font-black text-amber-400">$${parseFloat(e.amount||0).toLocaleString(`es-MX`,{minimumFractionDigits:2})}</td>
                                            <td class="px-4 py-3 text-slate-300 font-bold uppercase">${e.months_added||1} mes(es) (${e.period_type||`MENSUAL`})</td>
                                            <td class="px-4 py-3 font-black text-emerald-400 uppercase">${new Date(e.paid_until_new+`T00:00:00`).toLocaleDateString(`es-MX`,{day:`2-digit`,month:`short`,year:`numeric`})}</td>
                                            <td class="px-4 py-3 text-slate-500 font-bold">${e.notes||`—`}</td>
                                        </tr>
                                    `).join(``)}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            </div>

            <!-- Footer Actions -->
            <div class="p-5 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3">
                <div class="flex gap-2">
                    <button onclick="document.getElementById('modal-member-crud').classList.add('hidden'); window.editMemberModal('${t.id}');"
                        class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 transition-all">
                        <span class="material-icons" style="font-size:16px">edit</span> Editar Datos
                    </button>
                    <button onclick="document.getElementById('modal-member-crud').classList.add('hidden'); window.deleteMemberModal('${t.id}', '${t.name.replace(/'/g,`\\'`)}');"
                        class="px-4 py-2.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 transition-all">
                        <span class="material-icons" style="font-size:16px">delete</span> Dar de Baja
                    </button>
                </div>
                <button onclick="document.getElementById('modal-member-crud').classList.add('hidden')"
                    class="px-6 py-2.5 bg-primary text-slate-900 rounded-xl font-black text-xs uppercase hover:bg-primary/90 transition-all">
                    Cerrar
                </button>
            </div>
        </div>
    `;let C=document.getElementById(`modal-tab-whs`),w=document.getElementById(`modal-tab-payments`),T=document.getElementById(`modal-content-whs`),E=document.getElementById(`modal-content-payments`);C.onclick=()=>{C.className=`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-primary text-slate-950 shadow-md`,w.className=`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-slate-900 text-slate-400 border border-slate-800 hover:text-white`,T.classList.remove(`hidden`),E.classList.add(`hidden`)},w.onclick=()=>{w.className=`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-primary text-slate-950 shadow-md`,C.className=`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-slate-900 text-slate-400 border border-slate-800 hover:text-white`,E.classList.remove(`hidden`),T.classList.add(`hidden`)},n.classList.remove(`hidden`)},window.toggleHoleDetail=function(e){let t=document.getElementById(`hole-detail-${e}`);t&&t.classList.toggle(`hidden`)},window.payMemberModal=function(e){let t=f.find(t=>String(t.id)===String(e));if(!t)return;let n=document.getElementById(`modal-member-crud`);n||(n=document.createElement(`div`),n.id=`modal-member-crud`,n.className=`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in`,document.body.appendChild(n));let i=t.paid_until?new Date(t.paid_until+`T00:00:00`):new Date;n.innerHTML=`
        <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <span class="material-icons">payments</span>
                    </div>
                    <div>
                        <h3 class="font-black uppercase text-white text-base">Registrar Pago</h3>
                        <p class="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">${t.name} (#${t.member_number})</p>
                    </div>
                </div>
                <button onclick="document.getElementById('modal-member-crud').classList.add('hidden')" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                    <span class="material-icons" style="font-size:18px">close</span>
                </button>
            </div>

            <form id="form-pay-member" class="p-6 space-y-4">
                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Periodo a Abonar</label>
                    <div class="grid grid-cols-3 gap-2 mb-3">
                        <button type="button" data-months="1" class="btn-period p-3 bg-slate-800 hover:bg-primary/20 border border-slate-700 hover:border-primary rounded-xl text-center font-black text-xs text-white uppercase transition-all flex flex-col items-center">
                            +1 Mes
                        </button>
                        <button type="button" data-months="3" class="btn-period p-3 bg-slate-800 hover:bg-primary/20 border border-slate-700 hover:border-primary rounded-xl text-center font-black text-xs text-white uppercase transition-all flex flex-col items-center">
                            +3 Meses
                        </button>
                        <button type="button" data-months="12" class="btn-period p-3 bg-slate-800 hover:bg-primary/20 border border-slate-700 hover:border-primary rounded-xl text-center font-black text-xs text-white uppercase transition-all flex flex-col items-center">
                            +1 Año
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Meses a Agregar</label>
                        <input id="pay-months" type="number" min="1" value="1" required class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Monto Pagado ($)</label>
                        <input id="pay-amount" type="number" step="50" value="1500" required class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                    </div>
                </div>

                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nueva Fecha Límite de Pago</label>
                    <input id="pay-new-date" type="date" required class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-emerald-400 focus:outline-none focus:border-primary">
                </div>

                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Notas / Recibo (Opcional)</label>
                    <input id="pay-notes" type="text" placeholder="Ej. Transferencia Banco BBVA #1234" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-primary">
                </div>

                <div class="pt-4 border-t border-slate-800 flex justify-end gap-3">
                    <button type="button" onclick="document.getElementById('modal-member-crud').classList.add('hidden')" class="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-xs uppercase">Cancelar</button>
                    <button type="submit" class="px-6 py-3 bg-emerald-500 text-slate-950 rounded-xl font-black text-xs uppercase hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">Aplicar Pago</button>
                </div>
            </form>
        </div>
    `,n.classList.remove(`hidden`);let a=()=>{let e=parseInt(document.getElementById(`pay-months`).value)||1,t=new Date(i);t.setMonth(t.getMonth()+e),document.getElementById(`pay-new-date`).value=t.toISOString().split(`T`)[0]};a(),document.querySelectorAll(`.btn-period`).forEach(e=>{e.onclick=()=>{let t=parseInt(e.dataset.months);document.getElementById(`pay-months`).value=t,a()}}),document.getElementById(`pay-months`).oninput=a,document.getElementById(`form-pay-member`).onsubmit=async e=>{e.preventDefault();let i=parseInt(document.getElementById(`pay-months`).value)||1,a=parseFloat(document.getElementById(`pay-amount`).value)||0,o=document.getElementById(`pay-new-date`).value,s=document.getElementById(`pay-notes`).value.trim(),{error:c}=await u.from(`members`).update({paid_until:o,status:`ACTIVE`}).eq(`id`,t.id);if(c){window.showNotification(`Error`,`No se pudo actualizar la cuota del socio: `+c.message,`error`);return}await u.from(`member_payments`).insert([{member_id:t.id,amount:a,period_type:t.payment_frequency||`MENSUAL`,months_added:i,paid_until_new:o,notes:s}]),window.showNotification(`¡Pago Registrado!`,`El socio ${t.name} está al corriente hasta ${o}.`,`success`),n.classList.add(`hidden`),await r()}},window.editMemberModal=function(e){let t=f.find(t=>String(t.id)===String(e));if(!t)return;let n=document.getElementById(`modal-member-crud`);n||(n=document.createElement(`div`),n.id=`modal-member-crud`,n.className=`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in`,document.body.appendChild(n)),n.innerHTML=`
        <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <span class="material-icons">edit</span>
                    </div>
                    <div>
                        <h3 class="font-black uppercase text-white text-base">Editar Socio</h3>
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">${t.name}</p>
                    </div>
                </div>
                <button onclick="document.getElementById('modal-member-crud').classList.add('hidden')" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                    <span class="material-icons" style="font-size:18px">close</span>
                </button>
            </div>

            <form id="form-edit-member" class="p-6 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"># Socio</label>
                        <input id="em-num" type="text" value="${t.member_number}" required class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Categoría</label>
                        <select id="em-cat" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                            <option value="SOCIO TITULAR" ${t.category===`SOCIO TITULAR`?`selected`:``}>SOCIO TITULAR</option>
                            <option value="SOCIO DAMA" ${t.category===`SOCIO DAMA`?`selected`:``}>SOCIO DAMA</option>
                            <option value="SOCIO JUVENIL" ${t.category===`SOCIO JUVENIL`?`selected`:``}>SOCIO JUVENIL</option>
                            <option value="SOCIO HONORARIO" ${t.category===`SOCIO HONORARIO`?`selected`:``}>SOCIO HONORARIO</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nombre Completo</label>
                    <input id="em-name" type="text" value="${t.name}" required class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Correo</label>
                        <input id="em-email" type="email" value="${t.email||``}" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Teléfono</label>
                        <input id="em-phone" type="tel" value="${t.phone||``}" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-primary">
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Frecuencia</label>
                        <select id="em-freq" class="w-full px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                            <option value="MENSUAL" ${t.payment_frequency===`MENSUAL`?`selected`:``}>MENSUAL</option>
                            <option value="BIMESTRAL" ${t.payment_frequency===`BIMESTRAL`?`selected`:``}>BIMESTRAL</option>
                            <option value="TRIMESTRAL" ${t.payment_frequency===`TRIMESTRAL`?`selected`:``}>TRIMESTRAL</option>
                            <option value="ANUAL" ${t.payment_frequency===`ANUAL`?`selected`:``}>ANUAL</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Pagado Hasta</label>
                        <input id="em-paid" type="date" value="${t.paid_until||``}" required class="w-full px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Handicap Index</label>
                        <input id="em-hdcp" type="number" step="0.1" value="${t.current_handicap===void 0?0:t.current_handicap}" class="w-full px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-primary">
                    </div>
                </div>

                <div class="pt-4 border-t border-slate-800 flex justify-end gap-3">
                    <button type="button" onclick="document.getElementById('modal-member-crud').classList.add('hidden')" class="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-xs uppercase">Cancelar</button>
                    <button type="submit" class="px-6 py-3 bg-blue-500 text-white rounded-xl font-black text-xs uppercase hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20">Guardar Cambios</button>
                </div>
            </form>
        </div>
    `,n.classList.remove(`hidden`),document.getElementById(`form-edit-member`).onsubmit=async e=>{e.preventDefault();let i={member_number:document.getElementById(`em-num`).value.trim(),name:document.getElementById(`em-name`).value.trim(),email:document.getElementById(`em-email`).value.trim(),phone:document.getElementById(`em-phone`).value.trim(),category:document.getElementById(`em-cat`).value,payment_frequency:document.getElementById(`em-freq`).value,paid_until:document.getElementById(`em-paid`).value,current_handicap:parseFloat(document.getElementById(`em-hdcp`).value)||0},{error:a}=await u.from(`members`).update(i).eq(`id`,t.id);if(a){window.showNotification(`Error`,`No se pudieron guardar los cambios: `+a.message,`error`);return}window.showNotification(`¡Socio Actualizado!`,`Se modificaron los datos de ${i.name}.`,`success`),n.classList.add(`hidden`),await r()}},window.deleteMemberModal=function(e,t){window.showNotification(`Dar de Baja Socio`,`¿Estás seguro de dar de baja al socio ${t}? Esto eliminará su registro de membresía.`,`confirm`,async()=>{let{error:n}=await u.from(`members`).delete().eq(`id`,e);if(n){window.showNotification(`Error`,`No se pudo eliminar el socio: `+n.message,`error`);return}window.showNotification(`Socio Eliminado`,`Se dio de baja a ${t}.`,`success`),await r()})}}))();export{n as renderMembersModule};