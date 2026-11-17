-- ================================================
-- SCHEMA: usuarios
-- Tabla de usuarios del portal Colima GC
-- ================================================

CREATE SCHEMA IF NOT EXISTS "usuarios";

-- Crear tabla de usuarios del portal
CREATE TABLE IF NOT EXISTS "usuarios".portal_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator',
    allowed_sections JSONB NOT NULL DEFAULT '["tournaments"]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permisos
GRANT USAGE ON SCHEMA "usuarios" TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA "usuarios" TO anon, authenticated, service_role;

-- RLS
ALTER TABLE "usuarios".portal_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anon on portal_users" ON "usuarios".portal_users;
CREATE POLICY "Allow all for anon on portal_users" ON "usuarios".portal_users
    FOR ALL USING (true) WITH CHECK (true);

-- ================================================
-- Usuario admin por defecto
-- usuario: colimagc | contraseña: colimagc2026
-- (hash SHA-256 de 'colimagc2026')
-- ================================================
INSERT INTO "usuarios".portal_users (username, password_hash, full_name, role, allowed_sections)
VALUES (
    'colimagc',
    '8c49f828dbbc919041b9ef2b0eb58afac2f53c5699d60e9ef544f9a4eb501603',
    'Administrador',
    'admin',
    '["dashboard","tournaments","members","caddiemaster","handicaphub","landing","users"]'::jsonb
)
ON CONFLICT (username) DO NOTHING;
