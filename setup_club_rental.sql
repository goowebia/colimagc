-- ============================================================================
-- SOPORTE PARA RENTA DE EQUIPO DE GOLF (PALOS) EN EL ESQUEMA "colimaGC"
-- Ejecutar en Supabase -> SQL Editor
-- ============================================================================

-- 1. Tabla principal de tee_times (Recepción y Caddie Master)
ALTER TABLE "colimaGC".tee_times 
ADD COLUMN IF NOT EXISTS club_rental_total NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_club_rentals INTEGER DEFAULT 0;

-- 2. Tabla reservas_tee_time (compatibilidad con reservas previas)
ALTER TABLE "colimaGC".reservas_tee_time 
ADD COLUMN IF NOT EXISTS club_rental_total NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_club_rentals INTEGER DEFAULT 0;

-- 3. Tabla driving_range_sessions (Tee de Práctica / Driving Range)
ALTER TABLE "colimaGC".driving_range_sessions
ADD COLUMN IF NOT EXISTS has_club_rental BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS club_rental_fee NUMERIC(10,2) DEFAULT 0;

-- Comentarios explicativos en base de datos
COMMENT ON COLUMN "colimaGC".tee_times.club_rental_total IS 'Importe total cobrado por renta de equipo de golf (palos) en esta salida';
COMMENT ON COLUMN "colimaGC".tee_times.total_club_rentals IS 'Cantidad de jugadores con renta de palos en esta salida';
