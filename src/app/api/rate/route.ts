import { NextResponse } from 'next/server'
import { adjustApiRate } from '@/lib/calculator/kickstart'

const DEFAULT_RATE = 6.99
const API_NINJAS_KEY = process.env.MORTGAGE_RATE_API_KEY

export async function GET() {
  // If no API key configured, return default rate
  if (!API_NINJAS_KEY) {
    return NextResponse.json({
      rate: DEFAULT_RATE,
      source: 'default',
      message: 'API key not configured, using default rate'
    })
  }

  try {
    const res = await fetch('https://api.api-ninjas.com/v1/mortgagerate', {
      method: 'GET',
      headers: {
        'X-Api-Key': API_NINJAS_KEY,
      },
      // Cache for 1 hour
      next: { revalidate: 3600 }
    })

    if (!res.ok) {
      throw new Error(`API returned ${res.status}`)
    }

    const data = await res.json()
    const root = Array.isArray(data) ? data[0] : data

    // Try to get the 30-year fixed rate from various possible field names
    const rateField =
      root?.data?.frm_30 ??
      root?.frm_30 ??
      root?.thirty_year_fixed ??
      root?.rate_30

    const apiRate = parseFloat(rateField)

    if (!Number.isFinite(apiRate)) {
      throw new Error('Could not parse rate from API response')
    }

    // Apply the 10 basis points adjustment
    const adjustedRate = adjustApiRate(apiRate)

    return NextResponse.json({
      rate: adjustedRate,
      source: 'live',
      rawRate: apiRate,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Failed to fetch live rate:', error)

    // Return default rate on any error
    return NextResponse.json({
      rate: DEFAULT_RATE,
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
