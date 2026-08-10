-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS "colimaGC";

-- Create members table
CREATE TABLE IF NOT EXISTS "colimaGC".members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    category TEXT DEFAULT 'SOCIO TITULAR',
    status TEXT DEFAULT 'ACTIVE',
    payment_frequency TEXT DEFAULT 'MENSUAL',
    paid_until DATE NOT NULL DEFAULT CURRENT_DATE,
    current_handicap NUMERIC(4,1) DEFAULT 0.0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create member_payments table
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

-- Grant privileges and configure RLS
GRANT USAGE ON SCHEMA "colimaGC" TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA "colimaGC" TO anon, authenticated, service_role;

ALTER TABLE "colimaGC".members ENABLE ROW LEVEL SECURITY;
ALTER TABLE "colimaGC".member_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anon on members" ON "colimaGC".members;
CREATE POLICY "Allow all for anon on members" ON "colimaGC".members
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon on member_payments" ON "colimaGC".member_payments;
CREATE POLICY "Allow all for anon on member_payments" ON "colimaGC".member_payments
    FOR ALL USING (true) WITH CHECK (true);
