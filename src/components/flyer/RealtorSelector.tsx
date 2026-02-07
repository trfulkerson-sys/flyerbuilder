'use client'

import { useState, useEffect } from 'react'
import { Realtor } from '@/types/database'

interface RealtorSelectorProps {
  loId: string
  preselectedRealtorId: string | null
  onSelect: (realtor: Realtor | null) => void
}

export default function RealtorSelector({ loId, preselectedRealtorId, onSelect }: RealtorSelectorProps) {
  const [realtors, setRealtors] = useState<Realtor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string>(preselectedRealtorId || '')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchRealtors() {
      try {
        const params = new URLSearchParams()
        if (loId) params.set('lo_id', loId)
        params.set('status', 'approved')

        const res = await fetch(`/api/realtors?${params}`)
        if (!res.ok) throw new Error('Failed to load realtors')

        const data = await res.json()
        setRealtors(data)

        // Auto-select if preselected or only one realtor
        if (preselectedRealtorId) {
          const match = data.find((r: Realtor) => r.id === preselectedRealtorId)
          if (match) {
            setSelectedId(match.id)
            onSelect(match)
          }
        } else if (data.length === 1) {
          setSelectedId(data[0].id)
          onSelect(data[0])
        }
      } catch (err) {
        console.error('Failed to fetch realtors:', err)
        setError('Could not load realtors. Check your Supabase connection.')
      } finally {
        setLoading(false)
      }
    }
    fetchRealtors()
  }, [loId, preselectedRealtorId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (realtorId: string) => {
    setSelectedId(realtorId)
    const realtor = realtors.find(r => r.id === realtorId) || null
    onSelect(realtor)
  }

  const filteredRealtors = searchQuery
    ? realtors.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.team_name && r.team_name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : realtors

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-[#403e36] mb-2">Select Realtor</h3>
        <div className="animate-pulse flex items-center gap-3">
          <div className="h-10 bg-gray-200 rounded flex-1"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-[#403e36] mb-2">Select Realtor</h3>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  if (realtors.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-[#403e36] mb-2">Select Realtor</h3>
        <p className="text-sm text-gray-500">
          No approved realtors found. Add realtors to your account first.
        </p>
      </div>
    )
  }

  const selected = realtors.find(r => r.id === selectedId)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-[#403e36] mb-3">Select Realtor</h3>

      {/* Selected realtor display */}
      {selected && (
        <div className="flex items-center gap-3 mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            {selected.headshot_url ? (
              <img src={selected.headshot_url} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <span className="text-green-700 font-semibold text-sm">
                {selected.name.split(' ').map(n => n[0]).join('')}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gray-900 truncate">{selected.name}</div>
            {selected.team_name && (
              <div className="text-xs text-gray-600 truncate">{selected.team_name}</div>
            )}
            <div className="text-xs text-gray-500 truncate">{selected.email}</div>
          </div>
          <button
            onClick={() => { setSelectedId(''); onSelect(null) }}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Change
          </button>
        </div>
      )}

      {/* Selector dropdown (show when no selection or changing) */}
      {!selected && (
        <>
          {realtors.length > 5 && (
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search realtors..."
              className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#403e36] focus:border-transparent text-gray-900 placeholder:text-gray-400"
            />
          )}

          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            {filteredRealtors.map((realtor) => (
              <button
                key={realtor.id}
                onClick={() => handleSelect(realtor.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {realtor.headshot_url ? (
                    <img src={realtor.headshot_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <span className="text-gray-600 font-semibold text-xs">
                      {realtor.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">{realtor.name}</div>
                  {realtor.team_name && (
                    <div className="text-xs text-gray-500 truncate">{realtor.team_name}</div>
                  )}
                </div>
              </button>
            ))}
            {filteredRealtors.length === 0 && (
              <div className="p-3 text-sm text-gray-500 text-center">No matching realtors</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
