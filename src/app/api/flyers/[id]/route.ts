import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/flyers/[id] - Get a single flyer with realtor + LO data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data, error } = await supabase
      .from('flyers')
      .select(`
        *,
        realtor:realtors (
          id, name, email, phone, team_name, headshot_url, license_number,
          brokerage:brokerages ( id, name, logo_url ),
          loan_officer:loan_officers ( id, name, phone, nmls_number, headshot_url, qr_code_url, calculator_url, website_url )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Flyer not found' }, { status: 404 })
      }
      console.error('Supabase flyer get error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Flyer get API crash:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/flyers/[id] - Update a flyer
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    const allowedFields = [
      'realtor_id', 'status', 'template_id',
      'property_address', 'property_city', 'property_state', 'property_zip',
      'property_price', 'bedrooms', 'bathrooms', 'square_footage',
      'property_photo_url', 'photo_position_x', 'photo_position_y', 'photo_zoom',
      'down_payment_percent',
    ]

    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('flyers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Flyer not found' }, { status: 404 })
      }
      console.error('Supabase flyer update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Flyer update API crash:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/flyers/[id] - Delete a flyer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { error } = await supabase
      .from('flyers')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase flyer delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Flyer delete API crash:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
