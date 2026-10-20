"use client";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, LoaderCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { priceSchema } from "@/lib/validations";
import { digits, gregorian, jalali, today } from "@/lib/date";
import type { PriceRecord } from "@/lib/types";
import { lookupMarketPrices, saveRecord } from "@/app/actions";
import {
  Button,
  Input,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui";
import { JalaliPicker } from "./jalali-picker";
type Values = z.input<typeof priceSchema>;
const labels = {
  apartment: "قیمت هر متر مربع آپارتمان (تومان)",
  usdt: "قیمت هر تتر (تومان)",
  gold: "قیمت هر گرم طلای ۱۸ عیار (تومان)",
} as const;
export function PriceFormDialog({ record }: { record?: PriceRecord }) {
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [usdtSource, setUsdtSource] = useState<
    "nobitex" | "tgju-usdt" | "tgju-usd" | null
  >(null);
  const router = useRouter();
  const form = useForm<Values, unknown, z.output<typeof priceSchema>>({
    resolver: zodResolver(priceSchema),
    defaultValues: {
      date: record ? jalali(record.record_date) : today(),
      apartment: record ? String(record.apartment_price_toman) : "",
      usdt: record?.usdt_price_toman ? String(record.usdt_price_toman) : "",
      gold: record?.gold_18k_price_toman
        ? String(record.gold_18k_price_toman)
        : "",
    },
  });
  const busy = form.formState.isSubmitting || fetching;
  async function fillMarketPrices(onlyMissing = false) {
    const date = digits(form.getValues("date"));
    if (!gregorian(date)) {
      toast.error("تاریخ شمسی معتبر انتخاب کنید.");
      return;
    }
    const needUsdt = !onlyMissing || !form.getValues("usdt").trim();
    const needGold = !onlyMissing || !form.getValues("gold").trim();
    setFetching(true);
    try {
      const result = await lookupMarketPrices(date);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (needUsdt && result.usdt !== null) {
        form.setValue("usdt", String(result.usdt), { shouldValidate: true });
        setUsdtSource(result.usdtSource);
      }
      if (needGold && result.gold !== null)
        form.setValue("gold", String(result.gold), { shouldValidate: true });
      const errors = [
        needUsdt && result.usdtError,
        needGold && result.goldError,
      ].filter(Boolean);
      const usdFallback = needUsdt && result.usdtSource === "tgju-usd";
      if (usdFallback)
        errors.unshift(
          "نرخ دلار آزاد TGJU به‌جای تتر وارد شد؛ مقدار را پیش از ذخیره بررسی کنید.",
        );
      if (errors.length) toast.warning(errors.join(" "));
      else if (needUsdt && result.usdtSource === "tgju-usdt")
        toast.success("نرخ تتر از TGJU دریافت شد؛ مقدار را بررسی کنید.");
      else toast.success("قیمت‌ها دریافت شد؛ مقدارها را بررسی و سپس ذخیره کنید.");
    } catch {
      toast.error("ارتباط با سرور برای دریافت قیمت‌ها ناموفق بود.");
    } finally {
      setFetching(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!busy) {
          setOpen(v);
          if (v) {
            setUsdtSource(null);
            form.reset({
              date: record ? jalali(record.record_date) : today(),
              apartment: record ? String(record.apartment_price_toman) : "",
              usdt: record?.usdt_price_toman
                ? String(record.usdt_price_toman)
                : "",
              gold: record?.gold_18k_price_toman
                ? String(record.gold_18k_price_toman)
                : "",
            });
          }
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant={record ? "ghost" : "default"}
          aria-label={record ? "ویرایش رکورد" : undefined}
        >
          {record ? <Pencil size={16} /> : <Plus size={18} />}
          <span>{record ? "ویرایش" : "ثبت قیمت جدید"}</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        closeDisabled={busy}
        onEscapeKeyDown={(e) => {
          if (busy) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <DialogTitle className="dialog-title">
          {record ? "ویرایش اطلاعات" : "ثبت قیمت جدید"}
        </DialogTitle>
        <DialogDescription className="muted">
          قیمت‌ها به تومان هستند. اگر نرخ تتر یا طلا خالی باشد، ابتدا قیمت همان تاریخ دریافت می‌شود.
        </DialogDescription>
        <form
          onSubmit={form.handleSubmit(async () => {
            if (!form.getValues("usdt").trim() || !form.getValues("gold").trim()) {
              await fillMarketPrices(true);
              return;
            }
            try {
              const result = await saveRecord(form.getValues(), record);
              if (result.ok) {
                toast.success(record ? "تغییرات ذخیره شد." : "اطلاعات ثبت شد.");
                setOpen(false);
                router.refresh();
              } else toast.error(result.error);
            } catch {
              toast.error("ارتباط با سرور ناموفق بود.");
            }
          })}
          className="form"
        >
          <fieldset disabled={busy}>
            <label>
              تاریخ <span className="required">*</span>
            </label>
            <Controller
              control={form.control}
              name="date"
              render={({ field }) => (
                <JalaliPicker
                  value={field.value}
                  onChange={(value) => {
                    if (value !== field.value) {
                      form.setValue("usdt", "");
                      form.setValue("gold", "");
                      setUsdtSource(null);
                    }
                    field.onChange(value);
                  }}
                  invalid={!!form.formState.errors.date}
                />
              )}
            />
            {form.formState.errors.date && (
              <p className="field-error">
                {form.formState.errors.date.message}
              </p>
            )}
            <div className="market-lookup">
              <Button type="button" variant="outline" onClick={() => fillMarketPrices()}>
                {fetching ? (
                  <LoaderCircle size={16} className="spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
                دریافت قیمت تتر و طلا
              </Button>
              <small>تتر: نوبیتکس ← تتر TGJU ← دلار TGJU · طلا: TGJU</small>
              {usdtSource === "tgju-usd" && (
                <p className="fallback-notice" role="status">
                  این عدد نرخ دلار آزاد TGJU است و ممکن است با قیمت تتر فرق داشته باشد.
                </p>
              )}
            </div>
            {(Object.keys(labels) as (keyof typeof labels)[]).map((key) => (
              <div className="form-field" key={key}>
                <label htmlFor={key}>
                  {labels[key]}{" "}
                  {key === "apartment" ? (
                    <span className="required">*</span>
                  ) : (
                    <span className="optional">دستی یا از API</span>
                  )}
                </label>
                <Controller
                  name={key}
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id={key}
                      dir="ltr"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="—"
                      aria-invalid={!!form.formState.errors[key]}
                      value={field.value.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      onChange={(e) => {
                        if (key === "usdt") setUsdtSource(null);
                        field.onChange(
                          digits(e.target.value).replace(/[,٬]/g, ""),
                        );
                      }}
                    />
                  )}
                />
                {form.formState.errors[key] && (
                  <p className="field-error">
                    {form.formState.errors[key]?.message}
                  </p>
                )}
              </div>
            ))}
          </fieldset>
          <div className="dialog-actions">
            <Button type="submit" disabled={busy}>
              {busy && <LoaderCircle size={16} className="spin" />}
              {record ? "ذخیره تغییرات" : "ثبت اطلاعات"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              انصراف
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
