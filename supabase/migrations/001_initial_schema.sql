-- Flyer Builder Initial Schema
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- LOAN OFFICERS TABLE
-- LOs are added manually, they don't sign up
-- ============================================
CREATE TABLE loan_officers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  nmls_number TEXT NOT NULL,
  headshot_url TEXT,
  qr_code_url TEXT,
  calculator_url TEXT,
  website_url TEXT,
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- BROKERAGES TABLE
-- Pre-loaded library of common brokerage logos
-- ============================================
CREATE TABLE brokerages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- REALTORS TABLE
-- Created when realtor requests access
-- ============================================
CREATE TABLE realtors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  loan_officer_id UUID NOT NULL REFERENCES loan_officers(id),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  license_number TEXT,
  team_name TEXT,
  headshot_url TEXT,
  brokerage_id UUID REFERENCES brokerages(id),
  custom_brokerage_logo_url TEXT,
  website_url TEXT,
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'denied')),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES loan_officers(id),
  onboarding_completed BOOLEAN DEFAULT FALSE
);

-- ============================================
-- FLYERS TABLE
-- Each saved flyer with property data
-- ============================================
CREATE TABLE flyers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  realtor_id UUID NOT NULL REFERENCES realtors(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  template_id TEXT DEFAULT 'template1',

  -- Property details
  property_address TEXT NOT NULL,
  property_city TEXT NOT NULL,
  property_state TEXT NOT NULL,
  property_zip TEXT NOT NULL,
  property_price INTEGER NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms NUMERIC(3,1) NOT NULL,
  square_footage INTEGER NOT NULL,

  -- Photo
  property_photo_url TEXT,
  photo_position_x NUMERIC DEFAULT 50,
  photo_position_y NUMERIC DEFAULT 50,
  photo_zoom NUMERIC DEFAULT 1,

  -- Calculator input
  down_payment_percent NUMERIC DEFAULT 20
);

-- ============================================
-- INDEXES for better query performance
-- ============================================
CREATE INDEX idx_realtors_loan_officer ON realtors(loan_officer_id);
CREATE INDEX idx_realtors_approval_status ON realtors(approval_status);
CREATE INDEX idx_flyers_realtor ON flyers(realtor_id);
CREATE INDEX idx_flyers_status ON flyers(status);

-- ============================================
-- UPDATED_AT TRIGGER
-- Automatically updates updated_at on flyers
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_flyers_updated_at
  BEFORE UPDATE ON flyers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Controls who can access what data
-- ============================================

-- Enable RLS on all tables
ALTER TABLE loan_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE brokerages ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtors ENABLE ROW LEVEL SECURITY;
ALTER TABLE flyers ENABLE ROW LEVEL SECURITY;

-- Brokerages: Anyone can read (it's a public library)
CREATE POLICY "Brokerages are viewable by everyone" ON brokerages
  FOR SELECT USING (is_active = TRUE);

-- Loan Officers: Public read for active LOs
CREATE POLICY "Active LOs are viewable by everyone" ON loan_officers
  FOR SELECT USING (is_active = TRUE);

-- Realtors: Can read/update their own profile
CREATE POLICY "Realtors can view own profile" ON realtors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Realtors can update own profile" ON realtors
  FOR UPDATE USING (auth.uid() = user_id);

-- Realtors: LOs can view their realtors
CREATE POLICY "LOs can view their realtors" ON realtors
  FOR SELECT USING (
    loan_officer_id IN (
      SELECT id FROM loan_officers WHERE email = auth.email()
    )
  );

-- Flyers: Realtors can CRUD their own flyers
CREATE POLICY "Realtors can view own flyers" ON flyers
  FOR SELECT USING (
    realtor_id IN (
      SELECT id FROM realtors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Realtors can insert own flyers" ON flyers
  FOR INSERT WITH CHECK (
    realtor_id IN (
      SELECT id FROM realtors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Realtors can update own flyers" ON flyers
  FOR UPDATE USING (
    realtor_id IN (
      SELECT id FROM realtors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Realtors can delete own flyers" ON flyers
  FOR DELETE USING (
    realtor_id IN (
      SELECT id FROM realtors WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- SEED DATA: Common Brokerages
-- ============================================
INSERT INTO brokerages (name, logo_url) VALUES
  ('Keller Williams', '/logos/brokerages/keller-williams.png'),
  ('RE/MAX', '/logos/brokerages/remax.png'),
  ('Coldwell Banker', '/logos/brokerages/coldwell-banker.png'),
  ('Century 21', '/logos/brokerages/century21.png'),
  ('Berkshire Hathaway', '/logos/brokerages/berkshire-hathaway.png'),
  ('Compass', '/logos/brokerages/compass.png'),
  ('eXp Realty', '/logos/brokerages/exp-realty.png'),
  ('Sotheby''s International', '/logos/brokerages/sothebys.png');

-- ============================================
-- NOTE: You'll need to manually add LOs
-- Example:
-- INSERT INTO loan_officers (email, name, phone, nmls_number, webhook_url)
-- VALUES ('kevin@ethoslending.com', 'Kevin Sprague', '626-969-2500', '12345', 'https://your-ghl-webhook');
-- ============================================
