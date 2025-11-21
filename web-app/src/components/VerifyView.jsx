import { useState, useEffect } from 'react'
import { getPendingVerification, verifySentence } from '../api'

export default function VerifyView() {
  const [sentences, setSentences] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [verifying, setVerifying] = useState(null)

  useEffect(() => {
    fetchPending()
  }, [])

  const fetchPending = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getPendingVerification()
      setSentences(data.sentences || [])
    } catch (err) {
      setError('Failed to load pending sentences: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (sentenceId, verdict) => {
    setVerifying(sentenceId)

    try {
      await verifySentence(sentenceId, verdict, null, 'Web User')

      // Remove from list
      setSentences(prev => prev.filter(s => s.id !== sentenceId))

      // Show success feedback
      if (sentences.length === 1) {
        // Last one verified
        setTimeout(fetchPending, 1000)
      }
    } catch (err) {
      setError('Failed to verify: ' + err.message)
    } finally {
      setVerifying(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pending verifications...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800">❌ {error}</p>
        <button
          onClick={fetchPending}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (sentences.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-xl font-bold text-green-900 mb-2">
          All Caught Up!
        </h3>
        <p className="text-green-700 mb-4">
          No sentences need verification right now.
        </p>
        <button
          onClick={fetchPending}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          🔄 Check Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ✅ Verify Inferred Sentences
        </h2>
        <p className="text-gray-600">
          {sentences.length} sentence{sentences.length !== 1 ? 's' : ''} pending verification
        </p>
      </div>

      {/* Sentence Cards */}
      <div className="space-y-4">
        {sentences.map(sentence => (
          <div
            key={sentence.id}
            className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-400"
          >
            {/* Soussou */}
            <div className="mb-4">
              <p className="text-lg font-semibold text-gray-900 mb-1">
                "{sentence.soussou}"
              </p>
              <p className="text-sm text-gray-600">
                🇫🇷 {sentence.french}
              </p>
              {sentence.english && (
                <p className="text-sm text-gray-600">
                  🇬🇧 {sentence.english}
                </p>
              )}
            </div>

            {/* Pattern Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-900">
                  Pattern: <span className="font-mono font-semibold">{sentence.pattern}</span>
                </span>
                <span className="text-blue-700">
                  Confidence: {Math.round(sentence.confidence_score * 100)}%
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => handleVerify(sentence.id, 'correct')}
                disabled={verifying === sentence.id}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifying === sentence.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Verifying...
                  </>
                ) : (
                  <>✓ Correct</>
                )}
              </button>
              <button
                onClick={() => handleVerify(sentence.id, 'wrong')}
                disabled={verifying === sentence.id}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                ✗ Wrong
              </button>
              <button
                disabled={verifying === sentence.id}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:cursor-not-allowed"
              >
                → Skip
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">ℹ️ About Verification</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• These sentences were auto-generated by pattern inference</li>
          <li>• Your verification helps improve ZION's pattern understanding</li>
          <li>• Mark "Correct" if the sentence is natural and accurate</li>
          <li>• Mark "Wrong" if it's unnatural or contains errors</li>
        </ul>
      </div>
    </div>
  )
}
