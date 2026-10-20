import "server-only";
import { requireAccess } from "./auth";
import { database } from "./supabase/server";
import { priceColumn } from "./supabase/price-column";
import type { PriceRecord } from "./types";
export function columns(column: "usdt_price_toman" | "usd_price_toman") {
  const rate =
    column === "usdt_price_toman"
      ? column
      : "usdt_price_toman:usd_price_toman";
  return `id,record_date,apartment_price_toman,${rate},gold_18k_price_toman,created_at`;
}
export function normalize(rows: PriceRecord[]) {
  return rows.map((r) => {
    for (const key of [
      "apartment_price_toman",
      "usdt_price_toman",
      "gold_18k_price_toman",
    ] as const) {
      if (r[key] !== null && !Number.isSafeInteger(Number(r[key])))
        throw new Error("مبلغ ذخیره‌شده خارج از محدوده امن است.");
    }
    return {
      ...r,
      apartment_price_toman: Number(r.apartment_price_toman),
      usdt_price_toman:
        r.usdt_price_toman === null ? null : Number(r.usdt_price_toman),
      gold_18k_price_toman:
        r.gold_18k_price_toman === null ? null : Number(r.gold_18k_price_toman),
    };
  });
}
export async function allRecords() {
  await requireAccess();
  const db = database();
  const projection = columns(await priceColumn(db));
  const result: PriceRecord[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from("divergence_monitor_project_price_records")
      .select(projection)
      .order("record_date")
      .order("created_at")
      .order("id")
      .range(from, from + 999);
    if (error) {
      console.error(error);
      throw new Error("دریافت اطلاعات از پایگاه داده ناموفق بود.");
    }
    result.push(...normalize(data as unknown as PriceRecord[]));
    if (data.length < 1000) break;
  }
  return result;
}
export async function paginatedRecords(page: number) {
  await requireAccess();
  const db = database();
  const projection = columns(await priceColumn(db));
  const { count, error } = await db
    .from("divergence_monitor_project_price_records")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error("دریافت تعداد رکوردها ناموفق بود.");
  const total = count ?? 0;
  const current = Math.min(page, Math.max(1, Math.ceil(total / 10)));
  const { data, error: err } = await db
    .from("divergence_monitor_project_price_records")
    .select(projection)
    .order("record_date", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range((current - 1) * 10, current * 10 - 1);
  if (err) throw new Error("دریافت رکوردها ناموفق بود.");
  return { records: normalize(data as unknown as PriceRecord[]), total, current };
}
