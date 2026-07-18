import type { Metadata } from "next";
import { AdminLogin } from "@/components/admin/admin-login";
import { AdminPanel } from "@/components/admin/admin-panel";
import { AutoRefresh } from "@/components/auto-refresh";
import { SetupNotice } from "@/components/setup-notice";
import { isAdmin } from "@/lib/auth";
import { getBeersAdmin, getContestStatus, getParticipantsAdmin } from "@/lib/data";
import { isDbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel del jurado · La Gran Cata",
  robots: { index: false },
};

export default async function AdminPage() {
  if (!isDbConfigured()) return <SetupNotice />;

  if (!(await isAdmin())) {
    return <AdminLogin />;
  }

  const [status, beers, participants] = await Promise.all([
    getContestStatus(),
    getBeersAdmin(),
    getParticipantsAdmin(),
  ]);

  return (
    <main className="flex w-full flex-1 flex-col">
      <AutoRefresh intervalMs={10000} />
      <AdminPanel status={status} beers={beers} participants={participants} />
    </main>
  );
}
