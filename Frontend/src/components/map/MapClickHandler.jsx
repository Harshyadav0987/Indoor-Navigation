import { useMapEvents } from "react-leaflet"
import { findClosestNode } from "../../utils/mapHelpers"

/**
 * MapClickHandler — listens for map clicks and finds the closest node.
 * Only active when selectMode is true.
 */
export function MapClickHandler({ nodes, onNodeClick, active }) {
  useMapEvents({
    click(e) {
      if (!active) return
      const closest = findClosestNode(nodes, e.latlng)
      if (closest) onNodeClick(closest)
    }
  })
  return null
}
