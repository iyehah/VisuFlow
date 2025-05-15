"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, AlertCircle } from "lucide-react"
import JsonTreeGraph from "@/components/json/json-graph"
import { useLanguage } from "@/components/langs/language-provider"

export default function JsonViewer() {
  const [jsonInput, setJsonInput] = useState("")
  const [jsonData, setJsonData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { t } = useLanguage()

  // Add example JSON for package.json
  const loadExampleJson = () => {
    const exampleJson = `{
  "name": "jsontree",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "prepare": "husky install"
  },
  "dependencies": {
    "@headlessui/react": "^1.7.15",
    "@monaco-editor/react": "^4.5.1",
    "@tailwindcss/forms": "^0.5.4",
    "@types/node": "20.3.2",
    "@types/react": "18.2.14",
    "@types/react-dom": "18.2.6",
    "autoprefixer": "10.4.14",
    "eslint": "8.43.0",
    "eslint-config-next": "13.4.7",
    "html-to-image": "^1.11.11",
    "json5-parser": "^2.0.0",
    "lodash.debounce": "^4.0.8",
    "lodash.get": "^4.4.2",
    "next": "13.4.7",
    "postcss": "8.4.24",
    "prettier": "^2.8.8",
    "prettier-plugin-tailwindcss": "^0.3.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-zoom-pan-pinch": "^3.1.0",
    "reactflow": "^11.7.4",
    "tailwindcss": "^3.3.2",
    "typescript": "5.1.6",
    "zustand": "^4.3.9"
  },
  "devDependencies": {
    "@types/lodash.debounce": "^4.0.7",
    "husky": "^8.0.3",
    "lint-staged": "^13.2.3"
  }
}`
    setJsonInput(exampleJson)
    try {
      const parsed = JSON.parse(exampleJson)
      setJsonData(parsed)
      setError(null)
    } catch (err) {
      setError("Error parsing example JSON.")
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        setJsonInput(content)
        const parsed = JSON.parse(content)
        setJsonData(parsed)
        setError(null)
      } catch (err) {
        setError("Invalid JSON file. Please check the format and try again.")
        setJsonData(null)
      }
    }
    reader.readAsText(file)
  }

  const handleParse = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      setJsonData(parsed)
      setError(null)
    } catch (err) {
      setError("Invalid JSON. Please check the format and try again.")
      setJsonData(null)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value)
    setError(null)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Textarea
            placeholder="Paste your JSON here..."
            className="min-h-[300px] font-mono text-sm"
            value={jsonInput}
            onChange={handleInputChange}
          />
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={handleParse}>{t("parseJson")}</Button>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                aria-label="Upload JSON file"
              />
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                {t("uploadJson")}
              </Button>
            </div>
            <Button variant="outline" onClick={loadExampleJson}>
              {t("loadExample")}
            </Button>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        <div className="border rounded-md p-4 min-h-[300px] overflow-auto">
          {jsonData ? (
            <JsonTreeGraph data={jsonData} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              JSON visualization will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
