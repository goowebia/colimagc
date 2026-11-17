-- ============================================================================
-- ACTUALIZACIÓN DE CATEGORÍAS DE SOCIOS EN SUPABASE
-- Ejecutar en: Supabase Dashboard -> SQL Editor
-- ============================================================================

-- 1. Actualizar socios existentes a las nuevas categorías oficiales:
--    - SOCIO TITULAR pasa a SOCIO HONORARIO (Accionistas)
--    - SOCIO DAMA y SOCIO JUVENIL pasan a MEMBRESÍA ANUAL
UPDATE "colimaGC".members
SET category = 'SOCIO HONORARIO'
WHERE category IN ('SOCIO TITULAR', 'TITULAR') OR category IS NULL;

UPDATE "colimaGC".members
SET category = 'MEMBRESÍA ANUAL'
WHERE category IN ('SOCIO DAMA', 'SOCIO JUVENIL');

-- 2. Asegurar el valor por defecto para nuevos socios en la base de datos
ALTER TABLE "colimaGC".members 
ALTER COLUMN category SET DEFAULT 'SOCIO HONORARIO';

-- 3. (Opcional) Verificar cómo quedaron distribuidos los socios
SELECT category, COUNT(*) as total_socios
FROM "colimaGC".members
GROUP BY category
ORDER BY total_socios DESC;
