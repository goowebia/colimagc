-- ============================================================================
-- TABLAS DE CADDIE MASTER Y SCORECARDS EN ESQUEMA "colimaGC"
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS "colimaGC";

-- 1. Tabla de Salidas Diarias a Campo (Bitácora Caddie Master)
CREATE TABLE IF NOT EXISTS "colimaGC".daily_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tee_time_id UUID REFERENCES "colimaGC".tee_times(id) ON DELETE SET NULL,
    folio TEXT,
    member_id UUID REFERENCES "colimaGC".members(id) ON DELETE SET NULL,
    member_number TEXT,
    member_name TEXT NOT NULL,
    player_type TEXT DEFAULT 'MEMBER', -- MEMBER, GUEST, CONVENIO
    starting_hole INTEGER DEFAULT 1,
    guests_count INTEGER DEFAULT 0,
    caddie_name TEXT,
    cart_number TEXT,
    output_time TIMESTAMPTZ DEFAULT NOW(),
    score_status TEXT DEFAULT 'PENDING', -- PENDING, CAPTURED, NO_CARD
    gross_score INTEGER DEFAULT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Scores / Handicaps WHS
CREATE TABLE IF NOT EXISTS "colimaGC".member_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES "colimaGC".members(id) ON DELETE CASCADE,
    output_id UUID REFERENCES "colimaGC".daily_outputs(id) ON DELETE SET NULL,
    date_played DATE NOT NULL DEFAULT CURRENT_DATE,
    gross_score INTEGER NOT NULL DEFAULT 78,
    course_rating NUMERIC(4,1) DEFAULT 70.0,
    slope_rating INTEGER DEFAULT 113,
    differential NUMERIC(4,1) DEFAULT 8.0,
    hole_scores JSONB,
    delivered BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permisos
GRANT USAGE ON SCHEMA "colimaGC" TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA "colimaGC" TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA "colimaGC" TO anon, authenticated, service_role, postgres;

-- RLS
ALTER TABLE "colimaGC".daily_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE "colimaGC".member_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anon on daily_outputs" ON "colimaGC".daily_outputs;
CREATE POLICY "Allow all for anon on daily_outputs" ON "colimaGC".daily_outputs
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated on daily_outputs" ON "colimaGC".daily_outputs;
CREATE POLICY "Allow all for authenticated on daily_outputs" ON "colimaGC".daily_outputs
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon on member_scores" ON "colimaGC".member_scores;
CREATE POLICY "Allow all for anon on member_scores" ON "colimaGC".member_scores
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated on member_scores" ON "colimaGC".member_scores;
CREATE POLICY "Allow all for authenticated on member_scores" ON "colimaGC".member_scores
    FOR ALL USING (true) WITH CHECK (true);

