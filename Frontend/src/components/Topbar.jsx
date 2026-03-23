import { createPortal } from "react-dom"
import { MAPS } from "../constants/maps"
import { formatLabel } from "../utils/formatLabel"

export function Topbar({
  from, to, path, error, loading,
  step, selectMode, activeMapKey,
  search, setSearch, searchFor, setSearchFor,
  searchResults, dropdownRect, searchGroupRef,
  onFromCardClick, onToCardClick, onSearchSelect,
  onSelectToggle, onClear, onFloorChange,
}) {
  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[10000] p-2.5 md:p-0 md:h-[62px] md:px-4 bg-glass border-b border-border/20 backdrop-blur-xl shadow-[0_2px_24px_rgba(0,0,0,0.5)] flex flex-wrap md:flex-nowrap items-center gap-y-2 gap-x-2 md:gap-2.5 w-full">

        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0 decoration-none">
          <img src="/mits_logo.png" alt="MITS" className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover border-2 border-gold shadow-[0_0_10px_rgba(232,160,32,0.35)]" />
          <div className="hidden md:flex flex-col leading-[1.1]">
            <span className="text-[13px] font-bold text-white tracking-[0.5px]">MITS Navigator</span>
            <span className="text-[9.5px] font-medium text-gold tracking-[1.2px] uppercase">Campus Wayfinding</span>
          </div>
        </div>

        <div className="hidden md:block w-px h-7 bg-border shrink-0" />

        {/* From / To cards - They will flex together */}
        <div className="flex items-center gap-1.5 flex-1 md:flex-none min-w-[200px] shrink-0">
          <div
            className={`flex-1 flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-[6px] rounded-lg bg-glass-light border md:min-w-[140px] md:max-w-[180px] cursor-pointer transition-all ${
              selectMode && step === "from"
                ? "border-gold bg-gold-dim shadow-[0_0_0_3px_rgba(232,160,32,0.12)]"
                : "border-white/10 hover:border-gold/40 hover:bg-gold/5"
            }`}
            onClick={onFromCardClick}
            title="Click to change starting point"
          >
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[10px] md:text-[11px] font-bold shrink-0 bg-green text-white">A</div>
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] md:text-[9px] font-semibold tracking-[1px] uppercase text-muted mb-[1px] hidden sm:block">From {from ? "· tap to change" : ""}</span>
              <span className={`text-[11px] md:text-[12px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis w-full ${!from ? "text-muted font-normal" : "text-white"}`}>
                {from ? formatLabel(from.label) : "Start..."}
              </span>
            </div>
          </div>

          <span className="text-muted text-xs md:text-sm shrink-0">→</span>

          <div
            className={`flex-1 flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-[6px] rounded-lg bg-glass-light border md:min-w-[140px] md:max-w-[180px] cursor-pointer transition-all ${
              selectMode && step === "to"
                ? "border-gold bg-gold-dim shadow-[0_0_0_3px_rgba(232,160,32,0.12)]"
                : "border-white/10 hover:border-gold/40 hover:bg-gold/5"
            }`}
            onClick={onToCardClick}
            title="Click to change destination"
          >
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[10px] md:text-[11px] font-bold shrink-0 bg-red text-white">B</div>
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] md:text-[9px] font-semibold tracking-[1px] uppercase text-muted mb-[1px] hidden sm:block">To {to ? "· tap to change" : ""}</span>
              <span className={`text-[11px] md:text-[12px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis w-full ${!to ? "text-muted font-normal" : "text-white"}`}>
                {to ? formatLabel(to.label) : "Destination..."}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Pick Map & Clear */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto md:ml-0">
          <button
            className={`flex items-center justify-center px-3 md:px-[14px] py-1.5 md:py-[7px] bg-transparent border-[1.5px] rounded-lg font-sans text-[11px] md:text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
              selectMode 
                ? "bg-gold text-navy border-gold shadow-[0_0_0_3px_rgba(232,160,32,0.25)] animate-[pulse-gold_1.8s_infinite]" 
                : "text-gold border-gold hover:bg-gold-dim"
            }`}
            onClick={onSelectToggle}
          >
            {selectMode
              ? step === "from" ? "📍 Pick start" : "🏁 Pick end"
              : "📍 Select on Map"
            }
          </button>

          {(from || to || path.length > 0) && (
            <button className="px-2.5 md:px-[12px] py-1.5 md:py-[7px] bg-transparent text-muted border border-white/10 rounded-lg font-sans text-[11px] md:text-[12px] font-medium cursor-pointer transition-all whitespace-nowrap hover:text-red hover:border-red/40 hover:bg-red/10" onClick={onClear}>
              ✕ Clear
            </button>
          )}
        </div>

        {/* Search Input - Last on mobile flex, first on desktop middle */}
        <div className="relative w-full md:flex-1 order-last md:order-none min-w-0 md:max-w-[240px]" ref={searchGroupRef}>
          <button
            className={`absolute left-2 top-1/2 -translate-y-1/2 px-1.5 md:px-2 py-0.5 md:py-[3px] rounded font-sans text-[9px] md:text-[10px] font-bold tracking-[0.5px] cursor-pointer z-10 transition-all whitespace-nowrap ${
              searchFor === "from" ? "bg-green/10 text-green border border-green/20" : "bg-red/10 text-red border border-red/20"
            }`}
            onClick={() => setSearchFor(prev => prev === "from" ? "to" : "from")}
            type="button"
          >
            {searchFor === "from" ? "A FROM" : "B TO"}
          </button>
          <input
            className="w-full pl-[62px] md:pl-[70px] pr-2 md:pr-3.5 py-2 rounded-lg border border-white/10 bg-glass-light text-white font-sans text-[12px] md:text-[12.5px] font-medium outline-none transition-all focus:border-gold focus:shadow-[0_0_0_3px_rgba(232,160,32,0.12)] placeholder:text-muted"
            type="text"
            placeholder={searchFor === "from" ? "Search start..." : "Search destination..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Search dropdown portal */}
        {searchResults.length > 0 && dropdownRect && createPortal(
          <div
            className="fixed bg-navy-mid border border-border rounded-[10px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-1.5 max-h-[280px] overflow-y-auto z-[10002] custom-scrollbar"
            style={{ 
              top: window.innerWidth < 768 ? dropdownRect.bottom + 8 : dropdownRect.top, 
              left: window.innerWidth < 768 ? 10 : dropdownRect.left, 
              width: window.innerWidth < 768 ? window.innerWidth - 20 : dropdownRect.width 
            }}
          >
            {searchResults.map(node => (
              <button
                key={node.id}
                type="button"
                className="w-full border-none bg-transparent hover:bg-gold-dim text-white px-2.5 py-2 rounded-[7px] flex items-center justify-between gap-2.5 cursor-pointer font-sans transition-colors text-left"
                onClick={() => onSearchSelect(node)}
              >
                <span className="text-[12.5px] font-semibold truncate">{formatLabel(node.label)}</span>
                <span className="text-[10.5px] font-mono text-gold/80 whitespace-nowrap shrink-0">{node.id}</span>
              </button>
            ))}
          </div>,
          document.body
        )}

        {/* Floor tabs Desktop */}
        <div className="hidden md:flex gap-[3px] p-[3px] bg-glass-light border border-border rounded-[9px] shrink-0 ml-auto">
          {Object.values(MAPS).map(m => (
            <button
              key={m.key}
              type="button"
              className={`px-[11px] py-[5px] rounded-[6px] text-[11.5px] font-semibold font-sans cursor-pointer transition-all whitespace-nowrap ${
                activeMapKey === m.key 
                  ? "bg-gold text-navy shadow-[0_2px_8px_rgba(232,160,32,0.4)]" 
                  : "text-muted hover:text-white hover:bg-white/5"
              }`}
              onClick={() => onFloorChange(m.key)}
            >
              {m.name}
            </button>
          ))}
        </div>

        {/* Status chips */}
        {loading && <div className="hidden md:flex ml-auto px-[12px] py-[5px] rounded-[20px] text-[11.5px] font-semibold whitespace-nowrap shrink-0 items-center gap-[5px] bg-blue/10 border border-blue/30 text-blue">⏳ Searching…</div>}
        {error   && <div className="hidden md:flex ml-auto px-[12px] py-[5px] rounded-[20px] text-[11.5px] font-semibold whitespace-nowrap shrink-0 items-center gap-[5px] bg-red/10 border border-red/30 text-red">⚠ {error}</div>}
        {path.length > 0 && !loading && !error && (
          <div className="hidden md:flex ml-auto px-[12px] py-[5px] rounded-[20px] text-[11.5px] font-semibold whitespace-nowrap shrink-0 items-center gap-[5px] bg-green/10 border border-green/30 text-green">✓ Route found</div>
        )}

      </div>

      {/* Mobile Floor Tabs (fixed bottom) */}
      <div className="fixed bottom-0 left-0 right-0 z-[10000] flex md:hidden bg-navy/95 border-t border-border/30 backdrop-blur-lg pb-safe">
        {Object.values(MAPS).map(m => (
          <button
            key={m.key}
            type="button"
            className={`flex-1 py-3 text-[11px] font-semibold transition-all ${
              activeMapKey === m.key ? "text-gold border-t-2 border-gold bg-gold/5" : "text-muted hover:text-white"
            }`}
            onClick={() => onFloorChange(m.key)}
          >
            {m.name}
          </button>
        ))}
      </div>
    </>
  )
}