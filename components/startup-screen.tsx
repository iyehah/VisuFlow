"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Database, Upload, Github, FileJson, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/langs/language-provider"
import { ModeToggle } from "@/components/themes/mode-toggle"
import { LanguageToggle } from "@/components/langs/language-toggle"

export default function StartupScreen() {
  const router = useRouter()
  const { t } = useLanguage()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (selectedFile) {
      setIsLoading(true)

      // Store the file name in localStorage to access it in the app demo
      localStorage.setItem("dbFileName", selectedFile.name)

      // Read the file as ArrayBuffer and store it in localStorage
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          // Convert ArrayBuffer to Base64 string for storage
          const base64 = btoa(
            new Uint8Array(event.target.result as ArrayBuffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              "",
            ),
          )
          localStorage.setItem("dbFileContent", base64)

          // Navigate to the demo
          router.push("/demo")
        }
      }
      reader.readAsArrayBuffer(selectedFile)
    } else {
      // If no file is selected, just navigate to the demo
      router.push("/demo")
    }
  }

  const handleDemoClick = () => {
    // Clear any existing database
    localStorage.removeItem("dbFileName")
    localStorage.removeItem("dbFileContent")

    // Navigate to the demo with demo mode
    localStorage.setItem("demoMode", "true")
    router.push("/demo")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="container mx-auto py-4 px-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {/* //! Logo */}
          <h1 className="text-xl text-primary font-bold">{t("appTitle")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ModeToggle />
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl"
        >
          <div className="mb-8 flex items-center justify-center">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">{t("welcomeTitle")}</h1>
          <p className="text-xl text-muted-foreground mb-8">{t("welcomeDescription")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="bg-card border rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">{t("getStarted")}</h2>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept=".db,.sqlite,.sqlite3"
                  onChange={handleFileChange}
                  className="hidden"
                  id="db-file-input"
                />
                <label htmlFor="db-file-input" className="cursor-pointer block">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium">{t("dropDatabase")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("supportedFormats")}</p>
                </label>
              </div>

              {selectedFile && (
                <div className="bg-muted p-3 rounded-md flex items-center justify-between">
                  <div className="flex items-center">
                    <Database className="h-5 w-5 mr-2 text-primary" />
                    <span className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedFile(null)}>
                    {t("remove")}
                  </Button>
                </div>
              )}

              <Button className="w-full" onClick={handleUpload} disabled={isLoading}>
                {isLoading ? t("loading") : selectedFile ? t("openDatabase") : t("continueWithoutFile")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* <Button variant="outline" className="flex-1 py-6" onClick={handleDemoClick}>
              <Database className="mr-2 h-5 w-5" />
              {t("tryDemo")}
            </Button> */}

            <a href="https://github.com/iyehah/VisuFlow" target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="outline" className="w-full py-6">
                <Github className="mr-2 h-5 w-5" />
                {t("viewSource")}
              </Button>
            </a>
          </div>
        </motion.div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <div className="container mx-auto"><span>Developed by </span>
          <a
            href="https://iyehah.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
           iyehah
          </a>
        </div>
      </footer>
    </div>
  )
}
