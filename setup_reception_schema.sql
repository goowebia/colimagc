-- ============================================================================
-- MIGRACIÓN DE TABLA "tee_times" AL ESQUEMA "colimaGC" (CASA CLUB / RECEPCIÓN)
-- Ejecutar en Supabase -> SQL Editor
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS "colimaGC";

CREATE TABLE IF NOT EXISTS "colimaGC".tee_times (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio TEXT UNIQUE NOT NULL,
    booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
    booking_time TEXT NOT NULL DEFAULT '08:00',
    contact_name TEXT NOT NULL,
    contact_phone TEXT,
    group_type TEXT DEFAULT 'FOURSOME', -- INDIVIDUAL, PAREJA, FOURSOME, GRUPO
    players JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_players INTEGER NOT NULL DEFAULT 1,
    total_holes INTEGER NOT NULL DEFAULT 18,
    total_carts INTEGER NOT NULL DEFAULT 0,
    green_fee_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    cart_fee_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    payment_method TEXT DEFAULT 'EFECTIVO', -- EFECTIVO, TARJETA, TRANSFERENCIA, CARGO_SOCIO, CORTESIA
    status TEXT NOT NULL DEFAULT 'RESERVED', -- RESERVED, PAID, ON_COURSE, COMPLETED, CANCELLED, BLOCKED
    starting_hole INTEGER NOT NULL DEFAULT 1,
    caddie_assigned TEXT,
    cart_numbers TEXT,
    notes TEXT,
    paid_at TIMESTAMPTZ,
    departure_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permisos y Políticas RLS
GRANT USAGE ON SCHEMA "colimaGC" TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA "colimaGC" TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA "colimaGC" TO anon, authenticated, service_role, postgres;

ALTER TABLE "colimaGC".tee_times ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anon on tee_times" ON "colimaGC".tee_times;
CREATE POLICY "Allow all for anon on tee_times" ON "colimaGC".tee_times
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated on tee_times" ON "colimaGC".tee_times;
CREATE POLICY "Allow all for authenticated on tee_times" ON "colimaGC".tee_times
    FOR ALL USING (true) WITH CHECK (true);
