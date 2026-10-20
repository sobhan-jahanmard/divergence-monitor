import Link from "next/link";
import { ChevronLeft, ChevronRight, Database } from "lucide-react";
import { jalali } from "@/lib/date";
import { number } from "@/lib/format";
import type { PriceRecord } from "@/lib/types";
import { PriceFormDialog } from "./price-form-dialog";
import { DeleteRecordDialog } from "./delete-record-dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
} from "./ui";
export function RecordsTable({
  records,
  total,
  page,
}: {
  records: PriceRecord[];
  total: number;
  page: number;
}) {
  const pages = Math.max(1, Math.ceil(total / 10));
  return (
    <section className="records-card">
      <div className="records-heading">
        <h2>
          اطلاعات ثبت‌شده{" "}
          <span className="count">{number(total, 0)} رکورد</span>
        </h2>
        <span className="muted">جدیدترین تاریخ در ابتدا</span>
      </div>
      {records.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              {[
                "تاریخ",
                "قیمت هر متر مربع (تومان)",
                "قیمت تتر (تومان)",
                "قیمت هر گرم طلا (تومان)",
                "عملیات",
              ].map((h) => (
                <TableHead key={h} scope="col">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <bdi>
                    {jalali(r.record_date).replace(
                      /\d/g,
                      (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)],
                    )}
                  </bdi>
                </TableCell>
                <TableCell className="price-cell">
                  {number(r.apartment_price_toman, 0)}
                </TableCell>
                <TableCell>
                  {r.usdt_price_toman === null
                    ? "—"
                    : number(r.usdt_price_toman, 0)}
                </TableCell>
                <TableCell>
                  {r.gold_18k_price_toman === null
                    ? "—"
                    : number(r.gold_18k_price_toman, 0)}
                </TableCell>
                <TableCell>
                  <div className="row-actions">
                    <PriceFormDialog record={r} />
                    <DeleteRecordDialog record={r} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="records-empty">
          <Database size={36} />
          <h3>هنوز اطلاعاتی ثبت نشده است</h3>
          <p>با ثبت اولین قیمت، آرشیو اطلاعات شما شکل می‌گیرد.</p>
          <PriceFormDialog />
        </div>
      )}
      <div className="pagination">
        <span>مجموع {number(total, 0)} رکورد</span>
        <div>
          {page > 1 ? (
            <Button asChild variant="outline">
              <Link href={`/records?page=${page - 1}`}>
                <ChevronRight size={16} />
                قبلی
              </Link>
            </Button>
          ) : (
            <Button disabled variant="outline">
              <ChevronRight size={16} />
              قبلی
            </Button>
          )}
          <span>
            صفحه {number(page, 0)} از {number(pages, 0)}
          </span>
          {page < pages ? (
            <Button asChild variant="outline">
              <Link href={`/records?page=${page + 1}`}>
                بعدی
                <ChevronLeft size={16} />
              </Link>
            </Button>
          ) : (
            <Button disabled variant="outline">
              بعدی
              <ChevronLeft size={16} />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
