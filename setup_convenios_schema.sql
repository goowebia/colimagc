-- ============================================================================
-- TABLA DE CONVENIOS INTERCLUBES EN SUPABASE (ESQUEMA colimaGC)
-- Ejecutar en Supabase Dashboard -> SQL Editor
-- ============================================================================

CREATE TABLE IF NOT EXISTS "colimaGC".convenios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    green_fee_18 NUMERIC(10,2) NOT NULL DEFAULT 800.00,
    green_fee_9 NUMERIC(10,2) NOT NULL DEFAULT 500.00,
    cart_fee_18 NUMERIC(10,2) NOT NULL DEFAULT 500.00,
    cart_fee_9 NUMERIC(10,2) NOT NULL DEFAULT 300.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permisos completos para roles de Supabase
GRANT ALL ON TABLE "colimaGC".convenios TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA "colimaGC" TO anon, authenticated, service_role, postgres;

-- Row Level Security (RLS)
ALTER TABLE "colimaGC".convenios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anon on convenios" ON "colimaGC".convenios;
CREATE POLICY "Allow all for anon on convenios" ON "colimaGC".convenios
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated on convenios" ON "colimaGC".convenios;
CREATE POLICY "Allow all for authenticated on convenios" ON "colimaGC".convenios
    FOR ALL USING (true) WITH CHECK (true);

-- Insertar convenio de ejemplo si no existe
INSERT INTO "colimaGC".convenios (name, green_fee_18, green_fee_9, cart_fee_18, cart_fee_9)
VALUES ('Manzanillo Golf', 800.00, 500.00, 500.00, 300.00)
ON CONFLICT (name) DO NOTHING;
