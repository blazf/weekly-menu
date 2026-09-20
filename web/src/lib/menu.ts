import type { Round, MenuEntry, Recipe } from "./types";
import { label } from "./week";

/** Everything the menu page and the menu email need, already anonymised:
 *  vote counts per dish, never who voted for what. */
export interface MenuSummary {
  weekLabel: string;
  ballots: number;
  family: number;
  days: {
    date: string;
    dayLabel: string;
    active: boolean;
    slug: string | null;
    title: string | null;
    votes: number;
    override: boolean;
  }[];
  tally: {
    weekday: TallyLine[];
    weekend: TallyLine[];
  };
}

export interface TallyLine {
  slug: string;
  title: string;
  votes: number;
  /** On the menu this week. */
  chosen: boolean;
}

export function summarizeMenu(
  round: Round,
  menu: MenuEntry[],
  tally: { weekday: [string, number][]; weekend: [string, number][] },
  recipes: Map<string, Recipe>,
  ballots: number,
  family: number
): MenuSummary {
  const byDate = new Map(menu.map((m) => [m.date, m]));
  const chosen = new Set(menu.map((m) => m.slug));
  const votesFor = (slot: "weekday" | "weekend", slug: string) =>
    tally[slot].find(([s]) => s === slug)?.[1] ?? 0;

  const lines = (slot: "weekday" | "weekend"): TallyLine[] =>
    tally[slot].map(([slug, votes]) => ({
      slug,
      title: recipes.get(slug)?.title ?? slug,
      votes,
      chosen: chosen.has(slug),
    }));

  return {
    weekLabel: label(round.startDate),
    ballots,
    family,
    days: round.days.map((d) => {
      const m = byDate.get(d.date);
      return {
        date: d.date,
        dayLabel: label(d.date),
        active: d.active,
        slug: m?.slug ?? null,
        title: m ? recipes.get(m.slug)?.title ?? m.slug : null,
        votes: m ? votesFor(d.slot, m.slug) : 0,
        override: m?.override ?? false,
      };
    }),
    tally: { weekday: lines("weekday"), weekend: lines("weekend") },
  };
}

/** Best guess from the vote: top weekday dishes onto weekday days, top
 *  weekend dishes onto weekend days, in calendar order. The admin edits from here. */
export function autoMenu(
  round: Round,
  tally: { weekday: [string, number][]; weekend: [string, number][] }
): MenuEntry[] {
  const pools = {
    weekday: tally.weekday.map(([slug]) => slug),
    weekend: tally.weekend.map(([slug]) => slug),
  };
  const out: MenuEntry[] = [];
  for (const d of round.days) {
    if (!d.active) continue;
    const slug = pools[d.slot].shift();
    if (slug) out.push({ date: d.date, slug, override: false });
  }
  return out;
}
