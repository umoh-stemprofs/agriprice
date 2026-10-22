"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { demoLoginAction, loginAction } from "@/app/actions/auth";

export function LoginForm({ demoEnabled, next }: { demoEnabled: boolean; next?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function withNext(formData: FormData) {
    if (next) formData.set("next", next);
    return formData;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = withNext(new FormData(event.currentTarget));

    startTransition(async () => {
      // On success the action redirects; it only returns when something is wrong.
      const result = await loginAction(formData);
      setError(result?.error ?? null);
    });
  }

  function onDemo() {
    setError(null);
    const formData = withNext(new FormData());

    startTransition(async () => {
      const result = await demoLoginAction(formData);
      setError(result?.error ?? null);
    });
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">Log in</h1>
      <p className="mt-1 text-ink-muted">See what your stock is worth today.</p>

      {error && (
        <p role="alert" className="mt-4 rounded-input border border-loss-line bg-loss-bg px-3 py-2 text-loss-text">
          {error}
        </p>
      )}

      <form className="mt-5 space-y-4" onSubmit={onSubmit} noValidate>
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
            autoComplete="current-password"
            required
            className="input"
            placeholder="Your password"
          />
        </div>

        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>

      {demoEnabled && (
        <button type="button" className="btn-secondary mt-3 w-full" onClick={onDemo} disabled={pending}>
          Try demo account
        </button>
      )}

      <p className="mt-5 text-ink-muted">
        New here?{" "}
        <Link href="/signup" className="font-medium text-brand underline">
          Create account
        </Link>
      </p>
    </>
  );
}
