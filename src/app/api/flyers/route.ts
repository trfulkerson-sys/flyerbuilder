import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/flyers - List flyers (optionally filtered by realtor_id or lo_id)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const realtorId = searchParams.get('realtor_id')
  const loId = searchParams.get('lo_id')
  const status = searchParams.get('status')

  let query = supabase
    .from('flyers')
    .select(`
      *,
      realtor:realtors (
        id, name, email, phone, team_name, headshot_url,
        brokerage:brokerages ( id, name, logo_url ),
        loan_officer:loan_officers ( id, name, phone, nmls_number, headshot_url, qr_code_url, calculator_url, website_url )
      )
    `)
    .order('updated_at', { ascending: false })

  if (realtorId) {
    query = query.eq('realtor_id', realtorId)
  }

  if (loId) {
    // Get all flyers for realtors belonging to this LO
    query = query.eq('realtor.loan_officer_id', loId)
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If filtering by LO, the join filter may return nulls - clean them up
  const flyers = loId ? data?.filter(f => f.realtor !== null) : data

  return NextResponse.json(flyers)
}

// POST /api/flyers - Create a new flyer
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const {
    realtor_id,
    created_by_lo_id,
    property_address,
    property_city,
    property_state,
    property_zip,
    property_price,
    bedrooms,
    bathrooms,
    square_footage,
    property_photo_url,
    photo_position_x,
    photo_position_y,
    photo_zoom,
    down_payment_percent,
    status = 'draft',
    template_id = 'template1',
  } = body

  if (!realtor_id) {
    return NextResponse.json({ error: 'realtor_id is required' }, { status: 400 })
  }

  if (!property_address || !property_city || !property_state || !property_zip) {
    return NextResponse.json({ error: 'Property address fields are required' }, { status: 400 })
  }

  if (!property_price || property_price <= 0) {
    return NextResponse.json({ error: 'Valid property price is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('flyers')
    .insert({
      realtor_id,
      created_by_lo_id: created_by_lo_id || null,
      status,
      template_id,
      property_address,
      property_city,
      property_state,
      property_zip,
      property_price,
      bedrooms: bedrooms || 0,
      bathrooms: bathrooms || 0,
      square_footage: square_footage || 0,
      property_photo_url: property_photo_url || null,
      photo_position_x: photo_position_x ?? 50,
      photo_position_y: photo_position_y ?? 50,
      photo_zoom: photo_zoom ?? 1,
      down_payment_percent: down_payment_percent ?? 20,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
