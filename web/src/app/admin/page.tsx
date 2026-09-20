import { isAdmin } from "@/lib/auth";
import { getCurrentRound, getBallots, tally, getMenu } from "@/lib/db";
import { getRecipeMap, getAllRecipes } from "@/lib/recipes";
import { isVotable } from "@/lib/categories";
import { menuUrl, renderMenuMail } from "@/lib/mail";
import { summarizeMenu } from "@/lib/menu";
import { getFamily, voteUrl } from "@/lib/family";
import { buildInvites, smtpConfigured } from "@/lib/mail";
import { TerminalShell, SiteHeader } from "@/components/chrome";
import { AdminLogin } from "@/components/admin-login";
import { AdminConsole } from "@/components/admin-console";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return (
      <TerminalShell>
        <SiteHeader crumb="admin" />
        <AdminLogin />
      </TerminalShell>
    );
  }

  const round = getCurrentRound();
  const family = getFamily();
  const base = process.env.APP_URL ?? "http://localhost:3000";

  const ballots = round ? getBallots(round.id) : [];
  const counts = round ? tally(round.id) : { weekday: [], weekend: [] };
  const names = getRecipeMap();
  const menu = round ? getMenu(round.id) : [];
  // Anything a lunch could be — the manual override picks from this list.
  // The announcement as it would be emailed — shown inline in preview mode.
  const menuMail = round && menu.length
    ? renderMenuMail(
        summarizeMenu(round, menu, counts, names, ballots.length, family.length),
        menuUrl(round.id)
      ).text
    : "";
  const dishes = getAllRecipes()
    .filter((r) => isVotable(r.category))
    .map((r) => ({ slug: r.slug, title: r.title, category: r.category }));

  const links = round
    ? family.map((m) => ({
        name: m.name,
        email: m.email,
        url: voteUrl(base, round.id, m.name),
        voted: ballots.some((b) => b.voter === m.name),
      }))
    : [];

  const previews = round
    ? buildInvites(round).map((i) => ({ name: i.member.name, subject: i.subject, text: i.text }))
    : [];

  return (
    <TerminalShell>
      <SiteHeader crumb="admin" />
      <AdminConsole
        round={round}
        links={links}
        ballots={ballots}
        tally={{
          weekday: counts.weekday.map(([slug, n]) => ({ slug, n, title: names.get(slug)?.title ?? slug })),
          weekend: counts.weekend.map(([slug, n]) => ({ slug, n, title: names.get(slug)?.title ?? slug })),
        }}
        smtp={smtpConfigured()}
        previews={previews}
        familyCount={family.length}
        menu={menu}
        dishes={dishes}
        menuUrl={round ? menuUrl(round.id) : ""}
        menuMail={menuMail}
      />
    </TerminalShell>
  );
}
