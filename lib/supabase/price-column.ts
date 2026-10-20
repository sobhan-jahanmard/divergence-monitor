import "server-only";
import { database } from "./server";

const table = "divergence_monitor_project_price_records";

// The app can read and write both before and after migration 002 is applied.
export async function priceColumn(db: ReturnType<typeof database>) {
  const { error } = await db
    .from(table)
    .select("usdt_price_toman", { head: true })
    .limit(0);
  if (!error) return "usdt_price_toman" as const;
  // PostgREST HEAD responses can omit the JSON error code, so probe the old
  // column before deciding that the schema is unavailable.
  const { error: oldError } = await db
    .from(table)
    .select("usd_price_toman", { head: true })
    .limit(0);
  if (oldError) throw oldError;
  return "usd_price_toman" as const;
}
