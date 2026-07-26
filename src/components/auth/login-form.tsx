"use client";

import * as React from "react";
import { useActionState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { login, type LoginState } from "@/lib/auth/actions";

const initialState: LoginState = { error: null };

/**
 * The credentials are posted to the `login` server action — they are never held
 * in client state and never sent anywhere from the browser except this form
 * submission. The resulting JWT is set as an httpOnly cookie server-side.
 */
export function LoginForm({ demo }: { demo: boolean }) {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [show, setShow] = React.useState(false);

  return (
    <div className="w-full max-w-[448px] rounded-card border border-line bg-surface">
      <div className="flex flex-col items-center px-6 pt-6">
        <span className="inline-flex size-16 items-center justify-center rounded-full bg-[rgba(61,52,40,0.1)]">
          <ShieldCheck className="size-8 text-brand" aria-hidden />
        </span>
        <h1 className="pt-6 text-base leading-4 font-medium text-brand">
          Admin Access Required
        </h1>
        <p className="pt-1.5 text-base leading-6 text-muted">
          Please sign in with your admin credentials
        </p>
      </div>

      <form className="flex flex-col gap-4 p-6" action={formAction}>
        <div className="flex flex-col gap-1">
          <Label htmlFor="admin-email">Email Address</Label>
          <Input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="username"
            required
            placeholder="admin@packaginggeneral.com"
            aria-invalid={Boolean(state.error)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="admin-password">Password</Label>
          <div className="relative">
            <Input
              id="admin-password"
              name="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              className="pr-10"
              aria-invalid={Boolean(state.error)}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-1 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-button text-muted transition-colors hover:text-brand"
            >
              {show ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
        </div>

        {state.error && (
          <p role="alert" className="text-xs leading-4 text-destructive">
            {state.error}
          </p>
        )}

        <Button type="submit" fullWidth disabled={pending}>
          {pending ? "Signing in…" : "Sign In"}
        </Button>

        {demo && (
          <p className="rounded-button border border-line bg-background px-3 py-2 text-xs leading-4 text-muted">
            <span className="font-semibold text-brand">Demo mode</span> — no
            Medusa backend is configured, so the portal is showing mock data and
            any credentials will be accepted. Set{" "}
            <code className="font-mono">MEDUSA_BACKEND_URL</code> to sign in for
            real.
          </p>
        )}
      </form>
    </div>
  );
}
