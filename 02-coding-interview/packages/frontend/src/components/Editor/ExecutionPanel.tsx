import { useState } from 'react'
import type { ExecutionResult } from '@interview/shared'

interface ExecutionPanelProps {
  result: ExecutionResult | null
  onExecute: () => void
  isExecuting?: boolean
}

export default function ExecutionPanel({ result, onExecute, isExecuting }: ExecutionPanelProps) {
  const [activeTab, setActiveTab] = useState<'output' | 'error'>('output')

  return (
    <div className="h-full flex flex-col bg-gray-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-white">Output</h3>
        <button
          onClick={() => onExecute()}
          disabled={isExecuting}
          className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
        >
          {isExecuting ? 'Running...' : 'Run Code'}
        </button>
      </div>

      {result && (
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('output')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'output'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Output
          </button>
          {result.error && (
            <button
              onClick={() => setActiveTab('error')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'error'
                  ? 'text-white border-b-2 border-red-500'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Error
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        {!result ? (
          <div className="text-gray-500 text-sm">
            <p>Press "Run Code" or use Cmd/Ctrl + Enter to execute your code.</p>
            <div className="mt-4 text-xs">
              <p className="font-semibold mb-2">Keyboard Shortcuts:</p>
              <ul className="space-y-1">
                <li>• Cmd/Ctrl + Enter: Run code</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'output' && (
              <div>
                {result.output ? (
                  <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                    {result.output}
                  </pre>
                ) : (
                  <div className="text-gray-500 text-sm">No output</div>
                )}
                <div className="mt-4 text-xs text-gray-500">
                  Execution time: {result.executionTime}ms
                </div>
              </div>
            )}
            {activeTab === 'error' && result.error && (
              <pre className="text-sm text-red-400 font-mono whitespace-pre-wrap">
                {result.error}
              </pre>
            )}
          </>
        )}
      </div>
    </div>
  )
}
