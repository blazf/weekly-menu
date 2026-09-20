import nodemailer from "nodemailer";
import type { Round } from "./types";
import type { MenuSummary } from "./menu";
import { label, quotas } from "./week";
import { getFamily, voteUrl, type Member } from "./family";

export function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST);
}

export interface Invite {
  member: Member;
  url: string;
  subject: string;
  text: string;
  html: string;
}

function renderInvite(round: Round, member: Member, url: string): Invite {
  const q = quotas(round.days);
  const active = round.days.filter((d) => d.active);
  const off = round.days.filter((d) => !d.active);

  const subject = `Lunch vote — week of ${label(round.startDate)}`;

  const lines = [
    `Hi ${member.name},`,
    ``,
    `Voting is open for the week of ${label(round.startDate)}.`,
    ``,
    `Pick ${q.weekday.min}-${q.weekday.max} weekday lunches and ${q.weekend.min}-${q.weekend.max} weekend lunches.`,
    ``,
    `Days at home: ${active.map((d) => label(d.date)).join(", ") || "none"}`,
    off.length ? `Away (no lunch needed): ${off.map((d) => label(d.date)).join(", ")}` : ``,
    ``,
    `Vote here: ${url}`,
    ``,
    `The link is yours — it already knows you're ${member.name}.`,
  ].filter((l) => l !== undefined);

  const text = lines.join("\n");

  const html = `<!doctype html><html><body style="margin:0;background:#0b0f0c;padding:24px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#c9d1c9">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;border:1px solid #2a3a2c;background:#0d120e">
    <tr><td style="padding:18px 22px;border-bottom:1px solid #2a3a2c;color:#7ee787;font-size:13px">
      lunch@home ~ <span style="color:#5a6a5c">vote</span>
    </td></tr>
    <tr><td style="padding:22px">
      <p style="margin:0 0 14px;font-size:14px">Hi ${escapeHtml(member.name)},</p>
      <p style="margin:0 0 14px;font-size:14px;color:#9aa79b">
        Voting is open for the week of <strong style="color:#c9d1c9">${escapeHtml(label(round.startDate))}</strong>.
      </p>
      <p style="margin:0 0 6px;font-size:14px;color:#9aa79b">Pick
        <strong style="color:#7ee787">${q.weekday.min}-${q.weekday.max}</strong> weekday lunches and
        <strong style="color:#7ee787">${q.weekend.min}-${q.weekend.max}</strong> weekend lunches.
      </p>
      <p style="margin:14px 0 4px;font-size:13px;color:#5a6a5c">DAYS AT HOME</p>
      <p style="margin:0 0 10px;font-size:13px;color:#c9d1c9">${active.map((d) => escapeHtml(label(d.date))).join(" · ") || "none"}</p>
      ${off.length ? `<p style="margin:0 0 4px;font-size:13px;color:#5a6a5c">AWAY</p>
      <p style="margin:0 0 10px;font-size:13px;color:#8a6a4c">${off.map((d) => escapeHtml(label(d.date))).join(" · ")}</p>` : ``}
      <p style="margin:22px 0 0">
        <a href="${escapeHtml(url)}" style="display:inline-block;padding:11px 18px;border:1px solid #7ee787;color:#7ee787;text-decoration:none;font-size:14px">
          &gt; cast your vote
        </a>
      </p>
      <p style="margin:16px 0 0;font-size:12px;color:#5a6a5c">
        The link is yours — it already knows you're ${escapeHtml(member.name)}. No password needed.
      </p>
    </td></tr>
  </table>
  </td></tr></table></body></html>`;

  return { member, url, subject, text, html };
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function buildInvites(round: Round): Invite[] {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return getFamily().map((m) => renderInvite(round, m, voteUrl(base, round.id, m.name)));
}

export interface SendResult {
  sent: string[];
  skipped: { name: string; reason: string }[];
  previewOnly: boolean;
  error?: string;
}

interface Outgoing { member: Member; subject: string; text: string; html: string }

async function sendAll(mails: Outgoing[]): Promise<SendResult> {
  if (!smtpConfigured()) {
    return {
      sent: [],
      skipped: mails.map((m) => ({ name: m.member.name, reason: "SMTP not configured" })),
      previewOnly: true,
    };
  }

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" }
      : undefined,
  });

  const sent: string[] = [];
  const skipped: { name: string; reason: string }[] = [];

  for (const mail of mails) {
    if (!mail.member.email) {
      skipped.push({ name: mail.member.name, reason: "no email address" });
      continue;
    }
    try {
      await transport.sendMail({
        from: process.env.SMTP_FROM ?? "lunch@localhost",
        to: mail.member.email,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });
      sent.push(mail.member.name);
    } catch (e) {
      skipped.push({ name: mail.member.name, reason: e instanceof Error ? e.message : "send failed" });
    }
  }

  return { sent, skipped, previewOnly: false };
}

export async function sendInvites(round: Round): Promise<SendResult> {
  return sendAll(buildInvites(round));
}

// --- menu announcement ---------------------------------------------------

export function menuUrl(roundId: number): string {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/menu/${roundId}`;
}

/** The week's menu, same for everyone. Vote counts only — no names. */
export function renderMenuMail(summary: MenuSummary, url: string): Omit<Outgoing, "member"> {
  const subject = `Lunch menu — week of ${summary.weekLabel}`;
  const home = summary.days.filter((d) => d.active);
  const bar = (n: number) => "█".repeat(n) + "░".repeat(Math.max(0, summary.ballots - n));
  const who = (d: MenuSummary["days"][number]) =>
    d.override ? "chef's pick" : `${d.votes} vote${d.votes === 1 ? "" : "s"}`;

  const text = [
    `Menu for the week of ${summary.weekLabel}`,
    ``,
    ...home.map((d) => `${d.dayLabel.padEnd(10)} ${d.title ?? "—"}  (${who(d)})`),
    ``,
    `How the vote went (${summary.ballots} of ${summary.family} voted):`,
    ``,
    `weekday`,
    ...summary.tally.weekday.map((t) => `  ${bar(t.votes)} ${t.votes}  ${t.title}${t.chosen ? "  ✓" : ""}`),
    `weekend`,
    ...summary.tally.weekend.map((t) => `  ${bar(t.votes)} ${t.votes}  ${t.title}${t.chosen ? "  ✓" : ""}`),
    ``,
    `Full menu with pictures: ${url}`,
  ].join("\n");

  const dayRows = home
    .map(
      (d) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #1e2a20;font-size:12px;color:#5a6a5c;white-space:nowrap;vertical-align:top;width:70px">${escapeHtml(d.dayLabel)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #1e2a20;font-size:14px;color:#c9d1c9">${escapeHtml(d.title ?? "—")}</td>
        <td style="padding:8px 0;border-bottom:1px solid #1e2a20;font-size:11px;color:${d.override ? "#f5c542" : "#7ee787"};text-align:right;white-space:nowrap">${escapeHtml(who(d))}</td>
      </tr>`
    )
    .join("");

  const tallyRows = (lines: MenuSummary["tally"]["weekday"]) =>
    lines
      .map((t) => {
        const w = summary.ballots ? Math.round((t.votes / summary.ballots) * 120) : 0;
        return `<tr>
          <td style="padding:3px 8px 3px 0;font-size:13px;color:${t.chosen ? "#c9d1c9" : "#6f7f71"}">${escapeHtml(t.title)}${t.chosen ? ' <span style="color:#7ee787">✓</span>' : ""}</td>
          <td style="padding:3px 0;width:130px"><div style="height:8px;width:${w}px;background:${t.chosen ? "#7ee787" : "#2f4433"}"></div></td>
          <td style="padding:3px 0 3px 8px;font-size:12px;color:#7ee787;text-align:right">${t.votes}</td>
        </tr>`;
      })
      .join("") || `<tr><td style="font-size:12px;color:#5a6a5c">—</td></tr>`;

  const html = `<!doctype html><html><body style="margin:0;background:#0b0f0c;padding:24px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#c9d1c9">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;border:1px solid #2a3a2c;background:#0d120e">
    <tr><td style="padding:18px 22px;border-bottom:1px solid #2a3a2c;color:#7ee787;font-size:13px">
      lunch@home ~ <span style="color:#5a6a5c">menu</span>
    </td></tr>
    <tr><td style="padding:22px">
      <p style="margin:0 0 4px;font-size:12px;color:#5a6a5c;letter-spacing:.08em">THIS WEEK</p>
      <p style="margin:0 0 14px;font-size:16px;color:#c9d1c9">Week of ${escapeHtml(summary.weekLabel)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${dayRows}</table>
      <p style="margin:22px 0 4px;font-size:12px;color:#5a6a5c;letter-spacing:.08em">HOW THE VOTE WENT · ${summary.ballots} of ${summary.family} voted</p>
      <p style="margin:10px 0 2px;font-size:11px;color:#5a6a5c">weekday</p>
      <table role="presentation" cellpadding="0" cellspacing="0">${tallyRows(summary.tally.weekday)}</table>
      <p style="margin:10px 0 2px;font-size:11px;color:#5a6a5c">weekend</p>
      <table role="presentation" cellpadding="0" cellspacing="0">${tallyRows(summary.tally.weekend)}</table>
      <p style="margin:22px 0 0">
        <a href="${escapeHtml(url)}" style="display:inline-block;padding:11px 18px;border:1px solid #7ee787;color:#7ee787;text-decoration:none;font-size:14px">
          &gt; see the menu with pictures
        </a>
      </p>
    </td></tr>
  </table>
  </td></tr></table></body></html>`;

  return { subject, text, html };
}

export async function sendMenu(summary: MenuSummary, roundId: number): Promise<SendResult> {
  const mail = renderMenuMail(summary, menuUrl(roundId));
  return sendAll(getFamily().map((member) => ({ member, ...mail })));
}
