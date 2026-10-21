import { z } from "zod";
import { gregorian, digits, tehranToday } from "./date";
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
export const itemNameSchema = z
  .string()
  .trim()
  .min(1, "نام مورد را وارد کنید")
  .max(120, "نام مورد باید حداکثر ۱۲۰ نویسه باشد");
export const priceSchema = z.object({
  itemId: z.uuid({ error: "مورد را از فهرست انتخاب کنید" }),
  date: z
    .string()
    .transform(digits)
    .superRefine((value, context) => {
      const date = gregorian(value);
      if (date === null)
        context.addIssue({
          code: "custom",
          message: "تاریخ شمسی معتبر وارد کنید",
        });
      else if (date > tehranToday())
        context.addIssue({
          code: "custom",
          message: "تاریخ آینده قابل انتخاب نیست",
        });
    }),
  price: money,
  usdt: optional,
  gold: optional,
});
export const idSchema = z.uuid({ error: "شناسه رکورد نامعتبر است" });
