const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export const formatDate = (iso: string) => dateFmt.format(new Date(iso));

/** "Dr. Ayesha Rahman" -> "AR" */
export function getInitials(name: string) {
  const parts = name.replace(/^dr\.?\s+/i, "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** Stable hue (0-359) from a string so each person keeps the same avatar colour */
export function hueFromString(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}
