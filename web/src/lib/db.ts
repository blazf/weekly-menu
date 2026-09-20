import Database from "better-sqlite3";
import path from "node:path";
import { iso, weekEnd } from "./week";
import type { Round, RoundDay, Ballot, Slot, MenuEntry } from "./types";

const DB_PATH = process.env.LUNCH_DB ?? path.resolve(process.cwd(), "lunch.db");

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;
  const d = new Database(DB_PATH);
  d.pragma("journal_mode = WAL");
  d.pragma("foreign_keys = ON"); // off by default in SQLite; needed for ON DELETE CASCADE
  d.exec(`
    CREATE TABLE IF NOT EXISTS rounds (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      start_date TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'open'
    );
    CREATE TABLE IF NOT EXISTS round_days (
      round_id INTEGER NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
      date     TEXT NOT NULL,
      slot     TEXT NOT NULL,
      active   INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (round_id, date)
    );
    CREATE TABLE IF NOT EXISTS ballots (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      round_id     INTEGER NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
      voter        TEXT NOT NULL,
      weekday      TEXT NOT NULL,
      weekend      TEXT NOT NULL,
      submitted_at TEXT NOT NULL,
      UNIQUE (round_id, voter)
    );
    CREATE TABLE IF NOT EXISTS menu (
      round_id INTEGER NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
      date     TEXT NOT NULL,
      slug     TEXT NOT NULL,
      override INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (round_id, date)
    );
  `);
  _db = d;
  return d;
}

type RoundRow = { id: number; created_at: string; start_date: string; status: string };
type DayRow = { date: string; slot: string; active: number };

function hydrate(row: RoundRow): Round {
  const days = db()
    .prepare<[number], DayRow>(
      `SELECT date, slot, active FROM round_days WHERE round_id = ? ORDER BY date`
    )
    .all(row.id)
    .map((d): RoundDay => ({ date: d.date, slot: d.slot as Slot, active: !!d.active }));
  return {
    id: row.id,
    createdAt: row.created_at,
    startDate: row.start_date,
    status: effectiveStatus(row),
    days,
  };
}

/** A round nobody closed by hand expires on its own once its week is over —
 *  otherwise the site keeps announcing a week that has already been eaten. */
function effectiveStatus(row: RoundRow): Round["status"] {
  if (row.status !== "open") return "closed";
  return weekEnd(row.start_date) < iso(new Date()) ? "closed" : "open";
}

export function getCurrentRound(): Round | null {
  const row = db()
    .prepare<[], RoundRow>(`SELECT * FROM rounds ORDER BY id DESC LIMIT 1`)
    .get();
  return row ? hydrate(row) : null;
}

export function getRound(id: number): Round | null {
  const row = db().prepare<[number], RoundRow>(`SELECT * FROM rounds WHERE id = ?`).get(id);
  return row ? hydrate(row) : null;
}

export function createRound(startDate: string, days: RoundDay[]): Round {
  const d = db();
  const tx = d.transaction(() => {
    const info = d
      .prepare(`INSERT INTO rounds (created_at, start_date, status) VALUES (?, ?, 'open')`)
      .run(new Date().toISOString(), startDate);
    const roundId = Number(info.lastInsertRowid);
    const ins = d.prepare(
      `INSERT INTO round_days (round_id, date, slot, active) VALUES (?, ?, ?, ?)`
    );
    for (const day of days) ins.run(roundId, day.date, day.slot, day.active ? 1 : 0);
    return roundId;
  });
  return getRound(tx())!;
}

export function setDayActive(roundId: number, date: string, active: boolean) {
  db()
    .prepare(`UPDATE round_days SET active = ? WHERE round_id = ? AND date = ?`)
    .run(active ? 1 : 0, roundId, date);
}

/** Remove a round and everything hanging off it (days, ballots). The previous
 *  round, if any, becomes current again. */
export function deleteRound(roundId: number) {
  db().prepare(`DELETE FROM rounds WHERE id = ?`).run(roundId);
}

export function setRoundStatus(roundId: number, status: Round["status"]) {
  db().prepare(`UPDATE rounds SET status = ? WHERE id = ?`).run(status, roundId);
}

export function submitBallot(
  roundId: number,
  voter: string,
  weekday: string[],
  weekend: string[]
) {
  db()
    .prepare(
      `INSERT INTO ballots (round_id, voter, weekday, weekend, submitted_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (round_id, voter) DO UPDATE SET
         weekday = excluded.weekday,
         weekend = excluded.weekend,
         submitted_at = excluded.submitted_at`
    )
    .run(roundId, voter, JSON.stringify(weekday), JSON.stringify(weekend), new Date().toISOString());
}

type BallotRow = {
  id: number; round_id: number; voter: string;
  weekday: string; weekend: string; submitted_at: string;
};

function toBallot(r: BallotRow): Ballot {
  const safe = (s: string): string[] => {
    try {
      const v = JSON.parse(s);
      return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
    } catch {
      return [];
    }
  };
  return {
    id: r.id, roundId: r.round_id, voter: r.voter,
    weekday: safe(r.weekday), weekend: safe(r.weekend),
    submittedAt: r.submitted_at,
  };
}

export function getBallots(roundId: number): Ballot[] {
  return db()
    .prepare<[number], BallotRow>(`SELECT * FROM ballots WHERE round_id = ? ORDER BY submitted_at`)
    .all(roundId)
    .map(toBallot);
}

export function getBallot(roundId: number, voter: string): Ballot | null {
  const r = db()
    .prepare<[number, string], BallotRow>(
      `SELECT * FROM ballots WHERE round_id = ? AND voter = ?`
    )
    .get(roundId, voter);
  return r ? toBallot(r) : null;
}

/** Tally across all ballots, most-voted first. */
export function tally(roundId: number): { weekday: [string, number][]; weekend: [string, number][] } {
  const ballots = getBallots(roundId);
  const count = (pick: (b: Ballot) => string[]) => {
    const m = new Map<string, number>();
    for (const b of ballots) for (const slug of pick(b)) m.set(slug, (m.get(slug) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  };
  return { weekday: count((b) => b.weekday), weekend: count((b) => b.weekend) };
}

// --- menu --------------------------------------------------------------

type MenuRow = { date: string; slug: string; override: number };

export function getMenu(roundId: number): MenuEntry[] {
  return db()
    .prepare<[number], MenuRow>(`SELECT date, slug, override FROM menu WHERE round_id = ? ORDER BY date`)
    .all(roundId)
    .map((r) => ({ date: r.date, slug: r.slug, override: !!r.override }));
}

/** Replace the round's menu wholesale — the admin edits the week as one unit. */
export function setMenu(roundId: number, entries: MenuEntry[]) {
  const d = db();
  d.transaction(() => {
    d.prepare(`DELETE FROM menu WHERE round_id = ?`).run(roundId);
    const ins = d.prepare(`INSERT INTO menu (round_id, date, slug, override) VALUES (?, ?, ?, ?)`);
    for (const e of entries) ins.run(roundId, e.date, e.slug, e.override ? 1 : 0);
  })();
}
