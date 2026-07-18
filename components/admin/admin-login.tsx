"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loginAdmin } from "@/lib/actions";

export function AdminLogin() {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const result = await loginAdmin(password);
      if (result.ok) {
        toast.success("Bienvenido, jefe 🍺");
        router.refresh();
      } else {
        toast.error(result.error);
        setPassword("");
        if (cardRef.current) {
          gsap.fromTo(
            cardRef.current,
            { x: -10 },
            { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" }
          );
        }
      }
    });
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 py-16 pt-safe pb-safe">
      <Card ref={cardRef} className="glass w-full">
        <CardContent className="flex flex-col items-center gap-5 py-10">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <KeyRound className="size-7" />
          </span>
          <div className="text-center">
            <h1 className="font-heading text-2xl font-extrabold text-gold">Zona del jurado</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Solo el organizador puede pasar de aquí.
            </p>
          </div>
          <form
            className="flex w-full flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <Input
              type="password"
              inputMode="text"
              autoFocus
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl text-center text-base"
            />
            <Button
              type="submit"
              size="lg"
              disabled={isPending || password.length === 0}
              className="h-12 rounded-xl text-base font-bold"
            >
              {isPending ? <Loader2 className="size-5 animate-spin" /> : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
