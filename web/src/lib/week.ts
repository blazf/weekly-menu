import type { RoundDay, Slot } from "./types";

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseIso(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

/** Sat and Sun are the weekend slot; Mon–Fri are weekdays. */
export function slotFor(d: Date): Slot {
  const g = d.getDay();
  return g === 0 || g === 6 ? "weekend" : "weekday";
}

function midnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** The Saturday that starts the week containing `from` (same day if it is one). */
export function currentSaturday(from = new Date()): Date {
  const d = midnight(from);
  while (d.getDay() !== 6) d.setDate(d.getDate() - 1);
  return d;
}

/** The next Saturday strictly after `from`. */
export function nextSaturday(from = new Date()): Date {
  const d = midnight(from);
  do {
    d.setDate(d.getDate() + 1);
  } while (d.getDay() !== 6);
  return d;
}

/** Last day (Friday) of the Sat–Fri week starting at `startIso`. */
export function weekEnd(startIso: string): string {
  const d = parseIso(startIso);
  d.setDate(d.getDate() + 6);
  return iso(d);
}

/**
 * Where a new round should start: the week we're in right now, unless a round
 * for it (or a later one) already exists — then the Saturday after that one.
 * Creating a round on Sunday for the week that began yesterday is the normal
 * case, not a mistake.
 */
export function nextRoundStart(latestRoundStart: string | null, from = new Date()): Date {
  const thisWeek = currentSaturday(from);
  if (!latestRoundStart) return thisWeek;
  const latest = parseIso(latestRoundStart);
  return latest >= thisWeek ? nextSaturday(latest) : thisWeek;
}

/** Seven consecutive days beginning at `start` (a Saturday). Days already
 *  behind us are switched off, since nobody can vote on yesterday's lunch;
 *  the admin can toggle them back on. */
export function buildWeek(start: Date, today = new Date()): RoundDay[] {
  const cutoff = iso(midnight(today));
  const days: RoundDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const date = iso(d);
    days.push({ date, slot: slotFor(d), active: date >= cutoff });
  }
  return days;
}

export function label(dateIso: string): string {
  const d = parseIso(dateIso);
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
}

/** How many dishes the family needs to pick, given which days are active. */
export function quotas(days: RoundDay[]) {
  const weekday = days.filter((d) => d.slot === "weekday" && d.active).length;
  const weekend = days.filter((d) => d.slot === "weekend" && d.active).length;
  return {
    weekday: { min: Math.min(3, weekday), max: Math.min(5, weekday), days: weekday },
    weekend: { min: Math.min(1, weekend), max: Math.min(2, weekend), days: weekend },
  };
}
