-- ============================================================================
-- AGREGAR COLUMNA "authorized_by" EN EL ESQUEMA "colimaGC"
-- Ejecutar en Supabase -> SQL Editor
-- ============================================================================

-- 1. Tabla principal de tee_times (Recepción y Casa Club)
ALTER TABLE "colimaGC".tee_times 
ADD COLUMN IF NOT EXISTS authorized_by TEXT;

-- 2. Tabla reservas_tee_time (por compatibilidad con reservas previas)
ALTER TABLE "colimaGC".reservas_tee_time 
ADD COLUMN IF NOT EXISTS authorized_by TEXT;

-- Comentario explicativo
COMMENT ON COLUMN "colimaGC".tee_times.authorized_by IS 'Nombre de la persona, directivo o presidente que autoriza la cortesía de la salida';
