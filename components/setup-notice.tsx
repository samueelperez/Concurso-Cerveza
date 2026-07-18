import { Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function SetupNotice() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 py-16">
      <Card className="glass w-full">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Database className="size-7" />
          </span>
          <h1 className="font-heading text-2xl font-bold">Falta la base de datos</h1>
          <p className="text-sm text-muted-foreground">
            Crea una base de datos gratuita en{" "}
            <span className="font-medium text-foreground">neon.tech</span> y añade su
            cadena de conexión como <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">DATABASE_URL</code>{" "}
            en <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">.env.local</code>{" "}
            (o en las variables de entorno de Vercel). Las tablas se crean solas al
            arrancar.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
