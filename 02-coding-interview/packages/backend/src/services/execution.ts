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

    const response = await fetch(`${PISTON_API_URL}/execute`, {
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

    const executionTime = Date.now() - startTime

    if (!response.ok) {
      const errorText = await response.text()
      return {
        error: `Execution service error: ${response.status} - ${errorText}`,
        executionTime
      }
    }

    const result = await response.json()

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

  const config = LANGUAGE_CONFIGS[language.toLowerCase()]
  if (!config) {
    return { valid: false, error: `Unsupported language: ${language}` }
  }

  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /require\s*\(\s*['"]child_process['"]\s*\)/i,
    /import\s+subprocess/i,
    /Runtime\.getRuntime\(\)/i,
    /system\s*\(/i,
    /eval\s*\(/i,
    /exec\s*\(/i,
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      return {
        valid: false,
        error: 'Code contains potentially dangerous operations that are not allowed'
      }
    }
  }

  return { valid: true }
}
