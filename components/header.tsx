import { logout } from "@/app/auth-actions";
import Link from "next/link";
import { ChartNoAxesCombined, House, Database } from "lucide-react";
import { PriceFormDialog } from "./price-form-dialog";
import type { PriceItem } from "@/lib/types";
export function Header({ records = false, items = [] }: { records?: boolean; items?: PriceItem[] }) {
  return (
    <>
      <nav className="topbar">
        <Link href="/" className="brand">
          <span className="brand-icon">
            <House size={22} />
          </span>
          <span>خانه‌نما<small>رصد قیمت‌ها</small></span>
        </Link>
        <div className="nav-links">
          <Link className={!records ? "active" : ""} href="/">
            <ChartNoAxesCombined size={17} />
            نمودارها
          </Link>
          <Link className={records ? "active" : ""} href="/records">
            <Database size={17} />
            مدیریت اطلاعات
          </Link>
        </div>
        <form action={logout}>
          <button type="submit" className="button outline">
            خروج
          </button>
        </form>
      </nav>
      <header className="page-header">
        <div>
          <div className="eyebrow">
            {records ? "آرشیو قیمت‌ها" : "نمای کلی بازار"}
          </div>
          <h1>
            {records
              ? "مدیریت اطلاعات"
              : "روند قیمت‌ها"}
          </h1>
          <p>
            {records
              ? "اطلاعات ثبت‌شده را مشاهده، ویرایش و مدیریت کنید."
              : "مقایسه قیمت موارد ثبت‌شده با تتر و طلا"}
          </p>
        </div>
        <PriceFormDialog items={items} />
      </header>
    </>
  );
}
