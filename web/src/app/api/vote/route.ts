import { NextResponse } from "next/server";
import { getRound, submitBallot } from "@/lib/db";
import { verifyVoter } from "@/lib/family";
import { getRecipeMap } from "@/lib/recipes";
import { isVotable } from "@/lib/categories";
import { quotas } from "@/lib/week";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const { roundId, token, weekday, weekend } = (body ?? {}) as {
    roundId?: number; token?: string; weekday?: unknown; weekend?: unknown;
  };

  if (typeof roundId !== "number" || typeof token !== "string") {
    return NextResponse.json({ error: "missing roundId or token" }, { status: 400 });
  }

  const round = getRound(roundId);
  if (!round) return NextResponse.json({ error: "no such round" }, { status: 404 });
  if (round.status !== "open") {
    return NextResponse.json({ error: "voting is closed" }, { status: 409 });
  }

  const voter = verifyVoter(roundId, token);
  if (!voter) return NextResponse.json({ error: "invalid link" }, { status: 403 });

  const asSlugs = (v: unknown): string[] =>
    Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === "string"))] : [];

  const wd = asSlugs(weekday);
  const we = asSlugs(weekend);

  // Every pick must be a real recipe in a votable category.
  const known = getRecipeMap();
  for (const slug of [...wd, ...we]) {
    const recipe = known.get(slug);
    if (!recipe) {
      return NextResponse.json({ error: `unknown recipe: ${slug}` }, { status: 400 });
    }
    if (!isVotable(recipe.category)) {
      return NextResponse.json(
        { error: `${recipe.category} can't be voted as a lunch` },
        { status: 400 }
      );
    }
  }

  // Enforce the same quota the UI shows, so a crafted request can't bypass it.
  const q = quotas(round.days);
  if (wd.length < q.weekday.min || wd.length > q.weekday.max) {
    return NextResponse.json(
      { error: `pick ${q.weekday.min}-${q.weekday.max} weekday lunches` },
      { status: 400 }
    );
  }
  if (we.length < q.weekend.min || we.length > q.weekend.max) {
    return NextResponse.json(
      { error: `pick ${q.weekend.min}-${q.weekend.max} weekend lunches` },
      { status: 400 }
    );
  }

  submitBallot(roundId, voter, wd, we);
  return NextResponse.json({ ok: true, voter });
}
