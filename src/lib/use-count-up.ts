"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 600;
const SEEN_KEY = "kilora.dashboard.counted";

/**
 * Anima de 0 até ao valor só da primeira vez que o painel aparece neste dispositivo.
 * Com "reduzir movimento" ligado, mostra logo o valor final.
 */
export function useCountUp(target: number): number {
  const [animate] = useState(shouldAnimate);
  const [value, setValue] = useState(animate ? 0 : target);
  const finished = useRef(!animate);

  useEffect(() => {
    if (finished.current) {
      setValue(target);
      return;
    }
    markSeen();
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / DURATION_MS, 1);
      setValue(target * (1 - (1 - progress) ** 3));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else finished.current = true;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return value;
}

function shouldAnimate(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    return window.localStorage.getItem(SEEN_KEY) === null;
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Sem localStorage, a animação repete-se; não faz mal.
  }
}
