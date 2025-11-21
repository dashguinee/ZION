import { useState } from 'react'
import ContributeView from './components/ContributeView'
import StatsView from './components/StatsView'
import VerifyView from './components/VerifyView'

function App() {
  const [activeTab, setActiveTab] = useState('contribute')

  const tabs = [
    { id: 'contribute', label: '🇬🇳 Contribute', icon: '✏️' },
    { id: 'stats', label: 'Statistics', icon: '📊' },
    { id: 'verify', label: 'Verify', icon: '✅' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-4 border-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🇬🇳 ZION Learning Platform
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Building the future of Soussou language AI
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">User #1</p>
              <p className="text-xs text-green-600 font-semibold">Contributing</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'contribute' && <ContributeView />}
        {activeTab === 'stats' && <StatsView />}
        {activeTab === 'verify' && <VerifyView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            ZION • Powering 7,000+ languages • Built with ❤️ in Guinea 🇬🇳
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
