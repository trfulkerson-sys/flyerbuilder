'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import FlyerPreviewPrint from '@/components/flyer/FlyerPreviewPrint'

function FlyerRenderContent() {
  const searchParams = useSearchParams()

  // Get data from URL params (base64 encoded JSON)
  const encodedData = searchParams.get('data')

  if (!encodedData) {
    return <div>No flyer data provided</div>
  }

  try {
    const decodedData = JSON.parse(atob(encodedData))

    return (
      <div
        id="flyer-content"
        style={{
          width: '8.5in',
          height: '11in',
          margin: 0,
          padding: 0,
          background: 'white'
        }}
      >
        <FlyerPreviewPrint
          data={decodedData.flyerData}
          interestRate={decodedData.interestRate}
          loanOfficer={decodedData.loanOfficer}
        />
      </div>
    )
  } catch (error) {
    return <div>Error parsing flyer data</div>
  }
}

export default function FlyerRenderPage() {
  return (
    <html>
      <body style={{ margin: 0, padding: 0 }}>
        <Suspense fallback={<div>Loading...</div>}>
          <FlyerRenderContent />
        </Suspense>
      </body>
    </html>
  )
}
