import { loadPyodide, type PyodideInterface } from 'pyodide'

interface ExecutionResult {
  output?: string
  error?: string
  executionTime: number
}

class CodeExecutionService {
  private pyodide: PyodideInterface | null = null
  private pyodideLoading: Promise<PyodideInterface> | null = null

  /**
   * Initialize Pyodide (lazy loading)
   */
  private async initPyodide(): Promise<PyodideInterface> {
    if (this.pyodide) {
      return this.pyodide
    }

    if (this.pyodideLoading) {
      return this.pyodideLoading
    }

    this.pyodideLoading = loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.0/full/',
    })

    this.pyodide = await this.pyodideLoading
    this.pyodideLoading = null

    return this.pyodide
  }

  /**
   * Execute JavaScript code in browser
   */
  private async executeJavaScript(code: string): Promise<ExecutionResult> {
    const startTime = performance.now()

    // Capture console output
    const logs: string[] = []
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn

    console.log = (...args) => {
      logs.push(args.map(arg => String(arg)).join(' '))
      originalLog(...args)
    }
    console.error = (...args) => {
      logs.push('Error: ' + args.map(arg => String(arg)).join(' '))
      originalError(...args)
    }
    console.warn = (...args) => {
      logs.push('Warning: ' + args.map(arg => String(arg)).join(' '))
      originalWarn(...args)
    }

    try {
      // Use Function constructor to execute code in isolated scope
      // This is safer than eval() but still sandboxed in browser
      const fn = new Function(code)
      const result = fn()

      // If function returned something, add it to output
      if (result !== undefined) {
        logs.push(String(result))
      }

      const executionTime = performance.now() - startTime

      return {
        output: logs.join('\n'),
        executionTime: Math.round(executionTime)
      }
    } catch (error: any) {
      const executionTime = performance.now() - startTime
      return {
        error: error.message || String(error),
        executionTime: Math.round(executionTime)
      }
    } finally {
      // Restore console methods
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  }

  /**
   * Execute Python code using Pyodide (WASM)
   */
  private async executePython(code: string): Promise<ExecutionResult> {
    const startTime = performance.now()

    try {
      const pyodide = await this.initPyodide()

      // Redirect stdout/stderr to capture output
      await pyodide.runPythonAsync(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
`)

      // Execute the user code
      await pyodide.runPythonAsync(code)

      // Get the captured output
      const stdout = await pyodide.runPythonAsync('sys.stdout.getvalue()')
      const stderr = await pyodide.runPythonAsync('sys.stderr.getvalue()')

      const executionTime = performance.now() - startTime

      const output = stdout || stderr || ''

      if (stderr) {
        return {
          error: stderr,
          executionTime: Math.round(executionTime)
        }
      }

      return {
        output,
        executionTime: Math.round(executionTime)
      }
    } catch (error: any) {
      const executionTime = performance.now() - startTime

      // Parse Python error messages to make them more readable
      let errorMessage = error.message || String(error)

      // Extract the actual Python error from Pyodide's wrapper
      if (errorMessage.includes('PythonError:')) {
        errorMessage = errorMessage.split('PythonError:')[1].trim()
      }

      return {
        error: errorMessage,
        executionTime: Math.round(executionTime)
      }
    }
  }

  /**
   * Execute code in the browser based on language
   */
  async executeCode(code: string, language: string): Promise<ExecutionResult> {
    const normalizedLanguage = language.toLowerCase()

    switch (normalizedLanguage) {
      case 'javascript':
      case 'typescript': // TypeScript will be treated as JavaScript
        return this.executeJavaScript(code)

      case 'python':
        return this.executePython(code)

      default:
        return {
          error: `Browser execution not supported for ${language}. Only JavaScript and Python are supported for secure in-browser execution.`,
          executionTime: 0
        }
    }
  }

  /**
   * Check if Pyodide is loaded
   */
  isPyodideLoaded(): boolean {
    return this.pyodide !== null
  }

  /**
   * Preload Pyodide for better UX
   */
  async preloadPyodide(): Promise<void> {
    try {
      await this.initPyodide()
      console.log('Pyodide preloaded successfully')
    } catch (error) {
      console.error('Failed to preload Pyodide:', error)
    }
  }
}

// Export singleton instance
export const codeExecutionService = new CodeExecutionService()

// Export types
export type { ExecutionResult }
