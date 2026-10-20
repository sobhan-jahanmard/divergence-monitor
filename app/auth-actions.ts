"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, validPassword, SESSION_SECONDS } from "@/lib/auth-core";
import { SESSION_COOKIE, sessionSecret } from "@/lib/auth";
export async function login(
  _previous: { error: string },
  form: FormData,
): Promise<{ error: string }> {
  if (!validPassword(form.get("password")))
    return { error: "رمز ورود نادرست است." };
  try {
    const token = createSession(sessionSecret());
    (await cookies()).set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_SECONDS,
    });
  } catch {
    return { error: "ورود انجام نشد؛ تنظیمات سرور را بررسی کنید." };
  }
  redirect("/");
}
export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/");
}
