"use client";
import { useId, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, LoaderCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { itemNameSchema, priceSchema } from "@/lib/validations";
import { digits, gregorian, jalali, today } from "@/lib/date";
import type { PriceItem, PriceRecord } from "@/lib/types";
import { createItem, lookupMarketPrices, saveRecord } from "@/app/actions";
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
  price: "قیمت مورد (تومان)",
  usdt: "قیمت هر تتر (تومان)",
  gold: "قیمت هر گرم طلای ۱۸ عیار (تومان)",
} as const;
export function PriceFormDialog({
  record,
  items,
}: {
  record?: PriceRecord;
  items: PriceItem[];
}) {
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [creatingItem, setCreatingItem] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemError, setNewItemError] = useState("");
  const [addedItems, setAddedItems] = useState<PriceItem[]>([]);
  const [lookupAttempted, setLookupAttempted] = useState(false);
  const [usdtSource, setUsdtSource] = useState<
    "nobitex" | "tgju-usdt" | "tgju-usd" | null
  >(null);
  const itemSelectId = useId();
  const newItemInputId = useId();
  const router = useRouter();
  const availableItems = [
    ...items,
    ...addedItems.filter(
      (added) => !items.some((item) => item.id === added.id),
    ),
  ];
  const selectedItemId =
    record?.item_id ??
    items.find((item) => item.name === "هر متر مربع آپارتمان ۱۰۰ متری پیام")
      ?.id ??
    items[0]?.id ??
    "";
  const form = useForm<Values, unknown, z.output<typeof priceSchema>>({
    resolver: zodResolver(priceSchema),
    defaultValues: {
      date: record ? jalali(record.record_date) : today(),
      itemId: selectedItemId,
      price: record ? String(record.price_toman) : "",
      usdt: record?.usdt_price_toman ? String(record.usdt_price_toman) : "",
      gold: record?.gold_18k_price_toman
        ? String(record.gold_18k_price_toman)
        : "",
    },
  });
  const busy = form.formState.isSubmitting || fetching || creatingItem;
  async function addItem() {
    if (creatingItem) return;
    const parsed = itemNameSchema.safeParse(newItemName);
    if (!parsed.success) {
      setNewItemError(parsed.error.issues[0].message);
      return;
    }
    setCreatingItem(true);
    setNewItemError("");
    try {
      const result = await createItem(parsed.data);
      if (!result.ok) {
        setNewItemError(result.error);
        return;
      }
      setAddedItems((current) =>
        current.some((item) => item.id === result.item.id)
          ? current
          : [...current, result.item],
      );
      form.setValue("itemId", result.item.id, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setAddingItem(false);
      setNewItemName("");
      toast.success(
        result.created
          ? "مورد جدید اضافه و انتخاب شد."
          : "این مورد از قبل وجود داشت و انتخاب شد.",
      );
      router.refresh();
    } catch {
      setNewItemError("ارتباط با سرور ناموفق بود.");
    } finally {
      setCreatingItem(false);
    }
  }
  async function fillMarketPrices(onlyMissing = false) {
    const date = digits(form.getValues("date"));
    if (!gregorian(date)) {
      toast.error("تاریخ شمسی معتبر انتخاب کنید.");
      return;
    }
    const needUsdt = !onlyMissing || !form.getValues("usdt").trim();
    const needGold = !onlyMissing || !form.getValues("gold").trim();
    if (onlyMissing) setLookupAttempted(true);
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
      else
        toast.success("قیمت‌ها دریافت شد؛ مقدارها را بررسی و سپس ذخیره کنید.");
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
            setLookupAttempted(false);
            setAddingItem(false);
            setNewItemName("");
            setNewItemError("");
            form.reset({
              date: record ? jalali(record.record_date) : today(),
              itemId: selectedItemId,
              price: record ? String(record.price_toman) : "",
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
          قیمت‌ها به تومان هستند. مورد را از فهرست انتخاب کنید یا با دکمهٔ +
          مورد جدید بسازید.
        </DialogDescription>
        <form
          onSubmit={form.handleSubmit(async () => {
            if (addingItem) {
              toast.error("ابتدا مورد جدید را اضافه کنید یا انصراف دهید.");
              return;
            }
            if (
              !lookupAttempted &&
              (!form.getValues("usdt").trim() || !form.getValues("gold").trim())
            ) {
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
            <div className="form-field item-field">
              <label htmlFor={itemSelectId}>
                مورد <span className="required">*</span>
              </label>
              <div className="item-picker">
                <Controller
                  name="itemId"
                  control={form.control}
                  render={({ field }) => (
                    <select
                      {...field}
                      id={itemSelectId}
                      className="input item-select"
                      aria-invalid={!!form.formState.errors.itemId}
                    >
                      <option value="" disabled>
                        مورد را انتخاب کنید
                      </option>
                      {availableItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="item-add-button"
                  aria-label="ساخت مورد جدید"
                  title="ساخت مورد جدید"
                  aria-expanded={addingItem}
                  onClick={() => {
                    setAddingItem(!addingItem);
                    if (addingItem) setNewItemName("");
                    setNewItemError("");
                  }}
                >
                  <Plus size={20} />
                </Button>
              </div>
              {form.formState.errors.itemId && (
                <p className="field-error">
                  {form.formState.errors.itemId.message}
                </p>
              )}
              {addingItem && (
                <div className="new-item-panel">
                  <label htmlFor={newItemInputId}>نام مورد جدید</label>
                  <Input
                    id={newItemInputId}
                    value={newItemName}
                    onChange={(event) => {
                      setNewItemName(event.target.value);
                      setNewItemError("");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void addItem();
                      }
                    }}
                    placeholder="مثلاً قیمت ملک مسکونی در پیام"
                    aria-invalid={!!newItemError}
                    autoFocus
                  />
                  {newItemError && (
                    <p className="field-error" role="alert">
                      {newItemError}
                    </p>
                  )}
                  <div className="new-item-actions">
                    <Button
                      type="button"
                      onClick={addItem}
                      disabled={creatingItem}
                    >
                      {creatingItem && (
                        <LoaderCircle size={16} className="spin" />
                      )}
                      افزودن مورد
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setAddingItem(false);
                        setNewItemName("");
                        setNewItemError("");
                      }}
                      disabled={creatingItem}
                    >
                      انصراف
                    </Button>
                  </div>
                </div>
              )}
            </div>
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
                      setLookupAttempted(false);
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
              <Button
                type="button"
                variant="outline"
                onClick={() => fillMarketPrices()}
              >
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
                  این عدد نرخ دلار آزاد TGJU است و ممکن است با قیمت تتر فرق
                  داشته باشد.
                </p>
              )}
            </div>
            {(Object.keys(labels) as (keyof typeof labels)[]).map((key) => (
              <div className="form-field" key={key}>
                <label htmlFor={key}>
                  {labels[key]}{" "}
                  {key === "price" ? (
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
            <div className="form-field">
              <label htmlFor="recorded-by">
                ثبت‌کننده <span className="required">*</span>
              </label>
              <Input
                id="recorded-by"
                value="sobhan"
                readOnly
                className="readonly-input"
              />
            </div>
          </fieldset>
          <div className="dialog-actions">
            <Button type="submit" disabled={busy || addingItem}>
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
