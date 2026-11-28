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
  ['a shot reports where it hit, and nothing when it runs out of range', () => {
    const sprited = () => fighter({ abilities: { ...fighter().gameplay.abilities,
      attack2: { type: 'projectile', mp: 10, damage: 15, air: true, mobile: true, crouch: true, projectile: { sprite: 'arrow', speed: 500, range: 400 } } } });
    const hit = arena([3], { hero: sprited(), enemy: dummy(), config: QUIET });
    const seen = [];
    runWorld(hit, i => ({ attack2: i === 0 }), 90, w => { seen.push(...w.events.filter(e => e.type === 'impact')); w.events.length = 0; });
    assert(seen.length === 1, `expected one impact, saw ${seen.length}`);
    assert(seen[0].sprite === 'arrow' && seen[0].vx > 0 && seen[0].team === 'hero', 'the impact does not describe the shot');
    const miss = arena([14], { hero: sprited(), enemy: dummy(), config: QUIET, map: ['................', '................', '................', 'S...............', '################'] });
    const none = [];
    runWorld(miss, i => ({ attack2: i === 0 }), 120, w => { none.push(...w.events.filter(e => e.type === 'impact')); w.events.length = 0; });
    assert(none.length === 0 && miss.projectiles.length === 0, 'a shot that ran out of range reported an impact');
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
  ['attack speed can be changed for a site, a hero or one ability', () => {
    // Ticks from pressing the key until the bolt appears (it leaves on frame 3, 200 ms in at normal speed).
    const ticksToFire = (change, config = QUIET) => {
      const hero = fighter();
      change(hero.gameplay);
      const world = arena([], { hero, config });
      let fired = -1;
      runWorld(world, i => ({ attack2: i === 0 }), 60, (w, i) => { if (fired < 0 && w.projectiles.length) fired = i; });
      return fired;
    };
    const normal = ticksToFire(() => {});
    const quickAbility = ticksToFire(g => { g.abilities.attack2.speed = 2; });
    const quickHero = ticksToFire(g => { g.stats.attackSpeed = 2; });
    const quickSite = ticksToFire(() => {}, { ...QUIET, difficulty: { attackSpeed: 2 } });
    const slowHero = ticksToFire(g => { g.stats.attackSpeed = 0.5; });
    assert(normal >= 11 && normal <= 13, `expected the bolt after about 12 ticks, got ${normal}`);
    for (const [name, ticks] of [['the ability', quickAbility], ['the hero', quickHero], ['the site', quickSite]]) {
      assert(ticks >= 5 && ticks <= 7, `doubling the speed for ${name} gave ${ticks} ticks, expected about 6`);
    }
    assert(slowHero >= 23 && slowHero <= 25, `halving the hero's speed gave ${slowHero} ticks, expected about 24`);
  }],
  ['an ability with a cooldown cannot be used again until it has passed', () => {
    const hero = fighter();
    hero.gameplay.abilities.attack2.cooldown = 2;
    const world = arena([], { hero, config: QUIET });
    let shots = 0;
    const count = w => { shots += w.events.filter(e => e.type === 'ability').length; w.events.length = 0; };
    runWorld(world, i => ({ attack2: i % 10 === 0 }), 100, count);
    assert(shots === 1, `expected one shot inside the cooldown, got ${shots}`);
    runWorld(world, i => ({ attack2: i % 10 === 0 }), 60, count);
    assert(shots === 2, `expected a second shot after the cooldown, got ${shots}`);
  }],
  ['an ability used in the air skips its wind-up so it happens during the jump', () => {
    // The stand-in bolt leaves on frame 3: 200 ms after the start on the ground.
    const ticksToFire = (airborne, change = () => {}) => {
      const hero = fighter();
      change(hero.gameplay);
      const world = arena([], { hero, config: QUIET });
      if (airborne) runWorld(world, i => ({ jumpPressed: i === 0, jumpHeld: true }), 8);
      let fired = -1, firedInAir = false;
      runWorld(world, i => ({ jumpHeld: true, attack2: i === 0 }), 40, (w, i) => {
        if (fired < 0 && w.projectiles.length) { fired = i; firedInAir = !w.hero.body.grounded; }
      });
      return { fired, firedInAir };
    };
    const ground = ticksToFire(false), air = ticksToFire(true);
    assert(ground.fired >= 11 && ground.fired <= 13, `on the ground the bolt should take about 12 ticks, took ${ground.fired}`);
    assert(air.fired >= 5 && air.fired <= 7 && air.firedInAir, `in the air the bolt should take about 6 ticks, took ${air.fired}`);
    const full = ticksToFire(true, g => { g.abilities.attack2.airWindup = true; });
    assert(full.fired >= 11, `an ability marked to keep its wind-up fired after ${full.fired} ticks`);
    const none = ticksToFire(true, g => { g.combat = { airWindupFrames: 0 }; });
    assert(none.fired <= 1, `with no wind-up frames kept the bolt should leave at once, took ${none.fired}`);
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
import { parseMidi } from '../audio/midi.js';
import { Solitaire } from '../minigames/solitaire.js';

tests.push(
  ['a saved game puts the hero, enemies, objects, gates and loot back as they were', () => {
    const build = () => {
      const world = room([['object', 'crate', 3], ['object', 'chest', 6], ['gate', 'g1', 9, { row: 1, height: 2 }],
        ['object', 'lever', 8, { link: 'g1' }], ['enemy', 'dummy', 10], ['enemy', 'dummy', 11]]);
      return world;
    };
    const world = build();
    // Change things: hurt the hero and an enemy, break or open what there is, spend and earn.
    const hero = world.hero;
    hero.bonus.maxHp = 10; hero.applyUpgrades(world.goods);
    hero.hp = 41; hero.mp = 17; hero.gold = 23; hero.keys = 2; hero.score = 99;
    hero.body.x = 300; hero.addBoost({ stat: 'damage', factor: 2, duration: 30 });
    world.enemies[0].hp = 11; world.enemies[0].body.x += 40;
    const gone = world.objects[0]; gone.gone = true; if (gone.solid) world.unblock(gone.solid);
    world.objects[1].state = 'used';
    world.openGate(world.gates[0]);
    world.addObject('coin', 500, 288);                         // something dropped on the floor
    world.checkpoint = { x: 250, y: 288 };
    world.tick = 600; world.deaths = 3;
    const snap = JSON.parse(JSON.stringify(world.snapshot())); // as it comes back from storage
    const again = build();
    again.restore(snap);
    const h2 = again.hero;
    assert(h2.hp === 41 && h2.mp === 17 && h2.gold === 23 && h2.keys === 2 && h2.score === 99, 'the hero\'s numbers were not restored');
    assert(h2.maxHp === hero.maxHp && h2.body.x === 300 && h2.boosts.length === 1, 'the hero\'s maximum, place or boost was not restored');
    assert(again.enemies.length === world.enemies.length && again.enemies[0].hp === 11 && again.enemies[0].body.x === world.enemies[0].body.x, 'the enemy was not restored');
    assert(!again.objects.some(o => o.slot === gone.slot), 'a broken object came back');
    assert(again.objects.find(o => o.slot === world.objects[1].slot).state === 'used', 'an opened object closed again');
    assert(again.objects.filter(o => o.slot == null).length === 1, 'loot on the floor was not restored');
    assert(again.gates[0].open && !again.level.dynamic.includes(again.gates[0].rect), 'the gate shut again');
    assert(again.checkpoint.x === 250 && again.tick === 600 && again.deaths === 3, 'the checkpoint, time or deaths were not restored');
    runWorld(again, {}, 30);
    assert(!again.hero.dead && again.hero.body.grounded, 'the restored world did not carry on');
    // An enemy that had been defeated stays gone.
    world.enemies[0].dead = true;
    const cleared = build();
    cleared.restore(JSON.parse(JSON.stringify(world.snapshot())));
    assert(cleared.enemies.length === world.enemies.length - 1, 'a defeated enemy came back');
  }]);

const card = (rank, suit, up = true) => ({ rank, suit, up });
/** A solitaire game with every pile empty, to set up a position by hand. */
function emptyTable() {
  const g = new Solitaire(makeRng('table').next);
  g.stock = []; g.waste = []; g.foundations = [[], [], [], []]; g.tableau = [[], [], [], [], [], [], []]; g.history = []; g.moves = 0;
  return g;
}

tests.push(
  ['solitaire deals seven columns with the last card of each face up, and 24 cards in the stock', () => {
    const g = new Solitaire(makeRng('deal').next);
    assert(g.stock.length === 24 && g.waste.length === 0, `stock ${g.stock.length}, waste ${g.waste.length}`);
    g.tableau.forEach((pile, i) => {
      assert(pile.length === i + 1, `column ${i} has ${pile.length} cards`);
      assert(pile.every((c, n) => c.up === (n === pile.length - 1)), `column ${i} has the wrong cards face up`);
    });
    const all = [...g.stock, ...g.tableau.flat()].map(c => `${c.suit}${c.rank}`);
    assert(new Set(all).size === 52, 'the deck is not 52 different cards');
    const again = new Solitaire(makeRng('deal').next);
    assert(JSON.stringify(again.tableau) === JSON.stringify(g.tableau), 'the same seed dealt a different game');
  }],
  ['solitaire draws one card at a time and goes round the stock without limit, in the same order', () => {
    const g = new Solitaire(makeRng('draw').next);
    const first = [];
    for (let i = 0; i < 24; i++) { assert(g.draw() === 'drew', 'expected to draw'); assert(g.waste.length === i + 1, 'more than one card was drawn'); first.push(g.waste[i]); }
    assert(g.stock.length === 0, 'the stock should be empty');
    for (let round = 0; round < 5; round++) {
      assert(g.draw() === 'turned' && g.stock.length === 24 && g.waste.length === 0, 'the waste was not turned back over');
      assert(g.stock.every(c => !c.up), 'turned cards should be face down');
      for (let i = 0; i < 24; i++) { g.draw(); assert(g.waste[i].rank === first[i].rank && g.waste[i].suit === first[i].suit, 'the order changed on a later pass'); }
    }
    assert(g.passes === 5, `expected 5 passes, counted ${g.passes}`);
  }],
  ['solitaire allows only legal moves, moves runs together, and turns over the card beneath', () => {
    const g = emptyTable();
    g.tableau[0] = [card(9, 'club', false), card(8, 'heart'), card(7, 'spade')];
    g.tableau[1] = [card(9, 'spade')];
    g.tableau[2] = [card(9, 'diamond')];
    g.waste = [card(13, 'heart'), card(1, 'club')];
    const col = i => ({ pile: 'tableau', index: i });
    assert(!g.canMove(col(0), 1, col(2)), 'a red eight went on a red nine');
    assert(!g.canMove(col(0), 0, col(1)), 'a face-down card moved');
    assert(!g.canMove({ pile: 'waste' }, 0, col(3)), 'a buried waste card moved');
    assert(!g.canMove(col(1), 0, col(3)), 'a nine went on an empty column');
    assert(g.move(col(0), 1, col(1)), 'the red eight and black seven should go on the black nine');
    assert(g.tableau[1].length === 3 && g.tableau[0].length === 1 && g.tableau[0][0].up, 'the run did not move together, or the card beneath stayed face down');
    assert(!g.canMove({ pile: 'waste' }, 1, { pile: 'foundation', index: 0 }) === false, 'an ace should start a foundation');
    assert(g.autoMove({ pile: 'waste' }, 1)?.pile === 'foundation', 'the ace did not go to a foundation');
    assert(!g.canMove(col(1), 2, { pile: 'foundation', index: 0 }), 'a seven went on an ace');
    assert(g.autoMove({ pile: 'waste' }, 0)?.pile === 'tableau' && g.tableau[3][0].rank === 13, 'the king did not go to an empty column');
    assert(g.bestTarget(col(3), 0) === null, 'a king alone in a column should not hop to another empty one');
    assert(g.undo() && g.waste.length === 1 && g.tableau[3].length === 0, 'undo did not take the king back');
  }],
  ['solitaire is won when all four suits are built from ace to king', () => {
    const g = emptyTable();
    const suits = ['heart', 'diamond', 'spade', 'club'];
    suits.forEach((suit, i) => { for (let rank = 1; rank <= 12; rank++) g.foundations[i].push(card(rank, suit)); });
    suits.forEach((suit, i) => { g.tableau[i] = [card(13, suit)]; });
    assert(!g.won && g.canFinish, 'four kings from the end should be finishable but not yet won');
    let steps = 0;
    while (g.finishStep()) steps++;
    assert(steps === 4 && g.won && !g.canFinish, `expected 4 finishing moves and a win, got ${steps}`);
  }],
  ['winning a mini-game gives its reward each time, raises maximum health for good, and the object can be used again', () => {
    const deck = fakeObject({ use: 'interact', behaviour: 'minigame', game: 'solitaire', built: true, reward: { maxHp: 10 } }, true);
    const level = mapLevel(['............', '............', 'S...........', '############']);
    level.doc.entities = [{ type: 'object', id: 'deck', col: 2, row: 2 }];
    const world = new World(level, fighter(), QUIET, { 'object/deck': deck });
    walkTo(world, 2);
    let opened = null;
    runWorld(world, i => ({ interact: i % 5 === 0 }), 140, w => { opened ??= w.events.find(e => e.type === 'minigame'); w.events.length = 0; });
    assert(opened?.built && opened.game === 'solitaire', 'the solitaire object did not open its game');
    const object = world.objects[0], hero = world.hero;
    hero.hp = 50;
    world.openMinigame(object);
    const x = hero.body.x;
    runWorld(world, { right: true }, 30);
    assert(hero.body.x === x, 'the world did not wait while the mini-game was open');
    world.winMinigame(); world.winMinigame();
    assert(hero.maxHp === 120 && hero.hp === 70, `expected 120 maximum and 70 HP, got ${hero.maxHp} and ${hero.hp}`);
    assert(hero.bonus.maxHp === 20, 'the gain was not recorded to be kept');
    world.closeMinigame();
    assert(world.minigame === null && object.state === 'idle', 'the object cannot be used again');
  }]);

tests.push(
  ['health comes back over time, but only after a pause since the last injury', () => {
    const world = arena([], { hero: fighter({ stats: { hp: 100, mp: 100, mpRegen: 0, hpRegen: 2, hpRegenDelay: 3 } }), config: QUIET });
    world.hurtHero(40, { x: 0 });
    const hurt = world.hero.hp;
    assert(hurt === 60, `expected 60 HP after the hit, got ${hurt}`);
    runWorld(world, {}, 170);                                 // just under 3 seconds
    assert(world.hero.hp === 60, `healed during the pause: ${world.hero.hp}`);
    runWorld(world, {}, 130);                                 // 5 seconds in all: 2 seconds of healing
    assert(near(world.hero.hp, 64, 0.3), `expected about 64 HP, got ${world.hero.hp}`);
    runWorld(world, {}, 60 * 30);
    assert(world.hero.hp === 100, 'healing went past, or stopped short of, full health');
    const plain = arena([], { config: QUIET });
    plain.hurtHero(40, { x: 0 });
    runWorld(plain, {}, 600);
    assert(plain.hero.hp === 60, 'a hero with no hpRegen healed');
  }]);

tests.push(
  ['a MIDI file becomes notes timed in seconds, following tempo changes', () => {
    // One track, 96 ticks to the beat: 120 beats a minute, then 60 from the second beat on.
    const track = [
      0x00, 0xff, 0x03, 0x04, 0x74, 0x65, 0x73, 0x74,          // name "test"
      0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20,                // tempo: 500000 us a beat
      0x00, 0x90, 60, 100,                                     // middle C on at beat 0
      0x60, 0x80, 60, 0,                                       // off one beat later
      0x00, 0xff, 0x51, 0x03, 0x0f, 0x42, 0x40,                // tempo: 1000000 us a beat
      0x00, 0x90, 64, 127,                                     // E on at beat 1
      0x60, 64, 0,                                             // running status, loudness 0 = off, one beat later
      0x00, 0xff, 0x2f, 0x00];
    const bytes = new Uint8Array([0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, 0, 96,
      0x4d, 0x54, 0x72, 0x6b, 0, 0, 0, track.length, ...track]);
    const song = parseMidi(bytes);
    assert(song.notes.length === 2, `expected 2 notes, got ${song.notes.length}`);
    const [c, e] = song.notes;
    assert(c.n === 60 && near(c.t, 0, 0.001) && near(c.d, 0.5, 0.001), `first note wrong: ${JSON.stringify(c)}`);
    assert(e.n === 64 && near(e.t, 0.5, 0.001) && near(e.d, 1, 0.001) && e.v === 1, `second note wrong: ${JSON.stringify(e)}`);
    assert(near(song.duration, 1.5, 0.001) && song.names[0] === 'test', 'length or name wrong');
  }]);

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

// ------------------------------------------------------------------- boosts

tests.push(
  ['boosts change attack speed, movement, mana and toughness for a while', () => {
    const world = arena([], { config: QUIET });
    const hero = world.hero;
    hero.addBoost({ stat: 'attackSpeed', factor: 2, duration: 5 });
    let fired = -1;
    runWorld(world, i => ({ attack2: i === 0 }), 40, (w, i) => { if (fired < 0 && w.projectiles.length) fired = i; });
    assert(fired >= 5 && fired <= 7, `a doubled attack speed fired after ${fired} ticks, expected about 6`);

    const plain = arena([], { config: QUIET }), quick = arena([], { config: QUIET });
    quick.hero.addBoost({ stat: 'moveSpeed', factor: 1.5, duration: 5 });
    runWorld(plain, { dir: 1 }, 90); runWorld(quick, { dir: 1 }, 90);
    const ratio = (quick.hero.body.x - 48) / (plain.hero.body.x - 48);
    assert(ratio > 1.4 && ratio < 1.6, `expected to cover about 1.5 times the ground, got ${ratio.toFixed(2)}`);

    const tough = arena([], { config: QUIET });
    tough.hero.addBoost({ stat: 'toughness', factor: 2, duration: 5 });
    tough.hurtHero(20, { x: 0 });
    assert(tough.hero.hp === 90, `expected a halved hit to leave 90 HP, got ${tough.hero.hp}`);

    const focus = arena([], { config: QUIET });
    focus.hero.mp = 0; focus.hero.addBoost({ stat: 'mpRegen', factor: 5, duration: 5 });
    runWorld(focus, {}, 60);
    assert(near(focus.hero.mp, 20, 1), `expected about 20 MP after a second, got ${focus.hero.mp.toFixed(1)}`);
  }],
  ['a boost wears off, restarts when taken again, and is lost on dying', () => {
    const world = arena([], { config: QUIET });
    const hero = world.hero;
    hero.addBoost({ stat: 'damage', factor: 2, duration: 2 });
    runWorld(world, {}, 60);
    hero.addBoost({ stat: 'damage', factor: 2, duration: 2 });
    assert(hero.boosts.length === 1 && hero.boosts[0].time > 1.9, 'taking the boost again did not restart it');
    runWorld(world, {}, 130);
    assert(hero.boost('damage') === 1 && hero.boosts.length === 0, 'the boost did not wear off');
    hero.addBoost({ stat: 'damage', factor: 2, duration: 60 });
    world.hurtHero(999, { x: 0 });
    runWorld(world, {}, 150);
    assert(!hero.dead && hero.boosts.length === 0, 'the boost survived dying');
  }],
  ['a scroll can give one boost chosen from a list', () => {
    const scroll = fakeObject({ use: 'touch', behaviour: 'pickup', gives: { boostOneOf: [
      { stat: 'attackSpeed', factor: 1.6, duration: 15 }, { stat: 'moveSpeed', factor: 1.35, duration: 15 }] } });
    const seen = new Set();
    for (let i = 0; i < 12; i++) {
      const level = mapLevel(['............', '............', 'S...........', '############']);
      level.id = `scroll-${i}`;
      level.doc.entities = [{ type: 'object', id: 'scroll', col: 1, row: 2 }];
      const world = new World(level, fighter(), QUIET, { 'object/scroll': scroll });
      runWorld(world, { dir: 1 }, 60);
      assert(world.hero.boosts.length === 1, `expected one boost, got ${world.hero.boosts.length}`);
      seen.add(world.hero.boosts[0].stat);
    }
    assert(seen.size === 2, `expected both boosts to turn up over 12 tries, saw ${[...seen].join(', ')}`);
  }],
);

// -------------------------------------------------------------------- shops

const GOODS = {
  power: { kind: 'upgrade', stat: 'damage', perLevel: 0.5, maxLevel: 2, price: 10, priceGrowth: 2 },
  vitality: { kind: 'upgrade', stat: 'maxHp', perLevel: 20, maxLevel: 3, price: 10, priceGrowth: 1.5 },
  haste: { kind: 'upgrade', stat: 'attackSpeed', perLevel: 1, maxLevel: 1, price: 5 },
  draught: { kind: 'item', gives: { hpFraction: 1 }, price: 4 },
};
function fakeNpc(role = 'merchant', stock = ['power', 'vitality', 'haste', 'draught']) {
  const animations = Object.fromEntries(['idle', 'walk', 'wave', 'talk', 'sell'].map(s => [s, clip(s, ['idle', 'walk', 'talk'].includes(s))]));
  return { id: 'trader', kind: 'npc', animations, gameplay: { role, stock, box: { x: -24, y: -52, w: 48, h: 52 }, lines: { greet: ['Hello.'], talk: ['Nice day.'] } } };
}
/** A flat room with a merchant at column 3 and the hero carrying some gold. */
function market(gold, npc = fakeNpc()) {
  const level = mapLevel(['............', '............', 'S...........', '############']);
  level.doc.entities = [{ type: 'npc', id: 'trader', col: 3, row: 2 }, { type: 'enemy', id: 'dummy', col: 8, row: 2 }];
  const world = new World(level, fighter(), QUIET, { 'npc/trader': npc, 'enemy/dummy': dummy(), ...OBJECTS }, GOODS);
  world.hero.gold = gold;
  runWorld(world, {}, 5);
  return world;
}

tests.push(
  ['coins and gems give gold as well as score', () => {
    const rich = { 'object/coin': fakeObject({ use: 'touch', behaviour: 'pickup', gives: { score: 1, gold: 1 } }),
      'object/gem': fakeObject({ use: 'touch', behaviour: 'pickup', gives: { score: 10, gold: 10 } }) };
    const level = mapLevel(['............', '............', 'S...........', '############']);
    level.doc.entities = [{ type: 'object', id: 'coin', col: 2, row: 2 }, { type: 'object', id: 'gem', col: 3, row: 2 }];
    const world = new World(level, fighter(), QUIET, rich);
    walkTo(world, 4);
    assert(world.hero.gold === 11 && world.hero.score === 11, `expected 11 gold and 11 points, got ${world.hero.gold} and ${world.hero.score}`);
  }],
  ['a merchant greets a hero who comes near and offers a shop', () => {
    const world = market(0);
    let greeted = 0, shop = 0;
    const watch = w => { greeted += w.events.filter(e => e.type === 'npcGreet').length; shop += w.events.filter(e => e.type === 'shop').length; w.events.length = 0; };
    for (let i = 0; i < 200 && world.hero.body.x < 3.4 * TILE; i++) runWorld(world, { dir: 1 }, 1, watch);
    assert(greeted === 1, `expected one greeting, got ${greeted}`);
    assert(world.prompt?.isNpc, 'no prompt was offered at the merchant');
    runWorld(world, i => ({ interact: i === 0 }), 3, watch);
    assert(shop === 1, 'the interact key did not open the shop');
  }],
  ['an upgrade costs gold, grows dearer, stops at its limit and strengthens the hero', () => {
    const world = market(100), npc = world.npcs[0], hero = world.hero;
    assert(world.priceOf('power').price === 10, 'wrong first price');
    assert(world.buy(npc, 'power') === 'bought' && hero.gold === 90 && hero.upgrades.power === 1, 'the first purchase failed');
    assert(world.priceOf('power').price === 20, `expected the second level to cost 20, got ${world.priceOf('power').price}`);
    assert(world.buy(npc, 'power') === 'bought' && hero.gold === 70, 'the second purchase failed');
    assert(world.buy(npc, 'power') === 'maxed' && hero.gold === 70, 'bought past the limit');
    assert(hero.boost('damage') === 2, `expected doubled damage, got ${hero.boost('damage')}`);
    faceUp(world, world.enemies[0]);
    runWorld(world, i => ({ attack1: i === 0 }), 50);
    assert(world.enemies[0].hp === 10, `expected a 20-damage swing, enemy at ${world.enemies[0].hp}`);
  }],
  ['maximum health upgrades raise the maximum and arrive filled', () => {
    const world = market(100), hero = world.hero;
    hero.hp = 50;
    world.buy(world.npcs[0], 'vitality');
    assert(hero.maxHp === 120 && hero.hp === 70, `expected 70 of 120 HP, got ${hero.hp} of ${hero.maxHp}`);
    world.hurtHero(999, { x: 0 });
    runWorld(world, {}, 150);
    assert(hero.hp === 120 && hero.upgrades.vitality === 1, 'the upgrade was lost on dying');
  }],
  ['a hero without enough gold cannot buy, and items can be bought again', () => {
    const world = market(9), npc = world.npcs[0], hero = world.hero;
    assert(world.buy(npc, 'power') === 'poor' && hero.gold === 9 && !hero.upgrades.power, 'bought without enough gold');
    hero.hp = 10;
    assert(world.buy(npc, 'draught') === 'bought' && hero.hp === 100 && hero.gold === 5, 'the draught did not heal');
    hero.hp = 10;
    assert(world.buy(npc, 'draught') === 'bought' && hero.hp === 100 && hero.gold === 1, 'the draught could not be bought twice');
    assert(world.buy(npc, 'nonsense') === 'unavailable', 'bought something the merchant does not sell');
  }],
  ['the world waits while a shop is open', () => {
    const world = market(0);
    const enemy = world.enemies[0];
    world.hurtEnemy(enemy, 5, world.hero);
    world.openShop(world.npcs[0]);
    const x = world.hero.body.x, ex = enemy.body.x, tick = world.tick;
    runWorld(world, { dir: 1 }, 60);
    assert(world.hero.body.x === x && enemy.body.x === ex && world.tick === tick, 'the world kept moving during shopping');
    world.closeShop();
    runWorld(world, { dir: 1 }, 30);
    assert(world.hero.body.x > x, 'the world did not resume');
  }],
  ['someone who does not trade just talks', () => {
    const world = market(0, fakeNpc('talker', []));
    let talked = 0, shop = 0;
    const watch = w => { talked += w.events.filter(e => e.type === 'npcTalk').length; shop += w.events.filter(e => e.type === 'shop').length; w.events.length = 0; };
    for (let i = 0; i < 200 && world.hero.body.x < 3.4 * TILE; i++) runWorld(world, { dir: 1 }, 1, watch);
    runWorld(world, i => ({ interact: i === 0 }), 3, watch);
    assert(talked === 1 && shop === 0, 'a talker opened a shop or stayed silent');
  }],
  ['upgrades carried into a level take effect at once', () => {
    const level = mapLevel(['............', '............', 'S...........', '############']);
    const world = new World(level, fighter(), QUIET, {}, GOODS);
    world.hero.upgrades = { vitality: 2, haste: 1 };
    world.hero.applyUpgrades(GOODS);
    assert(world.hero.maxHp === 140 && world.hero.hp === 140, 'carried health upgrades were not applied');
    runWorld(world, {}, 5);                 // let the hero settle on the floor first
    let fired = -1;
    runWorld(world, i => ({ attack2: i === 0 }), 40, (w, i) => { if (fired < 0 && w.projectiles.length) fired = i; });
    assert(fired >= 5 && fired <= 7, `a carried haste upgrade fired after ${fired} ticks, expected about 6`);
  }],
);

// --------------------------------------------------------- mini-game objects

tests.push(
  ['a mini-game object opens its game once and stays in its held pose', () => {
    const table = fakeObject({ use: 'interact', behaviour: 'minigame', game: 'dice' }, true);
    const level = mapLevel(['............', '............', 'S...........', '############']);
    level.doc.entities = [{ type: 'object', id: 'table', col: 2, row: 2 }];
    const world = new World(level, fighter(), QUIET, { 'object/table': table });
    walkTo(world, 2);
    let opened = [];
    const watch = w => { opened.push(...w.events.filter(e => e.type === 'minigame')); w.events.length = 0; };
    runWorld(world, i => ({ interact: i === 0 }), 20, watch);
    assert(opened.length === 0, 'the mini-game opened before the interaction finished');
    runWorld(world, i => ({ interact: i % 5 === 0 }), 120, watch);
    assert(opened.length === 1 && opened[0].game === 'dice', `expected one "dice" mini-game to open, got ${opened.length}`);
    const object = world.objects[0];
    assert(object && object.state === 'used' && object.pose.slot === 'interact' && object.pose.frame === 5, 'the object did not hold its last frame');
  }],
);
