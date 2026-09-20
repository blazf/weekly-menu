import Link from "next/link";
import { notFound } from "next/navigation";
import { getRound, getMenu, getBallots, tally } from "@/lib/db";
import { getRecipeMap } from "@/lib/recipes";
import { getFamily } from "@/lib/family";
import { summarizeMenu, type TallyLine } from "@/lib/menu";
import { TerminalShell, SiteHeader, Panel, Tag } from "@/components/chrome";

export const dynamic = "force-dynamic";

/**
 * The week's menu for the whole family. Public on the LAN like the recipe
 * index — it carries vote counts per dish, never who voted for what.
 */
export default async function MenuPage({ params }: { params: Promise<{ round: string }> }) {
  const { round: roundParam } = await params;
  const roundId = Number(roundParam);
  if (!Number.isInteger(roundId)) notFound();

  const round = getRound(roundId);
  if (!round) notFound();

  const menu = getMenu(roundId);
  const recipes = getRecipeMap();
  const s = summarizeMenu(round, menu, tally(roundId), recipes, getBallots(roundId).length, getFamily().length);

  if (menu.length === 0) {
    return (
      <TerminalShell>
        <SiteHeader crumb="menu" />
        <Panel>
          <div className="p-5">
            <h1 className="text-lg text-[var(--color-amber)]">No menu yet for the week of {s.weekLabel}</h1>
            <p className="mt-2 text-sm text-[var(--color-fg-dim)]">
              {round.status === "open" ? "Voting is still open — check back once it closes." : "The menu hasn't been set yet."}
            </p>
          </div>
        </Panel>
      </TerminalShell>
    );
  }

  return (
    <TerminalShell>
      <SiteHeader crumb="menu" />

      <div className="relative z-10 mb-6">
        <p className="text-xs tracking-wider text-[var(--color-fg-faint)] uppercase">This week&apos;s lunches</p>
        <h1 className="mt-1 text-2xl text-[var(--color-fg)]">Week of {s.weekLabel}</h1>
        <p className="mt-1 text-sm text-[var(--color-fg-dim)]">
          {s.ballots} of {s.family} voted · {s.days.filter((d) => d.active).length} lunches at home
        </p>
      </div>

      <ol className="relative z-10 mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {s.days.map((d) => (
          <li key={d.date}>
            <DayCard day={d} status={d.slug ? recipes.get(d.slug)?.status : undefined} />
          </li>
        ))}
      </ol>

      <Panel title="how the vote went" right={<Tag>{s.ballots} ballots · anonymous</Tag>}>
        <div className="grid gap-5 px-3 py-3 sm:grid-cols-2">
          <TallyBars title="weekday" lines={s.tally.weekday} total={s.ballots} />
          <TallyBars title="weekend" lines={s.tally.weekend} total={s.ballots} />
        </div>
        <p className="border-t px-3 py-2 text-xs text-[var(--color-fg-faint)]">
          <span className="text-[var(--color-green)]">✓</span> on the menu ·{" "}
          <span className="text-[var(--color-amber)]">chef&apos;s pick</span> = added by the cook, nobody voted for it
        </p>
      </Panel>
    </TerminalShell>
  );
}

function DayCard({
  day, status,
}: {
  day: { date: string; dayLabel: string; active: boolean; slug: string | null; title: string | null; votes: number; override: boolean };
  status?: string;
}) {
  // Date only up top — a badge here wraps at 7-across and breaks the row.
  const head = (
    <div className="border-b border-[var(--color-line-hot)] px-2 py-1 text-xs whitespace-nowrap text-[var(--color-fg-dim)]">
      {day.dayLabel}
    </div>
  );

  if (!day.active) {
    return (
      <div className="border border-[var(--color-line)] bg-[var(--color-panel)] opacity-50">
        {head}
        <div className="flex aspect-4/3 items-center justify-center text-xs text-[var(--color-fg-faint)]">away</div>
        <div className="border-t px-2 py-1.5 text-xs text-[var(--color-fg-faint)]">no lunch at home</div>
      </div>
    );
  }
  if (!day.slug) {
    return (
      <div className="border border-[var(--color-line)] bg-[var(--color-panel)]">
        {head}
        <div className="flex aspect-4/3 items-center justify-center text-xs text-[var(--color-fg-faint)]">—</div>
        <div className="border-t px-2 py-1.5 text-xs text-[var(--color-fg-faint)]">nothing planned</div>
      </div>
    );
  }
  return (
    <Link
      href={`/r/${day.slug}`}
      className="group block overflow-hidden border border-[var(--color-line-hot)] bg-[var(--color-panel)] transition-colors hover:border-[var(--color-green)]"
    >
      {head}
      <div className="relative aspect-4/3 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/thumb/${day.slug}`}
          alt=""
          width={400}
          height={300}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {status && status !== "complete" && (
          <span className="absolute top-2 right-2">
            <Tag tone={status === "incomplete" ? "red" : "amber"}>{status === "incomplete" ? "!" : "~"}</Tag>
          </span>
        )}
        {/* Vote badge over the photo, on a dark backing so it reads on any picture. */}
        <span className="absolute bottom-2 left-2 bg-[var(--color-bg)]/85 whitespace-nowrap">
          {day.override
            ? <Tag tone="amber">chef&apos;s pick</Tag>
            : <Tag tone="green">{day.votes} vote{day.votes === 1 ? "" : "s"}</Tag>}
        </span>
      </div>
      <div className="border-t border-[var(--color-line-hot)] px-2 py-1.5">
        <h3 className="line-clamp-2 text-xs leading-snug text-[var(--color-fg)] group-hover:text-[var(--color-green)]">
          {day.title}
        </h3>
      </div>
    </Link>
  );
}

function TallyBars({ title, lines, total }: { title: string; lines: TallyLine[]; total: number }) {
  return (
    <div>
      <p className="mb-2 text-xs tracking-wider text-[var(--color-fg-faint)] uppercase">{title}</p>
      <ul className="space-y-1.5">
        {lines.map((l) => (
          <li key={l.slug} className="text-sm">
            <div className="flex items-center gap-2">
              <span className={`min-w-0 flex-1 truncate ${l.chosen ? "text-[var(--color-fg)]" : "text-[var(--color-fg-dim)]"}`}>
                {l.chosen && <span className="mr-1 text-[var(--color-green)]">✓</span>}
                {l.title}
              </span>
              <span className={`w-6 shrink-0 text-right tabular-nums ${l.chosen ? "text-[var(--color-green)]" : "text-[var(--color-fg-dim)]"}`}>
                {l.votes}
              </span>
            </div>
            <div className="mt-0.5 h-1.5 w-full bg-[var(--color-line)]">
              <div
                className={l.chosen ? "h-full bg-[var(--color-green)]" : "h-full bg-[var(--color-line-hot)]"}
                style={{ width: `${total ? (l.votes / total) * 100 : 0}%` }}
              />
            </div>
          </li>
        ))}
        {lines.length === 0 && <li className="text-sm text-[var(--color-fg-faint)]">nobody voted in this slot</li>}
      </ul>
    </div>
  );
}
