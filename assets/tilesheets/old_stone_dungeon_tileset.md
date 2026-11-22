# Old Stone Dungeon — Tileset Guide

## 1. Asset and contents

This guide describes the final game asset **`old_stone_dungeon_tileset.png`**. It contains weathered charcoal and slate-gray stone for a straight side-view dungeon: solid floors, thin platforms, stairs and landings, wall faces, ceilings, darker background masonry, an arch, and separate decorative overlays. Walkable tops carry a restrained light-gray bevel. Small cracks, chips, and muted blue-green stains sit inside the stonework.

| Property | Value |
|---|---|
| Image filename | `old_stone_dungeon_tileset.png` |
| Canvas | 768 × 480 pixels |
| Grid | 8 columns × 5 rows |
| Extraction size | 96 × 96 pixels for every tile |
| Tile slots | 40; all 40 contain visible artwork |
| Animation sequences | None; this is a static modular terrain atlas |
| Format | RGBA PNG; alpha values are 0 or 255 |
| View | Straight side elevation |
| Sheet margin and inter-cell spacing | 0 pixels |
| Flat walking surface | Cell-local boundary y = 0 |
| Verified SHA-256 | `b71be8eae5c8a6d3c633306c810d4613ed4d549a736a6753bd306d2f720b6ee9` |

The **96 × 96 size is the source extraction rectangle**, including any transparent area. A platform still uses a complete 96 × 96 cell even though its deck is only 16 pixels deep. Full floor and fill tiles are opaque right to their cell boundaries; they deliberately have no transparent outer padding. Preserve the original cell rectangle when importing narrow walls, chains, platforms, or other overlays.

There is no left-to-right animation playback to construct from these rows. Each cell is a different module. Choose variants when building the map and retain that choice until the map changes. Cycling the masonry variants as animation would make the texture flicker. The PNG stores artwork only; map positions, collision rules, layers, pivots, and the code below are implementation recommendations.

## 2. Coordinates and tile locations

Human-readable **rows and columns are numbered from 1**. Pixel coordinates and flattened tile indices start at **0**. The image origin is its top-left corner; x increases rightward and y downward. Rectangle notation is **`(x, y, width, height)`**, with the right and bottom boundaries excluded.

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

| Row | y | Covered y pixels | Contents |
|---:|---:|---|---|
| 1 | 0 | 0–95 | Solid floors and masonry fills |
| 2 | 96 | 96–191 | Thin platforms and support brackets |
| 3 | 192 | 192–287 | Stairs and landings |
| 4 | 288 | 288–383 | Walls, ceilings, and background masonry |
| 5 | 384 | 384–479 | Arch and dungeon detail overlays |

For example, **stairs rising right** are R3 C2, rectangle **`(96, 192, 96, 96)`**, tile index **17**. The **arch crown** is R5 C3, rectangle **`(192, 384, 96, 96)`**, index **34**. These positions refer to the atlas; the map positions at which you draw the tiles are separate coordinates.

## 3. Complete tile catalog

The IDs below are proposed stable names for an importer. Their order and locations describe the actual PNG. “Horizontal” means repetition along a map row; “vertical” means stacking down a map column. A finished cap has one attachment side and an exposed outside edge.

### Row 01 — Solid floor blocks

| Column | Tile ID | Tile | Description | Connection / repetition |
|---:|---|---|---|---|
| 1 | `floor_left` | Left end | Exposed left edge; connect its right edge to a floor center. | Right connection |
| 2 | `floor_center_a` | Repeatable center A | Main walking surface with weathered stone below. | Horizontal |
| 3 | `floor_right` | Right end | Exposed right edge; connect its left edge to a floor center. | Left connection |
| 4 | `floor_single` | Standalone block | One-cell block with both outside edges emphasized. | Standalone |
| 5 | `floor_center_b` | Repeatable center B | Alternate interior wear with the same center-tile boundary. | Horizontal |
| 6 | `floor_cracked` | Cracked center | Interior crack; walking top and shared borders remain intact. | Horizontal |
| 7 | `fill_a` | Solid masonry fill A | Full square of body stone without a highlighted floor lip. | Horizontal + vertical |
| 8 | `fill_b` | Solid masonry fill B | Alternate body stone with the same fill boundary. | Horizontal + vertical |

### Row 02 — Thin raised platforms

| Column | Tile ID | Tile | Description | Connection / repetition |
|---:|---|---|---|---|
| 1 | `platform_left` | Left cap | Thin platform with an exposed left end. | Right deck connection |
| 2 | `platform_center_a` | Repeatable middle A | Main 16-pixel-deep raised deck. | Horizontal |
| 3 | `platform_right` | Right cap | Thin platform with an exposed right end. | Left deck connection |
| 4 | `platform_single` | Standalone platform | One-cell raised platform with both ends finished. | Standalone |
| 5 | `platform_center_b` | Repeatable middle B | Alternate deck wear with identical middle-tile borders. | Horizontal |
| 6 | `platform_cracked` | Cracked middle | Crack inside the deck; top and connections remain intact. | Horizontal |
| 7 | `platform_bracket_left` | Left support bracket | Complete deck plus an angled brace beneath its left side. | Deck joins; brace is local |
| 8 | `platform_bracket_right` | Right support bracket | Complete deck plus the corresponding right-side brace. | Deck joins; brace is local |

### Row 03 — Stairs and landings

| Column | Tile ID | Tile | Description | Connection / repetition |
|---:|---|---|---|---|
| 1 | `landing_left_lower` | Left lower landing | Full floor block with an exposed left end. | Right connection |
| 2 | `stairs_right` | Stairs rising right | Six 16-pixel steps; solid below, transparent above. | Low left / high right |
| 3 | `landing_right_upper` | Right upper landing | Full floor block with an exposed right end. | Left connection |
| 4 | `landing_right_lower` | Right lower landing | Full floor block with an exposed right end. | Left connection |
| 5 | `stairs_left` | Stairs rising left | Mirrored six-step silhouette; solid below the treads. | High left / low right |
| 6 | `landing_left_upper` | Left upper landing | Full floor block with an exposed left end. | Right connection |
| 7 | `landing_upper_repeat` | Repeatable upper landing | Uncapped floor center for an extended upper run. | Horizontal |
| 8 | `landing_lower_repeat` | Repeatable lower landing | Alternate uncapped floor center for an extended lower run. | Horizontal |

### Row 04 — Walls and ceilings

| Column | Tile ID | Tile | Description | Connection / repetition |
|---:|---|---|---|---|
| 1 | `wall_left` | Left boundary wall face | 24-pixel stone strip at the left of the cell; interior space is to its right. | Vertical |
| 2 | `wall_right` | Right boundary wall face | 24-pixel stone strip at the right; interior space is to its left. | Vertical |
| 3 | `ceiling_center` | Repeatable ceiling underside | 32-pixel-deep overhead strip with a dark underside. | Horizontal |
| 4 | `ceiling_left` | Ceiling left cap | Same underside height; exposed left end. | Right connection |
| 5 | `ceiling_right` | Ceiling right cap | Same underside height; exposed right end. | Left connection |
| 6 | `background_a` | Background masonry A | Opaque, darker stone for a background layer. | Horizontal + vertical |
| 7 | `background_b` | Background masonry B | Alternate darker interior with the same background boundary. | Horizontal + vertical |
| 8 | `background_recess` | Background with shallow recess | Inset niche inside the same background perimeter; its backing remains opaque. | Compatible on all four sides |

### Row 05 — Dungeon details

| Column | Tile ID | Tile | Description | Connection / repetition |
|---:|---|---|---|---|
| 1 | `arch_jamb_left` | Left arch jamb | 20-pixel strip at the left edge of a doorway column. | Vertical |
| 2 | `arch_jamb_right` | Right arch jamb | 20-pixel strip at the right edge of that same doorway column. | Vertical |
| 3 | `arch_crown` | Arch crown | One-cell rounded crown with an alpha-transparent opening. | Fits the paired jambs below |
| 4 | `iron_grate` | Repeatable iron grate | Tarnished bars and rails with transparent holes. | Horizontal + vertical |
| 5 | `torch_sconce_unlit` | Unlit torch sconce | Static iron wall mount and spent torch, with no flame. | Standalone overlay |
| 6 | `hanging_chain` | Hanging chain | Narrow linked iron chain running through the cell height. | Vertical |
| 7 | `loose_rubble` | Loose rubble | Low pile of chipped slate pieces, without a floor shadow. | Standalone overlay |
| 8 | `pillar_segment` | Chipped pillar segment | Narrow fluted stone shaft centered in the cell. | Vertical |

### Visible geometry inside the cells

Bounds in this table are **cell-local inclusive pixel bounds**, unlike the half-open extraction rectangles in the appendix. They describe the final pixels, not required collision boxes.

| Tile or family | Actual visible geometry |
|---|---|
| All R1 tiles and the six flat R3 landings | Entire 96 × 96 cell is opaque |
| R2 C1–C6 platform decks | x0–95, y0–15: 96 × 16 visible pixels |
| R2 C7–C8 support pieces | Deck at y0–15; brace extends as low as y63; open space remains transparent |
| Left boundary wall | x0–23, y0–95: 24 × 96 strip |
| Right boundary wall | x72–95, y0–95: 24 × 96 strip |
| Ceiling center and caps | x0–95, y0–31: 96 × 32 strip |
| Background masonry and recess | Entire 96 × 96 cell is opaque |
| Left / right arch jambs | x0–19 / x76–95, both y0–95 |
| Arch crown | Bounds span the cell; the opening and outside of the curved stone are transparent |
| Iron grate | Bounds span the cell; gaps between its bars remain transparent |
| Unlit sconce | x29–63, y17–75: 35 × 59 visible bounds |
| Chain | x42–54, y0–95: 13 × 96 visible bounds, with holes between links |
| Rubble | x2–95, y61–94: 94 × 34 visible bounds |
| Pillar segment | x32–63, y0–95: 32 × 96 bounds, with chipped sides |

## 4. Building dungeon sections

### Floors, fills, and interchangeable variants

For a simple horizontal run, place `floor_left`, one or more center variants, and `floor_right` in the same map row. Use `floor_single` for a one-tile ledge. All six floor-top tiles begin at local y0, so their walking surface is the top boundary of that map row.

`floor_center_a`, `floor_center_b`, and `floor_cracked` share the same **four-pixel perimeter bands**, including their top surface. Their leftmost and rightmost seam pixels match for horizontal repetition. Choose any mix without opening a gap or altering the walking profile. The cracked artwork is decorative; the file does not define a breakable block or a different collision shape.

Put `fill_a` or `fill_b` immediately below the floor row, then repeat fills downward for the desired depth. They have no highlighted walking lip. Their four-pixel perimeters match each other, they repeat in both axes, and their top seam matches the bottom seam of each R1 floor. This gives the mass beneath a ledge without drawing a second floor edge on every row.

| Map offset from a floor run's left tile | Example tile |
|---|---|
| (0, 0) | `floor_left` |
| (1, 0) | `floor_center_a` |
| (2, 0) | `floor_center_b` |
| (3, 0) | `floor_cracked` |
| (4, 0) | `floor_right` |
| (0…4, 1) | Any mix of `fill_a` and `fill_b` |
| (0…4, 2), and farther down as needed | More fill tiles |

The bottom fill rows do not include a dedicated exposed bottom or side cap. Use the supplied boundary-face graphics and your level's surrounding geometry where an outside wall edge needs visual definition. Do not assume every side of an arbitrary pair of unrelated tile families is a guaranteed matched socket.

### Raised platforms

Build a platform from `platform_left`, middle variants, and `platform_right`, or use `platform_single`. The deck occupies local y0–15, with its top at boundary y0 and its underside at boundary y16. Transparent pixels below are part of the tile; do not crop them away or shift the deck toward the center of its cell.

The A, B, and cracked middle variants share four-pixel perimeter bands. Each bracket tile already contains a complete deck. Place it **instead of a middle deck tile at that position** when you want a support, rather than putting its whole cell one row below the deck. Its brace then appears directly beneath that deck and ends by pixel y63. The bracket's surrounding space remains open; it is not a solid rectangular floor block.

### Stairs and the full-tile elevation change

The dungeon uses **six discrete steps**, each 16 pixels wide and 16 pixels high. These are stair silhouettes, not the continuous diagonal slopes in the graveyard tileset.

| Local x interval | Right-rising tread y | Left-rising tread y |
|---|---:|---:|
| 0–15 | 80 | 0 |
| 16–31 | 64 | 16 |
| 32–47 | 48 | 32 |
| 48–63 | 32 | 48 |
| 64–79 | 16 | 64 |
| 80–95 | 0 | 80 |

For integer cell-local pixel coordinates x and y in 0–95, the opaque masks are:

```text
stairs_right: y >= 80 - 16 * floor(x / 16)
stairs_left:  y >=      16 * floor(x / 16)
```

The lower approach is at boundary y96, one map row below the stair's origin. The upper exit is at boundary y0. The first riser at the lower entrance contributes the initial 16 pixels of the total **96-pixel rise**; the lowest visible tread is therefore at y80. There is no extra pedestal beneath the staircase.

Use the following minimal assemblies, where `(gx, gy)` is the stair's **map-grid coordinate**, not an atlas coordinate:

| Direction | Part | Map position | Tile |
|---|---|---|---|
| Rising right | Lower landing | (gx−1, gy+1) | `landing_left_lower` |
| Rising right | Stair | (gx, gy) | `stairs_right` |
| Rising right | Upper landing | (gx+1, gy) | `landing_right_upper` |
| Rising left | Upper landing | (gx−1, gy) | `landing_left_upper` |
| Rising left | Stair | (gx, gy) | `stairs_left` |
| Rising left | Lower landing | (gx+1, gy+1) | `landing_right_lower` |

All landing artwork has its flat top at local y0. “Lower” and “upper” name their intended map placement; the lower tiles do not contain a recessed top inside their own cells. Use `landing_lower_repeat` and `landing_upper_repeat` when extending the runs, with exposed end tiles only at the actual outside ends.

Several landing tiles deliberately reuse floor pixels exactly: R3 C1 and C6 equal R1 C1; R3 C3 and C4 equal R1 C3; R3 C7 equals R1 C2; R3 C8 equals R1 C5. Keep all named slots in the imported atlas so the catalog remains stable.

### Walls, ceilings, and background

Stack the left boundary face vertically along the left edge of the playable space; its interior-facing surface is boundary x24 within the cell. The right boundary face exposes its inner surface at boundary x72. Their top and bottom pixels match for vertical repetition, and neither adds a horizontal walking bevel at each join.

Place the ceiling left cap, ceiling center modules, and ceiling right cap along one map row. Their underside is **boundary y32**, with the last visible row at pixel y31. For a ceiling underside at world coordinate `ceilingY`, draw its cell at `ceilingY − 32`. The empty 64 pixels below are real transparency, not a gap to remove from the source rectangle. Ceiling centers repeat horizontally; the strips are not intended as vertical wall-fill tiles.

Draw the three background cells on a background layer. A and B repeat horizontally and vertically and share four-pixel border bands. The recess has the same perimeter and can replace one background cell without a seam. It is a shallow, backed niche: its entire cell is opaque, so it does not create a transparent doorway. The darker shading helps separate this layer from foreground walkable stone.

### The one-column arch

The dungeon arch occupies **one 96-pixel-wide map column**. Its two jamb tiles are complementary overlays that belong at the **same map position**. The left jamb fills local x0–19; the right fills x76–95. Drawing both leaves a **56-pixel passage**, local x20–75. Put the crown one map row above them.

For an arch whose crown starts at `(gx, gy)` and whose straight jamb section is two tiles tall:

| Map position | Draws at that position |
|---|---|
| (gx, gy) | `arch_crown` |
| (gx, gy+1) | `arch_jamb_left` **and** `arch_jamb_right` |
| (gx, gy+2) | `arch_jamb_left` **and** `arch_jamb_right` |

This example is **96 × 288 pixels overall**. With one jamb row it is 96 × 192. Add more paired jamb rows to make it taller. The crown's bottom feet match the jamb top pixels, and jamb top/bottom edges repeat vertically. Do not place these two jamb cells in adjacent map columns: that would separate them beyond the width of the crown. This assembly differs from the graveyard's separate six-piece, three-column entrance.

If a map layer permits only one tile per coordinate, draw the jambs on two decoration layers or precompose their nonoverlapping pixels into a local runtime tile. Keep each source cell at its original size. The passage remains alpha-transparent and can show the background, a door sprite, or a separate recess behind it.

### Other overlays and free placement

The grate repeats in both axes. Its transparent holes reveal whichever layer is behind it; whether its bars block the player is a separate gameplay choice. The chain and pillar repeat vertically, with matching top/bottom edges. Their narrow visible silhouettes stay in their fixed local x positions as the cells stack.

The sconce is an **unlit static decoration**. This atlas has no flame frames. Use a separately animated world-object torch when a location needs flame animation or interaction. Position its mounting point deliberately; these two different assets are not promised to share the same visible size or attachment pixel.

The rubble's lowest opaque pixel is **y94**, leaving one transparent row at the bottom of its cell. For precise free placement on a floor whose top boundary is world `groundY`, a useful suggested rubble pivot is **(48,95)** and its image top is `groundY − 95`. A strictly grid-aligned cell directly above that floor leaves one transparent pixel of clearance. This small offset does not change the atlas rectangle.

## 5. Import, collision, and layering notes

Import all cells at 96 × 96 with **margin 0 and spacing 0**. Use nearest-neighbor filtering, preserve alpha, and disable automatic per-cell trimming or pivot recentering. Align map placement to the same logical pixel grid as the character art. If your renderer packs tiles into another texture, any added sampling extrusion belongs to that new packed texture; it does not change the source coordinates in this guide.

The following collision shapes are suggested starting rules, not data embedded in the PNG:

| Tile family | Suggested gameplay treatment |
|---|---|
| Floor blocks, fills, flat landings | Solid 96 × 96 rectangle, unless used only as background decoration |
| Thin platforms and bracket decks | Standable surface at y0; use either a 96 × 16 solid deck or a one-way top surface, according to the game |
| Stairs | Six adjacent 16-pixel-wide solid rectangles using the tread heights above |
| Left / right boundary wall | Solid strip `(0,0,24,96)` / `(72,0,24,96)` |
| Ceiling strip | Solid rectangle `(0,0,96,32)` with underside at y32 |
| Background, recess, sconce, chain, rubble | Decoration by default |
| Arch, grate, pillar | Separate collision or interaction geometry chosen for the level |

Transparent pixels do not automatically define traversability, and opaque background pixels do not automatically create a wall. Keep collision and interaction maps separate from the visual tile map. The bracket below a platform can remain decorative even when its deck supports the player. Texture cracks do not alter the common floor or deck shape.

A useful draw order is background masonry, rear details such as chains or arches, terrain and props that should be behind actors, actors, then any intentional foreground overlays. These are layer choices rather than separate subimages in the PNG.

For integration with the existing hero and world-object sheets, a floor tile's top boundary is the world ground line. A sprite using the common suggested ground pivot `(48,85)` is drawn at `groundX − 48, groundY − 85`. That puts its last grounded opaque pixel y84 immediately above the terrain surface. Do not use the terrain tile's height as the character's foot pivot.

## 6. Complete JavaScript catalog and assembly helpers

The following block is self-contained, uses no external packages, and runs in JavaScript without loading the image. It computes all source rectangles, produces map placements, and provides exact stair-rectangle geometry. `drawTile` accepts an already loaded image and a Canvas-style context; it is defined but not called by the example. The same rectangle and placement records can be used in another engine.

```javascript
const TILE_SIZE = 96;
const ATLAS_COLUMNS = 8;
const ATLAS_ROWS = 5;
const ATLAS_FILE = "old_stone_dungeon_tileset.png";

const tileGrid = [
  ["floor_left", "floor_center_a", "floor_right", "floor_single",
   "floor_center_b", "floor_cracked", "fill_a", "fill_b"],
  ["platform_left", "platform_center_a", "platform_right", "platform_single",
   "platform_center_b", "platform_cracked", "platform_bracket_left", "platform_bracket_right"],
  ["landing_left_lower", "stairs_right", "landing_right_upper", "landing_right_lower",
   "stairs_left", "landing_left_upper", "landing_upper_repeat", "landing_lower_repeat"],
  ["wall_left", "wall_right", "ceiling_center", "ceiling_left",
   "ceiling_right", "background_a", "background_b", "background_recess"],
  ["arch_jamb_left", "arch_jamb_right", "arch_crown", "iron_grate",
   "torch_sconce_unlit", "hanging_chain", "loose_rubble", "pillar_segment"]
];

function tileRect(row, column) {
  if (!Number.isInteger(row) || !Number.isInteger(column) ||
      row < 1 || row > ATLAS_ROWS || column < 1 || column > ATLAS_COLUMNS) {
    throw new RangeError("Rows are 1..5 and columns are 1..8.");
  }
  return {
    x: (column - 1) * TILE_SIZE,
    y: (row - 1) * TILE_SIZE,
    width: TILE_SIZE,
    height: TILE_SIZE,
    index: (row - 1) * ATLAS_COLUMNS + column - 1
  };
}

const tiles = Object.fromEntries(tileGrid.flatMap((names, row) =>
  names.map((id, column) => [id, {
    id, row: row + 1, column: column + 1,
    ...tileRect(row + 1, column + 1)
  }])
));

function placement(id, gx, gy, layer = "terrain") {
  if (!tiles[id]) throw new RangeError(`Unknown tile: ${id}`);
  if (!Number.isInteger(gx) || !Number.isInteger(gy)) {
    throw new TypeError("Map coordinates must be integers.");
  }
  return { id, gx, gy, x: gx * TILE_SIZE, y: gy * TILE_SIZE, layer };
}

function floorRun(gx, gy, width, depth = 0) {
  if (!Number.isInteger(width) || width < 1 ||
      !Number.isInteger(depth) || depth < 0) {
    throw new RangeError("Width must be positive; depth must be nonnegative.");
  }
  const result = [];
  const variants = ["floor_center_a", "floor_center_b", "floor_cracked"];
  for (let x = 0; x < width; x++) {
    const id = width === 1 ? "floor_single" : x === 0 ? "floor_left" :
      x === width - 1 ? "floor_right" : variants[(x - 1) % variants.length];
    result.push(placement(id, gx + x, gy));
    for (let y = 1; y <= depth; y++) {
      result.push(placement((x + y) % 2 ? "fill_a" : "fill_b", gx + x, gy + y));
    }
  }
  return result;
}

function stairAssembly(gx, gy, direction) {
  if (direction === "right") {
    return [placement("landing_left_lower", gx - 1, gy + 1),
            placement("stairs_right", gx, gy),
            placement("landing_right_upper", gx + 1, gy)];
  }
  if (direction === "left") {
    return [placement("landing_left_upper", gx - 1, gy),
            placement("stairs_left", gx, gy),
            placement("landing_right_lower", gx + 1, gy + 1)];
  }
  throw new RangeError("Direction must be right or left.");
}

function stairRects(direction) {
  if (direction !== "right" && direction !== "left") {
    throw new RangeError("Direction must be right or left.");
  }
  return Array.from({ length: 6 }, (_, step) => {
    const top = direction === "right" ? 80 - step * 16 : step * 16;
    return { x: step * 16, y: top, width: 16, height: TILE_SIZE - top };
  });
}

function archAssembly(gx, gy, jambRows = 1) {
  if (!Number.isInteger(jambRows) || jambRows < 1) {
    throw new RangeError("The arch needs at least one jamb row.");
  }
  const result = [placement("arch_crown", gx, gy, "decoration")];
  for (let row = 1; row <= jambRows; row++) {
    // Two transparent overlays at exactly the SAME destination cell.
    result.push(placement("arch_jamb_left", gx, gy + row, "decoration"));
    result.push(placement("arch_jamb_right", gx, gy + row, "decoration"));
  }
  return result;
}

function drawTile(ctx, image, item, scale = 1) {
  if (!Number.isInteger(scale) || scale < 1) {
    throw new RangeError("Use a positive integer display scale for crisp pixels.");
  }
  const source = tiles[item.id];
  if (!source) throw new RangeError(`Unknown tile: ${item.id}`);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, source.x, source.y, source.width, source.height,
    item.x * scale, item.y * scale, TILE_SIZE * scale, TILE_SIZE * scale);
}

// Complete data examples; no browser objects or image fetch are required.
const exampleFloor = floorRun(0, 4, 5, 2);
const exampleRightStair = stairAssembly(6, 3, "right");
const exampleLeftStair = stairAssembly(10, 3, "left");
const exampleArch = archAssembly(14, 2, 2); // 96 x 288 logical pixels.
const exampleRightStairCollision = stairRects("right");
const exampleLeftStairCollision = stairRects("left");
const examplePlacements = [
  ...exampleFloor, ...exampleRightStair, ...exampleLeftStair, ...exampleArch
];
```

`placement` uses top-left tile origins. `drawTile` scales the whole logical scene uniformly when an integer display scale is requested; it does not stretch one module to fill a differently sized opening. For rendering at native game resolution, leave `scale` at 1. Keep world-camera transforms and collision movement in the game controller.

## 7. Exact extraction rectangle appendix

Every rectangle below is **`(x, y, width, height)`**, using a zero-based atlas origin and excluded right/bottom boundaries. Keep the listed slots even when two tiles intentionally contain identical artwork.

| Row | Column | Tile index | Tile ID | Source rectangle |
|---:|---:|---:|---|---|
| 01 | 1 | 0 | `floor_left` | `(0, 0, 96, 96)` |
| 01 | 2 | 1 | `floor_center_a` | `(96, 0, 96, 96)` |
| 01 | 3 | 2 | `floor_right` | `(192, 0, 96, 96)` |
| 01 | 4 | 3 | `floor_single` | `(288, 0, 96, 96)` |
| 01 | 5 | 4 | `floor_center_b` | `(384, 0, 96, 96)` |
| 01 | 6 | 5 | `floor_cracked` | `(480, 0, 96, 96)` |
| 01 | 7 | 6 | `fill_a` | `(576, 0, 96, 96)` |
| 01 | 8 | 7 | `fill_b` | `(672, 0, 96, 96)` |
| 02 | 1 | 8 | `platform_left` | `(0, 96, 96, 96)` |
| 02 | 2 | 9 | `platform_center_a` | `(96, 96, 96, 96)` |
| 02 | 3 | 10 | `platform_right` | `(192, 96, 96, 96)` |
| 02 | 4 | 11 | `platform_single` | `(288, 96, 96, 96)` |
| 02 | 5 | 12 | `platform_center_b` | `(384, 96, 96, 96)` |
| 02 | 6 | 13 | `platform_cracked` | `(480, 96, 96, 96)` |
| 02 | 7 | 14 | `platform_bracket_left` | `(576, 96, 96, 96)` |
| 02 | 8 | 15 | `platform_bracket_right` | `(672, 96, 96, 96)` |
| 03 | 1 | 16 | `landing_left_lower` | `(0, 192, 96, 96)` |
| 03 | 2 | 17 | `stairs_right` | `(96, 192, 96, 96)` |
| 03 | 3 | 18 | `landing_right_upper` | `(192, 192, 96, 96)` |
| 03 | 4 | 19 | `landing_right_lower` | `(288, 192, 96, 96)` |
| 03 | 5 | 20 | `stairs_left` | `(384, 192, 96, 96)` |
| 03 | 6 | 21 | `landing_left_upper` | `(480, 192, 96, 96)` |
| 03 | 7 | 22 | `landing_upper_repeat` | `(576, 192, 96, 96)` |
| 03 | 8 | 23 | `landing_lower_repeat` | `(672, 192, 96, 96)` |
| 04 | 1 | 24 | `wall_left` | `(0, 288, 96, 96)` |
| 04 | 2 | 25 | `wall_right` | `(96, 288, 96, 96)` |
| 04 | 3 | 26 | `ceiling_center` | `(192, 288, 96, 96)` |
| 04 | 4 | 27 | `ceiling_left` | `(288, 288, 96, 96)` |
| 04 | 5 | 28 | `ceiling_right` | `(384, 288, 96, 96)` |
| 04 | 6 | 29 | `background_a` | `(480, 288, 96, 96)` |
| 04 | 7 | 30 | `background_b` | `(576, 288, 96, 96)` |
| 04 | 8 | 31 | `background_recess` | `(672, 288, 96, 96)` |
| 05 | 1 | 32 | `arch_jamb_left` | `(0, 384, 96, 96)` |
| 05 | 2 | 33 | `arch_jamb_right` | `(96, 384, 96, 96)` |
| 05 | 3 | 34 | `arch_crown` | `(192, 384, 96, 96)` |
| 05 | 4 | 35 | `iron_grate` | `(288, 384, 96, 96)` |
| 05 | 5 | 36 | `torch_sconce_unlit` | `(384, 384, 96, 96)` |
| 05 | 6 | 37 | `hanging_chain` | `(480, 384, 96, 96)` |
| 05 | 7 | 38 | `loose_rubble` | `(576, 384, 96, 96)` |
| 05 | 8 | 39 | `pillar_segment` | `(672, 384, 96, 96)` |
