import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllRecipes, getRecipe } from "@/lib/recipes";
import { CATEGORY_LABELS } from "@/lib/categories";
import { servingsLabel } from "@/lib/format";
import { TerminalShell, SiteHeader, Panel, Tag } from "@/components/chrome";

export const dynamic = "force-dynamic";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = getRecipe(slug);
  if (!recipe) notFound();

  const tone =
    recipe.status === "incomplete" ? "red" : recipe.status === "reconstructed" ? "amber" : "green";

  return (
    <TerminalShell>
      <SiteHeader crumb={recipe.title} />

      <article className="relative z-10">
        {/* Hero */}
        <div className="relative mb-6 overflow-hidden border border-[var(--color-line-hot)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/thumb/${recipe.slug}`}
            alt=""
            width={1000}
            height={420}
            className="h-[220px] w-full object-cover sm:h-[300px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 p-4">
            <div>
              <h1 className="text-2xl text-[var(--color-fg)] sm:text-3xl">{recipe.title}</h1>
              <p className="mt-1 text-sm text-[var(--color-fg-dim)]">
                {CATEGORY_LABELS[recipe.category] ?? recipe.category}
                {recipe.servings && <> · {servingsLabel(recipe.servings)}</>}
                {recipe.time && <> · {recipe.time}</>}
                {" · "}{recipe.language.toUpperCase()}
              </p>
            </div>
            {recipe.status !== "complete" && <Tag tone={tone}>{recipe.status}</Tag>}
          </div>
        </div>

        {recipe.banner && (
          <Panel
            className={`mb-5 ${
              recipe.status === "incomplete"
                ? "border-[var(--color-red)]/50"
                : "border-[var(--color-amber)]/50"
            }`}
          >
            <p
              className={`px-3 py-2.5 text-sm ${
                recipe.status === "incomplete"
                  ? "text-[var(--color-red)]"
                  : "text-[var(--color-amber)]"
              }`}
            >
              {recipe.banner}
            </p>
          </Panel>
        )}

        {recipe.description && (
          <p className="mb-6 max-w-prose text-[var(--color-fg-dim)]">{recipe.description}</p>
        )}

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:items-start">
          <Panel title="ingredients">
            <div className="space-y-4 px-3 py-3">
              {recipe.ingredients.map((group, gi) => (
                <div key={gi}>
                  {group.label && (
                    <p className="mb-1.5 text-xs tracking-wider text-[var(--color-amber)] uppercase">
                      {group.label}
                    </p>
                  )}
                  <ul className="space-y-1.5">
                    {group.items.map((item, i) => (
                      <li key={i} className="flex gap-2.5 text-sm">
                        <span className="mt-[7px] size-1 shrink-0 rounded-full bg-[var(--color-fg-faint)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {recipe.ingredients.length === 0 && (
                <p className="text-sm text-[var(--color-fg-faint)]">none recorded</p>
              )}
            </div>
          </Panel>

          <Panel title="method">
            <ol className="space-y-3 px-3 py-3">
              {recipe.method.map((step, i) =>
                step.startsWith("## ") ? (
                  <li
                    key={i}
                    className="list-none pt-2 text-xs tracking-wider text-[var(--color-amber)] uppercase"
                  >
                    {step.slice(3)}
                  </li>
                ) : (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex size-5 shrink-0 items-center justify-center border border-[var(--color-line-hot)] text-[11px] text-[var(--color-fg-dim)] tabular-nums">
                      {countStep(recipe.method, i)}
                    </span>
                    <span className="min-w-0 pt-px">{step}</span>
                  </li>
                )
              )}
              {recipe.method.length === 0 && (
                <li className="list-none text-sm text-[var(--color-red)]">not recorded</li>
              )}
            </ol>
          </Panel>
        </div>

        {recipe.notes.length > 0 && (
          <Panel title="notes" className="mt-3">
            <ul className="space-y-1.5 px-3 py-3">
              {recipe.notes.map((n, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-[var(--color-fg-dim)]">
                  <span className="mt-[7px] size-1 shrink-0 rounded-full bg-[var(--color-fg-faint)]" />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-line-hot)] pt-3 text-xs text-[var(--color-fg-faint)]">
          <span>{recipe.file}</span>
          <Link href="/" className="hover:text-[var(--color-fg-dim)]">← All recipes</Link>
        </footer>
      </article>
    </TerminalShell>
  );
}

/** Numbering that skips the bold sub-headers stored as "## ...". */
function countStep(steps: string[], index: number): number {
  let n = 0;
  for (let i = 0; i <= index; i++) if (!steps[i]!.startsWith("## ")) n++;
  return n;
}

export async function generateStaticParams() {
  return getAllRecipes().map((r) => ({ slug: r.slug }));
}
