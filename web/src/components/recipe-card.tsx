import Link from "next/link";
import { Tag } from "./chrome";
import { servingsLabel } from "@/lib/format";
import type { Recipe } from "@/lib/types";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link
      href={`/r/${recipe.slug}`}
      className="group relative z-10 block overflow-hidden border border-[var(--color-line-hot)] bg-[var(--color-panel)] transition-colors hover:border-[var(--color-green)]"
    >
      <div className="relative aspect-4/3 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/thumb/${recipe.slug}`}
          alt=""
          width={400}
          height={300}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {recipe.status !== "complete" && (
          <span className="absolute top-2 right-2">
            <Tag tone={recipe.status === "incomplete" ? "red" : "amber"}>
              {recipe.status === "incomplete" ? "!" : "~"}
            </Tag>
          </span>
        )}
      </div>
      <div className="border-t border-[var(--color-line-hot)] px-2 py-1.5">
        <h3 className="line-clamp-2 text-xs leading-snug text-[var(--color-fg)] group-hover:text-[var(--color-green)]">
          {recipe.title}
        </h3>
        <p className="mt-0.5 truncate text-[10px] text-[var(--color-fg-faint)]">
          {recipe.time || servingsLabel(recipe.servings)}
        </p>
      </div>
    </Link>
  );
}
