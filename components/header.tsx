import Link from "next/link";
import { ChartNoAxesCombined, House, Database } from "lucide-react";
import { PriceFormDialog } from "./price-form-dialog";
export function Header({ records = false }: { records?: boolean }) {
  return (
    <>
      <nav className="topbar">
        <Link href="/" className="brand">
          <span className="brand-icon">
            <House size={22} />
          </span>
          <span>
            خانه‌نما<small>رصد بازار مسکن</small>
          </span>
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
        <span className="location">مشهد، قاسم‌آباد</span>
      </nav>
      <header className="page-header">
        <div>
          <div className="eyebrow">
            {records ? "آرشیو قیمت‌ها" : "نمای کلی بازار"}
          </div>
          <h1>{records ? "مدیریت اطلاعات" : "روند قیمت مسکن در قاسم‌آباد"}</h1>
          <p>
            {records
              ? "اطلاعات ثبت‌شده را مشاهده، ویرایش و مدیریت کنید."
              : "مقایسه قیمت هر متر مربع آپارتمان با دلار و طلا"}
          </p>
        </div>
        <PriceFormDialog />
      </header>
    </>
  );
}
