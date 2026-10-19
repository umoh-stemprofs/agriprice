"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { DEFAULT_FARM, DEMO, NEW_FARM_NAME, demoModeEnabled } from "@/lib/config";
import { hashPassword } from "@/lib/auth/password";
import { authenticate } from "@/lib/auth/store";
import { signIn, signOut } from "@/lib/auth/session";
import { firstIssue, loginSchema, signupSchema } from "@/lib/auth/validation";

/**
 * Login and signup (step 4A). Every value arrives from a form, so every value
 * is parsed with Zod on the server first (docs/00-global.md §2).
 */

export interface AuthState {
  error?: string;
}

/** Only same-site paths, so ?next= cannot send a farmer to another site. */
function safeNext(formData: FormData): string {
  const raw = formData.get("next");
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/dashboard";
  }
  return raw;
}

function isDuplicateEmail(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function loginAction(formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstIssue(parsed) };

  let user;
  try {
    user = await authenticate(
      { findByEmail: (email) => db.user.findUnique({ where: { email } }) },
      parsed.data.email,
      parsed.data.password,
    );
  } catch (error) {
    console.error("Login failed:", error instanceof Error ? error.message : error);
    return { error: "We could not sign you in just now. Try again." };
  }

  if (!user) {
    // One sentence, and never which half was wrong (docs/design.md §6).
    return { error: "Email or password is wrong. Check and try again." };
  }

  await signIn({ id: user.id, email: user.email, name: user.name });
  redirect(safeNext(formData));
}

export async function signupAction(formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstIssue(parsed) };

  const { name, email, password } = parsed.data;

  try {
    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return { error: "That email already has an account. Log in instead." };
    }

    // The farm is created in the same write, so a new farmer never lands on an
    // empty dashboard with no farm (docs/00-global.md §3).
    const user = await db.user.create({
      data: {
        name,
        email,
        passHash: await hashPassword(password),
        farms: {
          create: {
            name: NEW_FARM_NAME,
            lat: DEFAULT_FARM.lat,
            lon: DEFAULT_FARM.lon,
          },
        },
      },
    });

    await signIn({ id: user.id, email: user.email, name: user.name });
  } catch (error) {
    if (isDuplicateEmail(error)) {
      return { error: "That email already has an account. Log in instead." };
    }
    console.error("Signup failed:", error instanceof Error ? error.message : error);
    return { error: "We could not create your account just now. Try again." };
  }

  redirect("/dashboard");
}

export async function demoLoginAction(formData: FormData): Promise<AuthState> {
  if (!demoModeEnabled()) {
    return { error: "The demo account is turned off." };
  }

  try {
    const user = await db.user.findUnique({ where: { email: DEMO.email } });
    if (!user) {
      return { error: "The demo account is not set up. Run npm run db:seed." };
    }
    await signIn({ id: user.id, email: user.email, name: user.name });
  } catch (error) {
    console.error("Demo login failed:", error instanceof Error ? error.message : error);
    return { error: "We could not open the demo just now. Try again." };
  }

  redirect(safeNext(formData));
}

export async function logoutAction(): Promise<void> {
  await signOut();
  redirect("/login");
}
