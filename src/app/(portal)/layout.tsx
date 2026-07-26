import { PortalHeader } from "@/components/layout/portal-header";
import { PortalTabs } from "@/components/layout/portal-tabs";
import { AdminProvider } from "@/lib/store";

/**
 * Portal shell — every signed-in admin screen.
 * Figma: header (69) → main container 1280 with padding 56/40/32/40.
 * The H1 and tab bar are part of the shell; only the tab panel changes.
 *
 * The Figma frames show the storefront footer beneath every admin screen; it is
 * intentionally omitted — this is an internal tool and the marketing footer adds
 * nothing here. `AdminFooter` is kept in components/layout/ if it's ever wanted back.
 */
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <div className="flex min-h-screen flex-col">
        <PortalHeader />
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pt-14 pb-8 sm:px-10">
          <h1 className="text-3xl font-medium leading-9 text-brand">
            Admin Dashboard
          </h1>
          <PortalTabs />
          <div className="pt-6">{children}</div>
        </main>
      </div>
    </AdminProvider>
  );
}
