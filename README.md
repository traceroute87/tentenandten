# 10·10·10

**Reach 10. Share 10. Bring 10.** Small actions. Big impact.

An installable PWA that does two things: help someone vote, and help them get
other people voting.

## Stack

- Vite + React + TypeScript
- `vite-plugin-pwa` (installable, offline-safe local progress)
- Supabase — Auth (email one-time code), Postgres (profiles / progress / referrals),
  RLS on from the first migration
- Local-first: guests use the app fully; `localStorage` is the offline source of
  truth. Creating an account merges local progress up (max-wins) and mirrors
  changes to Postgres.
- Self-hosted fonts (Bebas Neue, Inter) — consistent offline.

## Run

```bash
npm install
npm run dev
```

Runs **guest-only** with no backend. Account / sync / referrals appear once
Supabase env vars are set.

### Backend

```bash
cp .env.example .env.local   # fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

Apply the schema (tables, RLS, RPCs, new-user trigger):

```bash
supabase db push          # hosted project
# or: supabase start && supabase db reset   # local
```

Enable **Email** provider in Supabase Auth and set the Site URL / redirect to
your app origin. Migrations under `supabase/migrations/` apply in order:
`0001_init.sql` is the base schema; `0002_voting_plan.sql` adds the synced
voting method + plan fields. `0008_security_hardening.sql` removes the legacy
cloud voting-method column and narrows history, referral, analytics, and progress access.

## Referral starts

A referral can't be forged from the client:

1. `?r=CODE` on first visit is stored locally (display only).
2. On sign-up the code is passed to Supabase Auth metadata; a `SECURITY DEFINER`
   trigger writes the `referrals` row server-side (`account_created`).
3. `mark_challenge_started()` (requires an authenticated session and nonzero
   self-reported progress) promotes it to `challenge_started`.

This is an account-linked, honor-system challenge start, not independent
verification. Counts come from the aggregate `app_snapshot()` response.

## Commands

| | |
|---|---|
| `npm run dev` | dev server |
| `npm run build` | typecheck + production build |
| `npm run preview` | serve the build |
| `npm test` | merge-logic self-check |
| `npm run icons` | regenerate PWA icons from `assets/icon-master.svg` |

## Content upkeep

`src/data.ts` holds a curated directory of official federal + state election
sites (name / URL / `lastChecked`). It is **not** an election-law database —
verify links and bump `LAST_CHECKED` before each election.

## Known V1 scope calls

- Desktop is the centered mobile app on a framed background, not the separate
  marketing landing page from the reference set.
- `capitol.jpg` (~630 KB) ships unoptimized.
- Timeline reminders are in-app banners; no push/cron delivery.
