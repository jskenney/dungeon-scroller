// Animation playback maths. Pure functions: no rendering, no DOM, so the
// simulation can use the same code.

/** Total length of one pass through a clip, in milliseconds. */
export function clipLength(clip) {
  return clip.durations.reduce((sum, ms) => sum + ms, 0);
}

/**
 * Which frame is showing after `elapsedMs`.
 * @returns {{frame: number, finished: boolean}} frame is 0-based.
 */
export function sampleClip(clip, elapsedMs, forceLoop = false) {
  const total = clipLength(clip);
  const last = clip.durations.length - 1;
  const loops = clip.loop || forceLoop;
  let t = Math.max(0, elapsedMs);
  if (!loops && t >= total) return { frame: last, finished: true };
  if (loops) t %= total;
  for (let i = 0; i <= last; i++) {
    if (t < clip.durations[i]) return { frame: i, finished: false };
    t -= clip.durations[i];
  }
  return { frame: last, finished: false };
}

/** Events (1-based `frame`, optional `until`) that are active on a 0-based frame. */
export function eventsOnFrame(clip, frame) {
  const n = frame + 1;
  return (clip.events ?? []).filter(e => n >= e.frame && n <= (e.until ?? e.frame));
}

/**
 * Walk and run both come from whichever cycles the sheet provides.
 * Both present: each uses its own. Only one present: it is the walk, and the
 * run plays the same cycle faster.
 * @returns {{walk: {slot: string, rate: number}, run: {slot: string, rate: number}} | null}
 */
export function locomotion(animations, runMultiplier = 1.75) {
  const hasWalk = 'walk' in animations;
  const hasRun = 'run' in animations;
  if (hasWalk && hasRun) return { walk: { slot: 'walk', rate: 1 }, run: { slot: 'run', rate: 1 } };
  const only = hasWalk ? 'walk' : hasRun ? 'run' : null;
  if (!only) return null;
  return { walk: { slot: only, rate: 1 }, run: { slot: only, rate: runMultiplier } };
}

/** Animation slots every sheet of a kind is expected to provide. */
export const REQUIRED_SLOTS = {
  player: ['idle', 'jump', 'attack1', 'attack2', 'attack3', 'hit', 'death',
    'teleport_out', 'teleport_in', 'crouch', 'crawl', 'fly_up', 'fly'],
  enemy: ['idle', 'hit', 'death', 'attack1', 'attack2', 'attack3'],
  boss: ['idle', 'fly', 'hit', 'death', 'attack1', 'attack2', 'attack3', 'attack4'],
  object: ['idle', 'interact', 'vanish'],
  npc: ['idle', 'death', 'hit', 'heal', 'buy', 'sell', 'wave', 'talk', 'hide', 'teleport_out', 'teleport_in'],
};
