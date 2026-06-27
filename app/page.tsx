import { Dashboard } from "@/components/Dashboard";
import { ACTIVE_ASIN, getDashboardData } from "@/lib/data";

export default async function Home() {
  const data = await getDashboardData();

  if (!data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-semibold">No data yet</h1>
        <p className="text-sm text-muted-foreground">
          No scraped data found for ASIN <code className="rounded bg-muted px-1.5 py-0.5">{ACTIVE_ASIN}</code>.
          Run the scraper and classifier to populate the dashboard:
        </p>
        <pre className="rounded-lg bg-muted px-4 py-3 text-left text-xs">
          <code>{`pnpm scrape -- ${ACTIVE_ASIN}\npnpm classify -- ${ACTIVE_ASIN}`}</code>
        </pre>
      </main>
    );
  }

  return <Dashboard product={data.product} reviews={data.reviews} generatedAt={data.generatedAt} />;
}
