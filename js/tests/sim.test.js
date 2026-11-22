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
  ['stairs look like an even ramp, with no pauses or dips', () => {
    for (const run of [false, true]) {
      for (const map of [['........', 'S../####', '########'], ['........', '####\\...', '########']]) {
        const world = new World(mapLevel(map), fakeHero(), CONFIG);
        if (map[1][0] === '#') world.hero.placeAt(300, TILE);
        runWorld(world, {}, 30);
        const seen = [];
        runWorld(world, { dir: 1, run }, 140, w => seen.push(w.hero.body.y + w.hero.visualLift));
        const steps = seen.slice(1).map((y, i) => y - seen[i]);
        const first = steps.findIndex(v => Math.abs(v) > 0.01), last = steps.length - [...steps].reverse().findIndex(v => Math.abs(v) > 0.01);
        const during = steps.slice(first, last);
        assert(!during.some((v, i) => i && v * during[i - 1] < 0), 'the picture moved up and down on the stairs');
        assert(during.filter(v => Math.abs(v) < 0.01).length <= 1, `the picture paused ${during.filter(v => Math.abs(v) < 0.01).length} times on the stairs`);
        assert(Math.max(...during.map(Math.abs)) < 8, 'the picture jumped more than 8 px in one tick');
      }
    }
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

// ------------------------------------------------------------ level generator

import { generateLevel, ENEMY_COST } from '../level/generate.js';
import { checkReachable } from '../level/reach.js';
import { makeRng } from '../level/random.js';

/** A stand-in tileset with everything the builder looks for. */
const GEN_TILESET = {
  tiles: {
    top_l: { shape: 'solid' }, top_c: { shape: 'solid' }, top_r: { shape: 'solid' }, top_s: { shape: 'solid' }, fill: { shape: 'solid' },
    deck_l: { shape: 'platform' }, deck_c: { shape: 'platform' }, deck_r: { shape: 'platform' }, deck_s: { shape: 'platform' },
    stairs_r: { shape: 'stairs_right' }, stairs_l: { shape: 'stairs_left' },
    ceiling_center: { shape: 'rect', rect: [0, 0, 96, 32] }, back: { shape: 'none' },
  },
  groups: { background: ['back'] },
  runs: {
    floor: { left: 'top_l', center: 'top_c', right: 'top_r', single: 'top_s', below: 'fill' },
    platform: { left: 'deck_l', center: 'deck_c', right: 'deck_r', single: 'deck_s' },
  },
};
const generate = (seed, extra = {}) => generateLevel({ seed, tileset: GEN_TILESET, tilesetId: 'test', length: 100, difficulty: 3,
  enemies: ['normal_skeleton', 'undead_wolf', 'lich'], bosses: ['undead_dragon'], ...extra });

tests.push(
  ['the random source repeats for the same seed and differs for another', () => {
    const a = makeRng('abc'), b = makeRng('abc'), c = makeRng('abd');
    const seqA = [1, 2, 3, 4, 5].map(() => a.next()), seqB = [1, 2, 3, 4, 5].map(() => b.next()), seqC = [1, 2, 3, 4, 5].map(() => c.next());
    assert(seqA.join() === seqB.join(), 'the same seed gave different numbers');
    assert(seqA.join() !== seqC.join(), 'different seeds gave the same numbers');
    assert(seqA.every(v => v >= 0 && v < 1), 'a value fell outside 0–1');
  }],
  ['the same seed always builds the same level', () => {
    assert(JSON.stringify(generate('repeat').doc) === JSON.stringify(generate('repeat').doc), 'two runs with one seed differed');
    assert(JSON.stringify(generate('repeat').doc.layers) !== JSON.stringify(generate('other').doc.layers), 'two seeds gave the same level');
  }],
  ['300 generated levels are valid and completable on foot', () => {
    let retried = 0;
    for (let i = 0; i < 300; i++) {
      const { doc, map, goal, attempts } = generate(`seed-${i}`, { difficulty: 1 + (i % 5), length: 60 + (i % 4) * 50 });
      retried += attempts > 1 ? 1 : 0;
      const problems = Level.validate(doc, GEN_TILESET);
      assert(!problems.length, `seed-${i}: ${problems.join('; ')}`);
      assert(checkReachable(map, doc.spawn, goal).ok, `seed-${i}: the goal cannot be reached`);
      assert(doc.size.cols >= 60, `seed-${i}: only ${doc.size.cols} columns`);
    }
    assert(retried === 0, `${retried} of 300 seeds needed a second layout`);
  }],
  ['everything placed in a generated level stands on something', () => {
    for (let i = 0; i < 60; i++) {
      const { doc, map } = generate(`place-${i}`, { difficulty: 1 + (i % 5) });
      for (const e of doc.entities) {
        const below = map[e.row + 1]?.[e.col], here = map[e.row]?.[e.col];
        const floating = ['gold_coin', 'gem', 'healing_potion', 'space_potion', 'spell_scroll', 'dungeon_relic'].includes(e.id);
        assert(here === '.' || here === 'S', `place-${i}: ${e.id} is inside a "${here}" cell at ${e.col},${e.row}`);
        if (!floating) assert('#=/\\'.includes(below), `place-${i}: ${e.id} at ${e.col},${e.row} has nothing under it`);
      }
      assert(doc.entities.some(e => e.type === 'boss') && doc.entities.some(e => e.id === 'dungeon_relic'), `place-${i}: no boss or relic`);
      assert(doc.entities.some(e => e.id === 'checkpoint_flag'), `place-${i}: no checkpoint`);
    }
  }],
  ['harder levels hold more dangerous enemies', () => {
    const threat = d => {
      let total = 0;
      for (let i = 0; i < 40; i++) for (const e of generate(`d-${i}`, { difficulty: d }).doc.entities) total += e.type === 'enemy' ? ENEMY_COST[e.id] : 0;
      return total;
    };
    const easy = threat(1), mid = threat(3), hard = threat(5);
    assert(mid > easy * 1.3 && hard > mid * 1.2, `threat was ${easy}, ${mid}, ${hard} at difficulty 1, 3, 5`);
  }],
  ['the completion check rejects walls, wide pits and tall ledges', () => {
    const from = { col: 0, row: 2 }, to = { col: 7, row: 2 };
    assert(checkReachable(['........', '........', '........', '########'], from, to).ok, 'a flat floor was rejected');
    assert(checkReachable(['........', '........', '........', '###.####'], from, to).ok, 'a one-tile pit was rejected');
    assert(!checkReachable(['........', '........', '........', '###..###'], from, to).ok, 'a two-tile pit was accepted');
    assert(!checkReachable(['....#...', '....#...', '....#...', '########'], from, to).ok, 'a wall was accepted');
    assert(checkReachable(['........', '........', '....####', '########'], from, { col: 7, row: 1 }).ok, 'a one-tile ledge was rejected');
    assert(!checkReachable(['........', '....####', '....####', '########'], from, { col: 7, row: 0 }).ok, 'a two-tile ledge was accepted');
    assert(checkReachable(['........', '........', '....####', '...=####', '########'], { col: 0, row: 3 }, { col: 7, row: 1 }).ok, 'a platform step was rejected');
    assert(!checkReachable(['........', '..^^....', '........', '###.####'], from, to).ok, 'a pit under a low roof was accepted');
  }],
);
