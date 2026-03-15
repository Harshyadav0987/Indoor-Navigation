function dijkstra(nodes, edges, startId, endId) {
  // Build adjacency list
  const graph = {}
  nodes.forEach(n => graph[n.id] = [])

  edges.forEach(edge => {
    if (graph[edge.from]) graph[edge.from].push({ id: edge.to, weight: edge.weight })
    if (graph[edge.to]) graph[edge.to].push({ id: edge.from, weight: edge.weight })
  })

  const dist = {}
  const prev = {}
  const visited = new Set()

  nodes.forEach(n => {
    dist[n.id] = Infinity
    prev[n.id] = null
  })
  dist[startId] = 0

  const queue = [{ id: startId, dist: 0 }]

  while (queue.length > 0) {
    queue.sort((a, b) => a.dist - b.dist)
    const { id: current } = queue.shift()

    if (visited.has(current)) continue
    visited.add(current)

    if (current === endId) break

    for (const neighbor of (graph[current] || [])) {
      if (visited.has(neighbor.id)) continue
      const newDist = dist[current] + neighbor.weight
      if (newDist < dist[neighbor.id]) {
        dist[neighbor.id] = newDist
        prev[neighbor.id] = current
        queue.push({ id: neighbor.id, dist: newDist })
      }
    }
  }

  const path = []
  let current = endId
  while (current !== null) {
    path.unshift(current)
    current = prev[current]
  }

  if (path[0] !== startId) return null
  return path
}

module.exports = dijkstra