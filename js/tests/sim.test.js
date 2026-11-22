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
        if (e.type === 'gate') {
          assert(map[e.row][e.col] === '.' && map[e.row + 1][e.col] === '.' && map[e.row - 1][e.col] === '#' && map[e.row + 2][e.col] === '#',
            `place-${i}: the gate at ${e.col},${e.row} is not in a doorway`);
          assert(doc.entities.some(o => o.link === e.id || (e.locked && o.id === 'iron_key' && o.col < e.col)), `place-${i}: nothing opens ${e.id}`);
          continue;
        }
        const below = map[e.row + 1]?.[e.col], here = map[e.row]?.[e.col];
        const floating = ['gold_coin', 'gem', 'healing_potion', 'space_potion', 'spell_scroll', 'dungeon_relic', 'iron_key'].includes(e.id);
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

// ------------------------------------------------------------------- combat

/** Six 100 ms frames, with optional events. */
const clip = (slot, loop, events) => ({ slot, loop, durations: [100, 100, 100, 100, 100, 100], events });

/** A stand-in hero whose three attacks are a melee swing, a bolt and a hex. */
function fighter(overrides = {}) {
  const hero = fakeHero({
    abilities: {
      attack1: { type: 'melee', mp: 0, damage: 10, air: false, box: { x: 10, y: -40, w: 40, h: 30 } },
      attack2: { type: 'projectile', mp: 10, damage: 15, air: true, mobile: true, crouch: true, projectile: { speed: 500, range: 400 } },
      attack3: { type: 'target', mp: 10, damage: 0, air: true, range: 500, effect: { damageTaken: 2, duration: 5 } },
    },
    ...overrides });
  hero.animations.attack1 = clip('attack1', false, [{ frame: 3, until: 4, type: 'melee' }]);
  hero.animations.attack2 = clip('attack2', false, [{ frame: 3, type: 'spawn' }]);
  hero.animations.attack3 = clip('attack3', false, [{ frame: 2, type: 'cast' }]);
  return hero;
}

/** A stand-in enemy: 30 HP, one melee attack that lands on frame 3. */
function fakeEnemy(ai = {}, extra = {}) {
  const animations = Object.fromEntries(['idle', 'walk', 'hit', 'death', 'attack1', 'attack2', 'attack3'].map(s => [s, clip(s, s === 'idle' || s === 'walk')]));
  animations.attack1 = clip('attack1', false, [{ frame: 3, type: 'melee' }]);
  animations.attack2 = clip('attack2', false, [{ frame: 3, type: 'spawn' }]);
  return { id: 'dummy', kind: 'enemy', animations, gameplay: {
    stats: { hp: 30, speed: 100, touchDamage: 4, score: 10 },
    ai: { archetype: 'walker', sight: 400, leavesPlatform: false, dropsOffLedges: false, ...ai },
    body: { x: -10, y: -50, w: 20, h: 50 },
    attacks: { attack1: { type: 'melee', damage: 8, cooldown: 1, weight: 1, box: { x: 8, y: -40, w: 30, h: 30 } } },
    ...extra } };
}

/** A world with enemies placed by column, standing on the row-3 floor of a flat room. */
function arena(enemyCols, { hero = fighter(), enemy = fakeEnemy(), map, config = CONFIG } = {}) {
  const rows = map ?? ['............', '............', 'S...........', '############'];
  const level = mapLevel(rows);
  level.doc.entities = enemyCols.map(col => ({ type: 'enemy', id: 'dummy', col, row: 2 }));
  const world = new World(level, hero, config, { 'enemy/dummy': enemy });
  runWorld(world, {}, 5);
  return world;
}
const QUIET = { ...CONFIG, rules: { lives: 3, touchDamage: false } };
/** An enemy that stands still and ignores the hero. */
const dummy = () => fakeEnemy({ archetype: 'guard', sight: 0, leash: 100 });
/** Put the hero just left of an enemy, within melee reach. */
const faceUp = (world, enemy) => { world.hero.body.x = enemy.body.x - 40; world.hero.facing = 1; };

tests.push(
  ['a melee swing hurts an enemy in reach once, and not one out of reach', () => {
    const world = arena([1, 5], { enemy: dummy(), config: QUIET });
    const [near, far] = world.enemies;
    faceUp(world, near);
    runWorld(world, i => ({ attack1: i === 0 }), 50);
    assert(near.hp === 20, `expected the near enemy at 20 HP, got ${near.hp}`);
    assert(far.hp === 30, 'the far enemy was hit');
  }],
  ['a projectile flies, hits the first enemy and spends MP', () => {
    const world = arena([3, 5], { enemy: dummy(), config: QUIET });
    const [first, second] = world.enemies;
    runWorld(world, i => ({ attack2: i === 0 }), 80);
    assert(first.hp === 15 && second.hp === 30, `expected 15 and 30 HP, got ${first.hp} and ${second.hp}`);
    assert(near(world.hero.mp, 90, 6), `expected about 90 MP, got ${world.hero.mp}`);
    assert(world.projectiles.length === 0, 'the projectile was not removed');
  }],
  ['a projectile stops at a wall and at the end of its range', () => {
    const walled = arena([5], { enemy: dummy(), config: QUIET, map: ['............', '....#.......', 'S...#.......', '############'] });
    runWorld(walled, i => ({ attack2: i === 0 }), 80);
    assert(walled.enemies[0].hp === 30, 'the projectile passed through a wall');
    const open = arena([10], { enemy: dummy(), config: QUIET });
    runWorld(open, i => ({ attack2: i === 0 }), 120);
    assert(open.enemies[0].hp === 30 && open.projectiles.length === 0, 'the projectile flew past its range');
  }],
  ['a ranged ability can be used on the move; a melee swing plants the feet', () => {
    const casting = arena([], { config: QUIET });
    runWorld(casting, { dir: 1 }, 30);
    const before = casting.hero.body.x;
    runWorld(casting, i => ({ dir: 1, attack2: i === 0 }), 30);
    assert(casting.hero.action?.slot === 'attack2', 'the ranged ability did not start while walking');
    assert(casting.hero.body.x - before > 60, `the hero stopped to cast (moved ${(casting.hero.body.x - before).toFixed(0)} px)`);
    const swinging = arena([], { config: QUIET });
    runWorld(swinging, { dir: 1 }, 30);
    const start = swinging.hero.body.x;
    runWorld(swinging, i => ({ dir: 1, attack1: i === 0 }), 30);
    assert(swinging.hero.body.x - start < 30, `the hero kept walking through a melee swing (moved ${(swinging.hero.body.x - start).toFixed(0)} px)`);
  }],
  ['magic can be cast from a crouch without standing up; a melee swing cannot', () => {
    const world = arena([3], { enemy: dummy(), config: QUIET });
    runWorld(world, { down: true }, 10);
    assert(world.hero.crouching, 'the hero did not crouch');
    runWorld(world, i => ({ down: true, attack1: i === 0 }), 5);
    assert(!world.hero.action, 'a melee swing started from a crouch');
    let low = true, shotY = null;
    runWorld(world, i => ({ down: true, attack2: i === 0 }), 60, w => {
      low = low && w.hero.crouching && w.hero.body.h === 30;
      if (w.projectiles[0] && shotY === null) shotY = w.projectiles[0].y;
    });
    assert(low, 'the hero stood up while casting');
    assert(shotY !== null && world.hero.body.y - shotY < 25, `the shot did not leave from crouch height (${shotY})`);
    assert(world.enemies[0].hp === 15, 'the crouched shot did not hit');
    const crawling = arena([], { config: QUIET });
    runWorld(crawling, { down: true, dir: 1 }, 20);
    const x = crawling.hero.body.x;
    runWorld(crawling, i => ({ down: true, dir: 1, attack2: i === 0 }), 30);
    assert(crawling.hero.action?.slot === 'attack2' && crawling.hero.body.x > x + 15 && crawling.hero.crouching, 'could not cast while crawling');
  }],
  ['a melee ability marked for the air can be used in a jump', () => {
    const hero = fighter();
    hero.gameplay.abilities.attack1.air = true;
    const world = arena([], { hero, config: QUIET });
    runWorld(world, i => ({ jumpPressed: i === 0, jumpHeld: true, attack1: i === 6 }), 10);
    assert(!world.hero.body.grounded && world.hero.action?.slot === 'attack1', 'the swing did not start in mid-air');
    const x = world.hero.body.x;
    runWorld(world, { dir: 1, jumpHeld: true }, 10);
    assert(world.hero.body.x > x + 10, 'the hero could not steer during an air attack');
  }],
  ['a hex makes the target take double damage', () => {
    const world = arena([1], { enemy: dummy(), config: QUIET });
    faceUp(world, world.enemies[0]);
    runWorld(world, i => ({ attack3: i === 0 }), 50);
    runWorld(world, i => ({ attack1: i === 0 }), 50);
    assert(world.enemies[0].hp === 10, `expected 10 HP after a doubled hit, got ${world.enemies[0].hp}`);
  }],
  ['killing an enemy scores points and removes it', () => {
    const world = arena([1], { enemy: dummy(), config: QUIET });
    faceUp(world, world.enemies[0]);
    for (let i = 0; i < 3; i++) { world.hero.facing = 1; runWorld(world, t => ({ attack1: t === 0 }), 70); }
    assert(world.hero.score === 10, `expected 10 points, got ${world.hero.score}`);
    runWorld(world, {}, 200);
    assert(world.enemies.length === 0, 'the dead enemy was never removed');
  }],
  ['an enemy that sees the hero walks up and hits', () => {
    const world = arena([4], { config: QUIET });
    const startX = world.enemies[0].body.x;
    runWorld(world, {}, 400);
    assert(world.enemies[0].body.x < startX - 100, 'the enemy did not approach');
    assert(world.hero.hp < 100, 'the enemy never landed a hit');
  }],
  ['a patrolling enemy turns at ledges and walls and never falls', () => {
    const world = arena([7], { enemy: fakeEnemy({ sight: 0 }), config: QUIET, map: ['............', '............', 'S...........', '####..####..'] });
    const enemy = world.enemies[0];
    let min = Infinity, max = -Infinity;
    runWorld(world, {}, 1500, () => { min = Math.min(min, enemy.body.x); max = Math.max(max, enemy.body.x); });
    assert(!enemy.gone && enemy.body.y === 3 * TILE, 'the enemy fell off its platform');
    assert(max - min > 150, `the enemy barely moved (${(max - min).toFixed(0)} px)`);
    assert(min > 6 * TILE && max < 10 * TILE, `the enemy left its platform: ${min.toFixed(0)}–${max.toFixed(0)}`);
  }],
  ['a guard returns to its post', () => {
    const world = arena([8], { enemy: fakeEnemy({ archetype: 'guard', sight: 300, leash: 150 }), config: QUIET });
    const guard = world.enemies[0], post = guard.body.x;
    world.hero.body.x = 5.5 * TILE;
    runWorld(world, {}, 200);
    assert(guard.body.x < post - 60, 'the guard did not advance on the hero');
    assert(guard.body.x > post - 170, `the guard left its post by ${(post - guard.body.x).toFixed(0)} px`);
    world.hero.body.x = 0.5 * TILE;
    runWorld(world, {}, 600);
    assert(Math.abs(guard.body.x - post) < 12, 'the guard did not return to its post');
  }],
  ['a caster keeps its distance and shoots', () => {
    const caster = fakeEnemy({ archetype: 'caster', sight: 600, preferredDistance: 300, hover: true },
      { attacks: { attack2: { type: 'projectile', damage: 6, cooldown: 1.5, weight: 1, projectile: { speed: 300, range: 600 } } } });
    const world = arena([3], { enemy: caster, config: QUIET });
    let shots = 0;
    runWorld(world, {}, 400, w => { shots = Math.max(shots, w.projectiles.length); });
    assert(world.enemies[0].body.x - world.hero.body.x > 200, 'the caster stayed close');
    assert(shots > 0 && world.hero.hp < 100, 'the caster never hit with a shot');
  }],
  ['touching an enemy hurts once, then the hero is briefly safe', () => {
    const world = arena([1], { enemy: fakeEnemy({ sight: 0 }, { attacks: {} }) });
    world.hero.body.x = world.enemies[0].body.x;
    runWorld(world, {}, 2);
    assert(world.hero.hp === 96, `expected 96 HP after a touch, got ${world.hero.hp}`);
    world.hero.body.x = world.enemies[0].body.x;
    runWorld(world, {}, 5);
    assert(world.hero.hp === 96, 'the hero was hurt again while invulnerable');
  }],
  ['crouching lets a high attack pass overhead', () => {
    const high = fakeEnemy({}, { attacks: { attack1: { type: 'melee', damage: 8, cooldown: 0.2, weight: 1, box: { x: 8, y: -50, w: 60, h: 15 } } } });
    const standing = arena([1], { enemy: high, config: QUIET });
    runWorld(standing, {}, 200);
    assert(standing.hero.hp < 100, 'the high attack missed a standing hero');
    const ducking = arena([1], { enemy: high, config: QUIET });
    runWorld(ducking, { down: true }, 200);
    assert(ducking.hero.hp === 100, 'the high attack hit a crouching hero');
  }],
  ['a stunned enemy cannot act', () => {
    const world = arena([2], { config: QUIET });
    world.enemies[0].applyEffect({ stun: 3 });
    const x = world.enemies[0].body.x;
    runWorld(world, {}, 150);
    assert(Math.abs(world.enemies[0].body.x - x) < 8 && world.hero.hp === 100, 'a stunned enemy moved or attacked');
  }],
  ['a hero who runs out of health loses a life and returns to the start', () => {
    const world = arena([1], { config: QUIET });
    const start = world.hero.body.x;
    world.hero.body.x = 5 * TILE;
    world.hurtHero(500, world.enemies[0]);
    assert(world.hero.dead && world.hero.hp === 0, 'the hero did not die');
    runWorld(world, {}, 150);
    assert(!world.hero.dead && world.hero.lives === 2 && world.hero.hp === 100, 'the hero did not come back with full health and one life fewer');
    assert(Math.abs(world.hero.body.x - start) < 80, 'the hero did not return to the start');
  }],
  ['losing the last life ends the game', () => {
    const world = arena([], { config: { ...QUIET, rules: { lives: 1, touchDamage: false } } });
    world.hurtHero(500, { x: 0 });
    runWorld(world, {}, 200);
    assert(world.over && world.hero.dead, 'the game did not end');
  }],
  ['the difficulty settings scale damage and health', () => {
    const hard = { ...QUIET, difficulty: { enemyHealth: 2, playerDamage: 0.5 } };
    const world = arena([1], { enemy: dummy(), config: hard });
    assert(world.enemies[0].hp === 60, `expected 60 HP, got ${world.enemies[0].hp}`);
    faceUp(world, world.enemies[0]);
    runWorld(world, i => ({ attack1: i === 0 }), 50);
    assert(world.enemies[0].hp === 55, `expected 55 HP after a halved hit, got ${world.enemies[0].hp}`);
  }],
);

// ------------------------------------------------------------------ objects

/** A stand-in object with the three standard animations. */
function fakeObject(gameplay, persistent = false) {
  const animations = { idle: clip('idle', true), interact: clip('interact', false), vanish: clip('vanish', false) };
  return { id: 'thing', kind: 'object', persistent, animations,
    gameplay: { box: { x: -14, y: -30, w: 28, h: 30 }, ...gameplay } };
}
const OBJECTS = {
  'object/coin': fakeObject({ use: 'touch', behaviour: 'pickup', gives: { score: 1 } }),
  'object/potion': fakeObject({ use: 'touch', behaviour: 'pickup', gives: { hp: 40 } }),
  'object/key': fakeObject({ use: 'touch', behaviour: 'pickup', gives: { keys: 1 } }),
  'object/scroll': fakeObject({ use: 'touch', behaviour: 'pickup', gives: { buff: { damage: 2, duration: 15 } } }),
  'object/chest': fakeObject({ use: 'interact', behaviour: 'container', loot: [{ object: 'coin', count: 3 }] }),
  'object/crate': fakeObject({ use: 'attack', behaviour: 'breakable', hp: 1, solid: true, loot: [{ object: 'coin' }] }),
  'object/flag': fakeObject({ use: 'touch', behaviour: 'checkpoint', gives: { hpFraction: 1 } }, true),
  'object/shrine': fakeObject({ use: 'interact', behaviour: 'shrine', gives: { hpFraction: 1, mpFraction: 1 }, cooldown: 5 }, true),
  'object/lever': fakeObject({ use: 'interact', behaviour: 'switch' }, true),
  'object/relic': fakeObject({ use: 'touch', behaviour: 'goal', gives: { score: 100 } }),
};

/** A flat room holding the listed things: [type, id, col, extra]. */
function room(things, { map, config = QUIET, enemy = dummy() } = {}) {
  const level = mapLevel(map ?? ['............', '............', 'S...........', '############']);
  level.doc.entities = things.map(([type, id, col, extra]) => ({ type, id, col, row: 2, ...extra }));
  const world = new World(level, fighter(), config, { ...OBJECTS, 'enemy/dummy': enemy });
  runWorld(world, {}, 5);
  return world;
}
const walkTo = (world, col, ticks = 400) => {
  for (let i = 0; i < ticks && world.hero.body.x < col * TILE + 40; i++) runWorld(world, { dir: 1 }, 1);
};

tests.push(
  ['walking into pickups collects them', () => {
    const world = room([['object', 'coin', 2], ['object', 'coin', 3], ['object', 'key', 4]]);
    walkTo(world, 5);
    assert(world.hero.score === 2 && world.hero.keys === 1, `expected 2 points and 1 key, got ${world.hero.score} and ${world.hero.keys}`);
    runWorld(world, {}, 120);
    assert(world.objects.length === 0, 'collected pickups were not removed');
  }],
  ['a potion heals without going over the maximum', () => {
    const world = room([['object', 'potion', 2], ['object', 'potion', 4]]);
    world.hero.hp = 30;
    walkTo(world, 3);
    assert(world.hero.hp === 70, `expected 70 HP, got ${world.hero.hp}`);
    walkTo(world, 5);
    assert(world.hero.hp === 100, `expected to stop at 100 HP, got ${world.hero.hp}`);
  }],
  ['a scroll doubles damage for a while', () => {
    const world = room([['object', 'scroll', 1], ['enemy', 'dummy', 4]]);
    walkTo(world, 1.2);
    faceUp(world, world.enemies[0]);
    runWorld(world, i => ({ attack1: i === 0 }), 50);
    assert(world.enemies[0].hp === 10, `expected 10 HP after a doubled hit, got ${world.enemies[0].hp}`);
    runWorld(world, {}, 60 * 16);
    world.enemies[0].hp = 30;
    faceUp(world, world.enemies[0]);
    runWorld(world, i => ({ attack1: i === 0 }), 50);
    assert(world.enemies[0].hp === 20, `the boost did not wear off (enemy at ${world.enemies[0].hp} HP)`);
  }],
  ['a chest opens with the interact key and gives its loot', () => {
    const world = room([['object', 'chest', 2]]);
    walkTo(world, 2);
    assert(world.objects.length === 1 && world.hero.score === 0, 'the chest opened by touch');
    assert(world.prompt === world.objects[0], 'no prompt was offered at the chest');
    runWorld(world, i => ({ interact: i === 0 }), 120);
    assert(world.hero.score === 3, `expected 3 coins, got ${world.hero.score}`);
    assert(world.objects.some(o => o.entity === OBJECTS['object/chest'] && o.state === 'used'), 'the chest did not stay open');
  }],
  ['a locked chest needs a key', () => {
    const world = room([['object', 'chest', 2, { locked: true }], ['object', 'key', 5]]);
    walkTo(world, 2);
    runWorld(world, i => ({ interact: i === 0 }), 30);
    assert(world.objects[0].state === 'idle', 'a locked chest opened without a key');
    walkTo(world, 5.3);
    for (let i = 0; i < 300 && world.hero.body.x > 2 * TILE + 50; i++) runWorld(world, { dir: -1 }, 1);
    runWorld(world, i => ({ interact: i === 0 }), 120);
    assert(world.hero.keys === 0 && world.hero.score === 3, 'the key did not open the chest');
  }],
  ['a crate blocks the way until it is broken, then drops loot', () => {
    const world = room([['object', 'crate', 3]]);
    walkTo(world, 6, 200);
    assert(world.hero.body.x < 3.5 * TILE, `the hero walked through a crate (x=${world.hero.body.x})`);
    runWorld(world, i => ({ attack1: i === 0 }), 60);
    walkTo(world, 6);
    assert(world.hero.body.x > 5 * TILE, 'the broken crate still blocked the way');
    assert(world.hero.score === 1, 'the crate dropped no loot');
  }],
  ['a projectile breaks a crate and stops there', () => {
    const world = room([['object', 'crate', 3], ['enemy', 'dummy', 5]]);
    runWorld(world, i => ({ attack2: i === 0 }), 80);
    assert(world.objects.every(o => o.entity !== OBJECTS['object/crate'] || o.state !== 'idle'), 'the crate was not broken');
    assert(world.enemies[0].hp === 30, 'the shot carried on through the crate');
  }],
  ['a checkpoint flag moves the respawn point and refills health', () => {
    const world = room([['object', 'flag', 6]]);
    world.hero.hp = 20;
    walkTo(world, 6.2);
    assert(world.hero.hp === 100, 'the flag did not refill health');
    world.hurtHero(500, { x: 0 });
    runWorld(world, {}, 150);
    assert(Math.abs(world.hero.body.x - 6.5 * TILE) < 10, `expected to return to the flag, x=${world.hero.body.x}`);
  }],
  ['a shrine refills health and mana, then rests', () => {
    const world = room([['object', 'shrine', 2]]);
    walkTo(world, 2);
    world.hero.hp = 10; world.hero.mp = 0;
    runWorld(world, i => ({ interact: i === 0 }), 10);
    assert(world.hero.hp === 100 && world.hero.mp > 99, 'the shrine did not refill');
    world.hero.hp = 10;
    runWorld(world, i => ({ interact: i === 0 }), 60);
    assert(world.hero.hp === 10, 'the shrine worked again at once');
    runWorld(world, {}, 60 * 5);
    runWorld(world, i => ({ interact: i === 0 }), 10);
    assert(world.hero.hp === 100, 'the shrine did not work again after resting');
  }],
  ['a lever opens its gate', () => {
    const world = room([['object', 'lever', 1, { link: 'door' }], ['gate', 'door', 4, { row: 1, height: 2 }]],
      { map: ['....#.......', '............', 'S...........', '############'] });
    walkTo(world, 8, 240);
    assert(world.hero.body.x < 4.5 * TILE, 'the hero walked through a closed gate');
    for (let i = 0; i < 300 && world.hero.body.x > TILE + 50; i++) runWorld(world, { dir: -1 }, 1);
    runWorld(world, i => ({ interact: i === 0 }), 80);
    assert(world.gates[0].open, 'the lever did not open the gate');
    walkTo(world, 8);
    assert(world.hero.body.x > 7 * TILE, 'the open gate still blocked the way');
  }],
  ['a locked gate opens for a hero carrying a key', () => {
    const world = room([['object', 'key', 2], ['gate', 'door', 4, { row: 1, height: 2, locked: true }]],
      { map: ['....#.......', '............', 'S...........', '############'] });
    walkTo(world, 8);
    assert(world.gates[0].open && world.hero.keys === 0 && world.hero.body.x > 7 * TILE, 'the key did not open the gate');
  }],
  ['a defeated enemy can drop loot', () => {
    const generous = fakeEnemy({ archetype: 'guard', sight: 0, leash: 100 }, { drops: [{ object: 'coin', chance: 1, count: 2 }] });
    const world = room([['enemy', 'dummy', 2]], { enemy: generous });
    world.hurtEnemy(world.enemies[0], 99, world.hero);
    assert(world.objects.length === 2, `expected 2 coins on the ground, got ${world.objects.length}`);
    runWorld(world, {}, 30);
    walkTo(world, 4);
    assert(world.hero.score === 12, `expected 10 for the kill and 2 coins, got ${world.hero.score}`);
  }],
  ['reaching the relic completes the level', () => {
    const world = room([['object', 'relic', 5, { appears: 'boss_defeated' }]]);
    walkTo(world, 5.3);
    assert(world.complete && world.hero.score === 100, 'the level was not completed');
    assert(world.time > 1 && world.deaths === 0, 'the time or death count is wrong');
  }],
);

// ------------------------------------------------------------------- bosses

/** A stand-in boss: 200 HP, three phases, a swing, a ground wave, a breath and a volley. */
function fakeBoss(extra = {}) {
  const animations = Object.fromEntries(['idle', 'walk', 'fly', 'hit', 'death'].map(s => [s, clip(s, ['idle', 'walk', 'fly'].includes(s))]));
  animations.attack1 = clip('attack1', false, [{ frame: 3, until: 4, type: 'melee' }]);
  animations.attack2 = clip('attack2', false, [{ frame: 4, type: 'emit' }]);
  animations.attack3 = clip('attack3', false, [{ frame: 4, until: 5, type: 'emit' }]);
  animations.attack4 = clip('attack4', false, [{ frame: 4, type: 'emit' }]);
  return { id: 'tyrant', kind: 'boss', name: 'Tyrant', animations, gameplay: {
    stats: { hp: 200, speed: 80, touchDamage: 10, score: 500 },
    body: { x: -30, y: -80, w: 60, h: 80 },
    phases: [{ untilHp: 0.66, attacks: ['attack1'], tempo: 1 }, { untilHp: 0.33, attacks: ['attack1', 'attack2'], tempo: 1.2 },
      { untilHp: 0, attacks: ['attack1', 'attack2', 'attack3', 'attack4'], tempo: 1.4 }],
    attacks: {
      attack1: { type: 'melee', damage: 20, cooldown: 1, box: { x: 20, y: -70, w: 50, h: 60 } },
      attack2: { type: 'shockwave', damage: 15, cooldown: 2, radius: 400 },
      attack3: { type: 'breath', damage: 25, cooldown: 3, range: 250, box: { x: 30, y: -60, w: 20, h: 40 } },
      attack4: { type: 'projectile', damage: 12, cooldown: 3, projectile: { speed: 400, range: 800, count: 3, spread: 20 } },
    }, ...extra } };
}

/** A long flat room with a boss arena on its right half, a relic at the far end and a flag at the start. */
function bossRoom({ boss = fakeBoss(), config = QUIET, attacks } = {}) {
  if (attacks) boss.gameplay.phases = [{ untilHp: 0, attacks, tempo: 1 }];
  const level = mapLevel(['....................', '....................', '....................', 'S...................', '####################']);
  level.doc.entities = [{ type: 'boss', id: 'tyrant', col: 14, row: 3 }, { type: 'object', id: 'relic', col: 18, row: 3, appears: 'boss_defeated' }];
  level.doc.regions = [{ type: 'boss_arena', col: 6, row: 0, cols: 14, rows: 5 }];
  const world = new World(level, fighter(), config, { ...OBJECTS, 'boss/tyrant': boss });
  runWorld(world, {}, 5);
  return world;
}
const enterArena = world => { world.hero.body.x = 7.5 * TILE; runWorld(world, {}, 2); };

tests.push(
  ['a boss waits until the hero enters the arena, then the way back shuts', () => {
    const world = bossRoom();
    const boss = world.enemies[0], x = boss.body.x;
    runWorld(world, {}, 200);
    assert(!boss.awake && boss.body.x === x && world.hero.hp === 100, 'the boss acted before the hero arrived');
    assert(world.objects[0].hidden, 'the relic was available before the boss was beaten');
    enterArena(world);
    assert(boss.awake && world.arena.locked, 'the arena did not lock');
    for (let i = 0; i < 200; i++) runWorld(world, { dir: -1 }, 1);
    assert(world.hero.body.x > 6 * TILE, `the hero walked back out of the arena (x=${world.hero.body.x.toFixed(0)})`);
  }],
  ['a boss is not staggered or pushed by hits, and moves through its phases', () => {
    const world = bossRoom();
    const boss = world.enemies[0];
    enterArena(world);
    const x = boss.body.x;
    world.hurtEnemy(boss, 10, world.hero, { knockback: 500 });
    assert(boss.action?.slot !== 'hit' && Math.abs(boss.body.vx) < 100, 'the boss was staggered or knocked back');
    assert(boss.phase === 0 && boss.tempo === 1, 'the boss started in the wrong phase');
    world.hurtEnemy(boss, 70, world.hero);
    assert(boss.phase === 1 && boss.attackList().length === 2, `expected phase 2 at ${boss.hp} HP, got phase ${boss.phase + 1}`);
    world.hurtEnemy(boss, 70, world.hero);
    assert(boss.phase === 2 && boss.tempo === 1.4 && boss.attackList().length === 4, 'the last phase did not unlock every attack');
    assert(Math.abs(boss.body.x - x) < 40, 'the boss was moved by the blows');
  }],
  ['a boss walks up and strikes', () => {
    const world = bossRoom({ attacks: ['attack1'] });
    enterArena(world);
    runWorld(world, {}, 600);
    assert(world.hero.hp < 100, 'the boss never hurt the hero');
  }],
  ['a ground wave misses a hero who is in the air', () => {
    const grounded = bossRoom({ attacks: ['attack2'] });
    enterArena(grounded);
    grounded.hero.body.x = grounded.enemies[0].body.x - 250;
    runWorld(grounded, {}, 90);
    assert(grounded.hero.hp === 85, `expected the wave to deal 15, hero at ${grounded.hero.hp}`);
    const flying = bossRoom({ attacks: ['attack2'] });
    enterArena(flying);
    flying.hero.body.x = flying.enemies[0].body.x - 250;
    runWorld(flying, i => ({ fly: i === 0, vertical: i < 20 ? -1 : 0 }), 90);
    assert(flying.hero.hp === 100, 'the wave hit a hero who was off the ground');
  }],
  ['breath reaches well beyond the boss, and a volley fires three shots', () => {
    const breath = bossRoom({ attacks: ['attack3'] });
    enterArena(breath);
    breath.hero.body.x = breath.enemies[0].body.x - 200;
    runWorld(breath, {}, 90);
    assert(breath.hero.hp === 75, `expected the breath to deal 25, hero at ${breath.hero.hp}`);
    const volley = bossRoom({ attacks: ['attack4'] });
    enterArena(volley);
    let most = 0;
    runWorld(volley, {}, 80, w => { most = Math.max(most, w.projectiles.length); });
    assert(most === 3, `expected 3 shots in the air, saw ${most}`);
  }],
  ['defeating the boss opens the arena, reveals the relic and scores', () => {
    const world = bossRoom();
    enterArena(world);
    world.hurtEnemy(world.enemies[0], 999, world.hero);
    runWorld(world, {}, 5);
    assert(!world.arena.locked && world.boss === null, 'the arena stayed shut');
    assert(world.hero.score === 500 && !world.objects[0].hidden, 'no score, or the relic stayed hidden');
    runWorld(world, {}, 400);
    assert(world.enemies.length === 1, 'the fallen boss disappeared');
    world.hero.body.x = 18.5 * TILE;
    runWorld(world, {}, 3);
    assert(world.complete, 'touching the relic did not complete the level');
  }],
  ['if the hero dies, the boss fight starts over', () => {
    const world = bossRoom();
    const boss = world.enemies[0];
    enterArena(world);
    world.hurtEnemy(boss, 150, world.hero);
    runWorld(world, {}, 60);
    world.hurtHero(999, boss);
    runWorld(world, {}, 150);
    assert(!world.hero.dead && world.hero.body.x < 2 * TILE, 'the hero did not return to the start');
    assert(boss.hp === 200 && boss.phase === 0 && !boss.awake && Math.abs(boss.body.x - 14.5 * TILE) < 2, 'the boss was not restored');
    assert(!world.arena.locked, 'the arena stayed shut after the hero died');
    for (let i = 0; i < 300 && world.hero.body.x < 7.2 * TILE; i++) runWorld(world, { dir: 1 }, 1);
    assert(world.arena.locked && boss.awake, 'walking back in did not restart the fight');
  }],
);

// ----------------------------------------------------------------- dialogue

import { LineDirector } from '../speech/lines.js';

const speaker = (lines, extra = {}) => ({ g: { lines }, hp: 100, maxHp: 100, dead: false, ...extra });

tests.push(
  ['an enemy that spots the hero raises an alert once', () => {
    const world = arena([4], { config: QUIET });
    let alerts = 0;
    runWorld(world, {}, 200, w => { alerts += w.events.filter(e => e.type === 'alert').length; w.events.length = 0; });
    assert(alerts === 1, `expected one alert, got ${alerts}`);
  }],
  ['the hero speaks at the start of a level, after a short pause', () => {
    const lines = new LineDirector(() => 0);
    const world = { hero: speaker({ start: ['Here we go.'] }) };
    assert(lines.update([{ type: 'levelStart' }], world, 0.1).length === 0, 'the line came at once');
    const said = lines.update([], world, 1);
    assert(said.length === 1 && said[0].text === 'Here we go.' && said[0].actor === world.hero, 'the opening line was not spoken');
  }],
  ['enemies do not all talk at once', () => {
    const lines = new LineDirector(() => 0);
    const world = { hero: speaker({}) };
    const a = speaker({ alert: ['Halt.'] }), b = speaker({ alert: ['Halt.'] });
    const first = lines.update([{ type: 'alert', actor: a }, { type: 'alert', actor: b }], world, 0.1);
    assert(first.length === 1, `expected one enemy to speak, ${first.length} did`);
    assert(lines.update([{ type: 'alert', actor: b }], world, 4).length === 1, 'an enemy stayed silent after the pause');
  }],
  ['a low-health line is said once per life', () => {
    const lines = new LineDirector(() => 0);
    const hero = speaker({ lowHp: ['Ouch.'] }, { hp: 20 });
    const world = { hero };
    assert(lines.update([{ type: 'damage', team: 'hero' }], world, 0.1).length === 1, 'no line at low health');
    assert(lines.update([{ type: 'damage', team: 'hero' }], world, 0.1).length === 0, 'the line was repeated');
    lines.update([{ type: 'respawn' }], world, 0.1);
    assert(lines.update([{ type: 'damage', team: 'hero' }], world, 0.1).length === 1, 'no line after coming back');
  }],
  ['a boss announces the fight and each phase, and the hero answers', () => {
    const lines = new LineDirector(() => 0);
    const boss = speaker({ fight: ['Kneel.'], phase2: ['Insolence.'], phase3: ['Enough!'], death: ['My crown…'] }, { boss: true });
    const world = { hero: speaker({ bossFight: ['No.'] }) };
    lines.update([{ type: 'bossFight', actor: boss }], world, 0.1);
    const opening = lines.update([], world, 0.5).map(l => l.text);
    assert(opening.join() === 'Kneel.', `expected the boss to speak first, got "${opening}"`);
    assert(lines.update([], world, 2.5).map(l => l.text).join() === 'No.', 'the hero did not answer');
    assert(lines.update([{ type: 'bossPhase', actor: boss, phase: 2 }], world, 0.1)[0].text === 'Insolence.', 'no phase 2 line');
    assert(lines.update([{ type: 'bossPhase', actor: boss, phase: 3 }], world, 0.1)[0].text === 'Enough!', 'no phase 3 line');
    assert(lines.update([{ type: 'kill', actor: boss }], world, 0.1)[0].text === 'My crown…', 'no last words');
  }],
  ['a character with no lines stays silent', () => {
    const lines = new LineDirector(() => 0);
    const world = { hero: speaker(undefined) };
    assert(lines.update([{ type: 'levelStart' }, { type: 'heroDied' }], world, 2).length === 0, 'a line appeared from nowhere');
  }],
);
