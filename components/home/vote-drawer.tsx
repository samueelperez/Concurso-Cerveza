"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";
import { formatVote } from "@/components/fx/count-up";
import { castVote } from "@/lib/actions";
import { MAX_SCORE, MIN_SCORE, SCORE_STEP } from "@/lib/constants";
import type { BeerPublic } from "@/lib/types";

export function VoteDrawer({
  beer,
  participantId,
  currentScore,
  open,
  onOpenChange,
}: {
  beer: BeerPublic | null;
  participantId: number;
  currentScore: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  // El componente se remonta por `key` en cada cerveza, así que la nota
  // inicial se puede fijar de forma perezosa.
  const [score, setScore] = useState(() => currentScore ?? 7);
  const [isPending, startTransition] = useTransition();
  const scoreRef = useRef<HTMLSpanElement>(null);

  const bump = (value: number) => {
    setScore(value);
    navigator.vibrate?.(8);
    if (scoreRef.current) {
      gsap.fromTo(
        scoreRef.current,
        { scale: 1.25 },
        { scale: 1, duration: 0.25, ease: "back.out(2)" }
      );
    }
  };

  const submit = () => {
    if (!beer) return;
    startTransition(async () => {
      const result = await castVote(participantId, beer.id, score);
      if (result.ok) {
        navigator.vibrate?.([20, 40, 20]);
        toast.success(`Cerveza Nº ${beer.number} → ${formatVote(score)}/10 🍻`);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-md">
        {beer && (
          <div className="px-6 pb-safe">
            <DrawerHeader className="items-center text-center">
              <span className="font-heading text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Cerveza
              </span>
              <DrawerTitle className="font-heading text-6xl font-extrabold text-gold">
                Nº {beer.number}
              </DrawerTitle>
              <DrawerDescription>
                {currentScore !== null
                  ? "Ya la puntuaste — puedes cambiar tu nota."
                  : "Dale tu nota, del 1 al 10."}
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex flex-col items-center gap-6 pb-8 pt-2">
              <span
                ref={scoreRef}
                className="font-heading tabular text-8xl font-extrabold leading-none text-primary"
              >
                {formatVote(score)}
              </span>

              <div className="w-full px-2">
                <Slider
                  value={[score]}
                  min={MIN_SCORE}
                  max={MAX_SCORE}
                  step={SCORE_STEP}
                  onValueChange={([v]) => bump(v)}
                  className="**:data-[slot=slider-thumb]:size-7"
                />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>1 · aguachirri</span>
                  <span>10 · obra maestra</span>
                </div>
              </div>

              <Button
                size="lg"
                onClick={submit}
                disabled={isPending}
                className="h-14 w-full rounded-2xl text-lg font-bold"
              >
                {isPending ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>Votar 🍻</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
