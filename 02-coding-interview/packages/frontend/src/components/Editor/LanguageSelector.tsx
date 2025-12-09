import { SUPPORTED_LANGUAGES } from '@interview/shared'

interface LanguageSelectorProps {
  value: string
  onChange: (language: string) => void
}

const languageLabels: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  go: 'Go'
}

export default function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="language" className="text-sm text-gray-400">
        Language:
      </label>
      <select
        id="language"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-gray-700 text-white px-3 py-1.5 rounded text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {languageLabels[lang] || lang}
          </option>
        ))}
      </select>
    </div>
  )
}
