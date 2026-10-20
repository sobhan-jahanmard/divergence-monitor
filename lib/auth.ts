import "server-only";
import { cookies } from "next/headers";
import { validSession } from "./auth-core";
export const SESSION_COOKIE = "divergence_monitor_session";
export function sessionSecret() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("تنظیمات سرور کامل نیست.");
  return key;
}
export async function hasAccess() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return validSession(token, sessionSecret());
}
export async function requireAccess() {
  if (!(await hasAccess()))
    throw new Error("برای دسترسی، ابتدا رمز ورود را وارد کنید.");
}
