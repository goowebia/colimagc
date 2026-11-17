-- =========================================================================
-- ESQUEMA colimaGC: TABLA DE NOTICIAS Y ARTÍCULOS
-- Ejecutar en Supabase Dashboard -> SQL Editor (Proyecto Colima GC)
-- =========================================================================

-- 1. Crear la tabla de noticias dentro del esquema colimaGC
CREATE TABLE IF NOT EXISTS "colimaGC".noticias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    titulo TEXT NOT NULL,
    subtitulo TEXT DEFAULT '',
    contenido TEXT NOT NULL,
    imagen_url TEXT DEFAULT '',
    galeria JSONB DEFAULT '[]'::jsonb,
    fecha_publicacion DATE NOT NULL DEFAULT CURRENT_DATE,
    activo BOOLEAN NOT NULL DEFAULT true,
    autor TEXT DEFAULT 'Administrador'
);

-- Si la tabla ya existía, asegurarse de tener la columna galeria
ALTER TABLE "colimaGC".noticias ADD COLUMN IF NOT EXISTS galeria JSONB DEFAULT '[]'::jsonb;

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE "colimaGC".noticias ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de acceso (lectura pública y gestión desde el portal)
DROP POLICY IF EXISTS "Permitir lectura publica de noticias" ON "colimaGC".noticias;
CREATE POLICY "Permitir lectura publica de noticias"
    ON "colimaGC".noticias
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Permitir insertar noticias" ON "colimaGC".noticias;
CREATE POLICY "Permitir insertar noticias"
    ON "colimaGC".noticias
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualizar noticias" ON "colimaGC".noticias;
CREATE POLICY "Permitir actualizar noticias"
    ON "colimaGC".noticias
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir eliminar noticias" ON "colimaGC".noticias;
CREATE POLICY "Permitir eliminar noticias"
    ON "colimaGC".noticias
    FOR DELETE
    USING (true);

-- Permisos de roles Supabase
GRANT USAGE ON SCHEMA "colimaGC" TO anon, authenticated, service_role;
GRANT ALL ON TABLE "colimaGC".noticias TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA "colimaGC" GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- 4. Noticia inicial de bienvenida / prueba
INSERT INTO "colimaGC".noticias (titulo, subtitulo, contenido, imagen_url, galeria, fecha_publicacion, activo, autor)
VALUES (
    '¡Bienvenidos a la nueva sección de Noticias del Club de Golf Colima!',
    'Comunicación Oficial',
    'Nos complace presentar nuestro nuevo espacio de noticias y artículos oficiales. Aquí encontrarás las crónicas de los torneos, avisos para socios, eventos especiales y las mejores notas del mundo del golf en Colima.',
    './imagenes/feria.jpeg',
    '["./imagenes/feria.jpeg"]'::jsonb,
    CURRENT_DATE,
    true,
    'Club de Golf Colima'
)
ON CONFLICT DO NOTHING;
