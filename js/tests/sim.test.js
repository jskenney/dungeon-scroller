// Tests for the simulation. They run in the browser (tests.html) and need no
// assets: levels are built from small character maps with a stand-in tileset.

import { Level, TILE } from '../level/level.js';
import { moveBody, isFree } from '../sim/physics.js';
import { World, NO_INTENTS } from '../sim/world.js';

const TILESET = { tiles: {
  block: { shape: 'solid' }, deck: { shape: 'platform' },
  stairsR: { shape: 'stairs_right' }, stairsL: { shape: 'stairs_left' },
  slopeR: { shape: 'slope_right' }, slopeL: { shape: 'slope_left' },
  ceiling: { shape: 'rect', rect: [0, 0, 96, 32] }, low: { shape: 'rect', rect: [0, 0, 96, 56] },
} };
const CHARS = { '.': 0, '#': 1, '=': 2, '/': 3, '\\': 4, '>': 5, '<': 6, '^': 7, 'L': 8, 'S': 0 };
const PALETTE = ['', 'block', 'deck', 'stairsR', 'stairsL', 'slopeR', 'slopeL', 'ceiling', 'low'];

/** Build a level from rows of characters: # block, = platform, / \ stairs, > < slopes, ^ ceiling, L low ceiling, S start. */
export function mapLevel(map) {
  let spawn = { col: 0, row: 0 };
  const terrain = map.map((line, row) => [...line].map((ch, col) => {
    if (ch === 'S') spawn = { col, row };
    return CHARS[ch];
  }));
  return new Level({ id: 'test', size: { cols: map[0].length, rows: map.length }, palette: PALETTE, layers: { terrain }, spawn }, TILESET);
}

const body = (x, y, extra = {}) => ({ x, y, vx: 0, vy: 0, w: 20, h: 50, grounded: false, groundKind: null, dropTimer: 0, ...extra });
const DT = 1 / 60;

/** Step a body with gravity and a constant walking speed; returns per-tick records. */
function walk(level, b, vx, ticks) {
  const log = [];
  for (let i = 0; i < ticks; i++) {
    b.vx = vx;
    b.vy = Math.min(1400, b.vy + 2400 * DT);
    const r = moveBody(level, b, DT);
    log.push({ x: b.x, y: b.y, grounded: b.grounded, ...r });
  }
  return log;
}

function assert(condition, message) { if (!condition) throw new Error(message); }
const near = (a, b, tolerance = 0.5) => Math.abs(a - b) <= tolerance;

/** A stand-in hero: every animation is six 100 ms frames. */
function fakeHero(overrides = {}) {
  const slots = ['idle', 'run', 'jump', 'attack1', 'attack2', 'attack3', 'hit', 'death', 'teleport_out', 'teleport_in', 'crouch', 'crawl', 'fly_up', 'fly'];
  const animations = Object.fromEntries(slots.map(slot => [slot, { slot, loop: ['idle', 'run', 'crawl', 'fly'].includes(slot), durations: [100, 100, 100, 100, 100, 100] }]));
  return { id: 'tester', animations, gameplay: {
    stats: { hp: 100, mp: 100, mpRegen: 4 },
    movement: { walkSpeed: 160, runSpeed: 280, jumpHeight: 144, crawlSpeed: 70, airControl: 0.7 },
    teleport: { mp: 20, distance: 288 }, flight: { mode: 'mp', mpPerSecond: 10, speed: 240 },
    body: { x: -10, y: -50, w: 20, h: 50 }, crouchBody: { x: -10, y: -30, w: 20, h: 30 },
    abilities: { attack1: { type: 'melee', mp: 0, air: false }, attack2: { type: 'projectile', mp: 10, air: true }, attack3: { type: 'melee', mp: 0, air: false } },
    ...overrides } };
}
const CONFIG = { physics: { tickRate: 60, gravity: 2400, maxFallSpeed: 1400, runSpeedMultiplier: 1.75 }, rules: { lives: 3 } };

function runWorld(world, intents, ticks, each = () => {}) {
  for (let i = 0; i < ticks; i++) { world.stepOnce({ ...NO_INTENTS, ...(typeof intents === 'function' ? intents(i) : intents) }); each(world, i); }
}

export const tests = [
  ['a falling body lands on the floor', () => {
    const level = mapLevel(['....', '....', '####']);
    const b = body(150, 50);
    walk(level, b, 0, 60);
    assert(b.grounded && near(b.y, 2 * TILE), `expected to rest at y=192, got ${b.y}`);
  }],
  ['a fast fall does not pass through a thin platform', () => {
    const level = mapLevel(['....', '....', '.==.', '....', '....']);
    const b = body(150, 100, { vy: 1400 });
    walk(level, b, 0, 30);
    assert(b.grounded && near(b.y, 2 * TILE), `expected to land on the platform at 192, got ${b.y}`);
  }],
  ['walking into a wall stops at the wall', () => {
    const level = mapLevel(['...#', '...#', '####']);
    const b = body(100, 2 * TILE, { grounded: true });
    const log = walk(level, b, 200, 120);
    assert(near(b.x, 3 * TILE - 10), `expected x=278, got ${b.x}`);
    assert(log.some(t => t.hitWall), 'expected a wall hit to be reported');
  }],
  ['stairs are climbed by walking, without leaving the ground', () => {
    const level = mapLevel(['......', '../###', '######']);
    const b = body(100, 2 * TILE, { grounded: true });
    const log = walk(level, b, 160, 150);
    assert(near(b.y, TILE), `expected to reach the upper floor at y=96, got ${b.y}`);
    assert(b.x > 3 * TILE, `expected to have passed the stairs, x=${b.x}`);
    assert(log.every(t => t.grounded), 'left the ground while climbing');
    assert(!log.some(t => t.hitWall), 'was blocked by a step');
  }],
  ['stairs are descended without leaving the ground', () => {
    const level = mapLevel(['......', '###\\..', '######']);
    const b = body(250, TILE, { grounded: true });
    const log = walk(level, b, 160, 150);
    assert(near(b.y, 2 * TILE), `expected to reach the lower floor at y=192, got ${b.y}`);
    assert(log.every(t => t.grounded), 'left the ground while descending');
  }],
  ['running down stairs still keeps the feet on the steps', () => {
    const level = mapLevel(['......', '###\\..', '######']);
    const b = body(250, TILE, { grounded: true });
    assert(walk(level, b, 280, 100).every(t => t.grounded), 'left the ground while running down');
  }],
  ['a slope is followed up and down', () => {
    const level = mapLevel(['.......', '..>#<..', '#######']);
    const b = body(100, 2 * TILE, { grounded: true });
    const up = walk(level, b, 160, 110);
    assert(near(b.y, TILE), `expected the top at y=96, got ${b.y}`);
    assert(up.every(t => t.grounded), 'left the ground going up the slope');
    const mid = up.find(t => t.x > 2 * TILE + 40 && t.x < 2 * TILE + 60);
    assert(mid && near(mid.y, 2 * TILE - (mid.x - 2 * TILE), 1), 'feet were not on the slope surface');
    const down = walk(level, b, 160, 140);
    assert(near(b.y, 2 * TILE), `expected the bottom at y=192, got ${b.y}`);
    assert(down.every(t => t.grounded), 'left the ground going down the slope');
  }],
  ['a platform can be jumped through from below and stood on', () => {
    const level = mapLevel(['....', '.==.', '....', '####']);
    const b = body(150, 3 * TILE, { grounded: true, vy: -1000 });
    const log = [];
    for (let i = 0; i < 90; i++) { b.vy = Math.min(1400, b.vy + 2400 * DT); log.push({ ...moveBody(level, b, DT), y: b.y }); }
    assert(!log.some(t => t.hitCeiling), 'the platform blocked the jump from below');
    assert(b.grounded && near(b.y, TILE) && b.groundKind === 'platform', `expected to stand on the platform at y=96, got ${b.y}`);
  }],
  ['dropping through a platform works', () => {
    const level = mapLevel(['....', '.==.', '....', '####']);
    const b = body(150, TILE, { grounded: true, groundKind: 'platform' });
    b.dropTimer = 0.22; b.grounded = false; b.y += 1;
    walk(level, b, 0, 60);
    assert(near(b.y, 3 * TILE), `expected to land on the floor at y=288, got ${b.y}`);
  }],
  ['a ceiling stops a jump', () => {
    const level = mapLevel(['^^^^', '....', '####']);
    const b = body(150, 2 * TILE, { grounded: true, vy: -900 });
    let hit = false;
    for (let i = 0; i < 20; i++) { b.vy += 2400 * DT; hit = moveBody(level, b, DT).hitCeiling || hit; }
    assert(hit, 'expected to hit the ceiling');
    assert(b.y - b.h >= 32 - 0.5, `head went into the ceiling: top=${b.y - b.h}`);
  }],
  ['a low passage blocks a standing body and admits a crouched one', () => {
    const level = mapLevel(['....', '..L.', '####']);
    const standing = body(100, 2 * TILE, { grounded: true });
    walk(level, standing, 160, 90);
    assert(standing.x < 2 * TILE, `a 50 px body passed a 40 px gap (x=${standing.x})`);
    const crouched = body(100, 2 * TILE, { grounded: true, h: 30 });
    walk(level, crouched, 160, 150);
    assert(crouched.x > 3 * TILE, `a 30 px body was blocked by a 40 px gap (x=${crouched.x})`);
    assert(!isFree(level, 2.5 * TILE, 2 * TILE, 20, 50), 'standing room was reported under the low ceiling');
  }],
  ['the sides of a level are walls and the bottom is a pit', () => {
    const level = mapLevel(['....', '##..']);
    const b = body(60, TILE, { grounded: true });
    walk(level, b, -200, 60);
    assert(near(b.x, 10), `expected to stop at the left edge, x=${b.x}`);
    const faller = body(3.5 * TILE, 20);
    walk(level, faller, 0, 60);
    assert(faller.y > level.height, 'expected to fall out of the bottom');
  }],
  ['the hero jumps to the configured height', () => {
    const world = new World(mapLevel(['....', '....', '....', 'S...', '####']), fakeHero(), CONFIG);
    runWorld(world, {}, 30);
    const floor = world.hero.body.y;
    let top = floor;
    runWorld(world, i => ({ jumpPressed: i === 0, jumpHeld: true }), 60, w => { top = Math.min(top, w.hero.body.y); });
    assert(near(floor - top, 144, 8), `expected a jump of about 144, got ${(floor - top).toFixed(1)}`);
    assert(world.hero.body.grounded, 'expected to be back on the ground');
  }],
  ['releasing jump early makes a shorter hop', () => {
    const world = new World(mapLevel(['....', '....', '....', 'S...', '####']), fakeHero(), CONFIG);
    runWorld(world, {}, 30);
    const floor = world.hero.body.y;
    let top = floor;
    runWorld(world, i => ({ jumpPressed: i === 0, jumpHeld: i < 4 }), 60, w => { top = Math.min(top, w.hero.body.y); });
    assert(floor - top < 100, `expected a short hop, got ${(floor - top).toFixed(1)}`);
  }],
  ['a jump still works just after walking off a ledge', () => {
    const world = new World(mapLevel(['......', '......', 'S.....', '##....', '######']), fakeHero(), CONFIG);
    runWorld(world, {}, 20);
    let left = -1;
    runWorld(world, { dir: 1 }, 120, (w, i) => { if (left < 0 && !w.hero.body.grounded) left = i; });
    assert(left >= 0, 'never left the ledge');
    const again = new World(mapLevel(['......', '......', 'S.....', '##....', '######']), fakeHero(), CONFIG);
    runWorld(again, {}, 20);
    runWorld(again, { dir: 1 }, left + 3);                     // two ticks past the edge
    runWorld(again, { dir: 1, jumpPressed: true, jumpHeld: true }, 1);
    assert(again.hero.body.vy < -500, 'the late jump was refused');
  }],
  ['crouching under a low ceiling keeps the hero crouched', () => {
    const world = new World(mapLevel(['.....', 'S.LL.', '#####']), fakeHero(), CONFIG);
    runWorld(world, {}, 20);
    runWorld(world, { down: true, dir: 1 }, 260);
    const hero = world.hero;
    assert(hero.body.x > 2 * TILE && hero.body.x < 4 * TILE, `expected to be under the ceiling, x=${hero.body.x}`);
    runWorld(world, {}, 10);
    assert(hero.crouching, 'stood up inside the low passage');
    runWorld(world, { down: true, dir: 1 }, 400);
    runWorld(world, {}, 10);
    assert(!hero.crouching && hero.body.x > 4 * TILE, 'did not stand up after leaving the passage');
  }],
  ['abilities respect MP and the ground rule', () => {
    const world = new World(mapLevel(['....', '....', '....', 'S...', '####']), fakeHero(), CONFIG);
    runWorld(world, {}, 30);
    const hero = world.hero;
    runWorld(world, i => ({ jumpPressed: i === 0, jumpHeld: true, attack1: i === 5 }), 8);
    assert(!hero.action, 'a ground-only attack started in the air');
    runWorld(world, { attack2: true }, 1);
    assert(hero.action?.slot === 'attack2' && near(hero.mp, 90, 1), 'the ranged attack did not start in the air or MP was not spent');
  }],
  ['teleport moves forward and stops at walls', () => {
    const world = new World(mapLevel(['......#', 'S.....#', '#######']), fakeHero(), CONFIG);
    runWorld(world, {}, 20);
    const start = world.hero.body.x;
    runWorld(world, i => ({ teleport: i === 0 }), 90);
    assert(near(world.hero.body.x - start, 288, 1), `expected to move 288, moved ${world.hero.body.x - start}`);
    runWorld(world, i => ({ teleport: i === 0 }), 90);
    assert(world.hero.body.x <= 6 * TILE - 10 + 0.5, `teleported into the wall: x=${world.hero.body.x}`);
  }],
  ['flight drains MP and ends when it runs out', () => {
    const world = new World(mapLevel(['....', '....', '....', 'S...', '####']), fakeHero({ stats: { hp: 100, mp: 5, mpRegen: 0 } }), CONFIG);
    runWorld(world, {}, 30);
    runWorld(world, i => ({ fly: i === 0, vertical: -1 }), 20);
    assert(world.hero.flying && world.hero.body.y < 4 * TILE - 20, 'did not take off');
    runWorld(world, { vertical: -1 }, 60);
    assert(!world.hero.flying, 'kept flying with no MP');
  }],
  ['falling into a pit costs a life and returns to the start', () => {
    const world = new World(mapLevel(['....', 'S...', '#...']), fakeHero(), CONFIG);
    runWorld(world, {}, 20);
    const start = { ...world.hero.body };
    for (let i = 0; i < 400 && world.hero.lives === 3; i++) runWorld(world, { dir: 1 }, 1);
    assert(world.hero.lives === 2, `expected 2 lives, got ${world.hero.lives}`);
    assert(Math.abs(world.hero.body.x - start.x) < 60, 'did not return to the start');
  }],
];

/** Run every test; returns [{name, ok, error}]. */
export function runAll() {
  return tests.map(([name, fn]) => {
    try { fn(); return { name, ok: true }; } catch (error) { return { name, ok: false, error: error.message }; }
  });
}
