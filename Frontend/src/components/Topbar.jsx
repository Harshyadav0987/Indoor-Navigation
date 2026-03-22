import { createPortal } from "react-dom"
import { MAPS } from "../constants/maps"
import { formatLabel } from "../utils/formatLabel"

/**
 * Topbar — the navigation header with logo, from/to cards,
 * search, floor tabs, and status chips.
 */
export function Topbar({
  // Route state
  from, to, path, error, loading,
  step, selectMode, activeMapKey,
  // Search
  search, setSearch, searchFor, setSearchFor,
  searchResults, dropdownRect, searchGroupRef,
  // Handlers
  onFromCardClick,
  onToCardClick,
  onSearchSelect,
  onSelectToggle,
  onClear,
  onFloorChange,
}) {
  return (
    <div className="topbar">

      {/* Logo */}
      <div className="logo">
        <img src="/mits_logo.png" alt="MITS" className="logo-img" />
        <div className="logo-text">
          <span className="logo-title">MITS Navigator</span>
          <span className="logo-sub">Campus Wayfinding</span>
        </div>
      </div>

      <div className="topbar-divider" />

      {/* From / To cards */}
      <div className="route-cards">
        <div
          className={`step-card clickable ${selectMode && step === "from" ? "active" : from ? "filled" : ""}`}
          onClick={onFromCardClick}
          title="Click to change starting point"
        >
          <div className="step-badge from">A</div>
          <div className="step-text">
            <span className="step-hint">From {from ? "· tap to change" : ""}</span>
            <span className={`step-value ${!from ? "placeholder" : ""}`}>
              {from ? formatLabel(from.label) : "Not selected"}
            </span>
          </div>
        </div>

        <span className="route-arrow">→</span>

        <div
          className={`step-card clickable ${selectMode && step === "to" ? "active" : to ? "filled" : ""}`}
          onClick={onToCardClick}
          title="Click to change destination"
        >
          <div className="step-badge to">B</div>
          <div className="step-text">
            <span className="step-hint">To {to ? "· tap to change" : ""}</span>
            <span className={`step-value ${!to ? "placeholder" : ""}`}>
              {to ? formatLabel(to.label) : "Not selected"}
            </span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="search-group" ref={searchGroupRef}>
        <button
          className={`search-for-toggle ${searchFor === "from" ? "from" : "to"}`}
          onClick={() => setSearchFor(prev => prev === "from" ? "to" : "from")}
          type="button"
        >
          {searchFor === "from" ? "A FROM" : "B TO"}
        </button>
        <input
          className="search-input with-toggle"
          type="text"
          placeholder={searchFor === "from" ? "Search starting point…" : "Search destination…"}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Search dropdown portal */}
      {searchResults.length > 0 && dropdownRect && createPortal(
        <div
          className="search-results"
          style={{
            position: "fixed",
            top: dropdownRect.top,
            left: dropdownRect.left,
            width: dropdownRect.width,
          }}
        >
          {searchResults.map(node => (
            <button
              key={node.id}
              type="button"
              className="search-result-row"
              onClick={() => onSearchSelect(node)}
            >
              <span className="search-result-label">{formatLabel(node.label)}</span>
              <span className="search-result-meta">{node.id}</span>
            </button>
          ))}
        </div>,
        document.body
      )}

      {/* Select on Map button */}
      <button
        className={`btn-select ${selectMode ? "active" : ""}`}
        onClick={onSelectToggle}
      >
        {selectMode
          ? step === "from" ? "📍 Pick start" : "🏁 Pick end"
          : "📍 Select on Map"
        }
      </button>

      {(from || to || path.length > 0) && (
        <button className="btn-clear" onClick={onClear}>✕ Clear</button>
      )}

      {/* Floor tabs */}
      <div className="floor-tabs">
        {Object.values(MAPS).map(m => (
          <button
            key={m.key}
            type="button"
            className={`floor-tab ${activeMapKey === m.key ? "active" : ""}`}
            onClick={() => onFloorChange(m.key)}
          >
            {m.name}
          </button>
        ))}
      </div>

      {/* Status chips */}
      {loading && <div className="status-chip chip-loading">⏳ Searching…</div>}
      {error   && <div className="status-chip chip-error">⚠ {error}</div>}
      {path.length > 0 && !loading && !error && (
        <div className="status-chip chip-success">✓ Route found</div>
      )}
      {!selectMode && !from && !loading && !error && path.length === 0 && (
        <div className="status-chip chip-hint">Press "Select on Map" to begin</div>
      )}
    </div>
  )
}
