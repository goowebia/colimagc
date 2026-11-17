-- ============================================================================
-- TABLA PARA TARJETAS DE 9 HOYOS PENDIENTES CON VIGENCIA DE 6 DÍAS
-- Esquema: "colimaGC"
-- ============================================================================

CREATE TABLE IF NOT EXISTS "colimaGC".pending_nine_holes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES "colimaGC".members(id) ON DELETE SET NULL,
    member_number TEXT,
    member_name TEXT NOT NULL,
    player_type TEXT DEFAULT 'MEMBER',
    tee_time_id TEXT,
    folio TEXT,
    round_type TEXT NOT NULL CHECK (round_type IN ('FRONT_9', 'BACK_9')),
    starting_hole INTEGER DEFAULT 1,
    played_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expires_at DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '6 days'),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'EXPIRED', 'CANCELLED')),
    hole_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    partial_gross INTEGER NOT NULL DEFAULT 0,
    caddie_name TEXT,
    completed_at TIMESTAMPTZ,
    completed_by TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Si la tabla ya fue creada previamente, actualizar el valor por defecto a 6 días:
ALTER TABLE "colimaGC".pending_nine_holes 
  ALTER COLUMN expires_at SET DEFAULT (CURRENT_DATE + INTERVAL '6 days');

-- Ajustar registros pendientes existentes a 6 días de vigencia:
UPDATE "colimaGC".pending_nine_holes 
  SET expires_at = played_date + INTERVAL '6 days'
  WHERE status = 'PENDING';

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_pending_nine_status_exp ON "colimaGC".pending_nine_holes (status, expires_at);
CREATE INDEX IF NOT EXISTS idx_pending_nine_member ON "colimaGC".pending_nine_holes (member_id);
CREATE INDEX IF NOT EXISTS idx_pending_nine_name ON "colimaGC".pending_nine_holes (member_name);

-- Seguridad RLS
ALTER TABLE "colimaGC".pending_nine_holes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pending_nine_holes' 
        AND policyname = 'Permitir todo en pending_nine_holes'
    ) THEN
        CREATE POLICY "Permitir todo en pending_nine_holes" 
        ON "colimaGC".pending_nine_holes 
        FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

COMMENT ON TABLE "colimaGC".pending_nine_holes IS 'Tarjetas de 9 hoyos pendientes con vigencia de 6 días naturales';
