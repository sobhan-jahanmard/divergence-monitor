import { z } from "zod";
import { gregorian, digits } from "./date";
const money = z
  .string()
  .transform((v) => digits(v).replace(/[,٬\s]/g, ""))
  .refine(
    (v) => /^\d+$/.test(v) && Number(v) > 0 && Number.isSafeInteger(Number(v)),
    "مبلغ باید عدد صحیح مثبت و حداکثر ۹٬۰۰۷٬۱۹۹٬۲۵۴٬۷۴۰٬۹۹۱ باشد",
  )
  .transform(Number);
const optional = z
  .string()
  .transform((v) => v.trim())
  .transform((v) => (v === "" ? null : v))
  .pipe(z.union([z.null(), money]));
export const priceSchema = z.object({
  date: z
    .string()
    .transform(digits)
    .refine((v) => gregorian(v) !== null, "تاریخ شمسی معتبر وارد کنید"),
  apartment: money,
  usd: optional,
  gold: optional,
});
export const idSchema = z.uuid({ error: "شناسه رکورد نامعتبر است" });
