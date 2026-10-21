import { hasAccess } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
import { RetryButton } from "@/components/retry-button";
import { Header } from "@/components/header";
import { Dashboard } from "@/components/dashboard";
import { allItems, allRecords } from "@/lib/prices";
export const dynamic = "force-dynamic";
export default async function Home() {
  if (!(await hasAccess())) return <LoginForm />;
  let records;
  let items;
  try {
    [records, items] = await Promise.all([allRecords(), allItems()]);
  } catch (error) {
    return (
      <main className="shell">
        <Header />
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
  return (
    <main className="shell">
      <Header items={items} />
      <Dashboard records={records} items={items} />
    </main>
  );
}
