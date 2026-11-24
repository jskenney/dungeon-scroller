# Welcome Screen — Sprite Sheet Guide

## 1. Asset and contents

[welcome_screen_spritesheet.png](welcome_screen_spritesheet.png) contains one looping welcome-screen background. A narrow pulse travels clockwise along a tarnished gold channel cut into beveled slate. An ivory-gold highlight leads the pulse, followed by a violet body and a short cyan shimmer. The nearby sun and crescent engravings brighten as it passes. Inside the frame, a single charcoal slab carries fine cracks and low-contrast stone texture. The slab and its lighting stay fixed behind the game’s title, buttons, and menu text.

| Property | Value |
|---|---|
| Sheet | 3000 × 1800 px, opaque RGB PNG |
| Grid | 3 columns × 3 rows, zero margins and gutters |
| Frame | 1000 × 600 px, 5:3 landscape |
| Animation | `welcome_screen`, 9 distinct frames, clockwise loop |
| Reading order | Across each row from left to right, then down to the next row |
| Loop duration | 1386 ms (1.386 seconds) |
| PNG metadata | Text field `Animation` contains the clip name, dimensions, order, loop flag, and frame durations |
| PNG SHA-256 | `fd5f13915480ba0941140d8ff684ba6ed6d431a7c6c53c4f4f2e7d8b6f18d121` |

## 2. Coordinates and frame locations

Sheet coordinates begin at the upper left. Positive x runs right and positive y runs down. The guide numbers frames **F1–F9**. Code uses indices **0–8**. Rectangles are written as `(x, y, width, height)` with the right and bottom edges excluded.

| Sheet row | Left column · x = 0 | Middle column · x = 1000 | Right column · x = 2000 |
|---|---|---|---|
| Top · y = 0 | F1 | F2 | F3 |
| Middle · y = 600 | F4 | F5 | F6 |
| Bottom · y = 1200 | F7 | F8 | F9 |

For zero-based frame index `i`, use `column = i % 3` and `row = floor(i / 3)`. The source rectangle is `(1000 × column, 600 × row, 1000, 600)`. Draw each extracted frame at the same screen origin. The pulse positions in section 3 and the menu rectangle in section 5 are local to that extracted frame.

## 3. Clockwise sequence and frame timings

The time intervals below include their start and exclude their end. At **481 ms**, for example, F4 begins and the pulse rounds the lower-right corner. The position column locates the center of the pulse along the channel. Its gold tip sits farther along the route and its cyan tail trails behind.

| Frame | Time within loop (ms) | Hold (ms) | Pulse center (x, y) | Visible action |
|---|---:|---:|---|---|
| F1 | 0–177 | 177 | (500, 55) | Crosses the top center, heading right |
| F2 | 177–322 | 145 | (854, 55) | Approaches the upper-right sun along the top edge |
| F3 | 322–481 | 159 | (948, 250) | Travels down the right edge |
| F4 | 481–693 | 212 | (910, 529) | Rounds the stepped lower-right corner beside the crescent |
| F5 | 693–913 | 220 | (500, 543) | Crosses the bottom center, heading left |
| F6 | 913–1039 | 126 | (80, 523) | Rounds the lower-left sun and turns upward |
| F7 | 1039–1167 | 128 | (52, 300) | Travels up the left edge |
| F8 | 1167–1273 | 106 | (80, 72) | Rounds the upper-left crescent and turns right |
| F9 | 1273–1386 | 113 | (274, 55) | Continues along the upper-left stretch toward top center |

Each hold corresponds to the distance along the channel to the next pose. For example, F5 covers the approach to the lower-left corner and has a 220 ms hold. F9 has a shorter return to top center and holds for 113 ms. At **1386 ms**, wrap directly to F1. F9 has its own artwork and occupies the final interval of every loop.

## 4. Building and playing the sequence

1. Import the PNG at its original dimensions and slice it into nine **1000 × 600** cells. Use point or nearest-neighbor sampling for crisp pixel edges.
2. Create a looping clip named `welcome_screen`. Add indices `0, 1, 2, 3, 4, 5, 6, 7, 8` and assign the durations from section 3 in that order.
3. Draw the selected cell as the first layer of the welcome screen. Draw the title, controls, and menu text over it in the same screen coordinate system.

The PNG stores all nine cells in a single raster. Its `Animation` text field supplies this playback data for importers that read PNG text. Importers with manual animation setup can use the same values directly.

```json
{
  "name": "welcome_screen",
  "frameWidth": 1000,
  "frameHeight": 600,
  "columns": 3,
  "rows": 3,
  "order": "row-major",
  "loop": true,
  "frameDurationsMs": [177, 145, 159, 212, 220, 126, 128, 106, 113]
}
```

### JavaScript Canvas example

Call `drawWelcomeBackground` from the menu’s render loop. Pass the loaded PNG and the elapsed milliseconds since the welcome screen opened. The example draws into a 1000 × 600 logical viewport. Sampling elapsed time keeps the animation on pace when a display update arrives late.

```javascript
const welcomeFrameDurations = [177, 145, 159, 212, 220, 126, 128, 106, 113];
const welcomeLoopMs = welcomeFrameDurations.reduce((sum, ms) => sum + ms, 0);

function welcomeFrameAt(elapsedMs) {
  let time = Math.max(0, elapsedMs) % welcomeLoopMs;
  for (let i = 0; i < welcomeFrameDurations.length; i++) {
    if (time < welcomeFrameDurations[i]) return i;
    time -= welcomeFrameDurations[i];
  }
  return 0;
}

function drawWelcomeBackground(ctx, atlas, elapsedMs) {
  const i = welcomeFrameAt(elapsedMs);
  const sourceX = (i % 3) * 1000;
  const sourceY = Math.floor(i / 3) * 600;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(atlas, sourceX, sourceY, 1000, 600, 0, 0, 1000, 600);
  ctx.restore();
}
```

## 5. Menu placement and rendering notes

A suggested layout rectangle for the game’s title and controls is **`(100, 100, 800, 400)`** in each 1000 × 600 frame. It covers **x = 100–899** and **y = 100–499**, with its center at **(500, 300)**. Every RGB pixel in this rectangle is identical across all nine frames. The slight stone texture and cracks therefore stay in place when lettering is drawn over them. These coordinates are a layout suggestion measured from the finished artwork. The game chooses the size and position of each control.

Keep the artwork and menu aligned when fitting a different display. To show the entire masonry border in a viewport of size `W × H`, use `scale = min(W / 1000, H / 600)` and center the scaled frame. Apply that same scale and offset to menu elements placed in frame-local coordinates. The game can draw F1 as a static background when a still screen is preferred.

## 6. Exact rectangle appendix

Each entry is the full source rectangle to pass to the renderer. All nine destination rectangles share the same origin and dimensions.

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
