import { useEffect } from "react"
import { useMap } from "react-leaflet"

/**
 * FitToBounds — fits the Leaflet map to the given bounds on mount/change.
 * Must be rendered inside a MapContainer.
 */
export function FitToBounds({ bounds }) {
  const map = useMap()
  useEffect(() => {
    if (!bounds) return
    map.invalidateSize()
    map.fitBounds(bounds, { padding: [0, 0], animate: false })
  }, [map, bounds])
  return null
}
