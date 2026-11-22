// Seeded random numbers: the same seed always gives the same sequence, on
// every browser, so a level can be recreated from its seed alone.

/** Hash a string to a 32-bit number (xmur3). */
function hashSeed(text) {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

/** A random source for one seed (mulberry32). */
export function makeRng(seed) {
  let state = hashSeed(String(seed));
  const next = () => {
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng = {
    next,
    /** Whole number from min to max, inclusive. */
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: probability => next() < probability,
    pick: list => list[Math.floor(next() * list.length)],
    /** Pick from [[weight, value], …]; weights of 0 or less are skipped. */
    weighted: pairs => {
      const usable = pairs.filter(p => p[0] > 0);
      let roll = next() * usable.reduce((sum, p) => sum + p[0], 0);
      for (const [weight, value] of usable) { roll -= weight; if (roll < 0) return value; }
      return usable[usable.length - 1][1];
    },
  };
  return rng;
}

/** A short seed to show and share, e.g. "k3f9qz". */
export function randomSeed() {
  const letters = 'abcdefghjkmnpqrstuvwxyz23456789';     // no look-alike characters
  const values = new Uint32Array(6);
  if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(values);
  else values.forEach((_, i) => { values[i] = Math.floor(Math.random() * 2 ** 32); });
  return [...values].map(v => letters[v % letters.length]).join('');
}
