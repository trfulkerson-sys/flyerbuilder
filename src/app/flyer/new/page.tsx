'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import FlyerForm, { FlyerData } from '@/components/flyer/FlyerForm'
import FlyerPreview from '@/components/flyer/FlyerPreview'
import PropertyPhotoUpload from '@/components/flyer/PropertyPhotoUpload'
import RealtorSelector from '@/components/flyer/RealtorSelector'
import { Realtor, LoanOfficer } from '@/types/database'

const DEFAULT_RATE = 6.99

export default function NewFlyerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF5F0] flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>}>
      <NewFlyerContent />
    </Suspense>
  )
}

function NewFlyerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [interestRate, setInterestRate] = useState(DEFAULT_RATE)
  const [rateLoading, setRateLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [selectedRealtor, setSelectedRealtor] = useState<Realtor | null>(null)

  // TODO: Replace with actual auth context when auth is built
  // For now, mock the current user as an LO
  const currentLO: LoanOfficer | null = {
    id: searchParams.get('lo_id') || '',
    created_at: '',
    email: '',
    name: 'Trevor Fulkerson',
    phone: '619-569-8648',
    nmls_number: '12345',
    headshot_url: null,
    qr_code_url: null,
    calculator_url: null,
    website_url: null,
    webhook_url: null,
    is_active: true,
  }

  // Pre-select realtor if passed via URL
  const preselectedRealtorId = searchParams.get('realtor_id')

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

  // Loan officer data for the preview (from selected realtor's LO or current LO)
  const loanOfficer = selectedRealtor
    ? {
        name: (selectedRealtor as Realtor & { loan_officer?: LoanOfficer }).loan_officer?.name || currentLO.name,
        phone: (selectedRealtor as Realtor & { loan_officer?: LoanOfficer }).loan_officer?.phone || currentLO.phone,
        nmls_number: (selectedRealtor as Realtor & { loan_officer?: LoanOfficer }).loan_officer?.nmls_number || currentLO.nmls_number,
      }
    : {
        name: currentLO.name,
        phone: currentLO.phone,
        nmls_number: currentLO.nmls_number,
      }

  // Save flyer to database
  const handleSave = async (status: 'draft' | 'active' = 'draft') => {
    if (!selectedRealtor) {
      setSaveError('Please select a realtor before saving.')
      return
    }

    if (!flyerData.propertyAddress || !flyerData.propertyCity || !flyerData.propertyState || !flyerData.propertyZip) {
      setSaveError('Please fill in the property address.')
      return
    }

    if (!flyerData.propertyPrice || flyerData.propertyPrice <= 0) {
      setSaveError('Please enter a valid property price.')
      return
    }

    setSaving(true)
    setSaveError(null)

    try {
      const response = await fetch('/api/flyers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          realtor_id: selectedRealtor.id,
          created_by_lo_id: currentLO.id || null,
          status,
          property_address: flyerData.propertyAddress,
          property_city: flyerData.propertyCity,
          property_state: flyerData.propertyState,
          property_zip: flyerData.propertyZip,
          property_price: flyerData.propertyPrice,
          bedrooms: flyerData.bedrooms,
          bathrooms: flyerData.bathrooms,
          square_footage: flyerData.squareFootage,
          property_photo_url: flyerData.propertyPhotoUrl,
          photo_position_x: flyerData.photoPositionX,
          photo_position_y: flyerData.photoPositionY,
          photo_zoom: flyerData.photoZoom,
          down_payment_percent: flyerData.downPaymentPercent,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save flyer')
      }

      const saved = await response.json()
      router.push(`/flyer/${saved.id}/edit?saved=true`)
    } catch (error) {
      console.error('Save error:', error)
      setSaveError(error instanceof Error ? error.message : 'Failed to save flyer')
    } finally {
      setSaving(false)
    }
  }

  // Download PDF handler - server-side generation
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
          <a href="/flyers" className="text-sm text-gray-400 hover:text-white">
            &larr; All Flyers
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div>
            {/* Realtor Selector */}
            <div className="mb-6">
              <RealtorSelector
                loId={currentLO.id}
                preselectedRealtorId={preselectedRealtorId}
                onSelect={setSelectedRealtor}
              />
            </div>

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

            {/* Error display */}
            {saveError && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {saveError}
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                className="flex-1 bg-[#403e36] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#2d2c27] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleSave('draft')}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                className="flex-1 bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDownloadPDF}
                disabled={downloading}
              >
                {downloading ? 'Generating PDF...' : 'Download PDF'}
              </button>
            </div>
            <button
              className="mt-3 w-full bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleSave('active')}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save & Publish'}
            </button>
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
                  ? 'Drag photo to reposition \u2022 Preview updates as you type'
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
