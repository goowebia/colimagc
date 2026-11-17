-- ============================================================================
-- MIGRACIÓN DE TABLAS "members" Y "member_payments" AL ESQUEMA "colimaGC"
-- Ejecutar en Supabase -> SQL Editor
-- ============================================================================

-- 1. Asegurar que el esquema "colimaGC" exista
CREATE SCHEMA IF NOT EXISTS "colimaGC";

-- 2. Migrar la tabla members:
-- Si no existe en "colimaGC", moverla directamente desde "members" conservando todos los datos
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'members' AND table_name = 'members') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'colimaGC' AND table_name = 'members') THEN
            ALTER TABLE "members".members SET SCHEMA "colimaGC";
            RAISE NOTICE 'Tabla members movida exitosamente a esquema colimaGC.';
        ELSE
            INSERT INTO "colimaGC".members (id, member_number, name, email, phone, category, status, payment_frequency, paid_until, current_handicap, notes, created_at)
            SELECT id, member_number, name, email, phone, category, status, payment_frequency, paid_until, current_handicap, notes, created_at
            FROM "members".members
            ON CONFLICT (id) DO NOTHING;
            RAISE NOTICE 'Registros de members copiados a colimaGC.members.';
        END IF;
    END IF;
END $$;

-- 3. Migrar la tabla member_payments:
-- Si no existe en "colimaGC", moverla directamente desde "members" conservando todos los datos
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'members' AND table_name = 'member_payments') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'colimaGC' AND table_name = 'member_payments') THEN
            ALTER TABLE "members".member_payments SET SCHEMA "colimaGC";
            RAISE NOTICE 'Tabla member_payments movida exitosamente a esquema colimaGC.';
        ELSE
            INSERT INTO "colimaGC".member_payments (id, member_id, amount, period_type, months_added, paid_until_new, notes, created_at)
            SELECT id, member_id, amount, period_type, months_added, paid_until_new, notes, created_at
            FROM "members".member_payments
            ON CONFLICT (id) DO NOTHING;
            RAISE NOTICE 'Registros de member_payments copiados a colimaGC.member_payments.';
        END IF;
    END IF;
END $$;

-- 4. Si las tablas no existían en ninguno de los esquemas, crearlas desde cero
CREATE TABLE IF NOT EXISTS "colimaGC".members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    category TEXT DEFAULT 'SOCIO HONORARIO',
    status TEXT DEFAULT 'ACTIVE',
    payment_frequency TEXT DEFAULT 'MENSUAL',
    paid_until DATE NOT NULL DEFAULT CURRENT_DATE,
    current_handicap NUMERIC(4,1) DEFAULT 0.0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "colimaGC".member_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES "colimaGC".members(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    period_type TEXT DEFAULT 'MENSUAL',
    months_added INTEGER DEFAULT 1,
    paid_until_new DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Otorgar permisos completos para la API de Supabase (anon, authenticated, service_role)
GRANT USAGE ON SCHEMA "colimaGC" TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA "colimaGC" TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA "colimaGC" TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL ROUTINES IN SCHEMA "colimaGC" TO anon, authenticated, service_role, postgres;

ALTER DEFAULT PRIVILEGES IN SCHEMA "colimaGC" GRANT ALL ON TABLES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA "colimaGC" GRANT ALL ON SEQUENCES TO anon, authenticated, service_role, postgres;

-- 6. Habilitar y configurar Row Level Security (RLS)
ALTER TABLE "colimaGC".members ENABLE ROW LEVEL SECURITY;
ALTER TABLE "colimaGC".member_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anon on members" ON "colimaGC".members;
CREATE POLICY "Allow all for anon on members" ON "colimaGC".members
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated on members" ON "colimaGC".members;
CREATE POLICY "Allow all for authenticated on members" ON "colimaGC".members
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon on member_payments" ON "colimaGC".member_payments;
CREATE POLICY "Allow all for anon on member_payments" ON "colimaGC".member_payments
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated on member_payments" ON "colimaGC".member_payments;
CREATE POLICY "Allow all for authenticated on member_payments" ON "colimaGC".member_payments
    FOR ALL USING (true) WITH CHECK (true);
