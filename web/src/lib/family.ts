import crypto from "node:crypto";

export interface Member {
  name: string;
  email: string | null;
}

function secret(): string {
  const s = process.env.SECRET;
  if (!s || s.length < 16) {
    throw new Error("SECRET is missing or too short — set it in web/.env");
  }
  return s;
}

/** FAMILY="Blaz:blaz@x.com,Ana:ana@x.com,Miha:" */
export function getFamily(): Member[] {
  return (process.env.FAMILY ?? "")
    .split(",")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const i = chunk.indexOf(":");
      const name = (i === -1 ? chunk : chunk.slice(0, i)).trim();
      const email = i === -1 ? "" : chunk.slice(i + 1).trim();
      return { name, email: email || null };
    })
    .filter((m) => m.name.length > 0);
}

/** Vote links carry the voter's name plus an HMAC, so a guessed name alone
 *  can't cast a ballot and nobody needs a password. */
export function signVoter(roundId: number, name: string): string {
  const mac = crypto
    .createHmac("sha256", secret())
    .update(`${roundId}:${name}`)
    .digest("base64url")
    .slice(0, 16);
  return `${Buffer.from(name).toString("base64url")}.${mac}`;
}

export function verifyVoter(roundId: number, token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const name = (() => {
    try {
      return Buffer.from(token.slice(0, dot), "base64url").toString("utf8");
    } catch {
      return null;
    }
  })();
  if (!name) return null;
  const expected = signVoter(roundId, name);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return name;
}

export function voteUrl(base: string, roundId: number, name: string): string {
  const clean = base.replace(/\/+$/, "");
  return `${clean}/vote/${roundId}/${signVoter(roundId, name)}`;
}
