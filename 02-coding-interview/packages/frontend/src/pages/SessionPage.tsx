import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import MonacoEditor from '../components/Editor/MonacoEditor'
import LanguageSelector from '../components/Editor/LanguageSelector'
import ExecutionPanel from '../components/Editor/ExecutionPanel'
import UserPresence from '../components/Session/UserPresence'
import ShareLink from '../components/Session/ShareLink'
import { useWebSocket } from '../hooks/useWebSocket'
import type { ExecutionResult } from '@interview/shared'

export default function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [language, setLanguage] = useState('javascript')
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const editorRef = useRef<any>(null)

  const { socket, isConnected, users } = useWebSocket(sessionId!, 'Anonymous')

  useEffect(() => {
    async function loadSession() {
      if (!sessionId) return
      try {
        const response = await fetch(`/api/sessions/${sessionId}`)
        if (response.ok) {
          const session = await response.json()
          setLanguage(session.language)
        }
      } catch (error) {
        console.error('Error loading session:', error)
      }
    }
    loadSession()
  }, [sessionId])

  function handleLanguageChange(newLanguage: string) {
    setLanguage(newLanguage)
    socket?.emit('language-change', { sessionId, language: newLanguage })
  }

  async function handleExecute() {
    if (!sessionId || !editorRef.current) return

    const code = editorRef.current.getValue()

    if (!code || code.trim().length === 0) {
      setExecutionResult({
        error: 'No code to execute',
        executionTime: 0
      })
      return
    }

    setIsExecuting(true)
    setExecutionResult(null)

    try {
      const response = await fetch(`/api/sessions/${sessionId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      })

      if (response.ok) {
        const result = await response.json()
        setExecutionResult(result)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to execute code' }))
        setExecutionResult({
          error: errorData.error || 'Failed to execute code',
          executionTime: 0
        })
      }
    } catch (error) {
      console.error('Error executing code:', error)
      setExecutionResult({
        error: 'Network error: Failed to execute code',
        executionTime: 0
      })
    } finally {
      setIsExecuting(false)
    }
  }

  if (!sessionId) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Invalid session ID</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <header className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">Coding Interview</h1>
          <LanguageSelector value={language} onChange={handleLanguageChange} />
        </div>
        <div className="flex items-center gap-4">
          <UserPresence users={users} isConnected={isConnected} />
          <ShareLink sessionId={sessionId} />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1">
          <MonacoEditor
            sessionId={sessionId}
            language={language}
            onExecute={handleExecute}
            editorRef={editorRef}
          />
        </div>

        <div className="w-96 border-l border-gray-700">
          <ExecutionPanel
            result={executionResult}
            onExecute={handleExecute}
            isExecuting={isExecuting}
          />
        </div>
      </div>
    </div>
  )
}
