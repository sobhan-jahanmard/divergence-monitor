import { RetryButton } from "@/components/retry-button";
import { Header } from "@/components/header";
import { Dashboard } from "@/components/dashboard";
import { allRecords } from "@/lib/prices";
export const dynamic = "force-dynamic";
export default async function Home() {
  let records;
  try {
    records = await allRecords();
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
      <Header />
      <Dashboard records={records} />
    </main>
  );
}
