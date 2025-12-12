import { spawn } from 'child_process'

interface ExecutionResult {
  output?: string
  error?: string
  executionTime: number
}

interface LanguageConfig {
  image: string
  command: (file: string) => string
  extension: string
  timeout?: number
}

const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  javascript: {
    image: 'node:20-alpine',
    command: (file: string) => `node ${file}`,
    extension: 'js',
    timeout: 5000
  },
  typescript: {
    image: 'node:20-alpine',
    command: (file: string) => `npx -y tsx ${file}`,
    extension: 'ts',
    timeout: 15000
  },
  python: {
    image: 'python:3.11-alpine',
    command: (file: string) => `python ${file}`,
    extension: 'py',
    timeout: 5000
  },
  java: {
    image: 'eclipse-temurin:17-jdk',
    command: (file: string) => {
      const className = file.replace('.java', '')
      // Compile to /tmp (writable) then run from there
      return `javac -d /tmp ${file} && java -cp /tmp ${className}`
    },
    extension: 'java',
    timeout: 10000
  },
  go: {
    image: 'golang:1.21-alpine',
    command: (file: string) => `GOCACHE=/tmp/.cache go build -o /tmp/program ${file} && /tmp/program`,
    extension: 'go',
    timeout: 10000
  },
  rust: {
    image: 'rust:1.75-alpine',
    command: (file: string) => `rustc ${file} -o /tmp/program && /tmp/program`,
    extension: 'rs',
    timeout: 15000
  },
  cpp: {
    image: 'gcc:13-alpine',
    command: (file: string) => `g++ ${file} -o /tmp/program && /tmp/program`,
    extension: 'cpp',
    timeout: 10000
  }
}

export async function executeCode(code: string, language: string): Promise<ExecutionResult> {
  const config = LANGUAGE_CONFIGS[language.toLowerCase()]

  if (!config) {
    throw new Error(`Unsupported language: ${language}`)
  }

  const filename = language === 'java' ? 'Main.java' : `code.${config.extension}`

  const startTime = Date.now()

  // For Go, Rust, C++, and Java, we need exec permissions in /tmp for compiled binaries/classes
  const tmpfsTmpOptions = ['go', 'rust', 'cpp', 'java'].includes(language.toLowerCase())
    ? '/tmp:rw,exec,nosuid,size=100m'
    : '/tmp:rw,noexec,nosuid,size=10m'

  // Compiled languages need more CPU for fast compilation
  const cpuLimit = ['go', 'rust', 'cpp', 'java'].includes(language.toLowerCase())
    ? '--cpus=1.0'
    : '--cpus=0.5'

  // TypeScript needs network access to download tsx on first run
  const networkOption = language.toLowerCase() === 'typescript' ? '' : '--network=none'

  // TypeScript needs writable filesystem for npm cache
  const readOnlyOption = language.toLowerCase() === 'typescript' ? '' : '--read-only'

  // Escape code for shell - use base64 to avoid escaping issues
  const base64Code = Buffer.from(code).toString('base64')

  // Write code inside container using base64 decode, then execute
  const innerCommand = `echo '${base64Code}' | base64 -d > /workspace/${filename} && ${config.command(`/workspace/${filename}`)}`

  // Build args array, splitting flags properly
  const dockerArgs: string[] = [
    'run', '--rm',
    '--memory=256m',
    cpuLimit,
  ]

  if (networkOption) dockerArgs.push(networkOption)
  if (readOnlyOption) dockerArgs.push(readOnlyOption)

  // Add tmpfs options
  dockerArgs.push('--tmpfs', tmpfsTmpOptions)
  dockerArgs.push('--tmpfs', '/workspace:rw,exec,size=10m')
  dockerArgs.push('-w', '/workspace')
  dockerArgs.push(config.image)
  dockerArgs.push('timeout', `${Math.floor((config.timeout || 5000) / 1000)}s`)
  dockerArgs.push('sh', '-c', innerCommand)

  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    let killed = false

    const proc = spawn('docker', dockerArgs, {
      timeout: (config.timeout || 5000) + 2000
    })

    proc.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    const timeoutId = setTimeout(() => {
      killed = true
      proc.kill('SIGTERM')
    }, (config.timeout || 5000) + 2000)

    proc.on('close', (exitCode) => {
      clearTimeout(timeoutId)
      const executionTime = Date.now() - startTime

      console.log('Execution output:', { stdout: stdout?.length || 0, stderr: stderr?.length || 0, exitCode })

      if (killed) {
        resolve({
          error: 'Execution timeout: Code took too long to execute',
          executionTime
        })
      } else if (exitCode === 0) {
        resolve({
          output: stdout || undefined,
          error: stderr || undefined,
          executionTime
        })
      } else {
        resolve({
          error: stderr || stdout || 'Execution failed',
          executionTime
        })
      }
    })

    proc.on('error', (error) => {
      clearTimeout(timeoutId)
      const executionTime = Date.now() - startTime
      resolve({
        error: error.message || 'Execution failed',
        executionTime
      })
    })
  })
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
