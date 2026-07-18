import "server-only";
import { ensureSchema, sql } from "./db";
import type {
  BeerAdmin,
  BeerPublic,
  BeerResult,
  ContestResults,
  ContestStatus,
  Participant,
  ParticipantAdmin,
  Vote,
} from "./types";

export async function getContestStatus(): Promise<ContestStatus> {
  await ensureSchema();
  const rows = await sql()`SELECT status FROM contest WHERE id = 1`;
  return (rows[0]?.status ?? "voting") as ContestStatus;
}

export async function getParticipants(): Promise<Participant[]> {
  await ensureSchema();
  const rows = await sql()`SELECT id, name FROM participants ORDER BY name ASC`;
  return rows.map((r) => ({ id: r.id as number, name: r.name as string }));
}

/**
 * Cervezas para la vista pública. El nombre real solo viaja al cliente cuando
 * la votación ya está bloqueada o finalizada: durante la votación es null.
 */
export async function getBeersPublic(status: ContestStatus): Promise<BeerPublic[]> {
  await ensureSchema();
  const rows = await sql()`SELECT id, number, real_name FROM beers ORDER BY number ASC`;
  const revealed = status !== "voting";
  return rows.map((r) => ({
    id: r.id as number,
    number: r.number as number,
    realName: revealed ? ((r.real_name as string) || null) : null,
  }));
}

export async function getAllVotes(): Promise<Vote[]> {
  await ensureSchema();
  const rows = await sql()`
    SELECT participant_id, beer_id, score FROM votes`;
  return rows.map((r) => ({
    participantId: r.participant_id as number,
    beerId: r.beer_id as number,
    score: r.score as number,
  }));
}

export async function getResults(): Promise<ContestResults> {
  await ensureSchema();
  const q = sql();
  const ranking = await q`
    SELECT
      b.id,
      b.number,
      b.real_name,
      COALESCE(AVG(v.score), 0)::float AS avg,
      COUNT(v.id)::int AS votes_count,
      COALESCE(SUM(v.score), 0)::int AS total
    FROM beers b
    LEFT JOIN votes v ON v.beer_id = b.id
    GROUP BY b.id
    ORDER BY avg DESC, votes_count DESC, total DESC, b.number ASC`;

  const [stats] = await q`
    SELECT
      COUNT(*)::int AS total_votes,
      COUNT(DISTINCT participant_id)::int AS total_participants,
      COALESCE(AVG(score), 0)::float AS global_avg
    FROM votes`;

  return {
    ranking: ranking.map(
      (r): BeerResult => ({
        id: r.id as number,
        number: r.number as number,
        realName: (r.real_name as string) || "",
        avg: r.avg as number,
        votesCount: r.votes_count as number,
        total: r.total as number,
      })
    ),
    totalVotes: stats.total_votes as number,
    totalParticipants: stats.total_participants as number,
    globalAvg: stats.global_avg as number,
  };
}

export async function getBeersAdmin(): Promise<BeerAdmin[]> {
  await ensureSchema();
  const rows = await sql()`
    SELECT
      b.id,
      b.number,
      b.real_name,
      COUNT(v.id)::int AS votes_count,
      COALESCE(AVG(v.score), 0)::float AS avg
    FROM beers b
    LEFT JOIN votes v ON v.beer_id = b.id
    GROUP BY b.id
    ORDER BY b.number ASC`;
  return rows.map((r) => ({
    id: r.id as number,
    number: r.number as number,
    realName: r.real_name as string,
    votesCount: r.votes_count as number,
    avg: r.avg as number,
  }));
}

export async function getParticipantsAdmin(): Promise<ParticipantAdmin[]> {
  await ensureSchema();
  const rows = await sql()`
    SELECT p.id, p.name, COUNT(v.id)::int AS votes_count
    FROM participants p
    LEFT JOIN votes v ON v.participant_id = p.id
    GROUP BY p.id
    ORDER BY p.name ASC`;
  return rows.map((r) => ({
    id: r.id as number,
    name: r.name as string,
    votesCount: r.votes_count as number,
  }));
}
