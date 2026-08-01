"use client";

import * as React from "react";
import {
  PLATFORM_SETTINGS,
  PRODUCTS,
  PROMO_BANNER,
  PROMO_CODES,
} from "./data/mock";
import type {
  PlatformSettings,
  Product,
  PromoBanner,
  PromoCode,
} from "./data/types";

/**
 * Client-side session state for the admin portal.
 *
 * Seeded from the mock fixtures; every mutation below is the seam where a
 * Medusa Admin API call will go. Kept in one provider so screens stay
 * declarative and the swap is mechanical.
 *
 * Orders are NOT part of this state — see `lib/actions/orders.ts` and
 * `orders/page.tsx`, which read/write live Medusa data via server actions
 * instead. Mutating orders through this mock, client-only store would
 * silently diverge from the backend.
 *
 * The team/user roster is ALSO not part of this state (Task 16) — the Users
 * screen now reads/writes live Medusa data via `lib/data/users.ts` and
 * `lib/actions/users.ts`, the same seam as Orders. `currentUser` here was
 * only ever the mock team's stand-in for "who's signed in"; the real
 * signed-in user is `useSession()` (`lib/session-context.tsx`), populated
 * from `GET /admin/pg/me`.
 */

interface AdminState {
  products: Product[];
  promoCodes: PromoCode[];
  banner: PromoBanner;
  settings: PlatformSettings;

  saveBanner: (banner: PromoBanner) => void;
  upsertPromoCode: (code: PromoCode) => void;
  archivePromoCode: (id: string) => void;

  upsertProduct: (product: Product) => void;
  saveSettings: (settings: PlatformSettings) => void;
}

const AdminContext = React.createContext<AdminState | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = React.useState<Product[]>(PRODUCTS);
  const [promoCodes, setPromoCodes] =
    React.useState<PromoCode[]>(PROMO_CODES);
  const [banner, setBanner] = React.useState<PromoBanner>(PROMO_BANNER);
  const [settings, setSettings] =
    React.useState<PlatformSettings>(PLATFORM_SETTINGS);

  const value: AdminState = {
    products,
    promoCodes,
    banner,
    settings,

    saveBanner: setBanner,

    upsertPromoCode: (code) =>
      setPromoCodes((prev) => {
        const exists = prev.some((c) => c.id === code.id);
        return exists
          ? prev.map((c) => (c.id === code.id ? code : c))
          : [code, ...prev];
      }),

    archivePromoCode: (id) =>
      setPromoCodes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "archived" } : c)),
      ),

    upsertProduct: (product) =>
      setProducts((prev) => {
        const exists = prev.some((p) => p.id === product.id);
        return exists
          ? prev.map((p) => (p.id === product.id ? product : p))
          : [...prev, product];
      }),

    saveSettings: setSettings,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = React.useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminProvider>");
  return ctx;
}
