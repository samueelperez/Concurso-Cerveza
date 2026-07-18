"use client";

import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { NamePicker } from "./name-picker";
import { ResultsDashboard } from "./results-dashboard";
import { VotingBoard } from "./voting-board";
import type { BeerPublic, ContestResults, ContestStatus, Participant, Vote } from "@/lib/types";

const STORAGE_KEY = "gran-cata:participant";

// Mini-store sobre localStorage: quién soy en este dispositivo.
const listeners = new Set<() => void>();

function setStoredParticipant(id: number | null) {
  if (id === null) localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, String(id));
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot(): string | null {
  return null;
}

export function HomeClient({
  status,
  participants,
  beers,
  votes,
  results,
}: {
  status: ContestStatus;
  participants: Participant[];
  beers: BeerPublic[];
  votes: Vote[];
  results: ContestResults | null;
}) {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (status === "finished" && results) {
    return <ResultsDashboard results={results} />;
  }

  const me = participants.find((p) => p.id === Number(stored)) ?? null;

  if (!me) {
    return (
      <NamePicker
        participants={participants}
        onSelect={(id) => {
          setStoredParticipant(id);
          const name = participants.find((p) => p.id === id)?.name;
          if (name) toast(`¡Salud, ${name}! 🍻`);
        }}
      />
    );
  }

  return (
    <VotingBoard
      me={me}
      beers={beers}
      votes={votes}
      status={status === "locked" ? "locked" : "voting"}
      onChangeName={() => setStoredParticipant(null)}
    />
  );
}
