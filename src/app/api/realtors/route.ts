import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/realtors - List realtors (filtered by lo_id for LO dashboard)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const loId = searchParams.get('lo_id')
    const status = searchParams.get('status')

    let query = supabase
      .from('realtors')
      .select(`
        *,
        brokerage:brokerages ( id, name, logo_url ),
        loan_officer:loan_officers ( id, name, phone, nmls_number, email )
      `)
      .order('name', { ascending: true })

    if (loId) {
      query = query.eq('loan_officer_id', loId)
    }

    if (status) {
      query = query.eq('approval_status', status)
    } else {
      // Default to only approved realtors
      query = query.eq('approval_status', 'approved')
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase realtors error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Realtors API crash:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
