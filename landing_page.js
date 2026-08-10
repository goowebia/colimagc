// ================================================
// LANDING PAGE OFICIAL - CLUB DE GOLF COLIMA
// ================================================

export function renderLandingPageModule(container) {
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

    container.innerHTML = `
        <div class="min-h-screen bg-slate-950 text-slate-100 font-display selection:bg-primary selection:text-slate-950">
            <!-- 1. TOP NAVBAR (SOLO LOGO OFICIAL DEL CLUB) -->
            <nav class="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-4 transition-all">
                <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <!-- Brand Logo -->
                    <div class="flex items-center gap-3 cursor-pointer" onclick="window.scrollTo({top:0, behavior:'smooth'})">
                        <div class="p-1.5 bg-white/5 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md">
                            <img src="./golcolima.jpg" alt="Club Colima" class="h-10 w-auto object-contain rounded-xl">
                        </div>
                        <div>
                            <span class="font-black text-white text-lg tracking-tight uppercase block leading-none">Club de Golf Colima</span>
                            <span class="text-[10px] font-bold text-primary tracking-[0.25em] uppercase mt-1 block">El Oasis del Golf en Colima</span>
                        </div>
                    </div>

                    <!-- Nav Links Desktop -->
                    <div class="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-300">
                        <a href="#inicio" class="hover:text-primary transition-colors">Inicio</a>
                        <a href="#campo" class="hover:text-primary transition-colors">El Campo</a>
                        <a href="#servicios" class="hover:text-primary transition-colors">Servicios</a>
                        <a href="#contacto" class="hover:text-primary transition-colors">Contacto</a>
                    </div>

                    <!-- Quick Action Buttons -->
                    <div class="flex items-center gap-3">
                        <a href="https://wa.me/5213121942559" target="_blank" class="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-black uppercase tracking-wider transition-all">
                            <span class="material-icons" style="font-size:16px">chat</span> WhatsApp
                        </a>
                        <button onclick="window.location.hash = '#admin'; if (window.renderLogin) window.renderLogin();"
                            class="px-5 py-2.5 bg-gradient-to-r from-primary to-emerald-600 hover:from-emerald-500 hover:to-primary text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all transform hover:-translate-y-0.5 flex items-center gap-2">
                            <span class="material-icons" style="font-size:16px">lock</span> Portal
                        </button>
                    </div>
                </div>
            </nav>

            <!-- 2. HERO SECTION CON LOGO EN GRANDE ARRIBA -->
            <section id="inicio" class="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-8 pb-16 px-4">
                <!-- Background Drone Photo Carousel -->
                <div id="hero-slider" class="absolute inset-0 z-0">
                    ${dronePhotos.map((src, index) => `
                        <div class="hero-slide absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${index === 0 ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}"
                            style="background-image: url('${src}'); filter: brightness(0.65) contrast(1.10);"></div>
                    `).join('')}
                    <!-- Dark Gradient Overlay -->
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/50"></div>
                </div>

                <div class="relative z-10 max-w-5xl mx-auto text-center space-y-6 mt-4 animate-fade-in">
                    <!-- LOGO EN GRANDE DEL CLUB DE GOLF COLIMA -->
                    <div class="flex justify-center mb-2">
                        <div class="p-4 bg-slate-950/60 border border-white/20 rounded-3xl shadow-2xl backdrop-blur-xl hover:scale-105 transition-transform">
                            <img src="./golcolima.jpg" alt="Club de Golf Colima" class="h-28 sm:h-36 w-auto object-contain rounded-2xl shadow-2xl">
                        </div>
                    </div>

                    <!-- Glassmorphism Badge -->
                    <div class="inline-flex items-center gap-2 px-5 py-2 bg-slate-900/80 border border-slate-700/80 rounded-full backdrop-blur-xl shadow-2xl">
                        <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span class="text-xs font-black text-white uppercase tracking-widest">18 Hoyos · Par 68 · 5,660 Yardas</span>
                    </div>

                    <!-- Main Heading -->
                    <h1 class="text-3xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-[1.08] shadow-sm">
                        EL OASIS DEL GOLF <br>
                        <span class="bg-gradient-to-r from-emerald-400 via-primary to-amber-300 bg-clip-text text-transparent">EN EL CORAZÓN DE COLIMA</span>
                    </h1>

                    <p class="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto font-medium leading-relaxed">
                        Disfruta de un campo desafiante rodeado de naturaleza tropical, instalaciones de primera clase y la comunidad golfista más vibrante del estado.
                    </p>

                    <!-- Hero Call to Action Buttons -->
                    <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                        <a href="https://wa.me/5213121942559?text=Hola,%20quisiera%20consultar%20disponibilidad%20para%20reservar%20una%20salida%20en%20el%20Club%20de%20Golf%20Colima" target="_blank"
                            class="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-emerald-500 text-slate-950 font-black rounded-2xl text-sm uppercase tracking-wider shadow-2xl shadow-primary/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3">
                            <span class="material-icons">golf_course</span> Reservar Salida / Tee Time
                        </a>
                        <a href="#campo"
                            class="w-full sm:w-auto px-8 py-4 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white font-black rounded-2xl text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 backdrop-blur-md">
                            <span class="material-icons text-amber-400">photo_library</span> Ver Galería Aérea
                        </a>
                    </div>

                    <!-- Quick Stats Cards & LOGO DE ASOCIACIÓN ABAJO -->
                    <div class="space-y-4 pt-6 max-w-4xl mx-auto">
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div class="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md text-center space-y-1 shadow-xl">
                                <p class="text-3xl font-black text-amber-400">18</p>
                                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hoyos de Competición</p>
                            </div>
                            <div class="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md text-center space-y-1 shadow-xl">
                                <p class="text-3xl font-black text-emerald-400">68</p>
                                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Par de Campo</p>
                            </div>
                            <div class="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md text-center space-y-1 shadow-xl">
                                <p class="text-3xl font-black text-blue-400">5,660</p>
                                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Yardas Recorrido</p>
                            </div>
                            <div class="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md text-center space-y-1 shadow-xl">
                                <p class="text-3xl font-black text-rose-400">WHS</p>
                                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Handicaps Oficiales</p>
                            </div>
                        </div>

                        <!-- LOGO DE LA ASOCIACIÓN EN LOS BOTONES INFERIORES -->
                        <div class="flex items-center justify-center gap-3 pt-2">
                            <div class="px-5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl backdrop-blur-xl flex items-center gap-3 shadow-2xl hover:border-slate-600 transition-all">
                                <img src="./logoclub.png" alt="Asociación de Golf" class="h-8 w-auto object-contain rounded-lg">
                                <span class="text-[11px] font-black text-slate-300 uppercase tracking-wider">Afiliado a la Asociación Mexicana de Golf & WHS</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 3. SECCIÓN EL CAMPO (DRONE GALLERY & CARD SPECS) -->
            <section id="campo" class="py-20 px-4 sm:px-8 max-w-7xl mx-auto space-y-12">
                <div class="text-center space-y-3">
                    <span class="px-4 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-[10px] uppercase tracking-widest rounded-full">Recorrido Aéreo HD</span>
                    <h2 class="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">NUESTRO CAMPO DE GOLF</h2>
                    <p class="text-slate-400 text-sm max-w-2xl mx-auto font-medium">
                        Diseñado para ofrecer una experiencia única de tiro con fairways amplios, trampas estratégicas y greens perfectamente cuidados.
                    </p>
                </div>

                <!-- Specs per Tee Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all">
                        <div class="w-12 h-12 rounded-2xl bg-slate-200 text-slate-950 font-black flex items-center justify-center text-xl shadow-lg">B</div>
                        <h3 class="font-black text-white text-lg uppercase">Tee Blanco (White/Blue)</h3>
                        <p class="text-xs text-slate-400 font-bold uppercase">Distancia: <span class="text-white">5,660 Yds</span> · Rating: <span class="text-amber-400">67.5</span> · Slope: <span class="text-amber-400">114</span></p>
                        <p class="text-xs text-slate-500 leading-relaxed">Marca de salida principal para caballeros. Exige precisión en las salidas y buen control de distancia.</p>
                    </div>

                    <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all">
                        <div class="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xl shadow-lg">D</div>
                        <h3 class="font-black text-white text-lg uppercase">Tee Dorado (Gold/Yellow)</h3>
                        <p class="text-xs text-slate-400 font-bold uppercase">Distancia: <span class="text-white">5,158 Yds</span> · Rating: <span class="text-amber-400">65.8</span> · Slope: <span class="text-amber-400">110</span></p>
                        <p class="text-xs text-slate-500 leading-relaxed">Ideal para jugadores sénior e intermedios buscando equilibrio entre reto y distancia justa.</p>
                    </div>

                    <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all">
                        <div class="w-12 h-12 rounded-2xl bg-rose-600 text-white font-black flex items-center justify-center text-xl shadow-lg">P</div>
                        <h3 class="font-black text-white text-lg uppercase">Tee Plata / Rojo (Red)</h3>
                        <p class="text-xs text-slate-400 font-bold uppercase">Distancia: <span class="text-white">4,768 Yds</span> · Rating: <span class="text-rose-400">64.5</span> · Slope: <span class="text-rose-400">108</span></p>
                        <p class="text-xs text-slate-500 leading-relaxed">Marca de salida para damas y juveniles. Excelente configuración para estrategia y colocación.</p>
                    </div>
                </div>

                <!-- Drone Photography Masonry / Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                    ${dronePhotos.slice(0, 6).map((src, i) => `
                        <div class="group relative rounded-3xl overflow-hidden border border-slate-800 aspect-[4/3] bg-slate-900 shadow-xl">
                            <img src="${src}" alt="Club de Golf Colima Dron" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy">
                            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-end">
                                <span class="text-xs font-black text-primary uppercase tracking-widest">Vista Aérea HD</span>
                                <h4 class="text-lg font-black text-white uppercase">Campo de Golf Colima</h4>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>

            <!-- 4. SECCIÓN SERVICIOS E INSTALACIONES -->
            <section id="servicios" class="py-20 bg-slate-900/60 border-y border-slate-800 px-4 sm:px-8">
                <div class="max-w-7xl mx-auto space-y-12">
                    <div class="text-center space-y-3">
                        <span class="px-4 py-1 bg-primary/10 border border-primary/30 text-primary font-black text-[10px] uppercase tracking-widest rounded-full">Experiencia Integral</span>
                        <h2 class="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">SERVICIOS & INSTALACIONES</h2>
                        <p class="text-slate-400 text-sm max-w-2xl mx-auto font-medium"> Todo lo necesario para que tu jornada de golf sea perfecta de principio a fin.</p>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div class="p-8 bg-slate-950 border border-slate-800 rounded-3xl space-y-4 hover:border-emerald-500/50 transition-all group">
                            <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                <span class="material-icons" style="font-size:28px">golf_course</span>
                            </div>
                            <h3 class="font-black text-white text-xl uppercase">Caddie Master & Starter</h3>
                            <p class="text-xs text-slate-400 leading-relaxed font-medium">Control de salidas express, asignación de caddies experimentados y seguimiento de tiempos de juego en el campo.</p>
                        </div>

                        <div class="p-8 bg-slate-950 border border-slate-800 rounded-3xl space-y-4 hover:border-amber-500/50 transition-all group">
                            <div class="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                                <span class="material-icons" style="font-size:28px">emoji_events</span>
                            </div>
                            <h3 class="font-black text-white text-xl uppercase">Torneos & Competencias</h3>
                            <p class="text-xs text-slate-400 leading-relaxed font-medium">Organización de torneos semanales, eventos empresariales, competencia Oyeses y leaderboard en tiempo real.</p>
                        </div>

                        <div class="p-8 bg-slate-950 border border-slate-800 rounded-3xl space-y-4 hover:border-blue-500/50 transition-all group">
                            <div class="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                <span class="material-icons" style="font-size:28px">analytics</span>
                            </div>
                            <h3 class="font-black text-white text-xl uppercase">Handicap Hub (USGA WHS)</h3>
                            <p class="text-xs text-slate-400 leading-relaxed font-medium">Consulta tu Handicap Index oficial WHS y tu Handicap de Campo por Tee integrado con SpeiHandicap.</p>
                        </div>

                        <div class="p-8 bg-slate-950 border border-slate-800 rounded-3xl space-y-4 hover:border-purple-500/50 transition-all group">
                            <div class="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                                <span class="material-icons" style="font-size:28px">sports_golf</span>
                            </div>
                            <h3 class="font-black text-white text-xl uppercase">Renta de Carritos & Equipo</h3>
                            <p class="text-xs text-slate-400 leading-relaxed font-medium">Flotilla de carritos de golf bien mantenidos y alquiler de bolsas de palos de alta calidad para invitados.</p>
                        </div>

                        <div class="p-8 bg-slate-950 border border-slate-800 rounded-3xl space-y-4 hover:border-rose-500/50 transition-all group">
                            <div class="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                                <span class="material-icons" style="font-size:28px">groups</span>
                            </div>
                            <h3 class="font-black text-white text-xl uppercase">Padrón & Cuotas de Socios</h3>
                            <p class="text-xs text-slate-400 leading-relaxed font-medium">Gestión transparente de membresías, estado de cuotas al corriente e historial de beneficios exclusivos.</p>
                        </div>

                        <div class="p-8 bg-slate-950 border border-slate-800 rounded-3xl space-y-4 hover:border-emerald-500/50 transition-all group">
                            <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                <span class="material-icons" style="font-size:28px">restaurant</span>
                            </div>
                            <h3 class="font-black text-white text-xl uppercase">Casa Club & Restobar</h3>
                            <p class="text-xs text-slate-400 leading-relaxed font-medium">Espacio de convivencia con servicio de alimentos, bebidas frías y vista panorámica a la llegada del hoyo 18.</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 5. SECCIÓN INFORMACIÓN DE CONTACTO & UBICACIÓN (DATOS REALES) -->
            <section id="contacto" class="py-20 px-4 sm:px-8 max-w-7xl mx-auto space-y-12">
                <div class="text-center space-y-3">
                    <span class="px-4 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-[10px] uppercase tracking-widest rounded-full">Visítanos</span>
                    <h2 class="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">UBICACIÓN & CONTACTO</h2>
                    <p class="text-slate-400 text-sm max-w-2xl mx-auto font-medium">Estamos listos para recibirte en las mejores instalaciones de golf de la región.</p>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    <!-- Contact Cards -->
                    <div class="lg:col-span-5 space-y-4">
                        <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex items-center gap-5">
                            <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                                <span class="material-icons">location_on</span>
                            </div>
                            <div>
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dirección Oficial</p>
                                <p class="text-sm font-black text-white mt-0.5 leading-snug">Autopista Colima Manzanillo Km. 4, Colima, México, CP 28060</p>
                            </div>
                        </div>

                        <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex items-center gap-5">
                            <div class="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                                <span class="material-icons">call</span>
                            </div>
                            <div>
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono de Atención</p>
                                <a href="tel:+13123070233" class="text-sm font-black text-white hover:text-primary transition-colors mt-0.5 block">+1 312-307-0233</a>
                            </div>
                        </div>

                        <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex items-center gap-5">
                            <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                                <span class="material-icons">chat</span>
                            </div>
                            <div>
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp Directo</p>
                                <a href="https://wa.me/5213121942559" target="_blank" class="text-sm font-black text-emerald-400 hover:underline mt-0.5 block">+52 1 312 194 2559</a>
                            </div>
                        </div>

                        <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex items-center gap-5">
                            <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                                <span class="material-icons">email</span>
                            </div>
                            <div>
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Correo Electrónico</p>
                                <a href="mailto:golf.colima@gmail.com" class="text-sm font-black text-white hover:text-amber-400 transition-colors mt-0.5 block">golf.colima@gmail.com</a>
                            </div>
                        </div>
                    </div>

                    <!-- Map / Location Showcase -->
                    <div class="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-4 overflow-hidden relative min-h-[350px] flex flex-col justify-between">
                        <div class="relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15064.912384747285!2d-103.7383125!3d19.2721875!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x84255aa0a66d0001%3A0x8849b294c65db55b!2sClub%20de%20Golf%20de%20Colima!5e0!3m2!1ses!2smx!4v1700000000000!5m2!1ses!2smx"
                                class="w-full h-full border-0 absolute inset-0 filter invert opacity-80 contrast-125"
                                allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                        </div>
                        <div class="pt-4 flex items-center justify-between gap-4">
                            <span class="text-xs font-bold text-slate-400">Autopista Colima Manzanillo Km. 4</span>
                            <a href="https://maps.google.com/?q=Club+de+Golf+de+Colima" target="_blank" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase transition-all">
                                Abrir en Google Maps ➔
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 6. FOOTER -->
            <footer class="border-t border-slate-800/80 bg-slate-950 py-10 px-4 sm:px-8 text-center text-xs text-slate-500 font-bold uppercase tracking-wider">
                <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <img src="./golcolima.jpg" alt="Logo Colima GC" class="h-8 w-auto rounded-lg">
                        <span>© 2026 Club de Golf Colima. Todos los derechos reservados.</span>
                    </div>
                    <div class="flex items-center gap-6">
                        <a href="https://clubdegolfdecolima.com" target="_blank" class="hover:text-primary transition-colors">clubdegolfdecolima.com</a>
                        <a href="#admin" onclick="if (window.renderLogin) window.renderLogin();" class="hover:text-amber-400 transition-colors">Acceso Administrador</a>
                    </div>
                </div>
            </footer>
        </div>
    `;

    // Start background image slideshow
    startHeroSlider();
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
