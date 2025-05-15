type GithubTreeItem = {
  path: string
  mode: string
  type: string
  sha: string
  size?: number
  url: string
}

type GithubTree = {
  sha: string
  url: string
  tree: GithubTreeItem[]
  truncated: boolean
}

const GITHUB_API_URL = process.env.GITHUB_API_URL || 'https://api.github.com';

export async function fetchGithubRepo(repoUrl: string) {
  try {
    // Extract owner and repo from URL
    const urlParts = repoUrl.replace(/\/$/, "").split("/")
    const owner = urlParts[urlParts.length - 2]
    const repo = urlParts[urlParts.length - 1]

    if (!owner || !repo) {
      throw new Error("Invalid GitHub repository URL")
    }

    // Get the default branch
    const repoResponse = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}`)

    if (!repoResponse.ok) {
      throw new Error(`Failed to fetch repository: ${repoResponse.statusText}`)
    }

    const repoData = await repoResponse.json()
    const defaultBranch = repoData.default_branch

    // Get the tree recursively
    const treeResponse = await fetch(
      `${GITHUB_API_URL}/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
    )

    if (!treeResponse.ok) {
      throw new Error(`Failed to fetch repository tree: ${treeResponse.statusText}`)
    }

    const treeData: GithubTree = await treeResponse.json()

    // Transform the flat tree into a nested structure
    return transformTreeData(treeData.tree)
  } catch (error) {
    console.error("Error fetching GitHub repository:", error)
    throw error
  }
}

function transformTreeData(treeItems: GithubTreeItem[]) {
  const root: Record<string, any> = {}

  // Sort items to ensure directories come before files
  const sortedItems = [...treeItems].sort((a, b) => {
    if (a.type === "tree" && b.type !== "tree") return -1
    if (a.type !== "tree" && b.type === "tree") return 1
    return a.path.localeCompare(b.path)
  })

  for (const item of sortedItems) {
    const pathParts = item.path.split("/")
    let current = root

    // Navigate through the path parts
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i]
      const isLastPart = i === pathParts.length - 1

      if (isLastPart) {
        if (item.type === "tree") {
          // It's a directory
          if (!current[part]) {
            current[part] = {}
          }
        } else {
          // It's a file
          current[part] = {
            type: "file",
            size: item.size || 0,
            sha: item.sha,
          }
        }
      } else {
        // It's an intermediate directory
        if (!current[part]) {
          current[part] = {}
        }
        current = current[part]
      }
    }
  }

  return root
}