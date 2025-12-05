import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { existsSync } from 'fs'

const execAsync = promisify(exec)

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
    timeout: 10000
  },
  python: {
    image: 'python:3.11-alpine',
    command: (file: string) => `python ${file}`,
    extension: 'py',
    timeout: 5000
  },
  java: {
    image: 'openjdk:17-alpine',
    command: (file: string) => {
      const className = file.replace('.java', '')
      return `javac ${file} && java ${className}`
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

  const executionId = randomUUID()
  const filename = language === 'java' ? 'Main.java' : `code_${executionId}.${config.extension}`
  const tempDir = join('/tmp', `exec_${executionId}`)
  const filepath = join(tempDir, filename)

  const startTime = Date.now()

  try {
    // Create temp directory
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true })
    }

    // Write code to temp file
    await writeFile(filepath, code)

    // Execute in Docker container with resource limits
    // For Go and Rust, we need exec permissions in /tmp for compiled binaries
    const tmpfsOptions = ['go', 'rust', 'cpp'].includes(language.toLowerCase())
      ? '--tmpfs /tmp:rw,exec,nosuid,size=100m'
      : '--tmpfs /tmp:rw,noexec,nosuid,size=10m'

    // Compiled languages need more CPU for fast compilation
    const cpuLimit = ['go', 'rust', 'cpp', 'java'].includes(language.toLowerCase())
      ? '--cpus=1.0'
      : '--cpus=0.5'

    const dockerCommand = `docker run --rm \
      --memory=128m \
      ${cpuLimit} \
      --network=none \
      --read-only \
      ${tmpfsOptions} \
      -v "${tempDir}:/workspace:ro" \
      -w /workspace \
      ${config.image} \
      timeout ${Math.floor((config.timeout || 5000) / 1000)}s sh -c "${config.command(filename)}"`

    const { stdout, stderr } = await execAsync(dockerCommand, {
      timeout: (config.timeout || 5000) + 2000, // Add 2s buffer for Docker overhead
      maxBuffer: 1024 * 1024 // 1MB output limit
    })

    const executionTime = Date.now() - startTime

    return {
      output: stdout || undefined,
      error: stderr || undefined,
      executionTime
    }

  } catch (error: any) {
    const executionTime = Date.now() - startTime

    // Handle timeout
    if (error.killed || error.signal === 'SIGTERM') {
      return {
        error: 'Execution timeout: Code took too long to execute',
        executionTime
      }
    }

    // Handle execution errors
    return {
      error: error.stderr || error.stdout || error.message || 'Execution failed',
      executionTime
    }
  } finally {
    // Clean up temp files
    try {
      await unlink(filepath)
      // Remove temp directory
      await execAsync(`rm -rf "${tempDir}"`)
    } catch (e) {
      console.error('Failed to cleanup temp files:', e)
    }
  }
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
