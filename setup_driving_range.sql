-- ============================================================================
-- CONTROL DE TEE DE PRÁCTICA Y CUBETAS DE PELOTAS (DRIVING RANGE)
-- Esquema: "colimaGC"
-- ============================================================================

CREATE TABLE IF NOT EXISTS "colimaGC".driving_range_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio TEXT NOT NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Datos del cliente
    customer_name TEXT NOT NULL,
    is_member BOOLEAN DEFAULT false,
    member_id UUID,
    
    -- Conceptos cobrados
    has_tee_practice BOOLEAN DEFAULT true,
    tee_practice_fee NUMERIC(10,2) DEFAULT 0,
    buckets_count INTEGER NOT NULL DEFAULT 1,
    bucket_unit_price NUMERIC(10,2) DEFAULT 0,
    total_buckets_fee NUMERIC(10,2) DEFAULT 0,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    
    -- Pago
    payment_method TEXT NOT NULL DEFAULT 'EFECTIVO',
    transaction_ref TEXT,
    authorized_by TEXT,
    status TEXT NOT NULL DEFAULT 'PAID',
    
    -- Entrega en Caddie Master
    balls_delivered BOOLEAN DEFAULT false,
    delivered_at TIMESTAMPTZ,
    delivered_by TEXT,
    
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_driving_range_date 
ON "colimaGC".driving_range_sessions (session_date);

CREATE INDEX IF NOT EXISTS idx_driving_range_delivered 
ON "colimaGC".driving_range_sessions (balls_delivered);

ALTER TABLE "colimaGC".driving_range_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo en driving_range_sessions" 
ON "colimaGC".driving_range_sessions 
FOR ALL USING (true) WITH CHECK (true);
