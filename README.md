# TrainLog

A personal, single-user, mobile-first training log inspired by Dorian Yates' notebooks (1983–1997).
Built from [`Training log app spec`](Training%20log%20app%20spec) and the philosophy in [`yates_training_guide.md`](yates_training_guide.md).

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v3 · Prisma · PostgreSQL · Recharts · lucide-react.

The home page is a **month calendar**. Tap any day to log or open a session.

---

## Quick start

### 1. Prereqs
- Node.js ≥ 20
- A reachable PostgreSQL ≥ 14 (the bundled [docker-compose.yml](docker-compose.yml) gives you one; or point at any existing instance)

### 2. Install
```powershell
npm install
```

### 3. Start Postgres (skip if you already have one)
```powershell
docker compose up -d
```

### 4. Configure environment
Copy the example and edit if your DB isn't on `localhost`:
```powershell
copy .env.example .env
```
`.env` must contain at minimum:
```
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/trainlog?schema=public"
AUTH_SECRET="<long-random-string>"   # required in production; dev has a fallback
```
Generate a strong secret:
```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### 5. Create the database & tables
The schema lives in [prisma/schema.prisma](prisma/schema.prisma) and is applied via Prisma migrations in [prisma/migrations/](prisma/migrations).

| Scenario | Command |
| --- | --- |
| First-time setup against an empty DB | `npx prisma migrate deploy` |
| New machine, dev workflow | `npm run db:migrate` |
| You changed `schema.prisma` and want a new migration | `npm run db:migrate -- --name <change>` |
| Wipe and rebuild from scratch (destroys data) | `npx prisma migrate reset --force` |
| Inspect tables visually | `npm run db:studio` |

Prisma will create the `trainlog` database if your role has `CREATEDB` and apply every migration in order. The current state produces these tables: `User`, `Session`, `Exercise`, `ExerciseSet`, `ExerciseLibrary`, `MonthlyReview`, `Target`, `ExperimentMarker`, `Settings` plus the `Unit`, `OverallFeel`, `MuscleGroup`, `SetKind`, `TargetMetric` enums.

### 6. Run the app
```powershell
npm run dev
```
Open http://localhost:3000 — you'll be redirected to `/login`. Tap "Create an account" to register.

---

## Project layout

```
prisma/schema.prisma           # data model (Postgres)
docker-compose.yml             # local Postgres
src/app/
  page.tsx                     # Calendar (home)
  session/new/page.tsx         # Log new session
  session/[id]/page.tsx        # Edit existing session
  history/page.tsx
  progress/page.tsx
  review/page.tsx
  api/
    sessions/route.ts          # GET list, POST upsert-by-date
    sessions/[id]/route.ts     # GET / DELETE one
    exercise-library/route.ts
    reviews/[month]/route.ts
    experiments/route.ts
    settings/route.ts
    warnings/route.ts
src/components/
  Calendar.tsx                 # month grid
  SessionEditor.tsx            # log/edit form (auto-saves drafts)
  ProgressChart.tsx
  WarningsBanner.tsx
  BottomTabBar.tsx
src/lib/
  prisma.ts
  types.ts
  warnings.ts                  # deload / overtraining / double-muscle rules
```

---

## Behaviours implemented

- **Calendar home**: month view; logged sessions show as red dots, drafts as amber, experiment markers as blue.
- **Fast logging**: warm-up / working / drop set distinction, `to_failure` flag, autocomplete from exercise library, slider 1–5 for energy/sleep/stress, overall feel chips.
- **Auto-save drafts**: every change is debounced and persisted as `isDraft=true`. Closing & reopening the date restores the draft.
- **Warnings** (server-computed in `src/lib/warnings.ts`):
  - **Overtraining** — last 3 sessions all flat/distracted.
  - **Double-muscle** — non-calf muscle group hit ≥2× in 7 days.
  - **Deload** — ≥6 consecutive ISO weeks with sessions logged.
- **Progress** chart: weight + reps over time per exercise, experiment markers overlaid, plateau flag if no progression in last 4 entries.
- **History** with exercise-name search.
- **Review**: per-month observations, targets, recent experiments, and a quick auto-summary (sessions + flat-feel %).

---

## Deviations from the original spec

The spec targeted a single-file React artifact backed by `window.storage`. You asked for a real app with **Postgres** and a **calendar home**, so:

- `window.storage` → Prisma + PostgreSQL.
- Dashboard "home" → Calendar home (sessions/experiments rendered as date dots).
- Storage keys → relational tables (see `prisma/schema.prisma`).

Everything else from the spec — entities, screens, warnings, design principles — is preserved.

---

## Useful commands

```powershell
npm run dev          # next dev
npm run build        # prisma generate + next build
npm test             # vitest run
npm run test:watch   # vitest watch mode
npm run typecheck    # tsc --noEmit
npm run db:push      # push schema to DB (no migration files)
npm run db:migrate   # create + apply a migration
npm run db:studio    # Prisma Studio
```

---

## Tests

[Vitest](https://vitest.dev) covers the pure logic in `src/lib/`:

- [tests/types.test.ts](tests/types.test.ts) — date helpers and spec constants
- [tests/warnings.test.ts](tests/warnings.test.ts) — overtraining, double-muscle (with the calves exception), deload reminder

```powershell
npm test
```

## Pre-commit hook

[Husky](https://typicode.github.io/husky/) runs `npm run typecheck && npm test` on every commit. Hook lives in [.husky/pre-commit](.husky/pre-commit) and is installed automatically by the `prepare` script after `npm install`.

To bypass intentionally (rare): `git commit --no-verify`.

## Docker

A multi-stage [Dockerfile](Dockerfile) produces a minimal Next.js standalone image.

```powershell
docker build -t trainlog .
docker run -p 3000:3000 -e DATABASE_URL=... trainlog
```

The image bundles Prisma client + migrations; run `npx prisma migrate deploy` against your DB before first start (or wrap it in your container entrypoint).

## CI: GitHub Actions

[.github/workflows/ci.yml](.github/workflows/ci.yml) defines two jobs:

1. **test** — installs deps, runs typecheck and the Vitest suite (every push & PR).
2. **docker** — on `push` to `main` or any `v*.*.*` tag, builds and pushes to **GHCR** at `ghcr.io/<owner>/<repo>` with tags for branch, short SHA, semver, and `latest` (default branch). Uses GHA build cache.

Auth uses the built-in `GITHUB_TOKEN` (no extra secrets needed). To pull privately, give your account/team read access to the package in repo Settings → Packages.
