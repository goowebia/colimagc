-- Add tee and course columns to member_scores table
ALTER TABLE "starter".member_scores
ADD COLUMN IF NOT EXISTS course_name TEXT DEFAULT 'CLUB DE GOLF COLIMA',
ADD COLUMN IF NOT EXISTS tee_color TEXT DEFAULT 'BLANCO',
ADD COLUMN IF NOT EXISTS is_used_in_handicap BOOLEAN DEFAULT false;
