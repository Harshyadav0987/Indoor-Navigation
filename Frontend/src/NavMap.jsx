import { useState, useEffect, useRef, useLayoutEffect } from "react"
import { createPortal } from "react-dom"
import { MapContainer, ImageOverlay, CircleMarker, Polyline, Tooltip, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "./NavMap.css"

const MAP_WIDTH = 4642
const MAP_HEIGHT = 3924
const bounds = [[0, 0], [MAP_HEIGHT, MAP_WIDTH]]

function findClosestNode(nodes, latlng) {
  let closest = null
  let minDist = Infinity
  nodes.forEach(node => {
    const dx = node.x - latlng.lng
    const dy = node.y - latlng.lat
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < minDist) { minDist = dist; closest = node }
  })
  return minDist < 600 ? closest : null
}

function MapClickHandler({ nodes, onNodeClick, active }) {
  useMapEvents({
    click(e) {
      if (!active) return
      const closest = findClosestNode(nodes, e.latlng)
      if (closest) onNodeClick(closest)
    }
  })
  return null
}

export default function NavMap() {
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [from, setFrom] = useState(null)
  const [to, setTo] = useState(null)
  const [path, setPath] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState("from")
  const [selectMode, setSelectMode] = useState(false)
  const [search, setSearch] = useState("")
  const searchGroupRef = useRef(null)
  const [dropdownRect, setDropdownRect] = useState(null)

  useEffect(() => {
    fetch("http://localhost:5000/api/nodes").then(r => r.json()).then(setNodes)
    fetch("http://localhost:5000/api/edges").then(r => r.json()).then(setEdges)
  }, [])

  const selectableNodes = nodes.filter(n =>
    ["room", "lab", "washroom", "faculty", "stairs"].includes(n.type)
  )

  async function handleNodeClick(node) {
    if (!selectMode) return
    if (!["room", "lab", "washroom", "faculty", "stairs"].includes(node.type)) return

    if (step === "from") {
      setFrom(node)
      setTo(null)
      setPath([])
      setError("")
      setStep("to")
      // stay in select mode so user can immediately pick destination
    } else {
      if (node.id === from?.id) return
      setTo(node)
      setSelectMode(false)
      setStep("from")
      await navigate(from, node)
    }
  }

  async function navigate(fromNode, toNode) {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(
        `http://localhost:5000/api/nodes/navigate?from=${encodeURIComponent(fromNode.id)}&to=${encodeURIComponent(toNode.id)}`
      )
      const data = await res.json()
      if (data.error) { setError(data.error); setPath([]) }
      else setPath(data.path)
    } catch {
      setError("Server error!")
    }
    setLoading(false)
  }

  function handleClear() {
    setFrom(null); setTo(null)
    setPath([]); setError("")
    setStep("from"); setSelectMode(false)
  }

  function handleSelectToggle() {
    setSelectMode(prev => !prev)
    // if turning on, reset to from step
    if (!selectMode) {
      setStep("from")
      setFrom(null); setTo(null)
      setPath([]); setError("")
    }
  }

  const isInPath = (id) => path.includes(id)

  function isEdgeInPath(edge) {
    for (let i = 0; i < path.length - 1; i++) {
      if (
        (path[i] === edge.from && path[i + 1] === edge.to) ||
        (path[i] === edge.to && path[i + 1] === edge.from)
      ) return true
    }
    return false
  }

  const pathStops = path
    .map(id => nodes.find(n => n.id === id))
    .filter(n => n && ["room", "lab", "washroom", "faculty", "stairs"].includes(n.type))

  const searchResults = search.trim()
    ? selectableNodes
        .filter(n => {
          const q = search.toLowerCase()
          const hay = `${n.label} ${n.id}`.toLowerCase()
          return hay.includes(q)
        })
        .slice(0, 8)
    : []

  useLayoutEffect(() => {
    if (searchResults.length === 0) {
      setDropdownRect(null)
      return
    }
    const el = searchGroupRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setDropdownRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 220)
    })
  }, [searchResults.length, search])

  async function handleDestinationSelect(node) {
    setTo(node)
    setSearch("")
    if (from && from.id !== node.id) {
      await navigate(from, node)
    } else {
      setStep("from")
      setSelectMode(true)
    }
  }

  return (
    <>
      {/* TOP BAR */}
      <div className="topbar">
        <div className="logo">
          <div className="logo-icon">🏛</div>
          MITS Nav
        </div>

        <div className="topbar-divider" />

        {/* FROM card */}
        <div className={`step-card ${selectMode && step === "from" ? "active" : from ? "filled" : ""}`}>
          <div className="step-badge from">A</div>
          <div className="step-text">
            <span className="step-hint">From</span>
            <span className={`step-value ${!from ? "placeholder" : ""}`}>
              {from ? from.label : "Not selected"}
            </span>
          </div>
        </div>

        <div className="arrow">→</div>

        {/* TO card */}
        <div className={`step-card ${selectMode && step === "to" ? "active" : to ? "filled" : ""}`}>
          <div className="step-badge to">B</div>
          <div className="step-text">
            <span className="step-hint">To</span>
            <span className={`step-value ${!to ? "placeholder" : ""}`}>
              {to ? to.label : "Not selected"}
            </span>
          </div>
        </div>

        {/* Destination search */}
        <div className="search-group" ref={searchGroupRef}>
          <input
            className="search-input"
            type="text"
            placeholder="Search destination (e.g. LT2, J032)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Dropdown rendered over map via portal */}
        {searchResults.length > 0 && dropdownRect && createPortal(
          <div
            className="search-results search-results-portal"
            style={{
              position: "fixed",
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width
            }}
          >
            {searchResults.map(node => (
              <button
                key={node.id}
                type="button"
                className="search-result-row"
                onClick={() => handleDestinationSelect(node)}
              >
                <span className="search-result-label">{node.label}</span>
                <span className="search-result-meta">{node.id}</span>
              </button>
            ))}
          </div>,
          document.body
        )}

        {/* Select on Map button — always visible */}
        <button
          className={`btn-select ${selectMode ? "active" : ""}`}
          onClick={handleSelectToggle}
        >
          {selectMode
            ? step === "from" ? "🟢 Click your location" : "🔴 Click destination"
            : "📍 Select on Map"}
        </button>

        {/* Clear — only when something is selected */}
        {(from || to || path.length > 0) && (
          <button className="btn-clear" onClick={handleClear}>✕ Clear</button>
        )}

        {/* Status chips */}
        {loading && <div className="status-chip chip-loading">🔍 Finding route...</div>}
        {error && <div className="status-chip chip-error">⚠ {error}</div>}
        {path.length > 0 && !loading && !error && (
          <div className="status-chip chip-success">✓ Route found</div>
        )}
        {!selectMode && !from && !loading && !error && path.length === 0 && (
          <div className="status-chip chip-hint">Press "Select on Map" to begin</div>
        )}
      </div>

      {/* Floating hint when in select mode */}
      {selectMode && (
        <div className="select-hint">
          {step === "from" ? "📍 Click anywhere near your starting location" : "🏁 Click anywhere near your destination"}
        </div>
      )}

      {/* MAP */}
      <div className={`map-wrap ${selectMode ? "selecting" : ""}`}>
        <MapContainer
          crs={L.CRS.Simple}
          bounds={bounds}
          style={{ height: "100%", width: "100%" }}
          maxZoom={2}
          minZoom={-3}
          zoom={-2}
        >
          <ImageOverlay url="/ground_floor.png" bounds={bounds} />
          <MapClickHandler
            nodes={selectableNodes}
            onNodeClick={handleNodeClick}
            active={selectMode}
          />

          {/* White outline behind path */}
          {edges.map((edge, i) => {
            const f = nodes.find(n => n.id === edge.from)
            const t = nodes.find(n => n.id === edge.to)
            if (!f || !t || !isEdgeInPath(edge)) return null
            return (
              <Polyline
                key={`outline-${i}`}
                positions={[[f.y, f.x], [t.y, t.x]]}
                color="#fff"
                weight={12}
                opacity={0.3}
                lineCap="round"
                lineJoin="round"
              />
            )
          })}

          {/* Blue path */}
          {edges.map((edge, i) => {
            const f = nodes.find(n => n.id === edge.from)
            const t = nodes.find(n => n.id === edge.to)
            if (!f || !t || !isEdgeInPath(edge)) return null
            return (
              <Polyline
                key={`path-${i}`}
                positions={[[f.y, f.x], [t.y, t.x]]}
                color="#4A90E2"
                weight={8}
                opacity={0.9}
                lineCap="round"
                lineJoin="round"
              />
            )
          })}

          {/* From / To markers only */}
          {from && (
            <CircleMarker
              center={[from.y, from.x]}
              radius={12}
              pathOptions={{ color: "#fff", fillColor: "#22C55E", fillOpacity: 1, weight: 3 }}
            >
              <Tooltip permanent direction="top" offset={[0, -14]}>
                📍 {from.label}
              </Tooltip>
            </CircleMarker>
          )}

          {to && (
            <CircleMarker
              center={[to.y, to.x]}
              radius={12}
              pathOptions={{ color: "#fff", fillColor: "#EF4444", fillOpacity: 1, weight: 3 }}
            >
              <Tooltip permanent direction="top" offset={[0, -14]}>
                🏁 {to.label}
              </Tooltip>
            </CircleMarker>
          )}
        </MapContainer>
      </div>

      {/* ROUTE PANEL */}
      {pathStops.length > 0 && (
        <div className="route-panel">
          <div className="route-title">📍 Route — {pathStops.length} stops</div>
          {pathStops.map((node, i) => {
            const isStart = i === 0
            const isEnd = i === pathStops.length - 1
            return (
              <div className="route-stop" key={node.id}>
                <div className="route-stop-left">
                  <div className={`stop-dot ${isStart ? "start" : isEnd ? "end" : ""}`} />
                  {i < pathStops.length - 1 && <div className="stop-line" />}
                </div>
                <div className={`stop-label ${isStart ? "start" : isEnd ? "end" : ""}`}>
                  {node.label}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}