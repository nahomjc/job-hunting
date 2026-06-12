/** Match job text against space/comma-separated search terms (any term matches). */
export function matchesQuery(haystackParts: (string | undefined | null)[], query: string): boolean {
  const terms = query
    .toLowerCase()
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);

  if (terms.length === 0) return true;

  const haystack = haystackParts.filter(Boolean).join(" ").toLowerCase();
  return terms.some((term) => haystack.includes(term));
}

export function stripHtml(html: string, maxLength = 8000): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}
