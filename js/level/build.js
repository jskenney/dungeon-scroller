// Builds a level document from a simple character map, choosing the right
// tile art for each cell from any tileset ("auto-tiling"). Pure: it needs
// only the tileset JSON, so the level generator and tools can share it.
//
// Map characters:
//   #  ground or wall block        =  one-way platform
//   /  stairs or slope rising right   \  rising left
//   [  thin wall on the left of the cell    ]  on the right
//   ^  ceiling strip               S  hero start (stands on the cell below)
//   .  empty

function hash(col, row) {
  let n = (col * 73856093) ^ (row * 19349663);
  n = (n ^ (n >>> 13)) * 1274126177;
  return (n ^ (n >>> 16)) >>> 0;
}

export function buildLevel({ id, name, tileset, tilesetId, map, music = null, rules = undefined }) {
  const rows = map.length, cols = Math.max(...map.map(r => r.length));
  const at = (c, r) => (r < 0 || r >= rows || c < 0 || c >= cols ? '#' : (map[r][c] ?? '.'));
  const tiles = tileset.tiles;
  const members = ref => tileset.groups?.[ref] ?? (tiles[ref] ? [ref] : []);
  const pick = (ref, c, r) => { const m = members(ref); return m[hash(c, r) % m.length]; };
  const byShape = shape => Object.keys(tiles).find(t => tiles[t].shape === shape);
  const byRect = (test, word) => Object.keys(tiles).filter(t => tiles[t].shape === 'rect' && test(tiles[t].rect))
    .sort((a, b) => Number(b.includes(word)) - Number(a.includes(word)))[0];

  const runs = Object.values(tileset.runs ?? {});
  const ground = runs.find(r => r.below) ?? runs[0];
  const deck = runs.find(r => tiles[members(r.center)[0]]?.shape === 'platform');
  const riseRight = byShape('stairs_right') ?? byShape('slope_right');
  const riseLeft = byShape('stairs_left') ?? byShape('slope_left');
  const wallLeft = byRect(q => q[0] === 0 && q[2] < 96 && q[3] === 96, 'wall');
  const wallRight = byRect(q => q[0] > 0 && q[3] === 96, 'wall');
  const ceiling = word => byRect(q => q[2] === 96 && q[3] < 96, word);
  const background = (tileset.groups?.background ?? []);
  const plainBack = background.filter(t => !t.includes('recess'));
  const recess = background.find(t => t.includes('recess'));

  const palette = [''];
  const index = tileId => {
    if (!tileId) return 0;
    let i = palette.indexOf(tileId);
    if (i < 0) { palette.push(tileId); i = palette.length - 1; }
    return i;
  };
  const groundish = ch => ch === '#' || ch === '/' || ch === '\\';
  const terrain = [], back = [];
  let spawn = null;

  for (let r = 0; r < rows; r++) {
    const tRow = [], bRow = [];
    for (let c = 0; c < cols; c++) {
      const ch = at(c, r);
      let tile = '';
      if (ch === '#') {
        if (groundish(at(c, r - 1))) tile = pick(ground.below ?? ground.center, c, r);
        else {
          const left = groundish(at(c - 1, r)), right = groundish(at(c + 1, r));
          tile = left && right ? pick(ground.center, c, r) : !left && !right ? pick(ground.single ?? ground.center, c, r)
            : left ? pick(ground.right, c, r) : pick(ground.left, c, r);
        }
      } else if (ch === '=' && deck) {
        const left = at(c - 1, r) === '=', right = at(c + 1, r) === '=';
        tile = left && right ? pick(deck.center, c, r) : !left && !right ? pick(deck.single ?? deck.center, c, r)
          : left ? pick(deck.right, c, r) : pick(deck.left, c, r);
      } else if (ch === '/') tile = riseRight;
      else if (ch === '\\') tile = riseLeft;
      else if (ch === '[') tile = wallLeft ?? pick(ground.below ?? ground.center, c, r);
      else if (ch === ']') tile = wallRight ?? pick(ground.below ?? ground.center, c, r);
      else if (ch === '^') {
        const left = at(c - 1, r) === '^', right = at(c + 1, r) === '^';
        tile = (left && right ? ceiling('center') : left ? ceiling('right') : right ? ceiling('left') : ceiling('center'))
          ?? pick(ground.below ?? ground.center, c, r);
      } else if (ch === 'S') spawn = { col: c, row: r };
      tRow.push(index(tile));
      // Backdrop behind everything that is not a full block.
      const full = tiles[tile]?.shape === 'solid';
      const open = r > 0 && r < rows - 1 && hash(c, r) % 19 === 0 && recess && at(c, r) === '.';
      bRow.push(full || !plainBack.length ? 0 : index(open ? recess : plainBack[hash(c + 7, r + 3) % plainBack.length]));
    }
    terrain.push(tRow); back.push(bRow);
  }
  if (!spawn) throw new Error(`Level "${id}" has no start position (S).`);
  const doc = { schema: 'dungeon-scroller/level@1', id, name, tileset: tilesetId, size: { cols, rows }, palette,
    layers: { background: back, terrain }, spawn, entities: [], music };
  if (rules) doc.rules = rules;
  return doc;
}

/** Level JSON text with one map row per line, so the files stay readable. */
export function levelToJson(doc) {
  const rowsText = rows => '[\n' + rows.map(r => '      [' + r.join(', ') + ']').join(',\n') + '\n    ]';
  const { layers, ...rest } = doc;
  const head = JSON.stringify(rest, null, 2).replace(/\n\}$/, '');
  const layerText = Object.entries(layers).map(([name, rows]) => `    ${JSON.stringify(name)}: ${rowsText(rows)}`).join(',\n');
  return `${head},\n  "layers": {\n${layerText}\n  }\n}\n`;
}
