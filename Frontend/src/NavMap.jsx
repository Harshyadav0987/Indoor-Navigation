import { useState, useEffect } from "react"
import { MapContainer, ImageOverlay, CircleMarker, Polyline, Tooltip } from "react-leaflet"
import L from "leaflet"

const MAP_WIDTH = 4642
const MAP_HEIGHT = 3924
const bounds = [[0, 0], [MAP_HEIGHT, MAP_WIDTH]]

export default function NavMap() {
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [path, setPath] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("http://localhost:5000/api/nodes").then(r => r.json()).then(setNodes)
    fetch("http://localhost:5000/api/edges").then(r => r.json()).then(setEdges)
  }, [])

  const selectableNodes = nodes
    .filter(n => ["room", "lab", "washroom", "faculty", "stairs"].includes(n.type))
    .sort((a, b) => a.label.localeCompare(b.label))

  async function handleNavigate() {
    if (!from || !to) return setError("Please select both locations")
    if (from === to) return setError("From and To cannot be the same!")
    setError("")
    setLoading(true)
    try {
      const res = await fetch(
        `http://localhost:5000/api/nodes/navigate?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      )
      const data = await res.json()
      if (data.error) { setError(data.error); setPath([]) }
      else setPath(data.path)
    } catch {
      setError("Server error. Is backend running?")
    }
    setLoading(false)
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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { overflow: hidden; background: #0a0a0f; }

        .nav-bar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 9999;
          height: 64px;
          background: rgba(10, 10, 20, 0.92);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          display: flex;
          align-items: center;
          padding: 0 24px;
          gap: 16px;
        }

        .nav-logo {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 16px;
          color: #fff;
          letter-spacing: -0.3px;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-logo span {
          display: inline-block;
          width: 28px; height: 28px;
          background: linear-gradient(135deg, #00d2ff, #0066ff);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }

        .nav-divider {
          width: 1px;
          height: 28px;
          background: rgba(255,255,255,0.1);
          flex-shrink: 0;
        }

        .select-wrapper {
          position: relative;
          flex: 1;
          max-width: 280px;
        }

        .select-label {
          position: absolute;
          top: -8px;
          left: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          color: #00d2ff;
          background: rgba(10,10,20,0.95);
          padding: 0 4px;
          letter-spacing: 1px;
          text-transform: uppercase;
          z-index: 1;
        }

        .nav-select {
          width: 100%;
          padding: 9px 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          cursor: pointer;
          outline: none;
          transition: border-color 0.2s;
          appearance: none;
        }

        .nav-select:focus {
          border-color: #00d2ff;
          background: rgba(0,210,255,0.05);
        }

        .nav-select option {
          background: #13131f;
          color: #fff;
        }

        .arrow-icon {
          font-size: 18px;
          color: rgba(255,255,255,0.3);
          flex-shrink: 0;
        }

        .btn-navigate {
          padding: 9px 22px;
          background: linear-gradient(135deg, #00d2ff, #0066ff);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          letter-spacing: 0.3px;
          transition: opacity 0.2s, transform 0.1s;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .btn-navigate:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-navigate:active { transform: translateY(0); }
        .btn-navigate:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .btn-clear {
          padding: 9px 16px;
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .btn-clear:hover {
          background: rgba(255,255,255,0.12);
          color: #fff;
        }

        .status-pill {
          margin-left: auto;
          padding: 6px 14px;
          border-radius: 20px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .status-success {
          background: rgba(0, 210, 100, 0.15);
          border: 1px solid rgba(0, 210, 100, 0.3);
          color: #00d264;
        }

        .status-error {
          background: rgba(255, 80, 80, 0.15);
          border: 1px solid rgba(255, 80, 80, 0.3);
          color: #ff5050;
        }

        .status-loading {
          background: rgba(0, 210, 255, 0.1);
          border: 1px solid rgba(0, 210, 255, 0.2);
          color: #00d2ff;
        }

        .map-wrapper {
          position: fixed;
          top: 64px;
          left: 0; right: 0; bottom: 0;
        }

        /* Path info panel bottom left */
        .path-panel {
          position: fixed;
          bottom: 24px;
          left: 24px;
          z-index: 9998;
          background: rgba(10,10,20,0.9);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 14px 18px;
          font-family: 'DM Sans', sans-serif;
          color: #fff;
          min-width: 200px;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .path-panel-title {
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #00d2ff;
          margin-bottom: 10px;
        }

        .path-stop {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 3px 0;
          font-size: 12px;
          color: rgba(255,255,255,0.7);
        }

        .path-stop-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #00d2ff;
          flex-shrink: 0;
        }

        .path-stop-dot.start { background: #00d264; width: 8px; height: 8px; }
        .path-stop-dot.end { background: #ff5050; width: 8px; height: 8px; }

        .path-line {
          width: 1px; height: 10px;
          background: rgba(0,210,255,0.3);
          margin-left: 3px;
        }

        /* Legend bottom right */
        .legend {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9998;
          background: rgba(10,10,20,0.9);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 14px 18px;
          font-family: 'DM Sans', sans-serif;
        }

        .legend-title {
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin-bottom: 10px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: rgba(255,255,255,0.6);
          padding: 2px 0;
        }

        .legend-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
      `}</style>

      {/* Top Navigation Bar */}
      <div className="nav-bar">
        <div className="nav-logo">
          <span>🏛</span>
          MITS Indoor Nav
        </div>

        <div className="nav-divider" />

        {/* From */}
        <div className="select-wrapper">
          <div className="select-label">From</div>
          <select
            className="nav-select"
            value={from}
            onChange={e => setFrom(e.target.value)}
          >
            <option value="">Select starting point...</option>
            {selectableNodes.map(n => (
              <option key={n.id} value={n.id}>{n.label}</option>
            ))}
          </select>
        </div>

        <div className="arrow-icon">→</div>

        {/* To */}
        <div className="select-wrapper">
          <div className="select-label">To</div>
          <select
            className="nav-select"
            value={to}
            onChange={e => setTo(e.target.value)}
          >
            <option value="">Select destination...</option>
            {selectableNodes.map(n => (
              <option key={n.id} value={n.id}>{n.label}</option>
            ))}
          </select>
        </div>

        <button className="btn-navigate" onClick={handleNavigate} disabled={loading}>
          {loading ? "Finding..." : "Navigate →"}
        </button>

        {path.length > 0 && (
          <button className="btn-clear" onClick={() => { setPath([]); setFrom(""); setTo("") }}>
            Clear
          </button>
        )}

        {/* Status */}
        {loading && <div className="status-pill status-loading">🔍 Searching path...</div>}
        {error && <div className="status-pill status-error">⚠ {error}</div>}
        {path.length > 0 && !error && (
          <div className="status-pill status-success">✓ Path found — {path.length} stops</div>
        )}
      </div>

      {/* Map */}
      <div className="map-wrapper">
        <MapContainer
          crs={L.CRS.Simple}
          bounds={bounds}
          style={{ height: "100%", width: "100%" }}
          maxZoom={2}
          minZoom={-3}
          zoom={-2}
        >
          <ImageOverlay url="/ground_floor.png" bounds={bounds} />

          {/* Edges */}
          {edges.map((edge, i) => {
            const f = nodes.find(n => n.id === edge.from)
            const t = nodes.find(n => n.id === edge.to)
            if (!f || !t) return null
            const inPath = isEdgeInPath(edge)
            return (
              <Polyline
                key={i}
                positions={[[f.y, f.x], [t.y, t.x]]}
                color={inPath ? "#00d2ff" : "#444"}
                weight={inPath ? 5 : 1}
                opacity={inPath ? 1 : 0.4}
              />
            )
          })}

          {/* Nodes */}
          {nodes.map((node, i) => {
            const inPath = isInPath(node.id)
            const isStart = path[0] === node.id
            const isEnd = path[path.length - 1] === node.id
            return (
              <CircleMarker
                key={i}
                center={[node.y, node.x]}
                radius={isStart || isEnd ? 10 : inPath ? 7 : 3}
                pathOptions={{
                  color: isStart ? "#00d264" : isEnd ? "#ff5050" : inPath ? "#00d2ff" : "#555",
                  fillColor: isStart ? "#00d264" : isEnd ? "#ff5050" : inPath ? "#00d2ff" : "#555",
                  fillOpacity: inPath ? 1 : 0.5,
                  weight: inPath ? 2 : 1
                }}
              >
                {(inPath || isStart || isEnd) && (
                  <Tooltip permanent direction="top" offset={[0, -8]}>
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }}>
                      {isStart ? "📍 " : isEnd ? "🏁 " : ""}{node.label}
                    </span>
                  </Tooltip>
                )}
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>

      {/* Path Panel - bottom left */}
      {path.length > 0 && (
        <div className="path-panel">
          <div className="path-panel-title">Route</div>
          {path
            .filter(id => {
              const node = nodes.find(n => n.id === id)
              return node && ["room", "lab", "washroom", "faculty", "stairs"].includes(node.type)
            })
            .map((id, i, arr) => {
              const node = nodes.find(n => n.id === id)
              if (!node) return null
              const isStart = i === 0
              const isEnd = i === arr.length - 1
              return (
                <div key={id}>
                  <div className="path-stop">
                    <div className={`path-stop-dot ${isStart ? "start" : isEnd ? "end" : ""}`} />
                    <span>{node.label}</span>
                  </div>
                  {i < arr.length - 1 && <div className="path-line" />}
                </div>
              )
            })}
        </div>
      )}

      {/* Legend - bottom right */}
      <div className="legend">
        <div className="legend-title">Legend</div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: "#00d264" }} />
          Start point
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: "#ff5050" }} />
          Destination
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: "#00d2ff" }} />
          Path
        </div>
      </div>
    </>
  )
}