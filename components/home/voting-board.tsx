"use client";

import { useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Hourglass, Lock, Pencil, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatVote } from "@/components/fx/count-up";
import { VoteDrawer } from "./vote-drawer";
import type { BeerPublic, ContestStatus, Participant, Vote } from "@/lib/types";

gsap.registerPlugin(useGSAP);

export function VotingBoard({
  me,
  beers,
  votes,
  status,
  onChangeName,
}: {
  me: Participant;
  beers: BeerPublic[];
  votes: Vote[];
  status: Extract<ContestStatus, "voting" | "locked">;
  onChangeName: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<BeerPublic | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const locked = status === "locked";

  const myVotes = useMemo(() => {
    const map = new Map<number, number>();
    for (const v of votes) if (v.participantId === me.id) map.set(v.beerId, v.score);
    return map;
  }, [votes, me.id]);

  const votedCount = beers.filter((b) => myVotes.has(b.id)).length;
  const progress = beers.length > 0 ? votedCount / beers.length : 0;

  useGSAP(
    () => {
      gsap.from("[data-board-header]", { y: -16, opacity: 0, duration: 0.6, ease: "power3.out" });
      if (locked) {
        // Flip de revelación: los números giran y aparecen los nombres reales.
        gsap.from("[data-beer-card]", {
          rotationX: -85,
          opacity: 0,
          transformOrigin: "center bottom",
          duration: 0.7,
          stagger: 0.09,
          delay: 0.15,
          ease: "back.out(1.4)",
        });
      } else {
        gsap.from("[data-beer-card]", {
          y: 28,
          opacity: 0,
          scale: 0.94,
          duration: 0.5,
          stagger: 0.07,
          delay: 0.1,
          ease: "back.out(1.5)",
        });
      }
      gsap.fromTo(
        "[data-progress-bar]",
        { width: 0 },
        { width: `${progress * 100}%`, duration: 1, delay: 0.4, ease: "power3.out" }
      );
    },
    { scope: ref, dependencies: [locked] }
  );

  const openBeer = (beer: BeerPublic) => {
    if (locked) return;
    navigator.vibrate?.(12);
    setSelected(beer);
    setDrawerOpen(true);
  };

  return (
    <div ref={ref} className="flex flex-1 flex-col px-5 pt-safe">
      <header data-board-header className="flex items-center justify-between gap-3 pb-5 pt-6">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-gold">
            La Gran Cata
          </h1>
          {locked ? (
            <Badge variant="secondary" className="mt-1 gap-1 bg-primary/15 text-primary">
              <Lock className="size-3" /> Votación cerrada
            </Badge>
          ) : (
            <Badge variant="secondary" className="mt-1 gap-1">
              <Star className="size-3 text-primary" /> Votación abierta
            </Badge>
          )}
        </div>
        <button
          onClick={onChangeName}
          className="glass flex items-center gap-2 rounded-full py-2 pl-4 pr-3 text-sm font-semibold active:bg-primary/10"
        >
          {me.name}
          <Pencil className="size-3.5 text-muted-foreground" />
        </button>
      </header>

      {locked ? (
        <div className="glass mb-5 flex items-start gap-3 rounded-2xl border-primary/25 p-4">
          <Hourglass className="mt-0.5 size-5 shrink-0 animate-pulse text-primary" />
          <div className="text-sm">
            <p className="font-semibold">Identidades reveladas 🍺</p>
            <p className="text-muted-foreground">
              El jurado delibera… los resultados aparecerán aquí solos.
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-5">
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Tu progreso de cata</span>
            <span className="tabular font-semibold">
              {votedCount}/{beers.length}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              data-progress-bar
              className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 pb-safe">
        {beers.map((beer) => {
          const myScore = myVotes.get(beer.id) ?? null;
          return (
            <button
              key={beer.id}
              data-beer-card
              onClick={() => openBeer(beer)}
              disabled={locked}
              className={`relative flex min-h-36 flex-col items-center justify-center gap-1 overflow-hidden rounded-3xl p-4 text-center transition-colors ${
                myScore !== null
                  ? "border border-primary/40 bg-primary/10"
                  : "glass active:bg-primary/10"
              }`}
            >
              <span className="font-heading text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Cerveza
              </span>
              <span className="font-heading tabular text-6xl font-extrabold leading-none text-gold">
                {beer.number}
              </span>
              {locked && (
                <>
                  <span className="mt-1 line-clamp-2 text-sm font-bold leading-tight">
                    {beer.realName ?? `Cerveza ${beer.number}`}
                  </span>
                  {beer.groupName && (
                    <span className="text-[0.65rem] font-medium text-primary">
                      de {beer.groupName}
                    </span>
                  )}
                </>
              )}
              <span className="mt-1.5">
                {myScore !== null ? (
                  <Badge className="tabular gap-1 bg-primary text-primary-foreground">
                    <Star className="size-3 fill-current" /> {formatVote(myScore)}
                  </Badge>
                ) : locked ? (
                  <Badge variant="outline" className="text-muted-foreground">
                    Sin nota
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-primary/40 text-primary">
                    Tocar para votar
                  </Badge>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {beers.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Aún no hay cervezas en el concurso. El organizador las añadirá en breve 🍺
        </p>
      )}

      <div className="h-8" />

      <VoteDrawer
        key={selected?.id ?? "none"}
        beer={selected}
        participantId={me.id}
        currentScore={selected ? (myVotes.get(selected.id) ?? null) : null}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
