import { AutoRefresh } from "@/components/auto-refresh";
import { Bubbles } from "@/components/fx/bubbles";
import { HomeClient } from "@/components/home/home-client";
import { SetupNotice } from "@/components/setup-notice";
import { getAllVotes, getBeersPublic, getContestStatus, getParticipants, getResults } from "@/lib/data";
import { isDbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!isDbConfigured()) return <SetupNotice />;

  const status = await getContestStatus();
  const [participants, beers, votes, results] = await Promise.all([
    getParticipants(),
    getBeersPublic(status),
    getAllVotes(),
    status === "finished" ? getResults() : Promise.resolve(null),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <Bubbles />
      <AutoRefresh intervalMs={6000} />
      <HomeClient
        status={status}
        participants={participants}
        beers={beers}
        votes={votes}
        results={results}
      />
    </main>
  );
}
