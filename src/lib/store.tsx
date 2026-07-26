"use client";

import * as React from "react";
import {
  ORDERS,
  PLATFORM_SETTINGS,
  PRODUCTS,
  PROMO_BANNER,
  PROMO_CODES,
  TEAM,
  CURRENT_USER_ID,
} from "./data/mock";
import {
  NEXT_STAGE,
  type Order,
  type OrderStatus,
  type PlatformSettings,
  type Product,
  type PromoBanner,
  type PromoCode,
  type RefundMode,
  type TeamMember,
} from "./data/types";

/**
 * Client-side session state for the admin portal.
 *
 * Seeded from the mock fixtures; every mutation below is the seam where a
 * Medusa Admin API call will go. Kept in one provider so screens stay
 * declarative and the swap is mechanical.
 */

interface AdminState {
  orders: Order[];
  team: TeamMember[];
  products: Product[];
  promoCodes: PromoCode[];
  banner: PromoBanner;
  settings: PlatformSettings;
  currentUser: TeamMember;

  claimOrder: (orderId: string) => void;
  advanceStage: (orderId: string) => void;
  cancelOrder: (
    orderId: string,
    opts: { refund: RefundMode; amount?: number; note: string },
  ) => void;
  addNote: (orderId: string, note: string) => void;
  assignWorker: (orderId: string, memberId: string) => void;

  saveBanner: (banner: PromoBanner) => void;
  upsertPromoCode: (code: PromoCode) => void;
  archivePromoCode: (id: string) => void;

  upsertProduct: (product: Product) => void;
  saveSettings: (settings: PlatformSettings) => void;
  addTeamMember: (member: TeamMember) => void;
}

const AdminContext = React.createContext<AdminState | null>(null);

/** Stamped on activity entries. Date is fine here — client-only state. */
const today = () => new Date().toISOString().slice(0, 10);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = React.useState<Order[]>(ORDERS);
  const [team, setTeam] = React.useState<TeamMember[]>(TEAM);
  const [products, setProducts] = React.useState<Product[]>(PRODUCTS);
  const [promoCodes, setPromoCodes] =
    React.useState<PromoCode[]>(PROMO_CODES);
  const [banner, setBanner] = React.useState<PromoBanner>(PROMO_BANNER);
  const [settings, setSettings] =
    React.useState<PlatformSettings>(PLATFORM_SETTINGS);

  const currentUser =
    team.find((m) => m.id === CURRENT_USER_ID) ?? team[0];

  const patchOrder = React.useCallback(
    (orderId: string, fn: (o: Order) => Order) =>
      setOrders((prev) => prev.map((o) => (o.id === orderId ? fn(o) : o))),
    [],
  );

  const value: AdminState = {
    orders,
    team,
    products,
    promoCodes,
    banner,
    settings,
    currentUser,

    claimOrder: (orderId) =>
      patchOrder(orderId, (o) => ({
        ...o,
        assignedTo: currentUser.id,
        assignedAt: today(),
        activity: [
          ...o.activity,
          {
            id: `act_${o.id}_${o.activity.length + 1}`,
            actor: currentUser.name,
            action: "claimed the order",
            at: today(),
          },
        ],
      })),

    assignWorker: (orderId, memberId) =>
      patchOrder(orderId, (o) => ({
        ...o,
        assignedTo: memberId,
        assignedAt: today(),
        activity: [
          ...o.activity,
          {
            id: `act_${o.id}_${o.activity.length + 1}`,
            actor: currentUser.name,
            action: `assigned the order to ${
              team.find((m) => m.id === memberId)?.name ?? "a worker"
            }`,
            at: today(),
          },
        ],
      })),

    advanceStage: (orderId) =>
      patchOrder(orderId, (o) => {
        const next = NEXT_STAGE[o.status];
        if (!next) return o;
        return {
          ...o,
          status: next,
          activity: [
            ...o.activity,
            {
              id: `act_${o.id}_${o.activity.length + 1}`,
              actor: currentUser.name,
              action: `moved the order to ${STAGE_VERB[next]}`,
              at: today(),
            },
          ],
        };
      }),

    cancelOrder: (orderId, { refund, amount, note }) =>
      patchOrder(orderId, (o) => ({
        ...o,
        status: "cancelled" as OrderStatus,
        notes: [...o.notes, note],
        activity: [
          ...o.activity,
          {
            id: `act_${o.id}_${o.activity.length + 1}`,
            actor: currentUser.name,
            action:
              refund === "full"
                ? "cancelled the order with a full refund"
                : refund === "partial"
                  ? `cancelled the order with a partial refund of GH₵ ${(amount ?? 0).toFixed(2)}`
                  : "cancelled the order with no refund",
            at: today(),
          },
        ],
      })),

    addNote: (orderId, note) =>
      patchOrder(orderId, (o) => ({
        ...o,
        notes: [...o.notes, note],
        activity: [
          ...o.activity,
          {
            id: `act_${o.id}_${o.activity.length + 1}`,
            actor: currentUser.name,
            action: "added a note",
            at: today(),
          },
        ],
      })),

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

    addTeamMember: (member) => setTeam((prev) => [...prev, member]),
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

const STAGE_VERB: Record<OrderStatus, string> = {
  new: "New",
  "in-progress": "In Progress",
  ready: "Ready for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function useAdmin() {
  const ctx = React.useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminProvider>");
  return ctx;
}
