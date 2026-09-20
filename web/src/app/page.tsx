import Link from "next/link";
import { getAllRecipes } from "@/lib/recipes";
import { CATEGORY_LABELS, categoryRank } from "@/lib/categories";
import { getCurrentRound, getMenu } from "@/lib/db";
import { TerminalShell, SiteHeader, Panel } from "@/components/chrome";
import { RecipeCard } from "@/components/recipe-card";
import { label } from "@/lib/week";

export const dynamic = "force-dynamic";

export default function Home() {
  const recipes = getAllRecipes();
  const round = safeRound();
  const menuSet = round ? safeMenu(round.id) : false;

  const byCategory = new Map<string, typeof recipes>();
  for (const r of recipes) {
    const list = byCategory.get(r.category) ?? [];
    list.push(r);
    byCategory.set(r.category, list);
  }
  const categories = [...byCategory.keys()].sort(
    (a, b) => categoryRank(a) - categoryRank(b) || a.localeCompare(b)
  );

  return (
    <TerminalShell>
      <SiteHeader />

      <div className="relative z-10 mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl text-[var(--color-fg)]">Recipes</h1>
          <p className="mt-1 text-sm text-[var(--color-fg-dim)]">
            {recipes.length} dishes across {categories.length} categories
          </p>
        </div>
        <nav className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <a
              key={cat}
              href={`#${cat}`}
              className="border border-[var(--color-line-hot)] px-2.5 py-1 text-xs text-[var(--color-fg-dim)] transition-colors hover:border-[var(--color-green)] hover:text-[var(--color-green)]"
            >
              {CATEGORY_LABELS[cat] ?? cat}
              <span className="ml-1.5 text-[var(--color-fg-faint)]">
                {byCategory.get(cat)!.length}
              </span>
            </a>
          ))}
        </nav>
      </div>

      {round && menuSet && (
        <Panel className="mb-6 border-[var(--color-cyan)]/40">
          <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
            <p className="text-sm">
              <span className="text-[var(--color-cyan)]">▸</span> Menu for the week of{" "}
              <strong className="text-[var(--color-fg)]">{label(round.startDate)}</strong> is set.
            </p>
            <Link href={`/menu/${round.id}`} className="text-xs text-[var(--color-cyan)] hover:underline">
              see this week&apos;s lunches →
            </Link>
          </div>
        </Panel>
      )}

      {round?.status === "open" && !menuSet && (
        <Panel className="mb-6 border-[var(--color-green)]/40">
          <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
            <p className="text-sm">
              <span className="text-[var(--color-green)]">▸</span> Voting is open for the week of{" "}
              <strong className="text-[var(--color-fg)]">{label(round.startDate)}</strong>.
            </p>
            <p className="text-xs text-[var(--color-fg-faint)]">use the link from your email</p>
          </div>
        </Panel>
      )}

      {categories.map((cat) => {
        const list = byCategory.get(cat)!;
        return (
          <section key={cat} id={cat} className="relative z-10 mb-9 scroll-mt-4">
            <h2 className="mb-3 flex items-baseline gap-2 border-b border-[var(--color-line-hot)] pb-1.5">
              <span className="text-sm tracking-wider text-[var(--color-fg-dim)] uppercase">
                {CATEGORY_LABELS[cat] ?? cat}
              </span>
              <span className="text-xs text-[var(--color-fg-faint)]">{list.length}</span>
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {list.map((r) => (
                <RecipeCard key={r.slug} recipe={r} />
              ))}
            </div>
          </section>
        );
      })}

      {recipes.length === 0 && (
        <Panel title="empty">
          <div className="p-6 text-[var(--color-fg-dim)]">
            <p>No recipes found in <code className="text-[var(--color-amber)]">../recipes</code>.</p>
            <p className="mt-2 text-xs">Drop a markdown file in and reload.</p>
          </div>
        </Panel>
      )}

      <footer className="relative z-10 mt-10 border-t border-[var(--color-line-hot)] pt-3 text-xs text-[var(--color-fg-faint)]">
        <Link href="/admin" className="hover:text-[var(--color-fg-dim)]">Admin</Link>
      </footer>
    </TerminalShell>
  );
}

function safeMenu(roundId: number) {
  try {
    return getMenu(roundId).length > 0;
  } catch {
    return false;
  }
}

function safeRound() {
  try {
    return getCurrentRound();
  } catch {
    return null;
  }
}
