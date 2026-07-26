import { AdminHeader } from "@/components/layout/admin-header";
import { LoginForm } from "@/components/auth/login-form";
import { isDemoMode } from "@/lib/auth/config";

/**
 * Admin sign-in — Figma 3805:4435.
 *
 * Verified specs: 448×398 card (bg #fefdfb, 1px #c4bcb0, r20); 64px icon circle
 * filled rgba(61,52,40,0.1); heading 16/500/lh16 centred; sub-copy 16/400/lh24
 * muted centred; inputs 36px r14 with 4/12 padding; primary button full-width
 * 36px r14.
 *
 * ⚠ The circle's glyph is two vectors in Figma; ShieldCheck is an inference.
 *
 * Server Component: `isDemoMode()` is evaluated on the server so the demo
 * notice can never be spoofed by the client, and credentials are submitted to a
 * server action rather than handled in the browser.
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader />

      <main className="mx-auto flex w-full max-w-[1280px] flex-1 items-center justify-center px-4 py-16">
        <LoginForm demo={isDemoMode()} />
      </main>
    </div>
  );
}
