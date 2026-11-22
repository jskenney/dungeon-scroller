// Can a level be completed? A cautious check on a level's character map:
// it only trusts moves any hero can certainly make, so a level that passes
// is completable on foot. Flight and teleport are never assumed.
//
// Moves trusted (with the default limits of 1 tile up and a 1-tile gap):
//   - walk to the next column at the same height, or down any drop
//   - jump up one tile onto the next column, or onto a platform overhead
//   - jump a one-tile gap to a surface at the same height or lower
//   - drop through a platform

const SOLID = new Set(['#', '/', '\\', '[', ']']);

/**
 * @param {string[]} map   rows of characters as used by build.js
 * @param {{col:number,row:number}} from  cell the hero stands in (not the floor cell)
 * @param {{col:number,row:number}} to
 * @param {{maxRise?: number, maxGap?: number}} [limits]  in tiles
 * @returns {{ok: boolean, reached: number, farthestCol: number}}
 */
export function checkReachable(map, from, to, limits = {}) {
  const maxRise = limits.maxRise ?? 1, maxGap = limits.maxGap ?? 1;
  const rows = map.length, cols = Math.max(...map.map(r => r.length));
  const at = (c, r) => (c < 0 || c >= cols ? '#' : r < 0 || r >= rows ? '.' : (map[r][c] ?? '.'));
  const solid = (c, r) => SOLID.has(at(c, r));
  /** Can a hero's body occupy this cell? (A ceiling strip leaves standing room.) */
  const open = (c, r) => !solid(c, r);
  /** Can a jump pass through this cell? */
  const airy = (c, r) => !solid(c, r) && at(c, r) !== '^';
  /** A hero in cell (c, r) is standing on something. */
  const stands = (c, r) => r + 1 < rows && c >= 0 && c < cols && open(c, r) && (solid(c, r + 1) || at(c, r + 1) === '=');
  /** The cell a hero ends up standing in when falling from (c, r), or null for a pit. */
  const landing = (c, r) => {
    for (let y = r; y < rows; y++) { if (!open(c, y)) return null; if (stands(c, y)) return y; }
    return null;
  };
  const key = (c, r) => r * cols + c;
  const start = landing(from.col, from.row), goalRow = landing(to.col, to.row);
  if (start === null || goalRow === null) return { ok: false, reached: 0, farthestCol: from.col };
  const seen = new Set([key(from.col, start)]);
  const queue = [[from.col, start]];
  let farthestCol = from.col;
  const visit = (c, r) => {
    if (r === null || c < 0 || c >= cols || seen.has(key(c, r))) return;
    seen.add(key(c, r)); queue.push([c, r]);
    if (c > farthestCol) farthestCol = c;
  };
  while (queue.length) {
    const [c, r] = queue.shift();
    for (const d of [-1, 1]) {
      // Walk or drop into the next column.
      if (open(c + d, r)) visit(c + d, landing(c + d, r));
      // Jump up onto the next column.
      for (let up = 1; up <= maxRise; up++) {
        const clear = Array.from({ length: up }, (_, i) => airy(c, r - 1 - i) && open(c + d, r - 1 - i)).every(Boolean);
        if (clear && stands(c + d, r - up)) visit(c + d, r - up);
      }
      // Jump a gap to the same height or lower.
      for (let gap = 1; gap <= maxGap; gap++) {
        let clear = airy(c, r - 1);
        for (let i = 1; i <= gap; i++) clear = clear && open(c + d * i, r) && airy(c + d * i, r - 1);
        const far = c + d * (gap + 1);
        if (clear && open(far, r) && airy(far, r - 1)) visit(far, landing(far, r));
      }
    }
    // Jump up onto a platform overhead.
    for (let up = 1; up <= maxRise; up++) {
      if (!airy(c, r - up)) break;
      if (at(c, r - up + 1) === '=' && up >= 1 && stands(c, r - up)) visit(c, r - up);
    }
    // Drop through the platform being stood on.
    if (at(c, r + 1) === '=') visit(c, landing(c, r + 1));
  }
  return { ok: seen.has(key(to.col, goalRow)), reached: seen.size, farthestCol };
}
