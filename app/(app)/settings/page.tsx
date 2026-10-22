import { requireFarm, requireUser } from "@/lib/auth/guard";
import { FarmForm } from "./FarmForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings · AgriPrice" };

export default async function SettingsPage() {
  const user = await requireUser();
  const farm = await requireFarm(user.id);

  return (
    <div className="space-y-8">
      <header>
        <span className="chip border-leaf-300 bg-leaf-100 font-bold uppercase tracking-wide text-brand">
          Farm setup
        </span>
        <h1 className="display mt-2 text-display-md text-ink">Settings</h1>
        <p className="mt-1 text-[17px] text-ink-muted">
          The farm name and the coordinates the weather uses.
        </p>
      </header>

      <section aria-labelledby="farm-title" className="panel">
        <h2 id="farm-title" className="text-xl font-semibold">
          Farm
        </h2>
        <p className="text-ink-muted">
          Weather is fetched for these coordinates. The default is Port Harcourt.
        </p>
        <FarmForm farm={{ name: farm.name, lat: farm.lat, lon: farm.lon }} />
      </section>

      <section aria-labelledby="account-title" className="panel">
        <h2 id="account-title" className="text-xl font-semibold">
          Account
        </h2>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex flex-wrap gap-2">
            <dt className="text-ink-muted">Name</dt>
            <dd className="font-medium">{user.name}</dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="text-ink-muted">Email</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-ink-muted">
          Passwords are stored as a bcrypt hash, never as plain text.
        </p>
      </section>
    </div>
  );
}
