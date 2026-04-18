import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl">⚡</span>
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Get Started
          </h1>
          
          <p className="text-lg text-slate-600 mb-8">
            Edit <code className="px-2 py-1 bg-slate-200 rounded text-sm font-mono">src/App.tsx</code> and save to test HMR
          </p>

          <button
            onClick={() => setCount((count) => count + 1)}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
          >
            Count is {count}
          </button>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>

      {/* Cards Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Documentation Card */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-8">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Documentation</h2>
            <p className="text-slate-600 mb-6">Your questions, answered</p>
            <ul className="space-y-3">
              <li>
                <a href="https://vite.dev/" target="_blank" className="text-blue-600 hover:text-blue-700 hover:underline">
                  Explore Vite →
                </a>
              </li>
              <li>
                <a href="https://react.dev/" target="_blank" className="text-blue-600 hover:text-blue-700 hover:underline">
                  Learn React →
                </a>
              </li>
            </ul>
          </div>

          {/* Social Card */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-8">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🌐</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Connect with us</h2>
            <p className="text-slate-600 mb-6">Join the Vite community</p>
            <div className="flex flex-wrap gap-2">
              <a href="https://github.com/vitejs/vite" target="_blank" 
                 className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors">
                GitHub
              </a>
              <a href="https://chat.vite.dev/" target="_blank"
                 className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors">
                Discord
              </a>
              <a href="https://x.com/vite_js" target="_blank"
                 className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors">
                X.com
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default App