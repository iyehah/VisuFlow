import { memo } from "react"
import { Handle, Position } from "reactflow"

type JsonNodeProps = {
  data: {
    label: string
    value: any
    type: "object" | "array" | "primitive"
    expanded: boolean
    theme: "light" | "dark"
  }
  isConnectable: boolean
}

export const JsonNode = memo(({ data, isConnectable }: JsonNodeProps) => {
  const { label, value, type, theme } = data
  const isDark = theme === "dark"

  // Format the value for display
  const displayValue = () => {
    if (value === null) return "null"
    if (value === undefined) return "undefined"
    if (typeof value === "string") return `"${value}"`
    return String(value)
  }

  // Determine node color based on type and theme
  const getNodeColor = () => {
    if (isDark) {
      switch (type) {
        case "object":
          return "bg-blue-950 border-blue-800"
        case "array":
          return "bg-purple-950 border-purple-800"
        default:
          return "bg-gray-950 border-gray-800"
      }
    } else {
      switch (type) {
        case "object":
          return "bg-blue-800 border-blue-600"
        case "array":
          return "bg-purple-800 border-purple-600"
        default:
          return "bg-gray-800 border-gray-600"
      }
    }
  }

  // Determine value color based on type
  const getValueColor = () => {
    if (value === null) return "text-gray-400"
    if (typeof value === "string") return "text-green-400"
    if (typeof value === "number") return "text-yellow-400"
    if (typeof value === "boolean") return "text-purple-400"
    return "text-blue-400"
  }

  return (
    <div className={`rounded-md border px-4 py-2 shadow-md ${getNodeColor()}`} style={{ minWidth: "150px" }}>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="!bg-gray-400" />

      <div className="flex flex-col">
        <div className="font-medium text-white">{label}</div>

        {type === "primitive" && <div className={`text-sm ${getValueColor()}`}>{displayValue()}</div>}

        {(type === "object" || type === "array") && (
          <div className="text-sm text-gray-300">{type === "object" ? "{ ... }" : "[ ... ]"}</div>
        )}
      </div>

      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="!bg-gray-400" />
    </div>
  )
})

JsonNode.displayName = "JsonNode"
