import { NextResponse } from "next/server";
import { checkPassword, grantAdmin, revokeAdmin, isAdmin } from "@/lib/auth";
import {
  createRound, getCurrentRound, getRound, setDayActive, setRoundStatus,
  deleteRound, setMenu, getMenu, getBallots, tally,
} from "@/lib/db";
import { buildWeek, nextRoundStart, parseIso, iso } from "@/lib/week";
import { sendInvites, sendMenu } from "@/lib/mail";
import { getRecipeMap } from "@/lib/recipes";
import { getFamily } from "@/lib/family";
import { summarizeMenu } from "@/lib/menu";
import type { MenuEntry } from "@/lib/types";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const action = String(body.action ?? "");

  // --- login is the only unauthenticated action -------------------------
  if (action === "login") {
    const password = String(body.password ?? "");
    if (!checkPassword(password)) {
      return NextResponse.json({ error: "wrong password" }, { status: 401 });
    }
    await grantAdmin();
    return NextResponse.json({ ok: true });
  }

  if (action === "logout") {
    await revokeAdmin();
    return NextResponse.json({ ok: true });
  }

  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  switch (action) {
    case "createRound": {
      const raw = typeof body.startDate === "string" && body.startDate
        ? parseIso(body.startDate)
        : nextRoundStart(getCurrentRound()?.startDate ?? null);
      if (Number.isNaN(raw.getTime())) {
        return NextResponse.json({ error: "bad startDate" }, { status: 400 });
      }
      const round = createRound(iso(raw), buildWeek(raw));
      return NextResponse.json({ ok: true, round });
    }

    case "setDay": {
      const roundId = Number(body.roundId);
      const date = String(body.date ?? "");
      const active = Boolean(body.active);
      const round = getRound(roundId);
      if (!round) return NextResponse.json({ error: "no such round" }, { status: 404 });
      if (!round.days.some((d) => d.date === date)) {
        return NextResponse.json({ error: "date not in round" }, { status: 400 });
      }
      setDayActive(roundId, date, active);
      return NextResponse.json({ ok: true, round: getRound(roundId) });
    }

    case "setStatus": {
      const roundId = Number(body.roundId);
      const status = String(body.status ?? "");
      if (status !== "open" && status !== "closed") {
        return NextResponse.json({ error: "bad status" }, { status: 400 });
      }
      if (!getRound(roundId)) {
        return NextResponse.json({ error: "no such round" }, { status: 404 });
      }
      setRoundStatus(roundId, status);
      return NextResponse.json({ ok: true, round: getRound(roundId) });
    }

    case "deleteRound": {
      const roundId = Number(body.roundId);
      const current = getCurrentRound();
      // Only the latest round can be discarded — it's the "undo" for a stray
      // "Next week" click, not a general history editor.
      if (!current || current.id !== roundId) {
        return NextResponse.json({ error: "only the current round can be discarded" }, { status: 400 });
      }
      deleteRound(roundId);
      return NextResponse.json({ ok: true, round: getCurrentRound() });
    }

    case "setMenu": {
      const roundId = Number(body.roundId);
      const round = getRound(roundId);
      if (!round) return NextResponse.json({ error: "no such round" }, { status: 404 });
      const raw = Array.isArray(body.entries) ? (body.entries as unknown[]) : null;
      if (!raw) return NextResponse.json({ error: "missing entries" }, { status: 400 });

      const recipes = getRecipeMap();
      const votedFor = tally(roundId);
      const voted = new Set([...votedFor.weekday, ...votedFor.weekend].map(([slug]) => slug));
      const entries: MenuEntry[] = [];
      for (const e of raw) {
        const o = (e ?? {}) as Record<string, unknown>;
        const date = String(o.date ?? "");
        const slug = String(o.slug ?? "");
        if (!slug) continue; // an empty day is simply left off the menu
        if (!round.days.some((d) => d.date === date)) {
          return NextResponse.json({ error: `date not in round: ${date}` }, { status: 400 });
        }
        if (!recipes.has(slug)) {
          return NextResponse.json({ error: `unknown recipe: ${slug}` }, { status: 400 });
        }
        // "override" is derived, not trusted from the client: a dish nobody
        // voted for is by definition the admin's own pick.
        entries.push({ date, slug, override: !voted.has(slug) });
      }
      setMenu(roundId, entries);
      return NextResponse.json({ ok: true, menu: getMenu(roundId) });
    }

    case "sendMenu": {
      const round = getCurrentRound();
      if (!round) return NextResponse.json({ error: "no round yet" }, { status: 400 });
      const menu = getMenu(round.id);
      if (menu.length === 0) {
        return NextResponse.json({ error: "save a menu first" }, { status: 409 });
      }
      const summary = summarizeMenu(
        round, menu, tally(round.id), getRecipeMap(), getBallots(round.id).length, getFamily().length
      );
      const result = await sendMenu(summary, round.id);
      return NextResponse.json({ ok: true, result });
    }

    case "send": {
      const round = getCurrentRound();
      if (!round) return NextResponse.json({ error: "no round yet" }, { status: 400 });
      if (round.status !== "open") {
        return NextResponse.json({ error: "round is closed — reopen it first" }, { status: 409 });
      }
      const result = await sendInvites(round);
      return NextResponse.json({ ok: true, result });
    }

    default:
      return NextResponse.json({ error: `unknown action: ${action}` }, { status: 400 });
  }
}
