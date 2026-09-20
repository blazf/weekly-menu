import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "lunch_admin";

function secret(): string {
  const s = process.env.SECRET;
  if (!s || s.length < 16) throw new Error("SECRET is missing or too short — set it in web/.env");
  return s;
}

function stamp(): string {
  const issued = Date.now().toString();
  const mac = crypto.createHmac("sha256", secret()).update(issued).digest("base64url");
  return `${issued}.${mac}`;
}

function valid(value: string | undefined): boolean {
  if (!value) return false;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return false;
  const issued = value.slice(0, dot);
  const expected = crypto.createHmac("sha256", secret()).update(issued).digest("base64url");
  const a = Buffer.from(value.slice(dot + 1));
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  // 30 day session
  return Date.now() - Number(issued) < 30 * 24 * 60 * 60 * 1000;
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  // Compare hashes so differing lengths don't leak via timingSafeEqual throwing.
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return valid(jar.get(COOKIE)?.value);
}

export async function grantAdmin() {
  const jar = await cookies();
  jar.set(COOKIE, stamp(), {
    httpOnly: true, sameSite: "lax", path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

export async function revokeAdmin() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
