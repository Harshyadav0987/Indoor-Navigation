import { useState, useEffect, useMemo } from "react"
import { MAPS, SELECTABLE_TYPES, API_BASE } from "../constants/maps"
import {
  mapKeyFromNode,
  estimateDistance,
  getPathMapKeys,
  getPathSegmentsOnFloor,
} from "../utils/mapHelpers"

/**
 * useNavigation — manages all navigation state and logic.
 * Keeps NavMap.jsx clean by separating data/logic from UI.
 */
export function useNavigation() {
  const [nodes, setNodes]           = useState([])
  const [edges, setEdges]           = useState([])
  const [from, setFrom]             = useState(null)
  const [to, setTo]                 = useState(null)
  const [path, setPath]             = useState([])
  const [pathNodes, setPathNodes]   = useState([])
  const [error, setError]           = useState("")
  const [loading, setLoading]       = useState(false)
  const [step, setStep]             = useState("from")
  const [selectMode, setSelectMode] = useState(false)
  const [activeMapKey, setActiveMapKey] = useState("G")

  // Fetch nodes and edges once on mount
  useEffect(() => {
    fetch(`${API_BASE}/nodes`).then(r => r.json()).then(setNodes)
    fetch(`${API_BASE}/edges`).then(r => r.json()).then(setEdges)
  }, [])

  // Nodes filtered to current floor
  const nodesOnActiveMap = useMemo(
    () => nodes.filter(n => mapKeyFromNode(n) === activeMapKey),
    [nodes, activeMapKey]
  )

  // Only selectable node types (no raw corridors)
  const selectableNodes = useMemo(
    () => nodes.filter(n => SELECTABLE_TYPES.includes(n.type)),
    [nodes]
  )

  // Resolved path node objects from path IDs
  const pathNodeObjects = useMemo(() => {
    if (pathNodes.length) return pathNodes.filter(Boolean)
    return path.map(id => nodes.find(n => n.id === id)).filter(Boolean)
  }, [pathNodes, path, nodes])

  // Path segments visible on current floor
  const pathSegmentsOnActiveMap = useMemo(
    () => getPathSegmentsOnFloor(pathNodeObjects, activeMapKey),
    [pathNodeObjects, activeMapKey]
  )

  // Map keys the route passes through
  const pathMapKeys = useMemo(
    () => getPathMapKeys(pathNodeObjects),
    [pathNodeObjects]
  )

  // Stops to show in route panel (skip plain corridors)
  const pathStops = useMemo(
    () => pathNodeObjects.filter(n => n && SELECTABLE_TYPES.includes(n.type)),
    [pathNodeObjects]
  )

  // Estimated walking distance and time
  const estimate = useMemo(
    () => estimateDistance(pathNodeObjects, edges),
    [pathNodeObjects, edges]
  )

  // ── Core navigation API call ──────────────────────────────────────
  async function navigate(fromNode, toNode) {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(
        `${API_BASE}/nodes/navigate?from=${encodeURIComponent(fromNode.id)}&to=${encodeURIComponent(toNode.id)}`
      )
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setPath([]); setPathNodes([])
      } else {
        setPath(data.path || [])
        setPathNodes(data.pathNodes || [])
        setActiveMapKey(mapKeyFromNode(fromNode))
      }
    } catch {
      setError("Server error — is the backend running?")
    }
    setLoading(false)
  }

  // ── Handle node click in select mode ─────────────────────────────
  async function handleNodeClick(node) {
    if (!selectMode) return
    if (!SELECTABLE_TYPES.includes(node.type)) return

    if (step === "from") {
      setFrom(node)
      setPath([]); setPathNodes([]); setError("")
      setStep("to")
      setActiveMapKey(mapKeyFromNode(node))
      if (to && to.id !== node.id) {
        setSelectMode(false)
        setStep("from")
        await navigate(node, to)
      }
    } else {
      if (node.id === from?.id) return
      setTo(node)
      setSelectMode(false)
      setStep("from")
      setActiveMapKey(mapKeyFromNode(node))
      await navigate(from, node)
    }
  }

  // ── Handle search result selection ───────────────────────────────
  async function handleSearchSelect(node, searchFor) {
    const settingFrom = searchFor === "from" || !from

    if (settingFrom) {
      setFrom(node)
      setPath([]); setPathNodes([]); setError("")
      setActiveMapKey(mapKeyFromNode(node))
      if (to && to.id !== node.id) {
        await navigate(node, to)
      }
      return "to" // tell search hook to switch to "to" next
    } else {
      setTo(node)
      setActiveMapKey(mapKeyFromNode(node))
      if (from && from.id !== node.id) {
        await navigate(from, node)
      } else {
        setStep("from"); setSelectMode(true)
      }
      return "to"
    }
  }

  // ── Clear all state ───────────────────────────────────────────────
  function handleClear() {
    setFrom(null); setTo(null)
    setPath([]); setPathNodes([]); setError("")
    setStep("from"); setSelectMode(false)
    setActiveMapKey("G")
  }

  // ── Toggle select mode ────────────────────────────────────────────
  function handleSelectToggle() {
    setSelectMode(prev => {
      if (!prev) {
        // Entering select mode — reset to pick from
        setStep("from")
        setFrom(null); setTo(null)
        setPath([]); setPathNodes([]); setError("")
      }
      return !prev
    })
  }

  return {
    // Data
    nodes, edges,
    // Route state
    from, setFrom,
    to, setTo,
    path, error, loading,
    step, setStep,
    selectMode, setSelectMode,
    activeMapKey, setActiveMapKey,
    // Derived
    nodesOnActiveMap,
    selectableNodes,
    pathNodeObjects,
    pathSegmentsOnActiveMap,
    pathMapKeys,
    pathStops,
    estimate,
    // Handlers
    navigate,
    handleNodeClick,
    handleSearchSelect,
    handleClear,
    handleSelectToggle,
  }
}
