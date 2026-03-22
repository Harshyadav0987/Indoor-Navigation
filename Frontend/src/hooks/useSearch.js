import { useState, useRef, useLayoutEffect } from "react"

/**
 * useSearch — manages search input, dropdown positioning,
 * and the from/to toggle state.
 */
export function useSearch(selectableNodes) {
  const [search, setSearch]       = useState("")
  const [searchFor, setSearchFor] = useState("from") // "from" | "to"
  const [dropdownRect, setDropdownRect] = useState(null)
  const searchGroupRef = useRef(null)

  // Filter nodes based on search query
  const searchResults = search.trim()
    ? selectableNodes
        .filter(n => {
          const q = search.toLowerCase()
          return `${n.label} ${n.id}`.toLowerCase().includes(q)
        })
        .slice(0, 8)
    : []

  // Calculate dropdown position based on search input position
  useLayoutEffect(() => {
    if (searchResults.length === 0) { setDropdownRect(null); return }
    const el = searchGroupRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setDropdownRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 240),
    })
  }, [searchResults.length, search])

  function clearSearch() {
    setSearch("")
    setDropdownRect(null)
  }

  return {
    search, setSearch,
    searchFor, setSearchFor,
    searchResults,
    dropdownRect,
    searchGroupRef,
    clearSearch,
  }
}
