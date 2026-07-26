"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Figma "Tabs": a 40px track (bg #c4bcb0, radius 16) with 4px inset triggers —
 * 32px tall, pad 6/12, radius 14. Active trigger fills #e8e5de with brand text;
 * inactive is transparent with muted text.
 *
 * Used for LOCAL tab state (order-detail Details/Activity, promo-code
 * All/Active/Archived). The portal's top-level tabs are real routes — see
 * components/layout/portal-tabs.tsx.
 */

const TabsContext = React.createContext<{
  value: string;
  setValue: (v: string) => void;
} | null>(null);

export function Tabs({
  defaultValue,
  value: controlled,
  onValueChange,
  className,
  children,
}: {
  defaultValue: string;
  value?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
  const value = controlled ?? uncontrolled;
  const setValue = React.useCallback(
    (v: string) => {
      if (controlled === undefined) setUncontrolled(v);
      onValueChange?.(v);
    },
    [controlled, onValueChange],
  );

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

function useTabs() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tabs components must be used inside <Tabs>");
  return ctx;
}

/** The 40px track. Inline-flex so it hugs its triggers, as in the design. */
export function TabsList({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex h-10 items-center gap-0 rounded-panel bg-line p-1",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  value,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const { value: active, setValue } = useTabs();
  const selected = active === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={() => setValue(value)}
      className={cn(
        "inline-flex h-8 items-center justify-center rounded-button px-3",
        "text-sm font-medium leading-5 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
        selected ? "bg-background text-brand" : "text-muted hover:text-brand",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const { value: active } = useTabs();
  if (active !== value) return null;
  return <div role="tabpanel" className={className} {...props} />;
}
