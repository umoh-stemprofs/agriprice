# Hosting readiness (Vercel + Neon)

Nothing here has been deployed — this file is the checklist for when you do.
Local rules that only matter on this machine (no local Postgres, no Docker)
do not apply to the hosted app.

## 1. Environment variables (Vercel → Settings → Environment Variables)

Set these by **name**; paste real values into Vercel, never into git:

| Name | Required | Value |
|---|---|---|
| `DATABASE_URL` | yes | the Neon Postgres connection string for the project database |
| `SESSION_SECRET` | yes | a long random string (32+ chars), different from local: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `DEMO_MODE` | yes, for judging | `true` — see §4 |
| `APP_TZ` | optional | `Africa/Lagos` (this is the default) |
| `OWM_API_KEY` | optional | only if you switch weather to OpenWeatherMap; otherwise Open-Meteo is used and needs no key |
| `MARKET_API_URL` | optional | only when a real price feed is wired; leave unset while prices are simulated |

`.env` stays git-ignored; `.env.example` lists the names only.

## 2. Install and build commands (Vercel)

- **Install command:** `npm install`
  — its `postinstall` runs `prisma generate`, so a fresh install produces the
  Prisma client before anything else (this is what makes CI/Vercel work).
- **Build command:** `npm run build`
  — npm's pre-build hook runs the salt picker automatically:
  `prebuild: tsx scripts/pick-salts.ts` refreshes `lib/market/salts.json` for
  **the build's own date** so the demo always shows one rising and one falling
  crop. Do not replace the build command with bare `next build`, or the picker
  is skipped.
- **Output:** the Next.js build (Vercel's Next.js integration detects it).

## 3. Database migrations (Neon)

Migrations run against the Neon database, never a local one:

```
npx prisma migrate deploy
```

- `migrate deploy` applies committed migrations in order and never generates
  new ones or drops data — run it in the release step (or from your machine
  with the production `DATABASE_URL`), then seed if you want demo data:
  `npx prisma db seed` (the seed is idempotent).
- Never run `prisma migrate dev` or `db:reset` against the hosted database —
  those are for local development only.

## 4. Settings for the judges

- Set **`DEMO_MODE=true`**. This shows the "Try demo account" button on the
  login page and the "Demo: show harvest alert" preview switch on /alerts —
  both exist only while this is true, and neither writes any data.
- **Use a stronger demo password on the hosted site.** The demo password is
  committed in `prisma/seed.ts` and printed in the README for local demos;
  anyone who reads the repository can sign in as the demo farmer. Before
  hosting: change the `password` value in `prisma/seed.ts`, re-run
  `npx prisma db seed`, and update the README with the new password (or seed
  a separate hosted-only demo account). Do not reuse your own account's
  password anywhere in the seed.
- The login page and app footer already say what the tool is; no extra flag is
  needed for that.

## 5. Hosted checks after the first deploy

1. Sign up → land on the dashboard; log out → back to /login.
2. /weather shows a **Live** badge (the real Open-Meteo call on the host).
3. /market shows **Simulated** badges on every price card.
4. Demo login works with `DEMO_MODE=true`.
5. `GET /api/market/prices` returns 9 crops; a wrong query returns a plain
   400 sentence, not a stack trace.
6. Confirm no environment variable names or values appear in the client bundle
   (View Source on the dashboard; search for `SESSION_SECRET`, `DATABASE_URL`).
