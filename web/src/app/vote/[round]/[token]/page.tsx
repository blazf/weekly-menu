import { notFound } from "next/navigation";
import { getRound, getBallot, getMenu } from "@/lib/db";
import Link from "next/link";
import { verifyVoter } from "@/lib/family";
import { getAllRecipes } from "@/lib/recipes";
import { isVotable } from "@/lib/categories";
import { quotas, label } from "@/lib/week";
import { Panel } from "@/components/chrome";
import { Ballot } from "@/components/ballot";

export const dynamic = "force-dynamic";

function Notice({
  tone, title, children,
}: { tone: "warn" | "error"; title: string; children?: React.ReactNode }) {
  const color = tone === "error" ? "var(--color-red)" : "var(--color-amber)";
  return (
    <Panel className="relative z-10" style={{ borderColor: `color-mix(in srgb, ${color} 45%, transparent)` }}>
      <div className="p-5">
        <h1 className="text-lg" style={{ color }}>{title}</h1>
        {children && <div className="mt-2 text-sm text-[var(--color-fg-dim)]">{children}</div>}
      </div>
    </Panel>
  );
}

export default async function VotePage({
  params,
}: {
  params: Promise<{ round: string; token: string }>;
}) {
  const { round: roundParam, token } = await params;
  const roundId = Number(roundParam);
  if (!Number.isInteger(roundId)) notFound();

  const round = getRound(roundId);
  if (!round) notFound();

  const voter = verifyVoter(roundId, token);
  if (!voter) {
    return (
      <Notice tone="error" title="This voting link isn't valid">
        Please use the exact link from your email. If it was for an earlier week, ask for a new one.
      </Notice>
    );
  }

  const existing = getBallot(roundId, voter);

  if (round.status === "closed") {
    const menuSet = getMenu(roundId).length > 0;
    return (
      <Notice tone="warn" title="Voting has closed for this week">
        <p>
          {existing
            ? `Your vote was counted — ${existing.weekday.length} weekday and ${existing.weekend.length} weekend picks.`
            : "You didn't get a vote in this time."}
        </p>
        {menuSet && (
          <p className="mt-2">
            <Link href={`/menu/${roundId}`} className="text-[var(--color-green)] hover:underline">
              See the menu for the week →
            </Link>
          </p>
        )}
      </Notice>
    );
  }

  // Sauces, breakfast and desserts aren't lunches — see NON_VOTABLE_CATEGORIES.
  const recipes = getAllRecipes().filter((r) => isVotable(r.category));
  const q = quotas(round.days);
  const activeDays = round.days.filter((d) => d.active);
  const offDays = round.days.filter((d) => !d.active);

  return (
    <div className="relative z-10">
      <header className="mb-6">
        <p className="text-sm text-[var(--color-fg-dim)]">Hi {voter}</p>
        <h1 className="mt-1 text-2xl text-[var(--color-fg)]">
          What should we eat next week?
        </h1>
        <p className="mt-1 text-[var(--color-fg-dim)]">Week of {label(round.startDate)}</p>

        <Panel className="mt-4">
          <div className="p-4">
            <p className="text-xs tracking-wider text-[var(--color-fg-faint)] uppercase">
              Eating at home
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {activeDays.map((d) => (
                <li
                  key={d.date}
                  className="rounded-full border border-[var(--color-green)]/35 px-3 py-1 text-sm text-[var(--color-green)]"
                >
                  {label(d.date)}
                </li>
              ))}
              {activeDays.length === 0 && (
                <li className="text-sm text-[var(--color-fg-dim)]">No days at home this week.</li>
              )}
            </ul>
            {offDays.length > 0 && (
              <p className="mt-3 text-sm text-[var(--color-amber)]">
                Away on {offDays.map((d) => label(d.date)).join(", ")} — no lunch needed.
              </p>
            )}
          </div>
        </Panel>
      </header>

      <Ballot
        roundId={roundId}
        token={token}
        recipes={recipes}
        quota={q}
        initialWeekday={existing?.weekday ?? []}
        initialWeekend={existing?.weekend ?? []}
        alreadyVoted={Boolean(existing)}
      />
    </div>
  );
}
