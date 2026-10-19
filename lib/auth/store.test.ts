import { describe, expect, it } from "vitest";
import { hashPassword } from "./password";
import { authenticate, type UserRecord } from "./store";

/**
 * The login check. A wrong password must come back as "no user", never as an
 * error: the form answers with one plain sentence (step 4A).
 */

describe("authenticate", () => {
  async function makeUser(): Promise<UserRecord> {
    return {
      id: "usr_ada",
      email: "ada@example.com",
      name: "Ada Okonkwo",
      passHash: await hashPassword("demo1234"),
    };
  }

  it("returns the user when the password matches", async () => {
    const user = await makeUser();
    const store = { findByEmail: async () => user };

    await expect(authenticate(store, "ada@example.com", "demo1234")).resolves.toEqual(user);
  });

  it("matches the email whatever case it is typed in", async () => {
    const user = await makeUser();
    let asked = "";
    const store = {
      findByEmail: async (email: string) => {
        asked = email;
        return email === "ada@example.com" ? user : null;
      },
    };

    await expect(authenticate(store, "  ADA@Example.com  ", "demo1234")).resolves.toEqual(user);
    expect(asked).toBe("ada@example.com");
  });

  it("returns null for a wrong password, without throwing", async () => {
    const user = await makeUser();
    const store = { findByEmail: async () => user };

    await expect(authenticate(store, "ada@example.com", "wrong-password")).resolves.toBeNull();
    await expect(authenticate(store, "ada@example.com", "")).resolves.toBeNull();
  });

  it("returns null for an email that has no account", async () => {
    const store = { findByEmail: async () => null };
    await expect(authenticate(store, "nobody@example.com", "demo1234")).resolves.toBeNull();
  });

  it("returns null when the stored hash is unusable", async () => {
    const store = {
      findByEmail: async () => ({
        id: "usr_broken",
        email: "broken@example.com",
        name: "Broken",
        passHash: "",
      }),
    };
    await expect(authenticate(store, "broken@example.com", "demo1234")).resolves.toBeNull();
  });
});
