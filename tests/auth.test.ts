import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  validPassword,
  createSession,
  validSession,
  SESSION_SECONDS,
} from "../lib/auth-core";
const secret = "test-server-signing-key";
const now = Date.UTC(2026, 9, 20);
describe("server password and sessions", () => {
  it.each(["Jahanmard", "jahanmard", "JAHANMARD", "JaHaNmArD"])(
    "accepts case-insensitive password %s",
    (value) => expect(validPassword(value)).toBe(true),
  );
  it.each(["", "wrong", " Jahanmard", "Jahanmard ", null, 123])(
    "rejects incorrect input %s",
    (value) => expect(validPassword(value)).toBe(false),
  );
  it("accepts a signed session for one week, with a fixed expiry", () => {
    const token = createSession(secret, now);
    expect(validSession(token, secret, now)).toBe(true);
    expect(validSession(token, secret, now + SESSION_SECONDS * 1000 - 1)).toBe(
      true,
    );
    expect(validSession(token, secret, now + SESSION_SECONDS * 1000)).toBe(
      false,
    );
  });
  it("rejects tampered signature and expiry", () => {
    const token = createSession(secret, now);
    expect(validSession(token.slice(0, -1) + "!", secret, now)).toBe(false);
    const parts = token.split(".");
    parts[1] = String(Number(parts[1]) + 1000);
    expect(validSession(parts.join("."), secret, now)).toBe(false);
  });
  it("rejects wrong signing key, absent and malformed cookies", () => {
    const token = createSession(secret, now);
    expect(validSession(token, "other-key", now)).toBe(false);
    expect(validSession(undefined, secret, now)).toBe(false);
    expect(validSession("true", secret, now)).toBe(false);
    expect(validSession("jahanmard", secret, now)).toBe(false);
  });
});
