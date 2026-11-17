// ================================================
// MÓDULO DE GESTIÓN DE NOTICIAS, ARTÍCULOS & EVENTOS
// Schema: colimaGC.noticias
// Almacenamiento de imágenes: Hostinger /uploads/ con compresión WebP
// ================================================

export const renderNoticiasModule = async (container, db, supabaseClient, showNotification) => {
    let allRecords = [];
    let activeTab = 'noticias'; // 'noticias' | 'eventos' | 'galeria'
    
    let editingNoticiaId = null;
    let editingEventoId = null;
    let editingGaleriaId = null;

    // Array of image objects for Noticia (up to 9): { type: 'url'|'file', url?: string, file?: File, preview: string }
    let currentNoticiaImages = [];
    
    // Single image object for Evento: { type: 'url'|'file', url?: string, file?: File, preview: string } | null
    let currentEventoImage = null;

    // Array of image objects for Galeria (up to 50): { type: 'url'|'file', url?: string, file?: File, preview: string }
    let currentGaleriaImages = [];

    const notify = showNotification || window.showNotification || alert;

    const parseImages = (item) => {
        if (item.galeria && Array.isArray(item.galeria) && item.galeria.length > 0) {
            return item.galeria.filter(Boolean);
        }
        if (typeof item.galeria === 'string' && item.galeria.trim()) {
            try {
                const parsed = JSON.parse(item.galeria);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed.filter(Boolean);
            } catch (e) {}
        }
        if (item.imagen_url && item.imagen_url.trim()) {
            if (item.imagen_url.startsWith('[')) {
                try {
                    const parsed = JSON.parse(item.imagen_url);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed.filter(Boolean);
                } catch (e) {}
            }
            return [item.imagen_url];
        }
        return ['./imagenes/feria.jpeg'];
    };

    const loadRecords = async () => {
        try {
            const { data, error } = await db.from('noticias').select('*').order('fecha_publicacion', { ascending: false }).order('created_at', { ascending: false });
            if (!error && data) {
                allRecords = data;
            } else {
                console.warn('Error loading records from Supabase:', error);
                allRecords = [];
            }
        } catch (err) {
            console.error('Failed to load records:', err);
            allRecords = [];
        }
    };

    await loadRecords();

    // Compression helper
    const compressImageFile = async (file, maxWidth = 1920, maxHeight = 1280, quality = 0.85) => {
        return new Promise((resolve) => {
            if (!file.type.startsWith('image/')) {
                resolve({ file, preview: URL.createObjectURL(file) });
                return;
            }

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth || height > maxHeight) {
                        if (width / maxWidth > height / maxHeight) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        } else {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);

                    const outputMime = 'image/webp';
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
                                const compressedFile = new File([blob], cleanName, {
                                    type: outputMime,
                                    lastModified: Date.now(),
                                });
                                const previewUrl = canvas.toDataURL(outputMime, quality);
                                resolve({ file: compressedFile, preview: previewUrl, size: blob.size });
                            } else {
                                resolve({ file, preview: event.target.result, size: file.size });
                            }
                        },
                        outputMime,
                        quality
                    );
                };
                img.onerror = () => resolve({ file, preview: event.target.result, size: file.size });
            };
            reader.onerror = () => resolve({ file, preview: '', size: file.size });
        });
    };

    const isGaleria = (item) => item.subtitulo?.toUpperCase() === 'GALERIA';
    const isEvento = (item) => !isGaleria(item) && (item.subtitulo?.toUpperCase() === 'EVENTO' || item.subtitulo?.toUpperCase().includes('EVENTO'));

    const renderUI = () => {
        const noticiasList = allRecords.filter(r => !isEvento(r) && !isGaleria(r));
        const eventosList = allRecords.filter(r => isEvento(r));
        const galeriaList = allRecords.filter(r => isGaleria(r));

        const totalNoticias = noticiasList.length;
        const activasNoticias = noticiasList.filter(n => n.activo).length;
        const totalEventos = eventosList.length;
        const activasEventos = eventosList.filter(e => e.activo).length;
        const totalGaleria = galeriaList.length;
        const activasGaleria = galeriaList.filter(g => g.activo).length;

        container.innerHTML = `
            <div class="animate-fade-in space-y-6 max-w-7xl mx-auto">
                <!-- Header with Action Buttons -->
                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
                    <div class="space-y-1.5">
                        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest">
                            <span class="material-icons text-xs">feed</span> Comunicación & Eventos
                        </div>
                        <h2 class="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">Gestión de Noticias & Eventos</h2>
                        <p class="text-slate-400 text-xs mt-1 max-w-2xl leading-relaxed">
                            Crea y administra los comunicados y los próximos eventos del Club de Golf Colima. Las imágenes se comprimen automáticamente y se sincronizan con la página oficial.
                        </p>
                    </div>
                    <div class="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
                        <button id="btn-open-modal-noticia" class="flex items-center gap-1.5 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-amber-500/20 cursor-pointer whitespace-nowrap">
                            <span class="material-icons text-base">newspaper</span> + Noticia
                        </button>
                        <button id="btn-open-modal-evento" class="flex items-center gap-1.5 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer whitespace-nowrap">
                            <span class="material-icons text-base">event</span> + Evento
                        </button>
                        <button id="btn-open-modal-galeria" class="flex items-center gap-1.5 px-4 py-3 bg-purple-500 hover:bg-purple-400 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-purple-500/20 cursor-pointer whitespace-nowrap">
                            <span class="material-icons text-base">photo_library</span> + Galería
                        </button>
                    </div>
                </div>

                <!-- Stats Quick Overview -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-lg">
                        <div>
                            <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Noticias Publicadas</p>
                            <h3 class="text-2xl font-black text-amber-400 mt-1">${activasNoticias} <span class="text-xs font-bold text-slate-400">/ ${totalNoticias}</span></h3>
                            <p class="text-[10px] font-bold text-slate-400 mt-0.5">Visibles en sitio web</p>
                        </div>
                        <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                            <span class="material-icons">newspaper</span>
                        </div>
                    </div>

                    <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-lg">
                        <div>
                            <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Próximos Eventos</p>
                            <h3 class="text-2xl font-black text-emerald-400 mt-1">${activasEventos} <span class="text-xs font-bold text-slate-400">/ ${totalEventos}</span></h3>
                            <p class="text-[10px] font-bold text-slate-400 mt-0.5">En cartelera web</p>
                        </div>
                        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <span class="material-icons">event</span>
                        </div>
                    </div>

                    <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-lg">
                        <div>
                            <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Álbumes en Galería</p>
                            <h3 class="text-2xl font-black text-purple-400 mt-1">${activasGaleria} <span class="text-xs font-bold text-slate-400">/ ${totalGaleria}</span></h3>
                            <p class="text-[10px] font-bold text-slate-400 mt-0.5">Eventosgaleria (${allRecords.length} total)</p>
                        </div>
                        <div class="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                            <span class="material-icons">photo_library</span>
                        </div>
                    </div>
                </div>

                <!-- Navigation Tabs (Noticias vs Eventos vs Galería) -->
                <div class="flex p-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 max-w-xl shadow-inner">
                    <button id="tab-btn-noticias" class="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'noticias' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'}">
                        <span class="material-icons text-sm">newspaper</span> Noticias (${totalNoticias})
                    </button>
                    <button id="tab-btn-eventos" class="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'eventos' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}">
                        <span class="material-icons text-sm">event</span> Eventos (${totalEventos})
                    </button>
                    <button id="tab-btn-galeria" class="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'galeria' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white'}">
                        <span class="material-icons text-sm">photo_library</span> Galería (${totalGaleria})
                    </button>
                </div>

                <!-- TAB 1: NOTICIAS LIST -->
                <div id="tab-content-noticias" class="${activeTab === 'noticias' ? 'block' : 'hidden'} space-y-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-xl font-black text-white uppercase tracking-tight">Artículos y Noticias Publicadas</h3>
                            <p class="text-slate-500 text-xs mt-0.5">Notas informativas con galerías de hasta 9 fotografías.</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${noticiasList.length === 0 ? `
                            <div class="col-span-full py-16 flex flex-col items-center justify-center gap-4 text-center bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                                <div class="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500">
                                    <span class="material-icons text-3xl">feed</span>
                                </div>
                                <div class="space-y-1">
                                    <h4 class="text-base font-black text-slate-300 uppercase">Aún no hay noticias creadas</h4>
                                    <p class="text-xs text-slate-500 max-w-sm">Comienza agregando el primer artículo para que aparezca en el sitio web de Colima Golf Club.</p>
                                </div>
                                <button id="btn-crear-primer-noticia" class="mt-2 px-6 py-3 bg-amber-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform cursor-pointer">
                                    Crear Primera Noticia
                                </button>
                            </div>
                        ` : noticiasList.map(n => {
                            const dateFormatted = n.fecha_publicacion
                                ? new Date(n.fecha_publicacion + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
                                : 'Fecha no especificada';
                            const imgs = parseImages(n);
                            const imgSrc = imgs[0] || './imagenes/DJI_0001.JPG';
                            const author = n.autor || 'Club Colima';
                            const snippet = n.contenido ? (n.contenido.length > 110 ? n.contenido.substring(0, 110) + '...' : n.contenido) : '';

                            return `
                                <div class="bg-slate-900 border ${n.activo ? 'border-slate-800 hover:border-amber-500/40' : 'border-red-950/40 opacity-70'} rounded-3xl overflow-hidden shadow-xl transition-all flex flex-col justify-between group">
                                    <div>
                                        <div class="relative aspect-video w-full overflow-hidden bg-slate-950 border-b border-slate-800">
                                            <img src="${imgSrc}" alt="${n.titulo}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="this.src='./golcolima.jpg'">
                                            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                                            
                                            <div class="absolute top-3 right-3 flex items-center gap-1.5">
                                                ${imgs.length > 1 ? `
                                                    <span class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-950/80 text-amber-300 border border-amber-500/30 backdrop-blur-md flex items-center gap-1">
                                                        <span class="material-icons" style="font-size:12px">collections</span> ${imgs.length}
                                                    </span>
                                                ` : ''}
                                                <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${n.activo ? 'bg-emerald-500/90 text-slate-950 shadow-lg' : 'bg-slate-800/90 text-slate-400 border border-slate-700'} backdrop-blur-md">
                                                    ${n.activo ? '● Publicada' : '○ Pausada'}
                                                </span>
                                            </div>
                                        </div>

                                        <div class="p-6 space-y-2.5">
                                            <div class="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                <span class="material-icons text-xs text-amber-400">calendar_today</span>
                                                <span>${dateFormatted}</span>
                                                <span>·</span>
                                                <span class="text-slate-500">${author}</span>
                                            </div>

                                            <h4 class="text-lg font-black text-white uppercase tracking-tight leading-snug line-clamp-2 group-hover:text-amber-400 transition-colors">
                                                ${n.titulo}
                                            </h4>

                                            <p class="text-xs text-slate-400 leading-relaxed line-clamp-2 font-medium">
                                                ${snippet}
                                            </p>
                                        </div>
                                    </div>

                                    <div class="px-6 py-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-2">
                                        <button data-toggle-id="${n.id}" data-activo="${n.activo}" class="btn-toggle-record text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${n.activo ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'} transition-colors cursor-pointer">
                                            <span class="material-icons text-sm">${n.activo ? 'visibility_off' : 'visibility'}</span>
                                            ${n.activo ? 'Pausar' : 'Activar'}
                                        </button>

                                        <div class="flex items-center gap-1.5">
                                            <button data-edit-noticia-id="${n.id}" class="btn-edit-noticia p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer" title="Editar Noticia">
                                                <span class="material-icons text-sm">edit</span>
                                            </button>
                                            <button data-delete-id="${n.id}" data-title="${n.titulo}" class="btn-delete-record p-2 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded-xl transition-all cursor-pointer" title="Eliminar Noticia">
                                                <span class="material-icons text-sm">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- TAB 2: EVENTOS LIST -->
                <div id="tab-content-eventos" class="${activeTab === 'eventos' ? 'block' : 'hidden'} space-y-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-xl font-black text-white uppercase tracking-tight">Próximos Eventos Registrados</h3>
                            <p class="text-slate-500 text-xs mt-0.5">Publicaciones para la sección Cartelera / Próximos Eventos (2 columnas × 2 filas).</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${eventosList.length === 0 ? `
                            <div class="col-span-full py-16 flex flex-col items-center justify-center gap-4 text-center bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                                <div class="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500">
                                    <span class="material-icons text-3xl">event</span>
                                </div>
                                <div class="space-y-1">
                                    <h4 class="text-base font-black text-slate-300 uppercase">Aún no hay eventos creados</h4>
                                    <p class="text-xs text-slate-500 max-w-sm">Crea tu primer evento para que aparezca en la sección de PRÓXIMOS EVENTOS de la landing page.</p>
                                </div>
                                <button id="btn-crear-primer-evento" class="mt-2 px-6 py-3 bg-emerald-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform cursor-pointer">
                                    Crear Primer Evento
                                </button>
                            </div>
                        ` : eventosList.map(e => {
                            const dateLabel = (e.autor && e.autor !== 'Administrador' && e.autor !== 'Club de Golf Colima') ? e.autor : (e.fecha_publicacion || 'Próximamente');
                            const imgSrc = e.imagen_url || (e.galeria && e.galeria[0]) || './imagenes/feria.jpeg';
                            const snippet = e.contenido ? (e.contenido.length > 120 ? e.contenido.substring(0, 120) + '...' : e.contenido) : '';

                            return `
                                <div class="bg-slate-900 border ${e.activo ? 'border-slate-800 hover:border-emerald-500/40' : 'border-red-950/40 opacity-70'} rounded-3xl overflow-hidden shadow-xl transition-all flex flex-col justify-between group">
                                    <div>
                                        <div class="relative aspect-[4/3] w-full overflow-hidden bg-slate-950 border-b border-slate-800">
                                            <img src="${imgSrc}" alt="${e.titulo}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="this.src='./golcolima.jpg'">
                                            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>
                                            
                                            <div class="absolute top-3 right-3">
                                                <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${e.activo ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'bg-slate-800/90 text-slate-400 border border-slate-700'} backdrop-blur-md">
                                                    ${e.activo ? '● Publicado' : '○ Pausado'}
                                                </span>
                                            </div>

                                            <div class="absolute bottom-3 left-3">
                                                <span class="px-3 py-1 bg-purple-500/30 border border-purple-400/40 text-purple-300 rounded-xl text-[9px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg">
                                                    ${dateLabel}
                                                </span>
                                            </div>
                                        </div>

                                        <div class="p-6 space-y-2">
                                            <h4 class="text-lg font-black text-white uppercase tracking-tight leading-snug line-clamp-2 group-hover:text-emerald-400 transition-colors">
                                                ${e.titulo}
                                            </h4>
                                            <p class="text-xs text-slate-400 leading-relaxed line-clamp-3 font-medium">
                                                ${snippet}
                                            </p>
                                        </div>
                                    </div>

                                    <div class="px-6 py-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-2">
                                        <button data-toggle-id="${e.id}" data-activo="${e.activo}" class="btn-toggle-record text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${e.activo ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'} transition-colors cursor-pointer">
                                            <span class="material-icons text-sm">${e.activo ? 'visibility_off' : 'visibility'}</span>
                                            ${e.activo ? 'Pausar' : 'Activar'}
                                        </button>

                                        <div class="flex items-center gap-1.5">
                                            <button data-edit-evento-id="${e.id}" class="btn-edit-evento p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer" title="Editar Evento">
                                                <span class="material-icons text-sm">edit</span>
                                            </button>
                                            <button data-delete-id="${e.id}" data-title="${e.titulo}" class="btn-delete-record p-2 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded-xl transition-all cursor-pointer" title="Eliminar Evento">
                                                <span class="material-icons text-sm">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- TAB 3: GALERÍA DE EVENTOS -->
                <div id="tab-content-galeria" class="${activeTab === 'galeria' ? 'block' : 'hidden'} space-y-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-xl font-black text-white uppercase tracking-tight">Galería de Eventos</h3>
                            <p class="text-slate-500 text-xs mt-0.5">Álbumes fotográficos guardados en <code class="text-purple-400">/imagenes/Eventosgaleria/</code> y mostrados en la sección Eventos del sitio web.</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${galeriaList.length === 0 ? `
                            <div class="col-span-full py-16 flex flex-col items-center justify-center gap-4 text-center bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                                <div class="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-purple-400">
                                    <span class="material-icons text-3xl">photo_library</span>
                                </div>
                                <div class="space-y-1">
                                    <h4 class="text-base font-black text-slate-300 uppercase">Aún no hay álbumes en la galería</h4>
                                    <p class="text-xs text-slate-500 max-w-md">Sube fotografías de tus torneos y eventos. Se comprimirán automáticamente y se guardarán en <span class="text-purple-400">imagenes/Eventosgaleria</span>.</p>
                                </div>
                                <button id="btn-crear-primer-galeria" class="mt-2 px-6 py-3 bg-purple-500 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform cursor-pointer">
                                    Subir Fotos a Galería
                                </button>
                            </div>
                        ` : galeriaList.map(g => {
                            const imgs = parseImages(g);
                            const imgSrc = imgs[0] || './imagenes/feria.jpeg';
                            const fechaText = g.fecha_publicacion
                                ? new Date(g.fecha_publicacion + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                                : '';

                            return `
                                <div class="bg-slate-900 border ${g.activo ? 'border-slate-800 hover:border-purple-500/40' : 'border-red-950/40 opacity-70'} rounded-3xl overflow-hidden shadow-xl transition-all flex flex-col justify-between group">
                                    <div>
                                        <div class="relative aspect-video w-full overflow-hidden bg-slate-950 border-b border-slate-800">
                                            <img src="${imgSrc}" alt="${g.titulo}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="this.src='./golcolima.jpg'">
                                            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                                            <div class="absolute top-3 right-3 flex items-center gap-1.5">
                                                <span class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-950/80 text-purple-300 border border-purple-500/30 backdrop-blur-md flex items-center gap-1">
                                                    <span class="material-icons" style="font-size:12px">collections</span> ${imgs.length} fotos
                                                </span>
                                                <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${g.activo ? 'bg-purple-500/90 text-white shadow-lg' : 'bg-slate-800/90 text-slate-400 border border-slate-700'} backdrop-blur-md">
                                                    ${g.activo ? '● Visible' : '○ Oculta'}
                                                </span>
                                            </div>
                                        </div>

                                        <div class="p-6 space-y-2">
                                            ${fechaText ? `
                                                <div class="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    <span class="material-icons text-xs text-purple-400">calendar_today</span>
                                                    <span>${fechaText}</span>
                                                </div>
                                            ` : ''}
                                            <h4 class="text-lg font-black text-white uppercase tracking-tight leading-snug line-clamp-2 group-hover:text-purple-400 transition-colors">
                                                ${g.titulo}
                                            </h4>
                                        </div>
                                    </div>

                                    <div class="px-6 py-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-2">
                                        <button data-toggle-id="${g.id}" data-activo="${g.activo}" class="btn-toggle-record text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${g.activo ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'} transition-colors cursor-pointer">
                                            <span class="material-icons text-sm">${g.activo ? 'visibility_off' : 'visibility'}</span>
                                            ${g.activo ? 'Ocultar' : 'Mostrar'}
                                        </button>

                                        <div class="flex items-center gap-1.5">
                                            <button data-edit-galeria-id="${g.id}" class="btn-edit-galeria p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer" title="Editar Galería">
                                                <span class="material-icons text-sm">edit</span>
                                            </button>
                                            <button data-delete-id="${g.id}" data-title="${g.titulo}" class="btn-delete-record p-2 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded-xl transition-all cursor-pointer" title="Eliminar Galería">
                                                <span class="material-icons text-sm">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>

            <!-- 1. MODAL NOTICIA (HASTA 9 FOTOS) -->
            <div id="modal-noticia" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 hidden">
                <div class="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
                    <div class="px-6 sm:px-8 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                                <span class="material-icons text-xl" id="modal-noticia-icon">newspaper</span>
                            </div>
                            <div>
                                <h3 class="text-lg font-black text-white uppercase tracking-tight" id="modal-noticia-title">Nueva Noticia</h3>
                                <p class="text-[10px] text-slate-400 uppercase tracking-wider">Galería de hasta 9 fotos</p>
                            </div>
                        </div>
                        <button id="btn-close-modal-noticia" class="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
                            <span class="material-icons">close</span>
                        </button>
                    </div>

                    <form id="form-noticia" class="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
                        <!-- Galería Noticia -->
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Galería de Fotos <span class="text-amber-400">(Hasta 9 fotos · 1ª es portada)</span>
                                </label>
                                <span id="noticia-photo-count-badge" class="text-[10px] font-black text-slate-400 uppercase">0 / 9 fotos</span>
                            </div>

                            <div id="noticia-photos-preview-grid" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3"></div>

                            <div id="noticia-image-dropzone" class="border-2 border-dashed border-slate-700 hover:border-amber-400/60 rounded-2xl p-5 text-center cursor-pointer transition-all bg-slate-950/60 relative overflow-hidden group">
                                <input type="file" id="input-noticia-image-file" multiple accept="image/jpeg,image/png,image/webp,image/jpg" class="hidden">
                                <div class="py-3 space-y-1.5">
                                    <div class="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span class="material-icons text-xl">add_photo_alternate</span>
                                    </div>
                                    <p class="text-xs font-bold text-white uppercase tracking-wider">Haz clic para agregar fotos o arrástralas aquí</p>
                                    <p class="text-[10px] text-slate-500">Selecciona fotos (se optimizarán automáticamente en formato WebP liviano)</p>
                                </div>
                            </div>
                        </div>

                        <!-- Título -->
                        <div class="space-y-1.5">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Título del Artículo *</label>
                            <input type="text" id="input-noticia-titulo" required class="w-full px-4 py-3.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-all font-bold text-sm" placeholder="Ej. ¡Arrancó con gran éxito el Ranking Stroke Play!">
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div class="space-y-1.5">
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha *</label>
                                <input type="date" id="input-noticia-fecha" required class="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-all font-bold text-xs">
                            </div>

                            <div class="space-y-1.5">
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Autor / Redactor</label>
                                <input type="text" id="input-noticia-autor" class="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-all font-bold text-xs" placeholder="Club de Golf Colima">
                            </div>

                            <div class="space-y-1.5">
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado en la Web</label>
                                <select id="input-noticia-activo" class="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400 transition-all font-bold text-xs">
                                    <option value="true">Visible (Publicado)</option>
                                    <option value="false">Oculto (Borrador / Pausado)</option>
                                </select>
                            </div>
                        </div>

                        <div class="space-y-1.5">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Contenido / Redacción del Artículo *</label>
                            <textarea id="input-noticia-contenido" required rows="5" class="w-full px-4 py-3.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-all font-medium text-xs leading-relaxed" placeholder="Escribe aquí el texto detallado de la noticia..."></textarea>
                        </div>
                    </form>

                    <!-- Barra de Progreso (Compresión y Subida) -->
                    <div id="galeria-progress-wrapper" class="hidden px-6 sm:px-8 py-3.5 border-t border-slate-800/80 bg-slate-950/70 space-y-2">
                        <div class="flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
                            <span id="galeria-progress-label" class="text-purple-300 flex items-center gap-2">
                                <span class="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin inline-block"></span>
                                Preparando fotos...
                            </span>
                            <span id="galeria-progress-percent" class="text-white">0%</span>
                        </div>
                        <div class="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                            <div id="galeria-progress-bar" class="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-emerald-400 rounded-full transition-all duration-300" style="width: 0%;"></div>
                        </div>
                    </div>

                    <div class="px-6 sm:px-8 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-3">
                        <button type="button" id="btn-cancel-modal-noticia" class="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase tracking-wider text-xs transition-all cursor-pointer">
                            Cancelar
                        </button>
                        <button type="button" id="btn-submit-noticia" class="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer">
                            <span class="material-icons text-sm">save</span> <span id="submit-noticia-btn-text">Publicar Noticia</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- 2. MODAL EVENTO (1 FOTO PÓSTER + DESCRIPCIÓN) -->
            <div id="modal-evento" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 hidden">
                <div class="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
                    <div class="px-6 sm:px-8 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <span class="material-icons text-xl" id="modal-evento-icon">event</span>
                            </div>
                            <div>
                                <h3 class="text-lg font-black text-white uppercase tracking-tight" id="modal-evento-title">Crear Próximo Evento</h3>
                                <p class="text-[10px] text-slate-400 uppercase tracking-wider">Póster oficial y detalles</p>
                            </div>
                        </div>
                        <button id="btn-close-modal-evento" class="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
                            <span class="material-icons">close</span>
                        </button>
                    </div>

                    <form id="form-evento" class="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
                        <!-- Imagen Póster del Evento -->
                        <div class="space-y-2">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Imagen / Póster del Evento * <span class="text-emerald-400">(Se optimiza automáticamente)</span>
                            </label>

                            <div id="evento-photo-preview-box" class="hidden relative aspect-[4/3] max-w-sm mx-auto rounded-2xl overflow-hidden border-2 border-emerald-500 bg-slate-950 shadow-xl group">
                                <img id="evento-preview-img" src="" alt="Póster Evento" class="w-full h-full object-cover">
                                <button type="button" id="btn-remove-evento-photo" class="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg">
                                    <span class="material-icons text-base">close</span>
                                </button>
                            </div>

                            <div id="evento-image-dropzone" class="border-2 border-dashed border-slate-700 hover:border-emerald-400/60 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-950/60 relative overflow-hidden group">
                                <input type="file" id="input-evento-image-file" accept="image/jpeg,image/png,image/webp,image/jpg" class="hidden">
                                <div class="py-3 space-y-1.5">
                                    <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span class="material-icons text-2xl">add_photo_alternate</span>
                                    </div>
                                    <p class="text-xs font-bold text-white uppercase tracking-wider">Subir Póster o Flyer del Evento</p>
                                    <p class="text-[10px] text-slate-500">Haz clic o arrastra la imagen aquí (se guardará comprimida en tu hosting)</p>
                                </div>
                            </div>
                        </div>

                        <!-- Título del Evento -->
                        <div class="space-y-1.5">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre o Título del Evento *</label>
                            <input type="text" id="input-evento-titulo" required class="w-full px-4 py-3.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400 transition-all font-bold text-sm" placeholder="Ej. Torneo Anual de Golf Feria de Todos Los Santos">
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="space-y-1.5">
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha o Período del Evento *</label>
                                <input type="text" id="input-evento-fecha" required class="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400 transition-all font-bold text-xs" placeholder="Ej. 5 al 8 de Noviembre 2026">
                            </div>

                            <div class="space-y-1.5">
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado en la Web</label>
                                <select id="input-evento-activo" class="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-400 transition-all font-bold text-xs">
                                    <option value="true">Visible (Publicado)</option>
                                    <option value="false">Oculto (Borrador / Pausado)</option>
                                </select>
                            </div>
                        </div>

                        <!-- Descripción del Evento -->
                        <div class="space-y-1.5">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción / Información del Evento *</label>
                            <textarea id="input-evento-contenido" required rows="5" class="w-full px-4 py-3.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400 transition-all font-medium text-xs leading-relaxed" placeholder="Escribe los detalles, categorías, premios y dinámica del evento..."></textarea>
                        </div>
                    </form>

                    <!-- Barra de Progreso (Compresión y Subida) -->
                    <div id="galeria-progress-wrapper" class="hidden px-6 sm:px-8 py-3.5 border-t border-slate-800/80 bg-slate-950/70 space-y-2">
                        <div class="flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
                            <span id="galeria-progress-label" class="text-purple-300 flex items-center gap-2">
                                <span class="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin inline-block"></span>
                                Preparando fotos...
                            </span>
                            <span id="galeria-progress-percent" class="text-white">0%</span>
                        </div>
                        <div class="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                            <div id="galeria-progress-bar" class="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-emerald-400 rounded-full transition-all duration-300" style="width: 0%;"></div>
                        </div>
                    </div>

                    <div class="px-6 sm:px-8 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-3">
                        <button type="button" id="btn-cancel-modal-evento" class="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase tracking-wider text-xs transition-all cursor-pointer">
                            Cancelar
                        </button>
                        <button type="button" id="btn-submit-evento" class="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer">
                            <span class="material-icons text-sm">save</span> <span id="submit-evento-btn-text">Publicar Evento</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- 3. MODAL GALERÍA DE EVENTOS (HASTA 50 FOTOS EN /imagenes/Eventosgaleria/) -->
            <div id="modal-galeria" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 hidden">
                <div class="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
                    <div class="px-6 sm:px-8 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                                <span class="material-icons text-xl">photo_library</span>
                            </div>
                            <div>
                                <h3 class="text-lg font-black text-white uppercase tracking-tight" id="modal-galeria-title">Subir Fotos a Galería</h3>
                                <p class="text-[10px] text-slate-400 uppercase tracking-wider">Se comprimen automáticamente y se guardan en /imagenes/Eventosgaleria/</p>
                            </div>
                        </div>
                        <button id="btn-close-modal-galeria" class="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer">
                            <span class="material-icons">close</span>
                        </button>
                    </div>

                    <form id="form-galeria" class="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
                        <!-- Galería Fotos -->
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Fotografías del Evento <span class="text-purple-400">(Hasta 50 fotos · 1ª es portada)</span>
                                </label>
                                <span id="galeria-photo-count-badge" class="text-[10px] font-black text-slate-400 uppercase">0 / 50 fotos</span>
                            </div>

                            <div id="galeria-photos-preview-grid" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3"></div>

                            <div id="galeria-image-dropzone" class="border-2 border-dashed border-slate-700 hover:border-purple-400/60 rounded-2xl p-5 text-center cursor-pointer transition-all bg-slate-950/60 relative overflow-hidden group">
                                <input type="file" id="input-galeria-image-file" multiple accept="image/jpeg,image/png,image/webp,image/jpg" class="hidden">
                                <div class="py-3 space-y-1.5">
                                    <div class="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span class="material-icons text-xl">add_photo_alternate</span>
                                    </div>
                                    <p class="text-xs font-bold text-slate-300">Haz clic para seleccionar o agregar fotografías</p>
                                    <p class="text-[10px] text-slate-500">Se comprimen automáticamente a JPG/WebP optimizado para carga rápida</p>
                                </div>
                            </div>
                        </div>

                        <!-- Título del Álbum -->
                        <div class="space-y-1.5">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Evento o Álbum *</label>
                            <input type="text" id="input-galeria-titulo" required class="w-full px-4 py-3.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-400 transition-all font-bold text-sm" placeholder="Ej. Torneo Anual Feria de Todos los Santos 2026">
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="space-y-1.5">
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</label>
                                <input type="date" id="input-galeria-fecha" required class="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-400 transition-all font-bold text-xs">
                            </div>
                            <div class="space-y-1.5">
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Visibilidad en Sitio Web</label>
                                <select id="input-galeria-activo" class="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-400 transition-all font-bold text-xs">
                                    <option value="true">Visible (Publicado)</option>
                                    <option value="false">Oculto (Borrador)</option>
                                </select>
                            </div>
                        </div>
                    </form>

                    <!-- Barra de Progreso (Compresión y Subida) -->
                    <div id="galeria-progress-wrapper" class="hidden px-6 sm:px-8 py-3.5 border-t border-slate-800/80 bg-slate-950/70 space-y-2">
                        <div class="flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
                            <span id="galeria-progress-label" class="text-purple-300 flex items-center gap-2">
                                <span class="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin inline-block"></span>
                                Preparando fotos...
                            </span>
                            <span id="galeria-progress-percent" class="text-white">0%</span>
                        </div>
                        <div class="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                            <div id="galeria-progress-bar" class="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-emerald-400 rounded-full transition-all duration-300" style="width: 0%;"></div>
                        </div>
                    </div>

                    <div class="px-6 sm:px-8 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-3">
                        <button type="button" id="btn-cancel-modal-galeria" class="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase tracking-wider text-xs transition-all cursor-pointer">
                            Cancelar
                        </button>
                        <button type="button" id="btn-submit-galeria" class="px-6 py-3 bg-purple-500 hover:bg-purple-400 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2 cursor-pointer">
                            <span class="material-icons text-sm">save</span> <span id="submit-galeria-btn-text">Guardar Galería</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        bindEvents();
    };

    const updateNoticiaPhotosPreview = () => {
        const grid = document.getElementById('noticia-photos-preview-grid');
        const badge = document.getElementById('noticia-photo-count-badge');
        const dropzone = document.getElementById('noticia-image-dropzone');
        if (!grid) return;

        if (badge) badge.textContent = `${currentNoticiaImages.length} / 9 fotos`;

        if (dropzone) {
            if (currentNoticiaImages.length >= 9) {
                dropzone.classList.add('opacity-50', 'pointer-events-none');
            } else {
                dropzone.classList.remove('opacity-50', 'pointer-events-none');
            }
        }

        if (currentNoticiaImages.length === 0) {
            grid.innerHTML = '';
            grid.classList.add('hidden');
            return;
        }

        grid.classList.remove('hidden');
        grid.innerHTML = currentNoticiaImages.map((img, idx) => `
            <div class="relative aspect-square rounded-2xl overflow-hidden border-2 ${idx === 0 ? 'border-amber-400 shadow-md shadow-amber-500/20' : 'border-slate-700'} bg-slate-950 group">
                <img src="${img.preview}" alt="Foto ${idx + 1}" class="w-full h-full object-cover">
                <div class="absolute top-1 left-1">
                    <span class="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${idx === 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-900/90 text-slate-300'} backdrop-blur-md">
                        ${idx === 0 ? '★ Portada' : `#${idx + 1}`}
                    </span>
                </div>
                <button type="button" data-remove-noticia-idx="${idx}" class="btn-remove-noticia-photo absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center transition-all opacity-90 group-hover:opacity-100 cursor-pointer shadow-md">
                    <span class="material-icons" style="font-size:14px">close</span>
                </button>
            </div>
        `).join('');

        grid.querySelectorAll('.btn-remove-noticia-photo').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const removeIdx = parseInt(btn.getAttribute('data-remove-noticia-idx'), 10);
                currentNoticiaImages.splice(removeIdx, 1);
                updateNoticiaPhotosPreview();
            };
        });
    };

    const updateEventoPhotoPreview = () => {
        const previewBox = document.getElementById('evento-photo-preview-box');
        const previewImg = document.getElementById('evento-preview-img');
        const dropzone = document.getElementById('evento-image-dropzone');
        if (!previewBox || !dropzone) return;

        if (currentEventoImage && currentEventoImage.preview) {
            previewImg.src = currentEventoImage.preview;
            previewBox.classList.remove('hidden');
            dropzone.classList.add('hidden');
        } else {
            previewBox.classList.add('hidden');
            dropzone.classList.remove('hidden');
        }
    };

    const updateGaleriaPhotosPreview = () => {
        const grid = document.getElementById('galeria-photos-preview-grid');
        const badge = document.getElementById('galeria-photo-count-badge');
        const dropzone = document.getElementById('galeria-image-dropzone');
        if (!grid) return;

        if (badge) badge.textContent = `${currentGaleriaImages.length} / 50 fotos`;

        if (dropzone) {
            if (currentGaleriaImages.length >= 50) {
                dropzone.classList.add('opacity-50', 'pointer-events-none');
            } else {
                dropzone.classList.remove('opacity-50', 'pointer-events-none');
            }
        }

        if (currentGaleriaImages.length === 0) {
            grid.innerHTML = '';
            grid.classList.add('hidden');
            return;
        }

        let dragFromIdx = null;
        grid.classList.remove('hidden');
        grid.innerHTML = currentGaleriaImages.map((img, idx) => `
            <div draggable="true" data-galeria-idx="${idx}"
                class="galeria-photo-card relative aspect-square rounded-2xl overflow-hidden border-2 ${idx === 0 ? 'border-purple-400 shadow-md shadow-purple-500/20' : 'border-slate-700'} bg-slate-950 group cursor-grab active:cursor-grabbing transition-all">
                <img src="${img.preview}" alt="Foto ${idx + 1}" class="w-full h-full object-cover pointer-events-none">
                <div class="absolute top-1 left-1">
                    <span class="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${idx === 0 ? 'bg-purple-500 text-white' : 'bg-slate-900/90 text-slate-300'} backdrop-blur-md">
                        ${idx === 0 ? '★ Portada' : `#${idx + 1}`}
                    </span>
                </div>
                <button type="button" data-remove-galeria-idx="${idx}" class="btn-remove-galeria-photo absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center transition-all opacity-90 group-hover:opacity-100 cursor-pointer shadow-md">
                    <span class="material-icons" style="font-size:14px">close</span>
                </button>
                <div class="absolute bottom-1 inset-x-1 flex items-center justify-between gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button type="button" data-move-left-idx="${idx}" ${idx === 0 ? 'disabled' : ''} class="btn-move-galeria-left w-6 h-6 rounded-lg bg-slate-900/90 hover:bg-purple-500 text-white flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow">
                        <span class="material-icons" style="font-size:14px">chevron_left</span>
                    </button>
                    <button type="button" data-move-right-idx="${idx}" ${idx === currentGaleriaImages.length - 1 ? 'disabled' : ''} class="btn-move-galeria-right w-6 h-6 rounded-lg bg-slate-900/90 hover:bg-purple-500 text-white flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow">
                        <span class="material-icons" style="font-size:14px">chevron_right</span>
                    </button>
                </div>
            </div>
        `).join('');

        grid.querySelectorAll('.galeria-photo-card').forEach(card => {
            card.ondragstart = (e) => {
                dragFromIdx = parseInt(card.getAttribute('data-galeria-idx'), 10);
                card.classList.add('opacity-50', 'scale-95');
                e.dataTransfer.effectAllowed = 'move';
            };
            card.ondragend = () => {
                card.classList.remove('opacity-50', 'scale-95');
                dragFromIdx = null;
            };
            card.ondragover = (e) => {
                e.preventDefault();
                card.classList.add('ring-2', 'ring-purple-400');
            };
            card.ondragleave = () => {
                card.classList.remove('ring-2', 'ring-purple-400');
            };
            card.ondrop = (e) => {
                e.preventDefault();
                card.classList.remove('ring-2', 'ring-purple-400');
                const dropToIdx = parseInt(card.getAttribute('data-galeria-idx'), 10);
                if (dragFromIdx !== null && dragFromIdx !== dropToIdx) {
                    const [moved] = currentGaleriaImages.splice(dragFromIdx, 1);
                    currentGaleriaImages.splice(dropToIdx, 0, moved);
                    updateGaleriaPhotosPreview();
                }
            };
        });

        grid.querySelectorAll('.btn-move-galeria-left').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.getAttribute('data-move-left-idx'), 10);
                if (idx > 0) {
                    [currentGaleriaImages[idx - 1], currentGaleriaImages[idx]] = [currentGaleriaImages[idx], currentGaleriaImages[idx - 1]];
                    updateGaleriaPhotosPreview();
                }
            };
        });

        grid.querySelectorAll('.btn-move-galeria-right').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.getAttribute('data-move-right-idx'), 10);
                if (idx < currentGaleriaImages.length - 1) {
                    [currentGaleriaImages[idx], currentGaleriaImages[idx + 1]] = [currentGaleriaImages[idx + 1], currentGaleriaImages[idx]];
                    updateGaleriaPhotosPreview();
                }
            };
        });

        grid.querySelectorAll('.btn-remove-galeria-photo').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const removeIdx = parseInt(btn.getAttribute('data-remove-galeria-idx'), 10);
                currentGaleriaImages.splice(removeIdx, 1);
                updateGaleriaPhotosPreview();
            };
        });
    };

    const bindEvents = () => {
        // Tab switching
        const tabBtnNoticias = document.getElementById('tab-btn-noticias');
        const tabBtnEventos = document.getElementById('tab-btn-eventos');
        const tabBtnGaleria = document.getElementById('tab-btn-galeria');
        const tabContentNoticias = document.getElementById('tab-content-noticias');
        const tabContentEventos = document.getElementById('tab-content-eventos');
        const tabContentGaleria = document.getElementById('tab-content-galeria');

        const inactiveTabCls = 'flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer text-slate-400 hover:text-white';

        if (tabBtnNoticias && tabBtnEventos && tabBtnGaleria) {
            tabBtnNoticias.onclick = () => {
                activeTab = 'noticias';
                tabBtnNoticias.className = 'flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20';
                tabBtnEventos.className = inactiveTabCls;
                tabBtnGaleria.className = inactiveTabCls;
                tabContentNoticias.classList.remove('hidden');
                tabContentEventos.classList.add('hidden');
                tabContentGaleria.classList.add('hidden');
            };

            tabBtnEventos.onclick = () => {
                activeTab = 'eventos';
                tabBtnEventos.className = 'flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20';
                tabBtnNoticias.className = inactiveTabCls;
                tabBtnGaleria.className = inactiveTabCls;
                tabContentEventos.classList.remove('hidden');
                tabContentNoticias.classList.add('hidden');
                tabContentGaleria.classList.add('hidden');
            };

            tabBtnGaleria.onclick = () => {
                activeTab = 'galeria';
                tabBtnGaleria.className = 'flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer bg-purple-500 text-white shadow-lg shadow-purple-500/20';
                tabBtnNoticias.className = inactiveTabCls;
                tabBtnEventos.className = inactiveTabCls;
                tabContentGaleria.classList.remove('hidden');
                tabContentNoticias.classList.add('hidden');
                tabContentEventos.classList.add('hidden');
            };
        }

        // ============================================
        // NOTICIAS MODAL & SUBMIT
        // ============================================
        const modalNoticia = document.getElementById('modal-noticia');
        const btnOpenNoticia = document.getElementById('btn-open-modal-noticia');
        const btnPrimerNoticia = document.getElementById('btn-crear-primer-noticia');
        const btnCloseNoticia = document.getElementById('btn-close-modal-noticia');
        const btnCancelNoticia = document.getElementById('btn-cancel-modal-noticia');
        const dropzoneNoticia = document.getElementById('noticia-image-dropzone');
        const fileInputNoticia = document.getElementById('input-noticia-image-file');
        const btnSubmitNoticia = document.getElementById('btn-submit-noticia');

        const openModalForNewNoticia = () => {
            editingNoticiaId = null;
            currentNoticiaImages = [];

            document.getElementById('modal-noticia-title').textContent = 'Publicar Nueva Noticia';
            document.getElementById('submit-noticia-btn-text').textContent = 'Publicar Noticia';
            document.getElementById('input-noticia-titulo').value = '';
            document.getElementById('input-noticia-fecha').value = new Date().toISOString().split('T')[0];
            
            const userStr = sessionStorage.getItem('cgc_user_data');
            const currentUser = userStr ? JSON.parse(userStr) : null;
            document.getElementById('input-noticia-autor').value = (currentUser && currentUser.full_name) ? currentUser.full_name : 'Club de Golf Colima';
            
            document.getElementById('input-noticia-activo').value = 'true';
            document.getElementById('input-noticia-contenido').value = '';
            fileInputNoticia.value = '';

            updateNoticiaPhotosPreview();
            modalNoticia.classList.remove('hidden');
        };

        if (btnOpenNoticia) btnOpenNoticia.onclick = openModalForNewNoticia;
        if (btnPrimerNoticia) btnPrimerNoticia.onclick = openModalForNewNoticia;

        const closeModalNoticia = () => {
            modalNoticia.classList.add('hidden');
            editingNoticiaId = null;
            currentNoticiaImages = [];
        };

        if (btnCloseNoticia) btnCloseNoticia.onclick = closeModalNoticia;
        if (btnCancelNoticia) btnCancelNoticia.onclick = closeModalNoticia;

        const handleSelectedNoticiaFiles = async (fileList) => {
            const files = Array.from(fileList);
            const remainingSlots = 9 - currentNoticiaImages.length;
            if (remainingSlots <= 0) {
                notify('Límite alcanzado', 'Ya has alcanzado el límite máximo de 9 fotos para esta noticia.', 'error');
                return;
            }

            const acceptedFiles = files.slice(0, remainingSlots);
            const badge = document.getElementById('noticia-photo-count-badge');
            if (badge) badge.textContent = `Optimizando ${acceptedFiles.length} foto(s)...`;

            for (const file of acceptedFiles) {
                const optimized = await compressImageFile(file);
                currentNoticiaImages.push({
                    type: 'file',
                    file: optimized.file,
                    preview: optimized.preview
                });
            }

            updateNoticiaPhotosPreview();
        };

        if (dropzoneNoticia && fileInputNoticia) {
            dropzoneNoticia.onclick = () => fileInputNoticia.click();
            fileInputNoticia.onchange = (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    handleSelectedNoticiaFiles(e.target.files);
                    fileInputNoticia.value = '';
                }
            };

            dropzoneNoticia.ondragover = (e) => { e.preventDefault(); dropzoneNoticia.classList.add('border-amber-400'); };
            dropzoneNoticia.ondragleave = () => { dropzoneNoticia.classList.remove('border-amber-400'); };
            dropzoneNoticia.ondrop = (e) => {
                e.preventDefault();
                dropzoneNoticia.classList.remove('border-amber-400');
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleSelectedNoticiaFiles(e.dataTransfer.files);
                }
            };
        }

        // Edit Noticia Handler
        document.querySelectorAll('.btn-edit-noticia').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-edit-noticia-id');
                const n = allRecords.find(x => x.id === id);
                if (!n) return;

                editingNoticiaId = id;
                const existingUrls = parseImages(n);
                currentNoticiaImages = existingUrls.map(url => ({
                    type: 'url',
                    url: url,
                    preview: url
                }));

                document.getElementById('modal-noticia-title').textContent = 'Editar Noticia';
                document.getElementById('submit-noticia-btn-text').textContent = 'Guardar Cambios';

                document.getElementById('input-noticia-titulo').value = n.titulo || '';
                document.getElementById('input-noticia-fecha').value = n.fecha_publicacion || new Date().toISOString().split('T')[0];
                document.getElementById('input-noticia-autor').value = n.autor || 'Club de Golf Colima';
                document.getElementById('input-noticia-activo').value = n.activo ? 'true' : 'false';
                document.getElementById('input-noticia-contenido').value = n.contenido || '';

                updateNoticiaPhotosPreview();
                modalNoticia.classList.remove('hidden');
            };
        });

        // Submit Noticia
        if (btnSubmitNoticia) {
            btnSubmitNoticia.onclick = async () => {
                const titulo = document.getElementById('input-noticia-titulo').value.trim();
                const fecha = document.getElementById('input-noticia-fecha').value;
                const autor = document.getElementById('input-noticia-autor').value.trim() || 'Club de Golf Colima';
                const activo = document.getElementById('input-noticia-activo').value === 'true';
                const contenido = document.getElementById('input-noticia-contenido').value.trim();

                if (!titulo) {
                    notify('Título Requerido', 'Por favor ingresa el título de la noticia.', 'error');
                    return;
                }
                if (!contenido) {
                    notify('Contenido Requerido', 'Por favor redacta el contenido del artículo.', 'error');
                    return;
                }

                btnSubmitNoticia.disabled = true;
                btnSubmitNoticia.innerHTML = `<span class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span> Guardando fotos...`;

                try {
                    const finalImageUrls = [];
                    const uploadEndpoints = ['/upload.php', `${window.location.origin}/upload.php`, 'https://colimagolf.com/upload.php'];

                    for (let i = 0; i < currentNoticiaImages.length; i++) {
                        const item = currentNoticiaImages[i];
                        if (item.type === 'url' && item.url) {
                            finalImageUrls.push(item.url);
                        } else if (item.type === 'file' && item.file) {
                            btnSubmitNoticia.innerHTML = `<span class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span> Subiendo foto ${i + 1} de ${currentNoticiaImages.length}...`;
                            const formData = new FormData();
                            formData.append('image', item.file);

                            let uploadedUrl = null;
                            for (const ep of uploadEndpoints) {
                                try {
                                    const res = await fetch(ep, { method: 'POST', body: formData });
                                    if (res.ok) {
                                        const json = await res.json();
                                        if (json.success && (json.url || json.relative_url)) {
                                            uploadedUrl = json.url || json.relative_url;
                                            break;
                                        }
                                    }
                                } catch (eUp) {}
                            }

                            if (uploadedUrl) finalImageUrls.push(uploadedUrl);
                        }
                    }

                    if (finalImageUrls.length === 0) {
                        finalImageUrls.push('./imagenes/feria.jpeg');
                    }

                    const coverImage = finalImageUrls[0];
                    const payload = {
                        titulo,
                        subtitulo: '',
                        fecha_publicacion: fecha,
                        autor,
                        activo,
                        contenido,
                        imagen_url: coverImage,
                        galeria: finalImageUrls
                    };

                    let { error } = editingNoticiaId
                        ? await db.from('noticias').update(payload).eq('id', editingNoticiaId)
                        : await db.from('noticias').insert([payload]);

                    if (error && (error.message?.includes('galeria') || error.code === '42703')) {
                        delete payload.galeria;
                        payload.imagen_url = finalImageUrls.length > 1 ? JSON.stringify(finalImageUrls) : coverImage;
                        const retryRes = editingNoticiaId
                            ? await db.from('noticias').update(payload).eq('id', editingNoticiaId)
                            : await db.from('noticias').insert([payload]);
                        error = retryRes.error;
                    }

                    if (error) {
                        notify('Error al Guardar', error.message || 'No se pudo guardar en Supabase.', 'error');
                    } else {
                        notify('¡Éxito!', editingNoticiaId ? 'Noticia actualizada correctamente.' : 'Noticia publicada con éxito.', 'success');
                        closeModalNoticia();
                        await loadRecords();
                        renderUI();
                    }
                } catch (err) {
                    console.error('Save error:', err);
                    notify('Error', 'Ocurrió un error inesperado al procesar la noticia.', 'error');
                } finally {
                    btnSubmitNoticia.disabled = false;
                    btnSubmitNoticia.innerHTML = `<span class="material-icons text-sm">save</span> <span id="submit-noticia-btn-text">${editingNoticiaId ? 'Guardar Cambios' : 'Publicar Noticia'}</span>`;
                }
            };
        }

        // ============================================
        // EVENTOS MODAL & SUBMIT
        // ============================================
        const modalEvento = document.getElementById('modal-evento');
        const btnOpenEvento = document.getElementById('btn-open-modal-evento');
        const btnPrimerEvento = document.getElementById('btn-crear-primer-evento');
        const btnCloseEvento = document.getElementById('btn-close-modal-evento');
        const btnCancelEvento = document.getElementById('btn-cancel-modal-evento');
        const dropzoneEvento = document.getElementById('evento-image-dropzone');
        const fileInputEvento = document.getElementById('input-evento-image-file');
        const btnRemoveEventoPhoto = document.getElementById('btn-remove-evento-photo');
        const btnSubmitEvento = document.getElementById('btn-submit-evento');

        const openModalForNewEvento = () => {
            editingEventoId = null;
            currentEventoImage = null;

            document.getElementById('modal-evento-title').textContent = 'Crear Próximo Evento';
            document.getElementById('submit-evento-btn-text').textContent = 'Publicar Evento';
            document.getElementById('input-evento-titulo').value = '';
            document.getElementById('input-evento-fecha').value = '';
            document.getElementById('input-evento-activo').value = 'true';
            document.getElementById('input-evento-contenido').value = '';
            fileInputEvento.value = '';

            updateEventoPhotoPreview();
            modalEvento.classList.remove('hidden');
        };

        if (btnOpenEvento) btnOpenEvento.onclick = openModalForNewEvento;
        if (btnPrimerEvento) btnPrimerEvento.onclick = openModalForNewEvento;

        const closeModalEvento = () => {
            modalEvento.classList.add('hidden');
            editingEventoId = null;
            currentEventoImage = null;
        };

        if (btnCloseEvento) btnCloseEvento.onclick = closeModalEvento;
        if (btnCancelEvento) btnCancelEvento.onclick = closeModalEvento;

        if (btnRemoveEventoPhoto) {
            btnRemoveEventoPhoto.onclick = () => {
                currentEventoImage = null;
                updateEventoPhotoPreview();
            };
        }

        const handleSelectedEventoFile = async (file) => {
            if (!file) return;
            const optimized = await compressImageFile(file);
            currentEventoImage = {
                type: 'file',
                file: optimized.file,
                preview: optimized.preview
            };
            updateEventoPhotoPreview();
        };

        if (dropzoneEvento && fileInputEvento) {
            dropzoneEvento.onclick = () => fileInputEvento.click();
            fileInputEvento.onchange = (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    handleSelectedEventoFile(e.target.files[0]);
                    fileInputEvento.value = '';
                }
            };

            dropzoneEvento.ondragover = (e) => { e.preventDefault(); dropzoneEvento.classList.add('border-emerald-400'); };
            dropzoneEvento.ondragleave = () => { dropzoneEvento.classList.remove('border-emerald-400'); };
            dropzoneEvento.ondrop = (e) => {
                e.preventDefault();
                dropzoneEvento.classList.remove('border-emerald-400');
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleSelectedEventoFile(e.dataTransfer.files[0]);
                }
            };
        }

        // Edit Evento Handler
        document.querySelectorAll('.btn-edit-evento').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-edit-evento-id');
                const eItem = allRecords.find(x => x.id === id);
                if (!eItem) return;

                editingEventoId = id;
                const imgSrc = eItem.imagen_url || (eItem.galeria && eItem.galeria[0]) || './imagenes/feria.jpeg';
                currentEventoImage = {
                    type: 'url',
                    url: imgSrc,
                    preview: imgSrc
                };

                document.getElementById('modal-evento-title').textContent = 'Editar Evento';
                document.getElementById('submit-evento-btn-text').textContent = 'Guardar Cambios';

                document.getElementById('input-evento-titulo').value = eItem.titulo || '';
                document.getElementById('input-evento-fecha').value = eItem.autor || '';
                document.getElementById('input-evento-activo').value = eItem.activo ? 'true' : 'false';
                document.getElementById('input-evento-contenido').value = eItem.contenido || '';

                updateEventoPhotoPreview();
                modalEvento.classList.remove('hidden');
            };
        });

        // Submit Evento
        if (btnSubmitEvento) {
            btnSubmitEvento.onclick = async () => {
                const titulo = document.getElementById('input-evento-titulo').value.trim();
                const fechaTexto = document.getElementById('input-evento-fecha').value.trim();
                const activo = document.getElementById('input-evento-activo').value === 'true';
                const contenido = document.getElementById('input-evento-contenido').value.trim();

                if (!currentEventoImage) {
                    notify('Póster Requerido', 'Por favor selecciona o sube una imagen para el evento.', 'error');
                    return;
                }
                if (!titulo) {
                    notify('Título Requerido', 'Por favor ingresa el nombre o título del evento.', 'error');
                    return;
                }
                if (!fechaTexto) {
                    notify('Fecha Requerida', 'Por favor ingresa la fecha o período del evento (ej. 5 al 8 de Noviembre).', 'error');
                    return;
                }
                if (!contenido) {
                    notify('Descripción Requerida', 'Por favor ingresa la descripción o información del evento.', 'error');
                    return;
                }

                btnSubmitEvento.disabled = true;
                btnSubmitEvento.innerHTML = `<span class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span> Procesando póster...`;

                try {
                    let uploadedUrl = currentEventoImage.type === 'url' ? currentEventoImage.url : null;

                    if (currentEventoImage.type === 'file' && currentEventoImage.file) {
                        btnSubmitEvento.innerHTML = `<span class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span> Subiendo a servidor...`;
                        const formData = new FormData();
                        formData.append('image', currentEventoImage.file);

                        const uploadEndpoints = ['/upload.php', `${window.location.origin}/upload.php`, 'https://colimagolf.com/upload.php'];
                        for (const ep of uploadEndpoints) {
                            try {
                                const res = await fetch(ep, { method: 'POST', body: formData });
                                if (res.ok) {
                                    const json = await res.json();
                                    if (json.success && (json.url || json.relative_url)) {
                                        uploadedUrl = json.url || json.relative_url;
                                        break;
                                    }
                                }
                            } catch (eUp) {}
                        }
                    }

                    if (!uploadedUrl) {
                        uploadedUrl = './imagenes/feria.jpeg';
                    }

                    const payload = {
                        titulo,
                        subtitulo: 'EVENTO',
                        fecha_publicacion: new Date().toISOString().split('T')[0],
                        autor: fechaTexto, // stores custom date text (e.g. '5 al 8 de Noviembre 2026')
                        activo,
                        contenido,
                        imagen_url: uploadedUrl,
                        galeria: [uploadedUrl]
                    };

                    let { error } = editingEventoId
                        ? await db.from('noticias').update(payload).eq('id', editingEventoId)
                        : await db.from('noticias').insert([payload]);

                    if (error && (error.message?.includes('galeria') || error.code === '42703')) {
                        delete payload.galeria;
                        payload.imagen_url = uploadedUrl;
                        const retryRes = editingEventoId
                            ? await db.from('noticias').update(payload).eq('id', editingEventoId)
                            : await db.from('noticias').insert([payload]);
                        error = retryRes.error;
                    }

                    if (error) {
                        notify('Error al Guardar', error.message || 'No se pudo guardar el evento en Supabase.', 'error');
                    } else {
                        notify('¡Éxito!', editingEventoId ? 'Evento actualizado correctamente.' : 'Evento publicado con éxito en la cartelera.', 'success');
                        closeModalEvento();
                        activeTab = 'eventos';
                        await loadRecords();
                        renderUI();
                    }
                } catch (err) {
                    console.error('Save evento error:', err);
                    notify('Error', 'Ocurrió un error inesperado al procesar el evento.', 'error');
                } finally {
                    btnSubmitEvento.disabled = false;
                    btnSubmitEvento.innerHTML = `<span class="material-icons text-sm">save</span> <span id="submit-evento-btn-text">${editingEventoId ? 'Guardar Cambios' : 'Publicar Evento'}</span>`;
                }
            };
        }

        // ============================================
        // GALERÍA MODAL & SUBMIT
        // ============================================
        const modalGaleria = document.getElementById('modal-galeria');
        const btnOpenGaleria = document.getElementById('btn-open-modal-galeria');
        const btnPrimerGaleria = document.getElementById('btn-crear-primer-galeria');
        const btnCloseGaleria = document.getElementById('btn-close-modal-galeria');
        const btnCancelGaleria = document.getElementById('btn-cancel-modal-galeria');
        const dropzoneGaleria = document.getElementById('galeria-image-dropzone');
        const fileInputGaleria = document.getElementById('input-galeria-image-file');
        const btnSubmitGaleria = document.getElementById('btn-submit-galeria');
        const progressWrapperGaleria = document.getElementById('galeria-progress-wrapper');
        const progressLabelGaleria = document.getElementById('galeria-progress-label');
        const progressPercentGaleria = document.getElementById('galeria-progress-percent');
        const progressBarGaleria = document.getElementById('galeria-progress-bar');

        const setGaleriaProgress = (visible, label = '', pct = 0) => {
            if (!progressWrapperGaleria) return;
            if (!visible) {
                progressWrapperGaleria.classList.add('hidden');
                if (progressBarGaleria) progressBarGaleria.style.width = '0%';
                return;
            }
            progressWrapperGaleria.classList.remove('hidden');
            if (progressLabelGaleria) {
                progressLabelGaleria.innerHTML = `<span class="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin inline-block"></span> ${label}`;
            }
            const safePct = Math.max(0, Math.min(100, Math.round(pct)));
            if (progressPercentGaleria) progressPercentGaleria.textContent = `${safePct}%`;
            if (progressBarGaleria) progressBarGaleria.style.width = `${safePct}%`;
        };

        const openModalForNewGaleria = () => {
            editingGaleriaId = null;
            currentGaleriaImages = [];
            document.getElementById('modal-galeria-title').textContent = 'Subir Fotos a Galería';
            document.getElementById('submit-galeria-btn-text').textContent = 'Guardar Galería';
            document.getElementById('input-galeria-titulo').value = '';
            document.getElementById('input-galeria-fecha').value = new Date().toISOString().split('T')[0];
            document.getElementById('input-galeria-activo').value = 'true';
            updateGaleriaPhotosPreview();
            modalGaleria.classList.remove('hidden');
        };

        if (btnOpenGaleria) btnOpenGaleria.onclick = openModalForNewGaleria;
        if (btnPrimerGaleria) btnPrimerGaleria.onclick = openModalForNewGaleria;

        const closeModalGaleria = () => {
            modalGaleria.classList.add('hidden');
            currentGaleriaImages = [];
        };

        if (btnCloseGaleria) btnCloseGaleria.onclick = closeModalGaleria;
        if (btnCancelGaleria) btnCancelGaleria.onclick = closeModalGaleria;

        if (dropzoneGaleria && fileInputGaleria) {
            dropzoneGaleria.onclick = () => fileInputGaleria.click();
            fileInputGaleria.onchange = async (e) => {
                const files = Array.from(e.target.files || []);
                if (files.length === 0) return;

                const remainingSlots = 50 - currentGaleriaImages.length;
                if (files.length > remainingSlots) {
                    notify('Límite de Galería', `Solo puedes agregar ${remainingSlots} foto(s) más (máximo 50 por álbum).`, 'warning');
                }

                const filesToProcess = files.slice(0, remainingSlots);
                setGaleriaProgress(true, `Cargando ${filesToProcess.length} fotos desde tu equipo...`, 2);
                await new Promise(r => setTimeout(r, 20));

                for (let idx = 0; idx < filesToProcess.length; idx++) {
                    const file = filesToProcess[idx];
                    if (file.size > 25 * 1024 * 1024) {
                        notify('Archivo muy grande', `La foto "${file.name}" supera 25MB.`, 'error');
                        continue;
                    }
                    setGaleriaProgress(true, `Cargando y optimizando foto ${idx + 1} de ${filesToProcess.length}...`, ((idx + 1) / filesToProcess.length) * 100);
                    await new Promise(r => setTimeout(r, 15));
                    const optimized = await compressImageFile(file, 1400, 1400, 0.78);
                    currentGaleriaImages.push({
                        type: 'file',
                        file: optimized.file,
                        preview: optimized.preview
                    });
                }
                setGaleriaProgress(false);
                fileInputGaleria.value = '';
                updateGaleriaPhotosPreview();
            };
        }

        document.querySelectorAll('.btn-edit-galeria').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-edit-galeria-id');
                const g = allRecords.find(x => x.id === id);
                if (!g) return;

                editingGaleriaId = id;
                const existingUrls = parseImages(g);
                currentGaleriaImages = existingUrls.map(url => ({
                    type: 'url',
                    url,
                    preview: url
                }));

                document.getElementById('modal-galeria-title').textContent = 'Editar Álbum de Galería';
                document.getElementById('submit-galeria-btn-text').textContent = 'Guardar Cambios';
                document.getElementById('input-galeria-titulo').value = g.titulo || '';
                document.getElementById('input-galeria-fecha').value = g.fecha_publicacion || new Date().toISOString().split('T')[0];
                document.getElementById('input-galeria-activo').value = g.activo ? 'true' : 'false';

                updateGaleriaPhotosPreview();
                modalGaleria.classList.remove('hidden');
            };
        });

        if (btnSubmitGaleria) {
            btnSubmitGaleria.onclick = async () => {
                const titulo = document.getElementById('input-galeria-titulo').value.trim();
                const fecha = document.getElementById('input-galeria-fecha').value;
                const activo = document.getElementById('input-galeria-activo').value === 'true';

                if (!titulo) {
                    notify('Nombre Requerido', 'Por favor ingresa el nombre del evento o álbum.', 'error');
                    return;
                }
                if (currentGaleriaImages.length === 0) {
                    notify('Fotos Requeridas', 'Por favor selecciona al menos una fotografía para la galería.', 'error');
                    return;
                }

                btnSubmitGaleria.disabled = true;
                btnSubmitGaleria.innerHTML = `<span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Subiendo fotos...`;
                setGaleriaProgress(true, `Iniciando subida de ${currentGaleriaImages.length} fotos...`, 5);

                try {
                    const finalImageUrls = [];
                    const uploadEndpoints = ['/upload.php', `${window.location.origin}/upload.php`, 'https://colimagolf.com/upload.php'];

                    for (let i = 0; i < currentGaleriaImages.length; i++) {
                        const item = currentGaleriaImages[i];
                        const pct = ((i + 1) / currentGaleriaImages.length) * 95;
                        if (item.type === 'url' && item.url) {
                            finalImageUrls.push(item.url);
                            setGaleriaProgress(true, `Procesando foto ${i + 1} de ${currentGaleriaImages.length}...`, pct);
                        } else if (item.type === 'file' && item.file) {
                            btnSubmitGaleria.innerHTML = `<span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Subiendo ${i + 1} de ${currentGaleriaImages.length}...`;
                            setGaleriaProgress(true, `Subiendo foto ${i + 1} de ${currentGaleriaImages.length} al hosting...`, pct);
                            const formData = new FormData();
                            formData.append('folder', 'eventosgaleria');
                            formData.append('image', item.file);

                            let uploadedUrl = null;
                            for (const ep of uploadEndpoints) {
                                try {
                                    const res = await fetch(ep, { method: 'POST', body: formData });
                                    if (res.ok) {
                                        const json = await res.json();
                                        if (json.success && (json.relative_url || json.url)) {
                                            uploadedUrl = json.relative_url ? `.${json.relative_url}` : json.url;
                                            break;
                                        }
                                    }
                                } catch (eUp) {}
                            }
                            if (uploadedUrl) finalImageUrls.push(uploadedUrl);
                        }
                    }

                    if (finalImageUrls.length === 0) {
                        notify('Error de Subida', 'No se pudieron subir las fotos al hosting. Verifica que upload.php esté actualizado en public_html.', 'error');
                        return;
                    }

                    const payload = {
                        titulo,
                        subtitulo: 'GALERIA',
                        fecha_publicacion: fecha,
                        autor: 'Galería de Eventos',
                        activo,
                        contenido: `Galería fotográfica: ${titulo}`,
                        imagen_url: finalImageUrls[0],
                        galeria: finalImageUrls
                    };

                    let { error } = editingGaleriaId
                        ? await db.from('noticias').update(payload).eq('id', editingGaleriaId)
                        : await db.from('noticias').insert([payload]);

                    if (error) {
                        notify('Error al Guardar', error.message, 'error');
                    } else {
                        notify(editingGaleriaId ? 'Galería Actualizada' : 'Galería Guardada', 'Las fotos se han guardado en /imagenes/Eventosgaleria/ y ya están disponibles.', 'success');
                        closeModalGaleria();
                        activeTab = 'galeria';
                        await loadRecords();
                        renderUI();
                    }
                } catch (e) {
                    notify('Error', 'Ocurrió un error inesperado al guardar la galería.', 'error');
                } finally {
                    setGaleriaProgress(false);
                    btnSubmitGaleria.disabled = false;
                    btnSubmitGaleria.innerHTML = `<span class="material-icons text-sm">save</span> <span id="submit-galeria-btn-text">${editingGaleriaId ? 'Guardar Cambios' : 'Guardar Galería'}</span>`;
                }
            };
        }

        // ============================================
        // COMMON TOGGLE ACTIVE & DELETE HANDLERS
        // ============================================
        document.querySelectorAll('.btn-toggle-record').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.getAttribute('data-toggle-id');
                const curr = btn.getAttribute('data-activo') === 'true';
                const nextState = !curr;
                
                try {
                    const { error } = await db.from('noticias').update({ activo: nextState }).eq('id', id);
                    if (!error) {
                        notify('Estado actualizado', nextState ? 'El registro ahora está visible en el sitio web.' : 'El registro ha sido ocultado del sitio web.', 'success');
                        await loadRecords();
                        renderUI();
                    } else {
                        notify('Error', error.message, 'error');
                    }
                } catch (e) {
                    notify('Error', 'No se pudo actualizar el estado.', 'error');
                }
            };
        });

        document.querySelectorAll('.btn-delete-record').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-delete-id');
                const title = btn.getAttribute('data-title');
                notify('Confirmar Eliminación', `¿Estás seguro de que deseas eliminar "${title}"? Esta acción no se puede deshacer.`, 'confirm', async () => {
                    try {
                        const { error } = await db.from('noticias').delete().eq('id', id);
                        if (!error) {
                            notify('Eliminado', 'La publicación fue eliminada correctamente.', 'success');
                            await loadRecords();
                            renderUI();
                        } else {
                            notify('Error', error.message, 'error');
                        }
                    } catch (e) {
                        notify('Error', 'No se pudo eliminar el registro.', 'error');
                    }
                });
            };
        });
    };

    renderUI();
};
