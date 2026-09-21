"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Panel, Tag } from "@/components/chrome";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { label } from "@/lib/week";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { Round, Ballot, MenuEntry } from "@/lib/types";

interface LinkRow { name: string; email: string | null; url: string; voted: boolean }
interface TallyRow { slug: string; n: number; title: string }
interface Preview { name: string; subject: string; text: string }
interface Dish { slug: string; title: string; category: string }
type Msg = { tone: "ok" | "err"; text: string };

export function AdminConsole({
  round, links, ballots, tally, smtp, previews, familyCount, menu, dishes, menuUrl, menuMail,
}: {
  round: Round | null;
  links: LinkRow[];
  ballots: Ballot[];
  tally: { weekday: TallyRow[]; weekend: TallyRow[] };
  smtp: boolean;
  previews: Preview[];
  familyCount: number;
  menu: MenuEntry[];
  dishes: Dish[];
  menuUrl: string;
  menuMail: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<Msg | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  async function call(body: Record<string, unknown>, key: string): Promise<Msg | null> {
    setBusy(key);
    setMsg(null);
    let out: Msg | null = null;
    const setMsg2 = (m: Msg) => { out = m; setMsg(m); };
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg2({ tone: "err", text: typeof data.error === "string" ? data.error : "Failed." });
      } else if (body.action === "send" || body.action === "sendMenu") {
        const r = data.result as { sent: string[]; skipped: { name: string; reason: string }[]; previewOnly: boolean };
        if (r.previewOnly) {
          setMsg2({
            tone: "ok",
            text: body.action === "sendMenu"
              ? "SMTP isn't configured — share the menu link instead."
              : "SMTP isn't configured — copy the links below instead.",
          });
          if (body.action === "send") setShowPreview(true);
        } else {
          const parts = [`Sent to ${r.sent.length}`];
          if (r.skipped.length) parts.push(`skipped ${r.skipped.length}: ${r.skipped.map((s) => `${s.name} (${s.reason})`).join(", ")}`);
          setMsg2({ tone: r.sent.length ? "ok" : "err", text: parts.join(" · ") });
        }
      } else {
        setMsg2({ tone: "ok", text: "Saved." });
      }
      router.refresh();
    } catch {
      setMsg2({ tone: "err", text: "Network error." });
    } finally {
      setBusy(null);
    }
    return out;
  }

  const voted = links.filter((l) => l.voted).length;

  return (
    <div className="relative z-10 space-y-5">
      {msg && (
        <p className={`text-sm ${msg.tone === "ok" ? "text-[var(--color-green)]" : "text-[var(--color-red)]"}`}>
          {msg.tone === "ok" ? "✓" : "✗"} {msg.text}
        </p>
      )}

      {/* ---- round ------------------------------------------------------ */}
      <Panel
        title="round"
        right={
          round ? (
            <Tag tone={round.status === "open" ? "green" : "amber"}>{round.status}</Tag>
          ) : (
            <Tag>none</Tag>
          )
        }
      >
        <div className="space-y-4 px-3 py-3">
          {!round && (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-[var(--color-fg-dim)]">
                No voting round yet. Create one for this Sat–Fri week.
              </p>
              <Button
                onClick={() => call({ action: "createRound" }, "create")}
                disabled={busy !== null}
              >
                {busy === "create" ? "Creating…" : "New round"}
              </Button>
            </div>
          )}

          {round && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm">
                  Week of <strong className="text-[var(--color-fg)]">{label(round.startDate)}</strong>
                  <span className="ml-2 text-xs text-[var(--color-fg-faint)]">
                    round #{round.id} · {voted}/{familyCount} voted
                  </span>
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={round.status === "open" ? "danger" : "default"}
                    disabled={busy !== null}
                    onClick={() =>
                      call({ action: "setStatus", roundId: round.id, status: round.status === "open" ? "closed" : "open" }, "status")
                    }
                  >
                    {round.status === "open" ? "Close voting" : "Reopen voting"}
                  </Button>
                  <Button
                    size="sm"
                    variant="muted"
                    disabled={busy !== null}
                    title="Start a round for the next week that doesn't have one yet"
                    onClick={() => call({ action: "createRound" }, "create")}
                  >
                    {busy === "create" ? "Creating…" : "New round"}
                  </Button>
                  <Button
                    size="sm"
                    variant="muted"
                    disabled={busy !== null}
                    title="Delete this round and go back to the previous one"
                    onClick={() => {
                      const warn = ballots.length
                        ? `Discard round #${round.id} and its ${ballots.length} ballot(s)? This cannot be undone.`
                        : `Discard round #${round.id}? This cannot be undone.`;
                      if (confirm(warn)) call({ action: "deleteRound", roundId: round.id }, "delete");
                    }}
                  >
                    {busy === "delete" ? "Discarding…" : "Discard round"}
                  </Button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs tracking-wider text-[var(--color-fg-faint)] uppercase">
                  Days at home — switch off any day you&apos;re away
                </p>
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                  {round.days.map((d) => (
                    <li
                      key={d.date}
                      className={`border p-2 ${d.active ? "border-[var(--color-line-hot)]" : "border-[var(--color-line)] opacity-55"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs">{label(d.date)}</span>
                        <Switch
                          checked={d.active}
                          disabled={busy !== null}
                          onCheckedChange={(v) =>
                            call({ action: "setDay", roundId: round.id, date: d.date, active: v }, `day-${d.date}`)
                          }
                          aria-label={`Lunch at home on ${label(d.date)}`}
                        />
                      </div>
                      <p className="mt-1 text-[10px] tracking-wider text-[var(--color-fg-faint)] uppercase">
                        {d.slot}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </Panel>

      {/* ---- invites ---------------------------------------------------- */}
      {round && (
        <Panel
          title="invites"
          right={<Tag tone={smtp ? "green" : "amber"}>{smtp ? "SMTP ready" : "preview mode"}</Tag>}
        >
          <div className="space-y-3 px-3 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => call({ action: "send" }, "send")}
                disabled={busy !== null || round.status !== "open"}
              >
                {busy === "send" ? "Sending…" : smtp ? "Send email blast" : "Render invites"}
              </Button>
              <Button variant="muted" size="sm" onClick={() => setShowPreview((v) => !v)}>
                {showPreview ? "Hide" : "Show"} email text
              </Button>
              {!smtp && (
                <span className="text-xs text-[var(--color-fg-faint)]">
                  Set SMTP_HOST in .env to send for real
                </span>
              )}
            </div>

            <ul className="divide-y border">
              {links.map((l) => (
                <li key={l.name} className="flex flex-wrap items-center gap-2 px-3 py-2">
                  <span className="w-24 shrink-0 text-sm">{l.name}</span>
                  <span className="w-52 shrink-0 truncate text-xs text-[var(--color-fg-faint)]">
                    {l.email ?? "no email — copy the link"}
                  </span>
                  <code className="min-w-0 flex-1 truncate text-xs text-[var(--color-fg-dim)]">{l.url}</code>
                  <CopyButton value={l.url} />
                  <Tag tone={l.voted ? "green" : "dim"}>{l.voted ? "voted" : "waiting"}</Tag>
                </li>
              ))}
              {links.length === 0 && (
                <li className="px-3 py-4 text-sm text-[var(--color-fg-faint)]">
                  No family members yet — set FAMILY in .env
                </li>
              )}
            </ul>

            {showPreview && (
              <div className="space-y-2">
                {previews.map((p) => (
                  <details key={p.name} className="border">
                    <summary className="cursor-pointer px-3 py-2 text-xs text-[var(--color-fg-dim)]">
                      {p.name} — {p.subject}
                    </summary>
                    <pre className="overflow-x-auto border-t px-3 py-2 text-xs text-[var(--color-fg-dim)]">
{p.text}
                    </pre>
                  </details>
                ))}
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* ---- results ---------------------------------------------------- */}
      {round && (
        <Panel title="results" right={<Tag>{ballots.length} ballots</Tag>}>
          <div className="grid gap-4 px-3 py-3 sm:grid-cols-2">
            <TallyList title="weekday" rows={tally.weekday} total={ballots.length} voters={votersBy(ballots, "weekday")} />
            <TallyList title="weekend" rows={tally.weekend} total={ballots.length} voters={votersBy(ballots, "weekend")} />
          </div>
          {ballots.length === 0 && (
            <p className="px-3 pb-3 text-sm text-[var(--color-fg-faint)]">
              No votes yet.
            </p>
          )}
        </Panel>
      )}

      {/* ---- menu ------------------------------------------------------- */}
      {round && (
        <MenuBuilder
          round={round}
          menu={menu}
          tally={tally}
          dishes={dishes}
          menuUrl={menuUrl}
          menuMail={menuMail}
          smtp={smtp}
          busy={busy}
          call={call}
        />
      )}

      <div className="border-t pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            await fetch("/api/admin", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "logout" }),
            });
            router.refresh();
          }}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}

/**
 * Assign a dish to each day at home. Starts from what's saved, or — when
 * nothing is saved yet — from the vote (top dishes onto days in order). Any
 * lunch-shaped recipe can be picked, voted for or not; unvoted picks are
 * shown as the chef's own.
 */
function MenuBuilder({
  round, menu, tally, dishes, menuUrl, menuMail, smtp, busy, call,
}: {
  round: Round;
  menu: MenuEntry[];
  tally: { weekday: TallyRow[]; weekend: TallyRow[] };
  dishes: Dish[];
  menuUrl: string;
  menuMail: string;
  smtp: boolean;
  busy: string | null;
  call: (body: Record<string, unknown>, key: string) => Promise<Msg | null>;
}) {
  const saved = new Map(menu.map((m) => [m.date, m.slug]));
  const [picks, setPicks] = useState<Map<string, string>>(saved);
  const [showMail, setShowMail] = useState(false);
  // Outcome of the last save/send, shown right here rather than only at the top of the page.
  const [note, setNote] = useState<Msg | null>(null);
  // Reflect a fresh save / a new round — keyed on content, so an unrelated
  // refresh (toggling a day) doesn't wipe picks that aren't saved yet.
  const menuKey = JSON.stringify(menu);
  useEffect(() => {
    setPicks(new Map((JSON.parse(menuKey) as MenuEntry[]).map((m) => [m.date, m.slug])));
  }, [menuKey]);

  const home = round.days.filter((d) => d.active);
  const votes = new Map<string, number>();
  for (const r of [...tally.weekday, ...tally.weekend]) votes.set(r.slug, Math.max(votes.get(r.slug) ?? 0, r.n));
  const votedFor = new Set(votes.keys());
  const titles = new Map(dishes.map((d) => [d.slug, d.title]));

  const dirty =
    home.some((d) => (picks.get(d.date) ?? "") !== (saved.get(d.date) ?? "")) ||
    [...saved.keys()].some((date) => !home.some((d) => d.date === date));
  const filled = home.filter((d) => picks.get(d.date)).length;

  function autoFill() {
    const pool = { weekday: tally.weekday.map((r) => r.slug), weekend: tally.weekend.map((r) => r.slug) };
    const next = new Map<string, string>();
    for (const d of home) {
      const slug = pool[d.slot].shift();
      if (slug) next.set(d.date, slug);
    }
    setPicks(next);
  }

  async function save() {
    const entries = home.map((d) => ({ date: d.date, slug: picks.get(d.date) ?? "" }));
    setNote(await call({ action: "setMenu", roundId: round.id, entries }, "menu"));
  }

  async function announce() {
    if (!smtp) {
      // Nothing to send without SMTP — show what would go out, plus the link to share.
      setShowMail((v) => !v);
      return;
    }
    setNote(await call({ action: "sendMenu" }, "sendMenu"));
  }

  // Group the <select> options: what people asked for first, then everything else by category.
  const byCategory = new Map<string, Dish[]>();
  for (const d of dishes) {
    if (votedFor.has(d.slug)) continue;
    const list = byCategory.get(d.category) ?? [];
    list.push(d);
    byCategory.set(d.category, list);
  }

  return (
    <Panel
      title="menu"
      right={
        menu.length ? (
          <Tag tone={dirty ? "amber" : "green"}>{dirty ? "unsaved changes" : `${menu.length} days set`}</Tag>
        ) : (
          <Tag>not set</Tag>
        )
      }
    >
      <div className="space-y-3 px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="muted" disabled={busy !== null || (!tally.weekday.length && !tally.weekend.length)} onClick={autoFill}>
            Fill from votes
          </Button>
          <Button size="sm" disabled={busy !== null || !dirty} onClick={save}>
            {busy === "menu" ? "Saving…" : "Save menu"}
          </Button>
          <Button
            size="sm"
            variant="muted"
            disabled={busy !== null || dirty || menu.length === 0}
            title={dirty ? "Save first" : undefined}
            onClick={announce}
          >
            {busy === "sendMenu" ? "Sending…" : smtp ? "Email menu to family" : showMail ? "Hide announcement" : "Show announcement"}
          </Button>
          {menu.length > 0 && (
            <a href={menuUrl} target="_blank" rel="noreferrer" className="text-xs text-[var(--color-green)] hover:underline">
              open menu page ↗
            </a>
          )}
          <span className="ml-auto text-xs text-[var(--color-fg-faint)]">{filled}/{home.length} days</span>
        </div>

        {note && (
          <p className={`text-xs ${note.tone === "ok" ? "text-[var(--color-green)]" : "text-[var(--color-red)]"}`}>
            {note.tone === "ok" ? "✓" : "✗"} {note.text}
          </p>
        )}

        {showMail && menu.length > 0 && (
          <div className="border">
            <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
              <span className="text-xs text-[var(--color-fg-dim)]">
                {smtp ? "This is what was emailed." : "SMTP isn't set up — paste this, or just share the link:"}
              </span>
              <code className="min-w-0 flex-1 truncate text-xs text-[var(--color-fg-dim)]">{menuUrl}</code>
              <CopyButton value={menuUrl} />
              <CopyButton value={menuMail} labelIdle="Copy text" />
            </div>
            <pre className="overflow-x-auto px-3 py-2 text-xs text-[var(--color-fg-dim)]">
{menuMail}
            </pre>
          </div>
        )}

        <ul className="divide-y border">
          {home.map((d) => {
            const slug = picks.get(d.date) ?? "";
            const n = slug ? votes.get(slug) ?? 0 : 0;
            const override = Boolean(slug) && !votedFor.has(slug);
            const slotVotes = d.slot === "weekday" ? tally.weekday : tally.weekend;
            return (
              <li key={d.date} className="flex flex-wrap items-center gap-2 px-3 py-2">
                <span className="w-20 shrink-0 text-sm">{label(d.date)}</span>
                <span className="w-16 shrink-0 text-[10px] tracking-wider text-[var(--color-fg-faint)] uppercase">{d.slot}</span>
                <select
                  value={slug}
                  disabled={busy !== null}
                  onChange={(e) => setPicks((p) => new Map(p).set(d.date, e.target.value))}
                  aria-label={`Lunch on ${label(d.date)}`}
                  className="min-w-0 flex-1 border border-[var(--color-line-hot)] bg-[var(--color-panel-2)] px-2 py-1 text-sm text-[var(--color-fg)] focus:border-[var(--color-green)] focus:outline-none"
                >
                  <option value="">— nothing planned —</option>
                  {slotVotes.length > 0 && (
                    <optgroup label={`voted for (${d.slot})`}>
                      {slotVotes.map((r) => (
                        <option key={r.slug} value={r.slug}>{r.title} · {r.n} vote{r.n === 1 ? "" : "s"}</option>
                      ))}
                    </optgroup>
                  )}
                  {[...byCategory.entries()].map(([cat, list]) => (
                    <optgroup key={cat} label={`${CATEGORY_LABELS[cat] ?? cat} (nobody asked)`}>
                      {list.map((r) => (
                        <option key={r.slug} value={r.slug}>{r.title}</option>
                      ))}
                    </optgroup>
                  ))}
                  {slug && !titles.has(slug) && <option value={slug}>{slug}</option>}
                </select>
                <span className="w-24 shrink-0 text-right">
                  {slug && (override ? <Tag tone="amber">chef&apos;s pick</Tag> : <Tag tone="green">{n} vote{n === 1 ? "" : "s"}</Tag>)}
                </span>
              </li>
            );
          })}
          {home.length === 0 && (
            <li className="px-3 py-4 text-sm text-[var(--color-fg-faint)]">No days at home this week.</li>
          )}
        </ul>
        <p className="text-xs text-[var(--color-fg-faint)]">
          The menu page and email show vote counts per dish only — never who voted for what.
        </p>
      </div>
    </Panel>
  );
}

/** Who picked each dish — admin's eyes only; the public menu page stays anonymous. */
function votersBy(ballots: Ballot[], slot: "weekday" | "weekend"): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const b of ballots) for (const slug of b[slot]) m.set(slug, [...(m.get(slug) ?? []), b.voter]);
  return m;
}

function TallyList({
  title, rows, total, voters,
}: { title: string; rows: TallyRow[]; total: number; voters: Map<string, string[]> }) {
  return (
    <div>
      <p className="mb-2 text-xs tracking-wider text-[var(--color-fg-faint)] uppercase">{title}</p>
      <ul className="space-y-1">
        {rows.map((r, i) => (
          <li key={r.slug} className="flex items-center gap-2 text-sm">
            <span className="w-5 shrink-0 text-right text-xs text-[var(--color-fg-faint)] tabular-nums">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 truncate">
              {r.title}
              <span className="ml-2 text-xs text-[var(--color-fg-faint)]">
                {(voters.get(r.slug) ?? []).join(", ")}
              </span>
            </span>
            <span
              aria-hidden
              className="hidden h-2 bg-[var(--color-green)] sm:block"
              style={{ width: `${total ? (r.n / total) * 56 : 0}px`, opacity: 0.55 }}
            />
            <span className="w-6 shrink-0 text-right text-[var(--color-green)] tabular-nums">{r.n}</span>
          </li>
        ))}
        {rows.length === 0 && <li className="text-sm text-[var(--color-fg-faint)]">—</li>}
      </ul>
    </div>
  );
}

function CopyButton({ value, labelIdle = "Copy" }: { value: string; labelIdle?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        } catch {
          /* clipboard blocked — the URL is visible next to the button anyway */
        }
      }}
      className="shrink-0 border border-[var(--color-line-hot)] px-2 py-0.5 text-[10px] text-[var(--color-fg-dim)] hover:border-[var(--color-green)] hover:text-[var(--color-green)]"
    >
      {done ? "Copied" : labelIdle}
    </button>
  );
}
