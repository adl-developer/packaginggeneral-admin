"use server";

import { redirect } from "next/navigation";
import { DEMO_TOKEN, MEDUSA_BACKEND_URL, isDemoMode } from "./config";
import { clearSession, setSession } from "./session";

export interface LoginState {
  error: string | null;
}

/**
 * Sign in against Medusa's admin auth route.
 *
 * The credential exchange happens ENTIRELY server-side: the password never
 * leaves this action, and the returned JWT goes straight into an httpOnly
 * cookie. The browser never sees the token.
 *
 * Medusa v2: POST /auth/user/emailpass -> { token }
 */
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!/^\S+@\S+\.\S+$/.test(email) || password.length === 0) {
    return { error: "Enter your admin email and password." };
  }

  if (isDemoMode()) {
    // No backend configured (development only) — accept any credentials so the
    // screens can be reviewed against the mock fixtures.
    await setSession(DEMO_TOKEN);
    redirect("/");
  }

  if (!MEDUSA_BACKEND_URL) {
    // Production with no backend configured: fail closed, never fall back to demo.
    return {
      error: "Admin backend is not configured. Set MEDUSA_BACKEND_URL.",
    };
  }

  let token: string | undefined;
  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/auth/user/emailpass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    if (res.status === 401 || res.status === 400) {
      return { error: "Incorrect email or password." };
    }
    if (!res.ok) {
      return { error: `Sign-in failed (${res.status}). Please try again.` };
    }

    const data = (await res.json()) as { token?: string };
    token = data.token;
  } catch {
    return { error: "Could not reach the admin backend. Check your connection." };
  }

  if (!token) {
    return { error: "Sign-in failed: no token returned." };
  }

  await setSession(token);
  // redirect() throws control flow — must sit outside the try/catch above.
  redirect("/");
}

export async function logout() {
  await clearSession();
  redirect("/login");
}
