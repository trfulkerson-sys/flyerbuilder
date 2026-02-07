import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  let connectionStatus = 'checking...'
  let loCount = 0
  let realtorCount = 0
  let flyerCount = 0

  try {
    const supabase = await createClient()

    const [loResult, realtorResult, flyerResult] = await Promise.all([
      supabase.from('loan_officers').select('*', { count: 'exact', head: true }),
      supabase.from('realtors').select('*', { count: 'exact', head: true }),
      supabase.from('flyers').select('*', { count: 'exact', head: true }),
    ])

    if (loResult.error) {
      connectionStatus = `Error: ${loResult.error.message}`
    } else {
      connectionStatus = 'Connected'
      loCount = loResult.count || 0
      realtorCount = realtorResult.count || 0
      flyerCount = flyerResult.count || 0
    }
  } catch {
    connectionStatus = 'Failed to connect'
  }

  return (
    <div className="min-h-screen bg-[#FAF5F0]">
      {/* Header */}
      <header className="bg-black text-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold">KATALYST FLYER BUILDER</h1>
          <p className="text-gray-300 mt-1">Create professional property flyers with Kickstart incentives</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <a
            href="/flyers"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#403e36]">View All Flyers</h2>
                <p className="text-sm text-gray-500">{flyerCount} flyer{flyerCount !== 1 ? 's' : ''} saved</p>
              </div>
            </div>
          </a>

          <a
            href="/flyer/new"
            className="bg-[#403e36] rounded-lg shadow-lg p-8 hover:bg-[#2d2c27] transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Create New Flyer</h2>
                <p className="text-sm text-gray-300">Start a new property flyer</p>
              </div>
            </div>
          </a>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-[#403e36] mb-4">Dashboard</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#403e36]">{flyerCount}</div>
              <div className="text-sm text-gray-500 mt-1">Flyers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#403e36]">{realtorCount}</div>
              <div className="text-sm text-gray-500 mt-1">Realtors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#403e36]">{loCount}</div>
              <div className="text-sm text-gray-500 mt-1">Loan Officers</div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">System Status</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${connectionStatus === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              Supabase: {connectionStatus}
            </span>
          </div>
        </div>

        <p className="text-center text-gray-400 text-sm mt-8">
          Flyer Builder v0.2 - Flyer persistence enabled
        </p>
      </main>
    </div>
  )
}
