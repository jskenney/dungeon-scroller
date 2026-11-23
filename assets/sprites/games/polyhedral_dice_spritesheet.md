# Dungeon Polyhedral Dice — Sprite Sheet Guide

## 1. Asset and dice

This guide describes the final game asset **[polyhedral_dice_spritesheet.png](polyhedral_dice_spritesheet.png)**: twelve blank polyhedral dice in two matching material sets, plus six separate recessed-pip overlays. The bone set uses carved ivory, warm beige shadows, and worn corners. The slate set uses cool charcoal stone and thin antique-brass bevels. All dice use a fixed three-quarter view with a broad result face turned toward the viewer and illumination from the upper left.

The guide follows the same six-section structure as `light_space_mage_spritesheet.md`, adapting its animation sections to dice composition and game-controlled display behavior.

| Property | Value |
|---|---|
| Image filename | `polyhedral_dice_spritesheet.png` |
| Canvas | 576 × 288 pixels |
| Grid | 6 columns × 3 rows |
| Full-cell extraction size | 96 × 96 pixels for every sprite |
| Sprite slots | 18; every slot contains visible pixels |
| Blank die sprites | 12: six die types in each of two materials |
| Die types | D4, D6, D8, D10, D12, D20 |
| Materials | Bone ivory and dungeon slate |
| Pip overlays | 6: small, medium, and large for each material |
| Pip footprints, including rims | 6 × 6, 8 × 8, and 10 × 10 pixels |
| Embedded animation clips | 0; these are static views and overlays |
| Format | RGBA PNG; alpha values are 0 or 255 |
| Sheet margin and inter-cell spacing | 0 pixels |
| Smallest transparent padding around a die | 9 pixels |
| Nominal result-face anchor | Cell-local (48, 48) |
| Suggested fixed logical pivot | (48, 48), or normalized (0.5, 0.5) |
| Pip center in each full cell | Exactly (48, 48) |
| Lighting | Upper left; pip recesses have an upper-left inner shadow and lower-right inner highlight |
| Verified SHA-256 | `978fae711f635c76b5840d463ab2ac4b2c6c6d4420559f712c9a512b103e80cc` |

The **96 × 96 size is the extraction rectangle**, including transparent padding. The visible die occupies less of the cell, and the pip overlays occupy only their small circular footprints. Preserve the complete cell and its logical anchor when importing dice. Use the tight pip crops described below when stamping individual divots.

The PNG contains pixels only. It does not contain numbered outcomes, predefined pip patterns, fonts, roll probabilities, physical dice models, or animation timing. A die's type identifies its shape; its displayed result comes from the game. All measured properties in this guide refer to the PNG identified by the digest above. Layouts, example code, and roll-feedback timings are integration recommendations.

## 2. Coordinates and sprite locations

All human-readable **rows and columns are numbered from 1**. Pixel coordinates and flattened sprite indices start at **0**. The origin is the top-left of the image; x increases rightward and y downward.

Use rectangle notation **`(x, y, width, height)`**, with the right and bottom edges excluded. For row `r` and column `c`:

```text
x = (c - 1) * 96
y = (r - 1) * 96
rectangle = (x, y, 96, 96)
spriteIndex = (r - 1) * 6 + (c - 1)
```

| Column | Zero-based column | x | Covered x pixels |
|---:|---:|---:|---|
| 1 | 0 | 0 | 0–95 |
| 2 | 1 | 96 | 96–191 |
| 3 | 2 | 192 | 192–287 |
| 4 | 3 | 288 | 288–383 |
| 5 | 4 | 384 | 384–479 |
| 6 | 5 | 480 | 480–575 |

| Row | y | Covered y pixels | Contents, left to right |
|---:|---:|---|---|
| 1 | 0 | 0–95 | Bone D4, D6, D8, D10, D12, D20 |
| 2 | 96 | 96–191 | Slate D4, D6, D8, D10, D12, D20 |
| 3 | 192 | 192–287 | Bone small, bone medium, bone large, slate small, slate medium, slate large pips |

For example, the **slate D12** is row 2, column 5: rectangle **`(384, 96, 96, 96)`**, flattened index **10**. The **bone large pip** is row 3, column 3: full-cell rectangle **`(192, 192, 96, 96)`**, index **14**. Its tight source crop is **`(235, 235, 10, 10)`**.

### Result-face and drawing anchors

Use **(48, 48)** as the logical result-face anchor and default drawing pivot for every die. The artwork is registered around this point, with small subpixel differences in the measured centers of the rendered faces. This point is not necessarily the center of a die's visible bounding box.

If the die's logical center is at screen position `(rootX, rootY)` and the scale is `s`, draw the complete 96 × 96 cell at:

```text
destinationX = rootX - 48 * s
destinationY = rootY - 48 * s
destinationWidth = destinationHeight = 96 * s
```

A pip whose center is at local `(pipX, pipY)` is then centered at:

```text
screenPipX = rootX + (pipX - 48) * s
screenPipY = rootY + (pipY - 48) * s
```

Apply the same translation and scale to the die and all of its result markings. The sheet has no shared world-ground line: aligning every die to its lowest opaque pixel would move the result-face anchor differently for each shape.

### Pip footprints and source crops

The small, medium, and large suffixes refer to **pixel size**, not the displayed roll value or the number of pips. A result of six on a D6 is made by placing six instances of a chosen pip sprite.

| Pip size | Diameter including rim | Local tight crop | Covered local x and y pixels | Pivot inside tight crop |
|---|---:|---|---|---|
| Small | 6 px | `(45, 45, 6, 6)` | 45–50 on each axis | `(3, 3)` |
| Medium | 8 px | `(44, 44, 8, 8)` | 44–51 on each axis | `(4, 4)` |
| Large | 10 px | `(43, 43, 10, 10)` | 43–52 on each axis | `(5, 5)` |

For a diameter `d`, the local tight crop is `(48 - d/2, 48 - d/2, d, d)`. Add the pip cell's atlas origin to obtain the source crop in the full image. The exact six atlas crops are listed in section 6.

Do not resize an entire 96 × 96 pip cell into a 6 × 6 destination: that also scales its transparent padding and makes the divot nearly disappear. Either draw the tight crop at its native diameter or draw the full 96 × 96 cell at native size with its center aligned to the desired pip position.

## 3. Sprite catalog

Read the sheet left to right to identify its components. The first two rows contain different die types and materials. **They are not successive roll frames or separate results of one die.** The third row is grouped by material and pip size, independently of the die-type columns above it.

| Row | Column | Index | Sprite ID | Contents |
|---:|---:|---:|---|---|
| 1 | 1 | 0 | `bone_d4` | Bone ivory tetrahedron |
| 1 | 2 | 1 | `bone_d6` | Bone ivory cube |
| 1 | 3 | 2 | `bone_d8` | Bone ivory octahedron |
| 1 | 4 | 3 | `bone_d10` | Bone ivory pentagonal trapezohedron |
| 1 | 5 | 4 | `bone_d12` | Bone ivory dodecahedron |
| 1 | 6 | 5 | `bone_d20` | Bone ivory icosahedron |
| 2 | 1 | 6 | `slate_d4` | Dungeon slate tetrahedron |
| 2 | 2 | 7 | `slate_d6` | Dungeon slate cube |
| 2 | 3 | 8 | `slate_d8` | Dungeon slate octahedron |
| 2 | 4 | 9 | `slate_d10` | Dungeon slate pentagonal trapezohedron |
| 2 | 5 | 10 | `slate_d12` | Dungeon slate dodecahedron |
| 2 | 6 | 11 | `slate_d20` | Dungeon slate icosahedron |
| 3 | 1 | 12 | `bone_pip_6` | One bone-compatible 6 px divot |
| 3 | 2 | 13 | `bone_pip_8` | One bone-compatible 8 px divot |
| 3 | 3 | 14 | `bone_pip_10` | One bone-compatible 10 px divot |
| 3 | 4 | 15 | `slate_pip_6` | One slate-compatible 6 px divot |
| 3 | 5 | 16 | `slate_pip_8` | One slate-compatible 8 px divot |
| 3 | 6 | 17 | `slate_pip_10` | One slate-compatible 10 px divot |

### Material sets

**Bone ivory, row 1:** pale carved surfaces, warm beige side shadows, light upper-left edges, and small worn corners. The broad result faces are smooth; most chips and texture are concentrated near the bevels and surrounding facets.

**Dungeon slate, row 2:** medium-dark slate result faces, cooler and darker side facets, and thin worn brass bevels that separate the planes. The front faces remain clear for overlays. Each die has the same opaque silhouette as the corresponding bone die directly above it.

### D4 — Tetrahedron

A broad upward-pointing triangular result face dominates the upright pyramidal silhouette. A narrower side face gives it depth. The image reads as a tetrahedron without the lower diamond point of the D8. Place result markings within the broad triangle; its corners and upper point provide less usable space than its middle and lower portion.

### D6 — Cube

A broad square result face is shown with narrower top and right-side planes. The front square is the most straightforward surface for conventional one-through-six pip patterns. Keep pips inside that square, clear of the bevels and the visible top and side faces.

### D8 — Octahedron

The overall silhouette is diamond-like, with upper and lower points and a distinct forward triangular face. A visible lower triangular facet differentiates it from the D4. The lower outer point is not part of the forward result face and should not be used as extra pip space.

### D10 — Pentagonal trapezohedron

A broad four-cornered **kite-shaped** result face sits between smaller surrounding facets. Its silhouette tapers toward a lower point. The forward face is a kite, not a pentagon; pip or glyph layouts need to respect its narrowing ends.

### D12 — Dodecahedron

A prominent central **five-sided pentagon** is surrounded by smaller facets. The overall outline is more rounded than those of the D4 and D8. The pentagonal front provides broad central space, but markings should stay away from its top vertex and lower corners.

### D20 — Icosahedron

A prominent forward **triangle** is surrounded by several smaller triangular facets. Its larger number of surrounding subdivisions distinguishes it from the D8. Keep the result on the main triangle; the adjacent triangles represent other faces of the solid.

### Recessed pip overlays

Each overlay is one shaded circular divot on an otherwise transparent cell. The upper-left inner wall is dark, the center is recessed, and a narrow lower-right inner edge catches the light. This concave shading is already in the image.

Bone pips use warm brown recesses and an ivory lower rim. Slate pips use dark charcoal recesses and a cool stone highlight that remains visible against the slate face. Match pip material to die material so the rim blends with the surface.

The dark center is painted opaque; it is not a transparent hole through the die. Composite pips normally with source alpha. Keep their shading orientation unchanged when placing multiple pips: moving a pip to the bottom of a pattern does not require rotating or mirroring it.

## 4. Building results and playing display transitions

### Import and slice

1. Import the PNG at native size, preserve its alpha channel, and use nearest-neighbor/point sampling.
2. Slice a regular grid with frame size **96 × 96**, offset **(0, 0)**, margin **0**, spacing **0**, six columns, and three rows.
3. Name the eighteen slices using the catalog. Keep die sprites at full-cell size with the same **(48, 48)** logical pivot.
4. For pip stamping, define the six tight crops and their half-diameter pivots from section 6. Keep both the full-cell and tight-crop descriptions if the engine needs them.
5. Select a die by material and type, then select pip overlays by material and desired pixel diameter. Do not select a pip by reusing the die's column number.
6. Build the displayed result from the game state. The asset does not decide the roll or store a separate image for each possible outcome.

### Composition sequence

Draw the blank die first, then stamp its result markings on the broad forward face. At native scale, a pip with diameter `d` and desired center `(x, y)` uses destination rectangle `(x - d/2, y - d/2, d, d)`. Apply the enclosing die transform to both layers so their positions remain registered.

Use the small 6 px variant where space is limited, the medium 8 px variant as a useful starting choice for the D6, and the large 10 px variant for sparse layouts with sufficient clearance. The variant determines how large each divot is; it does not determine how many instances to draw.

The full die silhouette is not a mask for its result face. A pip can be inside the die's opaque outline and still lie on the wrong facet. Author placement points against the actual forward face and leave a margin between the complete pip footprint and the bevel. The PNG does not provide separate face polygons or perspective-warp metadata.

### Suggested D6 result layouts

The following conventional layouts use **8 px pips**. All positions are cell-local pip centers. They are recommendations for the D6 front square, not patterns embedded in the PNG and not universal layouts for the other five shapes.

| Result | Pip count | Local centers `(x, y)` |
|---:|---:|---|
| 1 | 1 | `(48,48)` |
| 2 | 2 | `(36,36)`, `(60,60)` |
| 3 | 3 | `(36,36)`, `(48,48)`, `(60,60)` |
| 4 | 4 | `(36,36)`, `(60,36)`, `(36,60)`, `(60,60)` |
| 5 | 5 | `(36,36)`, `(60,36)`, `(48,48)`, `(36,60)`, `(60,60)` |
| 6 | 6 | `(36,36)`, `(60,36)`, `(36,48)`, `(60,48)`, `(36,60)`, `(60,60)` |

Use these same centers for the 6 px variant. For 10 px pips, inset the outer coordinates by one pixel: change 36 to **37** and 60 to **59**, keeping 48 unchanged. This keeps the larger footprints clear of the worn lower corner. The D6 helper below applies that inset automatically. Every stamp uses its original orientation so all recess highlights remain on the lower right.

### Results on the other shapes

Give each shape its own result layout. Triangular faces need different arrangements from square or pentagonal faces. Keep a single centered mark at `(48,48)` when that is the intended result, and review multi-pip layouts at the native display size before using them.

Do not assume that a high-sided die's result must be displayed as that many separate divots. In particular, this D20's triangular face should not be treated as a guaranteed layout area for twenty 6 px pips. The game can instead supply a compact numeral, a defined compact symbol pattern, or a separate nearby result label. Those glyphs or labels are additional game content; no font or numbers are included in the sheet.

For a game-rendered one- or two-digit numeral, **`(40, 42, 16, 12)`** is a conservative starting destination box centered at `(48,48)`. Fit a readable pixel font inside it and check its contrast against each material. The example below uses a caller-supplied glyph renderer for this optional presentation. It uses result values `1..sides`; the game's own rules may define a different mapping.

### JavaScript example: descriptors, pip stamping, and result composition

This Canvas 2D example draws one native-size die at the current local origin. It assumes the PNG is already loaded into `image`. It supplies a complete D6 pip layout, generic composition for deliberately authored point lists, and an optional numeric-result path for all six die types. The numeric path requires the game's own `drawValueGlyph` callback.

```javascript
const DICE_CELL = 96;
const DICE_COLUMNS = 6;
const DICE_PIVOT = { x: 48, y: 48 };
const DIE_TYPES = [4, 6, 8, 10, 12, 20];
const MATERIAL_ROWS = { bone: 1, slate: 2 };
const PIP_DIAMETERS = [6, 8, 10];

function cellRect(row, column) {
  return { x: (column - 1) * DICE_CELL,
           y: (row - 1) * DICE_CELL,
           width: DICE_CELL, height: DICE_CELL };
}

const DIE_SPRITES = Object.fromEntries(
  Object.entries(MATERIAL_ROWS).flatMap(([material, row]) =>
    DIE_TYPES.map((sides, column0) => {
      const column = column0 + 1;
      return [`${material}_d${sides}`, {
        material, sides, row, column,
        index: (row - 1) * DICE_COLUMNS + column0,
        rect: cellRect(row, column)
      }];
    })
  )
);

const PIP_SPRITES = Object.fromEntries(
  ["bone", "slate"].flatMap((material, material0) =>
    PIP_DIAMETERS.map((diameter, size0) => {
      const column = material0 * 3 + size0 + 1;
      const rect = cellRect(3, column);
      const inset = 48 - diameter / 2;
      return [`${material}_pip_${diameter}`, {
        material, diameter, row: 3, column, index: 12 + column - 1, rect,
        tightRect: { x: rect.x + inset, y: rect.y + inset,
                     width: diameter, height: diameter }
      }];
    })
  )
);

const D6_LAYOUTS = {
  1: [[48,48]],
  2: [[36,36],[60,60]],
  3: [[36,36],[48,48],[60,60]],
  4: [[36,36],[60,36],[36,60],[60,60]],
  5: [[36,36],[60,36],[48,48],[36,60],[60,60]],
  6: [[36,36],[60,36],[36,48],[60,48],[36,60],[60,60]]
};

function getDie(material, sides) {
  const id = `${material}_d${sides}`;
  if (!Object.prototype.hasOwnProperty.call(DIE_SPRITES, id)) {
    throw new RangeError("Unknown die material or type");
  }
  return DIE_SPRITES[id];
}

function getPip(material, diameter) {
  const id = `${material}_pip_${diameter}`;
  if (!Object.prototype.hasOwnProperty.call(PIP_SPRITES, id)) {
    throw new RangeError("Choose bone/slate and a 6, 8, or 10 px pip");
  }
  return PIP_SPRITES[id];
}

function drawBlankDie(ctx, image, material, sides) {
  const r = getDie(material, sides).rect;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, r.x, r.y, r.width, r.height,
    0, 0, DICE_CELL, DICE_CELL);
  ctx.restore();
}

function stampPip(ctx, image, material, diameter, centerX, centerY) {
  const r = getPip(material, diameter).tightRect;
  const radius = diameter / 2;
  if (!Number.isInteger(centerX) || !Number.isInteger(centerY) ||
      centerX < radius || centerY < radius ||
      centerX + radius > DICE_CELL || centerY + radius > DICE_CELL) {
    throw new RangeError("Pip centers must be integer positions inside the cell");
  }
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, r.x, r.y, r.width, r.height,
    centerX - radius, centerY - radius, diameter, diameter);
  ctx.restore();
}

function drawDieWithPips(ctx, image, material, sides, centers, diameter = 8) {
  getDie(material, sides);
  getPip(material, diameter);
  drawBlankDie(ctx, image, material, sides);
  for (const [x, y] of centers) {
    stampPip(ctx, image, material, diameter, x, y);
  }
}

function drawD6Result(ctx, image, material, value, diameter = 8) {
  if (!Number.isInteger(value) || value < 1 || value > 6) {
    throw new RangeError("D6 result must be 1 through 6");
  }
  const inset = coordinate => coordinate === 36 ? 37 : coordinate === 60 ? 59 : coordinate;
  const centers = diameter === 10
    ? D6_LAYOUTS[value].map(([x, y]) => [inset(x), inset(y)])
    : D6_LAYOUTS[value];
  drawDieWithPips(ctx, image, material, 6, centers, diameter);
}

function drawNumericResult(ctx, image, material, sides, value, drawValueGlyph) {
  const die = getDie(material, sides);
  if (!Number.isInteger(value) || value < 1 || value > die.sides) {
    throw new RangeError("This example uses values 1 through the side count");
  }
  if (typeof drawValueGlyph !== "function") {
    throw new TypeError("Supply the game's bitmap-font result renderer");
  }
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  try {
    drawBlankDie(ctx, image, material, sides);
    drawValueGlyph(ctx, String(value),
      { x: 40, y: 42, width: 16, height: 12 }, material);
  } finally {
    ctx.restore();
  }
}

// Examples after loading image:
// drawBlankDie(ctx, image, "bone", 4);
// drawD6Result(ctx, image, "bone", 5);          // five 8 px bone pips
// drawD6Result(ctx, image, "slate", 6, 6);      // six 6 px slate pips
// drawDieWithPips(ctx, image, "slate", 20, [[48,48]], 6); // a one-pip result
// drawNumericResult(ctx, image, "slate", 20, 20, drawValueGlyph);
```

`stampPip` checks the 96 × 96 cell boundary; it does not know the forward-face polygon. The generic point-list function therefore requires a layout that the game has reviewed for that shape. The D6 helper uses the specific square-face layout above. The numeric callback must keep its glyphs within the supplied rectangle and choose a style that remains readable on the selected material.

These functions draw into the caller's current coordinate system and do not clear the destination. Clear an offscreen result texture before composing into it, or redraw the scene background each frame. To draw around a root point, translate to the root, apply a uniform scale, translate by `(-48, -48)`, and then draw both the die and its result. Cache a composed result if useful, keyed by material, die type, value, and presentation style.

### Display states and roll feedback

The atlas supplies one stable orientation per die and material. Moving through columns changes the die type, while moving between the first two rows changes material. Neither operation represents a physical roll of one die.

| State or action | Recommended display behavior | Finish / controller event |
|---|---|---|
| Unrolled / preview | Hold the selected blank die. | Wait for the game to request a roll. |
| Rolling feedback | Move the same die with a short jitter, bob, or subtle scale pulse. | Wait for the visual interval and the game's result to be ready. |
| Result reveal | Compose the result on the forward face. | Dispatch a single result-revealed event. |
| Settled result | Hold the composed die and its markings. | Continue until collection, selection, or another roll. |
| Selected / highlighted | Apply a game-authored highlight or small whole-die lift. | Return to the resting transform when selection ends. |
| Reroll / clear | Clear the previous markings and start the next requested feedback interval. | Reveal the new result once. |

A **480 ms feedback interval** is a useful starting point for a brief UI roll. The following optional sampler produces a small translation that fades to zero. It does not choose an outcome, change die type, or supply physical rolling frames.

```javascript
function sampleRollFeedback(elapsedMs, durationMs = 480) {
  if (!Number.isFinite(durationMs) || durationMs <= 0 ||
      !Number.isFinite(elapsedMs)) {
    throw new RangeError("Use a finite elapsed time and positive duration");
  }
  const t = Math.max(0, Math.min(1, elapsedMs / durationMs));
  const amplitude = 3 * (1 - t);
  return {
    offsetX: Math.round(Math.sin(t * Math.PI * 10) * amplitude),
    offsetY: Math.round(-Math.abs(Math.sin(t * Math.PI * 6)) * amplitude),
    complete: t >= 1
  };
}
```

Keep the selected material and die type fixed during this feedback. Store the gameplay result in the controller, rather than generating a new result on every render update. Reveal it when the feedback is complete and the result is available, and issue any gameplay event once on that state transition. A full three-dimensional tumble requires additional artwork or a separate 3D representation; it is not contained in this static atlas.

## 5. Important integration notes

### Verified relationships in the delivered PNG

These checks refer to the final image pixels, not only the design request.

| Relationship or property | Verified result |
|---|---|
| Bone D4 and slate D4 | Identical alpha silhouette and placement |
| Bone D6 and slate D6 | Identical alpha silhouette and placement |
| Bone D8 and slate D8 | Identical alpha silhouette and placement |
| Bone D10 and slate D10 | Identical alpha silhouette and placement |
| Bone D12 and slate D12 | Identical alpha silhouette and placement |
| Bone D20 and slate D20 | Identical alpha silhouette and placement |
| Bone/slate small pips | Matching 6 × 6 alpha footprint; 32 opaque pixels each |
| Bone/slate medium pips | Matching 8 × 8 alpha footprint; 52 opaque pixels each |
| Bone/slate large pips | Matching 10 × 10 alpha footprint; 80 opaque pixels each |
| Pip centers | All exactly (48, 48) within their full cells |
| Transparency | Alpha is exclusively 0 or 255 |
| Cell separation | Every sprite is inside its own cell; minimum die padding is 9 px |
| Face content | No baked-in numbers, pip patterns, runes, or labels |

### Preserve the result-face registration

The logical face anchor is **(48, 48)**. Pixel rounding and worn edges mean a measured face-region centroid can differ from that point by less than a pixel; the image does not embed a mathematically exact polygon-center marker. Keep the shared logical anchor instead of independently recentering each die or material.

The die silhouette and its front face have different bounds. For example, the D6's top and side faces extend beyond its result square, and the D8's lower point extends below its result triangle. Use the forward face for result layout and the complete cell for drawing. Do not stretch each visible silhouette to fill 96 × 96, align it independently to the bottom of the cell, or resize a material variant differently from its pair.

If an importer trims transparency, preserve the trim offset and the pivot listed in section 6. Using the geometric center of each tight rectangle as a replacement pivot would move the result-face anchor.

### Lighting and compositing

Choose bone pips for bone dice and slate pips for slate dice. Their rim colors and recess shadows are already designed to sit on those surfaces. Ordinary source-over compositing preserves the painted recess; additive blending or an extra drop shadow would change its appearance.

Keep every pip stamp in the same orientation. Its dark upper-left inner wall and light lower-right inner rim are directional, even though its footprint is circular. Rotating or reflecting individual pips can make some look raised or lit from a different direction.

Transform a completed die and all markings together. A whole-image rotation also rotates the baked lighting, because the PNG has no dynamic lighting data. Use translation-based feedback when the light needs to remain visually fixed at the upper left. The supplied blank views and unrotated overlays already share that lighting direction.

### Face capacity and readability

Choose pip size and layout for the actual face, not for the overall 96 × 96 cell. A triangle or kite narrows toward its points. Count the entire pip footprint, including the bright rim, when checking clearance. A full-cell clipping rectangle or opaque die mask cannot prevent a marking from crossing onto a neighboring facet.

The D6 layouts in this guide are concrete starting layouts for that square face. Higher values and other shapes need their own authored arrangement or a different result presentation. The optional numeric renderer illustrates how to display all values without implying that a corresponding count of large circular divots fits every face.

A larger display scale enlarges both the die and the pips together and does not create more relative space on the face. If the game needs a different density of markings, that is a separate layout, scale, or asset decision. Inspect results at the final gameplay size so the darker slate recesses and two-digit values remain readable.

### Rendering and game behavior

Use nearest-neighbor/point sampling, preserve alpha, and avoid lossy recompression. Integer display scales and positions preserve crisp pixel edges. The PNG includes no external cast shadow, floor, labels, or guide lines. Any selection outline or scene shadow is a separate game effect.

The source atlas has zero gutters. If repacking for filtered sampling or mipmaps, add destination-atlas padding/extrusion while preserving the original logical cell rectangles and pivots. Do not expand a source crop into a neighboring cell to obtain padding.

Game state determines the result, value mapping, randomization, event timing, and scoring. Animation timing does not determine which number is rolled. The example uses `1..sides` as a presentation convention; choose one explicit mapping for the actual minigame and keep the visual label consistent with it.

## 6. Exact rectangle appendix

All rectangles use **`(x, y, width, height)`**, with excluded right and bottom edges. Atlas coordinates refer to the full 576 × 288 image. Local coordinates refer to one 96 × 96 cell.

### Full-cell extraction rectangles

| Row | Column 1 | Column 2 | Column 3 | Column 4 | Column 5 | Column 6 |
|---|---|---|---|---|---|---|
| 1 — Bone dice | D4 `(0, 0, 96, 96)` | D6 `(96, 0, 96, 96)` | D8 `(192, 0, 96, 96)` | D10 `(288, 0, 96, 96)` | D12 `(384, 0, 96, 96)` | D20 `(480, 0, 96, 96)` |
| 2 — Slate dice | D4 `(0, 96, 96, 96)` | D6 `(96, 96, 96, 96)` | D8 `(192, 96, 96, 96)` | D10 `(288, 96, 96, 96)` | D12 `(384, 96, 96, 96)` | D20 `(480, 96, 96, 96)` |
| 3 — Pip overlays | Bone 6 px `(0, 192, 96, 96)` | Bone 8 px `(96, 192, 96, 96)` | Bone 10 px `(192, 192, 96, 96)` | Slate 6 px `(288, 192, 96, 96)` | Slate 8 px `(384, 192, 96, 96)` | Slate 10 px `(480, 192, 96, 96)` |

### Tight pip source rectangles

These are the preferred source crops for drawing individual native-size divots. Their rectangular bounds contain a circular pixel footprint, so their corner pixels can still be transparent.

| Sprite | Local tight crop | Tight atlas crop | Center in atlas | Pivot within tight crop |
|---|---|---|---|---|
| `bone_pip_6` | `(45, 45, 6, 6)` | `(45, 237, 6, 6)` | `(48, 240)` | `(3, 3)` |
| `bone_pip_8` | `(44, 44, 8, 8)` | `(140, 236, 8, 8)` | `(144, 240)` | `(4, 4)` |
| `bone_pip_10` | `(43, 43, 10, 10)` | `(235, 235, 10, 10)` | `(240, 240)` | `(5, 5)` |
| `slate_pip_6` | `(45, 45, 6, 6)` | `(333, 237, 6, 6)` | `(336, 240)` | `(3, 3)` |
| `slate_pip_8` | `(44, 44, 8, 8)` | `(428, 236, 8, 8)` | `(432, 240)` | `(4, 4)` |
| `slate_pip_10` | `(43, 43, 10, 10)` | `(523, 235, 10, 10)` | `(528, 240)` | `(5, 5)` |

For example, the slate large pip's tight crop covers atlas pixel columns **523–532** and rows **235–244**. Sampling that crop at a 10 × 10 destination preserves its native footprint. Sampling its full cell at 96 × 96 also preserves the footprint, provided that the full-cell center is aligned correctly.

### Measured die bounds and trim-relative pivots

These are the complete visible die bounds, including the side faces and bevels. They are **not result-face placement polygons**. Bone and slate share the same local bounds for each type.

| Type | Tight local bounds | Tight bone atlas bounds | Tight slate atlas bounds | Logical pivot within tight crop |
|---|---|---|---|---|
| D4 | `(17, 10, 64, 59)` | `(17, 10, 64, 59)` | `(17, 106, 64, 59)` | `(31, 38)` |
| D6 | `(22, 10, 64, 61)` | `(118, 10, 64, 61)` | `(118, 106, 64, 61)` | `(26, 38)` |
| D8 | `(14, 16, 68, 70)` | `(206, 16, 68, 70)` | `(206, 112, 68, 70)` | `(34, 32)` |
| D10 | `(10, 14, 74, 73)` | `(298, 14, 74, 73)` | `(298, 110, 74, 73)` | `(38, 34)` |
| D12 | `(10, 12, 76, 73)` | `(394, 12, 76, 73)` | `(394, 108, 76, 73)` | `(38, 36)` |
| D20 | `(12, 10, 70, 74)` | `(492, 10, 70, 74)` | `(492, 106, 70, 74)` | `(36, 38)` |

For normalized atlas coordinates, divide x and width by **576**, and y and height by **288**. If an engine's texture rectangle API uses a bottom-left origin, convert the source rectangle's y with `bottomOriginY = 288 - y - height`; this changes the coordinate convention, not the intended orientation of the die artwork.

The sprite IDs, D6 layouts, suggested numeral box, and roll-feedback duration are integration choices. They can be renamed or adjusted while the exact source rectangles and the shared logical anchors remain unchanged.
