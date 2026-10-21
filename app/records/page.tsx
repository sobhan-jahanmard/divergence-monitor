import { hasAccess } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
import { RetryButton } from "@/components/retry-button";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { RecordsTable } from "@/components/records-table";
import { allItems, paginatedRecords } from "@/lib/prices";
import { pageNumber } from "@/lib/metrics";
export const dynamic = "force-dynamic";
export default async function Records({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  if (!(await hasAccess())) return <LoginForm />;
  const params = await searchParams;
  const page = pageNumber(params.page);
  let result;
  let items;
  try {
    [result, items] = await Promise.all([paginatedRecords(page), allItems()]);
  } catch (error) {
    return (
      <main className="shell">
        <Header records />
        <div role="alert" className="error-panel">
          <h2>اطلاعات در دسترس نیست</h2>
          <p>
            {error instanceof Error ? error.message : "خطا در دریافت اطلاعات."}
          </p>
          <RetryButton />
        </div>
      </main>
    );
  }
  if (
    result.current !== page ||
    (params.page !== undefined && params.page !== String(page))
  )
    redirect(`/records?page=${result.current}`);
  return (
    <main className="shell">
      <Header records items={items} />
      <RecordsTable
        records={result.records}
        items={items}
        total={result.total}
        page={result.current}
      />
    </main>
  );
}
