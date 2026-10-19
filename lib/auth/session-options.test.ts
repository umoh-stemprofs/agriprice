import { afterEach, describe, expect, it, vi } from "vitest";
import { AUTH } from "@/lib/config";
import { sessionOptions } from "./session-options";

/**
 * The cookie contract from step 4A: httpOnly, sameSite lax, seven days, and
 * `secure` only in production (https). Reading the option builder is the only
 * way to check this offline — the real cookie is encrypted and httpOnly, so a
 * browser script cannot see it.
 */

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("session cookie options", () => {
  it("sets an httpOnly, lax cookie valid for seven days", () => {
    vi.stubEnv("SESSION_SECRET", "a".repeat(64));
    const options = sessionOptions();

    expect(AUTH.cookieName).toBe("agriprice_session");
    expect(options.cookieName).toBe("agriprice_session");
    expect(options.cookieOptions?.httpOnly).toBe(true);
    expect(options.cookieOptions?.sameSite).toBe("lax");
    expect(options.cookieOptions?.path).toBe("/");
    expect(options.ttl).toBe(AUTH.maxAgeSeconds);
    expect(options.cookieOptions?.maxAge).toBe(AUTH.maxAgeSeconds);
    expect(AUTH.maxAgeSeconds).toBe(60 * 60 * 24 * 7);
  });

  it("marks the cookie secure in production only", () => {
    vi.stubEnv("SESSION_SECRET", "b".repeat(32));

    vi.stubEnv("NODE_ENV", "production");
    expect(sessionOptions().cookieOptions?.secure).toBe(true);

    vi.stubEnv("NODE_ENV", "development");
    expect(sessionOptions().cookieOptions?.secure).toBe(false);
  });

  it("refuses to start with a missing, short or blank secret", () => {
    vi.stubEnv("SESSION_SECRET", undefined);
    expect(() => sessionOptions()).toThrow(/SESSION_SECRET/);

    vi.stubEnv("SESSION_SECRET", "too-short");
    expect(() => sessionOptions()).toThrow(/SESSION_SECRET/);

    vi.stubEnv("SESSION_SECRET", "   ");
    expect(() => sessionOptions()).toThrow(/SESSION_SECRET/);
  });
});
