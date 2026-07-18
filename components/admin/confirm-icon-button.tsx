"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";

/**
 * Botón de borrado en dos toques, pensado para móvil: el primer toque pide
 * confirmación durante 3 segundos, el segundo ejecuta.
 */
export function ConfirmIconButton({
  onConfirm,
  label,
}: {
  onConfirm: () => void;
  label: string;
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const handleClick = () => {
    if (armed) {
      setArmed(false);
      onConfirm();
      return;
    }
    setArmed(true);
    timer.current = setTimeout(() => setArmed(false), 3000);
  };

  return (
    <button
      onClick={handleClick}
      aria-label={armed ? `Confirmar: ${label}` : label}
      className={`flex h-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold transition-all ${
        armed
          ? "w-20 bg-destructive px-2 text-white"
          : "w-9 text-muted-foreground active:bg-destructive/15 active:text-destructive"
      }`}
    >
      {armed ? "¿Seguro?" : <Trash2 className="size-4" />}
    </button>
  );
}
