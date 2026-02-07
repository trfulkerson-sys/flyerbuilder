'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Flyer, Realtor } from '@/types/database'
import { formatCurrency } from '@/lib/calculator/kickstart'

interface FlyerWithRealtor extends Flyer {
  realtor: Realtor & {
    loan_officer?: { id: string; name: string; phone: string; nmls_number: string }
    brokerage?: { id: string; name: string; logo_url: string } | null
  }
}

export default function FlyerListPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF5F0] flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>}>
      <FlyerListContent />
    </Suspense>
  )
}

function FlyerListContent() {
  const searchParams = useSearchParams()
  const loId = searchParams.get('lo_id') || ''
  const realtorId = searchParams.get('realtor_id')

  const [flyers, setFlyers] = useState<FlyerWithRealtor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    async function fetchFlyers() {
      try {
        const params = new URLSearchParams()
        if (realtorId) params.set('realtor_id', realtorId)
        else if (loId) params.set('lo_id', loId)
        if (statusFilter !== 'all') params.set('status', statusFilter)

        const res = await fetch(`/api/flyers?${params}`)
        if (!res.ok) throw new Error('Failed to load flyers')

        const data = await res.json()
        setFlyers(data)
      } catch (err) {
        console.error('Failed to fetch flyers:', err)
        setError('Could not load flyers. Check your connection.')
      } finally {
        setLoading(false)
      }
    }
    fetchFlyers()
  }, [loId, realtorId, statusFilter])

  const handleArchive = async (flyerId: string) => {
    try {
      const res = await fetch(`/api/flyers/${flyerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      })
      if (!res.ok) throw new Error('Failed to archive')

      setFlyers(prev => prev.map(f =>
        f.id === flyerId ? { ...f, status: 'archived' as const } : f
      ))
    } catch (err) {
      console.error('Archive error:', err)
    }
  }

  const handleDelete = async (flyerId: string) => {
    if (!confirm('Are you sure you want to delete this flyer? This cannot be undone.')) return

    try {
      const res = await fetch(`/api/flyers/${flyerId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')

      setFlyers(prev => prev.filter(f => f.id !== flyerId))
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-600',
    }
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || styles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF5F0]">
      {/* Header */}
      <header className="bg-black text-white py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">KATALYST FLYER BUILDER</h1>
            <p className="text-sm text-gray-400">Manage your property flyers</p>
          </div>
          <a
            href={`/flyer/new${loId ? `?lo_id=${loId}` : ''}`}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
          >
            + New Flyer
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          {['all', 'draft', 'active', 'archived'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
                statusFilter === s
                  ? 'bg-[#403e36] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <div className="flex-1" />
          <span className="text-sm text-gray-500">
            {flyers.length} flyer{flyers.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow animate-pulse">
                <div className="h-40 bg-gray-200 rounded-t-lg" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && flyers.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No flyers yet</h3>
            <p className="text-gray-500 mb-4">Create your first property flyer to get started.</p>
            <a
              href={`/flyer/new${loId ? `?lo_id=${loId}` : ''}`}
              className="inline-block bg-purple-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Create Flyer
            </a>
          </div>
        )}

        {/* Flyer grid */}
        {!loading && flyers.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flyers.map((flyer) => (
              <div key={flyer.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden">
                {/* Photo thumbnail */}
                <div className="h-40 bg-gray-100 relative overflow-hidden">
                  {flyer.property_photo_url ? (
                    <img
                      src={flyer.property_photo_url}
                      alt={flyer.property_address}
                      className="w-full h-full object-cover"
                      style={{
                        objectPosition: `${flyer.photo_position_x}% ${flyer.photo_position_y}%`,
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Price overlay */}
                  <div className="absolute bottom-0 left-0 bg-black/80 text-white px-3 py-1.5 text-sm font-bold">
                    {formatCurrency(flyer.property_price)}
                  </div>

                  {/* Status badge */}
                  <div className="absolute top-2 right-2">
                    {statusBadge(flyer.status)}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {flyer.property_address}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {flyer.property_city}, {flyer.property_state} {flyer.property_zip}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {flyer.bedrooms} BD / {flyer.bathrooms} BA / {flyer.square_footage?.toLocaleString()} SF
                  </p>

                  {/* Realtor info */}
                  {flyer.realtor && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Realtor: <span className="font-medium text-gray-700">{flyer.realtor.name}</span>
                      </p>
                    </div>
                  )}

                  {/* Updated timestamp */}
                  <p className="text-xs text-gray-400 mt-2">
                    Updated {new Date(flyer.updated_at).toLocaleDateString()}
                  </p>

                  {/* Actions */}
                  <div className="mt-3 flex gap-2">
                    <a
                      href={`/flyer/${flyer.id}/edit`}
                      className="flex-1 text-center bg-[#403e36] text-white text-sm py-1.5 rounded hover:bg-[#2d2c27] transition-colors"
                    >
                      Edit
                    </a>
                    {flyer.status !== 'archived' ? (
                      <button
                        onClick={() => handleArchive(flyer.id)}
                        className="text-sm px-3 py-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Archive
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDelete(flyer.id)}
                        className="text-sm px-3 py-1.5 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
