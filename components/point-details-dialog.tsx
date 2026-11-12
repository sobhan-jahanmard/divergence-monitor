"use client";
import { jalali } from "@/lib/date";
import { number } from "@/lib/format";
import type { Point } from "@/lib/metrics";
import type { PriceItem } from "@/lib/types";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui";

function amount(value: number | null) {
  return value === null ? "ثبت نشده" : `${number(value, 0)} تومان`;
}

export function PointDetailsDialog({
  point,
  items,
  onClose,
  onRestoreFocus,
}: {
  point: Point | null;
  items: PriceItem[];
  onClose: () => void;
  onRestoreFocus: () => void;
}) {
  return (
    <Dialog
      open={point !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="dialog point-details-dialog"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onRestoreFocus();
        }}
      >
        <DialogTitle className="dialog-title">
          جزئیات اطلاعات ثبت‌شده
        </DialogTitle>
        <DialogDescription className="muted">
          {point && (
            <>
              {point.label.replace(
                /\d/g,
                (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)],
              )}
              {point.label.length < 10
                ? ` · ${number(point.records.length, 0)} رکورد در محاسبهٔ این میانگین`
                : " · مقادیر ورودی این نقطه"}
            </>
          )}
        </DialogDescription>
        <div className="point-records">
          {point?.records.map((record) => (
            <article className="point-record" key={record.id}>
              <div className="point-record-heading">
                <h3>
                  {items.find((item) => item.id === record.item_id)?.name ??
                    "مورد ثبت‌شده"}
                </h3>
                <time dateTime={record.record_date}>
                  {jalali(record.record_date).replace(
                    /\d/g,
                    (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)],
                  )}
                </time>
              </div>
              <dl className="point-record-values">
                <div className="point-record-price">
                  <dt>قیمت مورد</dt>
                  <dd>{amount(record.price_toman)}</dd>
                </div>
                <div>
                  <dt>نرخ ثبت‌شدهٔ هر تتر</dt>
                  <dd>{amount(record.usdt_price_toman)}</dd>
                </div>
                <div>
                  <dt>نرخ هر گرم طلای ۱۸ عیار</dt>
                  <dd>{amount(record.gold_18k_price_toman)}</dd>
                </div>
                <div>
                  <dt>ثبت‌کننده</dt>
                  <dd>
                    <bdi>{record.recorded_by}</bdi>
                  </dd>
                </div>
              </dl>
              {record.notes && (
                <div className="point-record-notes">
                  <h4>توضیحات</h4>
                  <p>{record.notes}</p>
                </div>
              )}
            </article>
          ))}
        </div>
        <div className="dialog-actions">
          <DialogClose asChild>
            <Button variant="outline">بستن جزئیات</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
