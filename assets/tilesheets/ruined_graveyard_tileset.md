# Ruined Graveyard — Terrain Tileset Guide

## 1. Asset and contents

This guide describes the final **`ruined_graveyard_tileset.png`**: a modular set for the ruined graveyard outside the stone dungeon. Its foreground uses muted olive turf, dark brown soil, exposed roots, and moss-covered charcoal and slate-gray masonry. Thin surface highlights identify walkable tops. The entrance, platforms, retaining walls, and ruins share the dungeon's stone treatment. Headstones, a two-piece dead tree, fencing, brambles, and rubble provide transparent scenery overlays.

| Property | Value |
|---|---|
| Image filename | `ruined_graveyard_tileset.png` |
| Canvas | 768 × 480 pixels |
| Grid | 8 columns × 5 rows |
| Extraction size | 96 × 96 pixels for every tile |
| Tile slots | 40: 39 contain artwork; one is intentionally empty |
| Empty slot | Row 4, column 5; zero-based index 28 |
| Format | RGBA PNG; alpha values are 0 or 255 |
| Perspective | Straight side view |
| Sheet margin and inter-cell spacing | 0 pixels |
| Flat walking-surface height | Cell-local boundary y = 0 |
| Platform deck | Opaque pixels y = 0–15; 16 pixels thick |
| Verified SHA-256 | `e8fb94b0908da0a04cd6cf5cdfaac2e6fbb04c75db8d61f553eb545a6870f8dc` |

These are **static terrain and scenery tiles**, so there are no animation rows or playback timings. Adjacent cells represent different construction pieces. Choose a variation when building the map and keep that choice stable while rendering.

The 96 × 96 extraction rectangle includes each tile's empty space. Full ground and wall blocks reach the cell edges; props and openings contain transparent pixels. Preserve the complete rectangle instead of trimming each piece to its visible bounds. The PNG stores pixels only: the tile names, placement functions, collision suggestions, and layer choices in this guide are implementation recommendations, not embedded metadata.

## 2. Coordinates and tile locations

Human-readable **rows and columns start at 1**. Pixel coordinates and flattened tile indices start at **0**. The origin is the image's top-left; x increases to the right and y downward. Rectangle notation is **`(x, y, width, height)`**, with the right and bottom edges excluded.

For row `r` and column `c`:

```text
x = (c - 1) * 96
y = (r - 1) * 96
rectangle = (x, y, 96, 96)
tileIndex = (r - 1) * 8 + (c - 1)
```

| Column | Zero-based column | x | Covered x pixels |
|---:|---:|---:|---|
| 1 | 0 | 0 | 0–95 |
| 2 | 1 | 96 | 96–191 |
| 3 | 2 | 192 | 192–287 |
| 4 | 3 | 288 | 288–383 |
| 5 | 4 | 384 | 384–479 |
| 6 | 5 | 480 | 480–575 |
| 7 | 6 | 576 | 576–671 |
| 8 | 7 | 672 | 672–767 |

| Row | Contents | y | Flat indices |
|---:|---|---:|---|
| 1 | Grassy ground and soil fills | 0 | 0–7 |
| 2 | Raised stone platforms | 96 | 8–15 |
| 3 | Slopes, landings, and retaining walls | 192 | 16–23 |
| 4 | Six entrance pieces and two ruin pieces | 288 | 24–31 |
| 5 | Graveyard scenery | 384 | 32–39 |

For example, the right-rising slope is **R3 C1**, rectangle **`(0, 192, 96, 96)`**, index **16**. The empty doorway slot is **R4 C5**, rectangle **`(384, 288, 96, 96)`**, index **28**. Keep that slot in the atlas even though drawing it has no visible effect. Section 7 lists all 40 exact source rectangles.

## 3. Tile catalog

The following names are stable identifiers used by the example code. “Horizontal” and “vertical” describe useful map repetition, not an instruction to animate the tile. A prop's empty outer columns can match its opposite edge without making it a seamless repeating material.

| Row / column | Tile ID | Tile | Repetition / role | Visible content and use |
|---|---|---|---|---|
| R1 C1 | `grass_left_cliff` | Left cliff edge | End piece | Flat turf over rooted soil; exposed left edge, connection on the right. |
| R1 C2 | `grass_center_a` | Grassy center A | Horizontal | Main repeatable olive turf and brown soil surface. |
| R1 C3 | `grass_right_cliff` | Right cliff edge | End piece | Exposed right edge; connects to a surface tile on the left. |
| R1 C4 | `grass_standalone` | Standalone ground block | Single block | Both outside edges exposed; the walking surface remains flat. |
| R1 C5 | `grass_center_b` | Grassy center B | Horizontal | Alternate roots and soil detail within the shared surface border. |
| R1 C6 | `bare_path_center` | Bare-path center | Horizontal | Packed earth interior beneath the same thin shared top rim. |
| R1 C7 | `soil_fill_a` | Soil fill A | Horizontal and vertical | Opaque soil for depth below surfaces; no grass lip. |
| R1 C8 | `soil_fill_b` | Soil fill B | Horizontal and vertical | Alternate soil texture with the same boundary as fill A. |
| R2 C1 | `platform_left_cap` | Platform left cap | End piece | Mossy dungeon-stone deck with an exposed left end. |
| R2 C2 | `platform_center_a` | Platform center A | Horizontal | Repeatable 16-pixel-thick stone deck. |
| R2 C3 | `platform_right_cap` | Platform right cap | End piece | Matching deck with an exposed right end. |
| R2 C4 | `platform_standalone` | Standalone platform | Single platform | Both end treatments in one 96-pixel-wide deck. |
| R2 C5 | `platform_center_b` | Platform center B | Horizontal | Alternate interior wear and moss; shared connection pixels. |
| R2 C6 | `platform_cracked_center` | Cracked platform center | Horizontal | Interior crack without a gap in the walking silhouette. |
| R2 C7 | `platform_left_support` | Left support bracket | Deck joins horizontally | Complete deck plus a brace underneath its left side. |
| R2 C8 | `platform_right_support` | Right support bracket | Deck joins horizontally | Complete deck plus the corresponding right-side brace. |
| R3 C1 | `slope_rising_right` | Slope rising right | Ramp connector | Straight grassy diagonal from the low left corner to the high right corner. |
| R3 C2 | `slope_rising_left` | Slope rising left | Ramp connector | Mirrored grassy diagonal, high on the left and low on the right. |
| R3 C3 | `grass_lower_landing` | Lower grassy landing | Horizontal surface | Same pixels as grassy center A; use on the low approach. |
| R3 C4 | `grass_upper_landing` | Upper grassy landing | Horizontal surface | Same pixels as grassy center B; use at the high exit. |
| R3 C5 | `stone_lower_landing` | Lower stone landing | Horizontal surface | Full masonry block with a walkable top; use at the low approach. |
| R3 C6 | `stone_upper_landing` | Upper stone landing | Horizontal surface | Matching full masonry block for an upper landing. |
| R3 C7 | `retaining_wall_left` | Left retaining-wall face | Vertical | 24-pixel stone strip at the left of its cell; open space on the right. |
| R3 C8 | `retaining_wall_right` | Right retaining-wall face | Vertical | 24-pixel stone strip at the right; open space on the left. |
| R4 C1 | `entrance_arch_left` | Left arch corner | Entrance assembly | Left third of the wide entrance crown, curving into its left jamb. |
| R4 C2 | `entrance_arch_keystone` | Arch keystone | Entrance assembly | Middle third of the crown, with the central wedge and open space below. |
| R4 C3 | `entrance_arch_right` | Right arch corner | Entrance assembly | Right third of the crown, curving into its right jamb. |
| R4 C4 | `entrance_jamb_left` | Left door jamb | Vertical / entrance assembly | 32-pixel strip at the far left of the assembled entrance. |
| R4 C5 | `entrance_opening` | Center doorway opening | Intentionally empty | Fully transparent slot reserved for the open passage or a separate door. |
| R4 C6 | `entrance_jamb_right` | Right door jamb | Vertical / entrance assembly | 32-pixel strip at the far right of the assembled entrance. |
| R4 C7 | `ruin_wall` | Vertical stone wall | Vertical | Full-cell masonry used below the broken top or in tall ruins. |
| R4 C8 | `ruin_wall_broken_top` | Broken wall top | Cap for ruin wall | Jagged stone edge with transparency above; bottom joins the wall. |
| R5 C1 | `headstone_upright` | Upright headstone | Individual prop | Weathered slate marker with a worn carving and moss at its base. |
| R5 C2 | `headstone_leaning` | Leaning headstone | Individual prop | Tilted marker in the same stone family. |
| R5 C3 | `headstone_broken` | Broken headstone | Individual prop | Short fractured marker with an uneven broken top. |
| R5 C4 | `dead_tree_trunk` | Dead tree trunk | Tree lower half | Gnarled trunk and roots; connects to the branch tile above. |
| R5 C5 | `dead_tree_branches` | Dead branches | Tree upper half | Bare crown with a matching stem at its bottom. |
| R5 C6 | `broken_iron_fence` | Broken iron fence | Individual prop | Tarnished uprights, rails, and broken spikes with transparent gaps. |
| R5 C7 | `bramble_tuft` | Bramble tuft | Individual prop | Low tangle of olive-brown thorns. |
| R5 C8 | `loose_rubble` | Loose rubble | Individual prop | Low pile of chipped dungeon-gray stones with a little moss. |

## 4. Construction and alignment

### Ground, fills, and surface variants

Build a ground run with a left cliff edge, as many center tiles as needed, then a right cliff edge. Use the standalone tile for a one-cell island. Centers A, B, and the bare path share an identical four-pixel perimeter, so their interior variations can be mixed without changing the connection or walking silhouette. The bare path keeps the common thin rim while its interior is mostly packed earth.

Soil fills A and B repeat in both axes and share the same four-pixel perimeter. Stack them beneath ground to add depth. The surface blocks' final pixel row matches the fills' first row; the fills introduce no second grass lip. Avoid placing another surface tile below a surface merely to add thickness, because that would draw turf inside the ground.

The lower grassy landing is byte-identical to grassy center A, and the upper grassy landing is byte-identical to grassy center B. Their names describe their role beside a slope. All four landing tiles have the same local top at **y = 0**; the map's row determines their elevation.

Both stone landings have four-pixel perimeters that are byte-identical to **R1 C2 of `old_stone_dungeon_tileset.png`**, the dungeon's floor center A. Their interior masonry varies, but those connections let a graveyard stone landing meet that dungeon floor family. These stone landings are full 96 × 96 blocks, rather than thin decks.

### Raised platforms and retaining faces

Every row-2 tile includes a straight deck occupying opaque pixels **y = 0–15**. Center A, center B, and cracked center share identical four-pixel perimeter bands. Caps preserve their connecting side; the standalone platform supplies both end treatments. The cracked variant's crack is decorative and does not interrupt the top silhouette.

Each support tile already includes the deck. Place it as a platform tile within the platform row; adding another deck on top would double the artwork. The brace occupies some pixels down to **y = 55**, with transparent space around it and below it. Treat the brace as decoration unless a deliberate collision rule says otherwise.

The retaining faces are separate, vertically repeatable strips. The left face occupies local **x = 0–23**, with open space to its right. The right face occupies **x = 72–95**, with open space to its left. Stack the same face downward to make a tall exposed retaining edge. Their height repeats; neither strip contains an extra grass or floor cap.

### Continuous slopes

Each slope rises **96 pixels over 96 pixels of horizontal travel**, a 45-degree ramp. These are continuous pixel diagonals. The exact opaque masks, using integer pixel coordinates `x,y` from 0 through 95, are:

| Slope | Opaque pixels | Suggested continuous collision surface |
|---|---|---|
| Rising right, R3 C1 | `y >= 95 - x` | `surfaceY = 96 - localX` |
| Rising left, R3 C2 | `y >= x` | `surfaceY = localX` |

The collision equations use tile-boundary coordinates, with `localX` ranging from 0 to 96. The one-pixel difference in the right-ramp mask comes from sampling the diagonal at pixel centers. Keep grass and root detail out of the collision calculation; the ramp shape remains unchanged by those details.

With the ramp at map cell `(gx, gy)`, place its landings as follows. Map coordinates here are zero-based tile positions, not source-atlas coordinates.

| Assembly | Left neighbor | Ramp | Right neighbor |
|---|---|---|---|
| Rising right | Lower landing at `(gx−1, gy+1)` | R3 C1 at `(gx, gy)` | Upper landing at `(gx+1, gy)` |
| Rising left | Upper landing at `(gx−1, gy)` | R3 C2 at `(gx, gy)` | Lower landing at `(gx+1, gy+1)` |

The lower approach is one map row below the upper exit. Choose grassy or stone landing artwork for the intended transition. Add soil beneath the ramp and landings where the terrain should continue downward. Adjacent high and low surfaces remain horizontal; there is no per-tile vertical offset hidden inside the landing art.

### Six-piece dungeon entrance

The first six cells of source row 4 assemble into a **three-column by two-row entrance**, measuring **288 × 192 pixels**. Place them in this arrangement:

| Assembled row | Left column | Middle column | Right column |
|---|---|---|---|
| Top | R4 C1 — left arch corner | R4 C2 — keystone | R4 C3 — right arch corner |
| Bottom | R4 C4 — left jamb | R4 C5 — transparent opening | R4 C6 — right jamb |

For an entrance whose upper-left world position is `(entranceX, entranceY)`, the crown pieces start at x offsets **0, 96, 192** and y offset **0**. The lower pieces use the same x offsets and y offset **96**. Its lower boundary is `entranceY + 192`; place the ground surface there to make the entrance flush with the ground.

The left jamb fills local x = 0–31 in its cell. The right jamb fills local x = 64–95 in the right cell. This leaves a **224-pixel-wide clear passage in the lower row**, between assembled x boundaries 32 and 256. The curved crown changes the headroom above that passage, so the lower width should not be interpreted as a full-height rectangular clearance.

**R4 C5 is wholly transparent.** It contains no painted black backdrop, door, threshold, or collider. Draw a separate dark recess or door behind the stone entrance when required. The left and right jambs occupy different map cells in this assembly. The dungeon tileset's narrow crown and same-cell jamb overlays are a separate construction system.

The two jamb strips repeat vertically. Additional jamb rows, with an empty middle cell, can extend the entrance downward while retaining its crown. Keep both sides at equal height and place the ground below the last jamb row. The standard layout above uses exactly the six supplied pieces once.

### Ruined walls

The full stone wall in R4 C7 repeats vertically. Place R4 C8, the broken wall top, directly above it; the cap's bottom pixel row matches the wall's top row. The broken edge begins inside its own cell and leaves transparency above it. It is a ruin silhouette rather than a highlighted walking surface. Use additional R4 C7 cells below for height, and define any standable ledge separately if the game needs one.

### Tree and individual scenery

The dead tree is **one column wide and two rows high**. Place **R5 C5, branches**, directly above **R5 C4, trunk**, at the same horizontal origin. The completed assembly occupies 96 × 192 pixels. The join contains an 18-pixel stem at local **x = 39–56**; those pixels connect exactly across the two cells. The roots reach the lower tile's bottom row.

Headstones, the fence, brambles, and rubble are individual overlays. Preserve their transparent surroundings. The following measured bounds are inclusive cell-local pixels, useful for layout and selection handles; they do not replace the 96 × 96 extraction rectangle.

| Tile | Visible bounds `(left, top)–(right, bottom)` | Visible width × height |
|---|---|---|
| Upright headstone, R5 C1 | `(17, 29)–(79, 95)` | 63 × 67 |
| Leaning headstone, R5 C2 | `(13, 33)–(74, 95)` | 62 × 63 |
| Broken headstone, R5 C3 | `(18, 55)–(80, 95)` | 63 × 41 |
| Tree trunk, R5 C4 | `(7, 0)–(86, 95)` | 80 × 96 |
| Tree branches, R5 C5 | `(3, 7)–(86, 95)` | 84 × 89 |
| Broken fence, R5 C6 | `(6, 26)–(90, 95)` | 85 × 70 |
| Bramble tuft, R5 C7 | `(14, 61)–(86, 95)` | 73 × 35 |
| Rubble, R5 C8 | `(6, 57)–(91, 95)` | 86 × 39 |

### Shared world-ground placement

The last visible ground pixel of these scenery props is **local y = 95**, immediately above the tile's bottom boundary at **y = 96**. To place a single prop on world ground `groundY`, draw its full cell at `topY = groundY - 96`. For the complete tree, draw the branches at `groundY - 192` and the trunk at `groundY - 96`.

The hero and grounded interactive-object frames use their own contact pixel **y = 84**, corresponding to a drawing-pivot boundary at **y = 85**. To place those frames on the same world ground, their cell top is `groundY - 85`. Reusing the terrain prop's `-96` offset for an actor would shift its feet away from the surface. Keep each asset's registration convention while sharing the same world-ground coordinate.

## 5. Import, drawing, and collision example

Import the PNG as an 8 × 5 atlas with a 96 × 96 cell size, **margin 0 and spacing 0**. Use nearest-neighbor sampling, preserve alpha, and disable automatic sprite trimming or per-cell centering. Pixel-aligned drawing and integer display scales preserve the original edge treatment.

The following complete JavaScript block has no package dependencies. Its catalog, coordinate lookup, assembly helpers, and collision-height helper work in ordinary JavaScript. The drawing functions accept a Canvas-like context and an already-loaded image; the block does not assume a browser, create a canvas, or execute a draw call on its own.

```javascript
const TILE_SIZE = 96;
const ATLAS_COLUMNS = 8;
const ATLAS_ROWS = 5;

const TILE_ROWS = [
  ["grass_left_cliff", "grass_center_a", "grass_right_cliff", "grass_standalone",
   "grass_center_b", "bare_path_center", "soil_fill_a", "soil_fill_b"],
  ["platform_left_cap", "platform_center_a", "platform_right_cap", "platform_standalone",
   "platform_center_b", "platform_cracked_center", "platform_left_support", "platform_right_support"],
  ["slope_rising_right", "slope_rising_left", "grass_lower_landing", "grass_upper_landing",
   "stone_lower_landing", "stone_upper_landing", "retaining_wall_left", "retaining_wall_right"],
  ["entrance_arch_left", "entrance_arch_keystone", "entrance_arch_right", "entrance_jamb_left",
   "entrance_opening", "entrance_jamb_right", "ruin_wall", "ruin_wall_broken_top"],
  ["headstone_upright", "headstone_leaning", "headstone_broken", "dead_tree_trunk",
   "dead_tree_branches", "broken_iron_fence", "bramble_tuft", "loose_rubble"]
];

function tileRect(row, column) {
  if (!Number.isInteger(row) || row < 1 || row > ATLAS_ROWS ||
      !Number.isInteger(column) || column < 1 || column > ATLAS_COLUMNS) {
    throw new RangeError("Expected a 1-based row 1..5 and column 1..8");
  }
  return {
    x: (column - 1) * TILE_SIZE,
    y: (row - 1) * TILE_SIZE,
    width: TILE_SIZE,
    height: TILE_SIZE,
    index: (row - 1) * ATLAS_COLUMNS + column - 1,
    row,
    column
  };
}

const TILES = Object.fromEntries(TILE_ROWS.flatMap((ids, rowIndex) =>
  ids.map((id, columnIndex) => [id, {
    id, ...tileRect(rowIndex + 1, columnIndex + 1),
    empty: id === "entrance_opening"
  }])
));

function getTile(id) {
  const tile = TILES[id];
  if (!tile) throw new RangeError(`Unknown tile: ${id}`);
  return tile;
}

// Placement coordinates below are integer map cells; source rows remain 1-based.
function place(id, gx, gy) {
  getTile(id);
  if (!Number.isInteger(gx) || !Number.isInteger(gy)) {
    throw new TypeError("Map coordinates must be integers");
  }
  return { id, gx, gy };
}

function entranceAt(gx, gy) {
  return [
    place("entrance_arch_left", gx, gy),
    place("entrance_arch_keystone", gx + 1, gy),
    place("entrance_arch_right", gx + 2, gy),
    place("entrance_jamb_left", gx, gy + 1),
    place("entrance_opening", gx + 1, gy + 1),
    place("entrance_jamb_right", gx + 2, gy + 1)
  ];
}

function treeAt(gx, gy) {
  return [place("dead_tree_branches", gx, gy),
          place("dead_tree_trunk", gx, gy + 1)];
}

function rightSlopeAt(gx, gy, stone = false) {
  return [
    place(stone ? "stone_lower_landing" : "grass_lower_landing", gx - 1, gy + 1),
    place("slope_rising_right", gx, gy),
    place(stone ? "stone_upper_landing" : "grass_upper_landing", gx + 1, gy)
  ];
}

function leftSlopeAt(gx, gy, stone = false) {
  return [
    place(stone ? "stone_upper_landing" : "grass_upper_landing", gx - 1, gy),
    place("slope_rising_left", gx, gy),
    place(stone ? "stone_lower_landing" : "grass_lower_landing", gx + 1, gy + 1)
  ];
}

// Returns a recommended tile-local boundary height, not a complete controller.
function rampSurfaceY(id, localX) {
  if (!Number.isFinite(localX)) throw new TypeError("localX must be finite");
  const x = Math.max(0, Math.min(TILE_SIZE, localX));
  if (id === "slope_rising_right") return TILE_SIZE - x;
  if (id === "slope_rising_left") return x;
  throw new RangeError("Expected a slope tile ID");
}

function drawTile(ctx, atlasImage, id, screenX, screenY, scale = 1) {
  if (!Number.isFinite(scale) || scale <= 0) throw new RangeError("Invalid scale");
  const t = getTile(id);
  if (t.empty) return; // Keep the logical opening slot without painting a backdrop.
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(atlasImage, t.x, t.y, t.width, t.height,
                Math.round(screenX), Math.round(screenY),
                TILE_SIZE * scale, TILE_SIZE * scale);
}

function drawPlacement(ctx, atlasImage, item, cameraX = 0, cameraY = 0, scale = 1) {
  const screenX = (item.gx * TILE_SIZE - cameraX) * scale;
  const screenY = (item.gy * TILE_SIZE - cameraY) * scale;
  drawTile(ctx, atlasImage, item.id, screenX, screenY, scale);
}

const examples = {
  entrance: entranceAt(4, 2), // Ground can start at map row 4 beneath this entrance.
  tree: treeAt(8, 2),        // Branches in row 2, trunk in row 3, ground at row 4.
  ascendingRamp: rightSlopeAt(2, 3),
  descendingRamp: leftSlopeAt(10, 3),
  emptyDoorway: getTile("entrance_opening")
};
```

Draw a background or door first, then the entrance or props on top. The open areas reveal whatever has already been drawn behind them. Transparent pixels do not erase a previously drawn image; clearing and redrawing the viewport remains the renderer's responsibility.

### Suggested collision categories

These choices are separate from the artwork. Adjust them to the game's movement and interaction rules.

| Tile family | Starting collision model |
|---|---|
| Ground blocks, soil fills, full stone landings | Solid 96 × 96 rectangles |
| Thin platforms | Top boundary at y = 0; either a one-way surface or a 16-pixel solid deck |
| Right-rising ramp | Solid triangle with local vertices `(0,96)`, `(96,0)`, `(96,96)` |
| Left-rising ramp | Solid triangle with local vertices `(0,0)`, `(96,96)`, `(0,96)` |
| Retaining faces | Optional solid strip: left x = 0..24 or right x = 72..96 |
| Entrance and ruined stone | Separate chosen wall/door geometry; keep the passage open |
| Headstones, tree, fence, brambles, rubble | Decorative by default; add designed interaction shapes if needed |

The dimensions in this collision table are boundary coordinates, so a rectangle extending from 0 to 96 covers pixel columns 0–95. A top-only platform does not need a separate solid brace collider. A fence's transparent gaps or the tree's thin branches should not automatically become movement collision simply because alpha is nonzero.

## 6. Important implementation notes

Keep tile placement and gameplay state separate. Grass, path, and stone variants are static material choices; this sheet contains no wind, breaking, opening, or door animation. The companion interactive-object sheet supplies animated props when interaction is required.

The source atlas has **zero gutters**. Empty space beneath a platform, inside an arch, or around a tree is artwork transparency within a tile, not extra importer spacing. Do not remove R4 C5 or compact subsequent indices: the empty opening remains index 28, and the rubble remains index 39.

Use stable named IDs or the documented zero-based indices when storing a map. Randomly choosing a different surface variant on every draw would make the texture flicker. If a renderer repacks the cells into another atlas, keep their original logical dimensions and offsets so the doorway and tree retain their joins.

The final asset was checked for exact dimensions and binary alpha, all intended occupied and empty slots, shared variant borders, ramp masks, wall repetition, entrance connections, and the opaque tree-stem join. Repetition guarantees apply to the documented connection families; decorative props and broken caps are not interchangeable fill textures. The SHA-256 in section 1 identifies the PNG to which these measurements apply.

## 7. Exact source rectangles

Every entry below is a complete 96 × 96 cell, including its transparent portion. Read atlas rows left to right. `Index` is zero-based; row and column labels are one-based.

| Index | Row | Column | Tile ID | Rectangle `(x, y, width, height)` |
|---:|---:|---:|---|---|
| 0 | 1 | 1 | `grass_left_cliff` | `(0, 0, 96, 96)` |
| 1 | 1 | 2 | `grass_center_a` | `(96, 0, 96, 96)` |
| 2 | 1 | 3 | `grass_right_cliff` | `(192, 0, 96, 96)` |
| 3 | 1 | 4 | `grass_standalone` | `(288, 0, 96, 96)` |
| 4 | 1 | 5 | `grass_center_b` | `(384, 0, 96, 96)` |
| 5 | 1 | 6 | `bare_path_center` | `(480, 0, 96, 96)` |
| 6 | 1 | 7 | `soil_fill_a` | `(576, 0, 96, 96)` |
| 7 | 1 | 8 | `soil_fill_b` | `(672, 0, 96, 96)` |
| 8 | 2 | 1 | `platform_left_cap` | `(0, 96, 96, 96)` |
| 9 | 2 | 2 | `platform_center_a` | `(96, 96, 96, 96)` |
| 10 | 2 | 3 | `platform_right_cap` | `(192, 96, 96, 96)` |
| 11 | 2 | 4 | `platform_standalone` | `(288, 96, 96, 96)` |
| 12 | 2 | 5 | `platform_center_b` | `(384, 96, 96, 96)` |
| 13 | 2 | 6 | `platform_cracked_center` | `(480, 96, 96, 96)` |
| 14 | 2 | 7 | `platform_left_support` | `(576, 96, 96, 96)` |
| 15 | 2 | 8 | `platform_right_support` | `(672, 96, 96, 96)` |
| 16 | 3 | 1 | `slope_rising_right` | `(0, 192, 96, 96)` |
| 17 | 3 | 2 | `slope_rising_left` | `(96, 192, 96, 96)` |
| 18 | 3 | 3 | `grass_lower_landing` | `(192, 192, 96, 96)` |
| 19 | 3 | 4 | `grass_upper_landing` | `(288, 192, 96, 96)` |
| 20 | 3 | 5 | `stone_lower_landing` | `(384, 192, 96, 96)` |
| 21 | 3 | 6 | `stone_upper_landing` | `(480, 192, 96, 96)` |
| 22 | 3 | 7 | `retaining_wall_left` | `(576, 192, 96, 96)` |
| 23 | 3 | 8 | `retaining_wall_right` | `(672, 192, 96, 96)` |
| 24 | 4 | 1 | `entrance_arch_left` | `(0, 288, 96, 96)` |
| 25 | 4 | 2 | `entrance_arch_keystone` | `(96, 288, 96, 96)` |
| 26 | 4 | 3 | `entrance_arch_right` | `(192, 288, 96, 96)` |
| 27 | 4 | 4 | `entrance_jamb_left` | `(288, 288, 96, 96)` |
| 28 | 4 | 5 | `entrance_opening` | `(384, 288, 96, 96)` |
| 29 | 4 | 6 | `entrance_jamb_right` | `(480, 288, 96, 96)` |
| 30 | 4 | 7 | `ruin_wall` | `(576, 288, 96, 96)` |
| 31 | 4 | 8 | `ruin_wall_broken_top` | `(672, 288, 96, 96)` |
| 32 | 5 | 1 | `headstone_upright` | `(0, 384, 96, 96)` |
| 33 | 5 | 2 | `headstone_leaning` | `(96, 384, 96, 96)` |
| 34 | 5 | 3 | `headstone_broken` | `(192, 384, 96, 96)` |
| 35 | 5 | 4 | `dead_tree_trunk` | `(288, 384, 96, 96)` |
| 36 | 5 | 5 | `dead_tree_branches` | `(384, 384, 96, 96)` |
| 37 | 5 | 6 | `broken_iron_fence` | `(480, 384, 96, 96)` |
| 38 | 5 | 7 | `bramble_tuft` | `(576, 384, 96, 96)` |
| 39 | 5 | 8 | `loose_rubble` | `(672, 384, 96, 96)` |
