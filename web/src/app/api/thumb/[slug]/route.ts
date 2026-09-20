import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getRecipe } from "@/lib/recipes";
import { recipeThumbSvg } from "@/lib/thumb";

const PHOTO_EXT = ["jpg", "jpeg", "png", "webp", "avif"] as const;
const MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  webp: "image/webp", avif: "image/avif",
};

/**
 * Thumbnail for a recipe.
 * If public/thumbs/<slug>.<ext> exists it wins; otherwise a deterministic
 * terminal-style SVG is generated from the recipe itself.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Reject traversal before touching the filesystem.
  if (!/^[a-z0-9-]+$/i.test(slug)) {
    return new NextResponse("bad slug", { status: 400 });
  }

  const recipe = getRecipe(slug);
  if (!recipe) return new NextResponse("not found", { status: 404 });

  const thumbsDir = path.join(process.cwd(), "public", "thumbs");
  for (const ext of PHOTO_EXT) {
    const candidate = path.join(thumbsDir, `${slug}.${ext}`);
    if (fs.existsSync(candidate)) {
      const buf = fs.readFileSync(candidate);
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type": MIME[ext]!,
          "Cache-Control": "public, max-age=60, stale-while-revalidate=86400",
        },
      });
    }
  }

  return new NextResponse(recipeThumbSvg(recipe), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    },
  });
}
