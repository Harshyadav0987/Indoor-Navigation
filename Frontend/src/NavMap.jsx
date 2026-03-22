import "leaflet/dist/leaflet.css"
import "./NavMap.css"

import { useNavigation } from "./hooks/useNavigation"
import { useSearch }     from "./hooks/useSearch"
import { Topbar }        from "./components/Topbar"
import { MapView }       from "./components/map/MapView"
import { RoutePanel }    from "./components/RoutePanel"

/**
 * NavMap — root component for the MITS Campus Navigator.
 *
 * All state and logic lives in useNavigation() and useSearch().
 * All UI is split into Topbar, MapView, and RoutePanel.
 * This file is intentionally kept thin — just wiring.
 */
export default function NavMap() {
  const nav    = useNavigation()
  const search = useSearch(nav.selectableNodes)

  // ── Handler: FROM card clicked ────────────────────────────────────
  function handleFromCardClick() {
    nav.setStep("from")
    nav.setSelectMode(true)
    search.setSearchFor("from")
    search.clearSearch()
  }

  // ── Handler: TO card clicked ──────────────────────────────────────
  function handleToCardClick() {
    nav.setStep("to")
    nav.setSelectMode(true)
    search.setSearchFor("to")
    search.clearSearch()
  }

  // ── Handler: search result selected ──────────────────────────────
  async function handleSearchSelect(node) {
    const nextSearchFor = await nav.handleSearchSelect(node, search.searchFor)
    search.clearSearch()
    search.setSearchFor(nextSearchFor || "to")
  }

  // ── Handler: node clicked on map ──────────────────────────────────
  async function handleNodeClick(node) {
    await nav.handleNodeClick(node)
    // Sync searchFor with step after map click
    search.setSearchFor(nav.step === "from" ? "to" : "from")
  }

  return (
    <>
      <Topbar
        // Route state
        from={nav.from}
        to={nav.to}
        path={nav.path}
        error={nav.error}
        loading={nav.loading}
        step={nav.step}
        selectMode={nav.selectMode}
        activeMapKey={nav.activeMapKey}
        // Search
        search={search.search}
        setSearch={search.setSearch}
        searchFor={search.searchFor}
        setSearchFor={search.setSearchFor}
        searchResults={search.searchResults}
        dropdownRect={search.dropdownRect}
        searchGroupRef={search.searchGroupRef}
        // Handlers
        onFromCardClick={handleFromCardClick}
        onToCardClick={handleToCardClick}
        onSearchSelect={handleSearchSelect}
        onSelectToggle={nav.handleSelectToggle}
        onClear={nav.handleClear}
        onFloorChange={nav.setActiveMapKey}
      />

      {/* Select mode hint banner */}
      {nav.selectMode && (
        <div className="select-hint">
          {nav.step === "from"
            ? "📍 Click near your starting location"
            : "🏁 Click near your destination"}
        </div>
      )}

      <MapView
        activeMapKey={nav.activeMapKey}
        nodesOnActiveMap={nav.nodesOnActiveMap}
        pathSegmentsOnActiveMap={nav.pathSegmentsOnActiveMap}
        from={nav.from}
        to={nav.to}
        selectMode={nav.selectMode}
        onNodeClick={handleNodeClick}
      />

      <RoutePanel
        pathStops={nav.pathStops}
        pathMapKeys={nav.pathMapKeys}
        estimate={nav.estimate}
        activeMapKey={nav.activeMapKey}
        onFloorChange={nav.setActiveMapKey}
      />
    </>
  )
}
