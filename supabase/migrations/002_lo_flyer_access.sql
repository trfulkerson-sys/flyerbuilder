-- Migration: Add LO flyer creation support
-- LOs can create flyers on behalf of their realtors

-- Track which LO created a flyer (null = realtor created it themselves)
ALTER TABLE flyers ADD COLUMN created_by_lo_id UUID REFERENCES loan_officers(id);

-- Index for LO lookups
CREATE INDEX idx_flyers_created_by_lo ON flyers(created_by_lo_id);

-- ============================================
-- RLS: LOs can CRUD flyers for their realtors
-- ============================================

CREATE POLICY "LOs can view flyers of their realtors" ON flyers
  FOR SELECT USING (
    realtor_id IN (
      SELECT r.id FROM realtors r
      JOIN loan_officers lo ON r.loan_officer_id = lo.id
      WHERE lo.email = auth.email()
    )
  );

CREATE POLICY "LOs can insert flyers for their realtors" ON flyers
  FOR INSERT WITH CHECK (
    realtor_id IN (
      SELECT r.id FROM realtors r
      JOIN loan_officers lo ON r.loan_officer_id = lo.id
      WHERE lo.email = auth.email()
    )
  );

CREATE POLICY "LOs can update flyers of their realtors" ON flyers
  FOR UPDATE USING (
    realtor_id IN (
      SELECT r.id FROM realtors r
      JOIN loan_officers lo ON r.loan_officer_id = lo.id
      WHERE lo.email = auth.email()
    )
  );

CREATE POLICY "LOs can delete flyers of their realtors" ON flyers
  FOR DELETE USING (
    realtor_id IN (
      SELECT r.id FROM realtors r
      JOIN loan_officers lo ON r.loan_officer_id = lo.id
      WHERE lo.email = auth.email()
    )
  );

-- LOs can also manage their realtors (update for onboarding, etc.)
CREATE POLICY "LOs can update their realtors" ON realtors
  FOR UPDATE USING (
    loan_officer_id IN (
      SELECT id FROM loan_officers WHERE email = auth.email()
    )
  );

CREATE POLICY "LOs can insert realtors" ON realtors
  FOR INSERT WITH CHECK (
    loan_officer_id IN (
      SELECT id FROM loan_officers WHERE email = auth.email()
    )
  );
