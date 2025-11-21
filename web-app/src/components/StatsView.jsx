import { useState, useEffect } from 'react'
import { getStats } from '../api'

export default function StatsView() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStats()
    // Refresh every 10 seconds
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const data = await getStats()
      setStats(data)
      setError(null)
    } catch (err) {
      setError('Failed to load stats: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading statistics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800">❌ {error}</p>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  const verificationRate = stats?.corpus.total_sentences > 0
    ? Math.round((stats.corpus.verified_sentences / stats.corpus.total_sentences) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">📊 ZION Corpus Statistics</h2>
        <p className="text-sm text-gray-600">
          Last updated: {stats ? new Date(stats.last_updated).toLocaleString() : 'N/A'}
        </p>
      </div>

      {/* Corpus Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Sentence Corpus</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Sentences"
            value={stats?.corpus.total_sentences || 0}
            color="blue"
            icon="📝"
          />
          <StatCard
            label="Verified"
            value={stats?.corpus.verified_sentences || 0}
            color="green"
            icon="✅"
            subtitle={`${verificationRate}% verified`}
          />
          <StatCard
            label="Contributors"
            value={stats?.corpus.contributors || 0}
            color="purple"
            icon="👥"
          />
          <StatCard
            label="Top Contributor"
            value={stats?.corpus.top_contributor || 'None'}
            color="yellow"
            icon="🏆"
            isText
          />
        </div>
      </div>

      {/* Lexicon Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📖 Lexicon</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Total Words"
            value={stats?.lexicon.total_words || 0}
            color="indigo"
            icon="🔤"
          />
          <StatCard
            label="Verified Words"
            value={stats?.lexicon.verified_words || 0}
            color="green"
            icon="✓"
          />
          <StatCard
            label="Verification Rate"
            value={stats?.lexicon.verification_rate || '0%'}
            color="orange"
            icon="📊"
            isText
          />
        </div>
      </div>

      {/* Pattern Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Pattern Discovery</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            label="Pattern Templates"
            value={stats?.templates.total_patterns || 0}
            color="pink"
            icon="🧩"
          />
          <StatCard
            label="Auto-Discovered"
            value={stats?.templates.auto_discovered || 0}
            color="teal"
            icon="🤖"
          />
        </div>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={fetchStats}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          🔄 Refresh Stats
        </button>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, icon, subtitle, isText = false }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
    pink: 'bg-pink-50 border-pink-200 text-pink-900',
    teal: 'bg-teal-50 border-teal-200 text-teal-900'
  }

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-medium opacity-75">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${isText ? 'text-sm truncate' : ''}`}>
        {isText ? String(value) : Number(value).toLocaleString()}
      </div>
      {subtitle && (
        <div className="text-xs opacity-75 mt-1">{subtitle}</div>
      )}
    </div>
  )
}
