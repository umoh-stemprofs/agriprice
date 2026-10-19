import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/auth/guard";
import { NEW_FARM_NAME } from "@/lib/config";
import { db } from "@/lib/db";

/**
 * Everything under this layout needs a session. Middleware already redirects
 * signed-out visitors; this second check means a page can never render for
 * nobody even if the matcher is changed later.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  let farmName = NEW_FARM_NAME;
  try {
    const farm = await db.farm.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: { name: true },
    });
    if (farm) farmName = farm.name;
  } catch {
    // A slow database must not take the shell down; the page shows the rest.
  }

  return (
    <AppShell userName={user.name} farmName={farmName}>
      {children}
    </AppShell>
  );
}
