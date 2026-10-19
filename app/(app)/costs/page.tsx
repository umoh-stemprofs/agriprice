import Link from "next/link";

export const metadata = { title: "Costs · AgriPrice" };

/**
 * Placeholder for step 7 (the cost-of-waiting form with a live preview).
 * It exists now so the "Set costs" link on the dashboard is never a dead end.
 */
export default function CostsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Cost of waiting</h1>
        <p className="text-muted">
          Storage cost per kg per week, spoilage per week, and the minimum gain that makes waiting
          worth it.
        </p>
      </header>

      <section className="card">
        <p className="font-medium">The form arrives in the next step.</p>
        <p className="mt-1 text-muted">
          Your farm already has cost settings saved from setup, so the dashboard can count the cost
          of holding. This page will let you change them per crop, with a live preview of the
          answer.
        </p>
        <Link href="/dashboard" className="btn-secondary mt-4">
          Back to dashboard
        </Link>
      </section>
    </div>
  );
}
