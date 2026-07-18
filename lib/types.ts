export type ContestStatus = "voting" | "locked" | "finished";

export interface Participant {
  id: number;
  name: string;
}

export interface ParticipantAdmin extends Participant {
  votesCount: number;
}

export interface Group {
  id: number;
  name: string;
}

/** Cerveza tal y como la ve un votante: nombre real y pareja solo llegan si ya se reveló. */
export interface BeerPublic {
  id: number;
  number: number;
  realName: string | null;
  groupName: string | null;
}

export interface BeerAdmin {
  id: number;
  number: number;
  realName: string;
  groupId: number | null;
  votesCount: number;
  avg: number;
}

export interface Vote {
  participantId: number;
  beerId: number;
  score: number;
}

export interface BeerResult {
  id: number;
  number: number;
  realName: string;
  groupName: string | null;
  avg: number;
  votesCount: number;
  total: number;
}

export interface ContestResults {
  ranking: BeerResult[];
  totalVotes: number;
  totalParticipants: number;
  globalAvg: number;
}

export type ActionResult = { ok: true } | { ok: false; error: string };
