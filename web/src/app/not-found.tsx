import Link from "next/link";
import { TerminalShell, SiteHeader, Panel } from "@/components/chrome";

export default function NotFound() {
  return (
    <TerminalShell>
      <SiteHeader crumb="404" />
      <Panel title="not found">
        <div className="p-6">
          <p className="text-[var(--color-red)]">That page doesn&apos;t exist.</p>
          <p className="mt-2 text-[var(--color-fg-dim)]">
            <Link href="/" className="text-[var(--color-green)] hover:underline">Back to recipes</Link>
          </p>
        </div>
      </Panel>
    </TerminalShell>
  );
}
