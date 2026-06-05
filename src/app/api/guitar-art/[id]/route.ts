import { guitars } from "@/engine/catalog";

const palettes = [
  ["#172633", "#24d4c4", "#d8eef2"],
  ["#111c26", "#6ad7ff", "#f5fbff"],
  ["#0f1a28", "#a58cff", "#eef0ff"],
  ["#17231f", "#87e7a9", "#f3fff6"],
  ["#241a1c", "#ff9d8a", "#fff1ed"]
];

function hash(input: string) {
  return [...input].reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guitar = guitars.find(item => item.id === id);
  const [bg, accent, text] = palettes[hash(id) % palettes.length];
  const title = guitar ? `${guitar.brand} ${guitar.model}` : "Guitar Finder";

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 675" role="img" aria-label="${title}">
  <rect width="900" height="675" fill="${bg}"/>
  <rect x="36" y="36" width="828" height="603" rx="24" fill="#071018" opacity=".28"/>
  <g transform="translate(118 298) rotate(-13)">
    <rect x="152" y="-18" width="470" height="36" rx="18" fill="${text}" opacity=".92"/>
    <rect x="578" y="-48" width="118" height="96" rx="18" fill="${accent}"/>
    <circle cx="132" cy="0" r="96" fill="${accent}"/>
    <circle cx="220" cy="-18" r="74" fill="${accent}" opacity=".82"/>
    <circle cx="226" cy="42" r="70" fill="${accent}" opacity=".66"/>
    <circle cx="132" cy="0" r="34" fill="#071018" opacity=".65"/>
    <rect x="305" y="-38" width="20" height="76" rx="6" fill="#071018" opacity=".54"/>
    <rect x="360" y="-38" width="16" height="76" rx="6" fill="#071018" opacity=".42"/>
    <g stroke="#071018" stroke-width="6" opacity=".5">
      <path d="M178 -13h440"/>
      <path d="M178 0h440"/>
      <path d="M178 13h440"/>
    </g>
  </g>
  <text x="58" y="590" fill="${text}" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="800">${title}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
