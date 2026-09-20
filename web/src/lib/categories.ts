/** Display labels for recipe categories.
 *  Kept free of node builtins so client components can import it. */
export const CATEGORY_LABELS: Record<string, string> = {
  mains: "mains",
  "pasta-and-rice": "pasta & rice",
  sauces: "sauces",
  seafood: "seafood",
  sides: "sides",
  breakfast: "breakfast",
  desserts: "desserts",
};

/**
 * Categories that never stand alone as a lunch, so they're hidden from the
 * weekly ballot. They still appear in the recipe index — this only affects
 * voting. Edit this one set to change what's votable.
 */
export const NON_VOTABLE_CATEGORIES: ReadonlySet<string> = new Set([
  "sauces",
  "breakfast",
  "desserts",
]);

export function isVotable(category: string): boolean {
  return !NON_VOTABLE_CATEGORIES.has(category);
}

/**
 * Display order for category sections. Lunch-shaped categories come first;
 * breakfast and desserts sit at the end since they're not what you're usually
 * scanning for. A category not listed here lands just before that trailing pair.
 */
export const CATEGORY_ORDER: readonly string[] = [
  "mains",
  "pasta-and-rice",
  "seafood",
  "sides",
  "sauces",
  "breakfast",
  "desserts",
];

const TRAILING_FROM = CATEGORY_ORDER.indexOf("breakfast");

export function categoryRank(category: string): number {
  const i = CATEGORY_ORDER.indexOf(category);
  return i === -1 ? TRAILING_FROM - 0.5 : i;
}
