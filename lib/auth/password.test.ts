import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

/**
 * Passwords are stored hashed (docs/00-global.md §3: bcrypt, cost 10).
 * These tests check the stored value never contains the password and that the
 * comparison behaves for right, wrong and malformed values.
 */

describe("password hashing", () => {
  it("stores a bcrypt hash at cost 10, not the password", async () => {
    const passHash = await hashPassword("demo1234");

    expect(passHash).not.toContain("demo1234");
    expect(passHash.startsWith("$2")).toBe(true);
    // "$2a$10$..." / "$2b$10$..." — the cost is the two digits after the scheme.
    expect(passHash.slice(4, 6)).toBe("10");
  });

  it("gives a different hash every time the same password is hashed", async () => {
    const first = await hashPassword("demo1234");
    const second = await hashPassword("demo1234");
    expect(second).not.toBe(first);
  });

  it("accepts the right password and rejects a wrong one", async () => {
    const passHash = await hashPassword("demo1234");

    await expect(verifyPassword("demo1234", passHash)).resolves.toBe(true);
    await expect(verifyPassword("demo12345", passHash)).resolves.toBe(false);
    await expect(verifyPassword("", passHash)).resolves.toBe(false);
  });

  it("treats a malformed stored hash as a wrong password instead of crashing", async () => {
    await expect(verifyPassword("demo1234", "not-a-bcrypt-hash")).resolves.toBe(false);
    await expect(verifyPassword("demo1234", "")).resolves.toBe(false);
  });
});
