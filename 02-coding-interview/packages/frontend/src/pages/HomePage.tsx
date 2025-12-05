import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const [isCreating, setIsCreating] = useState(false)
  const navigate = useNavigate()

  async function handleCreateSession() {
    setIsCreating(true)
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'javascript' })
      })
      const data = await response.json()
      navigate(`/session/${data.sessionId}`)
    } catch (error) {
      console.error('Failed to create session:', error)
      alert('Failed to create session')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full px-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Coding Interview Platform
          </h1>
          <p className="text-gray-400">
            Create a collaborative coding session and share it with candidates
          </p>
        </div>

        <button
          onClick={handleCreateSession}
          disabled={isCreating}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          {isCreating ? 'Creating Session...' : 'Create New Session'}
        </button>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Features:</p>
          <ul className="mt-2 space-y-1">
            <li>Real-time collaborative editing</li>
            <li>Multi-language support</li>
            <li>Live code execution</li>
            <li>User presence indicators</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
