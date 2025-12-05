import { useRef, MutableRefObject } from 'react'
import Editor, { Monaco } from '@monaco-editor/react'

interface MonacoEditorProps {
  sessionId: string
  language: string
  onExecute?: () => void
  editorRef?: MutableRefObject<any>
}

export default function MonacoEditor({ sessionId, language, onExecute, editorRef: parentEditorRef }: MonacoEditorProps) {
  const localEditorRef = useRef<any>(null)
  const editorRef = parentEditorRef || localEditorRef

  function handleEditorDidMount(editor: any, monaco: Monaco) {
    editorRef.current = editor

    // Add keyboard shortcut for code execution (Cmd/Ctrl + Enter)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onExecute?.()
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
