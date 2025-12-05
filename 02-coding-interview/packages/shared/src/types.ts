// Session types
export interface InterviewSession {
  id: string
  createdAt: Date
  updatedAt: Date
  expiresAt: Date | null
  language: string
  code: string
}

// User types
export interface User {
  id: string
  username: string
  joinedAt: number
}

// WebSocket event types
export interface JoinSessionPayload {
  sessionId: string
  username?: string
}

export interface CursorChangePayload {
  sessionId: string
  position: {
    lineNumber: number
    column: number
  }
  selection?: {
    startLineNumber: number
    startColumn: number
    endLineNumber: number
    endColumn: number
  }
}

export interface LanguageChangePayload {
  sessionId: string
  language: string
}

export interface UserJoinedPayload {
  userId: string
  username?: string
  users: User[]
}

export interface UserLeftPayload {
  userId: string
  users: User[]
}

// Code execution types
export interface ExecutionRequest {
  code: string
  language: string
}

export interface ExecutionResult {
  output?: string
  error?: string
  executionTime: number
}

// Supported languages
export type SupportedLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'go' | 'rust' | 'cpp'

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  'javascript',
  'typescript',
  'python',
  'java',
  'go',
  'rust',
  'cpp'
]
