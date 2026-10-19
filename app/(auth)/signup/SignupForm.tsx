"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { signupAction } from "@/app/actions/auth";

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await signupAction(formData);
      setError(result?.error ?? null);
    });
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">Create account</h1>
      <p className="mt-1 text-muted">One account for your farm, its stock and its costs.</p>

      {error && (
        <p role="alert" className="mt-4 rounded-input border border-danger bg-danger-bg px-3 py-2 text-danger">
          {error}
        </p>
      )}

      <form className="mt-5 space-y-4" onSubmit={onSubmit} noValidate>
        <div>
          <label htmlFor="name" className="label">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="input"
            placeholder="Ada Okonkwo"
          />
        </div>

        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="input"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="input"
            aria-describedby="password-help"
            placeholder="At least 8 characters"
          />
          <p id="password-help" className="mt-1 text-sm text-muted">
            At least 8 characters.
          </p>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent underline">
          Back to login
        </Link>
      </p>
    </>
  );
}
