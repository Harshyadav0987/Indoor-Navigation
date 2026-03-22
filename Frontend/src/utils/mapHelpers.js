import { MAPS } from "../constants/maps"

/**
 * Returns the map key (G, FA, FB, S) for a given node based on its floor number.
 */
export function mapKeyFromNode(node) {
  if (!node) return "G"
  if (node.floor === 3) return "S"
  if (node.floor === 2) return "FB"
  if (node.floor === 1) return "FA"
  return "G"
}

/**
 * Finds the closest node to a clicked latlng point on the map.
 * Returns null if no node is within 600px threshold.
 */
export function findClosestNode(nodes, latlng) {
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

/**
 * Returns a color hex string for a given node type.
 */
export function nodeColor(type) {
  const colors = {
    lab:      "#3B82F6",
    washroom: "#8B5CF6",
    faculty:  "#EC4899",
    stairs:   "#E8A020",
    garden:   "#22C97A",
    room:     "#94A3B8",
    corridor: "#475569",
  }
  return colors[type] || "#94A3B8"
}

/**
 * Estimates walking distance and time for a given path.
 * Uses edge weights where available, falls back to Euclidean distance.
 * 1 pixel ≈ 0.05 metres at typical floor plan scale.
 */
const PX_TO_METRES = 0.05

export function estimateDistance(pathNodeObjects, edges) {
  if (!pathNodeObjects || pathNodeObjects.length < 2) return null
  let total = 0

  for (let i = 0; i < pathNodeObjects.length - 1; i++) {
    const a = pathNodeObjects[i]
    const b = pathNodeObjects[i + 1]
    if (!a || !b) continue

    const edge = edges.find(
      e => (e.from === a.id && e.to === b.id) || (e.from === b.id && e.to === a.id)
    )

    if (edge) {
      total += edge.weight
    } else {
      const dx = b.x - a.x
      const dy = b.y - a.y
      total += Math.sqrt(dx * dx + dy * dy)
    }
  }

  const metres = Math.round(total * PX_TO_METRES)
  const minutes = Math.max(1, Math.round(metres / 80)) // avg walking speed: 80m/min
  return { metres, minutes }
}

/**
 * Returns all unique map keys touched by a path, in order.
 */
export function getPathMapKeys(pathNodeObjects) {
  const seen = new Set()
  const result = []
  for (const node of pathNodeObjects) {
    const k = mapKeyFromNode(node)
    if (k && !seen.has(k)) { seen.add(k); result.push(k) }
  }
  return result
}

/**
 * Returns path segments that are visible on the given map floor.
 */
export function getPathSegmentsOnFloor(pathNodeObjects, activeMapKey) {
  const segs = []
  for (let i = 0; i < pathNodeObjects.length - 1; i++) {
    const a = pathNodeObjects[i]
    const b = pathNodeObjects[i + 1]
    if (mapKeyFromNode(a) !== activeMapKey) continue
    if (mapKeyFromNode(b) !== activeMapKey) continue
    segs.push([[a.y, a.x], [b.y, b.x]])
  }
  return segs
}
