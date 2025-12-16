interface ExecutionResult {
  output?: string
  error?: string
  executionTime: number
}

// Piston API language mapping
const PISTON_LANGUAGES: Record<string, { language: string; version: string }> = {
  javascript: { language: 'javascript', version: '18.15.0' },
  typescript: { language: 'typescript', version: '5.0.3' },
  python: { language: 'python', version: '3.10.0' },
  java: { language: 'java', version: '15.0.2' },
  go: { language: 'go', version: '1.16.2' },
  rust: { language: 'rust', version: '1.68.2' },
  cpp: { language: 'c++', version: '10.2.0' }
}

const PISTON_API_URL = 'https://emkc.org/api/v2/piston'

// Simple delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function executeCode(code: string, language: string): Promise<ExecutionResult> {
  const langConfig = PISTON_LANGUAGES[language.toLowerCase()]

  if (!langConfig) {
    return {
      error: `Unsupported language: ${language}`,
      executionTime: 0
    }
  }

  const startTime = Date.now()

  try {
    // For Java, the filename must be Main.java and class must be Main
    const filename = language.toLowerCase() === 'java' ? 'Main.java' : `code.${getExtension(language)}`

    // Retry logic for rate limiting
    let response: Response | null = null
    let lastError = ''

    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        await delay(300) // Wait 300ms between retries
      }

      response = await fetch(`${PISTON_API_URL}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          language: langConfig.language,
          version: langConfig.version,
          files: [
            {
              name: filename,
              content: code
            }
          ],
          run_timeout: 10000 // 10 seconds max
        })
      })

      if (response.ok || response.status !== 429) {
        break
      }

      lastError = await response.text()
    }

    const executionTime = Date.now() - startTime

    if (!response || !response.ok) {
      const errorText = response ? await response.text() : lastError
      return {
        error: `Execution service error: ${response?.status || 'unknown'} - ${errorText}`,
        executionTime
      }
    }

    const result = (await response.json()) as {
      run?: { stdout?: string; stderr?: string; code?: number; signal?: string; output?: string }
    }

    // Piston returns { run: { stdout, stderr, code, signal, output } }
    const run = result.run || {}
    const stdout = run.stdout || ''
    const stderr = run.stderr || ''
    const exitCode = run.code

    if (exitCode === 0) {
      return {
        output: stdout || undefined,
        error: stderr || undefined,
        executionTime
      }
    } else {
      return {
        error: stderr || stdout || 'Execution failed',
        output: stdout || undefined,
        executionTime
      }
    }
  } catch (error) {
    const executionTime = Date.now() - startTime
    return {
      error: error instanceof Error ? error.message : 'Failed to execute code',
      executionTime
    }
  }
}

function getExtension(language: string): string {
  const extensions: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    java: 'java',
    go: 'go',
    rust: 'rs',
    cpp: 'cpp'
  }
  return extensions[language.toLowerCase()] || 'txt'
}

// Helper function to validate code before execution
export function validateCode(code: string, language: string): { valid: boolean; error?: string } {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: 'Code cannot be empty' }
  }

  if (code.length > 50000) {
    return { valid: false, error: 'Code is too long (max 50KB)' }
  }

  const langConfig = PISTON_LANGUAGES[language.toLowerCase()]
  if (!langConfig) {
    return { valid: false, error: `Unsupported language: ${language}` }
  }

  return { valid: true }
}
