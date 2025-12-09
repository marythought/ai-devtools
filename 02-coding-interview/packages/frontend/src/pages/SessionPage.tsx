import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import MonacoEditor from '../components/Editor/MonacoEditor'
import LanguageSelector from '../components/Editor/LanguageSelector'
import ExecutionPanel from '../components/Editor/ExecutionPanel'
import UserPresence from '../components/Session/UserPresence'
import ShareLink from '../components/Session/ShareLink'
import { useWebSocket } from '../hooks/useWebSocket'
import { getDefaultCode } from '../utils/codeTemplates'
import type { ExecutionResult } from '@interview/shared'

export default function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [language, setLanguage] = useState('javascript')
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [userName, setUserName] = useState<string>('')
  const editorRef = useRef<any>(null)

  // Get or prompt for user name
  useEffect(() => {
    const storedName = localStorage.getItem('interview-username')
    if (storedName) {
      setUserName(storedName)
    } else {
      const name = prompt('Please enter your name:')?.trim() || 'Anonymous'
      setUserName(name)
      localStorage.setItem('interview-username', name)
    }
  }, [])

  const { socket, isConnected, users } = useWebSocket(sessionId!, userName)

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

  // Set default code when editor is mounted or language changes
  useEffect(() => {
    if (editorRef.current) {
      const currentCode = editorRef.current.getValue()
      // Only set default code if editor is empty
      if (!currentCode || currentCode.trim().length === 0) {
        editorRef.current.setValue(getDefaultCode(language))
      }
    }
  }, [language])

  function handleLanguageChange(newLanguage: string) {
    if (!editorRef.current) {
      setLanguage(newLanguage)
      socket?.emit('language-change', { sessionId, language: newLanguage })
      return
    }

    const currentCode = editorRef.current.getValue()
    const hasCode = currentCode && currentCode.trim().length > 0

    if (hasCode) {
      const confirmed = window.confirm(
        'Do you want to change the language? Your current code will be lost.'
      )
      if (!confirmed) {
        return
      }
    }

    setLanguage(newLanguage)
    socket?.emit('language-change', { sessionId, language: newLanguage })

    // Set default code for new language
    editorRef.current.setValue(getDefaultCode(newLanguage))
  }

  function handleChangeName() {
    const newName = prompt('Enter your name:', userName)?.trim()
    if (newName && newName !== userName) {
      setUserName(newName)
      localStorage.setItem('interview-username', newName)
      // Reconnect with new name
      window.location.reload()
    }
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
      // Execute code via backend Docker service
      const response = await fetch(`/api/sessions/${sessionId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code, language })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to execute code')
      }

      const result = await response.json()
      setExecutionResult(result)
    } catch (error) {
      console.error('Error executing code:', error)
      setExecutionResult({
        error: error instanceof Error ? error.message : 'Failed to execute code',
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
          <UserPresence users={users} isConnected={isConnected} onChangeName={handleChangeName} />
          <ShareLink sessionId={sessionId} />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1">
          <MonacoEditor
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
