"use server";
import { requireAccess } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/supabase/server";
import { priceSchema, idSchema, itemNameSchema } from "@/lib/validations";
import { gregorian } from "@/lib/date";
import type { PriceItem, PriceRecord } from "@/lib/types";
import { fetchGold, fetchTetherRate } from "@/lib/market-prices";
import { priceColumn } from "@/lib/supabase/price-column";
import type { SupabaseClient } from "@supabase/supabase-js";
type ActionResult = { ok: true } | { ok: false; error: string };
type ItemActionResult =
  | { ok: true; item: PriceItem; created: boolean }
  | { ok: false; error: string };
async function resolveItem(
  db: SupabaseClient,
  name: string,
): Promise<{ item: PriceItem; created: boolean }> {
  const table = db.from("divergence_monitor_project_price_items");
  const { data: items, error } = await table.select("id,name");
  if (error)
    throw new Error(
      "دریافت فهرست موارد ناموفق بود. آیا مهاجرت ۰۰۴ اجرا شده است؟",
    );
  const existing = items.find(
    (item) => item.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase(),
  );
  if (existing) return { item: existing as PriceItem, created: false };
  const { data, error: insertError } = await table
    .insert({ name })
    .select("id,name")
    .single();
  if (!insertError) return { item: data as PriceItem, created: true };
  if (insertError.code === "23505") {
    const { data: concurrent } = await table.select("id,name");
    const match = concurrent?.find(
      (item) =>
        item.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase(),
    );
    if (match) return { item: match as PriceItem, created: false };
  }
  throw new Error("ساخت مورد جدید ناموفق بود.");
}
export async function createItem(input: unknown): Promise<ItemActionResult> {
  try {
    await requireAccess();
    const parsed = itemNameSchema.safeParse(input);
    if (!parsed.success)
      return { ok: false, error: parsed.error.issues[0].message };
    const result = await resolveItem(database(), parsed.data);
    revalidatePath("/");
    revalidatePath("/records");
    return { ok: true, ...result };
  } catch (error) {
    return failure(error);
  }
}
export async function lookupMarketPrices(date: string) {
  await requireAccess();
  const parsed = priceSchema.shape.date.safeParse(date);
  if (!parsed.success)
    return { ok: false as const, error: "تاریخ شمسی معتبر وارد کنید." };
  const [usdtResult, goldResult] = await Promise.allSettled([
    fetchTetherRate(parsed.data),
    fetchGold(parsed.data),
  ]);
  const usdt =
    usdtResult.status === "fulfilled" ? usdtResult.value.value : null;
  const usdtSource =
    usdtResult.status === "fulfilled" ? usdtResult.value.source : null;
  const gold = goldResult.status === "fulfilled" ? goldResult.value : null;
  if (usdtResult.status === "rejected")
    console.error("All tether price lookups failed:", usdtResult.reason);
  if (goldResult.status === "rejected")
    console.error("Gold price lookup failed:", goldResult.reason);
  return {
    ok: true as const,
    usdt,
    usdtSource,
    gold,
    usdtError:
      usdtResult.status === "rejected"
        ? "دریافت نرخ تتر از نوبیتکس و داده‌های TGJU ناموفق بود."
        : usdt === null
          ? "برای این تاریخ قیمت تتر ثبت نشده است."
          : null,
    goldError:
      goldResult.status === "rejected"
        ? "دریافت قیمت طلا ناموفق بود."
        : gold === null
          ? "برای این تاریخ قیمت طلا ثبت نشده است."
          : null,
  };
}
function failure(error: unknown): { ok: false; error: string } {
  console.error("Price mutation failed:", error);
  return {
    ok: false,
    error:
      error instanceof Error
        ? error.message
        : "خطای غیرمنتظره در ذخیره اطلاعات.",
  };
}
export async function saveRecord(
  input: unknown,
  original?: PriceRecord,
): Promise<ActionResult> {
  try {
    await requireAccess();
    const parsed = priceSchema.safeParse(input);
    if (!parsed.success)
      return { ok: false, error: parsed.error.issues[0].message };
    if (original && !idSchema.safeParse(original.id).success)
      return { ok: false, error: "شناسه نامعتبر است." };
    const v = parsed.data;
    const db = database();
    const rateColumn = await priceColumn(db);
    const payload = {
      item_id: v.itemId,
      record_date: gregorian(v.date),
      price_toman: v.price,
      [rateColumn]: v.usdt,
      gold_18k_price_toman: v.gold,
      recorded_by: "sobhan",
    };
    let query = original
      ? db
          .from("divergence_monitor_project_price_records")
          .update(payload)
          .eq("id", original.id)
      : db.from("divergence_monitor_project_price_records").insert(payload);
    if (original) {
      query = query
        .eq("record_date", original.record_date)
        .eq("item_id", original.item_id)
        .eq("price_toman", original.price_toman);
      query =
        original.usdt_price_toman === null
          ? query.is(rateColumn, null)
          : query.eq(rateColumn, original.usdt_price_toman);
      query =
        original.gold_18k_price_toman === null
          ? query.is("gold_18k_price_toman", null)
          : query.eq("gold_18k_price_toman", original.gold_18k_price_toman);
    }
    const { data, error } = await query.select("id");
    if (error) {
      if (error.code === "23503")
        return {
          ok: false,
          error: "مورد انتخاب‌شده دیگر وجود ندارد؛ صفحه را تازه کنید.",
        };
      if (error.code === "23505")
        return {
          ok: false,
          error:
            "محدودیت قدیمی دیتابیس هنوز اجازهٔ ثبت دوبارهٔ این تاریخ را نمی‌دهد.",
        };
      console.error(error);
      return { ok: false, error: "ذخیره اطلاعات در پایگاه داده ناموفق بود." };
    }
    if (!data?.length)
      return {
        ok: false,
        error: "رکورد حذف یا تغییر کرده است؛ صفحه را تازه کنید.",
      };
    revalidatePath("/");
    revalidatePath("/records");
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}
export async function deleteRecord(
  original: PriceRecord,
): Promise<ActionResult> {
  try {
    await requireAccess();
    if (!idSchema.safeParse(original.id).success)
      return { ok: false, error: "شناسه نامعتبر است." };
    const db = database();
    const rateColumn = await priceColumn(db);
    let query = db
      .from("divergence_monitor_project_price_records")
      .delete()
      .eq("id", original.id)
      .eq("record_date", original.record_date)
      .eq("item_id", original.item_id)
      .eq("price_toman", original.price_toman);
    query =
      original.usdt_price_toman === null
        ? query.is(rateColumn, null)
        : query.eq(rateColumn, original.usdt_price_toman);
    query =
      original.gold_18k_price_toman === null
        ? query.is("gold_18k_price_toman", null)
        : query.eq("gold_18k_price_toman", original.gold_18k_price_toman);
    const { data, error } = await query.select("id");
    if (error) throw new Error("حذف اطلاعات ناموفق بود.");
    if (!data?.length)
      return {
        ok: false,
        error: "رکورد حذف یا تغییر کرده است؛ صفحه را تازه کنید.",
      };
    revalidatePath("/");
    revalidatePath("/records");
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}
