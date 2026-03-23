import * as L from "leaflet"
// Expose L globally so plugins like leaflet-rotate can attach correctly in ES module bundlers (Vite)
if (typeof window !== "undefined") {
  window.L = window.L || L
}
