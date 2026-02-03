'use client'

import { useState, useEffect } from 'react'
import FlyerForm, { FlyerData } from '@/components/flyer/FlyerForm'
import FlyerPreview from '@/components/flyer/FlyerPreview'
import PropertyPhotoUpload from '@/components/flyer/PropertyPhotoUpload'

const DEFAULT_RATE = 6.99

export default function NewFlyerPage() {
  const [interestRate, setInterestRate] = useState(DEFAULT_RATE)
  const [rateLoading, setRateLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  const [flyerData, setFlyerData] = useState<FlyerData>({
    propertyAddress: '',
    propertyCity: '',
    propertyState: 'CA',
    propertyZip: '',
    propertyPrice: 0,
    bedrooms: 0,
    bathrooms: 0,
    squareFootage: 0,
    downPaymentPercent: 20,
    interestRate: DEFAULT_RATE,
    propertyPhotoUrl: null,
    photoPositionX: 50,
    photoPositionY: 50,
    photoZoom: 100,
  })

  // Fetch live interest rate on mount
  useEffect(() => {
    async function fetchRate() {
      try {
        const res = await fetch('/api/rate')
        if (res.ok) {
          const data = await res.json()
          if (data.rate) {
            setInterestRate(data.rate)
          }
        }
      } catch (error) {
        console.error('Failed to fetch rate:', error)
      } finally {
        setRateLoading(false)
      }
    }
    fetchRate()
  }, [])

  // Mock loan officer data for now (would come from auth context later)
  const loanOfficer = {
    name: 'Trevor Fulkerson',
    phone: '619-569-8648',
    nmls_number: '12345',
  }

  // Download PDF handler
  const handleDownloadPDF = async () => {
    setDownloading(true)
    try {
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flyerData,
          interestRate,
          loanOfficer,
          format: 'pdf'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Failed to generate PDF')
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `flyer-${flyerData.propertyAddress || 'property'}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert(error instanceof Error ? error.message : 'Failed to download PDF')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF5F0]">
      {/* Header */}
      <header className="bg-black text-white py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">KATALYST FLYER BUILDER</h1>
            <p className="text-sm text-gray-400">Create a new property flyer</p>
          </div>
          <a href="/" className="text-sm text-gray-400 hover:text-white">
            &larr; Back
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#403e36]">Property Details</h2>
              {rateLoading ? (
                <span className="text-sm text-gray-500">Loading rate...</span>
              ) : (
                <span className="text-sm text-green-600">
                  Live rate: {interestRate.toFixed(2)}%
                </span>
              )}
            </div>

            <FlyerForm
              data={flyerData}
              onChange={setFlyerData}
              interestRate={interestRate}
            />

            {/* Photo Upload */}
            <div className="mt-6">
              <PropertyPhotoUpload
                photoUrl={flyerData.propertyPhotoUrl}
                onPhotoChange={(url) => setFlyerData({ ...flyerData, propertyPhotoUrl: url, photoPositionX: 50, photoPositionY: 50 })}
                zoom={flyerData.photoZoom}
                onZoomChange={(zoom) => setFlyerData({ ...flyerData, photoZoom: zoom })}
              />
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                className="flex-1 bg-[#403e36] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#2d2c27] transition-colors"
                onClick={() => alert('Save functionality coming soon!')}
              >
                Save Flyer
              </button>
              <button
                className="flex-1 bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDownloadPDF}
                disabled={downloading}
              >
                {downloading ? 'Generating PDF...' : 'Download PDF'}
              </button>
            </div>
          </div>

          {/* Right: Preview */}
          <div>
            <h2 className="text-xl font-semibold text-[#403e36] mb-4">Flyer Preview</h2>
            <div className="sticky top-4">
              <FlyerPreview
                data={flyerData}
                interestRate={interestRate}
                loanOfficer={loanOfficer}
                onPositionChange={(x, y) => setFlyerData({ ...flyerData, photoPositionX: x, photoPositionY: y })}
              />
              <p className="text-xs text-gray-500 text-center mt-3">
                {flyerData.propertyPhotoUrl
                  ? 'Drag photo to reposition • Preview updates as you type'
                  : 'Preview updates as you type'
                }
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
