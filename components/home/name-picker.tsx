"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Beer } from "lucide-react";
import type { Participant } from "@/lib/types";

gsap.registerPlugin(useGSAP);

const AVATAR_GRADIENTS = [
  "from-amber-300 to-orange-500",
  "from-yellow-200 to-amber-500",
  "from-orange-300 to-red-400",
  "from-amber-200 to-yellow-500",
];

export function NamePicker({
  participants,
  onSelect,
}: {
  participants: Participant[];
  onSelect: (id: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-hero]", {
        y: 24,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });
      gsap.from("[data-name-card]", {
        y: 22,
        opacity: 0,
        scale: 0.92,
        duration: 0.5,
        stagger: 0.05,
        delay: 0.25,
        ease: "back.out(1.6)",
      });
      gsap.to("[data-mug]", {
        rotate: 8,
        y: -5,
        duration: 1.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    },
    { scope: ref }
  );

  const pick = (id: number, el: HTMLButtonElement) => {
    navigator.vibrate?.(20);
    gsap.to(el, {
      scale: 1.06,
      duration: 0.12,
      yoyo: true,
      repeat: 1,
      onComplete: () => onSelect(id),
    });
  };

  return (
    <div
      ref={ref}
      className="flex flex-1 flex-col justify-center px-5 pb-safe pt-safe"
    >
      <header data-hero className="flex flex-col items-center pb-5 pt-4 text-center">
        <span
          data-mug
          className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-3xl shadow-[0_0_50px_-12px] shadow-primary/40"
        >
          🍺
        </span>
        <h1 className="font-heading text-4xl font-extrabold tracking-tight text-gold">
          La Gran Cata
        </h1>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Cata a ciegas · vota del 1 al 10 · que gane la mejor birra
        </p>
      </header>

      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Beer className="size-4 text-primary" />
        ¿Quién eres?
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {participants.map((p, i) => (
          <button
            key={p.id}
            data-name-card
            onClick={(e) => pick(p.id, e.currentTarget)}
            className="glass flex min-h-[5.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-3 transition-colors active:bg-primary/10"
          >
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-base font-bold text-amber-950 ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]}`}
            >
              {p.name.charAt(0).toUpperCase()}
            </span>
            <span className="text-center text-sm font-semibold leading-tight">
              {p.name}
            </span>
          </button>
        ))}
      </div>

      <p className="pt-4 text-center text-[0.65rem] text-muted-foreground/70">
        Tu elección se recuerda en este móvil. Sin cuentas, sin líos.
      </p>
    </div>
  );
}
