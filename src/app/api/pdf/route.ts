import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

// Configure for Vercel serverless
export const maxDuration = 30 // 30 seconds timeout
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { flyerData, interestRate, loanOfficer, format = 'pdf' } = body

    if (!flyerData) {
      return NextResponse.json({ error: 'Missing flyer data' }, { status: 400 })
    }

    // Encode the data for URL
    const encodedData = Buffer.from(JSON.stringify({
      flyerData,
      interestRate,
      loanOfficer
    })).toString('base64')

    // Get the base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    const renderUrl = `${baseUrl}/flyer/render?data=${encodeURIComponent(encodedData)}`

    // Launch browser
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: null, // We set viewport manually below
      executablePath: await chromium.executablePath(),
      headless: true,
    })

    const page = await browser.newPage()

    // Set viewport to letter size at 96 DPI
    await page.setViewport({
      width: 816,  // 8.5 inches * 96 DPI
      height: 1056, // 11 inches * 96 DPI
      deviceScaleFactor: 2, // Higher quality
    })

    // Navigate to render page
    await page.goto(renderUrl, {
      waitUntil: 'networkidle0',
      timeout: 20000,
    })

    // Wait for content to be ready
    await page.waitForSelector('#flyer-content', { timeout: 10000 })

    let contentType: string
    let filename: string
    let arrayBuffer: ArrayBuffer

    if (format === 'png') {
      // Generate PNG screenshot
      const element = await page.$('#flyer-content')
      if (!element) {
        throw new Error('Flyer content not found')
      }
      const screenshot = await element.screenshot({
        type: 'png',
        omitBackground: false,
      })
      // Copy to fresh ArrayBuffer to satisfy TypeScript
      arrayBuffer = new ArrayBuffer(screenshot.byteLength)
      new Uint8Array(arrayBuffer).set(screenshot)
      contentType = 'image/png'
      filename = 'flyer.png'
    } else {
      // Generate PDF
      const pdf = await page.pdf({
        format: 'Letter',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      })
      // Copy to fresh ArrayBuffer to satisfy TypeScript
      arrayBuffer = new ArrayBuffer(pdf.byteLength)
      new Uint8Array(arrayBuffer).set(pdf)
      contentType = 'application/pdf'
      filename = 'flyer.pdf'
    }

    await browser.close()

    // Return the file
    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
