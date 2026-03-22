/**
 * Cleans raw MongoDB node IDs into human-readable display names.
 *
 * Examples:
 *   "FA_computer_lab(J123)"  → "Computer Lab (J123)"
 *   "Stairs_G_to_Fl_5"       → "Stairs to 1st Floor"
 *   "Male_Faculty_Washroom"  → "Male Faculty Washroom"
 */
export function formatLabel(raw) {
  if (!raw) return ""

  let s = raw

  // Normalize stair labels
  s = s.replace(/Stairs?_G_to_Fl_\d+/gi, "Stairs to 1st Floor")
  s = s.replace(/Stairs?_FA_to_/gi, "Stairs to ")
  s = s.replace(/Stairs?_FB_to_/gi, "Stairs to ")
  s = s.replace(/FA_stairs/gi, "1st Floor Stairs")
  s = s.replace(/FB_stairs/gi, "1st Floor B Stairs")
  s = s.replace(/S_stairs/gi, "2nd Floor Stairs")
  s = s.replace(/_stairs_\d+['"]?/gi, " Stairs")

  // Strip floor prefixes like G_, FA_, FB_, S_
  s = s.replace(/^(G|FA|FB|S)_/i, "")

  // Replace underscores with spaces
  s = s.replace(/_/g, " ")

  // Fix spacing around brackets
  s = s.replace(/\(\s*/g, "(").replace(/\s*\)/g, ")")

  // Capitalize each word, preserving bracket content
  s = s.replace(/([^(]+)(\([^)]*\))?/g, (_, before, bracket) => {
    const capitalized = before
      .trim()
      .split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ")
    return bracket ? `${capitalized} ${bracket}` : capitalized
  })

  return s.trim()
}
