# Gothic Main Menu Background — Sprite Sheet Guide

## 1. Asset and contents

[main_menu_background_spritesheet.png](main_menu_background_spritesheet.png) contains one looping background for the game’s main menu. Fluted slate columns and pointed cathedral arches frame a continuous slab of dark charcoal stone. Tarnished gold vines curl around recessed ironwork. At the top, a crescent cradles a carved sun above a violet crystal. A smaller crest at the bottom sits between two cyan inlays.

An ivory-gold pulse travels clockwise through the inner channel, with violet behind its leading edge and a short cyan trail. Local glints pick out nearby carvings and crystal facets. The central stone, its fine cracks, and the frame’s alignment stay fixed throughout the loop.

| Property | Value |
|---|---|
| Sheet | 3000 × 1800 px, opaque RGB PNG |
| Grid | 3 columns × 3 rows, zero margins and gutters |
| Frame | 1000 × 600 px, 5:3 landscape |
| Animation | `main_menu_background`, 9 distinct frames |
| Playback | Clockwise loop, 150 ms per frame, 1350 ms per circuit |
| Reserved menu rectangle | `(120, 108, 760, 384)` within each frame |
| PNG metadata | `Animation` text field with the grid, playback settings, and menu rectangle |
| PNG SHA-256 | `ab0d4d4815ee77b086147e66e6cfd0ed2166b7e540391b3b2c411f5972c320a1` |

## 2. Coordinates and frame locations

Coordinates start at the top-left corner, with x increasing to the right and y increasing downward. The frame labels **F1–F9** correspond to animation indices **0–8**. Rectangles use `(x, y, width, height)` with an exclusive right edge and bottom edge.

| Sheet row | Left column · x = 0 | Middle column · x = 1000 | Right column · x = 2000 |
|---|---|---|---|
| Top · y = 0 | F1 | F2 | F3 |
| Middle · y = 600 | F4 | F5 | F6 |
| Bottom · y = 1200 | F7 | F8 | F9 |

For zero-based index `i`, the source rectangle begins at `x = (i % 3) × 1000` and `y = floor(i / 3) × 600`. Always draw the full cell at the same destination. The pulse coordinates below use the top-left corner of **the extracted frame** as their origin.

## 3. Clockwise sequence and frame timings

Hold each frame for **150 ms**. Each pose advances about **276.48 px** along the 2488.30 px channel, including its angled corners and the bends at the crests. The last step from F9 back to F1 covers the same distance. The pulse centers below are rounded to the nearest pixel. Each time interval includes its start and excludes its end.

| Frame | Time within loop (ms) | Pulse center (x, y) | Visible action |
|---|---:|---:|---|
| F1 | 0–150 | (500, 94) | The pulse lights the violet crystal beneath the upper sun and crescent. |
| F2 | 150–300 | (772, 79) | It travels right along the upper rail toward the corner arch. |
| F3 | 300–450 | (896, 242) | It descends the right rail beside the fluted column. |
| F4 | 450–600 | (889, 515) | It rounds the lower-right bevel and turns left. |
| F5 | 600–750 | (616, 525) | It approaches the lower crest from the right, catching the right cyan inlay. |
| F6 | 750–900 | (382, 525) | It continues left beyond the lower crest, with a glint near the left cyan inlay. |
| F7 | 900–1050 | (110, 515) | It rounds the lower-left bevel and turns upward. |
| F8 | 1050–1200 | (104, 241) | It climbs the left rail beside the column. |
| F9 | 1200–1350 | (228, 79) | It travels right along the upper-left stretch toward the top crest. |

The pulse crosses the bottom-center crest **between F5 and F6**. At **1350 ms**, advance directly from F9 to F1 to preserve the cadence.

## 4. Building and playing the sequence

1. Import the PNG at its original size and slice it into nine **1000 × 600** cells. Use nearest-neighbor sampling to preserve the pixel edges.
2. Create the `main_menu_background` clip in row-major order, indices `0` through `8`. Set a uniform 150 ms hold and enable looping.
3. Draw the selected frame as the menu background. Draw the title, buttons, text, and focus indicator over it, using the same frame origin and scale.

The PNG’s `Animation` text field contains the following values. For engines that import the PNG as a single texture, these values also serve as the manual clip settings.

```json
{
  "name": "main_menu_background",
  "frameWidth": 1000,
  "frameHeight": 600,
  "columns": 3,
  "rows": 3,
  "order": "row-major",
  "loop": true,
  "frameDurationsMs": [150, 150, 150, 150, 150, 150, 150, 150, 150],
  "menuRect": [120, 108, 760, 384]
}
```

### JavaScript Canvas example

Pass a loaded PNG and the elapsed milliseconds since the menu opened. The function draws into a **1000 × 600 logical viewport**. Selecting the frame from elapsed time keeps the loop at its authored speed across different display refresh rates.

```javascript
function drawMainMenuBackground(ctx, atlas, elapsedMs) {
  const frameWidth = 1000;
  const frameHeight = 600;
  const frameIndex = Math.floor(Math.max(0, elapsedMs) / 150) % 9;
  const sourceX = (frameIndex % 3) * frameWidth;
  const sourceY = Math.floor(frameIndex / 3) * frameHeight;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(atlas, sourceX, sourceY, frameWidth, frameHeight,
                0, 0, frameWidth, frameHeight);
  ctx.restore();
}
```

## 5. Menu placement and rendering notes

Place the title and controls inside **`(120, 108, 760, 384)`** in frame-local coordinates. The rectangle covers pixels **x = 120–879** and **y = 108–491**, centered at **(500, 300)**. This leaves 120 px on either side and 108 px above and below. The region occupies the central **76% of the frame width and 64% of its height**. All nine frames contain identical RGB pixels throughout this rectangle, including the stone grain and cracks.

To fit the complete frame inside a viewport of width `W` and height `H`, use `s = min(W / 1000, H / 600)` and center it at offsets `dx = (W − 1000s) / 2` and `dy = (H − 600s) / 2`. The on-screen menu rectangle then begins at `(dx + 120s, dy + 108s)` and measures `(760s, 384s)`. Applying that transform to the controls and their hit areas keeps them aligned with the visible menu after a resize.

## 6. Exact rectangle appendix

Use these sheet coordinates to extract each complete frame. The destination rectangle is the same for all nine.

| Frame | Zero-based index | Source rectangle `(x, y, width, height)` |
|---|---:|---|
| F1 | 0 | `(0, 0, 1000, 600)` |
| F2 | 1 | `(1000, 0, 1000, 600)` |
| F3 | 2 | `(2000, 0, 1000, 600)` |
| F4 | 3 | `(0, 600, 1000, 600)` |
| F5 | 4 | `(1000, 600, 1000, 600)` |
| F6 | 5 | `(2000, 600, 1000, 600)` |
| F7 | 6 | `(0, 1200, 1000, 600)` |
| F8 | 7 | `(1000, 1200, 1000, 600)` |
| F9 | 8 | `(2000, 1200, 1000, 600)` |
