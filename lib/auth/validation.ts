import { Crop } from "@prisma/client";
import { z } from "zod";
import { AUTH, STOCK } from "@/lib/config";

/**
 * Every server input is validated with Zod before it touches the database
 * (docs/00-global.md §2: "never trust the client"). Messages are single
 * sentences that say what to fix (docs/design.md §6).
 */

export const emailField = z
  .string({ required_error: "Enter your email." })
  .trim()
  .min(1, "Enter your email.")
  .max(AUTH.emailMaxLength, "That email is too long.")
  .toLowerCase()
  .email("Enter a valid email address.");

export const nameField = z
  .string({ required_error: "Enter your name." })
  .trim()
  .min(2, "Enter your name.")
  .max(AUTH.nameMaxLength, "That name is too long.");

export const passwordField = z
  .string({ required_error: "Enter a password." })
  .min(AUTH.passwordMinLength, `Password must be at least ${AUTH.passwordMinLength} characters.`)
  .max(100, "Password is too long.");

export const signupSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string({ required_error: "Enter your password." }).min(1, "Enter your password."),
});

export const cropField = z.nativeEnum(Crop, {
  errorMap: () => ({ message: "Choose a crop from the list." }),
});

export const qtyKgField = z.coerce
  .number({ invalid_type_error: "Enter the quantity in kg." })
  .int("Use whole kg.")
  .positive("Quantity must be more than 0 kg.")
  .max(STOCK.maxQtyKg, "That quantity is too large.");

export const noteField = z
  .string()
  .trim()
  .max(STOCK.noteMaxLength, `Keep the note under ${STOCK.noteMaxLength} characters.`)
  .optional()
  .transform((value) => (value ? value : null));

/** Adding stock: the crop is chosen here. */
export const stockSchema = z.object({
  crop: cropField,
  qtyKg: qtyKgField,
  note: noteField,
});

/** Editing stock: the crop cannot change, so only quantity and note are read. */
export const stockUpdateSchema = z.object({
  qtyKg: qtyKgField,
  note: noteField,
});

/**
 * Cost of waiting (docs/01-agriprice.md), entered in naira and percentages.
 * The server converts naira to integer kobo before saving; nothing in the
 * database is ever a float of money.
 */
export const costSettingsSchema = z.object({
  crop: cropField,
  storageNaira: z.coerce
    .number({ invalid_type_error: "Enter the storage cost per kg per week." })
    .min(0, "Storage cost cannot be below ₦0.")
    .max(10_000, "That storage cost is too large."),
  spoilagePctPerWeek: z.coerce
    .number({ invalid_type_error: "Enter the spoilage percentage." })
    .min(0, "Spoilage must be between 0 and 100.")
    .max(100, "Spoilage must be between 0 and 100."),
  minGainPct: z.coerce
    .number({ invalid_type_error: "Enter the minimum gain to wait." })
    .min(0, "Minimum gain cannot be below 0.")
    .max(100, "Minimum gain must be between 0 and 100."),
});

function coordinate(label: string, min: number, max: number) {
  return z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
    z
      .number({
        required_error: `Enter the ${label}.`,
        invalid_type_error: `Enter the ${label} as a number.`,
      })
      .min(min, `The ${label} must be between ${min} and ${max}.`)
      .max(max, `The ${label} must be between ${min} and ${max}.`),
  );
}

export const farmSettingsSchema = z.object({
  name: z
    .string({ required_error: "Enter a farm name." })
    .trim()
    .min(1, "Enter a farm name.")
    .max(80, "That farm name is too long."),
  lat: coordinate("latitude", -90, 90),
  lon: coordinate("longitude", -180, 180),
});

/** The first thing to fix, for one-sentence form errors. */
export function firstIssue(result: { success: false; error: z.ZodError }): string {
  return result.error.issues[0]?.message ?? "Check the form and try again.";
}

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type StockInput = z.infer<typeof stockSchema>;
export type StockUpdateInput = z.infer<typeof stockUpdateSchema>;
export type CostSettingsInput = z.infer<typeof costSettingsSchema>;
export type FarmSettingsInput = z.infer<typeof farmSettingsSchema>;
