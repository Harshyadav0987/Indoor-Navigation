import { MAPS } from "../constants/maps"
import { mapKeyFromNode } from "../utils/mapHelpers"
import { formatLabel } from "../utils/formatLabel"

/**
 * RoutePanel — the bottom-left panel showing route stops,
 * estimated time/distance, floor chips, and stair transitions.
 */
export function RoutePanel({ pathStops, pathMapKeys, estimate, activeMapKey, onFloorChange }) {
  if (pathStops.length === 0) return null

  return (
    <div className="route-panel">
      <div className="route-panel-header">
        <div className="route-title">📍 Route — {pathStops.length} stops</div>
        {estimate && (
          <div className="route-distance">
            ~{estimate.minutes} min · {estimate.metres}m
          </div>
        )}
      </div>

      {/* Floor switcher chips — only shown for multi-floor routes */}
      {pathMapKeys.length > 1 && (
        <div className="route-floors">
          {pathMapKeys.map((k, idx) => (
            <button
              key={k}
              type="button"
              className={`route-floor-chip ${activeMapKey === k ? "active" : ""}`}
              onClick={() => onFloorChange(k)}
            >
              {idx + 1}. {(MAPS[k] || { name: k }).name}
            </button>
          ))}
        </div>
      )}

      {/* Stop list */}
      {pathStops.map((node, i) => {
        const isStart    = i === 0
        const isEnd      = i === pathStops.length - 1
        const isStair    = node.type === "stairs"
        const nextStop   = pathStops[i + 1]
        const floorChange = nextStop && mapKeyFromNode(node) !== mapKeyFromNode(nextStop)

        return (
          <div key={node.id}>
            <div className="route-stop">
              <div className="route-stop-left">
                <div className={`stop-dot ${isStart ? "start" : isEnd ? "end" : isStair ? "stair" : ""}`} />
                {i < pathStops.length - 1 && (
                  <div className={`stop-line ${floorChange ? "stair-line" : ""}`} />
                )}
              </div>
              <div className="stop-content">
                <div className={`stop-label ${isStart ? "start" : isEnd ? "end" : ""}`}>
                  {formatLabel(node.label)}
                </div>
                <span className="stop-floor-tag">
                  {(MAPS[mapKeyFromNode(node)] || { name: "—" }).name}
                </span>
              </div>
            </div>

            {/* Floor transition badge */}
            {floorChange && nextStop && (
              <div className="stair-transition">
                <div className="route-stop-left" />
                <div className="stair-badge">
                  ⬆ Take stairs → {(MAPS[mapKeyFromNode(nextStop)] || { name: "Next Floor" }).name}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
