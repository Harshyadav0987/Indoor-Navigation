import { useState, useEffect } from "react"
import { MapContainer, ImageOverlay, CircleMarker, Polyline, Tooltip, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// ─── Config ──────────────────────────────────────────────────────
const FLOOR_SIZES = {
  0: { w: 4642, h: 3924 },
  1: { w: 1742, h: 2442 },
  2: { w: 1111, h: 912  },
  3: { w: 681,  h: 852  },
}

const FLOORS = [
  { label: "Ground Floor", value: 0 },
  { label: "1st Floor A",  value: 1 },
  { label: "1st Floor B",  value: 2 },
  { label: "2nd Floor",    value: 3 },
]

const FLOOR_MAPS = {
  0: "/ground_floor.png",
  1: "/first_floor_a.png",
  2: "/first_floor_b.png",
  3: "/second_floor.png",
}

const NODE_TYPES = ["room", "corridor", "stairs", "washroom", "lab", "garden", "faculty"]

// ─── Node type colors & icons ─────────────────────────────────────
const typeColors = {
  room:     "#2ecc71",
  corridor: "#3498db",
  stairs:   "#f39c12",
  washroom: "#9b59b6",
  lab:      "#1abc9c",
  garden:   "#27ae60",
  faculty:  "#e84393",
}

const typeIcons = {
  room:     "🚪",
  corridor: "🛤️",
  stairs:   "🪜",
  washroom: "🚻",
  lab:      "🔬",
  garden:   "🌿",
  faculty:  "👨‍🏫",
}

// ─── Modal Component ──────────────────────────────────────────────
function NodeModal({ latlng, floor, onConfirm, onCancel }) {
  const [label, setLabel] = useState("")
  const [type, setType]   = useState("room")
  const [error, setError] = useState("")

  function handleSubmit(e) {
    e.preventDefault()
    if (!label.trim()) { setError("Room ID is required"); return }
    onConfirm({ label: label.trim(), type })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
      <div className="bg-[#0D2045] border border-gold/25 rounded-2xl p-6 w-full max-w-[440px] shadow-[0_24px_60px_rgba(0,0,0,0.6)] font-sans text-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[15px] font-bold">📍 Place New Node</span>
          <button className="bg-transparent border-none text-white/40 cursor-pointer text-base py-0.5 px-1.5 rounded" onClick={onCancel}>✕</button>
        </div>

        {/* Coords info */}
        <div className="bg-gold/10 border border-gold/20 rounded-md px-2.5 py-1.5 text-[11px] font-mono text-gold mb-[18px]">
          x: {Math.round(latlng.lng)} · y: {Math.round(latlng.lat)} · Floor: {FLOORS.find(f => f.value === floor)?.label}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Room ID */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold tracking-[0.8px] uppercase text-white/45 mb-1.5">Room ID / Label</label>
            <input
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-[13px] font-sans outline-none box-border"
              type="text"
              placeholder="e.g. J014, FA_computer_lab"
              value={label}
              onChange={e => { setLabel(e.target.value); setError("") }}
              autoFocus
            />
            {error && <span className="text-[11px] text-[#f97373] mt-1 block">{error}</span>}
          </div>

          {/* Node Type */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold tracking-[0.8px] uppercase text-white/45 mb-1.5">Node Type</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
              {NODE_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  style={{
                    background: type === t ? typeColors[t] : "rgba(255,255,255,0.05)",
                    borderColor: type === t ? typeColors[t] : "rgba(255,255,255,0.1)",
                    color: type === t ? "#fff" : "rgba(255,255,255,0.6)",
                    fontWeight: type === t ? 700 : 400,
                  }}
                  className="px-1 py-[7px] border rounded-[7px] cursor-pointer text-[11px] transition-all text-center"
                  onClick={() => setType(t)}
                >
                  {typeIcons[t]} {t}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 mt-5 justify-end">
            <button type="button" className="px-[18px] py-2 bg-white/5 border border-white/10 rounded-lg text-white/60 text-[13px] cursor-pointer" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="px-[20px] py-2 bg-[#00b894] border-none rounded-lg text-white text-[13px] font-bold cursor-pointer shadow-[0_4px_14px_rgba(0,184,148,0.4)]">
              ✓ Place Node
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────
function DeleteModal({ node, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
      <div className="bg-[#0D2045] border border-gold/25 rounded-2xl p-6 w-full max-w-[360px] shadow-[0_24px_60px_rgba(0,0,0,0.6)] font-sans text-white">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[15px] font-bold">🗑️ Delete Node</span>
          <button className="bg-transparent border-none text-white/40 cursor-pointer text-base py-0.5 px-1.5 rounded" onClick={onCancel}>✕</button>
        </div>
        <p className="text-white/70 text-[14px] my-4">
          Are you sure you want to delete <b className="text-white">{node.label}</b>?
          <br />
          <span className="text-[12px] text-white/40 mt-1.5 block">
            All edges connected to this node will also be removed.
          </span>
        </p>
        <div className="flex gap-2.5 mt-5 justify-end">
          <button className="px-[18px] py-2 bg-white/5 border border-white/10 rounded-lg text-white/60 text-[13px] cursor-pointer" onClick={onCancel}>Cancel</button>
          <button
            className="px-[20px] py-2 bg-[#e74c3c] border-none rounded-lg text-white text-[13px] font-bold cursor-pointer shadow-[0_4px_14px_rgba(231,76,60,0.4)]"
            onClick={onConfirm}
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Click Handler ────────────────────────────────────────────────
function ClickHandler({ onMapClick }) {
  useMapEvents({ click(e) { onMapClick(e.latlng) } })
  return null
}

// ─── Main Component ───────────────────────────────────────────────
export default function AdminMap() {
  const [nodes, setNodes]           = useState([])
  const [edges, setEdges]           = useState([])
  const [mode, setMode]             = useState("node")
  const [selectedNode, setSelectedNode] = useState(null)
  const [floor, setFloor]           = useState(0)

  // Modal state
  const [pendingClick, setPendingClick] = useState(null)   // latlng waiting for modal
  const [deleteTarget, setDeleteTarget] = useState(null)   // node waiting for delete confirm

  const mapSize = FLOOR_SIZES[floor] || FLOOR_SIZES[0]
  const bounds  = [[0, 0], [mapSize.h, mapSize.w]]
  const currentNodes = nodes.filter(n => n.floor === floor)

  useEffect(() => {
    fetch("http://localhost:5000/api/nodes").then(r => r.json()).then(setNodes)
    fetch("http://localhost:5000/api/edges").then(r => r.json()).then(setEdges)
  }, [])

  function handleMapClick(latlng) {
    if (mode !== "node") return
    setPendingClick(latlng)
  }

  async function handleModalConfirm({ label, type }) {
    const newNode = {
      id: label, label,
      type,
      floor,
      x: Math.round(pendingClick.lng),
      y: Math.round(pendingClick.lat),
    }
    setPendingClick(null)

    const res = await fetch("http://localhost:5000/api/nodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newNode),
    })
    const saved = await res.json()
    setNodes(prev => [...prev, saved])
  }

  function handleNodeClick(node) {
    if (mode === "delete") {
      setDeleteTarget(node)
      return
    }

    if (mode !== "edge") return

    if (!selectedNode) {
      setSelectedNode(node)
    } else {
      saveEdge(selectedNode, node)
    }
  }

  async function saveEdge(nodeA, nodeB) {
    const dx = nodeB.x - nodeA.x
    const dy = nodeB.y - nodeA.y
    const weight = Math.round(Math.sqrt(dx * dx + dy * dy))
    const isStair = nodeA.type === "stairs" || nodeB.type === "stairs"
    const finalWeight = nodeA.floor !== nodeB.floor ? 200 : weight

    const newEdge = { from: nodeA.id, to: nodeB.id, weight: finalWeight, isStair }

    const res = await fetch("http://localhost:5000/api/edges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEdge),
    })
    const saved = await res.json()
    setEdges(prev => [...prev, saved])
    setSelectedNode(null)
  }

  async function handleDeleteConfirm() {
    const node = deleteTarget
    setDeleteTarget(null)
    await fetch(`http://localhost:5000/api/nodes?id=${encodeURIComponent(node.id)}`, { method: "DELETE" })
    setNodes(prev => prev.filter(n => n.id !== node.id))
    setEdges(prev => prev.filter(e => e.from !== node.id && e.to !== node.id))
  }

  const visibleEdges = edges.filter(edge => {
    const from = nodes.find(n => n.id === edge.from)
    const to   = nodes.find(n => n.id === edge.to)
    if (!from || !to) return false
    return from.floor === floor || to.floor === floor
  })

  function getNodeColor(node) {
    if (selectedNode?.id === node.id) return "#e74c3c"
    if (mode === "delete") return "#e74c3c"
    return typeColors[node.type] || "#2ecc71"
  }

  return (
    <div className="font-sans flex flex-col h-screen overflow-hidden">

      {/* ── Topbar ── */}
      <div className="bg-navy/98 text-white flex items-center overflow-x-auto gap-2.5 md:flex-wrap p-2 md:py-0 md:px-4 md:h-[62px] border-b border-gold/20 shrink-0 custom-scrollbar z-10 w-full overflow-y-hidden">
        <div className="flex items-center gap-2.5 shrink-0">
          <img src="/mits_logo.png" alt="MITS" className="w-8 h-8 rounded-full border-2 border-gold" />
          <div className="hidden md:block">
            <div className="font-bold text-[13px]">MITS Admin Tool</div>
            <div className="text-[10px] text-gold tracking-widest">NODE EDITOR</div>
          </div>
        </div>

        <div className="w-px h-7 bg-gold/20 shrink-0 hidden md:block" />

        {/* Floor tabs */}
        <div className="flex gap-1 p-[3px] bg-white/5 rounded-lg border border-gold/15 shrink-0">
          {FLOORS.map(f => (
            <button
              key={f.value}
              onClick={() => setFloor(f.value)}
              className={`px-3 py-1 border-none rounded-md cursor-pointer text-[12px] font-sans transition-all whitespace-nowrap ${
                floor === f.value 
                  ? "bg-gold text-navy font-bold shadow-sm" 
                  : "bg-transparent text-white/60 font-normal hover:bg-white/10 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="w-px h-7 bg-gold/20 shrink-0 hidden md:block" />

        {/* Mode buttons */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => { setMode("node"); setSelectedNode(null) }}
            className={`px-[14px] py-1.5 border-none rounded-md cursor-pointer text-white text-[12px] font-semibold transition-all whitespace-nowrap ${
              mode === "node" ? "bg-[#00b894] shadow-[0_4px_14px_rgba(0,184,148,0.4)]" : "bg-white/5"
            }`}
          >
            🟢 Node
          </button>
          <button
            onClick={() => { setMode("edge"); setSelectedNode(null) }}
            className={`px-[14px] py-1.5 border-none rounded-md cursor-pointer text-white text-[12px] font-semibold transition-all whitespace-nowrap ${
              mode === "edge" ? "bg-[#e17055] shadow-[0_4px_14px_rgba(225,112,85,0.4)]" : "bg-white/5"
            }`}
          >
            🔗 Edge
          </button>
          <button
            onClick={() => { setMode("delete"); setSelectedNode(null) }}
            className={`px-[14px] py-1.5 border-none rounded-md cursor-pointer text-white text-[12px] font-semibold transition-all whitespace-nowrap ${
              mode === "delete" ? "bg-[#e74c3c] shadow-[0_4px_14px_rgba(231,76,60,0.4)]" : "bg-white/5"
            }`}
          >
            🗑️ Delete
          </button>
        </div>

        {/* Stats */}
        <span className="text-white/50 text-[12px] ml-1 shrink-0">
          <b className="text-white">{currentNodes.length}</b> nodes ·{" "}
          <b className="text-white">{edges.length}</b> edges
        </span>

        {selectedNode && (
          <span className="text-[#fdcb6e] text-[12px] shrink-0 font-bold hidden md:inline ml-auto">
            ● Selected: {selectedNode.label}
          </span>
        )}

      </div>

      {/* ── Stair banner ── */}
      {mode === "edge" && selectedNode?.type === "stairs" && (
        <div className="bg-[#f39c12] text-black px-5 py-[6px] text-[13px] font-semibold text-center z-10">
          ⚠️ Stair node selected from {FLOORS.find(f => f.value === selectedNode.floor)?.label} — switch floor and click matching stair node
        </div>
      )}

      {/* ── Map ── */}
      <div className="flex-1 w-full bg-[#f0ece4] relative overflow-hidden z-[1]">
        <MapContainer
          key={`${floor}-${mapSize.w}-${mapSize.h}`}
          crs={L.CRS.Simple}
          bounds={bounds}
          style={{ height: "100%", width: "100%", background: "transparent" }}
          maxZoom={3}
          minZoom={-5}
          zoomSnap={0.25}
          attributionControl={false}
        >
          <ImageOverlay url={FLOOR_MAPS[floor]} bounds={bounds} />
          <ClickHandler onMapClick={handleMapClick} />

          {/* Edges */}
          {visibleEdges.map((edge, i) => {
            const from = nodes.find(n => n.id === edge.from)
            const to   = nodes.find(n => n.id === edge.to)
            if (!from || !to) return null
            const crossFloor = from.floor !== to.floor
            return (
              <Polyline
                key={i}
                positions={[[from.y, from.x], [to.y, to.x]]}
                color={crossFloor ? "#ff6b35" : edge.isStair ? "#f39c12" : "#3498db"}
                weight={crossFloor ? 3 : 2}
                dashArray={crossFloor ? "8, 6" : null}
              />
            )
          })}

          {/* Nodes */}
          {currentNodes.map((node, i) => (
            <CircleMarker
              key={i}
              center={[node.y, node.x]}
              radius={6}
              pathOptions={{
                color: getNodeColor(node),
                fillColor: getNodeColor(node),
                fillOpacity: 1,
              }}
              eventHandlers={{ click: () => handleNodeClick(node) }}
            >
              <Tooltip permanent direction="top" offset={[0, -8]}>
                {node.label}
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* ── Node placement modal ── */}
      {pendingClick && (
        <NodeModal
          latlng={pendingClick}
          floor={floor}
          onConfirm={handleModalConfirm}
          onCancel={() => setPendingClick(null)}
        />
      )}

      {/* ── Delete confirm modal ── */}
      {deleteTarget && (
        <DeleteModal
          node={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}