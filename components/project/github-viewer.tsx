"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { fetchGithubRepo } from "@/lib/github-api"
import JsonTreeGraph from "@/components/json/json-graph"
import { useLanguage } from "@/components/langs/language-provider"

export default function GithubViewer() {
  const [repoUrl, setRepoUrl] = useState("")
  const [repoStructure, setRepoStructure] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { t } = useLanguage()

  // Add example repo
  const loadExampleRepo = async () => {
    const exampleUrl = "https://github.com/iyehah/VisuFlow"
    setRepoUrl(exampleUrl)
    await handleFetch(exampleUrl)
  }

  const handleFetch = async (url = repoUrl) => {
    if (!url) {
      setError("Please enter a GitHub repository URL")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await fetchGithubRepo(url)
      setRepoStructure(data)
    } catch (err) {
      setError("Error fetching repository. Please check the URL and try again.")
      setRepoStructure(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Enter GitHub repository URL (e.g., https://github.com/user/repo)"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          className="flex-1 min-w-[200px]"
        />
        <Button onClick={() => handleFetch()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {t("fetchRepo")}
        </Button>
        <Button variant="outline" onClick={loadExampleRepo} disabled={loading}>
          {t("loadExample")}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="border rounded-md p-4 min-h-[500px] overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-white">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Fetching repository structure...
          </div>
        ) : repoStructure ? (
          <JsonTreeGraph data={repoStructure} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Repository visualization will appear here
          </div>
        )}
      </div>
    </div>
  )
}
