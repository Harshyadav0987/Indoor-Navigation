import { useMemo } from "react"
import { MapContainer, ImageOverlay, CircleMarker, Polyline, Tooltip } from "react-leaflet"
import L from "leaflet"
import { MAPS, SELECTABLE_TYPES } from "../../constants/maps"
import { mapKeyFromNode, nodeColor } from "../../utils/mapHelpers"
import { formatLabel } from "../../utils/formatLabel"
import { FitToBounds } from "./FitToBounds"
import { MapClickHandler } from "./MapClickHandler"

/**
 * MapView — the full-screen Leaflet map with path rendering,
 * node markers, and FROM/TO markers.
 */
export function MapView({
  activeMapKey,
  nodesOnActiveMap,
  pathSegmentsOnActiveMap,
  from, to,
  selectMode,
  onNodeClick,
}) {
  const activeMap = MAPS[activeMapKey] || MAPS.G
  const bounds = useMemo(
    () => [[0, 0], [activeMap.h, activeMap.w]],
    [activeMap]
  )

  const clickableNodes = nodesOnActiveMap.filter(n =>
    SELECTABLE_TYPES.includes(n.type)
  )

  return (
    <div className={`map-wrap ${selectMode ? "selecting" : ""}`}>
      <MapContainer
        key={`${activeMapKey}-${activeMap.w}-${activeMap.h}`}
        crs={L.CRS.Simple}
        bounds={bounds}
        style={{ height: "100%", width: "100%" }}
        maxZoom={3}
        minZoom={-5}
        zoomSnap={0.01}
        zoomDelta={0.5}
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <FitToBounds bounds={bounds} />
        <ImageOverlay url={activeMap.url} bounds={bounds} />

        <MapClickHandler
          nodes={clickableNodes}
          onNodeClick={onNodeClick}
          active={selectMode}
        />

        {/* Path glow */}
        {pathSegmentsOnActiveMap.map((positions, i) => (
          <Polyline
            key={`glow-${i}`}
            positions={positions}
            color="#E8A020"
            weight={14}
            opacity={0.15}
            lineCap="round"
            lineJoin="round"
          />
        ))}

        {/* Path white outline */}
        {pathSegmentsOnActiveMap.map((positions, i) => (
          <Polyline
            key={`outline-${i}`}
            positions={positions}
            color="#fff"
            weight={10}
            opacity={0.25}
            lineCap="round"
            lineJoin="round"
          />
        ))}

        {/* Path main line */}
        {pathSegmentsOnActiveMap.map((positions, i) => (
          <Polyline
            key={`path-${i}`}
            positions={positions}
            color="#E8A020"
            weight={5}
            opacity={0.95}
            lineCap="round"
            lineJoin="round"
          />
        ))}

        {/* Node click targets — invisible normally, ghost in select mode */}
        {clickableNodes.map((node, i) => (
          <CircleMarker
            key={`node-${i}`}
            center={[node.y, node.x]}
            radius={selectMode ? 10 : 6}
            pathOptions={{
              color:       selectMode ? nodeColor(node.type) : "transparent",
              fillColor:   selectMode ? nodeColor(node.type) : "transparent",
              fillOpacity: selectMode ? 0.18 : 0,
              weight:      selectMode ? 1.5 : 0,
              opacity:     selectMode ? 0.5 : 0,
            }}
            eventHandlers={selectMode ? { click: () => onNodeClick(node) } : {}}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              {formatLabel(node.label)}
            </Tooltip>
          </CircleMarker>
        ))}

        {/* FROM marker */}
        {from && mapKeyFromNode(from) === activeMapKey && (
          <CircleMarker
            center={[from.y, from.x]}
            radius={13}
            pathOptions={{ color: "#fff", fillColor: "#22C97A", fillOpacity: 1, weight: 3 }}
          >
            <Tooltip permanent direction="top" offset={[0, -16]}>
              📍 {formatLabel(from.label)}
            </Tooltip>
          </CircleMarker>
        )}

        {/* TO marker */}
        {to && mapKeyFromNode(to) === activeMapKey && (
          <CircleMarker
            center={[to.y, to.x]}
            radius={13}
            pathOptions={{ color: "#fff", fillColor: "#F04F5A", fillOpacity: 1, weight: 3 }}
          >
            <Tooltip permanent direction="top" offset={[0, -16]}>
              🏁 {formatLabel(to.label)}
            </Tooltip>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  )
}
