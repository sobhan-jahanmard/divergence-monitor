import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
export const SESSION_SECONDS = 7 * 24 * 60 * 60;
const PASSWORD = "jahanmard";
export function validPassword(value: unknown): boolean {
  if (typeof value !== "string" || value.length > 128) return false;
  const normalized = Buffer.from(value.toLowerCase());
  const expected = Buffer.from(PASSWORD);
  return (
    normalized.length === expected.length &&
    timingSafeEqual(normalized, expected)
  );
}
function signature(payload: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`divergence-monitor/session/v1:${payload}`)
    .digest("base64url");
}
export function createSession(secret: string, now = Date.now()) {
  const expires = Math.floor(now / 1000) + SESSION_SECONDS;
  const payload = `v1.${expires}`;
  return `${payload}.${signature(payload, secret)}`;
}
export function validSession(
  token: string | undefined,
  secret: string,
  now = Date.now(),
) {
  if (!token || token.length > 128) return false;
  const match = /^v1\.(\d{10})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) return false;
  const expires = Number(match[1]);
  const seconds = Math.floor(now / 1000);
  if (expires <= seconds || expires > seconds + SESSION_SECONDS) return false;
  const expected = Buffer.from(signature(`v1.${match[1]}`, secret));
  const actual = Buffer.from(match[2]);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
