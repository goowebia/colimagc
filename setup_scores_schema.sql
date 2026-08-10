-- Add score columns to daily_outputs if not exist
ALTER TABLE "starter".daily_outputs 
ADD COLUMN IF NOT EXISTS score_status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS gross_score INTEGER DEFAULT NULL;

-- Create member_scores table in starter schema
CREATE TABLE IF NOT EXISTS "starter".member_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES "members".members(id) ON DELETE CASCADE,
    output_id UUID REFERENCES "starter".daily_outputs(id) ON DELETE SET NULL,
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

GRANT USAGE ON SCHEMA "starter" TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA "starter" TO anon, authenticated, service_role;

ALTER TABLE "starter".member_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anon on member_scores" ON "starter".member_scores;
CREATE POLICY "Allow all for anon on member_scores" ON "starter".member_scores
    FOR ALL USING (true) WITH CHECK (true);
