'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import FlyerForm, { FlyerData } from '@/components/flyer/FlyerForm'
import FlyerPreview from '@/components/flyer/FlyerPreview'
import PropertyPhotoUpload from '@/components/flyer/PropertyPhotoUpload'
import { Flyer, Realtor, LoanOfficer } from '@/types/database'

const DEFAULT_RATE = 6.99

interface FlyerWithRealtor extends Flyer {
  realtor: Realtor & {
    loan_officer?: LoanOfficer
    brokerage?: { id: string; name: string; logo_url: string } | null
  }
}

export default function EditFlyerPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const flyerId = params.id as string
  const justSaved = searchParams.get('saved') === 'true'

  const [interestRate, setInterestRate] = useState(DEFAULT_RATE)
  const [rateLoading, setRateLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [loadingFlyer, setLoadingFlyer] = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(justSaved)
  const [flyerRecord, setFlyerRecord] = useState<FlyerWithRealtor | null>(null)

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

  // Fetch flyer data
  useEffect(() => {
    async function fetchFlyer() {
      try {
        const res = await fetch(`/api/flyers/${flyerId}`)
        if (!res.ok) {
          if (res.status === 404) {
            router.push('/flyers')
            return
          }
          throw new Error('Failed to load flyer')
        }

        const data: FlyerWithRealtor = await res.json()
        setFlyerRecord(data)

        setFlyerData({
          propertyAddress: data.property_address,
          propertyCity: data.property_city,
          propertyState: data.property_state,
          propertyZip: data.property_zip,
          propertyPrice: data.property_price,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          squareFootage: data.square_footage,
          downPaymentPercent: data.down_payment_percent,
          interestRate: DEFAULT_RATE,
          propertyPhotoUrl: data.property_photo_url,
          photoPositionX: data.photo_position_x,
          photoPositionY: data.photo_position_y,
          photoZoom: data.photo_zoom,
        })
      } catch (err) {
        console.error('Failed to load flyer:', err)
        setSaveError('Could not load flyer data.')
      } finally {
        setLoadingFlyer(false)
      }
    }
    fetchFlyer()
  }, [flyerId, router])

  // Fetch live interest rate
  useEffect(() => {
    async function fetchRate() {
      try {
        const res = await fetch('/api/rate')
        if (res.ok) {
          const data = await res.json()
          if (data.rate) setInterestRate(data.rate)
        }
      } catch (error) {
        console.error('Failed to fetch rate:', error)
      } finally {
        setRateLoading(false)
      }
    }
    fetchRate()
  }, [])

  // Clear success message after a few seconds
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [saveSuccess])

  // LO data from the loaded flyer's realtor
  const loanOfficer = flyerRecord?.realtor?.loan_officer
    ? {
        name: flyerRecord.realtor.loan_officer.name,
        phone: flyerRecord.realtor.loan_officer.phone,
        nmls_number: flyerRecord.realtor.loan_officer.nmls_number,
      }
    : { name: 'Trevor Fulkerson', phone: '619-569-8648', nmls_number: '12345' }

  // Save (update) flyer
  const handleSave = async (status?: 'draft' | 'active' | 'archived') => {
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      const body: Record<string, unknown> = {
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
      }

      if (status) body.status = status

      const response = await fetch(`/api/flyers/${flyerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save')
      }

      const updated = await response.json()
      setFlyerRecord(prev => prev ? { ...prev, ...updated } : prev)
      setSaveSuccess(true)
    } catch (error) {
      console.error('Save error:', error)
      setSaveError(error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // Download PDF
  const handleDownloadPDF = async () => {
    setDownloading(true)
    try {
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flyerData, interestRate, loanOfficer, format: 'pdf' })
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

  if (loadingFlyer) {
    return (
      <div className="min-h-screen bg-[#FAF5F0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#403e36] border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-600">Loading flyer...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF5F0]">
      {/* Header */}
      <header className="bg-black text-white py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">KATALYST FLYER BUILDER</h1>
            <p className="text-sm text-gray-400">
              Editing: {flyerData.propertyAddress || 'Untitled Flyer'}
              {flyerRecord && (
                <span className="ml-2 text-xs">
                  ({flyerRecord.status})
                </span>
              )}
            </p>
          </div>
          <a href="/flyers" className="text-sm text-gray-400 hover:text-white">
            &larr; All Flyers
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Realtor info bar */}
        {flyerRecord?.realtor && (
          <div className="mb-6 bg-white rounded-lg shadow px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              {flyerRecord.realtor.headshot_url ? (
                <img src={flyerRecord.realtor.headshot_url} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <span className="text-gray-600 font-semibold text-xs">
                  {flyerRecord.realtor.name.split(' ').map(n => n[0]).join('')}
                </span>
              )}
            </div>
            <div>
              <span className="text-sm font-medium text-gray-900">{flyerRecord.realtor.name}</span>
              {flyerRecord.realtor.team_name && (
                <span className="text-xs text-gray-500 ml-2">{flyerRecord.realtor.team_name}</span>
              )}
            </div>
          </div>
        )}

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

            {/* Messages */}
            {saveError && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {saveError}
              </div>
            )}
            {saveSuccess && (
              <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                Flyer saved successfully!
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                className="flex-1 bg-[#403e36] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#2d2c27] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleSave()}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                className="flex-1 bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDownloadPDF}
                disabled={downloading}
              >
                {downloading ? 'Generating PDF...' : 'Download PDF'}
              </button>
            </div>

            {/* Status actions */}
            {flyerRecord && (
              <div className="mt-3 flex gap-3">
                {flyerRecord.status === 'draft' && (
                  <button
                    className="flex-1 bg-purple-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    onClick={() => handleSave('active')}
                    disabled={saving}
                  >
                    Publish
                  </button>
                )}
                {flyerRecord.status === 'active' && (
                  <button
                    className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2.5 px-6 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    onClick={() => handleSave('draft')}
                    disabled={saving}
                  >
                    Revert to Draft
                  </button>
                )}
                {flyerRecord.status !== 'archived' && (
                  <button
                    className="border border-gray-300 text-gray-500 font-semibold py-2.5 px-6 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    onClick={() => handleSave('archived')}
                    disabled={saving}
                  >
                    Archive
                  </button>
                )}
              </div>
            )}
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
