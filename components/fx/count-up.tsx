"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export function formatScore(value: number, decimals = 1): string {
  return value.toFixed(decimals).replace(".", ",");
}

/** Número que cuenta de 0 al valor final con GSAP (formato español, coma decimal). */
export function CountUp({
  value,
  decimals = 1,
  duration = 1.4,
  delay = 0,
  className,
}: {
  value: number;
  decimals?: number;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const counter = { v: 0 };
      gsap.to(counter, {
        v: value,
        duration,
        delay,
        ease: "power2.out",
        onUpdate: () => {
          if (ref.current) ref.current.textContent = formatScore(counter.v, decimals);
        },
      });
    },
    { dependencies: [value] }
  );

  return (
    <span ref={ref} className={className}>
      {formatScore(0, decimals)}
    </span>
  );
}
