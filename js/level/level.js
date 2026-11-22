// A playable level: tile layers for drawing and a collision grid for the
// simulation. Pure data and maths — no rendering, no DOM.
//
// World units are art pixels. x grows right, y grows down. A tile is 96 units.

export const TILE = 96;

/** Collision for one cell: solid rectangles, a one-way platform, or a 45° slope. */
function cellShape(tile) {
  switch (tile?.shape) {
    case 'solid': return { kind: 'solid', rects: [[0, 0, TILE, TILE]] };
    case 'rect': { const [x, y, w, h] = tile.rect; return { kind: 'solid', rects: [[x, y, x + w, y + h]] }; }
    case 'platform': return { kind: 'platform', rects: [[0, 0, TILE, 16]] };
    case 'stairs_right': return { kind: 'solid', rects: [0, 1, 2, 3, 4, 5].map(i => [i * 16, 80 - i * 16, i * 16 + 16, TILE]) };
    case 'stairs_left': return { kind: 'solid', rects: [0, 1, 2, 3, 4, 5].map(i => [i * 16, i * 16, i * 16 + 16, TILE]) };
    case 'slope_right': return { kind: 'slope', dir: 1 };     // low on the left, high on the right
    case 'slope_left': return { kind: 'slope', dir: -1 };     // high on the left, low on the right
    default: return null;
  }
}

export class Level {
  /**
   * @param {object} doc      level document (schema dungeon-scroller/level@1)
   * @param {object} tileset  tileset JSON; only `tiles[id].shape` and `.rect` are used here
   */
  constructor(doc, tileset) {
    this.doc = doc;
    this.id = doc.id;
    this.name = doc.name ?? doc.id;
    this.cols = doc.size.cols;
    this.rows = doc.size.rows;
    this.width = this.cols * TILE;
    this.height = this.rows * TILE;
    this.tileset = tileset;
    this.palette = doc.palette;
    this.layers = doc.layers;
    this.spawn = { x: (doc.spawn.col + 0.5) * TILE, y: (doc.spawn.row + 1) * TILE };
    const shapes = this.palette.map(id => (id ? cellShape(tileset.tiles[id]) : null));
    const source = doc.layers.collision ?? doc.layers.terrain;
    /** @type {(ReturnType<typeof cellShape>)[]} one entry per cell, row by row */
    this.cells = new Array(this.cols * this.rows).fill(null);
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) this.cells[row * this.cols + col] = shapes[source[row][col]] ?? null;
    }
  }

  /** Problems in a level document, as readable strings (empty when it is fine). */
  static validate(doc, tileset) {
    const problems = [];
    if (!doc.size?.cols || !doc.size?.rows) return ['size.cols and size.rows are required.'];
    if (!Array.isArray(doc.palette) || doc.palette[0] !== '') problems.push('palette must be a list whose first entry is "" (empty).');
    for (const id of doc.palette ?? []) if (id && !tileset?.tiles[id]) problems.push(`palette tile "${id}" is not in the tileset.`);
    if (!doc.layers?.terrain) problems.push('layers.terrain is required.');
    for (const [name, rows] of Object.entries(doc.layers ?? {})) {
      if (rows.length !== doc.size.rows || rows.some(r => r.length !== doc.size.cols)) problems.push(`layer "${name}" is not ${doc.size.cols} × ${doc.size.rows}.`);
      else if (rows.some(r => r.some(v => !Number.isInteger(v) || v < 0 || v >= doc.palette.length))) problems.push(`layer "${name}" uses an index outside the palette.`);
    }
    const s = doc.spawn;
    if (!s || s.col < 0 || s.col >= doc.size.cols || s.row < 0 || s.row >= doc.size.rows) problems.push('spawn is missing or outside the level.');
    return problems;
  }

  cellAt(col, row) {
    if (row < 0 || row >= this.rows) return null;                 // open sky above, a pit below
    if (col < 0 || col >= this.cols) return WALL;                 // the sides of the level are walls
    return this.cells[row * this.cols + col];
  }

  /**
   * Solid and platform rectangles touching a region.
   * @returns {{l:number,t:number,r:number,b:number,kind:'solid'|'platform'}[]}
   */
  rectsIn(l, t, r, b) {
    const out = [];
    const c0 = Math.floor(l / TILE), c1 = Math.floor(r / TILE), r0 = Math.floor(t / TILE), r1 = Math.floor(b / TILE);
    for (let row = r0; row <= r1; row++) {
      for (let col = c0; col <= c1; col++) {
        const cell = this.cellAt(col, row);
        if (!cell || cell.kind === 'slope') continue;
        const ox = col * TILE, oy = row * TILE;
        for (const q of cell.rects) {
          const rect = { l: ox + q[0], t: oy + q[1], r: ox + q[2], b: oy + q[3], kind: cell.kind };
          if (rect.l < r && rect.r > l && rect.t < b && rect.b > t) out.push(rect);
        }
      }
    }
    return out;
  }

  /** Slope cells touching a region: {l, t, r, b, dir}. */
  slopesIn(l, t, r, b) {
    const out = [];
    const c0 = Math.floor(l / TILE), c1 = Math.floor(r / TILE), r0 = Math.floor(t / TILE), r1 = Math.floor(b / TILE);
    for (let row = r0; row <= r1; row++) {
      for (let col = c0; col <= c1; col++) {
        const cell = this.cellAt(col, row);
        if (cell?.kind === 'slope') out.push({ l: col * TILE, t: row * TILE, r: (col + 1) * TILE, b: (row + 1) * TILE, dir: cell.dir });
      }
    }
    return out;
  }
}

const WALL = { kind: 'solid', rects: [[0, 0, TILE, TILE]] };

/** Height of a slope's surface at world x (x must be within the slope's cell). */
export function slopeSurface(slope, x) {
  return slope.dir > 0 ? slope.b - (x - slope.l) : slope.t + (x - slope.l);
}
