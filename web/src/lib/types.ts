export type RecipeStatus = "complete" | "reconstructed" | "incomplete";
export type Category =
  | "pasta-and-rice" | "sauces" | "seafood"
  | "sides" | "breakfast" | "desserts";

export interface IngredientGroup {
  /** Bold label like "For the base"; null for the ungrouped top list. */
  label: string | null;
  items: string[];
}

export interface Recipe {
  slug: string;
  title: string;
  category: Category | string;
  servings: string;
  time: string;
  language: "en" | "sl" | string;
  status: RecipeStatus;
  /** Populated when status is incomplete / reconstructed. */
  note: string | null;
  /** Leading prose under the H1, banner stripped. */
  description: string;
  /** The ">" banner, if any, as plain text. */
  banner: string | null;
  ingredients: IngredientGroup[];
  method: string[];
  notes: string[];
  /** Relative path from the repo root, for agents. */
  file: string;
}

export type Slot = "weekday" | "weekend";

export interface RoundDay {
  /** ISO date, YYYY-MM-DD */
  date: string;
  slot: Slot;
  /** false when the family is away and no lunch is needed at home. */
  active: boolean;
}

export interface Round {
  id: number;
  createdAt: string;
  startDate: string;
  status: "open" | "closed";
  days: RoundDay[];
}

/** One day of the finished weekly menu. `override` marks a dish the admin
 *  put on the menu by hand rather than because it won the vote. */
export interface MenuEntry {
  date: string;
  slug: string;
  override: boolean;
}

export interface Ballot {
  id: number;
  roundId: number;
  voter: string;
  weekday: string[];
  weekend: string[];
  submittedAt: string;
}
