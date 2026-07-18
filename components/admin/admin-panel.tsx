"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Beer,
  Check,
  HeartHandshake,
  Home,
  Loader2,
  Lock,
  LogOut,
  Plus,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ConfirmIconButton } from "./confirm-icon-button";
import { formatScore } from "@/components/fx/count-up";
import {
  addBeer,
  addGroup,
  addParticipant,
  deleteBeer,
  deleteGroup,
  deleteParticipant,
  logoutAdmin,
  setContestStatus,
  updateBeerGroup,
  updateBeerName,
} from "@/lib/actions";
import type {
  ActionResult,
  BeerAdmin,
  ContestStatus,
  Group,
  ParticipantAdmin,
} from "@/lib/types";

gsap.registerPlugin(useGSAP);

const STATUS_OPTIONS: {
  value: ContestStatus;
  title: string;
  description: string;
  icon: typeof Beer;
}[] = [
  {
    value: "voting",
    title: "Votación abierta",
    description: "Los amigos pueden votar. Solo ven números.",
    icon: Beer,
  },
  {
    value: "locked",
    title: "Votación bloqueada",
    description: "Nadie puede votar y se revelan los nombres reales.",
    icon: Lock,
  },
  {
    value: "finished",
    title: "Resultados publicados",
    description: "Todos ven el dashboard final con el podio.",
    icon: Trophy,
  },
];

function useAction() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const run = (action: () => Promise<ActionResult>, successMsg?: string) => {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        if (successMsg) toast.success(successMsg);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };
  return { run, isPending };
}

function BeerRow({ beer, groups }: { beer: BeerAdmin; groups: Group[] }) {
  const { run } = useAction();
  const [name, setName] = useState(beer.realName);

  const save = () => {
    if (name.trim() !== beer.realName) {
      run(() => updateBeerName(beer.id, name), `Nº ${beer.number} guardada`);
    }
  };

  return (
    <div className="flex items-start gap-2.5">
      <span className="tabular flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 font-heading text-sm font-extrabold text-primary">
        {beer.number}
      </span>
      <div className="min-w-0 flex-1">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          placeholder="Nombre real (secreto)"
          className="h-9 rounded-lg text-sm"
        />
        <select
          value={beer.groupId ?? ""}
          onChange={(e) =>
            run(
              () =>
                updateBeerGroup(beer.id, e.target.value === "" ? null : Number(e.target.value)),
              e.target.value === "" ? `Nº ${beer.number} sin pareja` : `Pareja vinculada a la Nº ${beer.number}`
            )
          }
          aria-label={`Pareja de la cerveza ${beer.number}`}
          className="mt-1.5 h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground [&>option]:bg-popover"
        >
          <option value="">— Sin pareja —</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <p className="mt-0.5 pl-1 text-[0.7rem] text-muted-foreground">
          {beer.votesCount === 0
            ? "Sin votos aún"
            : `${beer.votesCount} ${beer.votesCount === 1 ? "voto" : "votos"} · media ${formatScore(beer.avg)}`}
        </p>
      </div>
      <ConfirmIconButton
        label={`Eliminar cerveza ${beer.number}`}
        onConfirm={() => run(() => deleteBeer(beer.id), `Nº ${beer.number} eliminada`)}
      />
    </div>
  );
}

export function AdminPanel({
  status,
  beers,
  participants,
  groups,
}: {
  status: ContestStatus;
  beers: BeerAdmin[];
  participants: ParticipantAdmin[];
  groups: Group[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { run, isPending } = useAction();

  const [confirmFinish, setConfirmFinish] = useState(false);
  const [newBeerNumber, setNewBeerNumber] = useState("");
  const [newBeerName, setNewBeerName] = useState("");
  const [newParticipant, setNewParticipant] = useState("");
  const [newGroup, setNewGroup] = useState("");

  const totalVotes = beers.reduce((sum, b) => sum + b.votesCount, 0);
  const expectedVotes = beers.length * participants.length;
  const nextNumber = beers.length > 0 ? Math.max(...beers.map((b) => b.number)) + 1 : 1;

  useGSAP(
    () => {
      gsap.from("[data-admin-section]", {
        y: 24,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out",
      });
    },
    { scope: ref }
  );

  const changeStatus = (value: ContestStatus) => {
    if (value === status) return;
    if (value === "finished") {
      setConfirmFinish(true);
      return;
    }
    run(
      () => setContestStatus(value),
      value === "locked" ? "Votación bloqueada 🔒" : "Votación abierta 🍺"
    );
  };

  const submitBeer = () => {
    const number = newBeerNumber.trim() === "" ? nextNumber : Number(newBeerNumber);
    run(() => addBeer(number, newBeerName), `Cerveza Nº ${number} añadida`);
    setNewBeerNumber("");
    setNewBeerName("");
  };

  const submitParticipant = () => {
    const name = newParticipant.trim();
    if (!name) return;
    run(() => addParticipant(name), `${name} añadido`);
    setNewParticipant("");
  };

  const submitGroup = () => {
    const name = newGroup.trim();
    if (!name) return;
    run(() => addGroup(name), `Pareja "${name}" añadida`);
    setNewGroup("");
  };

  return (
    <div ref={ref} className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 pb-10 pt-safe">
      <header data-admin-section className="flex items-center justify-between pt-6">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-gold">
            Panel del jurado
          </h1>
          <p className="text-xs text-muted-foreground">La Gran Cata · administración</p>
        </div>
        <div className="flex gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Ver la app"
            onClick={() => router.push("/")}
          >
            <Home className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cerrar sesión"
            onClick={() => run(() => logoutAdmin(), "Sesión cerrada")}
          >
            <LogOut className="size-5" />
          </Button>
        </div>
      </header>

      {/* Estado del concurso */}
      <Card data-admin-section className="glass">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Estado del concurso
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {STATUS_OPTIONS.map((option) => {
            const active = option.value === status;
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => changeStatus(option.value)}
                disabled={isPending}
                className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors ${
                  active
                    ? "border-primary/60 bg-primary/10"
                    : "border-border active:bg-accent"
                }`}
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-bold">
                    {option.title}
                    {active && (
                      <Badge className="h-5 gap-1 bg-primary/20 px-1.5 text-[0.65rem] text-primary">
                        <Check className="size-3" /> Actual
                      </Badge>
                    )}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Progreso en directo */}
      <Card data-admin-section className="glass">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            En directo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Votos emitidos</span>
            <span className="tabular font-bold">
              {totalVotes}/{expectedVotes}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all duration-700"
              style={{
                width: expectedVotes > 0 ? `${(totalVotes / expectedVotes) * 100}%` : 0,
              }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {participants.map((p) => (
              <Badge
                key={p.id}
                variant={p.votesCount >= beers.length && beers.length > 0 ? "default" : "secondary"}
                className="tabular gap-1"
              >
                {p.name} {p.votesCount}/{beers.length}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cervezas */}
      <Card data-admin-section className="glass">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Beer className="size-4 text-primary" /> Cervezas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {beers.map((beer) => (
            <BeerRow key={beer.id} beer={beer} groups={groups} />
          ))}
          <div className="mt-1 flex items-center gap-2.5 border-t border-border pt-3">
            <Input
              value={newBeerNumber}
              onChange={(e) => setNewBeerNumber(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              placeholder={String(nextNumber)}
              aria-label="Número de la nueva cerveza"
              className="tabular h-9 w-14 shrink-0 rounded-lg text-center text-sm"
            />
            <Input
              value={newBeerName}
              onChange={(e) => setNewBeerName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitBeer()}
              placeholder="Nombre real (secreto)"
              aria-label="Nombre de la nueva cerveza"
              className="h-9 flex-1 rounded-lg text-sm"
            />
            <Button
              size="icon"
              aria-label="Añadir cerveza"
              className="size-9 shrink-0 rounded-lg"
              disabled={isPending}
              onClick={submitBeer}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            </Button>
          </div>
          <p className="text-[0.7rem] text-muted-foreground">
            El nombre real nunca se envía a los móviles hasta que bloquees la votación.
          </p>
        </CardContent>
      </Card>

      {/* Parejas */}
      <Card data-admin-section className="glass">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <HeartHandshake className="size-4 text-primary" /> Parejas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {groups.map((g) => {
            const linked = beers.filter((b) => b.groupId === g.id).map((b) => b.number);
            return (
              <div key={g.id} className="flex items-center gap-2.5">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{g.name}</span>
                <span className="tabular shrink-0 text-xs text-muted-foreground">
                  {linked.length > 0 ? `Nº ${linked.join(", ")}` : "sin cerveza"}
                </span>
                <ConfirmIconButton
                  label={`Eliminar pareja ${g.name}`}
                  onConfirm={() => run(() => deleteGroup(g.id), `Pareja eliminada`)}
                />
              </div>
            );
          })}
          <div className="mt-1 flex items-center gap-2.5 border-t border-border pt-3">
            <Input
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitGroup()}
              placeholder="Nueva pareja (p. ej. Javier y Jimena)"
              aria-label="Nombre de la nueva pareja"
              className="h-9 flex-1 rounded-lg text-sm"
            />
            <Button
              size="icon"
              aria-label="Añadir pareja"
              className="size-9 shrink-0 rounded-lg"
              disabled={isPending}
              onClick={submitGroup}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Participantes */}
      <Card data-admin-section className="glass">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Users className="size-4 text-primary" /> Participantes
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {participants.map((p) => (
            <div key={p.id} className="flex items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                {p.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span>
              <span className="tabular flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="size-3 text-primary" /> {p.votesCount}
              </span>
              <ConfirmIconButton
                label={`Eliminar a ${p.name}`}
                onConfirm={() => run(() => deleteParticipant(p.id), `${p.name} eliminado`)}
              />
            </div>
          ))}
          <div className="mt-1 flex items-center gap-2.5 border-t border-border pt-3">
            <Input
              value={newParticipant}
              onChange={(e) => setNewParticipant(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitParticipant()}
              placeholder="Nuevo participante"
              aria-label="Nombre del nuevo participante"
              className="h-9 flex-1 rounded-lg text-sm"
            />
            <Button
              size="icon"
              aria-label="Añadir participante"
              className="size-9 shrink-0 rounded-lg"
              disabled={isPending}
              onClick={submitParticipant}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmación para publicar resultados */}
      <Dialog open={confirmFinish} onOpenChange={setConfirmFinish}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading">¿Publicar los resultados?</DialogTitle>
            <DialogDescription>
              Todos los móviles pasarán a ver el dashboard final con el podio y las
              medias. La votación queda cerrada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2">
            <Button
              variant="secondary"
              className="flex-1 rounded-xl"
              onClick={() => setConfirmFinish(false)}
            >
              Todavía no
            </Button>
            <Button
              className="flex-1 rounded-xl font-bold"
              disabled={isPending}
              onClick={() => {
                setConfirmFinish(false);
                run(() => setContestStatus("finished"), "¡Resultados publicados! 🏆");
              }}
            >
              <Trophy className="size-4" /> Publicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
