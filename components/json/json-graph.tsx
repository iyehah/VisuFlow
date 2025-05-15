"use client"

import { useEffect, useRef, useState } from "react"
import ReactFlow, {
  Background,
  Controls,
  type Edge,
  type Node,
  type NodeTypes,
  useEdgesState,
  useNodesState,
  Panel,
} from "reactflow"
import "reactflow/dist/style.css"
import { JsonNode } from "./json-node"
import { useTheme } from "next-themes"

// Define custom node types
const nodeTypes: NodeTypes = {
  jsonNode: JsonNode,
}

type JsonTreeGraphProps = {
  data: any
}

export default function JsonTreeGraph({ data }: JsonTreeGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [initialized, setInitialized] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const isDarkMode = theme === "dark"

  useEffect(() => {
    if (!data || initialized) return

    // Process the JSON data to create nodes and edges
    const { nodes: processedNodes, edges: processedEdges } = processJsonData(data)
    setNodes(processedNodes)
    setEdges(processedEdges)
    setInitialized(true)
  }, [data, initialized, setNodes, setEdges])

  // Process JSON data to create nodes and edges for ReactFlow
  const processJsonData = (jsonData: any) => {
    const nodes: Node[] = []
    const edges: Edge[] = []
    let nodeId = 0

    // Create root node
    const rootId = `node-${nodeId++}`
    nodes.push({
      id: rootId,
      type: "jsonNode",
      position: { x: 0, y: 0 },
      data: { label: "Root", value: null, type: "object", expanded: true, theme: isDarkMode ? "dark" : "light" },
    })

    // Process the JSON object recursively
    processObject(jsonData, rootId, 1)

    // Arrange nodes in a tree layout
    arrangeNodesInTreeLayout(nodes)

    return { nodes, edges }

    // Helper function to process objects recursively
    function processObject(obj: any, parentId: string, depth: number) {
      const entries = Object.entries(obj)
      let yOffset = 0

      entries.forEach(([key, value], index) => {
        const currentId = `node-${nodeId++}`
        const valueType = getValueType(value)
        const isExpandable = valueType === "object" || valueType === "array"

        // Create node
        nodes.push({
          id: currentId,
          type: "jsonNode",
          position: { x: depth * 250, y: yOffset },
          data: {
            label: key,
            value: valueType === "primitive" ? value : null,
            type: valueType,
            expanded: depth < 3, // Auto-expand first few levels
            theme: isDarkMode ? "dark" : "light",
          },
        })

        // Create edge from parent to this node
        edges.push({
          id: `edge-${parentId}-${currentId}`,
          source: parentId,
          target: currentId,
          type: "smoothstep",
        })

        // If it's an object or array, process its children
        if (isExpandable && value !== null) {
          processObject(value, currentId, depth + 1)
        }

        yOffset += 80 // Vertical spacing between nodes
      })
    }

    // Helper function to determine value type
    function getValueType(value: any): "object" | "array" | "primitive" {
      if (value === null) return "primitive"
      if (Array.isArray(value)) return "array"
      if (typeof value === "object") return "object"
      return "primitive"
    }

    // Arrange nodes in a tree layout
    function arrangeNodesInTreeLayout(nodes: Node[]) {
      // This is a simplified tree layout algorithm
      // For a real implementation, you might want to use a more sophisticated algorithm

      // First, create a map of parent-child relationships
      const childrenMap: Record<string, string[]> = {}

      edges.forEach((edge) => {
        if (!childrenMap[edge.source]) {
          childrenMap[edge.source] = []
        }
        childrenMap[edge.source].push(edge.target)
      })

      // Then, position each node based on its depth and position among siblings
      const rootNode = nodes.find((node) => node.id === rootId)
      if (!rootNode) return

      // Position the root node
      rootNode.position = { x: 50, y: 50 }

      // Position all other nodes
      const positionNode = (
        nodeId: string,
        x: number,
        y: number,
        horizontalSpacing: number,
        verticalSpacing: number,
      ) => {
        const children = childrenMap[nodeId] || []
        let currentY = y

        children.forEach((childId, index) => {
          const childNode = nodes.find((node) => node.id === childId)
          if (childNode) {
            childNode.position = { x: x + horizontalSpacing, y: currentY }

            // Position this child's children
            const childrenCount = positionNode(
              childId,
              x + horizontalSpacing,
              currentY,
              horizontalSpacing,
              verticalSpacing,
            )

            // Update y for the next sibling
            currentY += childrenCount * verticalSpacing
          }
        })

        // Return the number of nodes in this subtree (including this node)
        return Math.max(1, children.length)
      }

      positionNode(rootId, 50, 50, 250, 80)
    }
  }

  return (
    <div ref={wrapperRef} className="h-[500px] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background color={"currentColor"} gap={16} />
        <Controls />
        <Panel position="top-right" className="bg-background p-2 rounded shadow-md">
          <div className="text-xs text-muted-foreground">Drag to pan • Scroll to zoom • Drag nodes to reposition</div>
        </Panel>
      </ReactFlow>
    </div>
  )
}
