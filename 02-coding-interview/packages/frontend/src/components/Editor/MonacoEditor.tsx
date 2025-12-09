import { useRef, useEffect, MutableRefObject } from 'react'
import Editor, { Monaco } from '@monaco-editor/react'

interface MonacoEditorProps {
  language: string
  onExecute?: () => void
  editorRef?: MutableRefObject<any>
}

export default function MonacoEditor({ language, onExecute, editorRef: parentEditorRef }: MonacoEditorProps) {
  const localEditorRef = useRef<any>(null)
  const editorRef = parentEditorRef || localEditorRef
  const monacoRef = useRef<Monaco | null>(null)

  function handleEditorDidMount(editor: any, monaco: Monaco) {
    editorRef.current = editor
    monacoRef.current = monaco

    // Add keyboard shortcut for code execution (Cmd/Ctrl + Enter)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onExecute?.()
    })

    // Configure TypeScript/JavaScript validation
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    })

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    })

    // Configure editor theme
    monaco.editor.defineTheme('interview-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
      }
    })
    monaco.editor.setTheme('interview-dark')
  }

  // Update the Monaco model when language changes
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const editor = editorRef.current
      const model = editor.getModel()
      if (model) {
        monacoRef.current.editor.setModelLanguage(model, language)
      }
    }
  }, [language, editorRef])

  return (
    <div className="h-full flex flex-col">
      <Editor
        height="100%"
        language={language}
        theme="interview-dark"
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          tabSize: 2,
          wordWrap: 'on',
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
    </div>
  )
}
