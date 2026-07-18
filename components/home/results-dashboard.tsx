"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Beer, Trophy, Users } from "lucide-react";
import { CountUp, formatScore } from "@/components/fx/count-up";
import type { BeerResult, ContestResults } from "@/lib/types";

gsap.registerPlugin(useGSAP);

const CONFETTI_COLORS = ["#fbd27c", "#f4a933", "#e07f1f", "#fff3d6", "#c96f2a"];

function beerLabel(beer: BeerResult): string {
  return beer.realName || `Cerveza ${beer.number}`;
}

function Podium({ ranking }: { ranking: BeerResult[] }) {
  const [first, second, third] = ranking;
  // Orden visual clásico de podio: 2º · 1º · 3º
  const slots = [
    { beer: second, place: 2, medal: "🥈", height: 88 },
    { beer: first, place: 1, medal: "🥇", height: 128 },
    { beer: third, place: 3, medal: "🥉", height: 64 },
  ].filter((s) => s.beer);

  return (
    <div className="flex items-end justify-center gap-3">
      {slots.map(({ beer, place, medal, height }) => (
        <div key={beer.id} className="flex w-1/3 flex-col items-center gap-2">
          <span
            data-medal
            className={place === 1 ? "text-4xl" : "text-3xl"}
            role="img"
            aria-label={`Puesto ${place}`}
          >
            {medal}
          </span>
          <div className="flex flex-col items-center gap-0.5 text-center">
            <span className="line-clamp-2 text-sm font-bold leading-tight">
              {beerLabel(beer)}
            </span>
            {beer.groupName && (
              <span className="line-clamp-2 text-[0.7rem] font-semibold leading-tight text-primary">
                {beer.groupName}
              </span>
            )}
            <span className="text-[0.7rem] text-muted-foreground">Nº {beer.number}</span>
          </div>
          <div
            data-podium-bar
            style={{ height }}
            className={`flex w-full origin-bottom flex-col items-center justify-start rounded-t-2xl pt-2 ${
              place === 1
                ? "bg-gradient-to-b from-amber-300 to-amber-600 shadow-[0_0_50px_-10px] shadow-amber-400/50"
                : "bg-gradient-to-b from-amber-200/40 to-amber-700/30"
            }`}
          >
            <span
              className={`tabular font-heading text-xl font-extrabold ${
                place === 1 ? "text-amber-950" : "text-foreground"
              }`}
            >
              <CountUp value={beer.avg} decimals={1} delay={0.6 + place * 0.15} />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ResultsDashboard({ results }: { results: ContestResults }) {
  const ref = useRef<HTMLDivElement>(null);
  const { ranking, totalVotes, totalParticipants, globalAvg } = results;
  const rest = ranking.slice(3);
  const winner = ranking[0];

  useGSAP(
    () => {
      const tl = gsap.timeline();
      tl.from("[data-results-header]", { y: -20, opacity: 0, duration: 0.6, ease: "power3.out" })
        .from(
          "[data-podium-bar]",
          { scaleY: 0, duration: 0.9, stagger: 0.15, ease: "back.out(1.3)" },
          "-=0.2"
        )
        .from(
          "[data-medal]",
          { y: -30, opacity: 0, duration: 0.5, stagger: 0.12, ease: "bounce.out" },
          "-=0.6"
        )
        .from(
          "[data-rank-row]",
          { x: -24, opacity: 0, duration: 0.45, stagger: 0.08, ease: "power2.out" },
          "-=0.3"
        )
        .from(
          "[data-stat-tile]",
          { y: 20, opacity: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" },
          "-=0.2"
        );

      gsap.utils.toArray<HTMLElement>("[data-rank-bar]").forEach((bar) => {
        gsap.fromTo(
          bar,
          { width: 0 },
          {
            width: bar.dataset.width,
            duration: 1,
            delay: 1.2,
            ease: "power3.out",
          }
        );
      });

      // Confeti: una sola ráfaga al entrar
      const stage = ref.current?.querySelector("[data-confetti]");
      if (stage) {
        for (let i = 0; i < 70; i++) {
          const piece = document.createElement("span");
          const size = gsap.utils.random(5, 10);
          piece.style.cssText = [
            "position:absolute",
            "top:-4vh",
            `left:${gsap.utils.random(0, 100)}%`,
            `width:${size}px`,
            `height:${size * gsap.utils.random(0.4, 1)}px`,
            `background:${CONFETTI_COLORS[i % CONFETTI_COLORS.length]}`,
            `border-radius:${gsap.utils.random(0, 4)}px`,
          ].join(";");
          stage.appendChild(piece);
          gsap.to(piece, {
            y: () => window.innerHeight * gsap.utils.random(0.7, 1.15),
            x: gsap.utils.random(-90, 90),
            rotation: gsap.utils.random(-540, 540),
            opacity: 0,
            duration: gsap.utils.random(2.2, 4),
            delay: gsap.utils.random(0, 0.8),
            ease: "power1.in",
            onComplete: () => piece.remove(),
          });
        }
      }
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className="relative flex flex-1 flex-col px-5 pt-safe">
      <div data-confetti aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden" />

      <header data-results-header className="flex flex-col items-center pb-8 pt-12 text-center">
        <span className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-[0_0_50px_-10px] shadow-primary/50">
          <Trophy className="size-7" />
        </span>
        <h1 className="font-heading text-4xl font-extrabold tracking-tight text-gold">
          Resultados finales
        </h1>
        {winner && (
          <p className="mt-2 text-sm text-muted-foreground">
            {winner.groupName ? (
              <>
                {winner.groupName.includes(" y ") ? "Ganan" : "Gana"}{" "}
                <span className="font-bold text-foreground">{winner.groupName}</span> con{" "}
                <span className="font-bold text-foreground">{beerLabel(winner)}</span>
              </>
            ) : (
              <>
                Gana <span className="font-bold text-foreground">{beerLabel(winner)}</span>
              </>
            )}{" "}
            — <span className="tabular font-bold text-primary">{formatScore(winner.avg)}</span> de
            media 🏆
          </p>
        )}
      </header>

      <section aria-label="Podio" className="pb-8">
        <Podium ranking={ranking} />
      </section>

      {rest.length > 0 && (
        <section aria-label="Clasificación completa" className="flex flex-col gap-2 pb-8">
          {rest.map((beer, i) => (
            <div key={beer.id} data-rank-row className="glass rounded-2xl p-3.5">
              <div className="flex items-center gap-3">
                <span className="tabular w-6 text-center font-heading text-lg font-bold text-muted-foreground">
                  {i + 4}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-bold">{beerLabel(beer)}</span>
                    <span className="tabular font-heading text-lg font-extrabold">
                      {formatScore(beer.avg)}
                    </span>
                  </div>
                  {beer.groupName && (
                    <span className="block truncate text-[0.65rem] font-medium text-primary">
                      {beer.groupName}
                    </span>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        data-rank-bar
                        data-width={`${(beer.avg / 10) * 100}%`}
                        className="h-full rounded-full bg-primary"
                      />
                    </div>
                    <span className="shrink-0 text-[0.7rem] text-muted-foreground">
                      Nº {beer.number} · {beer.votesCount}{" "}
                      {beer.votesCount === 1 ? "voto" : "votos"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      <section aria-label="Estadísticas" className="grid grid-cols-3 gap-3 pb-safe">
        <div data-stat-tile className="glass flex flex-col items-center gap-1 rounded-2xl py-4">
          <Beer className="size-4 text-primary" />
          <span className="tabular font-heading text-2xl font-extrabold">
            <CountUp value={totalVotes} decimals={0} delay={1.4} />
          </span>
          <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
            Votos
          </span>
        </div>
        <div data-stat-tile className="glass flex flex-col items-center gap-1 rounded-2xl py-4">
          <Users className="size-4 text-primary" />
          <span className="tabular font-heading text-2xl font-extrabold">
            <CountUp value={totalParticipants} decimals={0} delay={1.5} />
          </span>
          <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
            Catadores
          </span>
        </div>
        <div data-stat-tile className="glass flex flex-col items-center gap-1 rounded-2xl py-4">
          <Trophy className="size-4 text-primary" />
          <span className="tabular font-heading text-2xl font-extrabold">
            <CountUp value={globalAvg} decimals={1} delay={1.6} />
          </span>
          <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
            Nota media
          </span>
        </div>
      </section>

      <div className="h-10" />
    </div>
  );
}
