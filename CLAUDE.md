# Admin Portal — Packaging General

Next.js **16** (App Router) · React 19 · **Tailwind v4** · TypeScript. Port **3001**.
See the root `../CLAUDE.md` for project-wide rules. Read `README.md` here first.

> ⚠ Same Next.js caveat as the storefront: this is newer than your training data.
> Check `node_modules/next/dist/docs/` before relying on framework APIs.

## The one rule that matters most

**This portal is a frontend over Medusa's Admin API. Hiding UI is never security.**
`components/layout/portal-tabs.tsx` gates tabs by role for *usability*. Any real
permission or paid-tier gating MUST also be enforced on the API. Do not describe
menu-hiding as access control to the client.

## Design tokens

`src/app/globals.css` is a copy of the storefront's palette — they must stay in sync.

⚠ **Letter-spacing deliberately diverges.** The admin uses Figma's raw *positive*
values at 30px (+0.396) and 24px (+0.07); the storefront tightens the same sizes
(−0.4 / −0.3) per client preference for display headings. Don't reconcile them
without asking — see `../design-reference/admin/README.md`.

⚠ Tailwind v4 border gotcha carries over: use arbitrary values
(`border-[rgba(...)]`), never `border-<token>/<opacity>`. Confirm with computed
styles, not screenshots.

## Auth

Implemented and working. Credentials are exchanged server-side; the Medusa JWT lives only
in an httpOnly cookie (`src/lib/auth/`). Never move it into client state, localStorage, or
a page payload.

⚠ **Next 16 renamed `middleware` → `proxy`.** The guard is `src/proxy.ts` exporting
`proxy`. A file named `middleware.ts` will be ignored.

⚠ `proxy.ts` only checks the cookie EXISTS — it does not verify the JWT. The backend
rejecting a bad token (handled in `lib/medusa-admin.ts`) is the real boundary.

Demo mode (no `MEDUSA_BACKEND_URL`, non-production build) accepts any credentials so the
mock screens stay reviewable. It cannot activate in a production build — don't "simplify"
that guard in `lib/auth/config.ts`.

## Data

Screens read from `src/lib/data/` and mutate through `src/lib/store.tsx`. Those two
modules are the ONLY place that should know about mocks. When wiring Medusa, change
them and leave the screens alone.

Fixtures in `mock.ts` are transcribed verbatim from Figma so built screens show the
same numbers as the designs — if a value looks odd (revenue counting cancelled
orders), check `README.md` before "fixing" it.

## Design parity protocol

Same as the storefront: extract exact specs, build to the numbers, verify computed
styles. Cache lives in `../design-reference/admin/` — **read it before calling
Figma.** Re-pull with `../storefront/scripts/pull-admin-specs.ps1` (cache-first).

⚠ Figma MCP is capped at **6 tool calls per month** on the user's View seat — treat
it as a last resort. The REST API (`storefront/scripts/figma-api.py`) is the default;
its quota is per-file and resets over ~4–5 days, and duplicating the Figma file
yields a fresh quota with node ids preserved.
