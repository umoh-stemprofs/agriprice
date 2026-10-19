import { Crop } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  farmSettingsSchema,
  firstIssue,
  loginSchema,
  signupSchema,
  stockSchema,
} from "./validation";

/**
 * Server-side validation (docs/00-global.md §2). Every message is one sentence
 * that says what to fix, and it is what the form shows.
 */

describe("signup validation", () => {
  it("accepts a name, an email and a password of 8 characters", () => {
    const parsed = signupSchema.safeParse({
      name: "Ada Okonkwo",
      email: "ADA@Example.com",
      password: "demo1234",
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    // The email is stored lower case and the name is trimmed.
    expect(parsed.data.email).toBe("ada@example.com");
    expect(parsed.data.name).toBe("Ada Okonkwo");
  });

  it("rejects a password shorter than 8 characters", () => {
    const parsed = signupSchema.safeParse({
      name: "Ada Okonkwo",
      email: "ada@example.com",
      password: "demo123", // 7 characters
    });

    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(firstIssue(parsed)).toBe("Password must be at least 8 characters.");
  });

  it("accepts a password of exactly 8 characters", () => {
    expect(
      signupSchema.safeParse({
        name: "Ada Okonkwo",
        email: "ada@example.com",
        password: "demo1234",
      }).success,
    ).toBe(true);
  });

  it("rejects an email without an @ or a domain", () => {
    for (const email of ["ada.example.com", "ada@", "@example.com", ""]) {
      expect(signupSchema.safeParse({ name: "Ada", email, password: "demo1234" }).success).toBe(
        false,
      );
    }
  });

  it("rejects an empty or one-character name", () => {
    for (const name of ["", " ", "A"]) {
      expect(
        signupSchema.safeParse({ name, email: "ada@example.com", password: "demo1234" }).success,
      ).toBe(false);
    }
  });
});

describe("login validation", () => {
  it("accepts any non-empty password, so old rules cannot lock someone out", () => {
    expect(
      loginSchema.safeParse({ email: "ada@example.com", password: "short" }).success,
    ).toBe(true);
  });

  it("asks for the password when it is missing", () => {
    const parsed = loginSchema.safeParse({ email: "ada@example.com", password: "" });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(firstIssue(parsed)).toBe("Enter your password.");
  });
});

describe("stock validation", () => {
  it("accepts a crop, a whole positive quantity and a note", () => {
    const parsed = stockSchema.safeParse({ crop: Crop.MAIZE, qtyKg: "250", note: "In bags" });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.qtyKg).toBe(250);
    expect(parsed.data.note).toBe("In bags");
  });

  it("rejects 0 kg, negative kg and a fraction of a kg", () => {
    for (const qtyKg of ["0", "-5", "2.5"]) {
      expect(stockSchema.safeParse({ crop: Crop.MAIZE, qtyKg, note: "" }).success).toBe(false);
    }
  });

  it("rejects a crop outside the catalog", () => {
    const parsed = stockSchema.safeParse({ crop: "BANANA", qtyKg: "10", note: "" });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(firstIssue(parsed)).toBe("Choose a crop from the list.");
  });

  it("turns an empty note into null rather than an empty string", () => {
    const parsed = stockSchema.safeParse({ crop: Crop.YAM, qtyKg: "10", note: "   " });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.note).toBeNull();
  });
});

describe("farm settings validation", () => {
  it("accepts Port Harcourt", () => {
    const parsed = farmSettingsSchema.safeParse({
      name: "Port Harcourt farm",
      lat: "4.8156",
      lon: "7.0498",
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.lat).toBeCloseTo(4.8156);
    expect(parsed.data.lon).toBeCloseTo(7.0498);
  });

  it("rejects latitude outside −90..90 and longitude outside −180..180", () => {
    expect(
      farmSettingsSchema.safeParse({ name: "Farm", lat: "91", lon: "7" }).success,
    ).toBe(false);
    expect(
      farmSettingsSchema.safeParse({ name: "Farm", lat: "-91", lon: "7" }).success,
    ).toBe(false);
    expect(
      farmSettingsSchema.safeParse({ name: "Farm", lat: "4", lon: "181" }).success,
    ).toBe(false);
    expect(
      farmSettingsSchema.safeParse({ name: "Farm", lat: "4", lon: "-181" }).success,
    ).toBe(false);
  });

  it("asks for a number when the coordinate is empty", () => {
    const parsed = farmSettingsSchema.safeParse({ name: "Farm", lat: "", lon: "7" });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(firstIssue(parsed)).toBe("Enter the latitude.");
  });

  it("rejects an empty farm name", () => {
    expect(
      farmSettingsSchema.safeParse({ name: "  ", lat: "4", lon: "7" }).success,
    ).toBe(false);
  });
});
