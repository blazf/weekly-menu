import Link from "next/link";
import { cn } from "@/lib/utils";

/** A framed panel that reads like a TUI window. */
export function Panel({
  title, right, className, style, children,
}: {
  title?: string; right?: React.ReactNode; className?: string;
  style?: React.CSSProperties; children: React.ReactNode;
}) {
  return (
    <section className={cn("relative z-10 border bg-[var(--color-panel)]", className)} style={style}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b px-3 py-1.5">
          <h2 className="text-xs tracking-widest text-[var(--color-fg-dim)] uppercase">{title}</h2>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function Tag({
  children, tone = "dim",
}: {
  children: React.ReactNode;
  tone?: "dim" | "green" | "amber" | "red" | "cyan" | "magenta";
}) {
  const tones = {
    dim: "text-[var(--color-fg-faint)] border-[var(--color-line-hot)]",
    green: "text-[var(--color-green)] border-[var(--color-green)]/40",
    amber: "text-[var(--color-amber)] border-[var(--color-amber)]/40",
    red: "text-[var(--color-red)] border-[var(--color-red)]/40",
    cyan: "text-[var(--color-cyan)] border-[var(--color-cyan)]/40",
    magenta: "text-[var(--color-magenta)] border-[var(--color-magenta)]/40",
  }[tone];
  return <span className={cn("border px-1.5 py-0.5 text-[10px] tracking-wider uppercase", tones)}>{children}</span>;
}

/** Container for the terminal-styled pages. The vote flow uses its own shell. */
export function TerminalShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-5xl px-4 py-6">{children}</div>;
}

export function SiteHeader({ crumb }: { crumb?: string }) {
  return (
    <header className="relative z-10 mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b pb-3">
      <div className="flex items-baseline gap-2">
        <Link href="/" className="text-[var(--color-green)] hover:underline">
          Lunch
        </Link>
        {crumb && <span className="text-[var(--color-fg-faint)]">/ {crumb}</span>}
      </div>
      <nav className="flex gap-4 text-xs text-[var(--color-fg-dim)]">
        <Link href="/" className="hover:text-[var(--color-fg)]">recipes</Link>
        <Link href="/admin" className="hover:text-[var(--color-fg)]">admin</Link>
      </nav>
    </header>
  );
}
