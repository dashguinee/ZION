import { useState } from 'react'
import { addSentence, detectPattern } from '../api'

export default function ContributeView() {
  const [formData, setFormData] = useState({
    soussou: '',
    french: '',
    english: '',
    cultural_context: ''
  })
  const [detecting, setDetecting] = useState(false)
  const [pattern, setPattern] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Clear pattern if Soussou changes
    if (name === 'soussou') {
      setPattern(null)
    }
  }

  const handleDetectPattern = async () => {
    if (!formData.soussou.trim()) return

    setDetecting(true)
    setError(null)

    try {
      const detected = await detectPattern(formData.soussou)
      setPattern(detected)
    } catch (err) {
      setError('Failed to detect pattern: ' + err.message)
    } finally {
      setDetecting(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.soussou.trim() || !formData.french.trim()) {
      setError('Soussou and French translations are required')
      return
    }

    setSubmitting(true)
    setError(null)
    setResult(null)

    try {
      const data = await addSentence({
        ...formData,
        contributed_by: 'Web User'
      })

      setResult(data)
      // Clear form
      setFormData({
        soussou: '',
        french: '',
        english: '',
        cultural_context: ''
      })
      setPattern(null)
    } catch (err) {
      setError('Failed to save: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Teach a Soussou Sentence
        </h2>
        <p className="text-gray-600 mb-6">
          Share your knowledge! Every sentence helps ZION learn.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Soussou Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Soussou Sentence *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="soussou"
                value={formData.soussou}
                onChange={handleChange}
                placeholder="I kena! Tana mu a ra?"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={handleDetectPattern}
                disabled={!formData.soussou.trim() || detecting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {detecting ? '🔍...' : '🔍 Detect'}
              </button>
            </div>
          </div>

          {/* Pattern Detection Result */}
          {pattern && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Pattern Detected: {pattern.pattern}
              </p>
              <p className="text-xs text-blue-700">
                Template: {pattern.template} • Confidence: {Math.round(pattern.confidence * 100)}%
              </p>
            </div>
          )}

          {/* French Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              French Translation *
            </label>
            <input
              type="text"
              name="french"
              value={formData.french}
              onChange={handleChange}
              placeholder="Bonjour! Comment ça va?"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          {/* English Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              English Translation (optional)
            </label>
            <input
              type="text"
              name="english"
              value={formData.english}
              onChange={handleChange}
              placeholder="Good morning! How are you?"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Cultural Context */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cultural Context (optional)
            </label>
            <textarea
              name="cultural_context"
              value={formData.cultural_context}
              onChange={handleChange}
              placeholder="When do people say this? Who uses it? Any special meaning?"
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">❌ {error}</p>
            </div>
          )}

          {/* Success Message */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm font-medium text-green-900 mb-1">
                ✅ Saved! Sentence ID: {result.id}
              </p>
              <p className="text-xs text-green-700">
                Pattern: {result.detected_pattern} ({Math.round(result.confidence * 100)}%) •
                Today: {result.stats?.today || 0} • Total: {result.stats?.total || 0}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {submitting ? '💾 Saving...' : '💾 Save Sentence'}
          </button>
        </form>
      </div>

      {/* Quick Tips */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-900 mb-2">💡 Quick Tips</h3>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Use the "Detect" button to see ZION's pattern understanding</li>
          <li>• Code-switching (mixing Soussou + French) is perfectly natural!</li>
          <li>• Add cultural context to help others understand when to use phrases</li>
          <li>• Every contribution makes ZION smarter!</li>
        </ul>
      </div>
    </div>
  )
}
