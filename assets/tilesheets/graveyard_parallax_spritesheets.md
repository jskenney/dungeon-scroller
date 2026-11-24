# Graveyard Parallax Backgrounds — Asset and Integration Guide

## 1. Asset and contents

This guide covers three coordinated background images for the cemetery beneath a ruined Gothic cathedral in the original side-scrolling fantasy game. The intended render order is **Far → Mid → Near → playable terrain → entities and effects**. The same visual camera is used throughout: side elevation, blue-gray overcast night lighting, Gothic slate masonry and low-contrast silhouettes. The three images are **background strips**, not sprite animation frames or collision geometry.

| Role / intended filename | Content | Intended game asset | Inspected generated source | Source format |
|---|---|---|---|---|
| `graveyard_parallax_far.png` | Overcast sky, distant ridge, cathedral and yews | 2000 × 600, opaque | 2290 × 687 | RGB PNG |
| `graveyard_parallax_mid.png` | Broken cemetery boundary wall, lancet openings, fence panels and yews | 2000 × 600, transparent openings | 2172 × 724 | RGBA PNG |
| `graveyard_parallax_near.png` | Overhanging bare branches, leaning grave markers, family crypt and ironwork | 2000 × 600, transparent openings | 2172 × 724 | RGBA PNG |

**Important source-versus-target distinction:** The generated PNGs inspected for this document have the **source dimensions** above, not the originally requested 2000 × 600 pixels. The requested filenames are the asset names to use after preparing the production versions. The images are static; parallax motion is supplied by the game camera, not by frames embedded in the PNG.

### Source-file identification

The corresponding original generated files are:

| Role | Current generated source filename | SHA-256 of inspected source |
|---|---|---|
| Far | `a_wide_2000_600_pixel_style_pixel_art_panoramic_ba_1.png` | `1150db9d0d548fdcb52e0fc8ea33308e714e30f4939d58ec3ad8158cc7242705` |
| Mid | `a_wide_horizontal_pixel_art_scene_on_a_transparen_2_batch_1.png` | `b112b61c867cc0e8ef17c3afa0ca3fbf0bd4dff177e251525e2756b369241899` |
| Near | `a_wide_landscape_pixel_art_png_transparent_backgr_3_batch_2.png` | `2507520890b38470a65145109d987d91ca8b8928c159f2e371e27516856c5da8` |

These hashes identify the inspected originals. **Any cleanup, edge correction, resizing or recompression changes the hash** and should be documented separately.

## 2. Picture descriptions and visual hierarchy

### Far — `graveyard_parallax_far.png`

The far image is a fully opaque panorama of a dim blue-gray sky covered in broad, subdued cloud bands. Rolling dark ridges occupy the lower portion, with clumps of distant yew trees and a Gothic cathedral rising from the skyline, slightly right of center. One cathedral tower has a visibly broken or irregular spire. Architectural details are simplified and low contrast so the buildings appear far away.

This layer is the **backstop** for all transparency above and between the foreground silhouettes. It should fill the logical screen and never be rendered as an interactable wall, building, or platform. Move it the least as the camera travels.

### Mid — `graveyard_parallax_mid.png`

The middle image depicts a long, weathered cemetery boundary wall. Its heights vary between sections with chipped caps, collapsed masonry, narrow pointed-arch openings, and wrought-iron fence panels. Tall, leafless tree forms rise beyond portions of the wall. Moss-dark staining and restrained worn-metal highlights provide a little detail without competing with gameplay.

**Intended cutouts:** Sky above the wall, spaces between iron bars, broken wall gaps, and the pointed openings should reveal the far landscape. **Current source limitation:** The inspected middle source has no pixels with alpha exactly zero; all pixels are partially transparent. Its light, misty upper background may therefore appear as a translucent pale overlay rather than a clean opening. Prepare a corrected RGBA matte before production use; do not treat the raw middle source as a finished transparent cutout.

The wall cap should be visually subordinate to the playable terrain. It provides depth and framing, **not a collision surface**.

### Near — `graveyard_parallax_near.png`

The closest background layer is much sparser. Long, twisted bare branches descend from the top left and top right. Dark, low-contrast silhouettes of leaning headstones, broken short masonry, a fenced patch, and a small family crypt sit near the bottom, with broad gaps exposing the layers behind. The crypt has a low pitched roof, a recessed arched entry and dark ironwork. The palette remains charcoal and blue-gray, darker than the active graveyard tiles.

The source includes genuine fully transparent regions, although its stone and branch edges use partially transparent pixels. Render it **behind the playable grave markers, enemies, heroes, hazards and pickups**, never as a screen-space foreground UI overlay. Its purpose is depth, not occlusion of gameplay.

### Hierarchy

| Layer | Relative contrast | Detail emphasis | Empty-space strategy |
|---|---|---|---|
| Far | Lowest | Broad clouds and distant architectural silhouettes | Opaque continuous background |
| Mid | Moderate, still behind gameplay | Masonry, pier and ironwork edges | Openings between and above structures |
| Near | Dark silhouettes, locally sharper | Bare branches and crypt silhouette | Large transparent gaps, especially at mid height |
| Gameplay | Highest readability | Tiles, actors, projectiles, pickup effects | Not part of these files |

## 3. Coordinates, registration and horizontal repetition

The **target logical viewport** is **1000 × 600 pixels**. The **target strip size** for each production-ready layer is **2000 × 600 pixels**, exactly two viewport widths. The origin is at the top left: x grows rightward and y downward.

All layers share the same logical vertical origin, **(0, 0)**. Do not bottom-align each image to its lowest opaque pixel: that would shift the skyline, wall openings and overhead branches relative to one another. Keep the alignment fixed even when a silhouette ends high above the bottom edge.

At target size, a strip contains two nominal 1000 × 600 viewport-width sections:

| Portion | Source rectangle `(x, y, width, height)` |
|---|---|
| First half | `(0, 0, 1000, 600)` |
| Second half | `(1000, 0, 1000, 600)` |
| Whole repeated strip | `(0, 0, 2000, 600)` |

**These are scrolling portions, not animation frames.** Do not advance from the first half to the second on a frame timer. The renderer samples a continuous horizontal offset determined by the camera.

For layer scroll factor `f`, camera world x-coordinate `cameraX`, and normalized strip width `L = 2000`:

```text
scrollX = ((cameraX * f) % L + L) % L
firstDrawX = -scrollX
secondDrawX = firstDrawX + L
```

Repeat the image at those x-positions. When the viewport could be wider than one strip, draw additional instances until all pixels are covered. Use the **same world-to-logical-screen scaling** for the three layers rather than independently adjusting their aspect ratios.

### Seam-readiness findings for the source PNGs

A pixel-level check of each source's first and last column gave the following. These tests do **not** prove perceptual seamlessness, but they identify obvious edge mismatches that should be inspected in a doubled preview.

| Source | Exact matching first/last RGBA column rows | Alpha matching edge rows | Production implication |
|---|---:|---:|---|
| Far | 17 / 687 | 687 / 687 | Cloud and color edges differ; a visible join is possible |
| Mid | 13 / 724 | 52 / 724 | Both matte and color differ at the edges; seam correction needed |
| Near | 484 / 724 | 492 / 724 | Most empty rows match, but the crossing branch and grave silhouettes need alignment |

**Do not describe the inspected source PNGs as verified seamless.** Make the edges visually and alpha-continuous before enabling infinite repetition. A 1-column equality check is a useful regression test after the correction, but a side-by-side repeated preview remains necessary because matching one edge column alone does not guarantee nearby patterns blend.

## 4. Import, drawing order and JavaScript example

### Production preparation

1. Inspect the original generated source files in an image editor with transparency displayed as a checkerboard; avoid interpreting white in a preview as reliable alpha.
2. For the middle layer, remove the unwanted translucent upper haze while retaining masonry, tree and ironwork antialiasing only where deliberately intended. Openings should contain actual alpha-zero pixels.
3. Repair all three horizontal joins, including both image colors and the alpha boundary for the middle and near layers. Check by placing two copies directly adjacent and by moving the joining point through a 1000-pixel viewport.
4. Export each prepared image at **2000 × 600** in its intended mode: opaque for Far, RGBA with correct transparency for Mid and Near. Use nearest-neighbor resampling when resizing pixel art and inspect for loss of fine details; the generated originals do not exactly share the same source pixel dimensions.
5. Keep the same vertical alignment for the production exports. Do not trim transparent margins independently. No added gutters or outer borders are necessary for the source strips.
6. Record the revised image checksums and verify the final repeated edges again.

### Suggested parallax movement factors

| Layer | Factor relative to camera travel | For 100 pixels of camera travel |
|---|---:|---:|
| Far | `0.15` | 15 pixels |
| Mid | `0.40` | 40 pixels |
| Near | `0.70` | 70 pixels |
| Gameplay world | `1.00` | 100 pixels |

These are **suggested game settings**, not properties encoded in the PNGs. Adjust them for the level speed and desired depth. All three backgrounds can remain at one fixed vertical origin even if the game has vertical camera movement.

### JavaScript Canvas example

This example assumes the three **prepared production files** have been loaded into `images` with keys `far`, `mid` and `near`. It draws a 1000 × 600 logical viewport and preserves their shared vertical registration. It also handles negative camera coordinates and repeats the strip without inserting horizontal gaps.

```javascript
const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 600;
const STRIP_WIDTH = 2000;
const STRIP_HEIGHT = 600;

const GRAVEYARD_PARALLAX = [
  { id: "far",  image: "graveyard_parallax_far.png",  factor: 0.15 },
  { id: "mid",  image: "graveyard_parallax_mid.png",  factor: 0.40 },
  { id: "near", image: "graveyard_parallax_near.png", factor: 0.70 }
];

function wrapPositive(value, period) {
  return ((value % period) + period) % period;
}

function drawRepeatingStrip(ctx, img, scrollX) {
  const offset = wrapPositive(scrollX, STRIP_WIDTH);
  let drawX = -offset;
  while (drawX < VIEW_WIDTH) {
    ctx.drawImage(img, drawX, 0, STRIP_WIDTH, STRIP_HEIGHT);
    drawX += STRIP_WIDTH;
  }
}

function drawGraveyardParallax(ctx, images, cameraX) {
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    for (const layer of GRAVEYARD_PARALLAX) {
      const image = images[layer.id];
      if (!image) throw new Error(`Missing graveyard layer: ${layer.id}`);
      drawRepeatingStrip(ctx, image, cameraX * layer.factor);
    }
  } finally {
    ctx.restore();
  }
}

// Render the playable tilemap, heroes, enemies, hazards and pickups AFTER this call.
```

For very long worlds, normalize camera offsets as needed. When scrolling at fractional pixels, choose a consistent snapping strategy across the render pipeline; integer pixel snapping preserves sharp clusters but may produce small discrete motion steps. Keep sprite/terrain positioning consistent with that choice.

## 5. Gameplay integration and readability notes

- **Render order:** far sky/ridge, middle wall and fence, near branches/crypt, then the actual graveyard tileset, characters, enemies, projectiles, pickups and overlays. These background layers should never occlude gameplay sprites unintentionally.
- **No background collisions:** The distant cathedral, wall openings, crypt, fence and leaning stones are purely visual. Give collisions only to separately authored playable terrain and interactive objects.
- **No false platforms:** A continuous horizontal wall cap can look walkable if it is too bright. Keep the middle wall's lip subdued relative to the actual grass/stone walkable edges.
- **No false pickups:** The crypt's cross-like carving, sparse iron details and distant cathedral windows should remain unlit; avoid adding bright amber or cyan particles in these layers.
- **Texture import:** Preserve RGBA for the two overlay layers. Do not flatten them onto white; dark background layers will make any residual white matte particularly obvious.
- **Artifact scale:** Keep the three strips at one logical scale. The deliberately darker, lower-detail near layer is still a background layer, not a physically foreground platform layer.
- **Repeat quality:** A loop is correct only when the composition, color and transparency cross the seam naturally. Check both a static doubled strip and a scrolling test at several offsets.
- **Different resolutions:** Fit a 1000 × 600 logical viewport into the physical display using a single shared camera scale for the background and the playable scene. Do not stretch each parallax image to the screen independently.

### Source alpha measurements

The following measurements describe the inspected source exports, **not** the desired production-ready images:

| Source | Fully transparent pixels | Fully opaque pixels | Partially transparent pixels |
|---|---:|---:|---:|
| Far | 0% | 100% | 0% |
| Mid | 0% | 0% | 100% |
| Near | 81.69% | 0.04% | 18.27% |

The middle result is the main blocker for normal alpha compositing. Once its backdrop has been cleaned, most of the sky and openings should have alpha zero. The near layer's partially transparent contour pixels can be retained where they produce intentional soft dark silhouettes rather than a white halo.

## 6. Copyable configuration and final checks

This is proposed runtime configuration for the **prepared 2000 × 600 assets**. It is not metadata embedded in the original generated images.

```json
{
  "assetGroup": "graveyard_parallax",
  "logicalViewport": { "width": 1000, "height": 600 },
  "coordinateOrigin": "top-left",
  "stripWidth": 2000,
  "stripHeight": 600,
  "repeatX": true,
  "repeatY": false,
  "filtering": "nearest",
  "layers": [
    {
      "id": "far",
      "file": "graveyard_parallax_far.png",
      "opaque": true,
      "parallaxFactorX": 0.15,
      "offsetY": 0,
      "drawOrder": 0,
      "collidable": false
    },
    {
      "id": "mid",
      "file": "graveyard_parallax_mid.png",
      "opaque": false,
      "parallaxFactorX": 0.40,
      "offsetY": 0,
      "drawOrder": 1,
      "collidable": false
    },
    {
      "id": "near",
      "file": "graveyard_parallax_near.png",
      "opaque": false,
      "parallaxFactorX": 0.70,
      "offsetY": 0,
      "drawOrder": 2,
      "collidable": false
    }
  ]
}
```

**Acceptance checklist for the production assets:** each file is precisely 2000 × 600; Far has no transparent pixels; Mid and Near have true transparent openings; both edges tile without a visible color or alpha seam; objects remain behind playable terrain; and screenshots taken at varied camera offsets have no pop-in or discontinuous masonry. The source PNGs inspected for this guide **do not yet satisfy every item** in that checklist.
