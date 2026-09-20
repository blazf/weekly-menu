import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Recipe, IngredientGroup, RecipeStatus } from "./types";

export { CATEGORY_LABELS } from "./categories";

/** Recipes live as markdown OUTSIDE the app, so agents can add one by
 *  dropping a file in — no database write, no API call, no rebuild. */
const RECIPES_DIR = path.resolve(process.cwd(), "..", "recipes");

const HEAD_INGREDIENTS = /^##\s+(Ingredients|Sestavine)\s*$/i;
const HEAD_METHOD = /^##\s+(Method|Postopek)\s*$/i;
const HEAD_NOTES = /^##\s+(Notes|Nasveti)\s*$/i;
const ANY_H2 = /^##\s+/;

function slugify(file: string) {
  return path.basename(file, ".md");
}

/** Strip markdown emphasis/links so text renders cleanly in a terminal UI. */
export function plain(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .trim();
}

function parseBody(body: string) {
  const lines = body.split("\n");
  let description = "";
  let banner: string | null = null;
  const ingredients: IngredientGroup[] = [];
  const method: string[] = [];
  const notes: string[] = [];

  type Section = "pre" | "ingredients" | "method" | "notes" | "other";
  let section: Section = "pre";
  let group: IngredientGroup | null = null;
  const bannerLines: string[] = [];
  const descLines: string[] = [];

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (/^#\s+/.test(line)) continue; // H1 handled via frontmatter title

    if (ANY_H2.test(line)) {
      if (HEAD_INGREDIENTS.test(line)) section = "ingredients";
      else if (HEAD_METHOD.test(line)) section = "method";
      else if (HEAD_NOTES.test(line)) section = "notes";
      else section = "other";
      group = null;
      continue;
    }

    if (section === "pre") {
      if (line.startsWith(">")) {
        bannerLines.push(line.replace(/^>\s?/, ""));
      } else if (line.trim()) {
        descLines.push(line);
      }
      continue;
    }

    if (section === "ingredients") {
      const bold = line.match(/^\*\*(.+?)\*\*\s*(\*\(.*\)\*)?\s*$/);
      if (bold) {
        group = { label: plain(bold[1] + (bold[2] ? " " + bold[2] : "")), items: [] };
        ingredients.push(group);
        continue;
      }
      const item = line.match(/^[-*]\s+(.*)$/);
      if (item) {
        if (!group) {
          group = { label: null, items: [] };
          ingredients.push(group);
        }
        group.items.push(plain(item[1]));
      }
      continue;
    }

    if (section === "method") {
      const step = line.match(/^\d+\.\s+(.*)$/);
      if (step) {
        method.push(plain(step[1]));
        continue;
      }
      // Bold sub-headers inside the method (e.g. "**Vaniljev biskvit**")
      const sub = line.match(/^\*\*(.+?)\*\*\s*$/);
      if (sub) {
        method.push(`## ${plain(sub[1])}`);
        continue;
      }
      // Continuation of the previous step
      if (line.trim() && method.length && !line.startsWith(">")) {
        method[method.length - 1] += " " + plain(line.replace(/^\s*>\s?/, ""));
      }
      continue;
    }

    if (section === "notes") {
      const item = line.match(/^[-*]\s+(.*)$/);
      if (item) notes.push(plain(item[1]));
      continue;
    }
  }

  banner = bannerLines.length ? plain(bannerLines.join(" ")).replace(/\s+/g, " ") : null;
  description = plain(descLines.join(" ")).replace(/\s+/g, " ");

  return { description, banner, ingredients, method, notes };
}

function readOne(absPath: string, relFile: string): Recipe | null {
  const raw = fs.readFileSync(absPath, "utf8");
  const { data, content } = matter(raw);
  if (!data?.title) return null;

  const parsed = parseBody(content);
  const status = (data.status ?? "complete") as RecipeStatus;

  return {
    slug: slugify(absPath),
    title: String(data.title),
    category: String(data.category ?? "uncategorized"),
    servings: data.servings != null ? String(data.servings) : "",
    time: data.time != null ? String(data.time) : "",
    language: String(data.language ?? "en"),
    status,
    note: data.missing ? String(data.missing) : data.reconstructed ? String(data.reconstructed) : null,
    file: relFile,
    ...parsed,
  };
}

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.isFile() && entry.name.endsWith(".md")) out.push(p);
  }
  return out;
}

/** Read every recipe from disk. Cached per-request by React; the file system
 *  is the source of truth so a new .md file appears without a restart. */
export function getAllRecipes(): Recipe[] {
  const files = walk(RECIPES_DIR);
  const recipes = files
    .map((f) => {
      try {
        return readOne(f, path.relative(path.resolve(process.cwd(), ".."), f));
      } catch {
        return null;
      }
    })
    .filter((r): r is Recipe => r !== null);

  recipes.sort((a, b) => a.title.localeCompare(b.title));
  return recipes;
}

export function getRecipe(slug: string): Recipe | null {
  return getAllRecipes().find((r) => r.slug === slug) ?? null;
}

export function getRecipeMap(): Map<string, Recipe> {
  return new Map(getAllRecipes().map((r) => [r.slug, r]));
}

