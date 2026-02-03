import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

// Ensure Node.js runtime (not Edge) - required for Puppeteer
export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let browser = null

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

    // Use request origin to build URL (guarantees same deployment)
    const origin = new URL(request.url).origin
    const renderUrl = new URL(`/flyer/render?data=${encodeURIComponent(encodedData)}`, origin).toString()

    console.log('PDF Generation - renderUrl:', renderUrl)
    console.log('PDF Generation - origin:', origin)

    // Get chromium executable path (no URL - use built-in)
    console.log('PDF Generation - getting chromium executablePath...')
    const executablePath = await chromium.executablePath()
    console.log('PDF Generation - executablePath:', executablePath)

    // Launch browser
    console.log('PDF Generation - launching browser...')
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 816, height: 1056 },
      executablePath,
      headless: true,
    })
    console.log('PDF Generation - browser launched')

    const page = await browser.newPage()

    // Set viewport to letter size at 96 DPI with 2x scale
    await page.setViewport({
      width: 816,
      height: 1056,
      deviceScaleFactor: 2,
    })

    // Navigate to render page
    console.log('PDF Generation - navigating to:', renderUrl)
    const response = await page.goto(renderUrl, {
      waitUntil: 'networkidle0',
      timeout: 20000,
    })
    console.log('PDF Generation - goto status:', response?.status())

    if (response?.status() === 404) {
      throw new Error(`Render page returned 404. URL: ${renderUrl}`)
    }

    // Wait for content to be ready
    console.log('PDF Generation - waiting for #flyer-content...')
    await page.waitForSelector('#flyer-content', { timeout: 10000 })
    console.log('PDF Generation - content ready')

    let contentType: string
    let filename: string
    let arrayBuffer: ArrayBuffer

    if (format === 'png') {
      const element = await page.$('#flyer-content')
      if (!element) {
        throw new Error('Flyer content not found')
      }
      const screenshot = await element.screenshot({
        type: 'png',
        omitBackground: false,
      })
      arrayBuffer = new ArrayBuffer(screenshot.byteLength)
      new Uint8Array(arrayBuffer).set(screenshot)
      contentType = 'image/png'
      filename = 'flyer.png'
    } else {
      const pdf = await page.pdf({
        format: 'Letter',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      })
      arrayBuffer = new ArrayBuffer(pdf.byteLength)
      new Uint8Array(arrayBuffer).set(pdf)
      contentType = 'application/pdf'
      filename = 'flyer.pdf'
    }

    await browser.close()
    console.log('PDF Generation - success!')

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)

    if (browser) {
      try {
        await browser.close()
      } catch (closeError) {
        console.error('Error closing browser:', closeError)
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { message: errorMessage, stack: errorStack })

    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: errorMessage,
        stack: errorStack
      },
      { status: 500 }
    )
  }
}
