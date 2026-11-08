/** Normalize Spanish/English search text for accent-insensitive matching. */
export function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[“”"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(input: string): string[] {
  return normalizeText(input)
    .split(/[^a-z0-9]+/i)
    .map((t) => normalizeText(t))
    .filter(Boolean);
}
