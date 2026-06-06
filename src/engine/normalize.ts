const aliases: Record<string, string> = {
  strat: "stratocaster",
  tele: "telecaster",
  "63": "1963",
  eflat: "eb",
  "e-flat": "eb",
  "drop-g-sharp": "drop g#"
};

export function normalizeText(input: string | undefined): string {
  return String(input ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9#+]+/g, " ")
    .trim()
    .split(/\s+/)
    .map(token => aliases[token] ?? token)
    .join(" ");
}

export function includesNormalized(haystack: string, needle: string | undefined): boolean {
  if (!needle) return true;
  return normalizeText(haystack).includes(normalizeText(needle));
}

export function sameNormalized(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return !a && !b;
  return normalizeText(a) === normalizeText(b);
}
