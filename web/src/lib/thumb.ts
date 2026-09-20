import type { Recipe } from "./types";

/** Deterministic 32-bit hash so a recipe always renders the same artwork. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** One hue family per category, so the grid reads as colour-coded. */
const PALETTES: Record<string, { a: string; b: string; ink: string }> = {
  mains:            { a: "#3d2214", b: "#170d08", ink: "#ffb374" },
  "pasta-and-rice": { a: "#3b2c10", b: "#171208", ink: "#f0c766" },
  sauces:           { a: "#3d1a12", b: "#170b08", ink: "#ff9576" },
  seafood:          { a: "#0f2f3d", b: "#08161c", ink: "#6fdcff" },
  sides:            { a: "#2e2140", b: "#140f1c", ink: "#c9a3e0" },
  breakfast:        { a: "#14331d", b: "#0a1810", ink: "#8fe89a" },
  desserts:         { a: "#3a1a2c", b: "#180b13", ink: "#ffa3d0" },
  uncategorized:    { a: "#23282a", b: "#101314", ink: "#b9c4bc" },
};

/** Trim to a length that fits the card, with an ellipsis if cut. */
function clamp(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…";
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Break a title onto at most two lines that fit the card width. */
function wrap(title: string, max: number): string[] {
  const words = title.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > max && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
    if (lines.length === 2) break;
  }
  if (lines.length < 2 && line) lines.push(line);
  const shown = lines.join(" ");
  if (shown.length < words.join(" ").length) {
    lines[lines.length - 1] = clamp(lines[lines.length - 1]!, 22);
  }
  return lines.slice(0, 2);
}

/**
 * Thumbnail artwork for a recipe: a soft tinted field with a deterministic
 * arrangement of translucent discs and arcs, and the dish name set over it.
 * Same recipe always renders identically. No network, no image files.
 */
export function recipeThumbSvg(recipe: Recipe, size = { w: 400, h: 300 }): string {
  const { w, h } = size;
  const pal = PALETTES[recipe.category] ?? PALETTES.uncategorized;
  const rand = rng(hash(recipe.slug));

  // A loose cluster of discs — reads as plates and bowls without depicting food.
  let shapes = "";
  const count = 4 + Math.floor(rand() * 3);
  for (let i = 0; i < count; i++) {
    const cx = 60 + rand() * (w - 120);
    const cy = 40 + rand() * (h - 150);
    const r = 30 + rand() * 62;
    const op = 0.1 + rand() * 0.2;
    shapes += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${pal.ink}" opacity="${op.toFixed(3)}"/>`;
    if (rand() > 0.45) {
      shapes += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r * 0.62).toFixed(1)}" fill="none" stroke="${pal.ink}" stroke-opacity="${(op + 0.22).toFixed(3)}" stroke-width="1.5"/>`;
    }
  }

  const lines = wrap(recipe.title, 22);
  const meta = clamp(
    [recipe.time, recipe.servings && `serves ${recipe.servings}`].filter(Boolean).join("  ·  "),
    44
  );

  // Separate <text> elements rather than tspan/dy — some SVG renderers drop the
  // line break and run the words together.
  const firstY = lines.length === 2 ? h - 68 : h - 46;
  const titleSvg = lines
    .map(
      (l, i) =>
        `<text x="22" y="${firstY + i * 26}" font-family="ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif" font-size="21" font-weight="600" fill="#f2f5f2">${esc(l)}</text>`
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(recipe.title)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${pal.a}"/><stop offset="100%" stop-color="${pal.b}"/>
    </linearGradient>
    <linearGradient id="veil" x1="0" y1="0" x2="0" y2="1">
      <stop offset="45%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.72"/>
    </linearGradient>
    <clipPath id="clip"><rect width="${w}" height="${h}" rx="2"/></clipPath>
  </defs>

  <g clip-path="url(#clip)">
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    ${shapes}
    <rect width="${w}" height="${h}" fill="url(#veil)"/>
    ${titleSvg}
    <text x="22" y="${h - 22}" font-family="ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif"
          font-size="12.5" fill="${pal.ink}" opacity="0.85">${esc(meta)}</text>
  </g>
  <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" fill="none" stroke="${pal.ink}" stroke-opacity="0.22"/>
</svg>`;
}
