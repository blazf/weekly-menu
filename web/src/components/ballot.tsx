"use client";

import { useMemo, useState } from "react";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { Recipe, Slot } from "@/lib/types";

interface Quota { min: number; max: number; days: number }

export function Ballot({
  roundId, token, recipes, quota, initialWeekday, initialWeekend, alreadyVoted,
}: {
  roundId: number;
  token: string;
  recipes: Recipe[];
  quota: { weekday: Quota; weekend: Quota };
  initialWeekday: string[];
  initialWeekend: string[];
  alreadyVoted: boolean;
}) {
  const [weekday, setWeekday] = useState<string[]>(initialWeekday);
  const [weekend, setWeekend] = useState<string[]>(initialWeekend);
  const [q, setQ] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved">(alreadyVoted ? "saved" : "idle");
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return recipes;
    return recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(needle) ||
        r.category.toLowerCase().includes(needle) ||
        r.ingredients.some((g) => g.items.some((i) => i.toLowerCase().includes(needle)))
    );
  }, [recipes, q]);

  function toggle(slot: Slot, slug: string) {
    setState("idle");
    setError(null);
    const [list, set, max] =
      slot === "weekday"
        ? ([weekday, setWeekday, quota.weekday.max] as const)
        : ([weekend, setWeekend, quota.weekend.max] as const);
    if (list.includes(slug)) set(list.filter((s) => s !== slug));
    else if (list.length < max) set([...list, slug]);
  }

  const wdOk = weekday.length >= quota.weekday.min && weekday.length <= quota.weekday.max;
  const weOk = weekend.length >= quota.weekend.min && weekend.length <= quota.weekend.max;
  const ready = wdOk && weOk;

  async function submit() {
    setState("saving");
    setError(null);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId, token, weekday, weekend }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save your vote.");
        setState("idle");
        return;
      }
      setState("saved");
    } catch {
      setError("Network problem — is the server still running?");
      setState("idle");
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Counter label="Weekday lunches" picked={weekday.length} quota={quota.weekday} ok={wdOk} />
        <Counter label="Weekend lunches" picked={weekend.length} quota={quota.weekend} ok={weOk} />
      </div>

      {state === "saved" && !error && (
        <p role="status" className="border border-[var(--color-green)]/40 bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-green)]">
          ✓ Your vote is saved — you can change it until voting closes.
        </p>
      )}
      {error && (
        <p role="alert" className="border border-[var(--color-red)]/45 bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-red)]">
          {error}
        </p>
      )}

      <label htmlFor="filter" className="sr-only">Search recipes</label>
      <input
        id="filter"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search recipes…"
        className="h-10 w-full border border-[var(--color-line-hot)] bg-[var(--color-panel)] px-3 text-base text-[var(--color-fg)] placeholder:text-[var(--color-fg-faint)] focus:border-[var(--color-green)] focus:outline-none"
      />

      <ul className="grid gap-1.5 lg:grid-cols-2">
        {filtered.map((r) => {
          const inWd = weekday.includes(r.slug);
          const inWe = weekend.includes(r.slug);
          const picked = inWd || inWe;
          return (
            <li
              key={r.slug}
              className={`flex flex-wrap items-center gap-x-3 gap-y-2 border bg-[var(--color-panel)] px-2.5 py-2 transition-colors ${
                picked ? "border-[var(--color-green)]" : "border-[var(--color-line-hot)]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/thumb/${r.slug}`}
                alt=""
                width={56}
                height={42}
                loading="lazy"
                className="h-[42px] w-[56px] shrink-0 border object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[var(--color-fg)]">{r.title}</p>
                <p className="truncate text-xs text-[var(--color-fg-faint)]">
                  {CATEGORY_LABELS[r.category] ?? r.category}
                  {r.time && <> · {r.time}</>}
                </p>
              </div>
              <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                <PickButton
                  active={inWd}
                  disabled={quota.weekday.max === 0 || (weekday.length >= quota.weekday.max && !inWd)}
                  onClick={() => toggle("weekday", r.slug)}
                  label="Weekday"
                  recipe={r.title}
                />
                <PickButton
                  active={inWe}
                  disabled={quota.weekend.max === 0 || (weekend.length >= quota.weekend.max && !inWe)}
                  onClick={() => toggle("weekend", r.slug)}
                  label="Weekend"
                  recipe={r.title}
                />
              </div>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="border bg-[var(--color-panel)] px-4 py-8 text-center text-[var(--color-fg-dim)] lg:col-span-2">
            Nothing matches “{q}”.
          </li>
        )}
      </ul>

      {!ready && (
        <p className="pt-1 text-center text-sm text-[var(--color-fg-dim)]">
          {!wdOk && `${Math.max(0, quota.weekday.min - weekday.length)} more weekday to go`}
          {!wdOk && !weOk && " · "}
          {!weOk && `${Math.max(0, quota.weekend.min - weekend.length)} more weekend to go`}
        </p>
      )}

      {/* Floating submit — appears only once both quotas are satisfied. */}
      <div
        aria-hidden={!ready}
        className={`fixed right-4 bottom-4 z-50 transition-all duration-200 sm:right-8 sm:bottom-8 ${
          ready ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <button
          type="button"
          onClick={submit}
          disabled={!ready || state === "saving"}
          className="flex h-14 items-center gap-3 rounded-full bg-[var(--color-green)] px-6 text-base font-semibold text-[#04120a] shadow-2xl shadow-black/60 transition-transform active:scale-95 disabled:opacity-70"
        >
          {state === "saving" ? (
            "Saving…"
          ) : (
            <>
              <span aria-hidden>✓</span>
              {state === "saved" ? "Update vote" : "Submit vote"}
              <span className="rounded-full bg-black/20 px-2 py-0.5 text-sm tabular-nums">
                {weekday.length + weekend.length}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Counter({
  label, picked, quota, ok,
}: { label: string; picked: number; quota: Quota; ok: boolean }) {
  if (quota.days === 0) {
    return (
      <div className="border bg-[var(--color-panel)] px-3 py-2.5">
        <p className="text-sm text-[var(--color-fg)]">{label}</p>
        <p className="text-sm text-[var(--color-amber)]">Away — nothing to pick</p>
      </div>
    );
  }
  return (
    <div
      className={`flex items-center justify-between border bg-[var(--color-panel)] px-3 py-2.5 ${
        ok ? "border-[var(--color-green)]/45" : "border-[var(--color-line-hot)]"
      }`}
    >
      <div>
        <p className="text-sm text-[var(--color-fg)]">{label}</p>
        <p className="text-xs text-[var(--color-fg-faint)]">
          Choose {quota.min === quota.max ? quota.min : `${quota.min}–${quota.max}`}
        </p>
      </div>
      <p className={`text-2xl tabular-nums ${ok ? "text-[var(--color-green)]" : "text-[var(--color-fg-dim)]"}`}>
        {picked}
        <span className="text-sm text-[var(--color-fg-faint)]">/{quota.max}</span>
      </p>
    </div>
  );
}

function PickButton({
  active, disabled, onClick, label, recipe,
}: { active: boolean; disabled: boolean; onClick: () => void; label: string; recipe: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={`${label} lunch: ${recipe}`}
      className={[
        "flex h-10 flex-1 items-center justify-center gap-1.5 border text-sm transition-colors sm:w-[108px] sm:flex-none",
        active
          ? "border-[var(--color-green)] bg-[var(--color-green)] text-[#04120a]"
          : "border-[var(--color-line-hot)] text-[var(--color-fg)] active:border-[var(--color-green)] hover:border-[var(--color-fg-dim)]",
        disabled && !active ? "cursor-not-allowed opacity-35" : "",
      ].join(" ")}
    >
      <span aria-hidden className="text-xs">{active ? "✓" : "+"}</span>
      {label}
    </button>
  );
}
