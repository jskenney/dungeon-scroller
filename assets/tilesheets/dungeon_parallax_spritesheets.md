# Dungeon Undercroft — Three-Layer Parallax Background Guide

## 1. Asset and environment

This guide documents the three delivered PNGs used as a coordinated, horizontally scrolling background for the cathedral's vaulted undercroft. All are straight-on side elevations with cool charcoal masonry, blue-gray slate, muted metal details, and a deliberately subdued lower gameplay area. The foreground tiles, characters, enemies, projectiles, and pickups are separate game layers; these images provide *noninteractive background scenery*.

| Layer / asset | Size | Format | Alpha | File size |
|---|---|---|---|---:|
| `dungeon_parallax_far.png` | 2000 × 600 | RGB PNG | Fully opaque | 257,935 bytes |
| `dungeon_parallax_mid.png` | 2000 × 600 | RGBA PNG | Binary 0/255 transparency | 356,084 bytes |
| `dungeon_parallax_near.png` | 2000 × 600 | RGBA PNG | Binary 0/255 transparency | 151,110 bytes |

Each image is **a complete 2000 × 600 texture**, not a conventional grid of animation cells. Draw all three at the same vertical origin behind a **1000 × 600 logical viewport**; the game produces animation by changing their relative horizontal offsets. They contain no embedded frame-sequence timing, collision geometry, UI, actors, walkable platforms, or navigation data.

**Important verification note:** The middle image's leftmost and rightmost pixel columns are equal in every row. The far wall and near foreground do **not** have identical first/last columns: respectively **338** and **67** of their 600 row-wise edge pixels differ. Matching edge columns alone is not a complete seamless-tiling test, but these differences mean the delivered far and near files should **not be considered pixel-perfect seamless**. At their repeat joins, a narrow discontinuity may become visible. The guide documents the files as delivered rather than claiming they pass a seam test.

## 2. Layer descriptions and registration

### Far background — `dungeon_parallax_far.png`

The furthest depth plane is a continuous opaque charcoal stone wall with three broad, shallow pointed-arch recesses. Each recess is *blind*: it is filled with darker slate masonry, not a window into another scene. Large stone courses, uneven mortar lines, subdued chipped arches, and cool dampened shading establish scale without competing with playable entities. The wall continues to the image's lower edge; it does not include a walkable floor.

- **Rendering:** first, with no transparency; it covers the logical viewport behind all other art.
- **Recommended scroll factor:** `0.15` of camera displacement for slow distant movement.
- **Vertical placement:** top at logical screen `y = 0` and bottom at `y = 600`.

### Middle background — `dungeon_parallax_mid.png`

The middle layer is a separate, deeper-shadowed Gothic arcade: six comparatively narrow pointed bays spaced along the 2000-pixel panorama, divided by fluted slate piers. Recessed iron grilles occupy selected bays, while faint tarnished-gold vine carving adds an architectural accent. The open bays have **actual alpha-zero pixels**, letting the far wall show through. Pier and grille shapes remain decorative, not physical level boundaries.

- **Rendering:** alpha-composited over the far layer; transparent openings are essential to the depth effect.
- **Recommended scroll factor:** `0.40` of camera displacement.
- **Measured transparency:** 60.22% of the full image; 80.20% of pixels in its lower half are transparent.
- **Vertical placement:** same `(0, 0)` viewport origin as the far layer.

### Near background — `dungeon_parallax_near.png`

The nearest *background* layer contains sparse overhead stone ribs, broken corbels and hanging remnants of ironwork. Dim violet crystal sockets and cyan inlays sit high within the stone, echoing the game's space-magic and cathedral ornament while staying visually subordinate. It intentionally leaves broad openings between groups and does not descend into the actor's main movement corridor.

- **Rendering:** alpha-composited over the middle and far layers but **behind** the gameplay world.
- **Recommended scroll factor:** `0.70` of camera displacement; faster than the middle layer, slower than level geometry.
- **Measured transparency:** 93.80% overall. All pixels from **local `y = 228` through `599`** are fully transparent in the actual PNG.
- **Vertical placement:** same origin and height as the other layers.

All layer scroll factors are **implementation suggestions**, not image metadata. The far recess width, middle bay spacing and near corbel spacing intentionally differ; their positions should drift relative to one another as the camera travels.

## 3. Source coordinates and composition rules

Each file uses the following shared coordinate system:

| Item | Local rectangle `(x, y, width, height)` | Explanation |
|---|---|---|
| Complete image | `(0, 0, 2000, 600)` | Full repeating horizontal period |
| Logical viewport at 1× | `(0, 0, 1000, 600)` | Draw one viewport-width portion of each repeating texture |
| Horizontal seam | between `x = 1999` and wrapped `x = 0` | Both edges must visually continue for an exact seamless scroll |
| Foreground play space | Not encoded in background pixels | The game draws walkable geometry and characters later |

Pixels are addressed from the **top-left corner** with increasing x to the right and increasing y downward. Rectangles include their left/top edges and exclude their right/bottom edges. Unlike the sprite sheets for actors or props, there is **no 96 × 96 extraction grid**, no animation row index, and no per-frame pivot.

The recommended common origin is the *top-left of the viewport*. Do not center a 2000-pixel image in a 1000-pixel viewport or shrink it by half: either action changes the intended relative pixel density. Crop or tile a native-size 1000-pixel viewport window and let the camera offset control which part is visible.

### Draw order

1. **Opaque far wall** (`dungeon_parallax_far.png`).
2. **Transparent middle arcade** (`dungeon_parallax_mid.png`).
3. **Transparent near ribs** (`dungeon_parallax_near.png`).
4. Foreground gameplay tiles, platforms and architecture.
5. Characters, enemies, interactive objects, projectiles and local effects (in the game's required ordering).
6. HUD, menus and other UI.

Do not promote the near-rib layer above actors; its masonry should not cover the hero, enemy attack effects or pickups.

## 4. Import and scrolling implementation

### Import settings

Import all files as ordinary textures with **nearest-neighbor/point filtering**, no lossy recompression, and no per-image auto-trimming. Preserve the source **2000 × 600** pixel size, and use normal alpha blending for the middle and near layers. Use a shared fixed vertical registration and avoid rescaling one layer independently of the others.

### Horizontal looping

For a 2000-pixel period `P`, choose each layer's x offset from the camera position and its independent scroll factor:

```text
P = 2000
scroll = cameraX * layerFactor
offset = ((scroll % P) + P) % P
```

The normalization above works for positive and negative camera coordinates. Draw the same texture in successive copies, separated by exactly `P` source pixels. In a 1000-pixel-wide viewport, two copies suffice for any fractional offset; their neighboring edges must meet without extra padding. The images use no gutters, and **tile overlap should be zero**, not one pixel.

### JavaScript Canvas example

This self-contained drawing helper assumes the three PNGs have already been loaded into `images`. It clips rendering to a 1000 × 600 logical viewport, uses a factor for each layer, and draws enough copies to cover any horizontal offset. It intentionally leaves gameplay tiles and sprites to the caller.

```javascript
const PARALLAX_WIDTH = 2000;
const PARALLAX_HEIGHT = 600;
const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 600;

const parallaxLayers = [
  { id: "far",  factor: 0.15 },
  { id: "mid",  factor: 0.40 },
  { id: "near", factor: 0.70 }
];

function positiveMod(value, modulus) {
  return ((value % modulus) + modulus) % modulus;
}

function drawParallaxLayer(ctx, image, cameraX, factor) {
  const offset = positiveMod(cameraX * factor, PARALLAX_WIDTH);
  // First copy begins at -offset. Subsequent copies continue with no gap.
  for (let x = -offset; x < VIEW_WIDTH; x += PARALLAX_WIDTH) {
    ctx.drawImage(image, x, 0, PARALLAX_WIDTH, PARALLAX_HEIGHT);
  }
}

function drawDungeonParallax(ctx, images, cameraX) {
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = false;
    ctx.beginPath();
    ctx.rect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.clip();
    for (const layer of parallaxLayers) {
      drawParallaxLayer(ctx, images[layer.id], cameraX, layer.factor);
    }
  } finally {
    ctx.restore();
  }
}

// Example: call before drawing gameplay tiles, actors and interface.
// drawDungeonParallax(ctx, { far: farImage, mid: midImage,
//                             near: nearImage }, cameraX);
```

**Implementation detail:** draw positions can be fractional when `cameraX × factor` is not an integer. For a deliberately hard pixel grid, snap the screen-space draw offset to whole logical pixels (for example `Math.round(...)`), using the *same snapped offset* for both adjacent copies of a layer. Snapping each copy independently may introduce one-pixel seams. A source texture must itself be seamless to prevent a visible pattern discontinuity: pixel snapping cannot fix the existing edge differences in the far or near images.

### Camera behavior

These textures do not supply camera acceleration, vertical parallax or player movement. Keep `y = 0` for all three layers when scrolling horizontally. If the gameplay camera moves vertically, decide separately whether each background follows the vertical camera, holds fixed, or uses another factor. Never derive the texture's apparent floor position from its lowest opaque pixel.

## 5. Important alignment, readability and QA notes

### Original-size pixel and transparency checks

The following measurements were taken from the actual delivered PNG bytes:

| Verification | Far | Middle | Near |
|---|---|---|---|
| Native dimensions | 2000 × 600 | 2000 × 600 | 2000 × 600 |
| Opaque/alpha | Opaque RGB | RGBA, 0 or 255 | RGBA, 0 or 255 |
| Transparent pixels | 0% | 60.22% | 93.80% |
| First/last edge-column mismatching rows | 338/600 | 0/600 | 67/600 |
| Fully transparent below local y = 300 | No | No | Yes |

**Seam caution:** the far and near PNGs may show a hard transition at the `1999 → 0` join. Before shipping a continuously scrolling level, preview a two-copy repeat at 1× and 2×, with the seam crossing a flat wall segment. If the difference is distracting, repair **both matching edge neighborhoods** (not just their last column), then recheck. That would produce a new version of the image; this document does not silently modify the delivered textures.

### Separation from gameplay elements

The far layer should remain the darkest and least detailed. The middle layer's piers, grilles and small gold vine marks are background elements only; do not attach collision to the apparent grilles or treat their openings as doorways. The near layer's ribs and iron fragments stay above the player path, with their small violet/cyan accents confined to masonry. The game places the actual dungeon floor, traversal platforms, monsters, interactables and lighting effects over these backgrounds.

The three textures are not time-based animation sprites. Their movement is driven by the camera position, and a screenshot at any instant is a compositing result of the three independently offset textures. Choosing scroll factors farther apart increases the depth motion; reducing them creates a calmer backdrop.

### Source integrity

Use the file checksums in section 6 to identify the exact source assets. If any layer is repaired or resaved, recalculate the checksum and update this guide. PNG transparency should survive loading, atlas repacking and export: do not flatten the middle or near layers onto a black background.

## 6. Copyable asset metadata

This JSON is an example manifest for the game, not metadata embedded in the PNGs. It uses frame-local top-left coordinates and explicit background draw ordering.

```json
{
  "name": "dungeon_undercroft_parallax",
  "logicalViewport": {"width": 1000, "height": 600},
  "textureWidth": 2000,
  "textureHeight": 600,
  "horizontalPeriod": 2000,
  "horizontalRepeat": true,
  "coordinateOrigin": "top-left",
  "layers": [
    {"id": "far", "image": "dungeon_parallax_far.png", "opaque": true, "scrollFactor": 0.15, "zOrder": 0, "sha256": "0ad382d6002962e97dedca65c49cb32ad7032292bce0c9a2dca5c8ae5bfeb6a9"},
    {"id": "mid", "image": "dungeon_parallax_mid.png", "opaque": false, "scrollFactor": 0.40, "zOrder": 1, "sha256": "c96d04afb6dc02f027cdd8308cbb08c00a1c488d6b1829d5283d363ed750324a"},
    {"id": "near", "image": "dungeon_parallax_near.png", "opaque": false, "scrollFactor": 0.70, "zOrder": 2, "sha256": "6afd2878c78a9120e55e783568203e119dff6f74cca1b0961864e5be355718ff"}
  ],
  "gameplayForegroundDrawnAfterLayers": true,
  "sourceSeamVerification": {"far": "requires repair for pixel-perfect seamless repeat", "mid": "first/last columns match", "near": "requires repair for pixel-perfect seamless repeat"}
}
```

Keep this Markdown with the three PNGs in one game asset folder so the filenames are easy to resolve. Scroll factors, rendering API, future seam repairs and gameplay level design can change independently of the source coordinate system.
