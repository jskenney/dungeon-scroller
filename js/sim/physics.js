// Movement and collision of a box against a level's tiles.
//
// A body is an upright box described by the point between its feet:
//   { x, y, vx, vy, w, h, grounded, groundKind, dropTimer }
// The box spans x - w/2 … x + w/2 horizontally and y - h … y vertically.
//
// Handles solid rectangles (blocks, walls, ceilings, stair steps), one-way
// platforms and 45° slopes. Low ledges such as stair steps are walked up and
// down without jumping.

import { slopeSurface } from '../level/level.js';

const EPS = 0.01;
export const STEP_HEIGHT = 16;      // ledges up to this tall are stepped onto when walking

/** Is the box at (x, y) clear of solid tiles? Platforms and slopes do not count. */
export function isFree(level, x, y, w, h) {
  const half = w / 2;
  return !level.rectsIn(x - half + EPS, y - h + EPS, x + half - EPS, y - EPS).some(r => r.kind === 'solid');
}

/**
 * The surface a body would stand on if its feet travelled from feetPrev down to feetNew.
 * @returns {{y: number, kind: 'solid'|'platform'|'slope'} | null}
 */
function findGround(level, body, feetPrev, feetNew, maxStep) {
  const half = body.w / 2;
  let best = null;
  for (const r of level.rectsIn(body.x - half + EPS, feetPrev - EPS, body.x + half - EPS, feetNew + EPS)) {
    if (r.t < feetPrev - EPS || r.t > feetNew + EPS) continue;        // must be at or below where the feet were
    if (r.kind === 'platform' && body.dropTimer > 0) continue;
    if (!best || r.t < best.y) best = { y: r.t, kind: r.kind };
  }
  for (const s of level.slopesIn(body.x, feetPrev - maxStep - 1, body.x, feetNew + 1)) {
    if (body.x < s.l || body.x > s.r) continue;
    const y = slopeSurface(s, body.x);
    if (y < feetPrev - maxStep - EPS || y > feetNew + EPS) continue;  // climbing is limited to maxStep per tick
    if (!best || y < best.y) best = { y, kind: 'slope' };
  }
  return best;
}

/**
 * Advance a body by dt seconds using its velocity.
 * @returns {{hitWall: boolean, hitCeiling: boolean, landed: boolean, stepDy: number}}
 *          stepDy is how far the feet were moved vertically by stepping or snapping
 *          (not by velocity); renderers use it to smooth stairs.
 */
export function moveBody(level, body, dt) {
  const half = body.w / 2;
  const wasGrounded = body.grounded;
  // On a slope the leading edge meets the upper landing a little below its top.
  const maxStep = body.groundKind === 'slope' ? Math.max(STEP_HEIGHT, half + 2) : STEP_HEIGHT;
  const result = { hitWall: false, hitCeiling: false, landed: false, stepDy: 0 };
  const dx = body.vx * dt, dy = body.vy * dt;
  if (body.dropTimer > 0) body.dropTimer -= dt;

  // ---- horizontal
  if (dx !== 0) {
    let nx = body.x + dx;
    for (let pass = 0; pass < 3; pass++) {
      const blocks = level.rectsIn(nx - half + EPS, body.y - body.h + EPS, nx + half - EPS, body.y - EPS).filter(r => r.kind === 'solid');
      if (!blocks.length) break;
      const top = Math.min(...blocks.map(r => r.t));
      const ledge = body.y - top;
      if (wasGrounded && ledge > 0 && ledge <= maxStep + EPS && isFree(level, nx, top, body.w, body.h)) {
        result.stepDy += top - body.y;
        body.y = top;                                   // step up onto the ledge
        continue;
      }
      for (const r of blocks) nx = dx > 0 ? Math.min(nx, r.l - half) : Math.max(nx, r.r + half);
      body.vx = 0;
      result.hitWall = true;
    }
    body.x = nx;
  }

  // ---- vertical
  const feetPrev = body.y;
  if (dy < 0) {
    let ny = body.y + dy;
    const headPrev = feetPrev - body.h;
    const above = [
      ...level.rectsIn(body.x - half + EPS, ny - body.h, body.x + half - EPS, headPrev).filter(r => r.kind === 'solid'),
      ...level.slopesIn(body.x - half + EPS, ny - body.h, body.x + half - EPS, headPrev),   // a slope's underside is a ceiling
    ];
    for (const r of above) {
      if (r.b <= headPrev + EPS && r.b > ny - body.h) { ny = r.b + body.h; body.vy = 0; result.hitCeiling = true; }
    }
    body.y = ny;
    body.grounded = false;
  } else {
    const ny = body.y + dy;
    const ground = findGround(level, body, feetPrev, ny, maxStep);
    if (ground) {
      body.y = ground.y;
      body.vy = 0;
      result.landed = !wasGrounded;
      body.grounded = true;
      body.groundKind = ground.kind;
    } else {
      body.y = ny;
      body.grounded = false;
    }
  }

  // ---- keep the feet on the ground when walking down steps and slopes
  if (!body.grounded && wasGrounded && body.vy >= 0) {
    const reach = maxStep + Math.abs(dx);
    const ground = findGround(level, body, body.y, body.y + reach, maxStep);
    if (ground) {
      result.stepDy += ground.y - body.y;
      body.y = ground.y;
      body.vy = 0;
      body.grounded = true;
      body.groundKind = ground.kind;
    }
  }
  if (!body.grounded) body.groundKind = null;
  return result;
}
