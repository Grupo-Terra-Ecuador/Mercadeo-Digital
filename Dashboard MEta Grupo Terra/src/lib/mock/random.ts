/**
 * Generador pseudoaleatorio determinista (mulberry32). Con la misma semilla
 * produce siempre la misma secuencia, en el servidor y en el navegador, para
 * que Next.js no marque errores de hidratación por datos distintos.
 */
export function createRng(seed: number) {
  let state = seed >>> 0;
  return function next(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rangeInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function rangeFloat(rng: () => number, min: number, max: number): number {
  return rng() * (max - min) + min;
}

export function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

/**
 * Fisher-Yates determinista. A diferencia de `array.sort(() => rng() - 0.5)`,
 * consume siempre exactamente `items.length - 1` llamadas a rng() —
 * `sort()` con un comparador aleatorio invoca al comparador un número de
 * veces que depende del motor JS (Node/V8 del servidor vs. Chromium del
 * navegador pueden diferir), lo que desincroniza el generador y produce
 * errores de hidratación en Next.js.
 */
export function shuffle<T>(rng: () => number, items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
