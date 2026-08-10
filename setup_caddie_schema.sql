-- Create daily_outputs table in members schema
CREATE TABLE IF NOT EXISTS "members".daily_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES "members".members(id) ON DELETE CASCADE,
    member_number TEXT NOT NULL,
    member_name TEXT NOT NULL,
    starting_hole INTEGER DEFAULT 1,
    guests_count INTEGER DEFAULT 0,
    output_time TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT USAGE ON SCHEMA "members" TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA "members" TO anon, authenticated, service_role;

ALTER TABLE "members".daily_outputs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anon on daily_outputs" ON "members".daily_outputs;
CREATE POLICY "Allow all for anon on daily_outputs" ON "members".daily_outputs
    FOR ALL USING (true) WITH CHECK (true);
