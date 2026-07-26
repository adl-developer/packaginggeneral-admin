# Packaging General — Admin Portal

Custom-branded operations portal, built from the Figma section **New Admin Designs**
(`3803:4076` in file `uFyZPtj1mgKqkaBMo8lRA7`). Standalone Next.js 16 app; runs on
**port 3001** so it can sit alongside the storefront (3000).

```bash
npm install
npm run dev
```

## Status

- **UI** — complete, all 11 Figma frames parity-checked against pulled specs.
- **Auth** — implemented (real Medusa exchange, httpOnly cookie, route guard).
- **Data** — still **mock fixtures**. No screen reads live Medusa data yet.

| Screen | Route | Figma |
|---|---|---|
| Login | `/login` | `3805:4435` |
| Overview | `/` | `3814:5507` |
| Orders (+ detail & cancel dialogs) | `/orders` | `3835:19533`, `3835:17437` |
| Customers | `/customers` | `3847:20531` |
| Promotions (banner + codes) | `/promotions` | `3814:7183` |
| Users / Team Members | `/users` | `3803:3429` |
| Settings (products + platform) | `/settings` | `3834:15852` |
| Product creator panel | dialog on `/settings` | `3833:10813` · `3833:13672` |

## Layout

```
src/
  app/
    (portal)/          # signed-in shell: header + H1 + tabs + footer
      page.tsx         # Overview
      orders/ customers/ promotions/ users/ settings/
    login/             # outside the shell (no store, no tabs)
  components/
    layout/            # header, footer, portal tabs, date-filter bar
    orders/ promotions/ products/
    ui/                # design-system primitives built to Figma specs
  lib/
    data/              # types.ts · mock.ts · index.ts  ← the API seam
    store.tsx          # client session state + every mutation
```

## Authentication (implemented)

Credentials are exchanged **entirely server-side**; the admin JWT lives only in an
httpOnly cookie and is never exposed to the browser.

| File | Role |
|---|---|
| `src/lib/auth/config.ts` | env, cookie name, demo-mode rule |
| `src/lib/auth/session.ts` | cookie read/write (server-only) |
| `src/lib/auth/actions.ts` | `login` / `logout` server actions |
| `src/proxy.ts` | route guard — redirects signed-out users to `/login` |
| `src/lib/medusa-admin.ts` | authenticated `adminFetch` for Admin API calls |

Set `MEDUSA_BACKEND_URL` (see `.env.example`) and add this origin to the backend's
`ADMIN_CORS`.

**Demo mode**: with no `MEDUSA_BACKEND_URL` in a non-production build, any credentials
are accepted so the screens can be reviewed against the fixtures. It is impossible in a
production build — there, a missing backend URL fails closed. The login card shows a
notice whenever it is active.

⚠ `src/proxy.ts` only checks that a cookie *exists*; it does not validate the JWT. Real
enforcement is the backend rejecting a bad token, which `adminFetch` turns into a forced
sign-out. Treat the proxy as a redirect convenience, never the security boundary.

⚠ Next.js 16 renamed the `middleware` convention to **`proxy`** — the file must stay
named `proxy.ts` and export `proxy`.

## Wiring the data to Medusa (still to do)

`src/lib/data/index.ts` is the single read seam and lists the `sdk.admin.*` call for
each function; `src/lib/store.tsx` holds the mutations. Replace those two modules —
no screen should need to change.

**Promotions == Medusa Campaigns** (client-confirmed): our promo code maps to
`campaign.campaign_identifier`, and the Budget/Usage section maps to `campaign.budget`
(`type: "usage" | "spend"`, `limit`). Full mapping table on `PromoCode` in
`src/lib/data/types.ts`. The discount itself lives on the *promotion* attached to the
campaign, which this screen does not edit yet.

The promo **banner**, **team roles** and **platform settings** have no stock Medusa
endpoints — they need routes on the backend's `order-ops` module.

⚠ **Role gating in `components/layout/portal-tabs.tsx` hides navigation only.** It is not
access control. Enforce the same rules on the API (RBAC plugin or custom `/admin/*`
middleware) or any signed-in user can reach every endpoint by typing a URL.

## Design parity

Specs, geometry and the token table live in `../design-reference/admin/`
(`README.md` first). Re-pull specs with:

```bash
powershell ../storefront/scripts/pull-admin-specs.ps1
```

It is cache-first and skips what already exists.

All 11 frames are pulled and parity-checked. Two details remain inferred because the
design never shows them:

- The **"Delivered"** status badge (the sample data has zero delivered orders) — colour
  in `components/orders/status-badge.tsx` is a guess.
- The **login icon glyph** is `ShieldCheck`; the Figma node is two raw vectors.

## Decisions

Settled:

- **Total Revenue EXCLUDES cancelled orders** (client, 2026-07-25). This deliberately
  diverges from the mock, which shows GH₵ 83,869.42 including them; we render 79,178.23.
- **Promotions are Medusa Campaigns** (client, 2026-07-25) — see the mapping above.
- **Tab visibility is role-driven**: super-admin sees everything incl. Users; admin sees
  all but Users; order-manager sees Overview/Orders/Customers.

Still worth raising with the client:

- **MOQ tiers are back.** The product creator designs a tier editor, but quantity price
  tiers were deliberately removed from the catalog on 2026-07-24. Built as designed but
  **not wired** — confirm before connecting it to the backend.
- **Platform Settings** lists VAT 15 + NHIL 2.5 + GETFund 2.5 = 20% effective, which
  matches the 2026 reform (Act 1151). The screen surfaces the computed total.
