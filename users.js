// ================================================
// GESTIÓN DE USUARIOS Y PERMISOS MODULE
// Schema: "usuarios".portal_users
// ================================================

export const hashPassword = async (password) => {
    if (!password) return '';
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const MODULE_DEFINITIONS = [
    { key: 'dashboard', label: 'Panel Principal (Dashboard)', icon: 'dashboard', color: 'text-primary' },
    { key: 'tournaments', label: 'Gestión de Torneos', icon: 'emoji_events', color: 'text-emerald-400' },
    { key: 'members', label: 'Socios & Membresías', icon: 'groups', color: 'text-blue-400' },
    { key: 'casaclub', label: 'Recepción & Tee Times', icon: 'point_of_sale', color: 'text-emerald-400' },
    { key: 'caddiemaster', label: 'Caddie Master', icon: 'golf_course', color: 'text-teal-400' },
    { key: 'handicaphub', label: 'Handicaps WHS', icon: 'analytics', color: 'text-amber-400' },
    { key: 'reports', label: 'Reportes & Métricas Operativas', icon: 'insights', color: 'text-emerald-400' },
    { key: 'noticias', label: 'Noticias & Artículos', icon: 'feed', color: 'text-amber-400' },
    { key: 'users', label: 'Gestión de Usuarios (Admin)', icon: 'manage_accounts', color: 'text-purple-400' },
    { key: 'landing', label: 'Sitio Web / Landing', icon: 'language', color: 'text-cyan-400' },
];

export const renderUsersModule = async (container, supabaseClient, showNotification) => {
    const usersDb = supabaseClient.schema('usuarios');

    let users = [];

    const loadUsers = async () => {
        try {
            const { data, error } = await usersDb.from('portal_users').select('*').order('created_at', { ascending: true });
            if (!error && data && data.length > 0) {
                users = data;
                localStorage.setItem('cgc_cached_users', JSON.stringify(users));
            } else {
                throw new Error(error ? error.message : 'No users');
            }
        } catch (err) {
            console.warn('Falling back to local cached users:', err);
            const cached = localStorage.getItem('cgc_cached_users');
            if (cached) {
                users = JSON.parse(cached);
            } else {
                // Default fallback admin user
                users = [{
                    id: 'default-admin-id',
                    username: 'colimagc',
                    password_hash: '8c49f828dbbc919041b9ef2b0eb58afac2f53c5699d60e9ef544f9a4eb501603',
                    full_name: 'Administrador',
                    role: 'admin',
                    allowed_sections: ['dashboard', 'tournaments', 'members', 'casaclub', 'caddiemaster', 'handicaphub', 'reports', 'noticias', 'landing', 'users'],
                    is_active: true
                }];
            }
        }
    };

    await loadUsers();

    const renderUI = () => {
        container.innerHTML = `
            <div class="animate-fade-in space-y-6 max-w-7xl mx-auto">
                <!-- Header -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
                    <div>
                        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest mb-2">
                            <span class="material-icons text-xs">shield</span> Control de Accesos
                        </div>
                        <h2 class="text-3xl font-black tracking-tight text-white uppercase">Gestión de Usuarios</h2>
                        <p class="text-slate-400 text-xs mt-1">Crea usuarios, asigna contraseñas y selecciona los módulos del portal que pueden acceder.</p>
                    </div>
                    <button onclick="window.openUserModal()" class="flex items-center gap-2 px-6 py-3.5 bg-primary text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20">
                        <span class="material-icons">person_add</span> Crear Nuevo Usuario
                    </button>
                </div>

                <!-- User Cards List -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="users-grid">
                    ${users.map(u => {
                        const allowed = Array.isArray(u.allowed_sections) ? u.allowed_sections : [];
                        const isSuperAdmin = u.username === 'colimagc';
                        return `
                            <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 hover:border-purple-500/40 transition-all relative flex flex-col justify-between">
                                <div class="space-y-4">
                                    <div class="flex items-start justify-between">
                                        <div class="flex items-center gap-3">
                                            <div class="w-12 h-12 rounded-2xl ${isSuperAdmin ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-primary/10 text-primary border border-primary/20'} flex items-center justify-center font-black text-lg">
                                                ${u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <div>
                                                <h3 class="text-base font-black text-white leading-tight uppercase">${u.full_name}</h3>
                                                <p class="text-xs font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                                                    <span class="material-icons text-slate-500" style="font-size:14px">account_circle</span> @${u.username}
                                                </p>
                                            </div>
                                        </div>
                                        <span class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-slate-800 text-slate-300'}">
                                            ${u.role || 'operator'}
                                        </span>
                                    </div>

                                    <div class="pt-3 border-t border-slate-800">
                                        <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Módulos Autorizados (${allowed.length}):</p>
                                        <div class="flex flex-wrap gap-1.5">
                                            ${MODULE_DEFINITIONS.map(m => {
                                                const hasAcc = allowed.includes(m.key);
                                                if (!hasAcc) return '';
                                                return `
                                                    <span class="px-2 py-1 bg-slate-800/80 border border-slate-700/60 rounded-lg text-[9px] font-bold text-slate-300 flex items-center gap-1">
                                                        <span class="material-icons ${m.color}" style="font-size:11px">${m.icon}</span> ${m.label.split(' ')[0]}
                                                    </span>`;
                                            }).join('')}
                                        </div>
                                    </div>
                                </div>

                                <div class="pt-4 border-t border-slate-800 flex items-center justify-between mt-4">
                                    <span class="inline-flex items-center gap-1.5 text-[10px] font-bold ${u.is_active !== false ? 'text-emerald-400' : 'text-red-400'}">
                                        <span class="w-2 h-2 rounded-full ${u.is_active !== false ? 'bg-emerald-400' : 'bg-red-400'}"></span>
                                        ${u.is_active !== false ? 'Activo' : 'Inactivo'}
                                    </span>
                                    <div class="flex items-center gap-2">
                                        <button onclick="window.editUserModal('${u.id}')" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors">
                                            <span class="material-icons text-sm">edit</span> Editar
                                        </button>
                                        ${!isSuperAdmin ? `
                                            <button onclick="window.deleteUserConfirm('${u.id}', '${u.username}')" class="p-1.5 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-xl transition-colors" title="Eliminar Usuario">
                                                <span class="material-icons text-sm">delete</span>
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>`;
                    }).join('')}
                </div>
            </div>

            <!-- Modal Form for Create / Edit User -->
            <div id="user-modal-overlay" class="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 hidden items-center justify-center p-4">
                <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in overflow-y-auto max-h-[90vh]">
                    <div class="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                                <span class="material-icons">manage_accounts</span>
                            </div>
                            <div>
                                <h3 id="modal-title" class="text-xl font-black text-white uppercase">Crear Usuario</h3>
                                <p class="text-xs text-slate-400">Configura el acceso al portal para este usuario.</p>
                            </div>
                        </div>
                        <button onclick="window.closeUserModal()" class="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800">
                            <span class="material-icons">close</span>
                        </button>
                    </div>

                    <form id="user-form" class="space-y-5" onsubmit="event.preventDefault(); window.saveUserSubmit();">
                        <input type="hidden" id="user-id-field" value="">

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="space-y-1.5">
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre de Usuario *</label>
                                <input type="text" id="user-username" required class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:border-primary focus:outline-none" placeholder="ej. juanperez">
                            </div>
                            <div class="space-y-1.5">
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre Completo *</label>
                                <input type="text" id="user-fullname" required class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:border-primary focus:outline-none" placeholder="ej. Juan Pérez">
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="space-y-1.5">
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Contraseña *</label>
                                <div class="relative">
                                    <input type="password" id="user-password" class="w-full pl-4 pr-10 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:border-primary focus:outline-none" placeholder="••••••••">
                                    <button type="button" onclick="window.togglePasswordVisibility()" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                                        <span class="material-icons text-sm" id="pwd-icon">visibility</span>
                                    </button>
                                </div>
                                <p class="text-[9px] text-slate-500" id="pwd-hint">Deja en blanco en edición si no deseas cambiarla.</p>
                            </div>
                            <div class="space-y-1.5">
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol del Puesto</label>
                                <select id="user-role" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:border-primary focus:outline-none">
                                    <option value="operator">Operador / Staff</option>
                                    <option value="caddie">Caddie Master</option>
                                    <option value="recepcion">Recepción & Pagos</option>
                                    <option value="admin">Administrador Total</option>
                                </select>
                            </div>
                        </div>

                        <!-- Permissions Section Checkboxes -->
                        <div class="space-y-3 pt-3 border-t border-slate-800">
                            <div class="flex items-center justify-between">
                                <label class="block text-[11px] font-black text-primary uppercase tracking-widest">Seleccionar Secciones Permitidas *</label>
                                <button type="button" onclick="window.toggleAllPermissions(true)" class="text-[10px] text-slate-400 hover:text-white underline font-bold">Seleccionar Todas</button>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                ${MODULE_DEFINITIONS.map(m => `
                                    <label class="flex items-center gap-3 p-3 bg-slate-800/60 border border-slate-700/70 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
                                        <input type="checkbox" name="user-perm" value="${m.key}" class="w-4 h-4 rounded text-primary focus:ring-primary bg-slate-900 border-slate-700">
                                        <span class="material-icons text-sm ${m.color}">${m.icon}</span>
                                        <span class="text-xs font-bold text-slate-200">${m.label}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>

                        <div class="pt-4 border-t border-slate-800 flex gap-3">
                            <button type="button" onclick="window.closeUserModal()" class="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider">
                                Cancelar
                            </button>
                            <button type="submit" class="flex-1 py-3.5 bg-primary text-slate-900 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all">
                                Guardar Usuario
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    };

    renderUI();

    // Global Action Handlers for Modal
    window.openUserModal = () => {
        document.getElementById('user-id-field').value = '';
        document.getElementById('user-username').value = '';
        document.getElementById('user-username').disabled = false;
        document.getElementById('user-fullname').value = '';
        document.getElementById('user-password').value = '';
        document.getElementById('user-password').required = true;
        document.getElementById('user-role').value = 'operator';
        document.getElementById('modal-title').textContent = 'Crear Usuario';
        document.getElementById('pwd-hint').textContent = 'Ingresa la contraseña para el nuevo usuario.';

        // Check default permissions (dashboard + tournaments)
        document.querySelectorAll('input[name="user-perm"]').forEach(cb => {
            cb.checked = ['dashboard', 'tournaments'].includes(cb.value);
        });

        const overlay = document.getElementById('user-modal-overlay');
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
    };

    window.closeUserModal = () => {
        const overlay = document.getElementById('user-modal-overlay');
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
    };

    window.togglePasswordVisibility = () => {
        const input = document.getElementById('user-password');
        const icon = document.getElementById('pwd-icon');
        if (input.type === 'password') {
            input.type = 'text';
            icon.textContent = 'visibility_off';
        } else {
            input.type = 'password';
            icon.textContent = 'visibility';
        }
    };

    window.toggleAllPermissions = (select) => {
        document.querySelectorAll('input[name="user-perm"]').forEach(cb => cb.checked = select);
    };

    window.editUserModal = (id) => {
        const u = users.find(x => x.id === id || x.username === id);
        if (!u) return;

        document.getElementById('user-id-field').value = u.id || u.username;
        document.getElementById('user-username').value = u.username;
        document.getElementById('user-username').disabled = u.username === 'colimagc';
        document.getElementById('user-fullname').value = u.full_name;
        document.getElementById('user-password').value = '';
        document.getElementById('user-password').required = false;
        document.getElementById('user-role').value = u.role || 'operator';
        document.getElementById('modal-title').textContent = 'Editar Usuario';
        document.getElementById('pwd-hint').textContent = 'Deja en blanco para conservar la contraseña actual.';

        const allowed = Array.isArray(u.allowed_sections) ? u.allowed_sections : [];
        document.querySelectorAll('input[name="user-perm"]').forEach(cb => {
            cb.checked = allowed.includes(cb.value);
        });

        const overlay = document.getElementById('user-modal-overlay');
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
    };

    window.saveUserSubmit = async () => {
        const id = document.getElementById('user-id-field').value;
        const username = document.getElementById('user-username').value.trim().toLowerCase();
        const full_name = document.getElementById('user-fullname').value.trim();
        const password = document.getElementById('user-password').value;
        const role = document.getElementById('user-role').value;

        const allowed_sections = Array.from(document.querySelectorAll('input[name="user-perm"]:checked')).map(cb => cb.value);

        if (!username || !full_name) {
            showNotification('Campos requeridos', 'Por favor llena el nombre de usuario y el nombre completo.', 'error');
            return;
        }

        if (allowed_sections.length === 0) {
            showNotification('Permisos requeridos', 'Debes seleccionar al menos una sección permitida para el usuario.', 'error');
            return;
        }

        const isEdit = !!id;

        let password_hash = null;
        if (password) {
            password_hash = await hashPassword(password);
        }

        const payload = {
            username,
            full_name,
            role,
            allowed_sections,
            is_active: true
        };

        if (password_hash) {
            payload.password_hash = password_hash;
        }

        try {
            if (isEdit) {
                const existing = users.find(x => x.id === id || x.username === id);
                if (existing && !password_hash) {
                    payload.password_hash = existing.password_hash;
                }
                const { error } = await usersDb.from('portal_users').update(payload).eq('username', username);
                if (error) throw error;
            } else {
                if (!password_hash) {
                    showNotification('Contraseña requerida', 'Debes ingresar una contraseña para el nuevo usuario.', 'error');
                    return;
                }
                payload.password_hash = password_hash;
                const { error } = await usersDb.from('portal_users').insert([payload]);
                if (error) throw error;
            }

            window.closeUserModal();
            showNotification('¡Usuario Guardado!', `El usuario ${username} se ha ${isEdit ? 'actualizado' : 'creado'} correctamente.`, 'success');
            await loadUsers();
            renderUI();
        } catch (err) {
            console.error('Error saving user to Supabase:', err);
            // Local fallback save
            if (isEdit) {
                const idx = users.findIndex(x => x.id === id || x.username === username);
                if (idx !== -1) {
                    users[idx] = { ...users[idx], ...payload };
                }
            } else {
                users.push({ id: `local-${Date.now()}`, ...payload });
            }
            localStorage.setItem('cgc_cached_users', JSON.stringify(users));
            window.closeUserModal();
            showNotification('¡Guardado Local!', `El usuario ${username} se guardó localmente.`, 'success');
            renderUI();
        }
    };

    window.deleteUserConfirm = (id, username) => {
        if (username === 'colimagc') {
            showNotification('Acción no permitida', 'No puedes eliminar el usuario administrador principal.', 'error');
            return;
        }
        showNotification('Eliminar Usuario', `¿Estás seguro de que deseas eliminar al usuario "${username}"?`, 'confirm', async () => {
            try {
                await usersDb.from('portal_users').delete().eq('username', username);
            } catch (e) {
                console.warn(e);
            }
            users = users.filter(x => x.username !== username && x.id !== id);
            localStorage.setItem('cgc_cached_users', JSON.stringify(users));
            renderUI();
            showNotification('Eliminado', `El usuario ${username} ha sido eliminado.`, 'success');
        });
    };
};
