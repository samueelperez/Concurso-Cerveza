"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/** Burbujas de cerveza subiendo de fondo, muy sutiles. */
export function Bubbles({ count = 16 }: { count?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = ref.current;
      if (!container) return;
      const bubbles: HTMLSpanElement[] = [];

      for (let i = 0; i < count; i++) {
        const bubble = document.createElement("span");
        const size = gsap.utils.random(5, 20);
        bubble.style.cssText = [
          "position:absolute",
          `bottom:${gsap.utils.random(-120, -40)}px`,
          `left:${gsap.utils.random(2, 98)}%`,
          `width:${size}px`,
          `height:${size}px`,
          "border-radius:9999px",
          `opacity:${gsap.utils.random(0.12, 0.4)}`,
          "background:radial-gradient(circle at 35% 30%, oklch(0.95 0.06 90 / 55%), oklch(0.8 0.15 75 / 14%) 60%, transparent)",
        ].join(";");
        container.appendChild(bubble);
        bubbles.push(bubble);

        gsap.to(bubble, {
          y: () => -(window.innerHeight + 200),
          x: () => gsap.utils.random(-70, 70),
          duration: gsap.utils.random(10, 22),
          delay: gsap.utils.random(0, 14),
          ease: "none",
          repeat: -1,
          repeatDelay: gsap.utils.random(0, 5),
        });
      }

      return () => bubbles.forEach((b) => b.remove());
    },
    { scope: ref }
  );

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-[1] overflow-hidden"
    />
  );
}
