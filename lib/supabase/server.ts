import "server-only";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
export function database() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error(
      "اتصال پایگاه داده تنظیم نشده است. متغیرهای محیطی Supabase را تنظیم کنید.",
    );
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: WebSocket as unknown as typeof globalThis.WebSocket },
  });
}
