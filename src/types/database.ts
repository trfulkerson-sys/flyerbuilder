/**
 * Database types for Supabase tables
 * These match the schema defined in PLANNING.md
 */

export interface LoanOfficer {
  id: string
  created_at: string
  email: string
  name: string
  phone: string
  nmls_number: string
  headshot_url: string | null
  qr_code_url: string | null
  calculator_url: string | null
  website_url: string | null
  webhook_url: string | null
  is_active: boolean
}

export interface Brokerage {
  id: string
  name: string
  logo_url: string
  is_active: boolean
}

export interface Realtor {
  id: string
  created_at: string
  user_id: string | null
  loan_officer_id: string
  email: string
  name: string
  phone: string | null
  license_number: string | null
  team_name: string | null
  headshot_url: string | null
  brokerage_id: string | null
  custom_brokerage_logo_url: string | null
  website_url: string | null
  approval_status: 'pending' | 'approved' | 'denied'
  approved_at: string | null
  approved_by: string | null
  onboarding_completed: boolean
}

export interface Flyer {
  id: string
  created_at: string
  updated_at: string
  realtor_id: string
  status: 'draft' | 'active' | 'archived'
  template_id: string
  // Property details
  property_address: string
  property_city: string
  property_state: string
  property_zip: string
  property_price: number
  bedrooms: number
  bathrooms: number
  square_footage: number
  property_photo_url: string | null
  photo_position_x: number
  photo_position_y: number
  photo_zoom: number
  // Down payment
  down_payment_percent: number
}

// Joined types for when we need related data
export interface RealtorWithLO extends Realtor {
  loan_officer: LoanOfficer
  brokerage: Brokerage | null
}

export interface FlyerWithRealtor extends Flyer {
  realtor: RealtorWithLO
}
