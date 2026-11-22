// Seeded level generator. Builds a level as a chain of sections — flat runs,
// climbs, drops, pits, platform bridges, stacks, ceilings, rests — ending in
// a boss arena, then checks that it can be completed on foot.
//
// Pure: needs only the tileset JSON and plain numbers, so it can run in the
// browser, in tests, or on a server. The same options always give the same level.

import { makeRng } from './random.js';
import { buildLevel } from './build.js';
import { checkReachable } from './reach.js';

const ROWS = 16;
const HIGHEST = 6;       // the floor never rises above this row…
const LOWEST = 11;       // …or sinks below this one

/** Rough threat of each enemy, used to spend the difficulty budget. */
export const ENEMY_COST = { normal_skeleton: 1, undead_wolf: 2, skeleton_knight: 2, wight: 3, lich: 3, death_knight: 4 };

/**
 * @param {object} options
 * @param {string|number} options.seed
 * @param {object} options.tileset     tileset JSON (tiles, groups, runs)
 * @param {string} options.tilesetId
 * @param {number} [options.length]    approximate width in tiles, before the boss arena
 * @param {number} [options.difficulty] 1 (gentle) to 5 (hard)
 * @param {string[]} [options.enemies] enemy ids that may appear
 * @param {string[]} [options.bosses]  boss ids to choose from
 * @param {{maxRise?: number, maxGap?: number}} [options.limits] what every hero can do, in tiles
 * @returns {{doc: object, map: string[], seed: string, attempts: number}}
 */
export function generateLevel(options) {
  const seed = String(options.seed);
  // If a layout ever fails the completion check, try the next one in the seed's own sequence.
  for (let attempt = 0; attempt < 20; attempt++) {
    const result = attemptLevel({ ...options, seed }, attempt);
    if (result) return { ...result, seed, attempts: attempt + 1 };
  }
  throw new Error(`Could not build a completable level from seed "${seed}".`);
}

function attemptLevel(options, attempt) {
  const { seed, tileset, tilesetId } = options;
  const length = options.length ?? 120;
  const difficulty = Math.max(1, Math.min(5, options.difficulty ?? 1));
  const rng = makeRng(attempt ? `${seed}#${attempt}` : seed);
  const hasCeiling = Object.values(tileset.tiles).some(t => t.shape === 'rect' && t.rect[2] === 96 && t.rect[3] < 96);
  const enemyPool = (options.enemies ?? Object.keys(ENEMY_COST)).filter(id => ENEMY_COST[id]);
  const bosses = options.bosses ?? [];

  /** One entry per column: the floor's surface row (null for a pit) and extra cells. */
  const columns = [];
  const entities = [];
  let floor = 10;                 // row of the floor's top tile
  const col = () => columns.length;
  const add = (surface = floor, extra = {}) => { columns.push({ surface, extra }); };
  const flat = n => { for (let i = 0; i < n; i++) add(); };
  const put = (type, id, column, row, more = {}) => entities.push({ type, id, col: column, row, ...more });
  const progress = () => Math.min(1, col() / length);

  /** Spend the difficulty budget on enemies standing on a flat stretch. */
  const guard = (from, to, scale = 1) => {
    if (!enemyPool.length || from < 8 || to - from < 2) return;
    let budget = Math.round((0.4 + difficulty * 0.8) * (0.6 + progress()) * scale);
    const affordable = () => enemyPool.filter(id => ENEMY_COST[id] <= budget && ENEMY_COST[id] <= 1 + difficulty);
    const spots = [];
    for (let c = from + 1; c <= to; c += difficulty >= 4 ? 1 : 2) spots.push(c);
    while (budget > 0 && spots.length && affordable().length) {
      const id = rng.pick(affordable());
      const spot = spots.splice(rng.int(0, spots.length - 1), 1)[0];
      put('enemy', id, spot, floor - 1);
      budget -= ENEMY_COST[id];
    }
  };
  let gates = 0;
  /** A wall with a two-tile opening at floor level, closed by a gate. */
  const doorway = (id, locked) => {
    const wall = {};
    for (let r = 0; r <= floor - 3; r++) wall[r] = '#';
    add(floor, wall);
    entities.push({ type: 'gate', id, col: col() - 1, row: floor - 2, height: 2, ...(locked ? { locked: true } : {}) });
  };
  const coins = (from, to, row) => { for (let c = from; c <= to; c++) put('object', 'gold_coin', c, row); };

  // ---- sections. Each leaves the floor walkable at its last column.
  const sections = {
    run() {
      const n = rng.int(3, 7), from = col();
      flat(n);
      if (rng.chance(0.3)) put('object', rng.pick(['wooden_crate', 'barrel', 'burial_urn']), from + rng.int(1, n - 2), floor - 1);
      guard(from, from + n - 1);
    },
    climb() {                      // stairs or a slope, one to three flights
      for (let i = rng.int(1, Math.min(3, floor - HIGHEST)); i > 0; i--) { add(floor, { [floor - 1]: '/' }); floor--; }
      flat(rng.int(2, 3));
    },
    descend() {
      for (let i = rng.int(1, Math.min(3, LOWEST - floor)); i > 0; i--) { add(floor + 1, { [floor]: '\\' }); floor++; }
      flat(rng.int(2, 3));
    },
    ledgeUp() { floor--; flat(rng.int(3, 4)); },
    ledgeDown() { floor += rng.int(1, Math.min(2, LOWEST - floor)); flat(rng.int(3, 4)); },
    pit() {
      const from = col();
      add(null);
      coins(from, from, floor - 2);
      flat(2);
      if (difficulty >= 3 && rng.chance(0.5)) { add(null); flat(2); }
    },
    bridge() {                     // a long pit crossed on platforms level with the floor
      const spans = rng.int(1, 2 + (difficulty > 2 ? 1 : 0));
      for (let i = 0; i < spans; i++) {
        add(null);
        add(null, { [floor]: '=' });
        put('object', 'gold_coin', col() - 1, floor - 1);
      }
      add(null);
      flat(3);
    },
    stack() {                      // platforms climbing to a reward
      const from = col(), n = 7;
      flat(n);
      const c = from + 1;
      Object.assign(columns[c].extra, { [floor - 1]: '=' });
      Object.assign(columns[c + 1].extra, { [floor - 1]: '=' });
      Object.assign(columns[c + 2].extra, { [floor - 2]: '=' });
      Object.assign(columns[c + 3].extra, { [floor - 2]: '=' });
      put('object', rng.weighted([[4, 'gem'], [2, 'healing_potion'], [2, 'space_potion'], [1, 'treasure_chest'], [1, 'spell_scroll']]), c + 3, floor - 3);
      guard(from + 4, from + n - 1, 0.6);
    },
    ceiling() {                    // a low-roofed stretch; jumping bumps the roof
      // Open floor at both ends: a jump cannot be made, or landed, under the roof.
      const n = rng.int(4, 6), from = col() + 2;
      flat(n + 4);
      for (let c = from; c < from + n; c++) columns[c].extra[floor - 2] = '^';
      guard(from, from + n - 1);
    },
    lock() {                       // a gate in a doorway, opened by a lever on the near side
      const from = col(), id = `gate-${++gates}`;
      flat(3);
      put('object', 'lever', from + 1, floor - 1, { link: id });
      doorway(id, false);
      flat(3);
    },
    keyLock() {                    // a locked gate; its key waits on a platform before it
      const from = col(), id = `gate-${++gates}`;
      flat(5);
      Object.assign(columns[from + 1].extra, { [floor - 1]: '=' });
      Object.assign(columns[from + 2].extra, { [floor - 1]: '=' });
      put('object', 'iron_key', from + 2, floor - 2);
      doorway(id, true);
      flat(3);
    },
    rest() {                       // a quiet stretch with a checkpoint
      const from = col();
      flat(4);
      put('object', 'checkpoint_flag', from + 1, floor - 1);
      if (rng.chance(0.35)) put('object', 'healing_shrine', from + 3, floor - 1);
    },
  };

  // ---- start
  flat(6);
  const spawn = { col: 2, row: floor - 1 };
  let sinceRest = 0, last = 'run';
  while (col() < length) {
    if (sinceRest > 26) { sections.rest(); sinceRest = 0; last = 'rest'; continue; }
    const before = col();
    const hazard = last === 'pit' || last === 'bridge';
    const name = rng.weighted([
      [5, 'run'],
      [floor > HIGHEST ? 3 : 0, 'climb'],
      [floor < LOWEST ? 3 : 0, 'descend'],
      [floor > HIGHEST ? 1.5 : 0, 'ledgeUp'],
      [floor < LOWEST ? 1.5 : 0, 'ledgeDown'],
      [hazard ? 0 : 1 + difficulty * 0.5, 'pit'],
      [hazard ? 0 : 0.6 + difficulty * 0.4, 'bridge'],
      [last === 'stack' ? 0 : 1.5, 'stack'],
      [hasCeiling && last !== 'ceiling' ? 1 : 0, 'ceiling'],
      [gates < 2 && col() > 20 && last !== 'lock' && last !== 'keyLock' ? 0.7 : 0, rng.chance(0.5) ? 'lock' : 'keyLock'],
    ]);
    sections[name]();
    sinceRest += col() - before;
    last = name;
  }

  // ---- boss arena: a checkpoint, then a wide flat floor
  sections.rest();
  const arenaStart = col();
  flat(16);
  if (bosses.length) put('boss', rng.pick(bosses), arenaStart + 11, floor - 1);
  const goal = { col: arenaStart + 14, row: floor - 1 };
  put('object', 'dungeon_relic', goal.col, goal.row, { appears: 'boss_defeated' });

  // ---- write the character map
  const grid = Array.from({ length: ROWS }, () => Array(columns.length).fill('.'));
  columns.forEach((column, c) => {
    if (column.surface !== null) for (let r = column.surface; r < ROWS; r++) grid[r][c] = '#';
    for (const [row, ch] of Object.entries(column.extra)) grid[row][c] = ch;
  });
  grid[spawn.row][spawn.col] = 'S';
  const map = grid.map(r => r.join(''));

  if (!checkReachable(map, spawn, goal, options.limits).ok) return null;
  // Whatever opens a gate must be reachable while that gate is still shut.
  for (const gate of entities.filter(e => e.type === 'gate')) {
    const opener = entities.find(e => (e.link === gate.id) || (gate.locked && e.id === 'iron_key' && e.col < gate.col && e.col > gate.col - 8));
    const shut = map.map((line, r) => (r >= gate.row && r < gate.row + gate.height ? line.slice(0, gate.col) + '#' + line.slice(gate.col + 1) : line));
    if (!opener || !checkReachable(shut, spawn, opener, options.limits).ok) return null;
  }

  const doc = buildLevel({ id: `random-${seed}`, name: 'Random dungeon', tileset, tilesetId, map });
  doc.entities = entities;
  doc.regions = [{ type: 'boss_arena', col: arenaStart, row: 0, cols: 16, rows: ROWS }];
  doc.generator = { seed, length, difficulty, tileset: tilesetId, attempt };
  return { doc, map, goal };
}
