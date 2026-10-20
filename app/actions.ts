"use server";
import { requireAccess } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/supabase/server";
import { priceSchema, idSchema } from "@/lib/validations";
import { gregorian } from "@/lib/date";
import type { PriceRecord } from "@/lib/types";
type ActionResult = { ok: true } | { ok: false; error: string };
function failure(error: unknown): ActionResult {
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
    const payload = {
      record_date: gregorian(v.date),
      apartment_price_toman: v.apartment,
      usd_price_toman: v.usd,
      gold_18k_price_toman: v.gold,
    };
    const db = database();
    let query = original
      ? db
          .from("divergence_monitor_project_price_records")
          .update(payload)
          .eq("id", original.id)
      : db.from("divergence_monitor_project_price_records").insert(payload);
    if (original) {
      query = query
        .eq("record_date", original.record_date)
        .eq("apartment_price_toman", original.apartment_price_toman);
      query =
        original.usd_price_toman === null
          ? query.is("usd_price_toman", null)
          : query.eq("usd_price_toman", original.usd_price_toman);
      query =
        original.gold_18k_price_toman === null
          ? query.is("gold_18k_price_toman", null)
          : query.eq("gold_18k_price_toman", original.gold_18k_price_toman);
    }
    const { data, error } = await query.select("id");
    if (error) {
      if (error.code === "23505")
        return {
          ok: false,
          error: "برای این تاریخ قبلاً اطلاعات ثبت شده است.",
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
    let query = database()
      .from("divergence_monitor_project_price_records")
      .delete()
      .eq("id", original.id)
      .eq("record_date", original.record_date)
      .eq("apartment_price_toman", original.apartment_price_toman);
    query =
      original.usd_price_toman === null
        ? query.is("usd_price_toman", null)
        : query.eq("usd_price_toman", original.usd_price_toman);
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
