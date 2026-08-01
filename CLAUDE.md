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

⚠ **Demo mode is RETIRED as a way to review the portal.** `isDemoMode()` (no
`MEDUSA_BACKEND_URL`, non-production build) still lets the LOGIN screen accept any
credentials, but `adminFetch` throws `AdminApiError(503)` in demo mode and the portal
shell itself calls it (`(portal)/layout.tsx` → `getCurrentUser()`), so with no backend
configured EVERY portal screen — including the fixture-backed ones — lands on the
backend-unreachable panel (`src/app/error.tsx`) rather than rendering. **Run a real
Medusa backend to review the portal.** The guard in `lib/auth/config.ts` still must not
be "simplified" — it is what stops a misconfigured production deploy opening up.

## Data

**Reads** live in `src/lib/data/*` — one module per screen, each a thin seam over
`lib/medusa-admin.ts`'s `adminFetch` (`dashboard.ts`, `orders.ts`, `customers.ts`,
`users.ts`, `inventory.ts`, `products.ts`, `session.ts`). Server Components call them
directly and catch their own failure to render a specific panel; no screen may fall back
to invented figures.

**Writes** are server actions in `src/lib/actions/*` (`orders.ts`, `inventory.ts`,
`users.ts`), all going through the shared runner `src/lib/actions/run.ts` — it owns
`adminFetch` + `revalidatePath` + the `unstable_rethrow` rule, so a dead session still
bounces to `/login` instead of reporting "backend unreachable". Actions run on the
server because the admin JWT is in an httpOnly cookie the browser must never see.

**The current user** comes from `getCurrentUser()` in `data/session.ts`, injected once by
`app/(portal)/layout.tsx` into `SessionProvider` (`lib/session-context.tsx`); client
components read it with `useSession()`. The layout deliberately has no try/catch — a
guessed role is invented data — so its failure is caught by `app/error.tsx`.

⚠ **`src/lib/store.tsx` no longer exists** (deleted in Task 17). There is no shared
client-side mutable store; don't reintroduce one.

**Still on fixtures** (`src/lib/data/mock.ts`, held as local component state):
- **Promotions** — banner editor and promo codes, both pending a follow-up spec.
- **Settings → Platform Settings** — VAT/NHIL/GETFund/fees have no backend persistence.
- **ProductCreator** — the create/edit product form.

Every one of those shows `NOT_CONNECTED_MESSAGE` (`src/lib/not-connected.ts`) and has a
genuinely `disabled` submit control. **Keep that pairing.** A control that looks
functional but changes nothing is a defect here, not a placeholder — and never add a
"Saved" confirmation to something that saves nothing.

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
