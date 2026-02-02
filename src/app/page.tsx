import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  // Test Supabase connection
  let connectionStatus = 'checking...'
  let loCount = 0

  try {
    const supabase = await createClient()
    const { count, error } = await supabase
      .from('loan_officers')
      .select('*', { count: 'exact', head: true })

    if (error) {
      connectionStatus = `Error: ${error.message}`
    } else {
      connectionStatus = 'Connected'
      loCount = count || 0
    }
  } catch (e) {
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

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-[#403e36] mb-4">System Status</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Supabase Connection</span>
              <span className={`font-medium ${connectionStatus === 'Connected' ? 'text-green-600' : 'text-red-600'}`}>
                {connectionStatus}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Loan Officers in Database</span>
              <span className="font-medium text-[#403e36]">{loCount}</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">App Status</span>
              <span className="font-medium text-green-600">Running</span>
            </div>
          </div>
        </div>

        {/* Next Steps Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold text-[#403e36] mb-4">Setup Checklist</h2>

          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${connectionStatus === 'Connected' ? 'bg-green-500' : 'bg-gray-300'}`}>
                {connectionStatus === 'Connected' ? '✓' : ''}
              </span>
              <span className="text-gray-700">Connect Supabase database</span>
            </li>
            <li className="flex items-start gap-3">
              <span className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${loCount > 0 ? 'bg-green-500' : 'bg-gray-300'}`}>
                {loCount > 0 ? '✓' : ''}
              </span>
              <span className="text-gray-700">Add at least one Loan Officer</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs"></span>
              <span className="text-gray-700">Build flyer creation form (coming next)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs"></span>
              <span className="text-gray-700">Add authentication system</span>
            </li>
          </ul>
        </div>

        {/* Info */}
        <p className="text-center text-gray-500 text-sm mt-8">
          Flyer Builder v0.1 - Phase 1 in progress
        </p>
      </main>
    </div>
  )
}
