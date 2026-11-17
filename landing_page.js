// ================================================
// LANDING PAGE OFICIAL - CLUB DE GOLF COLIMA
// ================================================

import { createClient } from '@supabase/supabase-js';
import { initLiveLeaderboardModal } from './live_leaderboard_modal.js';
import { initRankingAcumulado, openRankingAcumuladoModal } from './ranking_acumulado.js';

const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 'https://tztolxgsaktqindoimtu.supabase.co';
const SUPABASE_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dG9seGdzYWt0cWluZG9pbXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzQ4ODAsImV4cCI6MjEwMTg1MDg4MH0.E2GABiOMXYb5hEwE9ErIcJa6_LHkj9lJUglQVoiLl0M';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
const db = supabaseClient.schema('colimaGC');

export async function renderLandingPageModule(container) {
    // Initialize Live Leaderboard & Ranking Acumulado Modals
    initLiveLeaderboardModal(supabaseClient, db);
    initRankingAcumulado(supabaseClient, db);

    const dronePhotos = [
        './imagenes/DJI_0001.JPG',
        './imagenes/DJI_0002.JPG',
        './imagenes/DJI_0003.JPG',
        './imagenes/DJI_0004.JPG',
        './imagenes/DJI_0008.JPG',
        './imagenes/DJI_0012.JPG',
        './imagenes/DJI_0013.JPG',
        './imagenes/DJI_0014.JPG',
        './imagenes/DJI_0015.JPG',
        './imagenes/DJI_0016.JPG',
        './imagenes/DJI_0017.JPG'
    ];

    // ── Selección dinámica del torneo destacado ──────────────────────────────
    let tourney8AgoId = 'b73a7380-589d-4986-84c4-7618d805fced';
    let tourney22AgoId = '291bcd9c-674b-431e-9fd4-5690ce2b7b94';
    let tourney5SeptId = '69452b77-44c7-400a-bb88-a763da03196b';
    let tourney26SeptId = 'dfecb440-d4ee-485f-b6d1-ad27f5032fc7';
    let tourneyMecateId = 'f116975d-d521-4001-91b5-2e21510f6be7';
    let allTournamentsData = [];
    let isFecha4Live = false;
    let activeTournamentId = tourney26SeptId;
    let activeTournamentName = 'Próximo Torneo';

    // Variables para la sección destacada dinámica
    let nextTournament = null;       // objeto torneo más reciente
    let nextTournamentIsLive = false; // true si ya tiene scores cargados

    try {
        const { data } = await db.from('tournaments').select('id, name, config, created_at').order('created_at', { ascending: false });
        if (data && data.length > 0) {
            allTournamentsData = data;

            // ── IDs de torneos ranking (para la sección de fechas del ranking) ──
            const tMecate = data.find(t => t.id === tourneyMecateId || t.name?.toLowerCase().includes('mecate'));
            if (tMecate) tourneyMecateId = tMecate.id;
            const isTour8 = (t) => t && (t.id === tourney8AgoId || ((t.name?.toLowerCase().includes('8') || t.name?.toLowerCase().includes('1ª') || t.name?.toLowerCase().includes('1a')) && t.name?.toLowerCase().includes('ago') && !t.name?.toLowerCase().includes('nov')));
            const isTour22 = (t) => t && (t.id === tourney22AgoId || (t.name?.toLowerCase().includes('22') && t.name?.toLowerCase().includes('ago')));
            const isTour5 = (t) => t && (t.id === tourney5SeptId || ((t.name?.toLowerCase().includes('5') || t.name?.toLowerCase().includes('3ª') || t.name?.toLowerCase().includes('3a')) && (t.name?.toLowerCase().includes('sep') || t.name?.toLowerCase().includes('sept')) && !t.name?.toLowerCase().includes('nov')));
            const isTour26 = (t) => t && (t.id === tourney26SeptId || ((t.name?.toLowerCase().includes('26') || t.name?.toLowerCase().includes('4ª') || t.name?.toLowerCase().includes('4a')) && (t.name?.toLowerCase().includes('sep') || t.name?.toLowerCase().includes('sept')) && !t.name?.toLowerCase().includes('nov')));
            const t8 = data.find(isTour8); if (t8) tourney8AgoId = t8.id;
            const t22 = data.find(isTour22); if (t22) tourney22AgoId = t22.id;
            const t5 = data.find(isTour5); if (t5) tourney5SeptId = t5.id;
            const t26 = data.find(isTour26);
            if (t26) {
                tourney26SeptId = t26.id;
                const { count: s4Count } = await db.from('scores').select('id', { count: 'exact', head: true }).eq('eventid', t26.id);
                if (s4Count && s4Count > 0) isFecha4Live = true;
            }

            // ── Torneo destacado: el más reciente creado ──────────────────────
            nextTournament = data[0];

            // Verificar si ya tiene scores (= está en vivo / se está jugando)
            if (nextTournament) {
                const { count: scoreCount } = await db.from('scores')
                    .select('id', { count: 'exact', head: true })
                    .eq('eventid', nextTournament.id);
                nextTournamentIsLive = !!(scoreCount && scoreCount > 0);
                activeTournamentId = nextTournament.id;
                activeTournamentName = nextTournament.name || 'Próximo Torneo';
            }
        }
    } catch (e) {
        console.warn('Could not fetch tournaments:', e);
    }

    // Helper to parse images gallery
    const getNoticiaImages = (n) => {
        if (n.galeria && Array.isArray(n.galeria) && n.galeria.length > 0) {
            return n.galeria.filter(Boolean);
        }
        if (typeof n.galeria === 'string' && n.galeria.trim()) {
            try {
                const parsed = JSON.parse(n.galeria);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed.filter(Boolean);
            } catch (e) {}
        }
        if (n.imagen_url && n.imagen_url.trim()) {
            if (n.imagen_url.startsWith('[')) {
                try {
                    const parsed = JSON.parse(n.imagen_url);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed.filter(Boolean);
                } catch (e) {}
            }
            return [n.imagen_url];
        }
        return ['./imagenes/feria.jpeg'];
    };

    // Helper to safely escape attributes in onclick handlers
    const escapeAttr = (str) => {
        if (!str) return '';
        return String(str)
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '&quot;')
            .replace(/\r?\n/g, ' ');
    };

    // Fetch active noticias, eventos and galeria for landing page (newest first)
    let activeNoticias = [];
    let activeEventos = [];
    let activeGaleria = [];
    try {
        const { data: nData } = await db
            .from('noticias')
            .select('*')
            .eq('activo', true)
            .order('fecha_publicacion', { ascending: false })
            .order('created_at', { ascending: false });
        if (nData && nData.length > 0) {
            activeGaleria = nData.filter(item => item.subtitulo?.toUpperCase() === 'GALERIA');
            activeEventos = nData.filter(item => item.subtitulo?.toUpperCase() !== 'GALERIA' && (item.subtitulo?.toUpperCase() === 'EVENTO' || item.subtitulo?.toUpperCase().includes('EVENTO')));
            activeNoticias = nData.filter(item => item.subtitulo?.toUpperCase() !== 'GALERIA' && item.subtitulo?.toUpperCase() !== 'EVENTO' && !item.subtitulo?.toUpperCase().includes('EVENTO'));
        }
    } catch (e) {
        console.warn('Could not fetch active noticias/eventos/galeria:', e);
    }
    const mainNoticias = activeNoticias.slice(0, 9);

    // Galería dinámica administrada únicamente desde el Dashboard (colimaGC.noticias con subtitulo = 'GALERIA')
    const displayGaleria = activeGaleria.map(g => ({
        id: g.id,
        titulo: g.titulo || 'Galería de Eventos',
        fecha: g.fecha_publicacion
            ? new Date(g.fecha_publicacion + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
            : '',
        imagenes: getNoticiaImages(g)
    }));

    // Helper to find tournament ID for a given event
    const findTournamentForEvent = (eventItem) => {
        const title = (eventItem.titulo || '').toLowerCase();
        const desc = (eventItem.contenido || eventItem.descripcion || '').toLowerCase();
        const dateStr = (eventItem.autor || eventItem.fecha || '').toLowerCase();
        
        // Check Mecate
        if (title.includes('mecate') || desc.includes('mecate') || dateStr.includes('19')) {
            return tourneyMecateId;
        }
        // Check 3ª Fecha
        if ((title.includes('3ª') || title.includes('3a') || title.includes('tercera')) && (title.includes('ranking') || title.includes('stroke'))) {
            return tourney5SeptId;
        }
        // Check 4ª Fecha
        if ((title.includes('4ª') || title.includes('4a') || title.includes('cuarta') || title.includes('final')) && (title.includes('ranking') || title.includes('stroke'))) {
            return tourney26SeptId;
        }
        // Check Anual / Feria
        if (title.includes('anual') || title.includes('feria') || dateStr.includes('noviembre')) {
            const tAnual = allTournamentsData.find(t => t.name?.toLowerCase().includes('anual'));
            if (tAnual) return tAnual.id;
        }
        // Check Ramos
        if (title.includes('ramos') || dateStr.includes('octubre')) {
            const tRamos = allTournamentsData.find(t => t.name?.toLowerCase().includes('ramos'));
            if (tRamos) return tRamos.id;
        }
        // Check Pavo
        if (title.includes('pavo') || dateStr.includes('diciembre')) {
            const tPavo = allTournamentsData.find(t => t.name?.toLowerCase().includes('pavo'));
            if (tPavo) return tPavo.id;
        }
        return null;
    };

    const displayEventos = activeEventos.length > 0 ? activeEventos.map(e => ({
        id: e.id,
        imagen: e.imagen_url || (e.galeria && e.galeria[0]) || './imagenes/feria.jpeg',
        titulo: e.titulo,
        descripcion: e.contenido,
        fecha: (e.autor && e.autor !== 'Administrador' && e.autor !== 'Club de Golf Colima') ? e.autor : (e.fecha_publicacion ? new Date(e.fecha_publicacion + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Próximamente'),
        tournamentId: findTournamentForEvent(e)
    })) : [
        {
            id: 'default-1',
            imagen: './imagenes/feria.jpeg',
            titulo: 'Torneo Anual de Golf Feria de Todos Los Santos',
            descripcion: 'Vuelve el gran festejo del golf en el estado. Prepárate para vivirlo como nunca. Premios sin igual. Tradición, Pasión, Amistad.',
            fecha: '5 al 8 de Noviembre'
        }
    ];

    // Chunk into 4 events per view (2 cols x 2 rows)
    const eventPages = [];
    for (let i = 0; i < displayEventos.length; i += 4) {
        eventPages.push(displayEventos.slice(i, i + 4));
    }

    container.innerHTML = `
        <style>
            @keyframes rankingGradientShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            @keyframes rankingPulseGlow {
                0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.45), 0 0 35px rgba(16, 185, 129, 0.25); }
                50% { box-shadow: 0 0 32px rgba(16, 185, 129, 0.65), 0 0 55px rgba(6, 182, 212, 0.4); }
            }
            .animated-ranking-badge {
                background: linear-gradient(135deg, rgba(2, 6, 23, 0.95), rgba(15, 23, 42, 0.95)) padding-box,
                            linear-gradient(90deg, #f59e0b, #10b981, #06b6d4, #a855f7, #f59e0b) border-box;
                border: 2px solid transparent;
                background-size: 100% 100%, 300% 300%;
                animation: rankingGradientShift 3.5s ease infinite, rankingPulseGlow 2.5s ease-in-out infinite;
            }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            @keyframes tabTextScroll {
                0%, 20% { transform: translateX(0%); }
                75%, 95% { transform: translateX(-35%); }
                100% { transform: translateX(0%); }
            }
            .galeria-tab-btn:hover .tab-marquee-text,
            .galeria-tab-active .tab-marquee-text {
                display: inline-block;
                animation: tabTextScroll 7s ease-in-out infinite;
            }
        </style>
        <div class="min-h-screen bg-[#f7f8f6] text-slate-900 font-display selection:bg-[#7cb518] selection:text-white">
            <!-- 1. TOP NAVBAR (ESTILO EDITORIAL LIMPIO) -->
            <nav class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 transition-all shadow-sm">
                <div class="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
                    <!-- Brand Logo -->
                    <div class="flex items-center gap-3 cursor-pointer shrink-0" onclick="window.scrollTo({top:0, behavior:'smooth'})">
                        <img src="./golcolima.jpg" alt="Club Colima" class="h-10 sm:h-11 w-auto object-contain rounded-xl border border-slate-200 shadow-sm">
                        <div class="whitespace-nowrap">
                            <span class="font-black text-slate-900 text-sm sm:text-base tracking-tight uppercase block leading-none">Club de Golf Colima</span>
                            <span class="text-[9px] sm:text-[10px] font-bold text-[#65a30d] tracking-[0.18em] uppercase mt-1 block">La Cuna del Golf en Colima</span>
                        </div>
                    </div>

                    <!-- Nav Links Desktop -->
                    <div class="hidden lg:flex items-center gap-7 text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap">
                        <a href="#inicio" class="hover:text-[#65a30d] transition-colors">Inicio</a>
                        <a href="#eventos" class="hover:text-[#65a30d] transition-colors">Eventos</a>
                        <a href="#noticias" class="hover:text-[#65a30d] transition-colors">Noticias</a>

                        <!-- Dropdown El Campo -->
                        <div class="relative group py-2">
                            <button class="flex items-center gap-1 hover:text-[#65a30d] transition-colors cursor-pointer font-bold uppercase text-xs tracking-wider text-slate-600 whitespace-nowrap">
                                El Campo <span class="material-icons text-sm transition-transform duration-200 group-hover:rotate-180">expand_more</span>
                            </button>
                            <div class="absolute top-full left-0 hidden group-hover:flex flex-col bg-white border border-slate-200 rounded-2xl p-2 shadow-xl min-w-[230px] z-50 animate-fade-in space-y-1">
                                <a href="#campo" class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-[#65a30d] hover:bg-slate-50 transition-all">
                                    <span class="material-icons text-[#65a30d] text-base">golf_course</span> Recorrido & Hoyos
                                </a>
                                <button onclick="openPublicHandicapModal()" class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-[#005a9c] hover:bg-slate-50 transition-all text-left w-full cursor-pointer">
                                    <span class="material-icons text-[#005a9c] text-base">analytics</span> HDCP Jugadores (WHS)
                                </button>
                            </div>
                        </div>

                        <a href="#servicios" class="hover:text-[#65a30d] transition-colors">Servicios</a>
                        <a href="#contacto" class="hover:text-[#65a30d] transition-colors">Contacto</a>
                    </div>

                    <!-- Quick Action Buttons + Mobile Hamburger Button -->
                    <div class="flex items-center gap-2 sm:gap-3 shrink-0">
                        <button onclick="openTeeTimeModal()"
                            class="hidden md:flex px-4 py-2.5 bg-[#7cb518] hover:bg-[#6ca312] text-white font-bold rounded-full text-xs uppercase tracking-wider shadow-sm transition-all items-center gap-1.5 cursor-pointer">
                            <span class="material-icons" style="font-size:15px">golf_course</span> Tee Time
                        </button>
                        <button onclick="window.location.hash = '#admin'; if (window.renderLogin) window.renderLogin();"
                            class="hidden sm:flex px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-full text-xs uppercase tracking-wider transition-all items-center gap-1.5 cursor-pointer">
                            <span class="material-icons" style="font-size:15px">lock</span> Portal
                        </button>

                        <!-- Botón Hamburguesa Móvil -->
                        <button id="btn-toggle-mobile-menu" onclick="toggleMobileMenu()" class="lg:hidden p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-all focus:outline-none" aria-label="Abrir menú">
                            <span class="material-icons text-xl" id="icon-mobile-toggle">menu</span>
                        </button>
                    </div>
                </div>

                <!-- Menú Desplegable Móvil -->
                <div id="mobile-menu-drawer" class="lg:hidden hidden overflow-hidden transition-all duration-300 max-h-0 opacity-0">
                    <div class="pt-4 pb-2 border-t border-slate-200 mt-3 space-y-2">
                        <div class="grid grid-cols-2 gap-2">
                            <a href="#inicio" onclick="toggleMobileMenu()" class="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider">
                                <span class="material-icons text-[#65a30d] text-base">home</span> Inicio
                            </a>
                            <a href="#eventos" onclick="toggleMobileMenu()" class="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider">
                                <span class="material-icons text-[#65a30d] text-base">photo_library</span> Eventos
                            </a>
                            <a href="#noticias" onclick="toggleMobileMenu()" class="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider">
                                <span class="material-icons text-[#005a9c] text-base">feed</span> Noticias
                            </a>
                            <a href="#campo" onclick="toggleMobileMenu()" class="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider">
                                <span class="material-icons text-[#65a30d] text-base">golf_course</span> El Campo
                            </a>
                            <button onclick="toggleMobileMenu(); openPublicHandicapModal();" class="flex items-center gap-2 p-3 rounded-xl bg-[#005a9c]/10 border border-[#005a9c]/25 text-[#005a9c] text-xs font-black uppercase tracking-wider col-span-2 text-left cursor-pointer">
                                <span class="material-icons text-base">analytics</span> Consultar HDCP Jugadores (WHS)
                            </button>
                        </div>
                        <div class="pt-2 grid grid-cols-2 gap-2">
                            <button onclick="toggleMobileMenu(); openTeeTimeModal();" class="flex items-center justify-center gap-2 p-3 bg-[#7cb518] text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer">
                                Tee Time
                            </button>
                            <button onclick="toggleMobileMenu(); window.location.hash = '#admin'; if (window.renderLogin) window.renderLogin();" class="flex items-center justify-center gap-2 p-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer">
                                <span class="material-icons text-sm">lock</span> Portal
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <!-- 2. HERO SECTION FULL-BLEED (ESTILO GOLF LOUNGE) -->
            <section id="inicio" class="relative min-h-[78vh] flex flex-col justify-between overflow-hidden pt-16 pb-10 px-4 sm:px-8">
                <!-- Background Drone Photo Carousel -->
                <div id="hero-slider" class="absolute inset-0 z-0">
                    ${dronePhotos.map((src, index) => `
                        <div class="hero-slide absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${index === 0 ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}"
                            style="background-image: url('${src}'); filter: brightness(0.75) contrast(1.05);"></div>
                    `).join('')}
                    <div class="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/45 to-transparent"></div>
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/20"></div>
                </div>

                <!-- Contenido Editorial Izquierdo -->
                <div class="relative z-10 max-w-7xl mx-auto w-full my-auto py-8">
                    <div class="max-w-2xl space-y-5 animate-fade-in">
                        <span class="inline-block text-xs font-bold text-[#a3e635] uppercase tracking-[0.2em]">
                            18 Hoyos · Par 68 · 5,660 Yardas
                        </span>
                        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.06]">
                            La Cuna del Golf<br>en Colima.
                        </h1>
                        <p class="text-sm sm:text-base text-slate-200 font-medium leading-relaxed max-w-xl">
                            Disfruta un campo desafiante rodeado de naturaleza tropical, instalaciones de primera y la comunidad golfista más vibrante del estado.
                        </p>

                        <div class="flex flex-wrap items-center gap-3 pt-2">
                            <a href="#eventos" class="px-7 py-3.5 bg-[#7cb518] hover:bg-[#6ca312] text-white font-bold rounded-full text-xs sm:text-sm tracking-wide shadow-lg transition-all hover:-translate-y-0.5 inline-flex items-center gap-2">
                                Explorar Galería de Eventos <span class="material-icons text-base">arrow_forward</span>
                            </a>
                            <button onclick="openPublicHandicapModal()" class="px-6 py-3.5 bg-white/95 hover:bg-white text-slate-900 font-bold rounded-full text-xs sm:text-sm tracking-wide shadow-lg transition-all hover:-translate-y-0.5 inline-flex items-center gap-2 cursor-pointer">
                                <span class="material-icons text-[#005a9c] text-base">analytics</span> Hándicaps WHS
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Tira Flotante Inferior: Galerías Dinámicas Recientes -->
                ${displayGaleria.length > 0 ? `
                    <div class="relative z-10 max-w-7xl mx-auto w-full pt-4">
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-w-4xl">
                            ${displayGaleria.slice(0, 3).map((album, idx) => `
                                <a href="#eventos" onclick="selectEventoGaleriaTab(${idx})"
                                    class="group bg-white/95 hover:bg-white backdrop-blur-md rounded-xl p-2.5 shadow-xl border border-white/60 flex items-center gap-3.5 transition-all hover:-translate-y-1">
                                    <img src="${album.imagenes[0] || './golcolima.jpg'}" alt="${album.titulo}" class="w-20 h-14 object-cover rounded-lg shrink-0" onerror="this.src='./golcolima.jpg'">
                                    <div class="min-w-0 flex-1">
                                        <span class="text-[10px] font-bold text-[#65a30d] uppercase tracking-wider block">Galería · ${album.imagenes.length} fotos</span>
                                        <p class="text-xs font-black text-slate-900 truncate group-hover:text-[#005a9c] transition-colors">${album.titulo}</p>
                                    </div>
                                    <span class="material-icons text-slate-400 group-hover:text-[#65a30d] text-base pr-1">arrow_forward</span>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </section>

            <!-- 3. BANNER DIVIDIDO DESTACADO (TORNEO EN VIVO O HÁNDICAPS WHS — ESTILO SPLIT CARD) -->
            <section id="torneo-destacado" class="py-12 px-4 sm:px-8 max-w-7xl mx-auto">
                ${(() => {
                    if (nextTournament && nextTournamentIsLive) {
                        const tName = nextTournament.name || 'Torneo en Vivo';
                        const tId = nextTournament.id;
                        const customPoster = nextTournament.config?.poster_url;
                        const posterImg = customPoster || './imagenes/DJI_0015.JPG';
                        return `
                        <div class="bg-white rounded-3xl overflow-hidden shadow-[0_15px_50px_rgba(15,23,42,0.08)] border border-slate-200/80 grid grid-cols-1 lg:grid-cols-12">
                            <div class="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center space-y-5">
                                <span class="inline-flex items-center gap-2 text-xs font-black text-emerald-600 uppercase tracking-widest">
                                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> En Competencia Ahora
                                </span>
                                <h2 class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">${tName}</h2>
                                <p class="text-sm text-slate-600 leading-relaxed">
                                    El torneo está en marcha. Consulta el leaderboard hoyo por hoyo y los resultados oficiales en tiempo real.
                                </p>
                                <div class="pt-2">
                                    <button onclick="openLiveLeaderboardModal('${tId}')"
                                        class="px-7 py-3.5 bg-[#7cb518] hover:bg-[#6ca312] text-white font-bold rounded-full text-xs sm:text-sm tracking-wide shadow-md transition-all cursor-pointer inline-flex items-center gap-2">
                                        <span class="material-icons text-base">emoji_events</span> Ver Leaderboard en Vivo
                                    </button>
                                </div>
                            </div>
                            <div class="lg:col-span-6 bg-[#005a9c] relative min-h-[280px] flex items-center justify-center p-6 sm:p-10">
                                <img src="${posterImg}" alt="${tName}" class="max-h-72 w-auto rounded-2xl shadow-2xl object-cover border-4 border-white/20 cursor-pointer hover:scale-[1.02] transition-transform" onclick="openLiveLeaderboardModal('${tId}')" onerror="this.src='./golcolima.jpg'">
                            </div>
                        </div>`;
                    }

                    return `
                    <div class="bg-white rounded-3xl overflow-hidden shadow-[0_15px_50px_rgba(15,23,42,0.08)] border border-slate-200/80 grid grid-cols-1 lg:grid-cols-12">
                        <div class="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center space-y-5">
                            <span class="text-xs font-bold text-[#005a9c] uppercase tracking-widest">Sistema Oficial WHS</span>
                            <h2 class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                                Hándicaps Oficiales &<br>Torneos del Club
                            </h2>
                            <p class="text-sm text-slate-600 leading-relaxed">
                                Consulta el listado actualizado de Handicap Index oficial de la Asociación Mexicana de Golf y el cálculo de golpes por Tee de salida.
                            </p>
                            <div class="flex flex-wrap items-center gap-4 pt-2">
                                <button onclick="openPublicHandicapModal()"
                                    class="px-7 py-3.5 bg-[#7cb518] hover:bg-[#6ca312] text-white font-bold rounded-full text-xs sm:text-sm tracking-wide shadow-md transition-all cursor-pointer">
                                    Consultar HDCP (WHS)
                                </button>
                                <span class="text-sm font-black text-slate-800">Afiliado AMG</span>
                            </div>
                        </div>
                        <div class="lg:col-span-6 bg-[#005a9c] relative min-h-[280px] flex items-center justify-center p-6 sm:p-10 overflow-hidden">
                            <div class="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border-4 border-white/15 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                                <img src="./imagenes/DJI_0015.JPG" alt="Campo Club de Golf Colima" class="w-full h-56 sm:h-64 object-cover">
                                <div class="bg-white/95 px-4 py-3 flex items-center justify-between">
                                    <div class="flex items-center gap-2.5">
                                        <img src="./logoclub.png" alt="AMG" class="h-7 w-auto object-contain">
                                        <span class="text-[11px] font-black text-slate-800 uppercase tracking-wide">Asociación Mexicana de Golf</span>
                                    </div>
                                    <span class="text-xs font-black text-[#65a30d]">18 Hoyos</span>
                                </div>
                            </div>
                        </div>
                    </div>`;
                })()}
            </section>

            <!-- 3.5 SECCIÓN EVENTOS (GALERÍA CON PESTAÑAS, CARRUSEL WEB 8 FOTOS Y SCROLL MÓVIL PINTEREST) -->
            <section id="eventos" class="py-16 px-4 sm:px-8 max-w-7xl mx-auto space-y-10">
                <div class="text-center space-y-2.5">
                    <span class="text-xs font-bold text-[#65a30d] uppercase tracking-widest">Galería Fotográfica</span>
                    <h2 class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Eventos en el Club</h2>
                    <p class="text-slate-600 text-sm max-w-2xl mx-auto">Revive los mejores momentos y torneos en el Club de Golf Colima.</p>
                </div>

                ${displayGaleria.length === 0 ? `
                    <div class="py-12 px-6 bg-white border border-slate-200 rounded-3xl text-center space-y-3 max-w-2xl mx-auto shadow-sm">
                        <div class="w-14 h-14 bg-[#7cb518]/10 text-[#65a30d] rounded-2xl flex items-center justify-center mx-auto">
                            <span class="material-icons text-2xl">photo_library</span>
                        </div>
                        <h4 class="text-lg font-black text-slate-900">Próximamente nuevas galerías</h4>
                        <p class="text-xs text-slate-500 leading-relaxed">
                            Estamos preparando las fotografías de nuestros próximos torneos y eventos especiales.
                        </p>
                    </div>
                ` : `
                <!-- Pestañas por Evento -->
                <div id="evento-galeria-tabs" class="flex items-center justify-start sm:justify-center sm:flex-wrap gap-2 overflow-x-auto sm:overflow-visible no-scrollbar pb-2">
                    ${displayGaleria.map((album, idx) => `
                        <button type="button" onclick="selectEventoGaleriaTab(${idx})" data-galeria-tab="${idx}" title="${album.titulo}"
                            class="galeria-tab-btn shrink-0 max-w-[205px] sm:max-w-[225px] px-3.5 py-2 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1.5 border ${idx === 0 ? 'galeria-tab-active bg-[#7cb518] text-white border-[#7cb518] shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-[#7cb518] hover:text-[#65a30d]'}">
                            <span class="material-icons text-xs shrink-0">photo_library</span>
                            <span class="overflow-hidden whitespace-nowrap flex-1 text-left">
                                <span class="${album.titulo.length > 22 ? 'tab-marquee-text inline-block' : 'truncate block'}">${album.titulo}</span>
                            </span>
                            <span class="px-1.5 py-0.5 rounded-full text-[10px] shrink-0 ${idx === 0 ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'}">${album.imagenes.length}</span>
                        </button>
                    `).join('')}
                </div>

                <!-- Contenedor por Álbum -->
                <div id="evento-galeria-albums">
                    ${displayGaleria.map((album, albumIdx) => {
                        const pages = [];
                        for (let i = 0; i < album.imagenes.length; i += 8) {
                            pages.push(album.imagenes.slice(i, i + 8));
                        }
                        return `
                        <div id="galeria-album-panel-${albumIdx}" class="galeria-album-panel ${albumIdx === 0 ? 'block' : 'hidden'} space-y-6 bg-white p-5 sm:p-8 rounded-3xl border border-slate-200/80 shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
                            <!-- Encabezado del Álbum + Controles Carrusel Web -->
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                <div class="space-y-1 text-center sm:text-left">
                                    <div class="flex items-center justify-center sm:justify-start gap-2.5">
                                        <span class="px-3 py-1 bg-[#7cb518]/15 text-[#4d7c0f] rounded-full text-[10px] font-black uppercase tracking-wider">
                                            ${album.imagenes.length} fotos
                                        </span>
                                        ${album.fecha ? `<span class="text-xs font-bold text-slate-400 uppercase tracking-wider">${album.fecha}</span>` : ''}
                                    </div>
                                    <h3 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">${album.titulo}</h3>
                                </div>

                                <div class="flex items-center justify-center gap-2.5">
                                    ${pages.length > 1 ? `
                                        <div class="hidden md:flex items-center gap-2 mr-2">
                                            <span id="galeria-page-indicator-${albumIdx}" class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                                                1 / ${pages.length}
                                            </span>
                                            <button type="button" onclick="navigateGaleriaCarousel(${albumIdx}, -1)" id="btn-galeria-prev-${albumIdx}"
                                                class="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 hover:bg-[#7cb518] hover:text-white hover:border-[#7cb518] text-slate-700 flex items-center justify-center transition-all cursor-pointer active:scale-95">
                                                <span class="material-icons text-sm">chevron_left</span>
                                            </button>
                                            <button type="button" onclick="navigateGaleriaCarousel(${albumIdx}, 1)" id="btn-galeria-next-${albumIdx}"
                                                class="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 hover:bg-[#7cb518] hover:text-white hover:border-[#7cb518] text-slate-700 flex items-center justify-center transition-all cursor-pointer active:scale-95">
                                                <span class="material-icons text-sm">chevron_right</span>
                                            </button>
                                        </div>
                                    ` : ''}
                                    <button type="button" onclick="openEventoGalleryLightbox(${albumIdx}, 0)"
                                        class="px-5 py-2.5 bg-slate-900 hover:bg-[#7cb518] text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                                        <span class="material-icons text-sm">fullscreen</span> Ver Todas (${album.imagenes.length})
                                    </button>
                                </div>
                            </div>

                            <!-- VERSIÓN WEB / ESCRITORIO: CARRUSEL DE 8 FOTOS (4 cols x 2 filas) -->
                            <div class="hidden md:block">
                                <div class="relative overflow-hidden w-full">
                                    <div id="galeria-slides-track-${albumIdx}" class="flex transition-transform duration-500 ease-out" style="transform: translateX(0%);">
                                        ${pages.map((pageImgs, pageIdx) => `
                                            <div class="w-full flex-shrink-0 grid grid-cols-4 gap-3.5">
                                                ${pageImgs.map((imgSrc, localIdx) => {
                                                    const globalIdx = pageIdx * 8 + localIdx;
                                                    return `
                                                    <div onclick="openEventoGalleryLightbox(${albumIdx}, ${globalIdx})"
                                                        class="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-[4/3] shadow-sm cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                                        <img src="${imgSrc}" alt="${album.titulo} - Foto ${globalIdx + 1}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" onerror="this.src='./golcolima.jpg'">
                                                        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 flex items-end justify-between">
                                                            <span class="text-[10px] font-bold text-white uppercase tracking-wider">Foto ${globalIdx + 1}</span>
                                                            <div class="w-8 h-8 rounded-full bg-[#7cb518] text-white flex items-center justify-center shadow">
                                                                <span class="material-icons text-sm">zoom_in</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    `;
                                                }).join('')}
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>

                                ${pages.length > 1 ? `
                                    <div class="flex items-center justify-center gap-2 mt-6">
                                        ${pages.map((_, dotIdx) => `
                                            <button type="button" onclick="goToGaleriaPage(${albumIdx}, ${dotIdx})"
                                                class="galeria-dot-${albumIdx} h-2 rounded-full transition-all cursor-pointer ${dotIdx === 0 ? 'bg-[#7cb518] w-8' : 'bg-slate-300 hover:bg-slate-400 w-2'}"
                                                data-page="${dotIdx}">
                                            </button>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>

                            <!-- VERSIÓN MÓVIL / CELULAR: SCROLL HORIZONTAL FLUIDO ESTILO PINTEREST -->
                            <div class="block md:hidden space-y-3">
                                <div class="flex items-center justify-between px-1">
                                    <span class="text-[10px] font-black text-[#65a30d] uppercase tracking-widest flex items-center gap-1.5">
                                        <span class="material-icons text-xs">swipe</span> Desliza para explorar
                                    </span>
                                    <span class="text-[10px] font-bold text-slate-400 uppercase">Toca para ampliar</span>
                                </div>
                                <div id="galeria-mobile-strip-${albumIdx}" class="galeria-mobile-strip flex gap-3.5 overflow-x-auto snap-x snap-mandatory no-scrollbar py-2 px-4 -mx-4">
                                    ${album.imagenes.map((imgSrc, photoIdx) => `
                                        <div onclick="openEventoGalleryLightbox(${albumIdx}, ${photoIdx})"
                                            class="galeria-mobile-card w-[74vw] max-w-[300px] shrink-0 snap-center relative rounded-3xl overflow-hidden border border-slate-200 bg-slate-100 aspect-[3/4] shadow-lg cursor-pointer transition-transform duration-300">
                                            <img src="${imgSrc}" alt="${album.titulo} - Foto ${photoIdx + 1}" class="w-full h-full object-cover" loading="lazy" onerror="this.src='./golcolima.jpg'">
                                            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent p-4 flex items-end justify-between">
                                                <span class="px-3 py-1 bg-white/90 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-wider shadow">
                                                    ${photoIdx + 1} / ${album.imagenes.length}
                                                </span>
                                                <div class="w-9 h-9 rounded-full bg-[#7cb518] text-white flex items-center justify-center shadow-lg">
                                                    <span class="material-icons text-base">zoom_in</span>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
                `}
            </section>

            <!-- 3.6 SECCIÓN NOTICIAS (ESTILO EDITORIAL GOLF LOUNGE) -->
            <section id="noticias" class="py-16 bg-[#eef1ec] border-y border-slate-200/80 px-4 sm:px-8">
                <div class="max-w-7xl mx-auto space-y-10">
                    <div class="text-center space-y-2">
                        <span class="text-xs font-bold text-[#65a30d] uppercase tracking-widest">Actualidad del Club</span>
                        <h2 class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Eventos & Noticias</h2>
                    </div>

                    <!-- Grid de 3 Columnas -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${activeNoticias.length === 0 ? `
                            <div class="col-span-full py-12 px-6 bg-white border border-slate-200 rounded-3xl text-center space-y-3 max-w-2xl mx-auto shadow-sm">
                                <div class="w-14 h-14 bg-[#7cb518]/10 text-[#65a30d] rounded-2xl flex items-center justify-center mx-auto">
                                    <span class="material-icons text-2xl">feed</span>
                                </div>
                                <h4 class="text-lg font-black text-slate-900">Próximamente más notas y artículos</h4>
                                <p class="text-xs text-slate-500 leading-relaxed">
                                    Estamos preparando nuevas noticias y coberturas especiales de nuestros torneos.
                                </p>
                            </div>
                        ` : mainNoticias.map(n => {
                            const imgs = getNoticiaImages(n);
                            const coverImg = imgs[0] || './imagenes/feria.jpeg';
                            const fechaStr = n.fecha_publicacion
                                ? new Date(n.fecha_publicacion + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
                                : '';
                            return `
                                <div class="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 hover:-translate-y-1 flex flex-col" onclick="openNoticiaModal('${n.id}')">
                                    <div class="relative aspect-[16/10] overflow-hidden bg-slate-100">
                                        <img src="${coverImg}" alt="${n.titulo}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" onerror="this.src='./golcolima.jpg'" loading="lazy">
                                        ${imgs.length > 1 ? `
                                            <div class="absolute top-3 right-3">
                                                <span class="px-2.5 py-1 bg-white/95 text-slate-800 rounded-full text-[10px] font-bold flex items-center gap-1 shadow">
                                                    <span class="material-icons text-[#65a30d]" style="font-size:12px">collections</span> ${imgs.length}
                                                </span>
                                            </div>
                                        ` : ''}
                                    </div>
                                    <div class="p-5 flex-1 flex flex-col justify-between space-y-3">
                                        <div class="space-y-1.5">
                                            ${fechaStr ? `<span class="text-[11px] font-bold text-[#65a30d] uppercase tracking-wider block">${fechaStr}</span>` : ''}
                                            <h4 class="text-base font-black text-slate-900 leading-snug group-hover:text-[#005a9c] transition-colors line-clamp-2">
                                                ${n.titulo}
                                            </h4>
                                        </div>
                                        <span class="text-xs font-bold text-slate-500 group-hover:text-[#65a30d] inline-flex items-center gap-1 transition-colors">
                                            Leer nota <span class="material-icons text-sm">arrow_forward</span>
                                        </span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    ${activeNoticias.length > 9 ? `
                        <div class="flex justify-center pt-2">
                            <button onclick="openAllNoticiasModal()" class="inline-flex items-center gap-2 px-7 py-3.5 bg-[#7cb518] hover:bg-[#6ca312] text-white font-bold rounded-full text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer">
                                <span class="material-icons text-base">grid_view</span>
                                <span>Ver Todas las Noticias (${activeNoticias.length})</span>
                            </button>
                        </div>
                    ` : ''}
                </div>
            </section>

            <!-- 4. SECCIÓN SERVICIOS (4 TARJETAS VERTICALES ESTILO "GOLF FÜR ALLE") -->
            <section id="servicios" class="py-16 px-4 sm:px-8 max-w-7xl mx-auto space-y-10">
                <div class="text-center space-y-2">
                    <span class="text-xs font-bold text-[#65a30d] uppercase tracking-widest">Experiencia Integral</span>
                    <h2 class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Golf Para Todos</h2>
                    <p class="text-slate-600 text-sm max-w-2xl mx-auto">Todo lo necesario para que tu jornada de golf sea perfecta de principio a fin.</p>
                </div>

                <!-- 4 Tarjetas Verticales con Foto de Campo -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col">
                        <div class="aspect-[4/3] overflow-hidden bg-slate-100">
                            <img src="./imagenes/DJI_0001.JPG" alt="Caddie Master" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
                        </div>
                        <div class="p-5 space-y-2 flex-1 flex flex-col justify-between">
                            <div>
                                <span class="text-[10px] font-bold text-[#65a30d] uppercase tracking-wider">Salidas & Campo</span>
                                <h3 class="font-black text-slate-900 text-lg mt-0.5">Caddie Master</h3>
                                <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">Control de salidas express, caddies experimentados y tiempos de juego.</p>
                            </div>
                            <button onclick="openTeeTimeModal()" class="text-xs font-bold text-slate-800 hover:text-[#65a30d] inline-flex items-center gap-1 pt-2 cursor-pointer">
                                Reservar Tee Time <span class="material-icons text-sm">arrow_forward</span>
                            </button>
                        </div>
                    </div>

                    <div class="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col">
                        <div class="aspect-[4/3] overflow-hidden bg-slate-100">
                            <img src="./imagenes/DJI_0003.JPG" alt="Torneos y Competencias" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
                        </div>
                        <div class="p-5 space-y-2 flex-1 flex flex-col justify-between">
                            <div>
                                <span class="text-[10px] font-bold text-[#65a30d] uppercase tracking-wider">Competencia</span>
                                <h3 class="font-black text-slate-900 text-lg mt-0.5">Torneos & Oyeses</h3>
                                <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">Torneos semanales, eventos empresariales y leaderboard en tiempo real.</p>
                            </div>
                            <a href="#eventos" class="text-xs font-bold text-slate-800 hover:text-[#65a30d] inline-flex items-center gap-1 pt-2">
                                Ver Galería <span class="material-icons text-sm">arrow_forward</span>
                            </a>
                        </div>
                    </div>

                    <div onclick="openPublicHandicapModal()" class="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col cursor-pointer">
                        <div class="aspect-[4/3] overflow-hidden bg-slate-100">
                            <img src="./imagenes/DJI_0008.JPG" alt="Handicaps WHS" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
                        </div>
                        <div class="p-5 space-y-2 flex-1 flex flex-col justify-between">
                            <div>
                                <span class="text-[10px] font-bold text-[#005a9c] uppercase tracking-wider">Sistema Oficial</span>
                                <h3 class="font-black text-slate-900 text-lg mt-0.5">Hándicaps WHS</h3>
                                <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">Consulta el Handicap Index oficial y cálculo de golpes por Tee de salida.</p>
                            </div>
                            <span class="text-xs font-bold text-[#005a9c] inline-flex items-center gap-1 pt-2">
                                Consultar listado <span class="material-icons text-sm">arrow_forward</span>
                            </span>
                        </div>
                    </div>

                    <div class="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col">
                        <div class="aspect-[4/3] overflow-hidden bg-slate-100">
                            <img src="./imagenes/DJI_0012.JPG" alt="Casa Club" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
                        </div>
                        <div class="p-5 space-y-2 flex-1 flex flex-col justify-between">
                            <div>
                                <span class="text-[10px] font-bold text-[#65a30d] uppercase tracking-wider">Hospitalidad</span>
                                <h3 class="font-black text-slate-900 text-lg mt-0.5">Casa Club & Carritos</h3>
                                <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">Alimentos y bebidas con vista al hoyo 18, renta de carritos y equipo.</p>
                            </div>
                            <a href="#contacto" class="text-xs font-bold text-slate-800 hover:text-[#65a30d] inline-flex items-center gap-1 pt-2">
                                Contáctanos <span class="material-icons text-sm">arrow_forward</span>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 5. SECCIÓN EL CAMPO (TEES + MOSAICO AÉREO ESTILO INSTAGRAM FEED) -->
            <section id="campo" class="py-16 bg-white border-y border-slate-200/80 px-4 sm:px-8">
                <div class="max-w-7xl mx-auto space-y-10">
                    <div class="text-center space-y-2">
                        <span class="text-xs font-bold text-[#65a30d] uppercase tracking-widest">Recorrido Aéreo HD</span>
                        <h2 class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Nuestro Campo de Golf</h2>
                        <p class="text-slate-600 text-sm max-w-2xl mx-auto">
                            Fairways amplios, trampas estratégicas y greens perfectamente cuidados rodeados de palmeras.
                        </p>
                    </div>

                    <!-- Marcas de Salida -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="p-6 bg-[#f7f8f6] border border-slate-200 rounded-2xl space-y-2.5">
                            <div class="flex items-center gap-3">
                                <span class="w-10 h-10 rounded-xl bg-white border border-slate-300 text-slate-900 font-black flex items-center justify-center text-base shadow-sm">B</span>
                                <div>
                                    <h3 class="font-black text-slate-900 text-base">Tee Blanco (White)</h3>
                                    <p class="text-[11px] text-slate-500 font-bold">5,660 Yds · Rating 66.5 · Slope 125</p>
                                </div>
                            </div>
                            <p class="text-xs text-slate-600 leading-relaxed">Marca principal para caballeros. Exige precisión en las salidas y control de distancia.</p>
                        </div>

                        <div class="p-6 bg-[#f7f8f6] border border-slate-200 rounded-2xl space-y-2.5">
                            <div class="flex items-center gap-3">
                                <span class="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-base shadow-sm">D</span>
                                <div>
                                    <h3 class="font-black text-slate-900 text-base">Tee Dorado (Gold)</h3>
                                    <p class="text-[11px] text-slate-500 font-bold">5,158 Yds · Rating 65.7 · Slope 122</p>
                                </div>
                            </div>
                            <p class="text-xs text-slate-600 leading-relaxed">Ideal para jugadores sénior e intermedios buscando equilibrio entre reto y distancia.</p>
                        </div>

                        <div class="p-6 bg-[#f7f8f6] border border-slate-200 rounded-2xl space-y-2.5">
                            <div class="flex items-center gap-3">
                                <span class="w-10 h-10 rounded-xl bg-rose-600 text-white font-black flex items-center justify-center text-base shadow-sm">P</span>
                                <div>
                                    <h3 class="font-black text-slate-900 text-base">Tee Plateada (Silver)</h3>
                                    <p class="text-[11px] text-slate-500 font-bold">4,768 Yds · Rating 65.5 · Slope 121</p>
                                </div>
                            </div>
                            <p class="text-xs text-slate-600 leading-relaxed">Marca de salida para damas y juveniles. Configuración ideal para estrategia y colocación.</p>
                        </div>
                    </div>

                    <!-- Mosaico Compacto Estilo Instagram Feed -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                        ${dronePhotos.slice(0, 8).map((src, idx) => `
                            <div onclick="openDronePhotoLightbox(${idx})"
                                class="group relative rounded-xl overflow-hidden aspect-square bg-slate-100 cursor-pointer shadow-sm">
                                <img src="${src}" alt="Club de Golf Colima Vista Aérea" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy">
                                <div class="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span class="w-10 h-10 rounded-full bg-white/95 text-slate-900 flex items-center justify-center shadow-lg">
                                        <span class="material-icons text-base">zoom_in</span>
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>

            <!-- 6. SECCIÓN INFORMACIÓN DE CONTACTO & UBICACIÓN -->
            <section id="contacto" class="py-16 px-4 sm:px-8 max-w-7xl mx-auto space-y-10">
                <div class="text-center space-y-2">
                    <span class="text-xs font-bold text-[#65a30d] uppercase tracking-widest">Visítanos</span>
                    <h2 class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Estamos Para Ti</h2>
                    <p class="text-slate-600 text-sm max-w-2xl mx-auto">Estamos listos para recibirte en las mejores instalaciones de golf de la región.</p>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    <!-- Contact Cards -->
                    <div class="lg:col-span-5 space-y-3.5">
                        <div class="p-5 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 shadow-sm">
                            <div class="w-11 h-11 rounded-xl bg-[#7cb518]/15 flex items-center justify-center text-[#65a30d] shrink-0">
                                <span class="material-icons">location_on</span>
                            </div>
                            <div>
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dirección Oficial</p>
                                <p class="text-sm font-bold text-slate-900 mt-0.5 leading-snug">Autopista Colima Manzanillo Km. 4, Colima, México, CP 28060</p>
                            </div>
                        </div>

                        <div class="p-5 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 shadow-sm">
                            <div class="w-11 h-11 rounded-xl bg-[#005a9c]/10 flex items-center justify-center text-[#005a9c] shrink-0">
                                <span class="material-icons">call</span>
                            </div>
                            <div>
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono de Atención</p>
                                <a href="tel:+13123070233" class="text-sm font-bold text-slate-900 hover:text-[#005a9c] transition-colors mt-0.5 block">+1 312-307-0233</a>
                            </div>
                        </div>

                        <div class="p-5 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 shadow-sm">
                            <div class="w-11 h-11 rounded-xl bg-[#7cb518]/15 flex items-center justify-center text-[#65a30d] shrink-0">
                                <span class="material-icons">chat</span>
                            </div>
                            <div>
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp Directo</p>
                                <a href="https://wa.me/5213121942559" target="_blank" class="text-sm font-bold text-[#65a30d] hover:underline mt-0.5 block">+52 1 312 194 2559</a>
                            </div>
                        </div>

                        <div class="p-5 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 shadow-sm">
                            <div class="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 shrink-0">
                                <span class="material-icons">email</span>
                            </div>
                            <div>
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Correo Electrónico</p>
                                <a href="mailto:golf.colima@gmail.com" class="text-sm font-bold text-slate-900 hover:text-[#005a9c] transition-colors mt-0.5 block">golf.colima@gmail.com</a>
                            </div>
                        </div>
                    </div>

                    <!-- Map / Location Showcase (Natural Light Map) -->
                    <div class="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-3 overflow-hidden relative min-h-[340px] flex flex-col justify-between shadow-sm">
                        <div class="relative w-full h-full min-h-[290px] rounded-xl overflow-hidden">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15064.912384747285!2d-103.7383125!3d19.2721875!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x84255aa0a66d0001%3A0x8849b294c65db55b!2sClub%20de%20Golf%20de%20Colima!5e0!3m2!1ses!2smx!4v1700000000000!5m2!1ses!2smx"
                                class="w-full h-full border-0 absolute inset-0"
                                allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                        </div>
                        <div class="pt-3 px-2 flex items-center justify-between gap-4">
                            <span class="text-xs font-bold text-slate-500">Autopista Colima Manzanillo Km. 4</span>
                            <a href="https://maps.google.com/?q=Club+de+Golf+de+Colima" target="_blank" class="px-4 py-2 bg-[#7cb518] hover:bg-[#6ca312] text-white rounded-full text-xs font-bold uppercase transition-all">
                                Abrir en Maps ➔
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 7. FOOTER (LIMPIO) -->
            <footer class="border-t border-slate-200 bg-white py-10 px-4 sm:px-8 text-xs text-slate-500 font-bold">
                <div class="max-w-7xl mx-auto space-y-6">
                    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div class="flex items-center gap-3">
                            <img src="./golcolima.jpg" alt="Logo Colima GC" class="h-8 w-auto rounded-lg border border-slate-200">
                            <span class="text-slate-700">© 2026 Club de Golf Colima. Todos los derechos reservados.</span>
                        </div>
                        <div class="flex items-center gap-6">
                            <a href="https://clubdegolfdecolima.com" target="_blank" class="hover:text-[#65a30d] transition-colors">clubdegolfdecolima.com</a>
                            <a href="#admin" onclick="if (window.renderLogin) window.renderLogin();" class="hover:text-[#005a9c] transition-colors">Acceso Administrador</a>
                        </div>
                    </div>

                    <div class="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <span class="text-[11px] text-slate-400 font-medium">Diseño y Desarrollo Web por</span>
                        <a href="https://gooweb.click/" target="_blank" rel="noopener noreferrer"
                           class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-all group"
                           title="Visitar GooWeb">
                            <img src="./gooweb1.png" alt="GooWeb" class="h-5 w-auto object-contain">
                            <span class="text-xs font-black text-slate-700 uppercase">GooWeb</span>
                            <span class="material-icons text-slate-400 text-xs">open_in_new</span>
                        </a>
                    </div>
                </div>
            </footer>

            <!-- MODAL INTERACTIVO DE LA CONVOCATORIA OFICIAL (DISEÑO POSTER / MUESTRA EDITORIAL) -->
            <div id="convocatoria-modal" class="hidden fixed inset-0 z-[110] items-center justify-center p-2 sm:p-4 opacity-0 transition-opacity duration-300">
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-black/85 backdrop-blur-xl cursor-pointer" onclick="closeConvocatoriaModal()"></div>

                <!-- Modal Container -->
                <div id="convocatoria-modal-content" class="relative w-full max-w-4xl bg-[#fbfaf8] text-slate-900 rounded-[2rem] shadow-[0_25px_80px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[95vh] transform scale-95 transition-transform duration-300 border-2 border-white/20">
                    
                    <!-- Barra Flotante Superior de Controles (Cambiar Foto del Campo, Imprimir, Cerrar) -->
                    <div class="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-950 text-white border-b border-slate-800 shrink-0 z-30">
                        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar">
                            <span class="text-[10px] font-black uppercase tracking-widest text-amber-400 shrink-0 flex items-center gap-1">
                                <span class="material-icons text-sm">photo_camera</span> Foto Campo:
                            </span>
                            <button onclick="changeConvocatoriaCoursePhoto('./imagenes/DJI_0001.JPG', this)" class="conv-photo-btn px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all shrink-0">
                                Vista 1 (Green y Lago)
                            </button>
                            <button onclick="changeConvocatoriaCoursePhoto('./imagenes/DJI_0015.JPG', this)" class="conv-photo-btn px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all shrink-0">
                                Vista 2 (Hoyo y Lago)
                            </button>
                            <button onclick="changeConvocatoriaCoursePhoto('./imagenes/DJI_0003.JPG', this)" class="conv-photo-btn px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all shrink-0">
                                Vista 3 (Palmeras)
                            </button>
                            <button onclick="changeConvocatoriaCoursePhoto('./imagenes/DJI_0012.JPG', this)" class="conv-photo-btn px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all shrink-0">
                                Vista 4 (Panorámica)
                            </button>
                        </div>

                        <div class="flex items-center gap-2 shrink-0 ml-auto">
                            <button onclick="printConvocatoriaOficial()" title="Imprimir o Guardar PDF" class="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shadow">
                                <span class="material-icons text-sm">print</span> Imprimir / PDF
                            </button>
                            <button onclick="closeConvocatoriaModal()" class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-200 hover:text-white flex items-center justify-center transition-all cursor-pointer">
                                <span class="material-icons text-lg">close</span>
                            </button>
                        </div>
                    </div>

                    <!-- Lienzo Scrollable Estilo Poster Muestra -->
                    <div class="overflow-y-auto flex-1 scroll-smooth bg-[#fbfaf8] text-slate-900">
                        
                        <!-- 1. CABECERA VISUAL CON FOTO DEL CAMPO Y CURVAS BLANCAS SUPERIOR E INFERIOR (ESTILO MUESTRA) -->
                        <div class="relative w-full h-[330px] sm:h-[430px] overflow-hidden bg-emerald-950 select-none">
                            <!-- Imagen Panorámica del Campo de Golf -->
                            <img id="conv-modal-course-img" src="./imagenes/DJI_0001.JPG" alt="Campo Club de Golf de Colima" class="w-full h-full object-cover object-center">
                            <div class="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25"></div>

                            <!-- Domo Curvo Blanco Superior con el Logo del Club y el Logo del Torneo -->
                            <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] sm:w-[76%] max-w-[580px] bg-white rounded-b-[100%] pt-3 sm:pt-4 pb-7 sm:pb-9 px-6 sm:px-12 shadow-[0_15px_40px_rgba(0,0,0,0.32)] flex flex-col items-center text-center z-10">
                                <div class="flex items-center justify-center gap-4 sm:gap-7">
                                    <img src="./imagenes/logo_club_colima.jpeg" alt="Club de Golf de Colima" class="h-14 sm:h-20 w-auto object-contain">
                                    <div class="h-12 sm:h-16 w-[1.5px] bg-slate-200"></div>
                                    <img src="./imagenes/logo_torneo_feria_2026.png" alt="Feria de Todos los Santos Colima 2026" class="h-16 sm:h-24 w-auto object-contain">
                                </div>
                                <p class="text-[10px] sm:text-xs font-black uppercase tracking-[0.22em] text-slate-800 mt-1.5">
                                    TORNEO ANUAL DE GOLF · CLUB DE GOLF DE COLIMA
                                </p>
                            </div>

                            <!-- Arco Blanco Inferior que sube sobre la foto (Exactamente como la Muestra) -->
                            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[130%] h-24 sm:h-32 bg-[#fbfaf8] rounded-t-[100%] shadow-[0_-12px_32px_rgba(0,0,0,0.22)] z-10 flex flex-col items-center justify-end pb-1 sm:pb-2 px-4 text-center">
                                <span class="text-[10px] sm:text-xs font-black uppercase tracking-[0.28em] text-emerald-800">
                                    COLIMA, 2026 &nbsp;|&nbsp; 5 AL 8 DE NOVIEMBRE &nbsp;|&nbsp; CLUB DE GOLF DE COLIMA
                                </span>
                                <h2 class="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#d91b5c] leading-none mt-1">
                                    CONVOCATORIA <span class="text-amber-600">2026</span>
                                </h2>
                            </div>
                        </div>

                        <!-- 2. CINTILLO DE MODALIDADES Y SISTEMA DE JUEGO -->
                        <div class="px-5 sm:px-10 pt-2 pb-6 bg-[#fbfaf8]">
                            <div class="max-w-3xl mx-auto text-center space-y-2 border-b-2 border-slate-200 pb-5">
                                <div class="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-black text-slate-800">
                                    <span class="px-3.5 py-1.5 rounded-full bg-emerald-900 text-white uppercase tracking-wide shadow-sm">
                                        Formato Stroke Play: Categorías A, B, Damas, Senior y Super Senior
                                    </span>
                                    <span class="px-3.5 py-1.5 rounded-full bg-amber-500 text-slate-950 uppercase tracking-wide shadow-sm">
                                        Formato Stableford: Categoría C
                                    </span>
                                </div>
                                <p class="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 pt-1">
                                    Sistema de juego por golpes a 54 hoyos. &nbsp;|&nbsp; <span class="text-[#d91b5c] underline decoration-2 underline-offset-4">HANDICAP AL 80%</span>
                                </p>
                            </div>

                            <!-- 3. CUERPO EDITORIAL EN DOS COLUMNAS (ESTILO MUESTRA) -->
                            <div class="mt-7 grid grid-cols-1 md:grid-cols-12 gap-7 items-start text-left">
                                
                                <!-- COLUMNA IZQUIERDA (7 cols): Categorías, Programa de Salidas y Premios -->
                                <div class="md:col-span-7 space-y-7">
                                    
                                    <!-- SECCIÓN I: CATEGORÍAS Y SALIDAS -->
                                    <div id="conv-sec-categorias" class="space-y-3">
                                        <div>
                                            <h3 class="text-lg sm:text-xl font-black uppercase text-[#d91b5c] tracking-tight leading-none">
                                                I. CATEGORÍAS Y SALIDAS
                                            </h3>
                                            <div class="w-12 h-1.5 bg-emerald-800 mt-1.5 rounded-full"></div>
                                        </div>

                                        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden text-xs sm:text-[13px]">
                                            <div class="px-4 py-2.5 flex items-center justify-between gap-2">
                                                <div><strong class="text-slate-900 uppercase">A</strong> <span class="text-slate-600 font-semibold">(0-9 handicap)</span></div>
                                                <div class="flex items-center gap-1.5 font-black text-slate-800">
                                                    <span>Marcas: Azul/Blancas</span>
                                                    <span class="w-3.5 h-3.5 rounded-full bg-blue-600 border border-blue-800 inline-block"></span>
                                                    <span class="w-3.5 h-3.5 rounded-full bg-white border border-slate-400 inline-block"></span>
                                                </div>
                                            </div>
                                            <div class="px-4 py-2.5 flex items-center justify-between gap-2">
                                                <div><strong class="text-slate-900 uppercase">B</strong> <span class="text-slate-600 font-semibold">(10-19 handicap)</span></div>
                                                <div class="flex items-center gap-1.5 font-black text-slate-800">
                                                    <span>Marcas: Azul/Blancas</span>
                                                    <span class="w-3.5 h-3.5 rounded-full bg-blue-600 border border-blue-800 inline-block"></span>
                                                    <span class="w-3.5 h-3.5 rounded-full bg-white border border-slate-400 inline-block"></span>
                                                </div>
                                            </div>
                                            <div class="px-4 py-2.5 flex items-center justify-between gap-2 bg-amber-50/60">
                                                <div><strong class="text-slate-900 uppercase">C</strong> <span class="text-slate-600 font-semibold">(20-28 handicap · Stableford)</span></div>
                                                <div class="flex items-center gap-1.5 font-black text-slate-800">
                                                    <span>Marcas: Azul/Blancas</span>
                                                    <span class="w-3.5 h-3.5 rounded-full bg-blue-600 border border-blue-800 inline-block"></span>
                                                    <span class="w-3.5 h-3.5 rounded-full bg-white border border-slate-400 inline-block"></span>
                                                </div>
                                            </div>
                                            <div class="px-4 py-2.5 flex items-center justify-between gap-2">
                                                <div><strong class="text-slate-900 uppercase">Damas</strong> <span class="text-slate-600 font-semibold">(0-32 handicap, categoría única)</span></div>
                                                <div class="flex items-center gap-1.5 font-black text-rose-700">
                                                    <span>Marcas: Rojas/Rojas</span>
                                                    <span class="w-3.5 h-3.5 rounded-full bg-red-600 border border-red-800 inline-block"></span>
                                                    <span class="w-3.5 h-3.5 rounded-full bg-red-600 border border-red-800 inline-block"></span>
                                                </div>
                                            </div>
                                            <div class="px-4 py-2.5 flex items-center justify-between gap-2">
                                                <div><strong class="text-slate-900 uppercase">Senior</strong> <span class="text-slate-600 font-semibold">(60+ años)</span></div>
                                                <div class="flex items-center gap-1.5 font-black text-amber-700">
                                                    <span>Marcas: Doradas/Doradas</span>
                                                    <span class="w-3.5 h-3.5 rounded-full bg-amber-400 border border-amber-600 inline-block"></span>
                                                    <span class="w-3.5 h-3.5 rounded-full bg-amber-400 border border-amber-600 inline-block"></span>
                                                </div>
                                            </div>
                                            <div class="px-4 py-2.5 flex items-center justify-between gap-2">
                                                <div><strong class="text-slate-900 uppercase">Super Senior</strong> <span class="text-slate-600 font-semibold">(70+ años)</span></div>
                                                <div class="flex items-center gap-1.5 font-black text-slate-700">
                                                    <span>Marcas: Plateadas/Plateadas</span>
                                                    <span class="w-3.5 h-3.5 rounded-full bg-slate-400 border border-slate-600 inline-block"></span>
                                                    <span class="w-3.5 h-3.5 rounded-full bg-slate-400 border border-slate-600 inline-block"></span>
                                                </div>
                                            </div>
                                        </div>
                                        <p class="text-[11px] text-slate-600 italic leading-snug">
                                            *Handicap máximo caballeros 28, damas 32. **El handicap a considerar será el del <strong>15 de octubre de 2026</strong>.
                                        </p>
                                    </div>

                                    <!-- SECCIÓN II: PROGRAMA DE SALIDAS Y EVENTOS -->
                                    <div id="conv-sec-programa" class="space-y-3">
                                        <div>
                                            <h3 class="text-lg sm:text-xl font-black uppercase text-[#d91b5c] tracking-tight leading-none">
                                                II. PROGRAMA DE SALIDAS Y EVENTOS
                                            </h3>
                                            <div class="w-12 h-1.5 bg-emerald-800 mt-1.5 rounded-full"></div>
                                        </div>

                                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                            <div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
                                                <h4 class="font-black text-emerald-900 uppercase border-b border-slate-100 pb-1">Jueves 5 de Noviembre</h4>
                                                <p class="text-slate-700"><strong>8:00 hrs</strong> - C, Senior y Super Senior</p>
                                                <p class="text-slate-700"><strong>18:00 hrs</strong> - Coctel de Bienvenida</p>
                                                <p class="text-slate-700"><strong>19:00 hrs</strong> - Torneo de Putt</p>
                                            </div>

                                            <div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
                                                <h4 class="font-black text-emerald-900 uppercase border-b border-slate-100 pb-1">Viernes 6 de Noviembre</h4>
                                                <p class="text-slate-700"><strong>8:00 hrs</strong> - Damas, C, Senior y Super Senior</p>
                                                <p class="text-slate-700"><strong>13:00 hrs</strong> - A y B</p>
                                                <p class="text-emerald-800 font-bold"><strong>Al terminar:</strong> Torneo de Approach</p>
                                            </div>

                                            <div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
                                                <h4 class="font-black text-emerald-900 uppercase border-b border-slate-100 pb-1">Sábado 7 de Noviembre</h4>
                                                <p class="text-slate-700"><strong>8:00 hrs</strong> - Damas, C, Senior y Super Senior</p>
                                                <p class="text-slate-700"><strong>13:00 hrs</strong> - A y B</p>
                                            </div>

                                            <div class="p-3.5 rounded-2xl bg-amber-50/80 border-2 border-amber-400/70 shadow-sm space-y-1.5">
                                                <h4 class="font-black text-[#d91b5c] uppercase border-b border-amber-200 pb-1">Domingo 8 de Noviembre</h4>
                                                <p class="text-slate-800"><strong>7:30 hrs</strong> - Categorías A, B y Damas (salidas por teetime)</p>
                                                <p class="text-slate-900 font-bold">Comida, Premiación y Clausura al término del torneo</p>
                                            </div>
                                        </div>
                                        <p class="text-[11px] text-slate-600 italic leading-snug">
                                            *Las Senior A y B, así como los Super Senior A y B saldrán en las salidas indicadas como Senior y Super Senior.
                                        </p>
                                    </div>

                                    <!-- SECCIÓN III: PREMIOS Y RECOMPENSAS -->
                                    <div id="conv-sec-premios" class="space-y-3">
                                        <div>
                                            <h3 class="text-lg sm:text-xl font-black uppercase text-[#d91b5c] tracking-tight leading-none">
                                                III. PREMIOS Y RECOMPENSAS
                                            </h3>
                                            <div class="w-12 h-1.5 bg-emerald-800 mt-1.5 rounded-full"></div>
                                        </div>

                                        <ul class="space-y-2 text-xs sm:text-[13px] text-slate-800 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm leading-relaxed">
                                            <li class="flex items-start gap-2">
                                                <span class="text-[#d91b5c] font-black">•</span>
                                                <span>Habrá premio para los <strong>3 primeros lugares netos por categoría</strong>, al <strong>mejor gross por categoría</strong> y al <strong>mejor gross del torneo</strong>.</span>
                                            </li>
                                            <li class="flex items-start gap-2">
                                                <span class="text-[#d91b5c] font-black">•</span>
                                                <span>Premios a los mejores <strong>O'Yeses en el hoyo 2-11, 5-14 y 7-16</strong>.</span>
                                            </li>
                                            <li class="flex items-start gap-2">
                                                <span class="text-[#d91b5c] font-black">•</span>
                                                <span><strong>Hole in One en el hoyo 2:</strong> premio de un <strong>carrito de golf</strong>.</span>
                                            </li>
                                            <li class="flex items-start gap-2">
                                                <span class="text-[#d91b5c] font-black">•</span>
                                                <span><strong>Hole in One en el hoyo 16:</strong> premio de un <strong>carrito de golf</strong>.</span>
                                            </li>
                                            <li class="flex items-start gap-2">
                                                <span class="text-[#d91b5c] font-black">•</span>
                                                <span>Se otorgarán <strong>únicamente 2 carritos de golf</strong> durante todo el torneo, uno correspondiente al <strong>hoyo 2</strong> y otro al <strong>hoyo 16</strong>.</span>
                                            </li>
                                            <li class="flex items-start gap-2">
                                                <span class="text-[#d91b5c] font-black">•</span>
                                                <span>En caso de registrarse más de un Hole in One en el mismo hoyo, el carrito será otorgado <strong>únicamente al primer jugador que lo consiga</strong>.</span>
                                            </li>
                                            <li class="flex items-start gap-2">
                                                <span class="text-[#d91b5c] font-black">•</span>
                                                <span>Los Hole in One posteriores realizados en ese mismo hoyo no generarán un carrito adicional, pero <strong>sí serán reconocidos como O’Yes</strong> para efectos de premiación.</span>
                                            </li>
                                            <li class="flex items-start gap-2">
                                                <span class="text-[#d91b5c] font-black">•</span>
                                                <span>El premio por <strong>Hole in One en el hoyo 5-14</strong> será una <strong>anualidad en el club</strong>.</span>
                                            </li>
                                        </ul>
                                        <p class="text-[11px] text-slate-600 italic leading-snug">
                                            *Se premiarán todos los Hole in One únicamente los días viernes, sábado y domingo. <strong>En caso de hacer un hole in one el jueves, este se considera como mejor oyes del torneo.</strong> Menores de edad no tienen acceso a premios en efectivo.
                                        </p>
                                    </div>
                                </div>

                                <!-- COLUMNA DERECHA (5 cols): Bolsa de Premios, Costos, Fecha Límite y Contacto Estilo Muestra -->
                                <div class="md:col-span-5 space-y-6">
                                    
                                    <!-- BOLSA DE PREMIOS GENERAL (TABLA DESTACADA) -->
                                    <div class="rounded-2xl overflow-hidden border-2 border-[#d91b5c] bg-white shadow-md">
                                        <div class="bg-[#d91b5c] text-white px-4 py-3 text-center">
                                            <span class="text-[10px] font-black uppercase tracking-widest block text-amber-200">Hoyos 2-11, 5-14 y 7-16</span>
                                            <h4 class="text-base sm:text-lg font-black uppercase tracking-tight">Bolsa de Premios General</h4>
                                        </div>
                                        <div class="divide-y divide-slate-200 text-xs sm:text-[13px]">
                                            <div class="px-4 py-3 bg-amber-50 flex items-center justify-between">
                                                <span class="font-black text-[#d91b5c] uppercase">🏆 Mejor O'Yes General</span>
                                                <span class="font-black text-slate-900 uppercase bg-amber-300/80 px-2.5 py-1 rounded-lg">Carrito de Golf</span>
                                            </div>
                                            <div class="px-4 py-2.5 flex items-center justify-between">
                                                <span class="font-bold text-slate-700">1er Lugar</span>
                                                <span class="font-black text-emerald-800 text-sm">$30,000.00 MXN</span>
                                            </div>
                                            <div class="px-4 py-2.5 flex items-center justify-between">
                                                <span class="font-bold text-slate-700">2do Lugar</span>
                                                <span class="font-black text-emerald-800 text-sm">$20,000.00 MXN</span>
                                            </div>
                                            <div class="px-4 py-2.5 flex items-center justify-between bg-slate-50">
                                                <span class="font-bold text-slate-700">3er Lugar</span>
                                                <span class="font-black text-amber-700 uppercase">Estancia Isla Navidad</span>
                                            </div>
                                            <div class="px-4 py-2.5 flex items-center justify-between">
                                                <span class="font-bold text-slate-700">4to Lugar</span>
                                                <span class="font-black text-emerald-800">$10,000.00 MXN</span>
                                            </div>
                                            <div class="px-4 py-2.5 flex items-center justify-between">
                                                <span class="font-bold text-slate-700">5to Lugar</span>
                                                <span class="font-black text-emerald-800">$5,000.00 MXN</span>
                                            </div>
                                        </div>
                                        <div class="px-4 py-2 bg-slate-100 text-[10px] text-slate-600 italic leading-tight">
                                            *Aplican condiciones y restricciones. **En caso de obtener 2 o más O'Yeses por un mismo jugador se premiará con el de mayor denominación.
                                        </div>
                                    </div>

                                    <!-- COSTOS, INCLUYE KIT E INSCRIPCIONES -->
                                    <div id="conv-sec-costos" class="space-y-3">
                                        <div>
                                            <h3 class="text-base sm:text-lg font-black uppercase text-[#d91b5c] tracking-tight leading-none">
                                                COSTOS, KIT E INSCRIPCIONES
                                            </h3>
                                            <div class="w-12 h-1.5 bg-emerald-800 mt-1.5 rounded-full"></div>
                                        </div>

                                        <div class="rounded-2xl overflow-hidden border border-slate-300 bg-white shadow-sm text-xs">
                                            <div class="grid grid-cols-3 bg-emerald-900 text-white font-black text-[10px] uppercase p-2.5 text-center">
                                                <div class="text-left">Concepto</div>
                                                <div>Promoción<br><span class="font-normal text-emerald-200">(Hasta 5 Oct)</span></div>
                                                <div>Regular<br><span class="font-normal text-amber-200">(Desde 6 Oct)</span></div>
                                            </div>
                                            <div class="grid grid-cols-3 items-center p-3 border-b border-slate-200 text-center">
                                                <div class="text-left font-black text-slate-900 uppercase">Socios</div>
                                                <div class="font-bold text-slate-700">$6,500 MXN</div>
                                                <div class="font-black text-[#d91b5c] text-sm">$7,500 MXN</div>
                                            </div>
                                            <div class="grid grid-cols-3 items-center p-3 text-center">
                                                <div class="text-left font-black text-slate-900 uppercase">No Socios</div>
                                                <div class="font-bold text-slate-700">$7,500 MXN</div>
                                                <div class="font-black text-[#d91b5c] text-sm">$8,500 MXN</div>
                                            </div>
                                        </div>

                                        <div class="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-xs text-slate-800 space-y-1 leading-snug">
                                            <p><strong class="text-emerald-950 uppercase">EL KIT INCLUYE:</strong> Además 2 greenfee de práctica (sólo jugadores foráneos), participación en rifas y platillo en la comida de premiación y clausura.</p>
                                            <p class="text-[10px] text-slate-600 italic">*Favor de confirmar acompañante(s) con 7 días de anticipación. Por cada invitado adicional se cobrará una cuota por definir.</p>
                                        </div>
                                    </div>

                                    <!-- BLOQUE ESTILO MUESTRA: FECHA LÍMITE, REDES Y FLECHAS >>>> -->
                                    <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                                        <!-- Icono de Calendario + Fecha Límite (Como en la Muestra) -->
                                        <div class="flex items-start gap-3">
                                            <div class="w-11 h-11 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow">
                                                <span class="material-icons text-2xl">event_available</span>
                                            </div>
                                            <div>
                                                <p class="text-[11px] font-bold text-slate-600 leading-tight">Fecha límite para inscripción</p>
                                                <p class="text-sm font-black text-slate-900 leading-tight mt-0.5">Lunes 2 de noviembre de 2026 · 16:00 hrs</p>
                                            </div>
                                        </div>

                                        <!-- Iconos Circulares de Contacto y Redes (Como en la Muestra) -->
                                        <div class="space-y-2 text-xs font-bold text-slate-800">
                                            <a href="https://wa.me/5213121942559?text=Hola,%20solicito%20informes%20e%20inscripci%C3%B3n%20para%20el%20Torneo%20Anual%20Feria%20de%20Todos%20los%20Santos%202026" target="_blank" class="flex items-center gap-2.5 hover:text-[#d91b5c] transition-colors">
                                                <span class="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-black shadow-sm">
                                                    <span class="material-icons text-sm">call</span>
                                                </span>
                                                <span>312 194 2559 &nbsp;(WhatsApp Inscripciones)</span>
                                            </a>
                                            <a href="https://wa.me/5213151047094?text=Hola,%20solicito%20informes%20e%20inscripci%C3%B3n%20para%20el%20Torneo%20Anual%20Feria%20de%20Todos%20los%20Santos%202026" target="_blank" class="flex items-center gap-2.5 hover:text-[#d91b5c] transition-colors">
                                                <span class="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-black shadow-sm">
                                                    <span class="material-icons text-sm">chat</span>
                                                </span>
                                                <span>315 104 7094 &nbsp;(Informes e Inscripciones)</span>
                                            </a>
                                            <div class="flex items-center gap-2.5">
                                                <span class="w-7 h-7 rounded-full bg-[#d91b5c] text-white flex items-center justify-center text-xs font-black shadow-sm">
                                                    <span class="material-icons text-sm">alternate_email</span>
                                                </span>
                                                <span>@clubdegolfdecolima</span>
                                            </div>
                                        </div>

                                        <!-- Flechas decorativas >>>> de la Muestra -->
                                        <div class="pt-1 flex items-center justify-between">
                                            <span class="text-2xl font-black tracking-tighter text-[#d91b5c] leading-none select-none">&gt;&gt;&gt;&gt;</span>
                                            <a href="https://wa.me/5213121942559?text=Hola,%20solicito%20informes%20e%20inscripci%C3%B3n%20para%20el%20Torneo%20Anual%20Feria%20de%20Todos%20los%20Santos%202026" target="_blank"
                                               class="px-4 py-2 bg-[#d91b5c] hover:bg-rose-700 text-white font-black text-[11px] uppercase tracking-wider rounded-xl shadow transition-all">
                                                Inscribirme por WhatsApp
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 4. CRITERIO DE DESEMPATE Y NOTAS REGLAMENTARIAS AL PIE DEL POSTER -->
                            <div class="mt-7 pt-5 border-t-2 border-slate-200 space-y-3 text-left">
                                <div class="p-4 rounded-2xl bg-white border border-slate-200 text-[11px] sm:text-xs text-slate-700 leading-relaxed space-y-1">
                                    <p><strong class="text-slate-900 uppercase">CRITERIO DE DESEMPATE:</strong> Se decidirá por el primero, segundo y tercero de cada categoría se desempatará la mejor tarjeta de los últimos 9 hoyos, (del 10 al 18); si continúa el empate ganará la mejor puntuación de los últimos 6 hoyos, últimos 3 hoyos y finalmente último hoyo y así con la primera vuelta, de ser necesario se tomará el score del primer día bajo el mismo criterio.</p>
                                    <p><strong class="text-emerald-900 uppercase">NOTA:</strong> En las categorías donde se juega con el 80% del handicap este se aplicará para el desempate. Solo la primera categoría absoluta se jugará a muerte súbita si hay empate en el primer lugar.</p>
                                </div>

                                <p class="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed text-justify">
                                    Cupo limitado a 45 jugadores por horario. Mínimo 4 jugadores por categoría. Fecha límite de inscripción lunes 2 de noviembre a las 16:00 hrs. Los competidores foráneos deberán enviar por Whatsapp su handicap del 15 de octubre, índex o carta de su club, así como su ficha de depósito. Cualquier omisión a estos requisitos impedirirá su inscripción. Al momento de su inscripción se les hará entrega de las bases de torneo y reglas locales. El Comité Organizador se reserva el derecho sin previo aviso de hacer los cambios que se consideren pertinentes para el mejor desarrollo del torneo. *Cartel con fines únicamente promocionales.
                                </p>

                                <div class="pt-2 border-t border-slate-200 text-center">
                                    <p class="text-[11px] font-black text-slate-700 tracking-wider uppercase">
                                        Convocatoria Oficial Torneo Anual 2026 &nbsp;·&nbsp; www.colimagolf.com
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- EVENT MODAL -->
            <div id="event-modal" class="hidden fixed inset-0 z-[100] items-center justify-center p-4 sm:p-6 opacity-0 transition-opacity duration-300">
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-slate-950/90 backdrop-blur-sm cursor-pointer" onclick="closeEventModal()"></div>
                
                <!-- Modal Content -->
                <div class="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row transform scale-95 transition-transform duration-300" id="event-modal-content">
                    
                    <!-- Close button -->
                    <button onclick="closeEventModal()" class="absolute top-4 right-4 z-10 w-10 h-10 bg-slate-950/50 hover:bg-slate-800 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all">
                        <span class="material-icons">close</span>
                    </button>

                    <!-- Image Section -->
                    <div class="w-full md:w-3/5 lg:w-2/3 bg-black flex items-center justify-center max-h-[50vh] md:max-h-[85vh] overflow-hidden">
                        <img id="modal-img" src="" alt="Evento" class="w-full h-full object-contain">
                    </div>

                    <!-- Details Section -->
                    <div class="w-full md:w-2/5 lg:w-1/3 p-6 sm:p-8 flex flex-col justify-center max-h-[40vh] md:max-h-[85vh] overflow-y-auto">
                        <div class="space-y-6">
                            <div>
                                <span class="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-[10px] uppercase tracking-widest rounded-full inline-block mb-4">Detalles del Evento</span>
                                <h3 id="modal-title" class="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight leading-tight"></h3>
                            </div>
                            
                            <div class="flex items-center gap-3 p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                                <div class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-primary shrink-0">
                                    <span class="material-icons">event</span>
                                </div>
                                <div>
                                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</p>
                                    <p id="modal-date" class="text-sm font-black text-white"></p>
                                </div>
                            </div>

                            <p id="modal-desc" class="text-sm text-slate-300 leading-relaxed font-medium"></p>
                            
                            <div class="pt-4 mt-auto space-y-3">
                                <!-- Boton Leaderboard en Vivo si el evento tiene torneo vinculado -->
                                <button id="modal-leaderboard-btn" onclick="openEventTournamentLeaderboard()"
                                    class="hidden w-full px-6 py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-amber-500/20 transition-all items-center justify-center text-center gap-2 hover:-translate-y-1 cursor-pointer">
                                    <span class="material-icons text-lg">emoji_events</span>
                                    <span>VER LEADERBOARD Y SALIDAS EN VIVO</span>
                                </button>

                                <a href="https://wa.me/5213121942559?text=Hola,%20me%20gustar%C3%ADa%20m%C3%A1s%20informaci%C3%B3n%20sobre%20los%20eventos" target="_blank"
                                    class="w-full px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center text-center gap-2 hover:-translate-y-1">
                                    <svg class="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                                    <span>Solicitar Información</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TEE TIME BOOKING MODAL -->
            <div id="teetime-modal" class="hidden fixed inset-0 z-[100] items-center justify-center p-4 sm:p-6 opacity-0 transition-opacity duration-300">
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-slate-950/90 backdrop-blur-md cursor-pointer" onclick="closeTeeTimeModal()"></div>
                
                <!-- Modal Content (Estilo Editorial Limpio) -->
                <div class="relative w-full max-w-2xl bg-white border border-slate-200 text-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col transform scale-95 transition-transform duration-300 my-auto max-h-[92vh]" id="teetime-modal-content">
                    
                    <!-- Header -->
                    <div class="p-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-[#f7f8f6]">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-2xl bg-[#7cb518]/15 border border-[#7cb518]/30 flex items-center justify-center text-[#65a30d]">
                                <span class="material-icons">golf_course</span>
                            </div>
                            <div>
                                <h3 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Reservar Salida / Tee Time</h3>
                                <p class="text-[11px] font-bold text-[#65a30d] uppercase tracking-wider">Club de Golf Colima · Campo de 18 Hoyos</p>
                            </div>
                        </div>
                        <button onclick="closeTeeTimeModal()" class="w-9 h-9 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-full flex items-center justify-center border border-slate-200 transition-all cursor-pointer shadow-sm">
                            <span class="material-icons text-sm">close</span>
                        </button>
                    </div>

                    <!-- Scrollable Form Body -->
                    <form id="teetime-form" onsubmit="handleTeeTimeSubmit(event)" class="p-6 space-y-5 overflow-y-auto max-h-[75vh] bg-white">
                        
                        <!-- Socio vs Invitado selector -->
                        <div class="space-y-1.5">
                            <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tipo de Jugador</label>
                            <div class="grid grid-cols-2 gap-3">
                                <label class="cursor-pointer">
                                    <input type="radio" name="tipo_jugador" value="Socio" checked class="peer hidden">
                                    <div class="p-3 text-center rounded-2xl border border-slate-200 bg-[#f7f8f6] text-slate-700 hover:border-[#7cb518]/50 peer-checked:bg-[#7cb518] peer-checked:text-white peer-checked:border-[#7cb518] font-bold text-xs uppercase tracking-wider transition-all shadow-sm">
                                        ⭐ Socio del Club
                                    </div>
                                </label>
                                <label class="cursor-pointer">
                                    <input type="radio" name="tipo_jugador" value="Invitado / No Socio" class="peer hidden">
                                    <div class="p-3 text-center rounded-2xl border border-slate-200 bg-[#f7f8f6] text-slate-700 hover:border-[#7cb518]/50 peer-checked:bg-[#005a9c] peer-checked:text-white peer-checked:border-[#005a9c] font-bold text-xs uppercase tracking-wider transition-all shadow-sm">
                                        🏌️ Invitado / No Socio
                                    </div>
                                </label>
                            </div>
                        </div>

                        <!-- Nombre & Teléfono -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="space-y-1.5">
                                <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nombre Completo *</label>
                                <input type="text" id="tt-nombre" required placeholder="Tu nombre y apellido"
                                    class="w-full px-4 py-3 bg-[#f7f8f6] border border-slate-200 focus:bg-white focus:border-[#7cb518] focus:ring-1 focus:ring-[#7cb518] rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all">
                            </div>
                            <div class="space-y-1.5">
                                <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Teléfono / WhatsApp *</label>
                                <input type="tel" id="tt-telefono" required placeholder="Ej: 312 123 4567"
                                    class="w-full px-4 py-3 bg-[#f7f8f6] border border-slate-200 focus:bg-white focus:border-[#7cb518] focus:ring-1 focus:ring-[#7cb518] rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all">
                            </div>
                        </div>

                        <!-- Fecha & Horario -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="space-y-1.5">
                                <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fecha de Juego *</label>
                                <input type="date" id="tt-fecha" required
                                    class="w-full px-4 py-3 bg-[#f7f8f6] border border-slate-200 focus:bg-white focus:border-[#7cb518] focus:ring-1 focus:ring-[#7cb518] rounded-xl text-sm font-medium text-slate-900 outline-none transition-all">
                            </div>
                            <div class="space-y-1.5">
                                <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Horario Deseado *</label>
                                <select id="tt-hora" required
                                    class="w-full px-4 py-3 bg-[#f7f8f6] border border-slate-200 focus:bg-white focus:border-[#7cb518] focus:ring-1 focus:ring-[#7cb518] rounded-xl text-sm font-medium text-slate-900 outline-none transition-all">
                                    <option value="07:00 AM">07:00 AM (Primera Salida)</option>
                                    <option value="07:30 AM">07:30 AM</option>
                                    <option value="08:00 AM" selected>08:00 AM</option>
                                    <option value="08:30 AM">08:30 AM</option>
                                    <option value="09:00 AM">09:00 AM</option>
                                    <option value="09:30 AM">09:30 AM</option>
                                    <option value="10:00 AM">10:00 AM</option>
                                    <option value="10:30 AM">10:30 AM</option>
                                    <option value="11:00 AM">11:00 AM</option>
                                    <option value="12:00 PM">12:00 PM</option>
                                    <option value="01:00 PM">01:00 PM</option>
                                    <option value="02:00 PM">02:00 PM</option>
                                    <option value="03:00 PM">03:00 PM (Tarde)</option>
                                    <option value="04:00 PM">04:00 PM (Tarde 9 Hoyos)</option>
                                </select>
                            </div>
                        </div>

                        <!-- Número de Jugadores & Salida -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="space-y-1.5">
                                <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Número de Jugadores</label>
                                <select id="tt-jugadores"
                                    class="w-full px-4 py-3 bg-[#f7f8f6] border border-slate-200 focus:bg-white focus:border-[#7cb518] focus:ring-1 focus:ring-[#7cb518] rounded-xl text-sm font-medium text-slate-900 outline-none transition-all">
                                    <option value="1">1 Jugador (Individual)</option>
                                    <option value="2">2 Jugadores (Pareja)</option>
                                    <option value="3">3 Jugadores (Trío)</option>
                                    <option value="4" selected>4 Jugadores (Foursome)</option>
                                </select>
                            </div>
                            <div class="space-y-1.5">
                                <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hoyo de Salida</label>
                                <select id="tt-hoyo"
                                    class="w-full px-4 py-3 bg-[#f7f8f6] border border-slate-200 focus:bg-white focus:border-[#7cb518] focus:ring-1 focus:ring-[#7cb518] rounded-xl text-sm font-medium text-slate-900 outline-none transition-all">
                                    <option value="1" selected>Hoyo 1 (Salida Principal)</option>
                                    <option value="10">Hoyo 10 (Segunda Vuelta)</option>
                                </select>
                            </div>
                        </div>

                        <!-- Servicios Adicionales -->
                        <div class="space-y-2 p-4 bg-[#f7f8f6] rounded-2xl border border-slate-200">
                            <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Servicios Adicionales Requeridos</label>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer p-2 rounded-xl hover:bg-white transition-colors">
                                    <input type="checkbox" id="tt-carrito" class="w-4 h-4 rounded accent-[#7cb518] border-slate-300">
                                    <span>🚗 Carrito de Golf</span>
                                </label>
                                <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer p-2 rounded-xl hover:bg-white transition-colors">
                                    <input type="checkbox" id="tt-caddie" class="w-4 h-4 rounded accent-[#7cb518] border-slate-300">
                                    <span>🏌️‍♂️ Caddie</span>
                                </label>
                                <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer p-2 rounded-xl hover:bg-white transition-colors">
                                    <input type="checkbox" id="tt-palos" class="w-4 h-4 rounded accent-[#7cb518] border-slate-300">
                                    <span>⛳ Renta de Palos</span>
                                </label>
                            </div>
                        </div>

                        <!-- Comentarios / Notas -->
                        <div class="space-y-1.5">
                            <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Notas o Peticiones Especiales (Opcional)</label>
                            <textarea id="tt-comentarios" rows="2" placeholder="Nombres de acompañantes, requerimientos especiales, etc."
                                class="w-full px-4 py-2.5 bg-[#f7f8f6] border border-slate-200 focus:bg-white focus:border-[#7cb518] focus:ring-1 focus:ring-[#7cb518] rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition-all"></textarea>
                        </div>

                        <!-- Submit Button -->
                        <div class="pt-2">
                            <button type="submit" id="tt-submit-btn"
                                class="w-full px-6 py-4 bg-[#7cb518] hover:bg-[#6ca312] text-white font-bold rounded-full text-sm uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-3 hover:-translate-y-0.5 cursor-pointer">
                                <svg class="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                                <span>Confirmar Reserva & Enviar</span>
                            </button>
                            <p class="text-[10px] text-slate-400 font-bold text-center mt-2.5 uppercase tracking-wider">
                                🔒 Notifica de inmediato al Caddie Master / Starter del club
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            <!-- 6. NOTICIA COMPLETA MODAL (DISEÑO SPLIT BOX: FOTO COMPLETA IZQUIERDA + TEXTO DERECHA) -->
            <div id="noticia-modal" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md items-center justify-center p-3 sm:p-6 hidden opacity-0 transition-opacity duration-300" onclick="if(event.target === this) closeNoticiaModal()">
                <div id="noticia-modal-content" class="bg-white border border-slate-200 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 max-h-[92vh] scale-95 transition-transform duration-300">
                    <!-- Columna Izquierda: Foto Completa sin recortar + Miniaturas -->
                    <div class="lg:col-span-6 bg-slate-950 flex flex-col justify-between relative select-none">
                        <div class="relative flex-1 flex items-center justify-center p-3 sm:p-5 min-h-[240px] sm:min-h-[340px] lg:min-h-[440px]">
                            <img id="noticia-modal-img" src="" alt="Noticia" class="max-h-[42vh] lg:max-h-[68vh] w-full object-contain rounded-xl transition-all duration-300 cursor-pointer" onclick="openLightboxImage()" title="Clic para ampliar foto">

                            <!-- Botón Ampliar -->
                            <button onclick="openLightboxImage()" class="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-transform hover:scale-105 cursor-pointer z-10">
                                <span class="material-icons text-xs">fullscreen</span> Ampliar
                            </button>

                            <!-- Botón Cerrar Móvil -->
                            <button onclick="closeNoticiaModal()" class="lg:hidden absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white flex items-center justify-center backdrop-blur-md cursor-pointer z-10">
                                <span class="material-icons text-lg">close</span>
                            </button>

                            <!-- Flechas Carrusel -->
                            <button id="btn-gallery-prev" onclick="prevGalleryImage()" class="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-[#7cb518] text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all hover:scale-110 cursor-pointer z-10 hidden">
                                <span class="material-icons">chevron_left</span>
                            </button>
                            <button id="btn-gallery-next" onclick="nextGalleryImage()" class="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-[#7cb518] text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all hover:scale-110 cursor-pointer z-10 hidden">
                                <span class="material-icons">chevron_right</span>
                            </button>

                            <!-- Contador de Fotos -->
                            <div class="absolute bottom-3 right-4 z-10 pointer-events-none">
                                <span id="noticia-modal-counter" class="px-3 py-1 bg-slate-900/85 border border-white/15 text-white rounded-full text-[10px] font-bold uppercase tracking-wider hidden backdrop-blur-md"></span>
                            </div>
                        </div>

                        <!-- Tira de Miniaturas -->
                        <div id="noticia-modal-thumbnails" class="px-4 py-2.5 bg-slate-900/95 border-t border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar hidden">
                        </div>
                    </div>

                    <!-- Columna Derecha: Caja Editorial Blanca con Scroll -->
                    <div class="lg:col-span-6 bg-white text-slate-900 flex flex-col max-h-[48vh] lg:max-h-[92vh]">
                        <!-- Encabezado Fijo -->
                        <div class="px-6 sm:px-8 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div class="flex flex-wrap items-center gap-2 text-[11px] font-bold text-[#65a30d] uppercase tracking-wider">
                                <span class="flex items-center gap-1"><span class="material-icons text-sm">event</span> <span id="noticia-modal-date"></span></span>
                                <span class="text-slate-300">·</span>
                                <span class="text-slate-500 flex items-center gap-1"><span class="material-icons text-sm">person</span> <span id="noticia-modal-author"></span></span>
                            </div>
                            <button onclick="closeNoticiaModal()" class="hidden lg:flex w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 items-center justify-center transition-colors cursor-pointer shrink-0">
                                <span class="material-icons text-lg">close</span>
                            </button>
                        </div>

                        <!-- Cuerpo Scrolleable -->
                        <div class="p-6 sm:p-8 overflow-y-auto space-y-4 flex-1">
                            <h2 id="noticia-modal-title" class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug"></h2>
                            <div class="w-12 h-1 bg-[#7cb518] rounded-full"></div>
                            <div id="noticia-modal-body" class="text-slate-600 text-sm leading-relaxed whitespace-pre-line font-normal pt-1"></div>
                        </div>

                        <!-- Footer Fijo -->
                        <div class="px-6 sm:px-8 py-3.5 border-t border-slate-100 bg-slate-50/70 flex justify-end shrink-0">
                            <button onclick="closeNoticiaModal()" class="px-6 py-2.5 bg-slate-900 hover:bg-[#7cb518] text-white font-bold rounded-full text-xs uppercase tracking-wider transition-colors cursor-pointer">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 7. MODAL VER TODAS LAS NOTICIAS -->
            <div id="all-noticias-modal" class="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl items-center justify-center p-4 sm:p-6 hidden opacity-0 transition-opacity duration-300">
                <div id="all-noticias-modal-content" class="bg-slate-900 border border-slate-800 w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] scale-95 transition-transform duration-300">
                    <!-- Header -->
                    <div class="p-6 sm:p-8 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/80">
                        <div>
                            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                                <span class="material-icons text-xs">collections_bookmark</span> Hemeroteca Oficial
                            </div>
                            <h3 class="text-2xl font-black text-white uppercase tracking-tight">Todas las Noticias</h3>
                            <p class="text-xs text-slate-400 mt-0.5">Explora el historial completo de comunicados y notas del Club de Golf Colima.</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="relative">
                                <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                                <input type="text" id="input-search-all-noticias" placeholder="Buscar por título o contenido..." class="pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-all font-medium w-48 sm:w-72">
                            </div>
                            <button onclick="closeAllNoticiasModal()" class="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer">
                                <span class="material-icons">close</span>
                            </button>
                        </div>
                    </div>

                    <!-- Grid de Todas las Noticias -->
                    <div class="p-6 sm:p-8 overflow-y-auto flex-1">
                        <div id="all-noticias-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <!-- Rendered dynamically -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- 8. VISOR FULLSCREEN LIGHTBOX (AMPLIAR FOTO HD CON NAVEGACIÓN Y FLECHAS) -->
            <div id="lightbox-modal" class="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl items-center justify-center p-4 hidden opacity-0 transition-opacity duration-300 select-none" onclick="closeLightboxImage()">
                <!-- Close Button -->
                <button onclick="closeLightboxImage()" class="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer z-50 backdrop-blur-md">
                    <span class="material-icons text-2xl">close</span>
                </button>

                <!-- Prev Arrow Fullscreen -->
                <button id="btn-lightbox-prev" onclick="event.stopPropagation(); prevGalleryImage(); updateLightboxImage();" class="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all hover:scale-110 cursor-pointer z-50 shadow-2xl hidden">
                    <span class="material-icons text-3xl">chevron_left</span>
                </button>

                <!-- Next Arrow Fullscreen -->
                <button id="btn-lightbox-next" onclick="event.stopPropagation(); nextGalleryImage(); updateLightboxImage();" class="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all hover:scale-110 cursor-pointer z-50 shadow-2xl hidden">
                    <span class="material-icons text-3xl">chevron_right</span>
                </button>

                <!-- Main Image Container -->
                <div class="relative flex flex-col items-center justify-center max-h-[90vh] max-w-[95vw]" onclick="event.stopPropagation()">
                    <img id="lightbox-img" src="" alt="Foto en alta resolución" class="max-h-[85vh] max-w-[92vw] object-contain rounded-2xl shadow-2xl transition-all duration-300">
                    <div class="mt-4 flex items-center gap-3">
                        <span id="lightbox-counter" class="px-4 py-1.5 bg-slate-900/90 border border-slate-700 text-amber-400 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-lg hidden"></span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Start background image slideshow
    startHeroSlider();

    // MOBILE DRAWER TOGGLE FUNCTION
    window.toggleMobileMenu = function() {
        const drawer = document.getElementById('mobile-menu-drawer');
        const icon = document.getElementById('icon-mobile-toggle');
        if (!drawer) return;

        if (drawer.classList.contains('hidden')) {
            drawer.classList.remove('hidden');
            setTimeout(() => {
                drawer.classList.remove('max-h-0', 'opacity-0');
                drawer.classList.add('max-h-96', 'opacity-100');
            }, 10);
            if (icon) icon.textContent = 'close';
        } else {
            drawer.classList.remove('max-h-96', 'opacity-100');
            drawer.classList.add('max-h-0', 'opacity-0');
            if (icon) icon.textContent = 'menu';
            setTimeout(() => {
                drawer.classList.add('hidden');
            }, 300);
        }
    };

    // CONVOCATORIA OFICIAL MODAL HANDLERS
    window.openConvocatoriaModal = function() {
        const modal = document.getElementById('convocatoria-modal');
        const content = document.getElementById('convocatoria-modal-content');
        if (!modal) return;

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.classList.add('opacity-100');
            if (content) {
                content.classList.remove('scale-95');
                content.classList.add('scale-100');
            }
        }, 10);
        document.body.style.overflow = 'hidden';
    };

    window.closeConvocatoriaModal = function() {
        const modal = document.getElementById('convocatoria-modal');
        const content = document.getElementById('convocatoria-modal-content');
        if (!modal) return;

        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0');
        if (content) {
            content.classList.remove('scale-100');
            content.classList.add('scale-95');
        }
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = '';
        }, 300);
    };

    window.changeConvocatoriaCoursePhoto = function(src, btnEl) {
        const modalImg = document.getElementById('conv-modal-course-img');
        const cardImg = document.getElementById('conv-card-course-img');
        if (modalImg) modalImg.src = src;
        if (cardImg) cardImg.src = src;

        document.querySelectorAll('.conv-photo-btn').forEach(btn => {
            btn.className = 'conv-photo-btn px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all shrink-0';
        });
        if (btnEl) {
            btnEl.className = 'conv-photo-btn px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all shrink-0';
        }
    };

    window.printConvocatoriaOficial = function() {
        const currentPhoto = (document.getElementById('conv-modal-course-img') && document.getElementById('conv-modal-course-img').src) || './imagenes/DJI_0001.JPG';
        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Convocatoria Oficial 2026 - Torneo Anual de Golf Feria de Todos los Santos</title>
                <style>
                    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #fbfaf8; color: #1e293b; font-size: 11px; line-height: 1.4; }
                    .poster { max-width: 820px; margin: 0 auto; background: #fbfaf8; overflow: hidden; }
                    .hero { position: relative; width: 100%; height: 290px; overflow: hidden; background: #064e3b; }
                    .hero img.bg { width: 100%; height: 100%; object-fit: cover; }
                    .dome-top { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 78%; max-width: 500px; background: #fff; border-radius: 0 0 50% 50% / 0 0 100% 100%; padding: 10px 24px 20px; text-align: center; box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
                    .dome-logos { display: flex; align-items: center; justify-content: center; gap: 18px; }
                    .dome-logos img.club { height: 52px; width: auto; object-fit: contain; }
                    .dome-logos img.torneo { height: 64px; width: auto; object-fit: contain; }
                    .dome-sub { font-size: 9px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #334155; margin-top: 4px; }
                    .arch-bottom { position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%); width: 130%; height: 78px; background: #fbfaf8; border-radius: 50% 50% 0 0 / 100% 100% 0 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; padding-bottom: 4px; text-align: center; }
                    .arch-bottom .kicker { font-size: 9px; font-weight: 900; letter-spacing: 2px; color: #065f46; text-transform: uppercase; }
                    .arch-bottom h1 { font-size: 28px; font-weight: 900; margin: 2px 0 0; color: #d91b5c; text-transform: uppercase; letter-spacing: -0.5px; }
                    .arch-bottom h1 span { color: #d97706; }
                    .content { padding: 8px 28px 20px; }
                    .modes { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; font-weight: 800; font-size: 11px; }
                    .grid { display: grid; grid-template-columns: 7fr 5fr; gap: 18px; align-items: start; }
                    h2 { font-size: 13px; font-weight: 900; text-transform: uppercase; color: #d91b5c; margin: 0 0 3px 0; }
                    .bar { width: 38px; height: 4px; background: #065f46; border-radius: 4px; margin-bottom: 8px; }
                    .box { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 10px; margin-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
                    th, td { border-bottom: 1px solid #e2e8f0; padding: 4px 6px; text-align: left; }
                    th { background: #064e3b; color: #fff; font-weight: 800; text-transform: uppercase; font-size: 9.5px; }
                    .note { font-size: 9.5px; color: #475569; font-style: italic; margin: 4px 0 10px; }
                    .footer { margin-top: 10px; padding-top: 8px; border-top: 2px solid #e2e8f0; font-size: 9.5px; color: #475569; text-align: justify; }
                </style>
            </head>
            <body>
                <div class="poster">
                    <div class="hero">
                        <img class="bg" src="${currentPhoto}" alt="Campo Club de Golf Colima">
                        <div class="dome-top">
                            <div class="dome-logos">
                                <img class="club" src="./imagenes/logo_club_colima.jpeg" alt="Club de Golf de Colima">
                                <img class="torneo" src="./imagenes/logo_torneo_feria_2026.png" alt="Feria de Todos los Santos 2026">
                            </div>
                            <div class="dome-sub">Torneo Anual de Golf · Club de Golf de Colima</div>
                        </div>
                        <div class="arch-bottom">
                            <div class="kicker">COLIMA, 2026 | 5 AL 8 DE NOVIEMBRE | CLUB DE GOLF DE COLIMA</div>
                            <h1>CONVOCATORIA <span>2026</span></h1>
                        </div>
                    </div>
                    <div class="content">
                        <div class="modes">
                            Formato Stroke Play: Categorías A, B, Damas, Senior y Super Senior &nbsp;·&nbsp; Formato Stableford: Categoría C<br>
                            Sistema de juego por golpes a 54 hoyos. &nbsp;|&nbsp; <span style="color:#d91b5c;">HANDICAP AL 80%</span>
                        </div>
                        <div class="grid">
                            <div>
                                <h2>I. Categorías y Salidas</h2>
                                <div class="bar"></div>
                                <div class="box">
                                    <div>• <strong>A (0-9 handicap)</strong> - Marcas: Azul/Blancas</div>
                                    <div>• <strong>B (10-19 handicap)</strong> - Marcas: Azul/Blancas</div>
                                    <div>• <strong>C (20-28 handicap)</strong> - Marcas: Azul/Blancas</div>
                                    <div>• <strong>Damas (0-32 handicap, categoría única)</strong> - Marcas: Rojas/Rojas</div>
                                    <div>• <strong>Senior (60+ años)</strong> - Marcas: Doradas/Doradas</div>
                                    <div>• <strong>Super Senior (70+ años)</strong> - Marcas: Plateadas/Plateadas</div>
                                </div>
                                <div class="note">*Handicap máximo caballeros 28, damas 32. **El handicap a considerar será el del 15 de octubre de 2026.</div>

                                <h2>II. Programa de Salidas y Eventos</h2>
                                <div class="bar"></div>
                                <div class="box">
                                    <div><strong>Jueves 5 de Noviembre:</strong> 8:00 hrs - C, Senior y Super Senior | 18:00 hrs - Coctel de Bienvenida | 19:00 hrs - Torneo de Putt</div>
                                    <div><strong>Viernes 6 de Noviembre:</strong> 8:00 hrs - Damas, C, Senior y Super Senior | 13:00 hrs - A y B | Al terminar: Torneo de Approach</div>
                                    <div><strong>Sábado 7 de Noviembre:</strong> 8:00 hrs - Damas, C, Senior y Super Senior | 13:00 hrs - A y B</div>
                                    <div><strong>Domingo 8 de Noviembre:</strong> 7:30 hrs - Categorías A, B y Damas (salidas por teetime) | Comida, Premiación y Clausura al término del torneo</div>
                                </div>
                                <div class="note">*Las Senior A y B, así como los Super Senior A y B saldrán en las salidas indicadas como Senior y Super Senior.</div>

                                <h2>III. Premios y Recompensas</h2>
                                <div class="bar"></div>
                                <div class="box">
                                    <div>• Habrá premio para los 3 primeros lugares netos por categoría, al mejor gross por categoría y al mejor gross del torneo.</div>
                                    <div>• Premios a los mejores O'Yeses en el <strong>hoyo 2-11, 5-14 y 7-16</strong>.</div>
                                    <div>• <strong>Hole in One en el hoyo 2:</strong> premio de un <strong>carrito de golf</strong>.</div>
                                    <div>• <strong>Hole in One en el hoyo 16:</strong> premio de un <strong>carrito de golf</strong>.</div>
                                    <div>• Se otorgarán <strong>únicamente 2 carritos de golf</strong> durante todo el torneo, uno correspondiente al <strong>hoyo 2</strong> y otro al <strong>hoyo 16</strong>.</div>
                                    <div>• En caso de registrarse más de un Hole in One en el mismo hoyo, el carrito será otorgado <strong>únicamente al primer jugador que lo consiga</strong>.</div>
                                    <div>• Los Hole in One posteriores realizados en ese mismo hoyo no generarán un carrito adicional, pero <strong>sí serán reconocidos como O’Yes</strong> para efectos de premiación.</div>
                                    <div>• El premio por <strong>Hole in One en el hoyo 5-14</strong> será una <strong>anualidad en el club</strong>.</div>
                                </div>
                                <div class="note">*Se premiarán todos los Hole in One únicamente los días viernes, sábado y domingo. En caso de hacer un hole in one el jueves, este se considera como mejor oyes del torneo. Menores de edad no tienen acceso a premios en efectivo.</div>
                            </div>

                            <div>
                                <h2>Bolsa de Premios General</h2>
                                <div class="bar"></div>
                                <div class="box" style="padding:0; overflow:hidden;">
                                    <table>
                                        <thead><tr><th>Posición / Concepto</th><th>Premio</th></tr></thead>
                                        <tbody>
                                            <tr><td><strong>Mejor O'Yes General</strong></td><td><strong>Carrito de Golf</strong></td></tr>
                                            <tr><td>1er Lugar</td><td><strong>$30,000.00 MXN</strong></td></tr>
                                            <tr><td>2do Lugar</td><td><strong>$20,000.00 MXN</strong></td></tr>
                                            <tr><td>3er Lugar</td><td><strong>Estancia Isla Navidad</strong></td></tr>
                                            <tr><td>4to Lugar</td><td><strong>$10,000.00 MXN</strong></td></tr>
                                            <tr><td>5to Lugar</td><td><strong>$5,000.00 MXN</strong></td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div class="note">*Aplican condiciones y restricciones. **En caso de obtener 2 o más O'Yeses por un mismo jugador se premiará con el de mayor denominación.</div>

                                <h2>Costos, Incluye Kit e Inscripciones</h2>
                                <div class="bar"></div>
                                <div class="box" style="padding:0; overflow:hidden;">
                                    <table>
                                        <thead><tr><th>Concepto</th><th>Promoción (Hasta 5 Oct)</th><th>Regular (Desde 6 Oct)</th></tr></thead>
                                        <tbody>
                                            <tr><td><strong>Socios</strong></td><td>$6,500 MXN</td><td><strong>$7,500 MXN</strong></td></tr>
                                            <tr><td><strong>No Socios</strong></td><td>$7,500 MXN</td><td><strong>$8,500 MXN</strong></td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div class="box">
                                    <strong>EL KIT INCLUYE:</strong> Además 2 greenfee de práctica (sólo jugadores foráneos), participación en rifas y platillo en la comida de premiación y clausura.<br>
                                    <em>*Favor de confirmar acompañante(s) con 7 días de anticipación. Por cada invitado adicional se cobrará una cuota por definir.</em>
                                </div>

                                <div class="box">
                                    <div><strong>📅 Fecha límite de inscripción:</strong> Lunes 2 de noviembre a las 16:00 hrs.</div>
                                    <div style="margin-top:4px;"><strong>📞 Informes e Inscripciones:</strong> 312 194 2559 y 315 104 7094</div>
                                    <div><strong>📱 Redes Sociales:</strong> @clubdegolfdecolima</div>
                                    <div style="color:#d91b5c; font-weight:900; font-size:16px; margin-top:4px;">&gt;&gt;&gt;&gt;</div>
                                </div>
                            </div>
                        </div>

                        <div class="footer">
                            <strong>CRITERIO DE DESEMPATE:</strong> Se decidirá por el primero, segundo y tercero de cada categoría se desempatará la mejor tarjeta de los últimos 9 hoyos, (del 10 al 18); si continúa el empate ganará la mejor puntuación de los últimos 6 hoyos, últimos 3 hoyos y finalmente último hoyo y así con la primera vuelta, de ser necesario se tomará el score del primer día bajo el mismo criterio. <strong>NOTA:</strong> En las categorías donde se juega con el 80% del handicap este se aplicará para el desempate. Solo la primera categoría absoluta se jugará a muerte súbita si hay empate en el primer lugar.<br><br>
                            Cupo limitado a 45 jugadores por horario. Mínimo 4 jugadores por categoría. Fecha límite de inscripción lunes 2 de noviembre a las 16:00 hrs. Los competidores foráneos deberán enviar por Whatsapp su handicap del 15 de octubre, índex o carta de su club, así como su ficha de depósito. Cualquier omisión a estos requisitos impedirá su inscripción. Al momento de su inscripción se les hará entrega de las bases de torneo y reglas locales. El Comité Organizador se reserva el derecho sin previo aviso de hacer los cambios que se consideren pertinentes para el mejor desarrollo del torneo. *Cartel con fines únicamente promocionales.
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);
        win.document.close();
        setTimeout(() => win.print(), 500);
    };

    // Attach Modal functions to window for global access
    window.selectRankingTournament = function(tournamentId, dateLabel, isLive, fechaIndex) {
        const ctaBtn = document.getElementById('ranking-main-cta-btn');
        const ctaText = document.getElementById('ranking-cta-text');
        const ctaIcon = document.getElementById('ranking-cta-icon');
        const card1 = document.getElementById('ranking-btn-fecha-1');
        const card2 = document.getElementById('ranking-btn-fecha-2');
        const card3 = document.getElementById('ranking-btn-fecha-3');
        const card4 = document.getElementById('ranking-btn-fecha-4');

        [card1, card2, card3, card4].forEach(c => {
            if (c) {
                c.classList.remove('ring-2', 'ring-emerald-500/60', 'ring-amber-500/80', 'ring-emerald-500/40', 'ring-amber-500/40');
            }
        });

        const activeCard = fechaIndex ? document.getElementById(`ranking-btn-fecha-${fechaIndex}`) : (isLive ? card3 : card1);

        if (isLive) {
            if (ctaBtn) {
                ctaBtn.className = "w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs sm:text-sm uppercase tracking-widest shadow-2xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer";
                ctaBtn.onclick = () => window.openLiveLeaderboardModal(tournamentId);
            }
            if (ctaText) {
                ctaText.textContent = `VER LEADERBOARD EN VIVO (${dateLabel})`;
            }
            if (ctaIcon) {
                ctaIcon.textContent = 'emoji_events';
            }
            if (activeCard) {
                activeCard.classList.add('ring-2', 'ring-emerald-500/60');
            }
        } else {
            if (ctaBtn) {
                ctaBtn.className = "w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs sm:text-sm uppercase tracking-widest shadow-2xl shadow-amber-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer";
                ctaBtn.onclick = () => window.openLiveLeaderboardModal(tournamentId);
            }
            if (ctaText) {
                ctaText.textContent = `VER RESULTADOS OFICIALES (${dateLabel} · FINALIZADO)`;
            }
            if (ctaIcon) {
                ctaIcon.textContent = 'history';
            }
            if (activeCard) {
                activeCard.classList.add('ring-2', 'ring-amber-500/80');
            }
        }

        if (window.openLiveLeaderboardModal) {
            window.openLiveLeaderboardModal(tournamentId);
        }
    };

    // Eventos Carousel Pagination Controls
    let currentEventPage = 0;
    const totalEventPages = eventPages.length;

    window.goToEventPage = function(pageIndex) {
        if (pageIndex < 0 || pageIndex >= totalEventPages) return;
        currentEventPage = pageIndex;
        const track = document.getElementById('eventos-slides-track');
        const indicator = document.getElementById('eventos-page-indicator');
        const btnPrev = document.getElementById('btn-eventos-prev');
        const btnNext = document.getElementById('btn-eventos-next');
        const dots = document.querySelectorAll('.evento-dot');

        if (track) {
            track.style.transform = `translateX(-${currentEventPage * 100}%)`;
        }
        if (indicator) {
            indicator.textContent = `Mostrando ${currentEventPage + 1} de ${totalEventPages}`;
        }
        if (btnPrev) btnPrev.disabled = currentEventPage === 0;
        if (btnNext) btnNext.disabled = currentEventPage === totalEventPages - 1;

        dots.forEach((dot, idx) => {
            if (idx === currentEventPage) {
                dot.className = 'evento-dot w-8 h-2.5 rounded-full bg-purple-500 transition-all cursor-pointer';
            } else {
                dot.className = 'evento-dot w-2.5 h-2.5 rounded-full bg-slate-700 hover:bg-slate-500 transition-all cursor-pointer';
            }
        });
    };

    window.navigateEventos = function(dir) {
        window.goToEventPage(currentEventPage + dir);
    };

    let currentEventTournamentId = null;

    window.openEventModal = function(imgSrc, title, desc, date, tournamentId) {
        document.getElementById('modal-img').src = imgSrc;
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-desc').innerText = desc;
        document.getElementById('modal-date').innerText = date;
        
        currentEventTournamentId = tournamentId || null;
        const lbBtn = document.getElementById('modal-leaderboard-btn');
        if (lbBtn) {
            if (currentEventTournamentId) {
                lbBtn.classList.remove('hidden');
                lbBtn.classList.add('flex');
            } else {
                lbBtn.classList.add('hidden');
                lbBtn.classList.remove('flex');
            }
        }

        const modal = document.getElementById('event-modal');
        const content = document.getElementById('event-modal-content');
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.classList.add('opacity-100');
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
        }, 10);
        
        document.body.style.overflow = 'hidden';
    };

    window.openEventTournamentLeaderboard = function() {
        if (currentEventTournamentId && window.openLiveLeaderboardModal) {
            window.closeEventModal();
            setTimeout(() => {
                window.openLiveLeaderboardModal(currentEventTournamentId);
            }, 300);
        }
    };

    window.closeEventModal = function() {
        const modal = document.getElementById('event-modal');
        const content = document.getElementById('event-modal-content');
        
        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0');
        content.classList.remove('scale-100');
        content.classList.add('scale-95');
        
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = '';
        }, 300);
    };

    // STATE FOR MULTI-PHOTO GALLERY IN READER MODAL & LIGHTBOX
    let currentGalleryImages = [];
    let currentGalleryIndex = 0;

    // Open Anual Tournament Posters in Fullscreen Lightbox
    window.openAnualImageLightbox = function(index) {
        currentGalleryImages = [
            './imagenes/anualcolimagolf2.jpeg',
            './imagenes/anualcolimagolf1.jpeg'
        ];
        currentGalleryIndex = index || 0;
        window.openLightboxImage();
    };

    // Open Evento Gallery Album in Fullscreen Lightbox
    window.openEventoGalleryLightbox = function(albumIdx, photoIdx) {
        const album = displayGaleria[albumIdx];
        if (!album || !album.imagenes || album.imagenes.length === 0) return;
        currentGalleryImages = album.imagenes;
        currentGalleryIndex = photoIdx || 0;
        window.openLightboxImage();
    };

    window.openDronePhotoLightbox = function(photoIdx) {
        currentGalleryImages = dronePhotos.slice(0, 8);
        currentGalleryIndex = photoIdx || 0;
        window.openLightboxImage();
    };

    // EVENTO GALERÍA TABS, CARRUSEL WEB (8 FOTOS) Y SCROLL MÓVIL PINTEREST
    const galeriaCurrentPages = {};

    window.selectEventoGaleriaTab = function(albumIdx) {
        document.querySelectorAll('.galeria-tab-btn').forEach((btn, idx) => {
            if (idx === albumIdx) {
                btn.className = 'galeria-tab-btn galeria-tab-active shrink-0 max-w-[205px] sm:max-w-[225px] px-3.5 py-2 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1.5 border bg-[#7cb518] text-white border-[#7cb518] shadow-md';
            } else {
                btn.className = 'galeria-tab-btn shrink-0 max-w-[205px] sm:max-w-[225px] px-3.5 py-2 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1.5 border bg-white text-slate-700 border-slate-200 hover:border-[#7cb518] hover:text-[#65a30d]';
            }
        });
        document.querySelectorAll('.galeria-album-panel').forEach((panel, idx) => {
            if (idx === albumIdx) {
                panel.classList.remove('hidden');
                panel.classList.add('block');
            } else {
                panel.classList.add('hidden');
                panel.classList.remove('block');
            }
        });
        initMobilePinterestScroll(albumIdx);
    };

    window.goToGaleriaPage = function(albumIdx, pageIdx) {
        const album = displayGaleria[albumIdx];
        if (!album) return;
        const totalPages = Math.ceil(album.imagenes.length / 8);
        if (totalPages <= 1) return;
        const safePage = ((pageIdx % totalPages) + totalPages) % totalPages;
        galeriaCurrentPages[albumIdx] = safePage;

        const track = document.getElementById(`galeria-slides-track-${albumIdx}`);
        if (track) track.style.transform = `translateX(-${safePage * 100}%)`;

        const indicator = document.getElementById(`galeria-page-indicator-${albumIdx}`);
        if (indicator) indicator.textContent = `${safePage + 1} / ${totalPages}`;

        document.querySelectorAll(`.galeria-dot-${albumIdx}`).forEach((dot, idx) => {
            dot.className = `galeria-dot-${albumIdx} h-2 rounded-full transition-all cursor-pointer ${idx === safePage ? 'bg-[#7cb518] w-8' : 'bg-slate-300 hover:bg-slate-400 w-2'}`;
        });
    };

    window.navigateGaleriaCarousel = function(albumIdx, dir) {
        const current = galeriaCurrentPages[albumIdx] || 0;
        window.goToGaleriaPage(albumIdx, current + dir);
    };

    const initMobilePinterestScroll = (albumIdx = 0) => {
        const strip = document.getElementById(`galeria-mobile-strip-${albumIdx}`);
        if (!strip) return;
        const updateCardsScale = () => {
            const center = strip.scrollLeft + strip.clientWidth / 2;
            strip.querySelectorAll('.galeria-mobile-card').forEach(card => {
                const cardCenter = card.offsetLeft + card.offsetWidth / 2;
                const dist = Math.abs(center - cardCenter);
                const norm = Math.min(dist / (strip.clientWidth * 0.65), 1);
                const scale = 1 - norm * 0.08;
                const opacity = 1 - norm * 0.28;
                card.style.transform = `scale(${scale.toFixed(3)})`;
                card.style.opacity = opacity.toFixed(3);
            });
        };
        strip.removeEventListener('scroll', strip._pinterestScrollHandler);
        strip._pinterestScrollHandler = () => requestAnimationFrame(updateCardsScale);
        strip.addEventListener('scroll', strip._pinterestScrollHandler, { passive: true });
        requestAnimationFrame(updateCardsScale);
    };
    initMobilePinterestScroll(0);

    const updateGalleryView = () => {
        const imgElement = document.getElementById('noticia-modal-img');
        const counterElement = document.getElementById('noticia-modal-counter');
        const prevBtn = document.getElementById('btn-gallery-prev');
        const nextBtn = document.getElementById('btn-gallery-next');
        const thumbnailsContainer = document.getElementById('noticia-modal-thumbnails');

        if (!imgElement || currentGalleryImages.length === 0) return;

        imgElement.src = currentGalleryImages[currentGalleryIndex];

        if (currentGalleryImages.length > 1) {
            prevBtn.classList.remove('hidden');
            nextBtn.classList.remove('hidden');
            counterElement.classList.remove('hidden');
            counterElement.innerText = `Foto ${currentGalleryIndex + 1} de ${currentGalleryImages.length}`;

            thumbnailsContainer.classList.remove('hidden');
            thumbnailsContainer.innerHTML = currentGalleryImages.map((src, idx) => `
                <button onclick="selectGalleryImage(${idx})" class="relative w-16 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${idx === currentGalleryIndex ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/20' : 'border-slate-800 opacity-60 hover:opacity-100'}">
                    <img src="${src}" alt="Miniatura ${idx + 1}" class="w-full h-full object-cover">
                </button>
            `).join('');
        } else {
            prevBtn.classList.add('hidden');
            nextBtn.classList.add('hidden');
            counterElement.classList.add('hidden');
            thumbnailsContainer.classList.add('hidden');
        }
    };

    window.prevGalleryImage = function() {
        if (currentGalleryImages.length <= 1) return;
        currentGalleryIndex = (currentGalleryIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
        updateGalleryView();
        updateLightboxImage();
    };

    window.nextGalleryImage = function() {
        if (currentGalleryImages.length <= 1) return;
        currentGalleryIndex = (currentGalleryIndex + 1) % currentGalleryImages.length;
        updateGalleryView();
        updateLightboxImage();
    };

    window.selectGalleryImage = function(idx) {
        if (idx >= 0 && idx < currentGalleryImages.length) {
            currentGalleryIndex = idx;
            updateGalleryView();
            updateLightboxImage();
        }
    };

    // LIGHTBOX FULLSCREEN ZOOM HANDLERS WITH ARROWS & KEYBOARD
    window.updateLightboxImage = function() {
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxCounter = document.getElementById('lightbox-counter');
        const prevBtn = document.getElementById('btn-lightbox-prev');
        const nextBtn = document.getElementById('btn-lightbox-next');
        if (!lightboxImg || currentGalleryImages.length === 0) return;

        lightboxImg.src = currentGalleryImages[currentGalleryIndex];

        if (currentGalleryImages.length > 1) {
            if (prevBtn) prevBtn.classList.remove('hidden');
            if (nextBtn) nextBtn.classList.remove('hidden');
            if (lightboxCounter) {
                lightboxCounter.classList.remove('hidden');
                lightboxCounter.innerText = `Imagen ${currentGalleryIndex + 1} de ${currentGalleryImages.length}`;
            }
        } else {
            if (prevBtn) prevBtn.classList.add('hidden');
            if (nextBtn) nextBtn.classList.add('hidden');
            if (lightboxCounter) lightboxCounter.classList.add('hidden');
        }
    };

    window.openLightboxImage = function() {
        if (currentGalleryImages.length === 0) return;
        const lightbox = document.getElementById('lightbox-modal');
        if (!lightbox) return;

        window.updateLightboxImage();
        lightbox.classList.remove('hidden');
        lightbox.classList.add('flex');
        setTimeout(() => {
            lightbox.classList.remove('opacity-0');
            lightbox.classList.add('opacity-100');
        }, 10);
    };

    window.closeLightboxImage = function() {
        const lightbox = document.getElementById('lightbox-modal');
        if (!lightbox) return;
        lightbox.classList.remove('opacity-100');
        lightbox.classList.add('opacity-0');
        setTimeout(() => {
            lightbox.classList.add('hidden');
            lightbox.classList.remove('flex');
        }, 300);
    };

    // Keyboard navigation (ArrowLeft, ArrowRight, Escape)
    if (!window._lightboxKeydownBound) {
        window._lightboxKeydownBound = true;
        document.addEventListener('keydown', (e) => {
            const lightbox = document.getElementById('lightbox-modal');
            if (lightbox && !lightbox.classList.contains('hidden')) {
                if (e.key === 'ArrowLeft') {
                    window.prevGalleryImage();
                } else if (e.key === 'ArrowRight') {
                    window.nextGalleryImage();
                } else if (e.key === 'Escape') {
                    window.closeLightboxImage();
                }
            }
            const convModal = document.getElementById('convocatoria-modal');
            if (convModal && !convModal.classList.contains('hidden') && e.key === 'Escape') {
                window.closeConvocatoriaModal();
            }
        });
    }

    // NOTICIA READER MODAL OPEN/CLOSE
    window.openNoticiaModal = function(id) {
        const n = activeNoticias.find(x => x.id === id);
        if (!n) return;
        const modal = document.getElementById('noticia-modal');
        const content = document.getElementById('noticia-modal-content');
        
        currentGalleryImages = getNoticiaImages(n);
        currentGalleryIndex = 0;

        document.getElementById('noticia-modal-title').innerText = (n.titulo || '').replace(/\*/g, '');
        document.getElementById('noticia-modal-date').innerText = n.fecha_publicacion ? new Date(n.fecha_publicacion + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
        document.getElementById('noticia-modal-author').innerText = n.autor || 'Club de Golf Colima';
        const safeBody = (n.contenido || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\*([^*]+)\*/g, '<strong class="text-slate-900 font-bold">$1</strong>');
        document.getElementById('noticia-modal-body').innerHTML = safeBody;

        updateGalleryView();

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.classList.add('opacity-100');
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
        }, 10);
        document.body.style.overflow = 'hidden';
    };

    window.closeNoticiaModal = function() {
        const modal = document.getElementById('noticia-modal');
        const content = document.getElementById('noticia-modal-content');
        if (!modal) return;
        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0');
        content.classList.remove('scale-100');
        content.classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = '';
        }, 300);
    };

    // "VER TODAS LAS NOTICIAS" MODAL HANDLERS
    const renderAllNoticiasGrid = (filterQuery = '') => {
        const grid = document.getElementById('all-noticias-grid');
        if (!grid) return;

        const q = filterQuery.toLowerCase().trim();
        const filtered = activeNoticias.filter(n => {
            if (!q) return true;
            return (n.titulo && n.titulo.toLowerCase().includes(q)) ||
                   (n.contenido && n.contenido.toLowerCase().includes(q));
        });

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full py-16 text-center text-slate-500 space-y-2">
                    <span class="material-icons text-3xl">search_off</span>
                    <p class="text-xs font-bold uppercase tracking-wider">No se encontraron noticias con "${filterQuery}"</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(n => {
            const imgs = getNoticiaImages(n);
            const coverImg = imgs[0] || './imagenes/feria.jpeg';
            return `
                <div class="group relative rounded-3xl overflow-hidden border border-slate-800 hover:border-amber-500/60 aspect-[4/3] bg-slate-900 shadow-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1.5" onclick="openNoticiaModal('${n.id}')">
                    <img src="${coverImg}" alt="${n.titulo}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onerror="this.src='./golcolima.jpg'" loading="lazy">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent p-6 flex flex-col justify-end">
                        ${imgs.length > 1 ? `
                            <div class="absolute top-4 right-4">
                                <span class="px-2.5 py-1 bg-slate-950/85 border border-slate-700/80 text-amber-300 rounded-xl text-[9px] font-black uppercase flex items-center gap-1 backdrop-blur-md shadow-lg">
                                    <span class="material-icons" style="font-size:12px">collections</span> ${imgs.length} fotos
                                </span>
                            </div>
                        ` : ''}
                        
                        <h4 class="text-base sm:text-lg font-black text-white uppercase tracking-tight leading-snug group-hover:text-amber-400 transition-colors line-clamp-2">
                            ${n.titulo}
                        </h4>
                    </div>
                </div>
            `;
        }).join('');
    };

    window.openAllNoticiasModal = function() {
        const modal = document.getElementById('all-noticias-modal');
        const content = document.getElementById('all-noticias-modal-content');
        const searchInput = document.getElementById('input-search-all-noticias');
        if (!modal) return;

        if (searchInput) {
            searchInput.value = '';
            searchInput.oninput = (e) => renderAllNoticiasGrid(e.target.value);
        }

        renderAllNoticiasGrid();

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.classList.add('opacity-100');
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
        }, 10);
        document.body.style.overflow = 'hidden';
    };

    window.closeAllNoticiasModal = function() {
        const modal = document.getElementById('all-noticias-modal');
        const content = document.getElementById('all-noticias-modal-content');
        if (!modal) return;
        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0');
        content.classList.remove('scale-100');
        content.classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = '';
        }, 300);
    };

    // TEE TIME MODAL HANDLERS
    window.openTeeTimeModal = function() {
        const modal = document.getElementById('teetime-modal');
        const content = document.getElementById('teetime-modal-content');
        const dateInput = document.getElementById('tt-fecha');
        
        if (dateInput && !dateInput.value) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
            dateInput.value = today;
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.classList.add('opacity-100');
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
        }, 10);
        
        document.body.style.overflow = 'hidden';
    };

    window.closeTeeTimeModal = function() {
        const modal = document.getElementById('teetime-modal');
        const content = document.getElementById('teetime-modal-content');
        
        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0');
        content.classList.remove('scale-100');
        content.classList.add('scale-95');
        
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = '';
        }, 300);
    };

    window.handleTeeTimeSubmit = async function(e) {
        e.preventDefault();
        
        const btn = document.getElementById('tt-submit-btn');
        const originalBtnHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span class="material-icons animate-spin" style="font-size:18px">refresh</span> Guardando Solicitud...`;

        const tipoJugador = document.querySelector('input[name="tipo_jugador"]:checked')?.value || 'Socio';
        const nombre = document.getElementById('tt-nombre')?.value?.trim() || '';
        const telefono = document.getElementById('tt-telefono')?.value?.trim() || '';
        const fecha = document.getElementById('tt-fecha')?.value || '';
        const hora = document.getElementById('tt-hora')?.value || '08:00 AM';
        const numJugadores = document.getElementById('tt-jugadores')?.value || '1';
        const hoyoSalida = document.getElementById('tt-hoyo')?.value || '1';
        const requiereCarrito = document.getElementById('tt-carrito')?.checked || false;
        const requiereCaddie = document.getElementById('tt-caddie')?.checked || false;
        const requierePalos = document.getElementById('tt-palos')?.checked || false;
        const comentarios = document.getElementById('tt-comentarios')?.value?.trim() || 'Ninguno';

        // 1. Guardar en Supabase schema "colimaGC"."reservas_tee_time"
        try {
            await db.from('reservas_tee_time').insert([{
                nombre_jugador: nombre,
                telefono: telefono,
                tipo_jugador: tipoJugador,
                fecha_reserva: fecha,
                hora_reserva: hora,
                num_jugadores: parseInt(numJugadores, 10) || 1,
                hoyo_salida: parseInt(hoyoSalida, 10) || 1,
                requiere_carrito: requiereCarrito,
                requiere_caddie: requiereCaddie,
                requiere_palos: requierePalos,
                comentarios: comentarios !== 'Ninguno' ? comentarios : null,
                estado: 'pendiente'
            }]);
        } catch (err) {
            console.warn('Nota inserción Supabase:', err);
        }

        // 2. Construir lista de servicios adicionales
        const adicionales = [];
        if (requiereCarrito) adicionales.push('Carrito de Golf');
        if (requiereCaddie) adicionales.push('Caddie');
        if (requierePalos) adicionales.push('Renta de Palos');
        const adicionalesStr = adicionales.length > 0 ? adicionales.join(', ') : 'Ninguno';

        // 3. Formatear mensaje para WhatsApp
        const mensaje = 
`⛳ *SOLICITUD DE TEE TIME - CLUB DE GOLF COLIMA*
━━━━━━━━━━━━━━━━━━━━━
👤 *Nombre:* ${nombre}
📱 *Teléfono:* ${telefono}
🏷️ *Condición:* ${tipoJugador}
📅 *Fecha:* ${fecha}
⏰ *Hora:* ${hora}
👥 *Jugadores:* ${numJugadores} persona(s)
🚩 *Salida:* Hoyo ${hoyoSalida}
🛒 *Adicionales:* ${adicionalesStr}
💬 *Notas:* ${comentarios}
━━━━━━━━━━━━━━━━━━━━━
_Enviado desde el portal oficial Club de Golf Colima_`;

        // 4. Abrir WhatsApp hacia el celular del club
        const waUrl = `https://wa.me/5213121942559?text=${encodeURIComponent(mensaje)}`;
        window.open(waUrl, '_blank');

        // 5. Restablecer y cerrar modal
        btn.innerHTML = `<span class="material-icons text-base">check_circle</span> ¡Solicitud Enviada!`;
        setTimeout(() => {
            btn.innerHTML = originalBtnHtml;
            btn.disabled = false;
            document.getElementById('teetime-form').reset();
            closeTeeTimeModal();
        }, 1200);
    };
}

function startHeroSlider() {
    let currentSlide = 0;
    setInterval(() => {
        const slides = document.querySelectorAll('.hero-slide');
        if (!slides || slides.length === 0) return;

        slides[currentSlide].classList.remove('opacity-100', 'scale-105');
        slides[currentSlide].classList.add('opacity-0', 'scale-100');

        currentSlide = (currentSlide + 1) % slides.length;

        slides[currentSlide].classList.remove('opacity-0', 'scale-100');
        slides[currentSlide].classList.add('opacity-100', 'scale-105');
    }, 4500);
}

// ================================================
// MODAL PÚBLICO: PADRÓN DE HANDICAPS WHS / JUGADORES
// ================================================
const PUBLIC_TEES_CONFIG = [
    { name: 'Blancas (B)', rating: 66.5, slope: 125, par: 68 },
    { name: 'Doradas (D)', rating: 65.7, slope: 122, par: 68 },
    { name: 'Plata/Rojo (P)', rating: 65.5, slope: 121, par: 68 },
    { name: 'Azul (A)', rating: 68.0, slope: 128, par: 68 }
];

function computeTeeHdcp(hi, tee) {
    const idx = Math.max(0, parseFloat(hi) || 0);
    const crDiff = (tee.rating || 68) - (tee.par || 68);
    const raw = (idx * (tee.slope / 113)) + crDiff;
    return Math.max(0, Math.round(raw));
}

window.openPublicHandicapModal = async () => {
    let modal = document.getElementById('public-handicap-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'public-handicap-modal';
        document.body.appendChild(modal);
    }

    modal.className = 'fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto animate-fade-in';

    modal.innerHTML = `
        <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl p-12 flex flex-col items-center justify-center gap-4 text-center shadow-2xl">
            <span class="material-icons text-amber-400 animate-spin text-5xl">sync</span>
            <p class="text-white font-black uppercase text-sm tracking-widest">Cargando Padrón Oficial WHS...</p>
        </div>
    `;

    try {
        const { data: members, error } = await db.from('members').select('*').order('name', { ascending: true });
        if (error) throw error;

        window._publicMembersList = members || [];
        window._publicHandicapSearch = '';
        window._publicHandicapCat = 'ALL';

        renderPublicHandicapModalView();
    } catch (err) {
        console.error('Error loading public handicaps:', err);
        modal.innerHTML = `
            <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-8 text-center space-y-4 shadow-2xl">
                <span class="material-icons text-rose-500 text-5xl">error_outline</span>
                <h3 class="text-white font-black text-lg uppercase">Error de Conexión</h3>
                <p class="text-slate-400 text-xs">${err.message || 'No se pudieron consultar los handicaps.'}</p>
                <button onclick="closePublicHandicapModal()" class="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase text-xs">Cerrar</button>
            </div>
        `;
    }
};

window.closePublicHandicapModal = () => {
    const modal = document.getElementById('public-handicap-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.remove();
    }
};

function renderPublicHandicapModalView() {
    const modal = document.getElementById('public-handicap-modal');
    if (!modal) return;

    const allMembers = window._publicMembersList || [];
    const search = (window._publicHandicapSearch || '').toLowerCase().trim();
    const catFilter = window._publicHandicapCat || 'ALL';

    const filtered = allMembers.filter(m => {
        const matchSearch = !search || `${m.name} ${m.member_number}`.toLowerCase().includes(search);
        const matchCat = (catFilter === 'ALL') || (m.category === catFilter);
        return matchSearch && matchCat;
    });

    const categories = Array.from(new Set(allMembers.map(m => m.category).filter(Boolean)));
    const todayStr = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

    modal.innerHTML = `
        <div class="bg-slate-900 border border-slate-800 rounded-[2rem] w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in relative" onclick="event.stopPropagation()">
            
            <!-- HEADER -->
            <div class="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4 shrink-0">
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400">
                        <span class="material-icons text-2xl">analytics</span>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h2 class="text-base sm:text-lg font-black text-white uppercase tracking-tight">Padrón de Handicaps Oficial WHS</h2>
                            <span class="hidden sm:inline px-2.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full text-[9px] font-black uppercase">En Vivo</span>
                        </div>
                        <p class="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Club de Golf Colima · USGA World Handicap System · ${todayStr}</p>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <button onclick="printPublicHandicaps()" title="Imprimir o Guardar PDF"
                        class="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase transition-all shadow-md cursor-pointer">
                        <span class="material-icons text-sm">print</span> <span class="hidden sm:inline">Imprimir</span>
                    </button>
                    <button onclick="closePublicHandicapModal()" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer">
                        <span class="material-icons text-lg">close</span>
                    </button>
                </div>
            </div>

            <!-- CONTROLS & SEARCH -->
            <div class="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 space-y-3 shrink-0">
                <div class="flex flex-col sm:flex-row gap-3">
                    <!-- Search Input -->
                    <div class="relative flex-1">
                        <input id="public-hdcp-search" type="text" value="${window._publicHandicapSearch || ''}"
                            placeholder="BUSCAR JUGADOR POR NOMBRE O # SOCIO..."
                            oninput="onPublicHandicapSearch(this.value)"
                            class="w-full pl-10 pr-4 py-3 bg-slate-800/90 border border-slate-700 rounded-2xl text-white text-xs sm:text-sm font-bold uppercase placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-all">
                        <span class="material-icons absolute left-3.5 top-3 text-slate-500 text-lg">search</span>
                    </div>

                    <!-- Category Pills -->
                    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                        <button onclick="filterPublicHandicapCat('ALL')"
                            class="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${catFilter === 'ALL' ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}">
                            Todos (${allMembers.length})
                        </button>
                        ${categories.map(c => `
                            <button onclick="filterPublicHandicapCat('${c}')"
                                class="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${catFilter === c ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}">
                                ${c}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- CONTENT BODY -->
            <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                ${filtered.length === 0 ? `
                    <div class="py-16 text-center text-slate-500 space-y-2">
                        <span class="material-icons text-5xl text-slate-600">search_off</span>
                        <p class="font-black text-xs uppercase tracking-widest">No se encontraron jugadores con ese criterio.</p>
                    </div>
                ` : `
                    <!-- TABLA DESKTOP (md:block) -->
                    <div class="hidden md:block overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40">
                        <table class="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr class="bg-slate-800/80 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-700/80">
                                    <th class="px-4 py-3.5"># Socio</th>
                                    <th class="px-4 py-3.5">Jugador / Socio</th>
                                    <th class="px-4 py-3.5">Categoría</th>
                                    <th class="px-4 py-3.5 text-center bg-amber-500/10 text-amber-300">HDCP Index (WHS)</th>
                                    <th class="px-3 py-3.5 text-center">⚪ Blancas</th>
                                    <th class="px-3 py-3.5 text-center">🟡 Doradas</th>
                                    <th class="px-3 py-3.5 text-center">🔘 Plata</th>
                                    <th class="px-3 py-3.5 text-center">🔵 Azul</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-800/60 font-bold">
                                ${filtered.map(m => {
                                    const hi = m.current_handicap !== undefined && m.current_handicap !== null ? parseFloat(m.current_handicap).toFixed(1) : '0.0';
                                    const hcpB = computeTeeHdcp(hi, PUBLIC_TEES_CONFIG[0]);
                                    const hcpD = computeTeeHdcp(hi, PUBLIC_TEES_CONFIG[1]);
                                    const hcpP = computeTeeHdcp(hi, PUBLIC_TEES_CONFIG[2]);
                                    const hcpA = computeTeeHdcp(hi, PUBLIC_TEES_CONFIG[3]);
                                    return `
                                    <tr class="hover:bg-slate-800/40 transition-colors">
                                        <td class="px-4 py-3 text-slate-400 font-mono text-[11px]">${m.member_number || '—'}</td>
                                        <td class="px-4 py-3 text-white font-black uppercase text-sm">${m.name}</td>
                                        <td class="px-4 py-3">
                                            <span class="px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-full text-[9px] font-black uppercase">
                                                ${m.category || 'SOCIO'}
                                            </span>
                                        </td>
                                        <td class="px-4 py-3 text-center bg-amber-500/5">
                                            <span class="inline-block px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl font-black text-sm shadow-sm">
                                                ${hi}
                                            </span>
                                        </td>
                                        <td class="px-3 py-3 text-center text-slate-200 font-black text-sm">${hcpB}</td>
                                        <td class="px-3 py-3 text-center text-amber-300 font-black text-sm">${hcpD}</td>
                                        <td class="px-3 py-3 text-center text-rose-300 font-black text-sm">${hcpP}</td>
                                        <td class="px-3 py-3 text-center text-blue-300 font-black text-sm">${hcpA}</td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>

                    <!-- CARDS MOBILE (md:hidden) -->
                    <div class="md:hidden space-y-3">
                        ${filtered.map(m => {
                            const hi = m.current_handicap !== undefined && m.current_handicap !== null ? parseFloat(m.current_handicap).toFixed(1) : '0.0';
                            const hcpB = computeTeeHdcp(hi, PUBLIC_TEES_CONFIG[0]);
                            const hcpD = computeTeeHdcp(hi, PUBLIC_TEES_CONFIG[1]);
                            const hcpP = computeTeeHdcp(hi, PUBLIC_TEES_CONFIG[2]);
                            const hcpA = computeTeeHdcp(hi, PUBLIC_TEES_CONFIG[3]);
                            return `
                            <div class="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 shadow-lg">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="min-w-0 flex-1">
                                        <p class="text-sm font-black text-white uppercase truncate">${m.name}</p>
                                        <div class="flex items-center gap-2 mt-1">
                                            <span class="text-[10px] font-mono text-slate-400 font-bold">${m.member_number || 'SOCIO'}</span>
                                            <span class="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] font-black uppercase">${m.category || 'SOCIO'}</span>
                                        </div>
                                    </div>
                                    <div class="text-right shrink-0">
                                        <span class="text-[8px] font-black uppercase text-amber-400 tracking-wider block">INDEX WHS</span>
                                        <span class="inline-block px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl font-black text-base mt-0.5">
                                            ${hi}
                                        </span>
                                    </div>
                                </div>

                                <!-- Mini Grid de Golpes por Tee -->
                                <div class="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-800/80 text-center">
                                    <div class="p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                                        <span class="text-[8px] font-black text-slate-400 uppercase block truncate">⚪ Blancas</span>
                                        <span class="text-xs font-black text-white">${hcpB}</span>
                                    </div>
                                    <div class="p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                                        <span class="text-[8px] font-black text-amber-400 uppercase block truncate">🟡 Doradas</span>
                                        <span class="text-xs font-black text-amber-300">${hcpD}</span>
                                    </div>
                                    <div class="p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                                        <span class="text-[8px] font-black text-rose-400 uppercase block truncate">🔘 Plata</span>
                                        <span class="text-xs font-black text-rose-300">${hcpP}</span>
                                    </div>
                                    <div class="p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                                        <span class="text-[8px] font-black text-blue-400 uppercase block truncate">🔵 Azul</span>
                                        <span class="text-xs font-black text-blue-300">${hcpA}</span>
                                    </div>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>

            <!-- FOOTER INFO -->
            <div class="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider shrink-0">
                <span class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span> Par de Campo: 68 Golpes (IN 34 · OUT 34)
                </span>
                <span>Fórmula Oficial: HCP = Index × (Slope / 113) + (Rating − Par)</span>
            </div>
        </div>
    `;
}

window.onPublicHandicapSearch = (val) => {
    window._publicHandicapSearch = val;
    renderPublicHandicapModalView();
    const inp = document.getElementById('public-hdcp-search');
    if (inp) {
        inp.focus();
        inp.setSelectionRange(val.length, val.length);
    }
};

window.filterPublicHandicapCat = (cat) => {
    window._publicHandicapCat = cat;
    renderPublicHandicapModalView();
};

window.printPublicHandicaps = () => {
    const allMembers = window._publicMembersList || [];
    const today = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    const win = window.open('', '_blank');
    if (!win) return;

    const rowsHtml = allMembers.map(m => {
        const hi = m.current_handicap !== undefined && m.current_handicap !== null ? parseFloat(m.current_handicap).toFixed(1) : '0.0';
        const hcpB = computeTeeHdcp(hi, PUBLIC_TEES_CONFIG[0]);
        const hcpD = computeTeeHdcp(hi, PUBLIC_TEES_CONFIG[1]);
        const hcpP = computeTeeHdcp(hi, PUBLIC_TEES_CONFIG[2]);
        const hcpA = computeTeeHdcp(hi, PUBLIC_TEES_CONFIG[3]);
        return `
            <tr>
                <td style="padding:6px 8px; border:1px solid #ddd; font-family:monospace;">${m.member_number || '—'}</td>
                <td style="padding:6px 8px; border:1px solid #ddd; font-weight:bold;">${m.name}</td>
                <td style="padding:6px 8px; border:1px solid #ddd; text-transform:uppercase;">${m.category || 'SOCIO'}</td>
                <td style="padding:6px 8px; border:1px solid #ddd; text-align:center; font-weight:bold; background:#fef3c7;">${hi}</td>
                <td style="padding:6px 8px; border:1px solid #ddd; text-align:center; font-weight:bold;">${hcpB}</td>
                <td style="padding:6px 8px; border:1px solid #ddd; text-align:center; font-weight:bold;">${hcpD}</td>
                <td style="padding:6px 8px; border:1px solid #ddd; text-align:center; font-weight:bold;">${hcpP}</td>
                <td style="padding:6px 8px; border:1px solid #ddd; text-align:center; font-weight:bold;">${hcpA}</td>
            </tr>
        `;
    }).join('');

    win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Padrón Oficial de Handicaps - Club de Golf Colima</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; font-size: 11px; color: #111; }
                h1 { font-size: 18px; margin: 0 0 4px 0; text-transform: uppercase; }
                p { margin: 0 0 14px 0; color: #555; font-size: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th { background: #1e293b; color: white; padding: 8px; font-size: 10px; text-transform: uppercase; border: 1px solid #1e293b; }
            </style>
        </head>
        <body>
            <h1>Club de Golf Colima · Padrón Oficial de Handicaps (WHS)</h1>
            <p>Fecha de emisión: ${today} · Total registrados: ${allMembers.length} jugadores · Par de Campo 68</p>
            <table>
                <thead>
                    <tr>
                        <th># Socio</th>
                        <th>Jugador / Socio</th>
                        <th>Categoría</th>
                        <th>HDCP Index</th>
                        <th>Blancas (66.5/125)</th>
                        <th>Doradas (65.7/122)</th>
                        <th>Plata (65.5/121)</th>
                        <th>Azul (68.0/128)</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        </body>
        </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 500);
};
