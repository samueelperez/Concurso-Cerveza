"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Refresca los datos del servidor periódicamente para que los móviles de todos
 * reaccionen cuando el admin bloquea la votación o publica los resultados.
 */
export function AutoRefresh({ intervalMs = 7000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, intervalMs]);

  return null;
}
