"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import JsonTreeViewer from "@/components/json/json-viewer"
import GithubTreeViewer from "@/components/project/github-viewer"
import SqliteViewer from "@/components/db/sqlite-viewer"
import { ModeToggle } from "@/components/themes/mode-toggle"
import { LanguageToggle } from "@/components/langs/language-toggle"
import { useLanguage } from "@/components/langs/language-provider"
import { Maximize2, Minimize2, Database, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import LoadingScreen from "@/components/loading-screen"

export default function MainApp() {
  const [activeTab, setActiveTab] = useState("sqlite")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [dbFileName, setDbFileName] = useState<string | null>(null)
  const { t } = useLanguage()
  const router = useRouter()

  useEffect(() => {
    // Check if we have a database file
    const fileName = localStorage.getItem("dbFileName")
    setDbFileName(fileName)

    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const goHome = () => {
    router.push("/")
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div
      className={`container mx-auto py-10 transition-all duration-300 ${isFullscreen ? "fixed inset-0 z-40 p-4 bg-background" : ""}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            {/* //! Logo */}
            <h1 className="text-3xl text-primary font-bold tracking-tight">{t("appTitle")}</h1>
            {dbFileName && <span className="text-sm text-muted-foreground ml-2">({dbFileName})</span>}
          </div>
          <p className="text-muted-foreground max-w-[700px]">{t("appDescription")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goHome} title={t("backToHome")}>
            <Home className="h-4 w-4" />
          </Button>
          <LanguageToggle />
          <ModeToggle />
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? t("exitFullscreen") : t("enterFullscreen")}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <Tabs defaultValue="sqlite" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sqlite">{t("sqliteDbTab")}</TabsTrigger>
            <TabsTrigger value="json">{t("jsonTreeTab")}</TabsTrigger>
            <TabsTrigger value="github">{t("githubProjectTab")}</TabsTrigger>
          </TabsList>
          <Card className="mt-6">
            <CardContent className="pt-6">
              <TabsContent value="sqlite" className="mt-0">
                <SqliteViewer />
              </TabsContent>
              <TabsContent value="json" className="mt-0">
                <JsonTreeViewer />
              </TabsContent>
              <TabsContent value="github" className="mt-0">
                <GithubTreeViewer />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
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
