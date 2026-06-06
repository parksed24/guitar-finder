const boilerplatePatterns = [
  /\b(add to cart|shop now|free shipping|newsletter|privacy policy|terms of service)\b/gi,
  /\b(sign up|subscribe|share this|related products)\b/gi
];

export function sanitizeSourceText(input?: string): string | undefined {
  if (!input) return undefined;
  let text = input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#34;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  for (const pattern of boilerplatePatterns) text = text.replace(pattern, " ");
  text = text.replace(/\s+/g, " ").trim();
  if (!text || text.length < 24) return undefined;
  if (/^(home|search|results|account|cart)$/i.test(text)) return undefined;
  return text.length > 240 ? `${text.slice(0, 237).trim()}...` : text;
}
